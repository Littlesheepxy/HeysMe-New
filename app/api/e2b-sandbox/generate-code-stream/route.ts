/**
 * 流式生成 AI 代码 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { prompt, mode = 'initial', context = {} } = body;

    if (!prompt) {
      return NextResponse.json({
        success: false,
        error: 'MISSING_PROMPT',
        message: '必须提供 prompt'
      }, { status: 400 });
    }

    console.log('🤖 [Generate AI Code] 流式生成代码:', { prompt: prompt.substring(0, 100) + '...' });

    // 创建流式响应
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 调用 coding-agent API
          const response = await fetch('/api/coding-agent', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: prompt,
              mode,
              context
            })
          });

          if (!response.body) {
            throw new Error('No response body');
          }

          const reader = response.body.getReader();
          
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              break;
            }

            // 转发数据块
            controller.enqueue(value);
          }

          controller.close();

        } catch (error) {
          console.error('❌ [Generate AI Code] 流式生成失败:', error);
          
          const errorData = {
            type: 'error',
            message: '代码生成失败',
            error: error instanceof Error ? error.message : '未知错误'
          };
          
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorData)}\n\n`));
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'STREAM_FAILED',
      message: '流式生成失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
