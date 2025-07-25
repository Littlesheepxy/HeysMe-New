/**
 * GitHub工具分类
 * 专门处理GitHub相关的数据提取和分析
 */

import { ClaudeToolDefinition, ToolCategory } from '../types';

/**
 * GitHub分析工具
 */
export const GITHUB_ANALYZE_TOOL: ClaudeToolDefinition = {
  name: 'analyze_github',
  category: ToolCategory.GITHUB,
  priority: 10,
  description: `深度分析GitHub用户资料和仓库信息。此工具是开发者信息收集的核心组件，专门用于提取技术技能、项目经验和开源贡献情况。

使用场景：
- 当用户提供GitHub用户名或完整URL时
- 需要分析开发者的技术背景和项目经验时  
- 用于自动填充技术技能和项目信息
- 评估开发者的活跃度和影响力

核心分析功能：
- 用户基本信息（姓名、头像、简介、位置、网站）
- 社交统计（粉丝数、关注数、公开仓库数）
- 主要编程语言统计和技术栈分析
- 前10个最受欢迎的仓库（按星数排序）
- 每个仓库的详细信息（名称、描述、主要语言、星数、分叉数、更新时间）
- 贡献统计和开发活跃度分析
- 代码质量和项目复杂度评估

智能特性：
- 自动处理用户名提取，支持完整URL或纯用户名格式
- 语言多样性分析，识别全栈开发能力
- 项目影响力评估（基于星数、分叉数、观察者）
- 开发活跃度趋势分析
- 技术领域专业度评估

容错机制：
- API调用失败时返回合理的模拟数据以保证流程继续
- 私有仓库访问限制的优雅处理
- 网络超时的重试机制
- 速率限制的智能等待`,
  input_schema: {
    type: 'object',
    properties: {
      username_or_url: {
        type: 'string',
        description: 'GitHub用户名或完整的GitHub用户页面URL。支持格式：username, github.com/username, https://github.com/username'
      },
      include_repos: {
        type: 'boolean',
        description: '是否包含仓库详细信息。true：获取详细仓库数据和分析；false：仅获取基本用户信息。默认为true'
      },
      repo_limit: {
        type: 'number',
        description: '要分析的仓库数量限制，默认为10。范围：1-50'
      },
      analysis_depth: {
        type: 'string',
        enum: ['basic', 'detailed', 'comprehensive'],
        description: '分析深度。basic：基本信息；detailed：包含技术栈分析；comprehensive：完整分析包括活跃度趋势'
      }
    },
    required: ['username_or_url']
  },
  metadata: {
    version: '2.0.0',
    author: 'HeysMe Team',
    tags: ['github', 'developer', 'analysis', 'open-source'],
    estimatedTime: 8000 // 8秒预估时间
  }
};

/**
 * GitHub仓库分析工具（未来扩展）
 */
export const GITHUB_REPO_TOOL: ClaudeToolDefinition = {
  name: 'analyze_github_repo',
  category: ToolCategory.GITHUB,
  priority: 8,
  description: `深度分析单个GitHub仓库的详细信息。用于提取特定项目的技术细节、开发过程和项目质量指标。

分析维度：
- 项目基本信息和技术栈
- 代码质量和复杂度指标
- 提交历史和开发活跃度
- 问题管理和社区参与度
- 依赖关系和安全性分析
- 文档完整性评估

适用场景：
- 重点项目的深度展示
- 技术能力的具体体现
- 项目管理能力证明
- 开源贡献的质量评估`,
  input_schema: {
    type: 'object',
    properties: {
      repo_url: {
        type: 'string',
        description: '完整的GitHub仓库URL，格式：https://github.com/owner/repo'
      },
      analysis_type: {
        type: 'string',
        enum: ['overview', 'technical', 'management', 'community'],
        description: '分析类型：overview-概览，technical-技术分析，management-项目管理，community-社区分析'
      }
    },
    required: ['repo_url']
  },
  metadata: {
    version: '1.0.0',
    author: 'HeysMe Team',
    tags: ['github', 'repository', 'project-analysis'],
    estimatedTime: 12000
  }
};

/**
 * GitHub工具集合
 */
export const GITHUB_TOOLS: ClaudeToolDefinition[] = [
  GITHUB_ANALYZE_TOOL,
  GITHUB_REPO_TOOL
];

/**
 * GitHub工具相关的辅助函数
 */
export function isGitHubUrl(url: string): boolean {
  return /github\.com/i.test(url);
}

export function extractGitHubUsername(input: string): string {
  // 提取用户名的正则表达式
  const patterns = [
    /github\.com\/([^\/\s]+)/, // 从URL提取
    /^([a-zA-Z0-9\-_]+)$/      // 纯用户名
  ];
  
  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) return match[1];
  }
  
  return input; // 如果都不匹配，返回原始输入
}

export function validateGitHubInput(input: string): { valid: boolean; reason?: string } {
  if (!input || input.trim().length === 0) {
    return { valid: false, reason: '用户名不能为空' };
  }
  
  const username = extractGitHubUsername(input);
  
  // GitHub用户名规则验证
  if (!/^[a-zA-Z0-9\-_]+$/.test(username)) {
    return { valid: false, reason: 'GitHub用户名只能包含字母、数字、连字符和下划线' };
  }
  
  if (username.length > 39) {
    return { valid: false, reason: 'GitHub用户名不能超过39个字符' };
  }
  
  return { valid: true };
} 