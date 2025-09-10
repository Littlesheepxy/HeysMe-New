"use client"

import { motion } from "framer-motion"
import { useI18n } from "@/contexts/i18n-context"
import { FlickeringGrid } from "@/components/ui/flickering-grid"
import { 
  Eye, 
  Link, 
  DollarSign, 
  ArrowRight,
  Briefcase,
  Star,
  Building,
  Users,
  Target
} from "lucide-react"

// 使用一个通用图标作为Freelancer的替代
const FreelancerIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z"/>
  </svg>
)

export function ValueAndUseCasesSection() {
  const { t } = useI18n()

  const valueFeatures = [
    {
      icon: Eye,
      title: t('value.features.0.title'),
      description: t('value.features.0.description'),
      gradient: 'from-emerald-500 to-emerald-600',
      bgGradient: 'from-emerald-50 to-emerald-100',
      iconBg: 'from-emerald-500 to-emerald-600'
    },
    {
      icon: Link,
      title: t('value.features.1.title'),
      description: t('value.features.1.description'),
      gradient: 'from-cyan-500 to-cyan-600',
      bgGradient: 'from-cyan-50 to-cyan-100',
      iconBg: 'from-cyan-500 to-cyan-600'
    },
    {
      icon: DollarSign,
      title: t('value.features.2.title'),
      description: t('value.features.2.description'),
      gradient: 'from-purple-500 to-purple-600',
      bgGradient: 'from-purple-50 to-purple-100',
      iconBg: 'from-purple-500 to-purple-600'
    }
  ]

  const useCases = [
    { 
      icon: Briefcase, 
      title: t('useCases.cases.0.title'), 
      description: t('useCases.cases.0.description'),
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-50 to-blue-100'
    },
    { 
      icon: FreelancerIcon, 
      title: t('useCases.cases.1.title'), 
      description: t('useCases.cases.1.description'),
      gradient: 'from-green-500 to-green-600',
      bgGradient: 'from-green-50 to-green-100'
    },
    { 
      icon: Star, 
      title: t('useCases.cases.2.title'), 
      description: t('useCases.cases.2.description'),
      gradient: 'from-pink-500 to-pink-600',
      bgGradient: 'from-pink-50 to-pink-100'
    },
    { 
      icon: Building, 
      title: t('useCases.cases.3.title'), 
      description: t('useCases.cases.3.description'),
      gradient: 'from-indigo-500 to-indigo-600',
      bgGradient: 'from-indigo-50 to-indigo-100'
    }
  ]

  return (
    <section className="min-h-screen flex items-center py-32 bg-white relative overflow-hidden">
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
        <div className="absolute top-20 left-10 w-64 h-64 bg-emerald-300/20 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-64 h-64 bg-cyan-300/20 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-pulse" style={{animationDelay: '1000ms'}}></div>
        <div className="absolute bottom-20 left-1/3 w-64 h-64 bg-purple-300/20 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-pulse" style={{animationDelay: '2000ms'}}></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* 第一部分：我们能为你带来什么 */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          {/* Removed "产品价值主张" badge as requested */}
          <motion.h2 
            className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-emerald-600 via-cyan-600 to-purple-600 bg-clip-text text-transparent"
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

        {/* 价值功能卡片 */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {valueFeatures.map((feature, index) => {
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
                    <span className="text-sm font-medium mr-2">{t('value.learnMore')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </motion.div>
                </div>

                {/* 悬浮光效 */}
                <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-3xl`}></div>
              </motion.div>
            )
          })}
        </div>

        {/* 分隔装饰线 */}
        <motion.div 
          className="flex items-center justify-center mb-20"
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-0.5 bg-gradient-to-r from-transparent to-emerald-400"></div>
            <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
            <div className="w-16 h-0.5 bg-gradient-to-r from-emerald-400 to-transparent"></div>
          </div>
        </motion.div>

        {/* 第二部分：适用人群 */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          {/* Removed "目标用户群体" badge as requested */}
          <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            {t('useCases.title')}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {t('useCases.subtitle')}
          </p>
        </motion.div>

        {/* 适用人群卡片 */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {useCases.map((useCase, index) => {
            const IconComponent = useCase.icon
            return (
              <motion.div
                key={useCase.title}
                className={`group bg-gradient-to-br ${useCase.bgGradient} rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-white/60`}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -10 }}
              >
                <motion.div
                  className={`w-16 h-16 bg-gradient-to-r ${useCase.gradient} rounded-2xl flex items-center justify-center shadow-lg mb-6 group-hover:scale-110 transition-transform duration-300 mx-auto`}
                  whileHover={{ rotate: 5 }}
                >
                  <IconComponent className="w-8 h-8 text-white" />
                </motion.div>

                <div className="text-center">
                  <h3 className={`text-xl font-bold mb-4 bg-gradient-to-r ${useCase.gradient} bg-clip-text text-transparent`}>
                    {useCase.title}
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {useCase.description}
                  </p>
                </div>

                <div className={`absolute inset-0 bg-gradient-to-r ${useCase.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-3xl`}></div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
