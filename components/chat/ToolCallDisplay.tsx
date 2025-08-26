'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Terminal, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  FileText,
  Edit3,
  FolderPlus,
  Search,
  Code,
  Loader2,
  ChevronDown,
  Wrench
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ToolCallDisplayProps {
  toolName: string;
  toolCallId: string;
  state: 'input-streaming' | 'input-available' | 'output-available' | 'output-error';
  input?: any;
  output?: any;
  errorText?: string;
  className?: string;
}

// 工具图标映射
const getToolIcon = (toolName: string) => {
  const iconMap: Record<string, React.ComponentType<any>> = {
    'read_file': FileText,
    'write_file': Edit3,
    'create_file': FolderPlus,
    'edit_file': Edit3,
    'append_to_file': Edit3,
    'delete_file': AlertCircle,
    'search_code': Search,
    'get_file_structure': Code,
    'run_command': Terminal,
  };
  
  return iconMap[toolName] || Terminal;
};

// 工具名称映射
const getToolDisplayName = (toolName: string) => {
  const nameMap: Record<string, string> = {
    'read_file': '读取文件',
    'write_file': '写入文件',
    'create_file': '创建文件',
    'edit_file': '编辑文件',
    'append_to_file': '追加文件',
    'delete_file': '删除文件',
    'search_code': '搜索代码',
    'get_file_structure': '获取文件结构',
    'run_command': '执行命令',
  };
  
  return nameMap[toolName] || toolName;
};

// 状态配置
const getStateConfig = (state: string) => {
  switch (state) {
    case 'input-streaming':
      return {
        color: 'text-blue-500',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        borderColor: 'border-blue-200 dark:border-blue-700',
        icon: Loader2,
        label: '准备中',
        spinning: true
      };
    case 'input-available':
      return {
        color: 'text-orange-500',
        bgColor: 'bg-orange-50 dark:bg-orange-900/20',
        borderColor: 'border-orange-200 dark:border-orange-700',
        icon: Play,
        label: '执行中',
        spinning: false
      };
    case 'output-available':
      return {
        color: 'text-green-500',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        borderColor: 'border-green-200 dark:border-green-700',
        icon: CheckCircle2,
        label: '完成',
        spinning: false
      };
    case 'output-error':
      return {
        color: 'text-red-500',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        borderColor: 'border-red-200 dark:border-red-700',
        icon: AlertCircle,
        label: '错误',
        spinning: false
      };
    default:
      return {
        color: 'text-gray-500',
        bgColor: 'bg-gray-50 dark:bg-gray-900/20',
        borderColor: 'border-gray-200 dark:border-gray-700',
        icon: Terminal,
        label: '未知',
        spinning: false
      };
  }
};

export function ToolCallDisplay({
  toolName,
  toolCallId,
  state,
  input,
  output,
  errorText,
  className
}: ToolCallDisplayProps) {
  const ToolIcon = getToolIcon(toolName);
  const stateConfig = getStateConfig(state);
  const StateIcon = stateConfig.icon;
  const displayName = getToolDisplayName(toolName);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('my-2', className)}
    >
      <Card className={cn(
        'border-l-4 transition-all duration-200',
        stateConfig.borderColor,
        stateConfig.bgColor
      )}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-3 text-sm">
            {/* 工具图标 */}
            <div className={cn(
              'p-2 rounded-lg',
              stateConfig.bgColor,
              stateConfig.borderColor,
              'border'
            )}>
              <ToolIcon className={cn('w-4 h-4', stateConfig.color)} />
            </div>
            
            {/* 工具名称 */}
            <div className="flex-1">
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {displayName}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                {toolName}
              </div>
            </div>
            
            {/* 状态指示器 */}
            <div className="flex items-center gap-2">
              <StateIcon 
                className={cn(
                  'w-4 h-4',
                  stateConfig.color,
                  stateConfig.spinning && 'animate-spin'
                )} 
              />
              <Badge 
                variant="outline" 
                className={cn(
                  'text-xs',
                  stateConfig.color,
                  stateConfig.borderColor
                )}
              >
                {stateConfig.label}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="pt-0 space-y-3">
          {/* 输入参数 */}
          {(state === 'input-available' || state === 'output-available' || state === 'output-error') && input && (
            <div>
              <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1">
                <Play className="w-3 h-3" />
                输入参数
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-md p-3 border">
                <pre className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap overflow-x-auto">
                  {typeof input === 'string' ? input : JSON.stringify(input, null, 2)}
                </pre>
              </div>
            </div>
          )}
          
          {/* 输出结果 */}
          {state === 'output-available' && output && (
            <div>
              <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                执行结果
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-md p-3 border border-green-200 dark:border-green-700">
                <pre className="text-xs text-green-800 dark:text-green-200 whitespace-pre-wrap overflow-x-auto">
                  {typeof output === 'string' ? output : JSON.stringify(output, null, 2)}
                </pre>
              </div>
            </div>
          )}
          
          {/* 错误信息 */}
          {state === 'output-error' && errorText && (
            <div>
              <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                错误信息
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-md p-3 border border-red-200 dark:border-red-700">
                <pre className="text-xs text-red-800 dark:text-red-200 whitespace-pre-wrap overflow-x-auto">
                  {errorText}
                </pre>
              </div>
            </div>
          )}
          
          {/* 流式输入状态 */}
          {state === 'input-streaming' && (
            <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              正在接收工具参数...
            </div>
          )}
          
          {/* 工具调用ID（调试信息） */}
          <div className="text-xs text-gray-400 dark:text-gray-500 font-mono border-t pt-2">
            ID: {toolCallId}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// 工具调用列表组件
interface ToolCallListProps {
  toolCalls: Array<{
    toolName: string;
    toolCallId: string;
    state: 'input-streaming' | 'input-available' | 'output-available' | 'output-error';
    input?: any;
    output?: any;
    errorText?: string;
  }>;
  className?: string;
}

export function ToolCallList({ toolCalls, className }: ToolCallListProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!toolCalls || toolCalls.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-1', className)}>
      {/* 每个工具调用一行显示 */}
      {toolCalls.map((toolCall, index) => {
        const ToolIcon = getToolIcon(toolCall.toolName);
        const stateConfig = getStateConfig(toolCall.state);
        const displayName = getToolDisplayName(toolCall.toolName);
        
        return (
          <motion.div
            key={`${toolCall.toolCallId}-${index}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: index * 0.1 }}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg border transition-all duration-200",
              toolCall.state === 'output-available' 
                ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700"
                : toolCall.state === 'output-error'
                ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700"
                : "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
            )}
          >
            {/* 工具图标 */}
            <div className={cn(
              'p-1.5 rounded-md',
              stateConfig.bgColor,
              stateConfig.borderColor,
              'border'
            )}>
              <ToolIcon className={cn('w-3 h-3', stateConfig.color)} />
            </div>
            
            {/* 工具信息 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {displayName}
                </span>
                <Badge 
                  variant={toolCall.state === 'output-available' ? 'default' : 
                          toolCall.state === 'output-error' ? 'destructive' : 'secondary'}
                  className="text-xs"
                >
                  {stateConfig.label}
                </Badge>
              </div>
              {toolCall.input && (
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {typeof toolCall.input === 'string' 
                    ? toolCall.input 
                    : JSON.stringify(toolCall.input).substring(0, 50) + '...'
                  }
                </div>
              )}
            </div>
            
            {/* 状态指示器 */}
            <div className="flex items-center">
              {stateConfig.spinning ? (
                <Loader2 className={cn('w-4 h-4 animate-spin', stateConfig.color)} />
              ) : (
                <stateConfig.icon className={cn('w-4 h-4', stateConfig.color)} />
              )}
            </div>
          </motion.div>
        );
      })}
      
      {/* 可选的详细展开面板 - 只在有多个工具调用时显示 */}
      {toolCalls.length > 1 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full mt-2 px-3 py-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center justify-center gap-1 transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-gray-700/50"
        >
          <span>{isExpanded ? '收起详情' : '查看详情'}</span>
          <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
      )}
      
      {/* 展开的详细内容 */}
      {isExpanded && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-2 space-y-2"
        >
          {toolCalls.map((toolCall, index) => (
            <ToolCallDisplay
              key={`${toolCall.toolCallId}-detail-${index}`}
              {...toolCall}
              className="bg-white dark:bg-gray-900 border-l-4"
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}
