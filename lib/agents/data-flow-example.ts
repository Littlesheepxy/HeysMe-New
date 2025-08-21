/**
 * Agent 间数据传递流程示例
 * 展示如何将信息收集、内容分析和展示策略传递给 prompt-output agent
 */

import { EnhancedPromptOutputAgent } from './prompt-output/enhanced-agent';
import { OptimizedInfoCollectionAgent } from './info-collection/optimized-agent';
import { contentDisplayEngine } from '@/lib/services/content-display-engine';
import { 
  EnhancedPromptOutputInput, 
  ContentDisplayStrategy, 
  ContentAnalysisResult,
  AgentDataTransfer 
} from './prompt-output/types';
import { ToolResultData } from '@/components/content-manager/tool-results/ToolResultCard';
import { SessionData } from '@/lib/types/session';

/**
 * 完整的 Agent 流程编排器
 */
export class AgentOrchestrator {
  private infoCollectionAgent: OptimizedInfoCollectionAgent;
  private promptOutputAgent: EnhancedPromptOutputAgent;

  constructor() {
    this.infoCollectionAgent = new OptimizedInfoCollectionAgent();
    this.promptOutputAgent = new EnhancedPromptOutputAgent();
  }

  /**
   * 完整的处理流程：信息收集 → 内容分析 → 设计策略 → 开发提示
   */
  async processUserRequest(
    userInput: string,
    sessionData: SessionData
  ): Promise<AgentDataTransfer> {
    try {
      console.log("🚀 开始完整的 Agent 处理流程...");

      // 阶段1: 信息收集
      console.log("📊 阶段1: 信息收集");
      const collectionResult = await this.runInfoCollection(userInput, sessionData);
      
      // 阶段2: 内容展示策略分析
      console.log("🔍 阶段2: 内容展示策略分析");
      const contentAnalysis = await this.runContentAnalysis(collectionResult.tool_results);
      
      // 阶段3: 设计策略生成
      console.log("🎨 阶段3: 设计策略生成");
      const designResult = await this.runDesignGeneration(
        collectionResult,
        contentAnalysis,
        sessionData
      );

      // 返回完整的数据传递结果
      return {
        source_agent: 'AgentOrchestrator',
        timestamp: new Date().toISOString(),
        data: {
          collection_result: collectionResult,
          content_analysis: contentAnalysis,
          design_strategy: designResult.designStrategy,
          development_prompt: designResult.developmentPrompt
        },
        metadata: {
          processing_stage: 'design',
          quality_score: this.calculateOverallQuality(collectionResult, contentAnalysis),
          recommendations: this.generateRecommendations(collectionResult, contentAnalysis),
          next_steps: ['开始代码生成', '用户确认设计方案', '进入开发阶段']
        }
      };

    } catch (error) {
      console.error("❌ Agent 流程处理失败:", error);
      throw error;
    }
  }

  /**
   * 阶段1: 运行信息收集
   */
  private async runInfoCollection(
    userInput: string, 
    sessionData: SessionData
  ): Promise<{
    user_info: any;
    tool_results: ToolResultData[];
    collection_summary: string;
    confidence_level: number;
  }> {
    console.log("🔧 执行信息收集...");

    // 模拟信息收集过程（实际应该调用真实的 agent）
    const mockToolResults: ToolResultData[] = [
      {
        id: 'github_analysis_1',
        tool_name: 'analyze_github',
        platform_type: 'code_repository',
        content_type: 'profile',
        source_url: 'https://github.com/username',
        extracted_data: {
          github: {
            username: 'username',
            name: 'John Doe',
            bio: 'Full-stack developer passionate about React and Node.js',
            followers: 150,
            following: 80,
            public_repos: 25,
            avatar_url: 'https://github.com/avatar.jpg',
            top_languages: ['JavaScript', 'TypeScript', 'Python'],
            top_repos: [
              {
                name: 'awesome-project',
                stars: 120,
                description: 'An awesome React project',
                language: 'JavaScript'
              },
              {
                name: 'node-api',
                stars: 85,
                description: 'RESTful API with Node.js',
                language: 'TypeScript'
              }
            ]
          }
        },
        content_analysis: {
          summary: 'Active GitHub developer with strong JavaScript/TypeScript skills',
          tags: ['developer', 'javascript', 'react', 'nodejs'],
          topics: ['web development', 'full-stack', 'open source'],
          technical_stack: ['React', 'Node.js', 'TypeScript'],
          quality_indicators: {
            completeness: 0.9,
            relevance: 0.95,
            freshness: 0.8
          }
        },
        cache_info: {
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          hit_count: 1,
          status: 'fresh',
          last_accessed: new Date().toISOString()
        },
        usage_stats: {
          used_in_pages: [],
          sync_count: 0,
          last_sync: new Date().toISOString()
        },
        tags: ['github', 'developer', 'javascript']
      },
      {
        id: 'website_analysis_1',
        tool_name: 'scrape_webpage',
        platform_type: 'webpage',
        content_type: 'portfolio',
        source_url: 'https://johndoe.dev',
        extracted_data: {
          webpage: {
            title: 'John Doe - Full Stack Developer',
            description: 'Personal portfolio showcasing web development projects',
            content_preview: 'Welcome to my portfolio. I am a passionate full-stack developer...',
            links_count: 15,
            images_count: 8,
            metadata: {
              author: 'John Doe',
              keywords: ['portfolio', 'developer', 'react', 'nodejs'],
              type: 'website',
              published_date: '2024-01-15'
            }
          }
        },
        content_analysis: {
          summary: 'Professional portfolio website with project showcases',
          tags: ['portfolio', 'professional', 'projects'],
          topics: ['web development', 'portfolio', 'personal branding'],
          quality_indicators: {
            completeness: 0.85,
            relevance: 0.9,
            freshness: 0.7
          }
        },
        cache_info: {
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          hit_count: 1,
          status: 'fresh',
          last_accessed: new Date().toISOString()
        },
        usage_stats: {
          used_in_pages: [],
          sync_count: 0,
          last_sync: new Date().toISOString()
        },
        tags: ['website', 'portfolio', 'professional']
      }
    ];

    return {
      user_info: {
        goal: 'create_portfolio',
        type: 'developer',
        style: 'professional',
        focus: 'technical_skills'
      },
      tool_results: mockToolResults,
      collection_summary: '成功收集了GitHub和个人网站信息，用户是一名全栈开发者',
      confidence_level: 0.9
    };
  }

  /**
   * 阶段2: 运行内容分析
   */
  private async runContentAnalysis(
    toolResults: ToolResultData[]
  ): Promise<ContentAnalysisResult> {
    console.log("🔍 执行内容展示策略分析...");

    // 使用展示规则引擎分析每个工具结果
    const displayStrategies: ContentDisplayStrategy[] = toolResults.map(toolResult => {
      const strategy = contentDisplayEngine.analyzeContent(toolResult);
      const confidence = this.calculateDisplayConfidence(toolResult);
      
      return {
        source: toolResult.source_url,
        tool_name: toolResult.tool_name,
        strategy: strategy || this.getDefaultStrategy(),
        confidence,
        accessibility_status: {
          is_accessible: true,
          restriction_type: undefined,
          fallback_strategy: 'external_link'
        },
        embedding_capability: {
          can_embed: toolResult.tool_name === 'scrape_webpage',
          embed_type: toolResult.tool_name === 'scrape_webpage' ? 'iframe' : undefined,
          embed_url: toolResult.tool_name === 'scrape_webpage' ? toolResult.source_url : undefined
        }
      };
    });

    // 生成综合分析结果
    const accessibleSources = displayStrategies.filter(s => s.accessibility_status.is_accessible).length;
    const restrictedSources = displayStrategies.length - accessibleSources;

    return {
      content_analysis: {
        total_sources: toolResults.length,
        accessible_sources: accessibleSources,
        restricted_sources: restrictedSources,
        content_quality_score: 8.5,
        completeness_level: 'high'
      },
      display_strategy: {
        primary_sections: [
          {
            section_name: 'Hero Section',
            content_type: 'profile',
            display_method: 'direct_text',
            priority: 'high',
            responsive_behavior: 'full_width_to_stacked',
            data_sources: ['github_profile', 'personal_info'],
            fallback_strategy: 'text_only'
          },
          {
            section_name: 'Projects Showcase',
            content_type: 'repositories',
            display_method: 'card_grid',
            priority: 'high',
            responsive_behavior: 'grid_to_list',
            data_sources: ['github_repos'],
            fallback_strategy: 'simple_list'
          },
          {
            section_name: 'Portfolio Preview',
            content_type: 'website',
            display_method: 'embedded_iframe',
            priority: 'medium',
            responsive_behavior: 'iframe_to_link',
            data_sources: ['personal_website'],
            fallback_strategy: 'screenshot_link'
          }
        ],
        interactive_elements: [
          {
            element_type: 'github_link',
            purpose: 'external_navigation',
            target_url: 'https://github.com/username',
            accessibility_status: 'accessible',
            display_text: 'View on GitHub',
            visual_style: 'primary_button'
          },
          {
            element_type: 'portfolio_link',
            purpose: 'external_navigation',
            target_url: 'https://johndoe.dev',
            accessibility_status: 'accessible',
            display_text: 'Visit Portfolio',
            visual_style: 'secondary_button'
          }
        ]
      },
      restricted_content_handling: {
        inaccessible_links: [],
        placeholder_strategies: []
      }
    };
  }

  /**
   * 阶段3: 运行设计生成
   */
  private async runDesignGeneration(
    collectionResult: any,
    contentAnalysis: ContentAnalysisResult,
    sessionData: SessionData
  ): Promise<{
    designStrategy: any;
    developmentPrompt: string;
  }> {
    console.log("🎨 执行设计策略生成...");

    // 准备传递给 prompt-output agent 的数据
    const input: EnhancedPromptOutputInput = {
      collected_data: collectionResult.user_info,
      tool_results: collectionResult.tool_results,
      content_analysis: contentAnalysis,
      user_goal: collectionResult.user_info.goal,
      user_type: collectionResult.user_info.type,
      user_preferences: {
        style: collectionResult.user_info.style,
        priority: 'quality',
        responsive_requirements: ['mobile-first', 'tablet-optimized']
      }
    };

    // 调用增强版 prompt-output agent
    let designStrategy: any = null;
    let developmentPrompt: string = '';

    const responseGenerator = this.promptOutputAgent.process(input, sessionData);
    
    for await (const response of responseGenerator) {
      if (response.system_state?.metadata?.designStrategy) {
        designStrategy = response.system_state.metadata.designStrategy;
      }
      if (response.system_state?.metadata?.developmentPrompt) {
        developmentPrompt = response.system_state.metadata.developmentPrompt;
      }
      
      // 输出进度信息
      if (response.immediate_display?.reply) {
        console.log(`📝 ${response.immediate_display.reply}`);
      }
    }

    return {
      designStrategy: designStrategy || this.getDefaultDesignStrategy(),
      developmentPrompt: developmentPrompt || this.getDefaultDevelopmentPrompt()
    };
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
    
    return Math.max(0, Math.min(1, confidence));
  }

  private getDefaultStrategy(): any {
    return {
      primary_display: {
        type: 'button_link',
        component: 'ExternalLinkButton',
        props: { text: '查看链接' },
        styling: { theme: 'minimal', size: 'medium', emphasis: 'secondary' }
      },
      fallback_displays: [],
      interaction_type: 'redirect',
      responsive_behavior: {
        desktop: { type: 'button_link', component: 'ExternalLinkButton', props: {}, styling: {} },
        tablet: { type: 'button_link', component: 'ExternalLinkButton', props: {}, styling: {} },
        mobile: { type: 'button_link', component: 'ExternalLinkButton', props: {}, styling: {} },
        breakpoints: { tablet: 768, mobile: 480 }
      },
      accessibility_features: []
    };
  }

  private calculateOverallQuality(collectionResult: any, contentAnalysis: ContentAnalysisResult): number {
    const collectionQuality = collectionResult.confidence_level;
    const analysisQuality = contentAnalysis.content_analysis.content_quality_score / 10;
    return (collectionQuality + analysisQuality) / 2;
  }

  private generateRecommendations(collectionResult: any, contentAnalysis: ContentAnalysisResult): string[] {
    const recommendations: string[] = [];
    
    if (contentAnalysis.content_analysis.content_quality_score < 7) {
      recommendations.push('建议补充更多个人信息以提升页面丰富度');
    }
    
    if (contentAnalysis.content_analysis.restricted_sources > 0) {
      recommendations.push('部分内容访问受限，已提供备选展示方案');
    }
    
    if (collectionResult.tool_results.length < 3) {
      recommendations.push('可以考虑添加更多信息源（如LinkedIn、作品集等）');
    }
    
    return recommendations;
  }

  private getDefaultDesignStrategy(): any {
    return {
      layout: 'portfolio_showcase',
      theme: 'tech_blue',
      sections: [
        { id: 'hero', title: '个人介绍', type: 'hero', priority: 'high', required: true },
        { id: 'projects', title: '项目展示', type: 'projects', priority: 'high', required: true },
        { id: 'contact', title: '联系方式', type: 'contact', priority: 'medium', required: true }
      ],
      features: { responsive: true, darkMode: true, animations: true },
      customizations: { colorScheme: 'blue', typography: 'modern' },
      priority: 'quality',
      audience: 'tech_recruiters',
      contentIntegration: {
        displayMethods: [],
        restrictedContentHandling: [],
        interactionPatterns: []
      }
    };
  }

  private getDefaultDevelopmentPrompt(): string {
    return `创建一个现代化的开发者作品集网站，包含个人介绍、项目展示和联系方式等核心功能。`;
  }
}

/**
 * 使用示例
 */
export async function runCompleteAgentFlow(userInput: string, sessionData: SessionData) {
  const orchestrator = new AgentOrchestrator();
  
  try {
    const result = await orchestrator.processUserRequest(userInput, sessionData);
    
    console.log("🎉 完整流程执行成功!");
    console.log("📊 数据传递结果:", {
      stage: result.metadata.processing_stage,
      quality: result.metadata.quality_score,
      recommendations: result.metadata.recommendations
    });
    
    return result;
  } catch (error) {
    console.error("❌ 流程执行失败:", error);
    throw error;
  }
}
