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

type DeviceType = 'desktop' | 'mobile';
type EditMode = 'none' | 'text' | 'ai';

interface VercelPreviewProps {
  files: CodeFile[];
  projectName: string;
  description?: string;
  isLoading: boolean;
  previewUrl: string | null;
  enableVercelDeploy: boolean;
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
}

export default function VercelPreview({
  files,
  projectName,
  description = '',
  isLoading,
  previewUrl,
  enableVercelDeploy = true,
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
  generationStatus = '正在生成代码...'
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
      // 🔧 首先尝试简单的iframe刷新，避免重新部署
      if (iframeRef.current) {
        console.log('🔄 [刷新] 尝试iframe刷新而不重新部署...');
        iframeRef.current.src = iframeRef.current.src;
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else if (onRefresh) {
        // 如果iframe刷新失败，使用自定义刷新回调
        console.log('🔄 [刷新] iframe不可用，触发重新部署...');
        onRefresh();
      } else {
        // 最后才调用内部的重新部署逻辑
        console.log('🔄 [刷新] 触发内部重新部署...');
        await handleDeploy();
      }
      
      // 等待刷新完成
      await new Promise(resolve => setTimeout(resolve, 1000));
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, onRefresh, handleDeploy]);

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
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-8 max-w-md mx-4 text-center shadow-xl border border-red-200 dark:border-red-800"
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
              
              {/* 错误信息 */}
              <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm leading-relaxed">
                {deploymentError}
              </p>
              
              {/* 操作按钮 */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={resetDeployment}
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
                  查看日志
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
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-md">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Code className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              </motion.div>
              <h3 className="text-lg font-semibold mb-2">准备就绪</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                等待代码生成完成后将自动部署预览
              </p>
              
              {/* 添加一个自动部署的按钮 */}
              {files.length > 0 && enableVercelDeploy && (
                <Button
                  onClick={handleDeploy}
                  disabled={isDeploying}
                  className="flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  立即部署预览
                </Button>
              )}
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