"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, XCircle, Loader2, Gift } from 'lucide-react'

interface InviteCodeInputProps {
  onSuccess?: (data: any) => void
  onError?: (error: string) => void
  disabled?: boolean
  className?: string
}

interface InviteCodeData {
  code: string
  name?: string
  permissions: {
    plan: string
    features: string[]
    projects: string[]
    special_access?: boolean
  }
  remainingUses?: number | null
  expiresAt?: string | null
}

export function InviteCodeInput({ 
  onSuccess, 
  onError, 
  disabled = false,
  className = ""
}: InviteCodeInputProps) {
  const [code, setCode] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean
    data?: InviteCodeData
    error?: string
  } | null>(null)
  const [isUsing, setIsUsing] = useState(false)

  const handleVerifyCode = async () => {
    if (!code.trim()) {
      setVerificationResult({
        success: false,
        error: '请输入邀请码'
      })
      return
    }

    setIsVerifying(true)
    setVerificationResult(null)

    try {
      const response = await fetch('/api/invite-codes/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      })

      const result = await response.json()

      if (result.success) {
        setVerificationResult({
          success: true,
          data: result.data
        })
      } else {
        setVerificationResult({
          success: false,
          error: result.error || '邀请码验证失败'
        })
        onError?.(result.error || '邀请码验证失败')
      }
    } catch (error) {
      const errorMessage = '网络错误，请稍后重试'
      setVerificationResult({
        success: false,
        error: errorMessage
      })
      onError?.(errorMessage)
    } finally {
      setIsVerifying(false)
    }
  }

  const handleUseCode = async () => {
    if (!verificationResult?.data) return

    setIsUsing(true)

    try {
      const response = await fetch('/api/invite-codes/use', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: verificationResult.data.code,
          email: '', // 将在注册时设置
          userAgent: navigator.userAgent,
          ipAddress: '', // 后端获取
        }),
      })

      const result = await response.json()

      if (result.success) {
        onSuccess?.(result.data)
      } else {
        onError?.(result.error || '邀请码使用失败')
      }
    } catch (error) {
      onError?.('网络错误，请稍后重试')
    } finally {
      setIsUsing(false)
    }
  }

  const formatPermissions = (permissions: InviteCodeData['permissions']) => {
    const features = permissions.features || []
    const plan = permissions.plan || 'free'
    
    return {
      planName: plan === 'free' ? '免费版' : plan === 'pro' ? '专业版' : plan,
      featureNames: features.map(f => {
        switch (f) {
          case 'chat': return 'AI对话'
          case 'page_creation': return '页面创建'
          case 'template_access': return '模板库'
          case 'advanced_ai': return '高级AI功能'
          default: return f
        }
      })
    }
  }

  return (
    <Card className={`w-full max-w-md ${className}`}>
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
          <Gift className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <CardTitle>邀请码验证</CardTitle>
        <CardDescription>
          输入您的邀请码以加入 HeysMe 内测
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="invite-code">邀请码</Label>
          <div className="flex space-x-2">
            <Input
              id="invite-code"
              type="text"
              placeholder="输入8位邀请码"
              value={code}
              onChange={(e) => {
                const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
                if (value.length <= 20) { // 限制最大长度
                  setCode(value)
                  setVerificationResult(null) // 清除之前的验证结果
                }
              }}
              disabled={disabled || isVerifying}
              className="font-mono text-center tracking-wider"
              maxLength={20}
            />
            <Button
              onClick={handleVerifyCode}
              disabled={disabled || isVerifying || !code.trim()}
              className="shrink-0"
            >
              {isVerifying ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                '验证'
              )}
            </Button>
          </div>
        </div>

        {/* 验证结果显示 */}
        {verificationResult && (
          <div className="space-y-3">
            {verificationResult.success ? (
              <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  <div className="space-y-2">
                    <div className="font-medium">
                      邀请码验证成功！
                    </div>
                    
                    {verificationResult.data && (
                      <div className="text-sm space-y-1">
                        {verificationResult.data.name && (
                          <div>名称: {verificationResult.data.name}</div>
                        )}
                        
                        <div>
                          计划: {formatPermissions(verificationResult.data.permissions).planName}
                        </div>
                        
                        <div>
                          功能: {formatPermissions(verificationResult.data.permissions).featureNames.join(', ')}
                        </div>
                        
                        {verificationResult.data.remainingUses !== null && (
                          <div>
                            剩余使用次数: {verificationResult.data.remainingUses}
                          </div>
                        )}
                        
                        {verificationResult.data.expiresAt && (
                          <div>
                            过期时间: {new Date(verificationResult.data.expiresAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800 dark:text-red-200">
                  {verificationResult.error}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* 使用邀请码按钮 */}
        {verificationResult?.success && (
          <Button
            onClick={handleUseCode}
            disabled={disabled || isUsing}
            className="w-full"
            size="lg"
          >
            {isUsing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                使用邀请码...
              </>
            ) : (
              '使用邀请码并注册'
            )}
          </Button>
        )}

        <div className="text-center text-sm text-muted-foreground">
          <p>没有邀请码？</p>
          <p className="text-xs mt-1">
            HeysMe 目前处于内测阶段，需要邀请码才能注册。
            请联系我们获取邀请码。
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
