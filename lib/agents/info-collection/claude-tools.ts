/**
 * Claude工具调用定义 - 遵循Anthropic官方最佳实践
 * 基于官方文档：https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/implement-tool-use
 */

import { githubService, webService, documentService, socialService } from '@/lib/services';

/**
 * Claude工具定义接口
 */
export interface ClaudeToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
}

/**
 * 信息收集阶段的Claude工具集
 * 详细描述遵循Claude官方最佳实践：提供极其详细的描述
 */
export const CLAUDE_INFO_COLLECTION_TOOLS: ClaudeToolDefinition[] = [
  {
    name: 'analyze_github',
    description: `深度分析GitHub用户资料和仓库信息。此工具用于提取用户的技术技能、项目经验和开源贡献情况。
    
    使用场景：
    - 当用户提供GitHub用户名或完整URL时
    - 需要分析开发者的技术背景和项目经验时
    - 用于自动填充技术技能和项目信息
    
    返回信息包括：
    - 用户基本信息（姓名、头像、简介、位置）
    - 粉丝数和关注数
    - 主要编程语言统计
    - 前10个最受欢迎的仓库（按星数排序）
    - 每个仓库的详细信息（名称、描述、主要语言、星数、分叉数）
    - 贡献统计和活跃度分析
    
    注意：工具会自动处理用户名提取，支持完整URL或纯用户名格式。如果API调用失败，会返回合理的模拟数据以保证流程继续。`,
    input_schema: {
      type: 'object',
      properties: {
        username_or_url: {
          type: 'string',
          description: 'GitHub用户名或完整的GitHub用户页面URL，例如：octocat 或 https://github.com/octocat'
        },
        include_repos: {
          type: 'boolean',
          description: '是否包含仓库详细信息。true：获取详细仓库数据；false：仅获取基本用户信息。默认为true'
        }
      },
      required: ['username_or_url']
    }
  },

  {
    name: 'scrape_webpage',
    description: `智能网页内容抓取和分析工具。此工具专门用于从网页中提取结构化信息，特别适用于个人作品集、简历页面、博客和公司页面的信息提取。
    
    核心功能：
    - 智能识别网页类型（作品集、博客、简历、公司页面等）
    - 提取页面元数据（标题、描述、关键词）
    - 分析技术栈和使用的技术
    - 提取社交媒体链接
    - 评估内容质量和结构
    - 判断是否适合iframe嵌入展示
    
    特殊能力：
    - 自动检测网页的X-Frame-Options限制
    - 分析网页的视觉展示适用性
    - 提供替代展示方案建议
    - 容错处理，对于无法访问的页面提供详细错误分析
    
    目标内容区域：
    - all：提取所有可识别内容（默认）
    - about：关于/介绍区域
    - projects：项目/作品区域
    - experience：工作经历区域
    - skills：技能/能力区域
    - contact：联系方式区域
    
    安全特性：
    - 10秒超时保护
    - 错误分类和建议
    - 安全的HTML内容解析`,
    input_schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: '要抓取分析的网页完整URL，必须包含http://或https://协议头'
        },
        target_sections: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['all', 'about', 'projects', 'experience', 'skills', 'contact']
          },
          description: '要重点提取的内容区域。all表示提取所有内容，其他选项用于精确提取特定区域'
        }
      },
      required: ['url']
    }
  },

  {
    name: 'parse_document',
    description: `专业文档解析工具，用于从上传的文件中提取结构化信息。主要用于处理简历、作品集文档和证书文件。
    
    支持的文档类型：
    - PDF文件：提取文本内容、表格数据和基本结构
    - Word文档（.docx）：完整的文档结构和格式信息
    - Excel文件（.xlsx）：表格数据和图表信息
    - PowerPoint（.pptx）：幻灯片内容和结构
    - 纯文本文件：直接内容提取
    
    智能解析功能：
    - 自动识别简历结构（个人信息、工作经历、教育背景、技能等）
    - 提取联系方式和个人详情
    - 识别工作经历的时间线和职责描述
    - 提取技能关键词和技术栈信息
    - 分析项目经验和成就亮点
    
    输出格式：
    - 结构化的JSON数据
    - 分类整理的信息字段
    - 置信度评分
    - 展示建议和优化提示
    
    错误处理：
    - 文档格式不支持时的友好提示
    - 解析失败时的降级处理
    - 部分解析成功时的数据保留`,
    input_schema: {
      type: 'object',
      properties: {
        file_data: {
          type: 'string',
          description: '文档文件的数据，可以是base64编码的文件内容或者文件路径'
        },
        file_type: {
          type: 'string',
          enum: ['pdf', 'docx', 'xlsx', 'pptx', 'txt'],
          description: '文档文件的类型，用于选择合适的解析策略'
        }
      },
      required: ['file_data', 'file_type']
    }
  },

  {
    name: 'extract_linkedin',
    description: `LinkedIn专业档案信息提取工具。专门用于从LinkedIn个人资料链接中提取职业相关信息。

    ⚠️ 重要声明：
    由于LinkedIn的服务条款限制，此工具目前返回模拟数据结构，实际部署中需要：
    1. 用户授权的LinkedIn API接入
    2. 或者用户手动导出的LinkedIn数据
    3. 或者用户提供的LinkedIn PDF导出文件
    
    当前提取的信息结构：
    - 基本资料：姓名、职位、公司、位置
    - 职业摘要：个人简介和职业亮点
    - 工作经历：职位、公司、时间段、职责描述
    - 教育背景：学校、学位、专业、毕业年份
    - 核心技能：专业技能列表和认可度
    - 推荐信息：同事和客户的推荐内容
    
    使用建议：
    - 建议用户使用LinkedIn的数据导出功能
    - 或提供LinkedIn生成的PDF简历
    - 工具会提供数据结构示例供参考
    
    合规处理：
    - 严格遵守LinkedIn服务条款
    - 不进行未授权的数据抓取
    - 提供合法的替代数据获取方案`,
    input_schema: {
      type: 'object',
      properties: {
        profile_url: {
          type: 'string',
          description: 'LinkedIn个人资料页面的完整URL，格式如：https://linkedin.com/in/username'
        }
      },
      required: ['profile_url']
    }
  }
];

/**
 * 工具执行器映射
 * 将Claude工具调用映射到实际的服务方法
 */
export const TOOL_EXECUTORS = {
  analyze_github: async (params: any) => {
    return await githubService.analyzeUser(
      params.username_or_url,
      params.include_repos ?? true
    );
  },

  scrape_webpage: async (params: any) => {
    return await webService.scrapeWebpage(
      params.url,
      params.target_sections ?? ['all']
    );
  },

  parse_document: async (params: any) => {
    return await documentService.parseDocument(
      params.file_data,
      params.file_type
    );
  },

  extract_linkedin: async (params: any) => {
    return await socialService.extractLinkedIn(params.profile_url);
  }
};

/**
 * 工具调用结果处理器
 * 标准化工具调用结果格式
 */
export function formatToolResult(toolName: string, result: any, success: boolean): any {
  const timestamp = new Date().toISOString();
  
  if (!success) {
    return {
      tool_name: toolName,
      success: false,
      error: result?.error || '工具调用失败',
      error_type: result?.error_type || 'unknown',
      suggestions: result?.suggestions || ['请检查输入参数', '稍后重试'],
      timestamp
    };
  }

  return {
    tool_name: toolName,
    success: true,
    data: result,
    confidence: result?.confidence || result?.extraction_confidence || 0.8,
    metadata: {
      extracted_at: timestamp,
      data_quality: result?.content_analysis?.content_quality || 'medium',
      ...result?.metadata
    }
  };
}

/**
 * 并行工具调用辅助函数
 * 支持同时调用多个工具以提高效率
 */
export async function executeToolsInParallel(toolCalls: Array<{
  name: string;
  params: any;
}>): Promise<any[]> {
  const promises = toolCalls.map(async ({ name, params }) => {
    try {
      const executor = TOOL_EXECUTORS[name as keyof typeof TOOL_EXECUTORS];
      if (!executor) {
        throw new Error(`未知的工具: ${name}`);
      }
      
      const result = await executor(params);
      return formatToolResult(name, result, true);
    } catch (error) {
      console.error(`工具 ${name} 执行失败:`, error);
      return formatToolResult(name, error, false);
    }
  });
  
  return await Promise.all(promises);
}

/**
 * 智能工具选择器
 * 根据用户输入自动判断需要调用哪些工具
 */
export function selectToolsForInput(userInput: string): Array<{
  name: string;
  params: any;
  confidence: number;
}> {
  const suggestions: Array<{ name: string; params: any; confidence: number }> = [];
  const input = userInput.toLowerCase();

  // GitHub链接检测
  const githubMatches = userInput.match(/github\.com\/([^\/\s]+)/gi);
  if (githubMatches) {
    githubMatches.forEach(match => {
      suggestions.push({
        name: 'analyze_github',
        params: { username_or_url: match, include_repos: true },
        confidence: 0.95
      });
    });
  }

  // 网页URL检测
  const urlMatches = userInput.match(/https?:\/\/[^\s]+/gi);
  if (urlMatches) {
    urlMatches.forEach(url => {
      // 排除已经被GitHub检测的URL
      if (!url.includes('github.com')) {
        suggestions.push({
          name: 'scrape_webpage',
          params: { url, target_sections: ['all'] },
          confidence: 0.85
        });
      }
    });
  }

  // LinkedIn链接检测
  const linkedinMatches = userInput.match(/linkedin\.com\/in\/[^\s]+/gi);
  if (linkedinMatches) {
    linkedinMatches.forEach(url => {
      suggestions.push({
        name: 'extract_linkedin',
        params: { profile_url: url },
        confidence: 0.8
      });
    });
  }

  // 文档提到检测
  if (input.includes('简历') || input.includes('resume') || 
      input.includes('pdf') || input.includes('文档')) {
    // 这里需要额外的文件上传处理逻辑
    // 暂时不自动添加，需要用户明确提供文件
  }

  return suggestions.sort((a, b) => b.confidence - a.confidence);
} 