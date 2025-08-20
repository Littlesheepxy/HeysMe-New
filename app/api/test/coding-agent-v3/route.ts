/**
 * 测试编程 Agent V3
 * 智能代码生成和文件操作
 */

import { NextRequest, NextResponse } from 'next/server';
import { CodingAgentV3 } from '@/lib/agents/v2/coding-agent-v3';

export async function POST(req: NextRequest) {
  try {
    const { message, sessionId, context, mode } = await req.json();

    if (!message) {
      return NextResponse.json({
        success: false,
        error: 'Message is required'
      }, { status: 400 });
    }

    // 创建 Agent 实例
    const agent = new CodingAgentV3();

    // 设置工作目录（测试环境）
    const testWorkingDir = '/tmp/coding-test';
    agent.setWorkingDirectory(testWorkingDir);

    // 模拟会话数据
    const sessionData = {
      id: sessionId || `coding-session-${Date.now()}`,
      userId: 'test-user',
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {}
    };

    // 模拟上下文数据
    const testContext = {
      mode: mode || 'incremental', // initial, incremental, analysis
      framework: context?.framework || 'Next.js',
      tech_stack: context?.tech_stack || 'React + TypeScript',
      project_type: context?.project_type || 'Web应用',
      target_files: context?.target_files || '',
      ...context
    };

    console.log(`🚀 [测试] 开始处理编程请求: ${message.substring(0, 100)}...`);
    console.log(`📋 [测试] 会话ID: ${sessionData.id}`);
    console.log(`🎯 [测试] 处理模式: ${testContext.mode}`);

    // 收集所有响应
    const responses: any[] = [];
    let finalResponse = null;

    // 处理流式响应
    for await (const response of agent.processRequest(message, sessionData, testContext)) {
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
      mode: testContext.mode,
      totalResponses: responses.length,
      responses,
      finalResponse,
      isComplete: !!finalResponse,
      metadata: {
        agent_name: agent.getInfo().name,
        agent_id: agent.getInfo().id,
        capabilities: agent.getInfo().capabilities,
        working_directory: testWorkingDir,
        processing_time: new Date().toISOString(),
        files_created: finalResponse?.system_state?.metadata?.files_created || [],
        files_modified: finalResponse?.system_state?.metadata?.files_modified || [],
        commands_executed: finalResponse?.system_state?.metadata?.commands_executed || [],
        tools_used: finalResponse?.system_state?.metadata?.tools_used || []
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
