/**
 * 登录页面 - 使用 Clerk
 *
 * 功能：
 * - Clerk 身份验证
 * - 自动跳转到目标页面
 * - 美观的 UI 设计
 */

"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"
import { useTheme } from "@/contexts/theme-context"
import { ThemeToggle } from "@/components/navigation/theme-toggle"
import { SignIn } from "@clerk/nextjs"

export default function LoginPage() {
  const { theme } = useTheme()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirect") || "/dashboard"

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${
        theme === "light" ? "bg-gradient-light" : "bg-gradient-dark"
      }`}
    >
      {/* 主题切换按钮 */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      {/* 返回首页按钮 */}
      <div className="absolute top-4 left-4">
        <Button variant="ghost" asChild className="rounded-2xl">
          <Link href="/">
            <Sparkles className="w-4 h-4 mr-2" />
            HeysMe
          </Link>
        </Button>
      </div>

      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className={`text-3xl font-bold ${theme === "light" ? "text-gray-900" : "text-white"}`}>
            欢迎回来
          </h1>
          <p className={`mt-2 ${theme === "light" ? "text-gray-600" : "text-gray-400"}`}>
            登录到你的 HeysMe 账户
          </p>
        </div>
        
        <SignIn 
          appearance={{
            elements: {
              formButtonPrimary: 
                "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg rounded-2xl",
              card: `shadow-2xl backdrop-blur-xl border rounded-3xl ${
                theme === "light" ? "bg-white/90 border-white/30" : "bg-gray-900/90 border-gray-700/30"
              }`,
              headerTitle: "hidden",
              headerSubtitle: "hidden",
              socialButtonsBlockButton: "rounded-2xl",
              formFieldInput: "rounded-2xl",
              footerActionLink: theme === "light" ? "text-blue-600 hover:text-blue-700" : "text-blue-400 hover:text-blue-300",
            },
          }}
          redirectUrl={redirectTo}
        />
      </div>
    </div>
  )
}
