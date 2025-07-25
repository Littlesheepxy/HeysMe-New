/**
 * Claude工具配置管理
 * 集中管理所有工具的配置参数
 */

import { ToolConfig, ToolCategory } from './types';

/**
 * 默认工具配置
 */
export const DEFAULT_TOOL_CONFIG: ToolConfig = {
  timeout: 30000,     // 30秒超时
  retries: 3,         // 重试3次
  parallel: true,     // 支持并行执行
  cache: false        // 默认不缓存
};

/**
 * 特定工具配置
 */
export const TOOL_CONFIGS: Record<string, ToolConfig> = {
  // GitHub工具配置
  analyze_github: {
    timeout: 15000,
    retries: 2,
    parallel: true,
    cache: true  // GitHub数据相对稳定，可以缓存
  },

  // 网页抓取配置
  scrape_webpage: {
    timeout: 10000,  // 网页抓取容易超时，设置较短
    retries: 1,      // 重试次数少，避免被反爬虫
    parallel: true,
    cache: false     // 网页内容可能经常变化
  },

  // 文档解析配置
  parse_document: {
    timeout: 45000,  // 文档解析可能需要更长时间
    retries: 2,
    parallel: false, // 文档解析通常CPU密集，避免并行
    cache: true      // 同一文档结果可以缓存
  },

  // LinkedIn配置
  extract_linkedin: {
    timeout: 5000,   // 目前是模拟数据，很快
    retries: 1,
    parallel: true,
    cache: false     // 职业信息变化频繁
  }
};

/**
 * 分类级别的配置
 */
export const CATEGORY_CONFIGS: Record<ToolCategory, Partial<ToolConfig>> = {
  [ToolCategory.GITHUB]: {
    timeout: 15000,
    cache: true
  },
  [ToolCategory.WEB_SCRAPING]: {
    timeout: 10000,
    retries: 1
  },
  [ToolCategory.DOCUMENT]: {
    timeout: 45000,
    parallel: false
  },
  [ToolCategory.SOCIAL]: {
    timeout: 8000,
    cache: false
  },
  [ToolCategory.UTILITY]: {
    timeout: 5000,
    parallel: true
  }
};

/**
 * 用户角色相关的优先级配置
 */
export const USER_ROLE_PRIORITIES: Record<string, Record<ToolCategory, number>> = {
  '开发者': {
    [ToolCategory.GITHUB]: 10,      // 最高优先级
    [ToolCategory.WEB_SCRAPING]: 7,
    [ToolCategory.DOCUMENT]: 8,
    [ToolCategory.SOCIAL]: 5,
    [ToolCategory.UTILITY]: 3
  },
  '设计师': {
    [ToolCategory.WEB_SCRAPING]: 10, // 作品集网站最重要
    [ToolCategory.SOCIAL]: 8,        // Behance, Dribbble
    [ToolCategory.DOCUMENT]: 7,
    [ToolCategory.GITHUB]: 4,
    [ToolCategory.UTILITY]: 3
  },
  '产品经理': {
    [ToolCategory.SOCIAL]: 10,       // LinkedIn优先
    [ToolCategory.DOCUMENT]: 9,      // 简历重要
    [ToolCategory.WEB_SCRAPING]: 6,
    [ToolCategory.GITHUB]: 3,
    [ToolCategory.UTILITY]: 4
  },
  'AI工程师': {
    [ToolCategory.GITHUB]: 10,
    [ToolCategory.DOCUMENT]: 8,      // 论文、简历
    [ToolCategory.WEB_SCRAPING]: 7,  // 技术博客
    [ToolCategory.SOCIAL]: 6,
    [ToolCategory.UTILITY]: 4
  }
};

/**
 * 获取工具配置
 */
export function getToolConfig(toolName: string): ToolConfig {
  return {
    ...DEFAULT_TOOL_CONFIG,
    ...TOOL_CONFIGS[toolName]
  };
}

/**
 * 获取分类配置
 */
export function getCategoryConfig(category: ToolCategory): ToolConfig {
  return {
    ...DEFAULT_TOOL_CONFIG,
    ...CATEGORY_CONFIGS[category]
  };
}

/**
 * 根据用户角色获取工具优先级
 */
export function getToolPriorityByRole(userRole: string, category: ToolCategory): number {
  return USER_ROLE_PRIORITIES[userRole]?.[category] || 5;
}

/**
 * 性能优化配置
 */
export const PERFORMANCE_CONFIG = {
  MAX_PARALLEL_TOOLS: 3,           // 最大并行工具数
  CACHE_TTL: 10 * 60 * 1000,      // 缓存10分钟
  MAX_RETRY_DELAY: 5000,           // 最大重试延迟
  RATE_LIMIT_DELAY: 1000           // 速率限制延迟
};

/**
 * 安全配置
 */
export const SECURITY_CONFIG = {
  ALLOWED_DOMAINS: [
    'github.com',
    'linkedin.com',
    'behance.net',
    'dribbble.com',
    'medium.com'
  ],
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  BLOCKED_EXTENSIONS: ['.exe', '.bat', '.sh', '.ps1']
}; 