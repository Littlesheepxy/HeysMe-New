/**
 * 会话项组件
 * 
 * 功能：
 * - 显示会话标题（自动生成或手动设置）
 * - 支持标题编辑
 * - 会话操作菜单（重命名、删除、生成标题等）
 * - 加载状态和错误处理
 */

'use client';

import { useState, useCallback, useRef, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  MoreHorizontal, 
  Edit2, 
  Trash2, 
  RefreshCw, 
  Check, 
  X,
  Sparkles,
  Copy,
  Share
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/contexts/theme-context';
import { useConversationTitle } from '@/hooks/use-title-generation';
import { SessionData } from '@/lib/types/session';

interface ConversationItemProps {
  session: SessionData;
  isActive: boolean;
  isCollapsed?: boolean;
  onSelect: (sessionId: string) => void;
  onDelete?: (sessionId: string) => void;
  onShare?: (sessionId: string) => void;
  onTitleUpdate?: (sessionId: string, title: string) => void;
  className?: string;
}

export const ConversationItem = memo(function ConversationItem({
  session,
  isActive,
  isCollapsed = false,
  onSelect,
  onDelete,
  onShare,
  onTitleUpdate,
  className = ''
}: ConversationItemProps) {
  const { theme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [editingTitle, setEditingTitle] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);

  const {
    title: generatedTitle,
    isGenerating,
    error: titleError,
    generateTitle,
    setTitle
  } = useConversationTitle(session.id);

  // 获取显示标题
  const displayTitle = session.title || generatedTitle || `会话 ${session.id.slice(-6)}`;
  
  // 是否有自定义标题
  const hasCustomTitle = Boolean(session.title);

  // 开始编辑
  const startEditing = useCallback(() => {
    setEditingTitle(displayTitle);
    setIsEditing(true);
    setIsMenuOpen(false);
    
    // 延迟聚焦以确保输入框已渲染
    setTimeout(() => {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    }, 50);
  }, [displayTitle]);

  // 保存编辑
  const saveEdit = useCallback(() => {
    const newTitle = editingTitle.trim();
    if (newTitle && newTitle !== displayTitle) {
      onTitleUpdate?.(session.id, newTitle);
      setTitle(newTitle);
    }
    setIsEditing(false);
    setEditingTitle('');
  }, [editingTitle, displayTitle, session.id, onTitleUpdate, setTitle]);

  // 取消编辑
  const cancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditingTitle('');
  }, []);

  // 处理键盘事件
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  }, [saveEdit, cancelEdit]);

  // 生成标题
  const handleGenerateTitle = useCallback(async () => {
    setIsMenuOpen(false);
    await generateTitle();
  }, [generateTitle]);

  // 复制会话ID
  const handleCopyId = useCallback(() => {
    navigator.clipboard.writeText(session.id);
    setIsMenuOpen(false);
  }, [session.id]);

  // 删除会话
  const handleDelete = useCallback(() => {
    onDelete?.(session.id);
    setIsMenuOpen(false);
  }, [session.id, onDelete]);

  // 分享会话
  const handleShare = useCallback(() => {
    onShare?.(session.id);
    setIsMenuOpen(false);
  }, [session.id, onShare]);

  // 点击会话项
  const handleClick = useCallback(() => {
    if (!isEditing) {
      onSelect(session.id);
    }
  }, [isEditing, onSelect, session.id]);

  // 自动聚焦编辑输入框
  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [isEditing]);



  // 折叠状态下的简化显示 - 移除过度动画
  if (isCollapsed) {
    return (
      <div
        className={`w-10 h-10 rounded-full cursor-pointer transition-transform duration-150 hover:scale-105 flex items-center justify-center relative group ${
          isActive
            ? theme === "light"
              ? "bg-emerald-100 text-emerald-700"
              : "bg-emerald-900/30 text-emerald-300"
            : theme === "light"
              ? "text-gray-600 bg-transparent hover:bg-emerald-50 hover:text-emerald-700"
              : "text-gray-400 bg-transparent hover:bg-emerald-900/20 hover:text-emerald-300"
        } ${className}`}
        onClick={handleClick}
        title={displayTitle}
        style={{ 
          transform: 'translateZ(0)', // 硬件加速
          contain: 'layout style' // 隔离重排
        }}
      >
        <MessageSquare className="w-3.5 h-3.5" />
        
        {/* 标题生成指示器 - 使用CSS动画替代Framer Motion */}
        {isGenerating && (
          <div
            className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full flex items-center justify-center animate-spin"
          >
            <Sparkles className="w-2 h-2 text-white" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`group relative ${className}`}>
      <div
        className={`w-full flex items-center gap-2 h-10 px-3 rounded-[10px] font-medium transition-all duration-150 cursor-pointer ${
          isActive
            ? theme === "light"
              ? "bg-emerald-50 text-emerald-700 shadow-sm"
              : "bg-emerald-900/25 text-emerald-300 shadow-sm"
            : theme === "light"
              ? "text-gray-600 bg-transparent hover:bg-emerald-50 hover:text-emerald-700"
              : "text-gray-400 bg-transparent hover:bg-emerald-900/20 hover:text-emerald-300"
        }`}
        onClick={handleClick}
        style={{
          // 启用硬件加速和渲染隔离
          transform: 'translateZ(0)',
          contain: 'layout style paint'
        }}
      >
        {/* 会话图标 */}
        <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
        
        {/* 标题显示/编辑 - 使用flex-1但确保不会挤压右侧按钮 */}
        <div className="flex-1 min-w-0 mr-2">
            <AnimatePresence mode="wait">
              {isEditing ? (
                <motion.div
                  key="editing"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex items-center gap-1"
                >
                  <Input
                    ref={editInputRef}
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={saveEdit}
                    className="flex-1 h-6 px-2 text-xs border-0 bg-white/80 focus:bg-white min-w-0"
                    placeholder="输入标题..."
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 flex-shrink-0"
                    onClick={saveEdit}
                  >
                    <Check className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 flex-shrink-0"
                    onClick={cancelEdit}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="display"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-1 min-w-0"
                >
                  <div 
                    className="text-sm flex-1 min-w-0"
                    title={displayTitle}
                  >
                    <span className="block truncate">
                      {displayTitle}
                    </span>
                  </div>
                  
                  {/* 标题状态指示器 - 使用CSS动画提升性能 */}
                  {isGenerating && (
                    <div className="flex-shrink-0 animate-spin">
                      <Sparkles className="w-3 h-3 text-emerald-500" />
                    </div>
                  )}
                  
                  {titleError && (
                    <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" title={titleError} />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
        </div>

        {/* 操作菜单 - 确保始终可见 */}
        {!isEditing && (
          <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`opacity-0 group-hover:opacity-100 w-6 h-6 p-0 rounded-full transition-all duration-200 flex-shrink-0 ml-1 ${
                  theme === "light"
                    ? "hover:bg-emerald-100 text-emerald-500 hover:text-emerald-700"
                    : "hover:bg-emerald-800/50 text-emerald-400 hover:text-emerald-300"
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={startEditing}>
                <Edit2 className="w-4 h-4 mr-2" />
                重命名
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={handleGenerateTitle}
                disabled={isGenerating}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                {hasCustomTitle ? '重新生成标题' : '生成标题'}
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={handleCopyId}>
                <Copy className="w-4 h-4 mr-2" />
                复制会话ID
              </DropdownMenuItem>
              
              {onShare && (
                <DropdownMenuItem onClick={handleShare}>
                  <Share className="w-4 h-4 mr-2" />
                  分享会话
                </DropdownMenuItem>
              )}
              
              <DropdownMenuSeparator />
              
              {onDelete && (
                <DropdownMenuItem 
                  onClick={handleDelete}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  删除会话
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      

    </div>
  );
}); 