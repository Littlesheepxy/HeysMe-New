/**
 * 工具注册表 - 统一管理所有Claude工具
 * 提供工具的注册、查询、分类和动态加载功能
 */

import { 
  ClaudeToolDefinition, 
  ToolCategory, 
  ToolRegistry,
  ToolExecutor,
  ToolConfig
} from './types';

// 导入分类工具
import { GITHUB_TOOLS } from './categories/github-tools';
import { WEB_TOOLS } from './categories/web-tools';
import { DOCUMENT_TOOLS } from './categories/document-tools';
import { SOCIAL_TOOLS } from './categories/social-tools';

// 导入配置
import { getToolConfig, USER_ROLE_PRIORITIES } from './config';

/**
 * 工具注册表单例类
 */
class ToolRegistryManager implements ToolRegistry {
  private static instance: ToolRegistryManager;
  
  public tools: Map<string, ClaudeToolDefinition> = new Map();
  public executors: Map<string, ToolExecutor> = new Map();
  public configs: Map<string, ToolConfig> = new Map();
  
  private constructor() {
    this.initializeTools();
  }
  
  public static getInstance(): ToolRegistryManager {
    if (!ToolRegistryManager.instance) {
      ToolRegistryManager.instance = new ToolRegistryManager();
    }
    return ToolRegistryManager.instance;
  }
  
  /**
   * 初始化所有工具
   */
  private initializeTools(): void {
    // 注册所有分类的工具
    const allTools = [
      ...GITHUB_TOOLS,
      ...WEB_TOOLS,
      ...DOCUMENT_TOOLS,
      ...SOCIAL_TOOLS
    ];
    
    allTools.forEach(tool => {
      this.registerTool(tool);
    });
    
    console.log(`🛠️ [工具注册表] 已注册 ${this.tools.size} 个Claude工具`);
  }
  
  /**
   * 注册单个工具
   */
  public registerTool(tool: ClaudeToolDefinition): void {
    // 注册工具定义
    this.tools.set(tool.name, tool);
    
    // 注册工具配置
    const config = getToolConfig(tool.name);
    this.configs.set(tool.name, config);
    
    console.log(`✅ [工具注册] ${tool.name} (${tool.category})`);
  }
  
  /**
   * 注册工具执行器
   */
  public registerExecutor(toolName: string, executor: ToolExecutor): void {
    this.executors.set(toolName, executor);
    console.log(`🔧 [执行器注册] ${toolName}`);
  }
  
  /**
   * 获取所有工具
   */
  public getAllTools(): ClaudeToolDefinition[] {
    return Array.from(this.tools.values());
  }
  
  /**
   * 根据分类获取工具
   */
  public getToolsByCategory(category: ToolCategory): ClaudeToolDefinition[] {
    return Array.from(this.tools.values())
      .filter(tool => tool.category === category)
      .sort((a, b) => b.priority - a.priority); // 按优先级排序
  }
  
  /**
   * 根据名称获取工具
   */
  public getToolByName(name: string): ClaudeToolDefinition | undefined {
    return this.tools.get(name);
  }
  
  /**
   * 获取工具执行器
   */
  public getExecutor(toolName: string): ToolExecutor | undefined {
    return this.executors.get(toolName);
  }
  
  /**
   * 获取工具配置
   */
  public getConfig(toolName: string): ToolConfig | undefined {
    return this.configs.get(toolName);
  }
  
  /**
   * 根据用户角色获取推荐工具
   */
  public getRecommendedTools(userRole: string, limit: number = 10): ClaudeToolDefinition[] {
    const rolePriorities = USER_ROLE_PRIORITIES[userRole];
    
    if (!rolePriorities) {
      // 没有角色特定优先级，返回默认排序
      return this.getAllTools()
        .sort((a, b) => b.priority - a.priority)
        .slice(0, limit);
    }
    
    // 根据用户角色对工具进行加权排序
    return this.getAllTools()
      .map(tool => ({
        tool,
        score: (tool.priority || 5) + (rolePriorities[tool.category] || 5)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.tool);
  }
  
  /**
   * 搜索工具
   */
  public searchTools(query: string): ClaudeToolDefinition[] {
    const searchTerm = query.toLowerCase();
    
    return this.getAllTools().filter(tool => {
      return (
        tool.name.toLowerCase().includes(searchTerm) ||
        tool.description.toLowerCase().includes(searchTerm) ||
        tool.metadata?.tags?.some(tag => tag.toLowerCase().includes(searchTerm)) ||
        tool.category.toLowerCase().includes(searchTerm)
      );
    });
  }
  
  /**
   * 获取工具统计信息
   */
  public getToolStats(): {
    total: number;
    byCategory: Record<ToolCategory, number>;
    byVersion: Record<string, number>;
    executorsCovered: number;
  } {
    const tools = this.getAllTools();
    
    const byCategory = tools.reduce((acc, tool) => {
      acc[tool.category] = (acc[tool.category] || 0) + 1;
      return acc;
    }, {} as Record<ToolCategory, number>);
    
    const byVersion = tools.reduce((acc, tool) => {
      const version = tool.metadata?.version || 'unknown';
      acc[version] = (acc[version] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      total: tools.length,
      byCategory,
      byVersion,
      executorsCovered: this.executors.size
    };
  }
  
  /**
   * 验证工具完整性
   */
  public validateToolIntegrity(): {
    valid: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];
    
    // 检查是否所有工具都有执行器
    const toolNames = Array.from(this.tools.keys());
    for (const toolName of toolNames) {
      if (!this.executors.has(toolName)) {
        issues.push(`工具 ${toolName} 缺少执行器`);
        suggestions.push(`为 ${toolName} 注册执行器`);
      }
    }
    
    // 检查工具描述长度
    const allTools = Array.from(this.tools.values());
    for (const tool of allTools) {
      if (tool.description.length < 100) {
        issues.push(`工具 ${tool.name} 的描述过短 (${tool.description.length} 字符)`);
        suggestions.push(`为 ${tool.name} 添加更详细的描述以符合Claude最佳实践`);
      }
    }
    
    // 检查分类覆盖
    const categories = Object.values(ToolCategory);
    for (const category of categories) {
      const toolsInCategory = this.getToolsByCategory(category);
      if (toolsInCategory.length === 0) {
        issues.push(`分类 ${category} 没有工具`);
        suggestions.push(`考虑为 ${category} 分类添加工具`);
      }
    }
    
    return {
      valid: issues.length === 0,
      issues,
      suggestions
    };
  }
}

// 导出工具注册表实例
export const toolRegistry = ToolRegistryManager.getInstance();

// 便捷访问函数
export function getAllTools(): ClaudeToolDefinition[] {
  return toolRegistry.getAllTools();
}

export function getToolsByCategory(category: ToolCategory): ClaudeToolDefinition[] {
  return toolRegistry.getToolsByCategory(category);
}

export function getToolByName(name: string): ClaudeToolDefinition | undefined {
  return toolRegistry.getToolByName(name);
}

export function getRecommendedTools(userRole: string, limit?: number): ClaudeToolDefinition[] {
  return toolRegistry.getRecommendedTools(userRole, limit);
}

export function searchTools(query: string): ClaudeToolDefinition[] {
  return toolRegistry.searchTools(query);
}

/**
 * 工具选择智能算法
 */
export function selectOptimalTools(params: {
  userInput: string;
  userRole?: string;
  maxTools?: number;
  categories?: ToolCategory[];
}): ClaudeToolDefinition[] {
  const { userInput, userRole, maxTools = 3, categories } = params;
  
  // 1. 基于用户输入进行初步筛选
  let candidateTools = toolRegistry.getAllTools();
  
  // 2. 如果指定了分类，先按分类筛选
  if (categories && categories.length > 0) {
    candidateTools = candidateTools.filter(tool => 
      categories.includes(tool.category)
    );
  }
  
  // 3. 基于输入内容匹配
  const inputLower = userInput.toLowerCase();
  const scoredTools = candidateTools.map(tool => {
    let score = tool.priority || 5;
    
    // 名称匹配加分
    if (tool.name.toLowerCase().includes('github') && inputLower.includes('github')) {
      score += 10;
    }
    if (tool.name.toLowerCase().includes('linkedin') && inputLower.includes('linkedin')) {
      score += 10;
    }
    if (tool.name.toLowerCase().includes('webpage') && /https?:\/\//.test(userInput)) {
      score += 8;
    }
    if (tool.name.toLowerCase().includes('document') && /\.(pdf|docx|doc|txt)/.test(inputLower)) {
      score += 8;
    }
    
    // 用户角色加权
    if (userRole) {
      const rolePriorities = USER_ROLE_PRIORITIES[userRole];
      if (rolePriorities) {
        score += rolePriorities[tool.category] || 0;
      }
    }
    
    return { tool, score };
  });
  
  // 4. 排序并返回前N个工具
  return scoredTools
    .sort((a, b) => b.score - a.score)
    .slice(0, maxTools)
    .map(item => item.tool);
}

/**
 * 生成工具使用报告
 */
export function generateToolReport(): string {
  const stats = toolRegistry.getToolStats();
  const integrity = toolRegistry.validateToolIntegrity();
  
  let report = `# Claude工具注册表报告\n\n`;
  report += `## 📊 统计信息\n`;
  report += `- 总工具数: ${stats.total}\n`;
  report += `- 已注册执行器: ${stats.executorsCovered}\n\n`;
  
  report += `## 📂 分类统计\n`;
  Object.entries(stats.byCategory).forEach(([category, count]) => {
    report += `- ${category}: ${count} 个工具\n`;
  });
  
  report += `\n## ✅ 完整性检查\n`;
  report += `状态: ${integrity.valid ? '✅ 通过' : '❌ 存在问题'}\n`;
  
  if (integrity.issues.length > 0) {
    report += `\n### 问题:\n`;
    integrity.issues.forEach(issue => {
      report += `- ${issue}\n`;
    });
  }
  
  if (integrity.suggestions.length > 0) {
    report += `\n### 建议:\n`;
    integrity.suggestions.forEach(suggestion => {
      report += `- ${suggestion}\n`;
    });
  }
  
  return report;
} 