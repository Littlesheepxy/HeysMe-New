/**
 * 网页抓取工具分类
 * 专门处理网页内容的智能抓取和分析
 */

import { ClaudeToolDefinition, ToolCategory } from '../types';

/**
 * 智能网页抓取工具
 */
export const WEB_SCRAPE_TOOL: ClaudeToolDefinition = {
  name: 'scrape_webpage',
  category: ToolCategory.WEB_SCRAPING,
  priority: 9,
  description: `智能网页内容抓取和分析工具。此工具是个人网站、作品集、博客分析的核心组件，专门用于从网页中提取结构化信息并评估展示适用性。

核心功能：
- 智能识别网页类型（个人作品集、技术博客、公司页面、简历页面等）
- 提取页面元数据（标题、描述、关键词、作者信息）
- 分析使用的技术栈和开发框架
- 提取社交媒体链接和联系方式
- 评估内容质量、结构完整性和专业度
- 判断是否适合iframe嵌入展示

智能分析能力：
- 语义化内容提取，识别关键信息区块
- 自动检测网页的X-Frame-Options和CSP限制
- 分析网页的视觉展示适用性和用户体验
- 提供针对性的展示方案建议
- 评估网页的加载性能和移动端适配

容错处理机制：
- 10秒超时保护，避免长时间等待
- 详细的错误分类和诊断（网络问题、权限限制、内容限制）
- 对于无法访问的页面提供详细错误分析和替代建议
- 支持重定向和多域名处理

目标内容区域精确提取：
- all：提取所有可识别内容（默认，适用于初次分析）
- about：关于/介绍区域（个人简介、公司介绍）
- projects：项目/作品区域（案例展示、产品介绍）
- experience：工作经历区域（职业经历、客户案例）
- skills：技能/能力区域（专业技能、服务能力）
- contact：联系方式区域（联系信息、社交链接）

安全特性：
- 严格的URL验证和域名白名单检查
- 安全的HTML内容解析，防止XSS攻击
- 敏感信息过滤和隐私保护
- 速率限制和反爬虫策略应对`,
  input_schema: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: '要抓取分析的网页完整URL，必须包含http://或https://协议头。支持个人网站、作品集、博客、公司页面等'
      },
      target_sections: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['all', 'about', 'projects', 'experience', 'skills', 'contact']
        },
        description: '要重点提取的内容区域数组。all表示提取所有内容，其他选项用于精确提取特定区域。可组合使用'
      },
      analysis_depth: {
        type: 'string',
        enum: ['surface', 'standard', 'deep'],
        description: '分析深度。surface：快速提取基本信息；standard：标准分析包含技术栈；deep：深度分析包含SEO和性能'
      },
      extract_images: {
        type: 'boolean',
        description: '是否提取和分析页面中的重要图片（作品截图、个人照片等）。默认为false'
      }
    },
    required: ['url']
  },
  metadata: {
    version: '2.1.0',
    author: 'HeysMe Team',
    tags: ['web-scraping', 'content-analysis', 'portfolio', 'blog'],
    estimatedTime: 6000 // 6秒预估时间
  }
};

/**
 * 社交媒体链接提取工具
 */
export const SOCIAL_LINKS_TOOL: ClaudeToolDefinition = {
  name: 'extract_social_links',
  category: ToolCategory.WEB_SCRAPING,
  priority: 6,
  description: `专门提取网页中的社交媒体链接和联系方式。用于建立完整的用户社交档案和联系信息。

支持的平台：
- 主流社交媒体：Twitter, LinkedIn, Instagram, Facebook
- 专业平台：GitHub, Behance, Dribbble, CodePen
- 内容平台：Medium, Dev.to, YouTube, Bilibili
- 通讯工具：Email, Phone, WeChat, Telegram

提取策略：
- 智能识别各平台的URL模式
- 提取页面footer和header中的社交链接
- 分析contact页面和关于页面
- 验证链接的有效性和可访问性`,
  input_schema: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: '要分析的网页URL'
      },
      platforms: {
        type: 'array',
        items: {
          type: 'string'
        },
        description: '指定要提取的社交平台，不指定则提取所有可识别的平台'
      }
    },
    required: ['url']
  },
  metadata: {
    version: '1.5.0',
    author: 'HeysMe Team',
    tags: ['social-media', 'contact-extraction', 'networking'],
    estimatedTime: 3000
  }
};

/**
 * 网页SEO分析工具
 */
export const WEB_SEO_TOOL: ClaudeToolDefinition = {
  name: 'analyze_webpage_seo',
  category: ToolCategory.WEB_SCRAPING,
  priority: 5,
  description: `分析网页的SEO优化情况和专业度。用于评估用户的数字营销能力和网站专业性。

分析维度：
- 基础SEO：title, description, keywords, h1-h6结构
- 技术SEO：页面加载速度、移动端适配、结构化数据
- 内容质量：原创性、专业性、信息密度
- 用户体验：导航结构、页面布局、交互设计

适用场景：
- 评估用户的数字营销技能
- 分析网站的专业水准
- 为优化建议提供数据支持`,
  input_schema: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: '要分析的网页URL'
      },
      check_mobile: {
        type: 'boolean',
        description: '是否检查移动端适配，默认为true'
      }
    },
    required: ['url']
  },
  metadata: {
    version: '1.0.0',
    author: 'HeysMe Team',
    tags: ['seo', 'performance', 'mobile-friendly'],
    estimatedTime: 8000
  }
};

/**
 * 网页工具集合
 */
export const WEB_TOOLS: ClaudeToolDefinition[] = [
  WEB_SCRAPE_TOOL,
  SOCIAL_LINKS_TOOL,
  WEB_SEO_TOOL
];

/**
 * 网页工具相关的辅助函数
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

export function detectWebsiteType(url: string, title?: string, content?: string): string {
  const domain = extractDomain(url).toLowerCase();
  const text = `${title || ''} ${content || ''}`.toLowerCase();
  
  // 专业平台检测
  if (domain.includes('behance.net')) return 'behance-portfolio';
  if (domain.includes('dribbble.com')) return 'dribbble-portfolio';
  if (domain.includes('linkedin.com')) return 'linkedin-profile';
  if (domain.includes('medium.com')) return 'medium-blog';
  
  // 内容关键词检测
  if (text.includes('portfolio') || text.includes('作品集')) return 'portfolio';
  if (text.includes('blog') || text.includes('博客')) return 'blog';
  if (text.includes('resume') || text.includes('简历')) return 'resume';
  if (text.includes('about') || text.includes('关于')) return 'personal';
  
  return 'general';
}

export function validateWebInput(url: string): { valid: boolean; reason?: string } {
  if (!url || url.trim().length === 0) {
    return { valid: false, reason: 'URL不能为空' };
  }
  
  if (!isValidUrl(url)) {
    return { valid: false, reason: '请提供有效的URL格式' };
  }
  
  const domain = extractDomain(url);
  if (!domain) {
    return { valid: false, reason: '无法解析域名' };
  }
  
  // 安全检查
  const blockedDomains = ['localhost', '127.0.0.1', '0.0.0.0'];
  if (blockedDomains.some(blocked => domain.includes(blocked))) {
    return { valid: false, reason: '不支持本地地址' };
  }
  
  return { valid: true };
}

export function categorizeWebContent(content: string): string[] {
  const categories: string[] = [];
  const text = content.toLowerCase();
  
  if (text.includes('project') || text.includes('work') || text.includes('项目')) {
    categories.push('projects');
  }
  if (text.includes('about') || text.includes('bio') || text.includes('关于')) {
    categories.push('about');
  }
  if (text.includes('skill') || text.includes('技能') || text.includes('能力')) {
    categories.push('skills');
  }
  if (text.includes('experience') || text.includes('work') || text.includes('经历')) {
    categories.push('experience');
  }
  if (text.includes('contact') || text.includes('email') || text.includes('联系')) {
    categories.push('contact');
  }
  
  return categories.length > 0 ? categories : ['all'];
} 