/**
 * Cline Integration Adapter
 * 将Cline的核心agent功能集成到HeysMe项目中
 */

import { WebContainer } from '@webcontainer/api';
import { Monaco } from '@monaco-editor/react';

// 从Cline项目中提取的核心类型
export interface ClineCodeFile {
  filename: string;
  content: string;
  language: string;
  type: 'component' | 'page' | 'styles' | 'config' | 'data';
  description?: string;
  editable?: boolean;
}

export interface ClineTask {
  id: string;
  instruction: string;
  files?: string[];
  images?: string[];
  context?: string;
  workingDirectory: string;
}

export interface ClineToolResponse {
  success: boolean;
  result?: string;
  error?: string;
  filesModified?: string[];
  filesCreated?: string[];
  filesDeleted?: string[];
}

// 模拟VSCode环境的上下文
class MockVSCodeContext {
  private globalState = new Map<string, any>();
  private workspaceState = new Map<string, any>();
  private secrets = new Map<string, any>();

  constructor(private workspaceRoot: string) {}

  // 全局状态管理
  getGlobalState(key: string): any {
    return this.globalState.get(key);
  }

  setGlobalState(key: string, value: any): void {
    this.globalState.set(key, value);
  }

  // 工作空间状态管理
  getWorkspaceState(key: string): any {
    return this.workspaceState.get(key);
  }

  setWorkspaceState(key: string, value: any): void {
    this.workspaceState.set(key, value);
  }

  // 密钥管理
  getSecret(key: string): any {
    return this.secrets.get(key);
  }

  setSecret(key: string, value: any): void {
    this.secrets.set(key, value);
  }

  // 工作空间路径
  get workspaceUri() {
    return { fsPath: this.workspaceRoot };
  }

  // 扩展路径
  get extensionUri() {
    return { fsPath: this.workspaceRoot };
  }
}

// Cline工具集适配器
export class ClineToolsAdapter {
  private context: MockVSCodeContext;
  private webContainer?: WebContainer;
  private onFileChange?: (files: ClineCodeFile[]) => void;
  private onOutput?: (output: string) => void;

  constructor(
    workspaceRoot: string,
    options: {
      webContainer?: WebContainer;
      onFileChange?: (files: ClineCodeFile[]) => void;
      onOutput?: (output: string) => void;
    } = {}
  ) {
    this.context = new MockVSCodeContext(workspaceRoot);
    this.webContainer = options.webContainer;
    this.onFileChange = options.onFileChange;
    this.onOutput = options.onOutput;
  }

  // 文件读取工具
  async readFile(filePath: string): Promise<ClineToolResponse> {
    try {
      let content: string;
      
      if (this.webContainer) {
        // 从WebContainer读取
        content = await this.webContainer.fs.readFile(filePath, 'utf-8');
      } else {
        // 模拟读取（实际项目中可能从其他存储读取）
        content = `// 模拟读取的文件内容: ${filePath}`;
      }

      this.log(`📖 读取文件: ${filePath}`);
      return {
        success: true,
        result: content
      };
    } catch (error) {
      return {
        success: false,
        error: `读取文件失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  // 文件写入工具
  async writeFile(filePath: string, content: string): Promise<ClineToolResponse> {
    try {
      if (this.webContainer) {
        // 写入WebContainer
        await this.webContainer.fs.writeFile(filePath, content);
      }

      // 通知文件变更
      if (this.onFileChange) {
        const file: ClineCodeFile = {
          filename: filePath,
          content,
          language: this.getLanguageFromPath(filePath),
          type: this.getFileType(filePath),
          editable: true
        };
        this.onFileChange([file]);
      }

      this.log(`💾 写入文件: ${filePath}`);
      return {
        success: true,
        result: '文件写入成功',
        filesModified: [filePath]
      };
    } catch (error) {
      return {
        success: false,
        error: `写入文件失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  // 文件编辑工具（支持部分编辑）
  async editFile(filePath: string, edits: Array<{
    startLine: number;
    endLine: number;
    content: string;
  }>): Promise<ClineToolResponse> {
    try {
      // 先读取原文件
      const readResult = await this.readFile(filePath);
      if (!readResult.success) {
        return readResult;
      }

      const lines = readResult.result!.split('\n');
      
      // 应用编辑（从后往前应用，避免行号偏移）
      const sortedEdits = edits.sort((a, b) => b.startLine - a.startLine);
      
      for (const edit of sortedEdits) {
        const newLines = edit.content.split('\n');
        lines.splice(edit.startLine - 1, edit.endLine - edit.startLine + 1, ...newLines);
      }

      const newContent = lines.join('\n');
      return await this.writeFile(filePath, newContent);
    } catch (error) {
      return {
        success: false,
        error: `编辑文件失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  // 命令执行工具
  async executeCommand(command: string): Promise<ClineToolResponse> {
    try {
      this.log(`🔧 执行命令: ${command}`);
      
      if (this.webContainer) {
        // 在WebContainer中执行
        const process = await this.webContainer.spawn('bash', ['-c', command]);
        
        let output = '';
        const error = '';
        
        process.output.pipeTo(new WritableStream({
          write(chunk) {
            output += chunk;
          }
        }));
        
        const exitCode = await process.exit;
        
        if (this.onOutput) {
          this.onOutput(output);
        }
        
        return {
          success: exitCode === 0,
          result: output,
          error: exitCode !== 0 ? error : undefined
        };
      } else {
        // 模拟执行结果
        const simulatedOutput = `模拟执行命令: ${command}\n执行成功`;
        if (this.onOutput) {
          this.onOutput(simulatedOutput);
        }
        
        return {
          success: true,
          result: simulatedOutput
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `命令执行失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  // 文件列表工具
  async listFiles(dirPath: string = '.'): Promise<ClineToolResponse> {
    try {
      this.log(`📁 列出目录: ${dirPath}`);
      
      if (this.webContainer) {
        const files = await this.webContainer.fs.readdir(dirPath, { withFileTypes: true });
        const fileList = files.map(file => ({
          name: file.name,
          isDirectory: file.isDirectory(),
          isFile: file.isFile()
        }));
        
        return {
          success: true,
          result: JSON.stringify(fileList, null, 2)
        };
      } else {
        // 模拟文件列表
        const mockFiles = [
          { name: 'src', isDirectory: true, isFile: false },
          { name: 'package.json', isDirectory: false, isFile: true },
          { name: 'README.md', isDirectory: false, isFile: true }
        ];
        
        return {
          success: true,
          result: JSON.stringify(mockFiles, null, 2)
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `列出文件失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  // 搜索工具
  async searchInFiles(pattern: string, filePattern?: string): Promise<ClineToolResponse> {
    try {
      this.log(`🔍 搜索: ${pattern} in ${filePattern || '*'}`);
      
      // 模拟搜索结果
      const mockResults = [
        { file: 'src/components/App.tsx', line: 10, content: `匹配的代码行包含: ${pattern}` },
        { file: 'src/utils/helper.ts', line: 25, content: `另一个匹配: ${pattern}` }
      ];
      
      return {
        success: true,
        result: JSON.stringify(mockResults, null, 2)
      };
    } catch (error) {
      return {
        success: false,
        error: `搜索失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  // 任务完成工具
  async attemptCompletion(summary: string): Promise<ClineToolResponse> {
    this.log(`✅ 任务完成: ${summary}`);
    
    return {
      success: true,
      result: `任务已完成: ${summary}`
    };
  }

  // 辅助方法
  private getLanguageFromPath(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'tsx':
      case 'jsx':
        return 'typescript';
      case 'ts':
        return 'typescript';
      case 'js':
        return 'javascript';
      case 'css':
        return 'css';
      case 'scss':
        return 'scss';
      case 'json':
        return 'json';
      case 'md':
        return 'markdown';
      default:
        return 'plaintext';
    }
  }

  private getFileType(filePath: string): ClineCodeFile['type'] {
    if (filePath.includes('component')) return 'component';
    if (filePath.includes('page')) return 'page';
    if (filePath.includes('style') || filePath.endsWith('.css') || filePath.endsWith('.scss')) return 'styles';
    if (filePath.includes('config') || filePath.endsWith('.json')) return 'config';
    return 'data';
  }

  private log(message: string): void {
    console.log(`[ClineTools] ${message}`);
    if (this.onOutput) {
      this.onOutput(message);
    }
  }
}

// 主要的Cline集成适配器
export class ClineIntegrationAdapter {
  private toolsAdapter: ClineToolsAdapter;
  private apiProvider: string;
  private apiKey: string;
  private currentTask?: ClineTask;

  constructor(
    workspaceRoot: string,
    options: {
      apiProvider: string;
      apiKey: string;
      webContainer?: WebContainer;
      onFileChange?: (files: ClineCodeFile[]) => void;
      onOutput?: (output: string) => void;
    }
  ) {
    this.apiProvider = options.apiProvider;
    this.apiKey = options.apiKey;
    this.toolsAdapter = new ClineToolsAdapter(workspaceRoot, {
      webContainer: options.webContainer,
      onFileChange: options.onFileChange,
      onOutput: options.onOutput
    });
  }

  // 初始化任务
  async initTask(instruction: string, files?: string[], images?: string[]): Promise<ClineTask> {
    const task: ClineTask = {
      id: Date.now().toString(),
      instruction,
      files,
      images,
      workingDirectory: '.'
    };

    this.currentTask = task;
    this.log(`🚀 初始化任务: ${instruction}`);
    
    return task;
  }

  // 处理用户消息
  async handleUserMessage(message: string): Promise<string> {
    this.log(`💬 用户消息: ${message}`);
    
    // 这里集成您现有的AI系统，调用OpenAI/Claude API
    // 模拟AI响应和工具调用
    
    const response = await this.processWithAI(message);
    return response;
  }

  // 处理AI响应和工具调用
  private async processWithAI(message: string): Promise<string> {
    // 这里是关键集成点 - 调用您现有的AI系统
    // 可以复用您项目中的AI服务
    
    // 模拟AI决策使用哪些工具
    if (message.includes('创建文件') || message.includes('写入文件')) {
      return await this.handleFileCreation(message);
    } else if (message.includes('修改文件') || message.includes('编辑文件')) {
      return await this.handleFileEditing(message);
    } else if (message.includes('执行命令') || message.includes('运行')) {
      return await this.handleCommandExecution(message);
    } else if (message.includes('搜索') || message.includes('查找')) {
      return await this.handleSearch(message);
    }
    
    return '我理解了您的需求，正在处理中...';
  }

  // 处理文件创建
  private async handleFileCreation(message: string): Promise<string> {
    // 解析消息，提取文件名和内容
    const fileName = this.extractFileName(message);
    const content = this.extractContent(message);
    
    if (fileName && content) {
      const result = await this.toolsAdapter.writeFile(fileName, content);
      return result.success ? `✅ 文件 ${fileName} 创建成功` : `❌ 创建失败: ${result.error}`;
    }
    
    return '请提供文件名和内容';
  }

  // 处理文件编辑
  private async handleFileEditing(message: string): Promise<string> {
    const fileName = this.extractFileName(message);
    
    if (fileName) {
      // 这里可以集成更复杂的编辑逻辑
      const result = await this.toolsAdapter.readFile(fileName);
      return result.success ? `📖 已读取文件 ${fileName}` : `❌ 读取失败: ${result.error}`;
    }
    
    return '请提供要编辑的文件名';
  }

  // 处理命令执行
  private async handleCommandExecution(message: string): Promise<string> {
    const command = this.extractCommand(message);
    
    if (command) {
      const result = await this.toolsAdapter.executeCommand(command);
      return result.success ? `✅ 命令执行成功:\n${result.result}` : `❌ 执行失败: ${result.error}`;
    }
    
    return '请提供要执行的命令';
  }

  // 处理搜索
  private async handleSearch(message: string): Promise<string> {
    const pattern = this.extractSearchPattern(message);
    
    if (pattern) {
      const result = await this.toolsAdapter.searchInFiles(pattern);
      return result.success ? `🔍 搜索结果:\n${result.result}` : `❌ 搜索失败: ${result.error}`;
    }
    
    return '请提供搜索关键词';
  }

  // 辅助方法 - 提取文件名
  private extractFileName(message: string): string | null {
    const match = message.match(/(?:创建|写入|修改|编辑)\s*(?:文件\s*)?([^\s]+\.[a-zA-Z]+)/);
    return match ? match[1] : null;
  }

  // 辅助方法 - 提取内容
  private extractContent(message: string): string | null {
    const match = message.match(/内容[:：]\s*(.+)/);
    return match ? match[1].trim() : null;
  }

  // 辅助方法 - 提取命令
  private extractCommand(message: string): string | null {
    const match = message.match(/(?:执行|运行)\s*(?:命令\s*)?[:：]?\s*(.+)/);
    return match ? match[1].trim() : null;
  }

  // 辅助方法 - 提取搜索模式
  private extractSearchPattern(message: string): string | null {
    const match = message.match(/(?:搜索|查找)\s*[:：]?\s*(.+)/);
    return match ? match[1].trim() : null;
  }

  private log(message: string): void {
    console.log(`[ClineAdapter] ${message}`);
  }
}

// 导出主要类
export { ClineIntegrationAdapter as ClineAdapter };
export { ClineToolsAdapter as ClineTools };
export { MockVSCodeContext }; 