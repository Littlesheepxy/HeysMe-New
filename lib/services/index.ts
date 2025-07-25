/**
 * 服务层统一导出 - 重构后的模块化架构
 */

// 分类服务导出
export { GitHubService, githubService } from './github-service';
export { WebService, webService } from './web-service';
export { DocumentService, documentService } from './document-service';
export { SocialService, socialService } from './social-service';

// 工具函数导出
export * from './utils/web-utils';

// 统一的服务接口
export interface ServiceInterface {
  name: string;
  version: string;
  capabilities: string[];
}

// 服务注册表
export const serviceRegistry = {
  github: {
    service: 'GitHubService',
    instance: 'githubService',
    capabilities: ['analyze_user', 'analyze_repository'],
    api_required: false,
    libraries: ['@octokit/rest', 'simple-git'],
  },
  web: {
    service: 'WebService',
    instance: 'webService',
    capabilities: ['scrape_webpage', 'extract_social_links', 'analyze_seo'],
    api_required: false,
    libraries: ['metascraper', 'cheerio', 'metascraper-*'],
  },
  document: {
    service: 'DocumentService',
    instance: 'documentService',
    capabilities: ['parse_document', 'analyze_pdf_advanced'],
    api_required: false,
    libraries: ['pdf-parse', 'mammoth', 'xlsx'],
  },
  social: {
    service: 'SocialService',
    instance: 'socialService',
    capabilities: ['extract_linkedin', 'analyze_social_media', 'integrate_social_network'],
    api_required: false,
    libraries: ['依赖webService'],
  },
};

/**
 * 获取所有可用服务
 */
export function getAvailableServices(): string[] {
  return Object.keys(serviceRegistry);
}

/**
 * 检查服务依赖状态
 */
export function checkServiceDependencies(serviceName: string): {
  service: string;
  available: boolean;
  missing_dependencies?: string[];
  notes?: string;
} {
  const service = serviceRegistry[serviceName as keyof typeof serviceRegistry];
  
  if (!service) {
    return {
      service: serviceName,
      available: false,
      missing_dependencies: ['服务不存在'],
    };
  }

  // 检查库依赖（这里简化实现）
  const missingDeps: string[] = [];
  
  if (serviceName === 'github' && !process.env.GITHUB_TOKEN) {
    missingDeps.push('GITHUB_TOKEN环境变量（可选，用于提升API限制）');
  }

  return {
    service: serviceName,
    available: missingDeps.length === 0,
    missing_dependencies: missingDeps.length > 0 ? missingDeps : undefined,
    notes: service.api_required ? '需要API密钥' : '无需API密钥',
  };
}

/**
 * 服务健康检查
 */
export async function healthCheck(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: Record<string, any>;
  timestamp: string;
}> {
  const serviceChecks: Record<string, any> = {};
  
  for (const serviceName of getAvailableServices()) {
    serviceChecks[serviceName] = checkServiceDependencies(serviceName);
  }
  
  const healthyCount = Object.values(serviceChecks).filter(s => s.available).length;
  const totalCount = Object.keys(serviceChecks).length;
  
  let status: 'healthy' | 'degraded' | 'unhealthy';
  if (healthyCount === totalCount) {
    status = 'healthy';
  } else if (healthyCount > totalCount / 2) {
    status = 'degraded';
  } else {
    status = 'unhealthy';
  }
  
  return {
    status,
    services: serviceChecks,
    timestamp: new Date().toISOString(),
  };
}

// 向后兼容的默认导出（如果需要）
import { githubService } from './github-service';
import { webService } from './web-service';
import { documentService } from './document-service';
import { socialService } from './social-service';

export default {
  github: githubService,
  web: webService,
  document: documentService,
  social: socialService,
  registry: serviceRegistry,
  healthCheck,
}; 