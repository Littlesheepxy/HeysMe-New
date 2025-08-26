'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ToolCall {
  id: string;
  name: string;
  parameters: Record<string, any>;
  result?: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  timestamp: string;
}

export default function TestCodingToolsPage() {
  const [userInput, setUserInput] = useState('修改主页的标题颜色为红色');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
  const [sessionData, setSessionData] = useState({
    id: 'test-session-' + Date.now(),
    projectFiles: [
      {
        filename: 'app/page.tsx',
        content: `export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">
          欢迎来到我的个人网站
        </h1>
        <p className="text-lg text-gray-600">
          这是一个使用 Next.js 和 Tailwind CSS 构建的现代化网站。
        </p>
      </div>
    </div>
  );
}`,
        language: 'typescript',
        description: '主页面组件'
      },
      {
        filename: 'app/layout.tsx',
        content: `import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '个人网站',
  description: '基于AI生成的现代化网站',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}`,
        language: 'typescript',
        description: '应用布局文件'
      }
    ]
  });

  const testIncrementalMode = async () => {
    setIsLoading(true);
    setResponse('');
    setToolCalls([]);

    try {
      console.log('🧪 [测试] 开始增量模式测试');
      
      const response = await fetch('/api/test-coding-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_input: userInput,
          mode: 'incremental', // 🎯 关键：使用增量模式
          sessionData: {
            id: sessionData.id,
            metadata: {
              projectFiles: sessionData.projectFiles,
              projectType: 'next.js',
              framework: 'Next.js'
            },
            collectedData: {}
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法获取响应流');
      }

      let accumulatedText = '';
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.immediate_display?.reply) {
                accumulatedText += data.immediate_display.reply;
                setResponse(accumulatedText);
              }

              // 🔧 检测工具调用
              if (data.system_state?.metadata?.toolCallsExecuted) {
                const newToolCall: ToolCall = {
                  id: 'tool-' + Date.now(),
                  name: 'incremental_edit',
                  parameters: { userInput },
                  status: 'completed',
                  timestamp: new Date().toISOString(),
                  result: '工具执行完成'
                };
                setToolCalls(prev => [...prev, newToolCall]);
              }

              // 🚀 模拟工具调用检测
              if (data.immediate_display?.reply?.includes('读取文件') || 
                  data.immediate_display?.reply?.includes('修改文件') ||
                  data.immediate_display?.reply?.includes('编辑文件')) {
                
                const toolName = data.immediate_display.reply.includes('读取') ? 'read_file' :
                                data.immediate_display.reply.includes('修改') ? 'edit_file' : 'write_file';
                
                const newToolCall: ToolCall = {
                  id: 'tool-' + Date.now() + '-' + Math.random(),
                  name: toolName,
                  parameters: {
                    file_path: 'app/page.tsx',
                    description: data.immediate_display.reply
                  },
                  status: 'completed',
                  timestamp: new Date().toISOString(),
                  result: `工具 ${toolName} 执行成功`
                };
                setToolCalls(prev => [...prev, newToolCall]);
              }

              console.log('📊 [流式数据]', data);
              
            } catch (e) {
              console.warn('解析JSON失败:', line);
            }
          }
        }
      }

    } catch (error) {
      console.error('❌ [测试失败]', error);
      setResponse(`错误: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testInitialMode = async () => {
    setIsLoading(true);
    setResponse('');
    setToolCalls([]);

    try {
      console.log('🧪 [测试] 开始初始模式测试');
      
      const response = await fetch('/api/test-coding-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_input: userInput,
          mode: 'initial', // 🎯 关键：使用初始模式
          sessionData: {
            id: 'test-initial-' + Date.now(),
            metadata: {},
            collectedData: {}
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法获取响应流');
      }

      let accumulatedText = '';
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.immediate_display?.reply) {
                accumulatedText += data.immediate_display.reply;
                setResponse(accumulatedText);
              }

              console.log('📊 [流式数据]', data);
              
            } catch (e) {
              console.warn('解析JSON失败:', line);
            }
          }
        }
      }

    } catch (error) {
      console.error('❌ [测试失败]', error);
      setResponse(`错误: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">🧪 CodingAgent 工具调用测试</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 输入区域 */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>测试输入</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">用户需求</label>
                <Textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="输入您的修改需求..."
                  rows={3}
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={testIncrementalMode}
                  disabled={isLoading}
                  variant="default"
                >
                  {isLoading ? '测试中...' : '🔧 测试增量模式'}
                </Button>
                <Button 
                  onClick={testInitialMode}
                  disabled={isLoading}
                  variant="outline"
                >
                  {isLoading ? '测试中...' : '🚀 测试初始模式'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 当前项目文件 */}
          <Card>
            <CardHeader>
              <CardTitle>当前项目文件</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {sessionData.projectFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="font-mono text-sm">{file.filename}</span>
                    <Badge variant="secondary">{file.language}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 输出区域 */}
        <div className="space-y-4">
          {/* AI响应 */}
          <Card>
            <CardHeader>
              <CardTitle>AI 响应</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="min-h-[200px] p-4 bg-gray-50 rounded border">
                {response ? (
                  <pre className="whitespace-pre-wrap text-sm">{response}</pre>
                ) : (
                  <p className="text-gray-500">等待AI响应...</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 工具调用历史 */}
          <Card>
            <CardHeader>
              <CardTitle>工具调用历史</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {toolCalls.length === 0 ? (
                  <p className="text-gray-500 text-sm">暂无工具调用</p>
                ) : (
                  toolCalls.map((tool) => (
                    <div key={tool.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            tool.status === 'completed' ? 'default' :
                            tool.status === 'failed' ? 'destructive' :
                            tool.status === 'executing' ? 'secondary' : 'outline'
                          }>
                            {tool.name}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {new Date(tool.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <Badge variant="outline">{tool.status}</Badge>
                      </div>
                      {tool.result && (
                        <p className="text-sm text-gray-600 mt-2">{tool.result}</p>
                      )}
                      <details className="mt-2">
                        <summary className="text-xs text-gray-400 cursor-pointer">参数详情</summary>
                        <pre className="text-xs text-gray-600 mt-1">
                          {JSON.stringify(tool.parameters, null, 2)}
                        </pre>
                      </details>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 说明信息 */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>测试说明</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>增量模式测试：</strong>模拟对现有项目的修改，应该调用工具如 read_file, edit_file 等</p>
            <p><strong>初始模式测试：</strong>模拟创建新项目，应该生成完整的代码文件</p>
            <p><strong>期望行为：</strong>增量模式应该先读取文件，然后进行修改，而不是重新生成整个项目</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
