/**
 * AWS Bedrock 专用测试端点
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateWithModel, testModelConnection } from '@/lib/ai-models';
import { generateBedrockConfigSummary, validateClaude4Config } from '@/lib/bedrock-config';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 开始测试 AWS Bedrock 连接...');

    // 检查环境变量和 Claude 4 配置
    const awsAccessKey = process.env.AWS_ACCESS_KEY_ID;
    const awsSecretKey = process.env.AWS_SECRET_ACCESS_KEY;
    const awsRegion = process.env.AWS_REGION || process.env.BEDROCK_REGION || 'us-east-1';

    const envCheck = {
      hasAccessKey: !!awsAccessKey,
      hasSecretKey: !!awsSecretKey,
      region: awsRegion,
      accessKeyPreview: awsAccessKey ? `${awsAccessKey.substring(0, 4)}...` : 'missing'
    };

    // 获取完整的 Bedrock 配置摘要
    const configSummary = generateBedrockConfigSummary();
    
    console.log('🔍 环境变量检查:', envCheck);
    console.log('🔧 Claude 4 配置:', configSummary.claude4);

    if (!awsAccessKey || !awsSecretKey) {
      return NextResponse.json({
        success: false,
        error: 'AWS credentials not configured',
        envCheck,
        recommendations: [
          '🔑 请在 .env.local 中设置 AWS_ACCESS_KEY_ID',
          '🔑 请在 .env.local 中设置 AWS_SECRET_ACCESS_KEY',
          '🌍 可选：设置 AWS_REGION 或 BEDROCK_REGION (默认 us-east-1)',
          '📚 查看 bedrock-setup.md 获取详细配置指南'
        ]
      }, { status: 400 });
    }

    // 测试 Bedrock 连接
    const modelId = "anthropic.claude-sonnet-4-20250514-v1:0";
    
    console.log(`🤖 测试模型: ${modelId}`);
    const testResult = await testModelConnection("bedrock", modelId);

    if (testResult.success) {
      return NextResponse.json({
        success: true,
        message: '🎉 AWS Bedrock 连接成功！',
        envCheck,
        testResult,
        configSummary,
        modelInfo: {
          provider: 'bedrock',
          modelId,
          displayName: 'Claude 4 Sonnet (Bedrock)',
          region: awsRegion,
          actualModelId: configSummary.setup.claude4ModelId
        },
        nextSteps: configSummary.claude4.isValid ? [
          '✅ Claude 4 配置完整，可以在应用中使用',
          '📝 使用 generateWithBedrockClaude() 函数调用',
          '🔄 或使用 generateWithBestAvailableModel() 智能选择'
        ] : [
          '⚠️ Claude 4 需要推理配置文件',
          '🔧 请查看返回的配置建议',
          '🔄 或使用其他模型作为替代'
        ]
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Bedrock connection failed',
        envCheck,
        testResult,
        troubleshooting: generateTroubleshootingTips(testResult.error || 'Unknown error')
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Bedrock 测试失败:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Bedrock test failed',
      details: error instanceof Error ? error.message : String(error),
      troubleshooting: [
        '🔍 检查 AWS 凭证是否正确',
        '🌐 确认网络连接正常',
        '📋 验证 IAM 权限是否包含 AmazonBedrockFullAccess',
        '🎯 确认 Bedrock 模型访问权限已启用'
      ]
    }, { status: 500 });
  }
}

/**
 * POST 方法：发送测试消息
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message = "Hello, this is a test message. Please respond briefly." } = body;

    console.log(`🗣️ 发送测试消息到 Bedrock: ${message}`);
    
    const result = await generateWithModel(
      "bedrock", 
      "anthropic.claude-sonnet-4-20250514-v1:0", 
      message,
      { maxTokens: 100 }
    );

    return NextResponse.json({
      success: true,
      message: '🎉 Bedrock 消息测试成功！',
      request: { message },
      response: {
        text: 'text' in result ? result.text : JSON.stringify(result.object),
        length: 'text' in result ? result.text.length : JSON.stringify(result.object).length,
        model: "anthropic.claude-sonnet-4-20250514-v1:0"
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Bedrock 消息测试失败:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Bedrock message test failed',
      details: error instanceof Error ? error.message : String(error),
      troubleshooting: generateTroubleshootingTips(
        error instanceof Error ? error.message : String(error)
      )
    }, { status: 500 });
  }
}

/**
 * 生成故障排除建议
 */
function generateTroubleshootingTips(errorMessage: string): string[] {
  const tips = ['🔧 故障排除建议:'];

  if (errorMessage.includes('credentials')) {
    tips.push('🔑 检查 AWS_ACCESS_KEY_ID 和 AWS_SECRET_ACCESS_KEY 是否正确设置');
    tips.push('👤 确认 IAM 用户有访问 Bedrock 的权限');
  }

  if (errorMessage.includes('region')) {
    tips.push('🌍 检查 AWS_REGION 设置，建议使用 us-east-1');
    tips.push('📍 确认所选地区支持 Bedrock 服务');
  }

  if (errorMessage.includes('access') || errorMessage.includes('permission')) {
    tips.push('🚫 在 Bedrock 控制台启用 Claude 模型访问权限');
    tips.push('⏰ 等待模型访问申请审批（可能需要几分钟到几小时）');
  }

  if (errorMessage.includes('throttl') || errorMessage.includes('rate')) {
    tips.push('⏳ 请求过于频繁，请稍后重试');
    tips.push('📊 检查 Bedrock 使用配额和限制');
  }

  if (errorMessage.includes('model')) {
    tips.push('🤖 确认模型 ID 正确：anthropic.claude-sonnet-4-20250514-v1:0');
    tips.push('📋 检查该模型在当前地区是否可用');
  }

  // 通用建议
  tips.push('');
  tips.push('💡 通用检查:');
  tips.push('- 重启开发服务器使环境变量生效');
  tips.push('- 使用 AWS CLI 测试基本连接：aws bedrock list-foundation-models');
  tips.push('- 查看 bedrock-setup.md 获取详细配置指南');

  return tips;
}
