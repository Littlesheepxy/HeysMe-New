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
      target,
      gitMetadata,
      projectSettings,
      meta 
    }: {
      projectName: string;
      files: CodeFile[];
      target?: 'production' | 'staging' | string;
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
    
    // 🚨 检查是否为 Vercel 部署错误，提供详细信息
    if ((error as any)?.isVercelError) {
      const vercelError = error as any;
      
      // 🔍 使用增强的错误分析功能
      let troubleshootingTips: string[] = [];
      let detailedAnalysis: any = null;
      
      // 尝试获取详细的部署分析
      try {
        // 🔧 重新获取配置，因为config变量在这个作用域不可用
        const deployConfig = getVercelConfig();
        if (deployConfig.enabled && deployConfig.bearerToken) {
          const vercelService = createVercelService(deployConfig);
          if (vercelError.deploymentId) {
            console.log(`🔍 获取部署 ${vercelError.deploymentId} 的详细分析...`);
            detailedAnalysis = await vercelService.getDeploymentAnalysis(vercelError.deploymentId);
            troubleshootingTips = detailedAnalysis.suggestions || [];
          }
        }
      } catch (analysisError) {
        console.error('⚠️ 获取详细分析失败:', analysisError);
      }
      
      // 如果没有详细分析，使用原有的基本分析
      if (troubleshootingTips.length === 0) {
        const errorDetails = vercelError.errorDetails || '';
        
        if (errorDetails.toLowerCase().includes('build failed') || errorDetails.toLowerCase().includes('build error')) {
          troubleshootingTips.push('构建失败：检查package.json中的build脚本是否正确');
          troubleshootingTips.push('确保所有依赖项都已正确安装');
          troubleshootingTips.push('检查代码中是否有TypeScript错误或语法错误');
        }
        
        if (errorDetails.toLowerCase().includes('timeout')) {
          troubleshootingTips.push('构建超时：尝试优化构建脚本或减少文件大小');
        }
        
        if (errorDetails.toLowerCase().includes('memory') || errorDetails.toLowerCase().includes('out of memory')) {
          troubleshootingTips.push('内存不足：考虑优化代码或升级Vercel计划');
        }
        
        if (!errorDetails || errorDetails.trim() === '') {
          troubleshootingTips.push('无详细错误信息，建议检查Vercel控制台获取更多信息');
          troubleshootingTips.push('检查项目配置和环境变量是否正确');
        }
      }
      
      return NextResponse.json(
        {
          success: false,
          error: 'Vercel deployment failed',
          details: errorMessage,
          troubleshooting: troubleshootingTips,
          errorInfo: {
            deploymentId: vercelError.deploymentId,
            deploymentState: vercelError.deploymentState,
            errorDetails: vercelError.errorDetails,
            deploymentUrl: vercelError.deploymentUrl,
            timestamp: new Date().toISOString(),
            vercelDashboardUrl: `https://vercel.com/dashboard/deployments/${vercelError.deploymentId}`,
            // 🆕 增强的调试信息
            debugUrls: {
              detailedAnalysis: `/api/vercel-deploy/debug?deploymentId=${vercelError.deploymentId}`,
              onlineLogs: vercelError.deploymentUrl ? `${vercelError.deploymentUrl}/_logs` : null,
              cliCommand: `vc logs ${vercelError.deploymentId}`
            }
          },
          // 🆕 包含详细分析结果（如果可用）
          ...(detailedAnalysis && {
            analysis: {
              errorSummary: detailedAnalysis.errorSummary,
              buildLogsCount: detailedAnalysis.buildLogs?.length || 0,
              errorEventsCount: detailedAnalysis.events?.filter((e: any) => e.type === 'error').length || 0,
              warningEventsCount: detailedAnalysis.events?.filter((e: any) => e.type === 'warning').length || 0,
              hasDetailedLogs: true
            }
          })
        },
        { status: 422 } // 部署失败用422状态码
      );
    }
    
    // 根据错误类型返回不同的状态码
    if (errorMessage.includes('403') || errorMessage.includes('forbidden')) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Authentication failed', 
          details: 'Invalid or expired Vercel token' 
        },
        { status: 403 }
      );
    }
    
    if (errorMessage.includes('400') || errorMessage.includes('bad request')) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid deployment configuration', 
          details: errorMessage 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false,
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