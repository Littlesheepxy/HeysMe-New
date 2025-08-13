import { NextRequest, NextResponse } from 'next/server';
import { generateStreamWithModel } from '@/lib/ai-models';
import { tool } from 'ai';
import { z } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    console.log('🔧 [工具测试] 开始简单工具调用测试...');

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
            message: '开始简单工具调用测试...',
            timestamp: Date.now()
          });

          // 使用正确的ai-sdk工具定义格式
          const simpleTools = {
            read_file: tool({
              description: "读取文件内容",
              parameters: z.object({
                file_path: z.string().describe("文件路径")
              }),
              execute: async ({ file_path }) => {
                // 这里只是模拟工具执行，返回一个示例结果
                return `读取文件 ${file_path} 的内容：\n\n示例文件内容...`;
              }
            })
          };

          // 更简单的prompt
          const simplePrompt = `请使用read_file工具读取components/Hero.tsx文件的内容。`;

          const messages = [
            {
              role: 'user' as const,
              content: simplePrompt
            }
          ];

          console.log('🔧 [工具配置]:', {
            messagesCount: messages.length,
            toolsCount: Object.keys(simpleTools).length,
            prompt: simplePrompt
          });

          let chunkCount = 0;
          let accumulatedContent = '';
          let toolCalls: any[] = [];

          for await (const chunk of generateStreamWithModel(
            'claude',
            'claude-sonnet-4-20250514',
            messages,
            {
              maxTokens: 1000,
              tools: simpleTools
            }
          )) {
            chunkCount++;
            accumulatedContent += chunk;
            
            console.log(`📦 [工具测试块 ${chunkCount}] 长度: ${chunk.length}, 内容: "${chunk.substring(0, 100)}..."`);

            sendData({
              type: 'chunk',
              content: chunk,
              chunkIndex: chunkCount,
              accumulated: accumulatedContent.length,
              timestamp: Date.now()
            });
          }

          console.log(`✅ [工具测试完成] 总块数: ${chunkCount}, 总长度: ${accumulatedContent.length}`);

          sendData({
            type: 'complete',
            message: `工具测试完成，收到 ${chunkCount} 个块，总长度 ${accumulatedContent.length}`,
            finalContent: accumulatedContent,
            totalChunks: chunkCount,
            timestamp: Date.now()
          });

        } catch (error) {
          console.error('❌ [工具测试错误]:', error);
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
    console.error('💥 [工具测试API错误]:', error);
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
    message: '简单工具测试API正常运行',
    timestamp: new Date().toISOString()
  });
}
