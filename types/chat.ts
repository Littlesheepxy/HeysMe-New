import type { UserInput } from "./userInput" // Assuming UserInput is declared in another file

export interface ChatMessage {
  id: string
  type: "user" | "assistant" | "system"
  content: string
  timestamp: Date
  metadata?: {
    options?: ChatOption[]
    generatedPage?: any
    step?: string
    system_state?: {
      current_stage?: string
      progress?: number
      intent?: string
      done?: boolean
    }
    codeBlocks?: Array<{
      filename: string
      content: string
      language: string
      description?: string
      type: 'page' | 'component' | 'styles' | 'config'
    }>
    interaction?: {
      type: string
      title?: string
      elements?: any[]
    }
  }
}

export interface ChatOption {
  id: string
  label: string
  value: string
  type: "selection" | "input" | "action"
}

export interface ChatSession {
  id: string
  title: string
  messages: ChatMessage[]
  userInput: Partial<UserInput>
  currentStep: string
  created_at: Date
  updated_at: Date
}

// 🆕 会话标题生成相关类型
export interface TitleGenerationRequest {
  conversationId: string;
  messageCount?: number;
}

export interface TitleGenerationResponse {
  success: boolean;
  title: string;
  generatedAt: string;
  model?: string;
  error?: string;
  cached?: boolean;
}

export interface ConversationTitle {
  id: string;
  title: string | null;
  isGenerating?: boolean;
  lastTitleUpdate?: string;
}

// 扩展现有的SessionData类型以包含标题信息
export interface SessionDataWithTitle extends Omit<any, 'title'> {
  id: string;
  title?: string | null;
  titleGeneratedAt?: string;
  titleModel?: string;
  // ... 其他现有字段
}

// 标题生成配置
export interface TitleGenerationConfig {
  autoGenerate: boolean;           // 是否自动生成
  messageThreshold: number;        // 触发生成的消息数量
  maxTitleLength: number;          // 标题最大长度
  regenerateOnEdit: boolean;       // 编辑后是否重新生成
  model: string;                   // 使用的AI模型
}
