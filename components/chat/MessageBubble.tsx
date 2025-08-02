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
import { cleanTextContent } from '@/lib/utils';
import { useTheme } from '@/contexts/theme-context';

interface MessageBubbleProps {
  message: any;
  isLast: boolean;
  isGenerating?: boolean;
  onSendMessage?: (message: string, option?: any) => void;
  sessionId?: string;
  isStreaming?: boolean;
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
  isStreaming = false 
}: MessageBubbleProps) {
  const { theme } = useTheme();
  
  // ===== 消息内交互状态 =====
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInteraction, setShowInteraction] = useState(false);
  const [contentComplete, setContentComplete] = useState(!message.metadata?.streaming);
  
  // ===== 文件创建状态管理 =====
  const [fileCreationStatus, setFileCreationStatus] = useState<Record<string, {
    status: 'pending' | 'streaming' | 'completed' | 'error';
  }>>({});
  
  // 🎯 用户消息判断
  const { isUser, isSystemMessage, actualIsUser } = useMemo(() => {
    const isUser = message.sender === 'user' || message.agent === 'user';
    const isSystemMessage = message.agent === 'system' || message.sender === 'assistant' || message.sender === 'system';
    const actualIsUser = isUser && !isSystemMessage;
    
    return { isUser, isSystemMessage, actualIsUser };
  }, [message.sender, message.agent]);

  // 🎯 代码文件信息提取
  const codeFilesInfo = useMemo(() => {
    const hasCodeFiles = message.metadata?.hasCodeFiles || false;
    const codeFiles = message.metadata?.projectFiles || [];
    const fileCreationProgress = message.metadata?.fileCreationProgress || [];
    
    return {
      hasCodeFiles,
      codeFiles,
      fileCreationProgress,
      codeFilesCount: codeFiles.length
    };
  }, [
    message.metadata?.hasCodeFiles, 
    message.metadata?.projectFiles?.length,
    message.metadata?.fileCreationProgress?.length
  ]);

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

  // 🎯 文件创建状态更新
  useEffect(() => {
    if (codeFilesInfo.hasCodeFiles && codeFilesInfo.fileCreationProgress.length > 0) {
      const newStatus: Record<string, { status: any }> = {};
      
      codeFilesInfo.fileCreationProgress.forEach((fileProgress: any) => {
        newStatus[fileProgress.filename] = {
          status: fileProgress.status || 'streaming'
        };
      });
      
      setFileCreationStatus(prev => {
        const hasChanged = Object.keys(newStatus).some(key => 
          !prev[key] || prev[key].status !== newStatus[key].status
        );
        
        return hasChanged ? newStatus : prev;
      });
    }
  }, [codeFilesInfo.hasCodeFiles, codeFilesInfo.fileCreationProgress]);

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
      className={`flex gap-4 max-w-4xl mx-auto px-6 py-4 ${
        actualIsUser ? "flex-row-reverse" : ""
      }`}
    >
      {/* 头像 */}
      <div className="flex-shrink-0 pt-1">
        <Avatar className="w-8 h-8">
          <AvatarFallback className={actualIsUser ? "bg-gray-700 dark:bg-gray-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"}>
            {actualIsUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* 消息内容 */}
      <div className={`flex-1 ${actualIsUser ? "text-right" : ""}`}>
        <div className={`inline-block max-w-full ${actualIsUser ? "text-gray-800 dark:text-gray-200" : "text-gray-800 dark:text-gray-200"}`}>
          
          {/* 🎯 消息文本内容渲染 - MessageBubble核心职责 */}
          <div className="whitespace-pre-wrap break-words">
            {(() => {
              const cleanedContent = cleanTextContent(message.content || '');
              
              // 🎯 消息级loading状态处理
              if (messageLoadingState.shouldShowThinking) {
                return <ThinkingLoader text="正在思考中" size="sm" />;
              }
              
              if (messageLoadingState.isInteractionPreparing) {
                return <GeneratingLoader text="正在准备个性化选项" size="sm" />;
              }
              
              // 检测特殊loading文本
              if (!actualIsUser && cleanedContent && (
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
            <FileCreationPanel 
              codeFiles={codeFilesInfo.codeFiles}
              fileCreationStatus={fileCreationStatus}
            />
          )}

          {/* 🎯 消息内交互表单 - MessageBubble核心职责 */}
          {!actualIsUser && 
           message.metadata?.interaction && 
           (contentComplete || showInteraction) && 
           !(message.metadata?.system_state?.done === true) &&
           !(message.metadata?.system_state?.intent === 'advance_to_next_agent') &&
           !(message.metadata?.system_state?.intent === 'complete') && (
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