"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { Languages } from 'lucide-react'

// 支持的语言类型
export type Locale = 'zh' | 'en'

// 语言配置
export const LOCALES: Record<Locale, { name: string; flag: string }> = {
  zh: { name: '中文', flag: '🇨🇳' },
  en: { name: 'English', flag: '🇺🇸' }
}

// 国际化上下文类型
interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string) => any  // 支持返回字符串、数组或对象
  isLoading: boolean
}

// 创建上下文
const I18nContext = createContext<I18nContextType | undefined>(undefined)

// 国际化Provider
export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>('zh')
  const [currentTranslations, setCurrentTranslations] = useState<Record<string, any>>({})
  const [isLoading, setIsLoading] = useState(true)

  // 加载翻译文件
  const loadTranslations = async (lang: Locale) => {
    try {
      setIsLoading(true)
      // 添加时间戳参数来破坏缓存，确保获取最新的翻译文件
      const timestamp = Date.now()
      const response = await fetch(`/locales/${lang}/landing.json?v=${timestamp}`, {
        cache: 'no-store', // 禁用缓存
        headers: {
          'Cache-Control': 'no-cache', // 强制不使用缓存
          'Pragma': 'no-cache'
        }
      })
      if (!response.ok) {
        throw new Error(`Failed to fetch translations for ${lang}`)
      }
      const data = await response.json()
      setCurrentTranslations(data)
      console.log(`✅ 已加载 ${lang} 翻译文件 (${timestamp})`, data)
      setIsLoading(false)
    } catch (error) {
      console.error(`Failed to load translations for ${lang}:`, error)
      // 降级到中文
      if (lang !== 'zh') {
        loadTranslations('zh')
      } else {
        setIsLoading(false)
      }
    }
  }

  // 翻译函数 - 支持字符串、数组和对象
  const t = (key: string): any => {
    // 如果正在加载或没有翻译数据，返回键名
    if (isLoading || !currentTranslations || Object.keys(currentTranslations).length === 0) {
      return key
    }
    
    const keys = key.split('.')
    let value = currentTranslations
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        console.warn(`Translation key not found: ${key}`)
        return key
      }
    }
    
    // 返回实际值（字符串、数组或对象），而不只是字符串
    return value !== null && value !== undefined ? value : key
  }

  // 切换语言
  const changeLocale = (newLocale: Locale) => {
    setLocale(newLocale)
    localStorage.setItem('HeysMe-locale', newLocale)
    loadTranslations(newLocale)
  }

  // 初始化
  useEffect(() => {
    // 从localStorage获取保存的语言设置
    const savedLocale = localStorage.getItem('HeysMe-locale') as Locale
    // 或者从浏览器语言检测
    const browserLocale = navigator.language.startsWith('zh') ? 'zh' : 'en'
    const initialLocale = savedLocale || browserLocale

    setLocale(initialLocale)
    loadTranslations(initialLocale)
  }, [])

  const value: I18nContextType = {
    locale,
    setLocale: changeLocale,
    t,
    isLoading
  }

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  )
}

// Hook for using i18n
export function useI18n() {
  const context = useContext(I18nContext)
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}

// 语言切换组件
export function LanguageSwitch() {
  const { locale, setLocale } = useI18n()
  
  const toggleLocale = () => {
    setLocale(locale === 'zh' ? 'en' : 'zh')
  }
  
  const currentConfig = LOCALES[locale]
  const nextConfig = LOCALES[locale === 'zh' ? 'en' : 'zh']

  return (
    <button
      onClick={toggleLocale}
      className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-200"
      title={`切换到${nextConfig.name}`}
    >
      <Languages className="w-4 h-4" />
      <span>{currentConfig.name}</span>
    </button>
  )
}