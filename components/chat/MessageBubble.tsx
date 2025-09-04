'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { User, Sparkles, FileCode, FolderOpen } from 'lucide-react';
import { LoadingText, StreamingText, LoadingDots } from '@/components/ui/loading-text';
import { UnifiedLoading, ThinkingLoader, GeneratingLoader, SimpleTextLoader } from '@/components/ui/unified-loading';
import { MarkdownRenderer } from '@/components/ui/markdown-renderer';
import { FileCreationPanel } from './FileCreationPanel';
import { ToolCallDisplay, ToolCallList } from './ToolCallDisplay';
import { VersionSelectionItem } from '@/components/editor/VersionSelectionItem';
import { useSessionVersions } from '@/hooks/use-session-versions';
import { useAuthCheck } from '@/hooks/use-auth-check';
import { cleanTextContent } from '@/lib/utils';
import { useTheme } from '@/contexts/theme-context';

interface MessageBubbleProps {
  message: any;
  isLast: boolean;
  isGenerating?: boolean;
  onSendMessage?: (message: string, option?: any) => void;
  sessionId?: string;
  isStreaming?: boolean;
  isCompactMode?: boolean; // 紧凑模式，用于coding模式的左侧对话框
  messageIndex?: number; // 消息在会话中的索引，用于计算版本号
}

/**
 * 🎯 MessageBubble 职责分工：
 * 
 * 【核心职责】
 * 1. 单个消息内容渲染 (Markdown、代码文件展示)
 * 2. 消息内交互表单 (选择、输入、确认)
 * 3. 消息级loading状态 (内容生成中、交互准备中)
 * 4. 代码文件创建状态展示
 * 5. 用户交互提交处理
 * 
 * 【不负责】
 * ❌ 系统级loading状态 (轮播、全局等待)
 * ❌ 工具执行状态管理
 * ❌ 全局错误处理
 * ❌ 流式数据接收
 */
export const MessageBubble = React.memo(function MessageBubble({ 
  message, 
  isLast, 
  isGenerating, 
  onSendMessage,
  sessionId,
  isStreaming = false,
  isCompactMode = false,
  messageIndex = 0
}: MessageBubbleProps) {
  const { theme } = useTheme();
  const { userId } = useAuthCheck();
  
  // ===== 消息内交互状态 =====
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInteraction, setShowInteraction] = useState(false);
  const [contentComplete, setContentComplete] = useState(!message.metadata?.streaming);
  
  // ===== 文件创建状态管理 =====
  const [fileCreationStatus, setFileCreationStatus] = useState<Record<string, {
    status: 'pending' | 'streaming' | 'completed' | 'error';
  }>>({});

  // ===== 版本号计算 =====
  const codeVersion = useMemo(() => {
    // 如果消息有明确的版本号，使用它
    if (message.metadata?.codeVersion) {
      return `V${message.metadata.codeVersion}`;
    }
    
    // 方案1: 基于消息索引生成递增版本号（推荐）
    if (messageIndex > 0) {
      // 只为包含代码文件的消息计算版本号
      const codeMessageCount = Math.floor((messageIndex + 1) / 2); // 假设每两条消息有一条包含代码
      return `V${Math.max(1, codeMessageCount)}`;
    }
    
    // 方案2: 从消息ID中提取时间戳并转换为简单序号
    const messageId = message.id || '';
    const idMatch = messageId.match(/msg-(\d+)/);
    if (idMatch) {
      const timestamp = parseInt(idMatch[1]);
      // 将时间戳转换为更小的递增数字
      const baseTime = 1700000000000; // 2023年的基准时间戳
      const relativeTime = Math.max(0, timestamp - baseTime);
      const version = Math.floor(relativeTime / 10000) % 100 + 1; // 转换为1-100的范围
      return `V${version}`;
    }
    
    // 方案3: 默认从V1开始
    return "V1";
  }, [message.id, message.metadata?.codeVersion, messageIndex]);
  
  // ===== 版本管理 =====
  const {
    versions,
    currentVersion,
    selectVersion,
    previewVersion
  } = useSessionVersions(sessionId || null, userId || null);
  
  // ===== 代码文件信息提取 =====
  const codeFilesInfo = useMemo(() => {
    const projectFiles = message.metadata?.projectFiles || 
                        message.metadata?.system_state?.metadata?.projectFiles || 
                        [];
    const codeBlocks = message.metadata?.codeBlocks || [];
    
    // 优先使用 projectFiles，如果没有则使用 codeBlocks
    const codeFiles = projectFiles.length > 0 ? projectFiles : codeBlocks;
    
    console.log(`🔍 [MessageBubble] 检测文件状态:`, {
      messageId: message.id,
      hasProjectFiles: projectFiles.length > 0,
      hasCodeBlocks: codeBlocks.length > 0,
      finalCodeFiles: codeFiles.length,
      streaming: message.metadata?.streaming
    });

    return {
      hasCodeFiles: codeFiles.length > 0,
      codeFiles: codeFiles || [],
      codeFilesCount: codeFiles?.length || 0
    };
  }, [
    message.metadata?.projectFiles,
    message.metadata?.system_state?.metadata?.projectFiles,
    message.metadata?.codeBlocks,
    message.metadata?.streaming,
    message.id
  ]);

  // ===== 找到当前消息对应的版本信息 =====
  const messageVersionInfo = useMemo(() => {
    console.log('🔍 [MessageVersionInfo] 检查版本信息:', {
      messageId: message.id,
      hasCodeFiles: codeFilesInfo.hasCodeFiles,
      filesCount: codeFilesInfo.codeFiles.length,
      codeVersion,
      currentVersion,
      sessionId,
      userId,
      versionsLength: versions.length
    });
    
    if (!codeFilesInfo.hasCodeFiles) {
      console.log('❌ [MessageVersionInfo] 无代码文件，跳过版本信息生成');
      return null;
    }
    
    const filesTypes: string[] = Array.from(new Set(codeFilesInfo.codeFiles.map((f: any) => f.language || 'TypeScript')));
    
    const versionInfo = {
      version: codeVersion.toLowerCase(),
      timestamp: message.timestamp || Date.now(),
      filesCount: codeFilesInfo.codeFiles.length,
      filesTypes,
      commitMessage: `生成${codeFilesInfo.codeFiles.length}个文件`,
      isActive: codeVersion.toLowerCase() === currentVersion,
      isDeployed: false, // 这里可以从versions中查找
      deploymentUrl: undefined
    };
    
    console.log('✅ [MessageVersionInfo] 生成版本信息:', versionInfo);
    return versionInfo;
  }, [codeVersion, codeFilesInfo, currentVersion, message.timestamp, message.id, sessionId, userId, versions]);
  
  // 版本操作处理
  const handleVersionSelect = useCallback((version: string) => {
    console.log(`🔄 [MessageBubble] 选择版本: ${version}`);
    selectVersion(version);
  }, [selectVersion]);
  
  const handleVersionPreview = useCallback((version: string) => {
    console.log(`👁️ [MessageBubble] 预览版本: ${version}`);
    previewVersion(version);
  }, [previewVersion]);
  
  // 🎯 用户消息判断
  const { isUser, isSystemMessage, actualIsUser } = useMemo(() => {
    const isUser = message.sender === 'user' || message.agent === 'user';
    
    // 🔧 修复：只有明确标记为 system 的消息才是系统消息
    // 不应该把所有 assistant 消息都当作系统消息
    const isSystemMessage = message.agent === 'system' || message.sender === 'system';
    
    const actualIsUser = isUser && !isSystemMessage;
    
    return { isUser, isSystemMessage, actualIsUser };
  }, [message.sender, message.agent]);


  // 🎯 消息级loading状态检测 - 仅用于消息内容状态
  const messageLoadingState = useMemo(() => {
    // 检测内容是否在生成中
    const isContentGenerating = !actualIsUser && (
      (isLast && isGenerating) ||
      (isLast && isStreaming) ||
      message.metadata?.streaming === true
    );
    
    // 检测交互是否在准备中
    const isInteractionPreparing = message.metadata?.interaction && 
                                  !contentComplete && 
                                  !showInteraction && 
                                  !actualIsUser;
    
    return {
      isContentGenerating,
      isInteractionPreparing,
      shouldShowThinking: isContentGenerating && !message.content
    };
  }, [
    actualIsUser,
    isLast, 
    isGenerating, 
    isStreaming,
    message.metadata?.streaming,
    message.metadata?.interaction,
    contentComplete,
    showInteraction,
    message.content
  ]);

  // 🎯 真实文件创建状态监听
  useEffect(() => {
    if (!codeFilesInfo.hasCodeFiles || codeFilesInfo.codeFiles.length === 0) return;
    
    // 🎯 根据消息的流式状态和文件内容判断创建状态
    const isStreamingMessage = message.metadata?.streaming === true;
    const messageContent = message.content || '';
    
    console.log('🎯 [MessageBubble] 监听文件状态:', {
      messageId: message.id,
      streaming: isStreamingMessage,
      filesCount: codeFilesInfo.codeFiles.length,
      hasContent: !!messageContent
    });
    
    const newStatus: Record<string, { status: 'pending' | 'streaming' | 'completed' | 'error' }> = {};
    
    codeFilesInfo.codeFiles.forEach((file: any) => {
      const filename = file.filename;
      
      if (isStreamingMessage) {
        // 🔄 检查文件是否在当前消息内容中被提及
        if (messageContent.includes(filename)) {
          newStatus[filename] = { status: 'streaming' };
          console.log(`🔧 [MessageBubble] 文件正在生成: ${filename}`);
        } else {
          newStatus[filename] = { status: 'pending' };
        }
      } else {
        // ✅ 流式结束，标记为完成
        newStatus[filename] = { status: 'completed' };
        console.log(`✅ [MessageBubble] 文件生成完成: ${filename}`);
      }
    });
    
    setFileCreationStatus(newStatus);
  }, [
    codeFilesInfo.hasCodeFiles, 
    codeFilesInfo.codeFiles.length,
    message.metadata?.streaming,
    message.content,
    message.id
  ]);

  // 🎯 文件创建完成回调
  const handleFileCreated = useCallback((filename: string) => {
    setFileCreationStatus(prev => ({
      ...prev,
      [filename]: {
        ...prev[filename],
        status: 'completed'
      }
    }));
    
    window.dispatchEvent(new CustomEvent('fileCreated', { 
      detail: { 
        filename, 
        content: codeFilesInfo.codeFiles.find((f: any) => f.filename === filename)?.content || ''
      } 
    }));
  }, [codeFilesInfo.codeFiles]);

  // 🎯 自动显示交互表单
  useEffect(() => {
    if (message.metadata?.interaction && !actualIsUser && !messageLoadingState.isInteractionPreparing) {
      const timer = setTimeout(() => {
        setShowInteraction(true);
        setContentComplete(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [message.metadata?.interaction, actualIsUser, messageLoadingState.isInteractionPreparing]);

  // 🎯 消息内交互提交处理
  const handleInteractionSubmit = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      // 显示提交loading状态
      if (onSendMessage) {
        onSendMessage('', { 
          type: 'system_loading_carousel',
          sequence: 'INTERACTION_PROCESSING',
          sender: 'assistant',
          agent: 'system'
        });
      }

      const response = await fetch('/api/chat/interact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: sessionId || 'default',
          interactionType: 'interaction',
          data: formData
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // 🎯 流式响应处理 - MessageBubble处理交互相关的流式响应
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('text/event-stream')) {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        
        if (reader) {
          let buffer = '';
          let hasSentSuggestions = false;
          
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim();
                
                if (data === '[DONE]') {
                  break;
                }
                
                try {
                  const chunk = JSON.parse(data);
                  
                  // 处理交互响应
                  if (chunk.type === 'suggestions_ready' && !hasSentSuggestions) {
                    if (onSendMessage && chunk.interaction) {
                        onSendMessage('', {
                          type: 'suggestions_preview',
                          interaction: chunk.interaction,
                          sender: 'assistant',
                          agent: 'system'
                        });
                    }
                    hasSentSuggestions = true;
                  }
                  
                  else if (chunk.type === 'agent_response' && chunk.data) {
                    if (chunk.data.immediate_display && onSendMessage) {
                      if (chunk.data.interaction && !hasSentSuggestions) {
                        onSendMessage(chunk.data.immediate_display.reply, {
                          type: 'agent_response',
                          sender: 'assistant',
                          agent: chunk.data.immediate_display.agent_name || 'system',
                          interaction: chunk.data.interaction
                        });
                        hasSentSuggestions = true;
                      } else if (!chunk.data.interaction) {
                        onSendMessage(chunk.data.immediate_display.reply, {
                          type: 'agent_response',
                          sender: 'assistant',
                          agent: chunk.data.immediate_display.agent_name || 'system'
                        });
                      }
                    }
                  }
                  
                } catch (parseError) {
                  console.error('❌ [交互解析错误]:', parseError);
                }
              }
            }
          }
        }
      } else {
        // 普通JSON响应处理
        const result = await response.json();
        
        if (result.success) {
          if (result.hasAIResponse) {
            if (onSendMessage) {
              const responseContent = result.data?.immediate_display?.reply || result.message;
              if (responseContent) {
                onSendMessage(responseContent, {
                  type: 'agent_response',
                  sender: 'assistant',
                  agent: 'system',
                  interaction: result.data?.interaction
                });
              }
            }
          } else {
            if (onSendMessage && result.message) {
              onSendMessage(result.message, {
                type: 'system_success',
                sender: 'assistant',
                agent: 'system'
              });
            }
          }
        }
      }
      
    } catch (error) {
      console.error('❌ 交互失败:', error);
      
      if (onSendMessage) {
        onSendMessage('抱歉，处理过程中出现了问题，请重试 😅', {
          type: 'system_error',
          sender: 'assistant',
          agent: 'system'
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (elementId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [elementId]: value
    }));
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-2 ${
        isCompactMode 
          ? "px-2 py-1" // 紧凑模式：更小的内边距，确保头像不超出边界
          : "max-w-4xl mx-auto px-6 py-4" // 普通模式：原有样式
      } ${actualIsUser && !isCompactMode ? "flex-row-reverse" : ""}`}
    >
      {/* 头像 */}
      <div className="flex-shrink-0 pt-1">
        <Avatar className={isCompactMode ? "w-6 h-6" : "w-8 h-8"}>
          <AvatarFallback className={actualIsUser ? "bg-gray-700 dark:bg-gray-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"}>
            {actualIsUser ? <User className={isCompactMode ? "w-3 h-3" : "w-4 h-4"} /> : <Sparkles className={isCompactMode ? "w-3 h-3" : "w-4 h-4"} />}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* 消息内容 */}
      <div className={`flex-1 min-w-0 ${actualIsUser && !isCompactMode ? "flex justify-end" : ""}`}>
        <div className={`inline-block ${isCompactMode ? "w-full" : "max-w-full"} text-left ${
          isCompactMode && actualIsUser 
            ? "bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 border-l-2 border-blue-200 dark:border-blue-700" 
            : ""
        } ${actualIsUser ? "text-gray-800 dark:text-gray-200" : "text-gray-800 dark:text-gray-200"}`} style={isCompactMode ? { maxWidth: '100%' } : {}}>
          
          {/* 🎯 工具调用展示面板 - 优先显示在内容前面 */}
          {!actualIsUser && message.metadata?.toolCalls && message.metadata.toolCalls.length > 0 && (
            <div className={isCompactMode ? "px-1 py-1 mb-2" : "mb-3"}>
              <ToolCallList 
                toolCalls={message.metadata.toolCalls}
              />
            </div>
          )}

          {/* 🎯 消息文本内容渲染 - MessageBubble核心职责 */}
          <div className={`whitespace-pre-wrap break-words ${isCompactMode ? "text-sm" : ""} overflow-hidden`}>
            {(() => {
              const cleanedContent = cleanTextContent(message.content || '');
              
              // 🎯 消息级loading状态处理
              if (messageLoadingState.shouldShowThinking) {
                return <ThinkingLoader text="正在思考中" size="sm" />;
              }
              
              if (messageLoadingState.isInteractionPreparing) {
                return <GeneratingLoader text="正在准备个性化选项" size="sm" />;
              }
              
              // 检测特殊loading文本 - 但排除增量编辑消息
              const isIncrementalEdit = message.metadata?.mode === 'incremental' || 
                                      message.agent === 'CodingAgent' ||
                                      cleanedContent.includes('增量编辑') ||
                                      cleanedContent.includes('工具调用');
              
              if (!actualIsUser && cleanedContent && !isIncrementalEdit && (
                cleanedContent.includes('正在分析') ||
                cleanedContent.includes('正在为您生成') ||
                cleanedContent.includes('请稍候')
              )) {
                return <GeneratingLoader text={cleanedContent.replace(/[。.…]+$/g, '')} size="sm" />;
              }
              
              // 🎯 核心内容渲染 - 统一使用MarkdownRenderer
              return <MarkdownRenderer content={cleanedContent} />;
            })()}
          </div>

          {/* 🎯 代码文件展示面板 - MessageBubble负责消息内的文件展示 */}
          {!actualIsUser && codeFilesInfo.hasCodeFiles && codeFilesInfo.codeFilesCount > 0 && (
            <div className={isCompactMode ? "px-1 py-2" : ""}>
              <FileCreationPanel 
                codeFiles={codeFilesInfo.codeFiles}
                fileCreationStatus={fileCreationStatus}
                version={codeVersion} // 使用计算出的正确版本号
                isActive={true}
                sessionId={message.metadata?.sessionId || message.metadata?.system_state?.metadata?.message_id}
                autoDeployEnabled={true}
                projectName={message.metadata?.projectName || 'HeysMe Project'}
              />
              
              {/* 🆕 版本选择器 - 在文件创建面板下方显示 */}
              {messageVersionInfo && (
                <div className="mt-3">
                  <VersionSelectionItem
                    versionInfo={messageVersionInfo}
                    isCurrentVersion={messageVersionInfo.isActive}
                    onVersionSelect={handleVersionSelect}
                    onVersionPreview={handleVersionPreview}
                    showDeployButton={false} // 在消息中不显示部署按钮
                    isCompactMode={isCompactMode} // 传递紧凑模式标识
                    isDeploying={false}
                  />
                </div>
              )}
            </div>
          )}



          {/* 🎯 消息内交互表单 - MessageBubble核心职责 */}
          {!actualIsUser && 
           message.metadata?.interaction && 
           (contentComplete || showInteraction) && 
           !(message.metadata?.system_state?.done === true) &&
           !(message.metadata?.system_state?.intent === 'advance_to_next_agent') &&
           !(message.metadata?.system_state?.intent === 'complete') && 
           !isCompactMode && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200"
            >
              {/* 交互标题 */}
              {message.metadata.interaction.title && 
               message.metadata.interaction.title !== message.content && (
                <h4 className="font-medium text-gray-900 mb-3">
                  {message.metadata.interaction.title}
                </h4>
              )}
              
              {/* 表单准备中状态 */}
              {!showInteraction && message.metadata?.interaction && (
                <div className="flex items-center justify-center py-8">
                  <GeneratingLoader 
                    text="正在准备个性化选项"
                    size="md"
                  />
                </div>
              )}
              
              {/* 🎯 交互表单内容 - MessageBubble负责渲染 */}
              {showInteraction && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-4"
                >
                  {message.metadata.interaction.elements?.map((element: any, index: number) => (
                    <motion.div 
                      key={index} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="space-y-2"
                    >
                      {/* 元素标签 */}
                      {element.label && 
                       !message.content.includes(element.label) && (
                        <label className="block text-sm font-medium text-gray-700">
                          {element.label}
                          {element.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                      )}
                      
                      {/* 选择类型 */}
                      {element.type === 'select' && (
                        <div className="space-y-3">
                          <div className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50/80 backdrop-blur-sm border border-emerald-200/60 px-2.5 py-1 rounded-full">
                            <Sparkles className="w-2.5 h-2.5" />
                            <span>AI个性化建议</span>
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            {element.options?.map((option: any, optIndex: number) => {
                              const isSelected = formData[element.id] === option.value;
                              return (
                                <motion.button
                                  key={optIndex}
                                  type="button"
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: 0.05 * optIndex }}
                                  whileHover={{ scale: 1.05, y: -1 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => handleInputChange(element.id, option.value)}
                                  className={`
                                    px-3 py-1.5 text-xs font-medium rounded-full 
                                    backdrop-blur-md border transition-all duration-300
                                    hover:shadow-lg hover:shadow-emerald-200/50
                                    ${isSelected 
                                      ? 'bg-emerald-500/20 border-emerald-400/60 text-emerald-800 shadow-md backdrop-blur-lg' 
                                      : 'bg-white/60 border-gray-200/60 text-gray-700 hover:bg-emerald-50/80 hover:border-emerald-300/60'
                                    }
                                  `}
                                >
                                  <div className="flex items-center gap-1.5">
                                    <span>{option.label}</span>
                                    {isSelected && (
                                      <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="w-1.5 h-1.5 bg-emerald-600 rounded-full"
                                      />
                                    )}
                                  </div>
                                </motion.button>
                              );
                            })}
                          </div>
                          
                          {/* 自定义输入选项 */}
                          <div className="space-y-2">
                            <motion.button
                              type="button"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.3 }}
                              whileHover={{ scale: 1.02, y: -1 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => {
                                setFormData(prev => ({ ...prev, [`${element.id}_isCustom`]: !prev[`${element.id}_isCustom`] }));
                              }}
                              className={`
                                inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium 
                                rounded-full border-dashed backdrop-blur-md border transition-all duration-300
                                hover:shadow-lg hover:shadow-emerald-200/50
                                ${formData[`${element.id}_isCustom`] 
                                  ? 'border-emerald-400/60 bg-emerald-500/20 text-emerald-800 backdrop-blur-lg' 
                                  : 'border-gray-300/60 bg-white/60 text-gray-600 hover:border-emerald-300/60 hover:bg-emerald-50/80'
                                }
                              `}
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              <span>自定义</span>
                            </motion.button>
                            
                            {/* 自定义输入框 */}
                            {formData[`${element.id}_isCustom`] && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden space-y-2"
                              >
                                <input
                                  type="text"
                                  value={formData[`${element.id}_customInput`] || ''}
                                  onChange={(e) => handleInputChange(`${element.id}_customInput`, e.target.value)}
                                  placeholder={`请输入您的${element.label.replace('？', '').replace('您', '')}...`}
                                  className="w-full p-3 border-2 border-emerald-300 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 bg-white"
                                  autoFocus
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      const value = formData[`${element.id}_customInput`];
                                      if (value && value.trim()) {
                                        const currentValues = formData[element.id] || [];
                                        if (!currentValues.includes(value.trim())) {
                                          handleInputChange(element.id, [...currentValues, value.trim()]);
                                          handleInputChange(`${element.id}_customInput`, '');
                                        }
                                      }
                                    }
                                  }}
                                />
                                <div className="flex justify-between items-center">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const value = formData[`${element.id}_customInput`];
                                      if (value && value.trim()) {
                                        const currentValues = formData[element.id] || [];
                                        if (!currentValues.includes(value.trim())) {
                                          handleInputChange(element.id, [...currentValues, value.trim()]);
                                          handleInputChange(`${element.id}_customInput`, '');
                                        }
                                      }
                                    }}
                                    className="px-4 py-2 text-sm bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                                  >
                                    添加
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setFormData(prev => {
                                        const newData = { ...prev };
                                        delete newData[`${element.id}_isCustom`];
                                        delete newData[`${element.id}_customInput`];
                                        return newData;
                                      });
                                    }}
                                    className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                                  >
                                    取消
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* 输入类型 */}
                      {element.type === 'input' && (
                        <div className="space-y-3">
                          <div className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50/80 backdrop-blur-sm border border-emerald-200/60 px-2.5 py-1 rounded-full">
                            <Sparkles className="w-2.5 h-2.5" />
                            <span>请填写信息</span>
                          </div>
                          
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <input
                              type="text"
                              value={formData[element.id] || ''}
                              onChange={(e) => handleInputChange(element.id, e.target.value)}
                              placeholder={element.placeholder || `请输入您的${element.label.replace('？', '').replace('您', '')}...`}
                              className="w-full px-3 py-2 text-sm border border-gray-200/60 rounded-2xl focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 bg-white/90 backdrop-blur-sm hover:border-gray-300/60"
                            />
                          </motion.div>
                        </div>
                      )}
                      
                      {/* 多选类型 */}
                      {element.type === 'checkbox' && (
                        <div className="space-y-3">
                          <div className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50/80 backdrop-blur-sm border border-emerald-200/60 px-2.5 py-1 rounded-full">
                            <Sparkles className="w-2.5 h-2.5" />
                            <span>可多选・AI建议</span>
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            {element.options?.map((option: any, optIndex: number) => {
                              const currentValues = formData[element.id] || [];
                              const isSelected = currentValues.includes(option.value);
                              return (
                                <motion.button
                                  key={optIndex}
                                  type="button"
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: 0.05 * optIndex }}
                                  whileHover={{ scale: 1.05, y: -1 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => {
                                    if (isSelected) {
                                      handleInputChange(element.id, currentValues.filter((v: any) => v !== option.value));
                                    } else {
                                      handleInputChange(element.id, [...currentValues, option.value]);
                                    }
                                  }}
                                  className={`
                                    px-3 py-1.5 text-xs font-medium rounded-full 
                                    backdrop-blur-md border transition-all duration-300
                                    hover:shadow-lg hover:shadow-emerald-200/50
                                    ${isSelected 
                                      ? 'bg-emerald-500/20 border-emerald-400/60 text-emerald-800 shadow-md backdrop-blur-lg' 
                                      : 'bg-white/60 border-gray-200/60 text-gray-700 hover:bg-emerald-50/80 hover:border-emerald-300/60'
                                    }
                                  `}
                                >
                                  <div className="flex items-center gap-1.5">
                                    <span>{option.label}</span>
                                    {isSelected && (
                                      <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="flex items-center justify-center w-3 h-3 bg-emerald-600 rounded-full"
                                      >
                                        <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                      </motion.div>
                                    )}
                                  </div>
                                </motion.button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                  
                  {/* 🎯 交互提交按钮 - MessageBubble负责 */}
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-4 flex gap-2"
                  >
                    <Button
                      onClick={handleInteractionSubmit}
                      disabled={isSubmitting}
                      size="sm"
                      className="bg-emerald-500/90 hover:bg-emerald-600 text-white backdrop-blur-md rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg shadow-emerald-200/50"
                    >
                      {isSubmitting ? (
                        <SimpleTextLoader text="提交中" className="text-white" />
                      ) : (
                        '确认提交'
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        onSendMessage?.('我需要重新考虑一下');
                      }}
                      disabled={isSubmitting}
                      size="sm"
                      className="text-gray-600 hover:text-gray-800 hover:bg-gray-100/80 backdrop-blur-sm rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-300 hover:scale-105"
                    >
                      重新考虑
                    </Button>
                  </motion.div>
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}); 