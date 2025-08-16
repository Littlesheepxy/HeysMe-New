/**
 * E2BSandboxPreview Component
 * E2B沙盒预览组件 - 替代VercelPreview
 */

'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Square, 
  RefreshCw, 
  Monitor, 
  Smartphone, 
  Tablet, 
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
  Terminal,
  Settings,
  Download,
  Copy,
  Eye,
  Code2,
  Loader2,
  Activity,
  Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/theme-context';
import { useE2BSandbox } from '@/hooks/use-e2b-sandbox';
import { useSandboxStatus } from '@/hooks/use-sandbox-status';
import { useSandboxLogs } from '@/hooks/use-sandbox-logs';

// 代码文件接口
interface CodeFile {
  filename: string;
  content: string;
  language: string;
  description?: string;
  type: 'page' | 'component' | 'styles' | 'config' | 'data';
}

// 设备视口配置
const deviceViewports = {
  desktop: { width: '100%', height: '100%', label: '桌面', icon: Monitor },
  tablet: { width: '768px', height: '1024px', label: '平板', icon: Tablet },
  mobile: { width: '375px', height: '667px', label: '手机', icon: Smartphone },
} as const;

type DeviceType = keyof typeof deviceViewports;

interface E2BSandboxPreviewProps {
  files: CodeFile[];
  projectName?: string;
  description?: string;
  isLoading?: boolean;
  previewUrl?: string;
  enableAutoRefresh?: boolean;
  onPreviewReady?: (url: string) => void;
  onLoadingChange?: (loading: boolean) => void;
  isEditMode?: boolean;
  onContentChange?: (field: string, value: string) => void;
  onRefresh?: () => Promise<void>;
}

export const E2BSandboxPreview: React.FC<E2BSandboxPreviewProps> = ({
  files,
  projectName = 'E2B预览',
  description,
  isLoading = false,
  previewUrl,
  enableAutoRefresh = true,
  onPreviewReady,
  onLoadingChange,
  isEditMode = false,
  onContentChange,
  onRefresh,
}) => {
  const { theme } = useTheme();
  
  // E2B Hooks
  const {
    sandbox,
    isLoading: sandboxLoading,
    error: sandboxError,
    isConnected,
    createSandbox,
    destroySandbox,
    deployCode,
    restartServer,
    getPreviewUrl,
  } = useE2BSandbox();

  const {
    health,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    getStatusColor,
    getStatusText,
    formatUptime,
  } = useSandboxStatus();

  const {
    logs,
    isStreaming: logsStreaming,
    startStreaming: startLogStreaming,
    stopStreaming: stopLogStreaming,
    clearLogs,
    getLogCount,
  } = useSandboxLogs();

  // 本地状态
  const [currentDevice, setCurrentDevice] = useState<DeviceType>('desktop');
  const [deploymentProgress, setDeploymentProgress] = useState(0);
  const [showLogs, setShowLogs] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentStage, setDeploymentStage] = useState('');
  const [internalPreviewUrl, setInternalPreviewUrl] = useState<string>('');
  
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // 获取有效的预览URL
  const effectivePreviewUrl = previewUrl || internalPreviewUrl || getPreviewUrl();

  // 启动沙盒和监控
  const initializeSandbox = useCallback(async () => {
    if (sandbox || sandboxLoading) return;

    try {
      console.log('🚀 [E2BSandboxPreview] 初始化沙盒...');
      const newSandbox = await createSandbox();
      
      if (newSandbox) {
        setInternalPreviewUrl(newSandbox.url);
        onPreviewReady?.(newSandbox.url);
        
        // 开始监控
        startMonitoring(15000); // 15秒间隔
        startLogStreaming({ level: 'all', limit: 100 });
      }
    } catch (error) {
      console.error('❌ [E2BSandboxPreview] 沙盒初始化失败:', error);
    }
  }, [sandbox, sandboxLoading, createSandbox, onPreviewReady, startMonitoring, startLogStreaming]);

  // 部署代码到沙盒
  const handleDeploy = useCallback(async (forceRestart: boolean = false) => {
    if (!files.length || isDeploying) return;

    setIsDeploying(true);
    setDeploymentProgress(0);
    setDeploymentStage('准备部署...');
    onLoadingChange?.(true);

    try {
      // 如果没有沙盒，先创建
      if (!sandbox) {
        setDeploymentStage('创建沙盒环境...');
        setDeploymentProgress(20);
        await initializeSandbox();
        
        // 等待沙盒准备就绪
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // 转换文件格式
      const fileMap: Record<string, string> = {};
      files.forEach(file => {
        fileMap[file.filename] = file.content;
      });

      setDeploymentStage('分析依赖包...');
      setDeploymentProgress(40);
      
      // 部署代码
      setDeploymentStage('部署代码到沙盒...');
      setDeploymentProgress(60);
      
      const deploySuccess = await deployCode({
        files: fileMap,
        autoInstallDeps: true,
      });

      if (!deploySuccess) {
        throw new Error('代码部署失败');
      }

      setDeploymentStage('启动开发服务器...');
      setDeploymentProgress(80);

      if (forceRestart || !effectivePreviewUrl) {
        await restartServer({ force: true });
      }

      setDeploymentProgress(100);
      setDeploymentStage('部署完成！');
      
      console.log('✅ [E2BSandboxPreview] 部署成功');
      
      // 刷新iframe
      if (iframeRef.current) {
        iframeRef.current.src = iframeRef.current.src;
      }

    } catch (error: any) {
      console.error('❌ [E2BSandboxPreview] 部署失败:', error);
      setDeploymentStage(`部署失败: ${error.message}`);
    } finally {
      setIsDeploying(false);
      onLoadingChange?.(false);
      
      setTimeout(() => {
        setDeploymentProgress(0);
        setDeploymentStage('');
      }, 3000);
    }
  }, [files, isDeploying, sandbox, onLoadingChange, initializeSandbox, deployCode, restartServer, effectivePreviewUrl]);

  // 自动部署当文件改变时
  useEffect(() => {
    if (files.length > 0 && enableAutoRefresh && sandbox && !isDeploying) {
      const deployTimer = setTimeout(() => {
        handleDeploy(false);
      }, 1000);
      
      return () => clearTimeout(deployTimer);
    }
  }, [files, enableAutoRefresh, sandbox, isDeploying, handleDeploy]);

  // 初始化时自动创建沙盒
  useEffect(() => {
    if (files.length > 0) {
      initializeSandbox();
    }

    return () => {
      // 组件卸载时清理
      stopMonitoring();
      stopLogStreaming();
    };
  }, [files.length, initializeSandbox, stopMonitoring, stopLogStreaming]);

  // 处理刷新
  const handleRefresh = useCallback(async () => {
    if (onRefresh) {
      await onRefresh();
    } else {
      await handleDeploy(true);
    }
  }, [onRefresh, handleDeploy]);

  // 复制URL
  const handleCopyUrl = useCallback(async () => {
    if (effectivePreviewUrl) {
      await navigator.clipboard.writeText(effectivePreviewUrl);
    }
  }, [effectivePreviewUrl]);

  // 状态颜色映射
  const statusColorMap = {
    green: 'bg-emerald-500',
    yellow: 'bg-amber-500', 
    red: 'bg-red-500',
    gray: 'bg-gray-500',
  };

  return (
    <div className={`h-full flex flex-col ${theme === 'light' ? 'bg-white' : 'bg-gray-900'}`}>
      {/* 🎨 顶部控制栏 */}
      <motion.div 
        className={`flex items-center justify-between px-4 py-3 border-b transition-all duration-300 ${
          theme === "light" 
            ? "bg-white/90 border-gray-200 backdrop-blur-xl" 
            : "bg-gray-900/90 border-gray-700 backdrop-blur-xl"
        }`}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* 左侧：项目信息和状态 */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-brand-gradient rounded-lg">
              <Globe className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className={`font-semibold text-sm ${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>
                {projectName}
              </h3>
              {description && (
                <p className={`text-xs ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                  {description}
                </p>
              )}
            </div>
          </div>

          {/* 状态指示器 */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${statusColorMap[getStatusColor()]} animate-pulse`} />
              <Badge variant="outline" className="text-xs">
                {getStatusText()}
              </Badge>
            </div>
            
            {sandbox && health && (
              <Badge variant="secondary" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                {formatUptime(health.uptimeMinutes)}
              </Badge>
            )}
          </div>
        </div>

        {/* 右侧：控制按钮 */}
        <div className="flex items-center gap-2">
          {/* 设备切换 */}
          <div className={`flex p-1 rounded-lg ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-800'}`}>
            {Object.entries(deviceViewports).map(([key, config]) => {
              const IconComponent = config.icon;
              return (
                <button
                  key={key}
                  onClick={() => setCurrentDevice(key as DeviceType)}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded text-xs transition-all",
                    currentDevice === key
                      ? theme === 'light' 
                        ? "bg-white text-emerald-700 shadow-sm"
                        : "bg-gray-700 text-emerald-400 shadow-sm"
                      : theme === 'light'
                        ? "text-gray-600 hover:text-gray-900"
                        : "text-gray-400 hover:text-gray-200"
                  )}
                >
                  <IconComponent className="w-3 h-3" />
                  {config.label}
                </button>
              );
            })}
          </div>

          {/* 操作按钮 */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            disabled={isDeploying || sandboxLoading}
            className="text-xs"
          >
            {isDeploying || sandboxLoading ? (
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3 mr-1" />
            )}
            刷新
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleCopyUrl}
            disabled={!effectivePreviewUrl}
            className="text-xs"
          >
            <Copy className="w-3 h-3 mr-1" />
            复制链接
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowLogs(!showLogs)}
            className="text-xs"
          >
            <Terminal className="w-3 h-3 mr-1" />
            日志 ({getLogCount('error')})
          </Button>

          {effectivePreviewUrl && (
            <Button
              size="sm"
              variant="default"
              onClick={() => window.open(effectivePreviewUrl, '_blank')}
              className="text-xs bg-brand-gradient hover:opacity-90"
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              新窗口
            </Button>
          )}
        </div>
      </motion.div>

      {/* 🚀 部署进度条 */}
      <AnimatePresence>
        {(isDeploying || sandboxLoading) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`px-4 py-2 border-b ${
              theme === 'light' ? 'bg-emerald-50 border-emerald-200' : 'bg-emerald-900/20 border-emerald-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-emerald-700">
                    {deploymentStage || '正在初始化...'}
                  </span>
                  <span className="text-xs text-emerald-600">
                    {deploymentProgress}%
                  </span>
                </div>
                <Progress 
                  value={deploymentProgress} 
                  className="h-1"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🎨 主预览区域 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 预览iframe */}
        <div className="flex-1 flex flex-col">
          {effectivePreviewUrl ? (
            <div className="flex-1 flex justify-center items-start p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  width: deviceViewports[currentDevice].width,
                  height: deviceViewports[currentDevice].height,
                  maxWidth: '100%',
                  maxHeight: '100%',
                }}
                className={`bg-white rounded-lg shadow-2xl overflow-hidden ${
                  currentDevice !== 'desktop' ? 'border-8 border-gray-800' : ''
                }`}
              >
                <iframe
                  ref={iframeRef}
                  src={effectivePreviewUrl}
                  className="w-full h-full border-0"
                  title={projectName}
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                  onLoad={() => {
                    console.log('✅ [E2BSandboxPreview] iframe加载完成');
                  }}
                />
              </motion.div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-4"
              >
                {sandboxError ? (
                  <>
                    <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto">
                      <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <div>
                      <p className={`text-lg font-medium ${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>
                        沙盒创建失败
                      </p>
                      <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                        {sandboxError}
                      </p>
                      <Button
                        onClick={initializeSandbox}
                        className="mt-4"
                        disabled={sandboxLoading}
                      >
                        重试
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-brand-gradient rounded-2xl flex items-center justify-center mx-auto animate-pulse">
                      <Zap className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <p className={`text-lg font-medium ${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>
                        准备预览环境...
                      </p>
                      <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                        正在初始化E2B沙盒
                      </p>
                    </div>
                  </>
                )}
              </motion.div>
            </div>
          )}
        </div>

        {/* 📊 日志面板 */}
        <AnimatePresence>
          {showLogs && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 400, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className={`border-l ${theme === 'light' ? 'border-gray-200 bg-white' : 'border-gray-700 bg-gray-900'}`}
            >
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between p-3 border-b">
                  <h4 className="font-medium text-sm">实时日志</h4>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      <Activity className="w-3 h-3 mr-1" />
                      {logsStreaming ? '监听中' : '已停止'}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={clearLogs}
                      className="text-xs"
                    >
                      清空
                    </Button>
                  </div>
                </div>
                
                <ScrollArea className="flex-1 p-2">
                  <div className="space-y-1">
                    {logs.map((log, index) => (
                      <div
                        key={index}
                        className={`p-2 rounded text-xs font-mono ${
                          log.level === 'error' 
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : log.level === 'warn'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-gray-50 text-gray-700 border border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-gray-500">
                            {log.timestamp.toLocaleTimeString()}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {log.source}
                          </Badge>
                          <Badge 
                            variant={log.level === 'error' ? 'destructive' : 'secondary'} 
                            className="text-xs"
                          >
                            {log.level}
                          </Badge>
                        </div>
                        <p className="break-all">{log.message}</p>
                      </div>
                    ))}
                    
                    {logs.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Terminal className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">暂无日志</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default E2BSandboxPreview;
