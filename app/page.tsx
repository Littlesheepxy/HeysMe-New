"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/navigation/theme-toggle"
import { useTheme } from "@/contexts/theme-context"
import { Sparkles, Zap, Users, Shield } from "lucide-react"

export default function HomePage() {
  const { theme } = useTheme()

  // Landing page with brand colors
  return (
    <div
      className={`min-h-screen transition-all duration-300 ${
        theme === "light" ? "bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50" : "bg-gradient-to-br from-gray-900 via-emerald-950 to-cyan-950"
      }`}
    >
      {/* Header with brand gradient */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-gradient rounded-lg flex items-center justify-center shadow-brand">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className={`text-xl font-bold ${theme === "light" ? "text-gray-900" : "text-white"}`}>HeysMe</span>
          </div>
          <div className="flex gap-4 items-center">
            <ThemeToggle />
            <Button variant="brand-ghost" className="rounded-2xl">
              登录
            </Button>
            <Button variant="brand" className="rounded-2xl">
              注册
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero Section with brand colors */}
      <section className="container mx-auto px-4 py-20 text-center">
        <Badge className="mb-6 bg-emerald-100 text-emerald-700 border border-emerald-200" variant="secondary">
          🚀 v0.1 MVP 版本
        </Badge>
        <h1
          className={`text-5xl font-bold mb-6 bg-gradient-to-r bg-clip-text text-transparent ${
            theme === "light" ? "from-emerald-600 via-teal-600 to-cyan-600" : "from-emerald-400 via-teal-400 to-cyan-400"
          }`}
        >
          AI 驱动的职业身份平台
        </h1>
        <p className={`text-xl mb-8 max-w-2xl mx-auto ${theme === "light" ? "text-gray-600" : "text-gray-300"}`}>
          通过智能对话，AI 为你生成个性化的职业主页。展示项目、技能、经历，让机会主动找到你。
        </p>
        <Button
          variant="brand"
          size="lg"
          onClick={() => window.location.href = '/chat'}
          className="text-lg px-8 py-4 rounded-2xl shadow-brand-xl hover:shadow-brand-glow transition-all duration-300 transform hover:scale-105"
          style={{
            background: 'linear-gradient(135deg, #34D399 0%, #2DD4BF 50%, #22D3EE 100%)',
            color: 'white'
          }}
        >
          <Sparkles className="w-5 h-5 mr-2" />
          开始创建 HeysMe
        </Button>
      </section>

      {/* Features with brand cards */}
      <section className="container mx-auto px-4 py-20">
        <h2 className={`text-3xl font-bold text-center mb-12 ${theme === "light" ? "text-gray-900" : "text-white"}`}>
          为什么选择 HeysMe？
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card
            variant="brand"
            className="rounded-3xl shadow-brand-lg hover:shadow-brand-xl transform hover:scale-105 transition-all duration-300"
          >
            <CardHeader>
              <Zap className="w-10 h-10 text-emerald-500 mb-4" />
              <CardTitle className={theme === "light" ? "text-gray-900" : "text-white"}>AI 智能生成</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={theme === "light" ? "text-gray-600" : "text-gray-300"}>
                基于你的身份、目标和风格偏好，AI 自动生成专业的页面结构和内容。
              </p>
            </CardContent>
          </Card>

          <Card
            variant="brand-glass"
            className="rounded-3xl shadow-brand-lg hover:shadow-brand-xl transform hover:scale-105 transition-all duration-300"
          >
            <CardHeader>
              <Users className="w-10 h-10 text-teal-500 mb-4" />
              <CardTitle className={theme === "light" ? "text-gray-900" : "text-white"}>多样化展示</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={theme === "light" ? "text-gray-600" : "text-gray-300"}>
                支持项目作品、技能专长、工作经历等多种内容模块，全方位展示你的能力。
              </p>
            </CardContent>
          </Card>

          <Card
            variant="brand-outline"
            className="rounded-3xl shadow-brand-lg hover:shadow-brand-xl transform hover:scale-105 transition-all duration-300"
          >
            <CardHeader>
              <Shield className="w-10 h-10 text-cyan-500 mb-4" />
              <CardTitle className={theme === "light" ? "text-gray-900" : "text-white"}>灵活权限控制</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={theme === "light" ? "text-gray-600" : "text-gray-300"}>
                支持公开、私密、链接可见等多种权限设置，完全掌控你的信息展示。
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA with brand gradient card */}
      <section className="container mx-auto px-4 py-20 text-center">
        <Card
          variant="brand-gradient"
          className="max-w-2xl mx-auto rounded-3xl shadow-brand-xl hover:shadow-brand-glow transform hover:scale-105 transition-all duration-300"
        >
          <CardContent className="p-12">
            <h2 className="text-3xl font-bold mb-4 text-white">
              准备好创建你的 HeysMe 了吗？
            </h2>
            <p className="mb-8 text-white/80">
              只需几分钟，就能拥有一个专业的职业主页
            </p>
            <Button
              variant="secondary"
              size="lg"
              asChild
              className="text-lg px-8 py-4 rounded-2xl bg-white text-emerald-600 hover:bg-white/90 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
            >
              <a href="/chat">
                <Sparkles className="w-5 h-5 mr-2" />
                立即开始
              </a>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Brand decoration elements */}
      <div className="fixed top-20 left-10 w-20 h-20 bg-brand-gradient rounded-full opacity-10 animate-brand-pulse"></div>
      <div className="fixed bottom-20 right-10 w-32 h-32 bg-brand-gradient rounded-full opacity-5 animate-brand-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="fixed top-1/2 right-20 w-16 h-16 bg-brand-gradient rounded-full opacity-10 animate-brand-pulse" style={{ animationDelay: '2s' }}></div>
    </div>
  )
}
