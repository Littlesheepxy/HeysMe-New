"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain, MessageSquare, Sparkles, Zap } from "lucide-react"

interface ModeSelectorProps {
  onModeSelect: (mode: 'normal' | 'professional') => void
}

export function ModeSelector({ onModeSelect }: ModeSelectorProps) {
  const [hoveredMode, setHoveredMode] = useState<string | null>(null)

  const modes = [
    {
      id: 'normal',
      title: '普通模式',
      description: '通过表单填写项目需求，系统帮您生成专业的开发提示',
      icon: Brain,
      features: ['智能表单引导', 'AI辅助填写', '自动生成提示词', '适合新手用户'],
      gradient: 'from-blue-500 to-cyan-500',
      hoverGradient: 'from-blue-600 to-cyan-600'
    },
    {
      id: 'professional',
      title: '专业模式',
      description: '直接对话描述需求，快速开始项目开发',
      icon: Zap,
      features: ['自由对话输入', '即时响应', '灵活交互', '适合有经验的开发者'],
      gradient: 'from-emerald-500 to-teal-500',
      hoverGradient: 'from-emerald-600 to-teal-600'
    }
  ]

  return (
    <div className="w-full max-w-6xl mx-auto px-4">
      <div className="text-center mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-4">
            选择您的使用模式
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            根据您的经验水平和使用习惯，选择最适合的交互方式开始您的AI开发之旅
          </p>
        </motion.div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {modes.map((mode, index) => {
          const Icon = mode.icon
          
          return (
            <motion.div
              key={mode.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              onHoverStart={() => setHoveredMode(mode.id)}
              onHoverEnd={() => setHoveredMode(null)}
              className="h-full"
            >
              <Card className="h-full cursor-pointer group hover:shadow-xl transition-all duration-300 border-2 hover:border-transparent overflow-hidden relative">
                {/* Gradient border effect */}
                <div className={`absolute inset-0 bg-gradient-to-r ${mode.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                <div className="absolute inset-[2px] bg-white dark:bg-gray-900 rounded-[calc(var(--radius)-2px)]" />
                
                <div className="relative z-10">
                  <CardHeader className="text-center pb-4">
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${mode.gradient} p-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    
                    <CardTitle className="text-2xl font-bold mb-2">
                      {mode.title}
                    </CardTitle>
                    
                    <CardDescription className="text-base">
                      {mode.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-3 mb-8">
                      {mode.features.map((feature, featureIndex) => (
                        <motion.div
                          key={featureIndex}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4, delay: 0.3 + featureIndex * 0.1 }}
                          className="flex items-center space-x-3"
                        >
                          <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${mode.gradient}`} />
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            {feature}
                          </span>
                        </motion.div>
                      ))}
                    </div>

                    <Button
                      onClick={() => onModeSelect(mode.id as 'normal' | 'professional')}
                      className={`w-full text-white font-semibold py-3 rounded-lg transition-all duration-300 transform group-hover:scale-105 bg-gradient-to-r ${
                        hoveredMode === mode.id ? mode.hoverGradient : mode.gradient
                      } hover:shadow-lg`}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      选择{mode.title}
                    </Button>
                  </CardContent>
                </div>
              </Card>
            </motion.div>
          )
        })}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="text-center mt-12"
      >
        <div className="inline-flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-full">
          <MessageSquare className="w-4 h-4" />
          <span>无论选择哪种模式，都可以随时切换</span>
        </div>
      </motion.div>
    </div>
  )
}
