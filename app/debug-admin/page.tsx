"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Shield, AlertTriangle, Copy } from 'lucide-react'

interface UserInfo {
  id: string
  email: string
  plan: string
  projects: string[]
  metadata: any
  isAdmin: boolean
  clerkUserId: string
  created_at: string
}

export default function DebugAdminPage() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")

  const loadUserInfo = async () => {
    setLoading(true)
    setError("")
    try {
      const response = await fetch('/api/debug/current-user')
      const result = await response.json()
      
      if (result.success) {
        setUserInfo(result.user)
      } else {
        setError(result.error || '获取用户信息失败')
      }
    } catch (err) {
      setError('网络错误')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  useEffect(() => {
    loadUserInfo()
  }, [])

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">管理员权限调试</h1>
          <p className="text-muted-foreground">
            检查当前用户权限并设置管理员权限
          </p>
        </div>
        <Button onClick={loadUserInfo} variant="outline" disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          刷新
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
          <CardHeader>
            <CardTitle className="flex items-center text-red-800 dark:text-red-200">
              <AlertTriangle className="mr-2 h-5 w-5" />
              错误
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </CardContent>
        </Card>
      )}

      {userInfo && (
        <div className="grid gap-6">
          {/* 用户信息卡片 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-5 w-5" />
                当前用户信息
                {userInfo.isAdmin ? (
                  <Badge className="ml-2 bg-green-100 text-green-800">管理员</Badge>
                ) : (
                  <Badge variant="secondary" className="ml-2">普通用户</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">邮箱</label>
                  <div className="font-mono text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded">
                    {userInfo.email}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">用户ID</label>
                  <div className="font-mono text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded flex items-center">
                    <span className="flex-1 truncate">{userInfo.clerkUserId}</span>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => copyToClipboard(userInfo.clerkUserId)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">计划</label>
                  <div className="font-mono text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded">
                    {userInfo.plan}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">项目权限</label>
                  <div className="font-mono text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded">
                    {userInfo.projects.join(', ')}
                  </div>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">元数据</label>
                <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto">
                  {JSON.stringify(userInfo.metadata, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* 权限设置说明 */}
          <Card>
            <CardHeader>
              <CardTitle>设置管理员权限</CardTitle>
              <CardDescription>
                要使用邀请码管理功能，需要设置管理员权限
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!userInfo.isAdmin && (
                <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                    ⚠️ 当前用户没有管理员权限
                  </h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                    请在 Supabase SQL Editor 中执行以下任一 SQL 语句：
                  </p>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium">方法1: 设置为管理员计划</label>
                      <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-sm">
                        <div className="flex items-center justify-between">
                          <span>UPDATE users SET plan = 'admin' WHERE id = '{userInfo.clerkUserId}';</span>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => copyToClipboard(`UPDATE users SET plan = 'admin' WHERE id = '${userInfo.clerkUserId}';`)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">方法2: 添加管理员项目权限</label>
                      <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-sm">
                        <div className="flex items-center justify-between">
                          <span>UPDATE users SET projects = array_append(projects, 'admin') WHERE id = '{userInfo.clerkUserId}';</span>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => copyToClipboard(`UPDATE users SET projects = array_append(projects, 'admin') WHERE id = '${userInfo.clerkUserId}';`)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">方法3: 在元数据中设置管理员角色</label>
                      <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-sm">
                        <div className="flex items-center justify-between">
                          <span>UPDATE users SET metadata = jsonb_set(metadata, '{"{"}"role"{"}"}', '"admin"') WHERE id = '{userInfo.clerkUserId}';</span>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => copyToClipboard(`UPDATE users SET metadata = jsonb_set(metadata, '{\"role\"}', '"admin"') WHERE id = '${userInfo.clerkUserId}';`)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {userInfo.isAdmin && (
                <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                    ✅ 当前用户具有管理员权限
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    您可以访问 <a href="/admin/invite-codes" className="underline">/admin/invite-codes</a> 管理邀请码
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 快速链接 */}
          <Card>
            <CardHeader>
              <CardTitle>快速链接</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" asChild>
                  <a href="/admin/invite-codes">邀请码管理</a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="/sign-up">测试注册页面</a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="https://supabase.com/dashboard" target="_blank">
                    Supabase Dashboard
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
