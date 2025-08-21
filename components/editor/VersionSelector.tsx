'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronDown, 
  History, 
  Play, 
  Check, 
  GitBranch,
  Clock,
  FileText,
  Trash2,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ProjectVersion } from '@/lib/services/project-version-manager';

interface VersionSelectorProps {
  versions: ProjectVersion[];
  currentVersion: string;
  onVersionSelect: (versionId: string) => void;
  onVersionDeploy: (versionId: string) => void;
  onVersionDelete?: (versionId: string) => void;
  isDeploying?: boolean;
  deployingVersion?: string;
  className?: string;
}

export function VersionSelector({
  versions,
  currentVersion,
  onVersionSelect,
  onVersionDeploy,
  onVersionDelete,
  isDeploying = false,
  deployingVersion,
  className
}: VersionSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hoveredVersion, setHoveredVersion] = useState<string | null>(null);

  const currentVersionData = versions.find(v => v.version === currentVersion);
  const hasMultipleVersions = versions.length > 1;

  if (versions.length === 0) {
    return null;
  }

  return (
    <div className={cn('relative', className)}>
      {/* 版本选择器主按钮 */}
      <Button
        variant="outline"
        onClick={() => setIsExpanded(!isExpanded)}
        disabled={isDeploying}
        className="w-full justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-blue-600" />
          <div className="flex flex-col items-start">
            <span className="font-medium">
              {currentVersionData?.version.toUpperCase() || 'V1'} - {currentVersionData?.name || '初始版本'}
            </span>
            {hasMultipleVersions && (
              <span className="text-xs text-gray-500">
                {versions.length} 个版本可选
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {currentVersionData?.isActive && (
            <Badge variant="secondary" className="text-xs">
              当前
            </Badge>
          )}
          <ChevronDown className={cn(
            'w-4 h-4 transition-transform',
            isExpanded && 'rotate-180'
          )} />
        </div>
      </Button>

      {/* 版本列表下拉菜单 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto"
          >
            <div className="p-2">
              <div className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700 mb-2">
                <History className="w-4 h-4" />
                版本历史
              </div>

              {versions.map((version, index) => (
                <div
                  key={version.id}
                  className={cn(
                    'group relative p-3 rounded-lg border transition-all duration-200 mb-2 last:mb-0',
                    version.version === currentVersion
                      ? 'border-blue-200 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20'
                      : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  )}
                  onMouseEnter={() => setHoveredVersion(version.version)}
                  onMouseLeave={() => setHoveredVersion(null)}
                >
                  {/* 版本信息 */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {version.version.toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {version.name}
                        </span>
                        {version.isActive && (
                          <Badge variant="secondary" className="text-xs">
                            当前
                          </Badge>
                        )}
                      </div>
                      
                      {version.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                          {version.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {version.createdAt.toLocaleString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {version.files.length} 个文件
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center gap-2">
                    {/* 选择版本按钮 */}
                    {version.version !== currentVersion && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          onVersionSelect(version.version);
                          setIsExpanded(false);
                        }}
                        className="text-xs"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        查看
                      </Button>
                    )}

                    {/* 部署按钮 */}
                    <Button
                      size="sm"
                      onClick={() => {
                        onVersionDeploy(version.version);
                        setIsExpanded(false);
                      }}
                      disabled={isDeploying}
                      className={cn(
                        'text-xs',
                        version.version === currentVersion
                          ? 'bg-blue-600 hover:bg-blue-700'
                          : 'bg-green-600 hover:bg-green-700'
                      )}
                    >
                      {isDeploying && deployingVersion === version.version ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="w-3 h-3 mr-1"
                          >
                            <Play className="w-3 h-3" />
                          </motion.div>
                          部署中...
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 mr-1" />
                          部署 {version.version.toUpperCase()}
                        </>
                      )}
                    </Button>

                    {/* 删除按钮 */}
                    {versions.length > 1 && onVersionDelete && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          onVersionDelete(version.version);
                        }}
                        className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>

                  {/* 当前版本指示器 */}
                  {version.version === currentVersion && (
                    <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-8 bg-blue-600 rounded-r-full" />
                  )}
                </div>
              ))}
            </div>

            {/* 底部统计信息 */}
            <div className="border-t border-gray-100 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800/50">
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                共 {versions.length} 个版本 • 当前: {currentVersion.toUpperCase()}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 点击外部关闭 */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </div>
  );
}

export default VersionSelector;
