"use client"

import { useState } from "react"
import { SignUp } from "@clerk/nextjs"
import { InviteCodeInput } from "@/components/auth/InviteCodeInput"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2 } from "lucide-react"

export default function Page() {
  const [inviteCodeVerified, setInviteCodeVerified] = useState(false)
  const [inviteCodeData, setInviteCodeData] = useState<any>(null)
  const [error, setError] = useState<string>("")

  const handleInviteCodeSuccess = (data: any) => {
    setInviteCodeVerified(true)
    setInviteCodeData(data)
    setError("")
  }

  const handleInviteCodeError = (error: string) => {
    setError(error)
    setInviteCodeVerified(false)
    setInviteCodeData(null)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            加入 HeysMe
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {inviteCodeVerified ? 
              "邀请码验证成功，现在可以创建账户" : 
              "HeysMe 目前为内测阶段，需要邀请码才能注册"
            }
          </p>
        </div>

        {!inviteCodeVerified ? (
          // 显示邀请码输入界面
          <InviteCodeInput
            onSuccess={handleInviteCodeSuccess}
            onError={handleInviteCodeError}
          />
        ) : (
          // 显示注册表单
          <div className="space-y-4">
            {/* 邀请码验证成功提示 */}
            <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                <div className="space-y-1">
                  <div className="font-medium">邀请码验证成功！</div>
                  <div className="text-sm">
                    欢迎加入 HeysMe 内测，您将获得以下权限：
                  </div>
                  {inviteCodeData?.permissions && (
                    <div className="text-sm">
                      • {inviteCodeData.permissions.plan === 'free' ? '免费版' : '专业版'} 账户
                      {inviteCodeData.permissions.features && (
                        <div>• 功能权限: {inviteCodeData.permissions.features.join(', ')}</div>
                      )}
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>

            {/* Clerk 注册组件 */}
            <SignUp 
              signInUrl="/sign-in"
              redirectUrl="/chat"
              appearance={{
                elements: {
                  formButtonPrimary: 
                    "bg-blue-600 hover:bg-blue-700 text-sm normal-case",
                  card: "shadow-lg",
                  headerTitle: "hidden",
                  headerSubtitle: "hidden",
                },
              }}
            />
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
            <AlertDescription className="text-red-800 dark:text-red-200">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* 返回登录链接 */}
        <div className="text-center text-sm text-muted-foreground">
          已有账户？{" "}
          <a 
            href="/sign-in" 
            className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
          >
            立即登录
          </a>
        </div>
      </div>
    </div>
  )
} 