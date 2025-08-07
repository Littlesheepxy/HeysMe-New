"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Play } from "lucide-react"
import { useI18n } from "@/contexts/i18n-context"
import CardSwap, { Card as SwapCard } from "@/components/ui/CardSwap/CardSwap"
import RotatingText from "@/components/ui/RotatingText"
import { Brain, Target, Palette, Shield } from "lucide-react"

export function HeroSection() {
  const { t, locale } = useI18n()
  
  // 旋转文字数据
  const rotatingWords = {
    zh: ['智能', '动态', '可变现'],
    en: ['Smart', 'Dynamic', 'Monetizable']
  }
  
  // 基础标题（不包含旋转部分）
  const baseTitle = {
    zh: 'AI时代的下一代LinkedIn',
    en: 'The Next LinkedIn for the AI Era'
  }

  return (
    <section className="relative z-10 overflow-hidden min-h-screen flex items-center">
      <div className="container mx-auto px-4 py-32 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:items-start">
          {/* Left side: Hero content */}
          <motion.div 
            className="text-center lg:text-left lg:pt-16 relative z-20"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Badge className="mb-6 bg-white/20 backdrop-blur-sm text-white border border-white/30" variant="secondary">
                {t('hero.badge')}
              </Badge>
            </motion.div>

            <motion.h1 
              className="text-4xl lg:text-5xl font-bold mb-6 text-white drop-shadow-lg leading-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <div className="mb-2">{baseTitle[locale as keyof typeof baseTitle]}</div>
              <div className="flex items-center">
                <span className="text-emerald-200 mr-3">—</span>
                <div className="inline-block bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30 px-4 py-2 min-w-[120px] text-center overflow-hidden">
                  <RotatingText
                    texts={rotatingWords[locale as keyof typeof rotatingWords]}
                    mainClassName="inline-block text-white font-bold"
                    splitLevelClassName="overflow-hidden"
                    elementLevelClassName="inline-block"
                    staggerFrom="first"
                    initial={{ y: "100%", opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: "-100%", opacity: 0 }}
                    staggerDuration={0.05}
                    transition={{ type: "spring", damping: 25, stiffness: 400 }}
                    rotationInterval={2500}
                    splitBy="characters"
                  />
                </div>
              </div>
            </motion.h1>

            <motion.p 
              className="text-lg lg:text-xl mb-8 max-w-xl text-white/90 drop-shadow-md leading-relaxed"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              {t('hero.subtitle')}
            </motion.p>

            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              <Button
                variant="brand"
                size="lg"
                onClick={() => window.location.href = '/chat'}
                className="text-lg px-8 py-4 rounded-2xl shadow-brand-xl hover:shadow-brand-glow transition-all duration-300 transform hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #34D399 0%, #2DD4BF 50%, #22D3EE 100%)',
                  color: 'white'
                }}
              >
                <Sparkles className="w-5 h-5 mr-2" />
                {t('hero.primaryCta')}
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="text-lg px-8 py-4 rounded-2xl bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 transition-all duration-300"
              >
                <Play className="w-5 h-5 mr-2" />
                {t('hero.secondaryCta')}
              </Button>
            </motion.div>
          </motion.div>

          {/* Right side: CardSwap with new content */}
          <motion.div 
            className="relative h-[600px] hidden lg:block z-20"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <div className="absolute left-0 top-[60%] -translate-y-1/2 w-full max-w-lg">
              <CardSwap
                cardDistance={60}
                verticalDistance={70}
                delay={4000}
                pauseOnHover={true}
              >
                <SwapCard
                  customClass="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 shadow-2xl"
                  className="text-gray-900 overflow-hidden"
                >
                  {/* 浏览器标题栏 */}
                  <div className="bg-gradient-to-r from-emerald-100 to-emerald-50 border-b border-emerald-200 px-4 py-3 flex items-center gap-3">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full shadow-sm"></div>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full shadow-sm"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>
                    </div>
                    <div className="flex-1 flex justify-center">
                      <div className="bg-white/80 backdrop-blur-sm rounded-lg px-4 py-2 text-xs text-emerald-700 border border-emerald-300 max-w-52 flex items-center gap-2 shadow-sm">
                        <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                        <span className="font-medium">HeysMe.ai/digital-twin</span>
                      </div>
                    </div>
                  </div>
                  {/* 内容区域 */}
                  <div className="p-6 text-center bg-gradient-to-b from-white to-emerald-50/50">
                    <div className="mb-4 inline-block">
                      <Brain className="w-8 h-8 text-emerald-600" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-lg font-bold mb-3 text-emerald-900">{t('hero.cards.digitalTwin.title')}</h3>
                    <p className="text-emerald-700 text-sm leading-relaxed">
                      {t('hero.cards.digitalTwin.description')}
                    </p>
                    <div className="mt-4 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full"></div>
                  </div>
                </SwapCard>
                
                <SwapCard
                  customClass="bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200 shadow-2xl"
                  className="text-gray-900 overflow-hidden"
                >
                  {/* 浏览器标题栏 */}
                  <div className="bg-gradient-to-r from-teal-100 to-teal-50 border-b border-teal-200 px-4 py-3 flex items-center gap-3">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full shadow-sm"></div>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full shadow-sm"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>
                    </div>
                    <div className="flex-1 flex justify-center">
                      <div className="bg-white/80 backdrop-blur-sm rounded-lg px-4 py-2 text-xs text-teal-700 border border-teal-300 max-w-52 flex items-center gap-2 shadow-sm">
                        <div className="w-3 h-3 bg-teal-500 rounded-full"></div>
                        <span className="font-medium">HeysMe.ai/monetization</span>
                      </div>
                    </div>
                  </div>
                  {/* 内容区域 */}
                  <div className="p-6 text-center bg-gradient-to-b from-white to-teal-50/50">
                    <div className="mb-4 inline-block">
                      <Target className="w-8 h-8 text-teal-600" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-lg font-bold mb-3 text-teal-900">{t('hero.cards.monetization.title')}</h3>
                    <p className="text-teal-700 text-sm leading-relaxed">
                      {t('hero.cards.monetization.description')}
                    </p>
                    <div className="mt-4 h-1 bg-gradient-to-r from-teal-400 to-teal-600 rounded-full"></div>
                  </div>
                </SwapCard>
                
                <SwapCard
                  customClass="bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200 shadow-2xl"
                  className="text-gray-900 overflow-hidden"
                >
                  {/* 浏览器标题栏 */}
                  <div className="bg-gradient-to-r from-cyan-100 to-cyan-50 border-b border-cyan-200 px-4 py-3 flex items-center gap-3">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full shadow-sm"></div>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full shadow-sm"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>
                    </div>
                    <div className="flex-1 flex justify-center">
                      <div className="bg-white/80 backdrop-blur-sm rounded-lg px-4 py-2 text-xs text-cyan-700 border border-cyan-300 max-w-52 flex items-center gap-2 shadow-sm">
                        <div className="w-3 h-3 bg-cyan-500 rounded-full"></div>
                        <span className="font-medium">HeysMe.ai/dynamic</span>
                      </div>
                    </div>
                  </div>
                  {/* 内容区域 */}
                  <div className="p-6 text-center bg-gradient-to-b from-white to-cyan-50/50">
                    <div className="mb-4 inline-block">
                      <Palette className="w-8 h-8 text-cyan-600" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-lg font-bold mb-3 text-cyan-900">{t('hero.cards.evolution.title')}</h3>
                    <p className="text-cyan-700 text-sm leading-relaxed">
                      {t('hero.cards.evolution.description')}
                    </p>
                    <div className="mt-4 h-1 bg-gradient-to-r from-cyan-400 to-cyan-600 rounded-full"></div>
                  </div>
                </SwapCard>
                
                <SwapCard
                  customClass="bg-gradient-to-br from-brand-50 to-brand-100 border-brand-200 shadow-2xl"
                  className="text-gray-900 overflow-hidden"
                >
                  {/* 浏览器标题栏 */}
                  <div className="bg-gradient-to-r from-brand-100 to-brand-50 border-b border-brand-200 px-4 py-3 flex items-center gap-3">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full shadow-sm"></div>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full shadow-sm"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>
                    </div>
                    <div className="flex-1 flex justify-center">
                      <div className="bg-white/80 backdrop-blur-sm rounded-lg px-4 py-2 text-xs text-brand-700 border border-brand-300 max-w-52 flex items-center gap-2 shadow-sm">
                        <div className="w-3 h-3 bg-brand-500 rounded-full"></div>
                        <span className="font-medium">HeysMe.ai/multi-identity</span>
                      </div>
                    </div>
                  </div>
                  {/* 内容区域 */}
                  <div className="p-6 text-center bg-gradient-to-b from-white to-brand-50/50">
                    <div className="mb-4 inline-block">
                      <Shield className="w-8 h-8 text-brand-600" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-lg font-bold mb-3 text-brand-900">{t('hero.cards.multiIdentity.title')}</h3>
                    <p className="text-brand-700 text-sm leading-relaxed">
                      {t('hero.cards.multiIdentity.description')}
                    </p>
                    <div className="mt-4 h-1 bg-gradient-to-r from-brand-400 to-brand-600 rounded-full"></div>
                  </div>
                </SwapCard>
              </CardSwap>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}