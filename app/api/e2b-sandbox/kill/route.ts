/**
 * 沙盒销毁 API
 * 销毁沙盒实例并清理资源
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { userSandboxes } from '../create/route';

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🗑️ [Kill Sandbox] 开始销毁沙盒，用户ID:', userId);

    const sandboxService = userSandboxes.get(userId);
    
    if (!sandboxService) {
      return NextResponse.json({
        success: true,
        message: '没有需要销毁的沙盒',
        alreadyDestroyed: true
      });
    }

    const currentSandbox = sandboxService.getCurrentSandbox();
    const sandboxId = currentSandbox?.id || 'unknown';

    // 执行销毁操作
    const destroyResult = await sandboxService.destroySandbox();
    
    // 从内存中移除
    userSandboxes.delete(userId);

    console.log('✅ [Kill Sandbox] 沙盒销毁完成:', sandboxId);

    return NextResponse.json({
      success: true,
      message: '沙盒销毁成功',
      destroyResult: destroyResult,
      sandboxId: sandboxId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [Kill Sandbox] 沙盒销毁失败:', error);

    return NextResponse.json({
      success: false,
      error: 'DESTROY_FAILED',
      message: '沙盒销毁失败',
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
    const { force = false, reason = '用户请求' } = body;

    console.log('🗑️ [Kill Sandbox] 强制销毁沙盒:', { force, reason });

    const sandboxService = userSandboxes.get(userId);
    
    if (!sandboxService) {
      return NextResponse.json({
        success: true,
        message: '没有需要销毁的沙盒',
        alreadyDestroyed: true
      });
    }

    const currentSandbox = sandboxService.getCurrentSandbox();
    
    // 如果启用强制模式，跳过健康检查直接销毁
    if (force) {
      console.log('⚡ [Kill Sandbox] 强制销毁模式');
    } else {
      // 尝试优雅关闭
      console.log('🤝 [Kill Sandbox] 优雅关闭模式');
    }

    const destroyResult = await sandboxService.destroySandbox();
    userSandboxes.delete(userId);

    return NextResponse.json({
      success: true,
      message: '沙盒销毁成功',
      mode: force ? 'forced' : 'graceful',
      reason: reason,
      destroyResult: destroyResult,
      sandboxInfo: currentSandbox,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [Kill Sandbox] 强制销毁失败:', error);

    return NextResponse.json({
      success: false,
      error: 'FORCE_DESTROY_FAILED',
      message: '强制销毁失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

// 批量清理不活跃的沙盒
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { maxInactiveMinutes = 30 } = body;

    console.log('🧹 [Kill Sandbox] 批量清理不活跃沙盒，超时:', maxInactiveMinutes, '分钟');

    const results = [];
    const now = Date.now();

    // 检查所有用户的沙盒
    for (const [currentUserId, sandboxService] of userSandboxes.entries()) {
      // 只处理当前用户的沙盒（或管理员）
      if (currentUserId !== userId) continue;

      const currentSandbox = sandboxService.getCurrentSandbox();
      if (!currentSandbox) continue;

      const inactiveMs = now - currentSandbox.lastActivity.getTime();
      const inactiveMinutes = Math.floor(inactiveMs / 60000);

      if (inactiveMinutes > maxInactiveMinutes) {
        try {
          const destroyResult = await sandboxService.destroySandbox();
          userSandboxes.delete(currentUserId);
          
          results.push({
            userId: currentUserId,
            sandboxId: currentSandbox.id,
            inactiveMinutes,
            destroyed: true,
            destroyResult
          });
          
          console.log(`🗑️ [Kill Sandbox] 清理不活跃沙盒: ${currentSandbox.id} (不活跃 ${inactiveMinutes} 分钟)`);
        } catch (error) {
          results.push({
            userId: currentUserId,
            sandboxId: currentSandbox.id,
            inactiveMinutes,
            destroyed: false,
            error: error instanceof Error ? error.message : '未知错误'
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `批量清理完成，清理了 ${results.filter(r => r.destroyed).length} 个不活跃沙盒`,
      maxInactiveMinutes,
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [Kill Sandbox] 批量清理失败:', error);

    return NextResponse.json({
      success: false,
      error: 'BATCH_CLEANUP_FAILED',
      message: '批量清理失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
