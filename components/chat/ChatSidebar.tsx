'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, MessageSquare, MoreHorizontal, Code, Sparkles, ChevronLeft, ChevronRight, User, Users, BookTemplate, Folder } from 'lucide-react';
import { ConversationItem } from './ConversationItem';
import { useTheme } from '@/contexts/theme-context';
import { useEffect, useState } from 'react';
import { UserButton, SignedIn, SignedOut, SignInButton, useAuth } from '@clerk/nextjs';

interface ChatSidebarProps {
  sessions: any[];
  currentSession: any;
  isCodeMode: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onNewChat: () => void;
  onSelectSession: (sessionId: string) => void;
  onGenerateExpertMode: () => void;
  onDeleteSession?: (sessionId: string) => void;
  onShareSession?: (sessionId: string) => void;
  onUpdateSessionTitle?: (sessionId: string, title: string) => void;
}

export function ChatSidebar({ 
  sessions, 
  currentSession, 
  isCodeMode, 
  isCollapsed,
  onToggleCollapse,
  onNewChat, 
  onSelectSession, 
  onGenerateExpertMode,
  onDeleteSession,
  onShareSession,
  onUpdateSessionTitle
}: ChatSidebarProps) {
  const { theme } = useTheme();
  const [isMobile, setIsMobile] = useState(false);
  const [isAutoCollapsed, setIsAutoCollapsed] = useState(false); // 跟踪是否是自动折叠
  const { isLoaded, isSignedIn } = useAuth();

  // 检测移动端和自动折叠
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // 自动折叠逻辑
    const handleResize = () => {
      const width = window.innerWidth;
      
      // 更新移动端状态
      setIsMobile(width < 768);
      
      // 自动折叠逻辑：当窗口宽度小于1024px时自动折叠侧边栏
      if (width < 1024 && !isCollapsed) {
        console.log('🔄 窗口缩小至', width + 'px，自动折叠侧边栏');
        setIsAutoCollapsed(true);
        onToggleCollapse();
      }
      // 当窗口宽度大于1200px且之前是自动折叠时，自动展开侧边栏
      else if (width >= 1200 && isCollapsed && isAutoCollapsed && width >= 768) {
        console.log('🔄 窗口放大至', width + 'px，自动展开侧边栏');
        setIsAutoCollapsed(false);
        onToggleCollapse();
      }
    };
    
    // 初始检查
    handleResize();
    
    // 添加resize监听器，使用防抖优化性能
    let timeoutId: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 150);
    };
    
    window.addEventListener('resize', debouncedResize);
    return () => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(timeoutId);
    };
  }, [isCollapsed, onToggleCollapse, isAutoCollapsed]);

  // 计算实际宽度
  const getWidth = () => {
    if (isCodeMode) return 0;
    if (isMobile) return isCollapsed ? 0 : 240;
    return isCollapsed ? 64 : 260;
  };

  return (
    <motion.div
      animate={{ 
        width: getWidth()
      }}
      transition={{ 
        duration: 0.3, 
        ease: "easeInOut"
      }}
      className={`border-r flex flex-col backdrop-blur-xl overflow-hidden sidebar-transition relative ${
        theme === "light" 
          ? "bg-white/95 border-emerald-200/40 shadow-sm" 
          : "bg-gray-950/95 border-emerald-700/30 shadow-xl"
      } ${isCodeMode ? 'hidden' : ''}`}
      style={{
        minWidth: isCodeMode ? 0 : isCollapsed ? (isMobile ? 0 : 64) : (isMobile ? 240 : 260),
        maxWidth: isCodeMode ? 0 : isCollapsed ? (isMobile ? 0 : 64) : (isMobile ? 240 : 260)
      }}
    >
      {/* 🎨 微妙的背景纹理 - 使用品牌色 */}
      <div className={`absolute inset-0 opacity-20 ${
        theme === "light" 
          ? "bg-gradient-to-br from-emerald-50/30 via-teal-50/20 to-cyan-50/30" 
          : "bg-gradient-to-br from-emerald-950/30 via-teal-950/20 to-cyan-950/30"
      }`} />
      
      {/* 🎨 顶部Logo区域 */}
      <div className="p-4 shrink-0 relative z-10">
        <div className="flex items-center justify-between">
          {/* Logo区域 - 与welcome界面保持一致 */}
          <motion.div 
            className={`flex items-center gap-3 relative group ${
              isCollapsed && !isMobile ? 'cursor-pointer' : ''
            }`}
            onClick={isCollapsed && !isMobile ? () => {
              setIsAutoCollapsed(false); // 用户手动操作，重置自动折叠状态
              onToggleCollapse();
            } : undefined}
            whileHover={{ scale: isCollapsed && !isMobile ? 1.05 : 1 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div 
              className="w-10 h-10 rounded-[10px] flex items-center justify-center shadow-lg relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #34D399 0%, #2DD4BF 50%, #22D3EE 100%)',
              }}
            >
              <Sparkles className="w-5 h-5 text-white relative z-10" />
              
              {/* 微妙的光泽效果 */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* 折叠状态下的展开提示 */}
              {isCollapsed && !isMobile && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ opacity: 1, scale: 1 }}
                  className="absolute inset-0 bg-black/20 rounded-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200"
                >
                  <ChevronRight className="w-4 h-4 text-white" />
                </motion.div>
              )}
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ 
                opacity: (isCollapsed && !isMobile) ? 0 : 1, 
                x: (isCollapsed && !isMobile) ? -10 : 0,
                width: (isCollapsed && !isMobile) ? 0 : 'auto'
              }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="flex flex-col overflow-hidden"
            >
              <span 
                className={`text-lg font-bold whitespace-nowrap ${
                  theme === "light" ? "text-gray-900" : "text-white"
                }`}
              >
                HeysMe AI
              </span>
            </motion.div>
          </motion.div>

          {/* 折叠按钮 - 简化设计 */}
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  console.log('Toggle sidebar clicked, current state:', isCollapsed);
                  setIsAutoCollapsed(false); // 用户手动操作，重置自动折叠状态
                  onToggleCollapse();
                }}
                className={`w-8 h-8 p-0 rounded-[10px] transition-all duration-200 hover:scale-105 ${
                  theme === "light"
                    ? "hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700"
                    : "hover:bg-emerald-900/30 text-emerald-400 hover:text-emerald-300"
                }`}
                title={isAutoCollapsed ? "侧边栏已自动折叠 (Ctrl+B)" : "折叠侧边栏 (Ctrl+B)"}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </motion.div>
          )}
        </div>
      </div>

      {/* 🎨 操作按钮区域 - 优化按钮设计 */}
      <div className={`pt-2 pb-4 shrink-0 relative z-10 ${isCollapsed && !isMobile ? 'px-4' : 'px-4'}`}>
        {(!isCollapsed || isMobile) && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3 sidebar-content-fade"
          >
            {/* 🎨 新建对话按钮 - 使用品牌色渐变 */}
            <button
              onClick={onNewChat}
              className="w-full flex items-center justify-start gap-3 h-9 px-4 rounded-[10px] font-medium transition-all duration-200 group relative overflow-hidden text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
              style={{
                background: 'linear-gradient(135deg, #34D399 0%, #2DD4BF 50%, #22D3EE 100%)',
              }}
            >
              <Plus className="w-4 h-4 relative z-10" />
              <span className="font-medium relative z-10">新建对话</span>
              {/* 微妙的悬停光泽 */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            </button>
            
            {/* 🎨 社区功能导航 */}
            <a
              href="/people"
              className={`w-full flex items-center justify-start gap-3 h-9 px-4 rounded-[10px] font-medium transition-all duration-200 group ${
                theme === "light"
                  ? "text-gray-600 bg-transparent hover:bg-emerald-50 hover:text-emerald-700"
                  : "text-gray-400 bg-transparent hover:bg-emerald-900/20 hover:text-emerald-300"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>数字身份广场</span>
            </a>
            
            <a
              href="/templates"
              className={`w-full flex items-center justify-start gap-3 h-9 px-4 rounded-[10px] font-medium transition-all duration-200 group ${
                theme === "light"
                  ? "text-gray-600 bg-transparent hover:bg-emerald-50 hover:text-emerald-700"
                  : "text-gray-400 bg-transparent hover:bg-emerald-900/20 hover:text-emerald-300"
              }`}
            >
              <BookTemplate className="w-4 h-4" />
              <span>灵感模板库</span>
            </a>
            
            {/* 🎨 内容管理导航 */}
            <a
              href="/content-manager"
              className={`w-full flex items-center justify-start gap-3 h-9 px-4 rounded-[10px] font-medium transition-all duration-200 group ${
                theme === "light"
                  ? "text-gray-600 bg-transparent hover:bg-emerald-50 hover:text-emerald-700"
                  : "text-gray-400 bg-transparent hover:bg-emerald-900/20 hover:text-emerald-300"
              }`}
            >
              <Folder className="w-4 h-4" />
              <span>内容管理</span>
            </a>
            
            {/* 🎨 专业模式测试按钮 - 透明背景，悬停时显示颜色，无边框 */}
            <button
              onClick={onGenerateExpertMode}
              className={`w-full flex items-center justify-start gap-3 h-9 px-4 rounded-[10px] font-medium transition-all duration-200 group ${
                theme === "light"
                  ? "text-gray-600 bg-transparent hover:bg-emerald-50 hover:text-emerald-700"
                  : "text-gray-400 bg-transparent hover:bg-emerald-900/20 hover:text-emerald-300"
              }`}
            >
              <Code className="w-4 h-4" />
              <span>专业模式测试</span>
            </button>
          </motion.div>
        )}

        {/* 🎨 折叠状态下的快捷按钮 - 与logo对齐 */}
        {isCollapsed && !isMobile && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3 flex flex-col"
          >
            <button
              onClick={onNewChat}
              className="w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200 group relative overflow-hidden text-white shadow-lg hover:shadow-xl transform hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #34D399 0%, #2DD4BF 50%, #22D3EE 100%)',
              }}
              title="新建对话"
            >
              <Plus className="w-4 h-4 relative z-10" />
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </button>
            
            <a
              href="/people"
              className={`w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200 ${
                theme === "light"
                  ? "text-gray-600 bg-transparent hover:bg-emerald-50 hover:text-emerald-700"
                  : "text-gray-400 bg-transparent hover:bg-emerald-900/20 hover:text-emerald-300"
              }`}
              title="数字身份广场"
            >
              <Users className="w-4 h-4" />
            </a>
            
            <a
              href="/templates"
              className={`w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200 ${
                theme === "light"
                  ? "text-gray-600 bg-transparent hover:bg-emerald-50 hover:text-emerald-700"
                  : "text-gray-400 bg-transparent hover:bg-emerald-900/20 hover:text-emerald-300"
              }`}
              title="灵感模板库"
            >
              <BookTemplate className="w-4 h-4" />
            </a>
            
            <a
              href="/content-manager"
              className={`w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200 ${
                theme === "light"
                  ? "text-gray-600 bg-transparent hover:bg-emerald-50 hover:text-emerald-700"
                  : "text-gray-400 bg-transparent hover:bg-emerald-900/20 hover:text-emerald-300"
              }`}
              title="内容管理"
            >
              <Folder className="w-4 h-4" />
            </a>
            
            <button
              onClick={onGenerateExpertMode}
              className={`w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200 ${
                theme === "light"
                  ? "text-gray-600 bg-transparent hover:bg-emerald-50 hover:text-emerald-700"
                  : "text-gray-400 bg-transparent hover:bg-emerald-900/20 hover:text-emerald-300"
              }`}
              title="专业模式测试"
            >
              <Code className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </div>

      {/* 🎨 会话列表 */}
      {(!isCollapsed || isMobile) && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 min-h-0 sidebar-content-fade relative z-10"
        >
          <div className={`px-4 py-2 ${
            theme === "light" ? "text-gray-500" : "text-gray-400"
          }`}>
            <span className="text-xs font-medium pl-2">最近对话</span>
          </div>
          
          <ScrollArea className="flex-1 brand-scrollbar">
            <div className="px-4 pb-4 space-y-1">
              {sessions.length > 0 ? (
                sessions.map((session, index) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <ConversationItem
                      session={session}
                      isActive={currentSession?.id === session.id}
                      isCollapsed={false}
                      onSelect={onSelectSession}
                      onDelete={onDeleteSession}
                      onShare={onShareSession}
                      onTitleUpdate={onUpdateSessionTitle}
                    />
                  </motion.div>
                ))
              ) : (
                <div className={`text-center p-8 ${theme === "light" ? "text-gray-400" : "text-gray-500"}`}>
                  <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 opacity-40" />
                  </div>
                  <p className="text-sm">暂无对话</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </motion.div>
      )}

      {/* 🎨 折叠状态下的会话指示器 */}
      {isCollapsed && !isMobile && sessions.length > 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col px-4 py-4 space-y-2 relative z-10"
        >
          {sessions.slice(0, 3).map((session, index) => (
            <ConversationItem
              key={session.id}
              session={session}
              isActive={currentSession?.id === session.id}
              isCollapsed={true}
              onSelect={onSelectSession}
              onDelete={onDeleteSession}
              onShare={onShareSession}
              onTitleUpdate={onUpdateSessionTitle}
            />
          ))}
          
          {sessions.length > 3 && (
            <div className={`text-xs text-center ${theme === "light" ? "text-gray-400" : "text-gray-500"}`}>
              +{sessions.length - 3}
            </div>
          )}
        </motion.div>
      )}
      
      {/* 🎨 折叠状态下的占位空间 */}
      {isCollapsed && !isMobile && (
        <div className="flex-1"></div>
      )}
      
      {/* 🎨 用户信息区域 - 优化设计 */}
      {isLoaded && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`shrink-0 border-t p-4 relative z-10 ${
            theme === "light" 
              ? "border-emerald-200/40 bg-emerald-50/30" 
              : "border-emerald-700/30 bg-emerald-950/20"
          }`}
        >
          <SignedIn>
            {/* 展开状态下的用户信息 */}
            {(!isCollapsed || isMobile) && (
              <div className="flex items-center gap-3">
                <UserButton 
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: "w-8 h-8 ring-2 ring-emerald-500/30",
                      userButtonPopoverCard: {
                        pointerEvents: "initial",
                        zIndex: 1000
                      }
                    }
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium ${
                    theme === "light" ? "text-gray-900" : "text-gray-100"
                  }`}>
                    用户中心
                  </div>
                  <div className={`text-xs ${
                    theme === "light" ? "text-emerald-600" : "text-emerald-400"
                  }`}>
                    点击头像管理账户
                  </div>
                </div>
              </div>
            )}
            
            {/* 折叠状态下的用户按钮 */}
            {isCollapsed && !isMobile && (
              <div className="flex justify-center">
                <UserButton 
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: "w-8 h-8 ring-2 ring-emerald-500/30",
                      userButtonPopoverCard: {
                        pointerEvents: "initial",
                        zIndex: 1000
                      }
                    }
                  }}
                />
              </div>
            )}
          </SignedIn>
          
          <SignedOut>
            {/* 未登录状态 */}
            {(!isCollapsed || isMobile) && (
              <div className="space-y-2">
                <SignInButton mode="modal">
                  <Button 
                    className={`w-full justify-start gap-3 h-10 rounded-[10px] transition-all duration-200 ${
                      theme === "light"
                        ? "bg-white/80 hover:bg-emerald-50 text-emerald-700 hover:text-emerald-800"
                        : "bg-gray-800/60 hover:bg-emerald-900/20 text-emerald-300 hover:text-emerald-200"
                    }`}
                    variant="ghost"
                  >
                    <User className="w-4 h-4" />
                    登录账户
                  </Button>
                </SignInButton>
              </div>
            )}
            
            {/* 折叠状态下的登录按钮 */}
            {isCollapsed && !isMobile && (
              <div className="flex justify-center">
                <SignInButton mode="modal">
                  <Button 
                    size="sm"
                    variant="ghost"
                    className={`w-8 h-8 p-0 rounded-[10px] transition-all duration-200 ${
                      theme === "light"
                        ? "bg-white/80 hover:bg-emerald-50 text-emerald-700 hover:text-emerald-800"
                        : "bg-gray-800/60 hover:bg-emerald-900/20 text-emerald-300 hover:text-emerald-200"
                    }`}
                  >
                    <User className="w-4 h-4" />
                  </Button>
                </SignInButton>
              </div>
            )}
          </SignedOut>
        </motion.div>
      )}
    </motion.div>
  );
} 