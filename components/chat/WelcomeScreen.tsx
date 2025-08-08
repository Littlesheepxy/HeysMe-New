'use client';

import { useState, useEffect, useRef, useCallback, memo } from 'react';

import { useDebouncedCallback } from 'use-debounce';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Send, Paperclip, Upload, X } from 'lucide-react';
import { useTheme } from '@/contexts/theme-context';



// 🎨 高性能打字机和品牌样式优化
const dynamicTextStyles = `
  /* 打字机文本渲染优化 */
  .typewriter-text {
    /* GPU加速 */
    transform: translateZ(0);
    will-change: contents;
    /* 字体渲染优化 */
    text-rendering: optimizeSpeed;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    /* 减少重绘 */
    contain: layout style paint;
  }
  
  /* 光标优化 */
  .typewriter-cursor {
    /* GPU加速渲染 */
    transform: translateZ(0);
    will-change: opacity;
    /* 优化渲染性能 */
    contain: layout style paint;
    backface-visibility: hidden;
  }
  
  .animate-brand-glow {
    filter: brightness(1) drop-shadow(0 0 2px rgba(16, 185, 129, 0.3));
  }
  
  .animate-brand-breathe {
    transform: scale(1);
    opacity: 0.95;
  }
  
  /* 高性能输入框优化 */
  .high-performance-input {
    /* 强制GPU合成层 */
    transform: translateZ(0);
    will-change: contents;
    /* 隔离渲染上下文 */
    isolation: isolate;
    contain: layout style paint size;
    /* 减少重绘范围 */
    backface-visibility: hidden;
    /* 优化滚动性能 */
    -webkit-overflow-scrolling: touch;
  }
  
  /* IME 输入法优化 */
  .ime-composing {
    ime-mode: active;
    text-decoration: underline;
  }
`;

interface FileWithPreview {
  file: File;
  id: string;
  preview?: string;
  parsedContent?: string;
  isProcessing: boolean;
  progress: number;
  error?: string;
  documentId?: string; // Supabase文档ID
  tempId?: string; // 隐私模式下的临时ID
}

interface WelcomeScreenProps {
  onSendMessage: (message: string) => void;
  isGenerating?: boolean;
  chatMode?: 'normal' | 'professional';
  onFileUpload?: (file: File) => void;
  onSendWithFiles?: (message: string, files: FileWithPreview[]) => void;
  sessionId?: string;
  isPrivacyMode?: boolean;
}

// 🚀 高性能打字机效果Hook - 使用 requestAnimationFrame 优化
const useTypewriter = (phrases: string[], baseText: string = "", typingSpeed: number = 80) => {
  const [displayText, setDisplayText] = useState(baseText);
  const [showCursor, setShowCursor] = useState(true);
  
  // 使用 ref 管理动画状态，避免不必要的重渲染
  const animationRef = useRef<{
    currentPhraseIndex: number;
    currentCharIndex: number;
    isDeleting: boolean;
    isPaused: boolean;
    lastUpdateTime: number;
    pauseStartTime: number;
    animationId: number | null;
    cursorAnimationId: number | null;
  }>({
    currentPhraseIndex: 0,
    currentCharIndex: baseText.length,
    isDeleting: false,
    isPaused: false,
    lastUpdateTime: 0,
    pauseStartTime: 0,
    animationId: null,
    cursorAnimationId: null
  });

  // 缓存计算结果
  const phrasesRef = useRef(phrases);
  const baseTextRef = useRef(baseText);
  const typingSpeedRef = useRef(typingSpeed);
  
  useEffect(() => {
    phrasesRef.current = phrases;
    baseTextRef.current = baseText;
    typingSpeedRef.current = typingSpeed;
  }, [phrases, baseText, typingSpeed]);

  // 主动画循环
  const animateTyping = useCallback((currentTime: number) => {
    const state = animationRef.current;
    const phrases = phrasesRef.current;
    const baseText = baseTextRef.current;
    const speed = typingSpeedRef.current;
    
    if (phrases.length === 0) return;

    const currentPhrase = phrases[state.currentPhraseIndex];
    const fullText = baseText + currentPhrase;
    
    // 暂停逻辑
    if (state.isPaused) {
      if (currentTime - state.pauseStartTime >= 2000) { // 2秒暂停
        state.isPaused = false;
        state.isDeleting = true;
        state.lastUpdateTime = currentTime;
      }
      state.animationId = requestAnimationFrame(animateTyping);
      return;
    }

    // 检查是否到了更新时间
    const timeSinceLastUpdate = currentTime - state.lastUpdateTime;
    const currentSpeed = state.isDeleting ? speed / 2 : speed;
    
    if (timeSinceLastUpdate >= currentSpeed) {
      if (!state.isDeleting) {
        // 正在输入
        if (state.currentCharIndex < fullText.length) {
          state.currentCharIndex++;
          const newText = fullText.slice(0, state.currentCharIndex);
          setDisplayText(newText);
        } else {
          // 输入完成，开始暂停
          state.isPaused = true;
          state.pauseStartTime = currentTime;
        }
      } else {
        // 正在删除
        if (state.currentCharIndex > baseText.length) {
          state.currentCharIndex--;
          const newText = fullText.slice(0, state.currentCharIndex);
          setDisplayText(newText);
        } else {
          // 删除完成，切换到下一个短语
          state.isDeleting = false;
          state.currentPhraseIndex = (state.currentPhraseIndex + 1) % phrases.length;
        }
      }
      state.lastUpdateTime = currentTime;
    }

    state.animationId = requestAnimationFrame(animateTyping);
  }, []);

  // 光标闪烁动画 - 修复时间计算
  const cursorStateRef = useRef({ lastToggle: 0, isVisible: true });
  
  const animateCursor = useCallback((currentTime: number) => {
    const state = animationRef.current;
    const cursorState = cursorStateRef.current;
    
    // 每530ms切换一次光标状态
    if (currentTime - cursorState.lastToggle >= 530) {
      cursorState.isVisible = !cursorState.isVisible;
      cursorState.lastToggle = currentTime;
      setShowCursor(cursorState.isVisible);
    }
    
    state.cursorAnimationId = requestAnimationFrame(animateCursor);
  }, []);

  // 启动动画
  useEffect(() => {
    const state = animationRef.current;
    const cursorState = cursorStateRef.current;
    const currentTime = performance.now();
    
    // 重置状态
    state.currentPhraseIndex = 0;
    state.currentCharIndex = baseTextRef.current.length;
    state.isDeleting = false;
    state.isPaused = false;
    state.lastUpdateTime = currentTime;
    
    // 重置光标状态
    cursorState.lastToggle = currentTime;
    cursorState.isVisible = true;
    setShowCursor(true);
    
    // 启动动画循环
    state.animationId = requestAnimationFrame(animateTyping);
    state.cursorAnimationId = requestAnimationFrame(animateCursor);

    // 清理函数
    return () => {
      if (state.animationId) {
        cancelAnimationFrame(state.animationId);
        state.animationId = null;
      }
      if (state.cursorAnimationId) {
        cancelAnimationFrame(state.cursorAnimationId);
        state.cursorAnimationId = null;
      }
    };
  }, [animateTyping, animateCursor]);

  return {
    text: displayText,
    showCursor,
    baseTextLength: baseTextRef.current.length
  };
};

export const WelcomeScreen = memo(function WelcomeScreen({ onSendMessage, isGenerating, chatMode, onFileUpload, onSendWithFiles, sessionId, isPrivacyMode = false }: WelcomeScreenProps) {
  const { theme } = useTheme();
  
  // 🚀 内部状态管理 - 避免父组件重渲染
  const [inputValue, setInputValue] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showDropzone, setShowDropzone] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<FileWithPreview[]>([]);
  const [dragCounter, setDragCounter] = useState(0);

  // 🎯 恢复打字机效果
  const phrases = [
    "求职简历，展示给HR！",
    "作品集，展示给客户！", 
    "个性名片，展示给合作者！",
    "个人博客，展示给粉丝！",
    "项目主页，展示给伙伴！",
    "商务页面，展示给客户！"
  ];

  const baseText = "你好！我是 HeysMe AI 助手，我可以快速帮助你创建";
  const { text: dynamicText, showCursor, baseTextLength } = useTypewriter(phrases, baseText, 120);

  // 处理键盘事件
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 处理发送消息（包含文件）
  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    
    if (uploadedFiles.length > 0 && onSendWithFiles) {
      // 有文件时，使用新的发送方式
      onSendWithFiles(inputValue, uploadedFiles);
      setUploadedFiles([]); // 清空文件列表
    } else {
      // 没有文件时，传递消息内容
      onSendMessage(inputValue);
    }
    
    // 清空输入框
    setInputValue("");
  };

  const handleFileUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFilesChange(files);
    }
    // 清空input值，以便重复选择同一文件
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleFilesChange = (files: File[]) => {
    const filesWithPreview = files.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      isProcessing: true,
      progress: 0,
      parsedContent: undefined,
      error: undefined
    }));
    
    setUploadedFiles(prev => [...prev, ...filesWithPreview]);
    
    // 使用统一文档服务处理文件
    processFilesWithUnifiedService(filesWithPreview);
  };

  // 使用统一文档服务处理文件
  const processFilesWithUnifiedService = async (filesWithPreview: FileWithPreview[]) => {
    try {
      const formData = new FormData();
      
      // 添加文件
      filesWithPreview.forEach((fileWithPreview, index) => {
        formData.append(`file${index}`, fileWithPreview.file);
      });

      // 添加配置
      formData.append('isPrivacyMode', isPrivacyMode.toString());
      formData.append('sessionId', sessionId || '');
      formData.append('extractMode', 'comprehensive');

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || '上传失败');
      }

      const result = await response.json();
      
      // 更新文件状态
      setUploadedFiles(prev => prev.map(f => {
        const matchedResult = result.documents?.find((doc: any) => doc.originalFilename === f.file.name);
        if (matchedResult) {
          return {
            ...f,
            isProcessing: false,
            progress: 100,
            parsedContent: matchedResult.extractedText,
            documentId: matchedResult.isPrivacyMode ? undefined : matchedResult.id,
            tempId: matchedResult.isPrivacyMode ? matchedResult.id : undefined
          };
        }
        return f;
      }));

    } catch (error) {
      console.error('文件处理失败:', error);
      
      // 更新错误状态
      setUploadedFiles(prev => prev.map(f => ({
        ...f,
        isProcessing: false,
        error: error instanceof Error ? error.message : '处理失败'
      })));
    }
  };

  // 处理单个文件 - 使用Supabase上传和解析（保留作为备用）
  const processFile = async (fileWithPreview: FileWithPreview) => {
    try {
      // 1. 更新上传进度
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileWithPreview.id 
          ? { ...f, progress: 20 }
          : f
      ));

      // 2. 创建FormData上传到Supabase
      const formData = new FormData();
      formData.append('file', fileWithPreview.file);
      formData.append('parseImmediately', 'true');
      formData.append('extractMode', 'comprehensive');

      // 3. 上传文件
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileWithPreview.id 
          ? { ...f, progress: 50 }
          : f
      ));

      const uploadResponse = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.details || '文件上传失败');
      }

      const uploadResult = await uploadResponse.json();
      const documentId = uploadResult.document.id;

      // 4. 等待解析完成
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileWithPreview.id 
          ? { ...f, progress: 80 }
          : f
      ));

      // 轮询检查解析状态
      let parseCompleted = false;
      let attempts = 0;
      const maxAttempts = 30; // 最多等待30秒

      while (!parseCompleted && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const contentResponse = await fetch(`/api/documents/${documentId}/parse`);
        if (contentResponse.ok) {
          const contentResult = await contentResponse.json();
          if (contentResult.content?.isReady) {
            parseCompleted = true;
            
            // 5. 解析完成，更新状态
            setUploadedFiles(prev => prev.map(f => 
              f.id === fileWithPreview.id 
                ? { 
                    ...f, 
                    isProcessing: false, 
                    progress: 100,
                    parsedContent: contentResult.content.extractedText,
                    documentId: documentId
                  }
                : f
            ));
          }
        }
        attempts++;
      }

      if (!parseCompleted) {
        throw new Error('文档解析超时');
      }

    } catch (error) {
      console.error('文件处理失败:', error);
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileWithPreview.id 
          ? { 
              ...f, 
              isProcessing: false, 
              progress: 0,
              error: error instanceof Error ? error.message : '文件处理失败'
            }
          : f
      ));
    }
  };

  // 读取文件内容
  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          resolve(result);
        } else {
          reject(new Error('无法读取文件内容'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('文件读取失败'));
      };
      
      // 根据文件类型选择读取方式
      if (file.type.includes('text') || file.type.includes('json') || file.type.includes('markdown')) {
        reader.readAsText(file);
      } else {
        // 对于其他文件类型，读取为文本
        reader.readAsText(file);
      }
    });
  };

  // 全局拖拽检测
  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      setDragCounter(prev => prev + 1);
      if (e.dataTransfer?.types.includes('Files')) {
        setIsDragging(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      setDragCounter(prev => {
        const newCounter = prev - 1;
        if (newCounter === 0) {
          setIsDragging(false);
        }
        return newCounter;
      });
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      setDragCounter(0);
      
      const files = Array.from(e.dataTransfer?.files || []);
      if (files.length > 0) {
        handleFilesChange(files);
      }
    };

    document.addEventListener('dragenter', handleDragEnter);
    document.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('drop', handleDrop);

    return () => {
      document.removeEventListener('dragenter', handleDragEnter);
      document.removeEventListener('dragleave', handleDragLeave);
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('drop', handleDrop);
    };
  }, [onFileUpload]);

  // 🚀 IME支持状态
  const [isComposing, setIsComposing] = useState(false);

  // 🚀 极简DOM操作 - 直接使用 requestAnimationFrame，无防抖
  const adjustTextareaHeight = useCallback((textarea: HTMLTextAreaElement) => {
    if (textarea) {
      requestAnimationFrame(() => {
        textarea.style.height = 'auto';
        const newHeight = Math.min(textarea.scrollHeight, 200);
        textarea.style.height = newHeight + 'px';
      });
    }
  }, []);

  // 极简的文本区域处理 - 最小化处理逻辑
  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    adjustTextareaHeight(e.target);
  }, [adjustTextareaHeight]);
  
  // 输入焦点优化
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);
  
  const handleFocus = useCallback(() => {
    setIsInputFocused(true);
    // 当输入框获得焦点时，无需特殊处理，让动画继续运行
    // 分离的渲染层已经确保动画不会影响输入性能
  }, []);
  
  const handleBlur = useCallback(() => {
    setIsInputFocused(false);
    // 失焦时也无需特殊处理，渲染层隔离确保了性能
  }, []);

  // 🚀 IME事件处理 - 支持中文输入法
  const handleCompositionStart = useCallback(() => {
    setIsComposing(true);
  }, []);

  const handleCompositionEnd = useCallback((e: React.CompositionEvent<HTMLTextAreaElement>) => {
    setIsComposing(false);
    // 确保组合输入完成后更新值
    setInputValue((e.target as HTMLTextAreaElement).value);
  }, [setInputValue]);

  // 处理增强文件上传组件的文件处理完成
  const handleFilesProcessed = (processedFiles: any[]) => {
    const filesWithPreview = processedFiles.map(file => ({
      file: file.file,
      id: file.id,
      preview: file.preview,
      isProcessing: false,
      progress: 100,
      parsedContent: file.result,
      error: file.error,
      tempId: file.tempId // 隐私模式下的临时ID
    }));
    
    setUploadedFiles(prev => [...prev, ...filesWithPreview]);
  };

  return (
    <>

      {/* 注入动态样式 */}
      <style jsx>{dynamicTextStyles}</style>
      
      <div className={`flex-1 flex flex-col items-center justify-center px-6 ${
        theme === "light" ? "bg-white" : "bg-gray-900"
      }`}>
        <div className="w-full max-w-3xl mx-auto text-center">
          {/* 🎨 欢迎文本 - 打字机效果 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <h1 className="text-4xl font-bold mb-4">
              <div className="flex items-center justify-center gap-3">
                {/* 品牌色渐变标题 - 彩虹流动效果 */}
                <motion.span
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent font-extrabold tracking-tight"
                  style={{ 
                    backgroundSize: '200% 200%',
                    animation: 'brand-rainbow-flow 3s ease-in-out infinite' 
                  }}
                >
                  HeysMe AI
                </motion.span>
                
                {chatMode && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className={`px-3 py-1 rounded-full text-xs font-medium shadow-sm ${
                      chatMode === 'professional'
                        ? 'text-white shadow-emerald-200 dark:shadow-emerald-900/30'
                        : 'bg-white text-gray-700 border border-gray-200 shadow-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:shadow-gray-900/30'
                    }`}
                    style={chatMode === 'professional' ? {
                      background: 'linear-gradient(to right, #34d399, #14b8a6)'
                    } : undefined}
                  >
                    {chatMode === 'professional' ? '专业' : '普通'}
                  </motion.div>
                )}
              </div>
            </h1>
            
            {/* 优化的打字机文本显示 */}
            <div 
              className={`text-base sm:text-lg min-h-16 flex items-center justify-center typewriter-text ${
                theme === "light" ? "text-gray-600" : "text-gray-300"
              }`}
            >
              <div className="text-center leading-relaxed px-2 sm:px-4 w-full max-w-6xl">
                <div className="inline-block break-words">
                  {/* 高性能打字机效果 */}
                  <span className="inline typewriter-text">
                    {dynamicText.slice(0, baseTextLength)}
                  </span>
                  <span className="inline font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent typewriter-text">
                    {dynamicText.slice(baseTextLength)}
                  </span>
                  <span 
                    className={`typewriter-cursor inline-block w-0.5 h-5 ml-1 transition-opacity duration-75 ease-in-out ${
                      showCursor ? "opacity-100" : "opacity-0"
                    } ${theme === "light" ? "bg-emerald-500" : "bg-emerald-400"}`}
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* 🎨 输入框 - 简约设计，品牌色仅用于边框 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.3 }} // 缩短动画时间
            className="w-full"
            style={{ 
              transform: 'translateZ(0)', // 启用硬件加速
              willChange: 'transform, opacity' // 提示浏览器优化
            }}
          >
            {/* 🎨 快捷发送按钮 - 横向滑动布局 */}
            <div className="mb-4 relative">
              {/* 左侧渐变遮罩 */}
              <div className={`absolute left-0 top-0 bottom-0 w-6 pointer-events-none z-10 ${
                theme === "light" 
                  ? "bg-gradient-to-r from-white to-transparent" 
                  : "bg-gradient-to-r from-gray-900 to-transparent"
              }`}></div>
              
              {/* 右侧渐变遮罩 */}
              <div className={`absolute right-0 top-0 bottom-0 w-6 pointer-events-none z-10 ${
                theme === "light" 
                  ? "bg-gradient-to-l from-white to-transparent" 
                  : "bg-gradient-to-l from-gray-900 to-transparent"
              }`}></div>
              
              {/* 滑动容器 */}
              <div className="overflow-x-auto scrollbar-hide">
                <div className="flex gap-3 px-6 py-1 min-w-max">
                  {(chatMode === 'professional' ? [
                    "创建React个人简历组件，包含技能展示和项目经验",
                    "生成响应式作品集页面，支持暗色模式切换",
                    "构建博客首页布局，包含文章列表和分类导航",
                    "制作团队介绍页面，包含成员卡片和联系方式"
                  ] : [
                    "我想制作求职简历，目标是互联网公司",
                    "创建设计师作品集，展示给潜在客户", 
                    "制作个人主页，分享给社交媒体粉丝",
                    "构建专业博客，吸引行业合作伙伴"
                  ]).map((example, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ 
                        delay: 0.6 + index * 0.05, // 减少延迟差
                        duration: 0.2 // 缩短动画时间
                      }}
                      className="flex-shrink-0"
                      style={{ transform: 'translateZ(0)' }} // 硬件加速
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setInputValue(example)}
                        className={`text-sm rounded-2xl border transition-all duration-300 hover:scale-105 whitespace-nowrap px-4 py-2 min-w-fit ${
                          theme === "light"
                            ? "text-gray-600 hover:text-gray-900 bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50 shadow-sm hover:shadow-md"
                            : "text-gray-400 hover:text-gray-100 bg-gray-800 border-gray-700 hover:border-gray-600 hover:bg-gray-700 shadow-sm hover:shadow-md"
                        }`}
                      >
                        {example}
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </div>
              

            </div>

            <div className="relative">
              {/* 高性能输入框容器 - 完全隔离的渲染层 */}
              <div 
                className={`relative rounded-3xl transition-all duration-300 border-2 cursor-text min-h-[90px] ${
                  isDragging
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
                    : theme === "light" 
                    ? "bg-white border-gray-200 shadow-sm hover:border-gray-300 hover:shadow-md" 
                    : "bg-gray-800 border-gray-700 shadow-sm hover:border-gray-600 hover:shadow-md"
                }`}
                onClick={() => {
                  const input = document.querySelector('#welcome-input') as HTMLTextAreaElement;
                  input?.focus();
                }}
                style={{
                  // 创建独立的合成层，完全隔离输入框
                  transform: 'translateZ(0)',
                  isolation: 'isolate',
                  contain: 'layout style paint',
                  // 强制GPU加速
                  backfaceVisibility: 'hidden',
                  perspective: '1000px',
                  // 优化重绘性能
                  willChange: 'contents'
                }}
              >
                {/* 拖拽上传蒙版 - 只在拖拽时显示 */}
                <AnimatePresence>
                  {isDragging && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 backdrop-blur-sm rounded-3xl z-10 flex items-center justify-center"
                    >
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="flex flex-col items-center text-center"
                      >
                        <Upload className="w-6 h-6 text-emerald-500 mb-1" />
                        <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                          释放文件到这里
                        </p>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
                {/* 输入框区域 */}
                <div className="px-4 pt-4 pb-4">
                  {/* 文件标签显示区域 */}
                  <AnimatePresence>
                    {uploadedFiles.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex flex-wrap gap-2 mb-3"
                      >
                        {uploadedFiles.map((fileWithPreview, index) => (
                          <motion.div
                            key={`${fileWithPreview.file.name}-${index}`}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className={`inline-flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs border max-w-[200px] ${
                              theme === "light"
                                ? "bg-gray-50 border-gray-200 text-gray-700"
                                : "bg-gray-700 border-gray-600 text-gray-300"
                            }`}
                          >
                            {/* 文件图标 */}
                            <div className="flex-shrink-0">
                              {fileWithPreview.preview ? (
                                <img
                                  src={fileWithPreview.preview}
                                  alt={fileWithPreview.file.name}
                                  className="w-4 h-4 object-cover rounded"
                                />
                              ) : (
                                <Paperclip className="w-3 h-3 text-gray-500" />
                              )}
                            </div>

                            {/* 文件名 */}
                            <span className="truncate flex-1 min-w-0">
                              {fileWithPreview.file.name.length > 15 
                                ? `${fileWithPreview.file.name.substring(0, 15)}...`
                                : fileWithPreview.file.name
                              }
                            </span>

                            {/* 状态指示器 */}
                            {fileWithPreview.isProcessing ? (
                              <div className="flex items-center gap-1">
                                <div className={`w-2 h-2 rounded-full animate-pulse ${
                                  theme === "light" ? "bg-blue-500" : "bg-blue-400"
                                }`} />
                                <span className="text-[10px] text-gray-500">
                                  {fileWithPreview.progress}%
                                </span>
                              </div>
                            ) : fileWithPreview.error ? (
                              <div className="w-2 h-2 rounded-full bg-red-500" />
                            ) : (
                              <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            )}

                            {/* 删除按钮 */}
                            <button
                              onClick={() => {
                                const newFiles = uploadedFiles.filter((_, i) => i !== index);
                                setUploadedFiles(newFiles);
                              }}
                              className="flex-shrink-0 text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <textarea
                    ref={inputRef}
                    id="welcome-input"
                    value={inputValue}
                    onChange={(e) => {
                      // 极简处理 - 只更新状态，暂时移除高度调整
                      setInputValue(e.target.value);
                      // handleTextareaChange(e); // 暂时注释掉
                    }}
                    onKeyPress={handleKeyPress}
                    onCompositionStart={handleCompositionStart}
                    onCompositionEnd={handleCompositionEnd}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    placeholder="告诉我你想要什么样的页面..."
                    className="w-full resize-none border-0 outline-none bg-transparent text-base p-2"
                    rows={2}
                    autoFocus
                    autoComplete="off"
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck="false"
                    style={{ 
                      // 最简化样式
                      minHeight: '60px',
                      maxHeight: '200px'
                    }}
                  />
                </div>
                
                {/* 左侧上传按钮 */}
                <div className="absolute bottom-2.5 left-2.5">
                  <div className="relative group">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleFileUploadClick}
                      onMouseEnter={() => setShowDropzone(true)}
                      onMouseLeave={() => setShowDropzone(false)}
                      className={`h-10 w-10 p-0 rounded-full transition-all duration-300 flex-shrink-0 hover:scale-105 ${
                        theme === "light"
                          ? "text-gray-500 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200"
                          : "text-gray-400 hover:bg-emerald-950/30 hover:text-emerald-400 hover:border-emerald-800"
                      }`}
                    >
                      <Paperclip className="w-4 h-4" />
                    </Button>
                    
                    {/* 优化的悬停提示 */}
                    <AnimatePresence>
                      {showDropzone && !isDragging && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9, y: 8 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: 8 }}
                          transition={{ duration: 0.15 }}
                          className="absolute bottom-full left-0 mb-3 z-50"
                        >
                          <div className={`relative px-3 py-2 rounded-xl shadow-xl backdrop-blur-sm border ${
                            theme === "light"
                              ? "bg-white/95 border-gray-200/50 text-gray-700"
                              : "bg-gray-900/95 border-gray-700/50 text-gray-300"
                          }`}>
                            <div className="flex items-center gap-2 whitespace-nowrap">
                              <Upload className="w-3 h-3 text-emerald-500" />
                              <span className="text-xs font-medium">拖拽文件或点击上传</span>
                            </div>
                            {/* 精确对准的小箭头 */}
                            <div className="absolute top-full left-4 transform -translate-x-1/2 -mt-px">
                              <div className={`w-2 h-2 rotate-45 border-r border-b ${
                                theme === "light" 
                                  ? "bg-white/95 border-gray-200/50" 
                                  : "bg-gray-900/95 border-gray-700/50"
                              }`}></div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* 右侧发送按钮 */}
                <div className="absolute bottom-2.5 right-2.5">
                  <Button
                    onClick={handleSendMessage}
                    disabled={(!inputValue.trim() && uploadedFiles.length === 0) || isGenerating}
                    size="sm"
                    className="h-10 w-10 p-0 rounded-full hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
                    style={{
                      background: ((!inputValue.trim() && uploadedFiles.length === 0) || isGenerating)
                        ? '#9CA3AF' 
                        : 'linear-gradient(135deg, #34D399 0%, #2DD4BF 50%, #22D3EE 100%)',
                    }}
                  >
                    <Send className="w-4 h-4 text-white" />
                  </Button>
                </div>
              </div>
              
              {/* 🎨 输入提示 - 简约设计 */}
              <div className={`flex items-center justify-center mt-4 text-sm ${
                theme === "light" ? "text-gray-500" : "text-gray-400"
              }`}>
                <span>按 Enter 发送消息，开始创建你的专属页面</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* 隐私模式提示 */}
        {isPrivacyMode && (
          <div className="w-full max-w-2xl mx-auto mt-4">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
              theme === "light" 
                ? "bg-amber-50 border border-amber-200 text-amber-700"
                : "bg-amber-950/30 border border-amber-800 text-amber-400"
            }`}>
              <div className="w-1 h-1 rounded-full bg-amber-500" />
              <span>🔒 隐私模式已启用：文件将仅在内存中处理，不会保存到服务器。处理结果在会话结束后自动清理。</span>
            </div>
          </div>
        )}

        {/* 隐藏的文件上传输入 */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt,.md,.json,.csv,.xls,.xlsx,.ppt,.pptx,.rtf"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </>
  );
}); 