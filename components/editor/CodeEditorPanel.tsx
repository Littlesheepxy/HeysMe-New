'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { FileCode, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { FileTree, FileTreeNode } from './FileTree';
import Editor from '@monaco-editor/react';
import { useTheme } from '@/contexts/theme-context';
import { CodeFile } from '@/lib/agents/coding/types';
import dynamic from 'next/dynamic';


// 动态导入 Vercel 预览组件
const VercelPreview = dynamic(() => import('./VercelPreview'), { ssr: false });

interface CodeEditorPanelProps {
  files: CodeFile[];
  onFileUpdate: (filename: string, content: string) => void;
  onFileAdd?: (file: CodeFile) => void;
  onFileDelete?: (filename: string) => void;
  projectName?: string;
  description?: string;
  showPreview?: boolean;
  // 🆕 流式生成状态控制
  isStreaming?: boolean;
  isProjectComplete?: boolean;
  // 🆕 自动部署相关
  autoDeployEnabled?: boolean;
  onAutoSwitchToPreview?: () => void;
  onDeploy?: () => void;
}

export function CodeEditorPanel({
  files,
  onFileUpdate,
  onFileAdd,
  onFileDelete,
  projectName = 'HeysMe Project',
  description,
  showPreview = false,
  // 🆕 流式生成状态控制
  isStreaming = false,
  isProjectComplete = false,
  // 🆕 自动部署相关
  autoDeployEnabled = false,
  onAutoSwitchToPreview,
  onDeploy
}: CodeEditorPanelProps) {
  const [selectedFileId, setSelectedFileId] = useState<string>(files[0]?.filename || '');
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [hasAutoSwitched, setHasAutoSwitched] = useState(false);
  const [streamingContent, setStreamingContent] = useState<{ [filename: string]: string }>({});
  const { theme } = useTheme();

  // 🚀 自动切换到预览模式：生成完毕后自动切换
  React.useEffect(() => {
    if (
      autoDeployEnabled &&
      isProjectComplete &&
      !isStreaming &&
      !hasAutoSwitched &&
      files.length > 0 &&
      onAutoSwitchToPreview
    ) {
      console.log('🎯 [自动切换] 项目生成完毕，自动切换到预览模式');
      // 延迟500ms切换，确保所有文件都已准备就绪
      const switchTimer = setTimeout(() => {
        onAutoSwitchToPreview();
        setHasAutoSwitched(true);
      }, 500);
      
      return () => clearTimeout(switchTimer);
    }
  }, [autoDeployEnabled, isProjectComplete, isStreaming, hasAutoSwitched, files.length, onAutoSwitchToPreview]);

  // 重置自动切换状态，当开始新的生成时
  React.useEffect(() => {
    if (isStreaming && hasAutoSwitched) {
      setHasAutoSwitched(false);
    }
  }, [isStreaming, hasAutoSwitched]);

  // 🎯 确定实际显示的模式：生成期间强制显示代码
  const actualShowPreview = showPreview && !isStreaming;

  // 🌊 处理流式内容更新：监听文件变化，实现流式显示效果
  React.useEffect(() => {
    if (!isStreaming) {
      // 不在流式状态时，直接显示完整内容
      const fullContent: { [filename: string]: string } = {};
      files.forEach(file => {
        fullContent[file.filename] = file.content;
      });
      setStreamingContent(fullContent);
      return;
    }

    if (files.length === 0) {
      return;
    }

    // 流式显示逻辑
    const updateStreamingContent = () => {
      setStreamingContent(prevContent => {
        const newStreamingContent: { [filename: string]: string } = {};
        let hasChanges = false;
        
        files.forEach(file => {
          const currentContent = prevContent[file.filename] || '';
          const targetContent = file.content;
          
          if (currentContent.length < targetContent.length) {
            // 计算应该显示的内容长度（模拟打字机效果）
            const increment = Math.min(50, targetContent.length - currentContent.length);
            newStreamingContent[file.filename] = targetContent.substring(0, currentContent.length + increment);
            hasChanges = true;
          } else {
            newStreamingContent[file.filename] = targetContent;
          }
        });
        
        // 如果还有内容需要更新，安排下一次更新
        if (hasChanges) {
          setTimeout(updateStreamingContent, 50);
        }
        
        return newStreamingContent;
      });
    };

    // 开始流式更新
    updateStreamingContent();
  }, [files, isStreaming]);

  // 🎯 获取当前文件应该显示的内容（流式或完整）
  const getDisplayContent = (file: CodeFile): string => {
    if (isStreaming) {
      return streamingContent[file.filename] || '';
    }
    return file.content;
  };
  


  // 将CodeFile数组转换为FileTreeNode结构
  const treeData = useMemo((): FileTreeNode[] => {
    // 按文件夹分组
    const folders: { [key: string]: FileTreeNode[] } = {};
    const rootFiles: FileTreeNode[] = [];
    
    files.forEach(file => {
      const parts = file.filename.split('/');
      if (parts.length === 1) {
        // 根目录文件
        rootFiles.push({
          id: file.filename,
          name: file.filename,
          type: 'file',
          language: file.language,
          fileType: file.type as any,
          content: file.content
        });
      } else {
        // 文件夹中的文件
        const folderName = parts[0];
        if (!folders[folderName]) {
          folders[folderName] = [];
        }
        folders[folderName].push({
          id: file.filename,
          name: parts.slice(1).join('/'),
          type: 'file',
          language: file.language,
          fileType: file.type as any,
          content: file.content
        });
      }
    });
    
    // 构建树结构
    const result: FileTreeNode[] = [];
    
    // 添加文件夹
    Object.entries(folders).forEach(([folderName, folderFiles]) => {
      result.push({
        id: folderName,
        name: folderName,
        type: 'folder',
        children: folderFiles
      });
    });
    
    // 添加根文件
    result.push(...rootFiles);
    
    return result;
  }, [files]);

  // 获取当前选中的文件
  const currentFile = useMemo(() => {
    return files.find(file => file.filename === selectedFileId);
  }, [files, selectedFileId]);

  // 🌊 获取当前文件的显示内容（支持流式显示）
  const currentFileDisplayContent = useMemo(() => {
    if (!currentFile) return '';
    return getDisplayContent(currentFile);
  }, [currentFile, streamingContent, isStreaming]);

  // 处理文件选择
  const handleFileSelect = useCallback((fileId: string) => {
    setSelectedFileId(fileId);
  }, []);

  // 处理代码编辑
  const handleCodeChange = useCallback((value: string | undefined) => {
    if (currentFile && value !== undefined && !isStreaming) {
      // 只有在非流式状态下才允许编辑
      onFileUpdate(currentFile.filename, value);
    }
  }, [currentFile, onFileUpdate, isStreaming]);

  // 获取Monaco编辑器语言
  const getMonacoLanguage = (filename: string, language: string) => {
    if (filename.endsWith('.tsx') || filename.endsWith('.jsx')) return 'typescript';
    if (filename.endsWith('.ts')) return 'typescript';
    if (filename.endsWith('.js')) return 'javascript';
    if (filename.endsWith('.css')) return 'css';
    if (filename.endsWith('.scss')) return 'scss';
    if (filename.endsWith('.json')) return 'json';
    if (filename.endsWith('.md')) return 'markdown';
    return language.toLowerCase();
  };

  // 获取文件类型颜色
  const getFileTypeColor = (type: string) => {
    const baseClasses = theme === 'light' ? {
      component: 'bg-green-100 text-green-800 border-green-200',
      page: 'bg-blue-100 text-blue-800 border-blue-200',
      styles: 'bg-purple-100 text-purple-800 border-purple-200',
      config: 'bg-gray-100 text-gray-800 border-gray-200',
      data: 'bg-orange-100 text-orange-800 border-orange-200',
      default: 'bg-gray-100 text-gray-800 border-gray-200'
    } : {
      component: 'bg-green-900 text-green-200 border-green-700',
      page: 'bg-blue-900 text-blue-200 border-blue-700',
      styles: 'bg-purple-900 text-purple-200 border-purple-700',
      config: 'bg-gray-700 text-gray-200 border-gray-600',
      data: 'bg-orange-900 text-orange-200 border-orange-700',
      default: 'bg-gray-700 text-gray-200 border-gray-600'
    };
    
    return baseClasses[type as keyof typeof baseClasses] || baseClasses.default;
  };

  if (!files || files.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-800">
        <div className="text-center">
          <FileCode className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {isStreaming ? '正在生成代码文件...' : '暂无代码文件'}
          </p>
          {onFileAdd && (
            <button
              onClick={() => onFileAdd({
                filename: 'App.tsx',
                content: 'import React from "react";\n\nfunction App() {\n  return (\n    <div>\n      <h1>Hello World!</h1>\n    </div>\n  );\n}\n\nexport default App;',
                language: 'typescript',
                type: 'component'
              })}
              className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors flex items-center gap-2 mx-auto"
            >
              <Plus className="w-4 h-4" />
              添加文件
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* 编辑器部分 */}
      <div className={`${actualShowPreview ? 'w-1/2' : 'w-full'} transition-all duration-300 h-full flex`}>
        {/* 左侧文件树 */}
        <div className="w-80 flex-shrink-0 h-full">
          <div className={`h-full border-r flex flex-col ${
            theme === 'light' 
              ? 'bg-white border-gray-200' 
              : 'bg-gray-800 border-gray-700'
          }`}>
            <div className={`px-4 py-3 border-b ${
              theme === 'light' 
                ? 'border-gray-200' 
                : 'border-gray-700'
            }`}>
              <h3 className={`font-medium ${
                theme === 'light' 
                  ? 'text-gray-900' 
                  : 'text-gray-100'
              }`}>项目文件</h3>
            </div>
            <div className="flex-1 overflow-hidden">
              <FileTree
                data={treeData}
                selectedFileId={selectedFileId}
                onFileSelect={handleFileSelect}
              />
            </div>
          </div>
        </div>

        {/* 右侧代码编辑器 */}
        <div className="flex-1 flex flex-col h-full">
          <AnimatePresence mode="wait">
            {currentFile && (
              <motion.div
                key={selectedFileId}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col"
              >
                {/* 文件信息栏 */}
                <div className={`px-4 py-3 border-b flex items-center justify-between ${
                  theme === 'light' 
                    ? 'bg-white border-gray-200' 
                    : 'bg-gray-800 border-gray-700'
                }`}>
                  <div className="flex items-center gap-2">
                    <FileCode className={`w-4 h-4 ${
                      theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                    }`} />
                    <h3 className={`font-medium ${
                      theme === 'light' ? 'text-gray-900' : 'text-gray-100'
                    }`}>{currentFile.filename}</h3>
                    <Badge variant="secondary" className={`text-xs ${
                      theme === 'light' 
                        ? 'text-gray-700 bg-gray-100' 
                        : 'text-gray-400 bg-gray-700'
                    }`}>
                      {currentFile.language}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={cn("text-xs px-1.5 py-0.5", getFileTypeColor(currentFile.type || 'default'))}
                    >
                      {currentFile.type}
                    </Badge>
                  </div>

                  {/* 删除按钮 */}
                  {onFileDelete && files.length > 1 && (
                    <button
                      onClick={() => onFileDelete(currentFile.filename)}
                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded text-red-500 dark:text-red-400 transition-colors"
                      title="删除文件"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Monaco 编辑器 */}
                <div className="flex-1">
                  <Editor
                    height="100%"
                    language={getMonacoLanguage(currentFile.filename, currentFile.language)}
                    value={currentFileDisplayContent}
                    onChange={handleCodeChange}
                    theme={theme === 'dark' ? 'vs-dark' : 'vs-light'}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      lineNumbers: 'on',
                      roundedSelection: false,
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      tabSize: 2,
                      insertSpaces: true,
                      wordWrap: 'on',
                      folding: true,
                      lineDecorationsWidth: 0,
                      lineNumbersMinChars: 3,
                      glyphMargin: false,
                      renderLineHighlight: 'line',
                      selectOnLineNumbers: true,
                      matchBrackets: 'always',
                      autoIndent: 'full',
                      formatOnPaste: true,
                      formatOnType: true,
                      suggestOnTriggerCharacters: true,
                      acceptSuggestionOnEnter: 'on',
                      quickSuggestions: true,
                      parameterHints: { enabled: true },
                      hover: { enabled: true },
                      // 🌊 流式状态下禁用编辑
                      readOnly: isStreaming
                    }}
                    loading={
                      <div className="flex items-center justify-center h-full">
                        <div className="text-gray-500 dark:text-gray-400">加载编辑器中...</div>
                      </div>
                    }
                  />
                </div>

                {/* 编辑器状态栏 - 显示文件统计信息 */}
                <div className={`px-4 py-2 border-t flex items-center justify-between text-xs ${
                  theme === 'light' 
                    ? 'bg-gray-50 border-gray-200 text-gray-600' 
                    : 'bg-gray-800 border-gray-700 text-gray-400'
                }`}>
                  <div className="flex items-center gap-4">
                    <span title="总行数">行 {currentFileDisplayContent.split('\n').length}</span>
                    <span title="字符数">字符 {currentFileDisplayContent.length}</span>
                    <span title="文件类型">{getMonacoLanguage(currentFile.filename, currentFile.language)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isStreaming ? (
                      <span className={`flex items-center gap-1 ${
                        theme === 'light' 
                          ? 'text-blue-600' 
                          : 'text-blue-400'
                      }`}>
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        >
                          ●
                        </motion.div>
                        流式生成中
                      </span>
                    ) : (
                      <span className={`${
                        theme === 'light' 
                          ? 'text-green-600' 
                          : 'text-green-400'
                      }`}>● 已保存</span>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 预览部分 */}
      {actualShowPreview && (
        <div className="w-1/2 border-l border-gray-200 dark:border-gray-700">
          <VercelPreview
            files={files}
            projectName={projectName}
            description={description}
            isLoading={isLoading}
            previewUrl={previewUrl}

            onPreviewReady={setPreviewUrl}
            onLoadingChange={setIsLoading}
            onRefresh={() => {
              console.log('🔄 [CodeEditorPanel] 刷新请求，重新部署...');
              // 这里会触发VercelPreview内部的重新部署逻辑
            }}
          />
        </div>
      )}
    </div>
  );
}

export default CodeEditorPanel; 