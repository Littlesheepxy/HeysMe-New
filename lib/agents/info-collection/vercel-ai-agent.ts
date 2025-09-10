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
import { toolResultsStorage } from '@/lib/services/tool-results-storage';

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
   * 处理用户交互 - 实现 BaseAgent 接口
   */
  async handleInteraction(
    interactionType: string,
    data: any,
    sessionData: SessionData
  ): Promise<any> {
    console.log(`🔄 [VercelAI交互] 处理交互类型: ${interactionType}`);
    console.log(`📋 [交互数据]`, { 
      hasMessage: !!data.message, 
      hasFiles: !!data.files && data.files.length > 0,
      messageLength: data.message?.length || 0,
      filesCount: data.files?.length || 0
    });

    if (interactionType === 'interaction') {
      // 构建用户输入
      let userInput = '';
      
      // 优先使用用户的实际消息
      if (data.message && typeof data.message === 'string' && data.message.trim()) {
        userInput = data.message.trim();
      }
      
      // 添加文件信息
      if (data.files && data.files.length > 0) {
        const fileDescriptions = data.files.map((file: any) => {
          if (file.parsedContent) {
            return `文档内容：${file.parsedContent.substring(0, 500)}...`;
          }
          return `文件：${file.id}`;
        });
        
        if (userInput) {
          userInput += '\n\n' + fileDescriptions.join('\n');
        } else {
          userInput = fileDescriptions.join('\n');
        }
      }
      
      if (!userInput.trim()) {
        console.log(`⚠️ [交互警告] 没有有效的用户输入内容`);
        return { action: 'continue' };
      }
      
      console.log(`📝 [构建输入] 用户输入长度: ${userInput.length}`);
      
      // 使用流式处理方法
      return { 
        action: 'stream_response',
        message: userInput  // 使用 message 字段，与 formatInteractionAsUserMessage 兼容
      };
    }
    
    // 其他交互类型的默认处理
    return { action: 'continue' };
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
      
      // 检查用户输入是否包含具体的链接或内容
      const hasConcreteInput = this.hasConcreteInput(input.user_input);
      
      if (isFirstTime && !hasConcreteInput) {
        console.log(`🌟 [首次启动] 这是Info Collection阶段的第一次启动，发送过渡消息`);
        yield* this.createWelcomeToInfoCollectionFlow(welcomeData, sessionData);
        console.log(`✅ [过渡完成] 过渡消息已发送，等待用户提供链接、文档或文本`);
        return;
      }
      
      // 如果是第一次但用户提供了具体内容，标记已发送欢迎消息
      if (isFirstTime && hasConcreteInput) {
        console.log(`🚀 [直接处理] 用户提供了具体内容，跳过过渡消息直接处理`);
        const metadata = sessionData.metadata as any;
        metadata.infoCollectionWelcomeSent = true;
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

      analyze_social_media: tool({
        description: 'Analyze social media profiles and content from platforms like TikTok, X/Twitter, Behance, Instagram, etc.',
        inputSchema: z.object({
          platform_url: z.string().describe('Complete social media profile URL'),
          platform_type: z.enum(['tiktok', 'twitter', 'x', 'behance', 'dribbble', 'instagram', 'youtube', 'medium', 'dev.to']).describe('Social media platform type')
        }),
        execute: async ({ platform_url, platform_type }) => {
          console.log(`🔧 [社交媒体工具] 分析 ${platform_type}: ${platform_url}`);
          const result = await socialService.analyzeSocialMedia(platform_url, { analysis_focus: 'profile' });
          console.log(`✅ [社交媒体工具] 完成`);
          return result;
        }
      }),

      synthesize_profile: tool({
        description: 'Synthesize collected information, generate display recommendations, and create storage plan for links and content.',
        inputSchema: z.object({
          github_data: z.any().optional().describe('GitHub analysis results'),
          website_data: z.any().optional().describe('Website scraping results'),
          linkedin_data: z.any().optional().describe('LinkedIn extraction results'),
          social_media_data: z.any().optional().describe('Social media analysis results'),
          document_content: z.string().optional().describe('Pre-parsed document content from frontend')
        }),
        execute: async ({ github_data, website_data, linkedin_data, social_media_data, document_content }) => {
          console.log(`🔧 [综合分析] 合成专业档案并生成展示建议`);
          
          // 构建基础档案
          const profile = {
            basic_info: {
              name: github_data?.profile?.name || linkedin_data?.name || social_media_data?.profile?.name || 'Unknown',
              location: github_data?.profile?.location || linkedin_data?.location,
              bio: github_data?.profile?.bio || linkedin_data?.summary || social_media_data?.profile?.bio,
              avatar: github_data?.profile?.avatar_url || social_media_data?.profile?.avatar
            },
            technical_skills: {
              primary_languages: github_data?.languages?.summary?.slice(0, 5) || [],
              technologies: [
                ...(website_data?.content_analysis?.technical_stack || []),
                ...(github_data?.languages?.summary?.map((l: any) => l[0]) || [])
              ].filter((tech, index, arr) => arr.indexOf(tech) === index),
              expertise_level: github_data?.analysis?.tech_diversity || 0.5
            },
            professional_experience: {
              github_activity: github_data?.activity_metrics || {},
              projects: github_data?.repositories?.slice(0, 5) || [],
              work_history: linkedin_data?.experience || [],
              social_presence: social_media_data?.influence_metrics || {}
            },
            online_presence: {
              github_url: github_data ? `https://github.com/${github_data.username}` : null,
              website_url: website_data?.url || null,
              linkedin_url: linkedin_data?.profile_url || null,
              social_media_url: social_media_data?.platform_url || null,
              social_links: website_data?.content_analysis?.social_links || {}
            }
          };

          // 生成展示建议
          const display_recommendations = {
            hero_section: this.generateHeroRecommendations(profile, document_content),
            projects_showcase: this.generateProjectsRecommendations(github_data, website_data),
            social_proof: this.generateSocialProofRecommendations(social_media_data, github_data),
            content_highlights: this.extractContentHighlights(website_data, social_media_data, document_content)
          };

          // 生成存储计划
          const storage_plan = {
            links_to_store: this.generateLinksToStore(github_data, website_data, linkedin_data, social_media_data),
            content_summary: this.generateContentSummary(profile, document_content),
            metadata: {
              extraction_confidence: this.calculateOverallConfidence([github_data, website_data, linkedin_data, social_media_data]),
              data_sources: [
                github_data && 'GitHub',
                website_data && 'Personal Website', 
                linkedin_data && 'LinkedIn',
                social_media_data && 'Social Media',
                document_content && 'Documents'
              ].filter(Boolean)
            }
          };

          console.log(`✅ [综合分析] 完成，数据源: ${storage_plan.metadata.data_sources.join(', ')}`);
          
          return {
            profile,
            display_recommendations,
            storage_plan,
            analysis_summary: {
              confidence_score: storage_plan.metadata.extraction_confidence,
              data_sources: storage_plan.metadata.data_sources,
              key_strengths: this.extractKeyStrengths(profile, document_content),
              recommendations: this.generateDisplayRecommendations(profile, display_recommendations)
            }
          };
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

1. **智能分析**: 理解用户需求，识别提供的链接和文档内容
2. **链接分析**: 分析用户提供的各种链接（GitHub、网站、社交媒体等）
3. **内容总结**: 为每个链接生成内容总结和展示建议
4. **存储规划**: 确定哪些链接和信息需要存储到 Supabase
5. **展示建议**: 生成如何在个人主页中展示这些内容的具体建议

重要说明：
- 文档内容已经由前端解析完成，直接使用提供的文档内容，无需调用 parse_document 工具
- 重点分析用户提供的链接：GitHub、个人网站、社交媒体等
- 为每个链接生成详细的内容分析和展示建议
- 生成需要存储的链接列表，包含链接、标题、总结和元数据

可用工具：
- analyze_github: 分析 GitHub 用户和仓库，提取技术栈和项目信息
- scrape_webpage: 抓取和分析网页内容，特别是个人网站和产品页面
- extract_linkedin: 提取 LinkedIn 专业信息
- analyze_social_media: 分析社交媒体档案（TikTok、X、Behance等）
- synthesize_profile: 综合分析所有收集的信息，生成展示建议和存储计划

请根据用户输入的链接和文档内容，智能选择工具进行分析，最后提供专业的中文分析报告和展示建议。`
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
        model: anthropic('claude-sonnet-4-20250514'),
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

        await this.updateSessionWithToolResults(sessionData, toolResultsData);
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
   * 更新会话数据并存储工具结果
   */
  private async updateSessionWithToolResults(sessionData: SessionData, toolResults: any[]) {
    const metadata = sessionData.metadata as any;
    if (!metadata.toolResults) {
      metadata.toolResults = [];
    }

    // 存储工具结果到 Supabase
    for (const toolResult of toolResults) {
      try {
        // 确定平台类型和内容类型
        const platformType = this.determinePlatformType(toolResult.tool_name);
        const contentType = this.determineContentType(toolResult.data);
        
        // 提取源URL
        const sourceUrl = this.extractSourceUrl(toolResult.data, toolResult.tool_name);
        
        if (sourceUrl) {
          await toolResultsStorage.storeResult({
            user_id: sessionData.userId || 'unknown',
            session_id: sessionData.id,
            agent_name: this.name,
            tool_name: toolResult.tool_name,
            platform_type: platformType,
            content_type: contentType,
            source_url: sourceUrl,
            tool_output: toolResult.data,
            processed_data: this.processToolData(toolResult.data, toolResult.tool_name),
            status: 'success',
            is_cacheable: true,
            metadata: {
              extraction_confidence: toolResult.data.extraction_confidence || 0.8,
              extracted_at: toolResult.timestamp,
              agent_version: '1.0'
            }
          }, {
            ttl_hours: 24, // 缓存24小时
            user_specific: false
          });
          
          console.log(`💾 [工具结果存储] ${toolResult.tool_name} - ${sourceUrl}`);
        }
      } catch (error) {
        console.error(`❌ [存储失败] ${toolResult.tool_name}:`, error);
      }
    }

    metadata.toolResults.push(...toolResults);
    metadata.lastToolExecution = new Date().toISOString();
    metadata.totalToolCalls = (metadata.totalToolCalls || 0) + toolResults.length;

    console.log(`📊 [会话更新] 添加了 ${toolResults.length} 个工具结果`);
  }

  /**
   * 确定平台类型
   */
  private determinePlatformType(toolName: string): string {
    const platformMap: Record<string, string> = {
      'analyze_github': 'code_repository',
      'scrape_webpage': 'webpage',
      'extract_linkedin': 'social_media',
      'analyze_social_media': 'social_media'
    };
    
    return platformMap[toolName] || 'other';
  }

  /**
   * 确定内容类型
   */
  private determineContentType(data: any): string {
    if (data.profile) return 'profile';
    if (data.repositories) return 'project';
    if (data.content_analysis) return 'webpage';
    return 'mixed';
  }

  /**
   * 提取源URL
   */
  private extractSourceUrl(data: any, toolName: string): string | null {
    if (data.url) return data.url;
    if (data.platform_url) return data.platform_url;
    if (data.profile_url) return data.profile_url;
    if (data.username && toolName === 'analyze_github') {
      return `https://github.com/${data.username}`;
    }
    return null;
  }

  /**
   * 处理工具数据
   */
  private processToolData(data: any, toolName: string): any {
    return {
      summary: this.generateDataSummary(data, toolName),
      key_metrics: this.extractKeyMetrics(data, toolName),
      display_data: this.prepareDisplayData(data, toolName)
    };
  }

  /**
   * 生成数据摘要
   */
  private generateDataSummary(data: any, toolName: string): string {
    switch (toolName) {
      case 'analyze_github':
        return `GitHub用户 ${data.username}，${data.profile?.public_repos || 0} 个公开仓库`;
      case 'scrape_webpage':
        return `网站 ${data.title || 'Unknown'}，内容质量 ${data.content_analysis?.content_quality || 'N/A'}`;
      case 'extract_linkedin':
        return `LinkedIn档案 ${data.profile?.name || 'Unknown'}`;
      case 'analyze_social_media':
        return `${data.platform_type} 社交媒体档案`;
      default:
        return '数据分析完成';
    }
  }

  /**
   * 提取关键指标
   */
  private extractKeyMetrics(data: any, toolName: string): any {
    switch (toolName) {
      case 'analyze_github':
        return {
          repos: data.profile?.public_repos || 0,
          stars: data.activity_metrics?.total_stars || 0,
          followers: data.profile?.followers || 0
        };
      case 'analyze_social_media':
        return {
          followers: data.influence_metrics?.followers || 0,
          engagement: data.influence_metrics?.engagement_rate || 0
        };
      default:
        return {};
    }
  }

  /**
   * 准备展示数据
   */
  private prepareDisplayData(data: any, toolName: string): any {
    return {
      title: data.title || data.profile?.name || 'Unknown',
      description: data.description || data.profile?.bio || '',
      image: data.image || data.profile?.avatar_url || null,
      url: this.extractSourceUrl(data, toolName)
    };
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

  // ==================== 综合分析辅助方法 ====================

  /**
   * 生成首页展示建议
   */
  private generateHeroRecommendations(profile: any, documentContent?: string): any {
    return {
      title_suggestion: profile.basic_info.name || 'AI产品创始人',
      tagline_suggestion: profile.basic_info.bio || 'AI生成个人主页产品创始人',
      highlight_metrics: [
        profile.professional_experience.github_activity?.total_stars && `${profile.professional_experience.github_activity.total_stars} GitHub Stars`,
        profile.professional_experience.projects?.length && `${profile.professional_experience.projects.length} 开源项目`,
        profile.online_presence.website_url && '产品官网上线'
      ].filter(Boolean),
      background_image_suggestion: profile.basic_info.avatar || null
    };
  }

  /**
   * 生成项目展示建议
   */
  private generateProjectsRecommendations(githubData: any, websiteData: any): any {
    const projects = [];
    
    // GitHub 项目
    if (githubData?.repositories) {
      projects.push(...githubData.repositories.slice(0, 3).map((repo: any) => ({
        type: 'github',
        title: repo.name,
        description: repo.description,
        url: repo.url,
        tech_stack: repo.language ? [repo.language] : [],
        stars: repo.stars,
        display_priority: 'high'
      })));
    }
    
    // 网站项目
    if (websiteData?.url) {
      projects.push({
        type: 'website',
        title: websiteData.title || 'HeysMe AI',
        description: websiteData.description || 'AI生成个人主页产品',
        url: websiteData.url,
        tech_stack: websiteData.content_analysis?.technical_stack || [],
        display_priority: 'highest'
      });
    }
    
    return {
      featured_projects: projects,
      display_format: 'card_grid',
      show_tech_stack: true,
      show_metrics: true
    };
  }

  /**
   * 生成社交证明建议
   */
  private generateSocialProofRecommendations(socialMediaData: any, githubData: any): any {
    const socialProof = [];
    
    if (githubData?.profile?.followers) {
      socialProof.push({
        platform: 'GitHub',
        metric: 'followers',
        value: githubData.profile.followers,
        display_text: `${githubData.profile.followers} GitHub 关注者`
      });
    }
    
    if (socialMediaData?.influence_metrics) {
      socialProof.push({
        platform: socialMediaData.platform_type,
        metric: 'influence',
        value: socialMediaData.influence_metrics.followers || 0,
        display_text: `${socialMediaData.platform_type} 影响力`
      });
    }
    
    return {
      metrics: socialProof,
      display_style: 'horizontal_bar',
      show_icons: true
    };
  }

  /**
   * 提取内容亮点
   */
  private extractContentHighlights(websiteData: any, socialMediaData: any, documentContent?: string): string[] {
    const highlights = [];
    
    if (websiteData?.extracted_content?.highlights) {
      highlights.push(...websiteData.extracted_content.highlights);
    }
    
    if (socialMediaData?.content_analysis?.key_topics) {
      highlights.push(...socialMediaData.content_analysis.key_topics);
    }
    
    if (documentContent) {
      // 从文档内容中提取关键词
      const keywords = documentContent.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
      highlights.push(...keywords.slice(0, 5));
    }
    
    return Array.from(new Set(highlights)).slice(0, 10);
  }

  /**
   * 生成需要存储的链接列表
   */
  private generateLinksToStore(githubData: any, websiteData: any, linkedinData: any, socialMediaData: any): any[] {
    const linksToStore = [];
    
    if (githubData) {
      linksToStore.push({
        type: 'github',
        url: `https://github.com/${githubData.username}`,
        title: `${githubData.profile?.name || githubData.username} - GitHub`,
        summary: `${githubData.profile?.public_repos || 0} 个公开仓库，主要使用 ${githubData.languages?.primary_language || 'Multiple'} 等技术`,
        metadata: {
          repos: githubData.profile?.public_repos || 0,
          stars: githubData.activity_metrics?.total_stars || 0,
          followers: githubData.profile?.followers || 0,
          primary_language: githubData.languages?.primary_language
        },
        display_priority: 'high',
        storage_location: 'user_links'
      });
    }
    
    if (websiteData) {
      linksToStore.push({
        type: 'website',
        url: websiteData.url,
        title: websiteData.title || 'Personal Website',
        summary: websiteData.description || '个人/产品官方网站',
        metadata: {
          technologies: websiteData.content_analysis?.technical_stack || [],
          content_quality: websiteData.content_analysis?.content_quality
        },
        display_priority: 'highest',
        storage_location: 'user_links'
      });
    }
    
    if (linkedinData) {
      linksToStore.push({
        type: 'linkedin',
        url: linkedinData.profile_url,
        title: `${linkedinData.profile?.name} - LinkedIn`,
        summary: linkedinData.profile?.summary || '专业社交档案',
        metadata: {
          experience: linkedinData.experience || [],
          education: linkedinData.education || [],
          skills: linkedinData.skills || []
        },
        display_priority: 'medium',
        storage_location: 'user_links'
      });
    }
    
    if (socialMediaData) {
      linksToStore.push({
        type: 'social_media',
        platform: socialMediaData.platform_type,
        url: socialMediaData.platform_url,
        title: `${socialMediaData.platform_type} Profile`,
        summary: socialMediaData.profile?.bio || `${socialMediaData.platform_type} 社交媒体档案`,
        metadata: {
          followers: socialMediaData.influence_metrics?.followers || 0,
          content_style: socialMediaData.profile?.content_style || 'professional',
          influence_score: socialMediaData.influence_metrics?.influence_score || 0
        },
        display_priority: 'medium',
        storage_location: 'user_links'
      });
    }
    
    return linksToStore;
  }

  /**
   * 生成内容总结
   */
  private generateContentSummary(profile: any, documentContent?: string): any {
    return {
      core_identity: profile.basic_info.name || '专业人士',
      key_skills: profile.technical_skills.primary_languages || [],
      achievements: [
        profile.professional_experience.github_activity?.total_stars && `${profile.professional_experience.github_activity.total_stars} GitHub Stars`,
        profile.professional_experience.projects?.length && `${profile.professional_experience.projects.length} 个项目`
      ].filter(Boolean),
      values: ['技术创新', '开源贡献'],
      goals: ['产品开发', '技术分享'],
      document_insights: documentContent ? this.extractDocumentInsights(documentContent) : null
    };
  }

  /**
   * 计算整体置信度
   */
  private calculateOverallConfidence(dataSources: any[]): number {
    const validSources = dataSources.filter(source => source && source.extraction_confidence);
    if (validSources.length === 0) return 0.5;
    
    const avgConfidence = validSources.reduce((sum, source) => sum + source.extraction_confidence, 0) / validSources.length;
    return Math.min(avgConfidence + (validSources.length * 0.1), 1.0);
  }

  /**
   * 提取关键优势
   */
  private extractKeyStrengths(profile: any, documentContent?: string): string[] {
    const strengths = [];
    
    if (profile.technical_skills.primary_languages?.length > 0) {
      strengths.push(`多技术栈开发能力 (${profile.technical_skills.primary_languages.slice(0, 3).map((l: any) => l[0] || l).join(', ')})`);
    }
    
    if (profile.professional_experience.github_activity?.repos > 10) {
      strengths.push('丰富的开源项目经验');
    }
    
    if (profile.online_presence.website_url) {
      strengths.push('产品化思维和实现能力');
    }
    
    if (documentContent && documentContent.includes('创始人')) {
      strengths.push('创业和领导经验');
    }
    
    return strengths;
  }

  /**
   * 生成展示建议
   */
  private generateDisplayRecommendations(profile: any, displayRecommendations: any): string[] {
    const recommendations = [];
    
    if (profile.online_presence.github_url) {
      recommendations.push('在项目展示区突出显示 GitHub 仓库和技术栈');
    }
    
    if (profile.online_presence.website_url) {
      recommendations.push('将产品官网作为核心项目进行重点展示');
    }
    
    if (profile.online_presence.social_media_url) {
      recommendations.push('在社交证明区域展示社交媒体影响力');
    }
    
    recommendations.push('使用创新领袖型设计风格，突出技术实力和产品vision');
    
    return recommendations;
  }

  /**
   * 从文档内容中提取关键洞察
   */
  private extractDocumentInsights(documentContent: string): any {
    const insights = {
      key_skills: [] as string[],
      experience_years: 0,
      education: [] as string[],
      achievements: [] as string[],
      summary: documentContent.substring(0, 200) + '...'
    };
    
    // 简化的文档分析逻辑
    const skillKeywords = ['JavaScript', 'Python', 'React', 'Node.js', 'TypeScript', 'Java', 'Go'];
    insights.key_skills = skillKeywords.filter(skill => 
      documentContent.toLowerCase().includes(skill.toLowerCase())
    );
    
    return insights;
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
   * 检查用户输入是否包含具体的链接或内容
   */
  private hasConcreteInput(userInput: string): boolean {
    if (!userInput || userInput.trim().length < 10) {
      return false;
    }

    const input = userInput.toLowerCase().trim();
    
    // 检查是否包含链接
    const urlPatterns = [
      /https?:\/\/github\.com\/[\w-]+/i,
      /https?:\/\/linkedin\.com\/in\/[\w-]+/i,
      /https?:\/\/www\.linkedin\.com\/in\/[\w-]+/i,
      /https?:\/\/[\w.-]+\.[\w]{2,}/i, // 通用网址
    ];
    
    for (const pattern of urlPatterns) {
      if (pattern.test(input)) {
        return true;
      }
    }
    
    // 检查是否包含具体的技能描述或经历描述
    const contentKeywords = [
      '我是', '我的', '擅长', '经验', '技能', '项目', '工作', '开发', '设计',
      'github', 'linkedin', '简历', '作品集', '网站', '博客'
    ];
    
    const hasKeywords = contentKeywords.some(keyword => input.includes(keyword));
    const hasSubstantialContent = input.length > 50; // 超过50字符认为是具体内容
    
    return hasKeywords || hasSubstantialContent;
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
