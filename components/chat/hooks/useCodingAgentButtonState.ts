'use client';

import { useMemo } from 'react';
import { 
  CodingAgentButtonState,
  CodingAgentAsk,
  CODING_AGENT_BUTTON_CONFIG 
} from '@/lib/agents/coding/types';

interface CodingAgentButtonStateHook extends CodingAgentButtonState {
  // 按钮状态判断
  shouldShowButtons: boolean;
  shouldShowPrimaryButton: boolean;
  shouldShowSecondaryButton: boolean;
  shouldShowCustomButtons: boolean;
  
  // 按钮配置生成
  getButtonConfig: (ask: CodingAgentAsk) => CodingAgentButtonState;
  
  // 按钮状态判断方法
  isPrimaryButtonEnabled: boolean;
  isSecondaryButtonEnabled: boolean;
  hasAnyEnabledButtons: boolean;
}

export function useCodingAgentButtonState(
  currentAsk: CodingAgentAsk | null,
  isStreaming: boolean = false,
  awaitingResponse: boolean = false,
  hasError: boolean = false
): CodingAgentButtonStateHook {
  
  // 🎯 基础按钮状态计算
  const baseButtonState = useMemo((): CodingAgentButtonState => {
    // 如果没有当前Ask，返回默认状态
    if (!currentAsk) {
      return {
        enableButtons: false,
        primaryButtonText: '',
        primaryButtonVariant: 'default',
        showSecondaryButton: false,
        primaryButtonDisabled: true
      };
    }

    // 从配置中获取按钮状态
    const config = CODING_AGENT_BUTTON_CONFIG[currentAsk];
    
    // 根据当前状态调整按钮可用性
    const shouldDisableButtons = isStreaming || awaitingResponse;
    
    return {
      ...config,
      primaryButtonDisabled: shouldDisableButtons || config.primaryButtonDisabled,
      secondaryButtonDisabled: shouldDisableButtons || config.secondaryButtonDisabled,
      enableButtons: config.enableButtons && !shouldDisableButtons
    };
  }, [currentAsk, isStreaming, awaitingResponse]);

  // 🎯 错误状态下的按钮调整
  const adjustedButtonState = useMemo((): CodingAgentButtonState => {
    if (!hasError) {
      return baseButtonState;
    }

    // 如果有错误，调整按钮状态
    return {
      ...baseButtonState,
      primaryButtonText: '重试',
      primaryButtonVariant: 'default',
      showSecondaryButton: true,
      secondaryButtonText: '取消',
      secondaryButtonVariant: 'outline',
      enableButtons: true,
      primaryButtonDisabled: isStreaming,
      secondaryButtonDisabled: isStreaming
    };
  }, [baseButtonState, hasError, isStreaming]);

  // 🎯 派生状态
  const derivedState = useMemo(() => {
    const shouldShowButtons = adjustedButtonState.enableButtons;
    const shouldShowPrimaryButton = shouldShowButtons && adjustedButtonState.primaryButtonText.length > 0;
    const shouldShowSecondaryButton = shouldShowButtons && adjustedButtonState.showSecondaryButton;
    const shouldShowCustomButtons = shouldShowButtons && (adjustedButtonState.customButtons?.length || 0) > 0;
    
    const isPrimaryButtonEnabled = shouldShowPrimaryButton && !adjustedButtonState.primaryButtonDisabled;
    const isSecondaryButtonEnabled = shouldShowSecondaryButton && !adjustedButtonState.secondaryButtonDisabled;
    const hasAnyEnabledButtons = isPrimaryButtonEnabled || isSecondaryButtonEnabled;

    return {
      shouldShowButtons,
      shouldShowPrimaryButton,
      shouldShowSecondaryButton,
      shouldShowCustomButtons,
      isPrimaryButtonEnabled,
      isSecondaryButtonEnabled,
      hasAnyEnabledButtons
    };
  }, [adjustedButtonState]);

  // 🎯 按钮配置生成器
  const getButtonConfig = useMemo(() => {
    return (ask: CodingAgentAsk): CodingAgentButtonState => {
      const config = CODING_AGENT_BUTTON_CONFIG[ask];
      return {
        ...config,
        primaryButtonDisabled: isStreaming || awaitingResponse,
        secondaryButtonDisabled: isStreaming || awaitingResponse,
        enableButtons: config.enableButtons && !isStreaming && !awaitingResponse
      };
    };
  }, [isStreaming, awaitingResponse]);

  return {
    ...adjustedButtonState,
    ...derivedState,
    getButtonConfig
  };
}

// 🎯 按钮状态辅助工具
export const ButtonStateUtils = {
  /**
   * 获取按钮变体的CSS类名
   */
  getButtonVariantClass: (variant: CodingAgentButtonState['primaryButtonVariant']): string => {
    const variantMap = {
      default: 'bg-primary text-primary-foreground hover:bg-primary/90',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      ghost: 'hover:bg-accent hover:text-accent-foreground',
      link: 'text-primary underline-offset-4 hover:underline'
    };
    return variantMap[variant] || variantMap.default;
  },

  /**
   * 检查按钮是否应该显示加载状态
   */
  shouldShowLoading: (isStreaming: boolean, awaitingResponse: boolean): boolean => {
    return isStreaming || awaitingResponse;
  },

  /**
   * 获取按钮的可访问性属性
   */
  getAccessibilityProps: (
    buttonType: 'primary' | 'secondary' | 'custom',
    disabled: boolean,
    text: string
  ) => ({
    'aria-label': text,
    'aria-disabled': disabled,
    'role': 'button',
    'tabIndex': disabled ? -1 : 0
  }),

  /**
   * 根据Ask类型生成按钮图标
   */
  getButtonIcon: (ask: CodingAgentAsk | null): string | null => {
    if (!ask) return null;
    
    const iconMap: Record<CodingAgentAsk, string> = {
      'code_review': '👀',
      'file_operation': '📁',
      'deploy_confirmation': '🚀',
      'error_handling': '🔧',
      'tool_selection': '⚙️',
      'architecture_decision': '🏗️',
      'code_modification': '✏️',
      'test_execution': '🧪',
      'dependency_installation': '📦',
      'project_structure': '🗂️',
      'completion_confirmation': '✅',
      'retry_failed_operation': '🔄',
      'select_alternative': '🔀',
      'provide_additional_context': '💭',
      'approve_changes': '✅'
    };
    
    return iconMap[ask] || null;
  }
}; 