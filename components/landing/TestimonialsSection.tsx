"use client"

import { motion } from "framer-motion"
import { useI18n } from "@/contexts/i18n-context"
import { Quote, Star } from "lucide-react"

export function TestimonialsSection() {
  const { t } = useI18n()
  
  // 获取testimonials数据，确保类型安全
  const testimonialsData = t('testimonials.items')
  const testimonials = Array.isArray(testimonialsData) ? testimonialsData : []

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
            {t('testimonials.title')}
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              className="group bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-white/60 relative overflow-hidden"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              whileHover={{ scale: 1.02, y: -5 }}
            >
              {/* 背景装饰 */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-brand-400/20 to-secondary-400/20 rounded-full blur-2xl"></div>
              
              {/* 引号图标 */}
              <motion.div
                className="w-12 h-12 bg-gradient-to-r from-brand-500 to-secondary-500 rounded-xl flex items-center justify-center shadow-lg mb-6 group-hover:scale-110 transition-transform duration-300"
                whileHover={{ rotate: 5 }}
              >
                <Quote className="w-6 h-6 text-white" />
              </motion.div>

              {/* 评价内容 */}
              <blockquote className="text-lg text-gray-700 leading-relaxed mb-6 relative z-10">
                "{testimonial.content}"
              </blockquote>

              {/* 评分 */}
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>

              {/* 作者信息 */}
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 bg-gradient-to-r from-brand-400 to-secondary-400 rounded-full flex items-center justify-center text-white font-bold">
                  {testimonial.author.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-gray-800">{testimonial.author}</div>
                  <div className="text-sm text-gray-600">{t('testimonials.userLabel')}</div>
                </div>
              </div>

              {/* 悬浮光效 */}
              <div className="absolute inset-0 bg-gradient-to-r from-brand-500/5 to-secondary-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl"></div>
            </motion.div>
          ))}
        </div>

        {/* 添加更多用户反馈的CTA */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <p className="text-lg text-gray-600 mb-6">
            {t('testimonials.joinText')}
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <div className="flex -space-x-2">
              {(() => {
                const letters = t('finalCta.userStats.letters')
                const lettersArray = Array.isArray(letters) ? letters : ['A', 'B', 'C', 'D', 'E']
                return lettersArray.map((letter, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 bg-gradient-to-r from-brand-400 to-secondary-400 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold"
                    style={{ transform: `translateX(${i * -4}px)` }}
                  >
                    {letter}
                  </div>
                ))
              })()}
            </div>
            <span className="ml-4">{t('finalCta.userStats.count')}</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}