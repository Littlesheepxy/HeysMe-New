/**
 * 测试所有AI模型提供商的连接状态
 */

import { NextRequest, NextResponse } from 'next/server';
import { testModelConnection } from '@/lib/ai-models';
import type { ModelProvider } from '@/types/models';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 开始测试所有AI模型连接...');

    // 定义要测试的模型
    const modelsToTest: Array<{provider: ModelProvider, modelId: string, name: string}> = [
      { provider: "openai", modelId: "gpt-4o", name: "GPT-4o" },
      { provider: "claude", modelId: "claude-sonnet-4-20250514", name: "Claude 4 Sonnet" },
      { provider: "bedrock", modelId: "anthropic.claude-sonnet-4-20250514-v1:0", name: "Claude 4 Sonnet (Bedrock)" },
      { provider: "zhipu", modelId: "glm-4.5", name: "glm-4.5" },
    ];

    const results = [];
    
    for (const model of modelsToTest) {
      console.log(`🔍 测试 ${model.name}...`);
      
      try {
        const result = await testModelConnection(model.provider, model.modelId);
        results.push({
          ...result,
          displayName: model.name
        });
        
        if (result.success) {
          console.log(`✅ ${model.name} 测试成功`);
        } else {
          console.log(`❌ ${model.name} 测试失败: ${result.error}`);
        }
      } catch (error) {
        console.error(`💥 ${model.name} 测试异常:`, error);
        results.push({
          success: false,
          provider: model.provider,
          modelId: model.modelId,
          displayName: model.name,
          error: error instanceof Error ? error.message : String(error),
          errorType: 'TestException',
          timestamp: new Date().toISOString()
        });
      }
    }

    // 统计结果
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    
    console.log(`📊 测试完成: ${successCount}/${totalCount} 个模型可用`);

    return NextResponse.json({
      success: true,
      summary: {
        total: totalCount,
        successful: successCount,
        failed: totalCount - successCount,
        successRate: `${Math.round((successCount / totalCount) * 100)}%`
      },
      results,
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasOpenAI: !!process.env.OPENAI_API_KEY,
        hasAnthropic: !!process.env.ANTHROPIC_API_KEY,
        hasAWS: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
        hasZhipu: !!process.env.ZHIPU_API_KEY,
      },
      recommendations: generateRecommendations(results)
    });

  } catch (error) {
    console.error('❌ 模型测试失败:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Model testing failed',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * POST 方法：测试特定模型
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider, modelId, testMessage = "Hello, please respond with 'Test successful'." } = body;

    if (!provider || !modelId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters',
        details: 'provider and modelId are required'
      }, { status: 400 });
    }

    console.log(`🧪 测试特定模型: ${provider} - ${modelId}`);
    
    const result = await testModelConnection(provider, modelId);

    return NextResponse.json({
      success: true,
      result,
      testConfig: { provider, modelId, testMessage },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ 特定模型测试失败:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Specific model test failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

/**
 * 生成配置建议
 */
function generateRecommendations(results: any[]): string[] {
  const recommendations: string[] = [];
  
  const failedResults = results.filter(r => !r.success);
  
  if (failedResults.length === 0) {
    recommendations.push('🎉 所有模型都配置正确！');
    return recommendations;
  }
  
  // 检查失败模型并提供建议
  failedResults.forEach(result => {
    switch (result.provider) {
      case 'openai':
        if (result.error?.includes('API key')) {
          recommendations.push('🔑 OpenAI: 请设置 OPENAI_API_KEY 环境变量');
        } else if (result.error?.includes('quota') || result.error?.includes('billing')) {
          recommendations.push('💳 OpenAI: 检查账户余额和使用配额');
        } else {
          recommendations.push(`❌ OpenAI: ${result.error}`);
        }
        break;
        
      case 'claude':
        if (result.error?.includes('API key')) {
          recommendations.push('🔑 Claude: 请设置 ANTHROPIC_API_KEY 环境变量');
        } else if (result.error?.includes('forbidden')) {
          recommendations.push('🚫 Claude: API Key 权限不足或账户被限制');
        } else {
          recommendations.push(`❌ Claude: ${result.error}`);
        }
        break;
        
      case 'bedrock':
        if (result.error?.includes('credentials')) {
          recommendations.push('🔑 AWS Bedrock: 请设置 AWS_ACCESS_KEY_ID 和 AWS_SECRET_ACCESS_KEY');
        } else if (result.error?.includes('region')) {
          recommendations.push('🌍 AWS Bedrock: 检查 AWS_REGION 或 BEDROCK_REGION 设置');
        } else {
          recommendations.push(`❌ AWS Bedrock: ${result.error}`);
        }
        break;
        
      case 'zhipu':
        if (result.error?.includes('API key')) {
          recommendations.push('🔑 智谱AI: 请设置 ZHIPU_API_KEY 环境变量');
        } else if (result.error?.includes('fetch failed')) {
          recommendations.push('🌐 智谱AI: 网络连接问题，检查 ZHIPU_BASE_URL 设置');
        } else {
          recommendations.push(`❌ 智谱AI: ${result.error}`);
        }
        break;
    }
  });
  
  // 通用建议
  if (recommendations.length > 1) {
    recommendations.push('');
    recommendations.push('💡 通用建议:');
    recommendations.push('- 检查 .env.local 文件是否正确配置');
    recommendations.push('- 重启开发服务器使环境变量生效');
    recommendations.push('- 验证网络连接和防火墙设置');
  }
  
  return recommendations;
}
