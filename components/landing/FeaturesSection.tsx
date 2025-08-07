"use client"

import { motion } from "framer-motion"
import { useI18n } from "@/contexts/i18n-context"

import { 
  MessageSquare, 
  Code2, 
  Users, 
  Globe, 
  Bot,
  Sparkles,
  Zap,
  Palette,
  Link,
  TrendingUp
} from "lucide-react"

export function FeaturesSection() {
  const { t } = useI18n()

  const features = [
    {
      icon: MessageSquare,
      title: t('features.items.0.title'),
      description: t('features.items.0.description'),
      gradient: 'from-brand-500 to-brand-600',
      bgColor: 'bg-brand-50'
    },
    {
      icon: Code2,
      title: t('features.items.1.title'),
      description: t('features.items.1.description'),
      gradient: 'from-secondary-500 to-secondary-600',
      bgColor: 'bg-secondary-50'
    },
    {
      icon: Users,
      title: t('features.items.2.title'),
      description: t('features.items.2.description'),
      gradient: 'from-accent-500 to-accent-600',
      bgColor: 'bg-accent-50'
    },
    {
      icon: Globe,
      title: t('features.items.3.title'),
      description: t('features.items.3.description'),
      gradient: 'from-brand-600 to-secondary-500',
      bgColor: 'bg-gradient-to-br from-brand-50 to-secondary-50'
    },
    {
      icon: TrendingUp,
      title: t('features.items.4.title'),
      description: t('features.items.4.description'),
      gradient: 'from-secondary-600 to-accent-500',
      bgColor: 'bg-gradient-to-br from-secondary-50 to-accent-50'
    }
  ]

  return (
    <section className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-400 via-secondary-400 to-accent-400"></div>
        <div className="absolute top-10 left-1/4 w-32 h-32 bg-brand-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-1/4 w-32 h-32 bg-secondary-200/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-10 w-32 h-32 bg-accent-200/30 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto relative z-10">
        {/* 标题区域 */}
        <div className="text-center pt-32 pb-16">
          <motion.div
            className="flex items-center justify-center gap-3 mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="w-8 h-8 bg-gradient-to-r from-brand-500 to-secondary-500 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-semibold text-brand-600 tracking-wider uppercase">Features</span>
          </motion.div>
          
          <motion.h2 
            className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-brand-600 via-secondary-600 to-accent-600 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {t('features.title')}
          </motion.h2>
        </div>

        {/* 特色功能卡片 */}
        <div className="max-w-7xl mx-auto px-6 pb-20">
          <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon
              return (
                <motion.div
                  key={index}
                  className={`${feature.bgColor} border border-white/60 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2`}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className={`w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center shadow-lg mb-6`}>
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-4">
                      {feature.title}
                    </h3>
                    <p className="text-lg text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* AI架构展示 */}
        <motion.div
          className="mt-32 mb-32"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-12 shadow-xl border border-white/60">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold text-gray-800 mb-4">{t('features.aiArchitecture.title')}</h3>
              <p className="text-lg text-gray-600">{t('features.aiArchitecture.subtitle')}</p>
            </div>

            {/* 技术架构图 */}
            <div className="grid lg:grid-cols-3 gap-8 items-center">
              {/* 输入层 */}
              <motion.div
                className="text-center"
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 shadow-lg">
                  <h4 className="text-xl font-bold text-blue-800 mb-4">{t('features.aiArchitecture.input.title')}</h4>
                  <div className="space-y-3">
                    {(() => {
                      const items = t('features.aiArchitecture.input.items')
                      const itemsArray = Array.isArray(items) ? items : ['Conversational Input', 'Document Upload', 'Link Parsing', 'Social Media']
                      return itemsArray.map((item, index) => (
                      <motion.div
                        key={item}
                        className="bg-white rounded-lg p-3 text-sm font-medium text-blue-700 shadow-sm"
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
                      >
                        {item}
                      </motion.div>
                    ))})()}
                  </div>
                </div>
              </motion.div>

              {/* AI处理层 */}
              <motion.div
                className="text-center"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.8 }}
              >
                <div className="bg-gradient-to-br from-brand-50 to-secondary-50 rounded-2xl p-8 shadow-lg border-2 border-brand-200">
                  <div className="w-16 h-16 bg-gradient-to-r from-brand-500 to-secondary-500 rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-4">
                    <Bot className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-xl font-bold bg-gradient-to-r from-brand-600 to-secondary-600 bg-clip-text text-transparent mb-2">
                    {t('features.aiArchitecture.processing.title')}
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">{t('features.aiArchitecture.processing.subtitle')}</p>
                  <div className="space-y-2">
                    {(() => {
                      const modules = t('features.aiArchitecture.processing.modules')
                      const modulesArray = Array.isArray(modules) ? modules : ['Content Understanding', 'Value Extraction', 'Personalization', 'Continuous Optimization']
                      return modulesArray.map((module, index) => (
                      <div key={module} className="text-xs text-gray-500 bg-white/50 rounded-lg py-1 px-2">
                        {module}
                      </div>
                    ))})()}
                  </div>
                </div>
              </motion.div>

              {/* 输出层 */}
              <motion.div
                className="text-center"
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 1.0 }}
              >
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 shadow-lg">
                  <h4 className="text-xl font-bold text-green-800 mb-4">{t('features.aiArchitecture.output.title')}</h4>
                  <div className="space-y-3">
                    {(() => {
                      const items = t('features.aiArchitecture.output.items')
                      const itemsArray = Array.isArray(items) ? items : ['Tailored Homepages', 'Multi-profile Dashboard', 'Auto Updates', 'Value-Focused Presentation']
                      return itemsArray.map((item, index) => (
                      <motion.div
                        key={item}
                        className="bg-white rounded-lg p-3 text-sm font-medium text-green-700 shadow-sm"
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: 1.2 + index * 0.1 }}
                      >
                        {item}
                      </motion.div>
                    ))})()}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}