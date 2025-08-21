import { BaseAgent } from '../base-agent';
import { 
  StreamableAgentResponse, 
  AgentCapabilities,
  UserIntent,
  PersonalizationProfile
} from '@/lib/types/streaming';
import { SessionData } from '@/lib/types/session';
import { DESIGN_AGENT_PROMPT, formatPrompt } from '@/lib/prompts';
import { CONTENT_DISPLAY_STRATEGY_PROMPT } from '@/lib/prompts/content-analysis';
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
import { contentDisplayEngine } from '@/lib/services/content-display-engine';
import { ToolResultData } from '@/components/content-manager/tool-results/ToolResultCard';

/**
 * 增强版 Prompt Output Agent - 集成内容展示策略分析
 */
export class EnhancedPromptOutputAgent extends BaseAgent {
  constructor() {
    const capabilities: AgentCapabilities = {
      canStream: true,
      requiresInteraction: false,
      outputFormats: ['json', 'markdown'],
      maxRetries: 2,
      timeout: 30000 // 增加超时时间，因为需要更多分析
    };
    
    super('EnhancedPromptOutputAgent', capabilities);
  }

  /**
   * 主处理流程 - 集成内容展示策略分析
   */
  async* process(
    input: {
      collected_data: any;
      tool_results?: ToolResultData[];
      display_strategies?: any[];
      user_goal?: string;
      user_type?: string;
    },
    sessionData: SessionData,
    context?: Record<string, any>
  ): AsyncGenerator<StreamableAgentResponse, void, unknown> {
    try {
      // 步骤1: 分析收集到的信息和工具结果
      yield this.createThinkingResponse('正在分析您的信息和展示策略...', 20);
      await this.delay(1000);

      const userGoal = input.user_goal || extractUserGoal(sessionData);
      const userType = input.user_type || extractUserType(sessionData);
      const collectedData = input.collected_data || sessionData.collectedData;
      const toolResults = input.tool_results || [];

      // 步骤2: 分析内容展示策略
      yield this.createThinkingResponse('正在分析每个信息源的最佳展示方式...', 40);
      await this.delay(1200);

      const contentDisplayAnalysis = await this.analyzeContentDisplayStrategies(
        toolResults,
        collectedData,
        userGoal,
        userType
      );

      yield this.createResponse({
        immediate_display: {
          reply: this.formatContentAnalysisMessage(contentDisplayAnalysis),
          agent_name: this.name,
          timestamp: new Date().toISOString()
        },
        system_state: {
          intent: 'analyzing',
          done: false,
          progress: 50,
          current_stage: '内容展示策略分析',
          metadata: { contentDisplayAnalysis }
        }
      });

      await this.delay(1000);

      // 步骤3: 生成整合的页面设计策略
      yield this.createThinkingResponse('正在设计最适合的页面结构和布局...', 70);
      await this.delay(1500);

      const enhancedDesignStrategy = await this.generateEnhancedDesignStrategy(
        userGoal,
        userType,
        collectedData,
        contentDisplayAnalysis,
        sessionData.personalization
      );

      yield this.createResponse({
        immediate_display: {
          reply: this.formatEnhancedDesignMessage(enhancedDesignStrategy, userType),
          agent_name: this.name,
          timestamp: new Date().toISOString()
        },
        system_state: {
          intent: 'designing',
          done: false,
          progress: 85,
          current_stage: '页面设计方案',
          metadata: { 
            designStrategy: enhancedDesignStrategy,
            contentDisplayAnalysis 
          }
        }
      });

      await this.delay(1200);

      // 步骤4: 生成增强的开发任务描述
      yield this.createThinkingResponse('正在生成详细的开发指令和技术方案...', 95);
      await this.delay(800);

      const enhancedDevelopmentPrompt = this.generateEnhancedDevelopmentPrompt(
        enhancedDesignStrategy,
        contentDisplayAnalysis,
        userGoal,
        userType,
        collectedData
      );

      // 步骤5: 输出最终设计方案
      yield this.createResponse({
        immediate_display: {
          reply: '🎯 智能页面设计方案已完成！每个信息源都有最佳的展示策略，现在开始生成您的专属代码...',
          agent_name: this.name,
          timestamp: new Date().toISOString()
        },
        system_state: {
          intent: 'advance',
          done: true,
          progress: 100,
          current_stage: '增强设计完成',
          metadata: {
            designStrategy: enhancedDesignStrategy,
            contentDisplayAnalysis,
            developmentPrompt: enhancedDevelopmentPrompt,
            readyForCoding: true
          }
        }
      });

      // 更新会话数据
      this.updateSessionWithEnhancedDesign(
        sessionData, 
        enhancedDesignStrategy, 
        contentDisplayAnalysis,
        enhancedDevelopmentPrompt
      );

    } catch (error) {
      yield await this.handleError(error as Error, sessionData, context);
    }
  }

  /**
   * 分析内容展示策略
   */
  private async analyzeContentDisplayStrategies(
    toolResults: ToolResultData[],
    collectedData: any,
    userGoal: string,
    userType: string
  ): Promise<any> {
    try {
      console.log("🔍 开始分析内容展示策略...");

      // 使用展示规则引擎分析每个工具结果
      const displayAnalyses = toolResults.map(toolResult => {
        const strategy = contentDisplayEngine.analyzeContent(toolResult);
        const confidence = this.calculateDisplayConfidence(toolResult);
        
        return {
          source: toolResult.source_url,
          tool_name: toolResult.tool_name,
          strategy,
          confidence,
          accessibility_status: { is_accessible: true },
          embedding_capability: { can_embed: false }
        };
      });

      // 使用 AI 进行综合分析
      const prompt = formatPrompt(CONTENT_DISPLAY_STRATEGY_PROMPT, {
        tool_results: JSON.stringify(toolResults, null, 2),
        user_info: JSON.stringify({ goal: userGoal, type: userType }, null, 2),
        page_goal: userGoal
      });

      const analysisSchema = z.object({
        content_analysis: z.object({
          total_sources: z.number(),
          accessible_sources: z.number(),
          restricted_sources: z.number(),
          content_quality_score: z.number().min(1).max(10),
          completeness_level: z.enum(['low', 'medium', 'high'])
        }),
        display_strategy: z.object({
          primary_sections: z.array(z.object({
            section_name: z.string(),
            content_type: z.string(),
            display_method: z.string(),
            priority: z.enum(['high', 'medium', 'low']),
            responsive_behavior: z.string(),
            data_sources: z.array(z.string()),
            fallback_strategy: z.string()
          })),
          interactive_elements: z.array(z.object({
            element_type: z.string(),
            purpose: z.string(),
            target_url: z.string().optional(),
            accessibility_status: z.string(),
            display_text: z.string(),
            visual_style: z.string()
          }))
        }),
        restricted_content_handling: z.object({
          inaccessible_links: z.array(z.object({
            url: z.string(),
            restriction_type: z.string(),
            platform: z.string(),
            suggested_display: z.string(),
            fallback_content: z.string(),
            user_action_required: z.string()
          })),
          placeholder_strategies: z.array(z.object({
            content_type: z.string(),
            placeholder_design: z.string(),
            call_to_action: z.string()
          }))
        })
      });

      const aiAnalysis = await this.callLLM(prompt, {
        schema: analysisSchema,
        maxTokens: 32000,
        system: "你是内容展示策略专家，分析信息源并制定最佳展示策略。"
      });

      if ('object' in aiAnalysis) {
        console.log("✅ AI 内容展示策略分析成功");
        return {
          ai_analysis: aiAnalysis.object,
          rule_engine_analyses: displayAnalyses,
          summary: this.generateDisplayStrategySummary(aiAnalysis.object as any, displayAnalyses)
        };
      } else {
        throw new Error('AI 分析返回格式不正确');
      }

    } catch (error) {
      console.error("❌ 内容展示策略分析失败，使用规则引擎结果:", error);
      
      // 回退到规则引擎分析
      const displayAnalyses = toolResults.map(toolResult => ({
        source: toolResult.source_url,
        tool_name: toolResult.tool_name,
        strategy: contentDisplayEngine.analyzeContent(toolResult),
        confidence: this.calculateDisplayConfidence(toolResult)
      }));

      return {
        rule_engine_analyses: displayAnalyses,
        fallback: true,
        summary: this.generateFallbackSummary(displayAnalyses)
      };
    }
  }

  /**
   * 生成增强的设计策略
   */
  private async generateEnhancedDesignStrategy(
    userGoal: string,
    userType: string,
    collectedData: any,
    contentDisplayAnalysis: any,
    personalization?: PersonalizationProfile
  ): Promise<DesignStrategy & { contentIntegration: any }> {
    try {
      console.log("🎨 生成增强设计策略...");

      // 基于内容展示分析增强设计prompt
      const enhancedPrompt = `${DESIGN_AGENT_PROMPT}

## 📊 **内容展示策略集成**

### 🔍 **内容分析结果**
${JSON.stringify(contentDisplayAnalysis, null, 2)}

### 🎯 **设计要求增强**
基于内容展示分析，你需要：

1. **响应式设计优化**：
   - 为不同设备优化每个内容的展示方式
   - 确保移动端的可访问性和用户体验

2. **内容展示集成**：
   - 将分析出的展示策略融入页面设计
   - 为不可访问内容设计合适的占位符
   - 优化嵌入内容的布局和交互

3. **交互体验设计**：
   - 基于内容类型设计合适的交互方式
   - 确保用户能够流畅地浏览所有信息
   - 提供备选访问方案

请在原有设计策略基础上，增加 contentIntegration 字段来描述如何整合这些展示策略。`;

      const prompt = formatPrompt(enhancedPrompt, {
        collected_user_info: JSON.stringify(collectedData, null, 2),
        user_goal: userGoal,
        user_type: userType
      });

      // 扩展设计策略Schema
      const enhancedDesignSchema = z.object({
        layout: z.enum(['portfolio_showcase', 'project_grid', 'classic_timeline', 'professional_blocks', 'modern_card', 'consultation_layout']),
        theme: z.enum(['tech_blue', 'creative_purple', 'business_gray', 'nature_green', 'vibrant_orange', 'modern', 'classic', 'creative', 'minimal', 'corporate']),
        sections: z.array(z.object({
          id: z.string(),
          title: z.string(),
          type: z.string(),
          priority: z.enum(['high', 'medium', 'low']),
          required: z.boolean(),
          content_sources: z.array(z.string()).optional(),
          display_strategy: z.string().optional()
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
        audience: z.string(),
        contentIntegration: z.object({
          displayMethods: z.array(z.object({
            content_type: z.string(),
            method: z.string(),
            responsive_behavior: z.string(),
            fallback_plan: z.string()
          })),
          restrictedContentHandling: z.array(z.object({
            platform: z.string(),
            placeholder_design: z.string(),
            user_guidance: z.string()
          })),
          interactionPatterns: z.array(z.object({
            pattern: z.string(),
            purpose: z.string(),
            implementation: z.string()
          }))
        })
      });

      const result = await this.callLLM(prompt, {
        schema: enhancedDesignSchema,
        maxTokens: 64000,
        system: "你是专业的页面设计策略专家，整合内容展示策略生成完整的设计方案。"
      });

      if ('object' in result) {
        console.log("✅ 增强设计策略生成成功");
        const strategy = result.object as any;
        
        // 补充内容生成
        strategy.sections = strategy.sections.map((section: any) => ({
          ...section,
          content: generateSectionContent(section.type, collectedData, userType)
        }));
        
        return strategy;
      } else {
        throw new Error('AI 返回格式不正确');
      }

    } catch (error) {
      console.error("❌ 增强设计策略生成失败，使用基础策略:", error);
      
      // 回退到基础设计策略并手动添加内容集成
      const baseStrategy = this.generateDesignStrategy(userGoal, userType, collectedData, personalization);
      
      return {
        ...baseStrategy,
        contentIntegration: this.generateFallbackContentIntegration(contentDisplayAnalysis)
      };
    }
  }

  /**
   * 生成增强的开发提示
   */
  private generateEnhancedDevelopmentPrompt(
    designStrategy: any,
    contentDisplayAnalysis: any,
    userGoal: string,
    userType: string,
    collectedData: any
  ): string {
    const basePrompt = generateDevelopmentPrompt(designStrategy, userGoal, userType, collectedData);
    
    const contentIntegrationInstructions = `

## 🎨 **内容展示策略实现指南**

### 📊 **内容分析结果**
- 总信息源: ${contentDisplayAnalysis.ai_analysis?.content_analysis?.total_sources || contentDisplayAnalysis.rule_engine_analyses?.length || 0}
- 可访问源: ${contentDisplayAnalysis.ai_analysis?.content_analysis?.accessible_sources || 0}
- 受限源: ${contentDisplayAnalysis.ai_analysis?.content_analysis?.restricted_sources || 0}
- 质量评分: ${contentDisplayAnalysis.ai_analysis?.content_analysis?.content_quality_score || 'N/A'}/10

### 🔧 **展示方式实现要求**

${this.generateDisplayImplementationInstructions(contentDisplayAnalysis)}

### 📱 **响应式展示要求**

${this.generateResponsiveInstructions(designStrategy)}

### 🔒 **受限内容处理**

${this.generateRestrictedContentInstructions(contentDisplayAnalysis)}

### 🎯 **用户体验优化**

${this.generateUXOptimizationInstructions(designStrategy, contentDisplayAnalysis)}
`;

    return basePrompt + contentIntegrationInstructions;
  }

  // 辅助方法
  private calculateDisplayConfidence(toolResult: ToolResultData): number {
    let confidence = 0.5;
    
    if (toolResult.extracted_data && Object.keys(toolResult.extracted_data).length > 0) {
      confidence += 0.3;
    }
    
    if (toolResult.content_analysis?.quality_indicators) {
      const avgQuality = (
        toolResult.content_analysis.quality_indicators.completeness +
        toolResult.content_analysis.quality_indicators.relevance +
        toolResult.content_analysis.quality_indicators.freshness
      ) / 3;
      confidence += avgQuality * 0.2;
    }
    
    if (toolResult.cache_info.status === 'fresh') {
      confidence += 0.1;
    }
    
    return Math.max(0, Math.min(1, confidence));
  }

  private generateDisplayStrategySummary(aiAnalysis: any, ruleAnalyses: any[]): string {
    return `内容展示策略分析完成：
- 总计 ${aiAnalysis.content_analysis.total_sources} 个信息源
- ${aiAnalysis.content_analysis.accessible_sources} 个可直接访问
- ${aiAnalysis.content_analysis.restricted_sources} 个需要特殊处理
- 整体质量评分: ${aiAnalysis.content_analysis.content_quality_score}/10`;
  }

  private generateFallbackSummary(analyses: any[]): string {
    const accessible = analyses.filter(a => a.strategy?.accessibility_status?.is_accessible !== false).length;
    return `使用规则引擎分析了 ${analyses.length} 个信息源，其中 ${accessible} 个可直接访问`;
  }

  private generateFallbackContentIntegration(contentDisplayAnalysis: any): any {
    return {
      displayMethods: [
        { content_type: 'github', method: 'card', responsive_behavior: 'grid_to_list', fallback_plan: 'external_link' },
        { content_type: 'webpage', method: 'embedded', responsive_behavior: 'iframe_to_link', fallback_plan: 'screenshot' },
        { content_type: 'linkedin', method: 'timeline', responsive_behavior: 'vertical_compact', fallback_plan: 'text_summary' }
      ],
      restrictedContentHandling: [
        { platform: 'linkedin', placeholder_design: 'professional_card', user_guidance: 'click_to_visit' },
        { platform: 'instagram', placeholder_design: 'social_card', user_guidance: 'external_access' }
      ],
      interactionPatterns: [
        { pattern: 'hover_preview', purpose: 'quick_info', implementation: 'tooltip_overlay' },
        { pattern: 'click_expand', purpose: 'detailed_view', implementation: 'modal_dialog' }
      ]
    };
  }

  private generateDisplayImplementationInstructions(contentDisplayAnalysis: any): string {
    if (!contentDisplayAnalysis.ai_analysis?.display_strategy?.primary_sections) {
      return "基于规则引擎分析结果实现相应的展示组件。";
    }

    return contentDisplayAnalysis.ai_analysis.display_strategy.primary_sections
      .map((section: any) => `- **${section.section_name}**: 使用${section.display_method}方式展示，${section.responsive_behavior}`)
      .join('\n');
  }

  private generateResponsiveInstructions(designStrategy: any): string {
    return `- 桌面端: 使用${designStrategy.layout}布局，支持丰富交互
- 平板端: 适配中等屏幕，平衡信息密度
- 移动端: 简化布局，关键信息优先显示`;
  }

  private generateRestrictedContentInstructions(contentDisplayAnalysis: any): string {
    if (!contentDisplayAnalysis.ai_analysis?.restricted_content_handling?.inaccessible_links) {
      return "为不可访问内容提供合适的占位符和访问引导。";
    }

    return contentDisplayAnalysis.ai_analysis.restricted_content_handling.inaccessible_links
      .map((link: any) => `- **${link.platform}**: ${link.suggested_display}，${link.fallback_content}`)
      .join('\n');
  }

  private generateUXOptimizationInstructions(designStrategy: any, contentDisplayAnalysis: any): string {
    return `- 确保所有交互元素都有明确的视觉反馈
- 为加载状态提供适当的占位符
- 实现渐进式增强，确保基础功能在所有设备上可用
- 优化页面加载性能，特别是嵌入内容的延迟加载`;
  }

  // 继承原有方法
  private generateDesignStrategy(
    userGoal: string,
    userType: string,
    collectedData: any,
    personalization?: PersonalizationProfile
  ): DesignStrategy {
    return {
      layout: determineLayout(userGoal, userType, collectedData),
      theme: determineTheme(userType, personalization),
      sections: determineSections(userGoal, userType, collectedData),
      features: determineFeatures(userGoal, userType, collectedData),
      customizations: generateCustomizations(userType, collectedData),
      priority: determinePriority(userGoal),
      audience: determineAudience(userGoal)
    };
  }

  private formatContentAnalysisMessage(analysis: any): string {
    const summary = analysis.summary || '内容分析完成';
    const totalSources = analysis.ai_analysis?.content_analysis?.total_sources || 
                        analysis.rule_engine_analyses?.length || 0;
    
    return `🔍 **内容展示策略分析完成**

📊 **分析结果**:
${summary}

🎨 **展示策略**:
- 共分析了 ${totalSources} 个信息源
- 每个信息源都有定制的展示方案
- 已处理不可访问内容的备选方案
- 针对不同设备优化了展示效果

正在基于这些分析结果设计页面结构...`;
  }

  private formatEnhancedDesignMessage(strategy: any, userType: string): string {
    const layoutDesc = getLayoutDescription(strategy.layout);
    const themeDesc = getThemeDescription(strategy.theme);
    const designFocus = getDesignFocus(userType, strategy);

    return `🎨 **智能页面设计方案已生成**

**布局风格**: ${layoutDesc}
**主题配色**: ${themeDesc}
**目标受众**: ${strategy.audience}

**页面结构** (${strategy.sections.length}个模块):
${strategy.sections.map((section: any) => 
  `• ${section.title} ${section.priority === 'high' ? '⭐' : section.priority === 'medium' ? '🔸' : '🔹'}${section.display_strategy ? ` (${section.display_strategy})` : ''}`
).join('\n')}

**功能特性**:
${Object.entries(strategy.features)
  .filter(([_, enabled]) => enabled)
  .map(([feature, _]) => `✅ ${feature}`)
  .join('\n')}

**内容集成策略**:
${strategy.contentIntegration?.displayMethods?.map((method: any) => 
  `• ${method.content_type}: ${method.method}展示`
).join('\n') || '• 基于内容类型优化展示方式'}

**设计重点**: ${designFocus}`;
  }

  private updateSessionWithEnhancedDesign(
    sessionData: SessionData,
    strategy: any,
    contentDisplayAnalysis: any,
    developmentPrompt: string
  ): void {
    const metadata = sessionData.metadata as any;
    metadata.designStrategy = strategy;
    metadata.contentDisplayAnalysis = contentDisplayAnalysis;
    metadata.developmentPrompt = developmentPrompt;
    metadata.designPhaseCompleted = true;
    metadata.readyForCoding = true;
    metadata.lastUpdated = new Date().toISOString();

    const collectedData = sessionData.collectedData as any;
    if (!collectedData.design) {
      collectedData.design = {};
    }
    
    collectedData.design = {
      strategy,
      contentDisplayAnalysis,
      techStack: getRecommendedTechStack(strategy, extractUserType(sessionData)),
      developmentPrompt,
      generatedAt: new Date().toISOString()
    };

    console.log("✅ 会话数据已更新，增强设计策略已保存");
  }

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
        current_stage: '智能分析中...'
      }
    });
  }

  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
