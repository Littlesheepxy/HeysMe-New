'use client';

import { useState } from 'react';

export default function TestToolIntegrationPage() {
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testCodingAgentWithTools = async () => {
    setIsLoading(true);
    setTestResult('正在测试工具调用集成...\n');
    
    try {
      // 测试增量编辑模式的工具调用
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: '请帮我创建一个简单的React按钮组件',
          sessionId: `test-${Date.now()}`,
          forceAgent: 'coding',
          context: {
            mode: 'incremental',
            expertMode: true
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法获取响应流');
      }

      let accumulatedResponse = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = new TextDecoder().decode(value);
        accumulatedResponse += chunk;
        
        // 检查是否包含工具调用
        if (chunk.includes('tool_use') || chunk.includes('write_to_file')) {
          setTestResult(prev => prev + '\n✅ 检测到工具调用！\n');
        }
        
        setTestResult(prev => prev + chunk);
      }
      
      setTestResult(prev => prev + '\n\n🎉 测试完成！');
      
    } catch (error) {
      console.error('测试失败:', error);
      setTestResult(prev => prev + `\n❌ 测试失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testIncrementalPrompt = async () => {
    setIsLoading(true);
    setTestResult('正在测试增量编辑Prompt...\n');
    
    try {
      // 测试增量编辑prompt的生成
      const { getIncrementalEditPrompt, INCREMENTAL_EDIT_TOOLS } = await import('@/lib/prompts/coding/incremental-edit');
      
      const testPrompt = getIncrementalEditPrompt(
        'app/page.tsx: 页面文件\ncomponents/Button.tsx: 按钮组件',
        '请帮我创建一个新的导航组件',
        'app/page.tsx, components/Button.tsx',
        '{"projectType": "react", "framework": "Next.js"}'
      );
      
      setTestResult(prev => prev + `✅ Prompt生成成功，长度: ${testPrompt.length}\n`);
      setTestResult(prev => prev + `📝 Prompt预览:\n${testPrompt.substring(0, 500)}...\n\n`);
      
      setTestResult(prev => prev + `🔧 工具定义数量: ${INCREMENTAL_EDIT_TOOLS.length}\n`);
      INCREMENTAL_EDIT_TOOLS.forEach((tool, index) => {
        setTestResult(prev => prev + `  ${index + 1}. ${tool.name}: ${tool.description}\n`);
      });
      
      setTestResult(prev => prev + '\n🎉 增量编辑Prompt测试完成！');
      
    } catch (error) {
      console.error('测试失败:', error);
      setTestResult(prev => prev + `\n❌ 测试失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testToolExecutor = async () => {
    setIsLoading(true);
    setTestResult('正在测试工具执行器...\n');
    
    try {
      // 测试统一工具执行器
      const { UnifiedToolExecutor } = await import('@/lib/agents/coding/streaming-tool-executor');
      
      let executorOutput = '';
      
      const executor = new UnifiedToolExecutor({
        mode: 'claude',
        onTextUpdate: async (text: string, partial: boolean) => {
          executorOutput += `📝 文本: ${text} ${partial ? '(部分)' : '(完整)'}\n`;
        },
        onToolExecute: async (toolName: string, params: Record<string, any>) => {
          executorOutput += `🔧 工具执行: ${toolName}, 参数: ${JSON.stringify(params)}\n`;
          return `工具 ${toolName} 执行成功`;
        },
        onToolResult: async (result: string) => {
          executorOutput += `✅ 工具结果: ${result}\n`;
        }
      });
      
      // 模拟Claude工具调用响应
      const mockClaudeResponse = `我来帮您创建一个按钮组件。

{
  "type": "tool_use",
  "id": "toolu_test123",
  "name": "write_file",
  "input": {
    "file_path": "components/Button.tsx",
    "content": "import React from 'react';\\n\\nexport function Button() {\\n  return <button>Click me</button>;\\n}"
  }
}

组件已创建完成！`;

      await executor.processStreamChunk(mockClaudeResponse);
      
      setTestResult(prev => prev + `✅ 工具执行器初始化成功\n`);
      setTestResult(prev => prev + `📊 执行结果:\n${executorOutput}\n`);
      setTestResult(prev => prev + '\n🎉 工具执行器测试完成！');
      
    } catch (error) {
      console.error('测试失败:', error);
      setTestResult(prev => prev + `\n❌ 测试失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">工具调用集成测试</h1>
      
      <div className="space-y-4 mb-6">
        <button
          onClick={testIncrementalPrompt}
          disabled={isLoading}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded mr-4"
        >
          测试增量编辑Prompt
        </button>
        
        <button
          onClick={testToolExecutor}
          disabled={isLoading}
          className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded mr-4"
        >
          测试工具执行器
        </button>
        
        <button
          onClick={testCodingAgentWithTools}
          disabled={isLoading}
          className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white px-4 py-2 rounded mr-4"
        >
          测试完整流程
        </button>
      </div>
      
      <div className="bg-gray-100 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">测试结果:</h2>
        <pre className="whitespace-pre-wrap text-sm bg-white p-4 rounded border max-h-96 overflow-y-auto">
          {testResult || '点击上方按钮开始测试...'}
        </pre>
      </div>
      
      <div className="mt-6 bg-blue-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">测试说明:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li><strong>增量编辑Prompt测试</strong>: 验证增量编辑prompt和工具定义是否正确生成</li>
          <li><strong>工具执行器测试</strong>: 验证UnifiedToolExecutor是否能正确解析Claude JSON格式的工具调用</li>
          <li><strong>完整流程测试</strong>: 测试从用户输入到工具调用执行的完整流程</li>
        </ul>
      </div>
    </div>
  );
} 