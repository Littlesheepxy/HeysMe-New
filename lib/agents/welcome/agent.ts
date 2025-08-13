import { BaseAgent } from '../base-agent';
import { StreamableAgentResponse, AgentCapabilities } from '@/lib/types/streaming';
import { SessionData } from '@/lib/types/session';
import { generateWithModel, generateStreamWithModel } from '@/lib/ai-models';
import { 
  CollectedInfo,
  UserIntentAnalysis,
  WelcomeAIResponse,
  WelcomeSummaryResult,
  parseAIResponse,
  tryParseStreamingResponse,
  calculateCollectionProgress,
  buildConversationHistoryText,
  generateCollectionSummary,
  StreamContentProcessor
} from './utils';
import { 
  WELCOME_SYSTEM_PROMPT,
  FIRST_ROUND_PROMPT_TEMPLATE,
  CONTINUATION_PROMPT_TEMPLATE 
} from '@/lib/prompts/welcome';

/**
 * 对话式Welcome Agent - 纯对话收集用户信息
 * 不使用按钮交互，完全通过自然对话收集所需信息
 */
export class ConversationalWelcomeAgent extends BaseAgent {
  private isFirstRound: boolean = true; // 🔧 本地轮次管理
  
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
      // 🔧 简化：初始化本地轮次状态（仅在刷新时从数据库恢复）
      const metadata = sessionData.metadata as any;
      const conversationHistory = metadata.welcomeHistory || [];
      const currentInfo = metadata.collectedInfo || {};
      
      // 🔧 关键修复：每次都检查数据库历史状态（因为每次都是新Agent实例）
      if (conversationHistory.length > 0) {
        this.isFirstRound = false; // 从数据库恢复：有历史就不是首轮
        console.log(`🔄 [轮次恢复] 检测到 ${conversationHistory.length} 条历史，设置为续轮`);
      } else {
        this.isFirstRound = true; // 确保默认为首轮
        console.log(`🆕 [轮次初始化] 无历史记录，设置为首轮`);
      }

      // 🔧 关键调试：显示会话数据的详细状态
      console.log(`🔍 [会话数据详情] sessionId: ${sessionData.id}`);
      console.log(`🔍 [metadata.welcomeHistory] 长度: ${conversationHistory.length}, 内容:`, conversationHistory);
      console.log(`🔍 [metadata.collectedInfo] 内容:`, currentInfo);
      console.log(`🔄 [对话轮次] ${this.isFirstRound ? '首轮' : '续轮'} (本地管理)`);

      console.log(`🎯 [大模型调用] 发送流式对话请求`);
      
      // 🆕 修复流式响应处理逻辑 - 使用内容分离处理器
      const contentProcessor = new StreamContentProcessor();
      let finalAiResponse: WelcomeAIResponse | null = null;
      let isFirstChunk = true;
      const messageId = `welcome-${Date.now()}`;
      let chunkCount = 0;
      let lastSentLength = 0; // 🆕 记录上次发送的内容长度
      
      console.log(`🌊 [流式处理] 开始接收AI响应流`);
      
      for await (const chunk of this.callAIModelStreaming(input.user_input, conversationHistory, this.isFirstRound, sessionData)) {
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
      
      // 🔧 关键调试：显示最终AI响应的完整内容
      const fullResponse = contentProcessor.getCurrentVisibleContent();
      console.log(`🔍 [完整AI响应] 内容:\n${fullResponse}`);
      
      // 🔧 关键修复：完全依赖BaseAgent的历史管理
      // BaseAgent在流式处理完成后会自动更新历史，我们只需要同步回session
      const baseAgentHistory = this.conversationHistory.get(sessionData.id);
      if (baseAgentHistory) {
        console.log(`🔄 [历史同步] 从BaseAgent同步历史回session，BaseAgent: ${baseAgentHistory.length}, Session: ${conversationHistory.length}`);
        // 直接使用BaseAgent的历史（已包含最新的user和assistant消息）
        metadata.welcomeHistory = [...baseAgentHistory];
        console.log(`✅ [历史同步] 已同步BaseAgent历史到session，新长度: ${metadata.welcomeHistory.length}`);
      } else {
        console.log(`⚠️ [历史同步] BaseAgent历史不存在，保持原session历史`);
      }
      // 🔧 简化逻辑：只使用AI解析的信息，检查四个要素是否非空
      const aiExtractedInfo = finalAiResponse?.collected_info || {};
      
      // 直接使用AI解析的信息，与现有信息合并
      metadata.collectedInfo = { 
        ...currentInfo, 
        ...aiExtractedInfo 
      };
      
      // 🔍 调试：显示AI解析的四个要素状态
      console.log(`🔍 [AI解析信息] user_role: ${aiExtractedInfo.user_role || 'null'}`);
      console.log(`🔍 [AI解析信息] use_case: ${aiExtractedInfo.use_case || 'null'}`);
      console.log(`🔍 [AI解析信息] style: ${aiExtractedInfo.style || 'null'}`);
      console.log(`🔍 [AI解析信息] highlight_focus: ${aiExtractedInfo.highlight_focus || 'null'}`);
      
      // 🔍 检查四个要素是否都有内容（非null、非undefined、非空字符串）
      const hasValidUserRole = aiExtractedInfo.user_role && aiExtractedInfo.user_role.trim() !== '';
      const hasValidUseCase = aiExtractedInfo.use_case && aiExtractedInfo.use_case.trim() !== '';
      const hasValidStyle = aiExtractedInfo.style && aiExtractedInfo.style.trim() !== '';
      const hasValidHighlightFocus = aiExtractedInfo.highlight_focus && aiExtractedInfo.highlight_focus.trim() !== '';
      
      const allFieldsComplete = hasValidUserRole && hasValidUseCase && hasValidStyle && hasValidHighlightFocus;
      console.log(`🎯 [四要素检查] 用户角色: ${hasValidUserRole}, 使用场景: ${hasValidUseCase}, 风格: ${hasValidStyle}, 重点: ${hasValidHighlightFocus}, 全部完整: ${allFieldsComplete}`);
      metadata.userIntentAnalysis = finalAiResponse?.user_intent_analysis;
      
      // 🔧 关键修复：确保会话数据的完整性，更新根级别字段
      sessionData.metadata = metadata;
      sessionData.metadata.updatedAt = new Date();
      sessionData.metadata.lastActive = new Date();
      
      // 🔍 关键调试：显示最终保存的会话数据状态
      console.log(`💾 [会话保存前] welcomeHistory长度: ${metadata.welcomeHistory?.length || 0}`);
      console.log(`💾 [会话保存前] collectedInfo:`, metadata.collectedInfo);
      console.log(`💾 [会话保存前] sessionData.id: ${sessionData.id}`);
      
      console.log(`💾 [信息更新] 当前收集状态:`, metadata.collectedInfo);
      console.log(`📊 [历史状态] 对话历史长度: ${conversationHistory.length}`);
      console.log(`🔍 [历史详情] 对话记录:`, conversationHistory.map((msg: any) => `${msg.role}: ${msg.content.slice(0, 50)}...`));

      // 🔧 关键调试：显示最终解析结果
      console.log(`🔍 [最终解析] finalAiResponse:`, finalAiResponse);
      console.log(`🔍 [完成状态] completion_status: ${finalAiResponse?.completion_status}`);
      
      // 🔧 关键修复：基于收集进度判断是否完成，不依赖AI返回的completion_status
      const collectionProgress = calculateCollectionProgress(metadata.collectedInfo);
      const conversationRounds = Math.floor(conversationHistory.length / 2);
      
      // 🔧 简化完成条件：基于AI解析的四个要素是否完整
      // 1. AI解析的四个要素全部有内容 或者
      // 2. 用户明确表示要进入下一步 或者
      // 3. 对话轮次达到5轮以上（防止无限循环）
      
      const userWantsToAdvance = finalAiResponse?.reply?.includes('跳过') || 
                               finalAiResponse?.reply?.includes('快进') ||
                               finalAiResponse?.reply?.includes('下一步') ||
                               input.user_input?.includes('跳过') ||
                               input.user_input?.includes('快进') ||
                               input.user_input?.includes('下一步');
      
      const shouldComplete = allFieldsComplete || userWantsToAdvance || conversationRounds >= 5;
      
      console.log(`🎯 [完成判断] 收集进度: ${collectionProgress}%, 对话轮次: ${conversationRounds}, 四要素完整: ${allFieldsComplete}, 用户要求进入下一步: ${userWantsToAdvance}, 是否完成: ${shouldComplete}`);
      
      if (shouldComplete) {
        console.log(`🎉 [收集完成] 信息收集达到完成条件，开始汇总处理`);
        
        // 🆕 使用系统汇总，不再调用AI
        const summaryResult = this.generateSystemSummary(metadata.collectedInfo, finalAiResponse?.user_intent_analysis);
        
        // 保存汇总结果到会话数据，供下一个Agent使用
        metadata.welcomeSummary = summaryResult;
        
        // 🔧 关键修复：不发送AI的原始回复，直接发送advance响应
        if (finalAiResponse) {
          yield this.createAdvanceResponse(finalAiResponse, summaryResult, sessionData);
        }
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
   * 🆕 流式调用AI模型进行对话 - 本地轮次管理
   */
  private async* callAIModelStreaming(
    userInput: string,
    conversationHistory: any[],
    isFirstRound: boolean,
    sessionData: SessionData
  ): AsyncGenerator<string, void, unknown> {
    try {
      // 🎯 核心逻辑：基于本地isFirstRound判断，准备用户输入
      let finalUserInput: string;
      if (isFirstRound) {
        // 首轮：使用完整prompt模板
        finalUserInput = FIRST_ROUND_PROMPT_TEMPLATE.replace('{userInput}', userInput);
        console.log(`📝 [本地首轮] 使用完整prompt模板，用户输入: ${userInput}`);
      } else {
        // 续轮：直接使用用户输入
        finalUserInput = userInput;
        console.log(`📝 [本地续轮] 直接使用用户输入: ${userInput}`);
      }
      
      // 🔧 只在刷新恢复时同步历史到BaseAgent
      if (!this.conversationHistory.has(sessionData.id)) {
        this.conversationHistory.set(sessionData.id, []);
      }
      
      const baseAgentHistory = this.conversationHistory.get(sessionData.id)!;
      if (baseAgentHistory.length === 0 && conversationHistory.length > 0) {
        console.log(`🔄 [刷新恢复] 恢复 ${conversationHistory.length} 条session历史到BaseAgent`);
        baseAgentHistory.push(...conversationHistory);
      }
      
      console.log(`🎯 [AI调用] 准备调用BaseAgent，历史管理: 本地轮次`);
      
      // 🆕 使用BaseAgent的统一流式方法
      yield* this.callLLMStreaming(finalUserInput, {
        system: WELCOME_SYSTEM_PROMPT,
        maxTokens: 64000,
        sessionId: sessionData.id,
        useHistory: true
      });
      
      // 🔧 调用完成后，更新本地轮次状态
      this.isFirstRound = false;
      console.log(`✅ [轮次更新] 已设置为续轮，下次将直接使用用户输入`);
      
    } catch (error) {
      console.error('❌ [Welcome AI调用失败]:', error);
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
          { role: 'system', content: WELCOME_SYSTEM_PROMPT },
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