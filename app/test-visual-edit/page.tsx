'use client';

import { useState } from 'react';
import { WebContainerPreview } from '@/components/editor/WebContainerPreview';

const mockFiles = [
  {
    filename: 'App.tsx',
    content: `import React from 'react';

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            张三的个人简历
          </h1>
          <p className="text-xl text-gray-600">
            前端开发工程师 | React 专家 | UI/UX 爱好者
          </p>
        </header>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">关于我</h2>
            <p className="text-gray-600 leading-relaxed">
              我是一名热情的前端开发工程师，拥有5年的Web开发经验。
              专注于创建用户友好的界面和优秀的用户体验。
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">技能</h2>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">React</span>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">Vue.js</span>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">JavaScript</span>
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">TypeScript</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}`,
    language: 'tsx',
    type: 'component' as const
  },
  {
    filename: 'package.json',
    content: `{
  "name": "resume-app",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}`,
    language: 'json',
    type: 'config' as const
  }
];

export default function TestVisualEditPage() {
  const [messages, setMessages] = useState<string[]>([]);

  const handleSendMessage = (message: string, options?: any) => {
    console.log('📝 收到可视化编辑消息:', message);
    console.log('📝 选项:', options);
    
    setMessages(prev => [...prev, message]);
    
    // 模拟发送到聊天系统
    alert('可视化编辑消息已发送到聊天系统！\n\n' + message);
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="bg-white border-b p-4">
        <h1 className="text-2xl font-bold">可视化编辑测试页面</h1>
        <p className="text-gray-600">点击预览中的元素，然后输入修改需求来测试功能</p>
      </div>
      
      <div className="flex-1 flex">
        <div className="w-2/3">
          <WebContainerPreview
            files={mockFiles}
            projectName="简历测试项目"
            description="测试可视化编辑功能"
            isLoading={false}
            previewUrl={null}
            enableWebContainer={true}
            isEditMode={true}
            onContentChange={handleSendMessage}
            onPreviewReady={() => {}}
            onLoadingChange={() => {}}
          />
        </div>
        
        <div className="w-1/3 bg-gray-50 p-4 border-l">
          <h3 className="font-semibold mb-4">收到的消息:</h3>
          <div className="space-y-2">
            {messages.map((message, index) => (
              <div key={index} className="bg-white p-3 rounded border text-sm">
                <pre className="whitespace-pre-wrap">{message}</pre>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 