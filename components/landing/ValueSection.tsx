"use client"

import { motion } from "framer-motion"
import { useI18n } from "@/contexts/i18n-context"
import { Eye, Link, DollarSign, ArrowRight } from "lucide-react"

export function ValueSection() {
  const { t } = useI18n()

  const features = [
    {
      icon: Eye,
      title: t('value.features.0.title'),
      description: t('value.features.0.description'),
      gradient: 'from-brand-500 to-brand-600',
      bgGradient: 'from-brand-50 to-brand-100',
      iconBg: 'from-brand-500 to-brand-600'
    },
    {
      icon: Link,
      title: t('value.features.1.title'),
      description: t('value.features.1.description'),
      gradient: 'from-secondary-500 to-accent-500',
      bgGradient: 'from-secondary-50 to-accent-50',
      iconBg: 'from-secondary-500 to-accent-500'
    },
    {
      icon: DollarSign,
      title: t('value.features.2.title'),
      description: t('value.features.2.description'),
      gradient: 'from-accent-500 to-accent-600',
      bgGradient: 'from-accent-50 to-accent-100',
      iconBg: 'from-accent-500 to-accent-600'
    }
  ]

  return (
    <section className="py-20 bg-gradient-to-br from-brand-50/50 via-white to-secondary-50/50 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-64 h-64 bg-brand-300/20 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-64 h-64 bg-secondary-300/20 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-pulse" style={{animationDelay: '1000ms'}}></div>
        <div className="absolute bottom-20 left-1/3 w-64 h-64 bg-accent-300/20 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-pulse" style={{animationDelay: '2000ms'}}></div>
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
          <motion.h2 
            className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-brand-600 via-secondary-600 to-accent-600 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {t('value.title')}
          </motion.h2>
          
          <motion.p 
            className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {t('value.subtitle')}
          </motion.p>
        </motion.div>

        {/* 功能卡片 */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => {
            const IconComponent = feature.icon
            return (
              <motion.div
                key={feature.title}
                className={`group relative bg-gradient-to-br ${feature.bgGradient} rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-white/60 backdrop-blur-sm`}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 + index * 0.2 }}
                whileHover={{ scale: 1.02, y: -5 }}
              >
                {/* 背景装饰 */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/20 rounded-full blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/30 rounded-full blur-xl"></div>
                
                {/* 图标 */}
                <motion.div
                  className={`relative z-10 w-16 h-16 bg-gradient-to-r ${feature.iconBg} rounded-2xl flex items-center justify-center shadow-lg mb-6 group-hover:scale-110 transition-transform duration-300`}
                  whileHover={{ rotate: 5 }}
                >
                  <IconComponent className="w-8 h-8 text-white" />
                </motion.div>

                {/* 内容 */}
                <div className="relative z-10">
                  <h3 className={`text-2xl font-bold mb-4 bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent`}>
                    {feature.title}
                  </h3>
                  <p className="text-gray-700 leading-relaxed mb-6">
                    {feature.description}
                  </p>
                  
                  {/* 箭头指示器 */}
                  <motion.div
                    className="flex items-center text-gray-600 group-hover:text-gray-800 transition-colors duration-300"
                    whileHover={{ x: 5 }}
                  >
                    <span className="text-sm font-medium mr-2">了解更多</span>
                    <ArrowRight className="w-4 h-4" />
                  </motion.div>
                </div>

                {/* 悬浮光效 */}
                <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-3xl`}></div>
              </motion.div>
            )
          })}
        </div>


      </div>
    </section>
  )
}