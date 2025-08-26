"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Plus,
  Copy,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Calendar,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle
} from 'lucide-react'

interface InviteCode {
  id: string
  code: string
  name?: string
  max_uses?: number
  current_uses: number
  expires_at?: string
  permissions: any
  is_active: boolean
  created_at: string
  created_by: string
  batch_id?: string
}

interface InviteCodeUsage {
  id: string
  email: string
  used_at: string
  user_id?: string
  users?: {
    email: string
    first_name?: string
    last_name?: string
  }
}

export function InviteCodeManager() {
  const [codes, setCodes] = useState<InviteCode[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCode, setSelectedCode] = useState<InviteCode | null>(null)
  const [usages, setUsages] = useState<InviteCodeUsage[]>([])
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false)

  // 生成表单状态
  const [generateForm, setGenerateForm] = useState({
    name: '',
    count: 1,
    maxUses: 1,
    expiresAt: '',
    plan: 'free',
    features: ['chat', 'page_creation'],
    specialAccess: false
  })

  const loadCodes = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/invite-codes/generate')
      if (response.ok) {
        const result = await response.json()
        setCodes(result.data.codes || [])
      }
    } catch (error) {
      console.error('加载邀请码失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCodeDetails = async (codeId: string) => {
    try {
      const response = await fetch(`/api/admin/invite-codes/${codeId}`)
      if (response.ok) {
        const result = await response.json()
        setSelectedCode(result.data.inviteCode)
        setUsages(result.data.usages || [])
      }
    } catch (error) {
      console.error('加载邀请码详情失败:', error)
    }
  }

  const generateCodes = async () => {
    try {
      const response = await fetch('/api/admin/invite-codes/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: generateForm.name,
          count: generateForm.count,
          maxUses: generateForm.maxUses,
          expiresAt: generateForm.expiresAt || null,
          permissions: {
            plan: generateForm.plan,
            features: generateForm.features,
            special_access: generateForm.specialAccess,
            projects: ['HeysMe']
          }
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setCodes(prev => [...result.data.codes, ...prev])
        setIsGenerateDialogOpen(false)
        setGenerateForm({
          name: '',
          count: 1,
          maxUses: 1,
          expiresAt: '',
          plan: 'free',
          features: ['chat', 'page_creation'],
          specialAccess: false
        })
      }
    } catch (error) {
      console.error('生成邀请码失败:', error)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // 这里可以添加 toast 提示
  }

  const getStatusBadge = (code: InviteCode) => {
    const now = new Date()
    const isExpired = code.expires_at && new Date(code.expires_at) < now
    const isUsedUp = code.max_uses && code.current_uses >= code.max_uses
    
    if (!code.is_active) {
      return <Badge variant="secondary">已禁用</Badge>
    }
    if (isExpired) {
      return <Badge variant="destructive">已过期</Badge>
    }
    if (isUsedUp) {
      return <Badge variant="outline">已用完</Badge>
    }
    return <Badge variant="default">有效</Badge>
  }

  const getUsageProgress = (code: InviteCode) => {
    if (!code.max_uses) return '无限制'
    return `${code.current_uses} / ${code.max_uses}`
  }

  useEffect(() => {
    loadCodes()
  }, [])

  return (
    <div className="space-y-6">
      {/* 头部操作区 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">邀请码管理</h2>
          <p className="text-muted-foreground">
            管理内测邀请码，控制用户注册权限
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Button onClick={loadCodes} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            刷新
          </Button>
          
          <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                生成邀请码
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
              <DialogHeader>
                <DialogTitle>生成新邀请码</DialogTitle>
                <DialogDescription>
                  创建新的邀请码用于内测用户注册
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">名称（可选）</Label>
                  <Input
                    id="name"
                    value={generateForm.name}
                    onChange={(e) => setGenerateForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="邀请码用途描述"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="count">生成数量</Label>
                    <Input
                      id="count"
                      type="number"
                      min="1"
                      max="100"
                      value={generateForm.count}
                      onChange={(e) => setGenerateForm(prev => ({ 
                        ...prev, 
                        count: parseInt(e.target.value) || 1 
                      }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="maxUses">使用次数</Label>
                    <Input
                      id="maxUses"
                      type="number"
                      min="1"
                      value={generateForm.maxUses}
                      onChange={(e) => setGenerateForm(prev => ({ 
                        ...prev, 
                        maxUses: parseInt(e.target.value) || 1 
                      }))}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="expiresAt">过期时间（可选）</Label>
                  <Input
                    id="expiresAt"
                    type="datetime-local"
                    value={generateForm.expiresAt}
                    onChange={(e) => setGenerateForm(prev => ({ ...prev, expiresAt: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="plan">用户计划</Label>
                  <Select
                    value={generateForm.plan}
                    onValueChange={(value) => setGenerateForm(prev => ({ ...prev, plan: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">免费版</SelectItem>
                      <SelectItem value="pro">专业版</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="specialAccess"
                    checked={generateForm.specialAccess}
                    onCheckedChange={(checked) => setGenerateForm(prev => ({ 
                      ...prev, 
                      specialAccess: checked 
                    }))}
                  />
                  <Label htmlFor="specialAccess">特殊访问权限</Label>
                </div>
                
                <Button onClick={generateCodes} className="w-full">
                  生成邀请码
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 邀请码列表 */}
      <Card>
        <CardHeader>
          <CardTitle>邀请码列表</CardTitle>
          <CardDescription>
            当前共有 {codes.length} 个邀请码
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
            </div>
          ) : codes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              暂无邀请码，点击上方按钮生成
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>邀请码</TableHead>
                  <TableHead>名称</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>使用情况</TableHead>
                  <TableHead>过期时间</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {codes.map((code) => (
                  <TableRow key={code.id}>
                    <TableCell className="font-mono">
                      <div className="flex items-center space-x-2">
                        <span>{code.code}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(code.code)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>{code.name || '-'}</TableCell>
                    <TableCell>{getStatusBadge(code)}</TableCell>
                    <TableCell>{getUsageProgress(code)}</TableCell>
                    <TableCell>
                      {code.expires_at ? 
                        new Date(code.expires_at).toLocaleDateString() : 
                        '永不过期'
                      }
                    </TableCell>
                    <TableCell>
                      {new Date(code.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => loadCodeDetails(code.id)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 邀请码详情弹窗 */}
      {selectedCode && (
        <Dialog open={!!selectedCode} onOpenChange={() => setSelectedCode(null)}>
          <DialogContent className="max-w-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
            <DialogHeader>
              <DialogTitle>邀请码详情</DialogTitle>
              <DialogDescription>
                查看邀请码 {selectedCode.code} 的详细信息和使用记录
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* 基本信息 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">邀请码</Label>
                  <div className="font-mono text-lg">{selectedCode.code}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">状态</Label>
                  <div>{getStatusBadge(selectedCode)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">使用情况</Label>
                  <div>{getUsageProgress(selectedCode)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">创建时间</Label>
                  <div>{new Date(selectedCode.created_at).toLocaleString()}</div>
                </div>
              </div>
              
              {/* 使用记录 */}
              <div>
                <Label className="text-sm font-medium">使用记录</Label>
                {usages.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    暂无使用记录
                  </div>
                ) : (
                  <div className="mt-2 space-y-2">
                    {usages.map((usage) => (
                      <div key={usage.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <div className="font-medium">{usage.email}</div>
                          {usage.users && (
                            <div className="text-sm text-muted-foreground">
                              {usage.users.first_name} {usage.users.last_name}
                            </div>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(usage.used_at).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
