'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, Clock, Zap } from 'lucide-react';

interface TestResult {
  timestamp: string;
  testMode: string;
  userInput: string;
  agents: {
    optimized?: AgentResult;
    vercelAI?: AgentResult;
  };
  comparison?: ComparisonResult;
}

interface AgentResult {
  status: 'success' | 'error';
  duration: number;
  responseCount: number;
  responses: any[];
  error?: string;
  sessionData: any;
}

interface ComparisonResult {
  performance: {
    optimized_duration: number;
    vercelAI_duration: number;
    speed_difference: number;
  };
  responses: {
    optimized_count: number;
    vercelAI_count: number;
    count_difference: number;
  };
  success: {
    optimized_success: boolean;
    vercelAI_success: boolean;
    both_successful: boolean;
  };
}

export default function InfoCollectionComparisonPage() {
  const [userInput, setUserInput] = useState('');
  const [testMode, setTestMode] = useState<'comparison' | 'optimized' | 'vercel'>('comparison');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<TestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const testExamples = [
    {
      name: 'GitHub链接测试',
      input: 'https://github.com/username 这是我的GitHub个人资料，请帮我分析一下',
      description: '测试GitHub链接解析功能'
    },
    {
      name: 'LinkedIn链接测试',
      input: 'https://linkedin.com/in/username 这是我的LinkedIn资料',
      description: '测试LinkedIn信息提取功能'
    },
    {
      name: '文本描述测试',
      input: '我是一名前端开发工程师，有3年React和Vue经验，熟悉TypeScript，参与过多个大型项目',
      description: '测试纯文本信息收集功能'
    },
    {
      name: '多链接测试',
      input: '我的GitHub: https://github.com/username，个人网站: https://mysite.com，LinkedIn: https://linkedin.com/in/username',
      description: '测试多个链接同时处理功能'
    }
  ];

  const runTest = async () => {
    if (!userInput.trim()) {
      setError('请输入测试内容');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/test/info-collection-comparison', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userInput,
          testMode,
          welcomeData: {
            user_role: '软件工程师',
            use_case: '个人展示',
            commitment_level: '认真制作'
          }
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResults(data.data);
      } else {
        setError(data.error || '测试失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '网络错误');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const renderAgentResult = (agentName: string, result: AgentResult) => (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {agentName}
          {result.status === 'success' ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <XCircle className="h-5 w-5 text-red-500" />
          )}
        </CardTitle>
        <CardDescription>
          <div className="flex gap-4 text-sm">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {formatDuration(result.duration)}
            </span>
            <span>响应数量: {result.responseCount}</span>
            <Badge variant={result.status === 'success' ? 'default' : 'destructive'}>
              {result.status}
            </Badge>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {result.status === 'error' && result.error && (
          <Alert className="mb-4">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{result.error}</AlertDescription>
          </Alert>
        )}
        
        <Tabs defaultValue="responses">
          <TabsList>
            <TabsTrigger value="responses">响应内容</TabsTrigger>
            <TabsTrigger value="session">会话数据</TabsTrigger>
          </TabsList>
          
          <TabsContent value="responses" className="space-y-2">
            {result.responses.map((response, index) => (
              <Card key={index} className="p-3">
                <div className="text-sm text-gray-500 mb-2">
                  响应 #{index + 1} - {new Date(response.timestamp).toLocaleTimeString()}
                </div>
                <div className="text-sm">
                  <strong>意图:</strong> {response.data.system_state?.intent || 'unknown'}
                </div>
                <div className="text-sm">
                  <strong>阶段:</strong> {response.data.system_state?.current_stage || 'unknown'}
                </div>
                <div className="text-sm">
                  <strong>进度:</strong> {response.data.system_state?.progress || 0}%
                </div>
                {response.data.immediate_display?.reply && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                    {response.data.immediate_display.reply}
                  </div>
                )}
              </Card>
            ))}
          </TabsContent>
          
          <TabsContent value="session">
            <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto max-h-96">
              {JSON.stringify(result.sessionData, null, 2)}
            </pre>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">信息收集 Agent 对比测试</h1>
        <p className="text-gray-600">
          对比测试 OptimizedInfoCollectionAgent 和 VercelAIInfoCollectionAgent 的功能和性能
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 测试控制面板 */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>测试控制</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">测试模式</label>
                <select
                  value={testMode}
                  onChange={(e) => setTestMode(e.target.value as any)}
                  className="w-full p-2 border rounded"
                >
                  <option value="comparison">对比测试</option>
                  <option value="optimized">仅OptimizedAgent</option>
                  <option value="vercel">仅VercelAIAgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">用户输入</label>
                <Textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="输入测试内容..."
                  rows={4}
                />
              </div>

              <Button 
                onClick={runTest} 
                disabled={isLoading || !userInput.trim()}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    测试中...
                  </>
                ) : (
                  '开始测试'
                )}
              </Button>

              {error && (
                <Alert>
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* 测试示例 */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>测试示例</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {testExamples.map((example, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="w-full text-left justify-start h-auto p-3"
                  onClick={() => setUserInput(example.input)}
                >
                  <div>
                    <div className="font-medium">{example.name}</div>
                    <div className="text-xs text-gray-500">{example.description}</div>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* 测试结果 */}
        <div className="lg:col-span-2">
          {results && (
            <div className="space-y-6">
              {/* 对比概览 */}
              {results.comparison && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      对比结果概览
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">
                          {formatDuration(results.comparison.performance.optimized_duration)}
                        </div>
                        <div className="text-sm text-gray-500">OptimizedAgent</div>
                      </div>
                      <div>
                        <div className="text-lg text-gray-400">vs</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          {formatDuration(results.comparison.performance.vercelAI_duration)}
                        </div>
                        <div className="text-sm text-gray-500">VercelAIAgent</div>
                      </div>
                    </div>
                    
                    <div className="mt-4 p-3 bg-gray-50 rounded">
                      <div className="text-sm">
                        <strong>性能差异:</strong> {
                          results.comparison.performance.speed_difference > 0 
                            ? `VercelAI慢 ${formatDuration(results.comparison.performance.speed_difference)}`
                            : `VercelAI快 ${formatDuration(-results.comparison.performance.speed_difference)}`
                        }
                      </div>
                      <div className="text-sm">
                        <strong>响应数量:</strong> Optimized: {results.comparison.responses.optimized_count}, VercelAI: {results.comparison.responses.vercelAI_count}
                      </div>
                      <div className="text-sm">
                        <strong>成功状态:</strong> {
                          results.comparison.success.both_successful 
                            ? '✅ 两个Agent都成功' 
                            : '❌ 至少一个Agent失败'
                        }
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Agent结果详情 */}
              {results.agents.optimized && renderAgentResult('OptimizedInfoCollectionAgent', results.agents.optimized)}
              {results.agents.vercelAI && renderAgentResult('VercelAIInfoCollectionAgent', results.agents.vercelAI)}
            </div>
          )}

          {!results && !isLoading && (
            <Card>
              <CardContent className="text-center py-12">
                <div className="text-gray-500">选择测试内容并点击"开始测试"查看结果</div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
