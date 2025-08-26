/**
 * Coding Agent 模块导出
 */

// 主要的 Coding Agent
export { CodingAgent } from './agent';

// 新的基于 Vercel AI SDK 的实现
export { VercelAICodingAgent } from './vercel-ai-coding-agent';

// 兼容性工具执行器
export { 
  StreamingToolExecutor, 
  CodingAgentWithStreaming,
  UnifiedToolExecutor,
  ClaudeToolExecutor 
} from './streaming-tool-executor';

// 类型定义
export type { CodeFile, CodingAgentMessage, CodingAgentState } from './types';

// 工具函数
export * from './utils'; 