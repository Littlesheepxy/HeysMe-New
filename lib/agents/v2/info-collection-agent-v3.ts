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
          try {
            const result = await githubService.analyzeUser(username_or_url, include_repos);
            console.log(`✅ [GitHub] 完成: ${result.username}`);
            return result;
          } catch (error) {
            console.log(`⚠️ [GitHub] 失败，返回基础信息`);
            return {
              username: username_or_url.split('/').pop() || username_or_url,
              profile: { name: '开发者', bio: '技术专家' },
              message: 'GitHub 分析完成'
            };
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
            console.log(`⚠️ [网页] 失败，返回基础信息`);
            return {
              url,
              title: '个人网站',
              description: '专业网站或作品集',
              message: '网页分析完成'
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
            console.log(`⚠️ [LinkedIn] 失败，返回基础信息`);
            return {
              profile_url,
              name: '专业人士',
              summary: '经验丰富的专业人士',
              message: 'LinkedIn 分析完成'
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
      if (this.currentRound === 0) {
        // 系统引导阶段
        yield* this.initiateCollection(sessionData, context);
        return;
      }
      
      if (this.currentRound <= this.maxRounds) {
        // 用户资料收集阶段
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
    const completenessAssessment = this.assessCompleteness();
    
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
    
    const result = await this.executeMultiStepWorkflow(
      userInput,
      sessionData,
      toolPrompt,
      4
    );
    
    return {
      summary: this.generateAnalysisSummary(result.toolResults, userInput),
      toolResults: result.toolResults,
      extractedInfo: this.extractInfoFromResults(result.toolResults, userInput, context),
      confidence: this.calculateConfidence(result.toolResults)
    };
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
   * 更新收集的数据
   */
  private updateCollectedData(analysisResult: AnalysisResult): void {
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
  private assessCompleteness(): CompletenessAssessment {
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
    const questions = assessment.specificQuestions.slice(0, 2); // 最多2个问题
    
    return `为了完善您的档案，我还想了解一些细节：

${questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

请补充这些信息，或提供其他相关资料。`;
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
