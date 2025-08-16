/**
 * E2B 连接测试 API
 * 用于验证 E2B API Key 和基础功能
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { E2BSandboxService } from '@/lib/services/e2b-sandbox-service';
import { getE2BConfig } from '@/lib/config/e2b-config';

export async function GET(request: NextRequest) {
  try {
    // 验证用户认证
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🧪 [E2B Test] 开始连接测试...');

    // 获取配置
    const config = getE2BConfig();
    
    // 检查配置状态
    if (!config.enabled) {
      return NextResponse.json({ 
        success: false,
        message: 'E2B 预览功能未启用',
        details: {
          enabled: config.enabled,
          hasApiKey: !!config.apiKey,
          environment: config.environment
        }
      }, { status: 200 });
    }

    if (!config.apiKey) {
      return NextResponse.json({ 
        success: false,
        message: 'E2B API Key 未配置',
        details: {
          enabled: config.enabled,
          hasApiKey: false,
          environment: config.environment
        }
      }, { status: 400 });
    }

    // 创建服务实例并测试
    const sandboxService = new E2BSandboxService(config);
    
    console.log('🚀 [E2B Test] 尝试创建测试沙盒...');
    
    // 测试创建沙盒（不启动完整的 Next.js 环境，只测试基础连接）
    try {
      const sandboxInfo = await sandboxService.createNextjsSandbox();
      
      // 获取沙盒状态
      const statusResult = await sandboxService.getSandboxStatus();
      
      // 立即销毁测试沙盒以节省资源
      await sandboxService.destroySandbox();
      
      console.log('✅ [E2B Test] 连接测试成功');
      
      return NextResponse.json({
        success: true,
        message: 'E2B 连接测试成功！',
        details: {
          enabled: config.enabled,
          hasApiKey: true,
          environment: config.environment,
          testSandboxId: sandboxInfo.id,
          testUrl: sandboxInfo.url,
          sandboxStatus: statusResult.success ? '正常' : '异常',
          framework: config.framework,
          nodeVersion: config.nodeVersion,
          port: config.port,
          timeoutMinutes: config.timeoutMinutes
        },
        timestamp: new Date().toISOString()
      });

    } catch (sandboxError) {
      console.error('❌ [E2B Test] 沙盒创建失败:', sandboxError);
      
      return NextResponse.json({
        success: false,
        message: 'E2B 沙盒创建失败',
        error: sandboxError instanceof Error ? sandboxError.message : '未知错误',
        details: {
          enabled: config.enabled,
          hasApiKey: true,
          environment: config.environment,
          framework: config.framework
        }
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ [E2B Test] 连接测试失败:', error);
    
    return NextResponse.json({
      success: false,
      message: 'E2B 连接测试失败',
      error: error instanceof Error ? error.message : '未知错误',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // 验证用户认证
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { apiKey } = body;

    if (!apiKey) {
      return NextResponse.json({ 
        error: 'Missing E2B API Key' 
      }, { status: 400 });
    }

    console.log('🧪 [E2B Test] 测试自定义 API Key...');

    // 创建临时配置
    const testConfig = {
      ...getE2BConfig(),
      apiKey: apiKey,
      enabled: true
    };

    // 测试 API Key
    const sandboxService = new E2BSandboxService(testConfig);
    
    try {
      const sandboxInfo = await sandboxService.createNextjsSandbox();
      await sandboxService.destroySandbox();
      
      console.log('✅ [E2B Test] 自定义 API Key 测试成功');
      
      return NextResponse.json({
        success: true,
        message: 'API Key 有效！',
        details: {
          apiKeyValid: true,
          testSandboxId: sandboxInfo.id,
          framework: testConfig.framework
        }
      });

    } catch (error) {
      console.error('❌ [E2B Test] 自定义 API Key 测试失败:', error);
      
      return NextResponse.json({
        success: false,
        message: 'API Key 无效或沙盒创建失败',
        error: error instanceof Error ? error.message : '未知错误'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ [E2B Test] 请求处理失败:', error);
    
    return NextResponse.json({
      success: false,
      message: '请求处理失败',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
