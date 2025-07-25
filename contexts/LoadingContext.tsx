'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { UnifiedLoading } from '@/components/ui/unified-loading';

interface LoadingState {
  id: string;
  variant: 'thinking' | 'generating' | 'processing' | 'analyzing';
  text?: string;
  autoHide?: boolean;
  timeout?: number;
}

interface LoadingContextType {
  showLoading: (options: Omit<LoadingState, 'id'>) => string;
  hideLoading: (id: string) => void;
  hideAllLoading: () => void;
  isLoading: boolean;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [loadingStates, setLoadingStates] = useState<LoadingState[]>([]);

  const showLoading = useCallback((options: Omit<LoadingState, 'id'>) => {
    const id = `loading-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    setLoadingStates(prev => [...prev, { ...options, id }]);

    // 如果设置了自动隐藏
    if (options.autoHide) {
      const timeout = options.timeout || 3000;
      setTimeout(() => {
        hideLoading(id);
      }, timeout);
    }

    return id;
  }, []);

  const hideLoading = useCallback((id: string) => {
    setLoadingStates(prev => prev.filter(state => state.id !== id));
  }, []);

  const hideAllLoading = useCallback(() => {
    setLoadingStates([]);
  }, []);

  const isLoading = loadingStates.length > 0;

  return (
    <LoadingContext.Provider value={{
      showLoading,
      hideLoading,
      hideAllLoading,
      isLoading
    }}>
      {children}
      
      {/* 全局loading覆盖层 */}
      <AnimatePresence>
        {loadingStates.map((state) => (
          <div
            key={state.id}
            className="fixed top-4 right-4 z-50 pointer-events-none"
          >
            <UnifiedLoading
              variant={state.variant}
              text={state.text}
              size="md"
              onComplete={() => state.autoHide && hideLoading(state.id)}
            />
          </div>
        ))}
      </AnimatePresence>
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}

// 便捷的hooks
export function useThinkingLoader() {
  const { showLoading, hideLoading } = useLoading();
  
  return useCallback((text?: string, autoHide = false) => {
    return showLoading({
      variant: 'thinking',
      text: text || 'AI 正在思考中',
      autoHide
    });
  }, [showLoading]);
}

export function useGeneratingLoader() {
  const { showLoading, hideLoading } = useLoading();
  
  return useCallback((text?: string, autoHide = false) => {
    return showLoading({
      variant: 'generating',
      text: text || '正在生成内容',
      autoHide
    });
  }, [showLoading]);
}

export function useProcessingLoader() {
  const { showLoading, hideLoading } = useLoading();
  
  return useCallback((text?: string, autoHide = false) => {
    return showLoading({
      variant: 'processing',
      text: text || '正在处理请求',
      autoHide
    });
  }, [showLoading]);
} 