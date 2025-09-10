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
      console.log(`✅ [GitHub工具] 分析完成，用户: ${result.login}`);
      return result;
    } catch (error) {
      console.error(`❌ [GitHub工具] 分析失败:`, error);
      throw error;
    }
  }
});

// 网页抓取工具定义
const webScrapeTool = tool({
  description: 'Intelligent web content scraping and analysis tool for extracting structured information from web pages.',
  inputSchema: z.object({
    url: z.string().describe('Complete URL of the webpage to scrape and analyze, must include http:// or https:// protocol'),
    target_sections: z.array(z.enum(['all', 'about', 'projects', 'experience', 'skills', 'contact'])).optional().default(['all']).describe('Content sections to focus on extracting')
  }),
  execute: async ({ url, target_sections = ['all'] }) => {
    try {
      console.log(`🔧 [网页工具] 开始抓取: ${url}`);
      // 这里可以集成现有的 webService
      return { url, message: '网页抓取功能开发中', target_sections };
    } catch (error) {
      console.error(`❌ [网页工具] 抓取失败:`, error);
      throw error;
    }
  }
});

export async function POST(req: NextRequest) {
  try {
    const { message, conversation = [] } = await req.json();

    console.log(`📨 [Vercel AI Tools] 收到消息: ${message}`);

    // 构建对话历史
    const messages = [
      {
        role: 'system' as const,
        content: `你是一个专业的信息收集助手。当用户提供链接或需要分析某些资源时，你会自动调用相应的工具来获取详细信息。

特别注意：
- 当用户提供 GitHub 链接或用户名时，使用 analyze_github 工具
- 当用户提供其他网页链接时，使用 scrape_webpage 工具
- 分析完成后，用中文总结关键信息
- 保持友好和专业的语调`
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

    // 使用 Vercel AI SDK 调用 Claude
    const result = await generateText({
      model: anthropic('claude-sonnet-4-20250514'),
      messages,
      tools: {
        analyze_github: githubAnalyzeTool,
        scrape_webpage: webScrapeTool
      },
      temperature: 0.7,
      toolChoice: 'auto' // 让 AI 自动决定是否使用工具
    });

    console.log(`✅ [Vercel AI Tools] 生成完成`);
    console.log(`🔧 [工具调用] 调用了 ${result.toolCalls.length} 个工具`);
    console.log(`📊 [工具结果] 获得了 ${result.toolResults.length} 个结果`);
    
    // 详细日志工具调用和结果
    result.toolCalls.forEach((call, index) => {
      console.log(`🔧 [工具调用 ${index}] 名称: ${call.toolName}, 参数:`, call.input);
    });
    
    result.toolResults.forEach((toolResult, index) => {
      console.log(`📊 [工具结果 ${index}] 结果:`, toolResult.output);
    });

    // 格式化工具调用结果
    const toolResults = result.toolResults.map((toolResult, index) => {
      const toolCall = result.toolCalls[index];
      return {
        tool_name: toolCall.toolName,
        success: true,
        data: toolResult.output, // 使用 output 而不是 result
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
      response: result.text,
      toolCalls: result.toolCalls,
      toolResults,
      usage: result.usage,
      finishReason: result.finishReason
    });

  } catch (error) {
    console.error('❌ [Vercel AI Tools] 处理失败:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      response: '抱歉，处理您的请求时出现了错误。请稍后重试。'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Vercel AI Tools API 运行正常',
    tools: ['analyze_github', 'scrape_webpage'],
    timestamp: new Date().toISOString()
  });
}
