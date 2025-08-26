import { BaseAgent } from '../base-agent';
import { StreamableAgentResponse, AgentCapabilities } from '@/lib/types/streaming';
import { SessionData } from '@/lib/types/session';
import { generateWithModel, generateStreamWithModel } from '@/lib/ai-models';
import { 
  CollectedInfo,
  UserIntentAnalysis,
  WelcomeAIResponse,
  WelcomeSummaryResult,
  getSystemPrompt,
  getFirstRoundPrompt,
  getContinuationPrompt,
  parseAIResponse,
  tryParseStreamingResponse,
  calculateCollectionProgress,
  buildConversationHistoryText,
  generateCollectionSummary,
  StreamContentProcessor
} from './utils';

/**
 * 对话式Welcome Agent - 纯对话收集用户信息
 * 不使用按钮交互，完全通过自然对话收集所需信息
 */
export class ConversationalWelcomeAgent extends BaseAgent {
  constructor() {
    const capabilities: AgentCapabilities = {
      canStream: true,
      requiresInteraction: false, // 不需要按钮交互
      outputFormats: ['json'],
      maxRetries: 2,
      timeout: 15000
    };
    
    super('ConversationalWelcomeAgent', capabilities);
  }

  /**
   * 主处理流程 - 纯对话式信息收集
   */
  async* process(
    input: { user_input: string },
    sessionData: SessionData,
    context?: Record<string, any>
  ): AsyncGenerator<StreamableAgentResponse, void, unknown> {
    console.log(`\n🤖 [对话式Welcome Agent] 开始处理用户输入`);
    console.log(`📝 [用户输入] "${input.user_input}"`);
    
    try {
      // 检查是否是首轮对话
      const metadata = sessionData.metadata as any;
      const conversationHistory = metadata.welcomeHistory || [];
      const currentInfo = metadata.collectedInfo || {};
      const isFirstRound = conversationHistory.length === 0;

      console.log(`🔄 [对话轮次] ${isFirstRound ? '首轮' : '第' + (conversationHistory.length + 1) + '轮'}`);

      // 构建prompt
      let userPrompt: string;
      if (isFirstRound) {
        userPrompt = getFirstRoundPrompt(input.user_input);
      } else {
        const historyText = buildConversationHistoryText(conversationHistory);
        const currentIntent = metadata.userIntentAnalysis;
        userPrompt = getContinuationPrompt(input.user_input, historyText, currentInfo, currentIntent);
      }

      console.log(`🎯 [大模型调用] 发送流式对话请求`);
      
      // 🆕 修复流式响应处理逻辑 - 使用内容分离处理器
      const contentProcessor = new StreamContentProcessor();
      let finalAiResponse: WelcomeAIResponse | null = null;
      let isFirstChunk = true;
      const messageId = `welcome-${Date.now()}`;
      let chunkCount = 0;
      let lastSentLength = 0; // 🆕 记录上次发送的内容长度
      
      console.log(`🌊 [流式处理] 开始接收AI响应流`);
      
      for await (const chunk of this.callAIModelStreaming(userPrompt)) {
        chunkCount++;
        
        // 🆕 使用内容分离处理器处理每个chunk
        const processResult = contentProcessor.processChunk(chunk);
        
        // 🔧 修复：只有当有新的可见内容时才发送响应，避免重复发送
        if (processResult.newVisibleContent && processResult.newVisibleContent.trim().length > 0) {
          console.log(`📤 [流式可见内容] 第${chunkCount}个块，新增内容长度: ${processResult.newVisibleContent.length}`);
          
          // 🔧 关键修复：计算增量内容
          const currentFullContent = contentProcessor.getCurrentVisibleContent();
          const incrementalContent = currentFullContent.substring(lastSentLength);
          lastSentLength = currentFullContent.length;
          
          console.log(`📝 [增量发送] 全量长度: ${currentFullContent.length}, 增量长度: ${incrementalContent.length}`);
          
          yield this.createResponse({
            immediate_display: {
              reply: incrementalContent, // 🔧 发送增量内容，不是全量内容
              agent_name: this.name,
              timestamp: new Date().toISOString()
            },
            system_state: {
              intent: 'collecting',
              done: false,
              progress: Math.min(90, 10 + Math.floor(currentFullContent.length / 50)),
              current_stage: '正在对话...',
              metadata: {
                streaming: true,
                message_id: messageId,
                stream_type: isFirstChunk ? 'start' : 'delta',
                is_update: !isFirstChunk,
                // 🆕 明确标识为增量内容
                content_mode: 'incremental',
                agent_type: 'WelcomeAgent'
              }
            }
          });
          
          isFirstChunk = false;
        }
        
        // 如果检测到完整的隐藏控制信息，处理完成逻辑
        if (processResult.isComplete && processResult.hiddenControl) {
          console.log(`🎉 [隐藏控制信息] 检测到完整的控制信息`);
          finalAiResponse = processResult.hiddenControl;
          break;
        }
      }
      
      // 🏁 流式完成：解析最终响应并发送完成状态
      console.log(`🔍 [流式完成] 解析最终AI响应`);
      console.log(`📝 [累积响应] 长度: ${contentProcessor.getCurrentVisibleContent().length}, 内容前100字: ${contentProcessor.getCurrentVisibleContent().substring(0, 100)}`);
      
      // 更新对话历史
      conversationHistory.push(
        { role: 'user', content: input.user_input },
        { role: 'assistant', content: finalAiResponse?.reply || '' }
      );
      
      // 更新会话数据
      metadata.welcomeHistory = conversationHistory;
      metadata.collectedInfo = { ...currentInfo, ...finalAiResponse?.collected_info || {} };
      metadata.userIntentAnalysis = finalAiResponse?.user_intent_analysis;
      
      console.log(`💾 [信息更新] 当前收集状态:`, metadata.collectedInfo);

      // 🔧 修复：根据完成状态发送最终响应，避免重复
      if (finalAiResponse?.completion_status === 'ready') {
        console.log(`🎉 [收集完成] 信息收集完整，开始汇总处理`);
        
        // 🆕 使用系统汇总，不再调用AI
        const summaryResult = this.generateSystemSummary(metadata.collectedInfo, finalAiResponse.user_intent_analysis);
        
        // 保存汇总结果到会话数据，供下一个Agent使用
        metadata.welcomeSummary = summaryResult;
        
        // 🔧 关键修复：不发送AI的原始回复，直接发送advance响应
        yield this.createAdvanceResponse(finalAiResponse, summaryResult, sessionData);
      } else {
        console.log(`🔄 [继续收集] 继续对话收集信息`);
        
        // 🔧 修复：只有在继续收集时才发送AI的回复内容
        yield this.createResponse({
          immediate_display: {
            reply: finalAiResponse?.reply || '',
            agent_name: this.name,
            timestamp: new Date().toISOString()
          },
          system_state: {
            intent: 'collecting',
            done: false,
            progress: calculateCollectionProgress(metadata.collectedInfo),
            current_stage: '信息收集中',
            metadata: {
              streaming: false,
              message_id: messageId,
              stream_type: 'complete',
              is_final: true, // 🔑 标记为最终响应
              completion_status: finalAiResponse?.completion_status,
              collected_info: metadata.collectedInfo,
              next_question: finalAiResponse?.next_question
            }
          }
        });
      }

    } catch (error) {
      console.error(`❌ [对话式Welcome Agent错误] 处理失败:`, error);
      yield await this.handleError(error as Error, sessionData, context);
    }
  }

  /**
   * 🆕 流式调用AI模型进行对话
   */
  private async* callAIModelStreaming(userPrompt: string): AsyncGenerator<string, void, unknown> {
    try {
      yield* generateStreamWithModel(
        'claude',
        'claude-sonnet-4-20250514',
        [
          { role: 'system', content: getSystemPrompt() },
          { role: 'user', content: userPrompt }
        ],
        { maxTokens: 64000 }
      );
      
    } catch (error) {
      console.error('❌ [AI流式调用失败]:', error);
      throw new Error('AI对话调用失败');
    }
  }

  /**
   * 调用AI模型进行对话（保留非流式版本作为备用）
   */
  private async callAIModel(userPrompt: string): Promise<WelcomeAIResponse> {
    try {
      const result = await generateWithModel(
        'claude',
        'claude-sonnet-4-20250514',
        [
          { role: 'system', content: getSystemPrompt() },
          { role: 'user', content: userPrompt }
        ],
        { maxTokens: 64000 }
      );

      // 解析AI响应
      const resultText = 'text' in result ? result.text : JSON.stringify(result);
      const aiResponse = parseAIResponse(resultText);
      return aiResponse;
      
    } catch (error) {
      console.error('❌ [AI调用失败]:', error);
      throw new Error('AI对话调用失败');
    }
  }

  /**
   * 创建推进到下一阶段的响应
   */
  private createAdvanceResponse(
    aiResponse: WelcomeAIResponse, 
    summaryResult: WelcomeSummaryResult,
    sessionData: SessionData
  ): StreamableAgentResponse {
    const collectedInfo = aiResponse.collected_info;
    
    // 🔧 修复：不显示额外的总结信息，直接推进到下一阶段
    return this.createResponse({
      immediate_display: {
        reply: '', // 🔑 不显示任何额外内容，让AI的原始回复作为最后的消息
        agent_name: this.name,
        timestamp: new Date().toISOString()
      },
      system_state: {
        intent: 'advance',
        done: true,
        progress: 100,
        current_stage: '信息收集完成',
        metadata: {
          completion_status: 'ready',
          collected_info: collectedInfo,
          welcomeSummary: summaryResult,
          action: 'advance',
          next_step: 'info_collection',
          next_agent_context: this.generateContextForNextAgent(collectedInfo),
          silent_advance: true // 🔑 标记为静默推进，不显示额外内容
        }
      }
    });
  }

  /**
   * 🆕 系统生成汇总结果（替代AI汇总）- 匹配 optimized-agent 需求
   */
  private generateSystemSummary(collectedInfo: CollectedInfo, userIntentAnalysis?: UserIntentAnalysis): WelcomeSummaryResult {
    // 使用用户意图分析结果，如果没有则基于完整度推断
    let commitmentLevel: '试一试' | '认真制作' = '认真制作';
    let reasoning = '基于信息完整度分析';
    
    if (userIntentAnalysis) {
      commitmentLevel = userIntentAnalysis.commitment_level;
      reasoning = userIntentAnalysis.reasoning;
    } else {
      const completionProgress = calculateCollectionProgress(collectedInfo);
      if (completionProgress < 50) {
        commitmentLevel = '试一试';
        reasoning = `信息收集完整度${completionProgress}%，判断为快速体验需求`;
      } else {
        commitmentLevel = '认真制作';
        reasoning = `信息收集完整度${completionProgress}%，判断为认真制作需求`;
      }
    }
    
    // 基于用户身份确定收集优先级
    const collectionPriority = this.determineCollectionPriority(collectedInfo.user_role);
    
    // 确定可用工具
    const availableTools = this.getAvailableTools();
    
    return {
      summary: {
        user_role: collectedInfo.user_role || '新用户',
        use_case: collectedInfo.use_case || '个人展示',
        style: collectedInfo.style || '简约专业',
        highlight_focus: collectedInfo.highlight_focus || '个人技能'
      },
      user_intent: {
        commitment_level: commitmentLevel,
        reasoning: reasoning
      },
      sample_suggestions: {
        should_use_samples: commitmentLevel === '试一试',
        sample_reason: commitmentLevel === '试一试' 
          ? '用户表现出探索性需求，建议使用示例数据提供快速体验' 
          : '用户表现出明确目标，适合进行详细信息收集和个性化定制'
      },
      collection_priority: collectionPriority,
      current_collected_data: collectedInfo,
      available_tools: availableTools,
      context_for_next_agent: this.generateContextForNextAgent(collectedInfo, commitmentLevel)
    };
  }

  /**
   * 🆕 基于用户身份确定信息收集优先级
   */
  private determineCollectionPriority(userRole?: string): string {
    if (!userRole) return 'basic_info';
    
    const role = userRole.toLowerCase();
    
    if (role.includes('开发') || role.includes('程序') || role.includes('工程师')) {
      return 'technical_skills_projects';
    } else if (role.includes('设计') || role.includes('创意') || role.includes('艺术')) {
      return 'creative_portfolio_style';
    } else if (role.includes('产品') || role.includes('运营') || role.includes('管理')) {
      return 'business_achievements_leadership';
    } else if (role.includes('学生') || role.includes('实习')) {
      return 'education_potential_projects';
    } else if (role.includes('创业') || role.includes('自由')) {
      return 'business_vision_achievements';
    } else {
      return 'comprehensive_profile';
    }
  }

  /**
   * 🆕 获取可用的信息收集工具列表
   */
  private getAvailableTools(): string[] {
    return [
      'extract_linkedin',
      'extract_instagram', 
      'extract_tiktok',
      'extract_x_twitter',
      'analyze_social_media',
      'scrape_webpage',
      'analyze_document',
      'analyze_github_user',
      'integrate_social_network'
    ];
  }

  /**
   * 🆕 为下一个Agent生成上下文
   */
  private generateContextForNextAgent(collectedInfo: CollectedInfo, commitmentLevel?: '试一试' | '认真制作'): string {
    const completionProgress = calculateCollectionProgress(collectedInfo);
    
    if (commitmentLevel === '试一试') {
      return `用户为试一试类型，建议使用示例数据快速体验。当前收集信息：${JSON.stringify(collectedInfo)}`;
    } else if (completionProgress >= 75) {
      return `用户为认真制作类型，信息收集完整，可以基于以下信息进行个性化定制：${JSON.stringify(collectedInfo)}`;
    } else {
      return `用户为认真制作类型，但信息收集不完整（${completionProgress}%），建议引导式收集更多信息`;
    }
  }

  /**
   * 处理用户交互 - 对话式Agent不需要特殊交互处理
   */
  async handleInteraction(
    interactionType: string,
    data: any,
    sessionData: SessionData
  ): Promise<any> {
    // 对话式Agent不需要处理按钮交互
    // 所有交互都通过process方法的对话处理
    return {
      action: 'continue',
      summary: '继续对话'
    };
  }
} 