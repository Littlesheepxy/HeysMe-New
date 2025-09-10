import { NextRequest, NextResponse } from 'next/server';
import { simpleMessageRouter } from '@/lib/routers/simple-message-router';

/**
 * 将交互数据格式化为用户消息
 */
function formatInteractionAsUserMessage(data: any, result: any): string {
  const parts = [];
  
  // 🔧 修复：优先使用用户的实际输入消息
  if (data.message && typeof data.message === 'string' && data.message.trim()) {
    console.log(`📝 [用户实际输入] 使用用户消息: "${data.message}"`);
    return data.message.trim();
  }
  
  // 添加用户的选择信息
  if (data.user_role) {
    parts.push(`我的身份是：${data.user_role}`);
  }
  if (data.use_case) {
    parts.push(`使用目的：${data.use_case}`);
  }
  if (data.style) {
    parts.push(`偏好风格：${data.style}`);
  }
  if (data.highlight_focus && data.highlight_focus.length > 0) {
    parts.push(`关注重点：${data.highlight_focus.join('、')}`);
  }
  
  // 如果有具体选择信息，返回
  if (parts.length > 0) {
    return parts.join('，');
  }
  
  // 🔧 修复：如果没有具体信息且没有用户消息，不使用summary
  // summary通常是系统生成的，不应该替代用户的实际输入
  console.log(`⚠️ [格式化警告] 没有找到用户的实际输入内容，使用默认消息`);
  return '我想继续了解更多信息';
}

/**
 * 尝试恢复或重新创建会话
 */
async function recoverOrCreateSession(sessionId: string, data: any) {
  console.log(`🔄 [会话恢复] 尝试恢复会话: ${sessionId}`);
  
  try {
    // 尝试重新创建会话
    const newSessionId = await simpleMessageRouter.createSession();
    console.log(`✅ [会话恢复] 创建新会话: ${newSessionId}`);
    
    // 如果是重新生成请求，返回特殊标识
    if (data.type === 'regenerate') {
      return {
        action: 'session_recovered',
        newSessionId,
        originalSessionId: sessionId,
        needsRegenerate: true,
        messageId: data.messageId
      };
    }
    
    return {
      action: 'session_recovered',
      newSessionId,
      originalSessionId: sessionId
    };
  } catch (error) {
    console.error('❌ [会话恢复] 恢复失败:', error);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  console.log(`\n🎯 [交互API] 收到POST请求 - ${new Date().toISOString()}`);
  
  try {
    const { sessionId, interactionType, data } = await req.json();
    
    // 🔧 防重复请求处理 - 忽略无效的系统消息
    const requestId = `${sessionId}-${Date.now()}`;

    // 🔧 忽略无效的系统消息
    if (data.type === 'system_loading' && data.sender === 'assistant') {
      console.log(`⏸️  [系统消息忽略] 忽略系统加载消息: ${data.stage}`);
      return NextResponse.json({
        success: true,
        ignored: true,
        reason: 'System loading message ignored',
        timestamp: new Date().toISOString()
      });
    }

    console.log(`📋 [请求参数] SessionId: ${sessionId}, InteractionType: ${interactionType}`);
    console.log(`📄 [交互数据] ${JSON.stringify(data)}`);

    if (!sessionId || !interactionType) {
      console.error(`❌ [参数错误] SessionId 或 InteractionType 缺失`);
      return NextResponse.json(
        { error: 'SessionId and interactionType are required' },
        { status: 400 }
      );
    }

    // 获取会话数据 - 先尝试同步获取，失败则异步加载
    console.log(`🔍 [会话查找] 查找会话 ${sessionId}`);
    let sessionData = simpleMessageRouter.getSessionDataSync(sessionId);
    
    if (!sessionData) {
      console.log(`⚠️ [会话查找] 同步查找失败，尝试异步加载会话 ${sessionId}`);
      
      // 尝试异步加载会话
      try {
        sessionData = await simpleMessageRouter.getSessionData(sessionId);
      } catch (loadError) {
        console.warn(`⚠️ [会话加载] 异步加载失败:`, loadError);
      }
    }
    
    if (!sessionData) {
      console.error(`❌ [会话错误] 会话 ${sessionId} 未找到`);
      
      // 🔍 调试信息：检查会话存储状态
      try {
        const allSessions = await simpleMessageRouter.getAllActiveSessions();
        console.log(`🔍 [调试] 当前活跃会话数: ${allSessions.length}`);
        console.log(`🔍 [调试] 会话ID列表:`, allSessions.map(s => s.id));
      } catch (debugError) {
        console.error(`⚠️ [调试] 获取活跃会话失败:`, debugError);
      }
      
      // 🆕 尝试恢复会话
      try {
        const recoveryResult = await recoverOrCreateSession(sessionId, data);
        
        return NextResponse.json({
          success: true,
          action: 'session_recovery_needed',
          recovery: recoveryResult,
          timestamp: new Date().toISOString()
        });
      } catch (recoveryError) {
        console.error(`❌ [会话恢复] 恢复失败:`, recoveryError);
        return NextResponse.json(
          { 
            error: 'Session not found and recovery failed',
            details: recoveryError instanceof Error ? recoveryError.message : String(recoveryError)
          },
          { status: 404 }
        );
      }
    }

    console.log(`✅ [会话找到] 当前阶段: ${sessionData.metadata.progress.currentStage}, 进度: ${sessionData.metadata.progress.percentage}%`);

    // 处理用户交互
    console.log(`🎯 [开始处理] 调用 SimpleMessageRouter.handleUserInteraction`);
    const result = await simpleMessageRouter.handleUserInteraction(
      sessionId,
      interactionType,
      data,
      sessionData
    );

    console.log(`📋 [处理结果] Action: ${result?.action}, NextAgent: ${result?.nextAgent}`);

    // 🆕 处理自定义描述请求
    if (result?.action === 'request_custom_description') {
      console.log(`✏️ [自定义描述] 开始流式输出引导词`);
      
      // 设置等待状态
      const metadata = sessionData.metadata as any;
      metadata.waitingForCustomDescription = result.field;
      
      // 创建流式响应输出引导词
      const encoder = new TextEncoder();
      
      const stream = new ReadableStream({
        async start(controller) {
          try {
            // 获取引导词
            const promptText = result.description_prompt || '请详细描述您的需求...';
            console.log(`📝 [引导词] 准备流式输出 (长度: ${promptText.length})`);
            
            // 开始流式输出
            const characters = promptText.split('');
            let accumulatedText = '';
            
            for (let i = 0; i < characters.length; i++) {
              const currentChar = characters[i]; // 🔧 当前字符作为增量内容
              accumulatedText += currentChar;
              
              const streamChunk = {
                type: 'agent_response',
                immediate_display: {
                  reply: currentChar, // 🔧 发送单个字符作为增量内容
                  agent_name: 'WelcomeAgent',
                  timestamp: new Date().toISOString()
                },
                system_state: {
                  intent: 'requesting_description',
                  done: false,
                  progress: Math.round((i + 1) / characters.length * 100),
                  current_stage: '引导中...',
                  metadata: {
                    streaming: true,
                    field: result.field,
                    character_index: i + 1,
                    total_characters: characters.length,
                    // 🆕 明确标识为增量内容
                    content_mode: 'incremental',
                    agent_type: 'WelcomeAgent',
                    stream_type: i === 0 ? 'start' : 'delta'
                  }
                }
              };
              
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(streamChunk)}\n\n`));
              
              // 控制输出速度 - 中文字符稍快一些
              const delay = characters[i].match(/[\u4e00-\u9fa5]/) ? 50 : 30;
              await new Promise(resolve => setTimeout(resolve, delay));
            }
            
            // 发送完成状态
            const finalChunk = {
              type: 'agent_response',
              immediate_display: {
                reply: '', // 🔧 不发送全量文本，完成状态不需要额外内容
                agent_name: 'WelcomeAgent',
                timestamp: new Date().toISOString()
              },
              system_state: {
                intent: 'awaiting_description',
                done: false,
                progress: 100,
                current_stage: '等待用户描述',
                metadata: {
                  streaming: false,
                  stream_complete: true,
                  field: result.field,
                  waiting_for_input: true,
                  // 🆕 明确标识完成状态
                  content_mode: 'complete',
                  agent_type: 'WelcomeAgent',
                  stream_type: 'complete'
                }
              }
            };
            
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(finalChunk)}\n\n`));
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
            
            console.log(`✅ [流式完成] 引导词输出完成`);
            
          } catch (error) {
            console.error('❌ [流式错误] 引导词输出失败:', error);
            
            const errorChunk = {
              type: 'agent_response',
              immediate_display: {
                reply: '抱歉，系统出现问题，请直接在下方输入框描述您的需求。',
                agent_name: 'System',
                timestamp: new Date().toISOString()
              },
              system_state: {
                intent: 'error',
                done: false,
                metadata: { error: error instanceof Error ? error.message : String(error) }
              }
            };
            
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorChunk)}\n\n`));
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          }
        }
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // 🆕 处理流式响应
    if (result?.action === 'stream_response') {
      const encoder = new TextEncoder();
      
      const stream = new ReadableStream({
        async start(controller) {
          try {
            const userMessage = formatInteractionAsUserMessage(data, result);
            console.log(`📝 [流式消息] 用户消息: "${userMessage}"`);
            
            // 使用SimpleMessageRouter的流式处理
            const streamGenerator = simpleMessageRouter.processUserInputStreaming(
              sessionId,
              userMessage,
              sessionData,
              {
                interactionType,
                originalData: data,
                result
              }
            );
            
            for await (const chunk of streamGenerator) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
            }
            
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
            
          } catch (error) {
            console.error('❌ [流式错误] 处理失败:', error);
            
            const errorChunk = {
              type: 'agent_response',
              immediate_display: {
                reply: '抱歉，处理您的请求时出现问题，请重试。',
                agent_name: 'System',
                timestamp: new Date().toISOString()
              },
              system_state: {
                intent: 'error',
                done: false,
                metadata: { error: error instanceof Error ? error.message : String(error) }
              }
            };
            
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorChunk)}\n\n`));
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          }
        }
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // 默认返回结果
    return NextResponse.json({
      success: true,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [交互API] 处理失败:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
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
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 