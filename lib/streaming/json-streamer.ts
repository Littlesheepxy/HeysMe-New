import { StreamChunk, StreamableAgentResponse } from '@/lib/types/streaming';

export class JSONStreamer {
  private buffer: string = '';
  private depth: number = 0;
  private inString: boolean = false;
  private escaped: boolean = false;
  private currentPath: string[] = [];
  private callbacks: Map<string, (chunk: StreamChunk) => void> = new Map();

  constructor() {
    this.reset();
  }

  /**
   * 重置流处理器状态
   */
  reset(): void {
    this.buffer = '';
    this.depth = 0;
    this.inString = false;
    this.escaped = false;
    this.currentPath = [];
  }

  /**
   * 注册路径监听回调
   */
  onPath(path: string, callback: (chunk: StreamChunk) => void): void {
    this.callbacks.set(path, callback);
  }

  /**
   * 移除路径监听
   */
  offPath(path: string): void {
    this.callbacks.delete(path);
  }

  /**
   * 处理新的数据块
   */
  processChunk(chunk: string): StreamChunk[] {
    this.buffer += chunk;
    const results: StreamChunk[] = [];

    try {
      // 尝试解析完整的JSON
      const parsed = this.tryParseComplete();
      if (parsed) {
        results.push({
          type: 'complete',
          value: parsed,
          partial: false
        });
        this.reset();
        return results;
      }

      // 尝试部分解析
      const partialResults = this.tryParsePartial();
      results.push(...partialResults);

    } catch (error) {
      results.push({
        type: 'error',
        value: error instanceof Error ? error.message : 'Unknown parsing error'
      });
    }

    return results;
  }

  /**
   * 尝试解析完整JSON
   */
  private tryParseComplete(): any {
    if (!this.buffer.trim()) return null;
    
    try {
      return JSON.parse(this.buffer);
    } catch {
      return null;
    }
  }

  /**
   * 尝试部分解析
   */
  private tryParsePartial(): StreamChunk[] {
    const results: StreamChunk[] = [];
    let i = 0;
    
    while (i < this.buffer.length) {
      const char = this.buffer[i];
      
      if (this.inString) {
        if (this.escaped) {
          this.escaped = false;
        } else if (char === '\\') {
          this.escaped = true;
        } else if (char === '"') {
          this.inString = false;
          // 尝试提取字符串值
          const stringValue = this.extractStringValue(i);
          if (stringValue) {
            results.push({
              type: 'data',
              path: [...this.currentPath],
              value: stringValue,
              partial: true
            });
          }
        }
      } else {
        switch (char) {
          case '"':
            this.inString = true;
            break;
          case '{':
            this.depth++;
            this.currentPath.push('object');
            break;
          case '}':
            this.depth--;
            this.currentPath.pop();
            break;
          case '[':
            this.depth++;
            this.currentPath.push('array');
            break;
          case ']':
            this.depth--;
            this.currentPath.pop();
            break;
          case ':':
            // 处理键值对
            const key = this.extractRecentKey(i);
            if (key) {
              this.currentPath.push(key);
            }
            break;
          case ',':
            // 完成当前值的处理
            if (this.currentPath.length > 0) {
              this.currentPath.pop();
            }
            break;
        }
      }
      
      i++;
    }

    return results;
  }

  /**
   * 提取字符串值
   */
  private extractStringValue(endIndex: number): string | null {
    let startIndex = endIndex;
    
    // 向后查找字符串开始位置
    while (startIndex > 0 && this.buffer[startIndex] !== '"') {
      startIndex--;
    }
    
    if (startIndex === 0) return null;
    
    try {
      return this.buffer.slice(startIndex + 1, endIndex);
    } catch {
      return null;
    }
  }

  /**
   * 提取最近的键名
   */
  private extractRecentKey(colonIndex: number): string | null {
    let startIndex = colonIndex - 1;
    
    // 跳过空白字符
    while (startIndex >= 0 && /\s/.test(this.buffer[startIndex])) {
      startIndex--;
    }
    
    if (startIndex < 0 || this.buffer[startIndex] !== '"') return null;
    
    let keyStart = startIndex - 1;
    while (keyStart >= 0 && this.buffer[keyStart] !== '"') {
      keyStart--;
    }
    
    if (keyStart < 0) return null;
    
    return this.buffer.slice(keyStart + 1, startIndex);
  }

  /**
   * 发出事件给监听器
   */
  private emit(chunk: StreamChunk): void {
    const pathStr = chunk.path?.join('.') || '';
    const callback = this.callbacks.get(pathStr);
    if (callback) {
      callback(chunk);
    }
    
    // 也发送给通用监听器
    const generalCallback = this.callbacks.get('*');
    if (generalCallback) {
      generalCallback(chunk);
    }
  }
}

/**
 * Agent响应流处理器
 */
export class AgentResponseStreamer {
  private jsonStreamer: JSONStreamer;
  private currentResponse: Partial<StreamableAgentResponse> = {};
  private onUpdateCallback?: (response: Partial<StreamableAgentResponse>) => void;

  constructor() {
    this.jsonStreamer = new JSONStreamer();
    this.setupListeners();
  }

  /**
   * 设置更新回调
   */
  onUpdate(callback: (response: Partial<StreamableAgentResponse>) => void): void {
    this.onUpdateCallback = callback;
  }

  /**
   * 处理新的流数据
   */
  processStream(chunk: string): void {
    const results = this.jsonStreamer.processChunk(chunk);
    
    results.forEach(result => {
      this.handleStreamChunk(result);
    });
  }

  /**
   * 重置流处理器
   */
  reset(): void {
    this.jsonStreamer.reset();
    this.currentResponse = {};
  }

  /**
   * 设置流监听器
   */
  private setupListeners(): void {
    // 监听立即显示内容
    this.jsonStreamer.onPath('immediate_display.reply', (chunk) => {
      if (!this.currentResponse.immediate_display) {
        this.currentResponse.immediate_display = { reply: '' };
      }
      this.currentResponse.immediate_display.reply = chunk.value;
      this.notifyUpdate();
    });

    // 监听交互元素
    this.jsonStreamer.onPath('interaction', (chunk) => {
      this.currentResponse.interaction = chunk.value;
      this.notifyUpdate();
    });

    // 监听系统状态
    this.jsonStreamer.onPath('system_state', (chunk) => {
      this.currentResponse.system_state = chunk.value;
      this.notifyUpdate();
    });

    // 监听会话上下文
    this.jsonStreamer.onPath('session_context', (chunk) => {
      this.currentResponse.session_context = chunk.value;
      this.notifyUpdate();
    });

    // 监听完整响应
    this.jsonStreamer.onPath('*', (chunk) => {
      if (chunk.type === 'complete') {
        this.currentResponse = chunk.value;
        this.notifyUpdate();
      }
    });
  }

  /**
   * 处理流数据块
   */
  private handleStreamChunk(chunk: StreamChunk): void {
    switch (chunk.type) {
      case 'start':
        this.currentResponse = {};
        break;
      
      case 'data':
        this.updateResponseWithPath(chunk.path || [], chunk.value);
        break;
      
      case 'complete':
        this.currentResponse = chunk.value;
        this.notifyUpdate();
        break;
      
      case 'error':
        console.error('Stream parsing error:', chunk.value);
        break;
    }
  }

  /**
   * 根据路径更新响应对象
   */
  private updateResponseWithPath(path: string[], value: any): void {
    let current: any = this.currentResponse;
    
    for (let i = 0; i < path.length - 1; i++) {
      const key = path[i];
      if (!(key in current)) {
        current[key] = {};
      }
      current = current[key];
    }
    
    if (path.length > 0) {
      current[path[path.length - 1]] = value;
    }
    
    this.notifyUpdate();
  }

  /**
   * 通知更新
   */
  private notifyUpdate(): void {
    if (this.onUpdateCallback) {
      this.onUpdateCallback({ ...this.currentResponse });
    }
  }

  /**
   * 获取当前响应
   */
  getCurrentResponse(): Partial<StreamableAgentResponse> {
    return { ...this.currentResponse };
  }
}

/**
 * 创建SSE (Server-Sent Events) 流处理器
 */
export function createSSEProcessor(
  url: string,
  onMessage: (response: Partial<StreamableAgentResponse>) => void,
  onError?: (error: Error) => void,
  onComplete?: () => void
): { start: () => void; stop: () => void } {
  let eventSource: EventSource | null = null;
  const streamer = new AgentResponseStreamer();
  
  streamer.onUpdate(onMessage);

  return {
    start: () => {
      if (eventSource) {
        eventSource.close();
      }

      eventSource = new EventSource(url);
      
      eventSource.onmessage = (event) => {
        try {
          streamer.processStream(event.data);
        } catch (error) {
          onError?.(error instanceof Error ? error : new Error('Stream processing error'));
        }
      };

      eventSource.onerror = (event) => {
        onError?.(new Error('EventSource error'));
      };

      eventSource.addEventListener('complete', () => {
        onComplete?.();
        eventSource?.close();
      });
    },

    stop: () => {
      eventSource?.close();
      eventSource = null;
      streamer.reset();
    }
  };
}

export interface StreamingFile {
  filename: string;
  content: string;
  language?: string;
  type?: string;
  description?: string;
  status: 'pending' | 'streaming' | 'completed' | 'error';
  progress: number;
}

export interface StreamingParseResult {
  files: StreamingFile[];
  hasNewFile: boolean;
  hasContentUpdate: boolean;
  isComplete: boolean;
  rawText: string; // 非JSON的纯文本内容
  newFileIndex?: number;
  updatedFileIndex?: number;
}

export class JSONStreamParser {
  private buffer: string = '';
  private files: StreamingFile[] = [];
  private rawTextBuffer: string = '';
  private isInJsonBlock: boolean = false;
  private jsonStartIndex: number = -1;

  processChunk(chunk: string): StreamingParseResult {
    this.buffer += chunk;
    
    const result: StreamingParseResult = {
      files: [...this.files],
      hasNewFile: false,
      hasContentUpdate: false,
      isComplete: false,
      rawText: this.rawTextBuffer
    };

    // 检查是否进入JSON块
    if (!this.isInJsonBlock) {
      const jsonStart = this.buffer.indexOf('{');
      if (jsonStart !== -1) {
        // 保存JSON之前的文本作为rawText
        this.rawTextBuffer += this.buffer.substring(0, jsonStart);
        this.buffer = this.buffer.substring(jsonStart);
        this.isInJsonBlock = true;
        this.jsonStartIndex = 0;
        result.rawText = this.rawTextBuffer;
      } else {
        // 全部都是普通文本
        this.rawTextBuffer += chunk;
        result.rawText = this.rawTextBuffer;
        return result;
      }
    }

    // 尝试解析JSON中的文件信息
    this.parseFilesFromJSON(result);
    
    return result;
  }

  private parseFilesFromJSON(result: StreamingParseResult): void {
    try {
      // 尝试找到files数组的开始
      const filesArrayMatch = this.buffer.match(/"files"\s*:\s*\[/);
      if (!filesArrayMatch) return;

      const filesStartIndex = this.buffer.indexOf(filesArrayMatch[0]) + filesArrayMatch[0].length;
      let currentIndex = filesStartIndex;
      
      // 解析文件对象
      while (currentIndex < this.buffer.length) {
        // 查找文件对象的开始
        const objectStart = this.buffer.indexOf('{', currentIndex);
        if (objectStart === -1) break;

        // 尝试提取文件信息
        const fileInfo = this.extractFileInfo(objectStart);
        if (fileInfo) {
          this.updateOrAddFile(fileInfo, result);
          currentIndex = objectStart + 1;
        } else {
          break;
        }
      }

      // 检查JSON是否完整
      if (this.buffer.includes('}]')) {
        result.isComplete = true;
      }

    } catch (error) {
      console.log('🔍 [JSON解析] 解析过程中出现错误:', error);
    }
  }

  private extractFileInfo(startIndex: number): Partial<StreamingFile> | null {
    try {
      // 查找filename字段
      const filenameMatch = this.buffer.substring(startIndex).match(/"filename"\s*:\s*"([^"]+)"/);
      if (!filenameMatch) return null;

      const filename = filenameMatch[1];
      
      // 查找content字段
      const contentMatch = this.buffer.substring(startIndex).match(/"content"\s*:\s*"((?:[^"\\]|\\.)*)"/);
      let content = '';
      
      if (contentMatch) {
        // 解码转义字符
        content = contentMatch[1]
          .replace(/\\n/g, '\n')
          .replace(/\\t/g, '\t')
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\');
      } else {
        // 如果没有完整的content字段，尝试提取部分内容
        const partialContentMatch = this.buffer.substring(startIndex).match(/"content"\s*:\s*"([^"]*)/);
        if (partialContentMatch) {
          content = partialContentMatch[1]
            .replace(/\\n/g, '\n')
            .replace(/\\t/g, '\t')
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, '\\');
        }
      }

      // 查找其他字段
      const languageMatch = this.buffer.substring(startIndex).match(/"language"\s*:\s*"([^"]+)"/);
      const typeMatch = this.buffer.substring(startIndex).match(/"type"\s*:\s*"([^"]+)"/);
      const descriptionMatch = this.buffer.substring(startIndex).match(/"description"\s*:\s*"([^"]+)"/);

      return {
        filename,
        content,
        language: languageMatch?.[1] || this.getLanguageFromFilename(filename),
        type: typeMatch?.[1] || this.getFileType(filename),
        description: descriptionMatch?.[1] || `正在生成 ${filename}`
      };

    } catch (error) {
      console.log('🔍 [文件信息提取] 提取失败:', error);
      return null;
    }
  }

  private updateOrAddFile(fileInfo: Partial<StreamingFile>, result: StreamingParseResult): void {
    if (!fileInfo.filename) return;

    const existingIndex = this.files.findIndex(f => f.filename === fileInfo.filename);
    
    if (existingIndex === -1) {
      // 新文件
      const newFile: StreamingFile = {
        filename: fileInfo.filename,
        content: fileInfo.content || '',
        status: 'streaming',
        progress: fileInfo.content ? Math.min(95, (fileInfo.content.length / 1000) * 100) : 0,
        language: fileInfo.language || this.getLanguageFromFilename(fileInfo.filename),
        type: fileInfo.type || this.getFileType(fileInfo.filename),
        description: fileInfo.description || `正在生成 ${fileInfo.filename}`
      };
      
      this.files.push(newFile);
      result.hasNewFile = true;
      result.newFileIndex = this.files.length - 1;
      
      console.log(`🆕 [JSON流解析] 发现新文件: ${fileInfo.filename}, 内容长度: ${newFile.content.length}`);
    } else {
      // 更新现有文件
      const existingFile = this.files[existingIndex];
      const newContent = fileInfo.content || '';
      
      if (newContent !== existingFile.content) {
        existingFile.content = newContent;
        existingFile.status = 'streaming';
        existingFile.progress = Math.min(95, (newContent.length / 1000) * 100);
        
        result.hasContentUpdate = true;
        result.updatedFileIndex = existingIndex;
        
        console.log(`📝 [JSON流解析] 更新文件内容: ${fileInfo.filename}, 新长度: ${newContent.length}`);
      }
    }
  }

  private getLanguageFromFilename(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      'ts': 'typescript',
      'tsx': 'typescript',
      'js': 'javascript',
      'jsx': 'javascript',
      'json': 'json',
      'css': 'css',
      'html': 'html',
      'md': 'markdown',
      'yml': 'yaml',
      'yaml': 'yaml'
    };
    return langMap[ext || ''] || 'text';
  }

  private getFileType(filename: string): string {
    if (filename.includes('component') || filename.endsWith('.tsx') || filename.endsWith('.jsx')) {
      return 'component';
    }
    if (filename.includes('config') || filename.endsWith('.config.js') || filename.endsWith('.config.ts')) {
      return 'config';
    }
    if (filename.endsWith('.css') || filename.endsWith('.scss')) {
      return 'style';
    }
    if (filename.endsWith('.json')) {
      return 'config';
    }
    if (filename.endsWith('.md')) {
      return 'documentation';
    }
    return 'code';
  }

  /**
   * 标记文件为完成状态
   */
  markFileComplete(filename: string): void {
    const file = this.files.find(f => f.filename === filename);
    if (file) {
      file.status = 'completed';
      file.progress = 100;
    }
  }

  /**
   * 获取当前所有文件
   */
  getAllFiles(): StreamingFile[] {
    return [...this.files];
  }

  /**
   * 获取纯文本内容
   */
  getRawText(): string {
    return this.rawTextBuffer;
  }

  /**
   * 重置解析器
   */
  reset(): void {
    this.buffer = '';
    this.files = [];
    this.rawTextBuffer = '';
    this.isInJsonBlock = false;
    this.jsonStartIndex = -1;
  }
}
