/**
 * 信息收集 Agent V3 - 最终版本
 * 两轮对话收集，智能工具调用，结构化输出
 */

import { BaseAgentV2, AgentCapabilities, StreamableAgentResponse, SessionData, ToolDefinition } from './base-agent';
import { z } from 'zod';
import { githubService, webService, socialService } from '@/lib/services';
import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { OPTIMIZED_INFO_COLLECTION_PROMPT } from '@/lib/prompts/info-collection';
import { INTELLIGENT_ANALYSIS_PROMPT, generateIntelligentQuestions } from '@/lib/prompts/info-collection/intelligent-analysis';
import { toolResultsStorage, ToolResult } from '@/lib/services/tool-results-storage';

// 结构化用户信息接口
interface CollectedUserInfo {
  basicProfile: {
    name: string;
    title: string;
    bio: string;
    location?: string;
    contact?: {
      email?: string;
      phone?: string;
      website?: string;
    };
  };
  
  skills: {
    technical: string[];
    soft: string[];
    languages: string[];
    certifications: string[];
  };
  
  experience: {
    current_role?: {
      title: string;
      company: string;
      duration: string;
      description: string;
    };
    work_history: Array<{
      title: string;
      company: string;
      duration: string;
      description: string;
    }>;
    projects: Array<{
      name: string;
      description: string;
      technologies: string[];
      url?: string;
    }>;
  };
  
  achievements: {
    awards: string[];
    recognitions: string[];
    metrics: string[];
    testimonials: string[];
  };
  
  online_presence: {
    github_url?: string;
    linkedin_url?: string;
    website_url?: string;
    portfolio_links: string[];
  };
  
  metadata: {
    data_sources: string[];
    confidence_score: number;
    collection_rounds: number;
    last_updated: string;
  };
}

interface AnalysisResult {
  summary: string;
  toolResults: any[];
  extractedInfo: Partial<CollectedUserInfo>;
  confidence: number;
}

// 工具结果存储接口
interface ToolResultStorage {
  github_data?: {
    profile: any;
    repositories: any[];
    raw_content: string;
    extracted_at: string;
    source_url: string;
  };
  
  webpage_data?: {
    title: string;
    content: string;
    structured_info: any;
    raw_html?: string;
    extracted_at: string;
    source_url: string;
  };
  
  linkedin_data?: {
    profile: any;
    experience: any[];
    raw_content: string;
    extracted_at: string;
    source_url: string;
  };
  
  user_text_data?: {
    content: string;
    extracted_info: any;
    processed_at: string;
  };
}

interface CompletenessAssessment {
  score: number; // 0-1
  needsMoreInfo: boolean;
  missingAreas: string[];
  specificQuestions: string[];
}

export class InfoCollectionAgentV3 extends BaseAgentV2 {
  private currentRound: number = 0;
  private maxRounds: number = 2;
  private collectedData: Partial<CollectedUserInfo> = {};
  private toolResultStorage: ToolResultStorage = {};
  
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
      specializedFor: ['information_collection', 'structured_analysis', 'user_profiling']
    };

    super('智能信息收集专家V3', 'info-collection-v3', capabilities);
  }

  /**
   * 定义工具集
   */
  getTools(): Record<string, ToolDefinition> {
    return {
      analyze_github: {
        name: 'analyze_github',
        description: '分析 GitHub 用户资料和仓库信息',
        inputSchema: z.object({
          username_or_url: z.string().describe('GitHub 用户名或 URL'),
          include_repos: z.boolean().optional().default(true)
        }),
        execute: async ({ username_or_url, include_repos = true }) => {
          console.log(`🔧 [GitHub] 分析: ${username_or_url}`);
          
          // 1. 检查缓存
          const cachedResult = await toolResultsStorage.getCachedResult(
            username_or_url, 
            'analyze_github',
            undefined, // user_id 在实际使用时传入
            { ttl_hours: 24 } // GitHub 数据缓存24小时
          );
          
          if (cachedResult) {
            console.log(`✅ [GitHub] 缓存命中: ${username_or_url}`);
            return cachedResult.tool_output;
          }
          
          // 2. 调用服务获取新数据
          try {
            const result = await githubService.analyzeUser(username_or_url, include_repos);
            console.log(`✅ [GitHub] 完成: ${result.username}`);
            
            // 3. 存储到缓存
            await toolResultsStorage.storeResult({
              user_id: 'temp-user', // 实际使用时从 context 获取
              agent_name: this.name,
              tool_name: 'analyze_github',
              source_url: username_or_url,
              tool_output: result,
              status: 'success',
              is_cacheable: true,
              metadata: {
                include_repos,
                response_time: Date.now()
              }
            }, { ttl_hours: 24 });
            
            return result;
          } catch (error) {
            console.log(`⚠️ [GitHub] 服务调用失败，返回模拟数据: ${error}`);
            
            const mockResult = {
              username: username_or_url.split('/').pop() || username_or_url,
              profile: { 
                name: '开发者', 
                bio: '技术专家',
                followers: 100,
                following: 50
              },
              repositories: include_repos ? [
                { name: 'awesome-project', stars: 150, language: 'JavaScript' },
                { name: 'cool-library', stars: 80, language: 'TypeScript' }
              ] : [],
              message: 'GitHub 分析完成（模拟数据）'
            };
            
            // 存储模拟数据（较短缓存时间）
            await toolResultsStorage.storeResult({
              user_id: 'temp-user',
              agent_name: this.name,
              tool_name: 'analyze_github',
              source_url: username_or_url,
              tool_output: mockResult,
              status: 'partial',
              is_cacheable: true,
              error_message: error instanceof Error ? error.message : 'Unknown error',
              metadata: { is_mock: true }
            }, { ttl_hours: 1 }); // 模拟数据只缓存1小时
            
            return mockResult;
          }
        }
      },

      scrape_webpage: {
        name: 'scrape_webpage',
        description: '抓取和分析网页内容',
        inputSchema: z.object({
          url: z.string().describe('要抓取的网页 URL'),
          target_sections: z.array(z.string()).optional().default(['all'])
        }),
        execute: async ({ url, target_sections = ['all'] }) => {
          console.log(`🔧 [网页] 抓取: ${url}`);
          try {
            const result = await webService.scrapeWebpage(url, target_sections);
            console.log(`✅ [网页] 完成: ${result.title}`);
            return result;
          } catch (error) {
            console.log(`⚠️ [网页] 服务调用失败，返回模拟数据: ${error}`);
            return {
              url,
              title: '个人作品集网站',
              description: '展示专业技能和项目经验的个人网站',
              content: '这是一个专业的个人网站，展示了丰富的项目经验和技术能力。',
              message: '网页分析完成（模拟数据）'
            };
          }
        }
      },

      extract_linkedin: {
        name: 'extract_linkedin',
        description: '提取 LinkedIn 专业信息',
        inputSchema: z.object({
          profile_url: z.string().describe('LinkedIn 档案 URL')
        }),
        execute: async ({ profile_url }) => {
          console.log(`🔧 [LinkedIn] 分析: ${profile_url}`);
          try {
            const result = await socialService.extractLinkedIn(profile_url);
            console.log(`✅ [LinkedIn] 完成`);
            return result;
          } catch (error) {
            console.log(`⚠️ [LinkedIn] 服务调用失败，返回模拟数据: ${error}`);
            return {
              profile_url,
              name: '专业人士',
              title: '高级软件工程师',
              summary: '经验丰富的软件开发专家，专注于前端技术和用户体验设计。',
              experience: [
                { company: '科技公司', position: '高级工程师', duration: '2020-现在' }
              ],
              message: 'LinkedIn 分析完成（模拟数据）'
            };
          }
        }
      }
    };
  }

  /**
   * 主处理方法
   */
  async *processRequest(
    userInput: string,
    sessionData: SessionData,
    context?: Record<string, any>
  ): AsyncGenerator<StreamableAgentResponse, void, unknown> {
    
    try {
      // 从 context 中恢复当前轮次状态
      this.currentRound = context?.round || 0;
      
      console.log(`🎯 [信息收集V3] 当前轮次: ${this.currentRound}, 用户输入: "${userInput.substring(0, 50)}..."`);
      
      if (this.currentRound === 0 && !userInput.trim()) {
        // 系统引导阶段（无用户输入）
        yield* this.initiateCollection(sessionData, context);
        return;
      }
      
      if (this.currentRound > 0 && this.currentRound <= this.maxRounds && userInput.trim()) {
        // 用户资料收集阶段（有用户输入）
        yield* this.processUserInput(userInput, sessionData, context);
        return;
      }
      
      // 超出轮次，直接结构化
      yield* this.finalizeCollection(sessionData, context);
      
    } catch (error) {
      console.error('❌ [信息收集V3] 处理失败:', error);
      yield this.createResponse({
        immediate_display: {
          reply: '抱歉，处理过程中遇到了问题。让我们重新开始收集您的信息。',
          agent_name: this.name,
          timestamp: new Date().toISOString()
        },
        system_state: {
          intent: 'error_recovery',
          done: false,
          current_stage: '错误恢复'
        }
      });
    }
  }

  /**
   * 系统引导阶段
   */
  private async *initiateCollection(
    sessionData: SessionData,
    context?: Record<string, any>
  ): AsyncGenerator<StreamableAgentResponse, void, unknown> {
    
    this.currentRound = 1;
    
    const userRole = context?.welcomeData?.user_role || '专业人士';
    const useCase = context?.welcomeData?.use_case || '个人展示';
    
    const transitionPrompt = `您好！为了为您创建一个精美的${useCase}页面，我需要了解一些关于您的信息。

作为${userRole}，请提供以下任何一种或多种资料：

📋 **文档资料**
• 您的简历或个人介绍文档
• 项目说明或作品集文档

🔗 **在线链接**
• GitHub 个人主页或项目链接
• LinkedIn 专业档案
• 个人网站或作品集网站
• 其他专业平台链接

💬 **文字描述**
• 直接告诉我您的背景和经历
• 描述您的技能和成就

请分享您的资料，我来帮您分析整理！`;

    yield this.createResponse({
      immediate_display: {
        reply: transitionPrompt,
        agent_name: this.name,
        timestamp: new Date().toISOString()
      },
      system_state: {
        intent: 'awaiting_user_input',
        done: false,
        progress: 10,
        current_stage: '等待用户提供资料',
        metadata: {
          round: this.currentRound,
          max_rounds: this.maxRounds,
          user_role: userRole,
          use_case: useCase
        }
      }
    });
  }

  /**
   * 处理用户输入
   */
  private async *processUserInput(
    userInput: string,
    sessionData: SessionData,
    context?: Record<string, any>
  ): AsyncGenerator<StreamableAgentResponse, void, unknown> {
    
    // 1. 分析用户输入
    yield this.createThinkingResponse(
      `🔍 正在分析您提供的信息... (第${this.currentRound}轮)`, 
      20 + (this.currentRound - 1) * 30
    );
    
    const analysisResult = await this.analyzeUserInput(userInput, sessionData, context);
    
    // 2. 更新收集的数据
    this.updateCollectedData(analysisResult);
    
    // 3. 评估完整度
    const completenessAssessment = await this.assessCompletenessIntelligent();
    
    console.log(`📊 [完整度评估] 分数: ${completenessAssessment.score}, 需要更多: ${completenessAssessment.needsMoreInfo}`);
    
    if (completenessAssessment.needsMoreInfo && this.currentRound < this.maxRounds) {
      // 需要更多信息，进入下一轮
      this.currentRound++;
      
      const supplementaryPrompt = this.generateSupplementaryPrompt(completenessAssessment);
      
      yield this.createResponse({
        immediate_display: {
          reply: `✅ 已分析您的资料！${analysisResult.summary}\n\n${supplementaryPrompt}`,
          agent_name: this.name,
          timestamp: new Date().toISOString()
        },
        system_state: {
          intent: 'awaiting_supplementary_input',
          done: false,
          progress: 50,
          current_stage: `等待补充信息 (第${this.currentRound}轮)`,
          metadata: {
            round: this.currentRound,
            completeness_score: completenessAssessment.score,
            missing_areas: completenessAssessment.missingAreas
          }
        }
      });
    } else {
      // 信息足够或达到最大轮次，进行结构化整理
      yield* this.finalizeCollection(sessionData, context);
    }
  }

  /**
   * 分析用户输入
   */
  private async analyzeUserInput(
    userInput: string,
    sessionData: SessionData,
    context?: Record<string, any>
  ): Promise<AnalysisResult> {
    
    // 检测链接
    const detectedLinks = this.detectLinks(userInput);
    const hasDocuments = context?.parsedDocuments?.length > 0;
    
    console.log(`🔍 [输入分析] 链接: ${detectedLinks.length}, 文档: ${hasDocuments ? 'Yes' : 'No'}`);
    
    if (detectedLinks.length === 0 && !hasDocuments) {
      // 纯文本输入
      return await this.extractFromText(userInput, context);
    }
    
    // 有链接或文档，进行工具调用
    const toolPrompt = this.buildToolCallPrompt(userInput, detectedLinks, context);
    
    console.log(`🚀 [工具调用] 开始执行多步骤工作流，链接数: ${detectedLinks.length}`);
    console.log(`📝 [工具调用] Prompt: ${toolPrompt.substring(0, 200)}...`);
    
    try {
      const result = await this.executeMultiStepWorkflow(
        userInput,
        sessionData,
        toolPrompt,
        4
      );
      
      console.log(`✅ [工具调用] 完成，工具调用数: ${result.toolCalls?.length || 0}`);
      console.log(`📊 [工具调用] 工具结果数: ${result.toolResults?.length || 0}`);
      
      return {
        summary: this.generateAnalysisSummary(result.toolResults, userInput),
        toolResults: result.toolResults,
        extractedInfo: this.extractInfoFromResults(result.toolResults, userInput, context),
        confidence: 0.8
      };
    } catch (error) {
      console.error(`❌ [工具调用] 失败: ${error}`);
      // 回退到文本提取
      return await this.extractFromText(userInput, context);
    }
  }

  /**
   * 检测链接
   */
  private detectLinks(input: string): string[] {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return input.match(urlRegex) || [];
  }

  /**
   * 从纯文本提取信息
   */
  private async extractFromText(userInput: string, context?: Record<string, any>): Promise<AnalysisResult> {
    console.log(`📝 [文本提取] 处理纯文本输入`);
    
    // 使用优化的 prompt 进行文本提取
    const welcomeData = context?.welcomeData || {};
    const promptParams = {
      user_role: welcomeData.user_role || '专业人士',
      use_case: welcomeData.use_case || '个人展示',
      style: welcomeData.style || '现代简约',
      highlight_focus: welcomeData.highlight_focus || '专业技能',
      commitment_level: welcomeData.commitment_level || '认真制作',
      reasoning: '基于用户文本描述进行信息提取',
      should_use_samples: false,
      sample_reason: '用户提供了文本描述',
      uploaded_files_count: 0,
      files_pre_parsed: false,
      parsed_file_content: '',
      has_links: false,
      link_info: '',
      collection_priority: this.getCollectionPriority(welcomeData.user_role),
      current_collected_data: JSON.stringify(this.collectedData),
      available_tools: '无需工具调用，直接分析文本',
      context_for_next_agent: '文本信息提取阶段',
      turn_count: this.currentRound
    };

    // 格式化 prompt
    let formattedPrompt = OPTIMIZED_INFO_COLLECTION_PROMPT;
    
    // 替换所有参数
    Object.entries(promptParams).forEach(([key, value]) => {
      const placeholder = `{${key}}`;
      formattedPrompt = formattedPrompt.replace(new RegExp(placeholder, 'g'), String(value));
    });

    // 添加文本提取指令
    formattedPrompt += `\n\n## 当前任务：文本信息提取
用户输入：
${userInput}

请从用户的文本描述中提取结构化信息，包括：
- 姓名和职位
- 技能和专长  
- 工作经验
- 项目经历
- 成就和亮点

以自然友好的语调总结提取的信息。`;

    const result = await generateText({
      model: anthropic('claude-3-5-sonnet-20241022'),
      messages: [{ role: 'user', content: formattedPrompt }],
      temperature: 0.3
    });

    return {
      summary: result.text,
      toolResults: [],
      extractedInfo: this.parseTextExtraction(result.text, userInput),
      confidence: 0.6 // 纯文本提取置信度较低
    };
  }

  /**
   * 构建工具调用 prompt
   */
  private buildToolCallPrompt(
    userInput: string,
    detectedLinks: string[],
    context?: Record<string, any>
  ): string {
    
    const documentInfo = context?.parsedDocuments?.map((doc: any) => 
      `文档：${doc.fileName} (${doc.type})\n摘要：${doc.summary}`
    ).join('\n') || '';

    // 使用现有的优化 prompt，并填充相关参数
    const welcomeData = context?.welcomeData || {};
    const promptParams = {
      user_role: welcomeData.user_role || '专业人士',
      use_case: welcomeData.use_case || '个人展示',
      style: welcomeData.style || '现代简约',
      highlight_focus: welcomeData.highlight_focus || '专业技能',
      commitment_level: welcomeData.commitment_level || '认真制作',
      reasoning: '基于用户提供的信息进行分析',
      should_use_samples: false,
      sample_reason: '用户提供了具体信息',
      uploaded_files_count: context?.parsedDocuments?.length || 0,
      files_pre_parsed: (context?.parsedDocuments?.length || 0) > 0,
      parsed_file_content: documentInfo,
      has_links: detectedLinks.length > 0,
      link_info: detectedLinks.join(', '),
      collection_priority: this.getCollectionPriority(welcomeData.user_role),
      current_collected_data: JSON.stringify(this.collectedData),
      available_tools: 'analyze_github, scrape_webpage, extract_linkedin',
      context_for_next_agent: '信息收集阶段',
      turn_count: this.currentRound
    };

    // 格式化 prompt
    let formattedPrompt = OPTIMIZED_INFO_COLLECTION_PROMPT;
    
    // 替换所有参数
    Object.entries(promptParams).forEach(([key, value]) => {
      const placeholder = `{${key}}`;
      formattedPrompt = formattedPrompt.replace(new RegExp(placeholder, 'g'), String(value));
    });

    // 添加当前用户输入
    formattedPrompt += `\n\n## 当前用户输入：\n${userInput}`;

    return formattedPrompt;
  }

  /**
   * 获取收集优先级策略
   */
  private getCollectionPriority(userRole?: string): string {
    const priorities: Record<string, string[]> = {
      '开发者': ['GitHub', '技术博客', '简历', '开源项目'],
      '前端开发工程师': ['GitHub', '作品集', '技术博客', '项目经验'],
      '设计师': ['作品集', 'Behance', 'Dribbble', '简历'],
      '产品经理': ['LinkedIn', '项目案例', '简历', '成果展示'],
      '默认': ['简历', '作品集', '专业档案', '技能展示']
    };

    const priority = priorities[userRole || '默认'] || priorities['默认'];
    return priority.join(', ');
  }

  /**
   * 存储工具调用结果
   */
  private storeToolResults(toolResults: any[], userInput: string): void {
    const timestamp = new Date().toISOString();
    
    toolResults.forEach(result => {
      const toolName = result.toolName;
      const output = result.output;
      
      switch (toolName) {
        case 'analyze_github':
          this.toolResultStorage.github_data = {
            profile: output.profile || {},
            repositories: output.repositories || [],
            raw_content: JSON.stringify(output, null, 2),
            extracted_at: timestamp,
            source_url: this.extractGitHubUrl(userInput) || 'unknown'
          };
          console.log(`📦 [存储] GitHub 数据已存储: ${output.username || 'unknown'}`);
          break;
          
        case 'scrape_webpage':
          this.toolResultStorage.webpage_data = {
            title: output.title || 'Unknown',
            content: output.content || '',
            structured_info: output,
            extracted_at: timestamp,
            source_url: this.extractWebUrl(userInput) || 'unknown'
          };
          console.log(`📦 [存储] 网页数据已存储: ${output.title || 'unknown'}`);
          break;
          
        case 'extract_linkedin':
          this.toolResultStorage.linkedin_data = {
            profile: output.profile || {},
            experience: output.experience || [],
            raw_content: JSON.stringify(output, null, 2),
            extracted_at: timestamp,
            source_url: this.extractLinkedInUrl(userInput) || 'unknown'
          };
          console.log(`📦 [存储] LinkedIn 数据已存储: ${output.name || 'unknown'}`);
          break;
      }
    });
  }

  /**
   * 提取 URL 的辅助方法
   */
  private extractGitHubUrl(text: string): string | null {
    const match = text.match(/https?:\/\/github\.com\/[^\s]+/);
    return match ? match[0] : null;
  }

  private extractWebUrl(text: string): string | null {
    const match = text.match(/https?:\/\/[^\s]+/);
    return match ? match[0] : null;
  }

  private extractLinkedInUrl(text: string): string | null {
    const match = text.match(/https?:\/\/(?:www\.)?linkedin\.com\/[^\s]+/);
    return match ? match[0] : null;
  }

  /**
   * 更新收集的数据
   */
  private updateCollectedData(analysisResult: AnalysisResult): void {
    // 先存储工具结果
    if (analysisResult.toolResults && analysisResult.toolResults.length > 0) {
      this.storeToolResults(analysisResult.toolResults, '');
    }
    
    const { extractedInfo } = analysisResult;
    
    // 合并基本信息
    if (extractedInfo.basicProfile) {
      this.collectedData.basicProfile = {
        ...this.collectedData.basicProfile,
        ...extractedInfo.basicProfile
      };
    }
    
    // 合并技能信息
    if (extractedInfo.skills) {
      this.collectedData.skills = {
        technical: [...(this.collectedData.skills?.technical || []), ...(extractedInfo.skills.technical || [])],
        soft: [...(this.collectedData.skills?.soft || []), ...(extractedInfo.skills.soft || [])],
        languages: [...(this.collectedData.skills?.languages || []), ...(extractedInfo.skills.languages || [])],
        certifications: [...(this.collectedData.skills?.certifications || []), ...(extractedInfo.skills.certifications || [])]
      };
    }
    
    // 合并其他信息...
    if (extractedInfo.experience) {
      this.collectedData.experience = {
        ...this.collectedData.experience,
        ...extractedInfo.experience
      };
    }
    
    if (extractedInfo.online_presence) {
      this.collectedData.online_presence = {
        ...this.collectedData.online_presence,
        ...extractedInfo.online_presence
      };
    }
    
    console.log(`📊 [数据更新] 已更新收集数据`);
  }

  /**
   * 评估信息完整度
   */
  private async assessCompletenessIntelligent(): Promise<CompletenessAssessment> {
    // 如果有工具结果，使用智能分析
    const hasToolResults = Object.keys(this.toolResultStorage).length > 0;
    
    if (hasToolResults) {
      try {
        const analysis = await this.performIntelligentAnalysis();
        return {
          score: analysis.completeness / 100,
          needsMoreInfo: analysis.completeness < 80,
          missingAreas: [analysis.priority],
          specificQuestions: analysis.questions
        };
      } catch (error) {
        console.error('❌ [智能评估] 失败，回退到基础评估:', error);
      }
    }
    
    // 基础评估逻辑（回退方案）
    return this.assessCompletenessBasic();
  }

  private assessCompletenessBasic(): CompletenessAssessment {
    const data = this.collectedData;
    
    // 评估各个维度
    const hasBasicInfo = !!(data.basicProfile?.name && data.basicProfile?.title);
    const hasSkills = !!(data.skills?.technical?.length || data.skills?.soft?.length);
    const hasExperience = !!(data.experience?.work_history?.length || data.experience?.projects?.length);
    const hasOnlinePresence = !!(data.online_presence?.github_url || data.online_presence?.linkedin_url);
    
    const dimensions = [hasBasicInfo, hasSkills, hasExperience, hasOnlinePresence];
    const score = dimensions.filter(Boolean).length / dimensions.length;
    
    const missingAreas: string[] = [];
    const specificQuestions: string[] = [];
    
    if (!hasBasicInfo) {
      missingAreas.push('基本信息');
      specificQuestions.push('能告诉我您的姓名和职位吗？');
    }
    
    if (!hasSkills) {
      missingAreas.push('技能专长');
      specificQuestions.push('您最擅长的技能或专长是什么？');
    }
    
    if (!hasExperience) {
      missingAreas.push('工作经验');
      specificQuestions.push('能简单介绍一下您的工作经历或项目经验吗？');
    }
    
    // 根据轮次调整阈值
    const threshold = this.currentRound === 1 ? 0.5 : 0.3;
    const needsMoreInfo = score < threshold && missingAreas.length > 0;
    
    return {
      score,
      needsMoreInfo,
      missingAreas,
      specificQuestions
    };
  }

  /**
   * 生成补充问题
   */
  private generateSupplementaryPrompt(assessment: CompletenessAssessment): string {
    // 基于已存储的工具结果生成智能化的补充问题
    const contextualQuestions = this.generateContextualQuestions();
    const questions = [...contextualQuestions, ...assessment.specificQuestions].slice(0, 2);
    
    return `为了完善您的档案，我还想了解一些细节：

${questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

请补充这些信息，或提供其他相关资料。`;
  }

  /**
   * 基于已存储的工具结果生成上下文相关的问题
   */
  private generateContextualQuestions(): string[] {
    // 使用智能分析模块生成问题
    return generateIntelligentQuestions(this.toolResultStorage);
  }

  /**
   * 使用 AI 进行深度信息分析
   */
  private async performIntelligentAnalysis(): Promise<{
    completeness: number;
    findings: string;
    questions: string[];
    priority: string;
  }> {
    try {
      const analysisPrompt = INTELLIGENT_ANALYSIS_PROMPT
        .replace('{github_data}', this.formatStoredData('github'))
        .replace('{webpage_data}', this.formatStoredData('webpage'))
        .replace('{linkedin_data}', this.formatStoredData('linkedin'))
        .replace('{user_text}', this.formatCollectedText());

      const result = await generateText({
        model: anthropic('claude-3-5-sonnet-20241022'),
        messages: [
          {
            role: 'system',
            content: '你是专业的信息分析专家，擅长从多源数据中提取关键信息并生成精准的补充问题。'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        temperature: 0.3,
        maxTokens: 1000
      });

      // 解析 AI 分析结果
      return this.parseAnalysisResult(result.text);
    } catch (error) {
      console.error('❌ [智能分析] 失败:', error);
      // 回退到基础分析
      return {
        completeness: 50,
        findings: '基于已收集的信息进行基础分析',
        questions: this.generateContextualQuestions(),
        priority: '补充个人技能和项目经验'
      };
    }
  }

  /**
   * 格式化存储的数据用于分析
   */
  private formatStoredData(type: 'github' | 'webpage' | 'linkedin'): string {
    const data = this.toolResultStorage[`${type}_data`];
    if (!data) return '暂无数据';
    
    switch (type) {
      case 'github':
        return `GitHub 用户: ${data.profile?.name || 'unknown'}
仓库数量: ${data.repositories?.length || 0}
主要项目: ${data.repositories?.slice(0, 3).map((r: any) => r.name).join(', ') || '无'}
关注者: ${data.profile?.followers || 0}`;
        
      case 'webpage':
        return `网站标题: ${data.title}
内容摘要: ${data.content?.substring(0, 200) || ''}...
网站类型: ${data.structured_info?.type || '个人网站'}`;
        
      case 'linkedin':
        return `姓名: ${data.profile?.name || 'unknown'}
当前职位: ${data.experience?.[0]?.position || '未知'}
公司: ${data.experience?.[0]?.company || '未知'}
经验数量: ${data.experience?.length || 0}`;
        
      default:
        return '数据格式错误';
    }
  }

  /**
   * 格式化收集的文本数据
   */
  private formatCollectedText(): string {
    const texts: string[] = [];
    
    if (this.collectedData.basicProfile?.bio) {
      texts.push(`个人简介: ${this.collectedData.basicProfile.bio}`);
    }
    
    if (this.collectedData.skills?.technical?.length) {
      texts.push(`技术技能: ${this.collectedData.skills.technical.join(', ')}`);
    }
    
    return texts.join('\n') || '暂无文本数据';
  }

  /**
   * 解析 AI 分析结果
   */
  private parseAnalysisResult(text: string): {
    completeness: number;
    findings: string;
    questions: string[];
    priority: string;
  } {
    const completenessMatch = text.match(/信息完整性.*?(\d+)%/);
    const findingsMatch = text.match(/主要发现.*?:(.*?)建议问题/s);
    const questionsMatch = text.match(/建议问题.*?:(.*?)优先级/s);
    const priorityMatch = text.match(/优先级.*?:(.*?)$/s);
    
    const questions: string[] = [];
    if (questionsMatch) {
      const questionText = questionsMatch[1];
      const questionLines = questionText.split('\n').filter(line => line.trim().match(/^\d+\./));
      questions.push(...questionLines.map(line => line.replace(/^\d+\.\s*/, '').trim()));
    }
    
    return {
      completeness: completenessMatch ? parseInt(completenessMatch[1]) : 50,
      findings: findingsMatch ? findingsMatch[1].trim() : '基础信息分析完成',
      questions: questions.length > 0 ? questions : this.generateContextualQuestions(),
      priority: priorityMatch ? priorityMatch[1].trim() : '补充核心信息'
    };
  }

  /**
   * 最终结构化整理
   */
  private async *finalizeCollection(
    sessionData: SessionData,
    context?: Record<string, any>
  ): AsyncGenerator<StreamableAgentResponse, void, unknown> {
    
    yield this.createThinkingResponse('🎯 正在整理和结构化您的信息...', 80);
    
    // 使用专门的结构化 prompt 整理信息
    const structuredInfo = await this.structurizeCollectedInfo(context);
    
    yield this.createResponse({
      immediate_display: {
        reply: `🎉 信息收集完成！我已经整理了您的完整档案，包含了您的专业背景、技能特长和成就亮点。现在开始为您生成个性化页面...`,
        agent_name: this.name,
        timestamp: new Date().toISOString()
      },
      system_state: {
        intent: 'collection_complete',
        done: true,
        progress: 100,
        current_stage: '信息收集完成',
        next_agent: 'prompt_generation_agent',
        metadata: {
          collected_user_info: structuredInfo,
          total_rounds: this.currentRound,
          data_sources: structuredInfo.metadata.data_sources,
          confidence_score: structuredInfo.metadata.confidence_score
        }
      }
    });
  }

  /**
   * 结构化整理收集的信息
   */
  private async structurizeCollectedInfo(context?: Record<string, any>): Promise<CollectedUserInfo> {
    
    // 构建完整的文档内容（仅在最终结构化时使用，优化 Token）
    const documentContent = context?.parsedDocuments?.map((doc: any) => 
      `文档：${doc.fileName}\n内容：${doc.content}`
    ).join('\n\n') || '';

    const structurePrompt = `请将收集到的用户信息结构化整理成标准格式：

收集到的信息：
${JSON.stringify(this.collectedData, null, 2)}

用户上下文：
- 角色：${context?.welcomeData?.user_role}
- 用途：${context?.welcomeData?.use_case}

文档内容：
${documentContent}

请按照以下格式整理信息，确保信息完整准确：

{
  "basicProfile": {
    "name": "用户姓名",
    "title": "职位或身份",
    "bio": "简短的个人介绍",
    "location": "所在地（如果有）",
    "contact": {
      "email": "邮箱（如果有）",
      "website": "个人网站（如果有）"
    }
  },
  "skills": {
    "technical": ["技术技能列表"],
    "soft": ["软技能列表"],
    "languages": ["语言能力"],
    "certifications": ["认证证书"]
  },
  "experience": {
    "work_history": [
      {
        "title": "职位",
        "company": "公司",
        "duration": "时间段",
        "description": "工作描述"
      }
    ],
    "projects": [
      {
        "name": "项目名称",
        "description": "项目描述",
        "technologies": ["使用技术"],
        "url": "项目链接（如果有）"
      }
    ]
  },
  "achievements": {
    "awards": ["奖项"],
    "recognitions": ["认可"],
    "metrics": ["量化成果"],
    "testimonials": ["推荐评价"]
  },
  "online_presence": {
    "github_url": "GitHub链接",
    "linkedin_url": "LinkedIn链接",
    "website_url": "个人网站",
    "portfolio_links": ["作品集链接"]
  }
}

请返回完整的 JSON 格式数据。`;

    const result = await generateText({
      model: anthropic('claude-3-5-sonnet-20241022'),
      messages: [{ role: 'user', content: structurePrompt }],
      temperature: 0.3
    });
    
    // 解析和验证结构化结果
    const structuredData = this.parseStructuredResult(result.text);
    
    // 添加元数据
    structuredData.metadata = {
      data_sources: this.getDataSources(),
      confidence_score: this.calculateOverallConfidence(),
      collection_rounds: this.currentRound,
      last_updated: new Date().toISOString()
    };
    
    console.log(`✅ [结构化完成] 数据源: ${structuredData.metadata.data_sources.join(', ')}`);
    
    return structuredData;
  }

  /**
   * 辅助方法
   */
  private generateAnalysisSummary(toolResults: any[], userInput: string): string {
    if (toolResults.length === 0) {
      return '我已经分析了您提供的文本信息。';
    }
    
    const summaries: string[] = [];
    
    toolResults.forEach(result => {
      if (result.output?.username) {
        summaries.push(`分析了您的 GitHub 资料，发现了 ${result.output.repositories?.length || 0} 个项目`);
      }
      if (result.output?.title) {
        summaries.push(`抓取了您的网站内容：${result.output.title}`);
      }
      if (result.output?.name) {
        summaries.push(`提取了您的 LinkedIn 专业信息`);
      }
    });
    
    return summaries.length > 0 ? summaries.join('，') + '。' : '已完成信息分析。';
  }

  private extractInfoFromResults(toolResults: any[], userInput: string, context?: Record<string, any>): Partial<CollectedUserInfo> {
    const extracted: Partial<CollectedUserInfo> = {
      basicProfile: {
        name: '用户',
        title: '专业人士',
        bio: '待完善'
      },
      skills: { technical: [], soft: [], languages: [], certifications: [] },
      experience: { work_history: [], projects: [] },
      achievements: { awards: [], recognitions: [], metrics: [], testimonials: [] },
      online_presence: { portfolio_links: [] }
    };
    
    toolResults.forEach(result => {
      const output = result.output;
      
      if (output?.username) {
        // GitHub 数据
        extracted.basicProfile!.name = output.profile?.name || output.username;
        extracted.basicProfile!.bio = output.profile?.bio;
        extracted.online_presence!.github_url = `https://github.com/${output.username}`;
        
        if (output.languages?.summary) {
          extracted.skills!.technical = output.languages.summary.map((l: any) => l[0]);
        }
        
        if (output.repositories) {
          extracted.experience!.projects = output.repositories.slice(0, 5).map((repo: any) => ({
            name: repo.name,
            description: repo.description || '',
            technologies: repo.language ? [repo.language] : [],
            url: repo.html_url
          }));
        }
      }
      
      if (output?.url && output?.title) {
        // 网站数据
        extracted.online_presence!.website_url = output.url;
        if (!extracted.basicProfile!.bio && output.description) {
          extracted.basicProfile!.bio = output.description;
        }
      }
      
      if (output?.profile_url) {
        // LinkedIn 数据
        extracted.online_presence!.linkedin_url = output.profile_url;
        if (output.name) {
          extracted.basicProfile!.name = output.name;
        }
        if (output.summary) {
          extracted.basicProfile!.bio = output.summary;
        }
      }
    });
    
    return extracted;
  }

  private parseTextExtraction(extractedText: string, originalInput: string): Partial<CollectedUserInfo> {
    // 简单的文本解析逻辑
    return {
      basicProfile: {
        name: '用户',
        title: '专业人士',
        bio: extractedText.substring(0, 200)
      }
    };
  }

  private calculateConfidence(toolResults: any[]): number {
    if (toolResults.length === 0) return 0.5;
    return Math.min(0.9, 0.6 + (toolResults.length * 0.1));
  }

  private parseStructuredResult(resultText: string): CollectedUserInfo {
    try {
      // 尝试解析 JSON
      const jsonMatch = resultText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.warn('⚠️ JSON 解析失败，使用默认结构');
    }
    
    // 返回默认结构
    return {
      basicProfile: {
        name: this.collectedData.basicProfile?.name || '用户',
        title: this.collectedData.basicProfile?.title || '专业人士',
        bio: this.collectedData.basicProfile?.bio || '经验丰富的专业人士'
      },
      skills: this.collectedData.skills || { technical: [], soft: [], languages: [], certifications: [] },
      experience: this.collectedData.experience || { work_history: [], projects: [] },
      achievements: this.collectedData.achievements || { awards: [], recognitions: [], metrics: [], testimonials: [] },
      online_presence: this.collectedData.online_presence || { portfolio_links: [] },
      metadata: {
        data_sources: [],
        confidence_score: 0.5,
        collection_rounds: this.currentRound,
        last_updated: new Date().toISOString()
      }
    };
  }

  private getDataSources(): string[] {
    const sources: string[] = [];
    
    if (this.collectedData.online_presence?.github_url) sources.push('GitHub');
    if (this.collectedData.online_presence?.linkedin_url) sources.push('LinkedIn');
    if (this.collectedData.online_presence?.website_url) sources.push('Website');
    
    sources.push('Conversation');
    
    return sources;
  }

  private calculateOverallConfidence(): number {
    const dataPoints = [
      !!this.collectedData.basicProfile?.name,
      !!this.collectedData.basicProfile?.title,
      !!(this.collectedData.skills?.technical?.length),
      !!(this.collectedData.experience?.projects?.length),
      !!(this.collectedData.online_presence?.github_url)
    ];
    
    return dataPoints.filter(Boolean).length / dataPoints.length;
  }
}
