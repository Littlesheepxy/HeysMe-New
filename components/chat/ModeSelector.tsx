"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Brain, Zap, Sparkles, MessageSquare } from "lucide-react"

interface ModeSelectorProps {
  onModeSelect: (mode: 'guided' | 'professional') => void
}

export function ModeSelector({ onModeSelect }: ModeSelectorProps) {
  const [hoveredMode, setHoveredMode] = useState<string | null>(null)

  const modes = [
    {
      id: 'guided',
      title: '普通模式',
      subtitle: '智能引导创建',
      description: '通过智能问答引导，AI帮您一步步构建完美项目',
      icon: Sparkles,
      features: ['智能问答引导', 'AI选项推荐', '零门槛上手', '适合新手用户'],
      gradient: 'from-blue-500 via-purple-500 to-pink-500',
      bgColor: 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500',
      delay: 0.1
    },
    {
      id: 'professional', 
      title: '专业模式',
      subtitle: '直接对话创建',
      description: '自由描述需求，即时开始专业级项目开发',
      icon: Zap,
      features: ['自由对话输入', '即时响应', '专业级功能', '适合有经验用户'],
      gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
      bgColor: 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500',
      delay: 0.2
    }
  ]

  return (
    <div className="w-full max-w-4xl mx-auto px-6">
      {/* 标题区域 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-8"
      >
        <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
          选择您的创建模式
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          根据您的使用习惯，选择最适合的方式开始AI项目创建
        </p>
      </motion.div>

      {/* 斜边拼接按钮容器 */}
      <div className="relative flex justify-center items-center">
        <div className="relative flex">{modes.map((mode, index) => {
          const isLeft = index === 0
          const isHovered = hoveredMode === mode.id
          
          return (
            <motion.div
              key={mode.id}
              initial={{ opacity: 0, x: isLeft ? -30 : 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ 
                duration: 0.6, 
                delay: mode.delay,
                type: "spring",
                stiffness: 100
              }}
              onHoverStart={() => setHoveredMode(mode.id)}
              onHoverEnd={() => setHoveredMode(null)}
              className="relative"
            >
              {/* 按钮主体 */}
              <motion.button
                onClick={() => onModeSelect(mode.id as 'guided' | 'professional')}
                className={`
                  relative h-20 px-8 flex items-center justify-center
                  font-medium transition-all duration-300 cursor-pointer
                  ${isLeft 
                    ? 'rounded-l-3xl pr-6' 
                    : 'rounded-r-3xl pl-6 -ml-4'
                  }
                  ${isHovered 
                    ? 'text-white shadow-2xl' 
                    : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-[#212121] border-2 border-gray-200 dark:border-[#2a2a2a] shadow-lg'
                  }
                  hover:scale-105
                  group
                `}
                style={{
                  clipPath: isLeft 
                    ? 'polygon(0 0, 100% 0, calc(100% - 25px) 100%, 0 100%)'
                    : 'polygon(25px 0, 100% 0, 100% 100%, 0 100%)',
                  minWidth: '300px'
                }}
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: `0 20px 40px ${mode.id === 'guided' ? 'rgba(99, 102, 241, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
                }}
                whileTap={{ scale: 0.98 }}
              >
                {/* 悬停时的渐变背景 */}
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-r ${mode.gradient} transition-opacity duration-300 ${
                    isLeft ? 'rounded-l-3xl' : 'rounded-r-3xl'
                  }`}
                  style={{
                    clipPath: isLeft 
                      ? 'polygon(0 0, 100% 0, calc(100% - 25px) 100%, 0 100%)'
                      : 'polygon(25px 0, 100% 0, 100% 100%, 0 100%)',
                    opacity: isHovered ? 1 : 0
                  }}
                />
                
                {/* 内容 */}
                <div className="relative z-10 flex items-center gap-4">
                  <motion.div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 ${
                      isHovered 
                        ? 'bg-white/20' 
                        : `bg-gradient-to-r ${mode.gradient}`
                    }`}
                    whileHover={{ rotate: 5 }}
                  >
                    <mode.icon className={`w-5 h-5 ${isHovered ? 'text-white' : 'text-white'}`} />
                  </motion.div>
                  
                  <div className="text-left">
                    <div className="font-bold text-lg">{mode.title}</div>
                    <div className={`text-sm transition-all duration-300 ${
                      isHovered ? 'text-white/90' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {mode.subtitle}
                    </div>
                    <div className={`text-xs mt-1 transition-all duration-300 ${
                      isHovered ? 'text-white/75' : 'text-gray-400 dark:text-gray-500'
                    }`}>
                      {mode.description}
                    </div>
                  </div>
                </div>
              </motion.button>

              {/* 悬停时显示的特性标签 */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2, delay: 0.1 }}
                    className="absolute top-24 left-1/2 transform -translate-x-1/2 z-50"
                  >
                    <div className="flex flex-wrap gap-2 justify-center max-w-xs">
                      {mode.features.map((feature, featureIndex) => (
                        <motion.div
                          key={featureIndex}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ 
                            duration: 0.2, 
                            delay: 0.1 + featureIndex * 0.05 
                          }}
                          className={`px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${mode.gradient} text-white shadow-lg`}
                        >
                          {feature}
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
        </div>
      </div>

      {/* 底部提示 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="text-center mt-8"
      >
        <div className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-[#212121] px-4 py-2 rounded-full border border-gray-200 dark:border-[#2a2a2a]">
          <MessageSquare className="w-4 h-4" />
          <span>选择后可随时切换模式</span>
        </div>
      </motion.div>
    </div>
  )
}