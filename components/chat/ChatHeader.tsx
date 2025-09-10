'use client';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Eye, ChevronDown, ArrowLeft, Folder } from 'lucide-react';
import { useTheme } from '@/contexts/theme-context';
import { motion } from 'framer-motion';
import { PrivacyToggle } from '@/components/ui/privacy-toggle';
import { ThemeToggle } from '@/components/navigation/theme-toggle';
import { FloatingStageIndicator } from '@/components/ui/stage-indicator';
import ModelSelector from '@/components/chat/ModelSelector';

interface ChatHeaderProps {
  chatMode?: 'normal' | 'professional';
  onModeChange?: (mode: 'normal' | 'professional') => void;
  isCodeMode?: boolean;
  onBackToChat?: () => void;
  isPrivacyMode?: boolean;
  onPrivacyModeChange?: (enabled: boolean) => void;
  // 🆕 阶段指示器相关
  currentStage?: string;
  progress?: number;
  sessionMode?: string;
  hasStartedChat?: boolean;
}

export function ChatHeader({ 
  chatMode = 'normal', 
  onModeChange,
  isCodeMode = false,
  onBackToChat,
  isPrivacyMode = false,
  onPrivacyModeChange,
  currentStage,
  progress,
  sessionMode,
  hasStartedChat = false
}: ChatHeaderProps) {
  const { theme } = useTheme();

  const handleModeSelect = (mode: 'normal' | 'professional') => {
    onModeChange?.(mode);
  };

  return (
    <header 
      className={`transition-all duration-300 backdrop-blur-xl ${
        theme === "light" 
          ? "bg-white/90" 
          : "bg-gray-900/90"
      }`}
    >
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* 左侧区域 */}
          <div className="flex items-center gap-4">
            {/* 代码模式下显示返回按钮 */}
            {isCodeMode && onBackToChat && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onBackToChat();
                }}
                className={`flex items-center gap-2 ${
                  theme === "light" ? "text-gray-600 hover:text-gray-800" : "text-gray-400 hover:text-gray-200"
                }`}
              >
                <ArrowLeft className="w-4 h-4" />
                返回对话
              </Button>
            )}
            
            {/* AI模型选择器 - 仅在非代码模式下显示 */}
            {!isCodeMode && (
              <ModelSelector />
            )}
          </div>
          
          {/* 中间区域 - 悬浮阶段指示器 (已开始聊天时显示) */}
          {currentStage && progress !== undefined && progress >= 0 && hasStartedChat && (
            <div className="flex-1 flex justify-center ml-[200px]">
              <FloatingStageIndicator
                currentStage={currentStage}
                percentage={progress}
                mode={sessionMode || (isCodeMode ? 'coding' : 'chat')}
              />
            </div>
          )}
          
          {/* 右侧区域 */}
          <div className="flex items-center gap-3">
            {/* 隐私模式开关 */}
            {onPrivacyModeChange && (
              <PrivacyToggle
                isPrivacyMode={isPrivacyMode}
                onToggle={onPrivacyModeChange}
                variant="compact"
              />
            )}
            
            {/* 主题切换 */}
            <ThemeToggle size="sm" />
            
            {/* 工作台按钮 */}
            <Button
              variant="ghost"
              size="sm"
              asChild
              className={`rounded-lg transition-all duration-300 h-8 px-2 text-sm ${
                theme === "light"
                  ? "text-emerald-700 hover:bg-emerald-50"
                  : "text-emerald-400 hover:bg-emerald-900/20"
              }`}
            >
              <a href="/dashboard" className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                工作台
              </a>
            </Button>
            
            {/* 内容管理按钮 */}
            <Button
              variant="ghost"
              size="sm"
              asChild
              className={`rounded-lg transition-all duration-300 h-8 px-2 text-sm ${
                theme === "light"
                  ? "text-emerald-700 hover:bg-emerald-50"
                  : "text-emerald-400 hover:bg-emerald-900/20"
              }`}
            >
              <a href="/content-manager" className="flex items-center gap-1">
                <Folder className="w-3 h-3" />
                内容
              </a>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
} 