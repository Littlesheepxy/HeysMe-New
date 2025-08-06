"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/navigation/theme-toggle"
import { useTheme } from "@/contexts/theme-context"
import { Sparkles, Zap, Users, Shield, Brain, Target, Palette } from "lucide-react"
import CardSwap, { Card as SwapCard } from "@/components/ui/CardSwap/CardSwap"
import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation"
import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"
import { 
  FaLinkedin, 
  FaGithub, 
  FaYoutube, 
  FaInstagram, 
  FaTiktok,
  FaTwitter,
  FaDiscord
} from 'react-icons/fa'
import { 
  SiHuggingface,
  SiNotion,
  SiBehance,
  SiDribbble 
} from 'react-icons/si'
import { Globe, ArrowRight, Bot, Cpu, Network } from "lucide-react"

// Footer Section Component
function FooterSection() {
  const socialLinks = [
    {
      name: 'LinkedIn',
      icon: FaLinkedin,
      href: 'https://linkedin.com/company/landjobx',
      color: 'hover:text-blue-600'
    },
    {
      name: 'X (Twitter)',
      icon: FaTwitter,
      href: 'https://x.com/landjobx',
      color: 'hover:text-gray-900'
    },
    {
      name: 'Discord',
      icon: FaDiscord,
      href: 'https://discord.gg/landjobx',
      color: 'hover:text-indigo-600'
    }
  ]

  return (
    <footer className="relative z-10 bg-white/60 backdrop-blur-md border-t border-white/30">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between">
          {/* 左侧：公司信息 */}
          <div className="flex items-center space-x-3 mb-4 md:mb-0">
            <div className="w-8 h-8 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">H</span>
            </div>
            <div className="text-sm text-gray-700">
              <span className="font-semibold">LANDJOBX LTD.</span>
              <span className="mx-2">•</span>
              <span>© 2025</span>
            </div>
          </div>

          {/* 右侧：社交媒体链接 */}
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600 hidden md:block">关注我们：</span>
            {socialLinks.map((social) => (
              <motion.a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`group relative p-2 text-gray-500 transition-all duration-300 ${social.color}`}
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <social.icon className="w-5 h-5" />
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  <div className="bg-gray-800 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap shadow-lg">
                    {social.name}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                  </div>
                </div>
              </motion.a>
            ))}
          </div>
        </div>

        {/* 底部分隔线和额外信息 */}
        <div className="mt-6 pt-6 border-t border-gray-200/50">
          <div className="text-center">
            <p className="text-xs text-gray-500">
              由 AI 驱动，为职业发展而生 • 让每个人都能展现最好的自己
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

// Header Section Component
function HeaderSection() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
    setIsMobileMenuOpen(false)
  }

  const navigation = [
    { name: '产品特色', href: '#features' },
    { name: '为什么选择', href: '#why-choose' },
    { name: '立即体验', href: '#cta' },
  ]

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      <div className="flex justify-center pt-2 px-4">
        <motion.div
          animate={{
            scale: isScrolled ? 0.95 : 1,
            y: isScrolled ? -2 : 0
          }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={`
            flex items-center justify-between rounded-full backdrop-blur-md transition-all duration-300 w-full max-w-6xl
            ${isScrolled 
              ? 'bg-white/70 border border-emerald-200/50 px-12 py-1.5 shadow-lg' 
              : 'bg-white/20 border border-white/30 px-16 py-2'
            }
          `}
        >
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center"
          >
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">H</span>
              </div>
              <span className={`font-bold text-lg ${isScrolled ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent' : 'text-white'}`}>
                HeysMe
              </span>
            </div>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8 flex-1 justify-center">
            {navigation.map((item, index) => (
              <motion.button
                key={item.name}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => scrollToSection(item.href.slice(1))}
                className={`font-medium transition-colors duration-200 relative group text-sm ${
                  isScrolled 
                    ? 'text-gray-700 hover:text-emerald-600' 
                    : 'text-white/90 hover:text-white'
                }`}
              >
                {item.name}
                <span className={`absolute -bottom-0.5 left-0 w-0 h-0.5 transition-all duration-200 group-hover:w-full ${
                  isScrolled 
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-500' 
                    : 'bg-white'
                }`}></span>
              </motion.button>
            ))}
          </nav>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.location.href = '/login'}
              className={`group relative px-5 py-2 rounded-full font-medium text-sm transition-all duration-300 ${
                isScrolled 
                  ? 'text-gray-700 hover:text-gray-900 bg-white/80 hover:bg-white border border-gray-200/60 hover:border-gray-300/80 shadow-sm hover:shadow-md' 
                  : 'text-white/90 hover:text-white bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 backdrop-blur-md'
              }`}
            >
              <span className="relative z-10">登录</span>
              {isScrolled && (
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-gray-50 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              )}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.location.href = '/register'}
              className={`group relative px-5 py-2 rounded-full font-medium text-sm transition-all duration-300 overflow-hidden ${
                isScrolled 
                  ? 'text-white bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-600 hover:via-emerald-700 hover:to-teal-700 shadow-lg hover:shadow-xl hover:shadow-emerald-200/40 border-0' 
                  : 'text-white bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:via-emerald-600 hover:to-teal-600 shadow-lg hover:shadow-xl hover:shadow-emerald-300/30 border border-emerald-300/20'
              }`}
            >
              <span className="relative z-10">注册</span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full blur opacity-20 group-hover:opacity-30 transition-opacity duration-300" />
            </motion.button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden ml-4">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`focus:outline-none ${
              isScrolled 
                ? 'text-gray-700 hover:text-emerald-600' 
                : 'text-white/90 hover:text-white'
            }`}
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden mt-2 mx-4"
          >
            <div className={`backdrop-blur-md rounded-2xl px-4 py-3 ${
              isScrolled 
                ? 'bg-white/90 border border-emerald-100' 
                : 'bg-white/20 border border-white/30'
            }`}>
              <div className="space-y-2">
                {navigation.map((item) => (
                  <motion.button
                    key={item.name}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => scrollToSection(item.href.slice(1))}
                    className={`block w-full text-left px-3 py-2 rounded-lg transition-colors duration-200 text-sm ${
                      isScrolled 
                        ? 'text-gray-700 hover:text-emerald-600 hover:bg-emerald-50' 
                        : 'text-white/90 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {item.name}
                  </motion.button>
                ))}
                <div className="pt-3 border-t border-white/20 space-y-3">
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => window.location.href = '/login'}
                    className={`group relative w-full px-5 py-2.5 rounded-full font-medium text-sm text-center transition-all duration-300 ${
                      isScrolled 
                        ? 'text-gray-700 hover:text-gray-900 bg-white/80 hover:bg-white border border-gray-200/60 shadow-sm hover:shadow-md' 
                        : 'text-white/90 hover:text-white bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md'
                    }`}
                  >
                    <span className="relative z-10">登录</span>
                    {isScrolled && (
                      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-gray-50 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    )}
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => window.location.href = '/register'}
                    className={`group relative w-full px-5 py-2.5 rounded-full font-medium text-sm text-center transition-all duration-300 overflow-hidden ${
                      isScrolled 
                        ? 'text-white bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-600 hover:via-emerald-700 hover:to-teal-700 shadow-lg hover:shadow-xl hover:shadow-emerald-200/40 border-0' 
                        : 'text-white bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:via-emerald-600 hover:to-teal-600 shadow-lg hover:shadow-xl hover:shadow-emerald-300/30 border border-emerald-300/20'
                    }`}
                  >
                    <span className="relative z-10">注册</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full blur opacity-20 group-hover:opacity-30 transition-opacity duration-300" />
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}

// Platform Integration Section Component
function PlatformIntegrationSection() {
  const centerPlatform = { 
    name: 'Claude AI', 
    icon: Bot,
    color: '#10B981', // emerald-500
    description: 'AI基座模型与智能分析引擎'
  }

  const platforms = [
    { 
      name: 'LinkedIn', 
      icon: FaLinkedin, 
      color: '#0077B5',
      description: '职业履历与人脉网络'
    },
    { 
      name: 'GitHub', 
      icon: FaGithub, 
      color: '#24292e',
      description: '代码项目与技术能力'
    },
    { 
      name: 'YouTube', 
      icon: FaYoutube, 
      color: '#FF0000',
      description: '视频内容与创作才华'
    },
    { 
      name: 'Instagram', 
      icon: FaInstagram, 
      color: '#E4405F',
      description: '生活态度与美学品味'
    },
    { 
      name: 'TikTok', 
      icon: FaTiktok, 
      color: '#000000',
      description: '创意短视频与潮流敏感度'
    },
    { 
      name: 'Twitter', 
      icon: FaTwitter, 
      color: '#1DA1F2',
      description: '思维观点与行业洞察'
    },
    { 
      name: 'Hugging Face', 
      icon: SiHuggingface, 
      color: '#FF9D00',
      description: 'AI模型与机器学习贡献'
    },
    { 
      name: 'Notion', 
      icon: SiNotion, 
      color: '#000000',
      description: '知识管理与思维体系'
    }
  ]

  return (
    <section id="features" className="py-20 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-64 h-64 bg-emerald-300/30 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-64 h-64 bg-cyan-300/30 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-pulse" style={{animationDelay: '1000ms'}}></div>
        <div className="absolute bottom-20 left-1/3 w-64 h-64 bg-teal-300/30 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-pulse" style={{animationDelay: '2000ms'}}></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* 标题区域 */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <motion.div
              className="p-3 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-2xl shadow-lg"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Sparkles className="w-8 h-8 text-white" />
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-600 via-cyan-600 to-teal-600 bg-clip-text text-transparent">
              AI 智能集成
            </h2>
          </div>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            基于 Claude AI 的原生架构，智能整合多平台数据，
            <span className="text-emerald-600 font-semibold">自动分析</span>并
            <span className="text-cyan-600 font-semibold">个性化展示</span>
            您的全方位价值
          </p>
        </motion.div>

        {/* 核心功能展示 */}
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-16">
          {/* 左侧：功能描述 */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-3">智能数据整合</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Claude AI 作为基座模型，深度理解各平台内容特征，智能提取关键信息，
                    自动构建您的多维度价值画像
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-3">动态展示方式</h3>
                  <p className="text-gray-600 leading-relaxed">
                    通过 iframe 嵌入、API 调用、链接跳转等多种方式，
                    实时展示最新内容，让您的价值持续更新
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                  <ArrowRight className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-3">持续扩展支持</h3>
                  <p className="text-gray-600 leading-relaxed">
                    未来将支持更多平台和数据源，构建更完整的个人价值展示生态
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 右侧：平台图标展示 */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="relative flex justify-center items-center"
          >
            <div className="relative w-96 h-96 bg-white/90 backdrop-blur-sm rounded-full border border-emerald-200/50 shadow-xl overflow-visible">
              {/* 中心 Claude AI 图标 */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  className="group relative z-30"
                  initial={{ opacity: 0, scale: 0.3 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ 
                    duration: 0.8, 
                    delay: 0.6,
                    type: "spring",
                    stiffness: 200
                  }}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  <div 
                    className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-2xl ring-4 ring-emerald-300/50 transition-all duration-300 group-hover:shadow-3xl group-hover:ring-emerald-400/70"
                    style={{ backgroundColor: centerPlatform.color }}
                  >
                    <centerPlatform.icon className="w-10 h-10 text-white" />
                  </div>
                  
                  {/* Claude AI 标签 */}
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                    <div className="bg-emerald-600 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg whitespace-nowrap">
                      {centerPlatform.name}
                    </div>
                  </div>
                  
                  {/* 悬浮信息卡片 */}
                  <motion.div
                    className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-4 opacity-0 group-hover:opacity-100 transition-all duration-300 z-40"
                    initial={{ y: 10 }}
                    whileHover={{ y: 0 }}
                  >
                    <div className="bg-gray-800 text-white text-sm rounded-lg px-4 py-3 whitespace-nowrap shadow-xl">
                      <div className="font-semibold">{centerPlatform.name}</div>
                      <div className="text-gray-300 text-xs mt-1">{centerPlatform.description}</div>
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                    </div>
                  </motion.div>
                </motion.div>
              </div>

              {/* 围绕的平台图标 */}
              {platforms.map((platform, index) => {
                const IconComponent = platform.icon
                const angleInDegrees = index * 45 // 8个图标，每个间隔45度
                const angleInRadians = (angleInDegrees * Math.PI) / 180
                
                const containerRadius = 192
                const circleRadius = 130
                
                const x = containerRadius + Math.sin(angleInRadians) * circleRadius
                const y = containerRadius - Math.cos(angleInRadians) * circleRadius
                
                return (
                  <motion.div
                    key={platform.name}
                    className="group absolute z-20"
                    style={{
                      left: `${x - 28}px`,
                      top: `${y - 28}px`,
                    }}
                    initial={{ opacity: 0, scale: 0.3 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ 
                      duration: 0.5, 
                      delay: 0.8 + index * 0.1,
                      type: "spring",
                      stiffness: 200
                    }}
                    whileHover={{ scale: 1.2, y: -3 }}
                  >
                    <div 
                      className="w-14 h-14 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 group-hover:shadow-2xl border-2 border-white/50"
                      style={{ backgroundColor: platform.color }}
                    >
                      <IconComponent className="w-7 h-7 text-white" />
                    </div>
                    
                    {/* 悬浮信息卡片 */}
                    <motion.div
                      className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-all duration-300 z-30"
                      initial={{ y: 10 }}
                      whileHover={{ y: 0 }}
                    >
                      <div className="bg-gray-800 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-xl">
                        <div className="font-semibold">{platform.name}</div>
                        <div className="text-gray-300 text-xs mt-1">{platform.description}</div>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                      </div>
                    </motion.div>
                  </motion.div>
                )
              })}
              
              {/* 连接线动画 */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                {platforms.map((_, index) => {
                  const angleInDegrees = index * 45
                  const angleInRadians = (angleInDegrees * Math.PI) / 180
                  
                  const containerRadius = 192
                  const circleRadius = 130
                  
                  const centerX = containerRadius
                  const centerY = containerRadius
                  
                  const platformX = containerRadius + Math.sin(angleInRadians) * circleRadius
                  const platformY = containerRadius - Math.cos(angleInRadians) * circleRadius
                  
                  return (
                    <motion.line
                      key={index}
                      x1={centerX} y1={centerY}
                      x2={platformX} y2={platformY}
                      stroke="url(#emeraldGradient)"
                      strokeWidth="1.5"
                      strokeDasharray="4,4"
                      opacity="0.4"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ 
                        duration: 1.5, 
                        delay: 1.2 + index * 0.1,
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "easeInOut"
                      }}
                    />
                  )
                })}
                <defs>
                  <linearGradient id="emeraldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#10B981', stopOpacity: 0.8 }} />
                    <stop offset="50%" style={{ stopColor: '#06B6D4', stopOpacity: 0.8 }} />
                    <stop offset="100%" style={{ stopColor: '#14B8A6', stopOpacity: 0.8 }} />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </motion.div>
        </div>

        {/* 底部特色说明 */}
        <motion.div
          className="bg-gradient-to-r from-emerald-600 via-cyan-600 to-teal-600 rounded-3xl p-8 text-white text-center shadow-2xl"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <h3 className="text-2xl font-bold mb-4">未来无限可能</h3>
          <p className="text-lg opacity-90 max-w-4xl mx-auto">
            随着 AI 技术的不断发展，我们将持续集成更多平台和数据源，
            为每个人打造独一无二的智能数字分身，让价值展示更加立体、真实、动态
          </p>
        </motion.div>
      </div>
    </section>
  )
}

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
      <HeaderSection />

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

      {/* Platform Integration Section */}
      <PlatformIntegrationSection />

      {/* Features with brand cards */}
      <section id="why-choose" className="relative z-10 py-20">
        {/* 背景层优化 */}
        <div className="absolute inset-0 bg-white/40 backdrop-blur-sm"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            为什么选择 HeysMe？
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="group relative rounded-3xl bg-white/95 backdrop-blur-md border border-white/60 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 hover:bg-white">
            <CardHeader className="pb-4">
              <div className="mb-4 p-3 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl w-fit shadow-lg group-hover:shadow-emerald-200">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-xl font-bold text-gray-900">AI 智能生成</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">
                基于你的身份、目标和风格偏好，AI 自动生成专业的页面结构和内容。
              </p>
            </CardContent>
          </Card>

          <Card className="group relative rounded-3xl bg-white/95 backdrop-blur-md border border-white/60 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 hover:bg-white">
            <CardHeader className="pb-4">
              <div className="mb-4 p-3 bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl w-fit shadow-lg group-hover:shadow-teal-200">
                <Users className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-xl font-bold text-gray-900">多样化展示</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">
                支持项目作品、技能专长、工作经历等多种内容模块，全方位展示你的能力。
              </p>
            </CardContent>
          </Card>

          <Card className="group relative rounded-3xl bg-white/95 backdrop-blur-md border border-white/60 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 hover:bg-white">
            <CardHeader className="pb-4">
              <div className="mb-4 p-3 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-2xl w-fit shadow-lg group-hover:shadow-cyan-200">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-xl font-bold text-gray-900">灵活权限控制</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">
                支持公开、私密、链接可见等多种权限设置，完全掌控你的信息展示。
              </p>
            </CardContent>
          </Card>
          </div>
        </div>
      </section>

      {/* CTA with brand gradient card */}
      <section id="cta" className="container mx-auto px-4 py-20 text-center relative z-10">
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

      {/* Footer */}
      <FooterSection />

      {/* Brand decoration elements */}
      <div className="fixed top-20 left-10 w-20 h-20 bg-brand-gradient rounded-full opacity-10 animate-brand-pulse"></div>
      <div className="fixed bottom-20 right-10 w-32 h-32 bg-brand-gradient rounded-full opacity-5 animate-brand-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="fixed top-1/2 right-20 w-16 h-16 bg-brand-gradient rounded-full opacity-10 animate-brand-pulse" style={{ animationDelay: '2s' }}></div>
    </div>
  )
}
