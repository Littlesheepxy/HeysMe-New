'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, User, Bot, CheckCircle, XCircle, Clock } from 'lucide-react';

interface TestResult {
  success: boolean;
  sessionId: string;
  currentRound: number;
  maxRounds: number;
  totalResponses: number;
  responses: any[];
  finalResponse?: any;
  isComplete: boolean;
  metadata: any;
}

interface TestCase {
  id: string;
  name: string;
  description: string;
  input: string;
  expectedBehavior: string;
  context?: any;
}

const TEST_CASES: TestCase[] = [
  {
    id: 'basic_text',
    name: '基础文本收集',
    description: '测试纯文本信息收集',
    input: '我是张三，一名前端开发工程师，有5年经验，擅长React和Vue。',
    expectedBehavior: '应该提取基本信息并询问更多细节',
    context: { round: 1 }
  },
  {
    id: 'github_link',
    name: 'GitHub链接解析',
    description: '测试GitHub链接的工具调用',
    input: '我的GitHub是 https://github.com/octocat，里面有我的开源项目。',
    expectedBehavior: '应该调用GitHub解析工具',
    context: { round: 1 }
  },
  {
    id: 'linkedin_profile',
    name: 'LinkedIn资料',
    description: '测试LinkedIn链接处理',
    input: '我的LinkedIn是 https://linkedin.com/in/johndoe，可以看到我的工作经历。',
    expectedBehavior: '应该调用LinkedIn解析工具',
    context: { round: 1 }
  },
  {
    id: 'mixed_content',
    name: '混合内容',
    description: '测试文本+链接的混合处理',
    input: '我是李四，产品经理，GitHub: https://github.com/lisi，LinkedIn: https://linkedin.com/in/lisi',
    expectedBehavior: '应该同时处理文本和多个链接',
    context: { round: 1 }
  },
  {
    id: 'second_round',
    name: '第二轮对话',
    description: '测试多轮对话功能',
    input: '我还有一个个人网站 https://johndoe.com，展示了我的作品集。',
    expectedBehavior: '应该在第二轮收集补充信息',
    context: { round: 2 }
  }
];

export default function InfoAgentTestPage() {
  const [selectedTest, setSelectedTest] = useState<TestCase | null>(null);
  const [customInput, setCustomInput] = useState('');
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');

  const runTest = async (testCase: TestCase, input?: string) => {
    setIsLoading(true);
    
    try {
      const testInput = input || testCase.input;
      const sessionId = currentSessionId || `test-session-${Date.now()}`;
      
      const response = await fetch('/api/test/info-agent-v3', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: testInput,
          sessionId,
          context: testCase.context,
          round: testCase.context?.round || 1
        }),
      });

      const result: TestResult = await response.json();
      
      if (result.success) {
        setCurrentSessionId(result.sessionId);
        setTestResults(prev => [...prev, {
          ...result,
          testCase: testCase.name,
          input: testInput
        } as any]);
      } else {
        console.error('测试失败:', result);
      }
    } catch (error) {
      console.error('请求失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const runCustomTest = () => {
    if (!customInput.trim()) return;
    
    const customTestCase: TestCase = {
      id: 'custom',
      name: '自定义测试',
      description: '用户自定义输入测试',
      input: customInput,
      expectedBehavior: '根据输入内容进行相应处理',
      context: { round: 1 }
    };
    
    runTest(customTestCase, customInput);
  };

  const clearResults = () => {
    setTestResults([]);
    setCurrentSessionId('');
  };

  const getStatusIcon = (result: TestResult) => {
    if (result.success && result.isComplete) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else if (result.success) {
      return <Clock className="h-5 w-5 text-yellow-500" />;
    } else {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">信息收集 Agent V3 测试页面</h1>
        <p className="text-muted-foreground">
          测试新版信息收集 Agent 的功能，包括文本处理、链接解析和多轮对话
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左侧：测试用例和自定义输入 */}
        <div className="space-y-6">
          {/* 预设测试用例 */}
          <Card>
            <CardHeader>
              <CardTitle>预设测试用例</CardTitle>
              <CardDescription>
                选择一个测试用例来验证 Agent 功能
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {TEST_CASES.map((testCase) => (
                <div
                  key={testCase.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedTest?.id === testCase.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedTest(testCase)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">{testCase.name}</h3>
                    <Badge variant="outline">
                      轮次 {testCase.context?.round || 1}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {testCase.description}
                  </p>
                  <p className="text-sm font-mono bg-muted p-2 rounded">
                    {testCase.input}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    预期: {testCase.expectedBehavior}
                  </p>
                </div>
              ))}
              
              {selectedTest && (
                <Button
                  onClick={() => runTest(selectedTest)}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      测试中...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      运行选中测试
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* 自定义输入 */}
          <Card>
            <CardHeader>
              <CardTitle>自定义测试</CardTitle>
              <CardDescription>
                输入自定义内容进行测试
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="输入要测试的内容，可以包含文本、GitHub链接、LinkedIn链接等..."
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                rows={4}
              />
              <Button
                onClick={runCustomTest}
                disabled={isLoading || !customInput.trim()}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    测试中...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    运行自定义测试
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* 控制按钮 */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={clearResults}
              disabled={testResults.length === 0}
            >
              清空结果
            </Button>
            <Badge variant="secondary">
              当前会话: {currentSessionId || '未开始'}
            </Badge>
          </div>
        </div>

        {/* 右侧：测试结果 */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>测试结果</CardTitle>
              <CardDescription>
                Agent 响应和处理结果
              </CardDescription>
            </CardHeader>
            <CardContent>
              {testResults.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  还没有测试结果，请运行一个测试用例
                </p>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {testResults.map((result, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(result)}
                          <span className="font-medium">
                            {(result as any).testCase || '测试'}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="outline">
                            轮次 {result.currentRound}/{result.maxRounds}
                          </Badge>
                          <Badge variant={result.isComplete ? 'default' : 'secondary'}>
                            {result.isComplete ? '完成' : '进行中'}
                          </Badge>
                        </div>
                      </div>

                      {/* 用户输入 */}
                      <div className="mb-3">
                        <div className="flex items-center gap-2 mb-1">
                          <User className="h-4 w-4" />
                          <span className="text-sm font-medium">用户输入:</span>
                        </div>
                        <p className="text-sm bg-muted p-2 rounded">
                          {(result as any).input}
                        </p>
                      </div>

                      {/* Agent 响应 */}
                      <div className="space-y-2">
                        {result.responses.map((response, respIndex) => (
                          <div key={respIndex} className="border-l-2 border-primary/20 pl-3">
                            <div className="flex items-center gap-2 mb-1">
                              <Bot className="h-4 w-4" />
                              <span className="text-sm font-medium">
                                {response.system_state.current_stage}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {response.system_state.progress}%
                              </Badge>
                            </div>
                            <p className="text-sm">
                              {response.immediate_display.reply}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* 元数据 */}
                      {result.metadata && (
                        <details className="mt-3">
                          <summary className="text-sm font-medium cursor-pointer">
                            详细信息
                          </summary>
                          <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-x-auto">
                            {JSON.stringify(result.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
