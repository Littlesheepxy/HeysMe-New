import { 
  StreamableAgentResponse, 
  AgentCapabilities, 
  RoutingDecision,
  UserIntent,
  PersonalizationProfile
} from '@/lib/types/streaming';
import { SessionData } from '@/lib/types/session';
import { NextRequest, NextResponse } from 'next/server';
import { agentOrchestrator } from '@/lib/utils/agent-orchestrator';

/**
 * 基础Agent抽象类
 * 提供流式输出、交互处理和会话管理的基础功能
 */
export abstract class BaseAgent {
  protected name: string;
  protected capabilities: AgentCapabilities;
  protected retryCount: number = 0;
  protected conversationHistory: Map<string, Array<{ role: 'system' | 'user' | 'assistant', content: string }>> = new Map();
  protected systemPromptSent: Map<string, boolean> = new Map();

  constructor(name: string, capabilities: AgentCapabilities) {
    this.name = name;
    this.capabilities = capabilities;
  }

  /**
   * 获取Agent名称
   */
  getName(): string {
    return this.name;
  }

  /**
   * 获取Agent能力
   */
  getCapabilities(): AgentCapabilities {
    return this.capabilities;
  }

  /**
   * 主要处理方法 - 支持流式输出
   * 子类必须实现此方法
   */
  abstract process(
    input: any,
    sessionData: SessionData,
    context?: Record<string, any>
  ): AsyncGenerator<StreamableAgentResponse, void, unknown>;

  /**
   * 验证输入数据
   * 子类可以重写此方法来实现自定义验证
   */
  protected validateInput(input: any): { valid: boolean; errors?: string[] } {
    return { valid: true };
  }

  /**
   * 处理用户交互响应
   * 子类可以重写此方法来处理特定的交互类型
   */
  async handleInteraction(
    interactionType: string,
    data: any,
    sessionData: SessionData
  ): Promise<any> {
    return data;
  }

  /**
   * 决定下一个Agent
   * 子类可以重写此方法来实现智能路由
   */
  protected determineNextAgent(
    sessionData: SessionData,
    currentOutput?: StreamableAgentResponse
  ): RoutingDecision | null {
    return null;
  }

  /**
   * 生成基础响应结构
   */
  protected createResponse(partial: Partial<StreamableAgentResponse> = {}): StreamableAgentResponse {
    const timestamp = new Date().toISOString();
    
    return {
      type: 'agent_response',  // 🔑 关键修复：确保所有Agent响应都有正确的type字段
      immediate_display: {
        reply: '',
        agent_name: this.name,
        timestamp,
        ...partial.immediate_display
      },
      system_state: {
        intent: 'processing',
        done: false,
        ...partial.system_state
      },
      session_context: {
        session_id: '',
        ...partial.session_context
      },
      ...partial
    };
  }

  /**
   * 创建思考中的响应
   */
  protected createThinkingResponse(thinking: string, progress?: number): StreamableAgentResponse {
    return this.createResponse({
      immediate_display: {
        reply: '',
        thinking,
        agent_name: this.name,
        timestamp: new Date().toISOString()
      },
      system_state: {
        intent: 'thinking',
        done: false,
        progress,
        current_stage: '分析中...'
      }
    });
  }

  /**
   * 创建交互请求响应
   */
  protected createInteractionResponse(
    reply: string,
    interaction: StreamableAgentResponse['interaction']
  ): StreamableAgentResponse {
    return this.createResponse({
      immediate_display: {
        reply,
        agent_name: this.name,
        timestamp: new Date().toISOString()
      },
      interaction,
      system_state: {
        intent: 'awaiting_interaction',
        done: false
      }
    });
  }

  /**
   * 🎯 遵循Claude官方最佳实践的Agent结束判断
   * 基于stop_reason和响应内容判断Agent是否应该结束
   */
  protected shouldAgentContinue(
    response: any,
    context?: {
      maxTurns?: number;
      currentTurn?: number;
      forceComplete?: boolean;
    }
  ): { shouldContinue: boolean; reason: string; nextAction?: string } {
    const stopReason = response.metadata?.stopReason || 'end_turn';
    const currentTurn = context?.currentTurn || 1;
    const maxTurns = context?.maxTurns || 10;
    
    console.log(`🤔 [结束判断] 检查Agent是否应该继续:`, {
      stopReason,
      currentTurn,
      maxTurns,
      forceComplete: context?.forceComplete
    });

    // 🔧 强制完成模式
    if (context?.forceComplete) {
      return {
        shouldContinue: false,
        reason: 'force_complete',
        nextAction: 'terminate'
      };
    }

    // 🔧 达到最大轮次限制
    if (currentTurn >= maxTurns) {
      console.warn(`⚠️ [轮次限制] 达到最大对话轮次 ${maxTurns}`);
      return {
        shouldContinue: false,
        reason: 'max_turns_reached',
        nextAction: 'terminate'
      };
    }

    // 🔧 根据Claude的stop_reason进行判断
    switch (stopReason) {
      case 'tool_use':
        // Claude请求使用工具，需要继续对话
        return {
          shouldContinue: true,
          reason: 'tool_use_required',
          nextAction: 'execute_tools'
        };

      case 'max_tokens':
        // Token限制，可能需要继续或者优化prompt
        console.warn(`⚠️ [Token限制] 响应可能不完整`);
        return {
          shouldContinue: true,
          reason: 'incomplete_due_to_tokens',
          nextAction: 'continue_with_larger_context'
        };

      case 'end_turn':
        // Claude自然结束回答
        return {
          shouldContinue: false,
          reason: 'natural_completion',
          nextAction: 'finalize'
        };

      case 'stop_sequence':
        // 遇到停止序列
        return {
          shouldContinue: false,
          reason: 'stop_sequence_triggered',
          nextAction: 'finalize'
        };

      default:
        // 未知停止原因，保守处理
        console.warn(`⚠️ [未知停止原因] ${stopReason}`);
        return {
          shouldContinue: false,
          reason: 'unknown_stop_reason',
          nextAction: 'terminate'
        };
    }
  }

  /**
   * 🎯 创建Agent完成响应（遵循Claude最佳实践）
   */
  protected createCompletionResponse(
    reply: string,
    nextAgent?: string,
    metadata?: Record<string, any>,
    completionReason?: string
  ): StreamableAgentResponse {
    console.log(`🏁 [Agent完成] 创建完成响应:`, {
      nextAgent,
      completionReason,
      replyLength: reply.length
    });

    return this.createResponse({
      immediate_display: {
        reply,
        agent_name: this.name,
        timestamp: new Date().toISOString()
      },
      system_state: {
        intent: nextAgent ? 'advance' : 'complete',
        done: true,
        progress: 100,
        current_stage: nextAgent ? `准备切换到${nextAgent}` : '任务完成',
        metadata: {
          completionReason: completionReason || 'natural_completion',
          nextAgent,
          finalResponse: true,
          ...metadata
        }
      },
      // 🎯 如果有下一个Agent，提供路由信息
      ...(nextAgent && {
        routing: {
          nextAgent,
          shouldAdvance: true,
          context: metadata
        }
      })
    });
  }

  /**
   * 🎯 处理Agent任务完成的标准流程
   */
  protected async finalizeAgentTask(
    sessionData: SessionData,
    result: any,
    context?: Record<string, any>
  ): Promise<StreamableAgentResponse> {
    console.log(`🎯 [任务完成] ${this.name} 开始任务收尾`);

    // 更新会话元数据
    this.updateSessionMetadata(sessionData);
    
    // 标记任务完成
    const metadata = sessionData.metadata as any;
    metadata.lastCompletedAgent = this.name;
    metadata.completionTimestamp = new Date().toISOString();
    
    // 确定下一步行动
    const nextAgent = this.determineNextAgent(sessionData, result);
    
    if (nextAgent?.nextAgent) {
      console.log(`🔄 [任务切换] 准备切换到下一个Agent: ${nextAgent.nextAgent}`);
      return this.createCompletionResponse(
        `✅ ${this.name}任务完成！正在为您准备下一步...`,
        nextAgent.nextAgent,
        {
          handoverData: result,
          transitionContext: context,
          routingReasoning: nextAgent.reasoning,
          confidence: nextAgent.confidence
        },
        'advance_to_next_agent'
      );
    } else {
      console.log(`🏆 [完全完成] 所有任务已完成`);
      return this.createCompletionResponse(
        `🎉 太棒了！您的请求已经完成处理。`,
        undefined,
        {
          finalResult: result,
          processingComplete: true
        },
        'all_tasks_completed'
      );
    }
  }

  /**
   * 错误处理
   */
  protected async handleError(
    error: Error,
    sessionData: SessionData,
    context?: Record<string, any>
  ): Promise<StreamableAgentResponse> {
    console.error(`Error in ${this.name}:`, error);
    
    this.retryCount++;
    
    if (this.retryCount >= this.capabilities.maxRetries) {
      return this.createResponse({
        immediate_display: {
          reply: `抱歉，处理过程中遇到了问题。错误信息：${error.message}`,
          agent_name: this.name,
          timestamp: new Date().toISOString()
        },
        system_state: {
          intent: 'error',
          done: true,
          metadata: { error: error.message, retryCount: this.retryCount }
        }
      });
    }

    return this.createResponse({
      immediate_display: {
        reply: `遇到临时问题，正在重试... (${this.retryCount}/${this.capabilities.maxRetries})`,
        agent_name: this.name,
        timestamp: new Date().toISOString()
      },
      system_state: {
        intent: 'retrying',
        done: false,
        metadata: { error: error.message, retryCount: this.retryCount }
      }
    });
  }

  /**
   * 延迟工具函数
   */
  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 模拟流式输出 - 将长文本分块输出
   */
  protected async* streamText(
    text: string,
    chunkSize: number = 10,
    delayMs: number = 50
  ): AsyncGenerator<string, void, unknown> {
    for (let i = 0; i < text.length; i += chunkSize) {
      const chunk = text.slice(i, i + chunkSize);
      yield chunk;
      if (delayMs > 0) {
        await this.delay(delayMs);
      }
    }
  }

  /**
   * 生成个性化回复
   */
  protected generatePersonalizedReply(
    baseReply: string,
    personalization?: PersonalizationProfile
  ): string {
    if (!personalization) return baseReply;

    const { identity, preferences } = personalization;
    
    // 根据身份调整语调
    if (identity.profession === 'designer') {
      return baseReply.replace(/技术/g, '设计').replace(/开发/g, '创作');
    } else if (identity.profession === 'developer') {
      return baseReply.replace(/设计/g, '技术实现').replace(/创意/g, '解决方案');
    }

    // 根据偏好调整详细程度
    if (preferences.detail_level === 'concise') {
      return this.makeConcise(baseReply);
    } else if (preferences.detail_level === 'detailed') {
      return this.makeDetailed(baseReply);
    }

    return baseReply;
  }

  /**
   * 简化文本
   */
  private makeConcise(text: string): string {
    return text
      .replace(/另外，/g, '')
      .replace(/此外，/g, '')
      .replace(/需要注意的是，/g, '')
      .split('。')
      .slice(0, 3)
      .join('。') + '。';
  }

  /**
   * 详化文本
   */
  private makeDetailed(text: string): string {
    return text + '\n\n💡 我会根据您的具体情况提供更详细的建议和指导。';
  }

  /**
   * 获取进度百分比
   */
  protected calculateProgress(currentStep: number, totalSteps: number): number {
    return Math.round((currentStep / totalSteps) * 100);
  }

  /**
   * 检查会话超时
   */
  protected isSessionExpired(sessionData: SessionData): boolean {
    const now = new Date();
    const lastActivity = sessionData.metadata.lastActive;
    const timeoutMs = this.capabilities.timeout;
    
    return now.getTime() - lastActivity.getTime() > timeoutMs;
  }

  /**
   * 更新会话元数据
   */
  protected updateSessionMetadata(sessionData: SessionData): void {
    sessionData.metadata.lastActive = new Date();
    sessionData.metadata.metrics.userInteractions++;
  }

  /**
   * 🆕 获取当前Agent对应的session历史key
   */
  protected getAgentHistoryKey(): string {
    // 根据Agent名称返回对应的历史key
    switch (this.name) {
      case 'ConversationalWelcomeAgent':
        return 'welcomeHistory';
      case 'CodingAgent':
        return 'codingHistory';
      case 'OptimizedInfoCollectionAgent':
      case 'ConversationalInfoCollectionAgent':
        return 'infoCollectionHistory';
      default:
        return 'conversationHistory'; // 默认key
    }
  }

  // 调用 LLM 的通用方法（流式版本）
  protected async* callLLMStreaming(
    prompt: string,
    options?: {
      system?: string
      maxTokens?: number
      sessionId?: string
      useHistory?: boolean
      tools?: any[]
      sessionData?: any  // 🆕 添加sessionData用于历史恢复
    }
  ): AsyncGenerator<string, void, unknown> {
    try {
      console.log(`\n🔗 [Base Agent LLM Stream] ${this.name} - 开始流式调用 AI API`);
      
      const sessionId = options?.sessionId || 'default';
      const useHistory = options?.useHistory || false;
      
      console.log(`⚙️  [流式调用配置]`, {
        sessionId,
        useHistory,
        hasSystem: !!options?.system,
        systemLength: options?.system?.length || 0,
        maxTokens: options?.maxTokens,
        hasTools: !!options?.tools
      });
      
      let messages = [];
      
      if (useHistory) {
        console.log(`💬 [对话历史模式] 启用对话历史管理`);
        
        if (!this.conversationHistory.has(sessionId)) {
          this.conversationHistory.set(sessionId, []);
          console.log(`🆕 [历史创建] 为会话 ${sessionId} 创建新的对话历史`);
        }
        
        const history = this.conversationHistory.get(sessionId)!;
        console.log(`📚 [历史状态] 当前历史长度: ${history.length}`);
        
        if (!this.systemPromptSent.get(sessionId) && options?.system) {
          history.push({ role: 'system', content: options.system });
          this.systemPromptSent.set(sessionId, true);
          console.log(`📝 [System Prompt] 首次添加 system prompt (长度: ${options.system.length})`);
        } else if (this.systemPromptSent.get(sessionId)) {
          console.log(`✅ [System Prompt] System prompt 已存在，跳过添加`);
        }
        
        history.push({ role: 'user', content: prompt });
        messages = [...history]; // 复制数组避免修改原始历史
        
        console.log(`💬 [消息数组] 构建完成，总消息数: ${messages.length}`);
        messages.forEach((msg, index) => {
          const roleIcon = msg.role === 'user' ? '👤' : msg.role === 'assistant' ? '🤖' : '📝';
          const preview = msg.content.length > 100 ? msg.content.substring(0, 100) + '...' : msg.content;
          console.log(`  ${roleIcon} [${index}] ${preview}`);
        });
      } else {
        // 不使用历史，构建单次对话
        if (options?.system) {
          messages.push({ role: 'system', content: options.system });
        }
        messages.push({ role: 'user', content: prompt });
        console.log(`💬 [单次调用] 消息数: ${messages.length}`);
      }
      
      // 动态导入AI模型
      const { generateStreamWithModel } = await import('@/lib/ai-models');
      
      let accumulatedResponse = '';
      const startTime = Date.now();
      
      // 🆕 记录AI调用日志
      const aiCallLog: any = {
        timestamp: new Date().toISOString(),
        agentName: this.name,
        messageCount: messages.length,
        promptLength: prompt.length,
        systemLength: options?.system?.length || 0,
        useHistory,
        status: 'started'
      };
      
      // 🆕 保存完整的prompt和messages用于调试
      if (options?.sessionData?.metadata) {
        options.sessionData.metadata.lastAiPrompt = JSON.stringify(messages, null, 2);
        console.log(`📝 [AI调用记录] 保存完整prompt到调试数据 (${messages.length} 条消息)`);
      }
      
      // 流式调用AI模型
      const callOptions: any = { maxTokens: options?.maxTokens || 4000 };
      if (options?.tools) {
        callOptions.tools = options.tools;
      }
      
      for await (const chunk of generateStreamWithModel(
        'claude',
        'claude-sonnet-4-20250514',
        messages as Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
        callOptions
      )) {
        accumulatedResponse += chunk;
        yield chunk;
      }
      
      // 流式完成后，将AI响应添加到历史（如果使用历史）
      if (useHistory && accumulatedResponse) {
        const history = this.conversationHistory.get(sessionId)!;
        history.push({ role: 'assistant', content: accumulatedResponse });
        console.log(`✅ [历史更新] AI响应已添加到历史，总长度: ${history.length}`);
      }
      
      // 🆕 完成AI调用日志记录
      const endTime = Date.now();
      aiCallLog.status = 'completed';
      aiCallLog.duration = endTime - startTime;
      aiCallLog.responseLength = accumulatedResponse.length;
      
      // 🆕 保存AI响应和调用记录到调试数据
      if (options?.sessionData?.metadata) {
        options.sessionData.metadata.lastAiResponse = accumulatedResponse;
        if (!options.sessionData.metadata.aiCallHistory) {
          options.sessionData.metadata.aiCallHistory = [];
        }
        options.sessionData.metadata.aiCallHistory.push(aiCallLog);
        
        // 🆕 更新存储状态
        options.sessionData.metadata.storageStatus = {
          dbSynced: false, // 需要同步到数据库
          memoryStatus: 'updated',
          lastSaved: new Date().toISOString()
        };
        
        console.log(`📊 [AI调用完成] 耗时: ${aiCallLog.duration}ms, 响应长度: ${accumulatedResponse.length}, 调用记录已保存`);
      }
      
    } catch (error) {
      console.error(`❌ [Base Agent Stream] ${this.name} - 流式调用失败:`, error);
      throw error;
    }
  }

  // 调用 LLM 的通用方法
  protected async callLLM(
    prompt: string,
    options?: {
      system?: string
      schema?: any
      schemaType?: string
      maxTokens?: number
      sessionId?: string
      useHistory?: boolean
    }
  ): Promise<any> {
    try {
      console.log(`\n🔗 [Base Agent LLM] ${this.name} - 开始调用 AI API`)
      
      const sessionId = options?.sessionId || 'default';
      const useHistory = options?.useHistory || false;
      
      console.log(`⚙️  [调用配置]`, {
        sessionId,
        useHistory,
        hasSystem: !!options?.system,
        systemLength: options?.system?.length || 0,
        schemaType: options?.schemaType,
        maxTokens: options?.maxTokens
      });
      
      let messages = [];
      
      if (useHistory) {
        console.log(`💬 [对话历史模式] 启用对话历史管理`);
        
        if (!this.conversationHistory.has(sessionId)) {
          this.conversationHistory.set(sessionId, []);
          console.log(`🆕 [历史创建] 为会话 ${sessionId} 创建新的对话历史`);
        }
        
        const history = this.conversationHistory.get(sessionId)!;
        console.log(`📚 [历史状态] 当前历史长度: ${history.length}`);
        
        if (!this.systemPromptSent.get(sessionId) && options?.system) {
          history.push({ role: 'system', content: options.system });
          this.systemPromptSent.set(sessionId, true);
          console.log(`📝 [System Prompt] 首次添加 system prompt (长度: ${options.system.length})`);
        } else if (this.systemPromptSent.get(sessionId)) {
          console.log(`✅ [System Prompt] System prompt 已存在，跳过添加`);
        }
        
        history.push({ role: 'user', content: prompt });
        messages = history;
        
        console.log(`💬 [消息数组] 构建完成，总消息数: ${messages.length}`);
        messages.forEach((msg, index) => {
          const roleIcon = msg.role === 'user' ? '👤' : msg.role === 'assistant' ? '🤖' : '📝';
          const roleName = msg.role === 'user' ? '用户' : msg.role === 'assistant' ? '助手' : '系统';
          
          // 添加内容类型提示
          let contentHint = '';
          if (msg.role === 'system') {
            contentHint = ' (Agent Prompt模板)';
          } else if (msg.role === 'assistant') {
            contentHint = ' (AI返回结果)';
          } else {
            contentHint = ' (用户输入)';
          }
          
          console.log(`  ${roleIcon} [${roleName}${index}]${contentHint} ${msg.content.substring(0, 150)}...`);
        });
      } else {
        messages = [{ role: 'user', content: prompt }];
        console.log(`📝 [单次模式] 使用单次 prompt 模式，消息长度: ${prompt.length}`);
      }
      
      console.log(`🚀 [API请求] 发送请求到 /api/ai/generate`);
      const requestBody = {
        prompt: useHistory ? undefined : prompt,
        messages: useHistory ? messages : undefined,
        options: {
          ...options,
          system: useHistory ? undefined : options?.system
        }
      };
      console.log(`📦 [请求体] 结构:`, {
        hasPrompt: !!requestBody.prompt,
        hasMessages: !!requestBody.messages,
        messagesCount: requestBody.messages?.length || 0,
        optionsKeys: Object.keys(requestBody.options || {})
      });
      
      // 🔧 修复：在服务器端直接调用AI API，避免HTTP调用
      let response, result;
      
      if (typeof window === 'undefined') {
        // 服务器端环境：直接导入并调用AI API函数
        try {
          const { POST } = await import('@/app/api/ai/generate/route');
          const mockRequest = {
            json: async () => requestBody
          } as NextRequest;
          
          const apiResponse = await POST(mockRequest);
          result = await apiResponse.json();
          response = { ok: apiResponse.status === 200, status: apiResponse.status };
          
          console.log(`📡 [直接调用] AI API 响应状态: ${response.status}`);
          
        } catch (importError) {
          console.warn(`⚠️ [降级处理] 无法直接调用AI API，使用HTTP请求: ${importError instanceof Error ? importError.message : String(importError)}`);
          
          // 降级到HTTP调用
          const apiUrl = `http://localhost:3000/api/ai/generate`;
          console.log(`🌐 [HTTP请求] ${apiUrl}`);

          response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
          });
          
          result = await response.json();
        }
      } else {
        // 客户端环境：正常HTTP调用
        response = await fetch('/api/ai/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });
        
        result = await response.json();
      }

      if (!response.ok || !result.success) {
        console.error(`❌ [API错误] 请求失败:`, {
          status: response.status,
          success: result.success,
          error: result.error
        });
        throw new Error(result.error || 'AI API 调用失败')
      }

      if (useHistory && result.data) {
        const history = this.conversationHistory.get(sessionId)!;
        
        let responseContent: string;
        if (typeof result.data === 'object' && result.data.object) {
          responseContent = JSON.stringify(result.data.object);
        } else if (typeof result.data === 'object' && result.data.text) {
          responseContent = result.data.text;
        } else {
          responseContent = typeof result.data === 'string' ? result.data : JSON.stringify(result.data);
        }
        
        history.push({ role: 'assistant', content: responseContent });
        console.log(`💾 [历史保存] AI响应已保存到历史，新历史长度: ${history.length}`);
        console.log(`📄 [响应内容] ${responseContent.substring(0, 200)}...`);
        
        const stopReason = result.metadata?.stopReason || 'end_turn';
        console.log(`🏁 [停止原因] ${stopReason}`);
        
        if (stopReason === 'max_tokens') {
          console.warn(`⚠️ [Token限制] 响应可能被截断，考虑增加max_tokens或分段处理`);
        } else if (stopReason === 'tool_use') {
          console.log(`🔧 [工具调用] Claude请求使用工具，需要继续对话`);
        } else if (stopReason === 'end_turn') {
          console.log(`✅ [自然结束] Claude完成了回答`);
        }
      }

      console.log(`✅ [调用成功] ${this.name} - AI 响应成功，数据类型: ${typeof result.data}`);
      return result.data

    } catch (error) {
      console.error(`❌ [调用失败] ${this.name} - AI 调用失败:`, {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
      })
      throw error
    }
  }

  /**
   * 清理对话历史
   */
  protected clearConversationHistory(sessionId: string): void {
    this.conversationHistory.delete(sessionId);
    this.systemPromptSent.delete(sessionId);
    console.log(`🗑️ ${this.name} - 清理对话历史: ${sessionId}`);
  }

  /**
   * 重置 system prompt 状态 (用于切换 Agent 时)
   */
  protected resetSystemPrompt(sessionId: string): void {
    this.systemPromptSent.set(sessionId, false);
    console.log(`🔄 ${this.name} - 重置 system prompt 状态: ${sessionId}`);
  }
}

/**
 * 工厂方法创建Agent实例
 */
export interface AgentFactory {
  createAgent(type: string, config?: any): BaseAgent;
  getAvailableAgents(): string[];
}

/**
 * Agent注册表
 */
export class AgentRegistry {
  private agents: Map<string, typeof BaseAgent> = new Map();
  private instances: Map<string, BaseAgent> = new Map();

  /**
   * 注册Agent类
   */
  register(name: string, agentClass: typeof BaseAgent): void {
    this.agents.set(name, agentClass);
  }

  /**
   * 创建Agent实例
   */
  create(name: string, ...args: any[]): BaseAgent | null {
    const AgentClass = this.agents.get(name);
    if (!AgentClass) {
      return null;
    }

    // 检查是否已有实例（单例模式）
    if (this.instances.has(name)) {
      return this.instances.get(name)!;
    }

    const instance = new (AgentClass as any)(...args);
    this.instances.set(name, instance);
    return instance;
  }

  /**
   * 获取可用的Agent列表
   */
  getAvailable(): string[] {
    return Array.from(this.agents.keys());
  }

  /**
   * 清理实例缓存
   */
  clearInstances(): void {
    this.instances.clear();
  }
}

// 全局Agent注册表实例
export const agentRegistry = new AgentRegistry();
