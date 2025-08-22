import { NextRequest, NextResponse } from 'next/server';
import { VercelAIInfoCollectionAgent } from '@/lib/agents/info-collection/vercel-ai-agent';
import { SessionData } from '@/lib/types/session';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 [API测试] 开始测试 Vercel AI Agent');
    
    const body = await request.json();
    const { input, sessionData } = body;

    if (!input || !sessionData) {
      return NextResponse.json(
        { error: '缺少必要参数: input 或 sessionData' },
        { status: 400 }
      );
    }

    // 创建 Agent 实例
    const agent = new VercelAIInfoCollectionAgent();
    
    // 收集所有响应
    const responses: any[] = [];
    const toolsUsed: string[] = [];
    let finalResponse: any = null;
    let supabaseData: any = null;

    console.log('📝 [API测试] 开始处理输入:', input.user_input?.substring(0, 100));

    // 处理 Agent 响应流
    for await (const response of agent.process(input, sessionData as SessionData)) {
      responses.push(response);
      
      // 记录使用的工具
      if (response.system_state?.metadata?.tools_used) {
        toolsUsed.push(...response.system_state.metadata.tools_used);
      }
      
      // 保存最终响应
      if (response.system_state?.done) {
        finalResponse = response;
      }
      
      // 提取可能的 Supabase 数据
      if (response.system_state?.metadata?.collection_summary) {
        supabaseData = response.system_state.metadata.collection_summary;
      }
    }

    console.log('✅ [API测试] 处理完成，响应数量:', responses.length);
    console.log('🔧 [API测试] 使用的工具:', Array.from(new Set(toolsUsed)));

    // 构建测试结果
    const testResult = {
      success: true,
      timestamp: new Date().toISOString(),
      input: input.user_input,
      responses,
      finalResponse,
      toolsUsed: Array.from(new Set(toolsUsed)),
      responseCount: responses.length,
      supabaseData,
      sessionId: sessionData.id,
      metadata: {
        agentName: agent.name,
        capabilities: agent.capabilities,
        testMode: true
      }
    };

    return NextResponse.json(testResult);

  } catch (error) {
    console.error('❌ [API测试] 测试失败:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
        timestamp: new Date().toISOString(),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Vercel AI Agent 测试 API',
    usage: 'POST /api/test/vercel-ai-agent',
    parameters: {
      input: { user_input: 'string' },
      sessionData: { id: 'string', userId: 'string', metadata: 'object' }
    }
  });
}
