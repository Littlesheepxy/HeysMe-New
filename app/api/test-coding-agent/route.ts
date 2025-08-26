import { NextRequest, NextResponse } from 'next/server';
import { CodingAgent } from '@/lib/agents/coding/agent';
import { SessionData } from '@/lib/types/session';

// 🧪 测试专用的coding-agent API，不需要身份验证
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      user_input,
      mode = 'initial',
      sessionData = {}
    } = body;

    // 验证请求参数
    if (!user_input) {
      return NextResponse.json({ 
        error: 'Missing required field: user_input' 
      }, { status: 400 });
    }

    console.log('🧪 [Test Coding Agent] 收到请求:', {
      userInput: user_input.substring(0, 100) + '...',
      mode,
      sessionData: Object.keys(sessionData)
    });

    // 创建CodingAgent实例
    const codingAgent = new CodingAgent();
    
    // 准备session数据 - 使用测试用户ID
    const session: SessionData = {
      id: sessionData.id || `test_session_${Date.now()}`,
      userId: 'test_user_' + Date.now(), // 🧪 测试用户ID
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
          console.log('🌊 [测试流式响应] 开始生成...');
          console.log('🎯 [模式检查] 使用模式:', mode);
          
          // 调用CodingAgent生成流式响应
          for await (const response of codingAgent.process(
            { 
              user_input: user_input,
              mode: mode
            },
            session,
            { testMode: true } // 标记为测试模式
          )) {
            // 将响应编码为Server-Sent Events格式
            const responseData = JSON.stringify(response);
            const sseData = `data: ${responseData}\n\n`;
            
            console.log('📤 [测试流式数据] 发送chunk:', {
              intent: response.system_state?.intent,
              done: response.system_state?.done,
              hasReply: !!response.immediate_display?.reply,
              replyLength: response.immediate_display?.reply?.length || 0,
              metadata: response.system_state?.metadata ? Object.keys(response.system_state.metadata) : []
            });
            
            controller.enqueue(encoder.encode(sseData));
            
            // 如果响应完成，结束流
            if (response.system_state?.done) {
              console.log('✅ [测试流式响应] 生成完成');
              break;
            }
          }
          
          // 发送结束标记
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
          
        } catch (error) {
          console.error('❌ [Test Coding Agent] 处理错误:', error);
          
          const errorResponse = {
            immediate_display: {
              reply: `测试错误: ${error instanceof Error ? error.message : '未知错误'}`,
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
    console.error('❌ [Test Coding Agent] API错误:', error);
    
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
