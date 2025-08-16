/**
 * E2B 依赖安装 API
 * 手动安装指定的 npm 包到 E2B 沙盒中
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { userSandboxes } from '../create/route';

interface InstallDepsRequest {
  packages: string[];
  saveType?: 'dependencies' | 'devDependencies';
  force?: boolean;
}

interface PackageInfo {
  name: string;
  version?: string;
  installed: boolean;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    // 验证用户认证
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 解析请求体
    const body: InstallDepsRequest = await request.json();
    const { 
      packages = [], 
      saveType = 'dependencies',
      force = false 
    } = body;

    if (!packages || packages.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'NO_PACKAGES',
        message: '没有提供要安装的包'
      }, { status: 400 });
    }

    // 验证包名格式
    const validPackages = packages.filter(pkg => {
      if (typeof pkg !== 'string' || pkg.trim().length === 0) {
        return false;
      }
      // 基础的包名验证（允许 @scope/package 和 package@version 格式）
      return /^(@[a-z0-9-]+\/)?[a-z0-9-]+(@[a-z0-9.-]+)?$/.test(pkg.trim());
    });

    if (validPackages.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'INVALID_PACKAGES',
        message: '没有有效的包名',
        providedPackages: packages
      }, { status: 400 });
    }

    console.log('📦 [E2B Install] 开始安装依赖，用户ID:', userId);
    console.log('📋 [E2B Install] 要安装的包:', validPackages.join(', '));
    console.log('🏷️ [E2B Install] 保存类型:', saveType);

    // 获取用户的沙盒服务
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
        message: '沙盒未激活，请重新创建沙盒'
      }, { status: 400 });
    }

    // 收集安装日志
    const installLogs: string[] = [];
    const logListener = (log: string) => {
      installLogs.push(log);
      console.log(`[E2B Install Log] ${log}`);
    };

    sandboxService.addLogListener(logListener);

    try {
      // 首先检查哪些包已经安装
      const packageStatus = await checkInstalledPackages(sandboxService, validPackages);
      
      // 过滤出需要安装的包
      const packagesToInstall = force 
        ? validPackages 
        : packageStatus.filter(pkg => !pkg.installed).map(pkg => pkg.name);

      if (packagesToInstall.length === 0) {
        console.log('✅ [E2B Install] 所有包都已安装');
        return NextResponse.json({
          success: true,
          message: '所有包都已安装',
          packagesStatus: packageStatus,
          logs: installLogs,
          skipped: true
        });
      }

      console.log('🔧 [E2B Install] 需要安装的包:', packagesToInstall.join(', '));

      // 执行安装
      const installResult = await installPackages(
        sandboxService, 
        packagesToInstall, 
        saveType, 
        logListener
      );

      if (!installResult.success) {
        return NextResponse.json({
          success: false,
          error: 'INSTALL_FAILED',
          message: '依赖安装失败',
          details: installResult.error,
          packagesStatus: packageStatus,
          logs: installLogs
        }, { status: 500 });
      }

      // 重新检查安装状态
      const finalStatus = await checkInstalledPackages(sandboxService, validPackages);

      console.log('✅ [E2B Install] 依赖安装完成');

      return NextResponse.json({
        success: true,
        message: '依赖安装成功',
        packagesInstalled: packagesToInstall,
        packagesStatus: finalStatus,
        installResult: installResult,
        logs: installLogs,
        timestamp: new Date().toISOString()
      });

    } catch (installError) {
      console.error('❌ [E2B Install] 安装过程中发生错误:', installError);
      
      return NextResponse.json({
        success: false,
        error: 'INSTALL_ERROR',
        message: '安装过程中发生错误',
        details: installError instanceof Error ? installError.message : '未知错误',
        logs: installLogs
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ [E2B Install] 依赖安装 API 请求处理失败:', error);

    return NextResponse.json({
      success: false,
      error: 'REQUEST_FAILED',
      message: '依赖安装请求处理失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

/**
 * 检查包的安装状态
 */
async function checkInstalledPackages(
  sandboxService: any, 
  packages: string[]
): Promise<PackageInfo[]> {
  const packageStatus: PackageInfo[] = [];

  for (const pkg of packages) {
    try {
      // 获取包名（移除版本号）
      const packageName = pkg.split('@')[0].startsWith('@') 
        ? pkg.split('@').slice(0, 2).join('@')  // 处理 scoped packages
        : pkg.split('@')[0];

      // 检查包是否存在于 node_modules
      const checkResult = await sandboxService.sandbox?.runCode(`
cd /home/user
if [ -d "node_modules/${packageName}" ]; then
  echo "installed:${packageName}"
else
  echo "missing:${packageName}"
fi
      `);

      const isInstalled = checkResult?.includes(`installed:${packageName}`);

      packageStatus.push({
        name: pkg,
        installed: isInstalled || false
      });

    } catch (error) {
      packageStatus.push({
        name: pkg,
        installed: false,
        error: error instanceof Error ? error.message : '检查失败'
      });
    }
  }

  return packageStatus;
}

/**
 * 安装包
 */
async function installPackages(
  sandboxService: any,
  packages: string[],
  saveType: 'dependencies' | 'devDependencies',
  logListener: (log: string) => void
): Promise<{ success: boolean; error?: string }> {
  try {
    const saveFlag = saveType === 'devDependencies' ? '--save-dev' : '--save';
    const packageList = packages.join(' ');

    logListener(`开始安装包: ${packageList}`);
    logListener(`安装类型: ${saveType}`);

    // 执行 npm install
    const installCommand = `cd /home/user && npm install ${packageList} ${saveFlag} --silent --no-audit --no-fund`;
    
    logListener(`执行命令: ${installCommand}`);

    const result = await sandboxService.sandbox?.runCode(installCommand);
    
    logListener('安装完成');

    if (result && result.includes('ERROR') || result?.includes('WARN')) {
      logListener(`安装警告或错误: ${result}`);
    }

    return { success: true };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    logListener(`安装失败: ${errorMessage}`);
    return { 
      success: false, 
      error: errorMessage 
    };
  }
}

/**
 * 获取已安装的包列表
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sandboxService = userSandboxes.get(userId);
    
    if (!sandboxService || !sandboxService.getCurrentSandbox()) {
      return NextResponse.json({
        success: false,
        message: '没有活跃的沙盒',
        packages: []
      });
    }

    try {
      // 读取 package.json 获取依赖信息
      const packageJsonResult = await sandboxService.sandbox?.runCode(`
cd /home/user
if [ -f "package.json" ]; then
  cat package.json
else
  echo "{}"
fi
      `);

      let packageInfo = {};
      try {
        packageInfo = JSON.parse(packageJsonResult || '{}');
      } catch (parseError) {
        console.warn('解析 package.json 失败');
      }

      return NextResponse.json({
        success: true,
        message: '获取依赖列表成功',
        packageInfo: packageInfo,
        dependencies: (packageInfo as any).dependencies || {},
        devDependencies: (packageInfo as any).devDependencies || {}
      });

    } catch (error) {
      return NextResponse.json({
        success: false,
        error: 'PACKAGE_LIST_FAILED',
        message: '获取依赖列表失败',
        details: error instanceof Error ? error.message : '未知错误'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ [E2B Install] 获取依赖列表失败:', error);

    return NextResponse.json({
      success: false,
      error: 'REQUEST_FAILED',
      message: '获取依赖列表失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
