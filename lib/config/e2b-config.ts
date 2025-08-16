/**
 * E2B 沙盒配置管理
 * 专门为 Next.js 应用优化的 E2B 配置
 */

export interface E2BConfig {
  enabled: boolean;
  apiKey: string;
  timeoutMinutes: number;
  port: number;
  template?: string;
  environment: 'development' | 'production';
}

export interface E2BSandboxConfig extends E2BConfig {
  framework: 'nextjs';
  nodeVersion: string;
  buildCommand: string;
  devCommand: string;
  startupTimeout: number;
  maxSandboxes: number;
}

/**
 * 获取E2B基础配置
 */
export function getE2BConfig(): E2BSandboxConfig {
  const config: E2BSandboxConfig = {
    enabled: process.env.ENABLE_E2B_PREVIEW === 'true',
    apiKey: process.env.E2B_API_KEY || '',
    timeoutMinutes: parseInt(process.env.E2B_TIMEOUT_MINUTES || '15', 10),
    port: parseInt(process.env.E2B_PORT || '3000', 10),
    template: process.env.E2B_TEMPLATE,
    environment: (process.env.NODE_ENV as 'development' | 'production') || 'development',
    
    // Next.js 专用配置
    framework: 'nextjs',
    nodeVersion: '18.17.0',
    buildCommand: 'npm run build',
    devCommand: 'npm run dev',
    startupTimeout: 30000, // Next.js 启动较慢
    maxSandboxes: parseInt(process.env.E2B_MAX_SANDBOXES || '5', 10),
  };

  // 🔧 验证必需的配置
  if (config.enabled && !config.apiKey) {
    console.warn('⚠️ E2B 预览已启用但缺少 E2B_API_KEY，将自动降级到 Vercel 预览');
    config.enabled = false;
  }

  // 🆕 使用新的 API Key 验证函数
  if (config.enabled && config.apiKey) {
    const isValidKey = validateE2BApiKey(config.apiKey);
    if (!isValidKey) {
      console.warn('⚠️ E2B_API_KEY 格式无效，将自动降级到 Vercel 预览');
      config.enabled = false;
    }
  }

  return config;
}

/**
 * 验证 E2B API Key 格式
 */
export function validateE2BApiKey(apiKey: string): boolean {
  if (!apiKey || typeof apiKey !== 'string') {
    return false;
  }

  // E2B API Key 通常以 e2b_ 开头
  if (!apiKey.startsWith('e2b_')) {
    console.warn('⚠️ E2B API Key 格式可能不正确，应该以 "e2b_" 开头');
    return false;
  }

  return apiKey.length > 10; // 基础长度验证
}

/**
 * 获取 Next.js 沙盒的默认文件结构
 */
export function getDefaultNextjsFiles() {
  return {
    'package.json': {
      name: 'e2b-nextjs-preview',
      version: '0.1.0',
      private: true,
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
        lint: 'next lint',
      },
      dependencies: {
        next: '^14.0.0',
        react: '^18.0.0', 
        'react-dom': '^18.0.0',
      },
      devDependencies: {
        '@types/node': '^20',
        '@types/react': '^18',
        '@types/react-dom': '^18',
        typescript: '^5',
        tailwindcss: '^3.4.0',
        autoprefixer: '^10.4.0',
        postcss: '^8.4.0',
      },
    },
    
    'next.config.mjs': `/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
};

export default nextConfig;`,

    'tsconfig.json': {
      compilerOptions: {
        lib: ['dom', 'dom.iterable', 'es6'],
        allowJs: true,
        skipLibCheck: true,
        strict: true,
        noEmit: true,
        esModuleInterop: true,
        module: 'esnext',
        moduleResolution: 'bundler',
        resolveJsonModule: true,
        isolatedModules: true,
        jsx: 'preserve',
        incremental: true,
        plugins: [{ name: 'next' }],
        paths: {
          '@/*': ['./src/*'],
        },
      },
      include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
      exclude: ['node_modules'],
    },
    
    'tailwind.config.js': `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}`,

    'postcss.config.js': `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`,
  };
}

/**
 * E2B 沙盒状态类型
 */
export type E2BSandboxStatus = 
  | 'initializing'
  | 'installing_deps' 
  | 'starting_server'
  | 'ready'
  | 'error'
  | 'timeout';

/**
 * 沙盒信息接口
 */
export interface SandboxInfo {
  id: string;
  url: string;
  status: E2BSandboxStatus;
  createdAt: Date;
  lastActivity: Date;
  port: number;
}

/**
 * 沙盒操作结果
 */
export interface SandboxOperationResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}
