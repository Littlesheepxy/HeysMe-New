'use client';

import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { cleanTextContent } from '@/lib/utils';

interface StreamingMarkdownProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  className?: string;
}

export function StreamingMarkdown({ 
  text, 
  speed = 30, 
  onComplete, 
  className = '' 
}: StreamingMarkdownProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const indexRef = useRef(0);

  // 🔧 使用全局内容清理函数
  const processedText = React.useMemo(() => {
    return cleanTextContent(text);
  }, [text]);

  // 流式显示逻辑
  useEffect(() => {
    if (!processedText || processedText === currentText) {
      return;
    }

    // 清理之前的定时器
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    setCurrentText(processedText);
    setIsComplete(false);

    // 如果新文本包含当前显示的文本，从当前位置继续
    const shouldContinue = processedText.startsWith(displayedText) && displayedText.length > 0;
    
    if (shouldContinue) {
      indexRef.current = displayedText.length;
    } else {
      indexRef.current = 0;
      setDisplayedText('');
    }

    // 启动流式显示
    timerRef.current = setInterval(() => {
      if (indexRef.current < processedText.length) {
        setDisplayedText(processedText.substring(0, indexRef.current + 1));
        indexRef.current++;
      } else {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        setIsComplete(true);
        onComplete?.();
      }
    }, speed);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [processedText, speed]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return (
    <div className={cn('streaming-markdown', className)}>
      <ReactMarkdown
        components={{
          // 🔧 段落样式 - 与MarkdownRenderer保持一致，强化空段落检测
          p: ({ children, ...props }) => {
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
          
          // 🔧 标题样式 - 与MarkdownRenderer保持一致
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold mb-3 text-gray-900 dark:text-gray-100 border-b border-emerald-200 dark:border-emerald-700 pb-2">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200 mt-4">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-medium mb-1.5 text-gray-800 dark:text-gray-200 mt-3">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-base font-medium mb-1.5 text-gray-700 dark:text-gray-300 mt-2">
              {children}
            </h4>
          ),
          
          // 🔧 列表样式 - 与MarkdownRenderer保持一致
          ul: ({ children }) => (
            <ul className="mb-2 ml-4 space-y-0.5 text-gray-900 dark:text-gray-100">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-2 ml-4 space-y-0.5 text-gray-900 dark:text-gray-100 list-decimal">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed">
              <span className="text-emerald-500 mr-2">•</span>
              {children}
            </li>
          ),
          
          // 🔧 代码样式 - 与MarkdownRenderer保持一致
          code: ({ node, inline, className, children, ...props }: any) => {
            if (inline) {
              return (
                <code 
                  className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded text-sm font-mono"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            
            return (
              <div className="my-3 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <pre className="bg-gray-100 dark:bg-gray-800 p-3 overflow-x-auto">
                  <code className="text-sm font-mono text-gray-800 dark:text-gray-200">
                    {children}
                  </code>
                </pre>
              </div>
            );
          },
          
          // 🔧 引用块样式 - 与MarkdownRenderer保持一致
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-emerald-500 pl-4 my-3 italic text-gray-600 dark:text-gray-400 bg-emerald-50/50 dark:bg-emerald-900/20 py-2 rounded-r">
              {children}
            </blockquote>
          ),
          
          // 🔧 链接样式 - 与MarkdownRenderer保持一致
          a: ({ href, children }) => (
            <a 
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 underline decoration-emerald-300 hover:decoration-emerald-500 transition-colors"
            >
              {children}
            </a>
          ),
          
          // 🔧 强调样式 - 与MarkdownRenderer保持一致
          strong: ({ children }) => (
            <strong className="font-semibold text-gray-900 dark:text-gray-100">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-gray-800 dark:text-gray-200">
              {children}
            </em>
          ),
          
          // 🔧 分割线样式 - 与MarkdownRenderer保持一致
          hr: () => (
            <hr className="my-4 border-0 h-px bg-gradient-to-r from-transparent via-emerald-300 to-transparent" />
          ),
          
          // 🔧 彻底移除不必要的换行符
          br: () => null,
        }}
      >
        {displayedText}
      </ReactMarkdown>
      
      {/* 🔧 修复：流式显示光标 - 显示在同一行 */}
      {!isComplete && displayedText && (
        <span className="inline w-0.5 h-4 bg-emerald-500 animate-pulse" />
      )}
      
      <style jsx global>{`
        .streaming-markdown {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
          line-height: 1.5;
          color: rgb(17, 24, 39);
        }
        
        .dark .streaming-markdown {
          color: rgb(243, 244, 246);
        }
        
        .streaming-markdown h1,
        .streaming-markdown h2,
        .streaming-markdown h3,
        .streaming-markdown h4,
        .streaming-markdown h5,
        .streaming-markdown h6 {
          font-weight: 600;
          line-height: 1.25;
        }
        
        /* 🔧 强化段落间距控制 */
        .streaming-markdown p {
          margin-bottom: 0.5rem;
          line-height: 1.6;
        }
        
        .streaming-markdown p:last-child {
          margin-bottom: 0;
        }
        
        /* 🔧 彻底移除空段落 */
        .streaming-markdown p:empty {
          display: none !important;
        }
        
        /* 🔧 移除只包含空白字符的段落 */
        .streaming-markdown p:has(> :only-child:empty) {
          display: none !important;
        }
        
        /* 🔧 移除只包含空白文本的段落 */
        .streaming-markdown p:has(> :only-child:is([data-empty="true"])) {
          display: none !important;
        }
        
        /* 🔧 优化相邻元素间距 */
        .streaming-markdown > *:first-child {
          margin-top: 0 !important;
        }
        
        .streaming-markdown > *:last-child {
          margin-bottom: 0 !important;
        }
        
        /* 🔧 优化列表间距 */
        .streaming-markdown ul + p,
        .streaming-markdown ol + p {
          margin-top: 0.5rem;
        }
        
        .streaming-markdown p + ul,
        .streaming-markdown p + ol {
          margin-top: -0.25rem;
        }
        
        .streaming-markdown ul li::marker {
          color: rgb(16, 185, 129);
        }
        
        .streaming-markdown ol li::marker {
          color: rgb(16, 185, 129);
          font-weight: 600;
        }
        
        /* 🔧 强化空白内容隐藏 */
        .streaming-markdown *:empty {
          display: none !important;
        }
        
        /* 🔧 移除连续的空白节点 */
        .streaming-markdown br + br {
          display: none !important;
        }
      `}</style>
    </div>
  );
} 