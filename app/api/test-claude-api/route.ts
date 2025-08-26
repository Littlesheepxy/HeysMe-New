/**
 * 测试 Claude API 连接状态
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 开始测试 Claude API...');
    
    // 获取 API Key
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    // 环境检查
    const envCheck = {
      hasApiKey: !!apiKey,
      nodeEnv: process.env.NODE_ENV,
      userAgent: process.env.npm_config_user_agent || 'unknown',
      platform: process.platform,
      nodeVersion: process.version
    };
    
    console.log('🔍 环境检查:', envCheck);
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'ANTHROPIC_API_KEY not configured',
        message: '请在环境变量中设置 ANTHROPIC_API_KEY',
        envCheck
      }, { status: 503 });
    }

    // 首先测试基本网络连接
    console.log('🌐 测试网络连接...');
    
    let networkTest;
    try {
      const testResponse = await fetch('https://httpbin.org/get', {
        method: 'GET',
        headers: {
          'User-Agent': 'HeysMe-Test/1.0'
        }
      });
      networkTest = {
        success: testResponse.ok,
        status: testResponse.status,
        message: testResponse.ok ? '网络连接正常' : '网络连接异常'
      };
    } catch (netError) {
      console.error('❌ 网络测试失败:', netError);
      networkTest = {
        success: false,
        error: netError instanceof Error ? netError.message : String(netError),
        message: '网络连接失败'
      };
    }

    console.log('🌐 网络测试结果:', networkTest);

    // 如果网络测试失败，直接返回
    if (!networkTest.success) {
      return NextResponse.json({
        success: false,
        error: 'Network connection failed',
        message: '网络连接失败，无法访问外部API',
        networkTest,
        envCheck,
        suggestions: [
          '检查网络连接',
          '确认防火墙设置',
          '验证代理配置',
          '检查本地开发环境的网络权限'
        ]
      }, { status: 503 });
    }

    // 测试 Claude API
    console.log('🤖 测试 Claude API...');
    
    const requestBody = {
      model: 'claude-3-sonnet-20240229',
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: '你好，请回复"API连接正常"'
        }
      ]
    };

    console.log('📤 发送请求到 Claude API...');
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'User-Agent': 'HeysMe-Test/1.0'
      },
      body: JSON.stringify(requestBody),
      // 添加超时设置
      signal: AbortSignal.timeout(30000) // 30秒超时
    });

    console.log('📥 收到 Claude API 响应:', response.status);

    const responseText = await response.text();
    
    if (!response.ok) {
      console.error('❌ Claude API 请求失败:', response.status, responseText);
      return NextResponse.json({
        success: false,
        error: 'Claude API request failed',
        status: response.status,
        details: responseText,
        message: `API 请求失败: ${response.status} ${response.statusText}`,
        networkTest,
        envCheck
      }, { status: response.status });
    }

    const data = JSON.parse(responseText);
    console.log('✅ Claude API 响应成功');

    return NextResponse.json({
      success: true,
      message: 'Claude API 连接正常',
      response: {
        model: data.model,
        usage: data.usage,
        content: data.content?.[0]?.text || 'No content',
        timestamp: new Date().toISOString()
      },
      apiStatus: {
        endpoint: 'https://api.anthropic.com/v1/messages',
        httpStatus: response.status,
        hasApiKey: !!apiKey,
        apiKeyPrefix: apiKey ? `${apiKey.slice(0, 8)}...` : null
      },
      networkTest,
      envCheck
    });

  } catch (error) {
    console.error('❌ Claude API 测试失败:', error);
    
    // 详细的错误分析
    let errorAnalysis = {
      type: 'unknown',
      message: error instanceof Error ? error.message : String(error),
      suggestions: [] as string[]
    };

    if (error instanceof Error) {
      if (error.message.includes('fetch failed') || error.message.includes('ENOTFOUND')) {
        errorAnalysis.type = 'network';
        errorAnalysis.suggestions = [
          '检查网络连接',
          '确认 DNS 解析正常',
          '检查防火墙或代理设置',
          '尝试使用 VPN 或更换网络环境'
        ];
      } else if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
        errorAnalysis.type = 'timeout';
        errorAnalysis.suggestions = [
          '网络超时，检查网络稳定性',
          '尝试增加超时时间',
          '检查服务器负载'
        ];
      } else if (error.message.includes('certificate') || error.message.includes('SSL')) {
        errorAnalysis.type = 'ssl';
        errorAnalysis.suggestions = [
          'SSL 证书问题',
          '检查系统时间是否正确',
          '更新 Node.js 版本'
        ];
      }
    }
    
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : String(error),
      errorAnalysis,
      message: '测试过程中发生错误',
      envCheck: {
        hasApiKey: !!process.env.ANTHROPIC_API_KEY,
        nodeEnv: process.env.NODE_ENV,
        platform: process.platform,
        nodeVersion: process.version
      }
    }, { status: 500 });
  }
}

/**
 * POST 方法：自定义消息测试
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message = '测试消息' } = body;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'API Key not configured'
      }, { status: 503 });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 200,
        messages: [
          {
            role: 'user',
            content: message
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({
        success: false,
        error: 'API request failed',
        status: response.status,
        details: errorText
      }, { status: response.status });
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      message: 'Claude API 响应成功',
      request: { message },
      response: {
        content: data.content?.[0]?.text || 'No response',
        model: data.model,
        usage: data.usage
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Request failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
