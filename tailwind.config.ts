import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
  	extend: {
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			},
			// 🎨 品牌色彩系统升级
			brand: {
				primary: '#10B981', // emerald-500 核心色
				secondary: '#06B6D4', // cyan-500 辅助色
				accent: '#0891B2', // 深青色用于悬停和强调
				light: '#F0FDFA', // 浅青色背景
				surface: '#ECFDF5', // 浅绿色表面
				border: '#E6FFFA', // 分割线颜色
				hover: '#059669', // 悬停状态
				active: '#047857', // 激活状态
				text: '#064E3B', // 深色文字
				ghost: 'rgba(16, 185, 129, 0.1)', // 透明品牌色
			},
			// 扩展的青绿色系
			emerald: {
				50: '#ECFDF5',
				100: '#D1FAE5',
				200: '#A7F3D0',
				300: '#6EE7B7',
				400: '#34D399', // 主渐变起始色
				500: '#10B981', // 核心品牌色
				600: '#059669',
				700: '#047857',
				800: '#065F46',
				900: '#064E3B',
			},
			teal: {
				50: '#F0FDFA',
				100: '#CCFBF1',
				200: '#99F6E4',
				300: '#5EEAD4',
				400: '#2DD4BF', // 主渐变中间色
				500: '#14B8A6',
				600: '#0D9488',
				700: '#0F766E',
				800: '#115E59',
				900: '#134E4A',
			},
			cyan: {
				50: '#ECFEFF',
				100: '#CFFAFE',
				200: '#A5F3FC',
				300: '#67E8F9',
				400: '#22D3EE', // 主渐变结束色
				500: '#06B6D4', // 辅助色
				600: '#0891B2', // 强调色
				700: '#0E7490',
				800: '#155E75',
				900: '#164E63',
			},
  			gray: {
  				750: '#374151',
  				850: '#1F2937',
  				950: '#0F172A',
  			},
  			vscode: {
  				bg: '#1e1e1e',
  				sidebar: '#252526',
  				panel: '#2d2d30',
  				border: '#3e3e42',
  				text: '#cccccc',
  				comment: '#6a9955',
  				keyword: '#569cd6',
  				string: '#ce9178',
  				number: '#b5cea8',
  				function: '#dcdcaa',
  				tag: '#f44747'
  			}
  		},
  		borderColor: {
  			DEFAULT: 'hsl(var(--border))',
  			'gray-750': '#374151',
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)',
			'2xl': '1rem',
			'3xl': '1.5rem',
  		},
		backgroundImage: {
			// 🎨 品牌渐变背景系统
			'brand-gradient': 'linear-gradient(135deg, #34D399 0%, #2DD4BF 50%, #22D3EE 100%)',
			'brand-gradient-dark': 'linear-gradient(135deg, #10B981 0%, #06B6D4 100%)',
			'brand-gradient-light': 'linear-gradient(135deg, #D1FAE5 0%, #CFFAFE 100%)',
			'brand-radial': 'radial-gradient(circle at center, #34D399 0%, #2DD4BF 50%, #22D3EE 100%)',
			'brand-header': 'linear-gradient(135deg, #10B981 0%, #0891B2 100%)',
			// 玻璃拟态效果
			'glass-brand': 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)',
			'glass-brand-dark': 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)',
			// 页面背景渐变
			'page-gradient-light': 'linear-gradient(135deg, #F0FDFA 0%, #ECFEFF 50%, #F0F9FF 100%)',
			'page-gradient-dark': 'linear-gradient(135deg, #0F172A 0%, #164E63 50%, #065F46 100%)',
		},
		boxShadow: {
			// 🎨 品牌色阴影系统
			'brand': '0 4px 14px 0 rgba(16, 185, 129, 0.2)',
			'brand-sm': '0 2px 8px 0 rgba(16, 185, 129, 0.15)',
			'brand-lg': '0 10px 25px -3px rgba(16, 185, 129, 0.3), 0 4px 6px -2px rgba(16, 185, 129, 0.2)',
			'brand-xl': '0 20px 40px -4px rgba(16, 185, 129, 0.4)',
			'brand-2xl': '0 25px 50px -12px rgba(16, 185, 129, 0.5)',
			'brand-glow': '0 0 20px rgba(16, 185, 129, 0.5)',
			'brand-glow-lg': '0 0 40px rgba(16, 185, 129, 0.6)',
			'cyan-glow': '0 0 20px rgba(6, 182, 212, 0.5)',
			'glass-shadow': '0 8px 32px 0 rgba(16, 185, 129, 0.1)',
			'message-user': '0 4px 12px rgba(16, 185, 129, 0.25)',
			'message-ai': '0 2px 8px rgba(0, 0, 0, 0.05)',
		},
		// 🎨 品牌边框宽度
		borderWidth: {
			'3': '3px',
		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			},
  			'shimmer': {
  				'0%': {
  					transform: 'translateX(-100%)',
  					opacity: '0'
  				},
  				'50%': {
  					opacity: '1'
  				},
  				'100%': {
  					transform: 'translateX(300%)',
  					opacity: '0'
  				}
  			},
  			'typing-dots': {
  				'0%, 60%, 100%': {
  					transform: 'translateY(0)',
  					opacity: '0.4'
  				},
  				'30%': {
  					transform: 'translateY(-8px)',
  					opacity: '1'
  				}
  			},
  			'scan-line': {
  				'0%': {
  					transform: 'translateX(-100%)'
  				},
  				'100%': {
  					transform: 'translateX(100%)'
  				}
  			},
  			'pulse-glow': {
  				'0%, 100%': {
  					opacity: '0.4',
  					transform: 'scale(1)'
  				},
  				'50%': {
  					opacity: '1',
  					transform: 'scale(1.05)'
  				}
  			},
			// 🎨 品牌相关动画升级
			'brand-gradient-shift': {
				'0%, 100%': {
					backgroundPosition: '0% 50%'
				},
				'50%': {
					backgroundPosition: '100% 50%'
				}
			},
			'brand-pulse': {
				'0%, 100%': {
					boxShadow: '0 0 0 0 rgba(16, 185, 129, 0.7)'
				},
				'70%': {
					boxShadow: '0 0 0 10px rgba(16, 185, 129, 0)'
				}
			},
			'brand-typing-dots': {
				'0%, 60%, 100%': {
					transform: 'translateY(0)',
					backgroundColor: '#10B981'
				},
				'30%': {
					transform: 'translateY(-8px)',
					backgroundColor: '#06B6D4'
				}
			},
			'brand-shimmer': {
				'0%': {
					transform: 'translateX(-100%) skewX(-12deg)',
					background: 'linear-gradient(90deg, transparent 0%, rgba(16, 185, 129, 0) 25%, rgba(16, 185, 129, 0.8) 50%, rgba(6, 182, 212, 0.8) 51%, rgba(6, 182, 212, 0) 75%, transparent 100%)'
				},
				'100%': {
					transform: 'translateX(200%) skewX(-12deg)',
					background: 'linear-gradient(90deg, transparent 0%, rgba(16, 185, 129, 0) 25%, rgba(16, 185, 129, 0.8) 50%, rgba(6, 182, 212, 0.8) 51%, rgba(6, 182, 212, 0) 75%, transparent 100%)'
				}
			},
			'brand-slide-in': {
				'0%': {
					transform: 'translateX(-100%)',
					opacity: '0'
				},
				'100%': {
					transform: 'translateX(0)',
					opacity: '1'
				}
			},
			'brand-slide-out': {
				'0%': {
					transform: 'translateX(0)',
					opacity: '1'
				},
				'100%': {
					transform: 'translateX(-100%)',
					opacity: '0'
				}
			},
			'brand-bounce': {
				'0%, 100%': {
					transform: 'translateY(0)',
					animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)'
				},
				'50%': {
					transform: 'translateY(-25%)',
					animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)'
				}
			},
			'brand-loading-scan': {
				'0%': {
					transform: 'translateX(-100%)'
				},
				'100%': {
					transform: 'translateX(100%)'
				}
			},
			'white-shimmer': {
				'0%': {
					transform: 'translateX(-100%)'
				},
				'100%': {
					transform: 'translateX(100%)'
				}
			},
			'brand-ripple': {
				'0%': {
					transform: 'scale(0)',
					opacity: '1'
				},
				'100%': {
					transform: 'scale(4)',
					opacity: '0'
				}
			},
			'message-slide-in': {
				'0%': {
					opacity: '0',
					transform: 'translateY(20px) scale(0.95)'
				},
				'100%': {
					opacity: '1',
					transform: 'translateY(0) scale(1)'
				}
			},
			'glass-shimmer': {
				'0%': {
					backgroundPosition: '-200% center'
				},
				'100%': {
					backgroundPosition: '200% center'
				}
			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'shimmer': 'shimmer 2s infinite',
  			'typing-dots': 'typing-dots 1.4s infinite ease-in-out',
  			'pulse-glow': 'pulse-glow 2s infinite',
			// 🎨 品牌动画
			'brand-gradient-shift': 'brand-gradient-shift 3s ease-in-out infinite',
			'brand-pulse': 'brand-pulse 2s infinite',
			'brand-typing-dots': 'brand-typing-dots 1.4s infinite ease-in-out',
			'brand-shimmer': 'brand-shimmer 2s infinite',
			'brand-slide-in': 'brand-slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
			'brand-slide-out': 'brand-slide-out 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
			'brand-bounce': 'brand-bounce 1s infinite',
			'brand-loading-scan': 'brand-loading-scan 2s linear infinite',
			'white-shimmer': 'white-shimmer 1.5s ease-in-out infinite',
			'brand-ripple': 'brand-ripple 0.6s linear',
			'message-slide-in': 'message-slide-in 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
			'glass-shimmer': 'glass-shimmer 2s linear infinite',
  		},
		// 🎨 字体系统
		fontFamily: {
			'brand': ['Inter', 'system-ui', 'sans-serif'],
		},
		// 🎨 间距系统
		spacing: {
			'18': '4.5rem',
			'88': '22rem',
			'128': '32rem',
		},
		// 🎨 最大宽度
		maxWidth: {
			'message': '80%',
			'message-desktop': '60%',
		},
		// 🎨 z-index层级
		zIndex: {
			'60': '60',
			'70': '70',
			'80': '80',
			'90': '90',
			'100': '100',
		}
  	}
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/line-clamp")
  ],
};
export default config;
