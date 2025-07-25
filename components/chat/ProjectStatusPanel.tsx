'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Sparkles, 
  Clock,
  Settings,
  Folder,
  Zap
} from 'lucide-react';

interface ProjectStatusPanelProps {
  codingContext: {
    currentFiles: Array<{path: string, content: string, language: string}>;
    projectType: string;
    framework: string;
    lastModifiedFiles: string[];
    userIntent?: string;
    dependencies: Record<string, string>;
  };
  isCodingMode: boolean;
  isStreaming: boolean;
  activeTools: string[];
  className?: string;
}

export function ProjectStatusPanel({ 
  codingContext, 
  isCodingMode,
  isStreaming,
  activeTools,
  className = '' 
}: ProjectStatusPanelProps) {
  const {
    currentFiles,
    projectType,
    framework,
    lastModifiedFiles,
    userIntent,
    dependencies
  } = codingContext;

  if (!isCodingMode) {
    return null;
  }

  const fileCount = currentFiles.length;
  const hasProject = fileCount > 0;

  const getStatusMessage = (): string => {
    if (isStreaming) {
      return '正在为您创建内容...';
    } else if (activeTools.length > 0) {
      return '正在处理您的请求...';
    } else if (hasProject) {
      return '项目已准备好，请告诉我您想要添加什么功能';
    } else {
      return '请描述您想要创建的应用或网站';
    }
  };

  const getIntentDisplay = (intent: string): string => {
    if (!intent) return '等待您的指示';
    
    // 用户友好的意图显示
    const intentMap: Record<string, string> = {
      '用户想要创建新功能': '🎯 准备添加新功能',
      '用户想要修改现有功能': '🔧 准备改进现有功能',
      '用户想要删除功能': '🗑️ 准备移除功能',
      '用户想要改进界面设计': '🎨 准备美化界面',
      '用户想要修复问题': '🔍 准备修复问题',
      '用户想要改进应用': '✨ 准备优化应用'
    };
    
    return intentMap[intent] || '💭 理解您的需求中...';
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Sparkles className="w-4 h-4 text-blue-500" />
          项目助手
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* 当前状态 */}
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 text-blue-800">
            {isStreaming ? (
              <Settings className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">
              {getStatusMessage()}
            </span>
          </div>
        </div>

        {/* 项目信息 */}
        {hasProject && (
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-2 bg-gray-50 rounded-lg">
              <div className="text-lg font-semibold text-gray-700">{fileCount}</div>
              <div className="text-xs text-gray-500">文件数量</div>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-gray-700 truncate">
                {projectType || '通用项目'}
              </div>
              <div className="text-xs text-gray-500">项目类型</div>
            </div>
          </div>
        )}

        {/* 框架信息 */}
        {framework && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">使用技术:</span>
            <Badge variant="secondary" className="text-xs">
              {framework}
            </Badge>
          </div>
        )}

        {/* 用户意图 */}
        {userIntent && (
          <div className="space-y-1">
            <div className="text-xs text-gray-500">当前任务:</div>
            <div className="text-sm text-gray-700 flex items-center gap-2">
              <span>{getIntentDisplay(userIntent)}</span>
            </div>
          </div>
        )}

        {/* 最近修改的文件 */}
        {lastModifiedFiles.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3 text-gray-500" />
              <span className="text-xs text-gray-500">最近处理的文件:</span>
            </div>
            <div className="space-y-1">
              {lastModifiedFiles.slice(0, 3).map((file, index) => (
                <div key={index} className="flex items-center gap-2 text-xs">
                  <FileText className="w-3 h-3 text-gray-400" />
                  <span className="text-gray-600 truncate">{file}</span>
                </div>
              ))}
              {lastModifiedFiles.length > 3 && (
                <div className="text-xs text-gray-400 text-center">
                  还有 {lastModifiedFiles.length - 3} 个文件...
                </div>
              )}
            </div>
          </div>
        )}

        {/* 快捷操作提示 */}
        {!isStreaming && (
          <div className="pt-2 border-t border-gray-200">
            <div className="text-xs text-gray-500 mb-2">您可以说:</div>
            <div className="space-y-1">
              {!hasProject ? (
                <>
                  <div className="text-xs text-gray-600">• "创建一个个人博客网站"</div>
                  <div className="text-xs text-gray-600">• "制作一个在线商店"</div>
                  <div className="text-xs text-gray-600">• "开发一个任务管理应用"</div>
                </>
              ) : (
                <>
                  <div className="text-xs text-gray-600">• "添加用户登录功能"</div>
                  <div className="text-xs text-gray-600">• "改进页面设计"</div>
                  <div className="text-xs text-gray-600">• "增加搜索功能"</div>
                </>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 