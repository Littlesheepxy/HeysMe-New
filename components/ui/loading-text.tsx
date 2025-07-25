'use client';

import React from 'react'
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { SimpleTextLoader } from './unified-loading';

interface LoadingTextProps {
  text?: string
  variant?: 'default' | 'brand' | 'typing' | 'shimmer'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingText({ 
  text = "正在加载...", 
  variant = 'default',
  size = 'md',
  className = '' 
}: LoadingTextProps) {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base', 
    lg: 'text-lg'
  }

  const variants = {
    default: 'text-gray-500 animate-pulse',
    brand: 'text-brand-primary animate-brand-pulse',
    typing: 'text-emerald-600',
    shimmer: 'text-emerald-500 animate-brand-shimmer'
  }

  if (variant === 'typing') {
    return (
      <div className={`flex items-center gap-2 ${sizeClasses[size]} ${className}`}>
        <span className="text-emerald-600">{text}</span>
        <div className="flex space-x-1">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-brand-loading-dots"></div>
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-brand-loading-dots" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-brand-loading-dots" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    )
  }

  if (variant === 'shimmer') {
    return (
      <div className={`relative overflow-hidden ${sizeClasses[size]} ${className}`}>
        <span className="text-emerald-600">{text}</span>
        <div className="absolute inset-0 -translate-x-full animate-brand-shimmer bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />
      </div>
    )
  }

  return (
    <span className={`${variants[variant]} ${sizeClasses[size]} ${className}`}>
      {text}
    </span>
  )
}

// 品牌加载点组件
export function BrandLoadingDots({ className = '' }: { className?: string }) {
  return (
    <div className={`flex space-x-1 ${className}`}>
      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-brand-loading-dots"></div>
      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-brand-loading-dots" style={{ animationDelay: '0.2s' }}></div>
      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-brand-loading-dots" style={{ animationDelay: '0.4s' }}></div>
    </div>
  )
}

// 品牌打字光标
export function BrandTypingCursor({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-block w-0.5 h-4 bg-emerald-500 animate-brand-blink ${className}`}>|</span>
  )
}

// 品牌骨架屏
export function BrandSkeleton({ 
  className = '',
  width = 'w-full',
  height = 'h-4'
}: { 
  className?: string
  width?: string
  height?: string
}) {
  return (
    <div className={`${width} ${height} skeleton-brand rounded ${className}`} />
  )
}

// 品牌进度条
export function BrandProgressBar({ 
  progress = 0,
  className = '',
  showPercentage = false
}: {
  progress?: number
  className?: string
  showPercentage?: boolean
}) {
  return (
    <div className={`w-full bg-emerald-100 rounded-full h-2 ${className}`}>
      <div 
        className="progress-brand h-2 rounded-full transition-all duration-300"
        style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
      />
      {showPercentage && (
        <span className="text-xs text-emerald-600 mt-1 block">
          {Math.round(progress)}%
        </span>
      )}
    </div>
  )
}

// 预设的Loading文本样式 - 使用新的统一效果
export function LoadingDots({ className = '' }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      {[0, 1, 2].map((index) => (
        <span 
          key={index}
          className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" 
          style={{ animationDelay: `${index * 0.3}s` }} 
        />
      ))}
    </span>
  );
}

// 流式文本组件 - 优化版本，避免重复动画
interface StreamingTextProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  className?: string;
}

export function StreamingText({ 
  text, 
  speed = 50, 
  onComplete, 
  className = '' 
}: StreamingTextProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const indexRef = useRef(0);

  // 🔧 优化：避免重复启动动画
  useEffect(() => {
    if (!text || text === currentText) {
      return; // 文本没有变化，不重新启动动画
    }

    console.log('🌊 [StreamingText] 文本变化，更新显示:', {
      oldText: currentText?.substring(0, 30) + '...',
      newText: text?.substring(0, 30) + '...',
      textLength: text.length
    });

    // 清理之前的定时器
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    setCurrentText(text);
    setIsComplete(false);

    // 🔧 优化：如果新文本包含当前显示的文本，从当前位置继续
    const shouldContinue = text.startsWith(displayedText) && displayedText.length > 0;
    
    if (shouldContinue) {
      indexRef.current = displayedText.length;
      console.log('🔄 [StreamingText] 继续从位置', indexRef.current, '开始显示');
    } else {
      indexRef.current = 0;
      setDisplayedText('');
      console.log('🆕 [StreamingText] 重新开始显示');
    }

    // 启动动画
    timerRef.current = setInterval(() => {
      if (indexRef.current < text.length) {
        setDisplayedText(text.substring(0, indexRef.current + 1));
        indexRef.current++;
      } else {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        setIsComplete(true);
        console.log('🌊 [StreamingText] 显示完成');
        onComplete?.();
      }
    }, speed);

    // 清理函数
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [text, speed]); // 移除 onComplete 依赖，避免重复触发

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return (
    <span className={cn('relative', className)}>
      {displayedText}
      {!isComplete && displayedText && (
        <span className="inline w-0.5 h-4 bg-blue-500 animate-pulse" />
      )}
    </span>
  );
} 