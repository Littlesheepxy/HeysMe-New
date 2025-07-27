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
}

export function CodeEditorPanel({
  files,
  onFileUpdate,
  onFileAdd,
  onFileDelete,
  projectName = 'HeysMe Project',
  description,
  showPreview = false
}: CodeEditorPanelProps) {
  const [selectedFileId, setSelectedFileId] = useState<string>(files[0]?.filename || '');
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { theme } = useTheme();
  


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

  // 处理文件选择
  const handleFileSelect = useCallback((fileId: string) => {
    setSelectedFileId(fileId);
  }, []);

  // 处理代码编辑
  const handleCodeChange = useCallback((value: string | undefined) => {
    if (currentFile && value !== undefined) {
      onFileUpdate(currentFile.filename, value);
    }
  }, [currentFile, onFileUpdate]);

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
          <p className="text-gray-600 dark:text-gray-400 mb-4">暂无代码文件</p>
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
      <div className={`${showPreview ? 'w-1/2' : 'w-full'} transition-all duration-300`}>
        {/* 左侧文件树 */}
        <div className="w-80 flex-shrink-0">
          <div className={`h-full border-r ${
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
            <FileTree
              data={treeData}
              selectedFileId={selectedFileId}
              onFileSelect={handleFileSelect}
            />
          </div>
        </div>

        {/* 右侧代码编辑器 */}
        <div className="flex-1 flex flex-col">
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
                    value={currentFile.content}
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
                      hover: { enabled: true }
                    }}
                    loading={
                      <div className="flex items-center justify-center h-full">
                        <div className="text-gray-500 dark:text-gray-400">加载编辑器中...</div>
                      </div>
                    }
                  />
                </div>

                {/* 状态栏 */}
                <div className={`px-4 py-2 border-t flex items-center justify-between text-xs ${
                  theme === 'light' 
                    ? 'bg-gray-50 border-gray-200 text-gray-600' 
                    : 'bg-gray-800 border-gray-700 text-gray-400'
                }`}>
                  <div className="flex items-center gap-4">
                    <span>行 {currentFile.content.split('\n').length}</span>
                    <span>字符 {currentFile.content.length}</span>
                    <span>{getMonacoLanguage(currentFile.filename, currentFile.language)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`${
                      theme === 'light' 
                        ? 'text-green-600' 
                        : 'text-green-400'
                    }`}>● 已保存</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 预览部分 */}
      {showPreview && (
        <div className="w-1/2 border-l border-gray-200 dark:border-gray-700">
          <VercelPreview
            files={files}
            projectName={projectName}
            description={description}
            isLoading={isLoading}
            previewUrl={previewUrl}
            enableVercelDeploy={true}
            onPreviewReady={setPreviewUrl}
            onLoadingChange={setIsLoading}
          />
        </div>
      )}
    </div>
  );
}

export default CodeEditorPanel; 