/**
 * AI Service Adapter for Coding Agent
 * 连接Coding Agent和现有的AgentOrchestrator系统
 */

import { 
  CodingAgentMessage,
  CodingAgentAsk,
  CodingAgentSay,
  CodingAgentMessageMetadata,
  CodeFile,
  CodingAgentFileOperation,
  CodingAgentMessageFactory
} from './types';

import { StreamableAgentResponse } from '@/lib/types/streaming';
import { SessionData } from '@/lib/types/session';

// 🎯 AI服务适配器类
export class CodingAgentAIServiceAdapter {
  private baseUrl: string;
  private sessionId: string;
  private onMessage?: (message: CodingAgentMessage) => void;
  private onError?: (error: string) => void;
  private onStreamingUpdate?: (messageId: string, text: string) => void;
  private onToolExecution?: (toolName: string, params: any) => Promise<any>;

  constructor(options: {
    baseUrl?: string;
    sessionId: string;
    onMessage?: (message: CodingAgentMessage) => void;
    onError?: (error: string) => void;
    onStreamingUpdate?: (messageId: string, text: string) => void;
    onToolExecution?: (toolName: string, params: any) => Promise<any>;
  }) {
    this.baseUrl = options.baseUrl || '';
    this.sessionId = options.sessionId;
    this.onMessage = options.onMessage;
    this.onError = options.onError;
    this.onStreamingUpdate = options.onStreamingUpdate;
    this.onToolExecution = options.onToolExecution;
  }

  // 🎯 发送消息到AI服务
  async sendMessage(
    text: string,
    metadata?: CodingAgentMessageMetadata,
    options?: {
      mode?: 'coding' | 'normal';
      forceAgent?: string;
      context?: any;
    }
  ): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          sessionId: this.sessionId,
          currentStage: 'coding',
          context: {
            mode: 'coding_agent',
            codingAgent: true,
            metadata,
            ...options?.context
          }
        })
      });

      if (!response.ok) {
        throw new Error(`AI服务响应错误: ${response.status}`);
      }

      // 处理流式响应
      await this.handleStreamingResponse(response);

    } catch (error) {
      console.error('AI服务调用失败:', error);
      this.onError?.(error instanceof Error ? error.message : '未知错误');
    }
  }

  // 🎯 处理流式响应
  private async handleStreamingResponse(response: Response): Promise<void> {
    if (!response.body) return;

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let currentMessageId: string | null = null;
    const accumulatedText = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              return;
            }

            try {
              const parsedData = JSON.parse(data);
              await this.processStreamingChunk(parsedData, currentMessageId);
              
              if (parsedData.system_state?.metadata?.message_id) {
                currentMessageId = parsedData.system_state.metadata.message_id;
              }
            } catch (error) {
              console.error('解析流式数据失败:', error);
            }
          }
        }
      }
    } catch (error) {
      console.error('流式响应处理失败:', error);
      this.onError?.('流式响应处理失败');
    }
  }

  // 🎯 处理流式数据块
  private async processStreamingChunk(chunk: any, messageId: string | null): Promise<void> {
    // 检测响应类型并转换为Coding Agent消息
    if (chunk.immediate_display?.reply) {
      const text = chunk.immediate_display.reply;
      
      // 分析AI响应，判断是Say还是Ask
      const { say, ask, metadata } = await this.analyzeAIResponse(text, chunk);
      
      if (ask) {
        // 创建Ask消息
        const askMessage = CodingAgentMessageFactory.createAskMessage(
          ask,
          text,
          { 
            ...metadata,
            streaming: !chunk.system_state?.done,
            messageId: messageId ?? undefined
          }
        );
        this.onMessage?.(askMessage);
        
      } else {
        // 创建Say消息
        const sayMessage = CodingAgentMessageFactory.createSayMessage(
          say || 'status_update',
          text,
          { 
            ...metadata,
            streaming: !chunk.system_state?.done,
            messageId: messageId ?? undefined
          }
        );
        this.onMessage?.(sayMessage);
      }
    }

    // 处理交互请求
    if (chunk.interaction) {
      await this.handleInteractionRequest(chunk.interaction);
    }

    // 处理工具调用
    if (chunk.system_state?.metadata?.tool_calls) {
      await this.handleToolCalls(chunk.system_state.metadata.tool_calls);
    }

    // 处理文件操作
    if (chunk.system_state?.metadata?.projectFiles) {
      await this.handleFileOperations(chunk.system_state.metadata.projectFiles);
    }

    // 处理流式更新
    if (chunk.system_state?.metadata?.is_update && messageId) {
      this.onStreamingUpdate?.(messageId, chunk.immediate_display?.reply || '');
    }
  }

  // 🎯 分析AI响应类型
  private async analyzeAIResponse(text: string, chunk: any): Promise<{
    say?: CodingAgentSay;
    ask?: CodingAgentAsk;
    metadata: CodingAgentMessageMetadata;
  }> {
    const metadata: CodingAgentMessageMetadata = {
      streamComplete: chunk.system_state?.done,
      progress: chunk.system_state?.progress,
      stage: chunk.system_state?.current_stage
    };

    // 根据文本内容和系统状态判断消息类型
    if (chunk.interaction) {
      // 如果有交互请求，这是一个Ask消息
      return {
        ask: this.mapInteractionToAsk(chunk.interaction),
        metadata: {
          ...metadata,
          requiresResponse: true,
          responseOptions: chunk.interaction.elements?.map((el: any) => ({
            value: el.value,
            label: el.label,
            description: el.description
          }))
        }
      };
    }

    // 根据文本内容判断Say类型
    const say = this.mapTextToSay(text, chunk);
    
    // 处理代码文件
    if (chunk.system_state?.metadata?.projectFiles) {
      metadata.codeFiles = chunk.system_state.metadata.projectFiles.map((file: any) => ({
        filename: file.filename,
        content: file.content,
        language: file.language || 'plaintext',
        type: this.mapFileType(file.filename),
        created: file.created,
        modified: file.modified
      }));
    }

    return { say, metadata };
  }

  // 🎯 映射交互类型到Ask类型
  private mapInteractionToAsk(interaction: any): CodingAgentAsk {
    switch (interaction.type) {
      case 'confirmation':
        return 'approve_changes';
      case 'choice':
        return 'select_alternative';
      case 'form':
        return 'provide_additional_context';
      case 'file_operation':
        return 'file_operation';
      case 'tool_selection':
        return 'tool_selection';
      case 'code_review':
        return 'code_review';
      default:
        return 'provide_additional_context';
    }
  }

  // 🎯 映射文本到Say类型
  private mapTextToSay(text: string, chunk: any): CodingAgentSay {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('开始') || lowerText.includes('starting')) {
      return 'task_started';
    }
    if (lowerText.includes('完成') || lowerText.includes('completed')) {
      return 'task_completed';
    }
    if (lowerText.includes('生成') || lowerText.includes('generated')) {
      return 'code_generated';
    }
    if (lowerText.includes('创建') || lowerText.includes('created')) {
      return 'file_created';
    }
    if (lowerText.includes('修改') || lowerText.includes('modified')) {
      return 'file_modified';
    }
    if (lowerText.includes('执行') || lowerText.includes('executed')) {
      return 'command_executed';
    }
    if (lowerText.includes('分析') || lowerText.includes('analysis')) {
      return 'analysis_complete';
    }
    if (lowerText.includes('错误') || lowerText.includes('error')) {
      return 'error_encountered';
    }
    if (lowerText.includes('建议') || lowerText.includes('suggestion')) {
      return 'suggestion_provided';
    }
    if (lowerText.includes('警告') || lowerText.includes('warning')) {
      return 'warning_issued';
    }
    if (lowerText.includes('工具') || lowerText.includes('tool')) {
      return 'tool_execution_started';
    }
    
    return 'status_update';
  }

  // 🎯 映射文件类型
  private mapFileType(filename: string): CodeFile['type'] {
    const ext = filename.split('.').pop()?.toLowerCase();
    
    if (filename.includes('component') || filename.includes('Component')) {
      return 'component';
    }
    if (filename.includes('page') || filename.includes('Page')) {
      return 'page';
    }
    if (ext === 'css' || ext === 'scss' || ext === 'sass') {
      return 'styles';
    }
    if (ext === 'json' || filename.includes('config')) {
      return 'config';
    }
    if (ext === 'test' || ext === 'spec' || filename.includes('test')) {
      return 'test';
    }
    if (ext === 'md' || ext === 'txt') {
      return 'docs';
    }
    
    return 'data';
  }

  // 🎯 处理交互请求
  private async handleInteractionRequest(interaction: any): Promise<void> {
    console.log('处理交互请求:', interaction);
    // 这里可以根据需要处理特定的交互逻辑
  }

  // 🎯 处理工具调用
  private async handleToolCalls(toolCalls: any[]): Promise<void> {
    for (const toolCall of toolCalls) {
      try {
        if (this.onToolExecution) {
          await this.onToolExecution(toolCall.name, toolCall.parameters);
        }
      } catch (error) {
        console.error('工具调用失败:', error);
      }
    }
  }

  // 🎯 处理文件操作
  private async handleFileOperations(files: any[]): Promise<void> {
    for (const file of files) {
      // 通知文件变更
      console.log('文件操作:', file);
    }
  }

  // 🎯 发送用户响应
  async sendUserResponse(
    ask: CodingAgentAsk,
    response: 'primary' | 'secondary' | string,
    metadata?: any
  ): Promise<void> {
    try {
      const apiResponse = await fetch(`${this.baseUrl}/api/chat/interact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: this.sessionId,
          interactionType: 'ask_response',
          data: {
            ask,
            response,
            metadata,
            timestamp: new Date().toISOString()
          }
        })
      });

      if (!apiResponse.ok) {
        throw new Error('处理用户响应失败');
      }

      // 处理后续的流式响应
      await this.handleStreamingResponse(apiResponse);

    } catch (error) {
      console.error('发送用户响应失败:', error);
      this.onError?.(error instanceof Error ? error.message : '发送用户响应失败');
    }
  }

  // 🎯 执行文件操作
  async executeFileOperation(operation: CodingAgentFileOperation): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/coding-agent/file-operation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: this.sessionId,
          operation
        })
      });

      if (!response.ok) {
        throw new Error('文件操作失败');
      }

      const result = await response.json();
      console.log('文件操作结果:', result);

    } catch (error) {
      console.error('文件操作失败:', error);
      this.onError?.(error instanceof Error ? error.message : '文件操作失败');
    }
  }

  // 🎯 获取会话状态
  async getSessionStatus(): Promise<SessionData | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/session?sessionId=${this.sessionId}`);
      
      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('获取会话状态失败:', error);
      return null;
    }
  }

  // 🎯 重置会话
  async resetSession(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/session/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: this.sessionId
        })
      });

      if (!response.ok) {
        throw new Error('重置会话失败');
      }

    } catch (error) {
      console.error('重置会话失败:', error);
      this.onError?.(error instanceof Error ? error.message : '重置会话失败');
    }
  }
}

// 🎯 AI服务适配器工厂
export class CodingAgentAIServiceFactory {
  static createAdapter(options: {
    sessionId: string;
    onMessage?: (message: CodingAgentMessage) => void;
    onError?: (error: string) => void;
    onStreamingUpdate?: (messageId: string, text: string) => void;
    onToolExecution?: (toolName: string, params: any) => Promise<any>;
  }): CodingAgentAIServiceAdapter {
    return new CodingAgentAIServiceAdapter(options);
  }
}

// 🎯 响应转换器
export class ResponseTransformer {
  // 将AgentOrchestrator响应转换为CodingAgent消息
  static transformResponse(response: StreamableAgentResponse): CodingAgentMessage | null {
    if (!response.immediate_display?.reply) {
      return null;
    }

    const text = response.immediate_display.reply;
    const metadata: CodingAgentMessageMetadata = {
      streamComplete: response.system_state?.done,
      progress: response.system_state?.progress,
      stage: response.system_state?.current_stage
    };

    // 根据响应内容判断消息类型
    if (response.interaction) {
      // 这是一个Ask消息
      const ask = this.mapInteractionToAsk(response.interaction);
      return CodingAgentMessageFactory.createAskMessage(ask, text, metadata);
    } else {
      // 这是一个Say消息
      const say = this.mapTextToSay(text);
      return CodingAgentMessageFactory.createSayMessage(say, text, metadata);
    }
  }

  private static mapInteractionToAsk(interaction: any): CodingAgentAsk {
    switch (interaction.type) {
      case 'confirmation':
        return 'approve_changes';
      case 'choice':
        return 'select_alternative';
      default:
        return 'provide_additional_context';
    }
  }

  private static mapTextToSay(text: string): CodingAgentSay {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('开始')) return 'task_started';
    if (lowerText.includes('完成')) return 'task_completed';
    if (lowerText.includes('生成')) return 'code_generated';
    if (lowerText.includes('创建')) return 'file_created';
    if (lowerText.includes('修改')) return 'file_modified';
    if (lowerText.includes('执行')) return 'command_executed';
    if (lowerText.includes('分析')) return 'analysis_complete';
    if (lowerText.includes('错误')) return 'error_encountered';
    
    return 'status_update';
  }
} 