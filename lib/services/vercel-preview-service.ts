/**
 * Vercel 预览服务
 * 使用 Vercel SDK 进行项目部署和预览管理
 */

import { VercelCore } from '@vercel/sdk/core';
import { deploymentsCreateDeployment } from '@vercel/sdk/funcs/deploymentsCreateDeployment';
import { deploymentsGetDeployment } from '@vercel/sdk/funcs/deploymentsGetDeployment';
import { deploymentsGetDeployments } from '@vercel/sdk/funcs/deploymentsGetDeployments';
import { deploymentsDeleteDeployment } from '@vercel/sdk/funcs/deploymentsDeleteDeployment';
import { projectsCreateProject } from '@vercel/sdk/funcs/projectsCreateProject';
import { projectsDeleteProject } from '@vercel/sdk/funcs/projectsDeleteProject';
import { projectsCreateProjectEnv } from '@vercel/sdk/funcs/projectsCreateProjectEnv';
import { CodeFile } from '@/lib/agents/coding/types';

export interface VercelConfig {
  bearerToken: string;
  teamId?: string;
  teamSlug?: string;
}

export interface DeploymentConfig {
  projectName: string;
  files: CodeFile[];
  target?: 'production' | 'preview';
  gitMetadata?: {
    remoteUrl?: string;
    commitAuthorName?: string;
    commitMessage?: string;
    commitRef?: string;
    commitSha?: string;
    dirty?: boolean;
  };
  environmentVariables?: Array<{
    key: string;
    value: string;
    target: ('production' | 'preview' | 'development')[];
  }>;
}

export interface DeploymentStatus {
  id: string;
  url: string;
  state: 'BUILDING' | 'READY' | 'ERROR' | 'CANCELED' | 'QUEUED';
  createdAt: number;
  readyAt?: number;
  deploymentUrl?: string;
}

export type PreviewStatus = 'initializing' | 'creating_project' | 'uploading_files' | 'deploying' | 'ready' | 'error';

export class VercelPreviewService {
  private vercel: VercelCore;
  private config: VercelConfig;
  private statusListeners: ((status: PreviewStatus) => void)[] = [];
  private logListeners: ((log: string) => void)[] = [];
  private deploymentReadyListeners: ((deployment: DeploymentStatus) => void)[] = [];
  private currentProject: { id: string; name: string } | null = null;
  private currentDeployment: DeploymentStatus | null = null;
  private deploymentHistory: DeploymentStatus[] = [];

  constructor(config: VercelConfig) {
    this.config = config;
    this.vercel = new VercelCore({
      bearerToken: config.bearerToken,
    });
  }

  // ============== 核心部署方法 ==============

  /**
   * 创建或更新项目部署
   */
  async deployProject(deploymentConfig: DeploymentConfig): Promise<DeploymentStatus> {
    try {
      this.updateStatus('initializing');
      this.log('🚀 开始 Vercel 部署流程...');

      // 1. 确保项目存在
      await this.ensureProject(deploymentConfig.projectName);

      // 2. 设置环境变量
      if (deploymentConfig.environmentVariables?.length) {
        await this.updateEnvironmentVariables(deploymentConfig.environmentVariables);
      }

      // 3. 准备文件
      this.updateStatus('uploading_files');
      const files = this.prepareFiles(deploymentConfig.files);

      // 4. 创建部署
      this.updateStatus('deploying');
      const deployment = await this.createDeployment(deploymentConfig, files);

      // 5. 等待部署完成
      const finalDeployment = await this.waitForDeployment(deployment.id);

      this.currentDeployment = finalDeployment;
      this.deploymentHistory.unshift(finalDeployment);
      this.updateStatus('ready');
      this.deploymentReadyListeners.forEach(listener => listener(finalDeployment));

      this.log(`✅ 部署成功：${finalDeployment.url}`);
      return finalDeployment;

    } catch (error) {
      this.updateStatus('error');
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log(`❌ 部署失败: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * 回退到之前的部署
   */
  async rollbackToPrevious(): Promise<DeploymentStatus | null> {
    if (this.deploymentHistory.length < 2) {
      this.log('⚠️ 没有可回退的部署版本');
      return null;
    }

    try {
      const previousDeployment = this.deploymentHistory[1];
      this.log(`🔄 正在回退到部署: ${previousDeployment.id}`);

      // 通过重新部署之前的版本来实现回退
      const rollbackDeployment = await this.promoteDeployment(previousDeployment.id);
      
      this.currentDeployment = rollbackDeployment;
      this.deploymentHistory.unshift(rollbackDeployment);
      
      this.log(`✅ 回退成功：${rollbackDeployment.url}`);
      return rollbackDeployment;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log(`❌ 回退失败: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * 删除当前部署
   */
  async deleteCurrentDeployment(): Promise<void> {
    if (!this.currentDeployment) {
      this.log('⚠️ 没有活跃的部署可删除');
      return;
    }

    try {
      this.log(`🗑️ 正在删除部署: ${this.currentDeployment.id}`);

      const res = await deploymentsDeleteDeployment(this.vercel, {
        id: this.currentDeployment.id,
        teamId: this.config.teamId,
        slug: this.config.teamSlug,
      });

      if (!res.ok) {
        throw new Error(`删除部署失败: ${res.error}`);
      }

      this.currentDeployment = null;
      this.log('✅ 部署已删除');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log(`❌ 删除部署失败: ${errorMessage}`);
      throw error;
    }
  }

  // ============== 内部工具方法 ==============

  private async ensureProject(projectName: string): Promise<void> {
    this.updateStatus('creating_project');
    this.log(`📁 确保项目存在: ${projectName}`);

    try {
      // 尝试创建项目
      const res = await projectsCreateProject(this.vercel, {
        teamId: this.config.teamId,
        slug: this.config.teamSlug,
        requestBody: {
          name: projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        },
      });

      if (res.ok) {
        this.currentProject = {
          id: res.value.id,
          name: res.value.name,
        };
        this.log(`✅ 项目已创建: ${this.currentProject.name}`);
      } else {
        // 项目可能已存在，这是正常的
        this.log(`📂 项目可能已存在，继续部署流程...`);
      }

    } catch (error) {
      // 项目已存在的错误是可以接受的
      this.log(`📂 使用现有项目继续部署...`);
    }
  }

  private async updateEnvironmentVariables(envVars: Array<{
    key: string;
    value: string;
    target: ('production' | 'preview' | 'development')[];
  }>): Promise<void> {
    if (!this.currentProject) return;

    this.log('🔧 配置环境变量...');

    for (const envVar of envVars) {
      try {
        const res = await projectsCreateProjectEnv(this.vercel, {
          idOrName: this.currentProject.id,
          upsert: 'true',
          teamId: this.config.teamId,
          slug: this.config.teamSlug,
          requestBody: {
            key: envVar.key,
            value: envVar.value,
            type: 'plain',
            target: envVar.target,
          },
        });

        if (res.ok) {
          this.log(`✅ 环境变量已设置: ${envVar.key}`);
        }
      } catch (error) {
        this.log(`⚠️ 设置环境变量失败 ${envVar.key}: ${error}`);
      }
    }
  }

  private prepareFiles(files: CodeFile[]): Array<{ file: string; data: string }> {
    this.log(`📄 准备 ${files.length} 个文件...`);

    return files.map(file => ({
      file: file.filename,
      data: file.content, // 确保包含文件内容
    }));
  }

  private async createDeployment(
    config: DeploymentConfig, 
    files: Array<{ file: string; data: string }>
  ): Promise<{ id: string; url: string }> {
    this.log('🚀 创建 Vercel 部署...');

    // 🔧 修复：正确处理文件上传
    // 根据官方文档，需要使用 InlinedFile 格式直接在请求中包含文件内容
    const res = await deploymentsCreateDeployment(this.vercel, {
      teamId: this.config.teamId,
      slug: this.config.teamSlug,
      requestBody: {
        name: config.projectName,
        project: this.currentProject?.name || config.projectName,
        // ✅ 使用正确的文件格式，直接包含文件内容
        files: files.map(f => ({
          file: f.file,
          data: f.data, // 文件内容直接内联
        })),
        target: config.target || 'preview',
        gitMetadata: config.gitMetadata,
        meta: {
          source: 'heysme-preview',
          timestamp: Date.now().toString(),
        },
      },
    });

    if (!res.ok) {
      throw new Error(`创建部署失败: ${res.error}`);
    }

    return {
      id: res.value.id,
      url: res.value.url,
    };
  }

  private async waitForDeployment(deploymentId: string): Promise<DeploymentStatus> {
    this.log('⏳ 等待部署完成...');

    let attempts = 0;
    const maxAttempts = 120; // 10分钟超时
    const pollInterval = 5000; // 5秒间隔

    while (attempts < maxAttempts) {
      try {
        const res = await deploymentsGetDeployment(this.vercel, {
          idOrUrl: deploymentId,
          teamId: this.config.teamId,
          slug: this.config.teamSlug,
        });

        if (res.ok) {
          const deployment = res.value;
          const status: DeploymentStatus = {
            id: deployment.id,
            url: deployment.url,
            state: deployment.readyState as any,
            createdAt: deployment.createdAt,
            readyAt: deployment.ready,
            deploymentUrl: `https://${deployment.url}`,
          };

          this.log(`📊 部署状态: ${status.state}`);

          if (status.state === 'READY') {
            return status;
          } else if (status.state === 'ERROR' || status.state === 'CANCELED') {
            throw new Error(`部署失败，状态: ${status.state}`);
          }
        }

        await new Promise(resolve => setTimeout(resolve, pollInterval));
        attempts++;

      } catch (error) {
        this.log(`⚠️ 检查部署状态时出错: ${error}`);
        attempts++;
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }

    throw new Error('部署超时');
  }

  private async promoteDeployment(deploymentId: string): Promise<DeploymentStatus> {
    // 这里需要实现部署推广功能
    // 可能需要重新创建部署或使用 Vercel 的推广 API
    throw new Error('推广部署功能待实现');
  }

  // ============== 状态管理 ==============

  getCurrentDeployment(): DeploymentStatus | null {
    return this.currentDeployment;
  }

  getDeploymentHistory(): DeploymentStatus[] {
    return [...this.deploymentHistory];
  }

  // ============== 事件监听器 ==============

  onStatusChange(listener: (status: PreviewStatus) => void): void {
    this.statusListeners.push(listener);
  }

  onLog(listener: (log: string) => void): void {
    this.logListeners.push(listener);
  }

  onDeploymentReady(listener: (deployment: DeploymentStatus) => void): void {
    this.deploymentReadyListeners.push(listener);
  }

  // ============== 工具方法 ==============

  private updateStatus(status: PreviewStatus): void {
    this.statusListeners.forEach(listener => listener(status));
  }

  private log(message: string): void {
    console.log(`[VercelPreview] ${message}`);
    this.logListeners.forEach(listener => listener(message));
  }

  // ============== 清理方法 ==============

  async destroy(): Promise<void> {
    this.statusListeners = [];
    this.logListeners = [];
    this.deploymentReadyListeners = [];
    this.currentProject = null;
    this.currentDeployment = null;
    this.deploymentHistory = [];
  }
} 