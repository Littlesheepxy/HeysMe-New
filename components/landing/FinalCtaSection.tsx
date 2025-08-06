"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useI18n } from "@/contexts/i18n-context"
import { Sparkles, ArrowRight, Rocket } from "lucide-react"

export function FinalCtaSection() {
  const { t } = useI18n()

  return (
    <section className="min-h-screen flex items-center py-32 relative overflow-hidden">
      {/* 动态背景渐变 */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-600 via-secondary-600 to-accent-600"></div>
      <div className="absolute inset-0 bg-gradient-to-tl from-brand-500/30 via-transparent to-accent-500/30"></div>
      
      {/* 动画背景元素 */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full mix-blend-screen filter blur-xl opacity-50 animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/10 rounded-full mix-blend-screen filter blur-xl opacity-50 animate-pulse" style={{animationDelay: '1000ms'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full mix-blend-screen filter blur-xl opacity-50 animate-pulse" style={{animationDelay: '2000ms'}}></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          className="max-w-4xl mx-auto text-center"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <Card className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden">
            <CardContent className="p-12 md:p-16">
              {/* 主标题 */}
              <motion.h2 
                className="text-4xl md:text-6xl font-bold mb-6 text-white leading-tight"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                {t('finalCta.title')}
              </motion.h2>

              {/* 副标题 */}
              <motion.p 
                className="text-xl md:text-2xl mb-12 text-white/90 leading-relaxed max-w-2xl mx-auto"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                {t('finalCta.subtitle')}
              </motion.p>

              {/* CTA 按钮组 */}
              <motion.div 
                className="flex flex-col sm:flex-row gap-6 justify-center items-center"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                <Button
                  size="lg"
                  onClick={() => window.location.href = '/chat'}
                  className="group relative px-12 py-6 text-xl font-bold bg-white text-brand-600 hover:bg-gray-50 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 overflow-hidden"
                >
                  <span className="relative z-10 flex items-center">
                    <Sparkles className="w-6 h-6 mr-3 group-hover:animate-spin" />
                    {t('finalCta.primaryCta')}
                    <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform duration-300" />
                  </span>
                  {/* 动画背景 */}
                  <div className="absolute inset-0 bg-gradient-to-r from-brand-400/20 to-secondary-400/20 translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  className="px-12 py-6 text-xl font-bold text-white border-2 border-white/30 hover:border-white/50 bg-white/10 hover:bg-white/20 rounded-2xl backdrop-blur-sm transition-all duration-300 transform hover:scale-105"
                >
                  <Rocket className="w-6 h-6 mr-3" />
                  {t('finalCta.secondaryCta')}
                </Button>
              </motion.div>

              {/* 附加信息 */}
              <motion.div
                className="mt-12 space-y-4"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.8 }}
              >
                <div className="flex flex-wrap justify-center gap-8 text-white/80">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-brand-400 rounded-full"></div>
                    <span className="text-sm">免费开始</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-secondary-400 rounded-full"></div>
                    <span className="text-sm">3分钟创建</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-accent-400 rounded-full"></div>
                    <span className="text-sm">AI智能生成</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-brand-500 rounded-full"></div>
                    <span className="text-sm">随时可修改</span>
                  </div>
                </div>

                {/* Slogan 循环展示 */}
                <motion.div
                  className="text-center"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: 1 }}
                >
                  <p className="text-lg text-white/60 italic">
                    "{(() => {
                      const slogans = t('slogans')
                      const slogansArray = Array.isArray(slogans) ? slogans : []
                      return slogansArray[0] || '让AI为你创造无数个自己。'
                    })()}"
                  </p>
                </motion.div>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}