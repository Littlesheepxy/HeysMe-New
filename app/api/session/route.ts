import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { simpleMessageRouter } from '@/lib/routers/simple-message-router';

// 创建新会话
export async function POST(req: NextRequest) {
  try {
    // 🔧 修复：验证用户认证状态
    const { userId } = await auth();
    
    if (!userId) {
      console.log('⚠️ [会话API] 用户未登录，拒绝创建会话');
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { initialInput, sessionId: requestedSessionId, ...restBody } = body;

    // 🔧 修复：支持指定sessionId和完整的会话配置
    const sessionConfig = {
      ...restBody,
      ...(initialInput && typeof initialInput === 'object' ? initialInput : {})
    };
    
    let sessionId;
    if (requestedSessionId) {
      // 使用指定的sessionId创建会话
      console.log(`🎯 [会话API] 使用指定的sessionId: ${requestedSessionId}`);
      sessionId = requestedSessionId;
      
      // 直接通过SessionManager创建会话
      const { sessionManager } = await import('@/lib/utils/session-manager');
      const sessionData = {
        id: sessionId,
        userId,
        status: 'active',
        userIntent: {
          type: 'career_guidance',
          target_audience: 'internal_review',
          urgency: 'exploring',
          primary_goal: '了解需求'
        },
        personalization: {
          identity: {
            profession: 'other',
            experience_level: 'mid'
          },
          preferences: {
            style: 'modern',
            tone: 'professional',
            detail_level: 'detailed'
          },
          context: {}
        },
        collectedData: {
          personal: {},
          professional: { skills: [] },
          experience: [],
          education: [],
          projects: [],
          achievements: [],
          certifications: []
        },
        conversationHistory: [],
        agentFlow: [],
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          lastActive: new Date(),
          version: '1.0.0',
          progress: {
            currentStage: 'welcome',
            completedStages: [],
            totalStages: 4,
            percentage: 0
          },
          metrics: {
            totalTime: 0,
            userInteractions: 0,
            agentTransitions: 0,
            errorsEncountered: 0
          },
          settings: {
            autoSave: true,
            reminderEnabled: false,
            privacyLevel: 'private'
          },
          ...sessionConfig.metadata
        },
        ...sessionConfig
      };
      
      await sessionManager.updateSession(sessionId, sessionData);
    } else {
      // 生成新的sessionId
      sessionId = await simpleMessageRouter.createSession();
    }

    console.log(`✅ [会话API] 用户 ${userId} 创建新会话: ${sessionId}`);

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
    const sessionStatus = await simpleMessageRouter.getSessionStatus(sessionId);

    if (!sessionStatus) {
      console.log(`❌ [会话API] 会话未找到: ${sessionId}`);
      
      // 如果开启调试模式，返回调试信息
      if (debug) {
        const sessionData = await simpleMessageRouter.getSessionData(sessionId);
        const allSessions = await simpleMessageRouter.getAllActiveSessions();
        
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
    const success = await simpleMessageRouter.resetSessionToStage(sessionId, targetStage);

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