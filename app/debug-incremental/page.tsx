'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

interface DebugStep {
  id: string;
  step: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  details: string;
  timestamp: string;
  data?: any;
}

export default function DebugIncrementalPage() {
  const [userInput, setUserInput] = useState('修改app/page.tsx中的标题颜色为红色');
  const [debugSteps, setDebugSteps] = useState<DebugStep[]>([]);
  const [isDebugging, setIsDebugging] = useState(false);
  const [rawResponse, setRawResponse] = useState('');

  const addDebugStep = (step: string, status: DebugStep['status'], details: string, data?: any) => {
    const newStep: DebugStep = {
      id: Date.now().toString(),
      step,
      status,
      details,
      timestamp: new Date().toISOString(),
      data
    };
    setDebugSteps(prev => [...prev, newStep]);
    return newStep.id;
  };

  const updateDebugStep = (id: string, status: DebugStep['status'], details?: string, data?: any) => {
    setDebugSteps(prev => prev.map(step => 
      step.id === id 
        ? { ...step, status, ...(details && { details }), ...(data && { data }) }
        : step
    ));
  };

  const debugIncrementalMode = async () => {
    setIsDebugging(true);
    setDebugSteps([]);
    setRawResponse('');

    // 步骤1: 检查输入参数
    const step1 = addDebugStep(
      '检查输入参数',
      'in_progress',
      '准备发送增量模式请求...'
    );

    const requestPayload = {
      user_input: userInput,
      mode: 'incremental',
      sessionData: {
        id: 'debug-session-' + Date.now(),
        metadata: {
          projectFiles: [
            {
              filename: 'app/page.tsx',
              content: `export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <h1 className="text-4xl font-bold text-gray-900 mb-6">
        欢迎来到我的个人网站
      </h1>
    </div>
  );
}`,
              language: 'typescript',
              description: '主页面组件'
            }
          ],
          projectType: 'next.js',
          framework: 'Next.js'
        },
        collectedData: {}
      }
    };

    updateDebugStep(step1, 'completed', '输入参数准备完成', requestPayload);

    // 步骤2: 发送请求
    const step2 = addDebugStep(
      '发送API请求',
      'in_progress',
      '向 /api/coding-agent 发送请求...'
    );

    try {
      const response = await fetch('/api/test-coding-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        updateDebugStep(step2, 'failed', `HTTP ${response.status}: ${response.statusText}`);
        return;
      }

      updateDebugStep(step2, 'completed', 'API请求成功，开始读取流式响应');

      // 步骤3: 解析流式响应
      const step3 = addDebugStep(
        '解析流式响应',
        'in_progress',
        '开始解析Server-Sent Events...'
      );

      const reader = response.body?.getReader();
      if (!reader) {
        updateDebugStep(step3, 'failed', '无法获取响应流');
        return;
      }

      let accumulatedText = '';
      let chunkCount = 0;
      let toolCallsDetected = 0;
      let responseCount = 0;
      const decoder = new TextDecoder();

      // 步骤4: 处理流式数据
      const step4 = addDebugStep(
        '处理流式数据',
        'in_progress',
        '开始处理流式数据块...'
      );

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunkCount++;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            responseCount++;
            try {
              const data = JSON.parse(line.slice(6));
              
              // 🔍 关键检查：是否包含工具调用
              const hasTools = data.system_state?.metadata?.tools;
              const hasToolCalls = data.system_state?.metadata?.toolCallsExecuted;
              const hasStreamingTools = data.system_state?.metadata?.streaming && 
                                       data.system_state?.metadata?.agent_type === 'CodingAgent';
              
              if (hasTools || hasToolCalls || hasStreamingTools) {
                toolCallsDetected++;
                addDebugStep(
                  `工具调用检测 #${toolCallsDetected}`,
                  'completed',
                  `检测到工具相关数据: ${JSON.stringify({
                    hasTools,
                    hasToolCalls,
                    hasStreamingTools,
                    metadata: data.system_state?.metadata
                  }, null, 2)}`,
                  data
                );
              }

              if (data.immediate_display?.reply) {
                accumulatedText += data.immediate_display.reply;
                
                // 🚨 关键检查：响应内容是否包含代码块
                if (data.immediate_display.reply.includes('```')) {
                  addDebugStep(
                    '⚠️ 代码块检测',
                    'completed',
                    `检测到代码块！这可能表明正在重新生成而不是调用工具。内容: "${data.immediate_display.reply.substring(0, 100)}..."`,
                    { reply: data.immediate_display.reply }
                  );
                }

                // 🔍 检查是否提到工具调用
                const toolMentions = [
                  'read_file', 'write_file', 'edit_file', 'append_to_file', 
                  '读取文件', '修改文件', '编辑文件', '调用工具'
                ];
                
                const mentionedTools = toolMentions.filter(tool => 
                  data.immediate_display.reply.includes(tool)
                );
                
                if (mentionedTools.length > 0) {
                  addDebugStep(
                    '🔧 工具提及检测',
                    'completed',
                    `提到了工具: ${mentionedTools.join(', ')}`,
                    { mentionedTools, reply: data.immediate_display.reply }
                  );
                }
              }

              setRawResponse(prev => prev + JSON.stringify(data, null, 2) + '\n---\n');
              
            } catch (e) {
              addDebugStep(
                '⚠️ JSON解析失败',
                'failed',
                `无法解析JSON: ${line}`,
                { error: e, line }
              );
            }
          }
        }
      }

      updateDebugStep(step4, 'completed', 
        `处理完成！总计: ${chunkCount} 个数据块, ${responseCount} 个响应, ${toolCallsDetected} 个工具调用检测`
      );

      updateDebugStep(step3, 'completed', '流式响应解析完成');

      // 步骤5: 分析结果
      const step5 = addDebugStep(
        '分析结果',
        'in_progress',
        '分析调试结果...'
      );

      const hasCodeGeneration = accumulatedText.includes('```');
      const hasToolExecution = toolCallsDetected > 0;
      
      let analysis = '';
      if (hasCodeGeneration && !hasToolExecution) {
        analysis = '❌ 问题确认：正在重新生成代码而不是调用工具！';
      } else if (hasToolExecution && !hasCodeGeneration) {
        analysis = '✅ 正常：检测到工具调用，没有代码生成';
      } else if (hasToolExecution && hasCodeGeneration) {
        analysis = '⚠️ 混合模式：既有工具调用又有代码生成';
      } else {
        analysis = '❓ 异常：既没有工具调用也没有代码生成';
      }

      updateDebugStep(step5, 'completed', analysis, {
        hasCodeGeneration,
        hasToolExecution,
        toolCallsDetected,
        accumulatedTextLength: accumulatedText.length
      });

    } catch (error) {
      updateDebugStep(step2, 'failed', `请求失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsDebugging(false);
    }
  };

  const getStatusColor = (status: DebugStep['status']) => {
    switch (status) {
      case 'completed': return 'default';
      case 'failed': return 'destructive';
      case 'in_progress': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: DebugStep['status']) => {
    switch (status) {
      case 'completed': return '✅';
      case 'failed': return '❌';
      case 'in_progress': return '🔄';
      default: return '⏳';
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <h1 className="text-3xl font-bold mb-6">🔍 增量模式调试工具</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 输入区域 */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>调试配置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">用户需求</label>
                <Textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="输入修改需求..."
                  rows={3}
                />
              </div>
              
              <Button 
                onClick={debugIncrementalMode}
                disabled={isDebugging}
                className="w-full"
              >
                {isDebugging ? '🔍 调试中...' : '🚀 开始调试'}
              </Button>

              <div className="text-sm text-gray-600">
                <p><strong>调试目标：</strong></p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>检查是否调用了工具</li>
                  <li>检查是否重新生成代码</li>
                  <li>分析响应流式数据</li>
                  <li>识别问题根源</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 调试步骤 */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>调试步骤</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {debugSteps.length === 0 ? (
                  <p className="text-gray-500 text-sm">等待开始调试...</p>
                ) : (
                  debugSteps.map((step, index) => (
                    <div key={step.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getStatusIcon(step.status)}</span>
                          <span className="font-medium text-sm">
                            {index + 1}. {step.step}
                          </span>
                        </div>
                        <Badge variant={getStatusColor(step.status)}>
                          {step.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{step.details}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(step.timestamp).toLocaleTimeString()}
                      </p>
                      {step.data && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-400 cursor-pointer">
                            查看数据
                          </summary>
                          <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-auto max-h-20">
                            {JSON.stringify(step.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 原始响应 */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>原始响应数据</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[500px] overflow-auto bg-gray-50 p-4 rounded border">
                {rawResponse ? (
                  <pre className="text-xs font-mono">{rawResponse}</pre>
                ) : (
                  <p className="text-gray-500 text-sm">等待响应数据...</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 问题分析 */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>问题分析指南</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">🔍 检查要点</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• 是否检测到工具调用？</li>
                <li>• 响应中是否包含代码块？</li>
                <li>• 模式是否正确传递？</li>
                <li>• 工具执行器是否工作？</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">🎯 期望行为</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• 应该调用 read_file 读取现有文件</li>
                <li>• 应该调用 edit_file 进行修改</li>
                <li>• 不应该重新生成完整代码</li>
                <li>• 应该有工具执行的反馈</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
