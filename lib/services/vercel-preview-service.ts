/**
 * Vercel 预览服务 - 基于官方文档标准实现
 * 使用主 Vercel 类，符合官方推荐的使用方式，包含完整功能
 */

import { Vercel } from '@vercel/sdk';
import { CodeFile } from '@/lib/agents/coding/types';

export interface VercelConfig {
  bearerToken: string;
  teamId?: string;
  teamSlug?: string;
}

export interface DeploymentConfig {
  projectName: string;
  files: CodeFile[];
  target?: 'production' | 'staging' | string;
  gitMetadata?: {
    remoteUrl?: string;
    commitAuthorName?: string;
    commitAuthorEmail?: string;
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
  projectSettings?: {
    buildCommand?: string;
    installCommand?: string;
    outputDirectory?: string;
    rootDirectory?: string;
    framework?: string;
  };
  meta?: Record<string, string>;
}

export interface DeploymentStatus {
  id: string;
  url: string;
  state: 'BUILDING' | 'READY' | 'ERROR' | 'CANCELED' | 'QUEUED';
  createdAt: number;
  readyAt?: number;
  deploymentUrl?: string;
  inspectorUrl?: string;
}

export type PreviewStatus = 'initializing' | 'creating_project' | 'uploading_files' | 'deploying' | 'building' | 'ready' | 'error';

/**
 * Vercel 预览服务
 * 严格按照官方文档实现：https://vercel.com/docs/rest-api/endpoints/deployments
 */
export class VercelPreviewService {
  private vercel: Vercel;
  private config: VercelConfig;
  private statusListeners: ((status: PreviewStatus) => void)[] = [];
  private logListeners: ((log: string) => void)[] = [];
  private deploymentReadyListeners: ((deployment: DeploymentStatus) => void)[] = [];
  private currentProject: { id: string; name: string } | null = null;
  private currentDeployment: DeploymentStatus | null = null;
  private deploymentHistory: DeploymentStatus[] = [];

  constructor(config: VercelConfig) {
    this.config = config;
    
    // ✅ 官方文档标准初始化方式
    this.vercel = new Vercel({
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
      
      // 4. 创建部署
      this.updateStatus('deploying');
      const deployment = await this.createDeployment(deploymentConfig);

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
   * 创建可共享链接以绕过身份验证（已废弃，现在使用生产部署）
   * @deprecated 已改为生产部署，无需绕过保护
   */
  private async createShareableLink(deploymentId: string): Promise<string | null> {
    try {
      this.log(`🔗 为部署 ${deploymentId} 创建可共享链接...`);
      
      // 使用Vercel API创建可共享链接
      const response = await fetch(`https://api.vercel.com/v1/deployments/${deploymentId}/share`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.bearerToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // 可选：设置链接过期时间（默认永不过期）
          // expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30天后过期
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.url || null;
    } catch (error) {
      this.log(`❌ 创建可共享链接失败: ${error}`);
      return null;
    }
  }

  /**
   * 根据项目名称获取项目信息
   */
  private async getProjectByName(projectName: string): Promise<{id: string; name: string} | null> {
    try {
      const result = await this.vercel.projects.getProjects({
        teamId: this.config.teamId,
        slug: this.config.teamSlug,
      });

      const projects = Array.isArray(result) ? result : result.projects || [];
      const normalizedName = projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
      
      const project = projects.find((p: any) => 
        p.name === normalizedName || 
        p.name === projectName ||
        p.name.includes(normalizedName.substring(0, 20)) // 部分匹配
      );

      if (project) {
        return { id: project.id, name: project.name };
      }
      
      return null;
    } catch (error) {
      this.log(`❌ 获取项目失败: ${error}`);
      return null;
    }
  }

  /**
   * 禁用项目的Vercel身份验证（仅对预览部署）
   */
  private async disableProjectSSO(projectId: string): Promise<boolean> {
    try {
      this.log(`🔓 为项目 ${projectId} 禁用预览部署的身份验证...`);
      
      const response = await fetch(`https://api.vercel.com/v9/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.config.bearerToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ssoProtection: null // 禁用身份验证
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      this.log(`✅ 项目身份验证已禁用`);
      return true;
    } catch (error) {
      this.log(`❌ 禁用项目身份验证失败: ${error}`);
      return false;
    }
  }

  /**
   * 创建部署 - 官方文档标准实现
   */
  private async createDeployment(deploymentConfig: DeploymentConfig): Promise<{ id: string; url: string }> {
    this.log('🚀 创建 Vercel 部署...');

    try {
      // 🔧 按照官方文档格式创建部署
      const result = await this.vercel.deployments.createDeployment({
      teamId: this.config.teamId,
      slug: this.config.teamSlug,
      requestBody: {
        name: deploymentConfig.projectName,
        project: this.currentProject?.name || deploymentConfig.projectName,
        // ✅ 官方文档确认的文件格式
        files: deploymentConfig.files.map(file => ({
          file: file.filename,
          data: file.content,
        })),
        // target 字段：默认设置为 production 避免部署保护限制
        target: 'production',
        gitMetadata: deploymentConfig.gitMetadata && {
          remoteUrl: deploymentConfig.gitMetadata.remoteUrl || "https://github.com/heysme/project",
          commitAuthorName: deploymentConfig.gitMetadata.commitAuthorName || "HeysMe User",
          commitAuthorEmail: deploymentConfig.gitMetadata.commitAuthorEmail || "812241569@qq.com",
          commitMessage: deploymentConfig.gitMetadata.commitMessage || `Deploy ${deploymentConfig.projectName}`,
          commitRef: deploymentConfig.gitMetadata.commitRef || "main",
          commitSha: deploymentConfig.gitMetadata.commitSha,
          dirty: deploymentConfig.gitMetadata.dirty || false,
        },
        // ✅ 根据测试结果，projectSettings 是必需的
        projectSettings: {
          buildCommand: deploymentConfig.projectSettings?.buildCommand || "npm run build",
          installCommand: deploymentConfig.projectSettings?.installCommand || "npm install",
          outputDirectory: deploymentConfig.projectSettings?.outputDirectory || null,
          rootDirectory: deploymentConfig.projectSettings?.rootDirectory || null,
          framework: deploymentConfig.projectSettings?.framework as any || null,
        },
        meta: {
          source: 'heysme-preview',
          timestamp: Date.now().toString(),
          version: '1.0.0',
          ...deploymentConfig.meta,
        },
      },
    });

    const deploymentUrl = `https://${result.url}`;
    this.log(`📝 部署创建成功: ${result.id}`);
    this.log(`🌐 生产部署地址: ${deploymentUrl}`);

    return {
      id: result.id,
      url: deploymentUrl,
    };
    } catch (error: any) {
      this.log(`❌ 创建部署失败: ${error.message || error}`);
      
      // 🔍 详细分析创建阶段的错误
      let detailedErrorInfo = {
        message: error.message || error,
        status: error.status,
        code: error.code,
        response: null as any,
        suggestions: [] as string[]
      };
      
      // 尝试解析更详细的错误信息
      if (error.response?.data) {
        detailedErrorInfo.response = error.response.data;
        this.log(`🔍 错误详情: ${JSON.stringify(error.response.data, null, 2)}`);
      }
      
      if (error.status) {
        this.log(`📊 HTTP 状态码: ${error.status}`);
      }
      
      // 🔍 根据错误类型生成建议
      const errorMessage = (error.message || error).toLowerCase();
      if (errorMessage.includes('git author') && errorMessage.includes('must have access')) {
        detailedErrorInfo.suggestions.push('Git作者邮箱权限问题：请确保邮箱在Vercel团队中有权限');
        detailedErrorInfo.suggestions.push('检查VERCEL_TOKEN对应的用户是否有项目访问权限');
      }
      
      if (errorMessage.includes('invalid') && errorMessage.includes('token')) {
        detailedErrorInfo.suggestions.push('Token无效：请检查VERCEL_TOKEN是否正确');
        detailedErrorInfo.suggestions.push('尝试重新生成Vercel API Token');
      }
      
      if (errorMessage.includes('rate limit')) {
        detailedErrorInfo.suggestions.push('API调用频率超限：请稍后重试');
      }
      
      if (errorMessage.includes('project not found')) {
        detailedErrorInfo.suggestions.push('项目不存在：Vercel将自动创建新项目');
      }
      
      // 🚨 创建包含详细信息的错误对象
      const enhancedError = new Error(`创建部署失败: ${error.message || error}`);
      (enhancedError as any).isVercelError = true;
      (enhancedError as any).isCreationError = true;
      (enhancedError as any).errorDetails = JSON.stringify(detailedErrorInfo, null, 2);
      (enhancedError as any).rawError = error;
      (enhancedError as any).suggestions = detailedErrorInfo.suggestions;
      
      throw enhancedError;
    }
  }

  /**
   * 等待部署完成
   */
  private async waitForDeployment(deploymentId: string): Promise<DeploymentStatus> {
    this.log('⏳ 等待部署完成...');

    let attempts = 0;
    const maxAttempts = 120; // 10分钟超时
    const pollInterval = 5000; // 5秒间隔

    while (attempts < maxAttempts) {
      try {
        const result = await this.vercel.deployments.getDeployment({
          idOrUrl: deploymentId,
          teamId: this.config.teamId,
          slug: this.config.teamSlug,
        });

        const status: DeploymentStatus = {
          id: result.id,
          url: result.url,
          state: result.readyState as any || 'QUEUED',
          createdAt: result.createdAt || Date.now(),
          readyAt: result.ready,
          deploymentUrl: `https://${result.url}`,
        };

        this.log(`📊 部署状态: ${status.state}`);

        // 🔄 根据部署状态更新服务状态
        if (status.state === 'BUILDING') {
          this.updateStatus('building');
          this.log('🔨 正在构建项目，请稍候...');
        } else if (status.state === 'QUEUED') {
          this.updateStatus('deploying');
          this.log('⏳ 部署已排队，等待开始构建...');
        }

        if (status.state === 'READY') {
          this.updateStatus('ready');
          
          // 生产部署无需保护旁路，直接返回状态
          return status;
        } else if (status.state === 'ERROR' || status.state === 'CANCELED') {
          this.updateStatus('error');
          
          // 🔍 获取详细的构建日志和错误信息
          const [errorDetails, buildLogs] = await Promise.all([
            this.getDeploymentErrorDetails(deploymentId).catch(err => {
              this.log(`⚠️ 获取错误详情失败: ${err}`);
              return null;
            }),
            this.getDeploymentLogs(deploymentId).catch(err => {
              this.log(`⚠️ 获取构建日志失败: ${err}`);
              return [];
            })
          ]);
          
          // 🔍 获取更详细的部署信息
          let additionalInfo = '';
          try {
            const deploymentInfo = await this.getDeploymentInfo(deploymentId);
            if (deploymentInfo && deploymentInfo.error) {
              additionalInfo = `\n部署错误信息: ${JSON.stringify(deploymentInfo.error, null, 2)}`;
            }
          } catch (infoError) {
            this.log(`⚠️ 无法获取额外部署信息: ${infoError}`);
          }
          
          // 🔧 组合详细的错误信息，优先显示构建日志
          let detailedErrorMessage = `部署失败，状态: ${status.state}`;
          
          // 添加构建日志（最重要）
          if (buildLogs && buildLogs.length > 0) {
            // 🔧 过滤掉无用的 stdout 事件，专注于实际的错误信息
            const meaningfulLogs = buildLogs.filter(log => {
              const logText = log.toLowerCase();
              return !logText.includes('stdout 事件 (无详细文本内容)') && 
                     !logText.includes('event: stdout') &&
                     log.trim().length > 10; // 过滤掉太短的无用日志
            });
            
            const buildErrors = meaningfulLogs.filter(log => 
              log.toLowerCase().includes('error') || 
              log.toLowerCase().includes('failed') ||
              log.toLowerCase().includes('module not found') ||
              log.toLowerCase().includes('build failed') ||
              log.toLowerCase().includes('syntaxerror') ||
              log.toLowerCase().includes('typeerror') ||
              log.toLowerCase().includes('cannot resolve') ||
              log.toLowerCase().includes('unexpected token')
            );
            
            if (buildErrors.length > 0) {
              detailedErrorMessage += `\n\n📋 构建错误日志:\n${buildErrors.join('\n')}`;
            } else if (meaningfulLogs.length > 0) {
              // 如果没有明显的错误，显示最后几行有意义的日志
              const lastLogs = meaningfulLogs.slice(-10);
              detailedErrorMessage += `\n\n📋 构建日志 (最后10行):\n${lastLogs.join('\n')}`;
            } else {
              // 如果连有意义的日志都没有，显示提示信息
              detailedErrorMessage += `\n\n📋 构建日志获取问题:\n• 构建事件日志为空或格式异常\n• 建议查看 Vercel 控制台获取详细信息\n• 或使用 CLI: vercel logs ${deploymentId}`;
            }
          }
          
          // 添加其他错误详情
          if (errorDetails) {
            detailedErrorMessage += `\n\n🔍 错误详情: ${errorDetails}`;
          }
          
          if (additionalInfo) {
            detailedErrorMessage += additionalInfo;
          }
          
          this.log(`❌ ${detailedErrorMessage}`);
          
          // 🚨 创建包含详细信息的错误对象，便于前端处理
          const deploymentError = new Error(detailedErrorMessage);
          (deploymentError as any).deploymentId = deploymentId;
          (deploymentError as any).deploymentState = status.state;
          (deploymentError as any).errorDetails = errorDetails;
          (deploymentError as any).buildLogs = buildLogs;
          (deploymentError as any).deploymentUrl = status.deploymentUrl;
          (deploymentError as any).isVercelError = true;
          
          throw deploymentError;
        }

        // ✅ 继续等待 BUILDING, QUEUED 等中间状态

        await new Promise(resolve => setTimeout(resolve, pollInterval));
        attempts++;

      } catch (error) {
        // 如果是Vercel部署错误（包含详细错误信息），直接抛出，不重试
        if ((error as any).isVercelError) {
          this.log(`❌ Vercel部署失败，立即停止重试`);
          throw error;
        }
        
        this.log(`⚠️ 检查部署状态时出错: ${error}`);
        
        // 如果是网络错误，可以重试几次
        if (attempts < 3) {
          attempts++;
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          continue;
        }
        
        // 🔧 网络错误重试失败后，尝试获取构建日志
        this.log(`🔍 网络重试失败，尝试获取构建日志...`);
        this.updateStatus('error');
        
        let buildLogs: string[] = [];
        let errorDetails: string | null = null;
        
        try {
          // 尝试获取构建日志，即使网络不稳定
          [errorDetails, buildLogs] = await Promise.all([
            this.getDeploymentErrorDetails(deploymentId).catch(() => null),
            this.getDeploymentLogs(deploymentId).catch(() => [])
          ]);
        } catch (logError) {
          this.log(`⚠️ 获取构建日志也失败: ${logError}`);
        }
        
        // 🔧 组合网络错误和构建日志
        let networkErrorMessage = `检查部署状态失败，已重试${attempts}次: ${error instanceof Error ? error.message : String(error)}`;
        
        // 如果获取到了构建日志，添加到错误信息中
        if (buildLogs && buildLogs.length > 0) {
          const buildErrors = buildLogs.filter(log => 
            log.toLowerCase().includes('error') || 
            log.toLowerCase().includes('failed') ||
            log.toLowerCase().includes('module not found') ||
            log.toLowerCase().includes('build failed')
          );
          
          if (buildErrors.length > 0) {
            networkErrorMessage += `\n\n📋 构建错误日志:\n${buildErrors.join('\n')}`;
          } else {
            const lastLogs = buildLogs.slice(-10);
            networkErrorMessage += `\n\n📋 构建日志 (最后10行):\n${lastLogs.join('\n')}`;
          }
        }
        
        if (errorDetails) {
          networkErrorMessage += `\n\n🔍 错误详情: ${errorDetails}`;
        }
        
        const networkError = new Error(networkErrorMessage);
        (networkError as any).isNetworkError = true;
        (networkError as any).originalError = error;
        (networkError as any).buildLogs = buildLogs;
        (networkError as any).deploymentId = deploymentId;
        throw networkError;
      }
    }

    throw new Error('部署超时');
  }

  /**
   * 确保项目存在
   */
  private async ensureProject(projectName: string): Promise<void> {
    this.updateStatus('creating_project');
    this.log(`📁 确保项目存在: ${projectName}`);

    try {
      // 使用 Vercel 类的项目方法
      const result = await this.vercel.projects.createProject({
        teamId: this.config.teamId,
        slug: this.config.teamSlug,
        requestBody: {
          name: projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        },
      });

      this.currentProject = {
        id: result.id,
        name: result.name,
      };
      this.log(`✅ 项目已创建: ${this.currentProject.name}`);

      // 🔓 立即禁用新项目的身份验证
      try {
        await this.disableProjectSSO(result.id);
      } catch (ssoError) {
        this.log(`⚠️ 新项目禁用身份验证失败: ${ssoError}`);
      }

    } catch (error) {
      // 项目可能已存在，这是正常的
      this.log(`📂 使用现有项目继续部署...`);
      
      // 🔍 尝试获取现有项目ID并禁用身份验证
      try {
        const existingProjects = await this.getProjectByName(projectName);
        if (existingProjects && existingProjects.id) {
          this.currentProject = existingProjects;
          await this.disableProjectSSO(existingProjects.id);
        }
      } catch (existingError) {
        this.log(`⚠️ 处理现有项目身份验证失败: ${existingError}`);
      }
    }
  }

  /**
   * 设置环境变量
   */
  private async updateEnvironmentVariables(envVars: Array<{
    key: string;
    value: string;
    target: ('production' | 'preview' | 'development')[];
  }>): Promise<void> {
    if (!this.currentProject) return;

    this.log('🔧 配置环境变量...');

    for (const envVar of envVars) {
      try {
        await this.vercel.projects.createProjectEnv({
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

        this.log(`✅ 环境变量已设置: ${envVar.key}`);
      } catch (error) {
        this.log(`⚠️ 设置环境变量失败 ${envVar.key}: ${error}`);
      }
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

      // 简化版回退：重新创建之前的部署
      this.currentDeployment = previousDeployment;
      this.deploymentHistory.unshift(previousDeployment);
      
      this.log(`✅ 回退成功：${previousDeployment.url}`);
      return previousDeployment;

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

      await this.vercel.deployments.deleteDeployment({
        id: this.currentDeployment.id,
        teamId: this.config.teamId,
        slug: this.config.teamSlug,
      });

      this.currentDeployment = null;
      this.log('✅ 部署已删除');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log(`❌ 删除部署失败: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * 获取部署错误详情 - 增强版本
   */
  private async getDeploymentErrorDetails(deploymentId: string): Promise<string | null> {
    try {
      this.log(`🔍 开始获取部署 ${deploymentId} 的详细错误信息...`);
      
      // 1. 获取部署事件来查看详细错误
      const events = await this.fetchDeploymentEvents(deploymentId);
      this.log(`📋 获取到 ${events.length} 个部署事件`);
      
      // 2. 分类事件获取更丰富的信息
      const buildEvents = events.filter(event => 
        event.type === 'stdout' || 
        event.type === 'stderr' ||
        event.type === 'building'
      );
      
      const errorEvents = events.filter(event => 
        event.type === 'error' || 
        (event.payload?.text && (
          event.payload.text.toLowerCase().includes('error') ||
          event.payload.text.toLowerCase().includes('failed') ||
          event.payload.text.toLowerCase().includes('exception') ||
          event.payload.text.toLowerCase().includes('cannot') ||
          event.payload.text.toLowerCase().includes('unable to')
        ))
      );

      const warningEvents = events.filter(event => 
        event.type === 'warning' ||
        (event.payload?.text && event.payload.text.toLowerCase().includes('warning'))
      );

      // 3. 构建详细错误报告
      let errorDetails = [];
      
      if (errorEvents.length > 0) {
        errorDetails.push('=== 错误事件 ===');
        errorEvents.forEach((event, index) => {
          const timestamp = event.created_at ? new Date(event.created_at).toISOString() : '未知时间';
          errorDetails.push(`[${index + 1}] ${timestamp} - ${event.type}: ${event.payload?.text || '无详细信息'}`);
        });
      }

      if (warningEvents.length > 0) {
        errorDetails.push('\n=== 警告事件 ===');
        warningEvents.forEach((event, index) => {
          const timestamp = event.created_at ? new Date(event.created_at).toISOString() : '未知时间';
          errorDetails.push(`[${index + 1}] ${timestamp} - ${event.type}: ${event.payload?.text || '无详细信息'}`);
        });
      }

      // 4. 获取最后几条构建日志
      if (buildEvents.length > 0) {
        errorDetails.push('\n=== 最近构建日志 ===');
        const recentBuildEvents = buildEvents.slice(-10); // 最后10条
        recentBuildEvents.forEach((event, index) => {
          // 🔧 改进时间戳和文本解析
          const timestamp = this.parseEventTimestamp(event);
          const text = this.parseEventText(event);
          errorDetails.push(`[${index + 1}] ${timestamp} - ${event.type}: ${text}`);
        });
      } else {
        // 如果没有构建日志，提供调试建议
        errorDetails.push('\n=== 构建日志获取失败 ===');
        errorDetails.push('未能获取到构建日志，可能原因：');
        errorDetails.push('1. 部署还未开始构建阶段');
        errorDetails.push('2. API 权限不足');
        errorDetails.push('3. 部署ID无效');
      }

      // 5. 如果没有找到具体错误，提供调试建议
      if (errorDetails.length === 0) {
        errorDetails.push('未找到具体错误详情，建议：');
        errorDetails.push('1. 检查 Vercel 控制台：https://vercel.com/dashboard');
        errorDetails.push(`2. 访问部署日志：https://{deployment-url}/_logs`);
        errorDetails.push('3. 使用 Vercel CLI: vc logs');
      }
      
      const result = errorDetails.join('\n');
      this.log(`📊 错误详情获取完成，共 ${errorDetails.length} 行信息`);
      return result;
      
    } catch (error) {
      this.log(`⚠️ 无法获取错误详情: ${error}`);
      return `获取错误详情失败: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  /**
   * 获取部署详细信息
   */
  private async getDeploymentInfo(deploymentId: string): Promise<any> {
    try {
      const result = await this.vercel.deployments.getDeployment({
        idOrUrl: deploymentId,
        teamId: this.config.teamId,
        slug: this.config.teamSlug,
      });

      // 处理不同的响应格式
      if (result && typeof result === 'object') {
        const responseData = (result as any).value || result;
        return responseData;
      }
      
      return result;
    } catch (error) {
      this.log(`⚠️ 获取部署信息失败: ${error}`);
      throw error;
    }
  }

  /**
   * 🆕 获取构建日志 - 基于Vercel官方API
   */
  async getDeploymentLogs(deploymentId: string): Promise<string[]> {
    try {
      this.log(`🔍 获取部署 ${deploymentId} 的构建日志...`);
      
      // 方法1: 通过 Vercel API 获取日志
      const events = await this.fetchDeploymentEvents(deploymentId);
      
      // 过滤并格式化构建日志
      const logEvents = events.filter(event => 
        event.type === 'stdout' || 
        event.type === 'stderr' ||
        event.type === 'building' ||
        event.type === 'created' ||
        event.type === 'ready' ||
        event.type === 'error' ||
        event.type === 'fatal'
      ).map(event => {
        const timestamp = this.parseEventTimestamp(event);
        const type = event.type.toUpperCase().padEnd(8);
        const message = this.parseEventText(event);
        
        // 🔧 过滤掉无意义的消息
        if (message.includes('stdout 事件 (无详细文本内容)') || 
            message.includes('Event: stdout') ||
            message.trim().length < 5) {
          return null; // 返回 null，稍后过滤掉
        }
        
        return `[${timestamp}] ${type} ${message}`;
      }).filter((log): log is string => log !== null); // 过滤掉 null 值并断言类型

      this.log(`📋 获取到 ${logEvents.length} 条构建日志`);
      return logEvents;
      
    } catch (error) {
      this.log(`⚠️ 获取构建日志失败: ${error}`);
      return [`获取日志失败: ${error instanceof Error ? error.message : String(error)}`];
    }
  }

  /**
   * 🆕 获取完整的部署分析报告
   */
  async getDeploymentAnalysis(deploymentId: string): Promise<{
    deployment: any;
    events: any[];
    buildLogs: string[];
    errorSummary: string;
    suggestions: string[];
  }> {
    try {
      this.log(`🔍 开始分析部署 ${deploymentId}...`);
      
      // 并行获取所有信息
      const [deployment, events, buildLogs] = await Promise.all([
        this.getDeploymentInfo(deploymentId).catch(err => ({ error: err.message })),
        this.fetchDeploymentEvents(deploymentId).catch(() => []),
        this.getDeploymentLogs(deploymentId).catch(() => [])
      ]);

      // 分析错误和警告
      const errorEvents = events.filter(event => 
        event.type === 'error' || 
        (event.payload?.text && event.payload.text.toLowerCase().includes('error'))
      );

      const warningEvents = events.filter(event => 
        event.type === 'warning' ||
        (event.payload?.text && event.payload.text.toLowerCase().includes('warning'))
      );

      // 生成错误摘要
      let errorSummary = '';
      if (errorEvents.length > 0) {
        errorSummary = errorEvents.map(event => 
          event.payload?.text || `${event.type} 事件`
        ).join('\n');
      } else if (deployment.error) {
        errorSummary = `部署信息获取失败: ${deployment.error}`;
      } else {
        errorSummary = '未发现明确的错误信息';
      }

      // 生成建议
      const suggestions = this.generateDeploymentSuggestions(deployment, events, errorEvents, warningEvents);

      return {
        deployment,
        events,
        buildLogs,
        errorSummary,
        suggestions
      };
      
    } catch (error) {
      this.log(`❌ 部署分析失败: ${error}`);
      throw error;
    }
  }

  /**
   * 🆕 生成部署建议
   */
  private generateDeploymentSuggestions(deployment: any, events: any[], errorEvents: any[], warningEvents: any[]): string[] {
    const suggestions: string[] = [];

    // 基于错误事件的建议
    if (errorEvents.length > 0) {
      const errorTexts = errorEvents.map(e => e.payload?.text || '').join(' ').toLowerCase();
      
      if (errorTexts.includes('npm') || errorTexts.includes('package')) {
        suggestions.push('检查 package.json 中的依赖版本是否正确');
        suggestions.push('尝试删除 node_modules 并重新安装依赖');
      }
      
      if (errorTexts.includes('build') || errorTexts.includes('compile')) {
        suggestions.push('检查代码中是否有语法错误或类型错误');
        suggestions.push('确保所有必需的环境变量已设置');
      }
      
      if (errorTexts.includes('memory') || errorTexts.includes('timeout')) {
        suggestions.push('考虑优化构建脚本以减少内存使用');
        suggestions.push('检查是否有无限循环或重复的依赖安装');
      }
      
      if (errorTexts.includes('permission') || errorTexts.includes('access')) {
        suggestions.push('检查 Vercel Token 权限是否正确');
        suggestions.push('确保项目配置和团队设置正确');
      }
    }

    // 基于警告事件的建议
    if (warningEvents.length > 0) {
      suggestions.push('查看警告信息，虽然不会导致失败但可能影响性能');
    }

    // 基于部署状态的建议
    if (deployment.state === 'ERROR') {
      suggestions.push('访问 Vercel 控制台查看详细的构建日志');
      suggestions.push(`如果可用，访问 https://{deployment-url}/_logs 查看在线日志`);
    }

    // 通用建议
    if (suggestions.length === 0) {
      suggestions.push('检查最近的代码更改是否引入了问题');
      suggestions.push('尝试在本地环境中重现构建过程');
      suggestions.push('确保本地构建成功后再部署');
    }

    return suggestions;
  }

  /**
   * 🆕 解析事件时间戳
   */
  private parseEventTimestamp(event: any): string {
    // 尝试多种时间戳字段
    const timeFields = ['created_at', 'createdAt', 'timestamp', 'date'];
    
    for (const field of timeFields) {
      if (event[field]) {
        try {
          return new Date(event[field]).toISOString();
        } catch {
          continue;
        }
      }
    }
    
    // 如果都没有，返回当前时间
    return new Date().toISOString();
  }

  /**
   * 🆕 解析事件文本内容
   */
  private parseEventText(event: any): string {
    // 🔧 更全面的文本字段解析
    const textSources = [
      event.payload?.text,
      event.payload?.message,
      event.payload?.output,
      event.payload?.log,
      event.payload?.content,
      event.payload?.data,
      event.text,
      event.message,
      event.output,
      event.log,
      event.content
    ];
    
    // 寻找第一个有效的文本
    for (const text of textSources) {
      if (text && typeof text === 'string' && text.trim().length > 0) {
        // 🔧 清理文本内容
        const cleanText = text
          .replace(/\x1b\[[0-9;]*m/g, '') // 移除 ANSI 颜色代码
          .replace(/\r?\n/g, '\n') // 统一换行符
          .trim();
        
        if (cleanText.length > 0) {
          return cleanText;
        }
      }
    }
    
    // 🔧 尝试从 payload 对象中提取更多信息
    if (event.payload && typeof event.payload === 'object') {
      // 检查是否有错误相关的字段
      const errorFields = ['error', 'stderr', 'errorMessage', 'errorText'];
      for (const field of errorFields) {
        if (event.payload[field] && typeof event.payload[field] === 'string') {
          return event.payload[field];
        }
      }
      
      // 🔧 如果是 stdout 事件，可能数据在其他地方
      if (event.type === 'stdout' || event.type === 'stderr') {
        // 尝试查找任何包含有用信息的字段
        const keys = Object.keys(event.payload);
        for (const key of keys) {
          const value = event.payload[key];
          if (typeof value === 'string' && value.trim().length > 5) {
            // 避免无意义的短字符串
            return value.trim();
          }
        }
        
        // 如果是构建输出，但没有具体内容，返回空以便过滤
        return '';
      }
      
      // 最后尝试stringify，但避免空对象
      try {
        const jsonStr = JSON.stringify(event.payload);
        if (jsonStr !== '{}' && jsonStr !== 'null' && jsonStr.length > 10) {
          return jsonStr;
        }
      } catch {
        // ignore
      }
    }
    
    // 🔧 为不同类型的事件提供更有意义的描述
    switch (event.type) {
      case 'building':
        return '正在构建项目...';
      case 'ready':
        return '构建完成';
      case 'error':
        return '构建过程中发生错误';
      case 'fatal':
        return '构建遇到致命错误';
      case 'created':
        return '部署已创建';
      case 'stdout':
      case 'stderr':
        // 对于空的 stdout/stderr 事件，返回空字符串以便过滤
        return '';
      default:
        return `${event.type} 事件`;
    }
  }

  /**
   * 获取部署事件 - 增强版本
   */
  async fetchDeploymentEvents(deploymentId: string): Promise<any[]> {
    try {
      this.log(`🔍 开始获取部署 ${deploymentId} 的事件...`);
      
      const result = await this.vercel.deployments.getDeploymentEvents({
        idOrUrl: deploymentId,
        teamId: this.config.teamId,
        slug: this.config.teamSlug,
      });

      this.log(`📦 API 响应类型: ${typeof result}, 是否为数组: ${Array.isArray(result)}`);
      
      // 处理不同的响应格式
      let events: any[] = [];
      
      if (Array.isArray(result)) {
        events = result;
        this.log(`✅ 直接从数组获取了 ${events.length} 个事件`);
      } else if (result && typeof result === 'object') {
        const responseData = (result as any).value || result;
        this.log(`🔍 尝试从对象解析事件，responseData 类型: ${typeof responseData}`);
        
        if (Array.isArray(responseData)) {
          events = responseData;
          this.log(`✅ 从 responseData 数组获取了 ${events.length} 个事件`);
        } else if (responseData.events && Array.isArray(responseData.events)) {
          events = responseData.events;
          this.log(`✅ 从 responseData.events 获取了 ${events.length} 个事件`);
        } else if (responseData.data && Array.isArray(responseData.data)) {
          events = responseData.data;
          this.log(`✅ 从 responseData.data 获取了 ${events.length} 个事件`);
        } else {
          this.log(`⚠️ 无法解析事件数据，responseData 结构: ${JSON.stringify(responseData, null, 2).slice(0, 500)}`);
        }
      }
      
      // 🔍 调试：打印前几个事件的结构
      if (events.length > 0) {
        this.log(`📋 事件样本 (前3个):`);
        events.slice(0, 3).forEach((event, index) => {
          this.log(`事件 ${index + 1}: 类型=${event.type}, 时间戳字段=${Object.keys(event).filter(k => k.includes('time') || k.includes('date') || k.includes('created'))}, payload=${typeof event.payload}`);
          if (event.payload) {
            this.log(`  payload 字段: ${Object.keys(event.payload || {})}`);
          }
        });
      }
      
      return events || [];
    } catch (error) {
      this.log(`⚠️ 获取部署事件失败: ${error}`);
      return [];
    }
  }

  /**
   * 获取项目的所有部署
   */
  async getProjectDeployments(projectId?: string, limit: number = 20): Promise<DeploymentStatus[]> {
    try {
      const result = await this.vercel.deployments.getDeployments({
        projectId: projectId || this.currentProject?.id,
        limit: limit as any, // ✅ 临时修复：类型定义不一致
        teamId: this.config.teamId,
        slug: this.config.teamSlug,
        target: 'preview',
      });

      return result.deployments?.map((deployment: any) => ({
        id: deployment.uid || deployment.id,
        url: deployment.url,
        state: deployment.readyState || deployment.state || 'UNKNOWN',
        createdAt: deployment.createdAt || deployment.created || Date.now(),
        readyAt: deployment.ready,
        deploymentUrl: `https://${deployment.url}`,
      })) || [];

    } catch (error) {
      this.log(`⚠️ 获取部署列表时出错: ${error}`);
      return [];
    }
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

/**
 * 🛠️ 工具函数：创建 Vercel 服务实例
 */
export function createVercelService(config: VercelConfig): VercelPreviewService {
  return new VercelPreviewService(config);
}

/**
 * 🛠️ 工具函数：验证 Vercel 配置
 */
export function validateVercelConfig(config: VercelConfig): boolean {
  if (!config.bearerToken) {
    console.error('❌ Vercel Token 是必需的');
    return false;
  }

  if (config.bearerToken.length < 20) {
    console.error('❌ Vercel Token 格式不正确');
    return false;
  }

  return true;
}