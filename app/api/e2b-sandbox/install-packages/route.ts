/**
 * 手动安装包 API
 * 手动安装指定的 npm 包
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { userSandboxes } from '../create/route';
import { sandboxLogs } from '../logs/route';

interface InstallPackagesRequest {
  packages: string[];
  packageManager?: 'npm' | 'yarn' | 'pnpm';
  isDev?: boolean;
  force?: boolean;
  version?: Record<string, string>; // 特定版本 {"react": "18.2.0"}
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: InstallPackagesRequest = await request.json();
    const { 
      packages, 
      packageManager = 'npm', 
      isDev = false,
      force = false,
      version = {}
    } = body;

    // 验证输入
    if (!packages || !Array.isArray(packages) || packages.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'INVALID_PACKAGES',
        message: '必须提供包名数组'
      }, { status: 400 });
    }

    console.log('📦 [Install Packages] 手动安装包:', packages);

    const sandboxService = userSandboxes.get(userId);
    
    if (!sandboxService) {
      return NextResponse.json({
        success: false,
        error: 'NO_SANDBOX',
        message: '沙盒不存在，请先创建沙盒'
      }, { status: 400 });
    }

    const currentSandbox = sandboxService.getCurrentSandbox();
    if (!currentSandbox) {
      return NextResponse.json({
        success: false,
        error: 'SANDBOX_NOT_ACTIVE',
        message: '沙盒未激活'
      }, { status: 400 });
    }

    // 处理包名和版本
    const packageSpecs = packages.map(pkg => {
      if (version[pkg]) {
        return `${pkg}@${version[pkg]}`;
      }
      return pkg;
    });

    addLog(currentSandbox.id, 'info', 'system', 
      `开始安装包: ${packageSpecs.join(', ')} (${isDev ? '开发依赖' : '生产依赖'})`);

    // 检查已安装的包（如果不是强制模式）
    let alreadyInstalled: string[] = [];
    if (!force) {
      console.log('🔍 [Install Packages] 检查已安装的包...');
      alreadyInstalled = await checkInstalledPackages(sandboxService, packages);
      
      if (alreadyInstalled.length > 0) {
        addLog(currentSandbox.id, 'info', 'system', 
          `跳过已安装的包: ${alreadyInstalled.join(', ')}`);
      }
    }

    // 过滤出需要安装的包
    const toInstall = force ? packageSpecs : packageSpecs.filter(spec => {
      const pkgName = spec.split('@')[0];
      return !alreadyInstalled.includes(pkgName);
    });

    let installResult = {
      success: true,
      installedPackages: [] as string[],
      skippedPackages: alreadyInstalled,
      failedPackages: [] as string[],
      logs: [] as string[]
    };

    // 执行安装
    if (toInstall.length > 0) {
      console.log('⚡ [Install Packages] 执行安装:', toInstall);
      
      try {
        const installCmd = buildInstallCommand(packageManager, toInstall, isDev);
        const sandbox = (sandboxService as any).sandbox;
        
        addLog(currentSandbox.id, 'info', 'system', `执行命令: ${installCmd}`);
        
        const result = await sandbox.commands.run(`cd /home/user && ${installCmd}`, {
          timeoutMs: 180000, // 3分钟超时
          onStdout: (data: string) => {
            console.log(`[Install Log] ${data}`);
            installResult.logs.push(`[STDOUT] ${data}`);
          },
          onStderr: (data: string) => {
            console.log(`[Install Error] ${data}`);
            installResult.logs.push(`[STDERR] ${data}`);
          }
        });

        if (result.exitCode === 0) {
          installResult.installedPackages = toInstall;
          addLog(currentSandbox.id, 'info', 'system', 
            `包安装成功: ${toInstall.join(', ')}`);
        } else {
          installResult.success = false;
          installResult.failedPackages = toInstall;
          addLog(currentSandbox.id, 'error', 'system', 
            `包安装失败: ${result.stderr || result.stdout}`);
        }

      } catch (error) {
        console.error('❌ [Install Packages] 安装失败:', error);
        
        installResult.success = false;
        installResult.failedPackages = toInstall;
        
        addLog(currentSandbox.id, 'error', 'system', 
          `安装异常: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    } else {
      console.log('✅ [Install Packages] 所有包都已安装，跳过');
    }

    // 获取最终的包信息
    const packageInfo = await getPackageInfo(sandboxService, packages);

    return NextResponse.json({
      success: installResult.success,
      message: installResult.success ? '包安装完成' : '包安装失败',
      installation: {
        requested: packages,
        requestedSpecs: packageSpecs,
        installed: installResult.installedPackages,
        skipped: installResult.skippedPackages,
        failed: installResult.failedPackages,
        logs: installResult.logs.slice(-20) // 只返回最后20行日志
      },
      packageInfo,
      settings: {
        packageManager,
        isDev,
        force
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [Install Packages] 请求处理失败:', error);

    return NextResponse.json({
      success: false,
      error: 'INSTALL_REQUEST_FAILED',
      message: '安装请求处理失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

// 获取已安装的包列表
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const packageName = searchParams.get('package');

    const sandboxService = userSandboxes.get(userId);
    
    if (!sandboxService) {
      return NextResponse.json({
        success: false,
        error: 'NO_SANDBOX',
        message: '沙盒不存在'
      }, { status: 400 });
    }

    console.log('📋 [Install Packages] 查询包信息:', packageName || 'all');

    try {
      const sandbox = (sandboxService as any).sandbox;
      
      // 获取 package.json 内容
      const packageJsonResult = await sandbox.commands.run(
        'cd /home/user && cat package.json 2>/dev/null || echo "{}"', 
        { timeoutMs: 5000 }
      );
      
      let packageJson = {};
      try {
        packageJson = JSON.parse(packageJsonResult.stdout || '{}');
      } catch (e) {
        console.warn('⚠️ package.json 解析失败');
      }

      // 如果查询特定包
      if (packageName) {
        const versionResult = await sandbox.commands.run(
          `cd /home/user && npm list ${packageName} --depth=0 2>/dev/null || echo "not installed"`,
          { timeoutMs: 10000 }
        );
        
        return NextResponse.json({
          success: true,
          package: packageName,
          installed: !versionResult.stdout.includes('not installed'),
          version: extractVersionFromNpmList(versionResult.stdout, packageName),
          details: versionResult.stdout
        });
      }

      // 获取所有已安装的包
      const listResult = await sandbox.commands.run(
        'cd /home/user && npm list --depth=0 --json 2>/dev/null || echo "{}"',
        { timeoutMs: 15000 }
      );

      let installedPackages = {};
      try {
        const listData = JSON.parse(listResult.stdout || '{}');
        installedPackages = listData.dependencies || {};
      } catch (e) {
        console.warn('⚠️ npm list 解析失败');
      }

      return NextResponse.json({
        success: true,
        message: '包信息查询成功',
        packageJson: packageJson,
        installedPackages: installedPackages,
        totalPackages: Object.keys(installedPackages).length
      });

    } catch (error) {
      console.error('❌ [Install Packages] 查询失败:', error);
      
      return NextResponse.json({
        success: false,
        error: 'QUERY_FAILED',
        message: '包信息查询失败',
        details: error instanceof Error ? error.message : '未知错误'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ [Install Packages] GET 请求失败:', error);

    return NextResponse.json({
      success: false,
      error: 'GET_REQUEST_FAILED',
      message: 'GET 请求处理失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

// 辅助函数

async function checkInstalledPackages(sandboxService: any, packages: string[]): Promise<string[]> {
  const sandbox = (sandboxService as any).sandbox;
  const installed: string[] = [];

  for (const pkg of packages) {
    try {
      const result = await sandbox.commands.run(
        `cd /home/user && npm list ${pkg} --depth=0 2>/dev/null`,
        { timeoutMs: 5000 }
      );
      
      if (result.exitCode === 0 && !result.stdout.includes('empty')) {
        installed.push(pkg);
      }
    } catch (error) {
      // 包未安装，继续
    }
  }

  return installed;
}

function buildInstallCommand(packageManager: string, packages: string[], isDev: boolean): string {
  const packagesStr = packages.join(' ');
  
  switch (packageManager) {
    case 'yarn':
      return `yarn add ${isDev ? '--dev' : ''} ${packagesStr}`;
    case 'pnpm':
      return `pnpm add ${isDev ? '--save-dev' : ''} ${packagesStr}`;
    default:
      return `npm install ${isDev ? '--save-dev' : '--save'} ${packagesStr}`;
  }
}

async function getPackageInfo(sandboxService: any, packages: string[]) {
  const sandbox = (sandboxService as any).sandbox;
  const info: Record<string, any> = {};

  for (const pkg of packages) {
    try {
      const result = await sandbox.commands.run(
        `cd /home/user && npm list ${pkg} --depth=0 2>/dev/null || echo "not found"`,
        { timeoutMs: 5000 }
      );
      
      info[pkg] = {
        installed: !result.stdout.includes('not found'),
        version: extractVersionFromNpmList(result.stdout, pkg)
      };
    } catch (error) {
      info[pkg] = {
        installed: false,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  return info;
}

function extractVersionFromNpmList(output: string, packageName: string): string | null {
  const regex = new RegExp(`${packageName}@([\\d\\.\\-\\w]+)`);
  const match = output.match(regex);
  return match ? match[1] : null;
}

function addLog(sandboxId: string, level: string, source: string, message: string) {
  let logs = sandboxLogs.get(sandboxId);
  if (!logs) {
    logs = [];
    sandboxLogs.set(sandboxId, logs);
  }

  logs.push({
    timestamp: new Date(),
    level: level as any,
    source: source as any,
    message
  });

  if (logs.length > 1000) {
    logs.splice(0, logs.length - 1000);
  }
}
