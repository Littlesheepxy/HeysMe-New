/**
 * Vercel 错误监控服务
 * 监控部署状态，获取构建错误，并提供智能修复建议
 */

import { VercelCore } from "@vercel/sdk/core.js";
import { deploymentsGetDeployments } from "@vercel/sdk/funcs/deploymentsGetDeployments.js";
import { deploymentsGetDeploymentEvents } from "@vercel/sdk/funcs/deploymentsGetDeploymentEvents.js";

export interface VercelBuildError {
  id: string;
  timestamp: Date;
  type: 'build' | 'runtime' | 'syntax' | 'compilation';
  message: string;
  file?: string;
  line?: number;
  column?: number;
  source: string;
  deploymentId: string;
  deploymentUrl?: string;
  suggestion?: string;
}

export interface ErrorMonitorConfig {
  bearerToken: string;
  projectId?: string;
  teamId?: string;
  slug?: string;
  pollInterval?: number; // 毫秒
}

export class VercelErrorMonitor {
  private vercel: VercelCore;
  private config: ErrorMonitorConfig;
  private isMonitoring = false;
  private monitoringInterval?: NodeJS.Timeout;
  private lastCheckedTimestamp: number = Date.now();
  private errorCallbacks: Array<(error: VercelBuildError) => void> = [];

  constructor(config: ErrorMonitorConfig) {
    this.config = {
      pollInterval: 30000, // 默认30秒检查一次
      ...config
    };
    
    this.vercel = new VercelCore({
      bearerToken: config.bearerToken
    });
  }

  /**
   * 开始监控错误
   */
  startMonitoring(): void {
    if (this.isMonitoring) {
      console.log('⚠️ [错误监控] 已经在监控中');
      return;
    }

    this.isMonitoring = true;
    console.log('🔍 [错误监控] 开始监控 Vercel 部署错误...');

    // 立即检查一次
    this.checkForErrors();

    // 设置定期检查
    this.monitoringInterval = setInterval(() => {
      this.checkForErrors();
    }, this.config.pollInterval);
  }

  /**
   * 停止监控
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    console.log('🛑 [错误监控] 已停止监控');
  }

  /**
   * 添加错误回调
   */
  onError(callback: (error: VercelBuildError) => void): void {
    this.errorCallbacks.push(callback);
  }

  /**
   * 移除错误回调
   */
  removeErrorCallback(callback: (error: VercelBuildError) => void): void {
    const index = this.errorCallbacks.indexOf(callback);
    if (index > -1) {
      this.errorCallbacks.splice(index, 1);
    }
  }

  /**
   * 检查部署错误
   */
  private async checkForErrors(): Promise<void> {
    try {
      console.log('🔍 [错误监控] 检查新的部署错误...');

      // 获取最近的部署
      const deploymentsRes = await deploymentsGetDeployments(this.vercel, {
        projectId: this.config.projectId,
        teamId: this.config.teamId,
        slug: this.config.slug,
        limit: 5, // 只检查最近5个部署
        since: this.lastCheckedTimestamp,
        state: "ERROR,BUILDING,READY" // 检查错误和构建中的部署
      });

      if (!deploymentsRes.ok) {
        console.error('❌ [错误监控] 获取部署列表失败:', deploymentsRes.error);
        return;
      }

      const deployments = deploymentsRes.value?.deployments || [];
      
      for (const deployment of deployments) {
        // 只检查有错误或正在构建的部署
        if (deployment.state === 'ERROR' || deployment.readyState === 'ERROR') {
          await this.analyzeDeploymentErrors(deployment);
        }
      }

      this.lastCheckedTimestamp = Date.now();

    } catch (error) {
      console.error('❌ [错误监控] 检查错误时发生异常:', error);
    }
  }

  /**
   * 分析单个部署的错误
   */
  private async analyzeDeploymentErrors(deployment: any): Promise<void> {
    try {
      console.log(`🔍 [错误监控] 分析部署 ${deployment.uid} 的错误...`);

      // 获取部署事件
      const eventsRes = await deploymentsGetDeploymentEvents(this.vercel, {
        idOrUrl: deployment.uid,
        teamId: this.config.teamId,
        slug: this.config.slug,
        limit: 50
      });

      if (!eventsRes.ok) {
        console.error('❌ [错误监控] 获取部署事件失败:', eventsRes.error);
        return;
      }

      const events = Array.isArray(eventsRes.value) ? eventsRes.value : [];
      
      // 过滤错误事件
      const errorEvents = events.filter((event: any) => 
        event.type === 'fatal' || 
        event.type === 'error' ||
        (event.type === 'stdout' && this.isErrorMessage(event.payload?.text))
      );

      for (const event of errorEvents) {
        const buildError = this.parseEventToError(event, deployment);
        if (buildError) {
          console.log('🚨 [错误监控] 发现构建错误:', buildError);
          this.notifyError(buildError);
        }
      }

    } catch (error) {
      console.error('❌ [错误监控] 分析部署错误时发生异常:', error);
    }
  }

  /**
   * 判断是否为错误消息
   */
  private isErrorMessage(text?: string): boolean {
    if (!text) return false;
    
    const errorKeywords = [
      'Error:', 'error:', 'ERROR:',
      'Failed to compile',
      'Build failed',
      'TypeError:', 'SyntaxError:', 'ReferenceError:',
      'Module not found',
      'Cannot resolve',
      'Unexpected token',
      'Expected',
      'Parse error'
    ];

    return errorKeywords.some(keyword => text.includes(keyword));
  }

  /**
   * 解析事件为错误对象
   */
  private parseEventToError(event: any, deployment: any): VercelBuildError | null {
    try {
      const text = event.payload?.text || event.info?.name || '';
      
      if (!text) return null;

      // 解析错误信息
      const error: VercelBuildError = {
        id: `${deployment.uid}-${event.id}`,
        timestamp: new Date(event.created || event.date || Date.now()),
        type: this.categorizeError(text),
        message: this.cleanErrorMessage(text),
        source: text,
        deploymentId: deployment.uid,
        deploymentUrl: deployment.url,
        suggestion: this.generateSuggestion(text)
      };

      // 尝试解析文件信息
      const fileMatch = text.match(/(\S+\.tsx?|\S+\.jsx?|\S+\.ts|\S+\.js):(\d+):(\d+)/);
      if (fileMatch) {
        error.file = fileMatch[1];
        error.line = parseInt(fileMatch[2]);
        error.column = parseInt(fileMatch[3]);
      }

      return error;

    } catch (parseError) {
      console.error('❌ [错误监控] 解析错误事件失败:', parseError);
      return null;
    }
  }

  /**
   * 分类错误类型
   */
  private categorizeError(text: string): VercelBuildError['type'] {
    if (text.includes('SyntaxError') || text.includes('Unexpected token') || text.includes('Expected')) {
      return 'syntax';
    }
    if (text.includes('Failed to compile') || text.includes('Build failed')) {
      return 'compilation';
    }
    if (text.includes('TypeError') || text.includes('ReferenceError') || text.includes('Cannot read property')) {
      return 'runtime';
    }
    return 'build';
  }

  /**
   * 清理错误消息
   */
  private cleanErrorMessage(text: string): string {
    // 移除 ANSI 颜色代码
    let cleaned = text.replace(/\x1b\[[0-9;]*m/g, '');
    
    // 移除多余的空白字符
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    // 截取主要错误信息
    const lines = cleaned.split('\n');
    const errorLine = lines.find(line => 
      line.includes('Error:') || 
      line.includes('Failed') ||
      line.includes('Expected')
    );
    
    return errorLine || lines[0] || cleaned;
  }

  /**
   * 生成修复建议
   */
  private generateSuggestion(text: string): string {
    // 常见错误的修复建议
    const suggestions: Record<string, string> = {
      "Expected '</'": "检查 JSX 标签是否正确闭合，特别注意组件标签的开闭匹配",
      "Unexpected token": "检查语法错误，可能是括号、引号或分号缺失",
      "Module not found": "检查导入路径是否正确，确认模块是否已安装",
      "Cannot resolve": "检查文件路径是否存在，可能需要调整相对路径",
      "Property does not exist": "检查对象属性名是否正确，可能需要添加类型定义",
      "Type 'undefined' is not assignable": "添加空值检查或可选链操作符(?.)，确保数据存在",
      "Failed to compile": "检查代码语法，特别注意 TypeScript 类型错误"
    };

    for (const [pattern, suggestion] of Object.entries(suggestions)) {
      if (text.includes(pattern)) {
        return suggestion;
      }
    }

    return "检查错误详情，建议查看完整的构建日志来定位问题";
  }

  /**
   * 通知错误
   */
  private notifyError(error: VercelBuildError): void {
    this.errorCallbacks.forEach(callback => {
      try {
        callback(error);
      } catch (callbackError) {
        console.error('❌ [错误监控] 错误回调执行失败:', callbackError);
      }
    });
  }

  /**
   * 手动检查最新部署状态
   */
  async checkLatestDeployment(): Promise<VercelBuildError[]> {
    try {
      const deploymentsRes = await deploymentsGetDeployments(this.vercel, {
        projectId: this.config.projectId,
        teamId: this.config.teamId,
        slug: this.config.slug,
        limit: 1
      });

      if (!deploymentsRes.ok) {
        throw new Error(`获取部署失败: ${deploymentsRes.error}`);
      }

      const deployments = deploymentsRes.value?.deployments || [];
      if (deployments.length === 0) {
        return [];
      }

      const deployment = deployments[0];
      const errors: VercelBuildError[] = [];

      if (deployment.state === 'ERROR' || deployment.readyState === 'ERROR') {
        const eventsRes = await deploymentsGetDeploymentEvents(this.vercel, {
          idOrUrl: deployment.uid,
          teamId: this.config.teamId,
          slug: this.config.slug,
          limit: 50
        });

        if (eventsRes.ok) {
          const events = Array.isArray(eventsRes.value) ? eventsRes.value : [];
          const errorEvents = events.filter((event: any) => 
            event.type === 'fatal' || 
            event.type === 'error' ||
            (event.type === 'stdout' && this.isErrorMessage(event.payload?.text))
          );

          for (const event of errorEvents) {
            const buildError = this.parseEventToError(event, deployment);
            if (buildError) {
              errors.push(buildError);
            }
          }
        }
      }

      return errors;

    } catch (error) {
      console.error('❌ [错误监控] 检查最新部署失败:', error);
      throw error;
    }
  }

  /**
   * 获取监控状态
   */
  getStatus(): { isMonitoring: boolean; lastChecked: Date; callbackCount: number } {
    return {
      isMonitoring: this.isMonitoring,
      lastChecked: new Date(this.lastCheckedTimestamp),
      callbackCount: this.errorCallbacks.length
    };
  }
}