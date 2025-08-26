'use client';

import { useRef, useEffect, useState, memo, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Paperclip, Sparkles, Code, ExternalLink } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { ThinkingLoader } from '@/components/ui/unified-loading';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useTheme } from '@/contexts/theme-context';
import { motion } from 'framer-motion';
import { EnhancedInputBox } from '@/components/ui/enhanced-input-box';

interface ChatModeViewProps {
  currentSession: any;
  isGenerating: boolean;
  onSendMessage: (message: string, option?: any) => void;
  sessionId?: string;
  onFileUpload?: (file: File) => void;
}

// 🔧 优化：使用React.memo减少不必要的重新渲染
export const ChatModeView = memo(function ChatModeView({
  currentSession,
  isGenerating,
  onSendMessage,
  sessionId,
  onFileUpload
}: ChatModeViewProps) {
  const { theme } = useTheme();
  
  // 🚀 内部状态管理 - 避免父组件重渲染
  const [inputValue, setInputValue] = useState("");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previousSessionId, setPreviousSessionId] = useState<string | undefined>(sessionId);

  // 🔧 优化：使用useMemo缓存消息列表
  const currentMessages = useMemo(() => {
    return currentSession?.conversationHistory || [];
  }, [currentSession?.conversationHistory]);

  // 🔧 新增：检测是否有代码文件
  const hasCodeFiles = useMemo(() => {
    return currentMessages.some((message: any) => 
      message.metadata?.projectFiles && Array.isArray(message.metadata.projectFiles) && message.metadata.projectFiles.length > 0
    );
  }, [currentMessages]);

  // 🔧 新增：获取代码文件数量
  const codeFileCount = useMemo(() => {
    const projectMessages = currentMessages.filter((msg: any) => 
      msg.metadata?.projectFiles && Array.isArray(msg.metadata.projectFiles)
    );
    
    if (projectMessages.length > 0) {
      const latestProjectMessage = projectMessages[projectMessages.length - 1];
      return latestProjectMessage.metadata?.projectFiles?.length || 0;
    }
    
    return 0;
  }, [currentMessages]);

  // 🔧 新增：切换到代码模式的处理函数
  const handleViewCode = () => {
    // 这里需要通过props传递给父组件来切换模式
    console.log('🔄 [查看代码] 切换到代码模式，代码文件数量:', codeFileCount);
    
    // 触发页面级别的模式切换 - 需要添加到props中
    if ((window as any).switchToCodeMode) {
      (window as any).switchToCodeMode();
    }
  };

  // 🔧 优化：减少会话切换日志
  useEffect(() => {
    if (sessionId !== previousSessionId) {
      console.log('🔄 [ChatModeView] 会话切换:', {
        from: previousSessionId,
        to: sessionId
      });
      setPreviousSessionId(sessionId);
    }
  }, [sessionId, previousSessionId]);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages]);

  // 🚀 性能优化：缓存回调函数
  const handleSendClick = useCallback(() => {
    if (inputValue.trim()) {
      onSendMessage(inputValue);
      setInputValue(""); // 清空输入框
    }
  }, [inputValue, onSendMessage]);

  const handleFileUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onFileUpload) {
      onFileUpload(file);
    }
    // 清空input值，以便重复选择同一文件
    if (e.target) {
      e.target.value = '';
    }
  }, [onFileUpload]);

  // 🚀 性能优化：缓存onSendWithFiles回调
  const handleSendWithFiles = useCallback((message: string, files: any[]) => {
    console.log('发送带文件的消息:', message, files);
    onSendMessage(message, { files });
  }, [onSendMessage]);

  return (
    <>
      {/* 🎨 消息列表 - 简约白色背景 */}
      <div className={`flex-1 overflow-hidden min-h-0 ${
        theme === "light" ? "bg-white" : "bg-gray-900"
      }`}>
        <ScrollArea className="h-full">
          <div className="py-8">
            {currentMessages.length === 0 && !isGenerating ? (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <p className="text-lg mb-2">开始新的对话</p>
                  <p className="text-sm">发送消息开始创建您的个人页面</p>
                </div>
              </div>
            ) : (
              <>
                {currentMessages.map((message: any, index: number) => (
                  <MessageBubble
                    key={`${sessionId}-${message.id}-${index}`}
                    message={message}
                    isLast={index === currentMessages.length - 1}
                    isGenerating={isGenerating && index === currentMessages.length - 1}
                    onSendMessage={onSendMessage}
                    sessionId={sessionId}
                  />
                ))}
                
                {/* 🔧 修复：用户发送消息后，AI正在生成时显示思考状态 */}
                {isGenerating && currentMessages.length > 0 && !currentMessages.some((msg: any) => msg.metadata?.streaming) && (
                  <div className="flex gap-4 max-w-4xl mx-auto px-6 py-4">
                    {/* AI头像 - 与文本对齐 */}
                    <div className="flex-shrink-0 pt-1">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-gray-100 text-gray-600">
                          <Sparkles className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    
                    {/* 思考状态 */}
                    <div className="flex-1">
                      <div className="inline-block text-gray-800">
                        <ThinkingLoader 
                          text="正在思考中"
                          size="sm"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* 🎨 优化：代码文件提示条 - 与对话框样式一致 */}
      {hasCodeFiles && (
        <div className="py-4 px-6" style={{backgroundColor: 'transparent'}}>
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`max-w-4xl mx-auto rounded-xl relative overflow-hidden shadow-sm border ${
              theme === "light" 
                ? "bg-gradient-to-r from-emerald-50 to-blue-50 border-emerald-200" 
                : "bg-gradient-to-r from-emerald-900/30 to-blue-900/30 border-emerald-700"
            }`}
          >
            {/* 背景装饰 */}
            <div className="absolute inset-0 opacity-30">
              <div className={`absolute right-0 top-0 w-32 h-full ${
                theme === "light" 
                  ? "bg-gradient-to-l from-emerald-100/50 to-transparent" 
                  : "bg-gradient-to-l from-emerald-800/20 to-transparent"
              }`}></div>
            </div>
            
            <div className="relative p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* 状态指示器 */}
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full animate-pulse ${
                      theme === "light" ? "bg-emerald-500" : "bg-emerald-400"
                    }`}></div>
                    <div className={`w-1 h-1 rounded-full ${
                      theme === "light" ? "bg-emerald-400" : "bg-emerald-500"
                    }`}></div>
                    <div className={`w-1 h-1 rounded-full ${
                      theme === "light" ? "bg-emerald-300" : "bg-emerald-600"
                    }`}></div>
                  </div>
                  
                  {/* 文字信息 */}
                  <div className="flex flex-col">
                    <span className={`text-sm font-semibold ${
                      theme === "light" ? "text-emerald-800" : "text-emerald-200"
                    }`}>
                      🎉 代码生成完成
                    </span>
                    <span className={`text-xs ${
                      theme === "light" ? "text-emerald-600" : "text-emerald-400"
                    }`}>
                      已生成 {codeFileCount} 个代码文件，准备预览和部署
                    </span>
                  </div>
                </div>
                
                {/* 操作按钮 */}
                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleViewCode}
                    size="sm"
                    className={`h-9 px-6 text-sm font-medium shadow-lg transition-all duration-300 transform hover:scale-105 ${
                      theme === "light"
                        ? "bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white"
                        : "bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white"
                    }`}
                  >
                    <Code className="w-4 h-4 mr-2" />
                    进入代码模式
                    <ExternalLink className="w-3 h-3 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* 🎨 底部输入框 - 修复高度问题 */}
      <div className={`border-t shrink-0 transition-all duration-300 ${
        theme === "light" 
          ? "bg-white border-gray-200" 
          : "bg-gray-900 border-gray-700"
      }`}>
        <div className="p-4">
          <div className="max-w-4xl mx-auto">
            <EnhancedInputBox
              value={inputValue}
              onChange={setInputValue}
              onSend={handleSendClick}

              onFileUpload={onFileUpload}
              onSendWithFiles={handleSendWithFiles}
              placeholder="发送消息..."
              disabled={isGenerating}
              isGenerating={isGenerating}
              inputId="chat-input"
              className="w-full"
              sessionId={sessionId}
              isPrivacyMode={false}
            />
          </div>
        </div>
        
        {/* 🎨 底部装饰线 - 品牌色 */}
        <div className="h-1 bg-brand-gradient opacity-30"></div>


      </div>
    </>
  );
}); 