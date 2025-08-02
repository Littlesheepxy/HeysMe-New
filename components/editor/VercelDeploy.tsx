'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Play, 
  ExternalLink, 
  CheckCircle2,
  AlertCircle,
  Loader2,
  Rocket,
  Globe,
  History,
  Download,
  Eye,
  Terminal,
  RotateCcw,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/theme-context';
import { useVercelDeployment, type DeploymentResult } from '@/hooks/use-vercel-deployment';
import { type CodeFile } from '@/lib/agents/coding/types';

interface VercelDeployProps {
  files: CodeFile[];
  projectName: string;
  description?: string;
  isEnabled?: boolean;
  onDeploymentComplete?: (deployment: DeploymentResult) => void;
  onDeploymentError?: (error: string) => void;
}

export default function VercelDeploy({
  files,
  projectName,
  description = '',
  isEnabled = true,
  onDeploymentComplete,
  onDeploymentError
}: VercelDeployProps) {
  const { theme } = useTheme();
  
  // 状态管理
  const [deployLogs, setDeployLogs] = useState<string[]>([]);
  const [deploymentStatus, setDeploymentStatus] = useState<string>('ready');
  const [showLogs, setShowLogs] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

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
      // 自动显示日志当开始部署时
      if (status === 'initializing') {
        setShowLogs(true);
      }
    },
    onLog: (log) => {
      setDeployLogs(prev => [...prev, log]);
    },
    onDeploymentReady: (deployment) => {
      onDeploymentComplete?.(deployment);
    }
  });

  // 部署到生产环境
  const deployToProduction = useCallback(async () => {
    if (isDeploying || files.length === 0) return;

    setDeployLogs([]); // 清空之前的日志
    
    try {
      await deployProject({
        projectName: projectName.toLowerCase().replace(/\s+/g, '-'),
        files,
        target: 'production', // 🎯 关键：部署到生产环境
        gitMetadata: {
          commitAuthorName: 'HeysMe User',
          commitMessage: `Production deployment: ${projectName}`,
          commitRef: 'main',
          dirty: false,
        },
        projectSettings: {
          buildCommand: 'npm run build',
          installCommand: 'npm install',
        },
        meta: {
          source: 'heysme-production',
          environment: 'production',
          description: description,
          timestamp: new Date().toISOString(),
        }
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      onDeploymentError?.(errorMessage);
    }
  }, [deployProject, isDeploying, files, projectName, description, onDeploymentComplete, onDeploymentError]);

  // 重置状态
  const handleReset = useCallback(() => {
    resetDeployment();
    setDeployLogs([]);
    setDeploymentStatus('ready');
    setShowLogs(false);
  }, [resetDeployment]);

  // 状态信息
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
        text: '生产就绪'
      };
    }
    
    return {
      icon: Rocket,
      color: 'text-gray-500',
      bgColor: 'bg-gray-50 border-gray-200',
      text: '等待部署'
    };
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <div className={`w-full space-y-4 ${
      theme === "light" ? "bg-white" : "bg-gray-900"
    }`}>
      {/* 标题栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Rocket className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className={`font-semibold ${
              theme === "light" ? "text-gray-900" : "text-gray-100"
            }`}>
              Vercel 生产部署
            </h3>
            <p className={`text-sm ${
              theme === "light" ? "text-gray-600" : "text-gray-400"
            }`}>
              部署到生产环境，获得稳定的访问域名
            </p>
          </div>
        </div>
        
        {/* 状态徽章 */}
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
      </div>

      {/* 操作区域 */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* 主部署按钮 */}
        <Button
          onClick={deployToProduction}
          disabled={!isEnabled || isDeploying || files.length === 0}
          className={`flex items-center gap-2 transition-all duration-200 ${
            isDeploying
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          }`}
        >
          {isDeploying ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Rocket className="w-4 h-4" />
          )}
          {isDeploying ? '部署中...' : '部署到生产环境'}
        </Button>

        {/* 访问生产站点按钮 */}
        {deploymentUrl && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(deploymentUrl, '_blank')}
            className="flex items-center gap-1"
          >
            <Globe className="w-4 h-4" />
            访问生产站点
          </Button>
        )}

        {/* 重置按钮 */}
        {(deploymentError || deploymentResult) && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="flex items-center gap-1"
          >
            <RotateCcw className="w-4 h-4" />
            重置
          </Button>
        )}

        {/* 日志按钮 */}
        {deployLogs.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowLogs(!showLogs)}
            className="flex items-center gap-1"
          >
            <Terminal className="w-4 h-4" />
            日志 ({deployLogs.length})
          </Button>
        )}
      </div>

      {/* 当前部署信息 */}
      {deploymentResult && (
        <Card className={`${
          theme === "light" 
            ? "bg-gray-50 border-gray-200" 
            : "bg-gray-800 border-gray-700"
        }`}>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className={`font-medium ${
                  theme === "light" ? "text-gray-700" : "text-gray-300"
                }`}>
                  部署 ID:
                </span>
                <span className={`ml-2 font-mono ${
                  theme === "light" ? "text-gray-900" : "text-gray-100"
                }`}>
                  {deploymentResult.id.substring(0, 12)}...
                </span>
              </div>
              <div>
                <span className={`font-medium ${
                  theme === "light" ? "text-gray-700" : "text-gray-300"
                }`}>
                  状态:
                </span>
                <span className={`ml-2 ${
                  deploymentResult.state === 'READY' ? "text-green-600" :
                  deploymentResult.state === 'ERROR' ? "text-red-600" : "text-yellow-600"
                }`}>
                  {deploymentResult.state}
                </span>
              </div>
              {deploymentResult.url && (
                <div className="md:col-span-2">
                  <span className={`font-medium ${
                    theme === "light" ? "text-gray-700" : "text-gray-300"
                  }`}>
                    生产域名:
                  </span>
                  <a
                    href={deploymentResult.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`ml-2 text-blue-600 hover:text-blue-800 underline ${
                      theme === "dark" ? "text-blue-400 hover:text-blue-300" : ""
                    }`}
                  >
                    {deploymentResult.url}
                  </a>
                </div>
              )}
              <div>
                <span className={`font-medium ${
                  theme === "light" ? "text-gray-700" : "text-gray-300"
                }`}>
                  创建时间:
                </span>
                <span className={`ml-2 ${
                  theme === "light" ? "text-gray-900" : "text-gray-100"
                }`}>
                  {new Date(deploymentResult.createdAt).toLocaleString()}
                </span>
              </div>
              {deploymentResult.readyAt && (
                <div>
                  <span className={`font-medium ${
                    theme === "light" ? "text-gray-700" : "text-gray-300"
                  }`}>
                    完成时间:
                  </span>
                  <span className={`ml-2 ${
                    theme === "light" ? "text-gray-900" : "text-gray-100"
                  }`}>
                    {new Date(deploymentResult.readyAt).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 错误信息 */}
      {deploymentError && (
        <Card className={`border-red-200 ${
          theme === "light" ? "bg-red-50" : "bg-red-900/20"
        }`}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className={`font-medium text-red-700 ${
                  theme === "dark" ? "text-red-400" : ""
                }`}>
                  部署失败
                </h4>
                <p className={`text-sm mt-1 text-red-600 ${
                  theme === "dark" ? "text-red-300" : ""
                }`}>
                  {deploymentError}
                </p>
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleReset}
                    className="border-red-200 text-red-700 hover:bg-red-50"
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    重试
                  </Button>
                  {deployLogs.length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowLogs(true)}
                      className="border-red-200 text-red-700 hover:bg-red-50"
                    >
                      <Terminal className="w-4 h-4 mr-1" />
                      查看日志
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 部署日志 */}
      {showLogs && deployLogs.length > 0 && (
        <Card className={`${
          theme === "light" 
            ? "bg-gray-50 border-gray-200" 
            : "bg-gray-800 border-gray-700"
        }`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Terminal className="w-4 h-4" />
                部署日志
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLogs(false)}
              >
                收起
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-40">
              <div className={`rounded-lg p-3 font-mono text-xs space-y-1 ${
                theme === "light" 
                  ? "bg-gray-900 text-green-400" 
                  : "bg-black text-green-300"
              }`}>
                {deployLogs.map((log, index) => (
                  <div key={index} className="leading-relaxed">
                    {log}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* 功能说明 */}
      {!deploymentResult && !isDeploying && !deploymentError && (
        <Card className={`${
          theme === "light" 
            ? "bg-blue-50 border-blue-200" 
            : "bg-blue-900/20 border-blue-700"
        }`}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Rocket className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className={`font-medium mb-2 ${
                  theme === "light" ? "text-blue-900" : "text-blue-100"
                }`}>
                  关于生产部署
                </h4>
                <ul className={`text-sm space-y-1 ${
                  theme === "light" ? "text-blue-800" : "text-blue-200"
                }`}>
                  <li>• 部署到 Vercel 生产环境，获得稳定的访问域名</li>
                  <li>• 自动优化构建，确保最佳性能</li>
                  <li>• 全球 CDN 加速，访问速度更快</li>
                  <li>• 支持自定义域名绑定</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}