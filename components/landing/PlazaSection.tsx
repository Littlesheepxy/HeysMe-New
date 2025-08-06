"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/contexts/i18n-context"
import { Building, Users, User, Rocket } from "lucide-react"

export function PlazaSection() {
  const { t } = useI18n()

  return (
    <section className="min-h-screen flex items-center py-32 bg-white relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-400 via-secondary-400 to-accent-400"></div>
        <div className="absolute top-10 left-1/4 w-32 h-32 bg-brand-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-1/4 w-32 h-32 bg-secondary-200/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-10 w-32 h-32 bg-accent-200/30 rounded-full blur-3xl"></div>
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
            {t('plaza.title')}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t('plaza.subtitle')}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {[
            { icon: Building, title: t('plaza.features.0.title'), description: t('plaza.features.0.description'), color: 'from-brand-500 to-brand-600' },
            { icon: Users, title: t('plaza.features.1.title'), description: t('plaza.features.1.description'), color: 'from-secondary-500 to-secondary-600' },
            { icon: User, title: t('plaza.features.2.title'), description: t('plaza.features.2.description'), color: 'from-accent-500 to-accent-600' }
          ].map((feature, index) => {
            const IconComponent = feature.icon
            return (
              <motion.div
                key={feature.title}
                className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                whileHover={{ scale: 1.02, y: -5 }}
              >
                <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center shadow-lg mb-6`}>
                  <IconComponent className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-800">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            )
          })}
        </div>

        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <Button
            size="lg"
            className="bg-gradient-to-r from-brand-500 to-secondary-500 hover:from-brand-600 hover:to-secondary-600 text-white px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <Rocket className="w-5 h-5 mr-2" />
            {t('plaza.cta')}
          </Button>
        </motion.div>
      </div>
    </section>
  )
}