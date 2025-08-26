/**
 * 完整的信息收集流程测试
 * 模拟完整的两轮对话流程
 */

import { NextRequest, NextResponse } from 'next/server';
import { VercelAIInfoCollectionAgent } from '@/lib/agents/info-collection/vercel-ai-agent';

// 全局存储 Agent 实例（仅用于测试）
const agentInstances = new Map<string, VercelAIInfoCollectionAgent>();

export async function POST(req: NextRequest) {
  try {
    const { message, sessionId, context, reset } = await req.json();

    const sessionKey = sessionId || 'default-session';

    // 重置或创建新的 Agent 实例
    if (reset || !agentInstances.has(sessionKey)) {
      agentInstances.set(sessionKey, new VercelAIInfoCollectionAgent());
      console.log(`🔄 [测试] 创建新的 Agent 实例: ${sessionKey}`);
    }

    const agent = agentInstances.get(sessionKey)!;

    // 模拟会话数据
    const sessionData = {
      id: sessionKey,
      userId: 'test-user',
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {}
    };

    // 模拟上下文数据
    const testContext = {
      welcomeData: {
        user_role: context?.user_role || '前端开发工程师',
        use_case: context?.use_case || '个人作品集',
        commitment_level: context?.commitment_level || '认真制作'
      },
      parsedDocuments: context?.parsedDocuments || [],
      ...context
    };

    console.log(`🚀 [测试] 处理消息: ${message || '(初始化)'}`);
    console.log(`📋 [测试] 会话ID: ${sessionKey}`);

    // 收集所有响应
    const responses: any[] = [];
    let finalResponse = null;
    let isComplete = false;

    // 处理流式响应
    for await (const response of agent.processRequest(message || '', sessionData, testContext)) {
      responses.push(response);
      
      console.log(`📨 [响应 ${responses.length}] ${response.system_state.current_stage}: ${response.immediate_display.reply.substring(0, 100)}...`);
      
      if (response.system_state.done) {
        finalResponse = response;
        isComplete = true;
      }
    }

    console.log(`✅ [测试] 完成，共 ${responses.length} 个响应，完成状态: ${isComplete}`);

    return NextResponse.json({
      success: true,
      sessionId: sessionKey,
      totalResponses: responses.length,
      responses,
      finalResponse,
      isComplete,
      collectedInfo: finalResponse?.system_state?.metadata?.collected_user_info,
      metadata: {
        agent_state: 'preserved',
        processing_time: new Date().toISOString()
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
