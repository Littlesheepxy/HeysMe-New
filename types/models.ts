export type ModelProvider = "openai" | "claude"

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
    name: "claude 4 Sonnet",
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
]

export function getModelById(id: string): ModelConfig | undefined {
  return AVAILABLE_MODELS.find((model) => model.id === id)
}

export function getModelsByProvider(provider: ModelProvider): ModelConfig[] {
  return AVAILABLE_MODELS.filter((model) => model.provider === provider)
}

// 默认模型设置为 claude 4 Sonnet（使用正确的模型 ID）
export const DEFAULT_MODEL = "claude-sonnet-4-20250514"
export const DEFAULT_CLAUDE_MODEL = "claude-sonnet-4-20250514"
export const DEFAULT_OPENAI_MODEL = "gpt-4o"
