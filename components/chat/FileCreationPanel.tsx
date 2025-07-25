'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FolderOpen } from 'lucide-react';

interface FileCreationPanelProps {
  codeFiles: Array<{
    filename: string;
    content: string;
    language?: string;
  }>;
  fileCreationStatus: Record<string, {
    status: 'pending' | 'streaming' | 'completed' | 'error';
  }>;
}

export const FileCreationPanel = React.memo(function FileCreationPanel({
  codeFiles,
  fileCreationStatus
}: FileCreationPanelProps) {
  const completedCount = Object.values(fileCreationStatus).filter(s => s.status === 'completed').length;
  const hasActiveCreation = Object.values(fileCreationStatus).some(s => s.status === 'pending' || s.status === 'streaming');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 p-4 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-200/60 dark:border-gray-700/60 shadow-sm"
    >
      {/* 标题栏 - 简约设计 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <FolderOpen className="w-4 h-4 text-blue-500 dark:text-blue-400" />
          </motion.div>
          <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
            正在创建项目文件
          </h4>
        </div>
        
        {/* 简约进度指示器 */}
        <div className="flex items-center gap-2">
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
      
      {/* 文件列表 - 简约卡片式 */}
      <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
        {codeFiles.map((file, index) => {
          const status = fileCreationStatus[file.filename];
          const currentStatus = status?.status || 'pending';
          
          return (
            <FileCreationItem
              key={file.filename}
              file={file}
              status={currentStatus}
              index={index}
            />
          );
        })}
      </div>
    </motion.div>
  );
});

// 单个文件创建项组件
const FileCreationItem = React.memo(function FileCreationItem({
  file,
  status,
  index
}: {
  file: { filename: string; content: string; language?: string };
  status: 'pending' | 'streaming' | 'completed' | 'error';
  index: number;
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
            className="w-4 h-4 bg-green-500 dark:bg-green-400 rounded-full flex items-center justify-center"
          >
            <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
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
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="group relative rounded-lg p-3 bg-white/80 dark:bg-gray-700/80 border border-gray-200/60 dark:border-gray-600/60 hover:shadow-sm transition-all duration-200"
    >
      <div className="flex items-center gap-3">
        {/* 文件图标和状态 */}
        <div className="flex-shrink-0">
          {getStatusIcon()}
        </div>
        
        {/* 文件信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {file.filename}
            </p>
            <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300">
              {((file.content?.length || 0) / 1000).toFixed(1)}KB
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {getStatusText()}
          </p>
        </div>
        
        {/* 文件类型标识 */}
        <div className="flex-shrink-0">
          <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium">
            {file.filename.split('.').pop()?.toUpperCase() || 'FILE'}
          </span>
        </div>
      </div>
    </motion.div>
  );
}); 