/**
 * 内容展示规则引擎
 * 负责分析内容并制定展示策略
 */

import { ToolResultData } from '@/components/content-manager/tool-results/ToolResultCard';

export interface ContentDisplayRule {
  id: string;
  name: string;
  description: string;
  condition: (data: ToolResultData) => boolean;
  strategy: DisplayStrategy;
  priority: number;
}

export interface DisplayStrategy {
  primary_display: DisplayMethod;
  fallback_displays: DisplayMethod[];
  interaction_type: 'click' | 'hover' | 'embed' | 'modal' | 'redirect';
  responsive_behavior: ResponsiveBehavior;
  accessibility_features: AccessibilityFeature[];
}

export interface DisplayMethod {
  type: 'direct_text' | 'button_link' | 'embedded' | 'visualization' | 'timeline' | 'placeholder' | 'card' | 'gallery';
  component: string;
  props: Record<string, any>;
  styling: {
    theme: 'minimal' | 'professional' | 'creative' | 'technical';
    size: 'small' | 'medium' | 'large' | 'full';
    emphasis: 'primary' | 'secondary' | 'subtle';
  };
}

export interface ResponsiveBehavior {
  desktop: DisplayMethod;
  tablet: DisplayMethod;
  mobile: DisplayMethod;
  breakpoints: {
    tablet: number;
    mobile: number;
  };
}

export interface AccessibilityFeature {
  type: 'alt_text' | 'aria_label' | 'keyboard_nav' | 'screen_reader' | 'high_contrast';
  implementation: string;
}

export class ContentDisplayEngine {
  private rules: ContentDisplayRule[] = [];

  constructor() {
    this.initializeDefaultRules();
  }

  /**
   * 初始化默认展示规则
   */
  private initializeDefaultRules() {
    this.rules = [
      // GitHub 仓库展示规则
      {
        id: 'github_repository',
        name: 'GitHub仓库展示',
        description: '展示GitHub仓库信息，支持嵌入和链接',
        condition: (data) => data.tool_name === 'analyze_github' && Boolean(data.extracted_data.github?.top_repos),
        strategy: {
          primary_display: {
            type: 'card',
            component: 'GitHubRepoCard',
            props: {
              showStars: true,
              showLanguage: true,
              maxRepos: 3
            },
            styling: {
              theme: 'technical',
              size: 'medium',
              emphasis: 'primary'
            }
          },
          fallback_displays: [
            {
              type: 'button_link',
              component: 'ExternalLinkButton',
              props: {
                text: '查看GitHub',
                icon: 'github'
              },
              styling: {
                theme: 'minimal',
                size: 'small',
                emphasis: 'secondary'
              }
            }
          ],
          interaction_type: 'click',
          responsive_behavior: {
            desktop: {
              type: 'card',
              component: 'GitHubRepoCard',
              props: { layout: 'grid' },
              styling: { theme: 'technical', size: 'large', emphasis: 'primary' }
            },
            tablet: {
              type: 'card',
              component: 'GitHubRepoCard',
              props: { layout: 'list' },
              styling: { theme: 'technical', size: 'medium', emphasis: 'primary' }
            },
            mobile: {
              type: 'button_link',
              component: 'ExternalLinkButton',
              props: { text: 'GitHub', compact: true },
              styling: { theme: 'minimal', size: 'small', emphasis: 'secondary' }
            },
            breakpoints: { tablet: 768, mobile: 480 }
          },
          accessibility_features: [
            {
              type: 'alt_text',
              implementation: 'GitHub repository: {repo_name} - {description}'
            },
            {
              type: 'keyboard_nav',
              implementation: 'Tab navigation support for repository cards'
            }
          ]
        },
        priority: 90
      },

      // 个人网站展示规则
      {
        id: 'personal_website',
        name: '个人网站展示',
        description: '个人网站和作品集的展示策略',
        condition: (data) => data.tool_name === 'scrape_webpage' && this.isPersonalWebsite(data),
        strategy: {
          primary_display: {
            type: 'embedded',
            component: 'WebsitePreview',
            props: {
              showPreview: true,
              allowFullscreen: true
            },
            styling: {
              theme: 'creative',
              size: 'large',
              emphasis: 'primary'
            }
          },
          fallback_displays: [
            {
              type: 'card',
              component: 'WebsiteCard',
              props: {
                showScreenshot: true,
                showDescription: true
              },
              styling: {
                theme: 'professional',
                size: 'medium',
                emphasis: 'primary'
              }
            }
          ],
          interaction_type: 'modal',
          responsive_behavior: {
            desktop: {
              type: 'embedded',
              component: 'WebsitePreview',
              props: { height: '400px' },
              styling: { theme: 'creative', size: 'large', emphasis: 'primary' }
            },
            tablet: {
              type: 'card',
              component: 'WebsiteCard',
              props: { compact: false },
              styling: { theme: 'professional', size: 'medium', emphasis: 'primary' }
            },
            mobile: {
              type: 'button_link',
              component: 'ExternalLinkButton',
              props: { text: '查看作品集' },
              styling: { theme: 'creative', size: 'medium', emphasis: 'primary' }
            },
            breakpoints: { tablet: 768, mobile: 480 }
          },
          accessibility_features: [
            {
              type: 'alt_text',
              implementation: 'Personal website preview: {website_title}'
            }
          ]
        },
        priority: 85
      },

      // LinkedIn 职业信息展示规则
      {
        id: 'linkedin_profile',
        name: 'LinkedIn职业信息',
        description: 'LinkedIn职业信息的结构化展示',
        condition: (data) => data.tool_name === 'extract_linkedin' && Boolean(data.extracted_data.linkedin),
        strategy: {
          primary_display: {
            type: 'timeline',
            component: 'ProfessionalTimeline',
            props: {
              showExperience: true,
              showEducation: true,
              maxItems: 5
            },
            styling: {
              theme: 'professional',
              size: 'large',
              emphasis: 'primary'
            }
          },
          fallback_displays: [
            {
              type: 'card',
              component: 'ProfileCard',
              props: {
                showSkills: true,
                showConnections: true
              },
              styling: {
                theme: 'professional',
                size: 'medium',
                emphasis: 'primary'
              }
            }
          ],
          interaction_type: 'hover',
          responsive_behavior: {
            desktop: {
              type: 'timeline',
              component: 'ProfessionalTimeline',
              props: { layout: 'horizontal' },
              styling: { theme: 'professional', size: 'large', emphasis: 'primary' }
            },
            tablet: {
              type: 'timeline',
              component: 'ProfessionalTimeline',
              props: { layout: 'vertical', compact: true },
              styling: { theme: 'professional', size: 'medium', emphasis: 'primary' }
            },
            mobile: {
              type: 'card',
              component: 'ProfileCard',
              props: { minimal: true },
              styling: { theme: 'professional', size: 'small', emphasis: 'primary' }
            },
            breakpoints: { tablet: 768, mobile: 480 }
          },
          accessibility_features: [
            {
              type: 'screen_reader',
              implementation: 'Professional timeline with {experience_count} positions'
            }
          ]
        },
        priority: 80
      },

      // 受限内容展示规则
      {
        id: 'restricted_content',
        name: '受限内容占位符',
        description: '无法访问内容的占位符展示',
        condition: (data) => this.isRestrictedContent(data),
        strategy: {
          primary_display: {
            type: 'placeholder',
            component: 'RestrictedContentPlaceholder',
            props: {
              suggestedAction: '点击访问原链接'
            },
            styling: {
              theme: 'minimal',
              size: 'medium',
              emphasis: 'subtle'
            }
          },
          fallback_displays: [
            {
              type: 'button_link',
              component: 'ExternalLinkButton',
              props: {
                text: '访问链接',
                external: true
              },
              styling: {
                theme: 'minimal',
                size: 'small',
                emphasis: 'secondary'
              }
            }
          ],
          interaction_type: 'redirect',
          responsive_behavior: {
            desktop: {
              type: 'placeholder',
              component: 'RestrictedContentPlaceholder',
              props: { showDetails: true },
              styling: { theme: 'minimal', size: 'medium', emphasis: 'subtle' }
            },
            tablet: {
              type: 'placeholder',
              component: 'RestrictedContentPlaceholder',
              props: { compact: true },
              styling: { theme: 'minimal', size: 'small', emphasis: 'subtle' }
            },
            mobile: {
              type: 'button_link',
              component: 'ExternalLinkButton',
              props: { text: '访问', icon: 'external-link' },
              styling: { theme: 'minimal', size: 'small', emphasis: 'secondary' }
            },
            breakpoints: { tablet: 768, mobile: 480 }
          },
          accessibility_features: [
            {
              type: 'aria_label',
              implementation: 'Restricted content from {platform_name}, click to visit'
            }
          ]
        },
        priority: 10
      }
    ];
  }

  /**
   * 分析内容并返回最佳展示策略
   */
  public analyzeContent(data: ToolResultData): DisplayStrategy | null {
    // 按优先级排序规则
    const sortedRules = this.rules.sort((a, b) => b.priority - a.priority);
    
    // 找到第一个匹配的规则
    for (const rule of sortedRules) {
      if (rule.condition(data)) {
        console.log(`📋 [展示引擎] 应用规则: ${rule.name} (优先级: ${rule.priority})`);
        return this.enhanceStrategy(rule.strategy, data);
      }
    }

    console.log(`⚠️ [展示引擎] 未找到匹配规则，使用默认策略`);
    return this.getDefaultStrategy(data);
  }

  /**
   * 批量分析多个内容
   */
  public analyzeMultipleContent(dataList: ToolResultData[]): Array<{
    data: ToolResultData;
    strategy: DisplayStrategy;
    confidence: number;
  }> {
    return dataList.map(data => ({
      data,
      strategy: this.analyzeContent(data) || this.getDefaultStrategy(data),
      confidence: this.calculateConfidence(data)
    }));
  }

  /**
   * 添加自定义规则
   */
  public addRule(rule: ContentDisplayRule): void {
    this.rules.push(rule);
    this.rules.sort((a, b) => b.priority - a.priority);
  }

  /**
   * 移除规则
   */
  public removeRule(ruleId: string): void {
    this.rules = this.rules.filter(rule => rule.id !== ruleId);
  }

  // 私有辅助方法
  private isPersonalWebsite(data: ToolResultData): boolean {
    const url = data.source_url.toLowerCase();
    const webpage = data.extracted_data.webpage;
    
    if (!webpage) return false;
    
    // 检查URL模式
    const personalPatterns = [
      /portfolio/i,
      /personal/i,
      /about/i,
      /resume/i,
      /cv/i
    ];
    
    const hasPersonalPattern = personalPatterns.some(pattern => pattern.test(url));
    
    // 检查内容特征
    const hasPersonalContent = Boolean(webpage.title?.includes('Portfolio')) ||
                              Boolean(webpage.description?.includes('portfolio')) ||
                              Boolean(webpage.metadata?.keywords?.some(k => k.includes('portfolio')));
    
    return hasPersonalPattern || hasPersonalContent;
  }

  private isRestrictedContent(data: ToolResultData): boolean {
    // 检查是否有访问限制
    return !data.extracted_data || 
           Object.keys(data.extracted_data).length === 0 ||
           data.cache_info.status === 'expired';
  }

  private extractPlatformName(url: string): string {
    try {
      const domain = new URL(url).hostname;
      const platformMap: Record<string, string> = {
        'github.com': 'GitHub',
        'linkedin.com': 'LinkedIn',
        'instagram.com': 'Instagram',
        'twitter.com': 'Twitter',
        'behance.net': 'Behance',
        'dribbble.com': 'Dribbble'
      };
      
      return platformMap[domain] || domain;
    } catch {
      return '未知平台';
    }
  }

  private enhanceStrategy(strategy: DisplayStrategy, data: ToolResultData): DisplayStrategy {
    // 基于数据质量和内容类型增强策略
    const qualityScore = data.content_analysis?.quality_indicators?.completeness || 0.5;
    
    // 为受限内容添加平台信息
    if (strategy.primary_display.type === 'placeholder') {
      strategy.primary_display.props = {
        ...strategy.primary_display.props,
        platformName: this.extractPlatformName(data.source_url)
      };
    }
    
    if (qualityScore < 0.3) {
      // 低质量数据，使用更简单的展示方式
      return {
        ...strategy,
        primary_display: strategy.fallback_displays[0] || strategy.primary_display
      };
    }
    
    return strategy;
  }

  private getDefaultStrategy(data: ToolResultData): DisplayStrategy {
    return {
      primary_display: {
        type: 'button_link',
        component: 'ExternalLinkButton',
        props: {
          text: '查看链接',
          url: data.source_url
        },
        styling: {
          theme: 'minimal',
          size: 'medium',
          emphasis: 'secondary'
        }
      },
      fallback_displays: [],
      interaction_type: 'redirect',
      responsive_behavior: {
        desktop: {
          type: 'button_link',
          component: 'ExternalLinkButton',
          props: { text: '查看链接' },
          styling: { theme: 'minimal', size: 'medium', emphasis: 'secondary' }
        },
        tablet: {
          type: 'button_link',
          component: 'ExternalLinkButton',
          props: { text: '查看链接' },
          styling: { theme: 'minimal', size: 'medium', emphasis: 'secondary' }
        },
        mobile: {
          type: 'button_link',
          component: 'ExternalLinkButton',
          props: { text: '链接' },
          styling: { theme: 'minimal', size: 'small', emphasis: 'secondary' }
        },
        breakpoints: { tablet: 768, mobile: 480 }
      },
      accessibility_features: [
        {
          type: 'aria_label',
                        implementation: 'External link to source URL'
        }
      ]
    };
  }

  private calculateConfidence(data: ToolResultData): number {
    let confidence = 0.5; // 基础置信度
    
    // 基于数据完整性调整
    if (data.extracted_data && Object.keys(data.extracted_data).length > 0) {
      confidence += 0.3;
    }
    
    // 基于内容分析质量调整
    if (data.content_analysis?.quality_indicators) {
      const avgQuality = (
        data.content_analysis.quality_indicators.completeness +
        data.content_analysis.quality_indicators.relevance +
        data.content_analysis.quality_indicators.freshness
      ) / 3;
      confidence += avgQuality * 0.2;
    }
    
    // 基于缓存状态调整
    if (data.cache_info.status === 'fresh') {
      confidence += 0.1;
    } else if (data.cache_info.status === 'expired') {
      confidence -= 0.2;
    }
    
    return Math.max(0, Math.min(1, confidence));
  }
}

// 单例实例
export const contentDisplayEngine = new ContentDisplayEngine();
