/**
 * 沙盒状态检查 API
 * 检查沙盒状态和健康度
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { userSandboxes } from '../create/route';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('📊 [Sandbox Status] 检查沙盒状态，用户ID:', userId);
    console.log('📊 [Sandbox Status] userSandboxes size:', userSandboxes.size);
    console.log('📊 [Sandbox Status] userSandboxes keys:', Array.from(userSandboxes.keys()));

    const sandboxService = userSandboxes.get(userId);
    
    if (!sandboxService) {
      console.log('❌ [Sandbox Status] 沙盒服务未找到');
      return NextResponse.json({
        success: true,
        status: 'no_sandbox',
        message: '没有活跃的沙盒',
        data: {
          isActive: false,
          sandboxInfo: null,
          healthStatus: 'inactive',
          debug: {
            userId,
            sandboxesCount: userSandboxes.size,
            availableUsers: Array.from(userSandboxes.keys())
          }
        }
      });
    }
    
    console.log('✅ [Sandbox Status] 找到沙盒服务');

    const currentSandbox = sandboxService.getCurrentSandbox();
    
    if (!currentSandbox) {
      userSandboxes.delete(userId);
      return NextResponse.json({
        success: true,
        status: 'no_sandbox',
        message: '沙盒信息丢失',
        data: {
          isActive: false,
          sandboxInfo: null,
          healthStatus: 'inactive'
        }
      });
    }

    // 执行健康检查
    const healthCheck = await sandboxService.getSandboxStatus();
    
    if (!healthCheck.success) {
      // 沙盒不健康，清理
      await sandboxService.destroySandbox();
      userSandboxes.delete(userId);
      
      return NextResponse.json({
        success: true,
        status: 'unhealthy',
        message: '沙盒不健康已清理',
        data: {
          isActive: false,
          sandboxInfo: currentSandbox,
          healthStatus: 'unhealthy',
          error: healthCheck.error
        }
      });
    }

    // 检查运行时长
    const uptimeMs = Date.now() - currentSandbox.createdAt.getTime();
    const uptimeMinutes = Math.floor(uptimeMs / 60000);
    
    // 检查最后活动时间
    const inactiveMs = Date.now() - currentSandbox.lastActivity.getTime();
    const inactiveMinutes = Math.floor(inactiveMs / 60000);

    return NextResponse.json({
      success: true,
      status: 'healthy',
      message: '沙盒运行正常',
      data: {
        isActive: true,
        sandboxInfo: currentSandbox,
        healthStatus: 'healthy',
        metrics: {
          uptimeMinutes: uptimeMinutes,
          inactiveMinutes: inactiveMinutes,
          createdAt: currentSandbox.createdAt,
          lastActivity: currentSandbox.lastActivity
        },
        previewUrl: sandboxService.getPreviewUrl(),
        history: sandboxService.getSandboxHistory()
      }
    });

  } catch (error) {
    console.error('❌ [Sandbox Status] 状态检查失败:', error);

    return NextResponse.json({
      success: false,
      error: 'STATUS_CHECK_FAILED',
      message: '沙盒状态检查失败',
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

    const { action } = await request.json();

    console.log('🔧 [Sandbox Status] 执行操作:', action);

    const sandboxService = userSandboxes.get(userId);
    
    if (!sandboxService) {
      return NextResponse.json({
        success: false,
        error: 'NO_SANDBOX',
        message: '没有活跃的沙盒可操作'
      }, { status: 400 });
    }

    switch (action) {
      case 'health_check':
        const healthResult = await sandboxService.getSandboxStatus();
        return NextResponse.json({
          success: true,
          message: '健康检查完成',
          healthStatus: healthResult.success ? 'healthy' : 'unhealthy',
          details: healthResult
        });

      case 'update_activity':
        const currentSandbox = sandboxService.getCurrentSandbox();
        if (currentSandbox) {
          currentSandbox.lastActivity = new Date();
          return NextResponse.json({
            success: true,
            message: '活动时间已更新',
            lastActivity: currentSandbox.lastActivity
          });
        }
        break;

      default:
        return NextResponse.json({
          success: false,
          error: 'INVALID_ACTION',
          message: `不支持的操作: ${action}`
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ [Sandbox Status] 操作失败:', error);

    return NextResponse.json({
      success: false,
      error: 'OPERATION_FAILED',
      message: '沙盒操作失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
