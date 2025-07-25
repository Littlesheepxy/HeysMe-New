import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { CodingAgent } from '@/lib/agents/coding/agent';
import { SessionData } from '@/lib/types/session';

export async function POST(request: NextRequest) {
  try {
    // 验证用户认证
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      sessionId, 
      message,
      userInput, // 兼容旧参数名
      mode = 'initial', // 🆕 默认为initial模式
      context = {},
      sessionData = {}
    } = body;

    // 🆕 统一参数：支持message或userInput
    const finalUserInput = message || userInput;

    // 验证请求参数
    if (!finalUserInput) {
      return NextResponse.json({ 
        error: 'Missing required field: message or userInput' 
      }, { status: 400 });
    }

    console.log('🤖 [Coding Agent] 收到请求:', {
      sessionId,
      userInput: finalUserInput.substring(0, 100) + '...',
      mode, // 🆕 显示模式信息
      contextKeys: Object.keys(context)
    });

    // 创建CodingAgent实例
    const codingAgent = new CodingAgent();
    
    // 准备session数据
    const session: SessionData = {
      id: sessionId || `session_${Date.now()}`,
      userId,
      metadata: {
        mode,
        agent_name: 'CodingAgent',
        created_at: new Date().toISOString(),
        ...sessionData.metadata
      },
      status: sessionData.status || 'active',
      ...sessionData
    };

    // 🌊 使用流式响应
    const encoder = new TextEncoder();
    
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          console.log('🌊 [流式响应] 开始生成...');
          
          // 🆕 调用CodingAgent生成流式响应，传递mode参数
          for await (const response of codingAgent.process(
            { 
              user_input: finalUserInput,
              mode: mode // 🆕 传递模式参数
            },
            session,
            context
          )) {
            // 将响应编码为Server-Sent Events格式
            const responseData = JSON.stringify(response);
            const sseData = `data: ${responseData}\n\n`;
            
            console.log('📤 [流式数据] 发送chunk:', responseData.substring(0, 100) + '...');
            
            controller.enqueue(encoder.encode(sseData));
            
            // 如果响应完成，结束流
            if (response.system_state?.done) {
              console.log('✅ [流式响应] 生成完成');
              break;
            }
          }
          
          // 发送结束标记
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
          
        } catch (error) {
          console.error('❌ [Coding Agent] 处理错误:', error);
          
          const errorResponse = {
            immediate_display: {
              reply: `抱歉，处理请求时发生错误: ${error instanceof Error ? error.message : '未知错误'}`,
              agent_name: 'CodingAgent',
              timestamp: new Date().toISOString()
            },
            system_state: {
              intent: 'error',
              done: true,
              error: error instanceof Error ? error.message : '未知错误'
            }
          };
          
          const errorData = `data: ${JSON.stringify(errorResponse)}\n\n`;
          controller.enqueue(encoder.encode(errorData));
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        }
      }
    });

    // 返回流式响应
    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('❌ [Coding Agent] API错误:', error);
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 });
  }
}

// 处理OPTIONS请求（CORS）
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
} 