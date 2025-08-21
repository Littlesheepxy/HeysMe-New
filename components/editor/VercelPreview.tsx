'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  RefreshCw, 
  ExternalLink, 
  Download,
  Monitor,
  Smartphone,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Check,
  Sparkles,
  Terminal,
  Code,
  History,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useVercelDeployment, type DeploymentResult, type VercelErrorInfo } from '@/hooks/use-vercel-deployment';
import { type CodeFile } from '@/lib/agents/coding/types';
import { StagewiseToolbar } from './StagewiseToolbar';
import { useTheme } from '@/contexts/theme-context';
import { VercelErrorDialog } from '@/components/dialogs/vercel-error-dialog';
import { VersionSelector } from './VersionSelector';
import { ProjectVersionManager, type ProjectVersion } from '@/lib/services/project-version-manager';

type DeviceType = 'desktop' | 'mobile';
type EditMode = 'none' | 'text' | 'ai';

interface VercelPreviewProps {
  files: CodeFile[];
  projectName: string;
  description?: string;
  isLoading: boolean;
  previewUrl: string | null;
  onPreviewReady: (url: string) => void;
  onLoadingChange: (loading: boolean) => void;
  isEditMode?: boolean;
  onContentChange?: (field: string, value: string) => void;
  deviceType?: DeviceType;
  onDeviceChange?: (device: DeviceType) => void;
  showToolbar?: boolean;
  onRefresh?: () => void;
  isGeneratingCode?: boolean; // 新增：是否正在生成代码
  generationProgress?: number; // 新增：生成进度 0-100
  generationStatus?: string; // 新增：生成状态文本
  sessionId?: string; // 新增：会话ID，用于版本管理
}

export default function VercelPreview({
  files,
  projectName,
  description = '',
  isLoading,
  previewUrl,
  onPreviewReady,
  onLoadingChange,
  isEditMode = false,
  onContentChange,
  deviceType = 'desktop',
  onDeviceChange,
  showToolbar = true,
  onRefresh,
  isGeneratingCode = false,
  generationProgress = 0,
  generationStatus = '正在生成代码...',
  sessionId
}: VercelPreviewProps) {
  const { theme } = useTheme();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // 状态管理
  const [localDeviceType, setLocalDeviceType] = useState<DeviceType>(deviceType);
  const [editMode, setEditMode] = useState<EditMode>('none');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deploymentStatus, setDeploymentStatus] = useState<string>('ready');
  const [deployLogs, setDeployLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [vercelErrorInfo, setVercelErrorInfo] = useState<VercelErrorInfo | null>(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);

  // 🆕 版本管理状态
  const [versions, setVersions] = useState<ProjectVersion[]>([]);
  const [currentVersion, setCurrentVersion] = useState<string>('v1');
  const [deployingVersion, setDeployingVersion] = useState<string | null>(null);
  const [versionManager] = useState(() => ProjectVersionManager.getInstance());

  // 使用新的 Vercel 部署 Hook
  const {
    isDeploying,
    deploymentResult,
    error: deploymentError,
    deployProject,
    reset: resetDeployment,
    deploymentUrl,
    isReady
  } = useVercelDeployment({
    onStatusChange: (status) => {
      setDeploymentStatus(status);
      onLoadingChange(status !== 'ready' && status !== 'error');
      
      // 🆕 部署完成后清除部署版本状态
      if (status === 'ready' || status === 'error') {
        setDeployingVersion(null);
      }
    },
    onLog: (log) => {
      setDeployLogs(prev => [...prev, log]);
    },
    onDeploymentReady: (deployment) => {
      onPreviewReady(deployment.url);
    },
    onVercelError: (errorInfo) => {
      setVercelErrorInfo(errorInfo);
      setShowErrorDialog(true);
    }
  });

  // 设备类型变化处理
  const handleDeviceChange = useCallback((device: DeviceType) => {
    setLocalDeviceType(device);
    onDeviceChange?.(device);
  }, [onDeviceChange]);

  // 🆕 版本管理 useEffect - 初始化和文件变化检测
  useEffect(() => {
    if (!sessionId) return;

    // 获取现有版本历史
    const history = versionManager.getVersionHistory(sessionId);
    if (history) {
      setVersions(history.versions);
      setCurrentVersion(history.currentVersion);
    } else if (files.length > 0) {
      // 如果没有版本历史但有文件，创建初始版本
      const initialVersion = versionManager.createVersion(
        sessionId,
        files,
        '项目初始版本',
        'Initial project setup'
      );
      setVersions([initialVersion]);
      setCurrentVersion(initialVersion.version);
    }
  }, [sessionId, versionManager]);

  // 🆕 检测文件变化，自动创建新版本
  useEffect(() => {
    if (!sessionId || !files.length) return;

    const currentVersionData = versionManager.getCurrentVersion(sessionId);
    if (!currentVersionData) return;

    // 检查文件是否有变化
    const hasChanges = files.length !== currentVersionData.files.length ||
      files.some((file, index) => {
        const oldFile = currentVersionData.files[index];
        return !oldFile || file.content !== oldFile.content || file.filename !== oldFile.filename;
      });

    if (hasChanges) {
      // 创建新版本
      const newVersion = versionManager.createVersion(
        sessionId,
        files,
        '代码更新',
        'Updated project files'
      );
      
      // 更新状态
      const updatedHistory = versionManager.getVersionHistory(sessionId);
      if (updatedHistory) {
        setVersions(updatedHistory.versions);
        setCurrentVersion(updatedHistory.currentVersion);
      }
    }
  }, [files, sessionId, versionManager]);

  // 🆕 版本选择处理
  const handleVersionSelect = useCallback((versionId: string) => {
    if (!sessionId) return;

    const selectedVersion = versionManager.switchToVersion(sessionId, versionId);
    if (selectedVersion) {
      setCurrentVersion(versionId);
      // 这里可以触发文件更新，但需要父组件支持
      console.log(`🔄 [版本切换] 切换到版本: ${versionId}`);
    }
  }, [sessionId, versionManager]);

  // 🆕 版本部署处理
  const handleVersionDeploy = useCallback(async (versionId: string) => {
    if (!sessionId || isDeploying) return;

    const versionData = versionManager.getVersion(sessionId, versionId);
    if (!versionData) return;

    setDeployingVersion(versionId);
    setDeployLogs([]); // 清空日志
    setShowLogs(true); // 显示日志面板

    try {
      await deployProject({
        projectName: projectName.toLowerCase().replace(/\s+/g, '-'),
        files: versionData.files,
        gitMetadata: {
          commitAuthorName: 'HeysMe User',
          commitMessage: `Deploy ${versionId}: ${versionData.name}`,
          commitRef: 'main',
          dirty: false,
        },
        projectSettings: {
          buildCommand: 'npm run build',
          installCommand: 'npm install',
        },
        meta: {
          source: 'heysme-preview',
          description: `${versionData.name} - ${versionData.description}`,
          timestamp: new Date().toISOString(),
          version: versionId,
        }
      });
    } catch (error) {
      console.error(`部署版本 ${versionId} 失败:`, error);
      setDeployingVersion(null);
    }
  }, [sessionId, versionManager, projectName, deployProject, isDeploying]);

  // 🆕 版本删除处理
  const handleVersionDelete = useCallback((versionId: string) => {
    if (!sessionId) return;

    const success = versionManager.deleteVersion(sessionId, versionId);
    if (success) {
      const updatedHistory = versionManager.getVersionHistory(sessionId);
      if (updatedHistory) {
        setVersions(updatedHistory.versions);
        setCurrentVersion(updatedHistory.currentVersion);
      }
    }
  }, [sessionId, versionManager]);

  // 部署到 Vercel 预览
  const handleDeploy = useCallback(async () => {
    if (!files.length || isDeploying) return;

    setDeployLogs([]); // 清空日志
    setShowLogs(true); // 显示日志面板

    try {
      await deployProject({
        projectName: projectName.toLowerCase().replace(/\s+/g, '-'),
        files,
        // target 省略，默认为预览部署
        gitMetadata: {
          commitAuthorName: 'HeysMe User',
          commitMessage: `Preview deployment: ${projectName}`,
          commitRef: 'main',
          dirty: false,
        },
        projectSettings: {
          buildCommand: 'npm run build',
          installCommand: 'npm install',
        },
        meta: {
          source: 'heysme-preview',
          description: description,
          timestamp: new Date().toISOString(),
        }
      });
    } catch (error) {
      console.error('部署失败:', error);
    }
  }, [files, projectName, description, deployProject, isDeploying]);

  // 刷新预览
  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    
    try {
      // 🔧 修复：优先使用iframe刷新，避免重复部署
      if (deploymentUrl || previewUrl) {
        console.log('🔄 [刷新] 已有部署URL，使用iframe刷新...');
        if (iframeRef.current) {
          iframeRef.current.src = iframeRef.current.src;
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        // 只有在没有部署URL时才重新部署
        console.log('🔄 [刷新] 没有部署URL，触发重新部署...');
        await handleDeploy();
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, deploymentUrl, previewUrl, handleDeploy]);

  // 下载代码
  const handleDownload = useCallback(() => {
    if (!files.length) return;

    const zip = files.reduce((acc, file) => {
      acc[file.filename] = file.content;
      return acc;
    }, {} as Record<string, string>);

    const blob = new Blob([JSON.stringify(zip, null, 2)], { 
      type: 'application/json' 
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName.replace(/\s+/g, '-')}-code.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [files, projectName]);

  // 状态图标和颜色
  const getStatusInfo = () => {
    if (deploymentError) {
      return {
        icon: AlertCircle,
        color: 'text-red-500',
        bgColor: 'bg-red-50 border-red-200',
        text: '部署失败'
      };
    }
    
    if (isDeploying) {
      const statusMap = {
        'initializing': '初始化中',
        'creating_project': '创建项目',
        'uploading_files': '上传文件',
        'deploying': '开始部署',
        'building': '构建中',
        'ready': '部署完成'
      } as const;
      
      return {
        icon: Loader2,
        color: 'text-blue-500',
        bgColor: 'bg-blue-50 border-blue-200',
        text: statusMap[deploymentStatus as keyof typeof statusMap] || '处理中',
        spinning: true
      };
    }
    
    if (isReady && deploymentUrl) {
      return {
        icon: CheckCircle2,
        color: 'text-green-500',
        bgColor: 'bg-green-50 border-green-200',
        text: '预览就绪'
      };
    }
    
    return {
      icon: Code,
      color: 'text-gray-500',
      bgColor: 'bg-gray-50 border-gray-200',
      text: '等待部署'
    };
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <div className={`flex flex-col h-full ${
      theme === "light" ? "bg-white" : "bg-gray-900"
    }`}>
      {/* 工具栏 */}
      {showToolbar && (
        <div className={`flex items-center justify-between px-4 py-2 border-b ${
          theme === "light" 
            ? "border-gray-200 bg-gray-50" 
            : "border-gray-700 bg-gray-800"
        }`}>
          {/* 左侧：状态和设备选择 */}
          <div className="flex items-center gap-2">
            {/* 状态指示器 */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border ${statusInfo.bgColor}`}>
              <StatusIcon 
                className={`w-3.5 h-3.5 ${statusInfo.color} ${
                  statusInfo.spinning ? 'animate-spin' : ''
                }`} 
              />
              <span className={`text-xs font-medium ${statusInfo.color}`}>
                {statusInfo.text}
              </span>
            </div>

            {/* 设备选择器 */}
            <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-gray-700 rounded-md p-0.5">
              <Button
                variant={localDeviceType === 'desktop' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleDeviceChange('desktop')}
                className="h-7 px-2"
              >
                <Monitor className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant={localDeviceType === 'mobile' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleDeviceChange('mobile')}
                className="h-7 px-2"
              >
                <Smartphone className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* 🆕 中间：版本选择器 */}
          {sessionId && versions.length > 0 && (
            <div className="flex-1 max-w-xs mx-4">
              <VersionSelector
                versions={versions}
                currentVersion={currentVersion}
                onVersionSelect={handleVersionSelect}
                onVersionDeploy={handleVersionDeploy}
                onVersionDelete={handleVersionDelete}
                isDeploying={isDeploying}
                deployingVersion={deployingVersion || undefined}
              />
            </div>
          )}

          {/* 右侧：操作按钮 */}
          <div className="flex items-center gap-1.5">
            {/* 刷新按钮 */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing || isDeploying}
              className="h-7 px-2.5 text-xs flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              刷新
            </Button>

            {/* 在线预览按钮 */}
            {deploymentUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(deploymentUrl, '_blank')}
                className="h-7 px-2.5 text-xs flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                预览
              </Button>
            )}

            {/* 下载代码按钮 */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={!files.length}
              className="h-7 px-2.5 text-xs flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              下载
            </Button>

            {/* 日志按钮 */}
            {deployLogs.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLogs(!showLogs)}
                className="h-7 px-2.5 text-xs flex items-center gap-1.5"
              >
                <Terminal className="w-3.5 h-3.5" />
                日志
              </Button>
            )}
          </div>
        </div>
      )}

      {/* 预览区域 */}
      <div className="flex-1 relative">
        {/* 🚀 代码生成阶段的加载UI */}
        {isGeneratingCode && (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center z-20">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl max-w-md mx-4"
            >
              <div className="text-center">
                {/* 动画图标 */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center"
                >
                  <Code className="w-8 h-8 text-white" />
                </motion.div>
                
                {/* 标题 */}
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
                  {generationStatus}
                </h3>
                
                {/* 进度条 */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
                  <motion.div
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${generationProgress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
                
                {/* 进度文本 */}
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {generationProgress}% 完成
                </p>
                
                {/* 脉冲效果 */}
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="mt-4 text-xs text-gray-500 dark:text-gray-400"
                >
                  正在为您生成高质量代码...
                </motion.div>
              </div>
            </motion.div>
          </div>
        )}

        {/* 部署阶段的加载状态 */}
        {(isLoading || isDeploying) && !isGeneratingCode && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 flex items-center gap-3 shadow-lg">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="text-lg font-medium">
                {isDeploying ? `${statusInfo.text}...` : '加载中...'}
              </span>
            </div>
          </div>
        )}

        {/* 错误状态 */}
        {deploymentError && !isGeneratingCode && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/20 dark:bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-xl p-8 max-w-lg mx-4 text-center shadow-2xl border border-red-200 dark:border-red-800"
            >
              {/* 错误图标 */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center"
              >
                <AlertCircle className="w-8 h-8 text-red-500" />
              </motion.div>
              
              {/* 标题 */}
              <h3 className="text-xl font-semibold mb-2 text-red-600 dark:text-red-400">
                部署失败
              </h3>
              
              {/* 错误信息 - 显示更多详情 */}
              <div className="text-left mb-6">
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-3">
                  部署过程中遇到了问题，请查看详细错误信息：
                </p>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-700">
                  <pre className="text-xs text-red-700 dark:text-red-300 whitespace-pre-wrap overflow-x-auto max-h-32">
                    {typeof deploymentError === 'string' 
                      ? deploymentError 
                      : JSON.stringify(deploymentError, null, 2)
                    }
                  </pre>
                </div>
              </div>
              
              {/* 操作按钮 */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={() => {
                    resetDeployment();
                    // 重新触发部署
                    setTimeout(() => handleDeploy(), 500);
                  }}
                  className="bg-red-500 hover:bg-red-600 text-white px-6"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  重新部署
                </Button>
                <Button
                  onClick={() => setShowLogs(true)}
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400"
                >
                  <Terminal className="w-4 h-4 mr-2" />
                  查看详细日志
                </Button>
                <Button
                  onClick={() => {
                    // 复制错误信息到剪贴板
                    navigator.clipboard.writeText(
                      typeof deploymentError === 'string' 
                        ? deploymentError 
                        : JSON.stringify(deploymentError, null, 2)
                    );
                  }}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  复制错误信息
                </Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* 🎯 部署链接按钮展示区域 */}
        {(deploymentUrl || previewUrl) && !isGeneratingCode && !deploymentError && (
          <div className="h-full flex items-center justify-center p-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-2xl"
            >
              {/* 成功图标 */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center"
              >
                <CheckCircle2 className="w-10 h-10 text-white" />
              </motion.div>

              {/* 标题 */}
              <motion.h3
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100"
              >
                🎉 部署成功！
              </motion.h3>

              {/* 描述 */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-gray-600 dark:text-gray-400 mb-8 text-lg"
              >
                您的项目已成功部署到 Vercel，点击下方按钮访问预览
              </motion.p>

              {/* 主要预览按钮 */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-4"
              >
                <Button
                  onClick={() => {
                    const url = deploymentUrl || previewUrl;
                    if (url) window.open(url, '_blank');
                  }}
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <ExternalLink className="w-5 h-5 mr-2" />
                  打开预览站点
                </Button>

                {/* 链接显示 */}
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">部署链接</p>
                      <p className="font-mono text-sm text-gray-900 dark:text-gray-100 truncate">
                        {deploymentUrl || previewUrl}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(deploymentUrl || previewUrl || '');
                        // 可以添加一个 toast 提示
                      }}
                      className="flex-shrink-0"
                    >
                      复制链接
                    </Button>
                  </div>
                </div>

                {/* 提示信息 */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-sm text-gray-500 dark:text-gray-400 space-y-2"
                >
                  <p className="flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    此链接将在新标签页中打开，确保最佳浏览体验
                  </p>
                  {localDeviceType === 'mobile' && (
                    <p className="text-xs">
                      💡 提示：您选择了移动端视图，网站将自适应您的设备显示
                    </p>
                  )}
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        )}

        {/* 空状态 */}
        {!previewUrl && !deploymentUrl && !isLoading && !isDeploying && !isGeneratingCode && !deploymentError && (
          <div className="h-full flex items-center justify-center p-8">
            <div className="text-center max-w-md mx-auto">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="mb-6"
              >
                <Code className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              </motion.div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">准备就绪</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                等待代码生成完成后将自动部署预览
              </p>
              
              {/* 移除手动部署按钮 - 现在完全自动化 */}
            </div>
          </div>
        )}
      </div>

      {/* 日志面板 */}
      <AnimatePresence>
        {showLogs && deployLogs.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={`border-t ${
              theme === "light" 
                ? "border-gray-200 bg-gray-50" 
                : "border-gray-700 bg-gray-800"
            }`}
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Terminal className="w-4 h-4" />
                  部署日志
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowLogs(false)}
                >
                  收起
                </Button>
              </div>
              <div className={`max-h-40 overflow-y-auto rounded-lg p-3 font-mono text-xs ${
                theme === "light" 
                  ? "bg-gray-900 text-green-400" 
                  : "bg-black text-green-300"
              }`}>
                {deployLogs.map((log, index) => (
                  <div key={index} className="mb-1">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Vercel 错误弹窗 */}
      {vercelErrorInfo && (
        <VercelErrorDialog
          open={showErrorDialog}
          onOpenChange={setShowErrorDialog}
          errorInfo={vercelErrorInfo}
          onRetry={() => {
            setShowErrorDialog(false);
            setVercelErrorInfo(null);
            // 重新部署
            handleDeploy();
          }}
          onCopyError={() => {
            // 可以添加额外的错误复制逻辑
            console.log('错误信息已复制到剪贴板');
          }}
        />
      )}
    </div>
  );
}