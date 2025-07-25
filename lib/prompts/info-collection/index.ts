/**
 * Info Collection Prompts Module
 * 信息收集模块 - 统一导出
 */

// 基础信息收集 Agent (暂时注释，只使用优化版)
// export { 
//   BASIC_INFO_COLLECTION_PROMPT,
//   BASIC_INFO_COLLECTION_CONFIG 
// } from './basic-agent';

// 优化版信息收集 Agent（重点优化对话交互）- 主要使用
export { 
  OPTIMIZED_INFO_COLLECTION_PROMPT,
  OPTIMIZED_INFO_COLLECTION_CONFIG 
} from './optimized-agent';

// 对话式信息收集 Agent (暂时注释，只使用优化版)
// export { 
//   CONVERSATIONAL_INFO_COLLECTION_PROMPT,
//   CONVERSATIONAL_INFO_COLLECTION_CONFIG 
// } from './conversational-agent';

/**
 * 信息收集模块选择器 (当前只使用优化版)
 */
export const INFO_COLLECTION_AGENTS = {
  // BASIC: 'BASIC_INFO_COLLECTION',
  OPTIMIZED: 'OPTIMIZED_INFO_COLLECTION',
  // CONVERSATIONAL: 'CONVERSATIONAL_INFO_COLLECTION'
} as const;

/**
 * 根据场景选择合适的信息收集Agent (当前统一使用优化版)
 */
export function selectInfoCollectionAgent(scenario: {
  hasToolSupport: boolean;
  userPreference: 'quick' | 'standard' | 'detailed';
  problemRecovery: boolean;
}): keyof typeof INFO_COLLECTION_AGENTS {
  
  // 当前统一使用优化版，支持对话历史和智能分析
  return 'OPTIMIZED';
  
  // // 原有逻辑 (暂时注释)
  // // 如果是问题恢复场景，优先使用优化版（强化对话交互）
  // if (scenario.problemRecovery) {
  //   return 'OPTIMIZED';
  // }
  
  // // 如果没有工具支持，使用对话式收集
  // if (!scenario.hasToolSupport) {
  //   return 'CONVERSATIONAL';
  // }
  
  // // 根据用户偏好选择
  // switch (scenario.userPreference) {
  //   case 'quick':
  //     return 'BASIC';
  //   case 'standard':
  //     return 'OPTIMIZED';
  //   case 'detailed':
  //     return 'CONVERSATIONAL';
  //   default:
  //     return 'OPTIMIZED';
  // }
}