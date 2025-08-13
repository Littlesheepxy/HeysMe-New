/**
 * 兼容性接口文件
 * 为了保持向后兼容，重新导出新的增强执行器
 * 
 * @deprecated 请使用 enhanced-tool-executor.ts 中的新接口
 */

// 重新导出所有内容
export {
  UnifiedToolExecutor,
  EnhancedIncrementalToolExecutor as StreamingToolExecutor,
  ClaudeToolExecutor,
  StreamingToolParser
} from './enhanced-tool-executor';

export type { StreamingContentBlock } from './enhanced-tool-executor';

// 保持原有的CodingAgentWithStreaming示例
export class CodingAgentWithStreaming {
  private toolExecutor: any;
  private accumulatedResponse = '';
  
  constructor() {
    const { UnifiedToolExecutor } = require('./enhanced-tool-executor');
    this.toolExecutor = new UnifiedToolExecutor({
      onTextUpdate: async (text: string, partial: boolean) => {
        console.log('📝 文本更新:', text, partial ? '(部分)' : '(完整)');
        // 更新UI显示
      },
      onToolExecute: async (toolName: string, params: Record<string, any>) => {
        console.log('🔧 执行工具:', toolName, params);
        // 执行实际的工具操作
        return await this.executeActualTool(toolName, params);
      },
      onToolResult: async (result: string) => {
        console.log('✅ 工具结果:', result);
        // 处理工具结果
      }
    });
  }
  
  async handleStreamingResponse(chunk: string): Promise<void> {
    this.accumulatedResponse += chunk;
    await this.toolExecutor.processStreamChunk(this.accumulatedResponse);
  }
  
  private async executeActualTool(toolName: string, params: Record<string, any>): Promise<string> {
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