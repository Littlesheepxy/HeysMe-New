"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/navigation/theme-toggle"
import { useTheme } from "@/contexts/theme-context"
import { Sparkles, Zap, Users, Shield, Brain, Target, Palette } from "lucide-react"
import CardSwap, { Card as SwapCard } from "@/components/ui/CardSwap/CardSwap"
import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation"

export default function HomePage() {
  const { theme } = useTheme()

  // Landing page with brand colors
  return (
    <div className="min-h-screen relative">
      {/* Background Gradient Animation - Full Coverage */}
      <BackgroundGradientAnimation
        gradientBackgroundStart="rgb(16, 185, 129)"    // HeysMe emerald-500
        gradientBackgroundEnd="rgb(6, 182, 212)"       // HeysMe cyan-500
        firstColor="52, 211, 153"                       // emerald-400
        secondColor="45, 212, 191"                      // teal-400
        thirdColor="34, 211, 238"                       // cyan-400
        fourthColor="16, 185, 129"                      // emerald-500
        fifthColor="6, 182, 212"                        // cyan-500
        pointerColor="34, 211, 153"                     // emerald-400
        interactive={true}
        containerClassName="fixed inset-0 z-0"
      />

      {/* Header with brand gradient */}
      <header className="container mx-auto px-4 py-6 relative z-10">
        <nav className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-gradient rounded-lg flex items-center justify-center shadow-brand">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">HeysMe</span>
          </div>
          <div className="flex gap-4 items-center">
            <ThemeToggle />
            <Button variant="brand-ghost" className="rounded-2xl text-white border-white/30 hover:bg-white/10">
              登录
            </Button>
            <Button variant="brand" className="rounded-2xl">
              注册
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero Section with brand colors and CardSwap */}
      <section className="relative z-10 overflow-hidden">
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:items-start">
            {/* Left side: Hero content */}
            <div className="text-center lg:text-left lg:pt-16 relative z-20">
              <Badge className="mb-6 bg-white/20 backdrop-blur-sm text-white border border-white/30" variant="secondary">
                🚀 v0.1 MVP 版本
              </Badge>
              <h1 className="text-4xl lg:text-5xl font-bold mb-6 text-white drop-shadow-lg">
                AI 驱动的职业身份平台
              </h1>
              <p className="text-lg lg:text-xl mb-8 max-w-xl text-white/90 drop-shadow-md">
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
        </div>

          {/* Right side: CardSwap */}
          <div className="relative h-[600px] hidden lg:block z-20">
            <div className="absolute left-0 top-[60%] -translate-y-1/2 w-full max-w-lg">
              <CardSwap
                cardDistance={60}
                verticalDistance={70}
                delay={4000}
                pauseOnHover={true}
              >
              <SwapCard
                customClass="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 shadow-2xl"
                className="text-gray-900 overflow-hidden"
              >
                {/* 浏览器标题栏 */}
                <div className="bg-gradient-to-r from-emerald-100 to-emerald-50 border-b border-emerald-200 px-4 py-3 flex items-center gap-3">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full shadow-sm"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full shadow-sm"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="bg-white/80 backdrop-blur-sm rounded-lg px-4 py-2 text-xs text-emerald-700 border border-emerald-300 max-w-52 flex items-center gap-2 shadow-sm">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                      <span className="font-medium">heysme.ai/ai-generation</span>
                    </div>
                  </div>
                </div>
                {/* 内容区域 */}
                <div className="p-6 text-center bg-gradient-to-b from-white to-emerald-50/50">
                  <div className="mb-4 inline-block">
                    <Brain className="w-8 h-8 text-emerald-600" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-lg font-bold mb-3 text-emerald-900">AI 智能生成</h3>
                  <p className="text-emerald-700 text-sm leading-relaxed">
                    让 AI 理解你的职业故事，自动构建专业形象，展现最真实的你
                  </p>
                  <div className="mt-4 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full"></div>
                </div>
              </SwapCard>
              
              <SwapCard
                customClass="bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200 shadow-2xl"
                className="text-gray-900 overflow-hidden"
              >
                {/* 浏览器标题栏 */}
                <div className="bg-gradient-to-r from-teal-100 to-teal-50 border-b border-teal-200 px-4 py-3 flex items-center gap-3">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full shadow-sm"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full shadow-sm"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="bg-white/80 backdrop-blur-sm rounded-lg px-4 py-2 text-xs text-teal-700 border border-teal-300 max-w-52 flex items-center gap-2 shadow-sm">
                      <div className="w-3 h-3 bg-teal-500 rounded-full"></div>
                      <span className="font-medium">heysme.ai/targeting</span>
                    </div>
                  </div>
                </div>
                {/* 内容区域 */}
                <div className="p-6 text-center bg-gradient-to-b from-white to-teal-50/50">
                  <div className="mb-4 inline-block">
                    <Target className="w-8 h-8 text-teal-600" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-lg font-bold mb-3 text-teal-900">精准定位</h3>
                  <p className="text-teal-700 text-sm leading-relaxed">
                    根据行业特点和职业目标，定制化展示方案，让机会主动找到你
                  </p>
                  <div className="mt-4 h-1 bg-gradient-to-r from-teal-400 to-teal-600 rounded-full"></div>
                </div>
              </SwapCard>
              
              <SwapCard
                customClass="bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200 shadow-2xl"
                className="text-gray-900 overflow-hidden"
              >
                {/* 浏览器标题栏 */}
                <div className="bg-gradient-to-r from-cyan-100 to-cyan-50 border-b border-cyan-200 px-4 py-3 flex items-center gap-3">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full shadow-sm"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full shadow-sm"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="bg-white/80 backdrop-blur-sm rounded-lg px-4 py-2 text-xs text-cyan-700 border border-cyan-300 max-w-52 flex items-center gap-2 shadow-sm">
                      <div className="w-3 h-3 bg-cyan-500 rounded-full"></div>
                      <span className="font-medium">heysme.ai/customization</span>
                    </div>
                  </div>
                </div>
                {/* 内容区域 */}
                <div className="p-6 text-center bg-gradient-to-b from-white to-cyan-50/50">
                  <div className="mb-4 inline-block">
                    <Palette className="w-8 h-8 text-cyan-600" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-lg font-bold mb-3 text-cyan-900">个性化设计</h3>
                  <p className="text-cyan-700 text-sm leading-relaxed">
                    丰富的主题选择和布局样式，打造独一无二的专业形象展示
                  </p>
                  <div className="mt-4 h-1 bg-gradient-to-r from-cyan-400 to-cyan-600 rounded-full"></div>
                </div>
              </SwapCard>
              
              <SwapCard
                customClass="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-2xl"
                className="text-gray-900 overflow-hidden"
              >
                {/* 浏览器标题栏 */}
                <div className="bg-gradient-to-r from-blue-100 to-blue-50 border-b border-blue-200 px-4 py-3 flex items-center gap-3">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full shadow-sm"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full shadow-sm"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="bg-white/80 backdrop-blur-sm rounded-lg px-4 py-2 text-xs text-blue-700 border border-blue-300 max-w-52 flex items-center gap-2 shadow-sm">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="font-medium">heysme.ai/privacy</span>
                    </div>
                  </div>
                </div>
                {/* 内容区域 */}
                <div className="p-6 text-center bg-gradient-to-b from-white to-blue-50/50">
                  <div className="mb-4 inline-block">
                    <Shield className="w-8 h-8 text-blue-600" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-lg font-bold mb-3 text-blue-900">隐私保护</h3>
                  <p className="text-blue-700 text-sm leading-relaxed">
                    灵活的权限控制系统，让你完全掌控个人信息的展示范围
                  </p>
                  <div className="mt-4 h-1 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"></div>
                </div>
              </SwapCard>
              </CardSwap>
            </div>
          </div>
        </div>
        </div>
      </section>

      {/* Features with brand cards */}
      <section className="container mx-auto px-4 py-20 relative z-10">
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
      <section className="container mx-auto px-4 py-20 text-center relative z-10">
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
