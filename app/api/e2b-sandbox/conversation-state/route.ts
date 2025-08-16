/**
 * 对话状态管理 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

// 全局对话状态存储
const conversationStates = new Map<string, {
  userId: string;
  sessionId: string;
  state: any;
  createdAt: Date;
  updatedAt: Date;
}>();

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: 'MISSING_SESSION_ID',
        message: '必须提供会话ID'
      }, { status: 400 });
    }

    const stateKey = `${userId}_${sessionId}`;
    const conversationState = conversationStates.get(stateKey);

    if (!conversationState) {
      return NextResponse.json({
        success: true,
        message: '会话状态不存在',
        state: null,
        sessionId
      });
    }

    return NextResponse.json({
      success: true,
      message: '会话状态获取成功',
      state: conversationState.state,
      sessionId,
      metadata: {
        createdAt: conversationState.createdAt,
        updatedAt: conversationState.updatedAt
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'GET_STATE_FAILED',
      message: '获取对话状态失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId, state, merge = true } = body;

    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: 'MISSING_SESSION_ID',
        message: '必须提供会话ID'
      }, { status: 400 });
    }

    const stateKey = `${userId}_${sessionId}`;
    const existingState = conversationStates.get(stateKey);

    let finalState = state;
    if (merge && existingState) {
      finalState = { ...existingState.state, ...state };
    }

    conversationStates.set(stateKey, {
      userId,
      sessionId,
      state: finalState,
      createdAt: existingState?.createdAt || new Date(),
      updatedAt: new Date()
    });

    return NextResponse.json({
      success: true,
      message: '对话状态更新成功',
      sessionId,
      state: finalState
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'UPDATE_STATE_FAILED',
      message: '更新对话状态失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
