"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/contexts/i18n-context"
import { FlickeringGrid } from "@/components/ui/flickering-grid"
import { 
  Building, 
  Users, 
  User, 
  Rocket,
  Palette, 
  Store, 
  Lightbulb, 
  TrendingUp
} from "lucide-react"

export function PlazaAndCreatorSection() {
  const { t } = useI18n()

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
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-400"></div>
        <div className="absolute top-10 left-1/4 w-32 h-32 bg-emerald-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-1/4 w-32 h-32 bg-cyan-200/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-10 w-32 h-32 bg-purple-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-1/3 w-64 h-64 bg-pink-300/20 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-pulse" style={{animationDelay: '2000ms'}}></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* 整体标题 */}
        <motion.div 
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Building className="w-4 h-4" />
            创造与连接的数字世界
          </div>
          <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-emerald-600 via-cyan-600 to-purple-600 bg-clip-text text-transparent">
            数字身份生态系统
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            连接创作者与机会，打造专业展示与合作的全方位平台
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-20 items-center">
          {/* 左侧：数字身份广场 */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="text-center lg:text-left mb-12">
              <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Building className="w-4 h-4" />
                连接与机会
              </div>
              <h3 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
                {t('plaza.title')}
              </h3>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                {t('plaza.subtitle')}
              </p>
            </div>

            <div className="space-y-6 mb-8">
              {[
                { icon: Building, title: t('plaza.features.0.title'), description: t('plaza.features.0.description'), color: 'from-emerald-500 to-emerald-600' },
                { icon: Users, title: t('plaza.features.1.title'), description: t('plaza.features.1.description'), color: 'from-cyan-500 to-cyan-600' },
                { icon: User, title: t('plaza.features.2.title'), description: t('plaza.features.2.description'), color: 'from-blue-500 to-blue-600' }
              ].map((feature, index) => {
                const IconComponent = feature.icon
                return (
                  <motion.div
                    key={feature.title}
                    className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/60"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.2 }}
                    whileHover={{ scale: 1.02, y: -5 }}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-14 h-14 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0`}>
                        <IconComponent className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold mb-2 text-gray-800">{feature.title}</h4>
                        <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <Button
                size="lg"
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                onClick={() => window.location.href = '/chat'}
              >
                <Rocket className="w-5 h-5 mr-2" />
                {t('plaza.cta')}
              </Button>
            </motion.div>
          </motion.div>

          {/* 右侧：灵感广场 */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <div className="text-center lg:text-left mb-12">
              <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Palette className="w-4 h-4" />
                创作与变现
              </div>
              <h3 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {t('creator.title')}
              </h3>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                释放创意潜能，在AI时代获得应有的价值回报
              </p>
            </div>

            <div className="space-y-6 mb-8">
              {(() => {
                const features = t('creator.features')
                const featuresArray = Array.isArray(features) ? features : []
                const icons = [Palette, Store, Lightbulb]
                const colors = ['from-purple-500 to-purple-600', 'from-pink-500 to-pink-600', 'from-indigo-500 to-indigo-600']
                
                return featuresArray.map((feature, index) => {
                  const IconComponent = icons[index] || Lightbulb
                  return (
                    <motion.div
                      key={index}
                      className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/60"
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: index * 0.2 }}
                      whileHover={{ scale: 1.02, y: -5 }}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-14 h-14 bg-gradient-to-r ${colors[index]} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0`}>
                          <IconComponent className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <p className="text-gray-700 leading-relaxed">{feature}</p>
                        </div>
                      </div>
                    </motion.div>
                  )
                })
              })()}
            </div>


            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <Button
                size="lg"
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                onClick={() => window.location.href = '/chat'}
              >
                <TrendingUp className="w-5 h-5 mr-2" />
                {t('creator.cta')}
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
