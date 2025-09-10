"use client"

import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Loader2, Bug, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export interface VercelDeploymentStatus {
  status: 'building' | 'ready' | 'error' | 'queued' | 'canceled';
  url?: string;
  deploymentId?: string;
  updatedAt: Date;
  errorCount?: number;
}

interface VercelStatusIndicatorProps {
  status: VercelDeploymentStatus;
  onShowErrors?: () => void;
  onOpenDeployment?: (url: string) => void;
  className?: string;
}

export function VercelStatusIndicator({
  status,
  onShowErrors,
  onOpenDeployment,
  className = ''
}: VercelStatusIndicatorProps) {
  const [isBlinking, setIsBlinking] = useState(false);

  // 当状态为构建中时，添加闪烁效果
  useEffect(() => {
    if (status.status === 'building') {
      setIsBlinking(true);
      const timer = setTimeout(() => setIsBlinking(false), 5000);
      return () => clearTimeout(timer);
    } else {
      setIsBlinking(false);
    }
  }, [status.status]);

  const getStatusConfig = () => {
    switch (status.status) {
      case 'building':
        return {
          icon: <Loader2 className="w-4 h-4 animate-spin" />,
          text: '部署中',
          variant: 'secondary' as const,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50 border-blue-200'
        };
      case 'ready':
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          text: '部署成功',
          variant: 'default' as const,
          color: 'text-green-600',
          bgColor: 'bg-green-50 border-green-200'
        };
      case 'error':
        return {
          icon: <AlertTriangle className="w-4 h-4" />,
          text: '部署失败',
          variant: 'destructive' as const,
          color: 'text-red-600',
          bgColor: 'bg-red-50 border-red-200'
        };
      case 'queued':
        return {
          icon: <Loader2 className="w-4 h-4" />,
          text: '排队中',
          variant: 'secondary' as const,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50 border-gray-200'
        };
      case 'canceled':
        return {
          icon: <AlertTriangle className="w-4 h-4" />,
          text: '已取消',
          variant: 'secondary' as const,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50 border-gray-200'
        };
      default:
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          text: '未知状态',
          variant: 'secondary' as const,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50 border-gray-200'
        };
    }
  };

  const statusConfig = getStatusConfig();
  const hasErrors = status.errorCount && status.errorCount > 0;

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 83200000);

    if (days > 0) return `${days}天前`;
    if (hours > 0) return `${hours}小时前`;
    if (minutes > 0) return `${minutes}分钟前`;
    return '刚刚';
  };

  return (
    <TooltipProvider>
      <div className={`flex items-center gap-2 ${className}`}>
        {/* 状态指示器 */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all
                ${statusConfig.bgColor}
                ${isBlinking ? 'animate-pulse' : ''}
              `}
            >
              <span className={statusConfig.color}>
                {statusConfig.icon}
              </span>
              <span className={`text-sm font-medium ${statusConfig.color}`}>
                {statusConfig.text}
              </span>
              
              {/* 错误计数 */}
              {hasErrors && (
                <Badge variant="destructive" className="ml-1 text-xs">
                  {status.errorCount}
                </Badge>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-xs">
              <div>部署状态: {statusConfig.text}</div>
              <div>更新时间: {formatTimeAgo(status.updatedAt)}</div>
              {status.deploymentId && (
                <div>部署 ID: {status.deploymentId.slice(0, 8)}...</div>
              )}
              {hasErrors && (
                <div className="text-red-400">检测到 {status.errorCount} 个错误</div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>

        {/* 操作按钮 */}
        <div className="flex items-center gap-1">
          {/* 查看错误按钮 */}
          {hasErrors && onShowErrors && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onShowErrors}
                  className="h-7 w-7 p-0"
                >
                  <Bug className="w-3 h-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                查看构建错误
              </TooltipContent>
            </Tooltip>
          )}

          {/* 访问部署按钮 */}
          {status.url && status.status === 'ready' && onOpenDeployment && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenDeployment(status.url!)}
                  className="h-7 w-7 p-0"
                >
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                访问部署
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}