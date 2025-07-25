/**
 * Coding Agent 工具函数、常量和类型定义
 */

import { CodeFile } from './types';

// =================== 常量配置 ===================

export const BASE_DEPENDENCIES = {
  "next": "14.2.5",
  "react": "^18",
  "react-dom": "^18",
  "typescript": "^5",
  "@types/node": "^20",
  "@types/react": "^18",
  "@types/react-dom": "^18"
};

export const STYLING_DEPENDENCIES = {
  "tailwindcss": "^3.4.0",
  "postcss": "^8",
  "autoprefixer": "^10.0.1",
  "@tailwindcss/typography": "^0.5.13",
  "clsx": "^2.1.1",
  "tailwind-merge": "^2.4.0"
};

export const UI_DEPENDENCIES = {
  "lucide-react": "^0.400.0",
  "@radix-ui/react-avatar": "^1.1.0",
  "@radix-ui/react-dialog": "^1.1.1",
  "@radix-ui/react-dropdown-menu": "^2.1.1",
  "@radix-ui/react-navigation-menu": "^1.2.0",
  "@radix-ui/react-progress": "^1.1.0",
  "@radix-ui/react-scroll-area": "^1.1.0",
  "@radix-ui/react-separator": "^1.1.0",
  "@radix-ui/react-slot": "^1.1.0",
  "class-variance-authority": "^0.7.0"
};

export const ANIMATION_DEPENDENCIES = {
  "framer-motion": "^11.3.8"
};

export const FORM_DEPENDENCIES = {
  "react-hook-form": "^7.52.1",
  "@hookform/resolvers": "^3.7.0",
  "zod": "^3.23.8"
};

export const PDF_DEPENDENCIES = {
  "jspdf": "^2.5.1",
  "html2canvas": "^1.4.1"
};

export const DEVELOPMENT_DEPENDENCIES = {
  "eslint": "^8",
  "eslint-config-next": "14.2.5",
  "@types/react": "^18",
  "@types/react-dom": "^18"
};

export const COLOR_SCHEMES = {
  'tech_blue': {
    primary: 'blue',
    accent: 'cyan',
    neutral: 'slate'
  },
  'creative_purple': {
    primary: 'purple',
    accent: 'pink',
    neutral: 'slate'
  },
  'business_gray': {
    primary: 'gray',
    accent: 'blue',
    neutral: 'gray'
  },
  'nature_green': {
    primary: 'green',
    accent: 'emerald',
    neutral: 'stone'
  },
  'vibrant_orange': {
    primary: 'orange',
    accent: 'yellow',
    neutral: 'zinc'
  }
};

// =================== 工具函数 ===================

/**
 * 提取用户目标
 */
export function extractUserGoal(sessionData: any): string {
  return sessionData.metadata?.intentData?.use_case || 
         sessionData.userIntent?.primary_goal?.split('（')[0] || 
         '其他';
}

/**
 * 提取用户类型
 */
export function extractUserType(sessionData: any): string {
  return sessionData.metadata?.intentData?.user_role || 
         sessionData.personalization?.identity?.profession || 
         'default';
}

/**
 * 提取设计数据
 */
export function extractDesignData(sessionData: any): any {
  // 从AgentFlow中找到最近的设计数据
  const designEntry = sessionData.agentFlow
    ?.filter((entry: any) => entry.agent === 'PromptOutputAgent' && entry.status === 'completed')
    .sort((a: any, b: any) => b.startTime.getTime() - a.startTime.getTime())[0];

  if (!designEntry?.output) return null;

  return {
    designStrategy: (designEntry.output as any).designStrategy,
    developmentPrompt: (designEntry.output as any).developmentPrompt
  };
}

/**
 * 生成 package.json
 */
export function generatePackageJson(strategy: any, userType: string): string {
  const dependencies: Record<string, string> = {
    ...BASE_DEPENDENCIES,
    ...STYLING_DEPENDENCIES,
    ...UI_DEPENDENCIES
  };

  // 根据功能需求添加依赖
  if (strategy.features?.animations) {
    Object.assign(dependencies, ANIMATION_DEPENDENCIES);
  }

  if (strategy.features?.contactForm) {
    Object.assign(dependencies, FORM_DEPENDENCIES);
  }

  if (strategy.features?.downloadPdf) {
    Object.assign(dependencies, PDF_DEPENDENCIES);
  }

  const packageJson = {
    name: "personal-portfolio",
    version: "0.1.0",
    private: true,
    scripts: {
      dev: "next dev",
      build: "next build",
      start: "next start",
      lint: "next lint",
      deploy: "npm run build && npm run export"
    },
    dependencies,
    devDependencies: DEVELOPMENT_DEPENDENCIES
  };

  return JSON.stringify(packageJson, null, 2);
}

/**
 * 生成 Tailwind 配置
 */
export function generateTailwindConfig(strategy: any, userType: string): string {
  const colorScheme = getColorScheme(strategy, userType);
  
  return `/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}`;
}

/**
 * 生成 TypeScript 配置
 */
export function generateTsConfig(): string {
  return `{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}`;
}

/**
 * 生成 Next.js 配置
 */
export function generateNextConfig(): string {
  return `/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig`;
}

/**
 * 生成 PostCSS 配置
 */
export function generatePostCssConfig(): string {
  return `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`;
}

/**
 * 生成工具函数
 */
export function generateUtils(): string {
  return `import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
  }).format(new Date(date))
}

export function generateEmailLink(email: string, subject?: string): string {
  const params = subject ? \`?subject=\${encodeURIComponent(subject)}\` : ''
  return \`mailto:\${email}\${params}\`
}

export function generateLinkedInUrl(username: string): string {
  return \`https://linkedin.com/in/\${username}\`
}

export function generateGitHubUrl(username: string): string {
  return \`https://github.com/\${username}\`
}`;
}

/**
 * 生成全局样式
 */
export function generateGlobalStyles(): string {
  return `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96%;
    --secondary-foreground: 222.2 84% 4.9%;
    --muted: 210 40% 96%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96%;
    --accent-foreground: 222.2 84% 4.9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 84% 4.9%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 94.1%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}`;
}

/**
 * 生成数据配置
 */
export function generateDataConfig(collectedData: any, userType: string): string {
  const config = {
    personal: {
      name: collectedData?.personal?.fullName || '您的姓名',
      title: collectedData?.professional?.currentTitle || '专业标题',
      bio: collectedData?.professional?.summary || '这里是您的个人简介...',
      location: collectedData?.personal?.location || '中国',
      email: collectedData?.personal?.email || 'your.email@example.com',
      phone: collectedData?.personal?.phone || '',
      website: collectedData?.personal?.website || '',
      avatar: '/placeholder-avatar.jpg'
    },
    social: {
      github: collectedData?.personal?.github || '',
      linkedin: collectedData?.personal?.linkedin || '',
      twitter: collectedData?.personal?.twitter || '',
      dribbble: collectedData?.personal?.dribbble || '',
      behance: collectedData?.personal?.behance || ''
    },
    skills: collectedData?.professional?.skills || getDefaultSkills(userType),
    projects: collectedData?.projects || getDefaultProjects(userType),
    experience: collectedData?.experience || [],
    education: collectedData?.education || []
  };

  return `export const siteConfig = ${JSON.stringify(config, null, 2)};

export type SiteConfig = typeof siteConfig;`;
}

/**
 * 生成部署指导
 */
export function generateDeploymentGuide(): string {
  return `# 部署指导

## Vercel 部署（推荐）

1. 将代码推送到 GitHub 仓库
2. 访问 [Vercel](https://vercel.com)
3. 连接您的 GitHub 账户
4. 选择项目仓库并部署
5. 等待部署完成

## 本地开发

\`\`\`bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start
\`\`\`

## 自定义配置

### 修改个人信息
编辑 \`lib/config.ts\` 文件中的个人信息。

### 修改主题颜色
编辑 \`tailwind.config.js\` 文件中的颜色配置。

### 添加新的章节
在 \`components/sections/\` 目录下添加新的组件文件。

## 故障排除

### 构建错误
- 检查 TypeScript 类型错误
- 确保所有依赖都已安装

### 样式问题
- 检查 Tailwind CSS 配置
- 确保导入了全局样式文件

### 部署问题
- 检查 Next.js 配置
- 确保静态导出设置正确
`;
}

/**
 * 生成 README
 */
export function generateReadme(strategy: any, userGoal: string, userType: string): string {
  return `# 个人作品集网站

基于您的${userType}身份和${userGoal}目标生成的个性化作品集网站。

## 🌟 特性

- ✨ 现代化设计，完全响应式
- 🎨 基于 ${strategy.theme} 主题的个性化配色
- 📱 移动端优先，完美适配各种设备
- ⚡ 基于 Next.js 14 的极速性能
- 🎯 针对${userType}优化的布局和内容结构
- 🔍 SEO 优化，搜索引擎友好

## 🛠 技术栈

- **框架**: Next.js 14 + TypeScript
- **样式**: Tailwind CSS + Shadcn/ui
- **动画**: Framer Motion
- **图标**: Lucide React
- **部署**: Vercel

## 🚀 快速开始

1. **安装依赖**
   \`\`\`bash
   npm install
   \`\`\`

2. **启动开发服务器**
   \`\`\`bash
   npm run dev
   \`\`\`

3. **访问网站**
   打开 [http://localhost:3000](http://localhost:3000)

## 📁 项目结构

\`\`\`
├── app/                    # Next.js 13+ App Router
├── components/             # React 组件
│   ├── ui/                # Shadcn/ui 基础组件
│   └── sections/          # 页面章节组件
├── lib/                   # 工具函数和配置
├── public/                # 静态资源
└── styles/                # 全局样式
\`\`\`

## 🎨 自定义

### 修改个人信息
编辑 \`lib/config.ts\` 文件更新您的个人信息：

\`\`\`typescript
export const siteConfig = {
  personal: {
    name: "您的姓名",
    title: "您的职位",
    bio: "您的简介",
    // ...更多配置
  }
}
\`\`\`

### 自定义主题
在 \`tailwind.config.js\` 中修改颜色配置。

## 📖 部署

### Vercel (推荐)
1. 推送代码到 GitHub
2. 在 Vercel 中导入项目
3. 一键部署完成

### 其他平台
项目支持任何支持 Node.js 的托管平台。

## 📝 许可证

MIT License - 您可以自由使用和修改此代码。

---

🎯 **专为${userType}设计的专业作品集**
`;
}

/**
 * 获取章节组件名称
 */
export function getSectionComponentName(type: string): string {
  const componentMap: Record<string, string> = {
    'hero': 'HeroSection',
    'hero_banner': 'HeroSection',
    'skills': 'SkillsSection',
    'tech_stack_visual': 'SkillsSection',
    'skill_cloud': 'SkillsSection',
    'progress_bars': 'SkillsSection',
    'projects': 'ProjectsSection',
    'project_cards': 'ProjectsSection',
    'experience': 'ExperienceSection',
    'timeline': 'ExperienceSection',
    'contact': 'ContactSection',
    'contact_info': 'ContactSection'
  };

  return componentMap[type] || 'Section';
}

/**
 * 获取颜色方案
 */
export function getColorScheme(strategy: any, userType: string): any {
  const theme = strategy?.theme || 'tech_blue';
  return COLOR_SCHEMES[theme as keyof typeof COLOR_SCHEMES] || COLOR_SCHEMES.tech_blue;
}

/**
 * 获取默认技能
 */
function getDefaultSkills(userType: string): string[] {
  const skillsMap: Record<string, string[]> = {
    '开发者': ['JavaScript', 'React', 'Node.js', 'TypeScript', 'Python'],
    '设计师': ['Figma', 'Photoshop', 'UI/UX设计', '原型设计', '品牌设计'],
    '产品经理': ['产品规划', '需求分析', '项目管理', '数据分析', '用户研究'],
    'default': ['沟通能力', '团队合作', '问题解决', '学习能力', '创新思维']
  };
  return skillsMap[userType] || skillsMap.default;
}

/**
 * 获取默认项目
 */
function getDefaultProjects(userType: string): any[] {
  const defaultProject = {
    title: '示例项目',
    description: '这是一个示例项目描述',
    technologies: ['React', 'TypeScript'],
    liveUrl: '#',
    githubUrl: '#',
    imageUrl: '/placeholder-project.jpg'
  };

  return [defaultProject];
} 