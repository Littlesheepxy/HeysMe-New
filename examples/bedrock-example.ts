/**
 * AWS Bedrock 使用示例
 * 
 * 在运行前请确保设置了以下环境变量：
 * - AWS_ACCESS_KEY_ID
 * - AWS_SECRET_ACCESS_KEY
 * - AWS_REGION (可选，默认 us-east-1)
 */

import { generateWithBedrockClaude, generateWithBestAvailableModel } from '@/lib/ai-models'

// 示例 1: 直接使用 Bedrock Claude
export async function exampleBedrockDirect() {
  try {
    console.log('🧪 示例 1: 直接使用 Bedrock Claude')
    
    const result = await generateWithBedrockClaude(
      "请用中文简单介绍什么是AWS Bedrock服务",
      { maxTokens: 200 }
    )
    
    console.log('✅ Bedrock 响应:', result.text)
    return result.text
    
  } catch (error) {
    console.error('❌ Bedrock 调用失败:', error)
    throw error
  }
}

// 示例 2: 使用智能选择（会优先选择 Bedrock）
export async function exampleSmartSelection() {
  try {
    console.log('🧪 示例 2: 智能模型选择')
    
    const result = await generateWithBestAvailableModel(
      "写一首关于云计算的小诗",
      { maxTokens: 150 }
    )
    
    console.log('✅ 智能选择响应:', result.text)
    return result.text
    
  } catch (error) {
    console.error('❌ 智能选择失败:', error)
    throw error
  }
}

// 示例 3: 结构化输出
export async function exampleStructuredOutput() {
  try {
    console.log('🧪 示例 3: 结构化输出')
    
    const { z } = await import('zod')
    
    const schema = z.object({
      topic: z.string().describe("文章主题"),
      summary: z.string().describe("内容摘要"),
      keywords: z.array(z.string()).describe("关键词列表"),
      sentiment: z.enum(['positive', 'neutral', 'negative']).describe("情感倾向")
    })
    
    const result = await generateWithBedrockClaude(
      "分析这段文本：'AWS Bedrock 是一个令人兴奋的机器学习服务，它让开发者能够轻松访问各种先进的AI模型。'",
      { 
        schema,
        maxTokens: 300
      }
    )
    
    console.log('✅ 结构化输出:', JSON.stringify(result.object, null, 2))
    return result.object
    
  } catch (error) {
    console.error('❌ 结构化输出失败:', error)
    throw error
  }
}

// 示例 4: 批量处理
export async function exampleBatchProcessing() {
  try {
    console.log('🧪 示例 4: 批量处理')
    
    const questions = [
      "什么是机器学习？",
      "云计算的优势是什么？",
      "AI的未来发展趋势如何？"
    ]
    
    const results = await Promise.all(
      questions.map(async (question, index) => {
        console.log(`处理问题 ${index + 1}: ${question}`)
        
        const result = await generateWithBedrockClaude(question, {
          maxTokens: 100
        })
        
        return {
          question,
          answer: result.text,
          timestamp: new Date().toISOString()
        }
      })
    )
    
    console.log('✅ 批量处理完成:', results)
    return results
    
  } catch (error) {
    console.error('❌ 批量处理失败:', error)
    throw error
  }
}

// 运行所有示例的函数
export async function runAllExamples() {
  console.log('🚀 开始运行 Bedrock 示例...\n')
  
  try {
    // 示例 1
    await exampleBedrockDirect()
    console.log('\n---\n')
    
    // 示例 2
    await exampleSmartSelection()
    console.log('\n---\n')
    
    // 示例 3
    await exampleStructuredOutput()
    console.log('\n---\n')
    
    // 示例 4
    await exampleBatchProcessing()
    
    console.log('\n🎉 所有示例运行完成！')
    
  } catch (error) {
    console.error('\n💥 示例运行失败:', error)
    
    // 提供故障排除建议
    console.log('\n🔧 故障排除建议:')
    console.log('1. 检查 AWS 凭证是否正确设置')
    console.log('2. 确认 Bedrock 服务在所选地区可用')
    console.log('3. 验证 IAM 权限包含 AmazonBedrockFullAccess')
    console.log('4. 确认 Claude 模型访问权限已启用')
    console.log('5. 查看 bedrock-setup.md 获取详细配置指南')
  }
}

// 如果作为脚本直接运行
if (require.main === module) {
  runAllExamples()
}
