// HeysMe 品牌色彩体系
export const brandColors = {
  // 主品牌色 - 基于emerald和cyan的渐变
  primary: {
    50: '#ecfdf5',
    100: '#d1fae5', 
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',  // emerald-400 - 主色
    500: '#10b981',  // emerald-500 - 核心色
    600: '#059669',  // emerald-600
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
  },

  // 辅助色 - cyan系
  secondary: {
    50: '#ecfeff',
    100: '#cffafe',
    200: '#a5f3fc', 
    300: '#67e8f9',
    400: '#22d3ee',  // cyan-400 - 辅助色
    500: '#06b6d4',  // cyan-500
    600: '#0891b2',
    700: '#0e7490',
    800: '#155e75',
    900: '#164e63',
  },

  // 强调色 - teal系 (连接primary和secondary)
  accent: {
    50: '#f0fdfa',
    100: '#ccfbf1',
    200: '#99f6e4',
    300: '#5eead4',
    400: '#2dd4bf',  // teal-400
    500: '#14b8a6',  // teal-500 - 强调色
    600: '#0d9488',
    700: '#0f766e',
    800: '#115e59',
    900: '#134e4a',
  },

  // 中性色系
  neutral: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },

  // 渐变定义
  gradients: {
    // 主品牌渐变
    primary: 'from-emerald-400 via-emerald-500 to-cyan-500',
    primaryReverse: 'from-cyan-500 via-emerald-500 to-emerald-400',
    
    // 次级渐变
    secondary: 'from-emerald-500 to-teal-500',
    secondaryReverse: 'from-teal-500 to-emerald-500',
    
    // 背景渐变
    background: 'from-emerald-50 via-teal-50 to-cyan-50',
    backgroundDark: 'from-emerald-900/20 via-teal-800/10 to-cyan-800/10',
    
    // 特殊渐变
    hero: 'from-emerald-400 via-teal-400 to-cyan-400',
    cta: 'from-emerald-500 via-emerald-600 to-teal-600'
  },

  // 功能色彩
  functional: {
    success: '#10b981', // emerald-500
    warning: '#f59e0b', // amber-500
    error: '#ef4444',   // red-500
    info: '#06b6d4',    // cyan-500
  }
}

// 设计令牌
export const designTokens = {
  // 间距系统
  spacing: {
    xs: '0.5rem',    // 8px
    sm: '1rem',      // 16px
    md: '1.5rem',    // 24px
    lg: '2rem',      // 32px
    xl: '3rem',      // 48px
    '2xl': '4rem',   // 64px
    '3xl': '6rem',   // 96px
  },

  // 圆角系统
  radius: {
    sm: '0.5rem',    // 8px
    md: '0.75rem',   // 12px
    lg: '1rem',      // 16px
    xl: '1.5rem',    // 24px
    '2xl': '2rem',   // 32px
    '3xl': '3rem',   // 48px
    full: '9999px'
  },

  // 阴影系统
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    brand: '0 20px 25px -5px rgb(16 185 129 / 0.15), 0 8px 10px -6px rgb(16 185 129 / 0.1)', // emerald shadow
  },

  // 字体系统
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'monospace']
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      '5xl': ['3rem', { lineHeight: '1' }],
      '6xl': ['3.75rem', { lineHeight: '1' }],
    }
  }
}

// 组件样式模板
export const componentStyles = {
  // 卡片样式
  card: {
    base: 'bg-white/95 backdrop-blur-md border border-white/60 shadow-xl rounded-2xl',
    hover: 'hover:shadow-2xl hover:scale-105 transition-all duration-300',
    brand: 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200/50'
  },

  // 按钮样式
  button: {
    primary: 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white',
    secondary: 'bg-white/80 text-emerald-700 border border-emerald-200 hover:bg-white hover:border-emerald-300',
    ghost: 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
  },

  // 图标容器样式
  iconContainer: {
    primary: 'bg-gradient-to-r from-emerald-500 to-teal-500',
    secondary: 'bg-gradient-to-r from-cyan-500 to-emerald-500', 
    accent: 'bg-gradient-to-r from-teal-500 to-cyan-500'
  },

  // 背景样式
  background: {
    section: 'bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50',
    alternate: 'bg-white',
    hero: 'bg-gradient-to-br from-emerald-400/20 via-teal-400/10 to-cyan-400/20'
  }
}