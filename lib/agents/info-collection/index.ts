/**
 * Info Collection Module - 信息收集模块
 * 提供三种不同的信息收集策略，根据需求选择使用
 */

// 1. 原始版本Agent（表单交互模式）
export { InfoCollectionAgent } from './agent';
// 适用场景：需要结构化表单交互的传统收集方式

// 2. 对话式Agent（自定义工具链）
export { ConversationalInfoCollectionAgent } from './conversational-agent';
// 适用场景：复杂的对话交互，需要自定义工具逻辑的高级场景

// 3. 优化版Agent（Claude标准工具调用）⭐ 推荐
export { OptimizedInfoCollectionAgent } from './optimized-agent';
// 适用场景：基于Claude官方最佳实践，标准化工具调用，生产环境推荐

// Claude标准工具调用相关（配合OptimizedInfoCollectionAgent使用）
export { 
  CLAUDE_INFO_COLLECTION_TOOLS,
  TOOL_EXECUTORS,
  formatToolResult,
  executeToolsInParallel,
  selectToolsForInput,
  type ClaudeToolDefinition
} from './claude-tools';

// 通用工具函数（三个Agent共用）
export * from './utils'; 