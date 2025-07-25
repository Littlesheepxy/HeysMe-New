'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  File,
  FileImage,
  FileVideo,
  FileAudio,
  Archive,
  Code,
  Database,
  X,
  Eye,
  EyeOff,
  Download,
  Trash2
} from 'lucide-react';
import { useTheme } from '@/contexts/theme-context';
import { cn } from '@/lib/utils';

// 文件状态类型
export type FileStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'error';

// 文件项接口
export interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  status: FileStatus;
  progress: number;
  error?: string;
  preview?: string;
  content?: string;
  url?: string;
}

// 文件加载UI属性
interface FileLoadingUIProps {
  files: FileItem[];
  onFileRemove?: (id: string) => void;
  onFilePreview?: (id: string) => void;
  onFileDownload?: (id: string) => void;
  className?: string;
  compact?: boolean;
  showPreview?: boolean;
  showActions?: boolean;
  maxHeight?: string;
}

// 获取文件图标
const getFileIcon = (type: string, name: string) => {
  const ext = name.split('.').pop()?.toLowerCase();
  
  if (type.startsWith('image/')) return FileImage;
  if (type.startsWith('video/')) return FileVideo;
  if (type.startsWith('audio/')) return FileAudio;
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext || '')) return Archive;
  if (['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'json', 'xml', 'yaml', 'yml'].includes(ext || '')) return Code;
  if (['sql', 'db', 'sqlite'].includes(ext || '')) return Database;
  
  return FileText;
};

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

// 获取状态颜色
const getStatusColor = (status: FileStatus, theme: string) => {
  const colors = {
    idle: theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-gray-800 border-gray-700',
    uploading: theme === 'light' ? 'bg-blue-50 border-blue-200' : 'bg-blue-900/20 border-blue-700',
    processing: theme === 'light' ? 'bg-amber-50 border-amber-200' : 'bg-amber-900/20 border-amber-700',
    completed: theme === 'light' ? 'bg-green-50 border-green-200' : 'bg-green-900/20 border-green-700',
    error: theme === 'light' ? 'bg-red-50 border-red-200' : 'bg-red-900/20 border-red-700',
  };
  return colors[status];
};

// 单个文件项组件
const FileItem: React.FC<{
  file: FileItem;
  onRemove?: (id: string) => void;
  onPreview?: (id: string) => void;
  onDownload?: (id: string) => void;
  compact?: boolean;
  showPreview?: boolean;
  showActions?: boolean;
}> = ({ file, onRemove, onPreview, onDownload, compact, showPreview, showActions }) => {
  const { theme } = useTheme();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const FileIcon = getFileIcon(file.type, file.name);

  const getStatusIcon = () => {
    switch (file.status) {
      case 'uploading':
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="w-4 h-4 text-blue-500" />
          </motion.div>
        );
      case 'processing':
        return (
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Loader2 className="w-4 h-4 text-amber-500" />
          </motion.div>
        );
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Upload className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (file.status) {
      case 'uploading':
        return `上传中 ${file.progress}%`;
      case 'processing':
        return '处理中...';
      case 'completed':
        return '已完成';
      case 'error':
        return file.error || '处理失败';
      default:
        return '待处理';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        "group relative rounded-lg border transition-all duration-300 hover:shadow-sm",
        getStatusColor(file.status, theme),
        compact ? "p-2" : "p-3"
      )}
    >
      {/* 主要内容 */}
      <div className="flex items-center gap-3">
        {/* 文件图标 */}
        <div className="flex-shrink-0">
          <FileIcon className={cn(
            "text-gray-500",
            compact ? "w-4 h-4" : "w-5 h-5"
          )} />
        </div>

        {/* 文件信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className={cn(
              "font-medium truncate",
              theme === 'light' ? "text-gray-900" : "text-gray-100",
              compact ? "text-sm" : "text-base"
            )}>
              {file.name}
            </p>
            {!compact && (
              <span className={cn(
                "text-xs px-2 py-0.5 rounded-full",
                theme === 'light' ? "bg-gray-100 text-gray-600" : "bg-gray-700 text-gray-300"
              )}>
                {formatFileSize(file.size)}
              </span>
            )}
          </div>
          
          {/* 状态信息 */}
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className={cn(
              "text-xs",
              theme === 'light' ? "text-gray-600" : "text-gray-400"
            )}>
              {getStatusText()}
            </span>
          </div>
        </div>

        {/* 操作按钮 */}
        {showActions && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {showPreview && file.content && (
              <button
                onClick={() => setIsPreviewOpen(!isPreviewOpen)}
                className={cn(
                  "p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",
                  theme === 'light' ? "text-gray-500 hover:text-gray-700" : "text-gray-400 hover:text-gray-200"
                )}
              >
                {isPreviewOpen ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              </button>
            )}
            
            {onDownload && file.status === 'completed' && (
              <button
                onClick={() => onDownload(file.id)}
                className={cn(
                  "p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",
                  theme === 'light' ? "text-gray-500 hover:text-gray-700" : "text-gray-400 hover:text-gray-200"
                )}
              >
                <Download className="w-3 h-3" />
              </button>
            )}
            
            {onRemove && (
              <button
                onClick={() => onRemove(file.id)}
                className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors text-gray-400 hover:text-red-500"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* 进度条 */}
      {(file.status === 'uploading' || file.status === 'processing') && (
        <div className="mt-2">
          <div className={cn(
            "h-1 rounded-full overflow-hidden",
            theme === 'light' ? "bg-gray-200" : "bg-gray-700"
          )}>
            <motion.div
              className={cn(
                "h-full rounded-full",
                file.status === 'uploading' ? "bg-blue-500" : "bg-amber-500"
              )}
              initial={{ width: 0 }}
              animate={{ width: `${file.progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      )}

      {/* 预览区域 */}
      <AnimatePresence>
        {isPreviewOpen && file.content && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700"
          >
            <div className={cn(
              "p-3 rounded-lg font-mono text-xs max-h-32 overflow-auto",
              theme === 'light' ? "bg-gray-100 text-gray-800" : "bg-gray-800 text-gray-200"
            )}>
              <pre className="whitespace-pre-wrap break-words">
                {file.content.slice(0, 500)}
                {file.content.length > 500 && '...'}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// 主文件加载UI组件
export const FileLoadingUI: React.FC<FileLoadingUIProps> = ({
  files,
  onFileRemove,
  onFilePreview,
  onFileDownload,
  className,
  compact = false,
  showPreview = true,
  showActions = true,
  maxHeight = '400px'
}) => {
  const { theme } = useTheme();
  
  // 统计信息
  const stats = {
    total: files.length,
    completed: files.filter(f => f.status === 'completed').length,
    processing: files.filter(f => f.status === 'uploading' || f.status === 'processing').length,
    error: files.filter(f => f.status === 'error').length,
  };

  if (files.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* 统计信息 */}
      {!compact && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className={cn(
              "text-sm font-medium",
              theme === 'light' ? "text-gray-900" : "text-gray-100"
            )}>
              文件处理状态
            </span>
            <div className="flex items-center gap-2">
              {stats.completed > 0 && (
                <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                  {stats.completed} 已完成
                </span>
              )}
              {stats.processing > 0 && (
                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                  {stats.processing} 处理中
                </span>
              )}
              {stats.error > 0 && (
                <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400">
                  {stats.error} 失败
                </span>
              )}
            </div>
          </div>
          
          {/* 总体进度 */}
          {stats.processing > 0 && (
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Loader2 className="w-4 h-4 text-blue-500" />
              </motion.div>
              <span className="text-sm text-gray-500">
                {Math.round((stats.completed / stats.total) * 100)}%
              </span>
            </div>
          )}
        </div>
      )}

      {/* 文件列表 */}
      <div 
        className={cn(
          "space-y-2 overflow-y-auto",
          theme === 'light' ? "scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100" : "scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
        )}
        style={{ maxHeight }}
      >
        <AnimatePresence>
          {files.map((file) => (
            <FileItem
              key={file.id}
              file={file}
              onRemove={onFileRemove}
              onPreview={onFilePreview}
              onDownload={onFileDownload}
              compact={compact}
              showPreview={showPreview}
              showActions={showActions}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

// 简化版文件加载指示器
export const FileLoadingIndicator: React.FC<{
  fileName: string;
  progress: number;
  status: FileStatus;
  size?: 'sm' | 'md' | 'lg';
}> = ({ fileName, progress, status, size = 'md' }) => {
  const { theme } = useTheme();
  
  const sizeClasses = {
    sm: 'text-xs p-2',
    md: 'text-sm p-3',
    lg: 'text-base p-4'
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border",
        sizeClasses[size],
        getStatusColor(status, theme)
      )}
    >
      {status === 'uploading' || status === 'processing' ? (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="w-4 h-4 text-blue-500" />
        </motion.div>
      ) : status === 'completed' ? (
        <CheckCircle2 className="w-4 h-4 text-green-500" />
      ) : status === 'error' ? (
        <AlertCircle className="w-4 h-4 text-red-500" />
      ) : (
        <Upload className="w-4 h-4 text-gray-400" />
      )}
      
      <span className={cn(
        "font-medium truncate max-w-32",
        theme === 'light' ? "text-gray-900" : "text-gray-100"
      )}>
        {fileName}
      </span>
      
      {(status === 'uploading' || status === 'processing') && (
        <span className="text-xs text-gray-500">
          {progress}%
        </span>
      )}
    </motion.div>
  );
};

export default FileLoadingUI; 