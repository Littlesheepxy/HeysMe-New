'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

export default function SimpleTestPage() {
  const [prompt, setPrompt] = useState('将Hero组件的标题颜色改为紫色');
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const runDirectTest = async () => {
    setIsRunning(true);
    setLogs([]);
    addLog('🔥 开始直接调用AI模型测试...');

    try {
      const testPrompt = '将Hero组件的标题颜色改为紫色';
      const response = await fetch('/api/test-direct-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: testPrompt })
      });

      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法读取响应流');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      addLog('📡 开始读取直接调用响应...');

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          addLog('✅ 直接调用响应流读取完成');
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'chunk') {
                addLog(`📦 收到流式块 #${data.chunkIndex}: 长度${data.content.length}, 累计${data.accumulated}`);
                addLog(`📝 内容预览: ${data.content.substring(0, 150)}${data.content.length > 150 ? '...' : ''}`);
              } else {
                addLog(`📨 事件: ${data.type} - ${data.message || JSON.stringify(data).substring(0, 100)}`);
              }
            } catch (e) {
              addLog(`解析JSON失败: ${line.substring(0, 100)}`);
            }
          }
        }
      }

    } catch (error) {
      addLog(`❌ 直接调用失败: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsRunning(false);
      addLog('🔥 直接调用测试结束');
    }
  };

  const runSimpleClaudeTest = async () => {
    setIsRunning(true);
    setLogs([]);
    addLog('🧪 开始简化Claude测试...');

    try {
      const response = await fetch('/api/test-claude-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: 'test' })
      });

      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法读取响应流');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      addLog('📡 开始读取简化测试响应...');

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          addLog('✅ 简化测试响应流读取完成');
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'chunk') {
                addLog(`📦 收到简化测试块 #${data.chunkIndex}: 长度${data.content.length}, 内容:"${data.content}"`);
              } else if (data.type === 'error') {
                addLog(`❌ 简化测试错误: ${data.message}`);
                if (data.stack) {
                  addLog(`🔍 错误堆栈: ${data.stack.substring(0, 300)}...`);
                }
              } else {
                addLog(`📨 简化测试事件: ${data.type} - ${data.message || JSON.stringify(data).substring(0, 100)}`);
              }
            } catch (e) {
              addLog(`解析JSON失败: ${line.substring(0, 100)}`);
            }
          }
        }
      }

    } catch (error) {
      addLog(`❌ 简化测试失败: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsRunning(false);
      addLog('🧪 简化Claude测试结束');
    }
  };

  const runSimpleToolsTest = async () => {
    setIsRunning(true);
    setLogs([]);
    addLog('🔧 开始简单工具测试...');

    try {
      const response = await fetch('/api/test-tools-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: 'test' })
      });

      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法读取响应流');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      addLog('📡 开始读取工具测试响应...');

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          addLog('✅ 工具测试响应流读取完成');
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'chunk') {
                addLog(`📦 收到工具测试块 #${data.chunkIndex}: 长度${data.content.length}`);
                addLog(`📝 内容: "${data.content.substring(0, 200)}${data.content.length > 200 ? '...' : ''}"`);
              } else if (data.type === 'error') {
                addLog(`❌ 工具测试错误: ${data.message}`);
                if (data.stack) {
                  addLog(`🔍 错误堆栈: ${data.stack.substring(0, 300)}...`);
                }
              } else {
                addLog(`📨 工具测试事件: ${data.type} - ${data.message || JSON.stringify(data).substring(0, 100)}`);
              }
            } catch (e) {
              addLog(`解析JSON失败: ${line.substring(0, 100)}`);
            }
          }
        }
      }

    } catch (error) {
      addLog(`❌ 工具测试失败: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsRunning(false);
      addLog('🔧 简单工具测试结束');
    }
  };

  const runSimpleTest = async () => {
    if (!prompt.trim()) return;
    
    setIsRunning(true);
    setLogs([]);
    addLog('开始简单测试...');

    try {
      const response = await fetch('/api/test-incremental-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt })
      });

      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法读取响应流');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      addLog('开始读取响应流...');

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          addLog('响应流读取完成');
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              addLog(`收到事件: ${data.type} - ${data.message || JSON.stringify(data).substring(0, 100)}`);
              
              if (data.type === 'error') {
                addLog(`❌ 错误: ${data.message}`);
              } else if (data.type === 'response') {
                addLog(`📨 AI响应 #${data.index}: ${JSON.stringify(data.data).substring(0, 200)}...`);
              }
            } catch (e) {
              addLog(`解析JSON失败: ${line}`);
            }
          }
        }
      }

    } catch (error) {
      addLog(`❌ 测试失败: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsRunning(false);
      addLog('测试结束');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          简单增量测试
        </h1>
        <p className="text-gray-600">
          直接测试CodingAgent的增量编辑功能，用于调试AI响应问题
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左侧：测试输入 */}
        <Card>
          <CardHeader>
            <CardTitle>测试输入</CardTitle>
            <CardDescription>
              输入测试提示词，直接调用CodingAgent
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="输入测试提示词..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
            />
            <Button 
              onClick={runSimpleTest}
              disabled={!prompt.trim() || isRunning}
              className="w-full"
            >
              {isRunning ? '运行中...' : '运行简单测试'}
            </Button>
          </CardContent>
        </Card>

        {/* 右侧：日志输出 */}
        <Card>
          <CardHeader>
            <CardTitle>实时日志</CardTitle>
            <CardDescription>
              查看详细的执行过程和调试信息
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-96 overflow-y-auto bg-gray-50 p-4 rounded font-mono text-sm">
              {logs.length > 0 ? (
                logs.map((log, index) => (
                  <div key={index} className="mb-1">
                    {log}
                  </div>
                ))
              ) : (
                <div className="text-gray-500">
                  点击"运行简单测试"开始...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 底部：快速测试按钮 */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>快速测试用例</CardTitle>
            <CardDescription>
              点击下面的按钮快速测试不同场景
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Button 
                variant="outline" 
                onClick={() => setPrompt('将Hero组件的标题颜色改为紫色')}
              >
                样式修改测试
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setPrompt('为Hero组件添加一个副标题')}
              >
                内容添加测试
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setPrompt('分析Hero组件的结构并提出优化建议')}
              >
                代码分析测试
              </Button>
              <Button 
                variant="outline" 
                onClick={() => runDirectTest()}
              >
                🔥 直接调用测试
              </Button>
              <Button 
                variant="outline" 
                onClick={() => runSimpleClaudeTest()}
              >
                🧪 简化Claude测试
              </Button>
              <Button 
                variant="outline" 
                onClick={() => runSimpleToolsTest()}
              >
                🔧 简单工具测试
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* API健康检查 */}
      <div className="mt-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">API状态检查:</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={async () => {
                  try {
                    const response = await fetch('/api/test-incremental-simple');
                    const data = await response.json();
                    addLog(`✅ API健康检查: ${data.status} - ${data.message}`);
                  } catch (error) {
                    addLog(`❌ API健康检查失败: ${error}`);
                  }
                }}
              >
                检查API
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
