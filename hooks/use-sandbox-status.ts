/**
 * useSandboxStatus Hook
 * 专门用于E2B沙盒状态监控和健康检查
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { SandboxInfo } from './use-e2b-sandbox';

export interface SandboxHealth {
  isHealthy: boolean;
  uptimeMinutes: number;
  inactiveMinutes: number;
  lastCheck: Date;
  errors: string[];
  warnings: string[];
}

export interface SandboxMetrics {
  responseTime: number;
  memoryUsage?: number;
  cpuUsage?: number;
  requestCount: number;
}

export interface UseSandboxStatusReturn {
  // 状态数据
  sandbox: SandboxInfo | null;
  health: SandboxHealth | null;
  metrics: SandboxMetrics | null;
  isMonitoring: boolean;
  
  // 控制方法
  startMonitoring: (interval?: number) => void;
  stopMonitoring: () => void;
  checkHealth: () => Promise<SandboxHealth | null>;
  
  // 实用方法
  getStatusColor: () => 'green' | 'yellow' | 'red' | 'gray';
  getStatusText: () => string;
  formatUptime: (minutes: number) => string;
}

export const useSandboxStatus = (): UseSandboxStatusReturn => {
  const [sandbox, setSandbox] = useState<SandboxInfo | null>(null);
  const [health, setHealth] = useState<SandboxHealth | null>(null);
  const [metrics, setMetrics] = useState<SandboxMetrics | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 清理资源
  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // 组件卸载时清理
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // API调用封装
  const apiCall = useCallback(async (url: string, options: RequestInit = {}): Promise<any> => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    try {
      const startTime = Date.now();
      const response = await fetch(url, {
        ...options,
        signal: abortControllerRef.current.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      const responseTime = Date.now() - startTime;
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // 更新指标
      setMetrics(prev => ({
        ...prev,
        responseTime,
        requestCount: (prev?.requestCount || 0) + 1,
      }));

      return data;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return null;
      }
      throw err;
    }
  }, []);

  // 健康检查
  const checkHealth = useCallback(async (): Promise<SandboxHealth | null> => {
    try {
      const result = await apiCall('/api/e2b-sandbox/status');
      
      if (!result) return null;

      let healthData: SandboxHealth;

      if (result.success && result.data && result.data.isActive) {
        const sandboxInfo = result.data.sandboxInfo;
        const metrics = result.data.metrics;
        
        // 更新沙盒信息
        setSandbox({
          id: sandboxInfo.id,
          url: result.data.previewUrl || sandboxInfo.url,
          status: result.data.healthStatus === 'healthy' ? 'ready' : 'error',
          createdAt: new Date(sandboxInfo.createdAt),
          lastActivity: new Date(sandboxInfo.lastActivity),
          port: sandboxInfo.port,
        });

        healthData = {
          isHealthy: result.data.healthStatus === 'healthy',
          uptimeMinutes: metrics?.uptimeMinutes || 0,
          inactiveMinutes: metrics?.inactiveMinutes || 0,
          lastCheck: new Date(),
          errors: [],
          warnings: metrics?.inactiveMinutes > 30 ? ['长时间未活动'] : [],
        };
      } else {
        // 沙盒不可用
        setSandbox(null);
        healthData = {
          isHealthy: false,
          uptimeMinutes: 0,
          inactiveMinutes: 0,
          lastCheck: new Date(),
          errors: [result.message || '沙盒不可用'],
          warnings: [],
        };
      }

      setHealth(healthData);
      return healthData;
      
    } catch (err: any) {
      console.error('❌ [useSandboxStatus] 健康检查失败:', err);
      
      const errorHealth: SandboxHealth = {
        isHealthy: false,
        uptimeMinutes: 0,
        inactiveMinutes: 0,
        lastCheck: new Date(),
        errors: [err.message || '健康检查失败'],
        warnings: [],
      };
      
      setHealth(errorHealth);
      setSandbox(null);
      return errorHealth;
    }
  }, [apiCall]);

  // 开始监控
  const startMonitoring = useCallback((interval: number = 30000) => {
    if (isMonitoring) return;

    console.log('📊 [useSandboxStatus] 开始状态监控，间隔:', interval, 'ms');
    
    setIsMonitoring(true);
    
    // 立即执行一次检查
    checkHealth();
    
    // 设置定时器
    intervalRef.current = setInterval(() => {
      checkHealth();
    }, interval);
  }, [isMonitoring, checkHealth]);

  // 停止监控
  const stopMonitoring = useCallback(() => {
    if (!isMonitoring) return;

    console.log('⏹️ [useSandboxStatus] 停止状态监控');
    
    cleanup();
    setIsMonitoring(false);
  }, [isMonitoring, cleanup]);

  // 获取状态颜色
  const getStatusColor = useCallback((): 'green' | 'yellow' | 'red' | 'gray' => {
    if (!health) return 'gray';
    
    if (!health.isHealthy) return 'red';
    
    if (health.warnings.length > 0) return 'yellow';
    
    return 'green';
  }, [health]);

  // 获取状态文本
  const getStatusText = useCallback((): string => {
    if (!sandbox) return '未连接';
    
    if (!health) return '检查中...';
    
    if (!health.isHealthy) {
      return health.errors[0] || '不健康';
    }
    
    if (health.warnings.length > 0) {
      return health.warnings[0];
    }
    
    return '运行正常';
  }, [sandbox, health]);

  // 格式化运行时间
  const formatUptime = useCallback((minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} 分钟`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours < 24) {
      return `${hours} 小时 ${remainingMinutes} 分钟`;
    }
    
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    
    return `${days} 天 ${remainingHours} 小时`;
  }, []);

  return {
    // 状态数据
    sandbox,
    health,
    metrics,
    isMonitoring,
    
    // 控制方法
    startMonitoring,
    stopMonitoring,
    checkHealth,
    
    // 实用方法
    getStatusColor,
    getStatusText,
    formatUptime,
  };
};
