import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { sessionManager } from '@/lib/utils/session-manager';

// 同步前端会话数据到后端
export async function POST(req: NextRequest) {
  try {
    // 🔧 修复：验证用户认证状态
    const { userId } = await auth();
    
    if (!userId) {
      console.log('⚠️ [会话同步] 用户未登录，拒绝同步');
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    const { sessionId, sessionData } = await req.json();

    if (!sessionId || !sessionData) {
      return NextResponse.json(
        { error: 'SessionId and sessionData are required' },
        { status: 400 }
      );
    }

    console.log(`🔄 [会话同步] 用户 ${userId} 同步会话数据到后端: ${sessionId}`);

    // 🔧 智能合并会话数据，保护关键状态信息
    try {
      console.log(`🔍 [调试] 开始同步会话，sessionId: ${sessionId}`);
      console.log(`🔍 [调试] sessionData 结构:`, Object.keys(sessionData));
      console.log(`🔍 [调试] 用户 ID: ${userId}`);
      
      // 获取当前后端会话状态
      const currentSession = await sessionManager.getSession(sessionId);
      
      let mergedSessionData;
      
      if (currentSession) {
        // 智能合并：保护后端的关键状态，合并前端的用户数据
        console.log(`🔄 [智能合并] 当前后端阶段: ${currentSession.metadata.progress.currentStage}`);
        console.log(`🔄 [智能合并] 前端传递阶段: ${sessionData.metadata?.progress?.currentStage}`);
        
        mergedSessionData = {
          ...sessionData,
          userId: sessionData.userId || userId,
          // 保护关键的进度和状态信息
          metadata: {
            ...sessionData.metadata,
            progress: {
              ...sessionData.metadata?.progress,
              // 如果后端阶段更新，优先使用后端的阶段信息
              currentStage: currentSession.metadata.progress.currentStage,
              percentage: currentSession.metadata.progress.percentage,
              completedStages: currentSession.metadata.progress.completedStages,
            },
            // 保护其他关键元数据
            metrics: currentSession.metadata.metrics,
            lastActive: new Date(),
            updatedAt: new Date(),
          }
        };
        
        console.log(`🔒 [状态保护] 使用后端阶段: ${mergedSessionData.metadata.progress.currentStage}`);
      } else {
        // 新会话，直接使用前端数据
        mergedSessionData = {
          ...sessionData,
          userId: sessionData.userId || userId,
        };
        
        console.log(`🆕 [新会话] 使用前端数据创建会话`);
      }
      
      await sessionManager.updateSession(sessionId, mergedSessionData);
      console.log(`✅ [会话同步] 会话 ${sessionId} 已成功同步到SessionManager`);
      
      // 验证同步是否成功
      const retrievedSession = sessionManager.getSession(sessionId);
      if (!retrievedSession) {
        console.error(`❌ [验证失败] 同步后无法找到会话 ${sessionId}`);
        throw new Error('Session not found after sync');
      }
      
      console.log(`✅ [会话验证] 会话 ${sessionId} 同步验证成功，阶段: ${(await retrievedSession)?.metadata?.progress?.currentStage}`);
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