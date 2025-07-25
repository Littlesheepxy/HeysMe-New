"use client"

import { useState } from "react"
import { AlertCircle, RotateCcw, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ErrorHandlerProps {
  error: string | null
  retryCount: number
  maxRetries?: number
  onRetry: () => void
  onReset?: () => void
  showResetOption?: boolean
}

export function ErrorHandler({
  error,
  retryCount,
  maxRetries = 3,
  onRetry,
  onReset,
  showResetOption = true
}: ErrorHandlerProps) {
  const [isRetrying, setIsRetrying] = useState(false)

  if (!error) return null

  const handleRetry = async () => {
    setIsRetrying(true)
    try {
      await onRetry()
    } finally {
      setIsRetrying(false)
    }
  }

  const canRetry = retryCount < maxRetries
  const isMaxRetriesReached = retryCount >= maxRetries

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex flex-col gap-3">
        <div>
          <strong>操作失败:</strong> {error}
        </div>
        
        {retryCount > 0 && (
          <div className="text-sm opacity-75">
            已重试 {retryCount}/{maxRetries} 次
          </div>
        )}

        <div className="flex gap-2">
          {canRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              disabled={isRetrying}
              className="gap-2"
            >
              {isRetrying ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <RotateCcw className="h-3 w-3" />
              )}
              {isRetrying ? '重试中...' : '重试'}
            </Button>
          )}

          {(isMaxRetriesReached || showResetOption) && onReset && (
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              className="gap-2"
            >
              <RefreshCw className="h-3 w-3" />
              重新开始
            </Button>
          )}
        </div>

        {isMaxRetriesReached && (
          <div className="text-sm text-muted-foreground">
            💡 建议：如果问题持续，请尝试重新开始对话或联系技术支持
          </div>
        )}
      </AlertDescription>
    </Alert>
  )
}

// 错误分类和处理建议
export function getErrorSuggestion(error: string): string {
  if (error.includes('网络') || error.includes('fetch')) {
    return '网络连接问题，请检查您的网络连接后重试'
  }
  
  if (error.includes('AI') || error.includes('LLM')) {
    return 'AI服务暂时不可用，请稍后重试'
  }
  
  if (error.includes('Session') || error.includes('会话')) {
    return '会话出现问题，建议重新开始对话'
  }
  
  if (error.includes('timeout') || error.includes('超时')) {
    return '请求超时，请重试或简化您的请求'
  }
  
  return '系统遇到问题，请重试或重新开始'
} 