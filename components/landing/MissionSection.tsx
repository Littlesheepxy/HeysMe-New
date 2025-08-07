"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/contexts/i18n-context"
import { Sparkles, Zap, Users, Lightbulb } from "lucide-react"

export function MissionSection() {
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
              <Lightbulb className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-brand-600 via-secondary-600 to-accent-600 bg-clip-text text-transparent">
              {t('mission.title')}
            </h2>
          </motion.div>
          
          <motion.p 
            className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {t('mission.description')}
          </motion.p>
        </motion.div>

        {/* 内容区域 */}
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* 左侧：文字内容 */}
          <motion.div
            className="space-y-8"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="space-y-6">
              <motion.p 
                className="text-lg text-gray-700 leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                {t('mission.content.line1')}
              </motion.p>
              
              <motion.p 
                className="text-lg text-gray-700 leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                {t('mission.content.line2')}
              </motion.p>
            </div>

            {/* 为什么做 HeysMe 区域 */}
            <motion.div
              className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/60"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              <h3 className="text-2xl font-bold mb-4 text-gray-800">
                {t('mission.content.whyTitle')}
              </h3>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                {t('mission.content.whyContent')}
              </p>
              
              {/* 品牌理念区域 */}
              <motion.div
                className="bg-gradient-to-r from-brand-50 via-secondary-50 to-accent-50 rounded-2xl p-6 mb-6 border-l-4 border-gradient-to-b from-brand-400 to-secondary-400"
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 1.0 }}
              >
                <h4 className="text-xl font-bold mb-3 bg-gradient-to-r from-brand-600 to-secondary-600 bg-clip-text text-transparent">
                  {t('mission.content.brandMeaning.title')}
                </h4>
                <p className="text-gray-700 text-lg leading-relaxed italic">
                  {t('mission.content.brandMeaning.description')}
                </p>
              </motion.div>
              
              <Button
                size="lg"
                className="bg-gradient-to-r from-brand-500 via-secondary-500 to-accent-500 hover:from-brand-600 hover:via-secondary-600 hover:to-accent-600 text-white px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                onClick={() => window.location.href = '/sign-up'}
              >
                <Sparkles className="w-5 h-5 mr-2" />
                {t('mission.cta')}
              </Button>
            </motion.div>
          </motion.div>

          {/* 右侧：可视化展示 */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/60">
              {/* 顶部：AI革命说明 */}
              <motion.div
                className="text-center mb-5"
                initial={{ opacity: 0, y: -20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-50 to-secondary-50 rounded-xl px-4 py-2 border border-brand-200/50">
                  <Lightbulb className="w-4 h-4 text-brand-500" />
                  <span className="text-xs font-medium text-gray-700">AI时代的身份进化</span>
                </div>
              </motion.div>

              {/* 传统方式 vs AI方式对比 */}
              <div className="space-y-5">
                {/* 传统方式 */}
                <motion.div
                  className="relative"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                >
                                      <div className="flex items-center gap-4 mb-5">
                      <div className="w-12 h-12 bg-gray-400 rounded-xl flex items-center justify-center">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                    <div>
                      <h4 className="font-bold text-gray-800 text-lg">{t('mission.comparison.traditional.title')}</h4>
                      <p className="text-sm text-gray-600">{t('mission.comparison.traditional.subtitle')}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {(() => {
                      const items = t('mission.comparison.traditional.items')
                      const itemsArray = Array.isArray(items) ? items : ['Resume', 'Business Card', 'Homepage']
                      return itemsArray.map((item, index) => (
                        <div
                          key={item}
                          className="bg-gray-100 rounded-lg p-4 text-center text-sm font-medium text-gray-600 min-h-[50px] flex items-center justify-center"
                        >
                          {item}
                        </div>
                      ))
                    })()}
                  </div>
                </motion.div>

                {/* 箭头和转换说明 */}
                <motion.div
                  className="flex flex-col items-center space-y-3"
                  initial={{ opacity: 0, scale: 0.5 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                >
                  <div className="w-10 h-10 bg-gradient-to-r from-brand-500 to-secondary-500 rounded-full flex items-center justify-center shadow-lg">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-medium text-gray-500 bg-gray-50 rounded-full px-3 py-1">
                      AI赋能进化
                    </p>
                  </div>
                </motion.div>

                {/* AI方式 */}
                <motion.div
                  className="relative"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 1.0 }}
                >
                                      <div className="flex items-center gap-4 mb-5">
                      <div className="w-12 h-12 bg-gradient-to-r from-brand-500 to-secondary-500 rounded-xl flex items-center justify-center shadow-lg">
                        <Sparkles className="w-6 h-6 text-white" />
                      </div>
                    <div>
                      <h4 className="font-bold bg-gradient-to-r from-brand-600 to-secondary-600 bg-clip-text text-transparent text-lg">{t('mission.comparison.ai.title')}</h4>
                      <p className="text-sm text-gray-600">{t('mission.comparison.ai.subtitle')}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {(() => {
                      const items = t('mission.comparison.ai.items')
                      const itemsArray = Array.isArray(items) ? items : ['Creator', 'Job Seeker', 'Freelancer', 'Collaborator']
                      const gradients = ['from-brand-400 to-brand-500', 'from-secondary-400 to-secondary-500', 'from-accent-400 to-accent-500', 'from-brand-500 to-secondary-500']
                      
                      return itemsArray.map((item, index) => (
                        <motion.div
                          key={`ai-item-${index}-${item}`}
                          className={`bg-gradient-to-r ${gradients[index]} rounded-lg p-4 text-center text-sm font-medium text-white shadow-md min-h-[50px] flex items-center justify-center`}
                          initial={{ opacity: 0, scale: 0.8 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.4, delay: 1.2 + index * 0.1 }}
                          whileHover={{ scale: 1.05 }}
                        >
                          {item}
                        </motion.div>
                      ))
                    })()}
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}