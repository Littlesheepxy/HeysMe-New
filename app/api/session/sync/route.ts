import { NextRequest, NextResponse } from 'next/server';
import { sessionManager } from '@/lib/utils/session-manager';

// 同步前端会话数据到后端
export async function POST(req: NextRequest) {
  try {
    const { sessionId, sessionData } = await req.json();

    if (!sessionId || !sessionData) {
      return NextResponse.json(
        { error: 'SessionId and sessionData are required' },
        { status: 400 }
      );
    }

    console.log(`🔄 [会话同步] 同步会话数据到后端: ${sessionId}`);

    // 直接使用SessionManager同步会话数据
    try {
      console.log(`🔍 [调试] 开始同步会话，sessionId: ${sessionId}`);
      console.log(`🔍 [调试] sessionData 结构:`, Object.keys(sessionData));
      
      sessionManager.updateSession(sessionId, sessionData);
      console.log(`✅ [会话同步] 会话 ${sessionId} 已成功同步到SessionManager`);
      
      // 验证同步是否成功
      const retrievedSession = sessionManager.getSession(sessionId);
      if (!retrievedSession) {
        console.error(`❌ [验证失败] 同步后无法找到会话 ${sessionId}`);
        throw new Error('Session not found after sync');
      }
      
      console.log(`✅ [会话验证] 会话 ${sessionId} 同步验证成功，阶段: ${retrievedSession.metadata?.progress?.currentStage}`);
    } catch (error) {
      console.error(`❌ [会话同步] 同步失败:`, error);
      console.error(`❌ [详细错误]:`, error instanceof Error ? error.stack : String(error));
      return NextResponse.json(
        { error: 'Failed to sync session data', details: error instanceof Error ? error.message : String(error) },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Session data synced successfully',
      sessionId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Session sync error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to sync session',
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
} 