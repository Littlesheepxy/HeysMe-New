'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Clock, AlertCircle, FileCode, Eye, EyeOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface FileCreationItemProps {
  filename: string;
  status: 'pending' | 'streaming' | 'completed' | 'error';
  content: string;
  size?: number;
  onFileCreated?: () => void;
}

export function FileCreationItem({ 
  filename, 
  status, 
  content, 
  size = 0,
  onFileCreated 
}: FileCreationItemProps) {
  const [streamedContent, setStreamedContent] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // 🔧 处理流式文件内容更新
  useEffect(() => {
    if (status === 'streaming' && content) {
      setIsAnimating(true);
      // 直接使用传入的content，因为它已经是流式更新的
      setStreamedContent(content);
    } else if (status === 'completed') {
      setStreamedContent(content);
      setIsAnimating(false);
      if (onFileCreated) {
        setTimeout(onFileCreated, 300); // 延迟一点显示完成状态
      }
    } else if (status === 'pending') {
      setStreamedContent('');
      setIsAnimating(false);
    }
  }, [status, content, onFileCreated]);
  
  const getStatusIcon = () => {
    switch (status) {
      case 'pending': 
        return <Clock className="w-4 h-4 text-gray-400" />;
      case 'streaming': 
        return (
          <motion.div 
            animate={{ rotate: 360 }} 
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <FileCode className="w-4 h-4 text-blue-500" />
          </motion.div>
        );
      case 'completed': 
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': 
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };
  
  const getStatusColor = () => {
    switch (status) {
      case 'pending': return 'bg-gray-50 border-gray-200';
      case 'streaming': return 'bg-blue-50 border-blue-200';
      case 'completed': return 'bg-green-50 border-green-200';
      case 'error': return 'bg-red-50 border-red-200';
    }
  };
  
  const getLanguage = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'tsx': case 'jsx': return 'React';
      case 'ts': return 'TypeScript';
      case 'js': return 'JavaScript';
      case 'css': return 'CSS';
      case 'json': return 'JSON';
      case 'md': return 'Markdown';
      default: return 'Text';
    }
  };
  
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg border p-3 transition-all duration-300 ${getStatusColor()}`}
    >
      {/* 文件头部信息 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          {getStatusIcon()}
          <span className="text-sm font-mono truncate" title={filename}>
            {filename}
          </span>
          <Badge variant="outline" className="text-xs shrink-0">
            {getLanguage(filename)}
          </Badge>
        </div>
        
        <div className="flex items-center space-x-2">
          {(size > 0 || streamedContent.length > 0) && (
            <span className="text-xs text-gray-500">
              {formatFileSize(size || streamedContent.length)}
            </span>
          )}
          
          {streamedContent && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              className="h-6 w-6 p-0"
            >
              {showPreview ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            </Button>
          )}
        </div>
      </div>
      
      {/* 状态消息 */}
      {status === 'streaming' && (
        <div className="text-xs text-blue-600 mb-1 flex items-center gap-1">
          <motion.div
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            📝
          </motion.div>
          正在生成内容...
        </div>
      )}
      
      {status === 'completed' && (
        <div className="text-xs text-green-600 mb-1">
          ✓ 文件生成完成
        </div>
      )}
      
      {status === 'error' && (
        <div className="text-xs text-red-600 mb-1">
          ✗ 生成失败
        </div>
      )}
      
      {/* 流式内容预览 */}
      <AnimatePresence>
        {showPreview && streamedContent && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 p-2 bg-gray-900 rounded text-xs font-mono text-green-400 max-h-32 overflow-auto"
          >
            <div className="whitespace-pre-wrap">
              {status === 'streaming' ? (
                <>
                  {streamedContent}
                  <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className="bg-green-400 text-gray-900 px-0.5"
                  >
                    |
                  </motion.span>
                </>
              ) : (
                streamedContent.slice(0, 500) + (streamedContent.length > 500 ? '\n...' : '')
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
} 