import { BaseAgent } from '../base-agent';
import { 
  StreamableAgentResponse, 
  AgentCapabilities,
  UserIntent,
  PersonalizationProfile
} from '@/lib/types/streaming';
import { SessionData } from '@/lib/types/session';
import { CONVERSATIONAL_INFO_COLLECTION_PROMPT, formatPrompt } from '@/lib/prompts';
import { githubService, webService, documentService, socialService } from '@/lib/services';
import { enhancedLinkAnalyzer, LinkAnalysisResult } from '@/lib/services/enhanced-link-analyzer';

/**
 * 工具定义接口
 */
interface Tool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (params: any) => Promise<any>;
}

/**
 * 工具调用结果
 */
interface ToolExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * 智能链接处理结果
 */
interface IntelligentLinkResult {
  url: string;
  platform: string;
  content_type: string;
  extracted_data: {
    title?: string;
    description?: string;
    author?: string;
    technical_details?: {
      languages: string[];
      frameworks: string[];
      tools: string[];
    };
    visual_elements?: {
      images: string[];
      videos: string[];
      demos: string[];
    };
    metadata?: Record<string, any>;
  };
  integration_recommendation: {
    type: 'iframe' | 'card' | 'gallery' | 'timeline' | 'skill_badge' | 'text_block' | 'link_only';
    priority: 'high' | 'medium' | 'low';
    section: string;
    display_config: Record<string, any>;
    processed_content: {
      title: string;
      description: string;
      tags: string[];
      highlight_points: string[];
    };
  };
  llm_analysis: {
    content_assessment: string;
    integration_rationale: string;
    user_benefit: string;
    optimization_tips: string[];
    next_suggestions: string[];
  };
  confidence: number;
}

/**
 * 升级版Info Collection Agent - 对话式+智能链接处理+展示集成判断
 * 充分利用大模型的判断能力和工具调用能力
 */
export class ConversationalInfoCollectionAgent extends BaseAgent {
  name = '智能信息收集助手';
  private tools: Map<string, Tool> = new Map();
  private sessionData!: SessionData; // 使用断言操作符，因为在process方法中会设置

  constructor() {
    const capabilities: AgentCapabilities = {
      canStream: true,
      requiresInteraction: false, // 不再需要表单交互
      outputFormats: ['json', 'text'],
      maxRetries: 3,
      timeout: 30000
    };
    
    super('ConversationalInfoCollectionAgent', capabilities);
    this.initializeTools();
  }

  /**
   * 初始化工具集 - 核心能力之一：工具调用能力
   */
  private initializeTools(): void {
    // 智能链接分析工具 - 综合处理所有类型的链接
    this.tools.set('intelligent_link_analysis', {
      name: 'intelligent_link_analysis',
      description: '智能分析任何类型的链接，自动判断内容类型、提取信息并决定最佳展示方式',
      parameters: {
        url: 'string',
        user_context: 'object' // 用户背景信息
      },
      execute: this.intelligentLinkAnalysisTool.bind(this)
    });

    // GitHub分析工具
    this.tools.set('analyze_github', {
      name: 'analyze_github',
      description: '深度分析GitHub仓库和用户信息',
      parameters: {
        username_or_url: 'string',
        include_repos: 'boolean'
      },
      execute: this.analyzeGithubTool.bind(this)
    });

    // 文档解析工具
    this.tools.set('parse_document', {
      name: 'parse_document',
      description: '解析上传的文档内容',
      parameters: {
        file_data: 'string',
        file_type: 'string'
      },
      execute: this.parseDocumentTool.bind(this)
    });

    // 网页内容抓取工具
    this.tools.set('scrape_webpage', {
      name: 'scrape_webpage',
      description: '抓取网页内容并提取结构化信息',
      parameters: {
        url: 'string',
        target_sections: 'array'
      },
      execute: this.scrapeWebpageTool.bind(this)
    });

    // LinkedIn信息提取工具
    this.tools.set('extract_linkedin', {
      name: 'extract_linkedin',
      description: '从LinkedIn链接提取职业信息',
      parameters: {
        profile_url: 'string'
      },
      execute: this.extractLinkedinTool.bind(this)
    });

    console.log(`✅ [工具初始化] 已注册 ${this.tools.size} 个工具`);
  }

  /**
   * 主处理流程 - 核心能力之二：充分利用大模型的判断能力
   */
  async* process(
    input: { user_input: string },
    sessionData: SessionData,
    context?: Record<string, any>
  ): AsyncGenerator<StreamableAgentResponse, void, unknown> {
    console.log(`🎯 [智能收集] 开始处理用户输入: "${input.user_input}"`);
    
    this.sessionData = sessionData;

    try {
      // 提取Welcome Agent传递的信息
      const welcomeData = this.extractWelcomeAgentData(sessionData);
      console.log(`📋 [Welcome信息]`, welcomeData);

      // 第一步：思考中...
      yield this.createThinkingResponse('正在分析您的输入，智能判断需要什么处理...', 20);
      await this.delay(1000);

      // 第二步：大模型智能分析用户输入 - 核心能力应用
      const analysisResult = await this.intelligentAnalyzeUserInput(input.user_input, welcomeData, sessionData);
      console.log(`🧠 [智能分析结果]`, analysisResult);

      // 第三步：执行工具调用（如果需要）
      if (analysisResult.needsToolCalling) {
        yield this.createThinkingResponse(`我发现您提到了${analysisResult.detectedAssets.join('、')}，让我智能分析一下...`, 40);
        
        const toolResults = await this.executeTools(analysisResult.toolCalls);
        yield this.createThinkingResponse('分析完成！正在智能判断展示方式和集成建议...', 70);
        
        // 更新会话数据
        this.updateSessionWithToolResults(sessionData, toolResults);
      }

      // 第四步：生成智能响应 - 核心能力之四：展示集成判断
      yield* this.generateIntelligentResponse(analysisResult, sessionData, welcomeData);

    } catch (error) {
      console.error(`❌ [智能收集Agent错误]`, error);
      yield await this.handleError(error as Error, sessionData, context);
    }
  }

  /**
   * 大模型智能分析用户输入 - 核心能力之一：充分利用大模型判断能力
   */
  private async intelligentAnalyzeUserInput(
    userInput: string, 
    welcomeData: any, 
    sessionData: SessionData
  ): Promise<any> {
    const prompt = formatPrompt(CONVERSATIONAL_INFO_COLLECTION_PROMPT, {
      user_input: userInput,
      user_role: welcomeData.userRole,
      use_case: welcomeData.useCase,
      urgency: welcomeData.urgency,
      collection_priority: JSON.stringify(welcomeData.collectionPriority),
      current_collected_data: JSON.stringify(this.getCurrentCollectedData(sessionData)),
      available_tools: Array.from(this.tools.keys()).join(', ')
    });

    // 🔧 关键修复：将session历史同步到BaseAgent
    const infoCollectionHistory = (sessionData?.metadata as any)?.infoCollectionHistory || [];
    if (!this.conversationHistory.has(sessionData.id)) {
      this.conversationHistory.set(sessionData.id, []);
    }
    const baseAgentHistory = this.conversationHistory.get(sessionData.id)!;
    if (baseAgentHistory.length === 0 && infoCollectionHistory.length > 0) {
      console.log(`🔄 [InfoCollection历史同步] 从session恢复 ${infoCollectionHistory.length} 条历史到BaseAgent`);
      baseAgentHistory.push(...infoCollectionHistory);
    }

    const response = await this.callLLM(prompt, {
      schemaType: 'conversationalAnalysis',
      maxTokens: 64000,
      sessionId: sessionData.id,
      useHistory: true  // 🔧 启用对话历史管理
    });

    return JSON.parse(response);
  }

  /**
   * 执行工具调用 - 核心能力之二：工具调用能力
   */
  private async executeTools(toolCalls: any[]): Promise<ToolExecutionResult[]> {
    const results: ToolExecutionResult[] = [];
    
    for (const toolCall of toolCalls) {
      try {
        const tool = this.tools.get(toolCall.tool_name);
        if (!tool) {
          results.push({
            success: false,
            error: `工具 ${toolCall.tool_name} 不存在`
          });
          continue;
        }

        console.log(`🔧 [工具调用] 执行 ${toolCall.tool_name}`, toolCall.parameters);
        const result = await tool.execute(toolCall.parameters);
        
        results.push({
          success: true,
          data: result,
          metadata: { tool: toolCall.tool_name, parameters: toolCall.parameters }
        });

      } catch (error) {
        console.error(`❌ [工具执行失败] ${toolCall.tool_name}:`, error);
        results.push({
          success: false,
          error: error instanceof Error ? error.message : '工具执行失败',
          metadata: { tool: toolCall.tool_name }
        });
      }
    }

    return results;
  }

  /**
   * 智能链接分析工具 - 核心能力之三：内容收集、解析
   * 这是最重要的工具，整合了所有链接处理功能
   */
  private async intelligentLinkAnalysisTool(params: { url: string; user_context?: any }): Promise<IntelligentLinkResult> {
    const { url, user_context } = params;
    
    console.log(`🔍 [智能链接分析] 开始处理: ${url}`);
    
    try {
      // 第一阶段：智能分析链接类型和内容
      const linkAnalysis = await enhancedLinkAnalyzer.analyzeLink(url, user_context);
      console.log(`📊 [链接分析完成]`, linkAnalysis);
      
      // 第二阶段：根据分析结果执行具体的内容提取
      const extractedContent = await this.executeContentExtraction(linkAnalysis);
      console.log(`📥 [内容提取完成]`, extractedContent);
      
      // 第三阶段：大模型进行展示集成判断
      const integrationRecommendation = await this.intelligentIntegrationJudgment(
        url, 
        linkAnalysis, 
        extractedContent, 
        user_context
      );
      console.log(`🎨 [集成建议完成]`, integrationRecommendation);
      
      // 第四阶段：生成综合分析和建议
      const llmAnalysis = await this.generateLLMAnalysis(
        url,
        linkAnalysis,
        extractedContent,
        integrationRecommendation,
        user_context
      );
      
      return {
        url,
        platform: linkAnalysis.platform,
        content_type: linkAnalysis.detected_type,
        extracted_data: {
          title: extractedContent.title,
          description: extractedContent.description,
          author: extractedContent.author,
          technical_details: extractedContent.technical_details,
          visual_elements: extractedContent.visual_elements,
          metadata: extractedContent.metadata
        },
        integration_recommendation: integrationRecommendation,
        llm_analysis: llmAnalysis,
        confidence: linkAnalysis.confidence
      };
      
    } catch (error) {
      console.error(`❌ [智能链接分析失败]`, error);
      return this.createFallbackLinkResult(url, error);
    }
  }

  /**
   * 执行内容提取 - 核心能力之三：内容收集、解析
   */
  private async executeContentExtraction(analysis: LinkAnalysisResult): Promise<any> {
    const { url, platform } = analysis;
    
    try {
      if (platform === 'github') {
        // GitHub分析 - 使用专门的GitHub服务
        return await githubService.analyzeUser(url, true);
      } else if (platform === 'linkedin') {
        // LinkedIn提取 - 使用专门的社交服务
        return await socialService.extractLinkedIn(url);
      } else if (analysis.suggested_extraction.method === 'scrape' || analysis.suggested_extraction.method === 'scrape_with_iframe_option') {
        // 网页抓取 - 使用专门的Web服务
        return await webService.scrapeWebpage(url, analysis.suggested_extraction.sections);
      } else {
        // 默认网页处理 - 使用专门的Web服务
        return await webService.scrapeWebpage(url, ['all']);
      }
    } catch (error) {
      console.error(`内容提取失败 [${url}]:`, error);
      throw error;
    }
  }

  /**
   * 大模型进行展示集成判断 - 核心能力之四：展示集成判断
   */
  private async intelligentIntegrationJudgment(
    url: string,
    linkAnalysis: LinkAnalysisResult,
    extractedContent: any,
    userContext: any
  ): Promise<any> {
    const prompt = `
作为用户体验专家，请为以下内容制定最佳的页面集成方案：

URL: ${url}
链接分析: ${JSON.stringify(linkAnalysis, null, 2)}
提取内容: ${JSON.stringify(extractedContent, null, 2)}
用户背景: ${JSON.stringify(userContext, null, 2)}

请分析并生成集成建议：

{
  "type": "iframe/card/gallery/timeline/skill_badge/text_block/link_only",
  "priority": "high/medium/low", 
  "section": "hero/projects/experience/skills/about/contact/footer",
  "display_config": {
    "layout": "grid/list/carousel/masonry/timeline",
    "size": "small/medium/large/full",
    "style_hints": ["modern", "minimal", "colorful"],
    "interactive": true/false
  },
  "processed_content": {
    "title": "展示标题",
    "description": "描述文本(50字内)", 
    "tags": ["标签1", "标签2"],
    "highlight_points": ["亮点1", "亮点2"]
  },
  "reasoning": "选择这种展示方式的详细理由"
}

决策考虑因素：
1. 内容类型与用户身份的匹配度
2. 视觉冲击力与信息价值的平衡
3. 页面整体布局的和谐性
4. 技术可行性和加载性能
`;

    const response = await this.callLLM(prompt, {
      maxTokens: 64000,
      sessionId: this.sessionData.id,
      useHistory: true  // 🔧 启用对话历史管理
    });

    return JSON.parse(response);
  }

  /**
   * 生成LLM分析和建议 - 核心能力之五：把信息给到prompt生成agent
   */
  private async generateLLMAnalysis(
    url: string,
    linkAnalysis: LinkAnalysisResult,
    extractedContent: any,
    integrationRecommendation: any,
    userContext: any
  ): Promise<any> {
    const prompt = `
作为简历优化顾问，请为用户解释这个链接的价值和展示建议：

URL: ${url}
链接分析: ${JSON.stringify(linkAnalysis, null, 2)}
提取内容: ${JSON.stringify(extractedContent, null, 2)}
集成建议: ${JSON.stringify(integrationRecommendation, null, 2)}
用户背景: ${JSON.stringify(userContext, null, 2)}

请生成用户友好的解释：

{
  "content_assessment": "这个内容的价值评估(100字内)",
  "integration_rationale": "为什么选择这种展示方式(100字内)",
  "user_benefit": "对用户简历/页面的具体帮助(100字内)",
  "optimization_tips": ["优化建议1", "优化建议2"],
  "next_suggestions": ["建议收集的相关材料1", "建议2"]
}

语调要求：
- 专业但友好
- 具体而非抽象  
- 针对用户的具体情况
- 提供可操作的建议
`;

    const response = await this.callLLM(prompt, {
      maxTokens: 64000,
      sessionId: this.sessionData.id,
      useHistory: true  // 🔧 启用对话历史管理
    });

    return JSON.parse(response);
  }

  /**
   * 生成智能响应 - 根据分析结果决定下一步行动
   */
  private async* generateIntelligentResponse(
    analysisResult: any,
    sessionData: SessionData,
    welcomeData: any
  ): AsyncGenerator<StreamableAgentResponse, void, unknown> {
    
    switch (analysisResult.action) {
      case 'advance_to_next_stage':
        yield this.createAdvanceResponse(analysisResult, sessionData);
        break;
        
      case 'continue_conversation':
        yield this.createContinueConversationResponse(analysisResult, welcomeData);
        break;
        
      case 'clarify_user_input':
        yield this.createClarificationResponse(analysisResult);
        break;
        
      case 'provide_suggestions':
        yield this.createSuggestionResponse(analysisResult, welcomeData);
        break;
        
      default:
        yield this.createDefaultResponse(analysisResult, welcomeData);
    }
  }

  // ============== 工具实现 ==============

  private async analyzeGithubTool(params: { username_or_url: string; include_repos: boolean }): Promise<any> {
    return await githubService.analyzeUser(params.username_or_url, params.include_repos);
  }

  private async parseDocumentTool(params: { file_data: string; file_type: string }): Promise<any> {
    return await documentService.parseDocument(params.file_data, params.file_type);
  }

  private async scrapeWebpageTool(params: { url: string; target_sections: string[] }): Promise<any> {
    return await webService.scrapeWebpage(params.url, params.target_sections);
  }

  private async extractLinkedinTool(params: { profile_url: string }): Promise<any> {
    return await socialService.extractLinkedIn(params.profile_url);
  }

  // ============== 辅助方法 ==============

  private extractWelcomeAgentData(sessionData: SessionData) {
    const preferences = sessionData.personalization?.preferences || {};
    const context = sessionData.personalization?.context || {};
    const identity = sessionData.personalization?.identity || {};
    
    return {
      userRole: context.current_situation || identity.profession || '用户',
      useCase: context.career_goals || sessionData.userIntent?.primary_goal || '创建页面',
      urgency: sessionData.userIntent?.urgency || '正常',
      style: preferences.style || 'modern',
      collectionPriority: this.getCollectionPriority(context.current_situation || identity.profession || 'general')
    };
  }

  private getCollectionPriority(userRole: string): string[] {
    const priorities: Record<string, string[]> = {
      'developer': ['GitHub', '技术博客', '简历', '开源项目'],
      'designer': ['作品集', '简历', 'Behance', '设计案例'],
      'product_manager': ['LinkedIn', '简历', '产品案例', '博客'],
      'marketer': ['LinkedIn', '简历', '营销案例', '社交媒体'],
      'other': ['简历', 'LinkedIn', '个人网站', '作品展示']
    };
    
    return priorities[userRole] || priorities['other'];
  }

  private getCurrentCollectedData(sessionData: SessionData): any {
    return sessionData.collectedData || {};
  }

  private updateSessionWithToolResults(sessionData: SessionData, toolResults: ToolExecutionResult[]): void {
    if (!sessionData.collectedData) {
      sessionData.collectedData = {
        personal: {},
        professional: { skills: [] },
        experience: [],
        education: [],
        projects: [],
        achievements: [],
        certifications: []
      };
    }

    toolResults.forEach(result => {
      if (result.success && result.data) {
        this.mergeCollectedData(sessionData.collectedData, result.data, result.metadata?.tool);
      }
    });
  }

  private mergeCollectedData(existingData: any, newData: any, toolName?: string): void {
    // 根据工具类型智能合并数据
    switch (toolName) {
      case 'analyze_github':
        this.mergeGitHubData(existingData, newData);
        break;
      case 'extract_linkedin':
        this.mergeLinkedInData(existingData, newData);
        break;
      case 'scrape_webpage':
        this.mergeWebpageData(existingData, newData);
        break;
      case 'intelligent_link_analysis':
        this.mergeIntelligentLinkData(existingData, newData);
        break;
      default:
        // 通用合并逻辑
        Object.assign(existingData, newData);
    }
  }

  private mergeGitHubData(existingData: any, githubData: any): void {
    // 合并GitHub数据到项目和技能
    if (githubData.top_repositories) {
      githubData.top_repositories.forEach((repo: any) => {
        existingData.projects.push({
          id: `github-${repo.name}`,
          name: repo.name,
          description: repo.description || '',
          technologies: repo.language ? [repo.language] : [],
          repository: repo.url,
          highlights: [`${repo.stars} stars`, `${repo.forks} forks`]
        });
      });
    }

    if (githubData.languages) {
      existingData.professional.skills = Array.from(
        new Set([...existingData.professional.skills, ...githubData.languages])
      );
    }
  }

  private mergeLinkedInData(existingData: any, linkedinData: any): void {
    // 合并LinkedIn数据到经历
    if (linkedinData.experience) {
      linkedinData.experience.forEach((exp: any) => {
        existingData.experience.push({
          id: `linkedin-${exp.company}`,
          company: exp.company,
          position: exp.title,
          description: exp.description || '',
          startDate: exp.duration.split('-')[0] || '',
          endDate: exp.duration.split('-')[1] || '',
          current: exp.duration.includes('至今'),
          achievements: []
        });
      });
    }
  }

  private mergeWebpageData(existingData: any, webpageData: any): void {
    // 从网页数据中提取有用信息
    if (webpageData.extracted_content?.sections) {
      webpageData.extracted_content.sections.forEach((section: any) => {
        if (section.type === 'projects' && section.highlights) {
          section.highlights.forEach((highlight: string) => {
            if (!existingData.projects.find((p: any) => p.name.includes(highlight))) {
              existingData.projects.push({
                id: `webpage-${Date.now()}`,
                name: highlight,
                description: '从个人网站提取',
                technologies: [],
                highlights: [highlight]
              });
            }
          });
        }
      });
    }
  }

  private mergeIntelligentLinkData(existingData: any, linkData: IntelligentLinkResult): void {
    // 根据链接分析结果智能合并数据
    const { content_type, extracted_data, integration_recommendation } = linkData;
    
    if (content_type === 'project' && extracted_data.title) {
      existingData.projects.push({
        id: `link-${Date.now()}`,
        name: extracted_data.title,
        description: extracted_data.description || '',
        technologies: extracted_data.technical_details?.languages || [],
        url: linkData.url,
        highlights: integration_recommendation.processed_content.highlight_points || []
      });
    }

    if (extracted_data.technical_details?.languages) {
      existingData.professional.skills = Array.from(
        new Set([...existingData.professional.skills, ...extracted_data.technical_details.languages])
      );
    }
  }

  private createManualProcessingRecommendation(analysis: LinkAnalysisResult): any {
    return {
      title: '需要手动处理的内容',
      description: `这个${analysis.detected_type}类型的链接需要您提供更多信息`,
      metadata: {
        analysis_result: analysis,
        recommendation: '建议用户描述这个链接的内容和价值'
      }
    };
  }

  private createFallbackLinkResult(url: string, error: any): IntelligentLinkResult {
    return {
      url,
      platform: 'unknown',
      content_type: 'error',
      extracted_data: {
        title: '处理失败的链接',
        description: '无法自动分析，建议手动描述'
      },
      integration_recommendation: {
        type: 'link_only',
        priority: 'low',
        section: 'footer',
        display_config: {},
        processed_content: {
          title: '外部链接',
          description: '需要手动处理',
          tags: ['error'],
          highlight_points: []
        }
      },
      llm_analysis: {
        content_assessment: '链接处理遇到技术问题',
        integration_rationale: '建议添加手动描述',
        user_benefit: '可以作为参考链接保留',
        optimization_tips: ['提供链接的背景描述'],
        next_suggestions: ['尝试其他格式的材料']
      },
      confidence: 0.1
    };
  }

  // ============== 响应生成方法 ==============

  private createAdvanceResponse(analysisResult: any, sessionData: SessionData): StreamableAgentResponse {
    const summary = this.generateCollectionSummary(sessionData.collectedData);
    
    return this.createResponse({
      immediate_display: {
        reply: `✅ 智能收集完成！基于大模型分析，我已经成功处理了您的材料：\n\n${summary}\n\n现在开始为您智能设计页面结构... 🎨`,
        agent_name: this.name,
        timestamp: new Date().toISOString()
      },
      system_state: {
        intent: 'advance',
        done: true,
        progress: 90,
        current_stage: '智能收集完成',
        metadata: {
          collection_summary: summary,
          ready_for_design: true
        }
      }
    });
  }

  private createContinueConversationResponse(analysisResult: any, welcomeData: any): StreamableAgentResponse {
    return this.createResponse({
      immediate_display: {
        reply: analysisResult.reply || '请继续提供您的材料，我会智能分析并判断最佳展示方式！',
        agent_name: this.name,
        timestamp: new Date().toISOString()
      },
      system_state: {
        intent: 'collecting_materials',
        done: false,
        progress: analysisResult.collection_progress || 50,
        current_stage: '智能材料收集中',
        metadata: {
          expected_input: analysisResult.next_expected_input
        }
      }
    });
  }

  private createClarificationResponse(analysisResult: any): StreamableAgentResponse {
    return this.createResponse({
      immediate_display: {
        reply: analysisResult.clarification_question || '请提供更多信息以便我更好地帮助您。',
        agent_name: this.name,
        timestamp: new Date().toISOString()
      },
      system_state: {
        intent: 'clarification',
        done: false,
        progress: analysisResult.collection_progress || 30,
        current_stage: '需要澄清',
        metadata: {
          clarification_needed: true
        }
      }
    });
  }

  private createSuggestionResponse(analysisResult: any, welcomeData: any): StreamableAgentResponse {
    return this.createResponse({
      immediate_display: {
        reply: analysisResult.suggestion_message || '让我为您提供一些建议...',
        agent_name: this.name,
        timestamp: new Date().toISOString()
      },
      interaction: analysisResult.suggestions ? {
        type: 'choice',
        title: '选择下一步行动',
        description: '您想如何继续？',
        elements: analysisResult.suggestions.map((suggestion: string, index: number) => ({
          id: `suggestion_${index}`,
          type: 'button',
          label: suggestion,
          value: suggestion
        }))
      } : undefined,
      system_state: {
        intent: 'providing_suggestions',
        done: false,
        progress: 40,
        current_stage: '提供建议',
        metadata: {
          suggestions_provided: true
        }
      }
    });
  }

  private createDefaultResponse(analysisResult: any, welcomeData: any): StreamableAgentResponse {
    return this.createResponse({
      immediate_display: {
        reply: '我正在智能处理您的输入，请稍等...',
        agent_name: this.name,
        timestamp: new Date().toISOString()
      },
      system_state: {
        intent: 'processing',
        done: false,
        progress: 60,
        current_stage: '智能处理中'
      }
    });
  }

  private generateCollectionSummary(collectedData: any): string {
    const items = [];
    
    if (collectedData?.projects?.length > 0) {
      items.push(`${collectedData.projects.length} 个项目`);
    }
    
    if (collectedData?.experience?.length > 0) {
      items.push(`${collectedData.experience.length} 段工作经历`);
    }
    
    if (collectedData?.professional?.skills?.length > 0) {
      items.push(`${collectedData.professional.skills.length} 项技能`);
    }
    
    return items.length > 0 ? items.join(' + ') : '基础信息已收集';
  }

  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}