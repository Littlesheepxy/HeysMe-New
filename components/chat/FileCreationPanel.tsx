'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderOpen, Code, Eye, ChevronDown, ChevronRight } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface FileCreationPanelProps {
  codeFiles: Array<{
    filename: string;
    content: string;
    language?: string;
  }>;
  fileCreationStatus: Record<string, {
    status: 'pending' | 'streaming' | 'completed' | 'error';
    streamedContent?: string; // 新增：流式内容
    progress?: number; // 新增：进度百分比
  }>;
  version?: string;
  onVersionClick?: (version: string) => void;
  onFileClick?: (file: any, index: number) => void;
  isActive?: boolean;
  streamingFile?: string; // 新增：当前正在流式生成的文件
}

export const FileCreationPanel = React.memo(function FileCreationPanel({
  codeFiles,
  fileCreationStatus,
  version = "V1.0",
  onVersionClick,
  onFileClick,
  isActive = false,
  streamingFile
}: FileCreationPanelProps) {
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  const [showStreamPreview, setShowStreamPreview] = useState(true);
  const [visibleFiles, setVisibleFiles] = useState<Set<string>>(new Set());
  
  const completedCount = Object.values(fileCreationStatus).filter(s => s.status === 'completed').length;
  const hasActiveCreation = Object.values(fileCreationStatus).some(s => s.status === 'pending' || s.status === 'streaming');
  const streamingStatus = streamingFile ? fileCreationStatus[streamingFile] : null;
  const progressPercentage = Math.round((completedCount / codeFiles.length) * 100);

  // 🎯 核心逻辑：严格控制文件依次显示
  const getVisibleFiles = () => {
    const visible: typeof codeFiles = [];
    
    for (let i = 0; i < codeFiles.length; i++) {
      const file = codeFiles[i];
      const status = fileCreationStatus[file.filename];
      const currentStatus = status?.status || 'pending';
      
      // 严格的顺序控制逻辑
      if (currentStatus === 'completed') {
        // ✅ 已完成的文件总是显示
        visible.push(file);
      } else if (currentStatus === 'streaming' || file.filename === streamingFile) {
        // 🔄 正在生成的文件：只有当前面的文件都完成了才显示
        const previousFiles = codeFiles.slice(0, i);
        const allPreviousCompleted = previousFiles.every(f => {
          const prevStatus = fileCreationStatus[f.filename]?.status;
          return prevStatus === 'completed';
        });
        
        if (allPreviousCompleted) {
          visible.push(file);
          break; // 重要：只显示第一个正在生成的文件
        } else {
          break; // 如果当前正在生成的文件不应该显示，停止处理
        }
      } else if (currentStatus === 'pending') {
        // ⏳ 等待中的文件：只有当前面的文件都完成了才显示第一个
        const previousFiles = codeFiles.slice(0, i);
        const allPreviousCompleted = previousFiles.every(f => {
          const prevStatus = fileCreationStatus[f.filename]?.status;
          return prevStatus === 'completed';
        });
        
        if (allPreviousCompleted) {
          visible.push(file);
          break; // 只显示第一个等待的文件
        } else {
          break; // 停止处理后续文件
        }
      } else {
        // 其他状态（如 error）的处理
        break;
      }
    }
    
    return visible;
  };

  const visibleFilesToShow = getVisibleFiles();

  const toggleFileExpanded = (filename: string) => {
    setExpandedFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(filename)) {
        newSet.delete(filename);
      } else {
        newSet.add(filename);
      }
      return newSet;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mt-4 backdrop-blur-sm rounded-xl border shadow-sm transition-all duration-200 relative ${
        isActive 
          ? "bg-blue-50/80 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700"
          : "bg-white/60 dark:bg-gray-800/60 border-gray-200/60 dark:border-gray-700/60"
      }`}
    >

      {/* 头部 - 可点击的版本切换 */}
      <div 
        className="p-4 cursor-pointer hover:bg-white/20 dark:hover:bg-gray-700/20 rounded-t-xl transition-colors"
        onClick={() => onVersionClick?.(version)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: hasActiveCreation ? [0, 10, -10, 0] : 0 }}
              transition={{ duration: 2, repeat: hasActiveCreation ? Infinity : 0 }}
              className="relative"
            >
              <FolderOpen className="w-5 h-5 text-blue-500 dark:text-blue-400" />
              {hasActiveCreation && (
                <motion.div
                  className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}
            </motion.div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                项目文件生成 - {version}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {hasActiveCreation 
                  ? `正在生成第 ${completedCount + 1}/${codeFiles.length} 个文件...` 
                  : `已完成 ${completedCount}/${codeFiles.length} 个文件`}
              </p>
            </div>
          </div>
          
          {/* 进度环形指示器 */}
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10">
              <svg className="w-10 h-10 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-gray-200 dark:text-gray-700"
                />
                <motion.path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray={`${progressPercentage}, 100`}
                  className="text-blue-500 dark:text-blue-400"
                  initial={{ strokeDasharray: "0, 100" }}
                  animate={{ strokeDasharray: `${progressPercentage}, 100` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                  {progressPercentage}%
                </span>
              </div>
            </div>
            
            {/* 状态指示 */}
            <div className="flex flex-col items-end gap-1">
              <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium">
                {completedCount}/{codeFiles.length}
              </span>
              {hasActiveCreation && (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-3 h-3 border border-blue-500 dark:border-blue-400 border-t-transparent rounded-full"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 🚀 新增：实时流式代码预览 - 类似 open-lovable */}
      {streamingFile && streamingStatus?.streamedContent && showStreamPreview && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mx-4 mb-4 border-t border-gray-200 dark:border-gray-700 pt-4"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                正在生成: {streamingFile}
              </span>
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-2 h-4 bg-orange-400 rounded-sm"
              />
            </div>
            <button
              onClick={() => setShowStreamPreview(false)}
              className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              隐藏
            </button>
          </div>
          
          <div className="bg-gray-900 rounded-lg border border-gray-700 max-h-48 overflow-y-auto scrollbar-hide">
            <SyntaxHighlighter
              language={streamingFile?.split('.').pop() === 'css' ? 'css' : 
                       streamingFile?.split('.').pop() === 'json' ? 'json' : 'javascript'}
              style={vscDarkPlus}
              customStyle={{
                margin: 0,
                padding: '12px',
                fontSize: '12px',
                lineHeight: '1.4'
              }}
              showLineNumbers={false}
            >
              {streamingStatus.streamedContent + (streamingStatus.status === 'streaming' ? '█' : '')}
            </SyntaxHighlighter>
          </div>
          
          {/* 进度条 */}
          {streamingStatus.progress !== undefined && (
            <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
              <motion.div
                className="h-1 bg-orange-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${streamingStatus.progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          )}
        </motion.div>
      )}
      
      {/* 文件列表 - 依次显示版 */}
      <div className="px-4 pb-4">
        <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
          {/* 🎯 只显示当前应该可见的文件 */}
          {visibleFilesToShow.map((file, index) => {
            const status = fileCreationStatus[file.filename];
            const currentStatus = status?.status || 'pending';
            const isExpanded = expandedFiles.has(file.filename);
            const isCurrentlyStreaming = streamingFile === file.filename;
            const originalIndex = codeFiles.findIndex(f => f.filename === file.filename);
            
            return (
              <motion.div
                key={file.filename}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  delay: index * 0.2, // 稍微增加延迟，让用户清楚看到依次出现
                  duration: 0.4,
                  ease: "easeOut"
                }}
                className="group"
              >
                <FileCreationItem
                  file={file}
                  status={currentStatus}
                  index={originalIndex}
                  isExpanded={isExpanded}
                  isCurrentlyStreaming={isCurrentlyStreaming}
                  streamedContent={status?.streamedContent}
                  progress={status?.progress}
                  onClick={() => onFileClick?.(file, originalIndex)}
                  onToggleExpand={() => toggleFileExpanded(file.filename)}
                />
              </motion.div>
            );
          })}
          
          {/* 📝 显示下一个即将生成的文件 */}
          {visibleFilesToShow.length < codeFiles.length && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="space-y-2"
            >
              {/* 下一个文件预告 */}
              {(() => {
                const nextFileIndex = visibleFilesToShow.length;
                const nextFile = codeFiles[nextFileIndex];
                if (nextFile) {
                  return (
                    <motion.div
                      animate={{ 
                        borderColor: ["#e5e7eb", "#3b82f6", "#e5e7eb"],
                        backgroundColor: ["#f9fafb", "#eff6ff", "#f9fafb"]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="flex items-center gap-3 px-3 py-2 text-sm border border-dashed rounded-lg"
                    >
                      <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-gray-600 dark:text-gray-400">
                        下一个: <span className="font-medium text-gray-900 dark:text-gray-100">{nextFile.filename}</span>
                      </span>
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                        {nextFile.filename.split('.').pop()?.toUpperCase()}
                      </span>
                    </motion.div>
                  );
                }
                return null;
              })()}
              
              {/* 总体等待提示 */}
              {visibleFilesToShow.length + 1 < codeFiles.length && (
                <div className="flex items-center gap-2 px-3 py-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
                  <span>
                    还有 {codeFiles.length - visibleFilesToShow.length - 1} 个文件等待生成
                  </span>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
});

// 单个文件创建项组件 - 增强版
const FileCreationItem = React.memo(function FileCreationItem({
  file,
  status,
  index,
  isExpanded,
  isCurrentlyStreaming,
  streamedContent,
  progress,
  onClick,
  onToggleExpand
}: {
  file: { filename: string; content: string; language?: string };
  status: 'pending' | 'streaming' | 'completed' | 'error';
  index: number;
  isExpanded?: boolean;
  isCurrentlyStreaming?: boolean;
  streamedContent?: string;
  progress?: number;
  onClick?: () => void;
  onToggleExpand?: () => void;
}) {
  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return <div className="w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-600 animate-pulse" />;
      case 'streaming':
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="w-4 h-4 border-2 border-blue-500 dark:border-blue-400 border-t-transparent rounded-full"
          />
        );
      case 'completed':
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="w-5 h-5 bg-green-500 dark:bg-green-400 rounded-full flex items-center justify-center shadow-sm"
          >
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20" strokeWidth="2">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </motion.div>
        );
      case 'error':
        return (
          <div className="w-4 h-4 bg-red-500 dark:bg-red-400 rounded-full flex items-center justify-center">
            <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'pending': return '等待创建...';
      case 'streaming': return '正在生成内容...';
      case 'completed': return '创建完成';
      case 'error': return '创建失败';
      default: return '';
    }
  };

  return (
    <div className="relative">
      {/* 主文件项 */}
      <div
        className={`group relative rounded-lg px-3 py-2 transition-all duration-200 cursor-pointer border ${
          isCurrentlyStreaming
            ? 'bg-orange-50/80 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700 shadow-sm'
            : status === 'completed'
            ? 'bg-green-50/80 dark:bg-green-900/20 border-green-200 dark:border-green-700'
            : 'bg-white/80 dark:bg-gray-700/80 border-gray-200/60 dark:border-gray-600/60 hover:shadow-sm hover:bg-white dark:hover:bg-gray-700'
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          {/* 左侧：状态图标 + 文件名 */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0">
              {getStatusIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {file.filename}
                </span>
                {/* 文件类型徽章 */}
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium flex-shrink-0">
                  {file.filename.split('.').pop()?.toUpperCase() || 'FILE'}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {getStatusText()}
                </span>
                {/* 文件大小 */}
                <span className="text-xs px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium">
                  {((file.content?.length || 0) / 1000).toFixed(1)}KB
                </span>
                {/* 进度条 - 流式生成时显示 */}
                {status === 'streaming' && progress !== undefined && (
                  <div className="flex-1 max-w-20">
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1">
                      <motion.div
                        className="h-1 bg-orange-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* 右侧：操作按钮 */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* 预览按钮 */}
            {status === 'completed' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClick?.();
                }}
                className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                title="预览文件"
              >
                <Eye className="w-3 h-3" />
              </button>
            )}
            
            {/* 展开/收起按钮 */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand?.();
              }}
              className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title={isExpanded ? "收起代码" : "展开代码"}
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3 text-gray-500 dark:text-gray-400" />
              ) : (
                <ChevronRight className="w-3 h-3 text-gray-500 dark:text-gray-400" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 🚀 展开的代码预览区域 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-2 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
          >
            <div className="bg-gray-50 dark:bg-gray-800 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  {file.filename}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-500">
                  {status === 'streaming' ? '正在生成...' : '代码预览'}
                </span>
              </div>
            </div>
            <div className="bg-gray-900 max-h-48 overflow-y-auto scrollbar-hide">
              <SyntaxHighlighter
                language={file.filename.split('.').pop() === 'css' ? 'css' : 
                         file.filename.split('.').pop() === 'json' ? 'json' : 'javascript'}
                style={vscDarkPlus}
                customStyle={{
                  margin: 0,
                  padding: '12px',
                  fontSize: '11px',
                  lineHeight: '1.4'
                }}
                showLineNumbers={true}
              >
                {status === 'streaming' && streamedContent 
                  ? streamedContent + (isCurrentlyStreaming ? '█' : '')
                  : file.content || '// 等待生成...'}
              </SyntaxHighlighter>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}); 