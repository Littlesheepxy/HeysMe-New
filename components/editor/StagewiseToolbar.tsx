'use client';

import React, { useEffect } from 'react';

interface StagewiseToolbarProps {
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  onElementModificationRequest: (elementInfo: any, prompt: string) => void;
  isEnabled: boolean;
  onToggle: () => void;
  className?: string;
}

export function StagewiseToolbar({
  iframeRef,
  onElementModificationRequest,
  isEnabled,
  onToggle,
  className
}: StagewiseToolbarProps) {
  
  // 监听来自iframe的点击事件和用户输入
  useEffect(() => {
    if (!isEnabled || !iframeRef.current) return;

    const iframe = iframeRef.current;
    
    // 为iframe添加交互功能
    const addInteractivity = () => {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) return;

      // 添加点击监听器到iframe中的所有元素
      const addClickListeners = () => {
        const elements = iframeDoc.querySelectorAll('*');
        elements.forEach((element) => {
          element.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // 高亮选中的元素
            highlightElement(element as HTMLElement);
            
            // 显示输入气泡
            showInputBubble(element as HTMLElement, e as MouseEvent);
          });
        });
      };

      // 高亮元素
      const highlightElement = (element: HTMLElement) => {
        // 移除之前的高亮
        const prevHighlight = iframeDoc.querySelector('.heysme-highlight');
        if (prevHighlight) {
          prevHighlight.classList.remove('heysme-highlight');
        }

        // 添加高亮样式
        element.classList.add('heysme-highlight');
        
        // 添加高亮CSS（如果还没有）
        if (!iframeDoc.querySelector('#heysme-highlight-styles')) {
          const style = iframeDoc.createElement('style');
          style.id = 'heysme-highlight-styles';
          style.textContent = `
            .heysme-highlight {
              outline: 2px solid #8b5cf6 !important;
              outline-offset: 2px !important;
              background-color: rgba(139, 92, 246, 0.1) !important;
              position: relative !important;
            }
            .heysme-highlight::after {
              content: '🎯 已选中 - 请描述修改需求';
              position: absolute;
              top: -30px;
              left: 0;
              background: linear-gradient(135deg, #8b5cf6, #ec4899);
              color: white;
              padding: 4px 8px;
              border-radius: 6px;
              font-size: 12px;
              font-weight: 500;
              white-space: nowrap;
              z-index: 9999;
              animation: fadeInDown 0.3s ease-out;
            }
            @keyframes fadeInDown {
              from { opacity: 0; transform: translateY(-10px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `;
          iframeDoc.head.appendChild(style);
        }
      };

      // 显示输入气泡
      const showInputBubble = (element: HTMLElement, event: MouseEvent) => {
        // 移除现有的输入气泡
        const existingBubble = iframeDoc.querySelector('.heysme-input-bubble');
        if (existingBubble) {
          existingBubble.remove();
        }

        // 创建输入气泡
        const bubble = iframeDoc.createElement('div');
        bubble.className = 'heysme-input-bubble';
        bubble.innerHTML = `
          <div style="
            position: fixed;
            top: ${event.clientY + 10}px;
            left: ${event.clientX}px;
            background: white;
            border: 2px solid #8b5cf6;
            border-radius: 12px;
            padding: 16px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            z-index: 10000;
            max-width: 320px;
            font-family: system-ui, sans-serif;
            animation: bounceIn 0.3s ease-out;
          ">
            <div style="color: #374151; font-weight: 600; margin-bottom: 8px; font-size: 14px;">
              🎨 AI设计助手
            </div>
            <div style="color: #6b7280; font-size: 12px; margin-bottom: 12px;">
              已选中: ${element.tagName.toLowerCase()}${element.className ? '.' + element.className.split(' ')[0] : ''}
            </div>
            <textarea 
              placeholder="描述你想要的修改，例如：&#10;• 把这个按钮改成绿色&#10;• 让文字更大一些&#10;• 添加圆角和阴影"
              style="
                width: 100%;
                height: 80px;
                border: 1px solid #d1d5db;
                border-radius: 8px;
                padding: 8px;
                font-size: 13px;
                resize: none;
                outline: none;
                font-family: inherit;
              "
              id="heysme-prompt-input"
            ></textarea>
            <div style="display: flex; gap: 8px; margin-top: 12px;">
              <button 
                onclick="window.heysmeSendPrompt()"
                style="
                  background: linear-gradient(135deg, #8b5cf6, #ec4899);
                  color: white;
                  border: none;
                  padding: 8px 16px;
                  border-radius: 6px;
                  font-size: 12px;
                  font-weight: 500;
                  cursor: pointer;
                  flex: 1;
                "
              >
                ✨ 开始修改
              </button>
              <button 
                onclick="window.heysmeCloseBubble()"
                style="
                  background: #f3f4f6;
                  color: #6b7280;
                  border: none;
                  padding: 8px 12px;
                  border-radius: 6px;
                  font-size: 12px;
                  cursor: pointer;
                "
              >
                取消
              </button>
            </div>
          </div>
        `;

        // 添加动画样式
        if (!iframeDoc.querySelector('#heysme-bubble-styles')) {
          const style = iframeDoc.createElement('style');
          style.id = 'heysme-bubble-styles';
          style.textContent = `
            @keyframes bounceIn {
              0% { transform: scale(0.3); opacity: 0; }
              50% { transform: scale(1.05); }
              70% { transform: scale(0.9); }
              100% { transform: scale(1); opacity: 1; }
            }
          `;
          iframeDoc.head.appendChild(style);
        }

        iframeDoc.body.appendChild(bubble);

        // 聚焦到输入框
        const input = iframeDoc.querySelector('#heysme-prompt-input') as HTMLTextAreaElement;
        if (input) {
          input.focus();
        }

        // 添加全局函数
        (iframe.contentWindow as any).heysmeSendPrompt = () => {
          const prompt = input?.value?.trim();
          if (prompt) {
            const elementInfo = {
              tagName: element.tagName.toLowerCase(),
              className: element.className,
              textContent: element.textContent?.slice(0, 100) || '',
              id: element.id,
              selector: element.id ? `#${element.id}` : element.className ? `.${element.className.split(' ')[0]}` : element.tagName.toLowerCase()
            };
            onElementModificationRequest(elementInfo, prompt);
            bubble.remove();
            element.classList.remove('heysme-highlight');
          }
        };

        (iframe.contentWindow as any).heysmeCloseBubble = () => {
          bubble.remove();
          element.classList.remove('heysme-highlight');
        };

        // 点击外部关闭气泡
        iframeDoc.addEventListener('click', (e) => {
          if (!bubble.contains(e.target as Node) && e.target !== element) {
            bubble.remove();
            element.classList.remove('heysme-highlight');
          }
        }, { once: true });
      };

      addClickListeners();
    };

    // iframe加载完成后添加交互功能
    if (iframe.contentDocument?.readyState === 'complete') {
      addInteractivity();
    } else {
      iframe.addEventListener('load', addInteractivity);
    }

    return () => {
      iframe.removeEventListener('load', addInteractivity);
    };
  }, [isEnabled, iframeRef, onElementModificationRequest]);

  if (!isEnabled) {
    return null;
  }

  return (
    <div className={className}>
      {/* AI设计模式的状态指示器 */}
      <div className="fixed bottom-4 right-4 z-50 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full shadow-lg">
        <div className="flex items-center gap-2 text-sm font-medium">
          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
          AI设计模式已激活
        </div>
      </div>
    </div>
  );
} 