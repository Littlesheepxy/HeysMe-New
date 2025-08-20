/**
 * 测试信息收集 Agent V3
 * 两轮对话收集，智能工具调用，结构化输出
 */

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

    console.log(`🚀 [测试] 处理信息收集请求: ${message.substring(0, 100)}...`);
    console.log(`📋 [测试] 会话ID: ${sessionId}`);
    console.log(`🎯 [测试] 轮次: ${round || 1}`);

    // 创建 Agent 实例
    const agent = new InfoCollectionAgentV3();

    // 模拟会话数据
    const sessionData = {
      id: sessionId || `test-session-${Date.now()}`,
      userId: 'test-user',
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {}
    };

    // 收集所有响应
    const responses: any[] = [];
    let finalResponse = null;

    // 处理用户输入
    for await (const response of agent.processRequest(message, sessionData, context)) {
      responses.push(response);
      console.log(`📨 [响应 ${responses.length}] ${response.system_state.current_stage}: ${response.immediate_display.reply.substring(0, 100)}...`);
      
      if (response.system_state.done) {
        finalResponse = response;
      }
    }

    console.log(`✅ [测试] 完成，共 ${responses.length} 个响应`);

    return NextResponse.json({
      success: true,
      sessionId: sessionData.id,
      currentRound: round || 1,
      maxRounds: 2,
      totalResponses: responses.length,
      responses,
      finalResponse,
      isComplete: !!finalResponse,
      metadata: {
        agent_name: agent.getInfo().name,
        agent_id: agent.getInfo().id,
        capabilities: agent.getInfo().capabilities,
        processing_time: new Date().toISOString(),
        collected_info: finalResponse?.system_state?.metadata?.collected_user_info,
        tools_used: finalResponse?.system_state?.metadata?.tools_used || [],
        links_processed: finalResponse?.system_state?.metadata?.links_processed || []
      }
    });

  } catch (error: any) {
    console.error('❌ [测试] 处理失败:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || '处理请求时发生错误',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
