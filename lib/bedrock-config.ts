/**
 * AWS Bedrock 专用配置
 * 处理 Claude 4 的特殊需求
 */

// Claude 4 推理配置文件 ARN
export const CLAUDE4_INFERENCE_PROFILE_ARN = process.env.CLAUDE4_INFERENCE_PROFILE_ARN

// 检查是否配置了推理配置文件
export function hasClaude4InferenceProfile(): boolean {
  return !!CLAUDE4_INFERENCE_PROFILE_ARN
}

// 获取 Claude 4 的正确模型标识符
export function getClaude4ModelId(): string {
  // 如果配置了推理配置文件，使用 ARN
  if (hasClaude4InferenceProfile()) {
    console.log('🔧 使用 Claude 4 推理配置文件')
    return CLAUDE4_INFERENCE_PROFILE_ARN!
  }
  
  // 否则使用原始模型 ID (可能会失败，但会提供清晰的错误信息)
  console.log('⚠️ 使用原始 Claude 4 模型ID (可能需要推理配置文件)')
  return "anthropic.claude-sonnet-4-20250514-v1:0"
}

// 验证 Claude 4 配置
export function validateClaude4Config(): {
  isValid: boolean
  message: string
  recommendations: string[]
  severity: 'info' | 'warning' | 'error'
} {
  if (hasClaude4InferenceProfile()) {
    return {
      isValid: true,
      message: "✅ Claude 4 推理配置文件已配置",
      recommendations: [
        "🎉 可以正常使用 Claude 4 Sonnet",
        "📊 推理配置文件提供更好的性能和稳定性"
      ],
      severity: 'info'
    }
  }
  
  return {
    isValid: false,
    message: "⚠️ Claude 4 需要推理配置文件或预置吞吐量",
    recommendations: [
      "🔧 方案1: 在 AWS Bedrock 控制台创建 Claude 4 推理配置文件",
      "🔑 然后在 .env.local 中设置 CLAUDE4_INFERENCE_PROFILE_ARN",
      "💰 方案2: 配置预置吞吐量 (成本较高)",
      "🔄 方案3: 使用 Claude 3.5 Sonnet (完全支持 on-demand)",
      "",
      "📚 详细说明:",
      "- Claude 4 在 Bedrock 中不支持 on-demand 调用",
      "- 必须通过推理配置文件或预置吞吐量使用",
      "- Claude 3.5 Sonnet 性能相近且完全支持 on-demand"
    ],
    severity: 'warning'
  }
}

// 获取推荐的回退模型
export function getRecommendedFallbackModel(): string {
  return "anthropic.claude-sonnet-4-20250514-v2:0"
}

// 生成 Bedrock 配置摘要
export function generateBedrockConfigSummary() {
  const claude4Config = validateClaude4Config()
  
  return {
    claude4: claude4Config,
    fallbackModel: getRecommendedFallbackModel(),
    setup: {
      hasAwsCredentials: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
      region: process.env.AWS_REGION || process.env.BEDROCK_REGION || 'us-east-1',
      claude4ModelId: getClaude4ModelId(),
      inferenceProfileConfigured: hasClaude4InferenceProfile()
    },
    recommendations: claude4Config.isValid ? 
      ["🎯 配置完整，可以开始使用 Claude 4"] :
      [
        "🔧 配置 Claude 4 推理配置文件以获得最佳体验",
        "🔄 或暂时使用 Claude 3.5 Sonnet 作为替代",
        "📖 查看 CLAUDE4_BEDROCK_SETUP.md 获取详细配置步骤"
      ]
  }
}
