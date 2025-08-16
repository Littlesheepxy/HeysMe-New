/**
 * E2B 沙盒创建 API
 * 创建专门用于 Next.js 应用的 E2B 沙盒实例
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { E2BSandboxService } from '@/lib/services/e2b-sandbox-service';
import { getE2BConfig } from '@/lib/config/e2b-config';

// 全局存储当前用户的沙盒实例（生产环境应该用 Redis 或数据库）
const userSandboxes = new Map<string, E2BSandboxService>();

export async function POST(request: NextRequest) {
  try {
    // 验证用户认证
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🚀 [E2B Create] 开始创建沙盒，用户ID:', userId);

    // 获取配置
    const config = getE2BConfig();
    
    if (!config.enabled) {
      return NextResponse.json({ 
        success: false,
        error: 'E2B_NOT_ENABLED',
        message: 'E2B 预览功能未启用'
      }, { status: 400 });
    }

    if (!config.apiKey) {
      return NextResponse.json({ 
        success: false,
        error: 'E2B_API_KEY_MISSING',
        message: 'E2B API Key 未配置'
      }, { status: 400 });
    }

    // 检查用户是否已有活跃的沙盒
    const existingSandboxService = userSandboxes.get(userId);
    if (existingSandboxService) {
      const existingSandbox = existingSandboxService.getCurrentSandbox();
      if (existingSandbox) {
        // 检查现有沙盒是否还活跃
        const statusResult = await existingSandboxService.getSandboxStatus();
        if (statusResult.success) {
          console.log('♻️ [E2B Create] 用户已有活跃沙盒，返回现有沙盒');
          return NextResponse.json({
            success: true,
            message: '返回现有活跃沙盒',
            sandboxInfo: existingSandbox,
            isExisting: true,
            previewUrl: existingSandboxService.getPreviewUrl()
          });
        } else {
          console.log('🗑️ [E2B Create] 现有沙盒已失效，清理并创建新的');
          await existingSandboxService.destroySandbox();
          userSandboxes.delete(userId);
        }
      }
    }

    // 创建新的沙盒服务实例
    const sandboxService = new E2BSandboxService(config);

    // 设置日志监听器
    const logs: string[] = [];
    sandboxService.addLogListener((log: string) => {
      logs.push(log);
      console.log(`[E2B Log] ${log}`);
    });

    // 创建沙盒
    console.log('🏗️ [E2B Create] 开始创建新沙盒...');
    const sandboxInfo = await sandboxService.createNextjsSandbox();

    // 存储沙盒服务实例
    userSandboxes.set(userId, sandboxService);

    console.log('✅ [E2B Create] 沙盒创建成功:', sandboxInfo.id);

    return NextResponse.json({
      success: true,
      message: '沙盒创建成功！',
      sandboxInfo: {
        id: sandboxInfo.id,
        url: sandboxInfo.url,
        status: sandboxInfo.status,
        createdAt: sandboxInfo.createdAt,
        port: sandboxInfo.port
      },
      isExisting: false,
      previewUrl: sandboxService.getPreviewUrl(),
      config: {
        framework: config.framework,
        nodeVersion: config.nodeVersion,
        port: config.port,
        timeoutMinutes: config.timeoutMinutes
      },
      logs: logs,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [E2B Create] 沙盒创建失败:', error);

    return NextResponse.json({
      success: false,
      error: 'SANDBOX_CREATION_FAILED',
      message: '沙盒创建失败',
      details: error instanceof Error ? error.message : '未知错误',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // 验证用户认证
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('📋 [E2B Status] 查询沙盒状态，用户ID:', userId);

    const sandboxService = userSandboxes.get(userId);
    
    if (!sandboxService) {
      return NextResponse.json({
        success: true,
        message: '没有活跃的沙盒',
        sandboxInfo: null,
        isActive: false
      });
    }

    const currentSandbox = sandboxService.getCurrentSandbox();
    
    if (!currentSandbox) {
      userSandboxes.delete(userId);
      return NextResponse.json({
        success: true,
        message: '没有活跃的沙盒',
        sandboxInfo: null,
        isActive: false
      });
    }

    // 检查沙盒状态
    const statusResult = await sandboxService.getSandboxStatus();
    
    if (!statusResult.success) {
      // 沙盒已失效，清理
      await sandboxService.destroySandbox();
      userSandboxes.delete(userId);
      
      return NextResponse.json({
        success: true,
        message: '沙盒已失效',
        sandboxInfo: null,
        isActive: false,
        error: statusResult.error
      });
    }

    return NextResponse.json({
      success: true,
      message: '沙盒运行正常',
      sandboxInfo: currentSandbox,
      isActive: true,
      previewUrl: sandboxService.getPreviewUrl(),
      history: sandboxService.getSandboxHistory()
    });

  } catch (error) {
    console.error('❌ [E2B Status] 状态查询失败:', error);

    return NextResponse.json({
      success: false,
      error: 'STATUS_CHECK_FAILED',
      message: '状态查询失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // 验证用户认证
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🗑️ [E2B Destroy] 销毁沙盒，用户ID:', userId);

    const sandboxService = userSandboxes.get(userId);
    
    if (!sandboxService) {
      return NextResponse.json({
        success: true,
        message: '没有需要销毁的沙盒'
      });
    }

    // 销毁沙盒
    const destroyResult = await sandboxService.destroySandbox();
    
    // 从内存中移除
    userSandboxes.delete(userId);

    console.log('✅ [E2B Destroy] 沙盒销毁完成');

    return NextResponse.json({
      success: true,
      message: '沙盒销毁成功',
      details: destroyResult
    });

  } catch (error) {
    console.error('❌ [E2B Destroy] 沙盒销毁失败:', error);

    return NextResponse.json({
      success: false,
      error: 'DESTROY_FAILED',
      message: '沙盒销毁失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

// 导出沙盒管理器（用于其他 API 访问）
export { userSandboxes };
