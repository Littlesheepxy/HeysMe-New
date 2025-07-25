'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Send, Paperclip, Upload, X } from 'lucide-react';
import { useTheme } from '@/contexts/theme-context';

// 🎨 品牌动态文本样式
const dynamicTextStyles = `
  @keyframes brand-gradient-shift {
    0% { background-position: 0% 50%; }
    25% { background-position: 100% 50%; }
    50% { background-position: 100% 100%; }
    75% { background-position: 0% 100%; }
    100% { background-position: 0% 50%; }
  }
  
  @keyframes brand-glow {
    0%, 100% { 
      filter: brightness(1) drop-shadow(0 0 2px rgba(16, 185, 129, 0.3));
    }
    50% { 
      filter: brightness(1.2) drop-shadow(0 0 8px rgba(16, 185, 129, 0.6));
    }
  }
  
  @keyframes brand-breathe {
    0%, 100% { 
      transform: scale(1);
      opacity: 0.9;
    }
    50% { 
      transform: scale(1.05);
      opacity: 1;
    }
  }
  
  @keyframes cursor-blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
  }
  
  .animate-brand-glow {
    animation: brand-glow 3s ease-in-out infinite;
  }
  
  .animate-brand-breathe {
    animation: brand-breathe 4s ease-in-out infinite;
  }
  
  .cursor-blink {
    animation: cursor-blink 1s infinite;
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
  inputValue: string;
  setInputValue: (value: string) => void;
  onSendMessage: () => void;
  isGenerating?: boolean;
  chatMode?: 'normal' | 'professional';
  onFileUpload?: (file: File) => void;
  onSendWithFiles?: (message: string, files: FileWithPreview[]) => void;
  sessionId?: string;
  isPrivacyMode?: boolean;
}

// 打字机效果Hook
const useTypewriter = (phrases: string[], baseText: string = "") => {
  const [currentText, setCurrentText] = useState("");
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const currentPhrase = phrases[currentPhraseIndex];
    
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        // 打字阶段
        if (currentText.length < currentPhrase.length) {
          setCurrentText(currentPhrase.slice(0, currentText.length + 1));
        } else {
          // 完成打字，等待一会后开始删除
          setTimeout(() => setIsDeleting(true), 1500);
        }
      } else {
        // 删除阶段
        if (currentText.length > 0) {
          setCurrentText(currentText.slice(0, -1));
        } else {
          // 删除完成，切换到下一个短语
          setIsDeleting(false);
          setCurrentPhraseIndex((prev) => (prev + 1) % phrases.length);
        }
      }
    }, isDeleting ? 30 : 80); // 删除速度比打字速度快，整体更流畅

    return () => clearTimeout(timeout);
  }, [currentText, currentPhraseIndex, isDeleting, phrases]);

  return { text: baseText + currentText, showCursor: true };
};

export function WelcomeScreen({ inputValue, setInputValue, onSendMessage, isGenerating, chatMode, onFileUpload, onSendWithFiles, sessionId, isPrivacyMode = false }: WelcomeScreenProps) {
  const { theme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showDropzone, setShowDropzone] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<FileWithPreview[]>([]);
  const [dragCounter, setDragCounter] = useState(0);

  // 动态文本短语
  const phrases = [
    "求职简历，展示给HR！",
    "作品集，展示给客户！", 
    "个性名片，展示给合作者！",
    "个人博客，展示给粉丝！",
    "项目主页，展示给伙伴！",
    "商务页面，展示给客户！"
  ];

  const baseText = "你好！我是 HeysMe AI 助手，我可以快速帮助你创建";
  const { text: dynamicText, showCursor } = useTypewriter(phrases, baseText);

  // 处理键盘事件
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 处理发送消息（包含文件）
  const handleSendMessage = () => {
    if (uploadedFiles.length > 0 && onSendWithFiles) {
      // 有文件时，使用新的发送方式
      onSendWithFiles(inputValue, uploadedFiles);
      setUploadedFiles([]); // 清空文件列表
    } else {
      // 没有文件时，使用原来的发送方式
      onSendMessage();
    }
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

  // 自动调整textarea高度
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    
    // 自动调整高度
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
  };

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
                    {chatMode === 'professional' ? '专家' : '普通'}
                  </motion.div>
                )}
              </div>
            </h1>
            
            {/* 打字机效果文本 */}
            <div className={`text-base sm:text-lg min-h-16 flex items-center justify-center ${
              theme === "light" ? "text-gray-600" : "text-gray-300"
            }`}>
              <div className="text-center leading-relaxed px-2 sm:px-4 w-full max-w-6xl">
                <div className="inline-block break-words">
                  {dynamicText.split('').map((char, index) => {
                    // 判断当前字符是否在变化的部分
                    const isInChangingPart = index >= baseText.length;
                    return (
                      <span
                        key={index}
                        className={isInChangingPart ? 'font-semibold' : ''}
                        style={isInChangingPart ? {
                          background: 'linear-gradient(to right, #10b981, #14b8a6)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text'
                        } : undefined}
                      >
                        {char}
                      </span>
                    );
                  })}
                  {showCursor && (
                    <span className={`inline-block w-0.5 h-6 ml-1 cursor-blink ${
                      theme === "light" ? "bg-gray-400" : "bg-gray-500"
                    }`}></span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* 🎨 输入框 - 简约设计，品牌色仅用于边框 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="w-full"
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
                      transition={{ delay: 0.6 + index * 0.1 }}
                      className="flex-shrink-0"
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
              {/* ChatGPT风格的输入框容器 */}
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
                    id="welcome-input"
                    value={inputValue}
                    onChange={handleTextareaChange}
                    onKeyPress={handleKeyPress}
                    placeholder="告诉我你想要什么样的页面..."
                    className={`w-full resize-none border-0 outline-none focus:outline-none focus:ring-0 bg-transparent text-base leading-relaxed min-h-[60px] max-h-[200px] pl-[9px] pr-12 overflow-hidden ${
                      theme === "light"
                        ? "placeholder:text-gray-400 text-gray-900"
                        : "placeholder:text-gray-500 text-white"
                    }`}
                    rows={2}
                    autoFocus
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
} 