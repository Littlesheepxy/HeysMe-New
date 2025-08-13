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
  onRefresh
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
        <div className={`flex items-center justify-between p-4 border-b ${
          theme === "light" 
            ? "border-gray-200 bg-gray-50" 
            : "border-gray-700 bg-gray-800"
        }`}>
          {/* 左侧：状态和设备选择 */}
          <div className="flex items-center gap-3">
            {/* 状态指示器 */}
            <div className={`flex items-center gap-2 px-3 py-1 rounded-lg border ${statusInfo.bgColor}`}>
              <StatusIcon 
                className={`w-4 h-4 ${statusInfo.color} ${
                  statusInfo.spinning ? 'animate-spin' : ''
                }`} 
              />
              <span className={`text-sm font-medium ${statusInfo.color}`}>
                {statusInfo.text}
              </span>
            </div>

            {/* 设备选择器 */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <Button
                variant={localDeviceType === 'desktop' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleDeviceChange('desktop')}
                className="h-8 px-3"
              >
                <Monitor className="w-4 h-4" />
              </Button>
              <Button
                variant={localDeviceType === 'mobile' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleDeviceChange('mobile')}
                className="h-8 px-3"
              >
                <Smartphone className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* 右侧：操作按钮 */}
          <div className="flex items-center gap-2">
            {/* 刷新按钮 */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing || isDeploying}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              刷新
            </Button>



            {/* 在线预览按钮 */}
            {deploymentUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(deploymentUrl, '_blank')}
                className="flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                在线预览
              </Button>
            )}

            {/* 下载代码按钮 */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={!files.length}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              下载
            </Button>

            {/* 日志按钮 */}
            {deployLogs.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLogs(!showLogs)}
                className="flex items-center gap-2"
              >
                <Terminal className="w-4 h-4" />
                日志 ({deployLogs.length})
              </Button>
            )}
          </div>
        </div>
      )}

      {/* 预览区域 */}
      <div className="flex-1 relative">
        {/* 加载状态 */}
        {(isLoading || isDeploying) && (
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
        {deploymentError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md text-center shadow-lg">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">部署失败</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
                {deploymentError}
              </p>
              <div className="flex gap-2 justify-center">
                <Button
                  onClick={resetDeployment}
                  variant="outline"
                  size="sm"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  重试
                </Button>
                <Button
                  onClick={() => setShowLogs(true)}
                  variant="outline"
                  size="sm"
                >
                  <Terminal className="w-4 h-4 mr-2" />
                  查看日志
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 预览 iframe */}
        {(previewUrl || deploymentUrl) && (
          <div className="h-full flex items-center justify-center p-4">
            <div
              className={`bg-white rounded-lg shadow-lg transition-all duration-300 ${
                localDeviceType === 'mobile'
                  ? 'w-[375px] h-[667px]'
                  : 'w-full h-full max-w-6xl'
              }`}
            >
              <iframe
                ref={iframeRef}
                src={deploymentUrl || previewUrl || ''}
                className="w-full h-full rounded-lg border-0"
                title="预览"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                onError={() => {
                  console.warn('⚠️ iframe加载失败，可能是由于Vercel身份验证限制');
                }}
              />
              
              {/* 401错误提示和备用方案 */}
              <div className="absolute inset-0 bg-gray-50 dark:bg-gray-900 flex items-center justify-center opacity-0 pointer-events-none" 
                   id={`fallback-${deploymentUrl || previewUrl}`}>
                <div className="text-center p-6">
                  <div className="text-yellow-500 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">预览需要身份验证</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    由于Vercel身份验证限制，无法在iframe中直接预览
                  </p>
                  <Button
                    onClick={() => {
                      const url = deploymentUrl || previewUrl;
                      if (url) window.open(url, '_blank');
                    }}
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    在新标签页中打开
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 空状态 */}
        {!previewUrl && !deploymentUrl && !isLoading && !isDeploying && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-md">
              <Code className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">等待内容</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                当有内容时将显示预览，点击刷新按钮可以重新加载
              </p>
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