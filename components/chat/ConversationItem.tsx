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

import { useState, useCallback, useRef, useEffect } from 'react';
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

export function ConversationItem({
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
  
  // 消息数量
  const messageCount = session.conversationHistory?.length || 0;
  
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

  // 折叠状态下的简化显示
  if (isCollapsed) {
    return (
      <motion.div
        whileHover={{ scale: 1.05 }}
        className={`w-10 h-10 rounded-full cursor-pointer transition-all duration-200 flex items-center justify-center relative group ${
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
      >
        <MessageSquare className="w-3.5 h-3.5" />
        
        {/* 标题生成指示器 */}
        {isGenerating && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full flex items-center justify-center"
          >
            <Sparkles className="w-2 h-2 text-white" />
          </motion.div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`group relative ${className}`}
    >
      <div
        className={`w-full flex items-center justify-between gap-2 h-10 px-3 rounded-[10px] font-medium transition-all duration-200 cursor-pointer ${
          isActive
            ? theme === "light"
              ? "bg-emerald-50 text-emerald-700 shadow-sm"
              : "bg-emerald-900/25 text-emerald-300 shadow-sm"
            : theme === "light"
              ? "text-gray-600 bg-transparent hover:bg-emerald-50 hover:text-emerald-700"
              : "text-gray-400 bg-transparent hover:bg-emerald-900/20 hover:text-emerald-300"
        }`}
        onClick={handleClick}
      >
        {/* 会话图标 */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
          
          {/* 标题显示/编辑 */}
          <div className="flex-1 min-w-0">
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
                    className="h-6 px-2 text-xs border-0 bg-white/80 focus:bg-white"
                    placeholder="输入标题..."
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={saveEdit}
                  >
                    <Check className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
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
                  <span className="text-sm truncate flex-1">
                    {displayTitle}
                  </span>
                  
                  {/* 标题状态指示器 */}
                  {isGenerating && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="flex-shrink-0"
                    >
                      <Sparkles className="w-3 h-3 text-emerald-500" />
                    </motion.div>
                  )}
                  
                  {titleError && (
                    <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" title={titleError} />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* 操作菜单 */}
        {!isEditing && (
          <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`opacity-0 group-hover:opacity-100 w-6 h-6 p-0 rounded-full transition-all duration-200 ${
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
      
      {/* 会话信息提示 */}
      {messageCount > 0 && (
        <div className={`text-xs px-3 mt-1 ${
          theme === "light" ? "text-gray-400" : "text-gray-500"
        }`}>
          {messageCount} 条消息
        </div>
      )}
    </motion.div>
  );
} 