/**
 * 基于 Vercel AI SDK 的新一代 Agent 基类
 * 统一的多步骤工具调用和流式响应处理
 */

import { anthropic } from '@ai-sdk/anthropic';
import { generateText, tool, stepCountIs, ModelMessage } from 'ai';
import { z } from 'zod';

export interface AgentCapabilities {
  canStream: boolean;
  canUseTools: boolean;
  canAnalyzeCode: boolean;
  canGenerateCode: boolean;
  canAccessFiles: boolean;
  canAccessInternet: boolean;
  canRememberContext: boolean;
  maxContextLength: number;
  supportedLanguages: string[];
  specializedFor: string[];
}

export interface StreamableAgentResponse {
  immediate_display: {
    reply: string;
    agent_name: string;
    timestamp: string;
  };
  system_state: {
    intent: string;
    done: boolean;
    progress?: number;
    current_stage?: string;
    next_agent?: string;
    metadata?: Record<string, any>;
  };
}

export interface SessionData {
  id: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: z.ZodSchema;
  execute: (params: any) => Promise<any>;
}

export abstract class BaseAgentV2 {
  protected name: string;
  protected id: string;
  protected capabilities: AgentCapabilities;
  protected conversationHistory = new Map<string, Array<{ role: 'user' | 'assistant'; content: string }>>();

  constructor(name: string, id: string, capabilities: AgentCapabilities) {
    this.name = name;
    this.id = id;
    this.capabilities = capabilities;
  }

  /**
   * 主要处理方法 - 子类必须实现
   */
  abstract processRequest(
    userInput: string,
    sessionData: SessionData,
    context?: Record<string, any>
  ): AsyncGenerator<StreamableAgentResponse, void, unknown>;

  /**
   * 获取工具定义 - 子类必须实现
   */
  abstract getTools(): Record<string, ToolDefinition>;

  /**
   * 核心多步骤工具调用方法
   */
  protected async executeMultiStepWorkflow(
    userInput: string,
    sessionData: SessionData,
    systemPrompt: string,
    maxSteps: number = 6,
    onStepComplete?: (stepNumber: number, toolResults: any[]) => Promise<void>
  ): Promise<{
    text: string;
    toolCalls: any[];
    toolResults: any[];
    steps: any[];
    usage?: any;
  }> {
    // 构建对话历史
    const conversationHistory = this.conversationHistory.get(sessionData.id) || [];
    const messages: ModelMessage[] = [
      {
        role: 'system',
        content: systemPrompt
      },
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: 'user',
        content: userInput
      }
    ];

    // 转换工具定义为 Vercel AI SDK 格式
    const tools = this.convertToolsToVercelFormat();

    // 执行多步骤工具调用
    const result = await generateText({
      model: anthropic('claude-3-5-sonnet-20241022'),
      messages,
      tools,
      stopWhen: stepCountIs(maxSteps),
      temperature: 0.7,
      maxTokens: 8000,
      onStepFinish: async ({ toolResults, stepNumber }) => {
        console.log(`📊 [步骤 ${stepNumber}] 完成，执行了 ${toolResults.length} 个工具`);
        if (onStepComplete) {
          await onStepComplete(stepNumber, toolResults);
        }
      }
    });

    return result;
  }

  /**
   * 转换工具定义为 Vercel AI SDK 格式
   */
  private convertToolsToVercelFormat(): Record<string, any> {
    const tools = this.getTools();
    const vercelTools: Record<string, any> = {};

    for (const [name, toolDef] of Object.entries(tools)) {
      vercelTools[name] = tool({
        description: toolDef.description,
        inputSchema: toolDef.inputSchema,
        execute: toolDef.execute
      });
    }

    return vercelTools;
  }

  /**
   * 创建标准响应
   */
  protected createResponse(response: Partial<StreamableAgentResponse>): StreamableAgentResponse {
    return {
      immediate_display: {
        reply: response.immediate_display?.reply || '',
        agent_name: this.name,
        timestamp: new Date().toISOString(),
        ...response.immediate_display
      },
      system_state: {
        intent: 'processing',
        done: false,
        ...response.system_state
      }
    };
  }

  /**
   * 创建思考响应
   */
  protected createThinkingResponse(message: string, progress: number): StreamableAgentResponse {
    return this.createResponse({
      immediate_display: {
        reply: message
      },
      system_state: {
        intent: 'thinking',
        done: false,
        progress,
        current_stage: '分析中'
      }
    });
  }

  /**
   * 更新对话历史
   */
  protected updateConversationHistory(sessionData: SessionData, userInput: string, assistantResponse: string): void {
    if (!this.conversationHistory.has(sessionData.id)) {
      this.conversationHistory.set(sessionData.id, []);
    }

    const history = this.conversationHistory.get(sessionData.id)!;
    history.push(
      { role: 'user', content: userInput },
      { role: 'assistant', content: assistantResponse }
    );

    // 保持历史记录在合理范围内
    if (history.length > 20) {
      history.splice(0, history.length - 20);
    }
  }

  /**
   * 错误处理
   */
  protected async handleError(
    error: Error,
    sessionData: SessionData,
    context?: Record<string, any>
  ): Promise<StreamableAgentResponse> {
    console.error(`❌ [${this.name}] 处理失败:`, error);
    
    return this.createResponse({
      immediate_display: {
        reply: '抱歉，处理您的请求时遇到了问题。请稍后重试。'
      },
      system_state: {
        intent: 'error',
        done: true,
        metadata: {
          error: error.message,
          timestamp: new Date().toISOString()
        }
      }
    });
  }

  /**
   * 获取 Agent 信息
   */
  getInfo() {
    return {
      name: this.name,
      id: this.id,
      capabilities: this.capabilities
    };
  }
}
