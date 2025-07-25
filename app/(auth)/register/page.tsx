/**
 * 注册页面
 *
 * 功能：
 * - 邮箱密码注册
 * - 社交注册 (Google, GitHub)
 * - 邮箱验证流程
 * - 用户协议确认
 *
 * TODO:
 * - [ ] 添加邀请码注册
 * - [ ] 实现推荐人系统
 * - [ ] 添加注册奖励机制
 * - [ ] 支持企业批量注册
 */

"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Sparkles, Mail, Lock, User, Github, Chrome, Eye, EyeOff, AlertCircle, CheckCircle, Shield } from "lucide-react"
import { useTheme } from "@/contexts/theme-context"
import { ThemeToggle } from "@/components/navigation/theme-toggle"
import { supabase } from "@/lib/supabase"

export default function RegisterPage() {
  const { theme } = useTheme()
  const router = useRouter()

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    username: "",
    agreeToTerms: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // 密码强度检查
  const getPasswordStrength = (password: string) => {
    let strength = 0
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    }

    strength = Object.values(checks).filter(Boolean).length
    return { strength: (strength / 5) * 100, checks }
  }

  const passwordStrength = getPasswordStrength(formData.password)

  // 表单验证
  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.username) {
      setError("请填写所有必填字段")
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      setError("两次输入的密码不一致")
      return false
    }

    if (passwordStrength.strength < 60) {
      setError("密码强度不够，请设置更复杂的密码")
      return false
    }

    if (!formData.agreeToTerms) {
      setError("请同意用户协议和隐私政策")
      return false
    }

    return true
  }

  // 邮箱注册
  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)
    setError("")

    try {
      // 检查用户名是否已存在
      const { data: existingUser } = await supabase
        .from("users")
        .select("username")
        .eq("username", formData.username)
        .single()

      if (existingUser) {
        setError("用户名已存在，请选择其他用户名")
        return
      }

      // 注册用户
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            username: formData.username,
            plan: "free",
            default_model: "claude-sonnet-4-20250514",
          },
        },
      })

      if (error) throw error

      setSuccess("注册成功！请检查邮箱并点击验证链接完成注册。")

      // 3秒后跳转到登录页
      setTimeout(() => {
        router.push("/auth/login")
      }, 3000)
    } catch (error: any) {
      setError(error.message || "注册失败，请重试")
    } finally {
      setIsLoading(false)
    }
  }

  // 社交注册
  const handleSocialRegister = async (provider: "google" | "github") => {
    setIsLoading(true)
    setError("")

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirect=/onboarding`,
        },
      })

      if (error) throw error
    } catch (error: any) {
      setError(error.message || "社交注册失败，请重试")
      setIsLoading(false)
    }
  }

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

      <Card
        className={`w-full max-w-md rounded-3xl shadow-2xl backdrop-blur-xl border ${
          theme === "light" ? "bg-white/90 border-white/30" : "bg-gray-900/90 border-gray-700/30"
        }`}
      >
        <CardHeader className="text-center pb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <CardTitle className={`text-2xl font-bold ${theme === "light" ? "text-gray-900" : "text-white"}`}>
            创建账户
          </CardTitle>
          <p className={`${theme === "light" ? "text-gray-600" : "text-gray-400"}`}>开始你的 HeysMe 之旅</p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 错误/成功提示 */}
          {error && (
            <Alert variant="destructive" className="rounded-2xl">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="rounded-2xl border-green-200 bg-green-50 text-green-800">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* 注册表单 */}
          <form onSubmit={handleEmailRegister} className="space-y-4">
            {/* 用户名 */}
            <div className="space-y-2">
              <Label htmlFor="username" className={theme === "light" ? "text-gray-700" : "text-gray-300"}>
                用户名
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="username"
                  type="text"
                  placeholder="选择一个独特的用户名"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="pl-10 rounded-2xl"
                  required
                />
              </div>
              <p className="text-xs text-gray-500">用户名将用于你的个人页面URL</p>
            </div>

            {/* 邮箱 */}
            <div className="space-y-2">
              <Label htmlFor="email" className={theme === "light" ? "text-gray-700" : "text-gray-300"}>
                邮箱地址
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10 rounded-2xl"
                  required
                />
              </div>
            </div>

            {/* 密码 */}
            <div className="space-y-2">
              <Label htmlFor="password" className={theme === "light" ? "text-gray-700" : "text-gray-300"}>
                密码
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="设置安全密码"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-10 pr-10 rounded-2xl"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 rounded-xl"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>

              {/* 密码强度指示器 */}
              {formData.password && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Progress value={passwordStrength.strength} className="flex-1 h-2" />
                    <span className="text-xs text-gray-500">
                      {passwordStrength.strength < 40 ? "弱" : passwordStrength.strength < 80 ? "中" : "强"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <span className={passwordStrength.checks.length ? "text-green-600" : "text-gray-400"}>
                      ✓ 至少8位
                    </span>
                    <span className={passwordStrength.checks.number ? "text-green-600" : "text-gray-400"}>
                      ✓ 包含数字
                    </span>
                    <span className={passwordStrength.checks.lowercase ? "text-green-600" : "text-gray-400"}>
                      ✓ 包含小写
                    </span>
                    <span className={passwordStrength.checks.uppercase ? "text-green-600" : "text-gray-400"}>
                      ✓ 包含大写
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 确认密码 */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className={theme === "light" ? "text-gray-700" : "text-gray-300"}>
                确认密码
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="再次输入密码"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="pl-10 pr-10 rounded-2xl"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 rounded-xl"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-xs text-red-500">密码不一致</p>
              )}
            </div>

            {/* 用户协议 */}
            <div className="flex items-start space-x-2">
              <Checkbox
                id="terms"
                checked={formData.agreeToTerms}
                onCheckedChange={(checked) => setFormData({ ...formData, agreeToTerms: checked as boolean })}
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="terms"
                  className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
                    theme === "light" ? "text-gray-700" : "text-gray-300"
                  }`}
                >
                  我同意{" "}
                  <Link href="/terms" className="text-blue-600 hover:underline">
                    用户协议
                  </Link>{" "}
                  和{" "}
                  <Link href="/privacy" className="text-blue-600 hover:underline">
                    隐私政策
                  </Link>
                </label>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg"
            >
              {isLoading ? "注册中..." : "创建账户"}
            </Button>
          </form>

          {/* 分割线 */}
          <div className="relative">
            <Separator />
            <span
              className={`absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 px-2 text-sm ${
                theme === "light" ? "bg-white text-gray-500" : "bg-gray-900 text-gray-400"
              }`}
            >
              或
            </span>
          </div>

          {/* 社交注册 */}
          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSocialRegister("google")}
              disabled={isLoading}
              className="w-full rounded-2xl"
            >
              <Chrome className="w-4 h-4 mr-2" />
              使用 Google 注册
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => handleSocialRegister("github")}
              disabled={isLoading}
              className="w-full rounded-2xl"
            >
              <Github className="w-4 h-4 mr-2" />
              使用 GitHub 注册
            </Button>
          </div>

          {/* 安全提示 */}
          <div
            className={`flex items-center gap-2 p-3 rounded-2xl ${
              theme === "light" ? "bg-blue-50 text-blue-800" : "bg-blue-900/20 text-blue-300"
            }`}
          >
            <Shield className="w-4 h-4" />
            <span className="text-xs">我们承诺保护你的隐私和数据安全</span>
          </div>

          {/* 登录链接 */}
          <div className="text-center">
            <span className={`text-sm ${theme === "light" ? "text-gray-600" : "text-gray-400"}`}>
              已有账户？{" "}
              <Link
                href="/auth/login"
                className={`font-medium hover:underline ${
                  theme === "light" ? "text-blue-600 hover:text-blue-700" : "text-blue-400 hover:text-blue-300"
                }`}
              >
                立即登录
              </Link>
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
