/**
 * 增强版 Prompt Output Agent 的类型定义
 */

import { ToolResultData } from '@/components/content-manager/tool-results/ToolResultCard';

/**
 * 传递给 Prompt Output Agent 的输入数据
 */
export interface EnhancedPromptOutputInput {
  // 基础信息
  collected_data: any;
  user_goal?: string;
  user_type?: string;
  
  // 工具解析结果
  tool_results?: ToolResultData[];
  
  // 展示策略分析结果
  display_strategies?: ContentDisplayStrategy[];
  
  // 内容分析结果
  content_analysis?: ContentAnalysisResult;
  
  // 用户偏好
  user_preferences?: {
    style?: string;
    priority?: 'speed' | 'quality' | 'features';
    responsive_requirements?: string[];
  };
}

/**
 * 内容展示策略
 */
export interface ContentDisplayStrategy {
  source: string;
  tool_name: string;
  strategy: {
    primary_display: DisplayMethod;
    fallback_displays: DisplayMethod[];
    interaction_type: 'click' | 'hover' | 'embed' | 'modal' | 'redirect';
    responsive_behavior: ResponsiveBehavior;
    accessibility_features: AccessibilityFeature[];
  };
  confidence: number;
  accessibility_status: {
    is_accessible: boolean;
    restriction_type?: string;
    fallback_strategy?: string;
  };
  embedding_capability: {
    can_embed: boolean;
    embed_type?: string;
    embed_url?: string;
    security_considerations?: string[];
  };
}

/**
 * 展示方法
 */
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

/**
 * 响应式行为
 */
export interface ResponsiveBehavior {
  desktop: DisplayMethod;
  tablet: DisplayMethod;
  mobile: DisplayMethod;
  breakpoints: {
    tablet: number;
    mobile: number;
  };
}

/**
 * 无障碍功能
 */
export interface AccessibilityFeature {
  type: 'alt_text' | 'aria_label' | 'keyboard_nav' | 'screen_reader' | 'high_contrast';
  implementation: string;
}

/**
 * 内容分析结果
 */
export interface ContentAnalysisResult {
  content_analysis: {
    total_sources: number;
    accessible_sources: number;
    restricted_sources: number;
    content_quality_score: number;
    completeness_level: 'low' | 'medium' | 'high';
  };
  display_strategy: {
    primary_sections: Array<{
      section_name: string;
      content_type: string;
      display_method: string;
      priority: 'high' | 'medium' | 'low';
      responsive_behavior: string;
      data_sources: string[];
      fallback_strategy: string;
    }>;
    interactive_elements: Array<{
      element_type: string;
      purpose: string;
      target_url?: string;
      accessibility_status: string;
      display_text: string;
      visual_style: string;
    }>;
  };
  restricted_content_handling: {
    inaccessible_links: Array<{
      url: string;
      restriction_type: string;
      platform: string;
      suggested_display: string;
      fallback_content: string;
      user_action_required: string;
    }>;
    placeholder_strategies: Array<{
      content_type: string;
      placeholder_design: string;
      call_to_action: string;
    }>;
  };
}

/**
 * 增强的设计策略（扩展原有的 DesignStrategy）
 */
export interface EnhancedDesignStrategy {
  // 原有字段
  layout: string;
  theme: string;
  sections: Array<{
    id: string;
    title: string;
    type: string;
    priority: 'high' | 'medium' | 'low';
    required: boolean;
    content?: any;
    // 新增字段
    content_sources?: string[];
    display_strategy?: string;
  }>;
  features: Record<string, boolean>;
  customizations: Record<string, string>;
  priority: 'speed' | 'quality' | 'features';
  audience: string;
  
  // 新增的内容集成策略
  contentIntegration: {
    displayMethods: Array<{
      content_type: string;
      method: string;
      responsive_behavior: string;
      fallback_plan: string;
    }>;
    restrictedContentHandling: Array<{
      platform: string;
      placeholder_design: string;
      user_guidance: string;
    }>;
    interactionPatterns: Array<{
      pattern: string;
      purpose: string;
      implementation: string;
    }>;
  };
}

/**
 * Agent 间的数据传递格式
 */
export interface AgentDataTransfer {
  // 来源 Agent 信息
  source_agent: string;
  timestamp: string;
  
  // 数据内容
  data: {
    // 信息收集阶段的数据
    collection_result?: {
      user_info: any;
      tool_results: ToolResultData[];
      collection_summary: string;
      confidence_level: number;
    };
    
    // 内容分析阶段的数据
    content_analysis?: ContentAnalysisResult;
    display_strategies?: ContentDisplayStrategy[];
    
    // 设计阶段的数据
    design_strategy?: EnhancedDesignStrategy;
    development_prompt?: string;
  };
  
  // 元数据
  metadata: {
    processing_stage: 'collection' | 'analysis' | 'design' | 'coding';
    quality_score: number;
    recommendations: string[];
    next_steps: string[];
  };
}
