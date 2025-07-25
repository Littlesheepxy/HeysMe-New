'use client';

import { motion } from 'framer-motion';
import { Loader2, Sparkles, Brain, Zap } from 'lucide-react';
import { UnifiedLoading } from './unified-loading';

interface LoadingStateProps {
  type: 'processing' | 'generating' | 'analyzing' | 'thinking';
  message?: string;
  progress?: number;
}

export function LoadingState({ type, message, progress }: LoadingStateProps) {
  // 映射到统一的loading变体
  const variantMapping = {
    processing: 'processing' as const,
    generating: 'generating' as const,
    analyzing: 'analyzing' as const,
    thinking: 'thinking' as const
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-3"
    >
      <UnifiedLoading 
        variant={variantMapping[type]}
        text={message}
        size="md"
      />
      
      {progress !== undefined && (
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <motion.div
            className="bg-blue-500 h-1.5 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      )}
    </motion.div>
  );
}

export function StreamingProgress({ stage }: { stage: string }) {
  const stages = [
    { key: 'processing', label: '分析输入', icon: '🔍' },
    { key: 'understanding', label: '理解需求', icon: '🧠' },
    { key: 'generating', label: '生成建议', icon: '✨' },
    { key: 'formatting', label: '格式化输出', icon: '📝' },
    { key: 'done', label: '完成', icon: '✅' }
  ];

  return (
    <div className="space-y-2">
      {stages.map((s, index) => {
        const isActive = s.key === stage;
        const isCompleted = stages.findIndex(st => st.key === stage) > index;
        
        return (
          <motion.div
            key={s.key}
            className={`flex items-center gap-2 text-sm ${
              isActive ? 'text-blue-600 font-medium' : 
              isCompleted ? 'text-green-600' : 'text-gray-400'
            }`}
            animate={isActive ? { x: [0, 5, 0] } : {}}
            transition={{ duration: 1, repeat: isActive ? Infinity : 0 }}
          >
            <span className="text-base">{s.icon}</span>
            <span>{s.label}</span>
            {isActive && (
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="w-2 h-2 bg-blue-500 rounded-full"
              />
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

export function SuggestionsPreview({ interaction }: { interaction: any }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200"
    >
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-purple-500" />
        <span className="text-sm font-medium text-purple-700">
          个性化建议已准备
        </span>
      </div>
      
      <div className="text-xs text-gray-600">
        基于您的输入，我们已经生成了专属的选项，请稍候完整内容加载...
      </div>
      
      <motion.div
        className="mt-2 flex gap-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 bg-purple-400 rounded-full animate-typing-dots"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
} 