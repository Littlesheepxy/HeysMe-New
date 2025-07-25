'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { FileCode, MessageSquare, Sparkles } from 'lucide-react';

export default function TestTextCodeSeparationPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // 模拟AI响应数据
  const mockAIResponse = {
    textContent: `我将为您创建一个现代化的React应用程序。

这个项目将包含以下特性：
- 响应式设计
- 现代UI组件
- TypeScript支持
- 优化的性能

正在生成项目文件...`,
    
    codeFiles: [
      {
        filename: 'App.tsx',
        content: `import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome to React</h1>
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
      </header>
    </div>
  );
}

export default App;`,
        description: '主应用组件',
        language: 'typescript'
      },
      {
        filename: 'App.css',
        content: `.App {
  text-align: center;
}

.App-header {
  background-color: #282c34;
  padding: 20px;
  color: white;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: calc(10px + 2vmin);
}

.App-header h1 {
  margin-bottom: 1rem;
}

.App-header p {
  margin-bottom: 1rem;
}

code {
  background: #f4f4f4;
  padding: 2px 4px;
  border-radius: 3px;
  color: #333;
}`,
        description: '应用样式文件',
        language: 'css'
      },
      {
        filename: 'package.json',
        content: `{
  "name": "react-app",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^4.9.5"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}`,
        description: '项目配置文件',
        language: 'json'
      }
    ]
  };

  const simulateAIGeneration = async () => {
    if (!input.trim()) return;

    setIsGenerating(true);
    
    // 添加用户消息
    const userMessage = {
      id: `user-${Date.now()}`,
      content: input,
      sender: 'user',
      agent: 'user',
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    // 模拟流式响应
    const streamingMessage = {
      id: `ai-${Date.now()}`,
      content: '',
      sender: 'assistant',
      agent: 'CodingAgent',
      timestamp: new Date().toISOString(),
      metadata: {
        streaming: true,
        hasCodeFiles: false,
        projectFiles: [],
        fileCreationProgress: []
      }
    };

    setMessages(prev => [...prev, streamingMessage]);

    // 模拟文本流式输出
    const textChunks = mockAIResponse.textContent.split(' ');
    for (let i = 0; i < textChunks.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const currentText = textChunks.slice(0, i + 1).join(' ');
      
      setMessages(prev => prev.map(msg => 
        msg.id === streamingMessage.id 
          ? { ...msg, content: currentText }
          : msg
      ));
    }

    // 开始文件创建阶段
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setMessages(prev => prev.map(msg => 
      msg.id === streamingMessage.id 
        ? { 
            ...msg, 
            metadata: {
              ...msg.metadata,
              hasCodeFiles: true,
              projectFiles: mockAIResponse.codeFiles,
              fileCreationProgress: mockAIResponse.codeFiles.map(file => ({
                filename: file.filename,
                status: 'creating',
                progress: 0
              }))
            }
          }
        : msg
    ));

    // 模拟文件创建进度
    for (let progress = 0; progress <= 100; progress += 20) {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setMessages(prev => prev.map(msg => 
        msg.id === streamingMessage.id 
          ? { 
              ...msg, 
              metadata: {
                ...msg.metadata,
                fileCreationProgress: mockAIResponse.codeFiles.map((file, index) => ({
                  filename: file.filename,
                  status: progress >= 100 ? 'created' : 'creating',
                  progress: Math.min(100, progress + (index * 10))
                }))
              }
            }
          : msg
      ));
    }

    // 完成生成
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setMessages(prev => prev.map(msg => 
      msg.id === streamingMessage.id 
        ? { 
            ...msg, 
            content: msg.content + '\n\n✅ 项目创建完成！所有文件已生成。',
            metadata: {
              ...msg.metadata,
              streaming: false,
              fileCreationProgress: mockAIResponse.codeFiles.map(file => ({
                filename: file.filename,
                status: 'created',
                progress: 100
              }))
            }
          }
        : msg
    ));

    setIsGenerating(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            文本和代码分离显示测试
          </h1>
          <p className="text-gray-600">
            演示AI生成过程中文本内容和代码文件的分离显示效果
          </p>
        </div>

        {/* 功能说明卡片 */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold">文本内容</h3>
            </div>
            <p className="text-sm text-gray-600">
              AI的解释和说明文字显示在对话框中，支持流式输出
            </p>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileCode className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold">代码文件</h3>
            </div>
            <p className="text-sm text-gray-600">
              代码文件单独显示，带有创建进度和实时预览
            </p>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold">流式体验</h3>
            </div>
            <p className="text-sm text-gray-600">
              实时显示AI思考过程和文件创建状态
            </p>
          </Card>
        </div>

        <Separator className="my-8" />

        {/* 对话区域 */}
        <div className="bg-white rounded-lg shadow-sm border min-h-[400px] flex flex-col">
          {/* 消息列表 */}
          <div className="flex-1 p-4 space-y-4 overflow-y-auto max-h-[600px]">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-12">
                <FileCode className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>输入项目需求开始测试</p>
              </div>
            ) : (
              messages.map((message, index) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isLast={index === messages.length - 1}
                  isGenerating={isGenerating}
                  isStreaming={message.metadata?.streaming}
                />
              ))
            )}
          </div>

          {/* 输入区域 */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="描述您想要创建的项目..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    simulateAIGeneration();
                  }
                }}
                disabled={isGenerating}
              />
              <Button 
                onClick={simulateAIGeneration}
                disabled={isGenerating || !input.trim()}
              >
                {isGenerating ? '生成中...' : '生成'}
              </Button>
            </div>
          </div>
        </div>

        {/* 示例输入 */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3">示例输入：</h3>
          <div className="flex flex-wrap gap-2">
            {[
              '创建一个React Todo应用',
              '生成一个现代化的登录页面',
              '创建一个个人简历网站',
              '生成一个博客系统'
            ].map((example) => (
              <Badge
                key={example}
                variant="outline"
                className="cursor-pointer hover:bg-gray-100"
                onClick={() => setInput(example)}
              >
                {example}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 