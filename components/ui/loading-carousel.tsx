'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sparkles } from 'lucide-react';

interface LoadingMessage {
  text: string;
  stage?: string;
  duration?: number;
}

interface LoadingCarouselProps {
  messages: LoadingMessage[];
  className?: string;
  onComplete?: () => void;
  autoLoop?: boolean;
}

export function LoadingCarousel({ 
  messages, 
  className = '', 
  onComplete,
  autoLoop = false 
}: LoadingCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (messages.length === 0) return;

    const currentMessage = messages[currentIndex];
    const duration = currentMessage.duration || 2000;

    const timer = setTimeout(() => {
      if (currentIndex < messages.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else if (autoLoop) {
        setCurrentIndex(0);
      } else {
        // 完成所有消息后的处理
        setIsVisible(false);
        setTimeout(() => {
          onComplete?.();
        }, 300);
      }
    }, duration);

    return () => clearTimeout(timer);
  }, [currentIndex, messages, autoLoop, onComplete]);

  if (!isVisible || messages.length === 0) return null;

  const currentMessage = messages[currentIndex];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={`flex items-start gap-4 max-w-4xl mx-auto px-6 py-4 ${className}`}
    >
      {/* AI头像 */}
      <Avatar className="w-8 h-8 shrink-0">
        <AvatarFallback className="bg-gray-100 text-gray-600">
          <Sparkles className="w-4 h-4" />
        </AvatarFallback>
      </Avatar>

      {/* Loading消息内容 - 带轮播和光照扫描效果 */}
      <div className="flex-1">
        <div className="inline-block max-w-full text-gray-800">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="whitespace-pre-wrap break-words"
            >
                             {/* 文本内容 - 类似ChatGPT的白光扫描效果 */}
               <div className="relative inline-block overflow-hidden">
                 <span className="relative text-gray-700">
                   {currentMessage.text}
                 </span>
                 
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
               </div>
              
              {/* 进度指示器 */}
              <div className="flex items-center gap-1 mt-2">
                {messages.map((_, index) => (
                  <div
                    key={index}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                      index === currentIndex 
                        ? 'bg-emerald-500 scale-125' 
                        : index < currentIndex 
                          ? 'bg-emerald-300' 
                          : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// 预设的加载消息组合
export const LOADING_SEQUENCES = {
  INTERACTION_PROCESSING: [
    { text: '正在分析您的选择，请稍候', duration: 1500 },
    { text: '正在为您生成个性化建议', duration: 2000 }
  ],
  
  CONTENT_GENERATION: [
    { text: '正在理解您的需求', duration: 1200 },
    { text: '正在分析相关信息', duration: 1500 },
    { text: '正在生成定制内容', duration: 2000 }
  ],
  
  DATA_PROCESSING: [
    { text: '正在处理您的数据', duration: 1500 },
    { text: '正在进行智能分析', duration: 1800 },
    { text: '即将为您呈现结果', duration: 1200 }
  ]
};

// 便捷组件
export function InteractionProcessingLoader({ 
  onComplete, 
  className = '' 
}: { 
  onComplete?: () => void; 
  className?: string; 
}) {
  return (
    <LoadingCarousel
      messages={LOADING_SEQUENCES.INTERACTION_PROCESSING}
      onComplete={onComplete}
      className={className}
    />
  );
}

export function ContentGenerationLoader({ 
  onComplete, 
  className = '' 
}: { 
  onComplete?: () => void; 
  className?: string; 
}) {
  return (
    <LoadingCarousel
      messages={LOADING_SEQUENCES.CONTENT_GENERATION}
      onComplete={onComplete}
      className={className}
    />
  );
} 