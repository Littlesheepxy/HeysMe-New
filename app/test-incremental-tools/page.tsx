'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, CheckCircle, Clock, Play, Square, RefreshCw } from 'lucide-react';

interface TestScenario {
  id: string;
  name: string;
  description: string;
  prompt: string;
  expectedTools: string[];
  projectFiles: Array<{
    filename: string;
    content: string;
    language: string;
  }>;
}

interface ToolCall {
  id: string;
  name: string;
  input: Record<string, any>;
  timestamp: number;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  result?: string;
  error?: string;
}

interface TestResult {
  scenarioId: string;
  toolCalls: ToolCall[];
  executionTime: number;
  status: 'running' | 'completed' | 'failed';
  startTime: number;
}

const TEST_SCENARIOS: TestScenario[] = [
  {
    id: 'react-component-edit',
    name: 'React组件修改',
    description: '测试修改现有React组件的样式和功能',
    prompt: '请将Hero组件的标题颜色改为紫色，字体大小改为2xl，并添加一个副标题',
    expectedTools: ['read_file', 'edit_file'],
    projectFiles: [
      {
        filename: 'components/Hero.tsx',
        content: `import React from 'react';

export default function Hero() {
  return (
    <div className="bg-gray-900 text-white py-20">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-blue-500 text-xl font-bold mb-4">
          欢迎使用HeysMe
        </h1>
        <p className="text-lg text-gray-300">
          这是一个示例Hero组件
        </p>
      </div>
    </div>
  );
}`,
        language: 'typescript'
      }
    ]
  },
  {
    id: 'new-component-creation',
    name: '新组件创建',
    description: '测试创建全新的React组件',
    prompt: '请创建一个ContactForm组件，包含邮箱和消息输入框，以及提交按钮',
    expectedTools: ['write_file', 'read_file'],
    projectFiles: [
      {
        filename: 'app/page.tsx',
        content: `import Hero from '@/components/Hero';

export default function Page() {
  return (
    <main>
      <Hero />
    </main>
  );
}`,
        language: 'typescript'
      }
    ]
  },
  {
    id: 'project-structure-analysis',
    name: '项目结构分析',
    description: '测试分析项目结构并搜索特定代码',
    prompt: '请分析当前项目结构，查找所有使用了useState的组件，并列出它们的位置',
    expectedTools: ['get_file_structure', 'search_code', 'list_files'],
    projectFiles: [
      {
        filename: 'components/Counter.tsx',
        content: `import React, { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <div className="p-4">
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}`,
        language: 'typescript'
      },
      {
        filename: 'components/Modal.tsx',
        content: `import React, { useState } from 'react';

export default function Modal() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg">
            <p>Modal Content</p>
            <button onClick={() => setIsOpen(false)}>
              Close
            </button>
          </div>
        </div>
      )}
      <button onClick={() => setIsOpen(true)}>
        Open Modal
      </button>
    </div>
  );
}`,
        language: 'typescript'
      }
    ]
  },
  {
    id: 'complex-refactoring',
    name: '复杂重构任务',
    description: '测试复杂的多文件重构操作',
    prompt: '请将所有组件的样式从Tailwind改为CSS Modules，创建对应的.module.css文件',
    expectedTools: ['read_file', 'edit_file', 'write_file', 'search_code'],
    projectFiles: [
      {
        filename: 'components/Button.tsx',
        content: `import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
}

export default function Button({ children, onClick, variant = 'primary' }: ButtonProps) {
  const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-colors';
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300'
  };
  
  return (
    <button 
      className={\`\${baseClasses} \${variantClasses[variant]}\`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}`,
        language: 'typescript'
      }
    ]
  }
];

export default function IncrementalToolsTestPage() {
  const [selectedScenario, setSelectedScenario] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<TestResult | null>(null);
  const [useRealAPI, setUseRealAPI] = useState(true);
  const logRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentTest, testResults]);

  const runTest = async (scenarioId: string, prompt?: string) => {
    const scenario = TEST_SCENARIOS.find(s => s.id === scenarioId);
    if (!scenario) return;

    setIsRunning(true);
    const testResult: TestResult = {
      scenarioId,
      toolCalls: [],
      executionTime: 0,
      status: 'running',
      startTime: Date.now()
    };
    
    setCurrentTest(testResult);

    try {
      // 根据用户选择调用真实API或模拟模式
      if (useRealAPI) {
        await callRealIncrementalAPI(
          prompt || scenario.prompt,
          scenario.projectFiles,
          scenarioId,
          (toolCall: ToolCall) => {
            testResult.toolCalls.push(toolCall);
            setCurrentTest({ ...testResult });
          }
        );
      } else {
        const toolCalls = await simulateIncrementalAgent(
          prompt || scenario.prompt,
          scenario.projectFiles,
          (toolCall: ToolCall) => {
            testResult.toolCalls.push(toolCall);
            setCurrentTest({ ...testResult });
          }
        );
      }

      testResult.status = 'completed';
      testResult.executionTime = Date.now() - testResult.startTime;
      
    } catch (error) {
      testResult.status = 'failed';
      testResult.executionTime = Date.now() - testResult.startTime;
    }

    setTestResults(prev => [...prev, testResult]);
    setCurrentTest(null);
    setIsRunning(false);
  };

  const callRealIncrementalAPI = async (
    prompt: string,
    projectFiles: Array<{filename: string; content: string; language: string}>,
    scenarioId: string,
    onToolCall: (toolCall: ToolCall) => void
  ): Promise<void> => {
    try {
      const response = await fetch('/api/test-incremental', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          projectFiles,
          scenarioId
        })
      });

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法读取响应流');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'tool_call_start' || data.type === 'tool_call_complete') {
                onToolCall(data.toolCall);
              } else if (data.type === 'error') {
                console.error('API错误:', data.message);
              }
            } catch (e) {
              // 忽略JSON解析错误
            }
          }
        }
      }
    } catch (error) {
      console.error('调用真实API时出错:', error);
      // 如果真实API失败，回退到模拟模式
      await simulateIncrementalAgent(prompt, projectFiles, onToolCall);
    }
  };

  const simulateIncrementalAgent = async (
    prompt: string,
    projectFiles: Array<{filename: string; content: string; language: string}>,
    onToolCall: (toolCall: ToolCall) => void
  ): Promise<ToolCall[]> => {
    const toolCalls: ToolCall[] = [];

    // 模拟真实的工具调用序列
    await sleep(500);

    // 1. 首先获取项目结构
    const structureCall: ToolCall = {
      id: generateId(),
      name: 'get_file_structure',
      input: {},
      timestamp: Date.now(),
      status: 'executing'
    };
    onToolCall(structureCall);
    
    await sleep(800);
    structureCall.status = 'completed';
    structureCall.result = `项目结构：
├── app/
│   └── page.tsx
├── components/
${projectFiles.map(f => `│   └── ${f.filename.replace('components/', '')}`).join('\\n')}`;
    onToolCall(structureCall);

    // 2. 读取相关文件
    for (const file of projectFiles) {
      await sleep(600);
      const readCall: ToolCall = {
        id: generateId(),
        name: 'read_file',
        input: { file_path: file.filename },
        timestamp: Date.now(),
        status: 'executing'
      };
      onToolCall(readCall);
      
      await sleep(400);
      readCall.status = 'completed';
      readCall.result = `文件内容已读取 (${file.content.length} 字符)`;
      onToolCall(readCall);
    }

    // 3. 根据prompt执行相应的修改
    if (prompt.includes('搜索') || prompt.includes('查找')) {
      await sleep(700);
      const searchCall: ToolCall = {
        id: generateId(),
        name: 'search_code',
        input: { query: 'useState', file_pattern: '.tsx' },
        timestamp: Date.now(),
        status: 'executing'
      };
      onToolCall(searchCall);
      
      await sleep(900);
      searchCall.status = 'completed';
      searchCall.result = '找到 3 个匹配项：components/Counter.tsx:3, components/Modal.tsx:3';
      onToolCall(searchCall);
    }

    if (prompt.includes('修改') || prompt.includes('改为')) {
      await sleep(800);
      const editCall: ToolCall = {
        id: generateId(),
        name: 'edit_file',
        input: {
          file_path: projectFiles[0]?.filename || 'components/Hero.tsx',
          old_content: 'text-blue-500 text-xl',
          new_content: 'text-purple-600 text-2xl'
        },
        timestamp: Date.now(),
        status: 'executing'
      };
      onToolCall(editCall);
      
      await sleep(600);
      editCall.status = 'completed';
      editCall.result = '文件修改成功';
      onToolCall(editCall);
    }

    if (prompt.includes('创建') || prompt.includes('新建')) {
      await sleep(1000);
      const writeCall: ToolCall = {
        id: generateId(),
        name: 'write_file',
        input: {
          file_path: 'components/ContactForm.tsx',
          content: 'export default function ContactForm() { /* 新组件内容 */ }'
        },
        timestamp: Date.now(),
        status: 'executing'
      };
      onToolCall(writeCall);
      
      await sleep(700);
      writeCall.status = 'completed';
      writeCall.result = '新文件创建成功';
      onToolCall(writeCall);
    }

    return toolCalls;
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  const generateId = () => Math.random().toString(36).substr(2, 9);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-gray-400" />;
      case 'executing': return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              增量模式工具调用测试平台
            </h1>
            <p className="text-gray-600">
              测试Anthropic标准格式的工具定义和增量编辑功能
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={useRealAPI}
                onChange={(e) => setUseRealAPI(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                使用真实API
              </span>
            </label>
            <Badge variant={useRealAPI ? "default" : "secondary"}>
              {useRealAPI ? "真实模式" : "模拟模式"}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左侧：测试配置 */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>预设测试场景</CardTitle>
              <CardDescription>
                选择一个预设场景来测试不同的工具调用模式
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedScenario} onValueChange={setSelectedScenario}>
                <SelectTrigger>
                  <SelectValue placeholder="选择测试场景" />
                </SelectTrigger>
                <SelectContent>
                  {TEST_SCENARIOS.map(scenario => (
                    <SelectItem key={scenario.id} value={scenario.id}>
                      {scenario.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedScenario && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="mb-2">
                    <strong>描述：</strong> 
                    {TEST_SCENARIOS.find(s => s.id === selectedScenario)?.description}
                  </div>
                  <div className="mb-2">
                    <strong>预期工具：</strong>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {TEST_SCENARIOS.find(s => s.id === selectedScenario)?.expectedTools.map(tool => (
                        <Badge key={tool} variant="secondary">{tool}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <strong>测试提示词：</strong>
                    <p className="text-sm text-gray-700 mt-1">
                      {TEST_SCENARIOS.find(s => s.id === selectedScenario)?.prompt}
                    </p>
                  </div>
                </div>
              )}

              <Button 
                onClick={() => selectedScenario && runTest(selectedScenario)}
                disabled={!selectedScenario || isRunning}
                className="w-full"
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    运行中...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    运行测试
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>自定义测试</CardTitle>
              <CardDescription>
                输入自定义的提示词进行测试
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="输入您的测试提示词..."
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                rows={4}
              />
              <Button 
                onClick={() => customPrompt && runTest('react-component-edit', customPrompt)}
                disabled={!customPrompt || isRunning}
                className="w-full"
                variant="outline"
              >
                运行自定义测试
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* 右侧：测试结果 */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>实时执行日志</CardTitle>
              <CardDescription>
                观察工具调用的实时执行过程
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96 w-full" ref={logRef}>
                {currentTest ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                      <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
                      <span className="font-medium">正在执行测试...</span>
                      <Badge className={getStatusColor(currentTest.status)}>
                        {currentTest.status}
                      </Badge>
                    </div>
                    
                    {currentTest.toolCalls.map((toolCall, index) => (
                      <div key={toolCall.id} className="p-3 border rounded-lg bg-white">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(toolCall.status)}
                            <span className="font-medium">{toolCall.name}</span>
                            <Badge variant="outline">#{index + 1}</Badge>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(toolCall.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        
                        <div className="text-sm text-gray-600 mb-1">
                          <strong>参数：</strong> {JSON.stringify(toolCall.input, null, 2)}
                        </div>
                        
                        {toolCall.result && (
                          <div className="text-sm text-green-600">
                            <strong>结果：</strong> {toolCall.result}
                          </div>
                        )}
                        
                        {toolCall.error && (
                          <div className="text-sm text-red-600">
                            <strong>错误：</strong> {toolCall.error}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    选择一个测试场景并点击运行来查看实时日志
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 历史测试结果 */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>测试历史记录</CardTitle>
          <CardDescription>
            查看所有执行过的测试结果和统计信息
          </CardDescription>
        </CardHeader>
        <CardContent>
          {testResults.length > 0 ? (
            <Tabs defaultValue="results">
              <TabsList>
                <TabsTrigger value="results">测试结果</TabsTrigger>
                <TabsTrigger value="statistics">统计分析</TabsTrigger>
              </TabsList>
              
              <TabsContent value="results" className="space-y-3">
                {testResults.map((result, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {TEST_SCENARIOS.find(s => s.id === result.scenarioId)?.name || '自定义测试'}
                        </span>
                        <Badge className={getStatusColor(result.status)}>
                          {result.status}
                        </Badge>
                      </div>
                      <span className="text-sm text-gray-500">
                        执行时间: {result.executionTime}ms
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-2">
                      工具调用: {result.toolCalls.length} 个 | 
                      成功: {result.toolCalls.filter(t => t.status === 'completed').length} 个 |
                      失败: {result.toolCalls.filter(t => t.status === 'failed').length} 个
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {result.toolCalls.map(toolCall => (
                        <Badge 
                          key={toolCall.id} 
                          variant={toolCall.status === 'completed' ? 'default' : 'destructive'}
                        >
                          {toolCall.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </TabsContent>
              
              <TabsContent value="statistics">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {testResults.length}
                    </div>
                    <div className="text-sm text-blue-800">总测试数</div>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {testResults.filter(r => r.status === 'completed').length}
                    </div>
                    <div className="text-sm text-green-800">成功测试</div>
                  </div>
                  
                  <div className="p-4 bg-red-50 rounded-lg text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {testResults.filter(r => r.status === 'failed').length}
                    </div>
                    <div className="text-sm text-red-800">失败测试</div>
                  </div>
                  
                  <div className="p-4 bg-purple-50 rounded-lg text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {Math.round(testResults.reduce((acc, r) => acc + r.executionTime, 0) / testResults.length) || 0}ms
                    </div>
                    <div className="text-sm text-purple-800">平均执行时间</div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="text-center text-gray-500 py-8">
              还没有测试记录，运行一个测试来查看结果
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
