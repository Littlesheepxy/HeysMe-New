/**
 * 本地测试端点 - 不依赖外部网络
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // 系统信息检查
    const systemInfo = {
      platform: process.platform,
      nodeVersion: process.version,
      architecture: process.arch,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      env: {
        nodeEnv: process.env.NODE_ENV,
        hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
        hasVercelToken: !!process.env.VERCEL_TOKEN,
        userAgent: process.env.npm_config_user_agent || 'unknown'
      },
      timestamp: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };

    // 测试本地 fetch 能力（无需外部网络）
    const localTests = {
      jsonStringify: (() => {
        try {
          return { success: true, result: JSON.stringify({ test: 'ok' }) };
        } catch (e) {
          return { success: false, error: String(e) };
        }
      })(),
      
      promiseResolve: await (async () => {
        try {
          await new Promise(resolve => setTimeout(resolve, 10));
          return { success: true, message: 'Promise resolved' };
        } catch (e) {
          return { success: false, error: String(e) };
        }
      })(),
      
      dateOperations: (() => {
        try {
          const now = new Date();
          const iso = now.toISOString();
          return { success: true, now: iso, valid: !isNaN(now.getTime()) };
        } catch (e) {
          return { success: false, error: String(e) };
        }
      })()
    };

    // 网络诊断建议
    const networkDiagnostics = {
      possibleIssues: [
        'SSL/TLS 连接问题',
        'DNS 解析问题', 
        '防火墙阻止',
        '代理配置问题',
        '系统时间不准确'
      ],
      suggestedCommands: [
        'ping 8.8.8.8',
        'nslookup api.anthropic.com',
        'curl -k https://httpbin.org/get',
        'date',
        'env | grep -i proxy'
      ],
      alternativeApproaches: [
        '使用本地 Claude API 测试',
        '检查 .env.local 文件',
        '尝试重启开发服务器',
        '使用手机热点测试网络'
      ]
    };

    return NextResponse.json({
      success: true,
      message: '本地测试通过 - 服务器运行正常',
      systemInfo,
      localTests,
      networkDiagnostics,
      recommendations: [
        '1. 检查网络连接：ping 8.8.8.8',
        '2. 测试 DNS：nslookup api.anthropic.com', 
        '3. 检查系统时间：date',
        '4. 测试代理设置：env | grep -i proxy',
        '5. 尝试忽略 SSL：curl -k https://httpbin.org/get'
      ]
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Local test failed',
      details: error instanceof Error ? error.message : String(error),
      message: '本地测试也失败了，可能是服务器配置问题'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    return NextResponse.json({
      success: true,
      message: '本地 POST 测试成功',
      received: body,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Local POST test failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
