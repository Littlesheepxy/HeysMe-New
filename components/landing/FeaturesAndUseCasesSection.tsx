"use client"

import { motion } from "framer-motion"
import { useI18n } from "@/contexts/i18n-context"
import { BentoCard, BentoGrid } from "@/components/ui/bento-grid"
import { FlickeringGrid } from "@/components/ui/flickering-grid"

import {
  MessageSquare,
  Code2,
  Users,
  Globe,
  Bot,
  Sparkles
} from "lucide-react"

export function FeaturesSection() {
  const { t } = useI18n()

  const features = [
    {
      Icon: MessageSquare,
      name: t('features.items.0.title'),
      description: t('features.items.0.description'),
      href: "#",
      cta: "了解更多",
      className: "lg:row-start-1 lg:row-end-4 lg:col-start-2 lg:col-end-3",
      background: (
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-cyan-500/10 to-emerald-500/20">
          <FlickeringGrid
            className="absolute inset-0"
            squareSize={6}
            gridGap={8}
            color="rgb(16, 185, 129)"
            maxOpacity={0.3}
            flickerChance={0.1}
          />
          <div className="absolute top-4 right-4 w-16 h-16 bg-emerald-400/30 rounded-full blur-xl animate-pulse" />
          <div className="absolute bottom-8 left-8 w-12 h-12 bg-cyan-400/30 rounded-full blur-lg animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <MessageSquare className="w-24 h-24 text-emerald-400/20" />
          </div>
        </div>
      ),
    },
    {
      Icon: Code2,
      name: t('features.items.1.title'),
      description: t('features.items.1.description'),
      href: "#",
      cta: "立即体验",
      className: "lg:col-start-1 lg:col-end-2 lg:row-start-1 lg:row-end-3",
      background: (
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-blue-500/10 to-cyan-500/20">
          <div className="absolute inset-0 grid grid-cols-6 grid-rows-4 gap-2 p-4 opacity-20">
            {Array.from({ length: 24 }).map((_, i) => (
              <motion.div
                key={i}
                className="bg-cyan-400 rounded-sm"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 2, delay: i * 0.1, repeat: Infinity }}
              />
            ))}
          </div>
          <div className="absolute top-4 right-4">
            <Code2 className="w-16 h-16 text-cyan-400/40" />
          </div>
        </div>
      ),
    },
    {
      Icon: Users,
      name: t('features.items.2.title'),
      description: t('features.items.2.description'),
      href: "#",
      cta: "探索场景",
      className: "lg:col-start-1 lg:col-end-2 lg:row-start-3 lg:row-end-4",
      background: (
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-pink-500/10 to-purple-500/20">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <Users className="w-20 h-20 text-purple-400/30" />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-pink-400 rounded-full animate-bounce" />
              <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }} />
            </div>
          </div>
        </div>
      ),
    },
    {
      Icon: Globe,
      name: t('features.items.3.title'),
      description: t('features.items.3.description'),
      href: "#",
      cta: "获取域名",
      className: "lg:col-start-3 lg:col-end-3 lg:row-start-1 lg:row-end-2",
      background: (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-indigo-500/10 to-blue-500/20">
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <Globe className="w-16 h-16 text-blue-400/40" />
            </motion.div>
          </div>
          <div className="absolute top-2 left-2 w-3 h-3 bg-blue-400 rounded-full animate-ping" />
          <div className="absolute bottom-2 right-2 w-2 h-2 bg-indigo-400 rounded-full animate-ping" style={{ animationDelay: '1s' }} />
        </div>
      ),
    },
    {
      Icon: Bot,
      name: t('features.items.4.title'),
      description: t('features.items.4.description'),
      href: "#",
      cta: "查看演进",
      className: "lg:col-start-3 lg:col-end-3 lg:row-start-2 lg:row-end-4",
      background: (
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 via-emerald-500/10 to-green-500/20">
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <motion.div
              animate={{ y: [-10, 0, -10] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Bot className="w-16 h-16 text-green-400/40" />
            </motion.div>
            <div className="flex gap-2">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 bg-green-400 rounded-full"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }}
                />
              ))}
            </div>
          </div>
        </div>
      ),
    },
  ]


  return (
    <section className="py-20 relative overflow-hidden bg-white">
      {/* Flickering Grid 背景动效 */}
      <FlickeringGrid
        className="absolute inset-0 z-0"
        squareSize={4}
        gridGap={6}
        color="rgb(16, 185, 129)"
        maxOpacity={0.1}
        flickerChance={0.05}
      />
      {/* 背景装饰 */}
      <div className="absolute inset-0 z-10">
        <div className="absolute top-20 left-20 w-40 h-40 bg-emerald-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-cyan-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-blue-200/20 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* 第一部分：产品核心功能 */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            AI 驱动的核心功能
          </div>
          <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-emerald-600 via-cyan-600 to-emerald-600 bg-clip-text text-transparent">
            {t('features.title')}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            基于最新AI技术，为你打造全方位的数字身份管理系统
          </p>
        </motion.div>

        {/* Bento Grid */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-16"
        >
          <BentoGrid className="lg:grid-rows-3 max-w-6xl mx-auto">
            {features.map((feature, idx) => (
              <BentoCard key={idx} {...feature} />
            ))}
          </BentoGrid>
        </motion.div>

      </div>
    </section>
  )
}
