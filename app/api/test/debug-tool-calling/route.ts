/**
 * 调试工具调用问题
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { tool } from 'ai';
import { z } from 'zod';

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    console.log(`🔧 [调试] 测试工具调用: ${message}`);

    // 定义简单的测试工具
    const testTools = {
      detect_links: tool({
        description: '检测文本中的链接',
        inputSchema: z.object({
          text: z.string().describe('要检测的文本'),
        }),
        execute: async ({ text }) => {
          console.log(`🔍 [工具执行] 检测链接: ${text}`);
          const urlRegex = /(https?:\/\/[^\s]+)/g;
          const links = text.match(urlRegex) || [];
          return {
            success: true,
            links,
            count: links.length,
            message: `找到 ${links.length} 个链接`
          };
        }
      }),

      analyze_github: tool({
        description: '分析 GitHub 链接',
        inputSchema: z.object({
          url: z.string().describe('GitHub URL'),
        }),
        execute: async ({ url }) => {
          console.log(`🔧 [工具执行] 分析 GitHub: ${url}`);
          return {
            success: true,
            url,
            username: url.split('/').pop() || 'unknown',
            message: 'GitHub 分析完成'
          };
        }
      })
    };

    // 执行工具调用
    const result = await generateText({
      model: anthropic('claude-3-5-sonnet-20241022'),
      messages: [
        {
          role: 'user',
          content: `请分析这段文本中的链接并调用相应工具：${message}`
        }
      ],
      tools: testTools,
      maxTokens: 2000,
      temperature: 0.1,
    });

    console.log(`✅ [调试] 完成，工具调用数: ${result.toolCalls.length}`);

    return NextResponse.json({
      success: true,
      message: result.text,
      toolCalls: result.toolCalls.map(tc => ({
        toolName: tc.toolName,
        input: tc.args
      })),
      toolResults: result.toolResults.map(tr => ({
        toolName: tr.toolName,
        output: tr.result,
        success: true
      })),
      totalTools: result.toolCalls.length
    });

  } catch (error: any) {
    console.error('❌ [调试] 失败:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || '调试测试失败',
      details: error.cause || error.stack
    }, { status: 500 });
  }
}
