'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Send, Code, FileText, Search, CheckCircle, XCircle, Clock } from 'lucide-react';

interface TestResult {
  success: boolean;
  sessionId: string;
  mode: string;
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
  mode: 'initial' | 'incremental' | 'analysis';
  expectedBehavior: string;
  context?: any;
}

const TEST_CASES: TestCase[] = [
  {
    id: 'simple_component',
    name: '简单组件创建',
    description: '测试创建基础React组件',
    input: '创建一个简单的按钮组件，支持不同尺寸和颜色',
    mode: 'initial',
    expectedBehavior: '应该创建完整的组件文件和相关配置',
    context: {
      framework: 'React',
      tech_stack: 'React + TypeScript'
    }
  },
  {
    id: 'portfolio_website',
    name: '个人作品集网站',
    description: '测试完整项目生成',
    input: '创建一个现代化的个人作品集网站，包含首页、关于我、项目展示和联系方式',
    mode: 'initial',
    expectedBehavior: '应该生成完整的Next.js项目结构',
    context: {
      framework: 'Next.js',
      tech_stack: 'React + TypeScript + Tailwind CSS',
      project_type: '个人作品集'
    }
  },
  {
    id: 'add_loading_state',
    name: '添加Loading状态',
    description: '测试增量修改功能',
    input: '给现有的按钮组件添加loading状态和禁用状态',
    mode: 'incremental',
    expectedBehavior: '应该精确修改现有文件',
    context: {
      target_files: 'components/ui/button.tsx',
      modification_type: 'feature_enhancement'
    }
  },
  {
    id: 'optimize_performance',
    name: '性能优化',
    description: '测试代码优化',
    input: '优化React组件的渲染性能，添加memo和useMemo',
    mode: 'incremental',
    expectedBehavior: '应该添加性能优化代码',
    context: {
      target_files: 'components/ProductList.tsx',
      modification_type: 'performance_optimization'
    }
  },
  {
    id: 'code_review',
    name: '代码审查',
    description: '测试代码分析功能',
    input: '分析现有项目的代码质量，检查潜在问题和改进建议',
    mode: 'analysis',
    expectedBehavior: '应该提供详细的代码分析报告',
    context: {
      focus_areas: '代码质量,架构设计,性能优化'
    }
  },
  {
    id: 'security_audit',
    name: '安全审计',
    description: '测试安全性分析',
    input: '检查项目中的安全漏洞和潜在风险',
    mode: 'analysis',
    expectedBehavior: '应该识别安全问题并提供修复建议',
    context: {
      focus_areas: '安全性,数据验证,权限控制'
    }
  }
];

const MODE_LABELS = {
  initial: '初始项目生成',
  incremental: '增量修改',
  analysis: '代码分析'
};

const MODE_ICONS = {
  initial: <Code className="h-4 w-4" />,
  incremental: <FileText className="h-4 w-4" />,
  analysis: <Search className="h-4 w-4" />
};

export default function CodingAgentTestPage() {
  const [selectedTest, setSelectedTest] = useState<TestCase | null>(null);
  const [customInput, setCustomInput] = useState('');
  const [customMode, setCustomMode] = useState<'initial' | 'incremental' | 'analysis'>('initial');
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const runTest = async (testCase: TestCase, input?: string, mode?: string) => {
    setIsLoading(true);
    
    try {
      const testInput = input || testCase.input;
      const testMode = mode || testCase.mode;
      
      const response = await fetch('/api/test/coding-agent-v3', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: testInput,
          sessionId: `coding-test-${Date.now()}`,
          mode: testMode,
          context: testCase.context
        }),
      });

      const result: TestResult = await response.json();
      
      if (result.success) {
        setTestResults(prev => [...prev, {
          ...result,
          testCase: testCase.name,
          input: testInput
        } as any]);
      } else {
        console.error('测试失败:', result);
        // 即使失败也添加到结果中，方便调试
        setTestResults(prev => [...prev, {
          ...result,
          testCase: testCase.name,
          input: testInput,
          error: true
        } as any]);
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
      mode: customMode,
      expectedBehavior: '根据输入内容和模式进行相应处理',
      context: {}
    };
    
    runTest(customTestCase, customInput, customMode);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const getStatusIcon = (result: TestResult) => {
    if ((result as any).error) {
      return <XCircle className="h-5 w-5 text-red-500" />;
    } else if (result.success && result.isComplete) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else if (result.success) {
      return <Clock className="h-5 w-5 text-yellow-500" />;
    } else {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'initial': return 'bg-blue-500';
      case 'incremental': return 'bg-green-500';
      case 'analysis': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">编程 Agent V3 测试页面</h1>
        <p className="text-muted-foreground">
          测试新版编程 Agent 的功能，包括项目生成、增量修改和代码分析
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
                    <div className="flex items-center gap-2">
                      {MODE_ICONS[testCase.mode]}
                      <Badge className={`text-white ${getModeColor(testCase.mode)}`}>
                        {MODE_LABELS[testCase.mode]}
                      </Badge>
                    </div>
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
                输入自定义内容和选择模式进行测试
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">处理模式</label>
                <Select value={customMode} onValueChange={(value: any) => setCustomMode(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="initial">
                      <div className="flex items-center gap-2">
                        <Code className="h-4 w-4" />
                        初始项目生成
                      </div>
                    </SelectItem>
                    <SelectItem value="incremental">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        增量修改
                      </div>
                    </SelectItem>
                    <SelectItem value="analysis">
                      <div className="flex items-center gap-2">
                        <Search className="h-4 w-4" />
                        代码分析
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Textarea
                placeholder="输入编程需求，例如：创建一个React组件、修改现有代码、分析项目结构等..."
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
          <Button
            variant="outline"
            onClick={clearResults}
            disabled={testResults.length === 0}
          >
            清空结果
          </Button>
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
                          <Badge className={`text-white ${getModeColor(result.mode)}`}>
                            {MODE_LABELS[result.mode as keyof typeof MODE_LABELS]}
                          </Badge>
                          <Badge variant={result.isComplete ? 'default' : 'secondary'}>
                            {result.isComplete ? '完成' : '进行中'}
                          </Badge>
                        </div>
                      </div>

                      {/* 用户输入 */}
                      <div className="mb-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Code className="h-4 w-4" />
                          <span className="text-sm font-medium">编程需求:</span>
                        </div>
                        <p className="text-sm bg-muted p-2 rounded">
                          {(result as any).input}
                        </p>
                      </div>

                      {/* Agent 响应 */}
                      {result.responses && result.responses.length > 0 && (
                        <div className="space-y-2 mb-3">
                          <span className="text-sm font-medium">处理过程:</span>
                          {result.responses.map((response, respIndex) => (
                            <div key={respIndex} className="border-l-2 border-primary/20 pl-3">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium">
                                  {response.system_state.current_stage}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {response.system_state.progress}%
                                </Badge>
                              </div>
                              <p className="text-sm">
                                {response.immediate_display.reply.substring(0, 200)}
                                {response.immediate_display.reply.length > 200 ? '...' : ''}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* 处理结果统计 */}
                      {result.metadata && (
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div className="text-center p-2 bg-muted rounded">
                            <div className="text-lg font-bold text-green-600">
                              {result.metadata.files_created?.length || 0}
                            </div>
                            <div className="text-xs text-muted-foreground">创建文件</div>
                          </div>
                          <div className="text-center p-2 bg-muted rounded">
                            <div className="text-lg font-bold text-blue-600">
                              {result.metadata.files_modified?.length || 0}
                            </div>
                            <div className="text-xs text-muted-foreground">修改文件</div>
                          </div>
                          <div className="text-center p-2 bg-muted rounded">
                            <div className="text-lg font-bold text-purple-600">
                              {result.metadata.commands_executed?.length || 0}
                            </div>
                            <div className="text-xs text-muted-foreground">执行命令</div>
                          </div>
                          <div className="text-center p-2 bg-muted rounded">
                            <div className="text-lg font-bold text-orange-600">
                              {result.metadata.tools_used?.length || 0}
                            </div>
                            <div className="text-xs text-muted-foreground">使用工具</div>
                          </div>
                        </div>
                      )}

                      {/* 详细信息 */}
                      <details className="mt-3">
                        <summary className="text-sm font-medium cursor-pointer">
                          详细信息
                        </summary>
                        <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-x-auto">
                          {JSON.stringify(result.metadata || result, null, 2)}
                        </pre>
                      </details>
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
