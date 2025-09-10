export type ModelProvider = "openai" | "claude" | "anthropic" | "bedrock" | "zhipu" | "moonshot" | "qwen" | "groq"

export interface ModelConfig {
  id: string
  name: string
  provider: ModelProvider
  description: string
  maxTokens: number
  supportsFunctions: boolean
}

export const AVAILABLE_MODELS: ModelConfig[] = [
  // OpenAI 模型
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    description: "OpenAI 最新的多模态模型，平衡性能和速度",
    maxTokens: 128000,
    supportsFunctions: true,
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "openai",
    description: "OpenAI 轻量级模型，快速高效",
    maxTokens: 128000,
    supportsFunctions: true,
  },
  {
    id: "gpt-4-turbo",
    name: "GPT-4 Turbo",
    provider: "openai",
    description: "OpenAI 增强版 GPT-4",
    maxTokens: 128000,
    supportsFunctions: true,
  },
  // Anthropic 模型
  {
    id: "claude-3-5-sonnet-20241022",
    name: "Claude-3.5 Sonnet",
    provider: "anthropic",
    description: "Anthropic 最新的 Claude 模型，擅长复杂推理",
    maxTokens: 200000,
    supportsFunctions: true,
  },
  {
    id: "claude-3-haiku-20240307",
    name: "Claude-3 Haiku",
    provider: "anthropic",
    description: "Anthropic 快速响应模型",
    maxTokens: 200000,
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
  // 智谱AI 模型
  {
    id: "glm-4.5",
    name: "GLM-4.5",
    provider: "zhipu",
    description: "3550亿参数 MoE 架构，智谱AI最强模型",
    maxTokens: 128000,
    supportsFunctions: true,
  },
  {
    id: "glm-4.5-air",
    name: "GLM-4.5-Air",
    provider: "zhipu",
    description: "1060亿参数轻量版，快速高效",
    maxTokens: 128000,
    supportsFunctions: true,
  },
  {
    id: "glm-4.5v",
    name: "GLM-4.5V",
    provider: "zhipu",
    description: "多模态视觉模型，支持图片理解",
    maxTokens: 128000,
    supportsFunctions: true,
  },
  {
    id: "glm-z1-air",
    name: "GLM-Z1-Air",
    provider: "zhipu",
    description: "创意写作专用模型",
    maxTokens: 128000,
    supportsFunctions: true,
  },
  // Kimi/月之暗面 模型
  {
    id: "kimi-k2",
    name: "Kimi-K2",
    provider: "moonshot",
    description: "1T参数 MoE 模型，月之暗面最强模型",
    maxTokens: 200000,
    supportsFunctions: true,
  },
  {
    id: "kimi-k2-0905-preview",
    name: "Kimi-K2-0905-Preview",
    provider: "moonshot",
    description: "Kimi-K2 最新预览版本",
    maxTokens: 200000,
    supportsFunctions: true,
  },
  {
    id: "moonshot-v1-128k",
    name: "Moonshot V1 128K",
    provider: "moonshot",
    description: "128K上下文长度",
    maxTokens: 128000,
    supportsFunctions: true,
  },
  // 通义千问 模型
  {
    id: "qwen3-coder",
    name: "Qwen3-Coder",
    provider: "qwen",
    description: "专业编程助手，代码生成专家",
    maxTokens: 128000,
    supportsFunctions: true,
  },
  {
    id: "qwen3-coder-plus",
    name: "Qwen3-Coder-Plus",
    provider: "qwen",
    description: "增强版编程模型",
    maxTokens: 128000,
    supportsFunctions: true,
  },
  {
    id: "qwen3-32b",
    name: "Qwen3-32B",
    provider: "qwen",
    description: "320亿参数通用模型",
    maxTokens: 128000,
    supportsFunctions: true,
  },
  {
    id: "qwen2.5-omni",
    name: "Qwen2.5-Omni",
    provider: "qwen",
    description: "多模态全能模型",
    maxTokens: 128000,
    supportsFunctions: true,
  },
  // Groq 模型
  {
    id: "llama-3.3-70b-versatile",
    name: "Llama 3.3 70B",
    provider: "groq",
    description: "多用途开源模型，超快推理速度",
    maxTokens: 128000,
    supportsFunctions: true,
  },
  {
    id: "mixtral-8x7b-32768",
    name: "Mixtral 8x7B",
    provider: "groq",
    description: "MoE架构开源模型",
    maxTokens: 32768,
    supportsFunctions: true,
  },
]

export function getModelById(id: string): ModelConfig | undefined {
  return AVAILABLE_MODELS.find((model) => model.id === id)
}

export function getModelsByProvider(provider: ModelProvider): ModelConfig[] {
  return AVAILABLE_MODELS.filter((model) => model.provider === provider)
}

// 默认模型配置
export const DEFAULT_MODEL = "claude-sonnet-4-20250514"
export const DEFAULT_OPENAI_MODEL = "gpt-4o"
export const DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-4-20250514"
export const DEFAULT_BEDROCK_MODEL = "anthropic.claude-sonnet-4-20250514-v1:0"
export const DEFAULT_ZHIPU_MODEL = "glm-4.5"
export const DEFAULT_MOONSHOT_MODEL = "kimi-k2"
export const DEFAULT_QWEN_MODEL = "qwen3-coder"
export const DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile"

// 模型优先级（用于智能回退）
export const MODEL_PRIORITY = [
  "claude-3-5-sonnet-20241022",  // Claude 3.5 Sonnet (优先)
  "gpt-4o",                      // GPT-4o
  "glm-4.5",                     // 智谱 GLM-4.5
  "kimi-k2",                     // Kimi K2
  "qwen3-coder",                 // 通义千问 Coder
  "llama-3.3-70b-versatile",     // Groq Llama
  "anthropic.claude-sonnet-4-20250514-v1:0", // Bedrock Claude
]
