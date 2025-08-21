/**
 * 流式工具调用处理器
 * 实现 "文本 → 工具调用 → 文本" 的流程显示
 */

import { StreamableAgentResponse } from '@/types/agent';

export interface ToolCallState {
  toolName: string;
  toolCallId: string;
  state: 'input-streaming' | 'input-available' | 'output-available' | 'output-error';
  input?: any;
  output?: any;
  errorText?: string;
}

export interface StreamingToolHandlerOptions {
  onToolCallStart?: (toolCall: ToolCallState) => void;
  onToolCallUpdate?: (toolCall: ToolCallState) => void;
  onToolCallComplete?: (toolCall: ToolCallState) => void;
  onTextUpdate?: (text: string, isComplete: boolean) => void;
}

export class StreamingToolHandler {
  private toolCalls: Map<string, ToolCallState> = new Map();
  private accumulatedText: string = '';
  private options: StreamingToolHandlerOptions;

  constructor(options: StreamingToolHandlerOptions = {}) {
    this.options = options;
  }

  /**
   * 创建工具调用开始的响应
   */
  createToolCallStartResponse(
    toolName: string,
    toolCallId: string,
    input: any,
    messageId: string
  ): StreamableAgentResponse {
    const toolCall: ToolCallState = {
      toolName,
      toolCallId,
      state: 'input-streaming',
      input
    };

    this.toolCalls.set(toolCallId, toolCall);
    this.options.onToolCallStart?.(toolCall);

    return {
      immediate_display: {
        reply: `🔧 正在执行 ${this.getToolDisplayName(toolName)}...`,
        agent_name: 'CodingAgent',
        timestamp: new Date().toISOString()
      },
      system_state: {
        intent: 'tool_calling',
        done: false,
        progress: 50,
        current_stage: '工具执行中',
        metadata: {
          message_id: messageId,
          content_mode: 'append',
          stream_type: 'tool_call_start',
          toolCalls: Array.from(this.toolCalls.values())
        }
      }
    };
  }

  /**
   * 创建工具调用完成的响应
   */
  createToolCallCompleteResponse(
    toolCallId: string,
    output: any,
    isError: boolean = false,
    messageId: string
  ): StreamableAgentResponse {
    const toolCall = this.toolCalls.get(toolCallId);
    if (!toolCall) {
      throw new Error(`Tool call ${toolCallId} not found`);
    }

    toolCall.state = isError ? 'output-error' : 'output-available';
    toolCall.output = output;
    if (isError) {
      toolCall.errorText = String(output);
    }

    this.options.onToolCallComplete?.(toolCall);

    const toolDisplayName = this.getToolDisplayName(toolCall.toolName);
    const statusMessage = isError 
      ? `❌ ${toolDisplayName} 执行失败`
      : `✅ ${toolDisplayName} 执行成功`;

    return {
      immediate_display: {
        reply: statusMessage,
        agent_name: 'CodingAgent',
        timestamp: new Date().toISOString()
      },
      system_state: {
        intent: 'tool_complete',
        done: false,
        progress: 75,
        current_stage: '工具执行完成',
        metadata: {
          message_id: messageId,
          content_mode: 'append',
          stream_type: 'tool_call_complete',
          toolCalls: Array.from(this.toolCalls.values())
        }
      }
    };
  }

  /**
   * 创建文本流式响应
   */
  createTextStreamResponse(
    text: string,
    isComplete: boolean,
    messageId: string
  ): StreamableAgentResponse {
    this.accumulatedText += text;
    this.options.onTextUpdate?.(this.accumulatedText, isComplete);

    return {
      immediate_display: {
        reply: text,
        agent_name: 'CodingAgent',
        timestamp: new Date().toISOString()
      },
      system_state: {
        intent: isComplete ? 'text_complete' : 'text_streaming',
        done: isComplete,
        progress: isComplete ? 100 : 80,
        current_stage: isComplete ? '响应完成' : '生成响应中',
        metadata: {
          message_id: messageId,
          content_mode: 'append',
          stream_type: isComplete ? 'text_complete' : 'text_streaming',
          toolCalls: Array.from(this.toolCalls.values())
        }
      }
    };
  }

  /**
   * 获取所有工具调用状态
   */
  getAllToolCalls(): ToolCallState[] {
    return Array.from(this.toolCalls.values());
  }

  /**
   * 清理状态
   */
  reset(): void {
    this.toolCalls.clear();
    this.accumulatedText = '';
  }

  /**
   * 获取工具显示名称
   */
  private getToolDisplayName(toolName: string): string {
    const displayNames: Record<string, string> = {
      'create_file': '创建文件',
      'edit_file': '编辑文件',
      'read_file': '读取文件',
      'list_files': '列出文件',
      'create_directory': '创建目录',
      'delete_file': '删除文件',
      'move_file': '移动文件',
      'copy_file': '复制文件'
    };
    return displayNames[toolName] || toolName;
  }
}

/**
 * 创建流式工具调用处理器的工厂函数
 */
export function createStreamingToolHandler(options?: StreamingToolHandlerOptions): StreamingToolHandler {
  return new StreamingToolHandler(options);
}
