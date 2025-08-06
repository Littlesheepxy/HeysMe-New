/**
 * Vercel 部署 API 路由
 * 在服务器端处理 Vercel 部署，避免在客户端暴露 Token
 */

import { NextRequest, NextResponse } from 'next/server';
import { VercelPreviewService, createVercelService } from '@/lib/services/vercel-preview-service';
import { getVercelConfig } from '@/lib/config/vercel-config';
import { CodeFile } from '@/lib/agents/coding/types';

export async function POST(request: NextRequest) {
  try {
    // 1. 解析请求数据
    const body = await request.json();
    const { 
      projectName, 
      files, 
      target = 'preview',
      gitMetadata,
      projectSettings,
      meta 
    }: {
      projectName: string;
      files: CodeFile[];
      target?: 'production' | 'preview';
      gitMetadata?: any;
      projectSettings?: any;
      meta?: any;
    } = body;

    // 2. 验证必需参数
    if (!projectName || !files || !Array.isArray(files)) {
      return NextResponse.json(
        { error: 'Missing required parameters: projectName and files' },
        { status: 400 }
      );
    }

    // 3. 获取服务器端配置
    const config = getVercelConfig();
    
    if (!config.enabled) {
      return NextResponse.json(
        { 
          error: 'Vercel deployment not enabled', 
          details: 'Please set ENABLE_VERCEL_PREVIEW=true in environment variables' 
        },
        { status: 503 }
      );
    }

    if (!config.bearerToken) {
      return NextResponse.json(
        { 
          error: 'Vercel token not configured', 
          details: 'Please set VERCEL_TOKEN in environment variables' 
        },
        { status: 503 }
      );
    }

    // 4. 创建 Vercel 服务
    const vercelService = createVercelService(config);

    // 5. 开始部署
    console.log(`🚀 开始部署项目: ${projectName}`);
    
    const deployment = await vercelService.deployProject({
      projectName,
      files,
      target,
      gitMetadata: gitMetadata || {
        remoteUrl: "https://github.com/heysme/api-deployment",
        commitMessage: `Deploy ${projectName} via API`,
        commitRef: 'main',
        commitAuthorName: 'HeysMe API',
        commitAuthorEmail: 'api@heysme.com',
        dirty: false,
      },
      projectSettings: projectSettings || {
        buildCommand: 'npm run build',
        installCommand: 'npm install',
      },
      meta: {
        source: 'heysme-api',
        timestamp: Date.now().toString(),
        ...meta,
      }
    });

    // 6. 返回成功结果
    return NextResponse.json({
      success: true,
      deployment: {
        id: deployment.id,
        url: deployment.deploymentUrl,
        state: deployment.state,
        createdAt: deployment.createdAt,
        readyAt: deployment.readyAt,
      }
    });

  } catch (error) {
    console.error('❌ Vercel 部署失败:', error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // 根据错误类型返回不同的状态码
    if (errorMessage.includes('403') || errorMessage.includes('forbidden')) {
      return NextResponse.json(
        { 
          error: 'Authentication failed', 
          details: 'Invalid or expired Vercel token' 
        },
        { status: 403 }
      );
    }
    
    if (errorMessage.includes('400') || errorMessage.includes('bad request')) {
      return NextResponse.json(
        { 
          error: 'Invalid deployment configuration', 
          details: errorMessage 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Deployment failed', 
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}

/**
 * GET: 获取部署状态
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deploymentId = searchParams.get('id');
    
    if (!deploymentId) {
      return NextResponse.json(
        { error: 'Missing deployment ID' },
        { status: 400 }
      );
    }

    const config = getVercelConfig();
    
    if (!config.enabled || !config.bearerToken) {
      return NextResponse.json(
        { error: 'Vercel not configured' },
        { status: 503 }
      );
    }

    const vercelService = createVercelService(config);
    
    // 这里需要添加获取部署状态的方法
    // 暂时返回基本信息
    return NextResponse.json({
      success: true,
      status: 'This endpoint will be implemented to check deployment status'
    });

  } catch (error) {
    console.error('❌ 获取部署状态失败:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get deployment status', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}