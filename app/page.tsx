"use client"

import { I18nProvider } from "@/contexts/i18n-context"
import { useTheme } from "@/contexts/theme-context"
import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation"
import {
  HeaderSection,
  HeroSection,
  MissionSection,
  ValueSection,
  FeaturesSection,
  CreatorHubSection,
  PlazaSection,
  UseCasesSection,
  TestimonialsSection,
  FinalCtaSection
} from "@/components/landing"
import { Linkedin, Twitter, MessageCircle } from "lucide-react"

// Footer Section Component - 简化版
function FooterSectionComponent() {
  const socialLinks = [
    {
      name: 'LinkedIn',
      href: 'https://linkedin.com/company/landjobx',
      color: 'hover:text-blue-600',
      icon: Linkedin
    },
    {
      name: 'X (Twitter)',
      href: 'https://x.com/landjobx',
      color: 'hover:text-gray-900',
      icon: Twitter
    },
    {
      name: 'Discord',
      href: 'https://discord.gg/landjobx',
      color: 'hover:text-indigo-600',
      icon: MessageCircle
    }
  ]

  return (
    <footer className="relative z-10 overflow-hidden">
      {/* 渐变背景层 */}
      <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/20 via-cyan-800/10 to-transparent"></div>
      <div className="absolute inset-0 bg-white/80 backdrop-blur-xl"></div>
      
      {/* 装饰性元素 */}
      <div className="absolute top-0 left-1/4 w-32 h-32 bg-emerald-400/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-40 h-40 bg-cyan-400/10 rounded-full blur-3xl"></div>
      
      <div className="relative z-10">
        {/* 主要内容区域 */}
        <div className="container mx-auto px-6 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            
            {/* 左侧：品牌信息 */}
            <div className="lg:col-span-1 text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start space-x-4 mb-4">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 via-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-lg">H</span>
                  </div>
                  <div className="absolute -inset-1 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-2xl blur opacity-20"></div>
                </div>
                <div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
                    HeysMe
                  </h3>
                  <p className="text-sm text-gray-600">AI 驱动的数字分身平台</p>
                </div>
              </div>
            </div>

            {/* 中间：品牌标语 */}
            <div className="lg:col-span-1 text-center">
              <div>
                <p className="text-lg font-medium text-gray-700 mb-2">
                  让AI为你创造无数个自己
                </p>
                <div className="w-16 h-1 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full mx-auto"></div>
              </div>
            </div>

            {/* 右侧：社交媒体 */}
            <div className="lg:col-span-1 flex justify-center lg:justify-end">
              <div className="flex items-center space-x-6">
                <span className="text-sm font-medium text-gray-600 hidden sm:block">关注我们</span>
                <div className="flex space-x-3">
                  {socialLinks.map((social, index) => {
                    const IconComponent = social.icon
                    return (
                    <a
                      key={social.name}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`group relative p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-white/40 text-gray-600 transition-all duration-300 hover:bg-white hover:shadow-lg ${social.color}`}
                    >
                      <IconComponent className="w-5 h-5" />
                      
                      {/* Enhanced Tooltip */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
                        <div className="bg-gray-900 text-white text-xs font-medium rounded-lg px-3 py-2 whitespace-nowrap shadow-xl">
                          {social.name}
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                        </div>
                      </div>
                    </a>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 底部版权信息 */}
        <div className="border-t border-gradient-to-r from-transparent via-gray-300/30 to-transparent">
          <div className="container mx-auto px-6 py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span className="font-semibold">LANDJOBX LTD.</span>
                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                <span>© 2025 版权所有</span>
              </div>
              
              <div className="text-xs text-gray-500">
                <span>Powered by AI</span>
                <span className="mx-2">•</span>
                <span>Built with ❤️</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

function HomePage() {
  const { theme } = useTheme()

  return (
    <I18nProvider>
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

        {/* Header */}
        <HeaderSection />

        {/* Hero Section */}
        <HeroSection />

        {/* Mission Section */}
        <section id="mission">
          <MissionSection />
        </section>

        {/* Value Section */}
        <section id="value">
          <ValueSection />
        </section>

        {/* Features Section */}
        <section id="features">
          <FeaturesSection />
        </section>

        {/* Creator Hub Section */}
        <section id="creator-hub">
          <CreatorHubSection />
        </section>

        {/* Digital Identity Plaza Section */}
        <section id="plaza">
          <PlazaSection />
        </section>

        {/* Use Cases Section */}
        <section id="use-cases">
          <UseCasesSection />
        </section>

        {/* Testimonials Section */}
        <section id="testimonials">
          <TestimonialsSection />
        </section>

        {/* Final CTA Section */}
        <section id="final-cta">
          <FinalCtaSection />
        </section>

        {/* Footer */}
        <FooterSectionComponent />


      </div>
    </I18nProvider>
  )
}

export default HomePage