/**
 * Vercel 部署 Hook
 * 提供客户端安全的部署接口
 */

import { useState, useCallback } from 'react';
import { CodeFile } from '@/lib/agents/coding/types';

export interface DeploymentResult {
  id: string;
  url: string;
  state: string;
  createdAt: number;
  readyAt?: number;
}

export interface DeploymentError {
  error: string;
  details?: string;
}

export interface VercelErrorInfo {
  message: string;
  deploymentId?: string;
  deploymentState?: string;
  errorDetails?: string;
  deploymentUrl?: string;
  timestamp?: string;
}

export interface UseVercelDeploymentOptions {
  onStatusChange?: (status: string) => void;
  onLog?: (log: string) => void;
  onDeploymentReady?: (deployment: DeploymentResult) => void;
  onVercelError?: (errorInfo: VercelErrorInfo) => void;
}

export function useVercelDeployment(options?: UseVercelDeploymentOptions) {
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentResult, setDeploymentResult] = useState<DeploymentResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const deployProject = useCallback(async (params: {
    projectName: string;
    files: CodeFile[];
    target?: 'production' | 'staging' | string;
    gitMetadata?: any;
    projectSettings?: any;
    meta?: any;
  }) => {
    try {
      setIsDeploying(true);
      setError(null);
      setDeploymentResult(null);

      // 触发状态更新
      options?.onStatusChange?.('initializing');
      options?.onLog?.('🚀 开始部署流程...');
      options?.onLog?.(`📊 部署参数: ${params.projectName}, ${params.files.length} 个文件`);

      // 调用部署 API
      const response = await fetch('/api/vercel-deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      options?.onLog?.(`📡 收到 API 响应: ${response.status}`);

      const data = await response.json();
      options?.onLog?.(`📋 响应数据: ${JSON.stringify(data, null, 2)}`);

      if (!response.ok) {
        // 🚨 处理详细的Vercel部署错误信息
        if (response.status === 422 && data.errorInfo) {
          const errorInfo = data.errorInfo;
          const detailedError = new Error(data.details || data.error || 'Vercel deployment failed');
          (detailedError as any).isVercelError = true;
          (detailedError as any).errorInfo = errorInfo;
          (detailedError as any).shouldShowDialog = true; // 标记需要弹窗显示
          throw detailedError;
        }
        
        throw new Error(data.details || data.error || `HTTP ${response.status}`);
      }

      if (!data.success) {
        // 🚨 处理成功=false但响应码200的情况
        if (data.errorInfo) {
          const errorInfo = data.errorInfo;
          const detailedError = new Error(data.details || data.error || 'Deployment failed');
          (detailedError as any).isVercelError = true;
          (detailedError as any).errorInfo = errorInfo;
          (detailedError as any).shouldShowDialog = true;
          throw detailedError;
        }
        
        throw new Error(data.error || 'Deployment failed');
      }

      // 成功
      const deployment = data.deployment as DeploymentResult;
      setDeploymentResult(deployment);
      
      options?.onStatusChange?.('ready');
      options?.onLog?.(`✅ 部署成功: ${deployment.url}`);
      options?.onLog?.(`🔗 部署ID: ${deployment.id}`);
      options?.onDeploymentReady?.(deployment);

      return deployment;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      
      options?.onStatusChange?.('error');
      options?.onLog?.(`❌ 部署失败: ${errorMessage}`);
      
      // 🚨 如果是需要弹窗显示的Vercel错误，调用专门的错误处理
      if ((err as any)?.shouldShowDialog && (err as any)?.isVercelError) {
        const errorInfo = (err as any).errorInfo;
        
        // 显示详细错误弹窗的回调
        if (options?.onVercelError) {
          options.onVercelError({
            message: errorMessage,
            deploymentId: errorInfo?.deploymentId,
            deploymentState: errorInfo?.deploymentState,
            errorDetails: errorInfo?.errorDetails,
            deploymentUrl: errorInfo?.deploymentUrl,
            timestamp: errorInfo?.timestamp
          });
        }
      }
      
      throw err;
    } finally {
      setIsDeploying(false);
    }
  }, [options]);

  const getDeploymentStatus = useCallback(async (deploymentId: string) => {
    try {
      const response = await fetch(`/api/vercel-deploy?id=${deploymentId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || `HTTP ${response.status}`);
      }

      return data;
    } catch (err) {
      console.error('获取部署状态失败:', err);
      throw err;
    }
  }, []);

  const reset = useCallback(() => {
    setIsDeploying(false);
    setDeploymentResult(null);
    setError(null);
  }, []);

  return {
    // 状态
    isDeploying,
    deploymentResult,
    error,
    
    // 方法
    deployProject,
    getDeploymentStatus,
    reset,
    
    // 便捷访问
    deploymentUrl: deploymentResult?.url,
    deploymentId: deploymentResult?.id,
    isReady: deploymentResult?.state === 'READY',
  };
}