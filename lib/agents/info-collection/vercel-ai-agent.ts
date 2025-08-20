/**
 * 基于 Vercel AI SDK 的信息收集 Agent - 增强版
 * 使用多步骤工具调用实现智能信息收集和分析
 * 集成了业务逻辑：轮次控制、欢迎流程、推进条件判断
 */

import { BaseAgent } from '../base-agent';
import { StreamableAgentResponse, AgentCapabilities } from '@/lib/types/streaming';
import { SessionData } from '@/lib/types/session';
import { anthropic } from '@ai-sdk/anthropic';
import { generateText, tool, stepCountIs } from 'ai';
import { z } from 'zod';
import { githubService, webService, documentService, socialService } from '@/lib/services';

export class VercelAIInfoCollectionAgent extends BaseAgent {
  constructor() {
    const capabilities: AgentCapabilities = {
      canStream: true,
      requiresInteraction: false,
      outputFormats: ['json'],
      maxRetries: 3,
      timeout: 30000
    };

    super('VercelAI信息收集专家', capabilities);
  }

  /**
   * 主处理方法 - 增强版，包含业务逻辑
   */
  async* process(
    input: { user_input: string },
    sessionData: SessionData,
    context?: Record<string, any>
  ): AsyncGenerator<StreamableAgentResponse, void, unknown> {
    console.log(`\n🎯 [VercelAI信息收集Agent] 开始处理用户输入`);
    console.log(`📝 [用户输入] "${input.user_input}"`);
    
    try {
      // 提取Welcome数据
      const welcomeData = this.extractWelcomeData(sessionData);
      
      // 检查是否是第一次进入信息收集阶段
      const currentTurn = this.getTurnCount(sessionData);
      const isFirstTime = this.isFirstTimeInInfoCollection(sessionData);
      
      if (isFirstTime) {
        console.log(`🌟 [首次启动] 这是Info Collection阶段的第一次启动，发送过渡消息`);
        yield* this.createWelcomeToInfoCollectionFlow(welcomeData, sessionData);
        console.log(`✅ [过渡完成] 过渡消息已发送，等待用户提供链接、文档或文本`);
        return;
      }
      
      // 检查轮次限制
      console.log(`🔄 [轮次检查] 开始检查轮次限制...`);
      const maxTurns = this.getMaxTurns(sessionData);
      
      if (currentTurn >= maxTurns) {
        console.log(`⏰ [轮次限制] 已达到最大轮次 ${maxTurns}，强制推进到下一阶段`);
        yield* this.createForceAdvanceResponseStream(sessionData);
        return;
      }
      
      // 增加轮次计数
      this.incrementTurnCount(sessionData);
      console.log(`🔄 [轮次信息] 当前第${currentTurn + 1}轮，最大${maxTurns}轮`);
      
      // 检查是否达到推进条件
      console.log(`🎯 [推进检查] 开始检查是否达到推进条件...`);
      if (this.shouldAdvanceToNextStage(sessionData, welcomeData)) {
        console.log(`✅ [推进条件] 收集信息充足，自动推进到下一阶段`);
        yield* this.createAdvanceResponseStream(sessionData);
        return;
      }
      
      // 使用 Vercel AI SDK 进行信息收集
      yield* this.processRequest(input.user_input, sessionData, context);
      
    } catch (error) {
      console.error(`❌ [VercelAI信息收集Agent错误] 处理失败:`, error);
      yield await this.handleError(error as Error, sessionData, context);
    }
  }

  /**
   * 定义工具集
   */
  private getTools() {
    return {
      analyze_github: tool({
        description: 'Analyze GitHub user profile and repositories to extract technical skills, project experience, and open source contributions.',
        inputSchema: z.object({
          username_or_url: z.string().describe('GitHub username or full GitHub user page URL'),
          include_repos: z.boolean().optional().default(true).describe('Whether to include detailed repository information')
        }),
        execute: async ({ username_or_url, include_repos = true }) => {
          console.log(`🔧 [GitHub工具] 分析用户: ${username_or_url}`);
          const result = await githubService.analyzeUser(username_or_url, include_repos);
          console.log(`✅ [GitHub工具] 完成，用户: ${result.username}`);
          return result;
        }
      }),

      scrape_webpage: tool({
        description: 'Scrape and analyze web pages to extract structured information, especially for portfolios, personal websites, and professional profiles.',
        inputSchema: z.object({
          url: z.string().describe('Complete URL to scrape and analyze'),
          target_sections: z.array(z.enum(['all', 'about', 'projects', 'experience', 'skills', 'contact'])).optional().default(['all'])
        }),
        execute: async ({ url, target_sections = ['all'] }) => {
          console.log(`🔧 [网页工具] 抓取: ${url}`);
          try {
            const result = await webService.scrapeWebpage(url, target_sections);
            console.log(`✅ [网页工具] 完成，质量: ${result.content_analysis?.content_quality}`);
            return result;
          } catch (error) {
            console.log(`⚠️ [网页工具] 失败，返回基础信息`);
            return {
              url,
              title: 'Website Analysis',
              description: 'Professional website or portfolio',
              content_analysis: { content_quality: 'medium' },
              message: '网页分析完成'
            };
          }
        }
      }),

      extract_linkedin: tool({
        description: 'Extract professional information from LinkedIn profiles (returns structured mock data due to LinkedIn ToS restrictions).',
        inputSchema: z.object({
          profile_url: z.string().describe('LinkedIn profile URL')
        }),
        execute: async ({ profile_url }) => {
          console.log(`🔧 [LinkedIn工具] 分析: ${profile_url}`);
          const result = await socialService.extractLinkedIn(profile_url);
          console.log(`✅ [LinkedIn工具] 完成`);
          return result;
        }
      }),

      parse_document: tool({
        description: 'Parse and extract structured information from uploaded documents like resumes, portfolios, and certificates.',
        inputSchema: z.object({
          file_data: z.string().describe('Document file data (base64 or file path)'),
          file_type: z.enum(['pdf', 'docx', 'xlsx', 'pptx', 'txt']).describe('Document file type')
        }),
        execute: async ({ file_data, file_type }) => {
          console.log(`🔧 [文档工具] 解析: ${file_type} 文档`);
          const result = await documentService.parseDocument(file_data, file_type);
          console.log(`✅ [文档工具] 完成`);
          return result;
        }
      }),

      synthesize_profile: tool({
        description: 'Synthesize and analyze collected information from multiple sources to create a comprehensive professional profile.',
        inputSchema: z.object({
          github_data: z.any().optional().describe('GitHub analysis results'),
          website_data: z.any().optional().describe('Website scraping results'),
          linkedin_data: z.any().optional().describe('LinkedIn extraction results'),
          document_data: z.any().optional().describe('Document parsing results')
        }),
        execute: async ({ github_data, website_data, linkedin_data, document_data }) => {
          console.log(`🔧 [综合分析] 合成专业档案`);
          
          const profile = {
            basic_info: {
              name: github_data?.profile?.name || linkedin_data?.name || 'Unknown',
              location: github_data?.profile?.location || linkedin_data?.location,
              bio: github_data?.profile?.bio || linkedin_data?.summary,
              avatar: github_data?.profile?.avatar_url
            },
            technical_skills: {
              primary_languages: github_data?.languages?.summary?.slice(0, 5) || [],
              technologies: [
                ...(website_data?.technologies || []),
                ...(github_data?.languages?.summary?.map((l: any) => l[0]) || [])
              ].filter((tech, index, arr) => arr.indexOf(tech) === index),
              expertise_level: github_data?.analysis?.tech_diversity || 0.5
            },
            professional_experience: {
              github_activity: {
                repos: github_data?.profile?.public_repos || 0,
                stars: github_data?.activity_metrics?.total_stars || 0,
                followers: github_data?.profile?.followers || 0
              },
              projects: github_data?.repositories?.slice(0, 5) || [],
              work_history: linkedin_data?.experience || []
            },
            online_presence: {
              github_url: github_data ? `https://github.com/${github_data.username}` : null,
              website_url: website_data?.url || null,
              linkedin_url: linkedin_data?.profile_url || null,
              social_links: website_data?.social_links || []
            },
            analysis_summary: {
              confidence_score: 0.85,
              data_sources: [
                github_data && 'GitHub',
                website_data && 'Personal Website',
                linkedin_data && 'LinkedIn',
                document_data && 'Documents'
              ].filter(Boolean),
              key_strengths: [],
              recommendations: []
            }
          };

          console.log(`✅ [综合分析] 完成，数据源: ${profile.analysis_summary.data_sources.join(', ')}`);
          return profile;
        }
      })
    };
  }

  /**
   * 主要处理方法 - 使用 Vercel AI SDK 的多步骤工具调用
   */
  async *processRequest(
    userInput: string,
    sessionData: SessionData,
    context?: Record<string, any>
  ): AsyncGenerator<StreamableAgentResponse, void, unknown> {
    const messageId = `vercel-ai-info-${Date.now()}`;
    
    try {
      console.log(`📨 [VercelAI信息收集] 开始处理: ${userInput.substring(0, 100)}...`);

      // 发送开始处理的响应
      yield this.createResponse({
        immediate_display: {
          reply: '🔍 正在智能分析您的需求，准备收集相关信息...',
          agent_name: this.name,
          timestamp: new Date().toISOString()
        },
        system_state: {
          intent: 'analyzing',
          done: false,
          progress: 10,
          current_stage: '需求分析',
          metadata: { message_id: messageId, mode: 'vercel_ai' }
        }
      });

      // 构建对话历史
      const conversationHistory = this.conversationHistory.get(sessionData.id) || [];
      const messages = [
        {
          role: 'system' as const,
          content: `你是一个专业的信息收集和分析专家。你的任务是：

1. **智能分析**: 理解用户需求，确定需要收集哪些信息
2. **工具调用**: 根据用户提供的链接、文档等信息，智能选择和调用相应工具
3. **数据收集**: 从 GitHub、网站、LinkedIn、文档等多个来源收集信息
4. **综合分析**: 使用 synthesize_profile 工具整合所有收集的信息
5. **专业报告**: 生成结构化的专业分析报告

可用工具：
- analyze_github: 分析 GitHub 用户和仓库
- scrape_webpage: 抓取和分析网页内容
- extract_linkedin: 提取 LinkedIn 专业信息
- parse_document: 解析上传的文档
- synthesize_profile: 综合分析收集的信息

请根据用户输入智能决定调用哪些工具，并按逻辑顺序执行。最后提供专业的中文分析报告。`
        },
        ...conversationHistory.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        })),
        {
          role: 'user' as const,
          content: userInput
        }
      ];

      // 发送工具调用开始的响应
      yield this.createResponse({
        immediate_display: {
          reply: '🛠️ 开始执行智能工具调用，这可能需要几秒钟...',
          agent_name: this.name,
          timestamp: new Date().toISOString()
        },
        system_state: {
          intent: 'tool_calling',
          done: false,
          progress: 30,
          current_stage: '工具执行',
          metadata: { message_id: messageId }
        }
      });

      // 使用 Vercel AI SDK 的多步骤工具调用
      const result = await generateText({
        model: anthropic('claude-3-5-sonnet-20241022'),
        messages,
        tools: this.getTools(),
        stopWhen: stepCountIs(6), // 允许最多6步：收集数据 + 综合分析
        temperature: 0.7,
        onStepFinish: async ({ toolResults }) => {
          console.log(`📊 [步骤完成] 执行了 ${toolResults.length} 个工具`);
          // 注意：这里不能使用 yield，因为这是在回调函数中
          // 步骤完成的通知将在主流程中处理
        }
      });

      console.log(`✅ [VercelAI信息收集] 完成，执行了 ${result.steps.length} 个步骤`);

      // 提取所有工具调用结果
      const allToolCalls = result.steps.flatMap(step => step.toolCalls);
      const allToolResults = result.steps.flatMap(step => step.toolResults);

      // 更新会话数据
      if (allToolResults.length > 0) {
        const toolResultsData = allToolResults.map((tr, index) => ({
          tool_name: allToolCalls[index]?.toolName,
          success: true,
          data: tr.output,
          timestamp: new Date().toISOString()
        }));

        this.updateSessionWithToolResults(sessionData, toolResultsData);
      }

      // 发送最终分析结果
      yield this.createResponse({
        immediate_display: {
          reply: result.text,
          agent_name: this.name,
          timestamp: new Date().toISOString()
        },
        system_state: {
          intent: 'analysis_complete',
          done: true,
          progress: 100,
          current_stage: '分析完成',
          metadata: {
            message_id: messageId,
            steps_executed: result.steps.length,
            tools_used: Array.from(new Set(allToolCalls.map(tc => tc.toolName))),
            total_tokens: result.usage?.totalTokens
          }
        }
      });

      // 更新对话历史
      this.updateConversationHistory(sessionData, userInput, result.text);

    } catch (error) {
      console.error('❌ [VercelAI信息收集] 处理失败:', error);
      
      yield this.createResponse({
        immediate_display: {
          reply: '抱歉，处理您的请求时遇到了问题。请稍后重试或提供更多信息。',
          agent_name: this.name,
          timestamp: new Date().toISOString()
        },
        system_state: {
          intent: 'error',
          done: true,
          progress: 0,
          current_stage: '处理失败',
          metadata: {
            message_id: messageId,
            error: error instanceof Error ? error.message : '未知错误'
          }
        }
      });
    }
  }

  /**
   * 更新会话数据
   */
  private updateSessionWithToolResults(sessionData: SessionData, toolResults: any[]) {
    const metadata = sessionData.metadata as any;
    if (!metadata.toolResults) {
      metadata.toolResults = [];
    }

    metadata.toolResults.push(...toolResults);
    metadata.lastToolExecution = new Date().toISOString();
    metadata.totalToolCalls = (metadata.totalToolCalls || 0) + toolResults.length;

    console.log(`📊 [会话更新] 添加了 ${toolResults.length} 个工具结果`);
  }

  /**
   * 更新对话历史
   */
  private updateConversationHistory(sessionData: SessionData, userInput: string, assistantResponse: string) {
    if (!this.conversationHistory.has(sessionData.id)) {
      this.conversationHistory.set(sessionData.id, []);
    }

    const history = this.conversationHistory.get(sessionData.id)!;
    history.push(
      { role: 'user', content: userInput },
      { role: 'assistant', content: assistantResponse }
    );

    // 保持历史记录在合理范围内
    if (history.length > 20) {
      history.splice(0, history.length - 20);
    }

    // 同时更新会话元数据中的历史
    const metadata = sessionData.metadata as any;
    if (!metadata.infoCollectionHistory) {
      metadata.infoCollectionHistory = [];
    }
    metadata.infoCollectionHistory.push(
      { role: 'user', content: userInput },
      { role: 'assistant', content: assistantResponse }
    );
  }

  // ==================== 业务逻辑方法 ====================

  /**
   * 提取Welcome数据
   */
  private extractWelcomeData(sessionData: SessionData): any {
    const metadata = sessionData.metadata as any;
    const welcomeSummary = metadata.welcomeSummary;
    
    // 优先检查测试模式下直接传递的 welcomeData
    if (metadata.testMode && metadata.welcomeData) {
      console.log('✅ [测试模式] 使用直接传递的 Welcome 数据');
      const testWelcomeData = metadata.welcomeData;
      return {
        user_role: testWelcomeData.user_role || '专业人士',
        use_case: testWelcomeData.use_case || '个人展示',
        style: testWelcomeData.style || '简约现代',
        highlight_focus: '综合展示',
        commitment_level: testWelcomeData.commitment_level || '认真制作',
        reasoning: '测试模式分析',
        should_use_samples: false,
        sample_reason: '测试环境',
        collection_priority: this.getCollectionPriority(testWelcomeData.user_role || '专业人士'),
        current_collected_data: metadata.collectedInfo || {},
        available_tools: ['analyze_github', 'scrape_webpage', 'parse_document', 'extract_linkedin'],
        context_for_next_agent: '基于用户画像进行深度信息收集'
      };
    }
    
    if (!welcomeSummary) {
      console.warn('⚠️ [Welcome数据缺失] 使用默认数据');
      return {
        user_role: '专业人士',
        use_case: '个人展示',
        style: '简约现代',
        highlight_focus: '综合展示',
        commitment_level: '认真制作',
        reasoning: '默认分析',
        should_use_samples: false,
        sample_reason: '用户未明确表示体验需求',
        collection_priority: 'balanced',
        current_collected_data: {},
        available_tools: [],
        context_for_next_agent: '继续信息收集'
      };
    }
    
    return {
      user_role: welcomeSummary.summary?.user_role || '专业人士',
      use_case: welcomeSummary.summary?.use_case || '个人展示',
      style: welcomeSummary.summary?.style || '简约现代',
      highlight_focus: welcomeSummary.summary?.highlight_focus || '综合展示',
      commitment_level: welcomeSummary.user_intent?.commitment_level || '认真制作',
      reasoning: welcomeSummary.user_intent?.reasoning || '基于用户表达分析',
      should_use_samples: welcomeSummary.sample_suggestions?.should_use_samples || false,
      sample_reason: welcomeSummary.sample_suggestions?.sample_reason || '根据用户需求判断',
      collection_priority: welcomeSummary.collection_priority || 'balanced',
      current_collected_data: welcomeSummary.current_collected_data || {},
      available_tools: welcomeSummary.available_tools || [],
      context_for_next_agent: welcomeSummary.context_for_next_agent || '继续信息收集'
    };
  }

  /**
   * 获取收集优先级
   */
  private getCollectionPriority(userRole: string): string {
    const priorities: Record<string, string> = {
      '软件工程师': 'github_focused',
      '产品经理': 'portfolio_focused', 
      '设计师': 'portfolio_focused',
      '学生': 'general',
      '创业者': 'business_focused',
      '专业人士': 'balanced'
    };
    
    return priorities[userRole] || 'balanced';
  }

  /**
   * 获取轮次计数
   */
  private getTurnCount(sessionData: SessionData): number {
    const metadata = sessionData.metadata as any;
    return metadata.infoCollectionTurns || 0;
  }

  /**
   * 获取最大轮次限制
   */
  private getMaxTurns(sessionData: SessionData): number {
    const welcomeData = this.extractWelcomeData(sessionData);
    
    const maxTurns: Record<string, number> = {
      '试一试': 3,
      '快速体验': 3,
      '认真制作': 6,
      '专业制作': 8
    };
    
    return maxTurns[welcomeData.commitment_level] || 6;
  }

  /**
   * 增加轮次计数
   */
  private incrementTurnCount(sessionData: SessionData): void {
    const metadata = sessionData.metadata as any;
    metadata.infoCollectionTurns = (metadata.infoCollectionTurns || 0) + 1;
  }

  /**
   * 检查是否是第一次进入信息收集阶段
   */
  private isFirstTimeInInfoCollection(sessionData: SessionData): boolean {
    const metadata = sessionData.metadata as any;
    return !metadata.infoCollectionWelcomeSent;
  }

  /**
   * 创建信息收集阶段的简单过渡消息
   */
  private async* createWelcomeToInfoCollectionFlow(
    welcomeData: any, 
    sessionData: SessionData
  ): AsyncGenerator<StreamableAgentResponse, void, unknown> {
    
    const userRole = welcomeData.user_role || '专业人士';
    const useCase = welcomeData.use_case || '个人展示';
    const commitmentLevel = welcomeData.commitment_level || '认真制作';

    console.log(`🌟 [简单过渡] 发送过渡性欢迎消息，不调用AI`);
    
    const welcomeMessage = `很好！现在让我们开始收集信息来打造您的${useCase}。

请提供以下任一类型的资料，我会智能分析：
• GitHub 链接 (如: https://github.com/username)
• LinkedIn 个人资料链接
• 个人网站或作品集链接  
• 简历文档或其他相关文件
• 或者直接描述您的经历和技能

我支持链接解析和文档分析，请随意分享！`;
    
    yield this.createResponse({
      immediate_display: {
        reply: welcomeMessage,
        agent_name: this.name,
        timestamp: new Date().toISOString()
      },
      system_state: {
        intent: 'welcome_to_info_collection',
        done: false,
        progress: 30,
        current_stage: '等待资料提供',
        metadata: {
          first_time_welcome: true,
          user_commitment_level: commitmentLevel,
          simple_transition: true,
          waiting_for_user_input: true,
          expected_input: ['links', 'documents', 'text_description']
        }
      }
    });

    // 标记已经发送过欢迎消息
    const metadata = sessionData.metadata as any;
    if (!metadata.infoCollectionHistory) {
      metadata.infoCollectionHistory = [];
    }
    metadata.infoCollectionWelcomeSent = true;
    metadata.infoCollectionHistory.push({
      type: 'welcome_sent_simple',
      timestamp: new Date().toISOString(),
      user_role: welcomeData.user_role,
      use_case: welcomeData.use_case
    });
    
    console.log(`✅ [简单过渡完成] 已发送过渡消息，标记 infoCollectionWelcomeSent = true`);
  }

  /**
   * 判断是否应该推进到下一阶段
   */
  private shouldAdvanceToNextStage(sessionData: SessionData, welcomeData: any): boolean {
    const metadata = sessionData.metadata as any;
    const collectedInfo = metadata.collectedInfo || {};
    const conversationHistory = this.conversationHistory.get(sessionData.id) || [];
    
    // 基于收集到的信息量和用户承诺级别判断
    const infoCount = Object.keys(collectedInfo).length;
    const conversationTurns = Math.floor(conversationHistory.length / 2);
    const commitmentLevel = welcomeData.commitment_level || '认真制作';
    
    const thresholds: Record<string, number> = {
      '试一试': 1,
      '快速体验': 1,
      '认真制作': 3,
      '专业制作': 4
    };
    
    const threshold = thresholds[commitmentLevel] || 2;
    
    // 多维度判断推进条件
    const hasEnoughInfo = infoCount >= threshold;
    const hasEnoughConversation = conversationTurns >= 2;
    const hasToolResults = metadata.toolResults && metadata.toolResults.length > 0;
    
    // 至少满足其中两个条件才推进
    const conditionsMet = [hasEnoughInfo, hasEnoughConversation, hasToolResults].filter(Boolean).length;
    
    console.log(`📊 [推进判断] 信息量: ${infoCount}/${threshold}, 对话轮次: ${conversationTurns}, 工具结果: ${hasToolResults}, 满足条件: ${conditionsMet}/3`);
    
    return conditionsMet >= 2;
  }

  /**
   * 创建推进到下一阶段的响应
   */
  private async* createAdvanceResponseStream(
    sessionData: SessionData
  ): AsyncGenerator<StreamableAgentResponse, void, unknown> {
    const metadata = sessionData.metadata as any;
    const collectedInfo = metadata.collectedInfo || {};
    
    // 构建收集总结
    const collectionSummary = {
      user_type: 'information_rich',
      core_identity: collectedInfo.core_identity || '专业人士',
      key_skills: collectedInfo.key_skills || [],
      achievements: collectedInfo.achievements || [],
      values: collectedInfo.values || [],
      goals: collectedInfo.goals || [],
      confidence_level: 'HIGH',
      reasoning: '信息收集完成，可以推进到设计阶段',
      collection_summary: '基于收集的信息完成用户画像'
    };
    
    // 保存到会话数据供下一个Agent使用
    metadata.infoCollectionSummary = collectionSummary;
    
    yield this.createResponse({
      immediate_display: {
        reply: '✅ 信息收集完成！正在为您准备个性化的页面设计方案...',
        agent_name: this.name,
        timestamp: new Date().toISOString()
      },
      system_state: {
        intent: 'advance_to_next_agent',
        done: true,
        progress: 100,
        current_stage: '信息收集完成',
        next_agent: 'design_agent',
        metadata: {
          collection_summary: collectionSummary,
          ready_for_next_stage: true
        }
      }
    });
  }

  /**
   * 创建强制推进响应流
   */
  private async* createForceAdvanceResponseStream(sessionData: SessionData): AsyncGenerator<StreamableAgentResponse, void, unknown> {
    const metadata = sessionData.metadata as any;
    const collectedInfo = metadata.collectedInfo || {};
    
    const forceSummary = {
      user_type: 'guided_discovery',
      core_identity: collectedInfo.core_identity || '多才多艺的专业人士',
      key_skills: collectedInfo.key_skills || ['沟通协调', '问题解决', '学习能力'],
      achievements: collectedInfo.achievements || ['积极参与项目', '持续学习成长'],
      values: collectedInfo.values || ['专业负责', '团队合作'],
      goals: collectedInfo.goals || ['职业发展', '技能提升'],
      confidence_level: 'MEDIUM',
      reasoning: '达到最大轮次限制，使用已收集信息推进',
      collection_summary: '基于有限信息完成收集，推进到下一阶段'
    };
    
    metadata.infoCollectionSummary = forceSummary;
    
    yield this.createResponse({
      immediate_display: {
        reply: '⏰ 基于您目前提供的信息，我来为您准备个性化的页面设计方案...',
        agent_name: this.name,
        timestamp: new Date().toISOString()
      },
      system_state: {
        intent: 'advance_to_next_agent',
        done: true,
        progress: 100,
        current_stage: '信息收集完成',
        next_agent: 'design_agent',
        metadata: {
          collection_summary: forceSummary,
          ready_for_next_stage: true,
          force_advance: true
        }
      }
    });
  }
}
