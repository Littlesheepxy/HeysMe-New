"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, ArrowRight, Key } from "lucide-react"
import Link from "next/link"

export default function InviteRequiredPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md space-y-6">
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900">
              <Key className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <CardTitle className="text-orange-800 dark:text-orange-200">
              需要邀请码
            </CardTitle>
            <CardDescription className="text-orange-700 dark:text-orange-300">
              HeysMe 目前为内测阶段
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-orange-200 bg-orange-100 dark:border-orange-700 dark:bg-orange-900/50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800 dark:text-orange-200">
                <div className="space-y-2">
                  <p className="font-medium">注册失败</p>
                  <p className="text-sm">
                    您尝试注册的邮箱没有关联有效的邀请码。HeysMe 目前为内测阶段，需要邀请码才能注册。
                  </p>
                </div>
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                如何获取邀请码？
              </h4>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-start gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-600">1</span>
                  <span>联系现有用户获取邀请码</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-600">2</span>
                  <span>关注我们的官方渠道获取邀请码</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-600">3</span>
                  <span>在注册页面输入邀请码验证后再注册</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Button asChild className="w-full">
                <Link href="/sign-up">
                  <Key className="mr-2 h-4 w-4" />
                  输入邀请码
                </Link>
              </Button>
              
              <Button variant="outline" asChild className="w-full">
                <Link href="/sign-in">
                  已有账户？立即登录
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            如有疑问，请联系客服或访问帮助中心
          </p>
        </div>
      </div>
    </div>
  )
}
