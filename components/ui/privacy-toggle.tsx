'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ShieldCheck, Info, AlertTriangle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

interface PrivacyToggleProps {
  isPrivacyMode: boolean;
  onToggle: (enabled: boolean) => void;
  className?: string;
  showDescription?: boolean;
  variant?: 'default' | 'compact' | 'card';
}

export function PrivacyToggle({
  isPrivacyMode,
  onToggle,
  className,
  showDescription = true,
  variant = 'default'
}: PrivacyToggleProps) {
  const { theme } = useTheme();
  const [showWarning, setShowWarning] = useState(false);

  // 当切换到非隐私模式时显示警告
  useEffect(() => {
    if (!isPrivacyMode) {
      setShowWarning(true);
      const timer = setTimeout(() => setShowWarning(false), 5000);
      return () => clearTimeout(timer);
    } else {
      setShowWarning(false);
    }
  }, [isPrivacyMode]);

  const handleToggle = (checked: boolean) => {
    onToggle(checked);
  };

  if (variant === 'compact') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.button
              onClick={() => handleToggle(!isPrivacyMode)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={cn(
                "relative w-6 h-6 rounded-full transition-all duration-300 flex items-center justify-center",
                "hover:bg-gray-100 dark:hover:bg-gray-800",
                isPrivacyMode
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-gray-400 dark:text-gray-500",
                className
              )}
            >
              <Shield className="w-4 h-4" />
              {isPrivacyMode && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-500 rounded-full"
                />
              )}
            </motion.button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <div className="text-center">
              <div className="font-medium mb-1">
                {isPrivacyMode ? '🔒 隐私模式已启用' : '💾 标准模式'}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {isPrivacyMode 
                  ? '文件仅在内存中处理，不会保存到服务器。点击切换到标准模式。'
                  : '文件将安全存储到服务器，支持历史查看。点击切换到隐私模式。'
                }
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (variant === 'card') {
    return (
      <div className={cn(
        "p-4 rounded-xl border transition-all duration-300",
        isPrivacyMode 
          ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30"
          : "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50",
        className
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ 
                scale: isPrivacyMode ? 1.1 : 1,
                rotate: isPrivacyMode ? 5 : 0
              }}
              transition={{ duration: 0.3 }}
              className={cn(
                "p-2 rounded-lg",
                isPrivacyMode 
                  ? "bg-emerald-100 dark:bg-emerald-900/50"
                  : "bg-gray-100 dark:bg-gray-700"
              )}
            >
              {isPrivacyMode ? (
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Shield className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              )}
            </motion.div>
            <div>
              <Label className="text-sm font-medium">
                隐私保护模式
              </Label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {isPrivacyMode ? '文件不会被存储到服务器' : '文件将被存储以便后续使用'}
              </p>
            </div>
          </div>
          <Switch
            checked={isPrivacyMode}
            onCheckedChange={handleToggle}
            className="data-[state=checked]:bg-emerald-500"
          />
        </div>

        {showDescription && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700"
          >
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              {isPrivacyMode ? (
                <>
                  <p className="flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                    文件仅在内存中处理，不存储
                  </p>
                  <p className="flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                    解析结果临时保存，会话结束后自动清理
                  </p>
                  <p className="flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                    最大隐私保护，适合敏感文档
                  </p>
                </>
              ) : (
                <>
                  <p className="flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-blue-500"></span>
                    文件存储到服务器，便于管理
                  </p>
                  <p className="flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-blue-500"></span>
                    解析结果持久保存，支持历史查看
                  </p>
                  <p className="flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-blue-500"></span>
                    更好的用户体验，支持多设备同步
                  </p>
                </>
              )}
            </div>
          </motion.div>
        )}
      </div>
    );
  }

  // default variant
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ 
              scale: isPrivacyMode ? 1.1 : 1,
              color: isPrivacyMode ? '#10b981' : '#6b7280'
            }}
            transition={{ duration: 0.2 }}
          >
            {isPrivacyMode ? (
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
            ) : (
              <Shield className="w-5 h-5 text-gray-500" />
            )}
          </motion.div>
          <div>
            <Label className="text-sm font-medium flex items-center gap-2">
              隐私保护模式
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-3 h-3 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">
                      启用后，上传的文件仅在内存中处理，不会存储到服务器。
                      适合处理包含敏感信息的文档。
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {isPrivacyMode ? '文件不会被存储到服务器' : '文件将被存储以便后续使用'}
            </p>
          </div>
        </div>
        <Switch
          checked={isPrivacyMode}
          onCheckedChange={handleToggle}
          className="data-[state=checked]:bg-emerald-500"
        />
      </div>

      {/* 警告提示 */}
      <AnimatePresence>
        {showWarning && !isPrivacyMode && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                <strong>提醒：</strong>关闭隐私模式后，上传的文件将被存储到服务器。
                如果您的文件包含敏感信息，建议保持隐私模式开启。
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 功能说明 */}
      {showDescription && (
        <div className={cn(
          "p-3 rounded-lg text-xs space-y-2",
          isPrivacyMode 
            ? "bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800"
            : "bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800"
        )}>
          <div className={cn(
            "font-medium",
            isPrivacyMode ? "text-emerald-700 dark:text-emerald-300" : "text-blue-700 dark:text-blue-300"
          )}>
            {isPrivacyMode ? '🔒 隐私模式特性' : '💾 标准模式特性'}
          </div>
          <div className={cn(
            "space-y-1",
            isPrivacyMode ? "text-emerald-600 dark:text-emerald-400" : "text-blue-600 dark:text-blue-400"
          )}>
            {isPrivacyMode ? (
              <>
                <p>• 文件仅在内存中处理，不存储到服务器</p>
                <p>• 解析结果临时保存，会话结束后自动清理</p>
                <p>• 最大程度保护文档隐私和安全</p>
                <p>• 适合处理包含敏感信息的文档</p>
              </>
            ) : (
              <>
                <p>• 文件安全存储到服务器，便于管理</p>
                <p>• 解析结果持久保存，支持历史查看</p>
                <p>• 支持多设备同步和分享功能</p>
                <p>• 更好的用户体验和功能完整性</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 