/**
 * 简化的信息收集测试
 * 直接测试核心逻辑
 */

import { NextRequest, NextResponse } from 'next/server';
import { anthropic } from '@ai-sdk/anthropic';
import { generateText, tool } from 'ai';
import { z } from 'zod';

export async function POST(req: NextRequest) {
  try {
    const { message, round = 1 } = await req.json();

    if (!message) {
      return NextResponse.json({
        success: false,
        error: 'Message is required'
      }, { status: 400 });
    }

    console.log(`🚀 [简化测试] 第${round}轮，消息: ${message.substring(0, 100)}...`);

    // 定义简化的工具
    const analyzeGitHub = tool({
      description: '分析 GitHub 用户信息',
      inputSchema: z.object({
        username_or_url: z.string(),
        include_repos: z.boolean().optional().default(true)
      }),
      execute: async ({ username_or_url }) => {
        console.log(`🔧 [GitHub工具] 分析: ${username_or_url}`);
        return {
          username: 'octocat',
          profile: {
            name: 'The Octocat',
            bio: 'GitHub mascot',
            public_repos: 8
          },
          languages: {
            summary: [['JavaScript', 40], ['Python', 30], ['TypeScript', 20]]
          },
          repositories: [
            {
              name: 'Hello-World',
              description: 'My first repository',
              language: 'JavaScript',
              html_url: 'https://github.com/octocat/Hello-World'
            }
          ]
        };
      }
    });

    // 检测是否包含链接
    const hasGitHubLink = message.includes('github.com');
    
    let prompt = '';
    
    if (round === 1) {
      // 第一轮：分析用户输入
      if (hasGitHubLink) {
        prompt = `用户提供了以下信息：
${message}

我发现用户提供了 GitHub 链接，请使用 analyze_github 工具分析，然后评估信息完整度。

如果信息不够完整，请询问补充信息。如果信息足够，请说"信息收集完成"。`;
      } else {
        prompt = `用户提供了以下信息：
${message}

请分析这些信息，评估完整度。如果需要更多信息，请询问具体问题。`;
      }
    } else {
      // 第二轮：补充信息处理
      prompt = `这是用户的补充信息：
${message}

请分析并说"信息收集完成，开始结构化整理"。`;
    }

    // 执行分析
    const result = await generateText({
      model: anthropic('claude-sonnet-4-20250514'),
      messages: [{ role: 'user', content: prompt }],
      tools: hasGitHubLink ? { analyze_github: analyzeGitHub } : {},
      temperature: 0.7,
      maxTokens: 2000
    });

    console.log(`✅ [简化测试] 完成，工具调用: ${result.toolCalls.length}`);

    // 判断是否需要继续
    const isComplete = result.text.includes('信息收集完成') || result.text.includes('信息足够') || round >= 2;
    const needsMoreInfo = result.text.includes('还需要') || result.text.includes('请告诉我') || result.text.includes('能否提供');

    return NextResponse.json({
      success: true,
      round,
      response: result.text,
      toolCalls: result.toolCalls.map(tc => ({
        tool: tc.toolName,
        args: tc.args
      })),
      toolResults: result.toolResults.map(tr => ({
        tool: tr.toolName,
        result: tr.output
      })),
      analysis: {
        isComplete,
        needsMoreInfo,
        hasGitHubLink,
        nextRound: isComplete ? null : round + 1
      },
      usage: result.usage
    });

  } catch (error: any) {
    console.error('❌ [简化测试] 失败:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
