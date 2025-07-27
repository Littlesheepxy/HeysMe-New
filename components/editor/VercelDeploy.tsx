'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/theme-context';
import { 
  VercelPreviewService, 
  type DeploymentConfig, 
  type DeploymentStatus,
  type VercelConfig 
} from '@/lib/services/vercel-preview-service';
import { getVercelConfig } from '@/lib/config/vercel-config';
import { type CodeFile } from '@/lib/agents/coding/types';

interface VercelDeployProps {
  files: CodeFile[];
  projectName: string;
  description?: string;
  isEnabled?: boolean;
  onDeploymentComplete?: (deployment: DeploymentStatus) => void;
  onDeploymentError?: (error: string) => void;
}

export function VercelDeploy({
  files,
  projectName,
  description,
  isEnabled = true,
  onDeploymentComplete,
  onDeploymentError
}: VercelDeployProps) {
  const { theme } = useTheme();
  
  // 状态管理
  const [isDeploying, setIsDeploying] = useState(false);
  const [currentDeployment, setCurrentDeployment] = useState<DeploymentStatus | null>(null);
  const [deploymentHistory, setDeploymentHistory] = useState<DeploymentStatus[]>([]);
  const [deployLogs, setDeployLogs] = useState<string[]>([]);
  const [vercelService, setVercelService] = useState<VercelPreviewService | null>(null);
  const [configError, setConfigError] = useState<string>('');

  // 初始化 Vercel 服务
  useEffect(() => {
    const config = getVercelConfig();
    
    if (!config.enabled) {
      setConfigError('Vercel 部署未启用。请在环境变量中配置 ENABLE_VERCEL_PREVIEW=true');
      return;
    }

    if (!config.bearerToken) {
      setConfigError('缺少 Vercel Token。请在环境变量中配置 VERCEL_TOKEN');
      return;
    }

    try {
      const service = new VercelPreviewService(config);
      
      // 设置事件监听器
      service.onLog((log: string) => {
        setDeployLogs(prev => [...prev, log]);
      });
      
      setVercelService(service);
      setConfigError('');
    } catch (error) {
      setConfigError(`初始化 Vercel 服务失败: ${error}`);
    }
  }, []);

  // 部署到生产环境
  const deployToProduction = useCallback(async () => {
    if (!vercelService || isDeploying || files.length === 0) return;

    setIsDeploying(true);
    setDeployLogs(['🚀 开始生产环境部署...']);
    
    try {
      const deploymentConfig: DeploymentConfig = {
        projectName: projectName.toLowerCase().replace(/\s+/g, '-'),
        files,
        target: 'production', // 🎯 关键：部署到生产环境
        gitMetadata: {
          commitAuthorName: 'HeysMe User',
          commitMessage: `Production deployment: ${projectName}`,
          commitRef: 'main',
          dirty: false,
        },
        environmentVariables: [
          {
            key: 'NODE_ENV',
            value: 'production',
            target: ['production'],
          },
        ],
      };

      const deployment = await vercelService.deployProject(deploymentConfig);
      setCurrentDeployment(deployment);
      setDeploymentHistory(prev => [deployment, ...prev]);
      
      onDeploymentComplete?.(deployment);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setDeployLogs(prev => [...prev, `❌ 部署失败: ${errorMessage}`]);
      onDeploymentError?.(errorMessage);
      
    } finally {
      setIsDeploying(false);
    }
  }, [vercelService, isDeploying, files, projectName, onDeploymentComplete, onDeploymentError]);

  // 如果有配置错误，显示错误信息
  if (configError) {
    return (
      <Card className={`w-full ${
        theme === "light" 
          ? "bg-orange-50 border-orange-200" 
          : "bg-orange-900/20 border-orange-700"
      }`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-500" />
            <div>
              <p className={`font-medium ${
                theme === "light" ? "text-orange-800" : "text-orange-300"
              }`}>
                Vercel 部署配置错误
              </p>
              <p className={`text-sm ${
                theme === "light" ? "text-orange-700" : "text-orange-400"
              }`}>
                {configError}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

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
              生产环境部署
            </h3>
            <p className={`text-sm ${
              theme === "light" ? "text-gray-600" : "text-gray-400"
            }`}>
              部署到 Vercel 生产环境
            </p>
          </div>
        </div>

        <Badge className={`${
          currentDeployment?.state === 'READY' 
            ? "bg-green-100 text-green-800 border-green-200" 
            : currentDeployment?.state === 'ERROR'
              ? "bg-red-100 text-red-800 border-red-200"
              : "bg-gray-100 text-gray-800 border-gray-200"
        }`}>
          {currentDeployment?.state === 'READY' && <CheckCircle2 className="w-3 h-3 mr-1" />}
          {currentDeployment?.state === 'ERROR' && <AlertCircle className="w-3 h-3 mr-1" />}
          {currentDeployment ? currentDeployment.state : '未部署'}
        </Badge>
      </div>

      {/* 操作区域 */}
      <div className="flex items-center gap-3">
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

        {currentDeployment?.deploymentUrl && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(currentDeployment.deploymentUrl, '_blank')}
            className="flex items-center gap-1"
          >
            <Globe className="w-4 h-4" />
            访问生产站点
          </Button>
        )}

        {deploymentHistory.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-1"
          >
            <History className="w-4 h-4" />
            历史记录 ({deploymentHistory.length})
          </Button>
        )}
      </div>

      {/* 当前部署信息 */}
      {currentDeployment && (
        <Card className={`${
          theme === "light" 
            ? "bg-gray-50 border-gray-200" 
            : "bg-gray-800 border-gray-700"
        }`}>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className={`font-medium ${
                  theme === "light" ? "text-gray-700" : "text-gray-300"
                }`}>
                  部署 ID:
                </span>
                <span className={`ml-2 font-mono ${
                  theme === "light" ? "text-gray-900" : "text-gray-100"
                }`}>
                  {currentDeployment.id.substring(0, 12)}...
                </span>
              </div>
              <div>
                <span className={`font-medium ${
                  theme === "light" ? "text-gray-700" : "text-gray-300"
                }`}>
                  状态:
                </span>
                <span className={`ml-2 ${
                  currentDeployment.state === 'READY' ? "text-green-600" :
                  currentDeployment.state === 'ERROR' ? "text-red-600" : "text-yellow-600"
                }`}>
                  {currentDeployment.state}
                </span>
              </div>
              {currentDeployment.deploymentUrl && (
                <div className="col-span-2">
                  <span className={`font-medium ${
                    theme === "light" ? "text-gray-700" : "text-gray-300"
                  }`}>
                    生产域名:
                  </span>
                  <a
                    href={currentDeployment.deploymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-blue-600 hover:text-blue-800 underline"
                  >
                    {currentDeployment.deploymentUrl}
                  </a>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 部署日志 */}
      {deployLogs.length > 0 && (
        <Card className={`${
          theme === "light" 
            ? "bg-gray-50 border-gray-200" 
            : "bg-gray-800 border-gray-700"
        }`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">部署日志</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-32">
              <div className="space-y-1">
                {deployLogs.map((log, index) => (
                  <div
                    key={index}
                    className={`text-xs font-mono ${
                      theme === "light" ? "text-gray-600" : "text-gray-400"
                    }`}
                  >
                    {log}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default VercelDeploy; 