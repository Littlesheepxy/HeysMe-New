import React, { useState, useRef } from 'react';
import { RecoilRoot } from 'recoil';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  MessageRender,
  ChatForm,
  Conversations,
  ChatContextProvider,
  ToastContextProvider,
  AuthContextProvider,
  useChatContext,
} from 'librechat-integration-components';
import type { TMessage, TConversation } from 'librechat-integration-components';

const queryClient = new QueryClient();

// 模拟消息数据
const mockMessages: TMessage[] = [
  {
    messageId: '1',
    text: '你好！我是AI助手，有什么可以帮助您的吗？',
    isCreatedByUser: false,
    createdAt: new Date().toISOString(),
    endpoint: 'openAI',
    model: 'gpt-4',
    depth: 0,
  },
  {
    messageId: '2', 
    text: '请帮我写一个React组件',
    isCreatedByUser: true,
    createdAt: new Date().toISOString(),
    endpoint: 'openAI',
    model: 'gpt-4',
    depth: 1,
  },
  {
    messageId: '3',
    text: '好的！这里是一个简单的React组件示例：\n\n```jsx\nimport React, { useState } from \'react\';\n\nfunction Counter() {\n  const [count, setCount] = useState(0);\n\n  return (\n    <div>\n      <h2>计数器: {count}</h2>\n      <button onClick={() => setCount(count + 1)}>\n        增加\n      </button>\n      <button onClick={() => setCount(count - 1)}>\n        减少\n      </button>\n    </div>\n  );\n}\n\nexport default Counter;\n```\n\n这个组件包含了状态管理和事件处理的基本功能。',
    isCreatedByUser: false,
    createdAt: new Date().toISOString(),
    endpoint: 'openAI',
    model: 'gpt-4',
    depth: 2,
  }
];

// 模拟对话数据
const mockConversations: TConversation[] = [
  {
    conversationId: '1',
    title: 'React组件开发讨论',
    endpoint: 'openAI',
    model: 'gpt-4',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: mockMessages,
  },
  {
    conversationId: '2',
    title: 'JavaScript异步编程',
    endpoint: 'openAI',
    model: 'gpt-4',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    messages: [],
  },
  {
    conversationId: '3',
    title: 'CSS布局技巧',
    endpoint: 'openAI',
    model: 'gpt-4',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date(Date.now() - 172800000).toISOString(),
    messages: [],
  }
];

// 聊天区域组件
function ChatArea() {
  const [currentEditId, setCurrentEditId] = useState<string | null>(null);
  const [messages, setMessages] = useState<TMessage[]>(mockMessages);

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <MessageRender
            key={message.messageId}
            message={message}
            currentEditId={currentEditId}
            setCurrentEditId={setCurrentEditId}
            siblingIdx={0}
            setSiblingIdx={() => {}}
            siblingCount={1}
          />
        ))}
      </div>
      
      {/* 输入框 */}
      <div className="border-t border-gray-200 p-4">
        <ChatForm index={0} />
      </div>
    </div>
  );
}

// 侧边栏组件
function Sidebar() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isNavOpen, setIsNavOpen] = useState(true);

  return (
    <div className={`${isNavOpen ? 'w-80' : 'w-0'} transition-all duration-300 border-r border-gray-200 bg-gray-50`}>
      {isNavOpen && (
        <div className="h-full flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">对话历史</h2>
          </div>
          <div className="flex-1 overflow-hidden">
            <Conversations
              conversations={mockConversations}
              moveToTop={() => {}}
              toggleNav={() => setIsNavOpen(!isNavOpen)}
              containerRef={containerRef}
              loadMoreConversations={() => {}}
              isLoading={false}
              isSearchLoading={false}
            />
          </div>
        </div>
      )}
      
      {/* 切换按钮 */}
      <button
        onClick={() => setIsNavOpen(!isNavOpen)}
        className="absolute top-4 left-4 z-10 p-2 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
      >
        {isNavOpen ? '◀' : '▶'}
      </button>
    </div>
  );
}

// 主应用组件
function ChatApp() {
  return (
    <div className="h-screen flex bg-white">
      <Sidebar />
      <ChatArea />
    </div>
  );
}

// 根组件
function App() {
  return (
    <RecoilRoot>
      <QueryClientProvider client={queryClient}>
        <ToastContextProvider>
          <AuthContextProvider>
            <ChatContextProvider>
              <div className="min-h-screen bg-gray-100">
                <header className="bg-white shadow-sm border-b border-gray-200">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                      <h1 className="text-2xl font-bold text-gray-900">
                        LibreChat 集成示例
                      </h1>
                      <div className="text-sm text-gray-500">
                        演示三个核心功能：消息渲染、输入框、侧边栏
                      </div>
                    </div>
                  </div>
                </header>
                
                <main className="h-[calc(100vh-80px)]">
                  <ChatApp />
                </main>
              </div>
            </ChatContextProvider>
          </AuthContextProvider>
        </ToastContextProvider>
      </QueryClientProvider>
    </RecoilRoot>
  );
}

export default App; 