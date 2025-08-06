/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-subtle': 'bounce 1s ease-in-out infinite',
        'moveVertical': 'moveVertical 30s ease infinite',
        'moveInCircle': 'moveInCircle 20s reverse infinite',
        'moveInCircleSlow': 'moveInCircle 40s linear infinite',
        'moveHorizontal': 'moveHorizontal 40s ease infinite',
        'moveInCircleFast': 'moveInCircle 20s ease infinite',
      },
      keyframes: {
        moveHorizontal: {
          "0%": {
            transform: "translateX(-50%) translateY(-10%)",
          },
          "50%": {
            transform: "translateX(50%) translateY(10%)",
          },
          "100%": {
            transform: "translateX(-50%) translateY(-10%)",
          },
        },
        moveInCircle: {
          "0%": {
            transform: "rotate(0deg)",
          },
          "50%": {
            transform: "rotate(180deg)",
          },
          "100%": {
            transform: "rotate(360deg)",
          },
        },
        moveVertical: {
          "0%": {
            transform: "translateY(-50%)",
          },
          "50%": {
            transform: "translateY(50%)",
          },
          "100%": {
            transform: "translateY(-50%)",
          },
        },
      },
      colors: {
        // HeysMe 品牌色系
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0', 
          300: '#6ee7b7',
          400: '#34d399',  // emerald-400 - 主色
          500: '#10b981',  // emerald-500 - 核心色
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        accent: {
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
        secondary: {
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
        }
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #34d399 0%, #14b8a6 50%, #22d3ee 100%)',
        'brand-gradient-reverse': 'linear-gradient(135deg, #22d3ee 0%, #14b8a6 50%, #34d399 100%)',
        'hero-gradient': 'linear-gradient(135deg, #34d399/20 0%, #2dd4bf/10 50%, #22d3ee/20 100%)',
      },
      animation: {
        'brand-pulse': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'brand-float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
      boxShadow: {
        'brand-sm': '0 1px 2px 0 rgb(16 185 129 / 0.05)',
        'brand-md': '0 4px 6px -1px rgb(16 185 129 / 0.1), 0 2px 4px -2px rgb(16 185 129 / 0.1)',
        'brand-lg': '0 10px 15px -3px rgb(16 185 129 / 0.1), 0 4px 6px -4px rgb(16 185 129 / 0.1)',
        'brand-xl': '0 20px 25px -5px rgb(16 185 129 / 0.15), 0 8px 10px -6px rgb(16 185 129 / 0.1)',
        'brand-glow': '0 0 50px rgb(16 185 129 / 0.3)',
      }
    },
  },
  plugins: [],
}
