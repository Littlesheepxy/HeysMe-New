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
import { 
  VercelPreviewService, 
  type DeploymentConfig, 
  type DeploymentStatus, 
  type PreviewStatus,
  type VercelConfig 
} from '@/lib/services/vercel-preview-service';
import { type CodeFile } from '@/lib/agents/coding/types';
import { StagewiseToolbar } from './StagewiseToolbar';
import { useTheme } from '@/contexts/theme-context';

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
  editMode?: EditMode;
  vercelConfig?: VercelConfig;
  // 🆕 自动部署相关
  autoDeployEnabled?: boolean;
  isProjectComplete?: boolean;
  hasAutoDeployed?: boolean;
  onAutoDeployStatusChange?: (enabled: boolean) => void;
}

export function VercelPreview({
  files,
  projectName,
  description,
  isLoading,
  previewUrl,
  enableVercelDeploy,
  onPreviewReady,
  onLoadingChange,
  isEditMode,
  onContentChange,
  deviceType = 'desktop',
  editMode = 'none',
  vercelConfig,
  autoDeployEnabled = false,
  isProjectComplete = false,
  hasAutoDeployed = false,
  onAutoDeployStatusChange
}: VercelPreviewProps) {
  
  // 默认配置
  const defaultVercelConfig: VercelConfig = {
    bearerToken: '',
    teamId: undefined,
    teamSlug: undefined
  };
  
  const config = vercelConfig || defaultVercelConfig;
  
  // ============== 状态管理 ==============
  const [previewStatus, setPreviewStatus] = useState<PreviewStatus>('initializing');
  const [deployLogs, setDeployLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [vercelService, setVercelService] = useState<VercelPreviewService | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [currentDeployment, setCurrentDeployment] = useState<DeploymentStatus | null>(null);
  const [deploymentHistory, setDeploymentHistory] = useState<DeploymentStatus[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { theme } = useTheme();

  // ============== 设备配置 ==============
  const deviceConfigs = {
    desktop: {
      width: '100%',
      height: '100%',
      label: '桌面预览',
      icon: Monitor
    },
    mobile: {
      width: '375px',
      height: '667px',
      label: '移动预览',
      icon: Smartphone
    }
  };

  // ============== 工具函数 ==============
  const log = useCallback((message: string) => {
    setDeployLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  }, []);

  const generateMockPreviewUrl = useCallback(() => {
    const htmlFile = files.find(f => f.filename.endsWith('.html') || f.filename === 'index.html');
    const tsxFile = files.find(f => f.filename.endsWith('.tsx') && f.filename.includes('page'));
    const jsxFile = files.find(f => f.filename.endsWith('.jsx') && f.filename.includes('page'));
    
    if (htmlFile) {
      return `data:text/html;charset=utf-8,${encodeURIComponent(htmlFile.content)}`;
    }
    
    if (tsxFile || jsxFile) {
      const mockHtml = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${projectName}</title>
  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    body { margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; }
    ${files.find(f => f.filename.includes('globals.css') || f.filename.includes('index.css'))?.content || ''}
    ${files.find(f => f.filename.includes('tailwind') || f.filename.includes('style'))?.content || ''}
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    ${(tsxFile || jsxFile)?.content || ''}
  </script>
</body>
</html>`;
      return `data:text/html;charset=utf-8,${encodeURIComponent(mockHtml)}`;
    }
    
    return `data:text/html;charset=utf-8,${encodeURIComponent(`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${projectName}</title>
  <style>
    body { margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; }
    .container { max-width: 800px; margin: 0 auto; text-align: center; }
    .title { color: #333; margin-bottom: 20px; }
    .description { color: #666; line-height: 1.6; }
    .file-list { margin-top: 30px; text-align: left; }
    .file-item { padding: 10px; margin: 5px 0; background: #f5f5f5; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="container">
    <h1 class="title">${projectName}</h1>
    ${description ? `<p class="description">${description}</p>` : ''}
    <div class="file-list">
      <h3>项目文件：</h3>
      ${files.map(f => `<div class="file-item">${f.filename}</div>`).join('')}
    </div>
  </div>
</body>
</html>
    `)}`;
  }, [files, projectName, description]);

  // ============== 核心部署函数 ==============
  const deployToVercel = useCallback(async () => {
    if (!vercelService || isDeploying || files.length === 0) return;

    setIsDeploying(true);
    onLoadingChange(true);
    
    try {
      log('🚀 开始 Vercel 部署...');

      const deploymentConfig: DeploymentConfig = {
        projectName: projectName.toLowerCase().replace(/\s+/g, '-'),
        files,
        target: 'preview',
        gitMetadata: {
          commitAuthorName: 'HeysMe User',
          commitMessage: `Deploy ${projectName} from HeysMe`,
          commitRef: 'main',
          dirty: false,
        },
        environmentVariables: [
          {
            key: 'NODE_ENV',
            value: 'production',
            target: ['preview'],
          },
        ],
      };

      const deployment = await vercelService.deployProject(deploymentConfig);
      setCurrentDeployment(deployment);
      setDeploymentHistory(prev => [deployment, ...prev]);
      
      if (deployment.deploymentUrl) {
        onPreviewReady(deployment.deploymentUrl);
        setRefreshKey(prev => prev + 1);
      }

      log(`✅ 部署成功：${deployment.deploymentUrl}`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log(`❌ 部署失败: ${errorMessage}`);
      
      // 降级到模拟预览
      const mockUrl = generateMockPreviewUrl();
      onPreviewReady(mockUrl);
      setRefreshKey(prev => prev + 1);
      
    } finally {
      setIsDeploying(false);
      onLoadingChange(false);
    }
  }, [vercelService, isDeploying, files, projectName, onPreviewReady, onLoadingChange, log, generateMockPreviewUrl]);

  const rollbackDeployment = useCallback(async () => {
    if (!vercelService || isDeploying) return;

    setIsDeploying(true);
    try {
      const rollbackDeployment = await vercelService.rollbackToPrevious();
      if (rollbackDeployment) {
        setCurrentDeployment(rollbackDeployment);
        if (rollbackDeployment.deploymentUrl) {
          onPreviewReady(rollbackDeployment.deploymentUrl);
          setRefreshKey(prev => prev + 1);
        }
      }
    } catch (error) {
      log(`❌ 回退失败: ${error}`);
    } finally {
      setIsDeploying(false);
    }
  }, [vercelService, isDeploying, onPreviewReady, log]);

  const refreshPreview = useCallback(() => {
    log('🔄 刷新预览...');
    setRefreshKey(prev => prev + 1);
    setDeployLogs(['🔄 手动刷新开始...']);
    
    if (enableVercelDeploy && files.length > 0) {
      deployToVercel();
    } else {
      // 使用模拟预览
      const mockUrl = generateMockPreviewUrl();
      onPreviewReady(mockUrl);
      log('🎯 使用模拟预览');
    }
  }, [enableVercelDeploy, files.length, deployToVercel, generateMockPreviewUrl, onPreviewReady, log]);

  // ============== 生命周期管理 ==============
  
  // 1. 初始化 Vercel 服务
  useEffect(() => {
    if (enableVercelDeploy && !vercelService) {
      log('🔧 初始化 Vercel 服务...');
      
      const service = new VercelPreviewService(config);
      
      // 设置事件监听器
      service.onStatusChange((status) => {
        setPreviewStatus(status);
        log(`📊 状态变化: ${status}`);
      });

      service.onLog((logMessage) => {
        log(logMessage);
      });

      service.onDeploymentReady((deployment) => {
        setCurrentDeployment(deployment);
        if (deployment.deploymentUrl) {
          onPreviewReady(deployment.deploymentUrl);
          setRefreshKey(prev => prev + 1);
        }
      });

      setVercelService(service);
    }
  }, [enableVercelDeploy, vercelService, vercelConfig, log, onPreviewReady]);

  // 2. 文件变化时自动部署或生成预览
  useEffect(() => {
    if (files.length > 0) {
      if (enableVercelDeploy && vercelService && !isDeploying) {
        const timeoutId = setTimeout(() => {
          deployToVercel();
        }, 2000); // 延迟2秒避免频繁部署

        return () => clearTimeout(timeoutId);
      } else if (!previewUrl) {
        // 生成模拟预览
        const mockUrl = generateMockPreviewUrl();
        onPreviewReady(mockUrl);
        log('🎯 生成模拟预览');
      }
    }
  }, [files, enableVercelDeploy, vercelService, isDeploying, previewUrl, deployToVercel, generateMockPreviewUrl, onPreviewReady, log]);

  // 3. 组件清理
  useEffect(() => {
    return () => {
      if (vercelService) {
        vercelService.destroy().catch(console.error);
      }
    };
  }, [vercelService]);

  // ============== 可视化编辑处理 ==============
  const handleElementModificationRequest = useCallback(async (elementInfo: any, prompt: string) => {
    const visualEditMessage = `
🎯 **可视化编辑请求**

**选中元素：**
- 标签: \`${elementInfo.tagName}\`
- 选择器: \`${elementInfo.selector}\`
- 类名: \`${elementInfo.className}\`
- 文本内容: "${elementInfo.textContent?.slice(0, 100)}${elementInfo.textContent?.length > 100 ? '...' : ''}"

**修改需求：**
${prompt}

**项目上下文：**
- 项目名称: ${projectName}
- 框架: React
- 当前文件数: ${files.length}
- 部署状态: ${currentDeployment ? '已部署' : '未部署'}

请帮我修改代码来实现这个需求。
    `.trim();

    if (onContentChange) {
      onContentChange('visual_edit_request', visualEditMessage);
    } else {
      window.parent.postMessage({
        type: 'VISUAL_EDIT_TO_CHAT',
        message: visualEditMessage,
        elementInfo,
        prompt
      }, '*');
    }
  }, [files.length, projectName, currentDeployment, onContentChange]);
    
  // ============== 渲染 ==============
  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 overflow-hidden">
      {/* 顶部工具栏 */}
      <div className={`flex items-center justify-between px-4 py-2 border-b ${
        theme === 'light' 
          ? 'bg-gray-50 border-gray-200' 
          : 'bg-gray-800 border-gray-700'
      }`}>
        <div className="flex items-center gap-3">
          <StatusIndicator status={previewStatus} theme={theme} />
          <Badge variant="outline" className={`text-xs ${
            theme === 'light' 
              ? 'border-gray-300 text-gray-700' 
              : 'border-gray-600 text-gray-300'
          }`}>
            {deviceConfigs[deviceType].label}
          </Badge>
          <Badge 
            variant={enableVercelDeploy && currentDeployment ? 'default' : 'secondary'} 
            className="text-xs"
          >
            {enableVercelDeploy && currentDeployment ? 'Vercel 部署' : '模拟预览'}
          </Badge>
          {currentDeployment && (
            <Badge variant="outline" className="text-xs">
              {currentDeployment.state}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          {enableVercelDeploy && deploymentHistory.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              className={`flex items-center gap-1 h-7 px-2 text-xs ${
                theme === 'light' 
                  ? 'border-gray-300 text-gray-700 hover:bg-gray-100' 
                  : 'border-gray-600 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <History className="w-3 h-3" />
              历史 ({deploymentHistory.length})
            </Button>
          )}

          {enableVercelDeploy && deploymentHistory.length > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={rollbackDeployment}
              disabled={isDeploying}
              className={`flex items-center gap-1 h-7 px-2 text-xs ${
                theme === 'light' 
                  ? 'border-gray-300 text-gray-700 hover:bg-gray-100' 
                  : 'border-gray-600 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <RotateCcw className={cn("w-3 h-3", isDeploying && "animate-spin")} />
              回退
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowLogs(!showLogs)}
            className={`flex items-center gap-1 h-7 px-2 text-xs ${
              theme === 'light' 
                ? 'border-gray-300 text-gray-700 hover:bg-gray-100' 
                : 'border-gray-600 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <Terminal className="w-3 h-3" />
            {showLogs ? '隐藏日志' : '显示日志'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setDeployLogs(['🔄 手动刷新开始...']);
              refreshPreview();
            }}
            disabled={isLoading || isDeploying}
            className={`flex items-center gap-1 h-7 px-2 text-xs transition-all duration-200 ${
              theme === 'light' 
                ? 'border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-emerald-300' 
                : 'border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-emerald-500'
            }`}
          >
            <RefreshCw className={cn("w-3 h-3", (isLoading || isDeploying) && "animate-spin")} />
            {isDeploying ? '部署中...' : '刷新'}
          </Button>
          
          {enableVercelDeploy && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={deployToVercel}
                disabled={files.length === 0 || isDeploying}
                className={`flex items-center gap-1 h-7 px-2 text-xs transition-all duration-200 ${
                  theme === 'light' 
                    ? 'border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400' 
                    : 'border-emerald-600 text-emerald-400 hover:bg-emerald-900/20 hover:border-emerald-500'
                }`}
              >
                <RefreshCw className={cn("w-3 h-3", isDeploying && "animate-spin")} />
                {isDeploying ? '更新预览中...' : '刷新预览'}
              </Button>
              
              {/* 🆕 自动预览开关 */}
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoDeployEnabled}
                    onChange={(e) => onAutoDeployStatusChange?.(e.target.checked)}
                    className="w-3 h-3 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500 focus:ring-2"
                  />
                  <span className={`text-xs ${
                    theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                  }`}>
                    自动预览
                  </span>
                </label>
                
                {autoDeployEnabled && hasAutoDeployed && (
                  <span className="text-xs text-emerald-600 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    已自动更新
                  </span>
                )}
                
                {autoDeployEnabled && isProjectComplete && !hasAutoDeployed && (
                  <span className="text-xs text-orange-500 flex items-center gap-1 animate-pulse">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    准备自动预览...
                  </span>
                )}
              </div>
            </>
          )}

          {currentDeployment?.deploymentUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(currentDeployment.deploymentUrl, '_blank')}
              className={`flex items-center gap-1 h-7 px-2 text-xs ${
                theme === 'light' 
                  ? 'border-gray-300 text-gray-700 hover:bg-gray-100' 
                  : 'border-gray-600 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <ExternalLink className="w-3 h-3" />
              打开新窗口
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 flex">
        {/* 预览区域 */}
        <div className="flex-1 flex flex-col">
          <div className={`flex-1 p-4 ${
            theme === 'light' 
              ? 'bg-gray-100' 
              : 'bg-gray-800'
          }`}>
            <div 
              className={`mx-auto rounded-lg shadow-lg overflow-hidden border ${
                theme === 'light' 
                  ? 'bg-white border-gray-200' 
                  : 'bg-gray-900 border-gray-700'
              }`}
              style={{
                width: deviceConfigs[deviceType].width,
                height: deviceConfigs[deviceType].height,
                maxWidth: '100%',
                maxHeight: '100%'
              }}
            >
              {previewUrl ? (
                <iframe
                  key={refreshKey}
                  ref={iframeRef}
                  src={previewUrl}
                  className="w-full h-full border-0"
                  title={`${projectName} 预览`}
                />
              ) : (
                <PreviewPlaceholder status={previewStatus} theme={theme} />
              )}
            </div>
          </div>
        </div>

        {/* 部署历史侧边栏 */}
        <AnimatePresence>
          {showHistory && deploymentHistory.length > 0 && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className={`border-l overflow-hidden ${
                theme === 'light' 
                  ? 'bg-white border-gray-300' 
                  : 'bg-gray-900 border-gray-700'
              }`}
            >
              <div className={`p-3 border-b ${
                theme === 'light' 
                  ? 'border-gray-200' 
                  : 'border-gray-600'
              }`}>
                <h4 className={`font-semibold ${
                  theme === 'light' ? 'text-gray-900' : 'text-white'
                }`}>部署历史</h4>
              </div>
              <div className="p-3 h-full overflow-y-auto">
                {deploymentHistory.map((deployment, index) => (
                  <div
                    key={deployment.id}
                    className={`mb-3 p-3 rounded border ${
                      theme === 'light' 
                        ? 'border-gray-200 bg-gray-50' 
                        : 'border-gray-600 bg-gray-800'
                    } ${currentDeployment?.id === deployment.id ? 'ring-2 ring-blue-500' : ''}`}
                  >
                    <div className={`text-sm font-medium ${
                      theme === 'light' ? 'text-gray-900' : 'text-white'
                    }`}>
                      {index === 0 ? '当前' : `版本 ${index + 1}`}
                    </div>
                    <div className={`text-xs ${
                      theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                    }`}>
                      {new Date(deployment.createdAt).toLocaleString()}
                    </div>
                    <div className={`text-xs mt-1 ${
                      deployment.state === 'READY' ? 'text-green-600' :
                      deployment.state === 'ERROR' ? 'text-red-600' :
                      'text-yellow-600'
                    }`}>
                      {deployment.state}
                    </div>
                    {deployment.deploymentUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(deployment.deploymentUrl, '_blank')}
                        className="mt-2 h-6 px-2 text-xs w-full"
                      >
                        查看
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 日志面板 */}
        <AnimatePresence>
          {showLogs && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 350, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className={`border-l text-green-400 font-mono text-xs overflow-hidden ${
                theme === 'light' 
                  ? 'bg-gray-900 border-gray-300' 
                  : 'bg-gray-950 border-gray-700'
              }`}
            >
              <div className={`p-3 border-b flex items-center justify-between ${
                theme === 'light' 
                  ? 'border-gray-700' 
                  : 'border-gray-600'
              }`}>
                <h4 className="font-semibold text-white">部署日志</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeployLogs([])}
                  className={`text-gray-400 hover:text-white h-6 px-2 ${
                    theme === 'light' 
                      ? 'hover:bg-gray-800' 
                      : 'hover:bg-gray-700'
                  }`}
                >
                  清空
                </Button>
              </div>
              <div className="p-3 h-full overflow-y-auto max-h-96">
                {deployLogs.length === 0 ? (
                  <div className={`${
                    theme === 'light' 
                      ? 'text-gray-500' 
                      : 'text-gray-400'
                  }`}>暂无日志</div>
                ) : (
                  deployLogs.map((log, index) => (
                    <div key={index} className="mb-1 break-words">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 可视化编辑工具栏 */}
      {editMode === 'ai' && (
        <StagewiseToolbar
          iframeRef={iframeRef}
          onElementModificationRequest={handleElementModificationRequest}
          isEnabled={true}
          onToggle={() => {}}
        />
      )}
    </div>
  );
}

// ============== 子组件 ==============

function StatusIndicator({ status, theme }: { status: PreviewStatus; theme: string }) {
  const statusConfig = {
    initializing: { color: 'bg-blue-400 animate-pulse', label: '初始化中', icon: Loader2 },
    creating_project: { color: 'bg-purple-400 animate-pulse', label: '创建项目', icon: Sparkles },
    uploading_files: { color: 'bg-yellow-400 animate-pulse', label: '上传文件', icon: Loader2 },
    deploying: { color: 'bg-orange-400 animate-pulse', label: '部署中', icon: Loader2 },
    ready: { color: 'bg-green-400', label: '已就绪', icon: CheckCircle2 },
    error: { color: 'bg-red-400', label: '错误', icon: AlertCircle }
  };

  const config = statusConfig[status] || statusConfig.initializing;
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2">
      <div className={cn("w-3 h-3 rounded-full", config.color)} />
      <Icon className={`w-4 h-4 ${
        theme === 'light' 
          ? 'text-gray-600' 
          : 'text-gray-400'
      }`} />
      <span className={`text-sm ${
        theme === 'light' 
          ? 'text-gray-600' 
          : 'text-gray-400'
      }`}>{config.label}</span>
    </div>
  );
}

function PreviewPlaceholder({ status, theme }: { status: PreviewStatus; theme: string }) {
  const messages = {
    initializing: '正在初始化 Vercel 预览...',
    creating_project: '正在创建 Vercel 项目...',
    uploading_files: '正在上传项目文件...',
    deploying: '正在部署到 Vercel...',
    ready: '预览已就绪...',
    error: '预览加载失败，请检查代码'
  };

  return (
    <div className={`h-full flex items-center justify-center ${
      theme === 'light' 
        ? 'bg-gray-50' 
        : 'bg-gray-800'
    }`}>
      <div className="text-center">
        <Sparkles className={`w-12 h-12 mx-auto mb-4 ${
          theme === 'light' 
            ? 'text-gray-400' 
            : 'text-gray-500'
        }`} />
        <p className={`${
          theme === 'light' 
            ? 'text-gray-600' 
            : 'text-gray-400'
        }`}>{messages[status] || messages.initializing}</p>
        {status === 'error' && (
          <p className={`text-sm mt-2 ${
            theme === 'light' 
              ? 'text-red-500' 
              : 'text-red-400'
          }`}>
            请检查控制台日志获取详细信息
          </p>
        )}
      </div>
    </div>
  );
}

export default VercelPreview; 