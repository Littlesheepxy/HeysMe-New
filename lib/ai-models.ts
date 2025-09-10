import { openai } from "@ai-sdk/openai"
import { anthropic } from "@ai-sdk/anthropic"
import { bedrock } from "@ai-sdk/amazon-bedrock"
import { createOpenAI } from "@ai-sdk/openai"
import { generateText, generateObject, streamText } from "ai"
import type { ModelProvider } from "@/types/models"
import { getClaude4ModelId, validateClaude4Config } from "./bedrock-config"

// 智谱AI配置
const zhipuAI = createOpenAI({
  baseURL: process.env.ZHIPU_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4/',
  apiKey: process.env.ZHIPU_API_KEY || '',
  name: 'zhipu',
})

// 验证 API keys 是否配置
function validateApiKeys() {
  const openaiKey = process.env.OPENAI_API_KEY
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  const awsAccessKey = process.env.AWS_ACCESS_KEY_ID
  const awsSecretKey = process.env.AWS_SECRET_ACCESS_KEY
  const zhipuKey = process.env.ZHIPU_API_KEY

  console.log("🔑 API Keys status:")
  console.log("- OpenAI:", openaiKey ? `✅ Configured (${openaiKey.substring(0, 10)}...)` : "❌ Missing")
  console.log("- Anthropic:", anthropicKey ? `✅ Configured (${anthropicKey.substring(0, 10)}...)` : "❌ Missing")
  console.log("- AWS Bedrock:", (awsAccessKey && awsSecretKey) ? `✅ Configured` : "❌ Missing")
  console.log("- 智谱AI:", zhipuKey ? `✅ Configured (${zhipuKey.substring(0, 10)}...)` : "❌ Missing")

  return { 
    openaiKey, 
    anthropicKey, 
    awsAccessKey, 
    awsSecretKey, 
    zhipuKey,
    hasAws: !!(awsAccessKey && awsSecretKey)
  }
}

export function getModelClient(provider: ModelProvider, modelId: string) {
  const { openaiKey, anthropicKey, hasAws, zhipuKey } = validateApiKeys()

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
      
    case "bedrock":
      if (!hasAws) {
        throw new Error(
          "AWS credentials are not configured. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in your environment variables.",
        )
      }
      
      // 对于 Claude 4，使用智能模型ID选择
      let actualModelId = modelId
      if (modelId === "anthropic.claude-sonnet-4-20250514-v1:0") {
        actualModelId = getClaude4ModelId()
        const claude4Config = validateClaude4Config()
        if (!claude4Config.isValid) {
          console.warn(`⚠️ ${claude4Config.message}`)
          claude4Config.recommendations.forEach(rec => console.warn(`  ${rec}`))
        }
      }
      
      console.log(`🤖 Creating AWS Bedrock client with model: ${actualModelId}`)
      return bedrock(actualModelId)
      
    case "zhipu":
      if (!zhipuKey) {
        throw new Error(
          "智谱AI API key is not configured. Please set ZHIPU_API_KEY in your environment variables.",
        )
      }
      console.log(`🤖 Creating 智谱AI client with model: ${modelId}`)
      return zhipuAI(modelId)
      
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
      const requestParams: any = {
        model,
        prompt: isMessagesMode ? undefined : input as string,
        messages: isMessagesMode ? input as any : undefined, // 🆕 支持 messages
        system: isMessagesMode ? undefined : options.system, // messages 模式下 system 已包含在 messages 中
        schema: options.schema,
      }
      
      // 设置 maxTokens，如果没有指定则使用默认值（考虑API限制）
      requestParams.maxTokens = options.maxTokens || 8000
      
      const result = await generateObject(requestParams)
      console.log(`✅ [生成成功] 结构化对象生成完成 (Provider: ${provider})`);
      console.log(`📊 [结果统计] 对象字段数: ${result.object && typeof result.object === 'object' ? Object.keys(result.object as object).length : 0}`);
      return result
    } else {
      console.log(`📝 [文本输出] 使用 generateText`);
      // 使用文本生成
      const requestParams: any = {
        model,
        prompt: isMessagesMode ? undefined : input as string,
        messages: isMessagesMode ? input as any : undefined, // 🆕 支持 messages
        system: isMessagesMode ? undefined : options?.system, // messages 模式下 system 已包含在 messages 中
      }
      
      // 设置 maxTokens，如果没有指定则使用默认值（考虑API限制）
      requestParams.maxTokens = options?.maxTokens || 8000
      
      const result = await generateText(requestParams)
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

    // 智能模型回退
    await attemptModelFallback(provider, input, options)

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

// 智能模型回退函数
async function attemptModelFallback(
  failedProvider: ModelProvider,
  input: string | Array<{ role: 'system' | 'user' | 'assistant', content: string }>,
  options?: {
    system?: string
    schema?: any
    maxTokens?: number
  }
) {
  const { openaiKey, anthropicKey, hasAws, zhipuKey } = validateApiKeys()
  
  // 定义回退顺序 - Claude API 优先
  const fallbackOrder: Array<{provider: ModelProvider, model: string, available: boolean}> = [
    { provider: "claude", model: "claude-sonnet-4-20250514", available: !!anthropicKey },
    { provider: "openai", model: "gpt-4o", available: !!openaiKey },
    { provider: "bedrock", model: "anthropic.claude-sonnet-4-20250514-v1:0", available: hasAws },
    { provider: "zhipu", model: "glm-4.5", available: !!zhipuKey },
  ]
  
  // 过滤掉失败的提供商和不可用的提供商
  const availableFallbacks = fallbackOrder.filter(
    fallback => fallback.provider !== failedProvider && fallback.available
  )
  
  for (const fallback of availableFallbacks) {
    console.log(`🔄 [模型回退] ${failedProvider} 失败，尝试回退到 ${fallback.provider}...`)
    try {
      return await generateWithModel(fallback.provider, fallback.model, input, options)
    } catch (fallbackError) {
      console.error(`❌ [回退失败] ${fallback.provider} 回退也失败:`, fallbackError)
    }
  }
  
  console.error(`❌ [回退完全失败] 所有可用模型都失败了`)
}

// 便捷函数：使用 Claude 4 Sonnet
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

// 便捷函数：使用 AWS Bedrock Claude
export async function generateWithBedrockClaude(
  input: string | Array<{ role: 'system' | 'user' | 'assistant', content: string }>,
  options?: {
    system?: string
    schema?: any
    maxTokens?: number
  },
) {
  return generateWithModel("bedrock", "anthropic.claude-sonnet-4-20250514-v1:0", input, options)
}

// 便捷函数：使用智谱AI
export async function generateWithZhipu(
  input: string | Array<{ role: 'system' | 'user' | 'assistant', content: string }>,
  options?: {
    system?: string
    schema?: any
    maxTokens?: number
  },
) {
  return generateWithModel("zhipu", "glm-4.5", input, options)
}

// 智能模型选择：按优先级尝试可用的模型
export async function generateWithBestAvailableModel(
  input: string | Array<{ role: 'system' | 'user' | 'assistant', content: string }>,
  options?: {
    system?: string
    schema?: any
    maxTokens?: number
  },
) {
  const { openaiKey, anthropicKey, hasAws, zhipuKey } = validateApiKeys()

  // 按优先级顺序尝试模型 - Claude API 优先
  const modelPriority = [
    { provider: "claude" as ModelProvider, model: "claude-sonnet-4-20250514", available: !!anthropicKey },
    { provider: "openai" as ModelProvider, model: "gpt-4o", available: !!openaiKey },
    { provider: "bedrock" as ModelProvider, model: "anthropic.claude-sonnet-4-20250514-v1:0", available: hasAws },
    { provider: "zhipu" as ModelProvider, model: "glm-4.5", available: !!zhipuKey },
  ]

  for (const model of modelPriority) {
    if (model.available) {
      try {
        console.log(`🎯 [智能选择] 尝试使用 ${model.provider} - ${model.model}`)
        return await generateWithModel(model.provider, model.model, input, options)
      } catch (error) {
        console.log(`❌ [智能选择] ${model.provider} 失败，尝试下一个模型...`)
        continue
      }
    }
  }

  throw new Error(
    "No API keys configured or all models failed. Please configure at least one: ANTHROPIC_API_KEY, OPENAI_API_KEY, ZHIPU_API_KEY, or AWS credentials."
  )
}

export async function* generateStreamWithModel(
  provider: ModelProvider,
  modelId: string,
  input: string | Array<{ role: 'system' | 'user' | 'assistant', content: string }>,
  options?: {
    system?: string
    maxTokens?: number
    tools?: Record<string, any> | Array<{
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
      maxTokens: options?.maxTokens || 8000,
    };
    
    // 🆕 添加工具支持
    if (options?.tools) {
      if (Array.isArray(options.tools)) {
        // 旧格式工具（数组格式）
        console.log(`🔧 [工具支持] 添加 ${options.tools.length} 个工具到请求中`);
        options.tools.forEach((tool, index) => {
          console.log(`  🛠️ [工具${index + 1}] ${tool.name}: ${tool.description}`);
        });
        streamTextParams.tools = options.tools;
      } else {
        // 新格式工具（对象格式，ai-sdk标准）
        const toolCount = Object.keys(options.tools).length;
        console.log(`🔧 [工具支持] 添加 ${toolCount} 个ai-sdk标准工具到请求中`);
        Object.entries(options.tools).forEach(([name, tool], index) => {
          console.log(`  🛠️ [工具${index + 1}] ${name}: ${tool.description || '无描述'}`);
        });
        streamTextParams.tools = options.tools;
      }
    }
    
    // 使用流式文本生成
    console.log(`📡 [API调用] 准备调用 streamText...`);
    const result = await streamText(streamTextParams)

    console.log(`✅ [流式开始] 文本流式生成开始 (Provider: ${provider})`);
    
    let chunkCount = 0;
    let toolCallCount = 0;
    
    // 🆕 处理完整的流式响应（包括工具调用）
    for await (const delta of result.fullStream) {
      console.log(`🔍 [流式Delta类型] ${delta.type}`);
      
      if (delta.type === 'text-delta') {
        chunkCount++;
        console.log(`📤 [文本块] 第${chunkCount}个，长度: ${delta.text.length}`);
        yield delta.text;
      } else if (delta.type === 'tool-call') {
        toolCallCount++;
        console.log(`🛠️ [工具调用] 第${toolCallCount}个: ${delta.toolName}`);
        const toolCallText = `[调用工具: ${delta.toolName}]`;
        yield toolCallText;
      } else if (delta.type === 'tool-result') {
        console.log(`🔧 [工具结果]`);
        const toolResultText = `[工具执行完成]`;
        yield toolResultText;
      } else {
        console.log(`❓ [未知Delta类型] ${delta.type}:`, delta);
      }
    }
    
    console.log(`✅ [流式完成] 文本流式生成完成 (Provider: ${provider})，文本块数: ${chunkCount}，工具调用数: ${toolCallCount}`);

  } catch (error) {
    console.error(`❌ [流式失败] ${provider} model ${modelId} 错误:`, {
      error: error instanceof Error ? error.message : error,
      inputType: Array.isArray(input) ? 'messages' : 'prompt'
    })

    // 智能回退逻辑 - 根据当前失败的提供商选择最优回退
    const { openaiKey, anthropicKey, hasAws, zhipuKey } = validateApiKeys()
    
    const fallbackOptions = [
      { provider: "claude" as ModelProvider, model: "claude-sonnet-4-20250514", available: !!anthropicKey },
      { provider: "openai" as ModelProvider, model: "gpt-4o", available: !!openaiKey },
      { provider: "bedrock" as ModelProvider, model: "anthropic.claude-sonnet-4-20250514-v1:0", available: hasAws },
      { provider: "zhipu" as ModelProvider, model: "glm-4.5", available: !!zhipuKey },
    ].filter(option => option.provider !== provider && option.available)
    
    for (const fallback of fallbackOptions) {
      console.log(`🔄 [流式回退] ${provider} 失败，尝试回退到 ${fallback.provider}...`)
      try {
        yield* generateStreamWithModel(fallback.provider, fallback.model, input, options)
        return
      } catch (fallbackError) {
        console.error(`❌ [流式回退失败] ${fallback.provider} 回退也失败:`, fallbackError)
      }
    }

    throw error
  }
}
