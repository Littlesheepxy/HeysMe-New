/**
 * 信息收集 Agent 对比测试 API
 * 同时测试 OptimizedInfoCollectionAgent 和 VercelAIInfoCollectionAgent
 */

import { NextRequest, NextResponse } from 'next/server';
import { OptimizedInfoCollectionAgent } from '@/lib/agents/info-collection/optimized-agent';
import { VercelAIInfoCollectionAgent } from '@/lib/agents/info-collection/vercel-ai-agent';
import { SessionData } from '@/lib/types/session';

export async function POST(request: NextRequest) {
  try {
    const { userInput, testMode = 'comparison', welcomeData } = await request.json();
    
    console.log(`🧪 [Agent对比测试] 开始测试，模式: ${testMode}`);
    console.log(`📝 [用户输入] ${userInput}`);

    // 创建测试会话数据
    const createTestSession = (agentType: string): SessionData => ({
      id: `test-${agentType}-${Date.now()}`,
      userId: 'test-user',
      metadata: {
        testMode: true,
        welcomeData: welcomeData || {
          user_role: '软件工程师',
          use_case: '个人展示',
          commitment_level: '认真制作'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        version: '1.0.0',
        agentHistory: [],
        currentAgent: agentType,
        progress: {
          currentStage: 'info_collection',
          completedStages: ['welcome']
        }
      }
    });

    const results: any = {
      timestamp: new Date().toISOString(),
      testMode,
      userInput,
      agents: {}
    };

    if (testMode === 'comparison' || testMode === 'optimized') {
      console.log(`🔧 [测试OptimizedAgent] 开始...`);
      const optimizedAgent = new OptimizedInfoCollectionAgent();
      const optimizedSession = createTestSession('optimized');
      
      const optimizedResults: any[] = [];
      const startTime = Date.now();
      
      try {
        for await (const response of optimizedAgent.process(
          { user_input: userInput },
          optimizedSession
        )) {
          optimizedResults.push({
            type: 'response',
            timestamp: new Date().toISOString(),
            data: response
          });
        }
        
        results.agents.optimized = {
          status: 'success',
          duration: Date.now() - startTime,
          responseCount: optimizedResults.length,
          responses: optimizedResults,
          sessionData: optimizedSession
        };
        
        console.log(`✅ [OptimizedAgent完成] 耗时: ${results.agents.optimized.duration}ms`);
      } catch (error) {
        results.agents.optimized = {
          status: 'error',
          duration: Date.now() - startTime,
          error: error instanceof Error ? error.message : String(error),
          sessionData: optimizedSession
        };
        console.error(`❌ [OptimizedAgent失败]`, error);
      }
    }

    if (testMode === 'comparison' || testMode === 'vercel') {
      console.log(`🔧 [测试VercelAIAgent] 开始...`);
      const vercelAgent = new VercelAIInfoCollectionAgent();
      const vercelSession = createTestSession('vercel-ai');
      
      const vercelResults: any[] = [];
      const startTime = Date.now();
      
      try {
        for await (const response of vercelAgent.process(
          { user_input: userInput },
          vercelSession
        )) {
          vercelResults.push({
            type: 'response',
            timestamp: new Date().toISOString(),
            data: response
          });
        }
        
        results.agents.vercelAI = {
          status: 'success',
          duration: Date.now() - startTime,
          responseCount: vercelResults.length,
          responses: vercelResults,
          sessionData: vercelSession
        };
        
        console.log(`✅ [VercelAIAgent完成] 耗时: ${results.agents.vercelAI.duration}ms`);
      } catch (error) {
        results.agents.vercelAI = {
          status: 'error',
          duration: Date.now() - startTime,
          error: error instanceof Error ? error.message : String(error),
          sessionData: vercelSession
        };
        console.error(`❌ [VercelAIAgent失败]`, error);
      }
    }

    // 生成对比分析
    if (testMode === 'comparison' && results.agents.optimized && results.agents.vercelAI) {
      results.comparison = {
        performance: {
          optimized_duration: results.agents.optimized.duration,
          vercelAI_duration: results.agents.vercelAI.duration,
          speed_difference: results.agents.vercelAI.duration - results.agents.optimized.duration
        },
        responses: {
          optimized_count: results.agents.optimized.responseCount,
          vercelAI_count: results.agents.vercelAI.responseCount,
          count_difference: results.agents.vercelAI.responseCount - results.agents.optimized.responseCount
        },
        success: {
          optimized_success: results.agents.optimized.status === 'success',
          vercelAI_success: results.agents.vercelAI.status === 'success',
          both_successful: results.agents.optimized.status === 'success' && results.agents.vercelAI.status === 'success'
        }
      };
      
      console.log(`📊 [对比结果] OptimizedAgent: ${results.agents.optimized.duration}ms, VercelAIAgent: ${results.agents.vercelAI.duration}ms`);
    }

    return NextResponse.json({
      success: true,
      data: results
    });

  } catch (error) {
    console.error('❌ [Agent对比测试失败]:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Info Collection Agent 对比测试 API',
    usage: {
      endpoint: 'POST /api/test/info-collection-comparison',
      parameters: {
        userInput: 'string - 用户输入文本',
        testMode: 'string - comparison|optimized|vercel (默认: comparison)',
        welcomeData: 'object - 可选的欢迎数据'
      }
    },
    examples: [
      {
        description: '对比测试两个Agent',
        payload: {
          userInput: 'https://github.com/username 这是我的GitHub',
          testMode: 'comparison'
        }
      },
      {
        description: '只测试OptimizedAgent',
        payload: {
          userInput: '我是一名前端开发工程师，有3年经验',
          testMode: 'optimized'
        }
      },
      {
        description: '只测试VercelAIAgent',
        payload: {
          userInput: 'https://linkedin.com/in/username',
          testMode: 'vercel'
        }
      }
    ]
  });
}
