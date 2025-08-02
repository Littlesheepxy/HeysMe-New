import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { sessionManager } from '@/lib/utils/session-manager';

// 获取用户的所有会话
export async function GET(req: NextRequest) {
  try {
    console.log('🔍 [会话列表API] 开始获取用户的所有会话...');
    console.log('🔍 [请求头] User-Agent:', req.headers.get('user-agent')?.substring(0, 50));
    console.log('🔍 [请求头] Authorization:', req.headers.get('authorization') ? 'YES' : 'NO');

    // 🔧 获取认证状态
    const { userId } = await auth();
    
    if (!userId) {
      console.log('⚠️ [会话列表API] 用户未登录');
      return NextResponse.json({
        success: true,
        sessions: [],
        count: 0,
        timestamp: new Date().toISOString(),
        debug: { 
          userId: null, 
          authenticated: false,
          message: 'User not authenticated. Please log in.'
        }
      });
    }

    console.log(`✅ [会话列表API] 用户已登录: ${userId}`);

    // 🔧 直接从 sessionStorage 加载会话，而不是依赖内存
    const { sessionStorage } = await import('@/lib/utils/session-storage');
    const sessionsMap = await sessionStorage.loadAllSessions();
    const userSessions = Array.from(sessionsMap.values());
    
    console.log(`✅ [会话列表API] 从数据库加载了 ${userSessions.length} 个会话`);

    // 按最后活跃时间排序
    const sortedSessions = userSessions.sort((a, b) => {
      const aTime = a.metadata?.lastActive?.getTime() || 0;
      const bTime = b.metadata?.lastActive?.getTime() || 0;
      return bTime - aTime; // 最新的在前
    });

    return NextResponse.json({
      success: true,
      sessions: sortedSessions,
      count: sortedSessions.length,
      timestamp: new Date().toISOString(),
      debug: { 
        userId, 
        authenticated: true,
        totalSessionsLoaded: userSessions.length,
        sampleSession: userSessions[0] ? {
          id: userSessions[0].id,
          conversationCount: userSessions[0].conversationHistory.length,
          createdAt: userSessions[0].metadata?.createdAt
        } : null
      }
    });

  } catch (error) {
    console.error('❌ [会话列表API] 获取会话列表失败:', error);
    return NextResponse.json(
      { 
        error: 'Failed to retrieve sessions',
        details: error instanceof Error ? error.message : 'Unknown error',
        debug: { stack: error instanceof Error ? error.stack : 'No stack trace' }
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}