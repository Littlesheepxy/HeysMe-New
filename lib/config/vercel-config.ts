/**
 * Vercel 配置管理
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

  // 验证必需的配置
  if (config.enabled && !config.bearerToken) {
    console.warn('Vercel 预览已启用但缺少 VERCEL_TOKEN，将使用模拟预览');
    config.enabled = false;
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

// 默认的项目配置
export const DEFAULT_PROJECT_SETTINGS = {
  buildCommand: 'npm run build',
  installCommand: 'npm install',
  framework: 'nextjs',
  nodeVersion: '18.x',
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