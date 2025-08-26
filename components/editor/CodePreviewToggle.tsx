'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Eye, 
  Code2, 
  Download, 
  ExternalLink,
  FileText,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Copy,
  Play,
  Edit3,
  Save,
  X,
  Check,
  Sparkles,
  Zap,
  Settings,
  Share2,
  Wand2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/theme-context';
import VercelPreview from './VercelPreview';
import VercelDeploy from './VercelDeploy';
import { CodeEditorPanel } from './CodeEditorPanel';
import { Separator } from '@/components/ui/separator';
import { ShareDialog } from '@/components/dialogs/share-dialog';

// 代码文件接口
interface CodeFile {
  filename: string;
  content: string;
  language: string;
  description?: string;
  type: 'page' | 'component' | 'styles' | 'config' | 'data';
}

// 预览数据接口
interface PreviewData {
  files: CodeFile[];
  projectName: string;
  description?: string;
  dependencies?: Record<string, string>;
}

interface CodePreviewToggleProps {
  files: CodeFile[];
  isStreaming?: boolean;
  previewData?: PreviewData;
  onDownload?: () => void;
  onDeploy?: () => void;
  onEditCode?: (filename: string) => void;
  onSendMessage?: (message: string, options?: any) => void;
  // 🆕 自动部署相关
  autoDeployEnabled?: boolean;
  isProjectComplete?: boolean;
  onAutoDeployStatusChange?: (enabled: boolean) => void;
  deploymentUrl?: string;
}

type ViewMode = 'code' | 'preview' | 'deploy';
type EditMode = 'none' | 'text' | 'ai';

// 语法高亮函数
const highlightCode = (code: string, language: string) => {
  const keywords = {
    typescript: ['const', 'let', 'var', 'function', 'return', 'import', 'export', 'default', 'interface', 'type', 'class', 'extends', 'implements', 'public', 'private', 'protected', 'static', 'readonly', 'async', 'await', 'if', 'else', 'for', 'while', 'try', 'catch', 'finally', 'throw', 'new', 'this', 'super', 'null', 'undefined', 'true', 'false'],
    javascript: ['const', 'let', 'var', 'function', 'return', 'import', 'export', 'default', 'class', 'extends', 'async', 'await', 'if', 'else', 'for', 'while', 'try', 'catch', 'finally', 'throw', 'new', 'this', 'null', 'undefined', 'true', 'false'],
    jsx: ['const', 'let', 'var', 'function', 'return', 'import', 'export', 'default', 'class', 'extends', 'async', 'await', 'if', 'else', 'for', 'while', 'try', 'catch', 'finally', 'throw', 'new', 'this', 'null', 'undefined', 'true', 'false'],
    tsx: ['const', 'let', 'var', 'function', 'return', 'import', 'export', 'default', 'interface', 'type', 'class', 'extends', 'implements', 'public', 'private', 'protected', 'static', 'readonly', 'async', 'await', 'if', 'else', 'for', 'while', 'try', 'catch', 'finally', 'throw', 'new', 'this', 'super', 'null', 'undefined', 'true', 'false'],
    css: ['color', 'background', 'margin', 'padding', 'border', 'width', 'height', 'display', 'position', 'top', 'left', 'right', 'bottom', 'flex', 'grid', 'font', 'text', 'transform', 'transition', 'animation'],
    json: ['true', 'false', 'null']
  };

  const langKeywords = keywords[language as keyof typeof keywords] || [];
  
  let highlightedCode = code;
  
  // 预处理 - 转义HTML实体
  highlightedCode = highlightedCode
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  // 高亮字符串（使用 VS Code 绿色）
  highlightedCode = highlightedCode.replace(
    /(["'`])(?:(?=(\\?))\2.)*?\1/g,
    '<span style="color: #ce9178;">$&</span>'
  );
  
  // 高亮模板字符串
  highlightedCode = highlightedCode.replace(
    /(`[^`]*`)/g,
    '<span style="color: #ce9178;">$&</span>'
  );
  
  // 高亮注释（使用 VS Code 注释绿色）
  highlightedCode = highlightedCode.replace(
    /(\/\/.*$)/gm,
    '<span style="color: #6a9955; font-style: italic;">$&</span>'
  );
  highlightedCode = highlightedCode.replace(
    /(\/\*[\s\S]*?\*\/)/g,
    '<span style="color: #6a9955; font-style: italic;">$&</span>'
  );
  
  // 高亮关键字（使用 VS Code 蓝色）
  langKeywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'g');
    highlightedCode = highlightedCode.replace(
      regex,
      `<span style="color: #569cd6; font-weight: 500;">${keyword}</span>`
    );
  });
  
  // 高亮数字（使用 VS Code 浅绿色）
  highlightedCode = highlightedCode.replace(
    /\b\d+\.?\d*\b/g,
    '<span style="color: #b5cea8;">$&</span>'
  );

  // 高亮函数调用（黄色）
  highlightedCode = highlightedCode.replace(
    /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?=\()/g,
    '<span style="color: #dcdcaa;">$1</span>'
  );

  // JSX/TSX 特殊处理
  if (language === 'jsx' || language === 'tsx') {
    // 高亮JSX标签（红色）
    highlightedCode = highlightedCode.replace(
      /(&lt;\/?)([\w-]+)/g,
      '$1<span style="color: #f44747;">$2</span>'
    );
    
    // 高亮JSX属性（浅蓝色）
    highlightedCode = highlightedCode.replace(
      /(\w+)(?==)/g,
      '<span style="color: #9cdcfe;">$1</span>'
    );

    // 高亮JSX花括号
    highlightedCode = highlightedCode.replace(
      /[{}]/g,
      '<span style="color: #d4d4aa;">$&</span>'
    );
  }

  // CSS 特殊处理
  if (language === 'css') {
    // 高亮CSS属性（浅蓝色）
    highlightedCode = highlightedCode.replace(
      /([a-zA-Z-]+)(?=\s*:)/g,
      '<span style="color: #9cdcfe;">$1</span>'
    );
    
    // 高亮CSS值
    highlightedCode = highlightedCode.replace(
      /:\s*([^;]+);?/g,
      ': <span style="color: #ce9178;">$1</span>;'
    );
  }

  // 高亮类型注解（TypeScript）
  if (language === 'typescript' || language === 'tsx') {
    highlightedCode = highlightedCode.replace(
      /:\s*([A-Z][a-zA-Z0-9<>[\]|&]*)/g,
      ': <span style="color: #4ec9b0;">$1</span>'
    );
  }

  return highlightedCode;
};

// 这个FileTree组件已经被独立的FileTree.tsx文件替代，不再使用

// 代码查看器组件
const CodeViewer: React.FC<{
  file: CodeFile;
}> = ({ file }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(file.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 分割代码为行
  const codeLines = file.content.split('\n');
  
  return (
    <div className="h-full flex flex-col bg-vscode-bg">
      {/* 文件标签栏 - VS Code 风格 */}
      <div className="flex items-center bg-vscode-sidebar border-b border-vscode-border">
        <div className="flex items-center px-4 py-2 bg-vscode-panel border-r border-vscode-border text-vscode-text">
          <FileText className="w-4 h-4 mr-2" />
          <span className="text-sm">{file.filename}</span>
          <div className="ml-2 w-2 h-2 rounded-full bg-orange-500"></div>
        </div>
      </div>

      {/* 工具栏 */}
      <div className="flex items-center justify-between px-4 py-2 bg-vscode-sidebar border-b border-vscode-border">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <div className="flex items-center gap-2 text-vscode-text">
            <Badge variant="secondary" className="bg-vscode-panel text-vscode-text text-xs border border-vscode-border">
              {file.language.toUpperCase()}
            </Badge>
            <span className="text-xs text-gray-400">{file.description}</span>
          </div>
        </div>
        
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="text-vscode-text hover:text-white hover:bg-vscode-panel transition-colors border border-transparent hover:border-vscode-border"
          >
            {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
            {copied ? '已复制' : '复制代码'}
          </Button>
        </motion.div>
      </div>

      {/* 代码内容区域 */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex">
          {/* 行号区域 */}
          <div className="bg-vscode-sidebar border-r border-vscode-border text-gray-500 text-sm font-mono select-none">
            <div className="px-4 py-4 space-y-0 leading-6">
              {codeLines.map((_, index) => (
                <div 
                  key={index} 
                  className="text-right hover:text-gray-300 transition-colors cursor-pointer code-line-number"
                  style={{ lineHeight: '1.5rem', minHeight: '1.5rem' }}
                >
                  {String(index + 1).padStart(String(codeLines.length).length, ' ')}
                </div>
              ))}
            </div>
          </div>

          {/* 代码内容区域 */}
          <div className="flex-1 overflow-auto bg-vscode-bg vscode-scrollbar">
            <div className="relative">
              <pre 
                className="text-sm font-mono text-vscode-text p-4 min-h-full leading-6 code-editor"
                style={{ 
                  fontFamily: 'JetBrains Mono, Fira Code, Consolas, Monaco, Courier New, monospace',
                  tabSize: 2
                }}
              >
                {codeLines.map((line, index) => (
                  <div 
                    key={index}
                    className="code-line"
                    style={{ lineHeight: '1.5rem', minHeight: '1.5rem' }}
                    dangerouslySetInnerHTML={{
                      __html: highlightCode(line, file.language)
                    }}
                  />
                ))}
              </pre>
              
              {/* 滚动指示器 */}
              <div className="absolute top-0 right-0 w-3 bg-gradient-to-b from-vscode-bg via-transparent to-vscode-bg pointer-events-none"></div>
            </div>
          </div>
        </div>
      </div>

      {/* 底部状态栏 */}
      <div className="px-4 py-2 bg-vscode-panel border-t border-vscode-border flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-4">
          <span>UTF-8</span>
          <span>{file.language.toUpperCase()}</span>
          <span>{codeLines.length} 行</span>
          <span>{file.content.length} 字符</span>
        </div>
        <div className="flex items-center gap-2">
          <span>空格: 2</span>
          <span className="flex items-center gap-1">
            就绪
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          </span>
        </div>
      </div>
    </div>
  );
};

export function CodePreviewToggle({
  files,
  isStreaming = false,
  previewData,
  onDownload,
  onDeploy,
  onEditCode,
  onSendMessage,
  autoDeployEnabled = false,
  isProjectComplete = false,
  onAutoDeployStatusChange,
  deploymentUrl
}: CodePreviewToggleProps) {
  const { theme } = useTheme();
  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const [activeFile, setActiveFile] = useState(files[0]?.filename || '');
  const [editMode, setEditMode] = useState<EditMode>('none');
  const [hasAutoDeployed, setHasAutoDeployed] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [showAiTip, setShowAiTip] = useState(true);

  // 🚀 自动部署逻辑：项目完成后自动触发部署（但要检查是否已有保存的URL）
  React.useEffect(() => {
    if (
      autoDeployEnabled && 
      isProjectComplete && 
      !hasAutoDeployed && 
      files.length > 0 && 
      !isStreaming &&
      onDeploy
    ) {
      // 🔧 检查是否已有保存的预览URL
      if (deploymentUrl) {
        console.log('✅ [自动部署] 检测到已保存的预览URL，跳过重新部署:', deploymentUrl);
        setHasAutoDeployed(true);
        return;
      }

      console.log('🚀 [自动部署] 触发自动部署，项目已完成');
      console.log(`📊 [自动部署] 检测到 ${files.length} 个文件，开始部署流程`);
      
      // 延迟一秒后自动部署，确保所有文件都已准备就绪
      const deployTimer = setTimeout(async () => {
        try {
          console.log('🎯 [自动部署] 调用部署函数...');
          await onDeploy();
          setHasAutoDeployed(true);
          console.log('✅ [自动部署] 部署函数调用完成');
        } catch (error) {
          console.error('❌ [自动部署] 部署失败:', error);
        }
      }, 1000);
      
      return () => clearTimeout(deployTimer);
    }
  }, [autoDeployEnabled, isProjectComplete, hasAutoDeployed, files.length, isStreaming, onDeploy, deploymentUrl]);

  // 重置自动部署状态，当文件发生变化时
  React.useEffect(() => {
    if (files.length > 0) {
      setHasAutoDeployed(false);
      
      // 🔧 如果文件内容发生变化，清理之前的预览URL（仅当没有外部URL时）
      if (!deploymentUrl) {
        setPreviewUrl('');
      }
    }
  }, [files, deploymentUrl]);

  // 监听外部传入的部署URL并更新预览
  React.useEffect(() => {
    if (deploymentUrl && deploymentUrl !== previewUrl) {
      console.log('🔗 [CodePreviewToggle] 更新预览URL:', deploymentUrl);
      setPreviewUrl(deploymentUrl);
    }
  }, [deploymentUrl, previewUrl]);

  const currentFile = files.find(f => f.filename === activeFile);

  const handleContentChange = (field: string, value: string) => {
    // 处理内容变化
    console.log('Content changed:', field, value);
    
    // 如果是可视化编辑请求，发送到聊天系统
    if (field === 'visual_edit_request' && onSendMessage) {
      onSendMessage(value, { 
        type: 'visual_edit',
        context: 'stagewise'
      });
    }
  };

  const handlePreviewReady = (url: string) => {
    console.log('🎉 [CodePreviewToggle] 预览就绪:', url);
    setPreviewUrl(url);
  };

  // 编辑模式配置
  const editModes = [
    { 
      key: 'none' as EditMode, 
      label: '查看', 
      icon: Eye, 
      description: '只读模式',
      color: 'gray'
    },
    { 
      key: 'text' as EditMode, 
      label: '文本编辑', 
      icon: Edit3, 
      description: '直接编辑代码',
      color: 'blue'
    },
    { 
      key: 'ai' as EditMode, 
      label: 'AI设计', 
      icon: Wand2, 
      description: '可视化AI编辑',
      color: 'purple'
    }
  ];

  const getFileIcon = (filename: string, type: string) => {
    if (filename.endsWith('.tsx') || filename.endsWith('.ts')) return <FileText className="w-4 h-4" />;
    if (filename.endsWith('.css')) return <FileText className="w-4 h-4" />;
    if (filename.endsWith('.json')) return <FileText className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };



  if (!files || files.length === 0) {
    return (
      <Card className={`w-full h-full flex items-center justify-center transition-all duration-300 ${
        theme === "light" 
          ? "bg-white/80 border-emerald-100/60 backdrop-blur-xl" 
          : "bg-gray-800/80 border-emerald-700/30 backdrop-blur-xl"
      }`}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 bg-brand-gradient rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-brand animate-brand-breathe">
            <Code2 className="w-8 h-8 text-white" />
          </div>
          <p className={`text-lg font-medium ${theme === "light" ? "text-gray-600" : "text-gray-300"}`}>
            等待代码生成中...
          </p>
        </motion.div>
      </Card>
    );
  }

  return (
    <div className={`h-full flex flex-col ${theme === 'light' ? 'bg-white' : 'bg-gray-900'}`}>
      {/* 🎨 顶部工具栏 - 品牌设计升级 */}
      <motion.div 
        className={`flex items-center justify-between px-4 py-2 border-b transition-all duration-300 ${
          theme === "light" 
            ? "bg-white/90 border-emerald-100/60 backdrop-blur-xl" 
            : "bg-gray-900/90 border-emerald-700/30 backdrop-blur-xl"
        }`}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* 左侧：视图切换 */}
        <div className="flex items-center gap-2">
          <motion.div className={`flex p-1 rounded-xl ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-800'}`}>
            {(['preview', 'code', 'deploy'] as ViewMode[]).map((mode) => (
              <motion.button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  viewMode === mode
                    ? theme === 'light' 
                      ? "bg-white text-emerald-700 shadow-sm"
                      : "bg-gray-700 text-emerald-400 shadow-sm"
                    : theme === 'light'
                      ? "text-gray-600 hover:text-gray-900"
                      : "text-gray-400 hover:text-gray-200"
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {mode === 'preview' && <Eye className="w-4 h-4" />}
                {mode === 'code' && <Code2 className="w-4 h-4" />}
                {mode === 'deploy' && <Sparkles className="w-4 h-4" />}
                {mode === 'preview' ? '预览' : mode === 'code' ? '代码' : '部署'}
              </motion.button>
            ))}
          </motion.div>
        </div>

        {/* 右侧：编辑模式和设备切换 - 只在预览模式显示 */}
        {viewMode === 'preview' && (
          <div className="flex items-center gap-3">
            {/* 编辑模式切换 */}
            <div className={`flex p-1 rounded-xl ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-800'}`}>
              <motion.button
                onClick={() => setEditMode('none')}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  editMode === 'none'
                    ? theme === 'light'
                      ? "bg-white text-gray-900 shadow-sm"
                      : "bg-gray-700 text-gray-100 shadow-sm"
                    : theme === 'light'
                      ? "text-gray-600 hover:text-gray-900"
                      : "text-gray-400 hover:text-gray-100"
                )}
              >
                <Eye className="w-4 h-4" />
                预览
              </motion.button>
              
              <motion.button
                onClick={() => setEditMode('text')}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  editMode === 'text'
                    ? theme === 'light'
                      ? "bg-white text-gray-900 shadow-sm"
                      : "bg-gray-700 text-gray-100 shadow-sm"
                    : theme === 'light'
                      ? "text-gray-600 hover:text-gray-900"
                      : "text-gray-400 hover:text-gray-100"
                )}
              >
                <Edit3 className="w-4 h-4" />
                文本编辑
              </motion.button>
              
              <motion.button
                onClick={() => {
                  setEditMode('ai');
                  setShowAiTip(true);
                }}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative",
                  editMode === 'ai'
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                    : theme === 'light'
                      ? "text-gray-600 hover:text-gray-900"
                      : "text-gray-400 hover:text-gray-100"
                )}
              >
                <Wand2 className="w-4 h-4" />
                AI设计
                {editMode === 'ai' && (
                  <motion.div
                    className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  />
                )}
              </motion.button>
            </div>


          </div>
        )}

        {/* 代码模式下的编辑提示 */}
        {viewMode === 'code' && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              <Edit3 className="w-3 h-3 mr-1" />
              文本编辑模式
            </Badge>
          </div>
        )}

        {/* AI设计模式使用说明 - 浮动卡片 */}
        {editMode === 'ai' && showAiTip && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            className="fixed top-20 right-6 z-50 max-w-sm backdrop-blur-md bg-white/80 dark:bg-gray-800/80 shadow-2xl rounded-2xl border border-white/20 dark:border-gray-700/50 overflow-hidden"
            style={{
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)'
            }}
          >
            {/* 关闭按钮 */}
            <button
              onClick={() => setShowAiTip(false)}
              className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center transition-colors z-10 hover:opacity-70"
            >
              <X className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </button>

            {/* 头部 */}
            <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Wand2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base leading-tight">AI设计模式</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5 leading-tight">点击元素即可编辑</p>
                </div>
              </div>
            </div>

            {/* 内容区域 */}
            <div className="p-4 relative">
              <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0 shadow-sm"></span>
                  <div>
                    <span className="font-medium text-gray-900 dark:text-gray-100">选择元素</span>
                    <p className="text-xs opacity-80">点击预览中的任意元素</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-pink-500 rounded-full mt-2 flex-shrink-0 shadow-sm"></span>
                  <div>
                    <span className="font-medium text-gray-900 dark:text-gray-100">描述需求</span>
                    <p className="text-xs opacity-80">在弹出框中描述修改</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0 shadow-sm"></span>
                  <div>
                    <span className="font-medium text-gray-900 dark:text-gray-100">AI自动修改</span>
                    <p className="text-xs opacity-80">AI将生成相应代码</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-gradient-to-r from-purple-50/80 to-pink-50/80 dark:from-purple-900/30 dark:to-pink-900/30 rounded-lg border border-purple-100/50 dark:border-purple-700/30 backdrop-blur-sm">
                <div className="text-xs text-purple-600 dark:text-purple-400 font-medium mb-1">💡 示例</div>
                <div className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed opacity-90">
                  "把按钮改成绿色"<br/>
                  "增加联系方式"<br/>
                  "让标题更大"
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* 🎨 主内容区域 */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {viewMode === 'preview' ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <VercelPreview
                files={files}
                projectName={previewData?.projectName || '项目预览'}
                description={previewData?.description}
                isLoading={false}
                previewUrl={deploymentUrl || previewUrl}
                enableVercelDeploy={true}
                onPreviewReady={handlePreviewReady}
                onLoadingChange={(loading: boolean) => console.log('Loading:', loading)}
                isEditMode={editMode === 'ai'}
                onContentChange={handleContentChange}
                onRefresh={async () => {
                  console.log('🔄 [CodePreviewToggle] 刷新请求，重新部署...');
                  if (onDeploy) {
                    try {
                      await onDeploy();
                      console.log('✅ [CodePreviewToggle] 重新部署完成');
                    } catch (error) {
                      console.error('❌ [CodePreviewToggle] 重新部署失败:', error);
                    }
                  }
                }}
              />
            </motion.div>
          ) : viewMode === 'deploy' ? (
            <motion.div
              key="deploy"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="h-full p-6"
            >
              <VercelDeploy
                files={files}
                projectName={previewData?.projectName || '项目部署'}
                description={previewData?.description}
                isEnabled={files.length > 0}
                onDeploymentComplete={(deployment) => {
                  console.log('Deployment completed:', deployment);
                  // 这里可以添加部署完成后的处理逻辑
                }}
                onDeploymentError={(error) => {
                  console.error('Deployment error:', error);
                  // 这里可以添加部署错误处理逻辑
                }}
              />
            </motion.div>
          ) : (
            <motion.div
              key="code"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              {/* 🎨 新版代码编辑器 */}
              <CodeEditorPanel
                files={files.map(file => ({
                  ...file,
                  editable: true
                }))}
                onFileUpdate={(filename, content) => {
                  // 这里可以添加文件更新逻辑
                  console.log('File updated:', filename, content);
                }}
                onFileAdd={(file) => {
                  // 这里可以添加文件添加逻辑
                  console.log('File added:', file);
                }}
                onFileDelete={(filename) => {
                  // 这里可以添加文件删除逻辑
                  console.log('File deleted:', filename);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 🎨 底部操作栏 */}
      <motion.div 
        className={`flex items-center justify-between p-4 border-t transition-all duration-300 ${
          theme === "light" 
            ? "bg-white/90 border-emerald-100/60 backdrop-blur-xl" 
            : "bg-gray-900/90 border-emerald-700/30 backdrop-blur-xl"
        }`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3">
          <Badge className={`rounded-full ${
            theme === "light" 
              ? "bg-emerald-100 text-emerald-700 border-emerald-200" 
              : "bg-emerald-900/30 text-emerald-400 border-emerald-700"
          }`}>
            {files.length} 个文件
          </Badge>
          
          {/* 环境状态指示器 */}
          <Badge className={`rounded-full ${
            viewMode === 'preview' 
              ? "bg-emerald-100 text-emerald-700 border-emerald-200" 
              : viewMode === 'deploy'
                ? "bg-blue-100 text-blue-700 border-blue-200"
                : "bg-gray-100 text-gray-700 border-gray-200"
          }`}>
            {viewMode === 'preview' && <Eye className="w-3 h-3 mr-1" />}
            {viewMode === 'deploy' && <Sparkles className="w-3 h-3 mr-1" />}
            {viewMode === 'code' && <Code2 className="w-3 h-3 mr-1" />}
            {viewMode === 'preview' ? '预览环境' : viewMode === 'deploy' ? '生产环境' : '代码编辑'}
          </Badge>
          
          {/* 编辑模式状态指示器 - 仅在预览模式显示 */}
          {viewMode === 'preview' && editMode !== 'none' && (
            <Badge className={`rounded-full ${
              editMode === 'ai' 
                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white" 
                : editMode === 'text'
                  ? "bg-blue-500 text-white"
                  : "bg-gray-500 text-white"
            }`}>
              {editMode === 'ai' && <Wand2 className="w-3 h-3 mr-1" />}
              {editMode === 'text' && <Edit3 className="w-3 h-3 mr-1" />}
              {editMode === 'ai' ? 'AI设计中' : editMode === 'text' ? '文本编辑中' : '编辑中'}
            </Badge>
          )}
          
          {isStreaming && (
            <Badge className="rounded-full bg-brand-gradient text-white animate-pulse">
              <Zap className="w-3 h-3 mr-1" />
              生成中...
            </Badge>
          )}
        </div>

        <div className="flex gap-2">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <ShareDialog
              pageId={previewData?.projectName || 'project'}
              pageTitle={previewData?.projectName || '我的项目'}
              pageContent={previewData}
              onShare={async (shareData: any) => {
                console.log('分享数据:', shareData);
                // 这里可以添加分享逻辑
              }}
            >
              <Button
                size="sm"
                className="rounded-xl text-white font-medium transition-all duration-300 hover:shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #34D399 0%, #2DD4BF 50%, #22D3EE 100%)',
                }}
              >
                <Share2 className="w-4 h-4 mr-2" />
                分享
              </Button>
            </ShareDialog>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

export default CodePreviewToggle; 