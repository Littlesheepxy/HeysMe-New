"use client"

import { motion } from "framer-motion"
import { useI18n } from "@/contexts/i18n-context"
import { Briefcase, Freelancer, Star, Building } from "lucide-react"

// 使用一个通用图标作为Freelancer的替代
const FreelancerIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z"/>
  </svg>
)

export function UseCasesSection() {
  const { t } = useI18n()

  const cases = [
    { 
      icon: Briefcase, 
      title: t('useCases.cases.0.title'), 
      description: t('useCases.cases.0.description'),
      gradient: 'from-brand-500 to-brand-600',
      bgGradient: 'from-brand-50 to-brand-100'
    },
    { 
      icon: FreelancerIcon, 
      title: t('useCases.cases.1.title'), 
      description: t('useCases.cases.1.description'),
      gradient: 'from-secondary-500 to-secondary-600',
      bgGradient: 'from-secondary-50 to-secondary-100'
    },
    { 
      icon: Star, 
      title: t('useCases.cases.2.title'), 
      description: t('useCases.cases.2.description'),
      gradient: 'from-accent-500 to-accent-600',
      bgGradient: 'from-accent-50 to-accent-100'
    },
    { 
      icon: Building, 
      title: t('useCases.cases.3.title'), 
      description: t('useCases.cases.3.description'),
      gradient: 'from-brand-600 to-secondary-500',
      bgGradient: 'from-brand-50 to-secondary-50'
    }
  ]

  return (
    <section className="min-h-screen flex items-center py-32 bg-gradient-to-br from-brand-50/50 via-white to-secondary-50/50 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-64 h-64 bg-brand-300/20 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-64 h-64 bg-secondary-300/20 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-pulse" style={{animationDelay: '1000ms'}}></div>
        <div className="absolute bottom-20 left-1/3 w-64 h-64 bg-accent-300/20 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-pulse" style={{animationDelay: '2000ms'}}></div>
      </div>
      <div className="container mx-auto px-6 relative z-10">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-brand-600 via-secondary-600 to-accent-600 bg-clip-text text-transparent">
            {t('useCases.title')}
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {cases.map((useCase, index) => {
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