/**
 * 工具执行器 - 连接Claude工具定义与实际服务实现
 * 提供统一的工具执行接口和错误处理
 */

import { ToolExecutor, ToolExecutionResult, ToolConfig } from './types';
import { githubService, webService, documentService, socialService } from '@/lib/services';
import { toolRegistry } from './registry';

/**
 * 工具执行器映射表
 */
export const TOOL_EXECUTORS: Record<string, ToolExecutor> = {
  // GitHub工具执行器
  analyze_github: async (params: any): Promise<any> => {
    const startTime = Date.now();
    try {
      console.log(`🔧 [GitHub分析] 开始执行: ${params.username_or_url}`);
      
      const result = await githubService.analyzeUser(
        params.username_or_url,
        params.include_repos ?? true
      );
      
      const executionTime = Date.now() - startTime;
      console.log(`✅ [GitHub分析] 完成，耗时: ${executionTime}ms`);
      
      return result;
    } catch (error) {
      console.error(`❌ [GitHub分析] 失败:`, error);
      throw error;
    }
  },

  analyze_github_repo: async (params: any): Promise<any> => {
    // 未来实现：单个仓库深度分析
    throw new Error('analyze_github_repo 工具尚未实现');
  },

  // 网页抓取工具执行器
  scrape_webpage: async (params: any): Promise<any> => {
    const startTime = Date.now();
    try {
      console.log(`🌐 [网页抓取] 开始执行: ${params.url}`);
      
      const result = await webService.scrapeWebpage(
        params.url,
        params.target_sections ?? ['all']
      );
      
      const executionTime = Date.now() - startTime;
      console.log(`✅ [网页抓取] 完成，耗时: ${executionTime}ms`);
      
      return result;
    } catch (error) {
      console.error(`❌ [网页抓取] 失败:`, error);
      throw error;
    }
  },

  extract_social_links: async (params: any): Promise<any> => {
    // 未来实现：专门的社交链接提取
    const result = await webService.scrapeWebpage(params.url, ['contact']);
    return {
      ...result,
      focus: 'social_links_extraction',
      social_links: result.extracted_content?.social_links || {}
    };
  },

  analyze_webpage_seo: async (params: any): Promise<any> => {
    // 未来实现：SEO分析
    throw new Error('analyze_webpage_seo 工具尚未实现');
  },

  // 文档处理工具执行器
  parse_document: async (params: any): Promise<any> => {
    const startTime = Date.now();
    try {
      console.log(`📄 [文档解析] 开始执行: ${params.file_type}`);
      
      const result = await documentService.parseDocument(
        params.file_data,
        params.file_type
      );
      
      const executionTime = Date.now() - startTime;
      console.log(`✅ [文档解析] 完成，耗时: ${executionTime}ms`);
      
      return result;
    } catch (error) {
      console.error(`❌ [文档解析] 失败:`, error);
      throw error;
    }
  },

  analyze_pdf_advanced: async (params: any): Promise<any> => {
    // 未来实现：高级PDF分析
    return await TOOL_EXECUTORS.parse_document({
      file_data: params.file_data,
      file_type: 'pdf',
      extract_mode: 'comprehensive'
    });
  },

  // 社交平台工具执行器
  extract_linkedin: async (params: any): Promise<any> => {
    const startTime = Date.now();
    try {
      console.log(`💼 [LinkedIn提取] 开始执行: ${params.profile_url}`);
      
      const result = await socialService.extractLinkedIn(params.profile_url);
      
      const executionTime = Date.now() - startTime;
      console.log(`✅ [LinkedIn提取] 完成，耗时: ${executionTime}ms`);
      
      return result;
    } catch (error) {
      console.error(`❌ [LinkedIn提取] 失败:`, error);
      throw error;
    }
  },

  analyze_social_media: async (params: any): Promise<any> => {
    // 根据平台类型选择不同的处理策略
    const { platform_url, platform_type } = params;
    
    if (platform_type === 'behance' || platform_type === 'dribbble') {
      // 设计平台处理
      return await webService.scrapeWebpage(platform_url, ['projects', 'about']);
    } else if (platform_type === 'medium' || platform_type === 'devto') {
      // 内容平台处理
      return await webService.scrapeWebpage(platform_url, ['about', 'skills']);
    } else {
      // 通用处理
      return await webService.scrapeWebpage(platform_url, ['all']);
    }
  },

  integrate_social_network: async (params: any): Promise<any> => {
    // 未来实现：社交网络整合
    throw new Error('integrate_social_network 工具尚未实现');
  }
};

/**
 * 安全的工具执行包装器
 */
export async function executeToolSafely(
  toolName: string, 
  params: any,
  config?: ToolConfig
): Promise<ToolExecutionResult> {
  const startTime = Date.now();
  
  try {
    // 1. 获取工具执行器
    const executor = TOOL_EXECUTORS[toolName];
    if (!executor) {
      throw new Error(`未找到工具执行器: ${toolName}`);
    }
    
    // 2. 获取工具配置
    const toolConfig = config || toolRegistry.getConfig(toolName);
    if (!toolConfig) {
      throw new Error(`未找到工具配置: ${toolName}`);
    }
    
    // 3. 应用超时保护
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('工具执行超时')), toolConfig.timeout);
    });
    
    // 4. 执行工具
    console.log(`🚀 [工具执行] ${toolName} 开始执行`);
    const result = await Promise.race([
      executor(params),
      timeoutPromise
    ]);
    
    const executionTime = Date.now() - startTime;
    
    // 5. 返回标准化结果
    return {
      tool_name: toolName,
      success: true,
      data: result,
      confidence: result?.confidence || result?.extraction_confidence || 0.8,
      execution_time: executionTime,
      metadata: {
        extracted_at: new Date().toISOString(),
        data_quality: assessDataQuality(result),
        ...result?.metadata
      }
    };
    
  } catch (error) {
    const executionTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    console.error(`❌ [工具执行失败] ${toolName}: ${errorMessage}`);
    
    return {
      tool_name: toolName,
      success: false,
      error: errorMessage,
      error_type: classifyError(error),
      confidence: 0,
      execution_time: executionTime,
      metadata: {
        extracted_at: new Date().toISOString(),
        data_quality: 'low'
      },
      suggestions: generateErrorSuggestions(toolName, error)
    };
  }
}

/**
 * 并行执行多个工具
 */
export async function executeToolsInParallel(
  toolCalls: Array<{ name: string; params: any }>
): Promise<ToolExecutionResult[]> {
  console.log(`⚡ [并行执行] 开始执行 ${toolCalls.length} 个工具`);
  
  const promises = toolCalls.map(async ({ name, params }) => {
    return await executeToolSafely(name, params);
  });
  
  const results = await Promise.all(promises);
  
  // 统计执行结果
  const successCount = results.filter(r => r.success).length;
  console.log(`📊 [并行执行完成] 成功: ${successCount}/${results.length}`);
  
  return results;
}

/**
 * 重试机制执行工具
 */
export async function executeToolWithRetry(
  toolName: string,
  params: any,
  maxRetries: number = 3
): Promise<ToolExecutionResult> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 [重试执行] ${toolName} 第${attempt}次尝试`);
      const result = await executeToolSafely(toolName, params);
      
      if (result.success) {
        if (attempt > 1) {
          console.log(`✅ [重试成功] ${toolName} 在第${attempt}次尝试成功`);
        }
        return result;
      } else {
        lastError = new Error(result.error);
      }
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000); // 指数退避
        console.log(`⏳ [重试延迟] ${toolName} 等待${delay}ms后重试`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // 所有重试都失败了
  console.error(`💥 [重试失败] ${toolName} 经过${maxRetries}次尝试仍然失败`);
  throw lastError;
}

/**
 * 评估数据质量
 */
function assessDataQuality(result: any): 'high' | 'medium' | 'low' {
  if (!result) return 'low';
  
  // 检查数据完整性
  let score = 0;
  
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

/**
 * 错误分类
 */
function classifyError(error: any): string {
  const message = error instanceof Error ? error.message : String(error);
  
  if (message.includes('timeout') || message.includes('超时')) return 'timeout';
  if (message.includes('network') || message.includes('网络')) return 'network';
  if (message.includes('permission') || message.includes('权限')) return 'permission';
  if (message.includes('not found') || message.includes('找不到')) return 'not_found';
  if (message.includes('invalid') || message.includes('无效')) return 'invalid_input';
  
  return 'unknown';
}

/**
 * 生成错误建议
 */
function generateErrorSuggestions(toolName: string, error: any): string[] {
  const suggestions: string[] = [];
  const errorType = classifyError(error);
  
  switch (errorType) {
    case 'timeout':
      suggestions.push('请检查网络连接');
      suggestions.push('稍后重试');
      break;
    case 'network':
      suggestions.push('检查网络连接');
      suggestions.push('确认URL是否可访问');
      break;
    case 'permission':
      suggestions.push('检查是否有访问权限');
      suggestions.push('尝试使用其他获取方式');
      break;
    case 'not_found':
      suggestions.push('确认链接或资源是否存在');
      suggestions.push('检查URL格式是否正确');
      break;
    case 'invalid_input':
      suggestions.push('检查输入参数格式');
      suggestions.push('参考工具文档中的示例');
      break;
    default:
      suggestions.push('查看详细错误信息');
      suggestions.push('联系技术支持');
  }
  
  return suggestions;
}

/**
 * 初始化执行器注册
 */
export function initializeExecutors(): void {
  console.log(`🔧 [执行器初始化] 开始注册工具执行器`);
  
  Object.entries(TOOL_EXECUTORS).forEach(([toolName, executor]) => {
    toolRegistry.registerExecutor(toolName, executor);
  });
  
  console.log(`✅ [执行器初始化] 已注册 ${Object.keys(TOOL_EXECUTORS).length} 个执行器`);
}

// 自动初始化
initializeExecutors(); 