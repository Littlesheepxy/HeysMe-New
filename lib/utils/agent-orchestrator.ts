/**
 * Agent编排器 - 重构版本
 * 
 * 负责协调多个Agent的工作流程，使用模块化设计提高可维护性
 */

import { ConversationalWelcomeAgent } from '@/lib/agents/welcome';
import { OptimizedInfoCollectionAgent } from '@/lib/agents/info-collection';
import { PromptOutputAgent } from '@/lib/agents/prompt-output-agent';
import { CodingAgent } from '@/lib/agents/coding-agent';
import { BaseAgent } from '@/lib/agents/base-agent';
import { SessionData } from '@/lib/types/session';
import { StreamableAgentResponse } from '@/lib/types/streaming';
import { UserInteractionResult } from './types/orchestrator';
import { sessionManager } from './session-manager';
import { agentMappings } from './agent-mappings';

/**
 * Agent编排器类
 * 
 * 专注于Agent的协调和流程控制，会话管理委托给SessionManager
 */
export class AgentOrchestrator {
  private agents: Map<string, BaseAgent>;
  private currentAgent: string = '';

  constructor() {
    this.agents = new Map();
    this.initializeAgents();
  }

  /**
   * 初始化所有Agents
   */
  private initializeAgents(): void {
    this.agents.set('welcome', new ConversationalWelcomeAgent());
    this.agents.set('info_collection', new OptimizedInfoCollectionAgent());
    this.agents.set('prompt_output', new PromptOutputAgent());
    this.agents.set('coding', new CodingAgent());
    
    console.log(`✅ [编排器] 初始化了 ${this.agents.size} 个Agent`);
  }

  /**
   * 处理用户输入的流式响应
   * @param sessionId 会话ID
   * @param userInput 用户输入
   * @param sessionData 可选的会话数据
   * @param context 可选的上下文参数
   */
  async* processUserInputStreaming(
    sessionId: string,
    userInput: string,
    sessionData?: SessionData,
    context?: Record<string, any>
  ): AsyncGenerator<StreamableAgentResponse, void, unknown> {
    console.log(`\n🚀 [编排器] 开始处理用户输入`);
    console.log(`📝 [用户输入] ${userInput}`);
    console.log(`🆔 [会话ID] ${sessionId}`);
    
    try {
      // 获取或创建会话
      const session = await this.getOrCreateSession(sessionId, sessionData);
      
      console.log(`📊 [会话状态] 当前阶段: ${session.metadata.progress.currentStage}, 进度: ${session.metadata.progress.percentage}%`);
      
      // 确定当前Agent
      const agentName = this.determineCurrentAgent(session, userInput, context);
      const agent = this.agents.get(agentName);
      
      if (!agent) {
        throw new Error(`Agent ${agentName} not found`);
      }

      this.currentAgent = agentName;
      console.log(`🎯 [编排器] 使用 ${agentName} 处理请求，context:`, context);

      // 流式执行Agent处理
      yield* this.executeAgentStreaming(agent, agentName, userInput, session, context);

    } catch (error) {
      console.error(`❌ [编排器] 流程错误:`, error);
      yield this.createErrorResponse(error as Error, sessionData);
    }
  }

  /**
   * 处理用户交互
   * @param sessionId 会话ID
   * @param interactionType 交互类型
   * @param data 交互数据
   * @param sessionData 会话数据
   */
  async handleUserInteraction(
    sessionId: string,
    interactionType: string,
    data: any,
    sessionData: SessionData
  ): Promise<UserInteractionResult> {
    try {
      console.log(`🔄 [编排器] 处理用户交互:`, {
        sessionId,
        interactionType,
        currentAgent: this.getCurrentAgentFromSession(sessionData)
      });

      const currentAgentName = this.getCurrentAgentFromSession(sessionData);
      const agent = this.agents.get(currentAgentName);
      
      if (!agent) {
        throw new Error(`Current agent ${currentAgentName} not found`);
      }

      // 委托给当前Agent处理交互
      const result = await agent.handleInteraction?.(interactionType, data, sessionData);
      
      console.log(`📋 [交互处理结果]`, {
        action: result?.action,
        hasConfirmedInfo: !!result?.confirmed_info,
        summary: result?.summary
      });
      
      // 更新会话状态
      this.updateSessionAfterInteraction(sessionData);
      
      // 处理跳转逻辑
      return this.handleInteractionResult(result, currentAgentName, sessionData);
      
    } catch (error) {
      console.error('❌ [编排器] 用户交互处理失败:', error);
      
      // 记录错误
      sessionData.metadata.metrics.errorsEncountered++;
      sessionData.metadata.updatedAt = new Date();
      
      throw error;
    }
  }

  /**
   * 推进到下一阶段
   * @param sessionData 会话数据
   */
  async advanceStage(sessionData: SessionData): Promise<string | null> {
    const currentStage = sessionData.metadata.progress.currentStage;
    const nextAgent = agentMappings.getNextAgent(currentStage);
    
    if (nextAgent) {
      sessionData.metadata.progress.currentStage = agentMappings.getStageFromAgent(nextAgent);
      sessionData.metadata.progress.completedStages.push(currentStage);
      sessionData.metadata.progress.percentage = agentMappings.calculateProgress(nextAgent);
    }
    
    return nextAgent;
  }

  /**
   * 重置会话到指定阶段
   * @param sessionId 会话ID
   * @param stageName 阶段名称
   */
  async resetSessionToStage(sessionId: string, stageName: string): Promise<boolean> {
    try {
      const sessionData = await sessionManager.getSession(sessionId);
      if (!sessionData) return false;

      if (!agentMappings.isValidStage(stageName)) {
        throw new Error(`Invalid stage name: ${stageName}`);
      }

      this.resetSessionToStageInternal(sessionData, stageName);
      sessionManager.updateSession(sessionId, sessionData);
      
      return true;
    } catch (error) {
      console.error('❌ [编排器] 重置会话失败:', error);
      return false;
    }
  }

  // ============== 会话相关API ==============

  /**
   * 获取会话数据
   */
  async getSessionData(sessionId: string): Promise<SessionData | null> {
    return await sessionManager.getSession(sessionId);
  }
  
  /**
   * 获取会话数据（同步版本，用于兼容）
   */
  getSessionDataSync(sessionId: string): SessionData | null {
    return sessionManager.getSessionSync(sessionId);
  }

  /**
   * 创建新会话
   */
  async createSession(initialInput?: any): Promise<string> {
    return await sessionManager.createSession(initialInput);
  }

  /**
   * 获取会话状态
   */
  async getSessionStatus(sessionId: string): Promise<any> {
    const sessionData = await sessionManager.getSession(sessionId);
    if (!sessionData) return null;

    return {
      sessionId,
      currentStage: sessionData.metadata.progress.currentStage,
      overallProgress: sessionData.metadata.progress.percentage,
      status: sessionData.status,
      createdAt: sessionData.metadata.createdAt,
      lastActive: sessionData.metadata.lastActive
    };
  }

  /**
   * 获取所有活跃会话
   */
  async getAllActiveSessions(): Promise<SessionData[]> {
    return await sessionManager.getAllActiveSessions();
  }

  /**
   * 获取会话统计信息
   */
  getSessionStats() {
    return sessionManager.getSessionStats();
  }

  /**
   * 获取会话健康状态
   */
  getSessionHealth(sessionData: SessionData) {
    return sessionManager.getSessionHealth(sessionData);
  }

  /**
   * 获取错误恢复建议
   */
  getRecoveryRecommendation(sessionData: SessionData, error: Error) {
    return sessionManager.getRecoveryRecommendation(sessionData, error);
  }

  // ============== 私有方法 ==============

  /**
   * 获取或创建会话
   */
  private async getOrCreateSession(sessionId: string, sessionData?: SessionData): Promise<SessionData> {
    let session = sessionData;
    
    if (!session) {
      session = (await sessionManager.getSession(sessionId)) || undefined;
      
      if (!session) {
        console.log(`🆕 [编排器] 未找到会话 ${sessionId}，创建新会话`);
        session = this.createNewSession(sessionId);
        sessionManager.updateSession(sessionId, session);
      } else {
        console.log(`✅ [编排器] 找到会话 ${sessionId}`);
      }
    } else {
      console.log(`✅ [编排器] 使用传入的会话数据 ${sessionId}`);
      sessionManager.updateSession(sessionId, session);
    }
    
    return session;
  }

  /**
   * 创建新会话数据
   */
  private createNewSession(sessionId: string): SessionData {
    return {
      id: sessionId,
      status: 'active',
      userIntent: {
        type: 'career_guidance',
        target_audience: 'internal_review',
        urgency: 'exploring',
        primary_goal: '了解需求'
      },
      personalization: {
        identity: {
          profession: 'other',
          experience_level: 'mid'
        },
        preferences: {
          style: 'modern',
          tone: 'professional',
          detail_level: 'detailed'
        },
        context: {}
      },
      collectedData: {
        personal: {},
        professional: { skills: [] },
        experience: [],
        education: [],
        projects: [],
        achievements: [],
        certifications: []
      },
      conversationHistory: [],
      agentFlow: [],
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        lastActive: new Date(),
        version: '1.0.0',
        progress: {
          currentStage: 'welcome',
          completedStages: [],
          totalStages: 4,
          percentage: 0
        },
        metrics: {
          totalTime: 0,
          userInteractions: 0,
          agentTransitions: 0,
          errorsEncountered: 0
        },
        settings: {
          autoSave: true,
          reminderEnabled: false,
          privacyLevel: 'private'
        }
      }
    };
  }

  /**
   * 确定当前应该使用的Agent
   */
  private determineCurrentAgent(session: SessionData, userInput: string, context?: Record<string, any>): string {
    // 🔧 优先检查context中的强制Agent指定
    if (context?.forceAgent) {
      console.log(`🎯 [编排器] Context中强制使用Agent: ${context.forceAgent}`);
      return context.forceAgent;
    }
    
    // 检查是否有强制指定的Agent（保留兼容性）
    const forceAgentMatch = userInput.match(/\[FORCE_AGENT:(\w+)\]/);
    if (forceAgentMatch) {
      const forceAgent = forceAgentMatch[1];
      console.log(`🎯 [编排器] 用户输入中强制使用Agent: ${forceAgent}`);
      return forceAgent;
    }
    
    const currentStage = session.metadata.progress.currentStage;
    const agentName = agentMappings.getAgentFromStage(currentStage);
    
    console.log(`🎯 [编排器] 阶段 ${currentStage} -> Agent ${agentName}`);
    return agentName;
  }

  /**
   * 流式执行Agent
   */
  private async* executeAgentStreaming(
    agent: BaseAgent,
    agentName: string,
    userInput: string,
    session: SessionData,
    context?: Record<string, any>
  ): AsyncGenerator<StreamableAgentResponse, void, unknown> {
    const agentStartTime = new Date();
    console.log(`⏰ [编排器] ${agentName} 开始处理 (${agentStartTime.toISOString()})`);
    
    let responseCount = 0;
    for await (const response of agent.process({ user_input: userInput }, session, context)) {
      responseCount++;
      console.log(`📤 [编排器] ${agentName} 第${responseCount}个响应:`, {
        hasReply: !!response.immediate_display?.reply,
        replyLength: response.immediate_display?.reply?.length || 0,
        intent: response.system_state?.intent,
        done: response.system_state?.done,
        hasInteraction: !!response.interaction
      });
      
      // 如果Agent完成，处理后续流程
      if (response.system_state?.done) {
        console.log(`✅ [编排器] ${agentName} 处理完毕`);
        
        // 记录完成情况
        sessionManager.recordAgentCompletion(session, agentName, agentStartTime, response);
        
        // 🔧 修复：检查是否为静默推进，如果是则不发送空响应
        const isSilentAdvance = response.system_state?.metadata?.silent_advance;
        if (!isSilentAdvance || (response.immediate_display?.reply && response.immediate_display.reply.trim())) {
          yield response; // 只有在非静默推进或有实际内容时才发送响应
        }
        
        // 检查是否需要推进到下一个Agent
        const nextAgent = this.getNextAgent(agentName, response);
        if (nextAgent) {
          console.log(`🔄 [编排器] 准备启动下一个Agent: ${nextAgent}`);
          yield* this.transitionToNextAgent(nextAgent, session, userInput);
        } else {
          console.log(`⏹️  [编排器] 流程结束，无需跳转下一个Agent`);
          session.status = 'completed';
        }
        break;
      } else {
        // 🔧 对于未完成的响应，正常发送
        yield response;
      }
    }

    console.log(`📊 [编排器] ${agentName} 总计产生 ${responseCount} 个响应`);
  }

  /**
   * 获取下一个Agent
   */
  private getNextAgent(currentAgent: string, response: StreamableAgentResponse): string | null {
    console.log(`🔍 [编排器] Agent跳转检查: ${currentAgent}`);
    console.log(`🔍 [编排器] 响应状态:`, {
      intent: response.system_state?.intent,
      done: response.system_state?.done,
      metadata: response.system_state?.metadata
    });

    if (response.system_state?.intent === 'advance') {
      console.log(`✅ [编排器] intent = 'advance'，检查具体跳转条件...`);
      
      // 特殊处理 Welcome Agent
      if (currentAgent === 'welcome') {
        const completionStatus = response.system_state?.metadata?.completion_status || 
                                response.system_state?.metadata?.completionStatus;
        console.log(`🔍 [编排器] Welcome Agent检查 completion_status: ${completionStatus}`);
        
        if (completionStatus !== 'ready') {
          console.log(`⏸️  [编排器] Welcome Agent 未完成收集，继续当前阶段`);
          return null;
        }
        console.log(`✅ [编排器] Welcome Agent 收集完成，准备跳转`);
      }
      
      const nextAgent = agentMappings.getNextAgent(currentAgent);
      console.log(`🚀 [编排器] Agent跳转: ${currentAgent} -> ${nextAgent}`);
      return nextAgent;
    } else {
      console.log(`❌ [编排器] intent != 'advance' (实际: ${response.system_state?.intent})`);
    }
    
    return null;
  }

  /**
   * 转换到下一个Agent
   */
  private async* transitionToNextAgent(
    nextAgentName: string,
    session: SessionData,
    userInput?: string
  ): AsyncGenerator<StreamableAgentResponse, void, unknown> {
    const nextAgent = this.agents.get(nextAgentName);
    
    if (!nextAgent) {
      throw new Error(`Next agent ${nextAgentName} not found`);
    }

    // 更新会话状态
    session.metadata.progress.currentStage = agentMappings.getStageFromAgent(nextAgentName);
    session.metadata.progress.percentage = agentMappings.calculateProgress(nextAgentName);
    session.metadata.metrics.agentTransitions++;

    this.currentAgent = nextAgentName;

    console.log(`🔄 [编排器] 启动Agent: ${nextAgentName}, 阶段: ${session.metadata.progress.currentStage}`);

    // 🆕 特殊处理：info_collection agent前添加引导词
    if (nextAgentName === 'info_collection') {
      console.log(`🎯 [编排器] 进入信息收集阶段，发送引导词`);
      
      // 发送引导词响应
      const guideResponse: StreamableAgentResponse = {
        immediate_display: {
          reply: `我们现在正式进入信息收集阶段 🎯  
你可以直接发送任何你觉得有用的素材，我会自动识别并提取重点：

🔗 链接（作品集、社交媒体、GitHub、文章等）  
📄 文档（简历、项目介绍、讲稿等）  
✍️ 文本描述（项目经历、技能总结、个人介绍等）

无论内容多少，我都会根据你的输入进行智能分析和对话探索，帮你提炼出最具价值的亮点。

如果你希望快速预览一个页面草稿，也可以直接回复"跳过"或"快进" 👇`,
          agent_name: 'system',
          timestamp: new Date().toISOString()
        },
        system_state: {
          intent: 'transition_guide',
          done: false,
          progress: session.metadata.progress.percentage,
          current_stage: session.metadata.progress.currentStage,
          metadata: {
            transition_type: 'info_collection_guide',
            waiting_for_user_input: true
          }
        }
      };
      
      console.log(`📤 [编排器] 发送信息收集引导词: {
  hasReply: true,
  replyLength: ${guideResponse.immediate_display?.reply?.length || 0},
  intent: '${guideResponse.system_state?.intent}',
  done: ${guideResponse.system_state?.done}
}`);
      
      yield guideResponse;
      
      // 不立即启动agent，等待用户输入
      return;
    }

    // 对于其他agent，直接启动（传递空字符串作为初始输入）
    yield* this.executeAgentStreaming(nextAgent, nextAgentName, userInput || '', session, undefined);
  }

  /**
   * 从会话中获取当前Agent
   */
  private getCurrentAgentFromSession(session: SessionData): string {
    const currentStage = session.metadata.progress.currentStage;
    return agentMappings.getAgentFromStage(currentStage);
  }

  /**
   * 更新会话状态（交互后）
   */
  private updateSessionAfterInteraction(sessionData: SessionData): void {
    sessionData.metadata.metrics.userInteractions++;
    sessionData.metadata.lastActive = new Date();
  }

  /**
   * 处理交互结果
   */
  private handleInteractionResult(
    result: any,
    currentAgentName: string,
    sessionData: SessionData
  ): UserInteractionResult {
    if (result?.action === 'advance') {
      console.log(`🚀 [编排器] Agent返回advance，准备跳转到下一阶段`);
      const nextAgent = agentMappings.getNextAgent(currentAgentName);
      if (nextAgent) {
        sessionData.metadata.progress.currentStage = agentMappings.getStageFromAgent(nextAgent);
        console.log(`➡️  [编排器] ${currentAgentName} -> ${nextAgent}`);
        return { ...result, nextAgent };
      }
    } else if (result?.action === 'continue') {
      console.log(`⏸️  [编排器] Agent返回continue，保持在当前阶段`);
    } else {
      console.log(`🔍 [编排器] Agent返回${result?.action || 'unknown'}，等待进一步操作`);
    }
    
    return result;
  }

  /**
   * 重置会话到指定阶段（内部方法）
   */
  private resetSessionToStageInternal(sessionData: SessionData, stageName: string): void {
    console.log(`🔄 [编排器] 重置会话到阶段: ${stageName}`);
    
    const stages = agentMappings.getAllStages();
    const stageIndex = stages.indexOf(stageName);
    
    if (stageIndex >= 0) {
      // 更新进度信息
      sessionData.metadata.progress.currentStage = stageName;
      sessionData.metadata.progress.completedStages = sessionData.metadata.progress.completedStages.slice(0, stageIndex);
      sessionData.metadata.progress.percentage = agentMappings.calculateProgress(stageName);
      sessionData.metadata.updatedAt = new Date();
      
      // 清理当前的Agent状态
      this.currentAgent = '';
      
      // 记录重置操作到Agent流程中
      sessionData.agentFlow.push({
        id: `reset_${Date.now()}`,
        agent: 'system',
        startTime: new Date(),
        endTime: new Date(),
        status: 'completed',
        input: { action: 'reset_to_stage', stage: stageName },
        output: {
          immediate_display: {
            reply: `会话已重置到${stageName}阶段`,
            agent_name: 'system',
            timestamp: new Date().toISOString()
          },
          system_state: {
            intent: 'reset',
            done: true,
            progress: agentMappings.calculateProgress(stageName),
            current_stage: stageName,
            metadata: { 
              resetAction: true, 
              previousStage: sessionData.metadata.progress.currentStage 
            }
          }
        }
      });
      
      console.log('✅ [编排器] 会话重置完成');
    } else {
      throw new Error(`Invalid stage name: ${stageName}`);
    }
  }

  /**
   * 创建错误响应
   */
  private createErrorResponse(error: Error, sessionData?: SessionData): StreamableAgentResponse {
    return {
      immediate_display: {
        reply: `抱歉，处理过程中出现了错误：${error.message}`,
        agent_name: 'system',
        timestamp: new Date().toISOString()
      },
      system_state: {
        intent: 'error',
        done: false,
        progress: sessionData?.metadata.progress.percentage || 0,
        current_stage: 'error_handling',
        metadata: {
          error: error.message,
          stack: error.stack
        }
      }
    };
  }
}

// 导出单例实例
export const agentOrchestrator = new AgentOrchestrator(); 