"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"

type Theme = "light" | "dark"

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // 从 localStorage 读取主题设置
    const savedTheme = localStorage.getItem("HeysMe-theme") as Theme
    if (savedTheme) {
      setTheme(savedTheme)
    } else {
      // 检查系统主题偏好
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      setTheme(systemTheme)
    }

    // 监听系统主题变化
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      // 只有在没有手动设置主题时才跟随系统主题
      const savedTheme = localStorage.getItem("HeysMe-theme")
      if (!savedTheme) {
        setTheme(e.matches ? "dark" : "light")
      }
    }

    mediaQuery.addEventListener("change", handleSystemThemeChange)
    return () => mediaQuery.removeEventListener("change", handleSystemThemeChange)
  }, [])

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("HeysMe-theme", theme)
      // 更新 document 类名
      document.documentElement.classList.remove("light", "dark")
      document.documentElement.classList.add(theme)
    }
  }, [theme, mounted])

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light")
  }

  // 在mounted之前也要渲染children，避免hydration mismatch
  return <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
