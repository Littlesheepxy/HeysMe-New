import { NextRequest, NextResponse } from 'next/server';
import { InfoCollectionAgentV3 } from '@/lib/agents/v2/info-collection-agent-v3';

export async function POST(req: NextRequest) {
  try {
    const { message, sessionId, context, round } = await req.json();
    
    if (!message) {
      return NextResponse.json({ 
        success: false, 
        error: 'Message is required' 
      }, { status: 400 });
    }

    console.log(`🚀 [优化版测试] 开始处理: ${message.substring(0, 100)}...`);
    console.log(`📊 [优化版测试] 轮次: ${round}, 会话: ${sessionId}`);

    const agent = new InfoCollectionAgentV3();
    const sessionData = {
      id: sessionId || `optimized-session-${Date.now()}`,
      userId: 'test-user',
      createdAt: new Date(),
      lastActivity: new Date()
    };

    const responses: any[] = [];
    
    // 收集所有响应
    for await (const response of agent.processRequest(message, sessionData, { 
      ...context, 
      round: round || 1 
    })) {
      responses.push(response);
    }

    const finalResponse = responses[responses.length - 1];
    
    // 添加调试信息
    const debugInfo = {
      total_responses: responses.length,
      processing_stages: responses.map(r => r.system_state?.current_stage),
      tool_storage_keys: Object.keys((agent as any).toolResultStorage || {}),
      collected_data_keys: Object.keys((agent as any).collectedData || {}),
    };

    console.log(`✅ [优化版测试] 完成处理，响应数: ${responses.length}`);
    console.log(`🔧 [优化版测试] 工具存储: ${debugInfo.tool_storage_keys.join(', ')}`);

    return NextResponse.json({
      success: true,
      response: finalResponse,
      debug: debugInfo,
      all_responses: responses
    });

  } catch (error: any) {
    console.error('❌ [优化版测试] 处理失败:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || '处理请求时发生错误',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
