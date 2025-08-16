/**
 * 自动检测并安装依赖 API
 * 自动检测代码中的依赖并安装
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { userSandboxes } from '../create/route';
import { sandboxLogs } from '../logs/route';

export type FileMap = Record<string, string>;

interface DetectDependenciesRequest {
  files: FileMap;
  skipInstall?: boolean;
  packageManager?: 'npm' | 'yarn' | 'pnpm';
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: DetectDependenciesRequest = await request.json();
    const { 
      files, 
      skipInstall = false, 
      packageManager = 'npm' 
    } = body;

    if (!files || Object.keys(files).length === 0) {
      return NextResponse.json({
        success: false,
        error: 'NO_FILES',
        message: '没有提供要分析的文件'
      }, { status: 400 });
    }

    console.log('🔍 [Detect Deps] 开始依赖检测，文件数量:', Object.keys(files).length);

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

    // 1. 检测依赖
    const detectionResult = await detectDependencies(files);
    
    // 添加日志
    addLog(currentSandbox.id, 'info', 'system', 
      `检测到 ${detectionResult.dependencies.length} 个生产依赖和 ${detectionResult.devDependencies.length} 个开发依赖`);

    let installResult = null;

    // 2. 如果不跳过安装，则执行安装
    if (!skipInstall && (detectionResult.dependencies.length > 0 || detectionResult.devDependencies.length > 0)) {
      console.log('📦 [Detect Deps] 开始安装检测到的依赖...');
      
      try {
        installResult = await installDetectedDependencies(
          sandboxService, 
          detectionResult, 
          packageManager
        );
        
        addLog(currentSandbox.id, 'info', 'system', 
          `依赖安装完成: ${installResult.installedPackages.length} 个包`);
          
      } catch (installError) {
        console.error('❌ [Detect Deps] 依赖安装失败:', installError);
        
        addLog(currentSandbox.id, 'error', 'system', 
          `依赖安装失败: ${installError instanceof Error ? installError.message : '未知错误'}`);
          
        installResult = {
          success: false,
          error: installError instanceof Error ? installError.message : '未知错误',
          installedPackages: [],
          failedPackages: [...detectionResult.dependencies, ...detectionResult.devDependencies]
        };
      }
    }

    return NextResponse.json({
      success: true,
      message: skipInstall ? '依赖检测完成' : '依赖检测和安装完成',
      detection: detectionResult,
      installation: installResult,
      packageManager,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [Detect Deps] 依赖检测失败:', error);

    return NextResponse.json({
      success: false,
      error: 'DEPENDENCY_DETECTION_FAILED',
      message: '依赖检测失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

/**
 * 检测文件中的依赖
 */
async function detectDependencies(files: FileMap) {
  const dependencies = new Set<string>();
  const devDependencies = new Set<string>();
  const importSources = new Set<string>();

  // 检测规则
  const importPatterns = [
    // ES6 imports
    /import\s+.*?\s+from\s+['"`]([^'"`\s]+)['"`]/g,
    // CommonJS require
    /require\s*\(\s*['"`]([^'"`\s]+)['"`]\s*\)/g,
    // Dynamic imports
    /import\s*\(\s*['"`]([^'"`\s]+)['"`]\s*\)/g
  ];

  // 遍历所有文件
  for (const [fileName, content] of Object.entries(files)) {
    // 只分析 JS/TS 文件
    if (!fileName.match(/\.(js|jsx|ts|tsx|mjs|cjs)$/)) {
      continue;
    }

    console.log(`🔍 [Detect Deps] 分析文件: ${fileName}`);

    // 应用所有检测模式
    for (const pattern of importPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const importPath = match[1];
        
        // 跳过相对路径和内置模块
        if (importPath.startsWith('.') || importPath.startsWith('/') || importPath.startsWith('node:')) {
          continue;
        }

        importSources.add(importPath);
      }
    }
  }

  // 分类依赖
  const knownDevDependencies = [
    '@types/', 'eslint', 'prettier', 'jest', 'vitest', 'cypress', 'playwright',
    'webpack', 'rollup', 'vite', 'babel', 'typescript', 'ts-node',
    '@testing-library/', 'storybook', '@storybook/', 'husky', 'lint-staged'
  ];

  for (const importPath of importSources) {
    // 获取包名（处理 scoped packages）
    const packageName = importPath.startsWith('@') 
      ? importPath.split('/').slice(0, 2).join('/')
      : importPath.split('/')[0];

    // 判断是开发依赖还是生产依赖
    const isDevDep = knownDevDependencies.some(pattern => 
      packageName.includes(pattern) || importPath.startsWith(pattern)
    );

    if (isDevDep) {
      devDependencies.add(packageName);
    } else {
      dependencies.add(packageName);
    }
  }

  const result = {
    dependencies: Array.from(dependencies),
    devDependencies: Array.from(devDependencies),
    totalImports: importSources.size,
    analysis: {
      filesAnalyzed: Object.keys(files).filter(f => f.match(/\.(js|jsx|ts|tsx|mjs|cjs)$/)).length,
      totalFiles: Object.keys(files).length,
      uniqueImports: importSources.size
    }
  };

  console.log('📊 [Detect Deps] 检测结果:', {
    生产依赖: result.dependencies.length,
    开发依赖: result.devDependencies.length,
    总导入: result.totalImports
  });

  return result;
}

/**
 * 安装检测到的依赖
 */
async function installDetectedDependencies(
  sandboxService: any, 
  detectionResult: any, 
  packageManager: 'npm' | 'yarn' | 'pnpm'
) {
  const sandbox = (sandboxService as any).sandbox;
  if (!sandbox) {
    throw new Error('沙盒实例不可用');
  }

  const installedPackages: string[] = [];
  const failedPackages: string[] = [];

  // 安装生产依赖
  if (detectionResult.dependencies.length > 0) {
    console.log('📦 [Install] 安装生产依赖:', detectionResult.dependencies);
    
    try {
      const installCmd = getInstallCommand(packageManager, detectionResult.dependencies, false);
      const result = await sandbox.commands.run(`cd /home/user && ${installCmd}`, {
        timeoutMs: 120000 // 2分钟超时
      });

      if (result.exitCode === 0) {
        installedPackages.push(...detectionResult.dependencies);
      } else {
        console.warn('⚠️ [Install] 生产依赖安装警告:', result.stderr);
        failedPackages.push(...detectionResult.dependencies);
      }
    } catch (error) {
      console.error('❌ [Install] 生产依赖安装失败:', error);
      failedPackages.push(...detectionResult.dependencies);
    }
  }

  // 安装开发依赖
  if (detectionResult.devDependencies.length > 0) {
    console.log('🔧 [Install] 安装开发依赖:', detectionResult.devDependencies);
    
    try {
      const installCmd = getInstallCommand(packageManager, detectionResult.devDependencies, true);
      const result = await sandbox.commands.run(`cd /home/user && ${installCmd}`, {
        timeoutMs: 120000
      });

      if (result.exitCode === 0) {
        installedPackages.push(...detectionResult.devDependencies);
      } else {
        console.warn('⚠️ [Install] 开发依赖安装警告:', result.stderr);
        failedPackages.push(...detectionResult.devDependencies);
      }
    } catch (error) {
      console.error('❌ [Install] 开发依赖安装失败:', error);
      failedPackages.push(...detectionResult.devDependencies);
    }
  }

  return {
    success: failedPackages.length === 0,
    installedPackages,
    failedPackages,
    packageManager
  };
}

/**
 * 生成安装命令
 */
function getInstallCommand(packageManager: string, packages: string[], isDev: boolean): string {
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

/**
 * 添加日志
 */
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

  // 限制日志数量
  if (logs.length > 1000) {
    logs.splice(0, logs.length - 1000);
  }
}
