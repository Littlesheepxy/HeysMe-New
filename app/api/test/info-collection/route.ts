import { NextRequest, NextResponse } from 'next/server'
import { OptimizedInfoCollectionAgent } from '@/lib/agents/info-collection/optimized-agent'

export async function POST(request: NextRequest) {
  try {
    const { user_input, session_data, welcome_data } = await request.json()

    console.log('🧪 [测试API] 开始测试信息收集 Agent')
    console.log('📝 [用户输入]:', user_input)
    console.log('📊 [会话数据]:', session_data)
    console.log('🎯 [Welcome数据]:', welcome_data)

    // 创建 agent 实例
    const agent = new OptimizedInfoCollectionAgent()

    // 准备会话数据
    const sessionData = {
      id: session_data.id,
      user_id: 'test-user',
      metadata: {
        ...session_data.metadata,
        welcomeData: welcome_data,
        testMode: true
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // 创建流式响应
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 调用 agent 处理
          const generator = agent.process(
            { user_input },
            sessionData
          )

          for await (const response of generator) {
            const chunk = `data: ${JSON.stringify(response)}\n\n`
            controller.enqueue(encoder.encode(chunk))
          }

          // 发送结束信号
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()

        } catch (error) {
          console.error('❌ [测试API] Agent处理失败:', error)
          
          const errorResponse = {
            immediate_display: {
              reply: `❌ Agent 处理失败: ${error instanceof Error ? error.message : String(error)}`,
              agent_name: 'TestAgent',
              timestamp: new Date().toISOString()
            },
            system_state: {
              intent: 'error',
              done: true,
              progress: 0,
              current_stage: '错误',
              metadata: {
                error: true,
                error_message: error instanceof Error ? error.message : String(error)
              }
            }
          }
          
          const chunk = `data: ${JSON.stringify(errorResponse)}\n\n`
          controller.enqueue(encoder.encode(chunk))
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error) {
    console.error('❌ [测试API] 请求处理失败:', error)
    return NextResponse.json({
      error: '测试API处理失败',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
