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
   * 主处理流程 - 分阶段处理：内容分析 → 设计生成
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
      const userGoal = input.user_goal || extractUserGoal(sessionData);
      const userType = input.user_type || extractUserType(sessionData);
      const collectedData = input.collected_data || sessionData.collectedData;
      const toolResults = input.tool_results || [];

      // ==================== 阶段1: 内容展示策略分析 ====================
      yield this.createThinkingResponse('🔍 正在分析每个信息源的最佳展示方式...', 20);
      await this.delay(1000);

      const contentDisplayAnalysis = await this.analyzeContentDisplayStrategies(
        toolResults,
        collectedData,
        userGoal,
        userType
      );

      yield this.createResponse({
        immediate_display: {
          reply: '🔍 内容展示策略分析完成，正在生成页面设计方案...',
          agent_name: this.name,
          timestamp: new Date().toISOString()
        },
        system_state: {
          intent: 'analyzing',
          done: false,
          progress: 40,
          current_stage: '内容展示策略分析完成',
          metadata: { 
            contentDisplayAnalysis,
            silent_processing: true // 标记为静默处理
          }
        }
      });

      await this.delay(1200);

      // ==================== 阶段2: 设计方案生成 ====================
      yield this.createThinkingResponse('🎨 基于展示策略生成个性化页面设计方案...', 60);
      await this.delay(1500);

      const designStrategy = await this.generateDesignWithDisplayStrategy(
        userGoal,
        userType,
        collectedData,
        contentDisplayAnalysis,
        sessionData,
        sessionData.personalization
      );

      yield this.createResponse({
        immediate_display: {
          reply: '🎨 页面设计方案生成完成，正在准备开发指令...',
          agent_name: this.name,
          timestamp: new Date().toISOString()
        },
        system_state: {
          intent: 'designing',
          done: false,
          progress: 85,
          current_stage: '页面设计方案生成完成',
          metadata: { 
            designStrategy,
            contentDisplayAnalysis,
            silent_processing: true // 标记为静默处理
          }
        }
      });

      await this.delay(1000);

      // ==================== 阶段3: 开发指令生成 ====================
      yield this.createThinkingResponse('📋 生成详细的开发实现指令...', 95);
      await this.delay(800);

      const developmentPrompt = this.generateComprehensiveDevelopmentPrompt(
        designStrategy,
        contentDisplayAnalysis,
        userGoal,
        userType,
        collectedData
      );

      // ==================== 完成输出 - 自动跳转 ====================
      yield this.createResponse({
        immediate_display: {
          reply: '✅ 页面设计方案已完成，正在启动代码生成...',
          agent_name: this.name,
          timestamp: new Date().toISOString()
        },
        system_state: {
          intent: 'advance',
          done: true,
          progress: 100,
          current_stage: '设计完成',
          metadata: {
            designStrategy,
            contentDisplayAnalysis,
            developmentPrompt,
            readyForCoding: true,
            silent_advance: true, // 静默推进到下一个Agent
            auto_transition: true // 自动转换标记
          }
        }
      });

      // 更新会话数据
      this.updateSessionWithDesignResults(
        sessionData, 
        designStrategy, 
        contentDisplayAnalysis,
        developmentPrompt
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
          total_sources: z.number().int().min(0),
          accessible_sources: z.number().int().min(0),
          restricted_sources: z.number().int().min(0),
          content_quality_score: z.number().min(1).max(10),
          completeness_level: z.enum(['low', 'medium', 'high'])
        }),
        display_strategy: z.object({
          primary_sections: z.array(z.object({
            section_name: z.string().min(1),
            content_type: z.enum(['text', 'link', 'media', 'data', 'timeline']),
            display_method: z.string().min(1),
            priority: z.enum(['high', 'medium', 'low']),
            responsive_behavior: z.string().min(1),
            data_sources: z.array(z.string()),
            fallback_strategy: z.string().min(1)
          })).min(1),
          interactive_elements: z.array(z.object({
            element_type: z.enum(['button', 'link', 'embedded', 'card', 'modal']),
            purpose: z.string().min(1),
            target_url: z.string().url().optional(),
            accessibility_status: z.enum(['accessible', 'restricted', 'failed']),
            display_text: z.string().min(1),
            visual_style: z.string().min(1)
          }))
        }),
        restricted_content_handling: z.object({
          inaccessible_links: z.array(z.object({
            url: z.string().url(),
            restriction_type: z.enum(['login_required', 'cors_blocked', 'private', 'rate_limited', 'network_error']),
            platform: z.string().min(1),
            suggested_display: z.string().min(1),
            fallback_content: z.string().min(1),
            user_action_required: z.string().min(1)
          })),
          placeholder_strategies: z.array(z.object({
            content_type: z.string().min(1),
            placeholder_design: z.string().min(1),
            call_to_action: z.string().min(1)
          }))
        }),
        // 确保包含实现指导
        implementation_guide: z.object({
          development_priority: z.enum(['high', 'medium', 'low']),
          component_suggestions: z.array(z.string()).min(1),
          data_structure_requirements: z.string().min(1),
          api_integration_needs: z.string().min(1)
        })
      }).strict(); // 严格模式，不允许额外字段

      const aiAnalysis = await this.callLLM(prompt, {
        schema: analysisSchema,
        maxTokens: 32000,
        system: "你是内容展示策略专家，严格按照JSON schema格式分析信息源并制定最佳展示策略。必须输出完整的JSON对象，不能省略任何必需字段。"
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
   * 基于内容展示策略生成设计方案
   */
  private async generateDesignWithDisplayStrategy(
    userGoal: string,
    userType: string,
    collectedData: any,
    contentDisplayAnalysis: any,
    sessionData: SessionData,
    personalization?: PersonalizationProfile
  ): Promise<any> {
    try {
      console.log("🎨 基于展示策略生成设计方案...");

      // 整合所有阶段的完整数据
      const completeUserInfo = this.buildCompleteUserInfo(collectedData, sessionData);
      const correctedUserGoal = this.extractCorrectUserGoal(sessionData);
      const correctedUserType = this.extractCorrectUserType(sessionData);
      
      const prompt = formatPrompt(DESIGN_AGENT_PROMPT, {
        collected_user_info: JSON.stringify(completeUserInfo, null, 2),
        user_goal: correctedUserGoal,
        user_type: correctedUserType,
        tool_results: JSON.stringify(contentDisplayAnalysis.rule_engine_analyses || [], null, 2),
        content_display_analysis: JSON.stringify(contentDisplayAnalysis, null, 2),
        content_quality_assessment: JSON.stringify({
          overall_score: contentDisplayAnalysis.ai_analysis?.content_analysis?.content_quality_score || 7,
          completeness_level: contentDisplayAnalysis.ai_analysis?.content_analysis?.completeness_level || 'medium',
          data_richness: this.calculateDataRichness(collectedData, sessionData),
          source_diversity: contentDisplayAnalysis.ai_analysis?.content_analysis?.total_sources || 0
        }, null, 2)
      });

      // 使用完整的设计策略 Schema
      const designSchema = z.object({
        identity_analysis: z.object({
          core_identity: z.string(),
          unique_strengths: z.array(z.string()),
          target_audience: z.string(),
          value_proposition: z.string(),
          personality_traits: z.array(z.string()),
          professional_stage: z.string()
        }),
        data_insights: z.object({
          strongest_areas: z.array(z.string()),
          hidden_gems: z.array(z.string()),
          story_narrative: z.string(),
          differentiation: z.string(),
          completeness_score: z.string(),
          recommendation_focus: z.string()
        }),
        design_strategy: z.object({
          layout_concept: z.object({
            name: z.string(),
            description: z.string(),
            structure: z.array(z.string()),
            flow: z.string(),
            grid_system: z.string(),
            spacing_system: z.string(),
            breakpoints: z.object({
              mobile: z.string(),
              tablet: z.string(),
              desktop: z.string()
            })
          }),
          visual_direction: z.object({
            style_name: z.string(),
            color_psychology: z.string(),
            typography_choice: z.string(),
            mood: z.string()
          }),
          interaction_design: z.object({
            key_interactions: z.array(z.string()),
            animation_purpose: z.string(),
            user_journey: z.string()
          })
        }),
        detailed_design_specifications: z.object({
          color_system: z.any(),
          typography_system: z.any(),
          component_specifications: z.any(),
          animation_specifications: z.any(),
          spacing_and_layout: z.any(),
          iconography: z.any()
        }),
        technical_recommendations: z.object({
          framework: z.string(),
          key_libraries: z.array(z.string()),
          performance_priorities: z.array(z.string()),
          accessibility_considerations: z.array(z.string()),
          responsive_strategy: z.string(),
          css_architecture: z.string(),
          animation_libraries: z.string(),
          icon_libraries: z.string()
        }),
        content_display_integration: z.object({
          display_methods: z.array(z.object({
            content_type: z.string(),
            display_method: z.string(),
            priority: z.string(),
            responsive_behavior: z.string(),
            fallback_strategy: z.string(),
            implementation_notes: z.string()
          })),
          restricted_content_handling: z.array(z.object({
            platform: z.string(),
            restriction_reason: z.string(),
            placeholder_design: z.string(),
            user_guidance: z.string(),
            alternative_approach: z.string()
          })),
          responsive_optimization: z.object({
            desktop_strategy: z.string(),
            tablet_strategy: z.string(),
            mobile_strategy: z.string(),
            breakpoint_considerations: z.string()
          }),
          performance_considerations: z.object({
            loading_strategy: z.string(),
            lazy_loading_targets: z.array(z.string()),
            critical_content: z.array(z.string()),
            optimization_recommendations: z.array(z.string())
          })
        }),
        reasoning: z.string(),
        alternatives: z.array(z.string()),
        implementation_tips: z.array(z.string())
      });

      const result = await this.callLLM(prompt, {
        schema: designSchema,
        maxTokens: 64000,
        system: "你是专业的页面设计策略专家，严格按照JSON schema格式基于内容展示策略分析生成详细的个性化设计方案。必须输出完整的JSON对象，包含所有必需字段和详细的设计规范。"
      });

      if ('object' in result) {
        console.log("✅ 基于展示策略的设计方案生成成功");
        return result.object;
      } else {
        throw new Error('设计方案生成失败');
      }

    } catch (error) {
      console.error("❌ 设计方案生成失败，使用回退策略:", error);
      
      // 回退到基础设计策略
      return this.generateFallbackDesignStrategy(userGoal, userType, collectedData, contentDisplayAnalysis);
    }
  }

  /**
   * 生成增强的设计策略（保留原方法作为备用）
   */
  private async generateEnhancedDesignStrategy(
    userGoal: string,
    userType: string,
    collectedData: any,
    contentDisplayAnalysis: any,
    sessionData: SessionData,
    personalization?: PersonalizationProfile
  ): Promise<DesignStrategy & { contentIntegration: any }> {
    try {
      console.log("🎨 生成增强设计策略...");

      // 整合所有阶段的完整数据（备用方法也使用相同逻辑）
      const completeUserInfo = this.buildCompleteUserInfo(collectedData, sessionData);
      const correctedUserGoal = this.extractCorrectUserGoal(sessionData);
      const correctedUserType = this.extractCorrectUserType(sessionData);
      
      const prompt = formatPrompt(DESIGN_AGENT_PROMPT, {
        collected_user_info: JSON.stringify(completeUserInfo, null, 2),
        user_goal: correctedUserGoal,
        user_type: correctedUserType,
        tool_results: JSON.stringify(contentDisplayAnalysis.rule_engine_analyses || [], null, 2),
        content_display_analysis: JSON.stringify(contentDisplayAnalysis, null, 2),
        content_quality_assessment: JSON.stringify({
          overall_score: contentDisplayAnalysis.ai_analysis?.content_analysis?.content_quality_score || 7,
          completeness_level: contentDisplayAnalysis.ai_analysis?.content_analysis?.completeness_level || 'medium',
          data_richness: this.calculateDataRichness(collectedData, sessionData),
          source_diversity: contentDisplayAnalysis.ai_analysis?.content_analysis?.total_sources || 0
        }, null, 2)
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

  /**
   * 生成回退设计策略
   */
  private generateFallbackDesignStrategy(
    userGoal: string,
    userType: string,
    collectedData: any,
    contentDisplayAnalysis: any
  ): any {
    return {
      identity_analysis: {
        core_identity: userType || '专业人士',
        unique_strengths: ['技术能力', '学习能力', '创新思维'],
        target_audience: '潜在雇主和合作伙伴',
        value_proposition: '专业可靠的技术专家',
        personality_traits: ['专业', '可靠', '创新'],
        professional_stage: '发展中'
      },
      design_strategy: {
        layout_concept: {
          name: '现代专业布局',
          description: '简洁现代的专业展示布局',
          structure: ['头部', '简介', '项目展示', '技能', '联系方式'],
          flow: '从上到下的线性流程',
          grid_system: '12列网格系统',
          spacing_system: '8px基础单位',
          breakpoints: {
            mobile: '320px-768px',
            tablet: '768px-1024px',
            desktop: '1024px+'
          }
        },
        visual_direction: {
          style_name: '现代简约',
          color_psychology: '专业可信的蓝色系',
          typography_choice: '清晰易读的无衬线字体',
          mood: '专业、现代、可信'
        },
        interaction_design: {
          key_interactions: ['悬停效果', '平滑滚动', '响应式导航'],
          animation_purpose: '增强用户体验和视觉反馈',
          user_journey: '浏览 → 了解 → 联系'
        }
      },
      content_display_integration: {
        display_methods: contentDisplayAnalysis.rule_engine_analyses?.map((analysis: any) => ({
          content_type: analysis.tool_name,
          display_method: 'card',
          priority: 'medium',
          responsive_behavior: 'stack_on_mobile',
          fallback_strategy: 'external_link',
          implementation_notes: '使用卡片组件展示'
        })) || [],
        restricted_content_handling: [],
        responsive_optimization: {
          desktop_strategy: '多列布局，丰富交互',
          tablet_strategy: '双列布局，适中交互',
          mobile_strategy: '单列布局，简化交互',
          breakpoint_considerations: '内容优先级和可访问性'
        },
        performance_considerations: {
          loading_strategy: '渐进式加载',
          lazy_loading_targets: ['图片', '嵌入内容'],
          critical_content: ['基本信息', '核心技能'],
          optimization_recommendations: ['图片压缩', '代码分割', '缓存策略']
        }
      },
      reasoning: '基于基础信息生成的回退设计策略',
      alternatives: ['极简风格', '创意风格', '商务风格'],
      implementation_tips: ['使用现代CSS框架', '确保响应式设计', '优化加载性能']
    };
  }

  /**
   * 格式化设计策略消息
   */
  private formatDesignStrategyMessage(designStrategy: any, contentDisplayAnalysis: any): string {
    const totalSources = contentDisplayAnalysis.ai_analysis?.content_analysis?.total_sources || 
                        contentDisplayAnalysis.rule_engine_analyses?.length || 0;
    
    return `🎨 **个性化页面设计方案已生成**

**身份定位**: ${designStrategy.identity_analysis?.core_identity || '专业人士'}
**设计风格**: ${designStrategy.design_strategy?.visual_direction?.style_name || '现代简约'}
**布局概念**: ${designStrategy.design_strategy?.layout_concept?.name || '专业布局'}

**核心优势**:
${designStrategy.identity_analysis?.unique_strengths?.map((strength: string) => `• ${strength}`).join('\n') || '• 专业能力突出'}

**设计策略**:
• **色彩心理**: ${designStrategy.design_strategy?.visual_direction?.color_psychology || '专业可信'}
• **字体选择**: ${designStrategy.design_strategy?.visual_direction?.typography_choice || '清晰易读'}
• **交互设计**: ${designStrategy.design_strategy?.interaction_design?.animation_purpose || '增强用户体验'}

**内容展示优化**:
• 共处理 ${totalSources} 个信息源
• ${designStrategy.content_display_integration?.display_methods?.length || 0} 种展示方式
• 完整的响应式适配策略

**技术建议**:
• **框架**: ${designStrategy.technical_recommendations?.framework || 'Next.js'}
• **CSS架构**: ${designStrategy.technical_recommendations?.css_architecture || 'Tailwind CSS'}
• **性能优先级**: ${designStrategy.technical_recommendations?.performance_priorities?.join(', ') || '加载速度, 响应式'}

正在生成详细的开发实现指令...`;
  }

  /**
   * 生成综合开发提示
   */
  private generateComprehensiveDevelopmentPrompt(
    designStrategy: any,
    contentDisplayAnalysis: any,
    userGoal: string,
    userType: string,
    collectedData: any
  ): string {
    return `# 个性化页面开发实现指令

## 🎯 项目概述
- **用户目标**: ${userGoal}
- **用户类型**: ${userType}
- **设计风格**: ${designStrategy.design_strategy?.visual_direction?.style_name || '现代简约'}
- **核心身份**: ${designStrategy.identity_analysis?.core_identity || '专业人士'}

## 📊 内容展示策略实现

### 信息源处理 (${contentDisplayAnalysis.ai_analysis?.content_analysis?.total_sources || 0} 个)
${designStrategy.content_display_integration?.display_methods?.map((method: any) => 
  `- **${method.content_type}**: ${method.display_method}展示，${method.responsive_behavior}`
).join('\n') || '- 基于内容类型优化展示'}

### 响应式策略
- **桌面端**: ${designStrategy.content_display_integration?.responsive_optimization?.desktop_strategy || '多列布局'}
- **平板端**: ${designStrategy.content_display_integration?.responsive_optimization?.tablet_strategy || '双列布局'}
- **移动端**: ${designStrategy.content_display_integration?.responsive_optimization?.mobile_strategy || '单列布局'}

## 🎨 设计系统实现

### 布局系统
- **网格**: ${designStrategy.design_strategy?.layout_concept?.grid_system || '12列网格'}
- **间距**: ${designStrategy.design_strategy?.layout_concept?.spacing_system || '8px基础单位'}
- **断点**: ${JSON.stringify(designStrategy.design_strategy?.layout_concept?.breakpoints || {})}

### 视觉设计
- **主题**: ${designStrategy.design_strategy?.visual_direction?.mood || '专业现代'}
- **色彩**: ${designStrategy.design_strategy?.visual_direction?.color_psychology || '专业可信'}
- **字体**: ${designStrategy.design_strategy?.visual_direction?.typography_choice || '清晰易读'}

## 🔧 技术实现要求

### 核心技术栈
- **框架**: ${designStrategy.technical_recommendations?.framework || 'Next.js'}
- **样式**: ${designStrategy.technical_recommendations?.css_architecture || 'Tailwind CSS'}
- **动画**: ${designStrategy.technical_recommendations?.animation_libraries || 'Framer Motion'}
- **图标**: ${designStrategy.technical_recommendations?.icon_libraries || 'Lucide React'}

### 性能优化
${designStrategy.content_display_integration?.performance_considerations?.optimization_recommendations?.map((rec: string) => `- ${rec}`).join('\n') || '- 图片优化\n- 代码分割\n- 缓存策略'}

### 关键功能
${designStrategy.design_strategy?.interaction_design?.key_interactions?.map((interaction: string) => `- ${interaction}`).join('\n') || '- 响应式导航\n- 平滑滚动\n- 悬停效果'}

## 📋 实现优先级
1. **高优先级**: ${designStrategy.content_display_integration?.performance_considerations?.critical_content?.join(', ') || '基本信息, 核心技能'}
2. **中优先级**: 项目展示, 工作经历
3. **低优先级**: 装饰元素, 高级交互

## 🎯 用户体验目标
${designStrategy.design_strategy?.interaction_design?.user_journey || '浏览 → 了解 → 联系'}

## 💡 实现建议
${designStrategy.implementation_tips?.map((tip: string) => `- ${tip}`).join('\n') || '- 确保响应式设计\n- 优化加载性能\n- 注重可访问性'}

---

**设计理念**: ${designStrategy.reasoning || '基于用户特点和内容分析的个性化设计'}
`;
  }

  /**
   * 更新会话数据
   */
  private updateSessionWithDesignResults(
    sessionData: SessionData,
    designStrategy: any,
    contentDisplayAnalysis: any,
    developmentPrompt: string
  ): void {
    const metadata = sessionData.metadata as any;
    metadata.designStrategy = designStrategy;
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
      strategy: designStrategy,
      contentDisplayAnalysis,
      developmentPrompt,
      generatedAt: new Date().toISOString()
    };

    console.log("✅ 会话数据已更新，设计策略和展示分析已保存");
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

  // ==================== 数据整合辅助方法 ====================

  /**
   * 构建完整的用户信息，整合所有阶段的数据
   */
  private buildCompleteUserInfo(collectedData: any, sessionData: SessionData): any {
    const metadata = sessionData.metadata as any;
    
    return {
      // Welcome 阶段的核心分析
      welcome_analysis: {
        user_role: metadata.collectedInfo?.user_role || '专业人士',
        use_case: metadata.collectedInfo?.use_case || '个人展示',
        style_preference: metadata.collectedInfo?.style || '现代简约',
        highlight_focus: metadata.collectedInfo?.highlight_focus || '综合展示',
        commitment_level: metadata.collectedInfo?.commitment_level || '认真制作',
        target_audience: metadata.collectedInfo?.target_audience || '潜在雇主和合作伙伴'
      },
      
      // 信息收集阶段的详细数据
      personal_info: collectedData?.personal || {},
      professional_info: collectedData?.professional || {},
      experience: collectedData?.experience || [],
      education: collectedData?.education || [],
      projects: collectedData?.projects || [],
      achievements: collectedData?.achievements || [],
      
      // 收集过程的元数据
      collection_metadata: {
        total_tool_calls: metadata.totalToolCalls || 0,
        data_sources: metadata.toolResults?.map((r: any) => r.tool_name) || [],
        collection_timestamp: metadata.lastToolExecution,
        collection_confidence: metadata.collectionConfidence || 0.8,
        data_completeness: this.assessDataCompleteness(collectedData, metadata.collectedInfo)
      },
      
      // 用户意图分析
      user_intent_analysis: metadata.userIntentAnalysis || {
        commitment_level: metadata.collectedInfo?.commitment_level || '认真制作',
        reasoning: '基于用户交互分析'
      }
    };
  }

  /**
   * 提取正确的用户目标
   */
  private extractCorrectUserGoal(sessionData: SessionData): string {
    const metadata = sessionData.metadata as any;
    return metadata.collectedInfo?.use_case || '创建个人主页';
  }

  /**
   * 提取正确的用户类型
   */
  private extractCorrectUserType(sessionData: SessionData): string {
    const metadata = sessionData.metadata as any;
    return metadata.collectedInfo?.user_role || '专业人士';
  }

  /**
   * 计算数据丰富度
   */
  private calculateDataRichness(collectedData: any, sessionData: SessionData): number {
    let richness = 0;
    const metadata = sessionData.metadata as any;
    
    // Welcome 阶段数据完整性 (30%)
    const welcomeFields = ['user_role', 'use_case', 'style', 'highlight_focus'];
    const welcomeCompleteness = welcomeFields.filter(field => 
      metadata.collectedInfo?.[field] && metadata.collectedInfo[field] !== ''
    ).length / welcomeFields.length;
    richness += welcomeCompleteness * 0.3;
    
    // 个人信息完整性 (20%)
    const personalFields = ['fullName', 'email', 'phone', 'location'];
    const personalCompleteness = personalFields.filter(field => 
      collectedData?.personal?.[field]
    ).length / personalFields.length;
    richness += personalCompleteness * 0.2;
    
    // 专业信息完整性 (25%)
    const professionalCompleteness = (
      (collectedData?.professional?.currentTitle ? 0.25 : 0) +
      (collectedData?.professional?.summary ? 0.25 : 0) +
      (collectedData?.professional?.skills?.length > 0 ? 0.25 : 0) +
      (collectedData?.professional?.yearsExperience ? 0.25 : 0)
    );
    richness += professionalCompleteness * 0.25;
    
    // 经历和项目完整性 (25%)
    const experienceCompleteness = (
      (collectedData?.experience?.length > 0 ? 0.4 : 0) +
      (collectedData?.education?.length > 0 ? 0.3 : 0) +
      (collectedData?.projects?.length > 0 ? 0.3 : 0)
    );
    richness += experienceCompleteness * 0.25;
    
    return Math.round(richness * 10) / 10; // 保留一位小数
  }

  /**
   * 评估数据完整性
   */
  private assessDataCompleteness(collectedData: any, welcomeInfo: any): string {
    const mockSessionData = { 
      metadata: { collectedInfo: welcomeInfo } 
    } as unknown as SessionData;
    const richness = this.calculateDataRichness(collectedData, mockSessionData);
    
    if (richness >= 0.8) return 'high';
    if (richness >= 0.5) return 'medium';
    return 'low';
  }
}
