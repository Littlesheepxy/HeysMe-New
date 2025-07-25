/**
 * HeysMe Prompts Module - 新版模块化架构
 * 所有Agent Prompt的统一导出入口
 */

// Welcome Module
export { 
  WELCOME_SYSTEM_PROMPT,
  FIRST_ROUND_PROMPT_TEMPLATE,
  CONTINUATION_PROMPT_TEMPLATE,
  WELCOME_AGENT_CONFIG 
} from './welcome';

// Info Collection Module  
export {
  OPTIMIZED_INFO_COLLECTION_PROMPT,
  OPTIMIZED_INFO_COLLECTION_CONFIG,
  INFO_COLLECTION_AGENTS,
  selectInfoCollectionAgent
} from './info-collection';

// 为了向后兼容，导出别名
export {
  OPTIMIZED_INFO_COLLECTION_PROMPT as BASIC_INFO_COLLECTION_PROMPT,
  OPTIMIZED_INFO_COLLECTION_CONFIG as BASIC_INFO_COLLECTION_CONFIG,
  OPTIMIZED_INFO_COLLECTION_PROMPT as CONVERSATIONAL_INFO_COLLECTION_PROMPT,
  OPTIMIZED_INFO_COLLECTION_CONFIG as CONVERSATIONAL_INFO_COLLECTION_CONFIG
} from './info-collection';

// Design Module
export {
  DESIGN_AGENT_PROMPT,
  DESIGN_AGENT_CONFIG
} from './design';

// Coding Module
export {
  CODING_AGENT_PROMPT,
  CODING_AGENT_CONFIG,
  CODING_EXPERT_MODE_PROMPT,
  CODING_TEST_MODE_CONFIG
} from './coding';

/**
 * 格式化prompt模板工具函数
 */
export const formatPrompt = (template: string, variables: Record<string, any>): string => {
  let formattedPrompt = template;
  
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{${key}}`;
    const replacementValue = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
    formattedPrompt = formattedPrompt.replaceAll(placeholder, replacementValue);
  }
  
  return formattedPrompt;
};

/**
 * 模块信息
 */
export const PROMPTS_MODULE_INFO = {
  version: '3.0',
  description: 'HeysMe多Agent系统Prompt模块 - 全新架构',
  architecture: 'modular',
  modules: [
    {
      name: 'welcome',
      description: '对话式信息收集（内置在Agent中）',
      prompt: '内置在ConversationalWelcomeAgent中'
    },
    {
      name: 'info-collection', 
      description: '信息收集模块（多Agent变体）',
      prompts: ['BASIC_INFO_COLLECTION_PROMPT', 'OPTIMIZED_INFO_COLLECTION_PROMPT', 'CONVERSATIONAL_INFO_COLLECTION_PROMPT']
    },
    {
      name: 'design',
      description: '页面结构设计专家',
      prompt: 'DESIGN_AGENT_PROMPT'
    },
    {
      name: 'coding',
      description: 'V0风格代码生成专家',
      prompt: 'CODING_AGENT_PROMPT'
    }
  ],
  migration: {
    from: 'agent-templates.ts (单体架构)',
    to: 'modular structure (模块化架构)',
    date: '2024-12-28',
    status: 'completed'
  }
}; 