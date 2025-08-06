import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

// 获取当前用户信息
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { userId: null, isAuthenticated: false },
        { status: 200 }
      );
    }

    return NextResponse.json({
      userId,
      isAuthenticated: true,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [用户API] 获取用户信息失败:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get user info',
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