export interface CodingSession {
  id: string;
  userId: string;
  sessionId: string;
  title?: string;
  description?: string;
  status: 'active' | 'completed' | 'archived';
  metadata: {
    mode: string;
    agent_name: string;
    project_type?: string;
    framework?: string;
    created_at: string;
    updated_at: string;
    [key: string]: any;
  };
  files: CodingFile[];
  created_at: string;
  updated_at: string;
}

export interface CodingFile {
  id: string;
  sessionId: string;
  path: string;
  content: string;
  language: string;
  size: number;
  checksum?: string; // 用于检测内容变化
  version: number; // 版本控制
  status: 'created' | 'modified' | 'deleted' | 'synced';
  metadata: {
    type?: 'component' | 'config' | 'style' | 'data' | 'other';
    description?: string;
    dependencies?: string[];
    framework_specific?: Record<string, any>;
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
}

export interface CodingContext {
  currentFiles: CodingFile[];
  projectStructure: string;
  lastModifiedFiles: string[];
  activeFeature: string;
  dependencies: Record<string, string>;
  projectType: string;
  framework: string;
  buildCommands?: string[];
  runCommands?: string[];
}

// 工具执行历史
export interface ToolExecutionHistory {
  id: string;
  sessionId: string;
  toolName: string;
  params: Record<string, any>;
  result: string;
  status: 'success' | 'error';
  duration: number; // 执行时间(ms)
  timestamp: string;
  metadata?: Record<string, any>;
}

// 文件操作类型
export type FileOperation = 
  | { type: 'create'; file: CodingFile }
  | { type: 'update'; file: CodingFile; previousVersion?: number }
  | { type: 'delete'; filePath: string }
  | { type: 'rename'; oldPath: string; newPath: string };

// 批量文件操作
export interface FileBatchOperation {
  id: string;
  sessionId: string;
  operations: FileOperation[];
  description?: string;
  timestamp: string;
  rollbackData?: any; // 用于回滚操作
} 