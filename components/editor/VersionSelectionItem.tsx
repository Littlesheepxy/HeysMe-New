'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GitBranch, 
  Eye, 
  EyeOff, 
  PlayCircle, 
  CheckCircle, 
  Clock,
  FileText,
  Layers,
  Calendar
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface VersionInfo {
  version: string;
  timestamp: number;
  filesCount: number;
  filesTypes: string[];
  commitMessage?: string;
  isActive?: boolean;
  isDeployed?: boolean;
  deploymentUrl?: string;
}

interface VersionSelectionItemProps {
  versionInfo: VersionInfo;
  isCurrentVersion?: boolean;
  onVersionSelect: (version: string) => void;
  onVersionPreview: (version: string) => void;
  onVersionDeploy?: (version: string) => void;
  showDeployButton?: boolean;
  isDeploying?: boolean;
  isCompactMode?: boolean;
}

export function VersionSelectionItem({ 
  versionInfo,
  isCurrentVersion = false,
  onVersionSelect,
  onVersionPreview,
  onVersionDeploy,
  showDeployButton = true,
  isDeploying = false,
  isCompactMode = false
}: VersionSelectionItemProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    return date.toLocaleDateString('zh-CN');
  };
  
  const getStatusColor = () => {
    if (isCurrentVersion) return 'bg-blue-50 border-blue-200';
    if (versionInfo.isDeployed) return 'bg-green-50 border-green-200';
    return 'bg-gray-50 border-gray-200';
  };
  
  const getStatusIcon = () => {
    if (isCurrentVersion) {
      return <CheckCircle className="w-4 h-4 text-blue-500" />;
    }
    if (versionInfo.isDeployed) {
      return <PlayCircle className="w-4 h-4 text-green-500" />;
    }
    return <Clock className="w-4 h-4 text-gray-400" />;
  };
  
  const getFileTypesDisplay = () => {
    const uniqueTypes = Array.from(new Set(versionInfo.filesTypes));
    return uniqueTypes.slice(0, 3).join(', ') + 
           (uniqueTypes.length > 3 ? ` +${uniqueTypes.length - 3}` : '');
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg border transition-all duration-300 cursor-pointer ${getStatusColor()} p-3`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => !isCurrentVersion && onVersionSelect(versionInfo.version)}
    >
      {/* 版本头部信息 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          {getStatusIcon()}
          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">
                版本 {versionInfo.version.toUpperCase()}
              </span>
              {isCurrentVersion && (
                <Badge variant="default" className="text-xs bg-blue-500">
                  当前版本
                </Badge>
              )}
              {versionInfo.isDeployed && !isCurrentVersion && (
                <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                  已部署
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <FileText className="w-3 h-3" />
              <span>{versionInfo.filesCount} 个文件</span>
              <span>•</span>
              <Calendar className="w-3 h-3" />
              <span>{formatTimestamp(versionInfo.timestamp)}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          {/* 预览按钮 - 在紧凑模式下只显示眼睛图标 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setShowDetails(!showDetails);
            }}
            className="h-6 w-6 p-0"
          >
            {showDetails ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          </Button>
          
          {/* 部署按钮 */}
          {showDeployButton && onVersionDeploy && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onVersionDeploy(versionInfo.version);
              }}
              disabled={isDeploying}
              className="h-6 w-6 p-0"
            >
              <PlayCircle className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>
      
      {/* 状态消息 */}
      {isCurrentVersion && (
        <div className="text-xs text-blue-600 mb-1 flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          正在使用此版本
        </div>
      )}
      
      {versionInfo.isDeployed && versionInfo.deploymentUrl && (
        <div className="text-xs text-green-600 mb-1 flex items-center gap-1">
          <PlayCircle className="w-3 h-3" />
          已部署到生产环境
        </div>
      )}
      
      {isDeploying && (
        <div className="text-xs text-orange-600 mb-1 flex items-center gap-1">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Layers className="w-3 h-3" />
          </motion.div>
          正在部署...
        </div>
      )}
      
      {/* 详细信息展开区域 */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 space-y-2"
          >
            {/* 提交信息 */}
            {versionInfo.commitMessage && (
              <div className="p-2 bg-white rounded border text-xs">
                <div className="font-medium text-gray-700 mb-1">提交信息:</div>
                <div className="text-gray-600">{versionInfo.commitMessage}</div>
              </div>
            )}
            
            {/* 文件类型统计 */}
            <div className="p-2 bg-white rounded border text-xs">
              <div className="font-medium text-gray-700 mb-1">文件类型:</div>
              <div className="flex flex-wrap gap-1">
                {Array.from(new Set(versionInfo.filesTypes)).map((type, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {type}
                  </Badge>
                ))}
              </div>
            </div>
            
            {/* 操作按钮 */}
            {!isCurrentVersion && (
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onVersionPreview(versionInfo.version);
                  }}
                  className="flex-1 text-xs"
                >
                  <Eye className="w-3 h-3 mr-1" />
                  预览此版本
                </Button>
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onVersionSelect(versionInfo.version);
                  }}
                  className="flex-1 text-xs"
                >
                  <GitBranch className="w-3 h-3 mr-1" />
                  切换到此版本
                </Button>
              </div>
            )}
            
            {/* 部署URL */}
            {versionInfo.deploymentUrl && (
              <div className="p-2 bg-white rounded border text-xs">
                <div className="font-medium text-gray-700 mb-1">部署地址:</div>
                <a 
                  href={versionInfo.deploymentUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 break-all"
                  onClick={(e) => e.stopPropagation()}
                >
                  {versionInfo.deploymentUrl}
                </a>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
