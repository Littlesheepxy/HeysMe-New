/**
 * useE2BSandbox Hook
 * E2B沙盒管理的主要Hook
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

export interface SandboxInfo {
  id: string;
  url: string;
  status: 'creating' | 'ready' | 'error' | 'destroyed';
  createdAt: Date;
  lastActivity: Date;
  port: number;
}

export interface SandboxOperationResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export interface DeployCodeOptions {
  files: Record<string, string>;
  packages?: string[];
  autoInstallDeps?: boolean;
}

export interface UseE2BSandboxReturn {
  // 状态
  sandbox: SandboxInfo | null;
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;

  // 操作方法
  createSandbox: () => Promise<SandboxInfo | null>;
  destroySandbox: () => Promise<boolean>;
  deployCode: (options: DeployCodeOptions) => Promise<boolean>;
  restartServer: (options?: { force?: boolean; clearCache?: boolean }) => Promise<boolean>;
  installPackages: (packages: string[], options?: { isDev?: boolean; force?: boolean }) => Promise<boolean>;
  runCommand: (command: string, options?: { cwd?: string; timeout?: number }) => Promise<any>;

  // 实用方法
  refreshStatus: () => Promise<void>;
  clearError: () => void;
  getPreviewUrl: () => string | null;
}

export const useE2BSandbox = (): UseE2BSandboxReturn => {
  const [sandbox, setSandbox] = useState<SandboxInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  // 清理函数
  const cleanup = useCallback(() => {
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
    cleanup(); // 取消之前的请求
    
    abortControllerRef.current = new AbortController();
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: abortControllerRef.current.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return null; // 请求被取消
      }
      throw err;
    }
  }, [cleanup]);

  // 创建沙盒
  const createSandbox = useCallback(async (): Promise<SandboxInfo | null> => {
    if (isLoading) return null;

    setIsLoading(true);
    setError(null);

    try {
      console.log('🚀 [useE2BSandbox] 开始创建沙盒...');
      
      const result = await apiCall('/api/e2b-sandbox/create', {
        method: 'POST',
      });

      if (!result) return null;

      if (result.success) {
        const newSandbox: SandboxInfo = {
          id: result.sandboxId,
          url: result.url,
          status: 'ready',
          createdAt: new Date(),
          lastActivity: new Date(),
          port: 3000,
        };

        setSandbox(newSandbox);
        setIsConnected(true);
        
        console.log('✅ [useE2BSandbox] 沙盒创建成功:', newSandbox);
        return newSandbox;
      } else {
        throw new Error(result.message || '沙盒创建失败');
      }
    } catch (err: any) {
      console.error('❌ [useE2BSandbox] 沙盒创建失败:', err);
      setError(err.message || '沙盒创建失败');
      setIsConnected(false);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, apiCall]);

  // 销毁沙盒
  const destroySandbox = useCallback(async (): Promise<boolean> => {
    if (!sandbox || isLoading) return false;

    setIsLoading(true);
    setError(null);

    try {
      console.log('🗑️ [useE2BSandbox] 开始销毁沙盒:', sandbox.id);
      
      const result = await apiCall('/api/e2b-sandbox/kill', {
        method: 'DELETE',
      });

      if (!result) return false;

      if (result.success) {
        setSandbox(null);
        setIsConnected(false);
        
        console.log('✅ [useE2BSandbox] 沙盒销毁成功');
        return true;
      } else {
        throw new Error(result.message || '沙盒销毁失败');
      }
    } catch (err: any) {
      console.error('❌ [useE2BSandbox] 沙盒销毁失败:', err);
      setError(err.message || '沙盒销毁失败');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [sandbox, isLoading, apiCall]);

  // 部署代码
  const deployCode = useCallback(async (options: DeployCodeOptions): Promise<boolean> => {
    if (!sandbox || isLoading) return false;

    setIsLoading(true);
    setError(null);

    try {
      console.log('📦 [useE2BSandbox] 开始部署代码，文件数量:', Object.keys(options.files).length);
      
      const result = await apiCall('/api/e2b-sandbox/deploy', {
        method: 'POST',
        body: JSON.stringify({
          files: options.files,
          packages: options.packages || [],
          autoInstallDeps: options.autoInstallDeps !== false,
        }),
      });

      if (!result) return false;

      if (result.success) {
        // 更新沙盒活动时间
        setSandbox(prev => prev ? { ...prev, lastActivity: new Date() } : null);
        
        console.log('✅ [useE2BSandbox] 代码部署成功');
        return true;
      } else {
        throw new Error(result.message || '代码部署失败');
      }
    } catch (err: any) {
      console.error('❌ [useE2BSandbox] 代码部署失败:', err);
      setError(err.message || '代码部署失败');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [sandbox, isLoading, apiCall]);

  // 重启服务器
  const restartServer = useCallback(async (options: { force?: boolean; clearCache?: boolean } = {}): Promise<boolean> => {
    if (!sandbox || isLoading) return false;

    setIsLoading(true);
    setError(null);

    try {
      console.log('🔄 [useE2BSandbox] 重启Next.js服务器...');
      
      const result = await apiCall('/api/e2b-sandbox/restart-nextjs', {
        method: 'POST',
        body: JSON.stringify({
          force: options.force || false,
          clearCache: options.clearCache || false,
          port: sandbox.port,
        }),
      });

      if (!result) return false;

      if (result.success) {
        setSandbox(prev => prev ? { ...prev, lastActivity: new Date() } : null);
        
        console.log('✅ [useE2BSandbox] 服务器重启成功');
        return true;
      } else {
        throw new Error(result.message || '服务器重启失败');
      }
    } catch (err: any) {
      console.error('❌ [useE2BSandbox] 服务器重启失败:', err);
      setError(err.message || '服务器重启失败');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [sandbox, isLoading, apiCall]);

  // 安装包
  const installPackages = useCallback(async (
    packages: string[], 
    options: { isDev?: boolean; force?: boolean } = {}
  ): Promise<boolean> => {
    if (!sandbox || isLoading || packages.length === 0) return false;

    setIsLoading(true);
    setError(null);

    try {
      console.log('📦 [useE2BSandbox] 安装包:', packages);
      
      const result = await apiCall('/api/e2b-sandbox/install-packages', {
        method: 'POST',
        body: JSON.stringify({
          packages,
          isDev: options.isDev || false,
          force: options.force || false,
        }),
      });

      if (!result) return false;

      if (result.success) {
        setSandbox(prev => prev ? { ...prev, lastActivity: new Date() } : null);
        
        console.log('✅ [useE2BSandbox] 包安装成功');
        return true;
      } else {
        throw new Error(result.message || '包安装失败');
      }
    } catch (err: any) {
      console.error('❌ [useE2BSandbox] 包安装失败:', err);
      setError(err.message || '包安装失败');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [sandbox, isLoading, apiCall]);

  // 运行命令
  const runCommand = useCallback(async (
    command: string, 
    options: { cwd?: string; timeout?: number } = {}
  ): Promise<any> => {
    if (!sandbox || isLoading) return null;

    setIsLoading(true);
    setError(null);

    try {
      console.log('⚡ [useE2BSandbox] 运行命令:', command);
      
      const result = await apiCall('/api/e2b-sandbox/run-command', {
        method: 'POST',
        body: JSON.stringify({
          command,
          cwd: options.cwd || '/home/user',
          timeout: options.timeout || 30000,
        }),
      });

      if (!result) return null;

      if (result.success) {
        setSandbox(prev => prev ? { ...prev, lastActivity: new Date() } : null);
        
        console.log('✅ [useE2BSandbox] 命令执行完成');
        return result.result;
      } else {
        throw new Error(result.message || '命令执行失败');
      }
    } catch (err: any) {
      console.error('❌ [useE2BSandbox] 命令执行失败:', err);
      setError(err.message || '命令执行失败');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [sandbox, isLoading, apiCall]);

  // 刷新状态
  const refreshStatus = useCallback(async (): Promise<void> => {
    if (!sandbox) return;

    try {
      const result = await apiCall('/api/e2b-sandbox/status');
      
      if (result && result.success) {
        if (result.data && result.data.isActive) {
          setSandbox(prev => prev ? {
            ...prev,
            status: 'ready',
            lastActivity: new Date(result.data.sandboxInfo.lastActivity)
          } : null);
          setIsConnected(true);
        } else {
          setSandbox(null);
          setIsConnected(false);
        }
      }
    } catch (err: any) {
      console.error('❌ [useE2BSandbox] 状态刷新失败:', err);
      setIsConnected(false);
    }
  }, [sandbox, apiCall]);

  // 清除错误
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 获取预览URL
  const getPreviewUrl = useCallback((): string | null => {
    return sandbox?.url || null;
  }, [sandbox]);

  return {
    // 状态
    sandbox,
    isLoading,
    error,
    isConnected,

    // 操作方法
    createSandbox,
    destroySandbox,
    deployCode,
    restartServer,
    installPackages,
    runCommand,

    // 实用方法
    refreshStatus,
    clearError,
    getPreviewUrl,
  };
};
