import { NextRequest, NextResponse } from "next/server"
import { generateWithBestAvailableModel } from "@/lib/ai-models"
import { z } from "zod"

// 预定义的 schema 映射
const SCHEMA_MAP = {
  intentResponse: z.object({
    identified: z.object({
      user_role: z.string().nullable(),
      use_case: z.string().nullable(),
      style: z.string().nullable(),
      highlight_focus: z.array(z.string()).default([])
    }),
    follow_up: z.object({
      missing_fields: z.array(z.string()).default([]),
      suggestions: z.record(z.object({
        prompt_text: z.string(),
        options: z.array(z.string())
      })).default({})
    }),
    completion_status: z.enum(['collecting', 'optimizing', 'ready']),
    direction_suggestions: z.array(z.string()).default([]),
    smart_defaults: z.any().default({})
  }),
  
  // 可以添加更多预定义的 schema
  recipe: z.object({
    name: z.string(),
    ingredients: z.array(z.object({
      name: z.string(),
      amount: z.string()
    })),
    steps: z.array(z.string())
  })
}

// TODO: 性能优化选项
// 1. 添加 Redis 缓存层用于相似请求
// 2. 实现请求去重（相同 prompt 的并发请求）
// 3. 添加响应压缩
// 4. 实现流式响应以提升用户体验

export async function POST(request: NextRequest) {
  const requestStartTime = new Date();
  try {
    console.log(`\n🌐 [AI API] 接收到新请求 (${requestStartTime.toISOString()})`);
    
    const { prompt, messages, options } = await request.json()

    // 🆕 支持两种模式：单次 prompt 或对话历史
    if (!prompt && !messages) {
      console.log(`❌ [参数错误] 缺少 prompt 或 messages 参数`);
      return NextResponse.json(
        { success: false, error: "Prompt or messages is required" },
        { status: 400 }
      )
    }

    console.log(`🤖 [请求分析] AI API route - 处理请求:`, { 
      mode: messages ? 'conversation' : 'single',
      promptLength: prompt?.length || 0,
      messagesCount: messages?.length || 0,
      hasSchema: !!options?.schema,
      schemaType: options?.schemaType,
      maxTokens: options?.maxTokens 
    });

    if (messages) {
      console.log(`💬 [对话模式] 消息详情:`);
      messages.forEach((msg: any, index: number) => {
        const roleIcon = msg.role === 'user' ? '👤' : msg.role === 'assistant' ? '🤖' : '📝';
        const roleName = msg.role === 'user' ? '用户' : msg.role === 'assistant' ? '助手' : '系统';
        console.log(`  ${roleIcon} [${roleName}${index}] ${msg.content?.substring(0, 150)}...`);
      });
    }

    // 处理 schema - 使用预定义的 schema 映射
    const processedOptions = { ...options }
    if (options?.schemaType && SCHEMA_MAP[options.schemaType as keyof typeof SCHEMA_MAP]) {
      console.log(`🔧 [Schema处理] 使用预定义 schema: ${options.schemaType}`)
      processedOptions.schema = SCHEMA_MAP[options.schemaType as keyof typeof SCHEMA_MAP]
    } else if (options?.schema) {
      // 如果直接传递了 schema，移除它（因为 JSON 序列化会破坏 Zod schema）
      console.log(`⚠️  [Schema处理] 移除无效的 schema 参数，降级为文本生成`)
      delete processedOptions.schema
    }

    // TODO: 在这里可以添加缓存检查
    // const cacheKey = generateCacheKey(prompt, processedOptions)
    // const cachedResult = await redis.get(cacheKey)
    // if (cachedResult) return NextResponse.json(cachedResult)

    // 🆕 根据模式调用不同的生成方法
    console.log(`🚀 [模型调用] 准备调用模型生成服务`);
    let result;
    if (messages) {
      console.log(`💬 [对话模式] 使用 messages 数组调用模型`);
      // 对话历史模式
      result = await generateWithBestAvailableModel(messages, processedOptions);
    } else {
      console.log(`📝 [单次模式] 使用 prompt 字符串调用模型`);
      // 单次 prompt 模式
      result = await generateWithBestAvailableModel(prompt, processedOptions);
    }

    const requestEndTime = new Date();
    const processingTime = requestEndTime.getTime() - requestStartTime.getTime();
    
    console.log(`✅ [请求完成] AI API 调用成功:`, {
      processingTime: `${processingTime}ms`,
      resultType: typeof result,
      hasObject: 'object' in result,
      hasText: 'text' in result
    });

    // TODO: 缓存结果
    // await redis.setex(cacheKey, 3600, result) // 缓存1小时

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
      metadata: {
        processingTime,
        mode: messages ? 'conversation' : 'single'
      }
    })

  } catch (error) {
    const requestEndTime = new Date();
    const processingTime = requestEndTime.getTime() - requestStartTime.getTime();
    
    console.error(`❌ [API错误] AI 生成失败:`, {
      error: error instanceof Error ? error.message : error,
      processingTime: `${processingTime}ms`,
      stack: error instanceof Error ? error.stack : undefined
    })
    
    const errorMessage = error instanceof Error ? error.message : "AI 生成失败"
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        suggestion: "请检查 API key 配置或网络连接",
        metadata: {
          processingTime
        }
      },
      { status: 500 }
    )
  }
} 