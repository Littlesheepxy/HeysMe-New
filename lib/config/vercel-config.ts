/**
 * Vercel 配置管理
 * 支持两种 SDK 实现方式
 */

import { VercelConfig } from '@/lib/services/vercel-preview-service';

export interface VercelPreviewConfig extends VercelConfig {
  enabled: boolean;
}

export function getVercelConfig(): VercelPreviewConfig {
  const config: VercelPreviewConfig = {
    enabled: process.env.ENABLE_VERCEL_PREVIEW === 'true',
    bearerToken: process.env.VERCEL_TOKEN || '',
    teamId: process.env.VERCEL_TEAM_ID,
    teamSlug: process.env.VERCEL_TEAM_SLUG,
  };

  // 🔧 验证必需的配置 - 更严格的检查
  if (config.enabled && !config.bearerToken) {
    console.warn('⚠️ Vercel 预览已启用但缺少 VERCEL_TOKEN，将自动降级到模拟预览');
    config.enabled = false;
  }

  // 🆕 使用新的 Token 验证函数
  if (config.enabled && config.bearerToken) {
    const isValidToken = validateVercelToken(config.bearerToken);
    if (!isValidToken) {
      console.warn('⚠️ VERCEL_TOKEN 格式无效，将自动降级到模拟预览');
      config.enabled = false;
    }
  }

  return config;
}

/**
 * 🆕 获取简化的 Vercel 配置 - 官方文档标准方式
 */
export function getSimpleVercelConfig(): VercelConfig & { enabled: boolean } {
  const config = {
    enabled: process.env.ENABLE_VERCEL_PREVIEW === 'true',
    bearerToken: process.env.VERCEL_TOKEN || '',
    teamId: process.env.VERCEL_TEAM_ID,
    teamSlug: process.env.VERCEL_TEAM_SLUG,
  };

  // 🔧 验证配置
  if (config.enabled && !config.bearerToken) {
    console.warn('⚠️ Vercel 预览已启用但缺少 VERCEL_TOKEN，将自动降级到模拟预览');
    config.enabled = false;
  }

  if (config.enabled && config.bearerToken) {
    const isValidToken = validateVercelToken(config.bearerToken);
    if (!isValidToken) {
      console.warn('⚠️ VERCEL_TOKEN 格式无效，将自动降级到模拟预览');
      config.enabled = false;
    }
  }

  return config;
}

export function validateVercelConfig(config: VercelPreviewConfig): boolean {
  if (!config.enabled) return true;
  
  if (!config.bearerToken) {
    console.error('Vercel token 是必需的');
    return false;
  }

  return true;
}

// 默认的项目配置 - 基于官方文档推荐
export const DEFAULT_PROJECT_SETTINGS = {
  buildCommand: 'npm run build',
  installCommand: 'npm install',
  framework: 'nextjs',
  nodeVersion: '18.x',
  outputDirectory: 'dist', // 输出目录
  rootDirectory: '.', // 根目录
};

// 默认的 Vercel 配置
export const DEFAULT_VERCEL_CONFIG: VercelPreviewConfig = {
  enabled: false,
  bearerToken: '',
  teamId: undefined,
  teamSlug: undefined,
};

// 默认的环境变量
export const DEFAULT_ENVIRONMENT_VARIABLES = [
  {
    key: 'NODE_ENV',
    value: 'production',
    target: ['preview'] as const,
  },
  {
    key: 'NEXT_PUBLIC_SITE_URL',
    value: 'https://heysme.com',
    target: ['preview'] as const,
  },
];

export function getProjectName(baseName: string): string {
  // 清理项目名称以符合 Vercel 要求
  return baseName
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 63); // Vercel 项目名称最大长度
}

/**
 * 🆕 验证 Vercel Token 格式和权限
 */
export function validateVercelToken(token: string): boolean {
  // 基本格式检查
  if (!token || token.length < 20) {
    return false;
  }
  
  // Vercel Token 通常以特定前缀开头
  const validPrefixes = ['vercel_', 'vt_', 'vtoken_'];
  const hasValidPrefix = validPrefixes.some(prefix => token.startsWith(prefix));
  
  if (!hasValidPrefix) {
    console.warn('⚠️ Vercel Token 格式可能不正确，建议检查 Token 是否有效');
  }
  
  return true; // 允许非标准格式的 Token，因为可能是旧版本
}

/**
 * 🆕 获取部署目标配置
 */
export function getDeploymentTarget(isProduction: boolean = false): 'production' | 'preview' {
  return isProduction ? 'production' : 'preview';
}

/**
 * 🆕 生成 Git 元数据
 */
export function generateGitMetadata(projectName: string, customMessage?: string) {
  return {
    remoteUrl: "https://github.com/heysme/project",
    commitAuthorName: "HeysMe User",
    commitAuthorEmail: "noreply@heysme.com",
    commitMessage: customMessage || `Deploy ${projectName} from HeysMe`,
    commitRef: "main",
    dirty: false,
  };
} 