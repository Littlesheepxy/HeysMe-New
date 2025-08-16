/**
 * E2B 代码部署 API
 * 将用户生成的 Next.js 代码部署到 E2B 沙盒中
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { userSandboxes } from '../create/route';

export type FileMap = Record<string, string>;

interface DeployRequest {
  files: FileMap;
  projectName?: string;
  description?: string;
  autoInstallDeps?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    // 验证用户认证
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 解析请求体
    const body: DeployRequest = await request.json();
    const { 
      files, 
      projectName = '未命名项目', 
      description = '',
      autoInstallDeps = true 
    } = body;

    if (!files || Object.keys(files).length === 0) {
      return NextResponse.json({
        success: false,
        error: 'NO_FILES',
        message: '没有提供要部署的文件'
      }, { status: 400 });
    }

    console.log('🚀 [E2B Deploy] 开始部署代码，用户ID:', userId);
    console.log('📂 [E2B Deploy] 文件数量:', Object.keys(files).length);
    console.log('📄 [E2B Deploy] 文件列表:', Object.keys(files).join(', '));

    // 获取用户的沙盒服务
    const sandboxService = userSandboxes.get(userId);
    
    if (!sandboxService) {
      return NextResponse.json({
        success: false,
        error: 'NO_SANDBOX',
        message: '沙盒不存在，请先创建沙盒',
        suggestion: '请先调用 POST /api/e2b-sandbox/create 创建沙盒'
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

    // 收集部署日志
    const deployLogs: string[] = [];
    const originalLogListener = (log: string) => {
      deployLogs.push(log);
      console.log(`[E2B Deploy Log] ${log}`);
    };

    // 添加临时日志监听器
    sandboxService.addLogListener(originalLogListener);

    try {
      // 预处理文件（确保路径正确）
      const processedFiles = preprocessFiles(files);
      
      console.log('📝 [E2B Deploy] 开始部署处理后的文件...');

      // 部署代码
      const deployResult = await sandboxService.deployCode(processedFiles);

      if (!deployResult.success) {
        return NextResponse.json({
          success: false,
          error: 'DEPLOY_FAILED',
          message: deployResult.message,
          sandboxId: deployResult.sandboxId,
          logs: deployLogs
        }, { status: 500 });
      }

      console.log('✅ [E2B Deploy] 代码部署成功');

      return NextResponse.json({
        success: true,
        message: '代码部署成功！',
        deployResult: {
          sandboxId: deployResult.sandboxId,
          url: deployResult.url,
          status: deployResult.status,
          message: deployResult.message
        },
        sandboxInfo: currentSandbox,
        previewUrl: sandboxService.getPreviewUrl(),
        projectInfo: {
          name: projectName,
          description: description,
          fileCount: Object.keys(processedFiles).length,
          files: Object.keys(processedFiles)
        },
        logs: deployLogs,
        timestamp: new Date().toISOString()
      });

    } catch (deployError) {
      console.error('❌ [E2B Deploy] 部署过程中发生错误:', deployError);
      
      return NextResponse.json({
        success: false,
        error: 'DEPLOY_ERROR',
        message: '部署过程中发生错误',
        details: deployError instanceof Error ? deployError.message : '未知错误',
        logs: deployLogs,
        sandboxId: currentSandbox.id
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ [E2B Deploy] 部署 API 请求处理失败:', error);

    return NextResponse.json({
      success: false,
      error: 'REQUEST_FAILED',
      message: '部署请求处理失败',
      details: error instanceof Error ? error.message : '未知错误',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * 预处理文件，确保路径和内容格式正确
 */
function preprocessFiles(files: FileMap): FileMap {
  const processedFiles: FileMap = {};

  for (const [originalPath, content] of Object.entries(files)) {
    // 规范化文件路径
    let normalizedPath = originalPath;
    
    // 移除开头的 ./
    if (normalizedPath.startsWith('./')) {
      normalizedPath = normalizedPath.substring(2);
    }
    
    // 移除开头的 /
    if (normalizedPath.startsWith('/')) {
      normalizedPath = normalizedPath.substring(1);
    }

    // 确保 app 目录下的文件路径正确
    if (!normalizedPath.startsWith('app/') && 
        !normalizedPath.startsWith('lib/') && 
        !normalizedPath.startsWith('components/') &&
        !normalizedPath.startsWith('public/') &&
        !normalizedPath.includes('.json') &&
        !normalizedPath.includes('.js') &&
        !normalizedPath.includes('.css') &&
        !normalizedPath.includes('.md') &&
        normalizedPath.includes('/')) {
      // 可能是组件文件，放到 app/components/ 下
      if (normalizedPath.endsWith('.tsx') || normalizedPath.endsWith('.ts')) {
        normalizedPath = `app/components/${normalizedPath}`;
      }
    }

    // 验证和清理文件内容
    let processedContent = content;
    
    try {
      // 如果是 JSON 文件，验证格式
      if (normalizedPath.endsWith('.json')) {
        JSON.parse(processedContent);
      }
      
      // 移除文件内容中的无效字符
      processedContent = processedContent.replace(/\r\n/g, '\n');
      
    } catch (jsonError) {
      console.warn(`⚠️ [File Processing] JSON 文件格式可能有问题: ${normalizedPath}`);
    }

    processedFiles[normalizedPath] = processedContent;
  }

  return processedFiles;
}

/**
 * 获取部署状态
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sandboxService = userSandboxes.get(userId);
    
    if (!sandboxService) {
      return NextResponse.json({
        success: false,
        message: '没有活跃的沙盒',
        isDeployed: false
      });
    }

    const currentSandbox = sandboxService.getCurrentSandbox();
    
    if (!currentSandbox) {
      return NextResponse.json({
        success: false,
        message: '沙盒未激活',
        isDeployed: false
      });
    }

    // 检查沙盒状态
    const statusResult = await sandboxService.getSandboxStatus();

    return NextResponse.json({
      success: true,
      message: '部署状态获取成功',
      isDeployed: statusResult.success,
      sandboxInfo: currentSandbox,
      previewUrl: sandboxService.getPreviewUrl(),
      status: currentSandbox.status,
      lastActivity: currentSandbox.lastActivity
    });

  } catch (error) {
    console.error('❌ [E2B Deploy Status] 状态查询失败:', error);

    return NextResponse.json({
      success: false,
      error: 'STATUS_CHECK_FAILED',
      message: '部署状态查询失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
