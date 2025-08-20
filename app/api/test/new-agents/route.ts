import { NextRequest, NextResponse } from 'next/server';
import { VercelAIInfoCollectionAgent } from '@/lib/agents/info-collection/vercel-ai-agent';
import { VercelAICodingAgent } from '@/lib/agents/coding/vercel-ai-coding-agent';
import { SessionData } from '@/types/chat';

// 创建 agent 实例
const infoAgent = new VercelAIInfoCollectionAgent();
const codingAgent = new VercelAICodingAgent();

export async function POST(req: NextRequest) {
  try {
    const { message, agent_type = 'info', session_id } = await req.json();
    
    console.log(`📨 [新Agent测试] 类型: ${agent_type}, 消息: ${message.substring(0, 100)}...`);

    // 创建模拟会话数据
    const sessionData: SessionData = {
      id: session_id || `test-session-${Date.now()}`,
      userId: 'test-user',
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {}
    };

    // 选择对应的 agent
    const agent = agent_type === 'coding' ? codingAgent : infoAgent;
    
    // 收集所有响应
    const responses: any[] = [];
    
    try {
      for await (const response of agent.processRequest(message, sessionData)) {
        responses.push(response);
        console.log(`📊 [Agent响应] ${response.system_state?.current_stage}: ${response.immediate_display?.reply?.substring(0, 100)}...`);
      }
    } catch (error) {
      console.error(`❌ [Agent处理失败]:`, error);
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
        agent_type,
        responses
      }, { status: 500 });
    }

    // 提取最终响应
    const finalResponse = responses[responses.length - 1];
    const progressResponses = responses.slice(0, -1);

    return NextResponse.json({
      success: true,
      agent_type,
      agent_name: agent.name,
      final_response: finalResponse?.immediate_display?.reply || '处理完成',
      progress_steps: progressResponses.map(r => ({
        stage: r.system_state?.current_stage,
        progress: r.system_state?.progress,
        message: r.immediate_display?.reply
      })),
      metadata: {
        total_steps: responses.length,
        final_stage: finalResponse?.system_state?.current_stage,
        session_id: sessionData.id,
        tools_used: finalResponse?.system_state?.metadata?.tools_used || [],
        execution_time: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ [新Agent测试] 错误:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: '新Agent测试API',
    available_agents: [
      {
        type: 'info',
        name: 'VercelAI信息收集专家',
        description: '使用多步骤工具调用收集和分析信息',
        capabilities: ['GitHub分析', '网页抓取', 'LinkedIn提取', '文档解析', '综合分析']
      },
      {
        type: 'coding',
        name: 'VercelAI编程专家', 
        description: '使用多步骤工具调用进行智能编程',
        capabilities: ['项目分析', '文件操作', '代码生成', '命令执行', '结构优化']
      }
    ],
    usage: {
      endpoint: 'POST /api/test/new-agents',
      parameters: {
        message: 'string (required) - 用户输入消息',
        agent_type: 'string (optional) - "info" 或 "coding"，默认 "info"',
        session_id: 'string (optional) - 会话ID，用于上下文管理'
      }
    },
    examples: [
      {
        agent_type: 'info',
        message: '分析这个开发者：https://github.com/octocat'
      },
      {
        agent_type: 'coding',
        message: '创建一个React组件，包含按钮和输入框'
      }
    ]
  });
}
