/**
 * 增强的工具执行器 - 完整版本
 * 整合了原来的XML、Claude和统一执行器功能，同时增加了增强的错误处理和统计功能
 */

import { ImprovedClaudeToolParser } from './improved-tool-parser';
import { CodeFile, CodingAgentMessage, CodingAgentMessageFactory, CodingAgentAsk, CodingAgentSay } from './types';

interface ToolExecutionResult {
  success: boolean;
  content: string;
  metadata: {
    toolName: string;
    executionTime: number;
    fileModified?: string;
    linesChanged?: number;
  };
  error?: string;
}

interface ToolExecutionContext {
  sessionId: string;
  existingFiles: CodeFile[];
  modifiedFiles: CodeFile[];
  projectContext: any;
}

// ===== 从原执行器迁移的类型定义 =====

type StreamingContentBlock = {
  type: 'text' | 'tool_use';
  content?: string;
  toolName?: string;
  toolParams?: Record<string, string>;
  partial: boolean;
  index: number;
}

interface ClaudeToolCall {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, any>;
  _partial?: boolean;
}

interface ClaudeTextContent {
  type: "text";
  text: string;
}

type ClaudeContent = ClaudeToolCall | ClaudeTextContent;

// ===== XML工具解析器 (从原执行器迁移) =====

class StreamingToolParser {
  private toolTagPattern = /<(\w+)>/g;
  private paramTagPattern = /<(\w+)>/g;
  private closeTagPattern = /<\/(\w+)>/g;
  
  private supportedTools = [
    'write_to_file',
    'read_file', 
    'execute_command',
    'search_files',
    'create_component',
    'deploy_code'
  ];
  
  private toolParams = [
    'path',
    'content', 
    'command',
    'pattern',
    'name',
    'type'
  ];

  /**
   * 实时解析流式AI输出，识别文本和工具调用
   */
  parseStreamingContent(accumulatedText: string): StreamingContentBlock[] {
    const blocks: StreamingContentBlock[] = [];
    let currentIndex = 0;
    let textStart = 0;
    
    // 扫描文本，寻找工具标签
    for (let i = 0; i < accumulatedText.length; i++) {
      // 检查是否匹配工具开始标签
      const toolMatch = this.findToolStartAt(accumulatedText, i);
      if (toolMatch) {
        // 添加之前的文本块
        if (i > textStart) {
          const textContent = accumulatedText.slice(textStart, i).trim();
          if (textContent) {
            blocks.push({
              type: 'text',
              content: textContent,
              partial: false,
              index: currentIndex++
            });
          }
        }
        
        // 解析工具调用
        const toolBlock = this.parseToolBlock(accumulatedText, i, toolMatch.toolName);
        if (toolBlock) {
          blocks.push({
            ...toolBlock,
            index: currentIndex++
          });
          
          if (!toolBlock.partial) {
            // 工具完整，跳过已解析的部分
            i = this.findToolEndPosition(accumulatedText, i, toolMatch.toolName) || i;
            textStart = i + 1;
          } else {
            // 工具部分，暂停解析
            break;
          }
        }
      }
    }
    
    // 添加剩余的文本
    if (textStart < accumulatedText.length) {
      const remainingText = accumulatedText.slice(textStart).trim();
      if (remainingText && !this.isIncompleteTag(remainingText)) {
        blocks.push({
          type: 'text',
          content: remainingText,
          partial: true, // 可能还在输出中
          index: currentIndex++
        });
      }
    }
    
    return blocks;
  }
  
  private findToolStartAt(text: string, position: number): { toolName: string; startPos: number } | null {
    for (const toolName of this.supportedTools) {
      const tag = `<${toolName}>`;
      if (text.startsWith(tag, position)) {
        return { toolName, startPos: position };
      }
    }
    return null;
  }
  
  private parseToolBlock(text: string, startPos: number, toolName: string): StreamingContentBlock | null {
    const openTag = `<${toolName}>`;
    const closeTag = `</${toolName}>`;
    
    const toolStart = startPos + openTag.length;
    const toolEnd = text.indexOf(closeTag, toolStart);
    
    if (toolEnd === -1) {
      // 工具调用未完成
      return {
        type: 'tool_use',
        toolName,
        toolParams: this.parsePartialParams(text.slice(toolStart)),
        partial: true,
        index: 0 // 将被外部设置
      };
    }
    
    // 工具调用完成
    const toolContent = text.slice(toolStart, toolEnd);
    const params = this.parseCompleteParams(toolContent);
    
    return {
      type: 'tool_use',
      toolName,
      toolParams: params,
      partial: false,
      index: 0 // 将被外部设置
    };
  }
  
  private parsePartialParams(content: string): Record<string, string> {
    const params: Record<string, string> = {};
    
    for (const paramName of this.toolParams) {
      const startTag = `<${paramName}>`;
      const endTag = `</${paramName}>`;
      
      const paramStart = content.indexOf(startTag);
      if (paramStart !== -1) {
        const valueStart = paramStart + startTag.length;
        const paramEnd = content.indexOf(endTag, valueStart);
        
        if (paramEnd !== -1) {
          // 参数完整
          params[paramName] = content.slice(valueStart, paramEnd).trim();
        } else {
          // 参数部分
          params[paramName] = content.slice(valueStart).trim();
        }
      }
    }
    
    return params;
  }
  
  private parseCompleteParams(content: string): Record<string, string> {
    const params: Record<string, string> = {};
    
    for (const paramName of this.toolParams) {
      const startTag = `<${paramName}>`;
      const endTag = `</${paramName}>`;
      
      const paramStart = content.indexOf(startTag);
      if (paramStart !== -1) {
        const valueStart = paramStart + startTag.length;
        const paramEnd = content.indexOf(endTag, valueStart);
        
        if (paramEnd !== -1) {
          params[paramName] = content.slice(valueStart, paramEnd).trim();
        }
      }
    }
    
    return params;
  }
  
  private findToolEndPosition(text: string, startPos: number, toolName: string): number | null {
    const closeTag = `</${toolName}>`;
    const endPos = text.indexOf(closeTag, startPos);
    return endPos !== -1 ? endPos + closeTag.length - 1 : null;
  }
  
  private isIncompleteTag(text: string): boolean {
    // 检查是否以不完整的标签结尾
    const tagStart = text.lastIndexOf('<');
    if (tagStart !== -1) {
      const possibleTag = text.slice(tagStart);
      return !possibleTag.includes('>');
    }
    return false;
  }
}

// ===== 传统Claude工具解析器 (从原执行器迁移) =====

class ClaudeToolParser {
  /**
   * 解析Claude标准的JSON格式工具调用
   */
  parseClaudeResponse(accumulatedText: string): ClaudeContent[] {
    const contents: ClaudeContent[] = [];

    try {
      // 尝试解析完整的JSON响应
      const lines = accumulatedText.split('\n');
      let currentText = '';
      let inToolCall = false;
      let toolCallBuffer = '';

      for (const line of lines) {
        const trimmedLine = line.trim();
        
        // 检查是否是工具调用的开始
        if (trimmedLine.startsWith('{"type":"tool_use"') || 
            trimmedLine.startsWith('{ "type": "tool_use"')) {
          // 保存之前的文本内容
          if (currentText.trim()) {
            contents.push({
              type: "text",
              text: currentText.trim()
            });
            currentText = '';
          }
          
          inToolCall = true;
          toolCallBuffer = line;
          continue;
        }
        
        if (inToolCall) {
          toolCallBuffer += '\n' + line;
          
          // 尝试解析工具调用JSON
          try {
            const toolCall = JSON.parse(toolCallBuffer) as ClaudeToolCall;
            if (toolCall.type === "tool_use" && toolCall.name && toolCall.input) {
              contents.push(toolCall);
              inToolCall = false;
              toolCallBuffer = '';
              continue;
            }
          } catch (e) {
            // JSON还不完整，继续累积
            continue;
          }
        }
        
        // 普通文本内容
        if (!inToolCall) {
          currentText += line + '\n';
        }
      }
      
      // 添加剩余的文本内容
      if (currentText.trim()) {
        contents.push({
          type: "text", 
          text: currentText.trim()
        });
      }
      
    } catch (error) {
      console.warn('Claude响应解析失败，使用文本模式:', error);
      // 解析失败时，将整个内容作为文本返回
      if (accumulatedText.trim()) {
        contents.push({
          type: "text",
          text: accumulatedText.trim()
        });
      }
    }

    return contents;
  }

  /**
   * 检查工具调用是否完整
   */
  isToolCallComplete(toolCall: any): boolean {
    return toolCall.type === "tool_use" && 
           toolCall.id && 
           toolCall.name && 
           toolCall.input !== undefined;
  }
}

export class EnhancedIncrementalToolExecutor {
  private improvedParser = new ImprovedClaudeToolParser();
  private xmlParser = new StreamingToolParser();
  private claudeParser = new ClaudeToolParser();
  
  private processedContentLength = 0;
  private executionHistory: ToolExecutionResult[] = [];
  private currentBlockIndex = 0;
  private currentContentBlocks: StreamingContentBlock[] = [];
  
  private mode: 'xml' | 'claude' | 'improved' = 'improved'; // 默认使用改进版本
  
  private onTextUpdate?: (text: string, partial: boolean) => void;
  private onToolExecute?: (toolName: string, params: Record<string, any>) => Promise<ToolExecutionResult>;
  private onToolResult?: (result: ToolExecutionResult) => void;

  constructor(options: {
    onTextUpdate?: (text: string, partial: boolean) => void;
    onToolExecute?: (toolName: string, params: Record<string, any>) => Promise<ToolExecutionResult>;
    onToolResult?: (result: ToolExecutionResult) => void;
    mode?: 'xml' | 'claude' | 'improved';
  }) {
    this.onTextUpdate = options.onTextUpdate;
    this.onToolExecute = options.onToolExecute;
    this.onToolResult = options.onToolResult;
    this.mode = options.mode || 'improved';
  }

  /**
   * 🚀 主要处理方法 - 处理Claude的流式响应
   */
  async processIncrementalStreamChunk(
    accumulatedText: string,
    context: ToolExecutionContext
  ): Promise<{
    hasNewContent: boolean;
    toolsExecuted: number;
    errors: string[];
  }> {
    // 🔧 只处理新增的内容
    const newContent = accumulatedText.slice(this.processedContentLength);
    if (!newContent.trim()) {
      return { hasNewContent: false, toolsExecuted: 0, errors: [] };
    }

    console.log(`📊 [增强执行器] 处理新内容长度: ${newContent.length}`);

    // 🆕 使用改进的解析器
    const parseResult = this.improvedParser.parseClaudeStreamingResponse(accumulatedText);
    const { textBlocks, toolCalls, hasPartialTool } = parseResult;

    let toolsExecuted = 0;
    const errors: string[] = [];

    // 🔤 处理文本块
    for (const textBlock of textBlocks) {
      if (this.onTextUpdate) {
        await this.onTextUpdate(textBlock.text, false);
      }
    }

    // 🔧 处理完整的工具调用
    for (const toolCall of toolCalls) {
      if (!toolCall._partial) {
        try {
          const result = await this.executeToolWithContext(toolCall, context);
          toolsExecuted++;
          
          if (this.onToolResult) {
            await this.onToolResult(result);
          }
        } catch (error) {
          const errorMsg = `工具 ${toolCall.name} 执行失败: ${error instanceof Error ? error.message : '未知错误'}`;
          errors.push(errorMsg);
          console.error(`❌ [工具执行失败]`, error);
        }
      }
    }

    // 🔄 显示部分工具调用的进度
    if (hasPartialTool && this.onTextUpdate) {
      await this.onTextUpdate("🔧 正在准备执行工具...", true);
    }

    this.processedContentLength = accumulatedText.length;

    return {
      hasNewContent: true,
      toolsExecuted,
      errors
    };
  }

  /**
   * 🎯 带上下文的工具执行
   */
  private async executeToolWithContext(
    toolCall: any,
    context: ToolExecutionContext
  ): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    
    console.log(`🔧 [增强执行] ${toolCall.name}`, toolCall.input);

    if (!this.onToolExecute) {
      throw new Error('工具执行回调未设置');
    }

    try {
      // 🚨 先通知开始执行
      if (this.onTextUpdate) {
        await this.onTextUpdate(
          `🔧 执行 ${toolCall.name}: ${this.getToolDescription(toolCall.name, toolCall.input)}`,
          false
        );
      }

      // 📊 执行工具并记录结果
      const result = await this.onToolExecute(toolCall.name, toolCall.input);
      
      const executionTime = Date.now() - startTime;
      
      // 🎯 增强结果信息
      const enhancedResult: ToolExecutionResult = {
        ...result,
        metadata: {
          ...result.metadata,
          executionTime,
          toolName: toolCall.name
        }
      };

      // 📝 记录执行历史
      this.executionHistory.push(enhancedResult);

      // ✅ 通知执行完成
      if (this.onTextUpdate) {
        const successMsg = result.success 
          ? `✅ ${toolCall.name} 完成${result.metadata.fileModified ? ` (修改了 ${result.metadata.fileModified})` : ''}`
          : `❌ ${toolCall.name} 失败: ${result.error}`;
        
        await this.onTextUpdate(successMsg, false);
      }

      return enhancedResult;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorResult: ToolExecutionResult = {
        success: false,
        content: '',
        error: error instanceof Error ? error.message : '未知错误',
        metadata: {
          toolName: toolCall.name,
          executionTime
        }
      };

      this.executionHistory.push(errorResult);
      throw error;
    }
  }

  /**
   * 📝 获取工具操作的描述
   */
  private getToolDescription(toolName: string, params: any): string {
    switch (toolName) {
      case 'read_file':
        return `读取 ${params.file_path}`;
      case 'write_file':
        return `写入 ${params.file_path}`;
      case 'edit_file':
        return `编辑 ${params.file_path}`;
      case 'append_to_file':
        return `追加到 ${params.file_path}`;
      case 'delete_file':
        return `删除 ${params.file_path}`;
      default:
        return `执行 ${toolName}`;
    }
  }

  /**
   * 📊 获取执行统计
   */
  getExecutionStats(): {
    totalTools: number;
    successfulTools: number;
    failedTools: number;
    averageExecutionTime: number;
    fileModifications: number;
  } {
    const total = this.executionHistory.length;
    const successful = this.executionHistory.filter(r => r.success).length;
    const failed = total - successful;
    const avgTime = total > 0 
      ? this.executionHistory.reduce((sum, r) => sum + r.metadata.executionTime, 0) / total 
      : 0;
    const fileModifications = this.executionHistory.filter(r => r.metadata.fileModified).length;

    return {
      totalTools: total,
      successfulTools: successful,
      failedTools: failed,
      averageExecutionTime: Math.round(avgTime),
      fileModifications
    };
  }

  /**
   * 🎯 统一的工具调用处理方法 (兼容原UnifiedToolExecutor)
   */
  async processStreamChunk(accumulatedText: string): Promise<void> {
    // 自动检测格式并选择合适的解析器
    const detectedMode = this.detectFormat(accumulatedText);
    
    console.log(`🔧 [统一执行器] 检测到格式: ${detectedMode}`);
    
    if (detectedMode === 'improved') {
      // 使用改进的解析器 (推荐)
      const processingResult = await this.processIncrementalStreamChunk(accumulatedText, {
        sessionId: 'unified',
        existingFiles: [],
        modifiedFiles: [],
        projectContext: {}
      });
      
      console.log(`🚀 [改进解析器] 执行了 ${processingResult.toolsExecuted} 个工具`);
      
    } else if (detectedMode === 'claude') {
      // 使用传统Claude解析器
      await this.processClaudeStreamChunk(accumulatedText);
      
    } else if (detectedMode === 'xml') {
      // 使用XML解析器
      await this.processXMLStreamChunk(accumulatedText);
    }
  }

  /**
   * 📊 检测响应格式
   */
  private detectFormat(text: string): 'xml' | 'claude' | 'improved' {
    // 优先使用改进的解析器
    if (this.mode === 'improved') {
      return 'improved';
    }
    
    // 检查是否包含Claude工具调用格式
    if (text.includes('"type":"tool_use"') || text.includes('"type": "tool_use"')) {
      return 'claude';
    }
    
    // 检查是否包含XML工具调用格式
    if (text.includes('<write_to_file>') || 
        text.includes('<read_file>') || 
        text.includes('<execute_command>')) {
      return 'xml';
    }
    
    // 默认使用设置的模式
    return this.mode;
  }

  /**
   * 🔧 处理传统Claude流式响应
   */
  private async processClaudeStreamChunk(accumulatedText: string): Promise<void> {
    const contents = this.claudeParser.parseClaudeResponse(accumulatedText);
    
    // 处理新增的内容
    for (let i = this.currentBlockIndex; i < contents.length; i++) {
      const content = contents[i];
      
      if (content.type === "text") {
        if (this.onTextUpdate) {
          await this.onTextUpdate(content.text, false);
        }
      } else if (content.type === "tool_use") {
        await this.processClaudeToolCall(content as ClaudeToolCall);
      }
    }
    
    this.currentBlockIndex = contents.length;
  }

  /**
   * 🔧 处理XML流式响应
   */
  private async processXMLStreamChunk(accumulatedText: string): Promise<void> {
    // 解析当前累积的文本
    const newContentBlocks = this.xmlParser.parseStreamingContent(accumulatedText);
    
    // 处理新增的内容块
    for (let i = this.currentBlockIndex; i < newContentBlocks.length; i++) {
      const block = newContentBlocks[i];
      
      if (block.type === 'text') {
        if (this.onTextUpdate && block.content) {
          await this.onTextUpdate(block.content, block.partial);
        }
      } else if (block.type === 'tool_use') {
        await this.processXMLToolCall(block);
      }
      
      // 只有当块完成时才移动到下一个
      if (!block.partial) {
        this.currentBlockIndex = i + 1;
      }
    }
    
    this.currentContentBlocks = newContentBlocks;
  }

  /**
   * 🔧 处理Claude工具调用
   */
  private async processClaudeToolCall(toolCall: ClaudeToolCall): Promise<void> {
    if (!this.claudeParser.isToolCallComplete(toolCall)) {
      // 工具调用不完整，显示进度
      if (this.onTextUpdate) {
        await this.onTextUpdate(
          `🔧 正在调用工具: ${toolCall.name || '未知工具'}...`,
          true
        );
      }
      return;
    }
    
    // 执行完整的工具调用
    if (this.onToolExecute) {
      try {
        console.log(`🔧 [Claude工具调用] 执行: ${toolCall.name}`, toolCall.input);
        
        const result = await this.onToolExecute(toolCall.name, toolCall.input);
        
        if (this.onToolResult) {
          await this.onToolResult(result);
        }
        
        // 显示工具执行结果
        if (this.onTextUpdate) {
          await this.onTextUpdate(
            `✅ 工具 ${toolCall.name} 执行完成`,
            false
          );
        }
      } catch (error) {
        console.error(`❌ [Claude工具调用失败] ${toolCall.name}:`, error);
        if (this.onTextUpdate) {
          await this.onTextUpdate(
            `❌ 工具 ${toolCall.name} 执行失败: ${error instanceof Error ? error.message : '未知错误'}`,
            false
          );
        }
      }
    }
  }

  /**
   * 🔧 处理XML工具调用
   */
  private async processXMLToolCall(block: StreamingContentBlock): Promise<void> {
    if (!block.toolName || !block.toolParams) return;
    
    if (block.partial) {
      // 显示工具调用进度
      if (this.onTextUpdate) {
        await this.onTextUpdate(
          `🔧 正在调用工具: ${block.toolName}...`,
          true
        );
      }
    } else {
      // 执行完整的工具调用
      if (this.onToolExecute) {
        try {
          const result = await this.onToolExecute(block.toolName, block.toolParams as any);
          
          if (this.onToolResult) {
            await this.onToolResult(result);
          }
          
          // 显示工具执行结果
          if (this.onTextUpdate) {
            await this.onTextUpdate(
              `✅ 工具 ${block.toolName} 执行完成`,
              false
            );
          }
        } catch (error) {
          if (this.onTextUpdate) {
            await this.onTextUpdate(
              `❌ 工具 ${block.toolName} 执行失败: ${error instanceof Error ? error.message : '未知错误'}`,
              false
            );
          }
        }
      }
    }
  }

  /**
   * 🔄 重置执行器状态
   */
  reset(): void {
    this.processedContentLength = 0;
    this.executionHistory = [];
    this.currentBlockIndex = 0;
    this.currentContentBlocks = [];
  }

  /**
   * 🎛️ 设置执行模式
   */
  setMode(mode: 'xml' | 'claude' | 'improved'): void {
    this.mode = mode;
    console.log(`🔧 [执行器] 切换模式为: ${mode}`);
  }

  /**
   * 📈 获取当前处理状态 (兼容原接口)
   */
  getProcessingStatus(): {
    totalBlocks: number;
    currentIndex: number;
    isProcessing: boolean;
  } {
    return {
      totalBlocks: this.currentContentBlocks.length,
      currentIndex: this.currentBlockIndex,
      isProcessing: this.currentBlockIndex < this.currentContentBlocks.length
    };
  }
}

// ===== 导出兼容性接口 =====

/**
 * 🔄 完全兼容原UnifiedToolExecutor的接口
 */
export class UnifiedToolExecutor extends EnhancedIncrementalToolExecutor {
  constructor(options: {
    onTextUpdate?: (text: string, partial: boolean) => void;
    onToolExecute?: (toolName: string, params: Record<string, any>) => Promise<string>;
    onToolResult?: (result: string) => void;
    mode?: 'xml' | 'claude';
  }) {
    // 适配接口差异
    super({
      onTextUpdate: options.onTextUpdate,
      onToolExecute: options.onToolExecute ? async (toolName, params) => {
        const result = await options.onToolExecute!(toolName, params);
        return {
          success: true,
          content: result,
          metadata: {
            toolName,
            executionTime: 0
          }
        };
      } : undefined,
      onToolResult: options.onToolResult ? async (result) => {
        await options.onToolResult!(result.content);
      } : undefined,
      mode: options.mode || 'claude'
    });
  }
}

// ===== 导出其他兼容性接口 =====

export { ClaudeToolParser as ClaudeToolExecutor };
export { StreamingToolParser };
export type { StreamingContentBlock };
