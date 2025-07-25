/**
 * 工具相关的通用工具函数
 * 提供输入分析、智能匹配、结果处理等功能
 */

import { ClaudeToolDefinition, ToolSuggestion, InputAnalysisResult, ToolCategory } from './types';
import { toolRegistry, selectOptimalTools } from './registry';

/**
 * 智能分析用户输入，推荐合适的工具
 */
export function analyzeUserInput(userInput: string, userRole?: string): InputAnalysisResult {
  const input = userInput.toLowerCase();
  const detectedResources: string[] = [];
  const toolSuggestions: ToolSuggestion[] = [];
  
  // 1. 检测GitHub资源
  if (input.includes('github.com') || /github\.com\/[^\/\s]+/.test(userInput)) {
    detectedResources.push('GitHub');
    toolSuggestions.push({
      name: 'analyze_github',
      params: extractGitHubParams(userInput),
      confidence: 0.95,
      reason: '检测到GitHub用户或仓库链接'
    });
  }
  
  // 2. 检测网页URL
  const urlMatches = userInput.match(/https?:\/\/[^\s]+/g);
  if (urlMatches) {
    urlMatches.forEach(url => {
      if (!url.includes('github.com') && !url.includes('linkedin.com')) {
        detectedResources.push('网页');
        toolSuggestions.push({
          name: 'scrape_webpage',
          params: { url, target_sections: ['all'] },
          confidence: 0.85,
          reason: '检测到网页链接，可能是作品集或博客'
        });
      }
    });
  }
  
  // 3. 检测LinkedIn资源
  if (input.includes('linkedin.com/in/') || input.includes('linkedin')) {
    detectedResources.push('LinkedIn');
    toolSuggestions.push({
      name: 'extract_linkedin',
      params: extractLinkedInParams(userInput),
      confidence: 0.8,
      reason: '检测到LinkedIn个人资料'
    });
  }
  
  // 4. 检测文档资源
  if (input.includes('简历') || input.includes('resume') || 
      input.includes('pdf') || input.includes('文档')) {
    detectedResources.push('文档');
    toolSuggestions.push({
      name: 'parse_document',
      params: { file_type: detectFileType(userInput) },
      confidence: 0.7,
      reason: '提到了文档或简历，建议上传文件解析'
    });
  }
  
  // 5. 检测社交媒体平台
  const socialPlatforms = detectSocialPlatforms(userInput);
  if (socialPlatforms.length > 0) {
    detectedResources.push(...socialPlatforms);
    socialPlatforms.forEach(platform => {
      toolSuggestions.push({
        name: 'analyze_social_media',
        params: { platform_url: extractPlatformUrl(userInput, platform), platform_type: platform },
        confidence: 0.75,
        reason: `检测到${platform}平台链接`
      });
    });
  }
  
  // 6. 根据用户角色调整建议优先级
  if (userRole) {
    adjustSuggestionsByRole(toolSuggestions, userRole);
  }
  
  // 7. 按置信度排序
  toolSuggestions.sort((a, b) => b.confidence - a.confidence);
  
  const confidence = calculateOverallConfidence(toolSuggestions);
  const analysisText = generateAnalysisText(detectedResources, toolSuggestions);
  
  return {
    detected_resources: detectedResources,
    tool_suggestions: toolSuggestions,
    confidence,
    analysis_text: analysisText
  };
}

/**
 * 格式化工具调用结果
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
      timestamp,
      confidence: 0
    };
  }

  return {
    tool_name: toolName,
    success: true,
    data: result,
    confidence: result?.confidence || result?.extraction_confidence || 0.8,
    metadata: {
      extracted_at: timestamp,
      data_quality: assessResultQuality(result),
      ...result?.metadata
    }
  };
}

/**
 * 智能选择工具
 */
export function selectToolsForInput(
  userInput: string, 
  userRole?: string,
  maxTools: number = 3
): ToolSuggestion[] {
  const analysis = analyzeUserInput(userInput, userRole);
  
  // 使用注册表的智能选择算法
  const optimalTools = selectOptimalTools({
    userInput,
    userRole,
    maxTools
  });
  
  // 转换为建议格式
  return optimalTools.map(tool => {
    const suggestion = analysis.tool_suggestions.find(s => s.name === tool.name);
    return suggestion || {
      name: tool.name,
      params: extractDefaultParams(tool, userInput),
      confidence: 0.6,
      reason: `基于${userRole || '用户'}角色推荐`
    };
  });
}

/**
 * 验证工具参数
 */
export function validateToolParams(toolName: string, params: any): { valid: boolean; errors: string[] } {
  const tool = toolRegistry.getToolByName(toolName);
  if (!tool) {
    return { valid: false, errors: [`未找到工具: ${toolName}`] };
  }
  
  const errors: string[] = [];
  const schema = tool.input_schema;
  
  // 检查必需参数
  if (schema.required) {
    for (const requiredParam of schema.required) {
      if (!(requiredParam in params) || params[requiredParam] === null || params[requiredParam] === undefined) {
        errors.push(`缺少必需参数: ${requiredParam}`);
      }
    }
  }
  
  // 检查参数类型和格式
  Object.entries(schema.properties).forEach(([paramName, paramSchema]: [string, any]) => {
    if (paramName in params) {
      const value = params[paramName];
      
      // 类型检查
      if (paramSchema.type === 'string' && typeof value !== 'string') {
        errors.push(`参数 ${paramName} 应为字符串类型`);
      }
      if (paramSchema.type === 'boolean' && typeof value !== 'boolean') {
        errors.push(`参数 ${paramName} 应为布尔类型`);
      }
      if (paramSchema.type === 'number' && typeof value !== 'number') {
        errors.push(`参数 ${paramName} 应为数字类型`);
      }
      
      // 枚举值检查
      if (paramSchema.enum && !paramSchema.enum.includes(value)) {
        errors.push(`参数 ${paramName} 的值必须是: ${paramSchema.enum.join(', ')} 之一`);
      }
      
      // URL格式检查
      if (paramName.includes('url') && typeof value === 'string') {
        try {
          new URL(value);
        } catch {
          errors.push(`参数 ${paramName} 不是有效的URL格式`);
        }
      }
    }
  });
  
  return { valid: errors.length === 0, errors };
}

/**
 * 生成工具使用建议
 */
export function generateToolUsageSuggestions(userRole: string): string[] {
  const suggestions: string[] = [];
  
  switch (userRole) {
    case '开发者':
    case 'AI工程师':
      suggestions.push('提供您的GitHub用户名或链接，我可以分析您的技术技能和项目经验');
      suggestions.push('分享您的技术博客或个人网站，展示您的专业能力');
      suggestions.push('上传您的简历文档，我将提取关键信息');
      break;
      
    case '设计师':
      suggestions.push('分享您的作品集网站或Behance/Dribbble链接');
      suggestions.push('提供您的设计作品集PDF文件');
      suggestions.push('分享您的LinkedIn资料以展示职业经历');
      break;
      
    case '产品经理':
      suggestions.push('提供您的LinkedIn资料链接');
      suggestions.push('分享您写的产品相关文章或博客');
      suggestions.push('上传您的简历以分析产品管理经验');
      break;
      
    default:
      suggestions.push('提供任何个人链接（GitHub、LinkedIn、个人网站等）');
      suggestions.push('上传您的简历或作品集文档');
      suggestions.push('分享能展示您专业能力的在线资料');
  }
  
  return suggestions;
}

// ============== 私有辅助函数 ==============

function extractGitHubParams(input: string): any {
  const match = input.match(/github\.com\/([^\/\s]+)/);
  return {
    username_or_url: match ? match[0] : input,
    include_repos: true
  };
}

function extractLinkedInParams(input: string): any {
  const match = input.match(/linkedin\.com\/in\/[^\s]+/);
  return {
    profile_url: match ? match[0] : input
  };
}

function detectFileType(input: string): string {
  if (input.includes('.pdf')) return 'pdf';
  if (input.includes('.docx')) return 'docx';
  if (input.includes('.xlsx')) return 'xlsx';
  if (input.includes('.pptx')) return 'pptx';
  if (input.includes('.txt')) return 'txt';
  return 'pdf'; // 默认
}

function detectSocialPlatforms(input: string): string[] {
  const platforms: string[] = [];
  
  if (input.includes('behance.net')) platforms.push('behance');
  if (input.includes('dribbble.com')) platforms.push('dribbble');
  if (input.includes('medium.com')) platforms.push('medium');
  if (input.includes('dev.to')) platforms.push('devto');
  if (input.includes('codepen.io')) platforms.push('codepen');
  if (input.includes('youtube.com')) platforms.push('youtube');
  
  return platforms;
}

function extractPlatformUrl(input: string, platform: string): string {
  const patterns: Record<string, RegExp> = {
    behance: /https?:\/\/behance\.net\/[^\s]+/,
    dribbble: /https?:\/\/dribbble\.com\/[^\s]+/,
    medium: /https?:\/\/medium\.com\/[^\s]+/,
    devto: /https?:\/\/dev\.to\/[^\s]+/,
    codepen: /https?:\/\/codepen\.io\/[^\s]+/,
    youtube: /https?:\/\/youtube\.com\/[^\s]+/
  };
  
  const pattern = patterns[platform];
  if (pattern) {
    const match = input.match(pattern);
    return match ? match[0] : '';
  }
  
  return '';
}

function adjustSuggestionsByRole(suggestions: ToolSuggestion[], userRole: string): void {
  const roleBoosts: Record<string, Record<string, number>> = {
    '开发者': { analyze_github: 0.2, scrape_webpage: 0.1 },
    '设计师': { scrape_webpage: 0.2, analyze_social_media: 0.15 },
    '产品经理': { extract_linkedin: 0.2, parse_document: 0.1 }
  };
  
  const boosts = roleBoosts[userRole];
  if (boosts) {
    suggestions.forEach(suggestion => {
      const boost = boosts[suggestion.name] || 0;
      suggestion.confidence = Math.min(suggestion.confidence + boost, 1.0);
    });
  }
}

function calculateOverallConfidence(suggestions: ToolSuggestion[]): number {
  if (suggestions.length === 0) return 0;
  
  const avgConfidence = suggestions.reduce((sum, s) => sum + s.confidence, 0) / suggestions.length;
  const countBonus = Math.min(suggestions.length * 0.1, 0.3); // 建议数量加成
  
  return Math.min(avgConfidence + countBonus, 1.0);
}

function generateAnalysisText(resources: string[], suggestions: ToolSuggestion[]): string {
  if (resources.length === 0) {
    return '没有检测到可分析的资源，建议提供GitHub链接、个人网站或上传文档。';
  }
  
  let text = `检测到 ${resources.length} 种类型的资源：${resources.join('、')}。`;
  
  if (suggestions.length > 0) {
    text += ` 推荐使用 ${suggestions.length} 个工具进行分析。`;
  }
  
  return text;
}

function assessResultQuality(result: any): 'high' | 'medium' | 'low' {
  if (!result) return 'low';
  
  let score = 0;
  
  // 检查数据完整性
  if (result.confidence && result.confidence > 0.8) score += 3;
  else if (result.confidence && result.confidence > 0.5) score += 2;
  else score += 1;
  
  if (result.data || result.extracted_data) score += 2;
  if (result.metadata) score += 1;
  if (result.suggestions) score += 1;
  
  if (score >= 6) return 'high';
  if (score >= 4) return 'medium';
  return 'low';
}

function extractDefaultParams(tool: ClaudeToolDefinition, userInput: string): any {
  const params: any = {};
  
  // 根据工具类型提取默认参数
  switch (tool.category) {
    case ToolCategory.GITHUB:
      if (tool.name === 'analyze_github') {
        params.username_or_url = userInput;
        params.include_repos = true;
      }
      break;
      
    case ToolCategory.WEB_SCRAPING:
      if (tool.name === 'scrape_webpage') {
        const urlMatch = userInput.match(/https?:\/\/[^\s]+/);
        if (urlMatch) {
          params.url = urlMatch[0];
          params.target_sections = ['all'];
        }
      }
      break;
      
    case ToolCategory.SOCIAL:
      if (tool.name === 'extract_linkedin') {
        const linkedinMatch = userInput.match(/linkedin\.com\/in\/[^\s]+/);
        if (linkedinMatch) {
          params.profile_url = linkedinMatch[0];
        }
      }
      break;
      
    case ToolCategory.DOCUMENT:
      if (tool.name === 'parse_document') {
        params.file_type = 'pdf';
        params.extract_mode = 'general';
      }
      break;
  }
  
  return params;
} 