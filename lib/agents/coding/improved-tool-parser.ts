/**
 * 改进的Claude工具调用解析器 - 解决增量修改中的工具调用识别问题
 */

interface ImprovedClaudeToolCall {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, any>;
  _partial?: boolean; // 标记是否为部分工具调用
}

interface ToolCallState {
  isInToolCall: boolean;
  currentTool: Partial<ImprovedClaudeToolCall> | null;
  buffer: string;
  startPosition: number;
}

export class ImprovedClaudeToolParser {
  private state: ToolCallState = {
    isInToolCall: false,
    currentTool: null,
    buffer: '',
    startPosition: 0
  };

  /**
   * 🔧 改进的流式工具调用解析
   * 解决原版本可能遗漏的工具调用问题
   */
  parseClaudeStreamingResponse(accumulatedText: string): {
    textBlocks: Array<{type: "text", text: string}>;
    toolCalls: Array<ImprovedClaudeToolCall>;
    hasPartialTool: boolean;
  } {
    const textBlocks: Array<{type: "text", text: string}> = [];
    const toolCalls: Array<ImprovedClaudeToolCall> = [];
    let hasPartialTool = false;

    // 🆕 使用状态机方式解析，更精确
    const lines = accumulatedText.split('\n');
    let currentTextBuffer = '';
    let i = 0;

    while (i < lines.length) {
      const line = lines[i].trim();
      
      // 🔍 检测工具调用开始的多种模式
      const toolCallMatch = this.detectToolCallStart(line);
      
      if (toolCallMatch) {
        // 保存之前累积的文本
        if (currentTextBuffer.trim()) {
          textBlocks.push({
            type: "text",
            text: currentTextBuffer.trim()
          });
          currentTextBuffer = '';
        }

        // 🔧 解析工具调用（支持多行和不完整的JSON）
        const { toolCall, consumed, isPartial } = this.parseToolCallFromLines(lines, i);
        
        if (toolCall) {
          if (isPartial) {
            hasPartialTool = true;
            console.log(`🔄 [工具解析] 检测到部分工具调用: ${toolCall.name || '未知'}`);
          } else {
            toolCalls.push(toolCall as ImprovedClaudeToolCall);
            console.log(`✅ [工具解析] 完整工具调用: ${toolCall.name}`, toolCall.input);
          }
        }
        
        i += consumed;
      } else {
        // 累积普通文本
        currentTextBuffer += lines[i] + '\n';
        i++;
      }
    }

    // 添加剩余文本
    if (currentTextBuffer.trim()) {
      textBlocks.push({
        type: "text",
        text: currentTextBuffer.trim()
      });
    }

    return { textBlocks, toolCalls, hasPartialTool };
  }

  /**
   * 🔍 检测工具调用开始的多种模式
   */
  private detectToolCallStart(line: string): boolean {
    const patterns = [
      /^\s*\{\s*"type"\s*:\s*"tool_use"/,     // 标准格式
      /^\s*\{\s*type\s*:\s*"tool_use"/,       // 无引号键
      /^\s*"type"\s*:\s*"tool_use"/,          // 部分JSON
    ];

    return patterns.some(pattern => pattern.test(line));
  }

  /**
   * 🔧 从多行中解析工具调用
   */
  private parseToolCallFromLines(
    lines: string[], 
    startIndex: number
  ): { 
    toolCall: Partial<ImprovedClaudeToolCall> | null; 
    consumed: number; 
    isPartial: boolean 
  } {
    let jsonBuffer = '';
    let braceCount = 0;
    let consumed = 0;
    let hasStarted = false;

    // 🔧 累积JSON直到找到完整的对象
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      jsonBuffer += line + '\n';
      consumed++;

      // 计算大括号数量
      for (const char of line) {
        if (char === '{') {
          braceCount++;
          hasStarted = true;
        } else if (char === '}') {
          braceCount--;
        }
      }

      // 🎯 检查是否找到完整的JSON对象
      if (hasStarted && braceCount === 0) {
        try {
          const parsed = JSON.parse(jsonBuffer.trim());
          if (this.isValidToolCall(parsed)) {
            return { 
              toolCall: parsed as ImprovedClaudeToolCall, 
              consumed, 
              isPartial: false 
            };
          }
        } catch (e) {
          // JSON解析失败，继续累积
        }
      }

      // 🚨 防止无限累积
      if (consumed > 50) {
        console.warn(`⚠️ [工具解析] 超过50行限制，停止解析`);
        break;
      }
    }

    // 🔄 如果没有找到完整的工具调用，尝试解析部分信息
    if (hasStarted) {
      const partialTool = this.extractPartialToolInfo(jsonBuffer);
      return { 
        toolCall: partialTool, 
        consumed, 
        isPartial: true 
      };
    }

    return { toolCall: null, consumed: 1, isPartial: false };
  }

  /**
   * ✅ 验证工具调用对象是否完整
   */
  private isValidToolCall(obj: any): boolean {
    return obj && 
           typeof obj === 'object' &&
           obj.type === 'tool_use' &&
           typeof obj.id === 'string' &&
           typeof obj.name === 'string' &&
           obj.input !== undefined;
  }

  /**
   * 🔄 从不完整的JSON中提取部分工具信息
   */
  private extractPartialToolInfo(jsonBuffer: string): Partial<ImprovedClaudeToolCall> | null {
    try {
      // 尝试提取关键字段
      const nameMatch = jsonBuffer.match(/"name"\s*:\s*"([^"]+)"/);
      const idMatch = jsonBuffer.match(/"id"\s*:\s*"([^"]+)"/);
      
      if (nameMatch) {
        return {
          type: "tool_use",
          name: nameMatch[1],
          id: idMatch?.[1] || 'partial',
          input: {},
          _partial: true
        };
      }
    } catch (e) {
      console.warn('⚠️ [工具解析] 部分信息提取失败:', e);
    }

    return null;
  }
}
