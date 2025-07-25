import { NextRequest, NextResponse } from 'next/server';
import { agentOrchestrator } from '@/lib/utils/agent-orchestrator';

// 创建新会话
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { initialInput } = body;

    // 创建新会话（现在是异步的）
    const sessionId = await agentOrchestrator.createSession(initialInput);

    console.log(`✅ [会话API] 创建新会话: ${sessionId}`);

    return NextResponse.json({
      success: true,
      sessionId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [会话API] 创建会话失败:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create session',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// 获取会话状态
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');
    const debug = searchParams.get('debug') === 'true';

    if (!sessionId) {
      return NextResponse.json(
        { error: 'SessionId is required' },
        { status: 400 }
      );
    }

    console.log(`🔍 [会话API] 查询会话: ${sessionId}`);

    // 获取会话状态
    const sessionStatus = await agentOrchestrator.getSessionStatus(sessionId);

    if (!sessionStatus) {
      console.log(`❌ [会话API] 会话未找到: ${sessionId}`);
      
      // 如果开启调试模式，返回调试信息
      if (debug) {
        const sessionData = await agentOrchestrator.getSessionData(sessionId);
        const allSessions = await agentOrchestrator.getAllActiveSessions();
        
        return NextResponse.json({
          error: 'Session not found',
          debug: {
            requestedSessionId: sessionId,
            sessionData: !!sessionData,
            totalActiveSessions: allSessions.length,
            allSessionIds: allSessions.map((s: any) => s.id),
            timestamp: new Date().toISOString()
          }
        }, { status: 404 });
      }
      
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    console.log(`✅ [会话API] 找到会话: ${sessionId}, 阶段: ${sessionStatus.currentStage}`);

    return NextResponse.json({
      success: true,
      session: sessionStatus,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [会话API] 检索会话失败:', error);
    return NextResponse.json(
      { 
        error: 'Failed to retrieve session',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// 重置会话到指定阶段
export async function PATCH(req: NextRequest) {
  try {
    const { sessionId, targetStage } = await req.json();

    if (!sessionId || !targetStage) {
      return NextResponse.json(
        { error: 'SessionId and targetStage are required' },
        { status: 400 }
      );
    }

    // 重置会话
    const success = await agentOrchestrator.resetSessionToStage(sessionId, targetStage);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to reset session or invalid stage' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Session reset to ${targetStage}`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Session reset error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to reset session',
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
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
} 