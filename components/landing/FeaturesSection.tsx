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
    <section className="py-20 bg-white relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-400 via-secondary-400 to-accent-400"></div>
        <div className="absolute top-10 left-1/4 w-32 h-32 bg-brand-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-1/4 w-32 h-32 bg-secondary-200/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-10 w-32 h-32 bg-accent-200/30 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* 标题区域 */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="flex items-center justify-center gap-3 mb-6"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="p-3 bg-gradient-to-r from-brand-500 to-secondary-500 rounded-2xl shadow-lg">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-brand-600 via-secondary-600 to-accent-600 bg-clip-text text-transparent">
              {t('features.title')}
            </h2>
          </motion.div>
        </motion.div>

        {/* 功能网格 */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => {
            const IconComponent = feature.icon
            return (
              <motion.div
                key={feature.title}
                className={`group relative ${feature.bgColor} rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-white/60 backdrop-blur-sm`}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 + index * 0.1 }}
                whileHover={{ scale: 1.02, y: -5 }}
              >
                {/* 图标 */}
                <motion.div
                  className={`w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center shadow-lg mb-6 group-hover:scale-110 transition-transform duration-300`}
                  whileHover={{ rotate: 5 }}
                >
                  <IconComponent className="w-8 h-8 text-white" />
                </motion.div>

                {/* 内容 */}
                <div>
                  <h3 className="text-xl font-bold mb-4 text-gray-800">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                {/* 悬浮光效 */}
                <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-3xl`}></div>
              </motion.div>
            )
          })}
        </div>

        {/* 技术架构展示 */}
        <motion.div
          className="bg-white/90 backdrop-blur-sm rounded-3xl p-12 shadow-xl border border-white/60"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-800 mb-4">AI核心技术架构</h3>
            <p className="text-lg text-gray-600">基于Claude AI的智能职业身份生成与管理系统</p>
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
                <h4 className="text-xl font-bold text-blue-800 mb-4">智能输入</h4>
                <div className="space-y-3">
                  {['对话输入', '文档上传', '链接解析', '社交媒体'].map((item, index) => (
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
                  ))}
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
              <div className="relative">
                {/* 中心AI核心 */}
                <motion.div
                  className="bg-gradient-to-r from-brand-500 to-secondary-500 rounded-3xl p-8 text-white shadow-2xl"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Bot className="w-12 h-12 mx-auto mb-4" />
                  <h4 className="text-2xl font-bold mb-2">Claude AI</h4>
                  <p className="text-brand-100">智能分析引擎</p>
                </motion.div>

                {/* 环绕的处理模块 */}
                {[
                  { name: '内容理解', position: 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2' },
                  { name: '价值提取', position: 'top-1/2 right-0 translate-x-1/2 -translate-y-1/2' },
                  { name: '个性化', position: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2' },
                  { name: '动态优化', position: 'top-1/2 left-0 -translate-x-1/2 -translate-y-1/2' }
                ].map((module, index) => (
                  <motion.div
                    key={module.name}
                    className={`absolute ${module.position} bg-white rounded-lg px-3 py-2 text-xs font-medium text-brand-700 shadow-lg border border-brand-200`}
                    initial={{ opacity: 0, scale: 0.5 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 1.0 + index * 0.1 }}
                  >
                    {module.name}
                  </motion.div>
                ))}
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
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-6 shadow-lg">
                <h4 className="text-xl font-bold text-emerald-800 mb-4">智能输出</h4>
                <div className="space-y-3">
                  {['个性化主页', '多身份管理', '动态更新', '价值展示'].map((item, index) => (
                    <motion.div
                      key={item}
                      className="bg-white rounded-lg p-3 text-sm font-medium text-emerald-700 shadow-sm"
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: 1.2 + index * 0.1 }}
                    >
                      {item}
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}