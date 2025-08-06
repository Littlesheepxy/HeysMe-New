"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/contexts/i18n-context"
import { Palette, Store, Lightbulb, TrendingUp } from "lucide-react"

export function CreatorHubSection() {
  const { t } = useI18n()

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
            {t('creator.title')}
          </h2>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="space-y-8">
              {(() => {
                const features = t('creator.features')
                const featuresArray = Array.isArray(features) ? features : []
                return featuresArray.map((feature, index) => (
                <motion.div
                  key={index}
                  className="flex items-start gap-4"
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-brand-500 to-secondary-500 rounded-xl flex items-center justify-center shadow-lg">
                    {index === 0 && <Palette className="w-6 h-6 text-white" />}
                    {index === 1 && <Store className="w-6 h-6 text-white" />}
                    {index === 2 && <Lightbulb className="w-6 h-6 text-white" />}
                  </div>
                  <div>
                    <p className="text-lg text-gray-700 leading-relaxed">{feature}</p>
                  </div>
                </motion.div>
                ))
              })()}
            </div>

            <motion.div
              className="mt-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <Button
                size="lg"
                className="bg-gradient-to-r from-secondary-500 to-accent-500 hover:from-secondary-600 hover:to-accent-600 text-white px-8 py-4 rounded-2xl shadow-brand-lg hover:shadow-brand-xl transition-all duration-300 transform hover:scale-105"
              >
                <TrendingUp className="w-5 h-5 mr-2" />
                {t('creator.cta')}
              </Button>
            </motion.div>
          </motion.div>

          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            {/* 创作者平台可视化展示 */}
            <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">创作者收益模式</h3>
              </div>
              
              <div className="space-y-6">
                {[
                  { title: '模板设计', earning: '$50-500', color: 'from-brand-400 to-brand-600' },
                  { title: 'Prompt创作', earning: '$20-200', color: 'from-secondary-400 to-secondary-600' },
                  { title: '定制服务', earning: '$100-1000', color: 'from-accent-400 to-accent-600' }
                ].map((item, index) => (
                  <motion.div
                    key={item.title}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.6 + index * 0.2 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 bg-gradient-to-r ${item.color} rounded-lg flex items-center justify-center`}>
                        <span className="text-white font-bold text-sm">{index + 1}</span>
                      </div>
                      <span className="font-medium text-gray-800">{item.title}</span>
                    </div>
                    <span className={`font-bold bg-gradient-to-r ${item.color} bg-clip-text text-transparent`}>
                      {item.earning}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}