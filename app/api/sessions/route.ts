import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { sessionManager } from '@/lib/utils/session-manager';

// 获取用户的所有会话
export async function GET(req: NextRequest) {
  try {
    console.log('🔍 [会话列表API] 开始获取用户的所有会话...');

    // 🔧 修复：直接在 API 路由中获取认证状态
    const { userId } = await auth();
    
    if (!userId) {
      console.log('⚠️ [会话列表API] 用户未登录');
      return NextResponse.json({
        success: true,
        sessions: [],
        count: 0,
        timestamp: new Date().toISOString()
      });
    }

    console.log(`🔍 [会话列表API] 用户已登录: ${userId}`);

    // 获取所有活跃会话
    const allSessions = await sessionManager.getAllActiveSessions();
    
    // 🔧 修复：过滤当前用户的会话
    const userSessions = allSessions.filter(session => {
      // 检查会话是否属于当前用户
      return session.userId === userId;
    });
    
    console.log(`✅ [会话列表API] 找到 ${userSessions.length} 个用户会话（总计 ${allSessions.length} 个）`);

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
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [会话列表API] 获取会话列表失败:', error);
    return NextResponse.json(
      { 
        error: 'Failed to retrieve sessions',
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}