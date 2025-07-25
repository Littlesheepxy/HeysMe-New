'use client';

import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, ExternalLink, Send, CheckCircle, Paperclip, Eye, Share2 } from 'lucide-react';
import { useTheme } from '@/contexts/theme-context';
import { MessageBubble } from './MessageBubble';
import { CodePreviewToggle } from '@/components/editor/CodePreviewToggle';
import { ShareDialog } from '@/components/dialogs/share-dialog';
import { EnhancedInputBox } from '@/components/ui/enhanced-input-box';

interface CodeModeViewProps {
  currentSession: any;
  generatedCode: any[];
  inputValue: string;
  setInputValue: (value: string) => void;
  isGenerating: boolean;
  onBack: () => void;
  onSendMessage: () => void;
  onSendChatMessage?: (message: string, options?: any) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onDownload: () => void;
  onDeploy: () => void;
  onEditCode: (filename: string) => void;
  getReactPreviewData: () => any;
  onFileUpload?: (file: File) => void;
}

export function CodeModeView({
  currentSession,
  generatedCode,
  inputValue,
  setInputValue,
  isGenerating,
  onBack,
  onSendMessage,
  onSendChatMessage,
  onKeyPress,
  onDownload,
  onDeploy,
  onEditCode,
  getReactPreviewData,
  onFileUpload
}: CodeModeViewProps) {
  const { theme } = useTheme();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentSession?.conversationHistory]);

  // 处理分享功能
  const handleShare = async (shareData: any) => {
    console.log('分享数据:', shareData);
    
    try {
      // 根据分享类型调用不同的API
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: shareData.type,
          config: shareData.config,
          pageId: currentSession?.id,
          pageTitle: getPageTitle(),
          pageContent: getReactPreviewData(),
          conversationHistory: currentSession?.conversationHistory
        }),
      });

      if (!response.ok) {
        throw new Error('分享失败');
      }

      const result = await response.json();
      
      if (result.success) {
        // 显示成功提示
        console.log('分享成功:', result);
        // TODO: 显示成功toast
      }
    } catch (error) {
      console.error('分享失败:', error);
      // TODO: 显示错误toast
    }
  };

  // 获取页面标题
  const getPageTitle = () => {
    if (currentSession?.conversationHistory?.length > 0) {
      const firstMessage = currentSession.conversationHistory[0];
      return firstMessage.content?.slice(0, 50) + '...' || '我的个人页面';
    }
    return '我的个人页面';
  };

  const handleFileUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onFileUpload) {
      onFileUpload(file);
    }
    // 清空input值，以便重复选择同一文件
    if (e.target) {
      e.target.value = '';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* 主要内容区域 */}
      <div className="flex-1 flex h-full">
        {/* 左侧对话区域 */}
        <div className="w-1/3 flex flex-col border-r h-full">
          {/* 消息列表 */}
          <div className="flex-1 overflow-hidden min-h-0">
            <ScrollArea className="h-full">
              <div className="py-4">
                {currentSession?.conversationHistory?.map((message: any, index: number) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isLast={index === (currentSession?.conversationHistory?.length || 0) - 1}
                    isGenerating={isGenerating}
                  />
                ))}
                
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </div>

          {/* 底部对话输入框 - 优化布局 */}
          <div className={`border-t p-4 shrink-0 transition-all duration-300 ${
            theme === "light" 
              ? "bg-white border-gray-100" 
              : "bg-gray-900 border-gray-700"
          }`}>


            {/* 增强输入框区域 */}
                        <EnhancedInputBox
              value={inputValue}
              onChange={setInputValue}
              onSend={onSendMessage}
              onKeyPress={onKeyPress}
              onFileUpload={onFileUpload}
              onSendWithFiles={(message, files) => {
                // 处理带文件的消息发送
                console.log('发送带文件的消息:', message, files);
                if (onSendChatMessage) {
                  onSendChatMessage(message, { files });
                }
              }}
              placeholder="输入修改需求..."
              disabled={isGenerating}
              isGenerating={isGenerating}
              inputId="code-input"
              className="w-full"
              sessionId={currentSession?.id}
              isPrivacyMode={false}
              quickSuggestions={[
                  "修改配色方案",
                  "调整布局结构", 
                  "添加新功能",
                  "优化移动端显示",
                  "更新个人信息"
              ]}
              showSuggestions={true}
            />
          </div>
        </div>

        {/* 右侧代码预览区域 */}
        <div className="w-2/3 flex flex-col h-full">
          {/* 代码和预览区域 */}
          <div className="flex-1">
            <CodePreviewToggle
              files={generatedCode}
              isStreaming={isGenerating}
              previewData={getReactPreviewData() || undefined}
              onDownload={onDownload}
              onDeploy={onDeploy}
              onEditCode={onEditCode}
              onSendMessage={onSendChatMessage}
            />
          </div>
        </div>
      </div>

      {/* 隐藏的文件上传输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.md,.json"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
} 