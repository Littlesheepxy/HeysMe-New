import { NextRequest, NextResponse } from 'next/server';
import { CodingAgent } from '@/lib/agents/coding/agent';

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: '缺少必需的prompt参数' },
        { status: 400 }
      );
    }

    console.log('🧪 [简单测试] 收到测试请求:', prompt);

    // 创建流式响应
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 初始化CodingAgent
          const agent = new CodingAgent();
          console.log('✅ [Agent] CodingAgent 实例创建成功');
          
          // 创建模拟会话数据
          const sessionData = {
            id: `test-simple-${Date.now()}`,
            metadata: {
              projectFiles: [
                {
                  filename: 'components/Hero.tsx',
                  content: `import React from 'react';

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
}`,
                  language: 'typescript'
                }
              ],
              projectType: 'react',
              codingHistory: []
            }
          };

          console.log('📋 [会话数据] 已创建测试会话数据');

          // 发送开始事件
          const sendData = (data: any) => {
            const chunk = encoder.encode(`data: ${JSON.stringify(data)}\\n\\n`);
            controller.enqueue(chunk);
          };

          sendData({
            type: 'start',
            message: '开始简单增量测试...',
            timestamp: Date.now()
          });

          // 直接调用 handleIncrementalAIGeneration 方法
          console.log('🔄 [AI调用] 开始调用 handleIncrementalAIGeneration...');
          
          // 修改prompt，让AI明确知道要执行实际操作
          const enhancedPrompt = `${prompt}

**重要说明：请立即执行这个修改操作，不要只是分析。使用提供的工具来完成实际的文件修改：**

1. 首先使用 read_file 工具读取 components/Hero.tsx 文件
2. 然后使用 edit_file 工具进行具体的修改
3. 确保实际修改文件内容，而不是只提供建议

请现在就开始执行这些工具调用。`;
          
          const responses = (agent as any).handleIncrementalAIGeneration(
            enhancedPrompt,
            sessionData,
            { testMode: true, debug: true }
          );

          let responseCount = 0;
          let hasAnyResponse = false;

          console.log('⏳ [等待响应] 开始迭代AI响应流...');

          for await (const response of responses) {
            hasAnyResponse = true;
            responseCount++;
            
            console.log(`📨 [响应 ${responseCount}]`, {
              type: typeof response,
              hasContent: !!response,
              keys: Object.keys(response || {}),
              preview: JSON.stringify(response).substring(0, 200)
            });
            
            sendData({
              type: 'response',
              data: response,
              index: responseCount,
              timestamp: Date.now()
            });

            // 检查是否完成
            if (response?.system_state?.done) {
              console.log('✅ [完成] 收到完成信号');
              break;
            }
          }

          console.log(`📊 [统计] 总响应数: ${responseCount}, 有响应: ${hasAnyResponse}`);

          if (!hasAnyResponse) {
            console.warn('⚠️ [警告] 没有收到任何AI响应');
            sendData({
              type: 'error',
              message: '没有收到AI响应，可能是配置问题',
              debug: {
                sessionId: sessionData.id,
                projectFiles: sessionData.metadata.projectFiles.length,
                prompt: prompt.substring(0, 100)
              },
              timestamp: Date.now()
            });
          } else {
            sendData({
              type: 'complete',
              message: `测试完成，收到 ${responseCount} 个响应`,
              timestamp: Date.now()
            });
          }

        } catch (error) {
          console.error('❌ [错误] 测试过程中出错:', error);
          const errorData = encoder.encode(`data: ${JSON.stringify({
            type: 'error',
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            timestamp: Date.now()
          })}\\n\\n`);
          controller.enqueue(errorData);
        } finally {
          console.log('🏁 [结束] 关闭响应流');
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
    message: '简单增量测试API正常运行',
    timestamp: new Date().toISOString(),
    debug: true
  });
}
