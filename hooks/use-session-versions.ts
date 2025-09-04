'use client';

import { useState, useEffect, useCallback } from 'react';

interface VersionInfo {
  version: string;
  commitId: string;
  timestamp: number;
  filesCount: number;
  filesTypes: string[];
  commitMessage: string;
  isDeployed: boolean;
  deploymentUrl?: string;
}

interface SessionProjectFile {
  filename: string;
  content: string;
  language: string;
  file_type?: string;
  change_type?: 'added' | 'modified' | 'deleted';
}

interface UseSessionVersionsReturn {
  versions: VersionInfo[];
  currentVersion: string;
  selectedVersionFiles: SessionProjectFile[];
  isLoading: boolean;
  error: string | null;
  
  // 操作函数
  selectVersion: (version: string) => Promise<void>;
  refreshVersions: () => Promise<void>;
  previewVersion: (version: string) => Promise<SessionProjectFile[]>;
}

export function useSessionVersions(
  sessionId: string | null,
  userId: string | null
): UseSessionVersionsReturn {
  const [versions, setVersions] = useState<VersionInfo[]>([]);
  const [currentVersion, setCurrentVersion] = useState<string>('');
  const [selectedVersionFiles, setSelectedVersionFiles] = useState<SessionProjectFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取版本列表
  const fetchVersions = useCallback(async () => {
    console.log('🔍 [版本获取] 开始获取版本...', { sessionId, userId });
    
    if (!sessionId || !userId) {
      console.warn('⚠️ [版本获取] 缺少必要参数:', { sessionId, userId });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const apiUrl = `/api/session-project?sessionId=${sessionId}&userId=${userId}&action=versions`;
      console.log('🌐 [版本获取] API请求:', apiUrl);
      
      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('📊 [版本获取] API响应:', result);
      
      if (result.success) {
        console.log('✅ [版本获取] 成功获取版本:', {
          versionsCount: result.data.versions?.length || 0,
          currentVersion: result.data.currentVersion,
          versions: result.data.versions
        });
        
        setVersions(result.data.versions);
        setCurrentVersion(result.data.currentVersion);
        
        // 自动加载当前版本的文件
        if (result.data.currentVersion) {
          await loadVersionFiles(result.data.currentVersion);
        }
      } else {
        throw new Error(result.error || 'Failed to fetch versions');
      }

    } catch (error) {
      console.error('❌ [版本获取] 失败:', error);
      setError(error instanceof Error ? error.message : '获取版本失败');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, userId]);

  // 加载特定版本的文件
  const loadVersionFiles = useCallback(async (version: string): Promise<SessionProjectFile[]> => {
    if (!sessionId || !userId) return [];

    try {
      const response = await fetch(
        `/api/session-project?sessionId=${sessionId}&userId=${userId}&action=version-files&version=${version}`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to load version files');
      }

    } catch (error) {
      console.error('❌ [版本文件加载] 失败:', error);
      setError(error instanceof Error ? error.message : '加载版本文件失败');
      return [];
    }
  }, [sessionId, userId]);

  // 选择版本（切换当前工作版本）
  const selectVersion = useCallback(async (version: string) => {
    console.log(`🔄 [版本切换] 切换到版本: ${version}`);
    
    const files = await loadVersionFiles(version);
    setSelectedVersionFiles(files);
    setCurrentVersion(version);
    
    // 触发自定义事件，通知其他组件版本已切换
    window.dispatchEvent(new CustomEvent('versionChanged', {
      detail: { version, files }
    }));
  }, [loadVersionFiles]);

  // 预览版本（不切换当前版本，只是查看）
  const previewVersion = useCallback(async (version: string): Promise<SessionProjectFile[]> => {
    console.log(`👁️ [版本预览] 预览版本: ${version}`);
    
    const files = await loadVersionFiles(version);
    
    // 触发自定义事件，通知预览组件
    window.dispatchEvent(new CustomEvent('versionPreviewed', {
      detail: { version, files }
    }));
    
    return files;
  }, [loadVersionFiles]);

  // 刷新版本列表
  const refreshVersions = useCallback(async () => {
    await fetchVersions();
  }, [fetchVersions]);

  // 初始化加载
  useEffect(() => {
    if (sessionId && userId) {
      fetchVersions();
    }
  }, [fetchVersions, sessionId, userId]);

  // 监听新版本创建事件
  useEffect(() => {
    const handleNewVersion = () => {
      console.log('🆕 [版本监听] 检测到新版本，刷新版本列表');
      refreshVersions();
    };

    window.addEventListener('newVersionCreated', handleNewVersion);
    
    return () => {
      window.removeEventListener('newVersionCreated', handleNewVersion);
    };
  }, [refreshVersions]);

  return {
    versions,
    currentVersion,
    selectedVersionFiles,
    isLoading,
    error,
    
    selectVersion,
    refreshVersions,
    previewVersion
  };
}
