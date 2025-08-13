import { openai } from "@ai-sdk/openai"
import { anthropic } from "@ai-sdk/anthropic"
import { generateText, generateObject, streamText } from "ai"
import type { ModelProvider } from "@/types/models"

// 验证 API keys 是否配置
function validateApiKeys() {
  const openaiKey = process.env.OPENAI_API_KEY
  const anthropicKey = process.env.ANTHROPIC_API_KEY

  console.log("🔑 API Keys status:")
  console.log("- OpenAI:", openaiKey ? `✅ Configured (${openaiKey.substring(0, 10)}...)` : "❌ Missing")
  console.log("- Anthropic:", anthropicKey ? `✅ Configured (${anthropicKey.substring(0, 10)}...)` : "❌ Missing")

  return { openaiKey, anthropicKey }
}

export function getModelClient(provider: ModelProvider, modelId: string) {
  const { openaiKey, anthropicKey } = validateApiKeys()

  switch (provider) {
    case "openai":
      if (!openaiKey) {
        throw new Error("OpenAI API key is not configured. Please set OPENAI_API_KEY in your environment variables.")
      }
      console.log(`🤖 Creating OpenAI client with model: ${modelId}`)
      return openai(modelId)
    case "claude":
      if (!anthropicKey) {
        throw new Error(
          "Anthropic API key is not configured. Please set ANTHROPIC_API_KEY in your environment variables.",
        )
      }
      console.log(`🤖 Creating Anthropic client with model: ${modelId}`)
      return anthropic(modelId)
    default:
      throw new Error(`Unsupported model provider: ${provider}`)
  }
}

export async function generateWithModel(
  provider: ModelProvider,
  modelId: string,
  input: string | Array<{ role: 'system' | 'user' | 'assistant', content: string }>,
  options?: {
    system?: string
    schema?: any
    maxTokens?: number
  },
) {
  try {
    console.log(`\n🚀 [Model] 开始生成 - Provider: ${provider}, Model: ${modelId}`);
    const model = getModelClient(provider, modelId)

    // 🆕 处理输入类型
    const isMessagesMode = Array.isArray(input);
    
    console.log(`📊 [输入分析]`, {
      mode: isMessagesMode ? 'messages' : 'prompt',
      inputLength: isMessagesMode ? input.length : (input as string).length,
      hasSchema: !!options?.schema,
      hasSystem: !!options?.system,
      maxTokens: options?.maxTokens
    });
    
    if (isMessagesMode) {
      console.log(`💬 [Messages模式] 使用对话历史，消息数: ${input.length}`);
      (input as any[]).forEach((msg, index) => {
        const roleIcon = msg.role === 'user' ? '👤' : msg.role === 'assistant' ? '🤖' : '📝';
        const roleName = msg.role === 'user' ? '用户' : msg.role === 'assistant' ? '助手' : '系统';
        console.log(`  ${roleIcon} [${roleName}${index}] ${msg.content?.substring(0, 150)}...`);
      });
    } else {
      console.log(`📝 [Prompt模式] 使用单次提示，长度: ${(input as string).length}`);
      console.log(`📄 [Prompt内容] ${(input as string).substring(0, 200)}...`);
    }

    if (options?.schema) {
      console.log(`🔧 [结构化输出] 使用 generateObject`);
      // 使用结构化输出
      const result = await generateObject({
        model,
        prompt: isMessagesMode ? undefined : input as string,
        messages: isMessagesMode ? input as any : undefined, // 🆕 支持 messages
        system: isMessagesMode ? undefined : options.system, // messages 模式下 system 已包含在 messages 中
        schema: options.schema,
        maxTokens: options.maxTokens,
      })
      console.log(`✅ [生成成功] 结构化对象生成完成 (Provider: ${provider})`);
      console.log(`📊 [结果统计] 对象字段数: ${result.object && typeof result.object === 'object' ? Object.keys(result.object as object).length : 0}`);
      return result
    } else {
      console.log(`📝 [文本输出] 使用 generateText`);
      // 使用文本生成
      const result = await generateText({
        model,
        prompt: isMessagesMode ? undefined : input as string,
        messages: isMessagesMode ? input as any : undefined, // 🆕 支持 messages
        system: isMessagesMode ? undefined : options?.system, // messages 模式下 system 已包含在 messages 中
        maxTokens: options?.maxTokens,
      })
      console.log(`✅ [生成成功] 文本生成完成 (Provider: ${provider})`);
      console.log(`📊 [结果统计] 文本长度: ${result.text.length}`);
      return result
    }
  } catch (error) {
    console.error(`❌ [生成失败] ${provider} model ${modelId} 错误:`, {
      error: error instanceof Error ? error.message : error,
      inputType: Array.isArray(input) ? 'messages' : 'prompt',
      hasSchema: !!options?.schema
    })

    // 如果是 Claude 模型失败，尝试回退到 OpenAI
    if (provider === "claude" && process.env.OPENAI_API_KEY) {
      console.log(`🔄 [模型回退] Claude 失败，尝试回退到 GPT-4o...`)
      try {
        return await generateWithModel("openai", "gpt-4o", input, options)
      } catch (fallbackError) {
        console.error(`❌ [回退失败] OpenAI 回退也失败:`, fallbackError)
      }
    }

    throw error
  }
}

// 测试 API 连接
export async function testModelConnection(provider: ModelProvider, modelId: string) {
  try {
    console.log(`🧪 Testing connection for ${provider} - ${modelId}`)

    const result = await generateWithModel(provider, modelId, "Hello, this is a test message.", {
      system: "You are a helpful assistant. Respond briefly with just 'Test successful'.",
      maxTokens: 10,
    })

    const response = 'text' in result ? result.text : 'object' in result ? JSON.stringify(result.object) : "No response"

    console.log(`✅ Test successful for ${provider} - ${modelId}:`, response)

    return {
      success: true,
      provider,
      modelId,
      response: response.substring(0, 100), // 限制响应长度
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error(`❌ Test failed for ${provider} - ${modelId}:`, error)

    return {
      success: false,
      provider,
      modelId,
      error: error instanceof Error ? error.message : "Unknown error",
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      timestamp: new Date().toISOString(),
    }
  }
}

// 便捷函数：使用 GPT-4o
export async function generateWithGPT4o(
  input: string | Array<{ role: 'system' | 'user' | 'assistant', content: string }>,
  options?: {
    system?: string
    schema?: any
    maxTokens?: number
  },
) {
  return generateWithModel("openai", "gpt-4o", input, options)
}

// 便捷函数：使用 claude 4 Sonnet
export async function generateWithClaude(
  input: string | Array<{ role: 'system' | 'user' | 'assistant', content: string }>,
  options?: {
    system?: string
    schema?: any
    maxTokens?: number
  },
) {
  return generateWithModel("claude", "claude-sonnet-4-20250514", input, options)
}

// 智能模型选择：优先使用可用的模型
export async function generateWithBestAvailableModel(
  input: string | Array<{ role: 'system' | 'user' | 'assistant', content: string }>,
  options?: {
    system?: string
    schema?: any
    maxTokens?: number
  },
) {
  const { openaiKey, anthropicKey } = validateApiKeys()

  if (anthropicKey) {
    try {
      return await generateWithClaude(input, options)
    } catch (error) {
      console.log("Claude failed, trying OpenAI...")
      if (openaiKey) {
        return await generateWithGPT4o(input, options)
      }
      throw error
    }
  } else if (openaiKey) {
    return await generateWithGPT4o(input, options)
  } else {
    throw new Error("No API keys configured. Please set ANTHROPIC_API_KEY or OPENAI_API_KEY.")
  }
}

export async function* generateStreamWithModel(
  provider: ModelProvider,
  modelId: string,
  input: string | Array<{ role: 'system' | 'user' | 'assistant', content: string }>,
  options?: {
    system?: string
    maxTokens?: number
    tools?: Array<{
      name: string;
      description: string;
      input_schema: {
        type: string;
        properties: Record<string, any>;
        required: string[];
      };
    }>;
  },
): AsyncGenerator<string, void, unknown> {
  try {
    console.log(`\n🌊 [Stream] 开始流式生成 - Provider: ${provider}, Model: ${modelId}`);
    const model = getModelClient(provider, modelId)

    // 🆕 处理输入类型
    const isMessagesMode = Array.isArray(input);
    
    console.log(`📊 [流式输入分析]`, {
      mode: isMessagesMode ? 'messages' : 'prompt',
      inputLength: isMessagesMode ? input.length : (input as string).length,
      maxTokens: options?.maxTokens,
      hasTools: !!options?.tools,
      toolsCount: options?.tools?.length || 0
    });
    
    console.log(`🌊 [流式文本] 使用 streamText${options?.tools ? ' (with tools)' : ''}`);
    
    // 🆕 准备工具参数
    const streamTextParams: any = {
      model,
      prompt: isMessagesMode ? undefined : input as string,
      messages: isMessagesMode ? input as any : undefined,
      system: isMessagesMode ? undefined : options?.system,
      maxTokens: options?.maxTokens,
    };
    
    // 🆕 添加工具支持
    if (options?.tools && options.tools.length > 0) {
      console.log(`🔧 [工具支持] 添加 ${options.tools.length} 个工具到请求中`);
      options.tools.forEach((tool, index) => {
        console.log(`  🛠️ [工具${index + 1}] ${tool.name}: ${tool.description}`);
      });
      
      streamTextParams.tools = options.tools;
    }
    
    // 使用流式文本生成
    console.log(`📡 [API调用] 准备调用 streamText...`);
    const result = await streamText(streamTextParams)

    console.log(`✅ [流式开始] 文本流式生成开始 (Provider: ${provider})`);
    
    let chunkCount = 0;
    for await (const textPart of result.textStream) {
      chunkCount++;
      console.log(`📤 [流式块] 第${chunkCount}个，长度: ${textPart.length}`);
      yield textPart;
    }
    
    console.log(`✅ [流式完成] 文本流式生成完成 (Provider: ${provider})，总块数: ${chunkCount}`);

  } catch (error) {
    console.error(`❌ [流式失败] ${provider} model ${modelId} 错误:`, {
      error: error instanceof Error ? error.message : error,
      inputType: Array.isArray(input) ? 'messages' : 'prompt'
    })

    // 如果是 Claude 模型失败，尝试回退到 OpenAI
    if (provider === "claude" && process.env.OPENAI_API_KEY) {
      console.log(`🔄 [流式回退] Claude 失败，尝试回退到 GPT-4o...`)
      try {
        yield* generateStreamWithModel("openai", "gpt-4o", input, options)
        return
      } catch (fallbackError) {
        console.error(`❌ [流式回退失败] OpenAI 回退也失败:`, fallbackError)
      }
    }

    throw error
  }
}
