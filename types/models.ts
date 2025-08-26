export type ModelProvider = "openai" | "claude" | "bedrock" | "zhipu"

export interface ModelConfig {
  id: string
  name: string
  provider: ModelProvider
  description: string
  maxTokens: number
  supportsFunctions: boolean
}

export const AVAILABLE_MODELS: ModelConfig[] = [
  {
    id: "claude-sonnet-4-20250514",
    name: "Claude 4 Sonnet",
    provider: "claude",
    description: "Anthropic 最强大的模型，擅长复杂推理和创作",
    maxTokens: 200000,
    supportsFunctions: true,
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    description: "OpenAI 最新的多模态模型，平衡性能和速度",
    maxTokens: 128000,
    supportsFunctions: true,
  },
  // AWS Bedrock 模型
  {
    id: "anthropic.claude-sonnet-4-20250514-v1:0",
    name: "Claude 4 Sonnet (Bedrock)",
    provider: "bedrock",
    description: "AWS Bedrock 上的 Claude 4 Sonnet，最强推理能力",
    maxTokens: 200000,
    supportsFunctions: true,
  },
  {
    id: "amazon.titan-text-premier-v1:0",
    name: "Amazon Titan Text Premier",
    provider: "bedrock",
    description: "Amazon 自研的大语言模型，性价比高",
    maxTokens: 32000,
    supportsFunctions: false,
  },
  {
    id: "meta.llama3-2-90b-instruct-v1:0",
    name: "Llama 3.2 90B (Bedrock)",
    provider: "bedrock",
    description: "Meta 的开源模型，在 AWS Bedrock 上托管",
    maxTokens: 128000,
    supportsFunctions: true,
  },
  // 智谱AI 模型
  {
    id: "glm-4.5",
    name: "glm-4.5",
    provider: "zhipu",
    description: "智谱AI最强大的模型，支持长文本和复杂推理",
    maxTokens: 128000,
    supportsFunctions: true,
  },
  {
    id: "glm-4-0520",
    name: "GLM-4",
    provider: "zhipu",
    description: "智谱AI的基础模型，平衡性能和成本",
    maxTokens: 128000,
    supportsFunctions: true,
  },
  {
    id: "glm-4-flash",
    name: "GLM-4-Flash",
    provider: "zhipu",
    description: "智谱AI的快速响应模型，适合实时对话",
    maxTokens: 128000,
    supportsFunctions: true,
  },
]

export function getModelById(id: string): ModelConfig | undefined {
  return AVAILABLE_MODELS.find((model) => model.id === id)
}

export function getModelsByProvider(provider: ModelProvider): ModelConfig[] {
  return AVAILABLE_MODELS.filter((model) => model.provider === provider)
}

// 默认模型配置 - 优先使用 Claude API
export const DEFAULT_MODEL = "claude-sonnet-4-20250514"
export const DEFAULT_CLAUDE_MODEL = "claude-sonnet-4-20250514"
export const DEFAULT_OPENAI_MODEL = "gpt-4o"
export const DEFAULT_BEDROCK_MODEL = "anthropic.claude-sonnet-4-20250514-v1:0"
export const DEFAULT_ZHIPU_MODEL = "glm-4.5"

// 模型优先级（用于智能回退）- Bedrock 优先
export const MODEL_PRIORITY = [
  "anthropic.claude-sonnet-4-20250514-v1:0", // Bedrock Claude (优先)
  "claude-sonnet-4-20250514",    // Claude 4 Sonnet
  "gpt-4o",                      // GPT-4o
  "glm-4.5",                     // 智谱 glm-4.5
  "glm-4-0520",                  // 智谱 GLM-4
  "glm-4-flash",                 // 智谱 GLM-4-Flash
]
