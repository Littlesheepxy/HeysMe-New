import { BaseAgent } from '../base-agent';
import { 
  StreamableAgentResponse, 
  AgentCapabilities,
  UserIntent,
  PersonalizationProfile
} from '@/lib/types/streaming';
import { SessionData } from '@/lib/types/session';
import { DESIGN_AGENT_PROMPT, formatPrompt } from '@/lib/prompts';
import { z } from 'zod';
import {
  DesignStrategy,
  extractUserGoal,
  extractUserType,
  determineLayout,
  determineTheme,
  determineSections,
  determineFeatures,
  generateCustomizations,
  determinePriority,
  determineAudience,
  getRecommendedTechStack,
  generateDevelopmentPrompt,
  generateSectionContent,
  getLayoutDescription,
  getThemeDescription,
  getDesignFocus
} from './utils';

/**
 * Prompt Output Agent - 页面结构设计和开发任务生成
 */
export class PromptOutputAgent extends BaseAgent {
  constructor() {
    const capabilities: AgentCapabilities = {
      canStream: true,
      requiresInteraction: false,
      outputFormats: ['json', 'markdown'],
      maxRetries: 2,
      timeout: 20000
    };
    
    super('PromptOutputAgent', capabilities);
  }

  /**
   * 主处理流程 - 生成页面设计方案和开发任务
   */
  async* process(
    input: any,
    sessionData: SessionData,
    context?: Record<string, any>
  ): AsyncGenerator<StreamableAgentResponse, void, unknown> {
    try {
      // 步骤1: 分析用户信息
      yield this.createThinkingResponse('正在分析您的信息，设计最适合的页面结构...', 50);
      await this.delay(1200);

      const userGoal = extractUserGoal(sessionData);
      const userType = extractUserType(sessionData);
      const collectedData = sessionData.collectedData;

      // 步骤2: 使用 AI 生成页面设计策略
      const designStrategy = await this.generateDesignStrategyWithAI(userGoal, userType, collectedData, sessionData.personalization);
      
      yield this.createResponse({
        immediate_display: {
          reply: this.formatDesignStrategyMessage(designStrategy, userType),
          agent_name: this.name,
          timestamp: new Date().toISOString()
        },
        system_state: {
          intent: 'designing',
          done: false,
          progress: 70,
          current_stage: '页面设计方案',
          metadata: { designStrategy }
        }
      });

      await this.delay(1500);

      // 步骤3: 生成开发任务描述
      yield this.createThinkingResponse('正在生成开发指令和技术方案...', 85);
      await this.delay(1000);

      const developmentPrompt = generateDevelopmentPrompt(designStrategy, userGoal, userType, collectedData);

      // 步骤4: 输出最终设计方案
      yield this.createResponse({
        immediate_display: {
          reply: '🎯 页面设计方案已完成！现在开始生成您的专属代码...',
          agent_name: this.name,
          timestamp: new Date().toISOString()
        },
        system_state: {
          intent: 'advance',
          done: true,
          progress: 75,
          current_stage: '页面设计完成',
          metadata: {
            designStrategy,
            developmentPrompt,
            readyForCoding: true
          }
        }
      });

      // 更新会话数据
      this.updateSessionWithDesign(sessionData, designStrategy, developmentPrompt);

    } catch (error) {
      yield await this.handleError(error as Error, sessionData, context);
    }
  }

  /**
   * 使用 AI 生成设计策略
   */
  private async generateDesignStrategyWithAI(
    userGoal: string,
    userType: string,
    collectedData: any,
    personalization?: PersonalizationProfile
  ): Promise<DesignStrategy> {
    try {
      console.log("🤖 PromptOutputAgent 调用 AI 生成设计策略...");
      
      // 使用模板生成prompt
      const prompt = formatPrompt(DESIGN_AGENT_PROMPT, {
        collected_user_info: JSON.stringify(collectedData, null, 2),
        user_goal: userGoal,
        user_type: userType
      });

      // 定义设计策略的 Schema
      const designStrategySchema = z.object({
        layout: z.enum(['portfolio_showcase', 'project_grid', 'classic_timeline', 'professional_blocks', 'modern_card', 'consultation_layout']),
        theme: z.enum(['tech_blue', 'creative_purple', 'business_gray', 'nature_green', 'vibrant_orange', 'modern', 'classic', 'creative', 'minimal', 'corporate']),
        sections: z.array(z.object({
          id: z.string(),
          title: z.string(),
          type: z.string(),
          priority: z.enum(['high', 'medium', 'low']),
          required: z.boolean()
        })),
        features: z.object({
          darkMode: z.boolean(),
          responsive: z.boolean(),
          animations: z.boolean(),
          downloadPdf: z.boolean(),
          socialLinks: z.boolean(),
          contactForm: z.boolean(),
          analytics: z.boolean(),
          seo: z.boolean()
        }),
        customizations: z.object({
          colorScheme: z.string(),
          typography: z.string(),
          spacing: z.string(),
          borderRadius: z.string(),
          shadows: z.string()
        }),
        priority: z.enum(['speed', 'quality', 'features']),
        audience: z.string()
      });

      // 调用 AI API
      const result = await this.callLLM(prompt, {
        schema: designStrategySchema,
        maxTokens: 64000,
        system: "你是一个专业的页面设计策略专家，严格按照要求的JSON格式返回设计方案。"
      });

      if ('object' in result) {
        console.log("✅ AI 设计策略生成成功");
        // 补充内容生成
        const strategy = result.object as any;
        strategy.sections = strategy.sections.map((section: any) => ({
          ...section,
          content: generateSectionContent(section.type, collectedData, userType)
        }));
        
        return strategy;
      } else {
        throw new Error('AI 返回格式不正确');
      }
    } catch (error) {
      console.error("❌ AI 设计策略生成失败，使用默认策略:", error);
      // 回退到原有的逻辑生成方法
      return this.generateDesignStrategy(userGoal, userType, collectedData, personalization);
    }
  }

  /**
   * 生成设计策略（回退方法）
   */
  private generateDesignStrategy(
    userGoal: string,
    userType: string,
    collectedData: any,
    personalization?: PersonalizationProfile
  ): DesignStrategy {
    const strategy: DesignStrategy = {
      layout: determineLayout(userGoal, userType, collectedData),
      theme: determineTheme(userType, personalization),
      sections: determineSections(userGoal, userType, collectedData),
      features: determineFeatures(userGoal, userType, collectedData),
      customizations: generateCustomizations(userType, collectedData),
      priority: determinePriority(userGoal),
      audience: determineAudience(userGoal)
    };

    return strategy;
  }

  /**
   * 格式化设计策略消息
   */
  private formatDesignStrategyMessage(strategy: DesignStrategy, userType: string): string {
    const layoutDesc = getLayoutDescription(strategy.layout);
    const themeDesc = getThemeDescription(strategy.theme);
    const designFocus = getDesignFocus(userType, strategy);

    return `🎨 **页面设计方案已生成**

**布局风格**: ${layoutDesc}
**主题配色**: ${themeDesc}
**目标受众**: ${strategy.audience}

**页面结构** (${strategy.sections.length}个模块):
${strategy.sections.map(section => 
  `• ${section.title} ${section.priority === 'high' ? '⭐' : section.priority === 'medium' ? '🔸' : '🔹'}`
).join('\n')}

**功能特性**:
${Object.entries(strategy.features)
  .filter(([_, enabled]) => enabled)
  .map(([feature, _]) => `✅ ${feature}`)
  .join('\n')}

**设计重点**: ${designFocus}`;
  }

  /**
   * 创建思考响应
   */
  protected createThinkingResponse(message: string, progress: number): StreamableAgentResponse {
    return this.createResponse({
      immediate_display: {
        reply: message,
        agent_name: this.name,
        timestamp: new Date().toISOString()
      },
      system_state: {
        intent: 'thinking',
        done: false,
        progress,
        current_stage: '设计中...'
      }
    });
  }

  /**
   * 更新会话数据
   */
  private updateSessionWithDesign(
    sessionData: SessionData,
    strategy: DesignStrategy,
    developmentPrompt: string
  ): void {
    // 扩展metadata类型以包含设计数据
    const metadata = sessionData.metadata as any;
    metadata.designStrategy = strategy;
    metadata.developmentPrompt = developmentPrompt;
    metadata.designPhaseCompleted = true;
    metadata.readyForCoding = true;
    metadata.lastUpdated = new Date().toISOString();

    // 更新collectedData以包含设计决策
    const collectedData = sessionData.collectedData as any;
    if (!collectedData.design) {
      collectedData.design = {};
    }
    
    collectedData.design = {
      strategy,
      techStack: getRecommendedTechStack(strategy, extractUserType(sessionData)),
      developmentPrompt,
      generatedAt: new Date().toISOString()
    };

    console.log("✅ 会话数据已更新，设计策略已保存");
  }

  /**
   * 延迟函数
   */
  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
} 