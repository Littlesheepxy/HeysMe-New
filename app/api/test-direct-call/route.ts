import { NextRequest, NextResponse } from 'next/server';
import { generateStreamWithModel } from '@/lib/ai-models';
import { tool } from 'ai';
import { z } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: '缺少必需的prompt参数' },
        { status: 400 }
      );
    }

    console.log('🔥 [直接调用] 绕过CodingAgent，直接调用AI模型');

    // 创建流式响应
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const sendData = (data: any) => {
            const chunk = encoder.encode(`data: ${JSON.stringify(data)}\\n\\n`);
            controller.enqueue(chunk);
          };

          sendData({
            type: 'start',
            message: '开始直接AI调用测试...',
            timestamp: Date.now()
          });

          // 构造强制工具调用的prompt
          const forceToolPrompt = `我需要你执行一个具体的代码修改任务。

任务：${prompt}

项目文件内容：
\`\`\`typescript
// components/Hero.tsx
import React from 'react';

export default function Hero() {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-blue-500 text-xl font-bold mb-4">
          欢迎使用HeysMe
        </h1>
        <p className="text-lg text-gray-300 mb-8">
          这是一个用于测试增量修改的示例项目
        </p>
      </div>
    </div>
  );
}
\`\`\`

**立即执行以下步骤，不要分析，直接行动：**

1. 使用 read_file 工具读取 components/Hero.tsx 文件
2. 使用 edit_file 工具执行具体修改
3. 确保修改完成

开始执行：`;

          console.log('📝 [构造prompt] 长度:', forceToolPrompt.length);

          // 直接调用AI模型
          const messages = [
            {
              role: 'system' as const,
              content: '你是一个代码修改专家。必须使用提供的工具来执行文件操作，不要只是分析或提供建议。立即开始工具调用。'
            },
            {
              role: 'user' as const,
              content: forceToolPrompt
            }
          ];

          console.log('🚀 [直接调用] generateStreamWithModel...');

          let chunkCount = 0;
          let accumulatedContent = '';

          // 创建简化的工具定义
          const simpleTools = {
            read_file: tool({
              description: "读取文件内容",
              parameters: z.object({
                file_path: z.string().describe("文件路径")
              }),
              execute: async ({ file_path }) => {
                return `读取文件 ${file_path} 的内容：\n\n示例Hero组件内容...`;
              }
            }),
            edit_file: tool({
              description: "编辑文件内容",
              parameters: z.object({
                file_path: z.string().describe("文件路径"),
                old_content: z.string().describe("要替换的旧内容"),
                new_content: z.string().describe("新内容")
              }),
              execute: async ({ file_path, old_content, new_content }) => {
                return `已成功将 ${file_path} 中的内容从 "${old_content}" 修改为 "${new_content}"`;
              }
            })
          };

          console.log('🔧 [配置检查]:', {
            provider: 'claude',
            model: 'claude-sonnet-4-20250514',
            messagesCount: messages.length,
            toolsCount: Object.keys(simpleTools).length
          });

          for await (const chunk of generateStreamWithModel(
            'claude',
            'claude-sonnet-4-20250514',
            messages,
            {
              maxTokens: 4000,
              tools: simpleTools
            }
          )) {
            chunkCount++;
            accumulatedContent += chunk;
            
            console.log(`📦 [流式块 ${chunkCount}] 长度: ${chunk.length}`);
            console.log(`📝 [内容预览]`, chunk.substring(0, 100));

            sendData({
              type: 'chunk',
              content: chunk,
              chunkIndex: chunkCount,
              accumulated: accumulatedContent.length,
              timestamp: Date.now()
            });
          }

          console.log(`✅ [直接调用完成] 总块数: ${chunkCount}, 总长度: ${accumulatedContent.length}`);

          sendData({
            type: 'complete',
            message: `直接调用完成，收到 ${chunkCount} 个块，总长度 ${accumulatedContent.length}`,
            finalContent: accumulatedContent,
            timestamp: Date.now()
          });

        } catch (error) {
          console.error('❌ [直接调用错误]:', error);
          const errorData = encoder.encode(`data: ${JSON.stringify({
            type: 'error',
            message: error instanceof Error ? error.message : String(error),
            timestamp: Date.now()
          })}\\n\\n`);
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
    console.error('💥 [API错误]:', error);
    return NextResponse.json(
      { 
        error: '服务器内部错误',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// 健康检查
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: '直接调用测试API正常运行',
    timestamp: new Date().toISOString()
  });
}
