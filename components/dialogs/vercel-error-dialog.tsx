"use client"

import { useState } from 'react';
import { AlertTriangle, Copy, ExternalLink, Clock, Code, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { VercelErrorInfo } from '@/hooks/use-vercel-deployment';

interface VercelErrorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  errorInfo: VercelErrorInfo;
  onRetry?: () => void;
  onCopyError?: () => void;
}

export function VercelErrorDialog({
  open,
  onOpenChange,
  errorInfo,
  onRetry,
  onCopyError
}: VercelErrorDialogProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyError = () => {
    const errorText = `Vercel部署错误报告
    
时间: ${errorInfo.timestamp || new Date().toLocaleString()}
部署ID: ${errorInfo.deploymentId || '未知'}
部署状态: ${errorInfo.deploymentState || '未知'}
错误信息: ${errorInfo.message}

${errorInfo.errorDetails ? `详细错误:\n${errorInfo.errorDetails}` : ''}

${errorInfo.deploymentUrl ? `部署链接: ${errorInfo.deploymentUrl}` : ''}
`;

    navigator.clipboard.writeText(errorText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });

    onCopyError?.();
  };

  const getStateColor = (state?: string) => {
    switch (state) {
      case 'ERROR': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'CANCELED': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default: return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    }
  };

  const getStateIcon = (state?: string) => {
    switch (state) {
      case 'ERROR': return '❌';
      case 'CANCELED': return '⏹️';
      default: return '⚠️';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <DialogTitle className="text-red-600 dark:text-red-400">
              Vercel 部署失败
            </DialogTitle>
            {errorInfo.deploymentState && (
              <Badge className={getStateColor(errorInfo.deploymentState)}>
                {getStateIcon(errorInfo.deploymentState)} {errorInfo.deploymentState}
              </Badge>
            )}
          </div>
          <DialogDescription>
            部署过程中出现错误，请查看详细信息并尝试解决。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 基本错误信息 */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>错误信息：</strong> {errorInfo.message}
            </AlertDescription>
          </Alert>

          {/* 部署信息 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {errorInfo.deploymentId && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    部署 ID
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <code className="text-xs bg-muted p-2 rounded block break-all">
                    {errorInfo.deploymentId}
                  </code>
                </CardContent>
              </Card>
            )}

            {errorInfo.timestamp && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    发生时间
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {new Date(errorInfo.timestamp).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* 详细错误信息 */}
          {errorInfo.errorDetails && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  详细错误信息
                </CardTitle>
                <CardDescription>
                  构建过程中的具体错误详情
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-32">
                  <pre className="text-xs bg-muted p-3 rounded whitespace-pre-wrap">
                    {errorInfo.errorDetails}
                  </pre>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* 操作按钮 */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            {onRetry && (
              <Button onClick={onRetry} className="flex-1">
                重试部署
              </Button>
            )}
            
            <Button 
              variant="outline" 
              onClick={handleCopyError}
              className="flex-1"
            >
              <Copy className="h-4 w-4 mr-2" />
              {copied ? '已复制!' : '复制错误信息'}
            </Button>

            {errorInfo.deploymentUrl && (
              <Button 
                variant="outline" 
                onClick={() => window.open(errorInfo.deploymentUrl, '_blank')}
                className="flex-1"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                查看部署
              </Button>
            )}
          </div>

          {/* 帮助提示 */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>💡 解决建议：</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• 检查代码中是否有语法错误或编译问题</li>
                <li>• 确认所有依赖项都在 package.json 中正确声明</li>
                <li>• 查看构建命令和环境变量配置</li>
                <li>• 如果问题持续，可以复制错误信息寻求技术支持</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>
      </DialogContent>
    </Dialog>
  );
}
