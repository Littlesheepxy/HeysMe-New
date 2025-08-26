'use client';

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Github, 
  Globe, 
  FileText, 
  Linkedin, 
  Play, 
  Database, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Copy,
  Download
} from 'lucide-react';

interface TestResult {
  id: string;
  timestamp: string;
  input: string;
  status: 'running' | 'success' | 'error';
  response?: any;
  error?: string;
  toolsUsed?: string[];
  executionTime?: number;
  supabaseData?: any;
}

interface SupabaseTestResult {
  success: boolean;
  data?: any;
  error?: string;
  table?: string;
  operation?: string;
}

export default function TestVercelAIAgentPage() {
  const [testInput, setTestInput] = useState('');
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [supabaseResults, setSupabaseResults] = useState<SupabaseTestResult[]>([]);
  const [activeTab, setActiveTab] = useState('agent-test');
  const resultsRef = useRef<HTMLDivElement>(null);

  // 预设测试用例
  const testCases = [
    {
      name: 'GitHub 用户分析',
      input: 'https://github.com/vercel',
      description: '测试 GitHub 用户和仓库分析功能'
    },
    {
      name: '网站内容抓取',
      input: 'https://vercel.com',
      description: '测试网页内容抓取和分析功能'
    },
    {
      name: 'LinkedIn 资料提取',
      input: 'https://linkedin.com/in/example',
      description: '测试 LinkedIn 资料提取功能'
    },
    {
      name: '综合信息收集',
      input: '我是一名全栈开发工程师，擅长 React、Node.js 和 Python。我的 GitHub 是 https://github.com/example，个人网站是 https://example.dev',
      description: '测试多源信息综合分析功能'
    }
  ];

  const runAgentTest = async (input: string) => {
    const testId = `test-${Date.now()}`;
    const startTime = Date.now();
    
    const newTest: TestResult = {
      id: testId,
      timestamp: new Date().toISOString(),
      input,
      status: 'running'
    };

    setTestResults(prev => [newTest, ...prev]);
    setIsRunning(true);

    try {
      // 模拟会话数据
      const mockSessionData = {
        id: `session-${testId}`,
        userId: 'test-user',
        metadata: {
          testMode: true,
          welcomeData: {
            user_role: '软件工程师',
            use_case: '个人展示',
            commitment_level: '认真制作'
          },
          infoCollectionTurns: 0
        }
      };

      console.log('🧪 [测试] 开始调用 Vercel AI Agent');
      
      const response = await fetch('/api/test/vercel-ai-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: { user_input: input },
          sessionData: mockSessionData
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      const executionTime = Date.now() - startTime;

      console.log('✅ [测试] Agent 响应:', result);

      setTestResults(prev => prev.map(test => 
        test.id === testId 
          ? {
              ...test,
              status: 'success',
              response: result,
              toolsUsed: result.toolsUsed || [],
              executionTime
            }
          : test
      ));

      // 如果有 Supabase 数据，测试存储
      if (result.supabaseData) {
        await testSupabaseStorage(result.supabaseData, testId);
      }

    } catch (error) {
      console.error('❌ [测试] Agent 调用失败:', error);
      
      setTestResults(prev => prev.map(test => 
        test.id === testId 
          ? {
              ...test,
              status: 'error',
              error: error instanceof Error ? error.message : '未知错误',
              executionTime: Date.now() - startTime
            }
          : test
      ));
    } finally {
      setIsRunning(false);
    }
  };

  const testSupabaseStorage = async (data: any, testId: string) => {
    try {
      console.log('🗄️ [测试] 开始测试 Supabase 存储');
      
      const response = await fetch('/api/test/supabase-storage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testId,
          data,
          table: 'info_collection_results'
        }),
      });

      const result = await response.json();
      
      setSupabaseResults(prev => [...prev, {
        success: response.ok,
        data: result.data,
        error: result.error,
        table: 'info_collection_results',
        operation: 'insert'
      }]);

      console.log('✅ [测试] Supabase 存储结果:', result);

    } catch (error) {
      console.error('❌ [测试] Supabase 存储失败:', error);
      
      setSupabaseResults(prev => [...prev, {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
        table: 'info_collection_results',
        operation: 'insert'
      }]);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const downloadResults = () => {
    const data = {
      timestamp: new Date().toISOString(),
      agentTests: testResults,
      supabaseTests: supabaseResults
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vercel-ai-agent-test-results-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Vercel AI Agent 测试页面</h1>
        <p className="text-muted-foreground">
          测试信息收集 Agent 的工具调用功能和 Supabase 数据存储
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="agent-test">Agent 测试</TabsTrigger>
          <TabsTrigger value="supabase-test">数据库测试</TabsTrigger>
          <TabsTrigger value="results">测试结果</TabsTrigger>
        </TabsList>

        <TabsContent value="agent-test" className="space-y-6">
          {/* 测试输入区域 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                运行测试
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">测试输入</label>
                <Textarea
                  placeholder="输入要测试的内容，如 GitHub 链接、网站 URL、LinkedIn 资料或文本描述..."
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={() => runAgentTest(testInput)}
                  disabled={!testInput.trim() || isRunning}
                  className="flex items-center gap-2"
                >
                  {isRunning ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  运行测试
                </Button>
                <Button 
                  onClick={() => runAgentTest('https://github.com/vercel')}
                  disabled={isRunning}
                  variant="secondary"
                  className="flex items-center gap-2"
                >
                  <Github className="h-4 w-4" />
                  快速测试 GitHub
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setTestInput('')}
                  disabled={isRunning}
                >
                  清空
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 预设测试用例 */}
          <Card>
            <CardHeader>
              <CardTitle>预设测试用例</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {testCases.map((testCase, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{testCase.name}</h4>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setTestInput(testCase.input)}
                        disabled={isRunning}
                      >
                        使用
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">{testCase.description}</p>
                    <code className="text-xs bg-muted p-1 rounded block truncate">
                      {testCase.input}
                    </code>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="supabase-test" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Supabase 存储测试结果
              </CardTitle>
            </CardHeader>
            <CardContent>
              {supabaseResults.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    暂无 Supabase 测试结果。运行 Agent 测试后会自动测试数据存储功能。
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {supabaseResults.map((result, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {result.success ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="font-medium">
                            {result.table} - {result.operation}
                          </span>
                        </div>
                        <Badge variant={result.success ? "default" : "destructive"}>
                          {result.success ? '成功' : '失败'}
                        </Badge>
                      </div>
                      
                      {result.error && (
                        <Alert variant="destructive" className="mb-2">
                          <AlertDescription>{result.error}</AlertDescription>
                        </Alert>
                      )}
                      
                      {result.data && (
                        <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  测试结果 ({testResults.length})
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={downloadResults}
                    disabled={testResults.length === 0}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    下载结果
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setTestResults([]);
                      setSupabaseResults([]);
                    }}
                    disabled={testResults.length === 0}
                  >
                    清空结果
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent ref={resultsRef}>
              {testResults.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    暂无测试结果。请在 "Agent 测试" 标签页运行测试。
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {testResults.map((result) => (
                    <div key={result.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {result.status === 'running' && (
                            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                          )}
                          {result.status === 'success' && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                          {result.status === 'error' && (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="text-sm text-muted-foreground">
                            {new Date(result.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {result.executionTime && (
                            <Badge variant="outline">
                              {result.executionTime}ms
                            </Badge>
                          )}
                          <Badge variant={
                            result.status === 'success' ? 'default' : 
                            result.status === 'error' ? 'destructive' : 'secondary'
                          }>
                            {result.status === 'running' ? '运行中' : 
                             result.status === 'success' ? '成功' : '失败'}
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium">输入:</label>
                          <div className="bg-muted p-2 rounded text-sm mt-1">
                            {result.input}
                          </div>
                        </div>

                        {result.toolsUsed && result.toolsUsed.length > 0 && (
                          <div>
                            <label className="text-sm font-medium">使用的工具:</label>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {result.toolsUsed.map((tool, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {tool}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {result.error && (
                          <Alert variant="destructive">
                            <AlertDescription>{result.error}</AlertDescription>
                          </Alert>
                        )}

                        {result.response && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm font-medium">响应结果:</label>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(JSON.stringify(result.response, null, 2))}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                            <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-64">
                              {JSON.stringify(result.response, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
