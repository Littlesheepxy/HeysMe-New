/**
 * 测试新的基于 Vercel AI SDK 的增量编辑功能
 */

import { NextRequest, NextResponse } from 'next/server';
import { CodingAgent } from '@/lib/agents/coding';
import { SessionData } from '@/lib/types/session';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 [测试路由] 开始测试 Vercel AI 增量编辑功能');

    const { userInput, sessionData } = await request.json();

    if (!userInput) {
      return NextResponse.json({ 
        error: '缺少 userInput 参数' 
      }, { status: 400 });
    }

    // 创建测试会话数据
    const testSessionData: SessionData = sessionData || {
      id: `test-incremental-${Date.now()}`,
      status: 'active' as const,
      userIntent: {
        type: 'formal_resume' as const,
        urgency: 'exploring' as const,
        target_audience: 'internal_review' as const,
        primary_goal: '测试增量编辑'
      },
      personalization: {
        identity: {
          profession: 'developer' as const,
          experience_level: 'mid' as const
        },
        preferences: {
          style: 'modern' as const,
          tone: 'professional' as const,
          detail_level: 'detailed' as const
        },
        context: {}
      },
      collectedData: {
        personal: {},
        professional: { skills: [] },
        experience: [],
        education: [],
        projects: [],
        achievements: [],
        certifications: []
      },
      conversationHistory: [],
      agentFlow: [],
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        lastActive: new Date(),
        version: '1.0.0',
        progress: {
          currentStage: 'code_generation',
          completedStages: ['welcome', 'info_collection'],
          totalStages: 4,
          percentage: 75
        },
        metrics: {
          totalTime: 0,
          userInteractions: 0,
          agentTransitions: 0,
          errorsEncountered: 0
        },
        settings: {
          autoSave: true,
          reminderEnabled: false,
          privacyLevel: 'private' as const
        },
        // 🔧 添加一些测试项目文件
        projectFiles: [
          {
            filename: 'src/components/Button.tsx',
            content: 'export default function Button() { return <button>Click me</button>; }',
            language: 'typescript',
            type: 'component',
            description: '按钮组件'
          },
          {
            filename: 'src/pages/index.tsx',
            content: 'export default function Home() { return <div>Hello World</div>; }',
            language: 'typescript',
            type: 'page',
            description: '首页'
          }
        ]
      }
    };

    console.log(`📊 [测试] 模拟项目包含 ${(testSessionData.metadata as any).projectFiles.length} 个文件`);

    // 创建 CodingAgent 实例
    const codingAgent = new CodingAgent();

    // 准备增量模式的输入
    const incrementalInput = {
      user_input: userInput,
      mode: 'incremental'
    };

    console.log('🚀 [测试] 开始调用增量编辑功能...');

    // 收集所有响应
    const responses = [];
    let finalResponse = null;

    for await (const response of codingAgent.process(incrementalInput, testSessionData)) {
      responses.push(response);
      console.log(`📤 [测试响应] ${response.system_state?.intent}, done: ${response.system_state?.done}`);
      
      if (response.system_state?.done) {
        finalResponse = response;
        break;
      }
    }

    console.log(`✅ [测试完成] 总计收到 ${responses.length} 个响应`);

    return NextResponse.json({
      success: true,
      message: '增量编辑测试完成',
      data: {
        totalResponses: responses.length,
        finalResponse,
        allResponses: responses,
        testSessionId: testSessionData.id,
        projectFiles: (testSessionData.metadata as any).projectFiles
      }
    });

  } catch (error) {
    console.error('❌ [测试失败]:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: '🧪 Vercel AI 增量编辑测试路由',
    usage: 'POST 请求，包含 { userInput: string, sessionData?: SessionData }',
    example: {
      userInput: '请在 Button 组件中添加一个 onClick 处理函数',
      description: '这将测试基于 Vercel AI SDK 的增量编辑功能'
    }
  });
}
