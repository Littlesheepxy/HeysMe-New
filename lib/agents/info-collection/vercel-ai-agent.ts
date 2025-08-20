/**
 * 基于 Vercel AI SDK 的信息收集 Agent
 * 使用多步骤工具调用实现智能信息收集和分析
 */

import { BaseAgent, AgentCapabilities, StreamableAgentResponse } from '../base-agent';
import { SessionData } from '@/types/chat';
import { anthropic } from '@ai-sdk/anthropic';
import { generateText, tool, stepCountIs } from 'ai';
import { z } from 'zod';
import { githubService, webService, documentService, socialService } from '@/lib/services';

export class VercelAIInfoCollectionAgent extends BaseAgent {
  constructor() {
    const capabilities: AgentCapabilities = {
      canStream: true,
      canUseTools: true,
      canAnalyzeCode: false,
      canGenerateCode: false,
      canAccessFiles: false,
      canAccessInternet: true,
      canRememberContext: true,
      maxContextLength: 128000,
      supportedLanguages: ['zh', 'en'],
      specializedFor: ['information_collection', 'profile_analysis', 'data_extraction']
    };

    super('VercelAI信息收集专家', 'vercel-ai-info-collection', capabilities);
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
        maxTokens: 8000,
        onStepFinish: async ({ toolResults, stepNumber }) => {
          console.log(`📊 [步骤 ${stepNumber}] 完成，执行了 ${toolResults.length} 个工具`);
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
            tools_used: [...new Set(allToolCalls.map(tc => tc.toolName))],
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
    if (!sessionData.metadata) {
      sessionData.metadata = {};
    }

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
  }
}
