'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Send, Paperclip, Upload, X } from 'lucide-react';
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

interface UnifiedInputBoxProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onKeyPress?: (e: React.KeyboardEvent) => void;
  onFileUpload?: (file: File) => void;
  onSendWithFiles?: (message: string, files: FileWithPreview[]) => void;
  placeholder?: string;
  disabled?: boolean;
  showFileUpload?: boolean;
  supportMultiline?: boolean;
  showDropzone?: boolean;
  acceptedFileTypes?: string;
  maxHeight?: string;
  className?: string;
  inputId?: string;
}

export function UnifiedInputBox({
  value,
  onChange,
  onSend,
  onKeyPress,
  onFileUpload,
  onSendWithFiles,
  placeholder = "输入消息...",
  disabled = false,
  showFileUpload = true,
  supportMultiline = false,
  showDropzone = false,
  acceptedFileTypes = ".pdf,.doc,.docx,.txt,.md,.json",
  maxHeight = "200px",
  className = "",
  inputId = "unified-input"
}: UnifiedInputBoxProps) {
  const { theme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [uploadedFiles, setUploadedFiles] = useState<FileWithPreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);

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
    if (disabled) return;
    
    if (uploadedFiles.length > 0 && onSendWithFiles) {
      onSendWithFiles(value, uploadedFiles);
      setUploadedFiles([]);
    } else if (value.trim() || uploadedFiles.length > 0) {
      onSend();
    }
  };

  // 文件上传处理
  const handleFileUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFilesChange(files);
    }
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleFilesChange = (files: File[]) => {
    const filesWithPreview = files.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      isProcessing: false,
      progress: 100,
      parsedContent: undefined,
      error: undefined
    }));
    
    setUploadedFiles(prev => [...prev, ...filesWithPreview]);
  };

  // 拖拽处理
  useEffect(() => {
    if (!showDropzone) return;

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      setDragCounter(prev => prev + 1);
      setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      setDragCounter(prev => prev - 1);
      if (dragCounter <= 1) {
        setIsDragging(false);
      }
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
  }, [showDropzone, dragCounter]);

  // 自动调整textarea高度
  useEffect(() => {
    if (supportMultiline && textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, parseInt(maxHeight)) + 'px';
    }
  }, [value, supportMultiline, maxHeight]);

  const inputClassName = `w-full border-0 outline-none focus:outline-none focus:ring-0 bg-transparent text-base transition-all duration-300 ${
    theme === "light"
      ? "placeholder:text-gray-400 text-gray-900"
      : "placeholder:text-gray-500 text-white"
  }`;

  return (
    <div className={`relative ${className}`}>
      {/* 输入框容器 */}
      <div 
        className={`relative rounded-3xl transition-all duration-300 border-2 cursor-text ${
          supportMultiline ? 'min-h-[90px]' : 'h-[72px]'
        } ${
          isDragging
            ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
            : theme === "light" 
            ? "bg-white border-emerald-200/80 shadow-sm hover:border-emerald-300/80" 
            : "bg-gray-800 border-emerald-700/50 shadow-sm hover:border-emerald-600/50"
        }`}
        onClick={() => {
          const input = supportMultiline ? textareaRef.current : inputRef.current;
          input?.focus();
        }}
      >
        {/* 拖拽上传蒙版 */}
        <AnimatePresence>
          {isDragging && showDropzone && (
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

        {/* 输入区域 */}
        <div className={supportMultiline ? "px-4 pt-4 pb-4" : "px-4 py-4 flex items-center"}>
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

          {/* 输入框 */}
          <div className="flex-1 relative">
            {supportMultiline ? (
              <textarea
                ref={textareaRef}
                id={inputId}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={placeholder}
                className={`${inputClassName} resize-none min-h-[60px] overflow-hidden pr-12`}
                style={{ maxHeight }}
                disabled={disabled}
                rows={2}
              />
            ) : (
              <input
                ref={inputRef}
                id={inputId}
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={placeholder}
                className={`${inputClassName} pr-16`}
                disabled={disabled}
              />
            )}
          </div>
        </div>

        {/* 左侧上传按钮 */}
        {showFileUpload && (
          <div className="absolute bottom-2.5 left-2.5">
            <div className="relative group">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleFileUploadClick}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                className={`h-9 w-9 p-0 rounded-full transition-all duration-300 flex-shrink-0 hover:scale-105 ${
                  theme === "light"
                    ? "text-gray-500 hover:bg-emerald-50 hover:text-emerald-600"
                    : "text-gray-400 hover:bg-emerald-950/30 hover:text-emerald-400"
                }`}
              >
                <Paperclip className="w-4 h-4" />
              </Button>
              
              {/* 悬停提示 */}
              <AnimatePresence>
                {showTooltip && !isDragging && (
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
                        <span className="text-xs font-medium">
                          {showDropzone ? "拖拽文件或点击上传" : "点击上传文件"}
                        </span>
                      </div>
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
        )}

        {/* 右侧发送按钮 */}
        <div className="absolute bottom-2.5 right-2.5">
          <Button
            onClick={handleSendMessage}
            disabled={(!value.trim() && uploadedFiles.length === 0) || disabled}
            size="sm"
            className="h-9 w-9 p-0 rounded-full hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
            style={{
              background: ((!value.trim() && uploadedFiles.length === 0) || disabled)
                ? '#9CA3AF' 
                : 'linear-gradient(135deg, #34D399 0%, #2DD4BF 50%, #22D3EE 100%)',
            }}
          >
            <Send className="w-4 h-4 text-white" />
          </Button>
        </div>
      </div>

      {/* 隐藏的文件上传输入 */}
      {showFileUpload && (
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFileTypes}
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
      )}
    </div>
  );
} 