/**
 * Claude工具调用类型定义
 */

/**
 * Claude工具定义接口
 */
export interface ClaudeToolDefinition {
  name: string;
  description: string;
  category: ToolCategory;
  priority: number; // 优先级，用于排序
  input_schema: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
  metadata?: {
    version: string;
    author?: string;
    tags?: string[];
    estimatedTime?: number; // 预估执行时间（毫秒）
  };
}

/**
 * 工具分类枚举
 */
export enum ToolCategory {
  GITHUB = 'github',
  WEB_SCRAPING = 'web_scraping', 
  DOCUMENT = 'document',
  SOCIAL = 'social',
  UTILITY = 'utility'
}

/**
 * 工具执行结果接口
 */
export interface ToolExecutionResult {
  tool_name: string;
  success: boolean;
  data?: any;
  error?: string;
  error_type?: string;
  confidence: number;
  execution_time: number;
  metadata: {
    extracted_at: string;
    data_quality: 'high' | 'medium' | 'low';
    [key: string]: any;
  };
  suggestions?: string[];
}

/**
 * 工具执行器函数类型
 */
export type ToolExecutor = (params: any) => Promise<any>;

/**
 * 工具执行器映射接口
 */
export interface ToolExecutorMap {
  [toolName: string]: ToolExecutor;
}

/**
 * 工具调用参数接口
 */
export interface ToolCall {
  name: string;
  params: any;
  id?: string;
}

/**
 * 工具选择建议接口
 */
export interface ToolSuggestion {
  name: string;
  params: any;
  confidence: number;
  reason: string;
}

/**
 * 工具配置接口
 */
export interface ToolConfig {
  timeout: number;
  retries: number;
  parallel: boolean;
  cache?: boolean;
}

/**
 * 工具注册表接口
 */
export interface ToolRegistry {
  tools: Map<string, ClaudeToolDefinition>;
  executors: Map<string, ToolExecutor>;
  configs: Map<string, ToolConfig>;
}

/**
 * 用户输入分析结果
 */
export interface InputAnalysisResult {
  detected_resources: string[];
  tool_suggestions: ToolSuggestion[];
  confidence: number;
  analysis_text: string;
} 