/**
 * 会话标题生成 Hooks
 * 
 * 功能：
 * - 自动/手动生成会话标题
 * - 管理标题生成状态
 * - 集成到聊天系统
 */

import { useState, useCallback, useRef } from 'react';
import { TitleGenerationRequest, TitleGenerationResponse, TitleGenerationConfig } from '@/types/chat';

interface UseTitleGenerationOptions {
  autoGenerate?: boolean;
  messageThreshold?: number;
  onTitleGenerated?: (conversationId: string, title: string) => void;
  onError?: (error: string) => void;
}

interface TitleGenerationState {
  isGenerating: boolean;
  error: string | null;
  lastGenerated: { [conversationId: string]: string };
}

export function useTitleGeneration(options: UseTitleGenerationOptions = {}) {
  const {
    autoGenerate = true,
    messageThreshold = 3,
    onTitleGenerated,
    onError
  } = options;

  const [state, setState] = useState<TitleGenerationState>({
    isGenerating: false,
    error: null,
    lastGenerated: {}
  });

  const generationInProgress = useRef<Set<string>>(new Set());

  // 生成标题
  const generateTitle = useCallback(async (
    conversationId: string,
    messageCount?: number,
    model: string = "claude-sonnet-4-20250514"
  ): Promise<string | null> => {
    // 防止重复生成
    if (generationInProgress.current.has(conversationId)) {
      console.log(`⏸️ [标题生成] 会话 ${conversationId} 正在生成中，跳过`);
      return null;
    }

    generationInProgress.current.add(conversationId);

    setState(prev => ({
      ...prev,
      isGenerating: true,
      error: null
    }));

    try {
      console.log(`🎯 [标题生成] 开始为会话 ${conversationId} 生成标题`);

      const request: TitleGenerationRequest = {
        conversationId,
        messageCount
      };

      const response = await fetch('/api/conversations/gen-title', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...request,
          model,
          maxLength: 20
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '标题生成失败');
      }

      const result: TitleGenerationResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || '标题生成失败');
      }

      const { title } = result;

      setState(prev => ({
        ...prev,
        isGenerating: false,
        lastGenerated: {
          ...prev.lastGenerated,
          [conversationId]: title
        }
      }));

      console.log(`✅ [标题生成] 会话 ${conversationId} 标题生成成功: "${title}"`);

      // 触发回调
      onTitleGenerated?.(conversationId, title);

      return title;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '标题生成失败';
      
      console.error(`❌ [标题生成] 会话 ${conversationId} 标题生成失败:`, errorMessage);

      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: errorMessage
      }));

      onError?.(errorMessage);
      return null;

    } finally {
      generationInProgress.current.delete(conversationId);
    }
  }, [onTitleGenerated, onError]);

  // 检查是否应该自动生成标题
  const shouldAutoGenerate = useCallback((
    conversationId: string,
    messageCount: number,
    hasExistingTitle: boolean
  ): boolean => {
    if (!autoGenerate) return false;
    if (hasExistingTitle) return false;
    if (messageCount < messageThreshold) return false;
    if (generationInProgress.current.has(conversationId)) return false;

    return true;
  }, [autoGenerate, messageThreshold]);

  // 自动生成标题（在消息发送后调用）
  const maybeGenerateTitle = useCallback(async (
    conversationId: string,
    messageCount: number,
    hasExistingTitle: boolean = false
  ) => {
    if (shouldAutoGenerate(conversationId, messageCount, hasExistingTitle)) {
      console.log(`🔄 [自动标题生成] 触发条件满足，为会话 ${conversationId} 生成标题`);
      await generateTitle(conversationId, messageCount);
    }
  }, [shouldAutoGenerate, generateTitle]);

  // 手动重新生成标题
  const regenerateTitle = useCallback(async (conversationId: string) => {
    console.log(`🔄 [手动标题生成] 重新生成会话 ${conversationId} 的标题`);
    return await generateTitle(conversationId);
  }, [generateTitle]);

  // 清除错误状态
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // 获取标题生成配置
  const getConfig = useCallback(async (): Promise<TitleGenerationConfig | null> => {
    try {
      const response = await fetch('/api/conversations/gen-title', {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error('获取配置失败');
      }

      const result = await response.json();
      return result.config;

    } catch (error) {
      console.error('获取标题生成配置失败:', error);
      return null;
    }
  }, []);

  return {
    // 状态
    isGenerating: state.isGenerating,
    error: state.error,
    lastGenerated: state.lastGenerated,

    // 方法
    generateTitle,
    maybeGenerateTitle,
    regenerateTitle,
    clearError,
    getConfig,
    shouldAutoGenerate,
  };
}

// 简化版本的hook，专门用于单个会话
export function useConversationTitle(conversationId: string) {
  const [title, setTitle] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const titleGeneration = useTitleGeneration({
    onTitleGenerated: (id, generatedTitle) => {
      if (id === conversationId) {
        setTitle(generatedTitle);
      }
    }
  });

  const generateTitle = useCallback(async () => {
    setIsGenerating(true);
    try {
      const result = await titleGeneration.generateTitle(conversationId);
      if (result) {
        setTitle(result);
      }
    } finally {
      setIsGenerating(false);
    }
  }, [conversationId, titleGeneration]);

  return {
    title,
    isGenerating: isGenerating || titleGeneration.isGenerating,
    error: titleGeneration.error,
    generateTitle,
    setTitle,
  };
} 