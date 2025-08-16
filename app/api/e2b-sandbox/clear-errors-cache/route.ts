/**
 * 清除 Next.js 错误缓存 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { userSandboxes } from '../create/route';
import { errorCache } from '../check-errors/route';

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sandboxService = userSandboxes.get(userId);
    const currentSandbox = sandboxService?.getCurrentSandbox();
    
    if (!currentSandbox) {
      return NextResponse.json({
        success: false,
        error: 'NO_SANDBOX',
        message: '沙盒未激活'
      }, { status: 400 });
    }

    const errors = errorCache.get(currentSandbox.id) || [];
    const clearedCount = errors.length;

    errorCache.set(currentSandbox.id, []);

    return NextResponse.json({
      success: true,
      message: 'Next.js 错误缓存已清除',
      clearedCount,
      sandboxId: currentSandbox.id,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'CLEAR_CACHE_FAILED',
      message: '清除缓存失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
