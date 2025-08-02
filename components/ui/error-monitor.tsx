"use client"

import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Copy, RefreshCw, X, ExternalLink, Bug } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { VercelBuildError } from '@/lib/services/vercel-error-monitor';

interface ErrorMonitorProps {
  isVisible: boolean;
  onClose: () => void;
  onCopyToInput?: (errorMessage: string) => void;
  errors: VercelBuildError[];
  isMonitoring: boolean;
  onToggleMonitoring: () => void;
  onCheckLatest: () => void;
  isChecking?: boolean;
}

export function ErrorMonitor({
  isVisible,
  onClose,
  onCopyToInput,
  errors,
  isMonitoring,
  onToggleMonitoring,
  onCheckLatest,
  isChecking = false
}: ErrorMonitorProps) {
  const [selectedError, setSelectedError] = useState<VercelBuildError | null>(null);

  // 当有新错误时自动选择最新的
  useEffect(() => {
    if (errors.length > 0 && !selectedError) {
      setSelectedError(errors[0]);
    }
  }, [errors, selectedError]);

  const handleCopyError = useCallback((error: VercelBuildError) => {
    const errorText = `以下是错误信息：\n\n文件: ${error.file || '未知'}\n行号: ${error.line || '未知'}\n错误: ${error.message}\n\n请帮我进行修改`;
    
    if (onCopyToInput) {
      onCopyToInput(errorText);
    } else {
      navigator.clipboard.writeText(errorText);
    }
  }, [onCopyToInput]);

  const getErrorTypeColor = (type: VercelBuildError['type']) => {
    switch (type) {
      case 'syntax': return 'bg-red-100 text-red-800';
      case 'compilation': return 'bg-orange-100 text-orange-800';
      case 'runtime': return 'bg-yellow-100 text-yellow-800';
      case 'build': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getErrorTypeLabel = (type: VercelBuildError['type']) => {
    switch (type) {
      case 'syntax': return '语法错误';
      case 'compilation': return '编译错误';
      case 'runtime': return '运行时错误';
      case 'build': return '构建错误';
      default: return '未知错误';
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-gray-900">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bug className="w-5 h-5" />
              <CardTitle>Vercel 错误监控</CardTitle>
              <Badge variant={isMonitoring ? "default" : "secondary"}>
                {isMonitoring ? '监控中' : '已停止'}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onCheckLatest}
                disabled={isChecking}
              >
                <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
                检查最新
              </Button>
              <Button
                variant={isMonitoring ? "destructive" : "default"}
                size="sm"
                onClick={onToggleMonitoring}
              >
                {isMonitoring ? '停止监控' : '开始监控'}
              </Button>
              <Button variant="outline" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <CardDescription>
            实时监控 Vercel 部署错误，提供智能修复建议
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[60vh]">
            {/* 错误列表 */}
            <div className="space-y-2">
              <h3 className="font-medium text-sm text-muted-foreground">
                错误列表 ({errors.length})
              </h3>
              <ScrollArea className="h-full border rounded-lg">
                <div className="p-2 space-y-2">
                  {errors.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>暂无检测到错误</p>
                      <p className="text-xs mt-1">系统将自动监控新的部署错误</p>
                    </div>
                  ) : (
                    errors.map((error) => (
                      <div
                        key={error.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedError?.id === error.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:bg-muted/50'
                        }`}
                        onClick={() => setSelectedError(error)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <Badge className={getErrorTypeColor(error.type)}>
                            {getErrorTypeLabel(error.type)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {error.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-sm font-medium line-clamp-2">
                            {error.message}
                          </p>
                          {error.file && (
                            <p className="text-xs text-muted-foreground">
                              {error.file}
                              {error.line && `:${error.line}`}
                              {error.column && `:${error.column}`}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* 错误详情 */}
            <div className="space-y-2">
              <h3 className="font-medium text-sm text-muted-foreground">
                错误详情
              </h3>
              <div className="border rounded-lg h-full">
                {selectedError ? (
                  <ScrollArea className="h-full">
                    <div className="p-4 space-y-4">
                      {/* 基本信息 */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Badge className={getErrorTypeColor(selectedError.type)}>
                            {getErrorTypeLabel(selectedError.type)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {selectedError.timestamp.toLocaleString()}
                          </span>
                        </div>
                        
                        <h4 className="font-medium mb-2">错误信息</h4>
                        <p className="text-sm bg-muted p-3 rounded font-mono">
                          {selectedError.message}
                        </p>
                      </div>

                      {/* 文件信息 */}
                      {selectedError.file && (
                        <div>
                          <h4 className="font-medium mb-2">文件位置</h4>
                          <div className="text-sm bg-muted p-3 rounded">
                            <div className="font-mono">{selectedError.file}</div>
                            {selectedError.line && (
                              <div className="text-muted-foreground mt-1">
                                行 {selectedError.line}
                                {selectedError.column && `, 列 ${selectedError.column}`}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* 修复建议 */}
                      {selectedError.suggestion && (
                        <div>
                          <h4 className="font-medium mb-2">修复建议</h4>
                          <Alert>
                            <AlertTriangle className="w-4 h-4" />
                            <AlertDescription>
                              {selectedError.suggestion}
                            </AlertDescription>
                          </Alert>
                        </div>
                      )}

                      {/* 部署信息 */}
                      <div>
                        <h4 className="font-medium mb-2">部署信息</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">部署 ID:</span>
                            <span className="font-mono">{selectedError.deploymentId}</span>
                          </div>
                          {selectedError.deploymentUrl && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">部署 URL:</span>
                              <a 
                                href={`https://${selectedError.deploymentUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-primary hover:underline"
                              >
                                {selectedError.deploymentUrl}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 操作按钮 */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          onClick={() => handleCopyError(selectedError)}
                          size="sm"
                          className="flex-1"
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          复制错误到输入框
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(selectedError.source);
                          }}
                        >
                          复制原始错误
                        </Button>
                      </div>

                      {/* 原始错误信息 */}
                      <details className="mt-4">
                        <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
                          查看原始错误信息
                        </summary>
                        <pre className="mt-2 text-xs bg-muted p-3 rounded overflow-x-auto">
                          {selectedError.source}
                        </pre>
                      </details>
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>选择左侧错误查看详情</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}