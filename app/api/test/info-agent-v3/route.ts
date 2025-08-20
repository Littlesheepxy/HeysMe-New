/**
 * 测试信息收集 Agent V3
 * 两轮对话收集，智能工具调用，结构化输出
 */

import { NextRequest, NextResponse } from 'next/server';
import { InfoCollectionAgentV3 } from '@/lib/agents/v2/info-collection-agent-v3';

export async function POST(req: NextRequest) {
  try {
    const { message, sessionId, context, action } = await req.json();

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

    if (action === 'initiate') {
      // 启动收集流程
      console.log(`🚀 [测试] 启动信息收集流程`);
      
      const responses: any[] = [];
      
      // 处理初始化（系统引导）
      for await (const response of agent.processRequest('', sessionData, context)) {
        responses.push(response);
        console.log(`📨 [引导响应] ${response.system_state.current_stage}: ${response.immediate_display.reply.substring(0, 100)}...`);
      }

      return NextResponse.json({
        success: true,
        action: 'initiate',
        sessionId: sessionData.id,
        responses,
        nextStep: 'user_input'
      });
    }

    if (action === 'user_input') {
      // 处理用户输入
      if (!message) {
        return NextResponse.json({
          success: false,
          error: 'Message is required for user_input action'
        }, { status: 400 });
      }

      console.log(`🚀 [测试] 处理用户输入: ${message.substring(0, 100)}...`);
      
      const responses: any[] = [];
      let finalResponse = null;

      // 处理用户输入
      for await (const response of agent.processRequest(message, sessionData, context)) {
        responses.push(response);
        console.log(`📨 [用户输入响应] ${response.system_state.current_stage}: ${response.immediate_display.reply.substring(0, 100)}...`);
        
        if (response.system_state.done) {
          finalResponse = response;
        }
      }

      return NextResponse.json({
        success: true,
        action: 'user_input',
        sessionId: sessionData.id,
        totalResponses: responses.length,
        responses,
        finalResponse,
        isComplete: !!finalResponse,
        collectedInfo: finalResponse?.system_state?.metadata?.collected_user_info
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action. Use "initiate" or "user_input"'
    }, { status: 400 });

  } catch (error: any) {
    console.error('❌ [测试] 处理失败:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || '处理请求时发生错误',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
