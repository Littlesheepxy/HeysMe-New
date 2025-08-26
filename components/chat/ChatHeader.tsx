'use client';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Eye, ChevronDown, ArrowLeft, Folder } from 'lucide-react';
import { useTheme } from '@/contexts/theme-context';
import { motion } from 'framer-motion';
import { PrivacyToggle } from '@/components/ui/privacy-toggle';
import { ThemeToggle } from '@/components/navigation/theme-toggle';

interface ChatHeaderProps {
  chatMode?: 'normal' | 'professional';
  onModeChange?: (mode: 'normal' | 'professional') => void;
  isCodeMode?: boolean;
  onBackToChat?: () => void;
  isPrivacyMode?: boolean;
  onPrivacyModeChange?: (enabled: boolean) => void;
}

export function ChatHeader({ 
  chatMode = 'normal', 
  onModeChange,
  isCodeMode = false,
  onBackToChat,
  isPrivacyMode = false,
  onPrivacyModeChange
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
            
            {/* 下拉模式切换器 - 仅在非代码模式下显示 */}
            {!isCodeMode && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <motion.button
                          className={`flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-md transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 ${
                            theme === "light" ? "text-gray-700" : "text-gray-300"
                          }`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {chatMode === 'normal' ? '普通模式' : '专业模式'}
                          <ChevronDown className="w-3 h-3" />
                        </motion.button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-48">
                        <DropdownMenuItem 
                          onClick={() => handleModeSelect('normal')}
                          className="flex flex-col items-start gap-1 p-3"
                        >
                          <div className="font-medium">普通模式</div>
                          <div className="text-xs text-gray-500">
                            AI助手智能引导对话
                          </div>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleModeSelect('professional')}
                          className="flex flex-col items-start gap-1 p-3"
                        >
                          <div className="font-medium">专业模式</div>
                          <div className="text-xs text-gray-500">
                            直达代码生成引擎
                          </div>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <div className="space-y-2">
                      <div className="font-medium">模式切换</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        选择适合您的对话模式：普通模式提供智能引导，专业模式直接生成代码
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          
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