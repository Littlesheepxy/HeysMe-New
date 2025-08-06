"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useI18n, LanguageSwitch } from "@/contexts/i18n-context"
import { useState, useEffect } from "react"

export function HeaderSection() {
  const { t } = useI18n()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
    setIsMobileMenuOpen(false)
  }

  const navigation = [
    { name: '产品特色', href: '#features' },
    { name: '使用场景', href: '#use-cases' },
    { name: '创作者平台', href: '#creator-hub' },
    { name: '立即体验', href: '#final-cta' },
  ]

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      <div className="flex justify-center pt-6 px-4">
        <motion.div
          animate={{
            scale: isScrolled ? 0.95 : 1,
            y: isScrolled ? -2 : 0
          }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={`
            flex items-center justify-between rounded-full backdrop-blur-md transition-all duration-300 w-full max-w-7xl
            ${isScrolled 
              ? 'bg-white/80 border border-emerald-200/50 px-8 py-1.5 shadow-lg' 
              : 'bg-white/20 border border-white/30 px-12 py-2'
            }
          `}
        >
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">H</span>
              </div>
              <div>
                <span className={`font-bold text-xl ${isScrolled ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent' : 'text-white'}`}>
                  HeysMe
                </span>
                <div className={`text-xs ${isScrolled ? 'text-gray-500' : 'text-white/70'}`}>
                  AI Digital Twin
                </div>
              </div>
            </div>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8 flex-1 justify-center">
            {navigation.map((item, index) => (
              <motion.button
                key={item.name}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => scrollToSection(item.href.slice(1))}
                className={`font-medium transition-colors duration-200 relative group text-sm ${
                  isScrolled 
                    ? 'text-gray-700 hover:text-emerald-600' 
                    : 'text-white/90 hover:text-white'
                }`}
              >
                {item.name}
                <span className={`absolute -bottom-0.5 left-0 w-0 h-0.5 transition-all duration-200 group-hover:w-full ${
                  isScrolled 
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-500' 
                    : 'bg-white'
                }`}></span>
              </motion.button>
            ))}
          </nav>

          {/* Right side: Language Switch + Auth Buttons */}
          <div className="hidden lg:flex items-center space-x-4">
            {/* Language Switch */}
            <div className={`${isScrolled ? '' : 'opacity-90'}`}>
              <LanguageSwitch />
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center space-x-3">
              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => window.location.href = '/sign-in'}
                className={`group relative px-5 py-2 rounded-full font-medium text-sm transition-all duration-300 ${
                  isScrolled 
                    ? 'text-gray-700 hover:text-gray-900 bg-white/80 hover:bg-white border border-gray-200/60 hover:border-gray-300/80 shadow-sm hover:shadow-md' 
                    : 'text-white/90 hover:text-white bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 backdrop-blur-md'
                }`}
              >
                <span className="relative z-10">登录</span>
                {isScrolled && (
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-gray-50 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                )}
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => window.location.href = '/sign-up'}
                className={`group relative px-5 py-2 rounded-full font-medium text-sm transition-all duration-300 overflow-hidden ${
                  isScrolled 
                    ? 'text-white bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-600 hover:via-emerald-700 hover:to-teal-700 shadow-lg hover:shadow-xl hover:shadow-emerald-200/40 border-0' 
                    : 'text-white bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:via-emerald-600 hover:to-teal-600 shadow-lg hover:shadow-xl hover:shadow-emerald-300/30 border border-emerald-300/20'
                }`}
              >
                <span className="relative z-10">注册</span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full blur opacity-20 group-hover:opacity-30 transition-opacity duration-300" />
              </motion.button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden ml-4">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`focus:outline-none ${
                isScrolled 
                  ? 'text-gray-700 hover:text-emerald-600' 
                  : 'text-white/90 hover:text-white'
              }`}
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="lg:hidden mt-2 mx-4"
          >
            <div className={`backdrop-blur-md rounded-2xl px-4 py-3 ${
              isScrolled 
                ? 'bg-white/90 border border-emerald-100' 
                : 'bg-white/20 border border-white/30'
            }`}>
              <div className="space-y-3">
                {/* Navigation Links */}
                {navigation.map((item) => (
                  <motion.button
                    key={item.name}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => scrollToSection(item.href.slice(1))}
                    className={`block w-full text-left px-3 py-2 rounded-lg transition-colors duration-200 text-sm ${
                      isScrolled 
                        ? 'text-gray-700 hover:text-emerald-600 hover:bg-emerald-50' 
                        : 'text-white/90 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {item.name}
                  </motion.button>
                ))}
                
                {/* Language Switch Mobile */}
                <div className="px-3 py-2">
                  <LanguageSwitch />
                </div>
                
                {/* Mobile Auth Buttons */}
                <div className="pt-3 border-t border-white/20 space-y-3">
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => window.location.href = '/sign-in'}
                    className={`group relative w-full px-5 py-2.5 rounded-full font-medium text-sm text-center transition-all duration-300 ${
                      isScrolled 
                        ? 'text-gray-700 hover:text-gray-900 bg-white/80 hover:bg-white border border-gray-200/60 shadow-sm hover:shadow-md' 
                        : 'text-white/90 hover:text-white bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md'
                    }`}
                  >
                    <span className="relative z-10">登录</span>
                    {isScrolled && (
                      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-gray-50 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    )}
                  </motion.button>
                  
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => window.location.href = '/sign-up'}
                    className={`group relative w-full px-5 py-2.5 rounded-full font-medium text-sm text-center transition-all duration-300 overflow-hidden ${
                      isScrolled 
                        ? 'text-white bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-600 hover:via-emerald-700 hover:to-teal-700 shadow-lg hover:shadow-xl hover:shadow-emerald-200/40 border-0' 
                        : 'text-white bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:via-emerald-600 hover:to-teal-600 shadow-lg hover:shadow-xl hover:shadow-emerald-300/30 border border-emerald-300/20'
                    }`}
                  >
                    <span className="relative z-10">注册</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full blur opacity-20 group-hover:opacity-30 transition-opacity duration-300" />
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}