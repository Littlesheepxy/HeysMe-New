/**
 * Agent映射和配置管理
 * 
 * 负责管理Agent与阶段之间的映射关系，提供统一的配置接口
 */

import { AgentMappingConfig } from './types/orchestrator';

/**
 * Agent映射配置管理器
 */
export class AgentMappingManager {
  private readonly config: AgentMappingConfig;

  constructor() {
    this.config = {
      // Agent名称到阶段的映射
      agentToStage: {
        'welcome': 'welcome',
        'info_collection': 'info_collection',
        'prompt_output': 'page_design',
        'coding': 'code_generation'
      },

      // 阶段到Agent名称的映射
      stageToAgent: {
        'start': 'welcome',
        'welcome': 'welcome',
        'info_collection': 'info_collection',
        'page_design': 'prompt_output',
        'code_generation': 'coding'
      },

      // Agent执行序列
      agentSequence: ['welcome', 'info_collection', 'prompt_output', 'coding'],

      // 阶段进度百分比
      stageProgress: {
        'start': 0,
        'welcome': 10,
        'info_collection': 40,
        'page_design': 70,
        'code_generation': 90
      }
    };
  }

  /**
   * 获取Agent对应的阶段名称
   */
  getStageFromAgent(agentName: string): string {
    return this.config.agentToStage[agentName] || agentName;
  }

  /**
   * 获取阶段对应的Agent名称
   */
  getAgentFromStage(stageName: string): string {
    // 特殊处理：将历史的 "start" 阶段映射到 "welcome"
    if (stageName === 'start') {
      console.log(`⚠️  [映射] 发现历史 "start" 阶段，自动映射到 "welcome"`);
      return 'welcome';
    }
    
    return this.config.stageToAgent[stageName] || stageName;
  }

  /**
   * 获取下一个Agent名称
   * @param currentAgent 当前Agent名称
   * @returns 下一个Agent名称，如果是最后一个则返回null
   */
  getNextAgent(currentAgent: string): string | null {
    const currentIndex = this.config.agentSequence.indexOf(currentAgent);
    
    if (currentIndex >= 0 && currentIndex < this.config.agentSequence.length - 1) {
      const nextAgent = this.config.agentSequence[currentIndex + 1];
      console.log(`➡️  Agent序列跳转: ${currentAgent} -> ${nextAgent}`);
      return nextAgent;
    }
    
    console.log(`🏁 Agent序列完成: ${currentAgent} 是最后一个`);
    return null;
  }

  /**
   * 计算阶段进度百分比
   */
  calculateProgress(stage: string): number {
    return this.config.stageProgress[stage] || 0;
  }

  /**
   * 标准化Agent名称（用于显示）
   */
  standardizeAgentName(agentName: string): string {
    // 🔧 修复：处理空值或null
    if (!agentName || agentName.trim() === '') {
      return 'UnknownAgent';
    }

    const nameMap: Record<string, string> = {
      'welcome': 'WelcomeAgent',
      'info_collection': 'InfoCollectionAgent',
      'prompt_output': 'PromptOutputAgent',
      'coding': 'CodingAgent',
      'unknown': 'UnknownAgent'
    };
    
    return nameMap[agentName.toLowerCase()] || `${agentName}Agent`;
  }

  /**
   * 检查Agent是否应该继续到下一个
   */
  shouldContinueToNextAgent(currentAgent: string): boolean {
    // CodingAgent是最后一个，不应该继续
    return currentAgent !== 'coding';
  }

  /**
   * 获取所有可用的Agent序列
   */
  getAgentSequence(): string[] {
    return [...this.config.agentSequence];
  }

  /**
   * 获取所有阶段列表
   */
  getAllStages(): string[] {
    return Object.keys(this.config.stageProgress);
  }

  /**
   * 验证阶段名称是否有效
   */
  isValidStage(stageName: string): boolean {
    return this.getAllStages().includes(stageName);
  }

  /**
   * 验证Agent名称是否有效
   */
  isValidAgent(agentName: string): boolean {
    return this.config.agentSequence.includes(agentName);
  }
}

// 导出单例实例
export const agentMappings = new AgentMappingManager(); 