/**
 * Vercel 错误监控 Hook
 * 管理错误监控状态和实时错误数据
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { VercelErrorMonitor, VercelBuildError, ErrorMonitorConfig } from '@/lib/services/vercel-error-monitor';
import { VercelDeploymentStatus } from '@/components/ui/vercel-status-indicator';

interface UseVercelErrorMonitorOptions {
  config?: Partial<ErrorMonitorConfig>;
  autoStart?: boolean;
  onError?: (error: VercelBuildError) => void;
}

interface UseVercelErrorMonitorReturn {
  // 状态
  isMonitoring: boolean;
  errors: VercelBuildError[];
  isChecking: boolean;
  deploymentStatus: VercelDeploymentStatus | null;
  lastChecked: Date | null;
  
  // 方法
  startMonitoring: () => void;
  stopMonitoring: () => void;
  checkLatestDeployment: () => Promise<void>;
  clearErrors: () => void;
  
  // 错误处理
  addErrorCallback: (callback: (error: VercelBuildError) => void) => void;
  removeErrorCallback: (callback: (error: VercelBuildError) => void) => void;
}

export function useVercelErrorMonitor(options: UseVercelErrorMonitorOptions = {}): UseVercelErrorMonitorReturn {
  const { config = {}, autoStart = false, onError } = options;
  
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [errors, setErrors] = useState<VercelBuildError[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [deploymentStatus, setDeploymentStatus] = useState<VercelDeploymentStatus | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  
  const monitorRef = useRef<VercelErrorMonitor | null>(null);
  const errorCallbacksRef = useRef<Set<(error: VercelBuildError) => void>>(new Set());

  // 初始化监控器
  useEffect(() => {
    // 检查必要的配置
    if (!config.bearerToken && typeof window !== 'undefined') {
      // 尝试从环境变量获取
      const token = process.env.NEXT_PUBLIC_VERCEL_TOKEN || 
                   process.env.VERCEL_TOKEN;
      if (token) {
        config.bearerToken = token;
      }
    }

    if (!config.bearerToken) {
      // console.warn('⚠️ [错误监控] 缺少 Vercel Bearer Token，无法启动监控');
      return;
    }

    try {
      const monitor = new VercelErrorMonitor({
        bearerToken: config.bearerToken,
        projectId: config.projectId,
        teamId: config.teamId,
        slug: config.slug,
        pollInterval: config.pollInterval || 30000
      });

      // 设置错误回调
      monitor.onError((error: VercelBuildError) => {
        setErrors(prev => {
          // 避免重复错误
          const exists = prev.some(e => e.id === error.id);
          if (exists) return prev;
          
          // 限制错误数量，保留最新的50个
          const newErrors = [error, ...prev].slice(0, 50);
          return newErrors;
        });

        // 更新部署状态
        setDeploymentStatus(prev => ({
          status: 'error' as const,
          url: error.deploymentUrl,
          deploymentId: error.deploymentId,
          updatedAt: error.timestamp,
          errorCount: (prev?.errorCount || 0) + 1
        }));

        // 调用用户提供的错误回调
        if (onError) {
          onError(error);
        }

        // 调用添加的回调
        errorCallbacksRef.current.forEach(callback => {
          try {
            callback(error);
          } catch (callbackError) {
            console.error('❌ [错误监控] 用户回调执行失败:', callbackError);
          }
        });
      });

      monitorRef.current = monitor;

      // 自动启动
      if (autoStart) {
        monitor.startMonitoring();
        setIsMonitoring(true);
      }

    } catch (error) {
      console.error('❌ [错误监控] 初始化失败:', error);
    }

    return () => {
      if (monitorRef.current) {
        monitorRef.current.stopMonitoring();
        monitorRef.current = null;
      }
    };
  }, [config.bearerToken, config.projectId, config.teamId, config.slug, config.pollInterval, autoStart, onError]);

  // 开始监控
  const startMonitoring = useCallback(() => {
    if (!monitorRef.current) {
      // console.warn('⚠️ [错误监控] 监控器未初始化');
      return;
    }

    try {
      monitorRef.current.startMonitoring();
      setIsMonitoring(true);
      console.log('✅ [错误监控] 开始监控');
    } catch (error) {
      console.error('❌ [错误监控] 启动失败:', error);
    }
  }, []);

  // 停止监控
  const stopMonitoring = useCallback(() => {
    if (!monitorRef.current) return;

    try {
      monitorRef.current.stopMonitoring();
      setIsMonitoring(false);
      console.log('🛑 [错误监控] 停止监控');
    } catch (error) {
      console.error('❌ [错误监控] 停止失败:', error);
    }
  }, []);

  // 检查最新部署
  const checkLatestDeployment = useCallback(async () => {
    if (!monitorRef.current) {
      // console.warn('⚠️ [错误监控] 监控器未初始化');
      return;
    }

    setIsChecking(true);
    try {
      console.log('🔍 [错误监控] 手动检查最新部署...');
      const latestErrors = await monitorRef.current.checkLatestDeployment();
      
      if (latestErrors.length > 0) {
        setErrors(prev => {
          const newErrors = [...latestErrors];
          // 合并并去重
          prev.forEach(existingError => {
            if (!newErrors.some(e => e.id === existingError.id)) {
              newErrors.push(existingError);
            }
          });
          return newErrors.slice(0, 50);
        });

        setDeploymentStatus({
          status: 'error',
          url: latestErrors[0]?.deploymentUrl,
          deploymentId: latestErrors[0]?.deploymentId,
          updatedAt: latestErrors[0]?.timestamp || new Date(),
          errorCount: latestErrors.length
        });
      } else {
        // 没有错误，假设部署成功
        setDeploymentStatus(prev => ({
          status: 'ready',
          url: prev?.url,
          deploymentId: prev?.deploymentId,
          updatedAt: new Date(),
          errorCount: 0
        }));
      }

      setLastChecked(new Date());
      console.log(`✅ [错误监控] 检查完成，发现 ${latestErrors.length} 个错误`);
      
    } catch (error) {
      console.error('❌ [错误监控] 检查最新部署失败:', error);
      setDeploymentStatus(prev => ({
        status: 'error',
        url: prev?.url,
        deploymentId: prev?.deploymentId,
        updatedAt: new Date(),
        errorCount: prev?.errorCount || 0
      }));
    } finally {
      setIsChecking(false);
    }
  }, []);

  // 清空错误
  const clearErrors = useCallback(() => {
    setErrors([]);
    setDeploymentStatus(prev => ({
      ...prev,
      errorCount: 0
    } as VercelDeploymentStatus));
  }, []);

  // 添加错误回调
  const addErrorCallback = useCallback((callback: (error: VercelBuildError) => void) => {
    errorCallbacksRef.current.add(callback);
  }, []);

  // 移除错误回调
  const removeErrorCallback = useCallback((callback: (error: VercelBuildError) => void) => {
    errorCallbacksRef.current.delete(callback);
  }, []);

  return {
    // 状态
    isMonitoring,
    errors,
    isChecking,
    deploymentStatus,
    lastChecked,
    
    // 方法
    startMonitoring,
    stopMonitoring,
    checkLatestDeployment,
    clearErrors,
    
    // 错误处理
    addErrorCallback,
    removeErrorCallback
  };
}