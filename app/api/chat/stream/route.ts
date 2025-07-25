import { NextRequest, NextResponse } from 'next/server';
import { agentOrchestrator } from '@/lib/utils/agent-orchestrator';
import { SessionData } from '@/lib/types/session';
import { StreamableAgentResponse } from '@/lib/types/streaming';

// 模拟会话存储（实际应用中应该使用数据库）
const sessions = new Map<string, SessionData>();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return new NextResponse('Session ID is required', { status: 400 });
  }

  // 创建SSE响应
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    start(controller) {
      // 使用Agent编排器处理初始会话
      const processInitialStream = async () => {
        try {
          // 发送初始欢迎消息，触发WelcomeAgent
          const responseGenerator = agentOrchestrator.processUserInputStreaming(
            sessionId,
            '初始化', // 空消息来触发欢迎流程
            undefined // 没有指定stage，让编排器自动确定
          );
          
          for await (const response of responseGenerator) {
            // 发送SSE数据
            const data = `data: ${JSON.stringify(response)}\n\n`;
            controller.enqueue(encoder.encode(data));
            
            // 如果响应完成但需要用户交互，不要关闭流
            if (response.system_state?.done && !response.interaction) {
              controller.enqueue(encoder.encode('event: complete\ndata: {}\n\n'));
              controller.close();
              return;
            }
          }
        } catch (error) {
          console.error('Agent processing error:', error);
          const errorResponse: StreamableAgentResponse = {
            immediate_display: {
              reply: '抱歉，系统出现了问题，请稍后重试。',
              agent_name: 'System',
              timestamp: new Date().toISOString()
            },
            system_state: {
              intent: 'error',
              done: true
            }
          };
          
          const data = `data: ${JSON.stringify(errorResponse)}\n\n`;
          controller.enqueue(encoder.encode(data));
          controller.close();
        }
      };

      // 开始处理
      processInitialStream();
    },

    cancel() {
      console.log('SSE stream cancelled');
    }
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}

export async function POST(req: NextRequest) {
  try {
    const { message, sessionId, currentStage, forceAgent, testMode, context } = await req.json();

    if (!message || !sessionId) {
      return NextResponse.json(
        { error: 'Message and sessionId are required' },
        { status: 400 }
      );
    }

    console.log(`🚀 [流式API] 处理消息:`, {
      sessionId,
      messageLength: message.length,
      currentStage,
      forceAgent,
      testMode,
      context
    });

    // 创建流式响应
    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 构建传递给编排器的会话数据和上下文
          let sessionData = undefined;
          const finalMessage = message;
          let finalContext = context;
          
          // 🔧 修复：优先使用context参数，而不是在消息中添加标记
          if (forceAgent || testMode) {
            // 获取现有会话数据
            const existingSession = await agentOrchestrator.getSessionData(sessionId);
            
            if (existingSession) {
              // 修改现有会话的阶段
              sessionData = {
                ...existingSession,
                metadata: {
                  ...existingSession.metadata,
                  progress: {
                    ...existingSession.metadata.progress,
                    currentStage: forceAgent === 'coding' ? 'code_generation' : existingSession.metadata.progress.currentStage
                  }
                }
              };
            }
            
            // 🔧 修复：通过context传递模式信息，而不是修改消息
            finalContext = {
              ...context,
              forceAgent,
              testMode,
              expertMode: testMode || context?.expertMode,
              forceExpertMode: testMode || context?.forceExpertMode
            };
            
            console.log('🎯 [API] 使用context传递模式信息:', finalContext);
          }

          // 使用Agent编排器处理流式输入
          const responseGenerator = agentOrchestrator.processUserInputStreaming(
            sessionId,
            finalMessage,
            sessionData,
            finalContext
          );

          let responseCount = 0;
          for await (const chunk of responseGenerator) {
            responseCount++;
            console.log(`📤 [流式发送] 第${responseCount}个响应:`, {
              hasReply: !!chunk.immediate_display?.reply,
              replyLength: chunk.immediate_display?.reply?.length || 0,
              intent: chunk.system_state?.intent,
              done: chunk.system_state?.done,
              forceAgent,
              testMode
            });

            // 🔧 修复：确保响应格式统一
            const formattedChunk = {
              type: 'agent_response',  // 确保使用下划线格式
              ...chunk
            };
            
            // 🔧 调试：记录发送的数据格式
            console.log('📤 [数据格式检查] 发送的chunk结构:', {
              type: formattedChunk.type,
              hasImmediateDisplay: !!formattedChunk.immediate_display,
              hasReply: !!formattedChunk.immediate_display?.reply,
              replyLength: formattedChunk.immediate_display?.reply?.length || 0,
              agentName: formattedChunk.immediate_display?.agent_name
            });

            // 转换为SSE格式
            const sseData = `data: ${JSON.stringify(formattedChunk)}\n\n`;
            
            // 🔧 添加控制器状态检查
            try {
              controller.enqueue(encoder.encode(sseData));
            } catch (streamError) {
              console.error('❌ [流式发送错误]:', streamError);
              break; // 退出循环，避免继续发送
            }
          }

          console.log(`✅ [流式完成] 总共发送了 ${responseCount} 个响应`);

          // 发送结束标记
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();

        } catch (error) {
          console.error('❌ [流式处理错误]:', error);
          
          // 发送错误信息
          const errorResponse: StreamableAgentResponse = {
            immediate_display: {
              reply: '抱歉，处理您的请求时遇到了问题。请重试。',
              agent_name: 'System',
              timestamp: new Date().toISOString()
            },
            system_state: {
              intent: 'error',
              done: true
            }
          };

          const formattedError = {
            type: 'agent_response',
            ...errorResponse
          };

          const sseData = `data: ${JSON.stringify(formattedError)}\n\n`;
          controller.enqueue(encoder.encode(sseData));
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        }
      }
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

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