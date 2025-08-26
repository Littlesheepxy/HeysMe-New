import { NextRequest, NextResponse } from 'next/server';
import { anthropic } from '@ai-sdk/anthropic';
import { generateText, tool } from 'ai';
import { z } from 'zod';
import { githubService } from '@/lib/services';

// GitHub 分析工具定义
const githubAnalyzeTool = tool({
  description: 'Analyze GitHub user profile and repository information to extract technical skills, project experience, and open source contributions.',
  inputSchema: z.object({
    username_or_url: z.string().describe('GitHub username or full GitHub user page URL, e.g.: octocat or https://github.com/octocat'),
    include_repos: z.boolean().optional().default(true).describe('Whether to include detailed repository information. Default is true')
  }),
  execute: async ({ username_or_url, include_repos = true }) => {
    try {
      console.log(`🔧 [GitHub工具] 开始分析用户: ${username_or_url}`);
      const result = await githubService.analyzeUser(username_or_url, include_repos);
      console.log(`✅ [GitHub工具] 分析完成，用户: ${result.username}`);
      return result;
    } catch (error) {
      console.error(`❌ [GitHub工具] 分析失败:`, error);
      throw error;
    }
  }
});

export async function POST(req: NextRequest) {
  try {
    const { message, conversation = [] } = await req.json();

    console.log(`📨 [Vercel AI Tools V2] 收到消息: ${message}`);

    // 构建对话历史
    const messages = [
      {
        role: 'system' as const,
        content: `你是一个专业的技术分析师。当用户提供 GitHub 链接或用户名时，你会：

1. 首先调用 analyze_github 工具获取详细数据
2. 然后基于获取的数据进行深入的技术分析
3. 提供专业的见解和建议

分析时请关注：
- 技术栈和编程语言偏好
- 项目质量和影响力
- 开源贡献活跃度
- 技术成长轨迹
- 协作能力和社区参与度

用中文回复，保持专业和友好的语调。`
      },
      ...conversation.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: 'user' as const,
        content: message
      }
    ];

    // 第一步：调用工具
    console.log(`🔧 [第一步] 调用工具获取数据`);
    const toolResult = await generateText({
      model: anthropic('claude-3-5-sonnet-20241022'),
      messages,
      tools: {
        analyze_github: githubAnalyzeTool
      },
      maxTokens: 2000,
      temperature: 0.3
    });

    console.log(`📊 [工具调用结果] 调用了 ${toolResult.toolCalls.length} 个工具`);

    // 如果有工具调用，进行第二步分析
    if (toolResult.toolCalls.length > 0 && toolResult.toolResults.length > 0) {
      console.log(`🔧 [第二步] 基于工具结果进行分析`);
      
      // 获取工具结果数据
      const githubData = toolResult.toolResults[0]?.output;
      
      // 构建分析提示
      const analysisPrompt = `基于以下 GitHub 数据，请进行详细的技术分析：

用户信息：
- 用户名：${githubData?.username}
- 姓名：${githubData?.profile?.name}
- 简介：${githubData?.profile?.bio || '无'}
- 位置：${githubData?.profile?.location || '未知'}
- 关注者：${githubData?.profile?.followers}
- 公开仓库：${githubData?.profile?.public_repos}

主要编程语言：
${githubData?.languages?.summary?.map((lang: any) => `- ${lang[0]}: ${lang[1].percentage.toFixed(1)}%`).join('\n') || '无数据'}

热门仓库：
${githubData?.repositories?.slice(0, 5).map((repo: any) => `- ${repo.name}: ${repo.stars} stars, ${repo.language || 'Unknown'}`).join('\n') || '无数据'}

活跃度指标：
- 总星数：${githubData?.activity_metrics?.total_stars}
- 总分叉数：${githubData?.activity_metrics?.total_forks}
- 活跃度评分：${githubData?.activity_metrics?.activity_score}

请从以下角度进行专业分析：
1. 技术栈和编程语言偏好
2. 项目质量和影响力评估
3. 开源贡献活跃度
4. 技术成长轨迹分析
5. 协作能力和社区参与度

用中文回复，提供具体的数据支撑和专业见解。`;

      // 第二步：基于工具结果进行分析
      const analysisResult = await generateText({
        model: anthropic('claude-3-5-sonnet-20241022'),
        messages: [
          {
            role: 'system',
            content: '你是一个专业的技术分析师，擅长分析开发者的技术背景和项目经验。'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        maxTokens: 3000,
        temperature: 0.7
      });

      console.log(`✅ [分析完成] 生成了详细分析`);

      // 格式化工具调用结果
      const toolResults = toolResult.toolResults.map((tr, index) => {
        const toolCall = toolResult.toolCalls[index];
        return {
          tool_name: toolCall.toolName,
          success: true,
          data: tr.output,
          confidence: 0.9,
          timestamp: new Date().toISOString(),
          metadata: {
            args: toolCall.input,
            execution_time: 'unknown'
          }
        };
      });

      return NextResponse.json({
        success: true,
        response: analysisResult.text,
        toolCalls: toolResult.toolCalls,
        toolResults,
        usage: {
          step1: toolResult.usage,
          step2: analysisResult.usage,
          total: {
            inputTokens: (toolResult.usage?.inputTokens || 0) + (analysisResult.usage?.inputTokens || 0),
            outputTokens: (toolResult.usage?.outputTokens || 0) + (analysisResult.usage?.outputTokens || 0),
            totalTokens: (toolResult.usage?.totalTokens || 0) + (analysisResult.usage?.totalTokens || 0)
          }
        }
      });
    } else {
      // 没有工具调用，直接返回结果
      return NextResponse.json({
        success: true,
        response: toolResult.text,
        toolCalls: [],
        toolResults: [],
        usage: toolResult.usage
      });
    }

  } catch (error) {
    console.error('❌ [Vercel AI Tools V2] 处理失败:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      response: '抱歉，处理您的请求时出现了错误。请稍后重试。'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Vercel AI Tools V2 API 运行正常',
    tools: ['analyze_github'],
    features: ['multi-step analysis', 'tool-based insights'],
    timestamp: new Date().toISOString()
  });
}
