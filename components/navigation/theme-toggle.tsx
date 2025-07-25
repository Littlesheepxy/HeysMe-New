"use client"

import { Button } from "@/components/ui/button"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/contexts/theme-context"

interface ThemeToggleProps {
  className?: string
  size?: "sm" | "default" | "lg"
}

export function ThemeToggle({ className = "", size = "default" }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()

  return (
    <Button
      variant="outline"
      size={size}
      onClick={toggleTheme}
      className={`rounded-2xl border-white/30 bg-white/60 backdrop-blur-sm hover:bg-white/80 dark:bg-gray-800/60 dark:border-gray-700/30 dark:hover:bg-gray-800/80 transition-all duration-300 ${className}`}
    >
      {theme === "light" ? (
        <Moon className="w-4 h-4 text-gray-700 dark:text-gray-300" />
      ) : (
        <Sun className="w-4 h-4 text-gray-700 dark:text-gray-300" />
      )}
      <span className="sr-only">切换主题</span>
    </Button>
  )
}
