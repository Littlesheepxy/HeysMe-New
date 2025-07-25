'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface UnifiedLoadingProps {
  text?: string;
  className?: string;
  variant?: 'thinking' | 'generating' | 'processing' | 'analyzing';
  size?: 'sm' | 'md' | 'lg';
  autoHide?: boolean;
  onComplete?: () => void;
}

const variantConfig = {
  thinking: {
    text: 'AI 正在思考中',
    color: 'text-gray-600'
  },
  generating: {
    text: '正在生成内容',
    color: 'text-gray-600'
  },
  processing: {
    text: '正在处理请求',
    color: 'text-gray-600'
  },
  analyzing: {
    text: '正在分析数据',
    color: 'text-gray-600'
  }
};

const sizeConfig = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg'
};

export function UnifiedLoading({
  text,
  className = '',
  variant = 'thinking',
  size = 'md',
  autoHide = false,
  onComplete
}: UnifiedLoadingProps) {
  const config = variantConfig[variant];
  const sizeClass = sizeConfig[size];
  const displayText = text || config.text;

  React.useEffect(() => {
    if (autoHide && onComplete) {
      const timer = setTimeout(() => {
        onComplete();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [autoHide, onComplete]);

  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        'relative inline-block overflow-hidden',
        config.color,
        sizeClass,
        className
      )}
    >
      {displayText}
      
      {/* ChatGPT风格的白光扫描效果 - 优化版 */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0) 35%, rgba(255, 255, 255, 0.7) 50%, rgba(255, 255, 255, 0) 65%, transparent 100%)',
          width: '200%',
          height: '100%',
          left: '-100%',
          animation: 'white-shimmer 1.5s ease-in-out infinite'
        }}
      />
    </motion.span>
  );
}

// 预设的快捷组件
export function ThinkingLoader(props: Omit<UnifiedLoadingProps, 'variant'>) {
  return <UnifiedLoading {...props} variant="thinking" />;
}

export function GeneratingLoader(props: Omit<UnifiedLoadingProps, 'variant'>) {
  return <UnifiedLoading {...props} variant="generating" />;
}

export function ProcessingLoader(props: Omit<UnifiedLoadingProps, 'variant'>) {
  return <UnifiedLoading {...props} variant="processing" />;
}

export function AnalyzingLoader(props: Omit<UnifiedLoadingProps, 'variant'>) {
  return <UnifiedLoading {...props} variant="analyzing" />;
}

// 简单的文本loader，用于替换现有的LoadingText
export function SimpleTextLoader({ 
  text, 
  className = '' 
}: { 
  text: string; 
  className?: string; 
}) {
  return (
    <span className={cn('relative inline-block overflow-hidden text-gray-600', className)}>
      {text}
      {/* ChatGPT风格的白光扫描效果 - 优化版 */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0) 35%, rgba(255, 255, 255, 0.7) 50%, rgba(255, 255, 255, 0) 65%, transparent 100%)',
          width: '200%',
          height: '100%',
          left: '-100%',
          animation: 'white-shimmer 1.5s ease-in-out infinite'
        }}
      />
    </span>
  );
} 