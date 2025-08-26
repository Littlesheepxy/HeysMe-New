"use client"

import { InviteCodeManager } from "@/components/admin/InviteCodeManager"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Gift, CheckCircle2, AlertTriangle } from "lucide-react"

export default function InviteCodesAdminPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">邀请码管理</h1>
          <p className="text-muted-foreground">
            管理 HeysMe 内测邀请码，控制用户访问权限
          </p>
        </div>
        <Badge variant="secondary" className="px-3 py-1">
          管理员功能
        </Badge>
      </div>

      {/* 统计概览 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              总邀请码数
            </CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
              包含所有状态的邀请码
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              有效邀请码
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">--</div>
            <p className="text-xs text-muted-foreground">
              可用于注册的邀请码
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              已使用次数
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
              通过邀请码注册的用户
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              过期/已满
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">--</div>
            <p className="text-xs text-muted-foreground">
              需要处理的邀请码
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 邀请码管理界面 */}
      <InviteCodeManager />

      {/* 使用说明 */}
      <Card>
        <CardHeader>
          <CardTitle>使用说明</CardTitle>
          <CardDescription>
            如何使用邀请码系统进行内测管理
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-2">📝 生成邀请码</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 设置邀请码名称和使用次数</li>
                <li>• 配置用户权限和功能访问</li>
                <li>• 支持批量生成和过期时间设置</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">👥 用户注册流程</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 用户访问注册页面需输入邀请码</li>
                <li>• 验证成功后才能看到注册表单</li>
                <li>• 注册完成自动应用邀请码权限</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">📊 监控和管理</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 实时查看邀请码使用情况</li>
                <li>• 追踪每个邀请码的注册用户</li>
                <li>• 支持禁用和删除无效邀请码</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">🔒 权限控制</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 不同邀请码可设置不同权限</li>
                <li>• 支持免费版、专业版账户类型</li>
                <li>• 可配置特殊功能访问权限</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
