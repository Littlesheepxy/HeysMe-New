'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Terminal, 
  Code2, 
  FileText, 
  Wrench, 
  Eye, 
  EyeOff,
  Send,
  RefreshCw,
  Folder,
  File
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CodeFile {
  path: string;
  content: string;
  language: string;
}

interface CodingModeUIProps {
  isStreaming: boolean;
  inputMessage: string;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  activeTools: string[];
  codeFiles: CodeFile[];
  showFileTree: boolean;
  onToggleFileTree: () => void;
  onFileSelect?: (file: CodeFile) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

export function CodingModeUI({
  isStreaming,
  inputMessage,
  onInputChange,
  onSubmit,
  activeTools,
  codeFiles,
  showFileTree,
  onToggleFileTree,
  onFileSelect,
  textareaRef
}: CodingModeUIProps) {

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit(e as any);
    }
  };

  return (
    <div className="space-y-4">
      {/* Coding 模式状态栏 */}
      <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">AI 助手正在帮您创建应用</span>
          
          {/* 活跃工具指示器 */}
          {activeTools.length > 0 && (
            <div className="flex items-center gap-1 ml-4">
              <Wrench className="w-3 h-3 text-orange-500 animate-pulse" />
              <span className="text-xs text-orange-600">
                正在处理您的请求...
              </span>
            </div>
          )}
        </div>
        
        {/* 文件树切换按钮 */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleFileTree}
          className="text-blue-600 hover:text-blue-800"
        >
          {showFileTree ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {showFileTree ? '隐藏' : '显示'}文件
        </Button>
      </div>

      {/* 文件树面板 */}
      {showFileTree && codeFiles.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Folder className="w-4 h-4" />
              您的文件 ({codeFiles.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-40">
              <div className="space-y-1">
                {codeFiles.map((file, index) => (
                  <div
                    key={index}
                    onClick={() => onFileSelect?.(file)}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-md cursor-pointer",
                      "hover:bg-gray-100 transition-colors"
                    )}
                  >
                    <File className="w-3 h-3 text-gray-500" />
                    <span className="text-sm text-gray-700 flex-1">{file.path}</span>
                    <Badge variant="secondary" className="text-xs">
                      {file.language}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* 输入区域 - 针对编程优化 */}
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={inputMessage}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="告诉我您想要创建什么样的应用或网站..."
            disabled={isStreaming}
            className="min-h-[120px] resize-none font-mono text-sm"
            rows={5}
          />
          
          {/* 快捷提示 */}
          <div className="absolute bottom-2 left-2 text-xs text-gray-400">
            <kbd className="px-1 py-0.5 text-xs bg-gray-100 border rounded">Enter</kbd> 发送
            <span className="mx-1">·</span>
            <kbd className="px-1 py-0.5 text-xs bg-gray-100 border rounded">Shift+Enter</kbd> 换行
          </div>
        </div>
        
        {/* 操作按钮 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* 工具状态指示器 */}
            {activeTools.map((tool, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                <Terminal className="w-3 h-3 mr-1" />
                {tool}
              </Badge>
            ))}
          </div>
          
          <div className="flex items-center gap-2">
            {/* 常用操作快捷按钮 */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onInputChange("请帮我创建一个新的页面")}
              disabled={isStreaming}
            >
              <Code2 className="w-4 h-4 mr-1" />
              新页面
            </Button>
            
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onInputChange("请帮我改进现有的功能")}
              disabled={isStreaming}
            >
              <Wrench className="w-4 h-4 mr-1" />
              改进
            </Button>
            
            {/* 发送按钮 */}
            <Button
              type="submit"
              disabled={isStreaming || !inputMessage.trim()}
              className="px-6"
            >
              {isStreaming ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {isStreaming ? '处理中...' : '发送'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
} 