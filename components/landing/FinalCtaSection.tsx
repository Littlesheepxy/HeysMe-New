"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useI18n } from "@/contexts/i18n-context"
import { FlickeringGrid } from "@/components/ui/flickering-grid"
import { Sparkles, ArrowRight, Rocket } from "lucide-react"

export function FinalCtaSection() {
  const { t } = useI18n()

  return (
    <section className="min-h-screen flex items-center py-32 relative overflow-hidden bg-white">
      {/* Flickering Grid 背景动效 */}
      <FlickeringGrid
        className="absolute inset-0 z-0"
        squareSize={4}
        gridGap={6}
        color="rgb(16, 185, 129)"
        maxOpacity={0.1}
        flickerChance={0.05}
      />
      {/* 简化背景装饰 */}
      <div className="absolute inset-0 z-10">
        <div className="absolute top-20 left-20 w-40 h-40 bg-emerald-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-cyan-200/30 rounded-full blur-3xl" />
      </div>
      

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          className="max-w-4xl mx-auto text-center"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <Card className="bg-white/90 backdrop-blur-xl border border-white/60 rounded-3xl shadow-2xl overflow-hidden">
            <CardContent className="p-12 md:p-16">
              {/* 主标题 */}
              <motion.h2 
                className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-emerald-600 via-cyan-600 to-emerald-600 bg-clip-text text-transparent leading-tight"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                {t('finalCta.title')}
              </motion.h2>

              {/* 副标题 */}
              <motion.p 
                className="text-xl md:text-2xl mb-12 text-gray-600 leading-relaxed max-w-2xl mx-auto"
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
                  className="group relative px-12 py-6 text-xl font-bold bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 overflow-hidden"
                >
                  <span className="relative z-10 flex items-center">
                    <Sparkles className="w-6 h-6 mr-3 group-hover:animate-spin" />
                    {t('finalCta.primaryCta')}
                    <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform duration-300" />
                  </span>
                  {/* 动画背景 */}
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-cyan-400/20 translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  className="px-12 py-6 text-xl font-bold text-gray-700 border-2 border-gray-300 hover:border-gray-400 bg-white/80 hover:bg-white rounded-2xl backdrop-blur-sm transition-all duration-300 transform hover:scale-105"
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
                <div className="flex flex-wrap justify-center gap-8 text-gray-600">
                  {(() => {
                    const features = t('finalCta.features')
                    const featuresArray = Array.isArray(features) ? features : ['Free to Start', '3-Minute Creation', 'AI Smart Generation', 'Always Editable']
                    const colors = ['bg-emerald-400', 'bg-cyan-400', 'bg-blue-400', 'bg-emerald-500']
                    return featuresArray.map((feature, index) => (
                      <div key={feature} className="flex items-center gap-2">
                        <div className={`w-2 h-2 ${colors[index]} rounded-full`}></div>
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))
                  })()}
                </div>

                {/* Slogan 循环展示 */}
                <motion.div
                  className="text-center"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: 1 }}
                >
                  <p className="text-lg text-gray-500 italic">
                    "{(() => {
                      const slogans = t('slogans')
                      const slogansArray = Array.isArray(slogans) ? slogans : []
                      return slogansArray[0] || 'Let AI create countless versions of yourself.'
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