'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from '@/contexts/theme-context';
import { cleanTextContent } from '@/lib/utils';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  const { theme } = useTheme();
  
  // 🔧 使用全局内容清理函数 - 优化性能，避免不必要的重新计算
  const processedContent = React.useMemo(() => {
    return cleanTextContent(content);
  }, [content]);

  // 🚀 性能优化：缓存组件配置，避免每次渲染都重新创建
  const markdownComponents = React.useMemo(() => ({
    // 标题样式 - 🔧 减少间距
    h1: ({ children }: any) => (
      <h1 className="text-2xl font-bold mb-3 text-gray-900 dark:text-gray-100 border-b border-emerald-200 dark:border-emerald-700 pb-2">
        {children}
      </h1>
    ),
    h2: ({ children }: any) => (
      <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200 mt-4">
        {children}
      </h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="text-lg font-medium mb-1.5 text-gray-800 dark:text-gray-200 mt-3">
        {children}
      </h3>
    ),
    h4: ({ children }: any) => (
      <h4 className="text-base font-medium mb-1.5 text-gray-700 dark:text-gray-300 mt-2">
        {children}
      </h4>
    ),
    
    // 段落样式 - 🔧 强化空段落检测
    p: ({ children, ...props }: any) => {
      // 🔧 更严格的空内容检测
      const childrenArray = React.Children.toArray(children);
      const hasContent = childrenArray.some(child => {
        if (typeof child === 'string') {
          return child.trim().length > 0;
        }
        if (React.isValidElement(child)) {
          return true; // React元素认为有内容
        }
        return false;
      });
      
      // 🔧 检查是否只包含空白字符或换行符
      const textContent = childrenArray
        .filter(child => typeof child === 'string')
        .join('')
        .replace(/\s+/g, ' ')
        .trim();
      
      if (!hasContent || textContent.length === 0) {
        return null; // 不渲染空段落
      }
      
      return (
        <p className="mb-2 text-gray-900 dark:text-gray-100 leading-normal font-normal" {...props}>
          {children}
        </p>
      );
    },
    
    // 列表样式 - 🔧 减少间距
    ul: ({ children }: any) => (
      <ul className="mb-2 ml-4 space-y-0.5 text-gray-900 dark:text-gray-100">
        {children}
      </ul>
    ),
    ol: ({ children }: any) => (
      <ol className="mb-2 ml-4 space-y-0.5 text-gray-900 dark:text-gray-100 list-decimal">
        {children}
      </ol>
    ),
    li: ({ children }: any) => (
      <li className="leading-relaxed">
        <span className="text-emerald-500 mr-2">•</span>
        {children}
      </li>
    ),
    
    // 代码块样式 - 🔧 减少间距
    code: ({ node, inline, className, children, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';
      
      if (!inline && language) {
        return (
          <div className="my-3 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
              {language}
            </div>
            <SyntaxHighlighter
              style={theme === 'dark' ? oneDark : oneLight}
              language={language}
              PreTag="div"
              className="!m-0 !bg-transparent"
              {...props}
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          </div>
        );
      }
      
      return (
        <code 
          className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded text-sm font-mono"
          {...props}
        >
          {children}
        </code>
      );
    },
    
    // 引用块样式 - 🔧 减少间距
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-emerald-500 pl-4 my-3 italic text-gray-600 dark:text-gray-400 bg-emerald-50/50 dark:bg-emerald-900/20 py-2 rounded-r">
        {children}
      </blockquote>
    ),
    
    // 链接样式
    a: ({ href, children }: any) => (
      <a 
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 underline decoration-emerald-300 hover:decoration-emerald-500 transition-colors"
      >
        {children}
      </a>
    ),
    
    // 表格样式 - 🔧 减少间距
    table: ({ children }: any) => (
      <div className="my-3 overflow-x-auto">
        <table className="min-w-full border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }: any) => (
      <thead className="bg-emerald-50 dark:bg-emerald-900/30">
        {children}
      </thead>
    ),
    th: ({ children }: any) => (
      <th className="px-4 py-2 text-left font-medium text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700">
        {children}
      </th>
    ),
    td: ({ children }: any) => (
      <td className="px-4 py-2 text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
        {children}
      </td>
    ),
    
    // 分割线样式 - 🔧 减少间距
    hr: () => (
      <hr className="my-4 border-0 h-px bg-gradient-to-r from-transparent via-emerald-300 to-transparent" />
    ),
    
    // 强调样式
    strong: ({ children }: any) => (
      <strong className="font-semibold text-gray-900 dark:text-gray-100">
        {children}
      </strong>
    ),
    em: ({ children }: any) => (
      <em className="italic text-gray-800 dark:text-gray-200">
        {children}
      </em>
    ),
    
    // 🔧 彻底移除换行符，防止不必要的空行
    br: () => null,
  }), [theme]); // 🚀 仅在主题变化时重新创建

  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown components={markdownComponents}>
        {processedContent}
      </ReactMarkdown>
      
      <style jsx global>{`
        .markdown-content {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
          line-height: 1.5;
          color: rgb(17, 24, 39);
        }
        
        .dark .markdown-content {
          color: rgb(243, 244, 246);
        }
        
        .markdown-content h1,
        .markdown-content h2,
        .markdown-content h3,
        .markdown-content h4,
        .markdown-content h5,
        .markdown-content h6 {
          font-weight: 600;
          line-height: 1.25;
        }
        
        /* 🔧 强化段落间距控制 */
        .markdown-content p {
          margin-bottom: 0.5rem;
          line-height: 1.6;
        }
        
        .markdown-content p:last-child {
          margin-bottom: 0;
        }
        
        /* 🔧 彻底移除空段落 */
        .markdown-content p:empty {
          display: none !important;
        }
        
        /* 🔧 移除只包含空白字符的段落 */
        .markdown-content p:has(> :only-child:empty) {
          display: none !important;
        }
        
        /* 🔧 移除只包含空白文本的段落 */
        .markdown-content p:has(> :only-child:is([data-empty="true"])) {
          display: none !important;
        }
        
        /* 🔧 优化相邻元素间距 */
        .markdown-content > *:first-child {
          margin-top: 0 !important;
        }
        
        .markdown-content > *:last-child {
          margin-bottom: 0 !important;
        }
        
        /* 🔧 优化列表间距 */
        .markdown-content ul + p,
        .markdown-content ol + p {
          margin-top: 0.5rem;
        }
        
        .markdown-content p + ul,
        .markdown-content p + ol {
          margin-top: -0.25rem;
        }
        
        .markdown-content ul li::marker {
          color: rgb(16, 185, 129);
        }
        
        .markdown-content ol li::marker {
          color: rgb(16, 185, 129);
          font-weight: 600;
        }
        
        /* 🔧 强化空白内容隐藏 */
        .markdown-content *:empty {
          display: none !important;
        }
        
        /* 🔧 移除连续的空白节点 */
        .markdown-content br + br {
          display: none !important;
        }
        
        /* 优化代码块滚动条 */
        .markdown-content pre {
          scrollbar-width: thin;
          scrollbar-color: rgb(16, 185, 129) transparent;
        }
        
        .markdown-content pre::-webkit-scrollbar {
          height: 6px;
          width: 6px;
        }
        
        .markdown-content pre::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .markdown-content pre::-webkit-scrollbar-thumb {
          background-color: rgb(16, 185, 129);
          border-radius: 3px;
        }
        
        .markdown-content pre::-webkit-scrollbar-thumb:hover {
          background-color: rgb(5, 150, 105);
        }
      `}</style>
    </div>
  );
} 