'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Send, Paperclip, Upload, X, FileText, Image, File } from 'lucide-react';
import { useTheme } from '@/contexts/theme-context';

interface FileWithPreview {
  file: File;
  id: string;
  preview?: string;
  parsedContent?: string;
  isProcessing: boolean;
  progress: number;
  error?: string;
  documentId?: string;
  tempId?: string;
}

interface EnhancedInputBoxProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onKeyPress?: (e: React.KeyboardEvent) => void;
  onFileUpload?: (file: File) => void;
  onSendWithFiles?: (message: string, files: FileWithPreview[]) => void;
  placeholder?: string;
  disabled?: boolean;
  showFileUpload?: boolean;
  acceptedFileTypes?: string;
  inputId?: string;
  className?: string;
  isGenerating?: boolean;
  quickSuggestions?: string[];
  showSuggestions?: boolean;
  sessionId?: string;
  isPrivacyMode?: boolean;
}

export function EnhancedInputBox({
  value,
  onChange,
  onSend,
  onKeyPress,
  onFileUpload,
  onSendWithFiles,
  placeholder = "输入消息...",
  disabled = false,
  showFileUpload = true,
  acceptedFileTypes = ".pdf,.doc,.docx,.txt,.md,.json,.csv,.xls,.xlsx,.ppt,.pptx,.rtf",
  inputId = "enhanced-input",
  className = "",
  isGenerating = false,
  quickSuggestions = [],
  showSuggestions = false,
  sessionId,
  isPrivacyMode = false
}: EnhancedInputBoxProps) {
  const { theme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<FileWithPreview[]>([]);

  // 处理键盘事件
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
    onKeyPress?.(e);
  };

  // 处理发送消息
  const handleSendMessage = () => {
    if (uploadedFiles.length > 0 && onSendWithFiles) {
      onSendWithFiles(value, uploadedFiles);
      setUploadedFiles([]);
    } else {
      onSend();
    }
  };

  // 处理文件上传点击
  const handleFileUploadClick = () => {
    fileInputRef.current?.click();
  };

  // 处理文件选择
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFilesChange(files);
    }
    if (e.target) {
      e.target.value = '';
    }
  };

  // 处理文件数组变化
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

  // 使用统一文档服务处理文件 - 与welcome模式完全一致
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
      setUploadedFiles(prev => prev.map(f => {
        if (filesWithPreview.some(fp => fp.id === f.id)) {
          return {
            ...f,
            isProcessing: false,
            progress: 0,
            error: error instanceof Error ? error.message : '上传失败'
          };
        }
        return f;
      }));
    }
  };

  // 移除文件
  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  // 获取文件图标
  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
      return <Image className="w-4 h-4" />;
    }
    if (['txt', 'md', 'doc', 'docx', 'pdf'].includes(ext || '')) {
      return <FileText className="w-4 h-4" />;
    }
    return <File className="w-4 h-4" />;
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

    if (showFileUpload) {
      document.addEventListener('dragenter', handleDragEnter);
      document.addEventListener('dragleave', handleDragLeave);
      document.addEventListener('dragover', handleDragOver);
      document.addEventListener('drop', handleDrop);
    }

    return () => {
      if (showFileUpload) {
        document.removeEventListener('dragenter', handleDragEnter);
        document.removeEventListener('dragleave', handleDragLeave);
        document.removeEventListener('dragover', handleDragOver);
        document.removeEventListener('drop', handleDrop);
      }
    };
  }, [onFileUpload, showFileUpload]);

  // 自动调整textarea高度
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
  };

  return (
    <div className={`w-full ${className}`}>
      {/* 快捷建议按钮 */}
      {showSuggestions && quickSuggestions.length > 0 && (
        <div className="mb-4 relative">
          {/* 渐变遮罩 */}
          <div className={`absolute left-0 top-0 bottom-0 w-6 pointer-events-none z-10 ${
            theme === "light" 
              ? "bg-gradient-to-r from-white to-transparent" 
              : "bg-gradient-to-r from-gray-900 to-transparent"
          }`}></div>
          
          <div className={`absolute right-0 top-0 bottom-0 w-6 pointer-events-none z-10 ${
            theme === "light" 
              ? "bg-gradient-to-l from-white to-transparent" 
              : "bg-gradient-to-l from-gray-900 to-transparent"
          }`}></div>
          
          {/* 滑动容器 */}
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 pb-1 px-6">
              {quickSuggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => onChange(suggestion)}
                  className={`text-xs rounded-full whitespace-nowrap flex-shrink-0 transition-all duration-300 border-2 ${
                    theme === "light"
                      ? "bg-white text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300"
                      : "bg-gray-800 text-emerald-400 border-emerald-700 hover:bg-emerald-900/20 hover:border-emerald-600"
                  }`}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 主输入框容器 */}
      <div className="relative">
        <div 
          className={`relative rounded-3xl transition-all duration-300 border-2 cursor-text min-h-[90px] ${
            isDragging
              ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
              : theme === "light" 
              ? "bg-white border-gray-200 shadow-sm hover:border-gray-300 hover:shadow-md" 
              : "bg-gray-800 border-gray-700 shadow-sm hover:border-gray-600 hover:shadow-md"
          }`}
          onClick={() => {
            textareaRef.current?.focus();
          }}
        >
          {/* 拖拽上传蒙版 */}
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
            {/* 上传的文件显示区域 - 移到输入框内部上方 */}
            <AnimatePresence>
              {uploadedFiles.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-wrap gap-2 mb-3"
                >
                  {uploadedFiles.map((fileItem) => (
                    <motion.div
                      key={fileItem.id}
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
                        {fileItem.preview ? (
                          <img
                            src={fileItem.preview}
                            alt={fileItem.file.name}
                            className="w-4 h-4 object-cover rounded"
                          />
                        ) : (
                          <Paperclip className="w-3 h-3 text-gray-500" />
                        )}
                      </div>

                      {/* 文件名 */}
                      <span className="truncate flex-1 min-w-0">
                        {fileItem.file.name.length > 15 
                          ? `${fileItem.file.name.substring(0, 15)}...`
                          : fileItem.file.name
                        }
                      </span>

                      {/* 状态指示器 - 与welcome模式完全一致 */}
                      {fileItem.isProcessing ? (
                        <div className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full animate-pulse ${
                            theme === "light" ? "bg-blue-500" : "bg-blue-400"
                          }`} />
                          <span className="text-[10px] text-gray-500">
                            {fileItem.progress}%
                          </span>
                        </div>
                      ) : fileItem.error ? (
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      )}

                      {/* 删除按钮 */}
                      <button
                        onClick={() => removeFile(fileItem.id)}
                        className="flex-shrink-0 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* 文本输入区域 */}
            <textarea
              ref={textareaRef}
              id={inputId}
              value={value}
              onChange={handleTextareaChange}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              className={`w-full resize-none border-0 outline-none focus:outline-none focus:ring-0 bg-transparent text-base leading-relaxed min-h-[60px] max-h-[200px] overflow-hidden ${
                showFileUpload ? "pl-[9px] pr-12" : "pl-[9px] pr-14"
              } ${
                theme === "light"
                  ? "placeholder:text-gray-400 text-gray-900"
                  : "placeholder:text-gray-500 text-white"
              }`}
              rows={2}
              disabled={disabled || isGenerating}
            />
          </div>
          
          {/* 左侧上传按钮 - 绝对定位 */}
          {showFileUpload && (
            <div className="absolute bottom-2.5 left-2.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleFileUploadClick}
                className={`p-2 h-10 w-10 rounded-full transition-all duration-300 ${
                  theme === "light"
                    ? "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                    : "text-gray-400 hover:bg-gray-700 hover:text-gray-300"
                }`}
                title="上传文件"
              >
                <Paperclip className="w-4 h-4" />
              </Button>
            </div>
          )}
          
          {/* 右侧发送按钮 */}
          <div className="absolute bottom-2.5 right-2.5">
            <Button
              onClick={handleSendMessage}
              disabled={(!value.trim() && uploadedFiles.length === 0) || disabled || isGenerating}
              size="sm"
              className="h-10 w-10 p-0 rounded-full hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
              style={{
                background: ((!value.trim() && uploadedFiles.length === 0) || disabled || isGenerating)
                  ? '#9CA3AF' 
                  : 'linear-gradient(135deg, #34D399 0%, #2DD4BF 50%, #22D3EE 100%)',
              }}
            >
              <Send className="w-4 h-4 text-white" />
            </Button>
          </div>
        </div>
      </div>

      {/* 隐藏的文件上传输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFileTypes}
        multiple
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}

