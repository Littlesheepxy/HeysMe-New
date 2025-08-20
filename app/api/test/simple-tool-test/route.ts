import { NextRequest, NextResponse } from 'next/server';
import { anthropic } from '@ai-sdk/anthropic';
import { generateText, tool } from 'ai';
import { z } from 'zod';

// 简单的测试工具
const simpleTestTool = tool({
  description: 'A simple test tool that returns basic information',
  inputSchema: z.object({
    name: z.string().describe('Name to greet')
  }),
  execute: async ({ name }) => {
    console.log(`🔧 [Simple Tool] 执行中，参数: ${name}`);
    const result = {
      message: `Hello, ${name}!`,
      timestamp: new Date().toISOString(),
      success: true
    };
    console.log(`✅ [Simple Tool] 执行完成，结果:`, result);
    return result;
  }
});

// GitHub 工具（简化版）
const githubTestTool = tool({
  description: 'Test GitHub analysis tool',
  inputSchema: z.object({
    username: z.string().describe('GitHub username to analyze')
  }),
  execute: async ({ username }) => {
    console.log(`🔧 [GitHub Test Tool] 执行中，用户: ${username}`);
    
    // 模拟 GitHub 数据
    const mockData = {
      username: username,
      name: 'Test User',
      followers: 100,
      repos: 20,
      languages: ['JavaScript', 'TypeScript', 'Python'],
      bio: 'A test GitHub user'
    };
    
    console.log(`✅ [GitHub Test Tool] 执行完成，结果:`, mockData);
    return mockData;
  }
});

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    
    console.log(`📨 [Simple Tool Test] 收到消息: ${message}`);

    const result = await generateText({
      model: anthropic('claude-3-5-sonnet-20241022'),
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant. When users mention names or GitHub usernames, use the appropriate tools to get information.'
        },
        {
          role: 'user',
          content: message
        }
      ],
      tools: {
        greet: simpleTestTool,
        analyze_github: githubTestTool
      },
      maxTokens: 2000
    });

    console.log(`✅ [Simple Tool Test] 生成完成`);
    console.log(`🔧 [工具调用数量] ${result.toolCalls.length}`);
    console.log(`📊 [工具结果数量] ${result.toolResults.length}`);
    
    // 打印详细信息
    if (result.toolCalls.length > 0) {
      result.toolCalls.forEach((call, i) => {
        console.log(`🔧 [工具调用 ${i}]`, {
          name: call.toolName,
          input: call.input
        });
      });
    }
    
    if (result.toolResults.length > 0) {
      result.toolResults.forEach((toolResult, i) => {
        console.log(`📊 [工具结果 ${i}]`, {
          result: toolResult.result
        });
      });
    }

    return NextResponse.json({
      success: true,
      message: result.text,
      toolCalls: result.toolCalls,
      toolResults: result.toolResults.map((tr, i) => ({
        tool_name: result.toolCalls[i]?.toolName,
        data: tr.output, // 使用 output 而不是 result
        success: true,
        timestamp: new Date().toISOString()
      })),
      usage: result.usage
    });

  } catch (error) {
    console.error('❌ [Simple Tool Test] 错误:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Simple Tool Test API',
    tools: ['greet', 'analyze_github']
  });
}
