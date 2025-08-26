import { NextRequest, NextResponse } from 'next/server';
import { generateStreamWithModel } from '@/lib/ai-models';

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: '缺少必需的prompt参数' },
        { status: 400 }
      );
    }

    console.log('🔥 [简化测试] 测试Claude基础流式调用...');

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const sendData = (data: any) => {
            const chunk = encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
            controller.enqueue(chunk);
          };

          sendData({
            type: 'start',
            message: '开始简化Claude测试...',
            timestamp: Date.now()
          });

          // 测试1：最简单的文本生成（无工具）
          console.log('🧪 [测试1] 无工具的简单文本生成');
          const simpleMessages = [
            {
              role: 'user' as const,
              content: '请回复"Hello, World!"'
            }
          ];

          let chunkCount = 0;
          let accumulatedContent = '';

          for await (const chunk of generateStreamWithModel(
            'claude',
            'claude-sonnet-4-20250514',
            simpleMessages,
            {
              maxTokens: 100
            }
          )) {
            chunkCount++;
            accumulatedContent += chunk;
            
            console.log(`📦 [简化测试块 ${chunkCount}] 长度: ${chunk.length}, 内容: "${chunk}"`);

            sendData({
              type: 'chunk',
              content: chunk,
              chunkIndex: chunkCount,
              accumulated: accumulatedContent.length,
              timestamp: Date.now()
            });
          }

          console.log(`✅ [简化测试完成] 总块数: ${chunkCount}, 总长度: ${accumulatedContent.length}`);

          sendData({
            type: 'complete',
            message: `简化测试完成，收到 ${chunkCount} 个块，总长度 ${accumulatedContent.length}`,
            finalContent: accumulatedContent,
            timestamp: Date.now()
          });

        } catch (error) {
          console.error('❌ [简化测试错误]:', error);
          const errorData = encoder.encode(`data: ${JSON.stringify({
            type: 'error',
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            timestamp: Date.now()
          })}\n\n`);
          controller.enqueue(errorData);
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('💥 [简化测试API错误]:', error);
    return NextResponse.json(
      { 
        error: '服务器内部错误',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: '简化Claude测试API正常运行',
    timestamp: new Date().toISOString()
  });
}
