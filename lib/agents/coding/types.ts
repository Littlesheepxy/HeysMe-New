/**
 * Coding Agent 统一类型定义
 * 整合所有重复的类型定义，避免重复声明
 */

import { ReactNode } from 'react';

// ===== 核心文件类型 =====

/**
 * 代码文件接口 - 统一定义
 */
export interface CodeFile {
  filename: string;
  content: string;
  language: string;
  type?: 'component' | 'page' | 'styles' | 'config' | 'data' | 'test' | 'docs';
  description?: string;
  editable?: boolean;
  created?: boolean;
  modified?: boolean;
  error?: string;
  status?: 'pending' | 'processing' | 'completed' | 'error';
  progress?: number;
}

// ===== 消息类型系统 =====

export type CodingAgentAsk = 
  | 'code_review'                 // 代码审查确认
  | 'file_operation'              // 文件操作确认
  | 'deploy_confirmation'         // 部署确认
  | 'error_handling'              // 错误处理选择
  | 'tool_selection'              // 工具选择
  | 'architecture_decision'       // 架构决策
  | 'code_modification'           // 代码修改确认
  | 'test_execution'              // 测试执行确认
  | 'dependency_installation'     // 依赖安装确认
  | 'project_structure'           // 项目结构确认
  | 'completion_confirmation'     // 任务完成确认
  | 'retry_failed_operation'      // 重试失败操作
  | 'select_alternative'          // 选择替代方案
  | 'provide_additional_context'  // 提供额外上下文
  | 'approve_changes';            // 批准更改

export type CodingAgentSay = 
  | 'task_started'                // 任务开始
  | 'code_generated'              // 代码生成完成
  | 'file_created'                // 文件创建完成
  | 'file_modified'               // 文件修改完成
  | 'file_deleted'                // 文件删除完成
  | 'command_executed'            // 命令执行完成
  | 'analysis_complete'           // 分析完成
  | 'error_encountered'           // 遇到错误
  | 'task_completed'              // 任务完成
  | 'progress_update'             // 进度更新
  | 'tool_execution_started'      // 工具执行开始
  | 'tool_execution_completed'    // 工具执行完成
  | 'suggestion_provided'         // 提供建议
  | 'warning_issued'              // 发出警告
  | 'status_update'               // 状态更新
  | 'debugging_info'              // 调试信息
  | 'performance_metrics';        // 性能指标

// ===== 文件操作类型 =====

export interface CodingAgentFileOperation {
  type: 'create' | 'modify' | 'delete' | 'rename' | 'move';
  path: string;
  content?: string;
  oldPath?: string;
  newPath?: string;
  description?: string;
}

// ===== 工具执行结果 =====

export interface CodingAgentToolResult {
  toolName: string;
  success: boolean;
  output?: string;
  error?: string;
  duration?: number;
  timestamp: Date;
}

// ===== 消息元数据 =====

export interface CodingAgentMessageMetadata {
  // 核心标识
  messageId?: string;
  threadId?: string;
  
  // 流式处理
  streaming?: boolean;
  streamComplete?: boolean;
  
  // 交互相关
  requiresResponse?: boolean;
  responseOptions?: Array<{
    value: string;
    label: string;
    description?: string;
  }>;
  
  // 文件相关
  fileOperations?: CodingAgentFileOperation[];
  codeFiles?: CodeFile[];
  
  // 工具相关
  toolResults?: CodingAgentToolResult[];
  activeTools?: string[];
  
  // 状态相关
  progress?: number;
  stage?: string;
  
  // 错误处理
  error?: string;
  retryable?: boolean;
  
  // 代码块相关
  codeBlocks?: {
    language: string;
    code: string;
    filePath?: string;
  }[];
  
  // 文件变更记录
  fileChanges?: {
    created: string[];
    modified: string[];
    deleted: string[];
  };
  
  // 工具相关
  toolName?: string;
  duration?: number;
  cost?: number;
  tokenUsage?: {
    input: number;
    output: number;
  };
  
  // 扩展数据
  [key: string]: any;
}

// ===== 核心消息类型 =====

export interface CodingAgentMessage {
  id: string;
  timestamp: Date;
  
  // 消息类型 - 使用Ask或Say
  ask?: CodingAgentAsk;
  say?: CodingAgentSay;
  
  // 消息内容
  text: string;
  
  // 发送者信息
  sender: 'user' | 'assistant';
  
  // 可选的图片和文件
  images?: string[];
  files?: CodeFile[];
  
  // 流式处理相关
  isStreaming?: boolean;
  isPartial?: boolean;
  
  // 元数据
  metadata?: CodingAgentMessageMetadata;
}

// ===== 状态类型 =====

export interface CodingAgentState {
  // 消息列表
  messages: CodingAgentMessage[];
  
  // 输入状态
  inputValue: string;
  
  // 流式处理状态
  isStreaming: boolean;
  streamingMessageId?: string;
  
  // 交互状态
  enableButtons: boolean;
  awaitingResponse: boolean;
  
  // 文件状态
  codeFiles: CodeFile[];
  
  // 工具状态
  activeTools: string[];
  toolResults: CodingAgentToolResult[];
  
  // 会话状态
  sessionId?: string;
  
  // 错误状态
  error?: string;
  retryCount: number;
  
  // UI状态
  isTextAreaFocused: boolean;
  selectedImages: string[];
  selectedFiles: CodeFile[];
  activeQuote: string | null;
  expandedRows: Record<string, boolean>;
  
  // 工作区状态
  currentWorkspace: string;
  
  // 历史记录
  taskHistory: CodingAgentMessage[];
  
  // 设置
  showSettings: boolean;
  showHistory: boolean;
  showFileTree: boolean;
  showPreview: boolean;
  
  // 扩展状态
  [key: string]: any;
}

// ===== 按钮状态类型 =====

export interface CodingAgentButtonState {
  enableButtons: boolean;
  
  // 主按钮
  primaryButtonText: string;
  primaryButtonVariant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  primaryButtonDisabled?: boolean;
  
  // 次级按钮
  showSecondaryButton: boolean;
  secondaryButtonText?: string;
  secondaryButtonVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  secondaryButtonDisabled?: boolean;
  
  // 其他按钮
  customButtons?: Array<{
    text: string;
    variant: string;
    action: string;
    disabled?: boolean;
  }>;
}

// ===== 消息处理器类型 =====

export interface CodingAgentMessageHandlers {
  handleSendMessage: (text: string, metadata?: CodingAgentMessageMetadata) => Promise<void>;
  handlePrimaryButtonClick: () => void;
  handleSecondaryButtonClick: () => void;
  handleCustomButtonClick: (action: string) => void;
  handleFileOperation: (operation: CodingAgentFileOperation) => Promise<void>;
  handleToolExecution: (toolName: string, params: Record<string, any>) => Promise<void>;
  handleRetry: () => void;
  handleCancel: () => void;
  handleNewTask: () => Promise<void>;
  handleTaskCancel: () => void;
  handleCodeReview: (approve: boolean, feedback?: string) => Promise<void>;
  handleDeployment: (confirm: boolean) => Promise<void>;
  handleToolSelection: (toolName: string, parameters?: Record<string, any>) => Promise<void>;
}

// ===== 工具系统 =====

export interface CodingAgentTool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (params: Record<string, any>) => Promise<any>;
  icon?: ReactNode;
  category: 'file' | 'code' | 'analysis' | 'deployment' | 'testing' | 'documentation';
}

export interface CodingAgentToolRegistry {
  tools: Map<string, CodingAgentTool>;
  registerTool: (tool: CodingAgentTool) => void;
  unregisterTool: (name: string) => void;
  getTool: (name: string) => CodingAgentTool | undefined;
  getToolsByCategory: (category: string) => CodingAgentTool[];
  executeTool: (name: string, params: Record<string, any>) => Promise<any>;
}

// ===== 服务层接口 =====

export interface CodingAgentServiceClient {
  // 任务管理
  newTask: (request: { text: string; images?: string[]; files?: CodeFile[] }) => Promise<void>;
  continueTask: (response: { text?: string; images?: string[]; files?: CodeFile[] }) => Promise<void>;
  cancelTask: () => Promise<void>;
  completeTask: (result: { success: boolean; summary: string }) => Promise<void>;
  
  // 文件操作
  createFile: (filePath: string, content: string) => Promise<void>;
  modifyFile: (filePath: string, content: string) => Promise<void>;
  deleteFile: (filePath: string) => Promise<void>;
  readFile: (filePath: string) => Promise<string>;
  listFiles: (directory: string) => Promise<string[]>;
  
  // 代码分析
  analyzeCode: (code: string, language: string) => Promise<any>;
  generateCode: (requirements: string, context?: any) => Promise<string>;
  reviewCode: (code: string, filePath: string) => Promise<any>;
  
  // 工具调用
  executeTool: (toolName: string, parameters: Record<string, any>) => Promise<any>;
  
  // 状态管理
  getState: () => Promise<CodingAgentState>;
  updateState: (update: Partial<CodingAgentState>) => Promise<void>;
  subscribeToState: (callback: (state: CodingAgentState) => void) => () => void;
}

// ===== 响应处理器 =====

export interface CodingAgentResponseHandler {
  handleAskResponse: (ask: CodingAgentAsk, response: {
    type: 'approve' | 'reject' | 'message' | 'custom';
    text?: string;
    images?: string[];
    files?: CodeFile[];
    customData?: any;
  }) => Promise<void>;
  
  handleSayResponse: (say: CodingAgentSay, data: any) => Promise<void>;
  
  handleToolResponse: (toolName: string, result: any, error?: Error) => Promise<void>;
  
  handleStreamingResponse: (
    message: CodingAgentMessage,
    isComplete: boolean,
    chunk?: string
  ) => Promise<void>;
}

// ===== 状态更新动作 =====

export type CodingAgentAction = 
  | { type: 'ADD_MESSAGE'; message: CodingAgentMessage }
  | { type: 'UPDATE_MESSAGE'; id: string; updates: Partial<CodingAgentMessage> }
  | { type: 'REMOVE_MESSAGE'; id: string }
  | { type: 'SET_INPUT_VALUE'; value: string }
  | { type: 'SET_SELECTED_IMAGES'; images: string[] }
  | { type: 'SET_SELECTED_FILES'; files: CodeFile[] }
  | { type: 'SET_ACTIVE_QUOTE'; quote: string | null }
  | { type: 'SET_STREAMING'; streaming: boolean }
  | { type: 'SET_SENDING_DISABLED'; disabled: boolean }
  | { type: 'SET_ENABLE_BUTTONS'; enabled: boolean }
  | { type: 'SET_BUTTON_TEXT'; primary?: string; secondary?: string }
  | { type: 'TOGGLE_ROW_EXPANDED'; id: string }
  | { type: 'SET_CODE_FILES'; files: CodeFile[] }
  | { type: 'ADD_CODE_FILE'; file: CodeFile }
  | { type: 'UPDATE_CODE_FILE'; filename: string; updates: Partial<CodeFile> }
  | { type: 'REMOVE_CODE_FILE'; filename: string }
  | { type: 'SET_CURRENT_WORKSPACE'; workspace: string }
  | { type: 'SET_ACTIVE_TOOLS'; tools: string[] }
  | { type: 'SET_TOOL_RESULT'; toolName: string; result: any }
  | { type: 'CLEAR_TASK' }
  | { type: 'RESET_STATE' };

// ===== 事件类型 =====

export type CodingAgentEventListener = (event: CodingAgentEvent) => void;

export interface CodingAgentEvent {
  type: 'message' | 'file_operation' | 'tool_execution' | 'state_change' | 'error';
  data: any;
  timestamp: Date;
}

// ===== 配置类型 =====

export interface CodingAgentConfig {
  maxMessages?: number;
  autoSave?: boolean;
  enableFileOperations?: boolean;
  enableToolExecution?: boolean;
  retryAttempts?: number;
  streamingEnabled?: boolean;
}

// ===== 消息工厂类 =====

export class CodingAgentMessageFactory {
  static createAskMessage(
    ask: CodingAgentAsk,
    text: string,
    metadata?: CodingAgentMessageMetadata
  ): CodingAgentMessage {
    return {
      id: `ask-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ask,
      text,
      sender: 'assistant',
      metadata
    };
  }

  static createSayMessage(
    say: CodingAgentSay,
    text: string,
    metadata?: CodingAgentMessageMetadata
  ): CodingAgentMessage {
    return {
      id: `say-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      say,
      text,
      sender: 'assistant',
      metadata
    };
  }

  static createUserMessage(
    text: string,
    metadata?: CodingAgentMessageMetadata
  ): CodingAgentMessage {
    return {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      text,
      sender: 'user',
      metadata
    };
  }

  // 创建文件操作消息
  static createFileOperationMessage(
    operation: 'create' | 'modify' | 'delete',
    filePath: string,
    content?: string
  ): CodingAgentMessage {
    const say = operation === 'create' ? 'file_created' : 
                 operation === 'modify' ? 'file_modified' : 'file_deleted';
    
    return this.createSayMessage(
      say,
      `${operation} ${filePath}`,
      {
        fileChanges: {
          created: operation === 'create' ? [filePath] : [],
          modified: operation === 'modify' ? [filePath] : [],
          deleted: operation === 'delete' ? [filePath] : []
        }
      }
    );
  }

  // 创建工具调用消息
  static createToolMessage(
    toolName: string,
    parameters: Record<string, any>,
    result?: any,
    error?: Error
  ): CodingAgentMessage {
    return this.createSayMessage(
      'tool_execution_completed',
      `Tool: ${toolName}`,
      {
        toolName,
        error: error?.message
      }
    );
  }

  // 创建代码生成消息
  static createCodeGenerationMessage(
    language: string,
    code: string,
    filePath?: string
  ): CodingAgentMessage {
    return this.createSayMessage(
      'code_generated',
      `Generated ${language} code`,
      {
        codeBlocks: [{
          language,
          code,
          filePath
        }]
      }
    );
  }

  // 创建错误消息
  static createErrorMessage(error: Error, context?: string): CodingAgentMessage {
    return this.createSayMessage(
      'error_encountered',
      context ? `Error in ${context}: ${error.message}` : error.message,
      {
        error: error.message,
        retryable: true
      }
    );
  }
}

// ===== 按钮配置映射 =====

export const CODING_AGENT_BUTTON_CONFIG: Record<CodingAgentAsk, CodingAgentButtonState> = {
  'code_review': {
    enableButtons: true,
    primaryButtonText: '审查通过',
    primaryButtonVariant: 'default',
    showSecondaryButton: true,
    secondaryButtonText: '需要修改',
    secondaryButtonVariant: 'outline'
  },
  'file_operation': {
    enableButtons: true,
    primaryButtonText: '确认操作',
    primaryButtonVariant: 'default',
    showSecondaryButton: true,
    secondaryButtonText: '取消',
    secondaryButtonVariant: 'outline'
  },
  'deploy_confirmation': {
    enableButtons: true,
    primaryButtonText: '确认部署',
    primaryButtonVariant: 'default',
    showSecondaryButton: true,
    secondaryButtonText: '取消',
    secondaryButtonVariant: 'destructive'
  },
  'error_handling': {
    enableButtons: true,
    primaryButtonText: '重试',
    primaryButtonVariant: 'default',
    showSecondaryButton: true,
    secondaryButtonText: '跳过',
    secondaryButtonVariant: 'outline'
  },
  'tool_selection': {
    enableButtons: true,
    primaryButtonText: '继续',
    primaryButtonVariant: 'default',
    showSecondaryButton: true,
    secondaryButtonText: '更改选择',
    secondaryButtonVariant: 'outline'
  },
  'architecture_decision': {
    enableButtons: true,
    primaryButtonText: '采用建议',
    primaryButtonVariant: 'default',
    showSecondaryButton: true,
    secondaryButtonText: '自定义',
    secondaryButtonVariant: 'outline'
  },
  'code_modification': {
    enableButtons: true,
    primaryButtonText: '应用修改',
    primaryButtonVariant: 'default',
    showSecondaryButton: true,
    secondaryButtonText: '查看详情',
    secondaryButtonVariant: 'outline'
  },
  'test_execution': {
    enableButtons: true,
    primaryButtonText: '运行测试',
    primaryButtonVariant: 'default',
    showSecondaryButton: true,
    secondaryButtonText: '跳过测试',
    secondaryButtonVariant: 'outline'
  },
  'dependency_installation': {
    enableButtons: true,
    primaryButtonText: '安装依赖',
    primaryButtonVariant: 'default',
    showSecondaryButton: true,
    secondaryButtonText: '手动安装',
    secondaryButtonVariant: 'outline'
  },
  'project_structure': {
    enableButtons: true,
    primaryButtonText: '创建结构',
    primaryButtonVariant: 'default',
    showSecondaryButton: true,
    secondaryButtonText: '修改结构',
    secondaryButtonVariant: 'outline'
  },
  'completion_confirmation': {
    enableButtons: true,
    primaryButtonText: '完成任务',
    primaryButtonVariant: 'default',
    showSecondaryButton: true,
    secondaryButtonText: '继续优化',
    secondaryButtonVariant: 'outline'
  },
  'retry_failed_operation': {
    enableButtons: true,
    primaryButtonText: '重试',
    primaryButtonVariant: 'default',
    showSecondaryButton: true,
    secondaryButtonText: '取消操作',
    secondaryButtonVariant: 'destructive'
  },
  'select_alternative': {
    enableButtons: true,
    primaryButtonText: '选择方案',
    primaryButtonVariant: 'default',
    showSecondaryButton: true,
    secondaryButtonText: '查看所有选项',
    secondaryButtonVariant: 'outline'
  },
  'provide_additional_context': {
    enableButtons: true,
    primaryButtonText: '提供上下文',
    primaryButtonVariant: 'default',
    showSecondaryButton: true,
    secondaryButtonText: '跳过',
    secondaryButtonVariant: 'outline'
  },
  'approve_changes': {
    enableButtons: true,
    primaryButtonText: '批准更改',
    primaryButtonVariant: 'default',
    showSecondaryButton: true,
    secondaryButtonText: '拒绝',
    secondaryButtonVariant: 'destructive'
  }
}; 