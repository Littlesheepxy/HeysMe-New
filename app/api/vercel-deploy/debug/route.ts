/**
 * Vercel 部署调试 API 路由
 * 用于获取部署详细信息和诊断问题
 */

import { NextRequest, NextResponse } from 'next/server';
import { createVercelService } from '@/lib/services/vercel-preview-service';
import { getVercelConfig } from '@/lib/config/vercel-config';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deploymentId = searchParams.get('deploymentId');
    
    if (!deploymentId) {
      return NextResponse.json(
        { error: 'Missing deploymentId parameter' },
        { status: 400 }
      );
    }

    // 获取配置
    const config = getVercelConfig();
    
    if (!config.enabled || !config.bearerToken) {
      return NextResponse.json(
        { error: 'Vercel not configured' },
        { status: 503 }
      );
    }

    const vercelService = createVercelService(config);
    
    // 获取部署详细信息
    console.log(`🔍 获取部署 ${deploymentId} 的详细信息...`);
    
    try {
      // 🆕 使用增强的部署分析功能
      console.log(`🔍 使用增强分析功能获取 ${deploymentId} 的详细信息...`);
      
      const analysis = await vercelService.getDeploymentAnalysis(deploymentId);
      
      // 获取基本状态信息
      const status = await vercelService.getDeploymentStatus(deploymentId);
      
      // 生成增强的诊断信息
      const diagnostics = {
        deploymentId,
        currentStatus: status,
        errorCount: analysis.events.filter(e => e.type === 'error').length,
        warningCount: analysis.events.filter(e => e.type === 'warning').length,
        totalEvents: analysis.events.length,
        hasErrors: analysis.errorSummary !== '未发现明确的错误信息',
        hasWarnings: analysis.events.some(e => e.type === 'warning'),
        buildLogsCount: analysis.buildLogs.length,
        configCheck: {
          hasToken: !!config.bearerToken,
          tokenLength: config.bearerToken?.length || 0,
          hasTeamId: !!config.teamId,
          hasTeamSlug: !!config.teamSlug,
        },
        lastAnalysisTime: new Date().toISOString()
      };
      
      return NextResponse.json({
        success: true,
        deployment: analysis.deployment,
        diagnostics,
        analysis: {
          errorSummary: analysis.errorSummary,
          suggestions: analysis.suggestions,
          buildLogs: analysis.buildLogs,
          totalEvents: analysis.events.length
        },
        errorEvents: analysis.events
          .filter(event => event.type === 'error')
          .map(event => ({
            type: event.type,
            timestamp: event.created_at,
            text: event.payload?.text,
            details: event.payload
          })),
        warningEvents: analysis.events
          .filter(event => event.type === 'warning')
          .map(event => ({
            type: event.type,
            timestamp: event.created_at,
            text: event.payload?.text,
            details: event.payload
          })),
        buildEvents: analysis.events
          .filter(event => ['stdout', 'stderr', 'building'].includes(event.type))
          .slice(-30) // 最近30条构建事件
          .map(event => ({
            type: event.type,
            timestamp: event.created_at,
            text: event.payload?.text
          })),
        recommendations: analysis.suggestions,
        // 🆕 提供直接访问日志的链接
        logUrls: {
          vercelDashboard: `https://vercel.com/dashboard/deployments/${deploymentId}`,
          onlineLogs: status.deploymentUrl ? `${status.deploymentUrl}/_logs` : null,
          cliCommand: `vc logs ${deploymentId}`
        }
      });
      
    } catch (apiError) {
      console.error('❌ Vercel API 调用失败:', apiError);
      
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch deployment details',
        details: apiError instanceof Error ? apiError.message : String(apiError),
        suggestions: [
          '检查 VERCEL_TOKEN 是否有效',
          '确认部署ID是否正确',
          '检查Vercel API是否正常工作',
          '验证团队权限设置'
        ]
      });
    }

  } catch (error) {
    console.error('❌ 调试端点错误:', error);
    
    return NextResponse.json(
      { 
        error: 'Debug endpoint failed', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}

/**
 * 生成调试建议
 */
function generateRecommendations(status: any, errorEvents: any[], diagnostics: any): string[] {
  const recommendations: string[] = [];
  
  // 基于部署状态的建议
  if (status?.state === 'ERROR') {
    recommendations.push('🔍 部署状态为ERROR，检查构建日志查找具体错误');
    
    if (errorEvents.length === 0) {
      recommendations.push('📋 未找到具体错误事件，建议检查Vercel控制台');
    }
  }
  
  if (status?.state === 'BUILDING') {
    recommendations.push('⏳ 部署正在构建中，请耐心等待');
  }
  
  if (status?.state === 'QUEUED') {
    recommendations.push('📋 部署在队列中等待，这通常是正常现象');
  }
  
  // 基于错误事件的建议
  errorEvents.forEach(event => {
    const text = event.payload?.text?.toLowerCase() || '';
    
    if (text.includes('npm install') || text.includes('yarn install')) {
      recommendations.push('📦 依赖安装失败，检查package.json和网络连接');
    }
    
    if (text.includes('typescript') || text.includes('type error')) {
      recommendations.push('🔧 TypeScript类型错误，检查代码中的类型定义');
    }
    
    if (text.includes('module not found') || text.includes('cannot find module')) {
      recommendations.push('📁 模块未找到，检查导入路径和依赖安装');
    }
    
    if (text.includes('memory') || text.includes('heap')) {
      recommendations.push('💾 内存不足，考虑优化代码或升级Vercel计划');
    }
  });
  
  // 配置相关建议
  if (!diagnostics.configCheck.hasTeamId && !diagnostics.configCheck.hasTeamSlug) {
    recommendations.push('⚙️ 建议配置VERCEL_TEAM_ID或VERCEL_TEAM_SLUG以提高API调用成功率');
  }
  
  if (diagnostics.configCheck.tokenLength < 40) {
    recommendations.push('🔑 Vercel Token长度异常，请检查Token是否完整');
  }
  
  // 如果没有特定建议，提供通用建议
  if (recommendations.length === 0) {
    recommendations.push('🔄 尝试重新部署');
    recommendations.push('📖 查看Vercel官方文档获取更多帮助');
    recommendations.push('💬 联系技术支持团队');
  }
  
  return recommendations;
}
