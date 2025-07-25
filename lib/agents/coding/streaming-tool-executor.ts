/**
 * 基于Cline架构的流式工具执行器
 * 实现"输出文本 → 调用工具 → 输出文本 → 调用工具"的流式交互
 */

import { 
  CodingAgentMessage, 
  CodingAgentMessageFactory,
  CodingAgentAsk,
  CodingAgentSay 
} from './types';

// ===== 流式内容类型 =====

export type StreamingContentBlock = {
  type: 'text' | 'tool_use';
  content?: string;
  toolName?: string;
  toolParams?: Record<string, string>;
  partial: boolean;
  index: number;
}

// ===== 工具调用解析器 =====

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

// ===== 流式工具执行器 =====

class StreamingToolExecutor {
  private parser = new StreamingToolParser();
  private currentContentBlocks: StreamingContentBlock[] = [];
  private currentBlockIndex = 0;
  private onTextUpdate?: (text: string, partial: boolean) => void;
  private onToolExecute?: (toolName: string, params: Record<string, string>) => Promise<string>;
  private onToolResult?: (result: string) => void;
  
  constructor(options: {
    onTextUpdate?: (text: string, partial: boolean) => void;
    onToolExecute?: (toolName: string, params: Record<string, string>) => Promise<string>;
    onToolResult?: (result: string) => void;
  }) {
    this.onTextUpdate = options.onTextUpdate;
    this.onToolExecute = options.onToolExecute;
    this.onToolResult = options.onToolResult;
  }
  
  /**
   * 处理流式AI输出块
   */
  async processStreamChunk(accumulatedText: string): Promise<void> {
    // 解析当前累积的文本
    const newContentBlocks = this.parser.parseStreamingContent(accumulatedText);
    
    // 处理新增的内容块
    for (let i = this.currentBlockIndex; i < newContentBlocks.length; i++) {
      const block = newContentBlocks[i];
      
      if (block.type === 'text') {
        await this.processTextBlock(block);
      } else if (block.type === 'tool_use') {
        await this.processToolBlock(block);
      }
      
      // 只有当块完成时才移动到下一个
      if (!block.partial) {
        this.currentBlockIndex = i + 1;
      }
    }
    
    this.currentContentBlocks = newContentBlocks;
  }
  
  private async processTextBlock(block: StreamingContentBlock): Promise<void> {
    if (this.onTextUpdate && block.content) {
      await this.onTextUpdate(block.content, block.partial);
    }
  }
  
  private async processToolBlock(block: StreamingContentBlock): Promise<void> {
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
          const result = await this.onToolExecute(block.toolName, block.toolParams);
          
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
   * 重置执行状态
   */
  reset(): void {
    this.currentContentBlocks = [];
    this.currentBlockIndex = 0;
  }
  
  /**
   * 获取当前处理状态
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

// ===== 新增：Claude JSON格式工具调用解析器 =====

interface ClaudeToolCall {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, any>;
}

interface ClaudeTextContent {
  type: "text";
  text: string;
}

type ClaudeContent = ClaudeToolCall | ClaudeTextContent;

class ClaudeToolParser {
  /**
   * 解析Claude标准的JSON格式工具调用
   */
  parseClaudeResponse(accumulatedText: string): ClaudeContent[] {
    const contents: ClaudeContent[] = [];
    const currentIndex = 0;

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

// ===== 新增：Claude格式工具执行器 =====

class ClaudeToolExecutor {
  private parser = new ClaudeToolParser();
  private processedContentCount = 0;
  private onTextUpdate?: (text: string, partial: boolean) => void;
  private onToolExecute?: (toolName: string, params: Record<string, any>) => Promise<string>;
  private onToolResult?: (result: string) => void;
  
  constructor(options: {
    onTextUpdate?: (text: string, partial: boolean) => void;
    onToolExecute?: (toolName: string, params: Record<string, any>) => Promise<string>;
    onToolResult?: (result: string) => void;
  }) {
    this.onTextUpdate = options.onTextUpdate;
    this.onToolExecute = options.onToolExecute;
    this.onToolResult = options.onToolResult;
  }
  
  /**
   * 处理Claude流式响应
   */
  async processClaudeStreamChunk(accumulatedText: string): Promise<void> {
    const contents = this.parser.parseClaudeResponse(accumulatedText);
    
    // 处理新增的内容
    for (let i = this.processedContentCount; i < contents.length; i++) {
      const content = contents[i];
      
      if (content.type === "text") {
        await this.processTextContent(content);
      } else if (content.type === "tool_use") {
        await this.processToolUseContent(content);
      }
    }
    
    this.processedContentCount = contents.length;
  }
  
  private async processTextContent(content: ClaudeTextContent): Promise<void> {
    if (this.onTextUpdate) {
      await this.onTextUpdate(content.text, false);
    }
  }
  
  private async processToolUseContent(toolCall: ClaudeToolCall): Promise<void> {
    if (!this.parser.isToolCallComplete(toolCall)) {
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
   * 重置处理状态
   */
  reset(): void {
    this.processedContentCount = 0;
  }
}

// ===== 导出统一的工具执行器接口 =====

export class UnifiedToolExecutor {
  private xmlExecutor: StreamingToolExecutor;
  private claudeExecutor: ClaudeToolExecutor;
  private mode: 'xml' | 'claude' = 'claude'; // 默认使用Claude格式
  
  constructor(options: {
    onTextUpdate?: (text: string, partial: boolean) => void;
    onToolExecute?: (toolName: string, params: Record<string, any>) => Promise<string>;
    onToolResult?: (result: string) => void;
    mode?: 'xml' | 'claude';
  }) {
    this.mode = options.mode || 'claude';
    
    // 初始化两种执行器
    this.xmlExecutor = new StreamingToolExecutor(options);
    this.claudeExecutor = new ClaudeToolExecutor(options);
  }
  
  /**
   * 自动检测并处理工具调用
   */
  async processStreamChunk(accumulatedText: string): Promise<void> {
    // 自动检测格式
    const detectedMode = this.detectFormat(accumulatedText);
    
    if (detectedMode === 'claude') {
      await this.claudeExecutor.processClaudeStreamChunk(accumulatedText);
    } else {
      await this.xmlExecutor.processStreamChunk(accumulatedText);
    }
  }
  
  /**
   * 检测响应格式
   */
  private detectFormat(text: string): 'xml' | 'claude' {
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
   * 重置执行器状态
   */
  reset(): void {
    this.claudeExecutor.reset();
    // XML执行器没有reset方法，需要重新创建
  }
  
  /**
   * 设置执行模式
   */
  setMode(mode: 'xml' | 'claude'): void {
    this.mode = mode;
  }
}

// ===== 导出兼容性接口 =====

// 新的推荐接口（UnifiedToolExecutor 已在上面定义并导出）
export { ClaudeToolExecutor };

// ===== 使用示例 =====

/*
// 使用统一工具执行器
const toolExecutor = new UnifiedToolExecutor({
  mode: 'claude', // 或 'xml'
  onTextUpdate: async (text, partial) => {
    console.log('文本更新:', text, partial ? '(部分)' : '(完整)');
  },
  onToolExecute: async (toolName, params) => {
    console.log('执行工具:', toolName, params);
    return await executeActualTool(toolName, params);
  },
  onToolResult: async (result) => {
    console.log('工具结果:', result);
  }
});

// 处理流式响应
let accumulatedResponse = '';
for await (const chunk of aiStreamResponse) {
  accumulatedResponse += chunk;
  await toolExecutor.processStreamChunk(accumulatedResponse);
}
*/

// ===== 使用示例 =====

class CodingAgentWithStreaming {
  private toolExecutor: StreamingToolExecutor;
  private accumulatedResponse = '';
  
  constructor() {
    this.toolExecutor = new StreamingToolExecutor({
      onTextUpdate: async (text, partial) => {
        console.log('📝 文本更新:', text, partial ? '(部分)' : '(完整)');
        // 更新UI显示
      },
      onToolExecute: async (toolName, params) => {
        console.log('🔧 执行工具:', toolName, params);
        // 执行实际的工具操作
        return await this.executeActualTool(toolName, params);
      },
      onToolResult: async (result) => {
        console.log('✅ 工具结果:', result);
        // 处理工具结果
      }
    });
  }
  
  async handleStreamingResponse(chunk: string): Promise<void> {
    this.accumulatedResponse += chunk;
    await this.toolExecutor.processStreamChunk(this.accumulatedResponse);
  }
  
  private async executeActualTool(toolName: string, params: Record<string, string>): Promise<string> {
    // 实现具体的工具执行逻辑
    switch (toolName) {
      case 'write_to_file':
        return await this.writeToFile(params.path, params.content);
      case 'execute_command':
        return await this.executeCommand(params.command);
      case 'read_file':
        return await this.readFile(params.path);
      default:
        throw new Error(`未支持的工具: ${toolName}`);
    }
  }
  
  private async writeToFile(path: string, content: string): Promise<string> {
    // 实现文件写入逻辑
    return `文件 ${path} 写入成功`;
  }
  
  private async executeCommand(command: string): Promise<string> {
    // 实现命令执行逻辑
    return `命令 ${command} 执行成功`;
  }
  
  private async readFile(path: string): Promise<string> {
    // 实现文件读取逻辑
    return `文件 ${path} 内容已读取`;
  }
}

export { StreamingToolParser, StreamingToolExecutor, CodingAgentWithStreaming }; 