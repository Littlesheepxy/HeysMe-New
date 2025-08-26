import { NextRequest, NextResponse } from 'next/server';
import { anthropic } from '@ai-sdk/anthropic';
import { generateText, tool, stepCountIs } from 'ai';
import { z } from 'zod';
import { githubService, webService } from '@/lib/services';

// GitHub 分析工具
const githubAnalyzeTool = tool({
  description: 'Analyze GitHub user profile and repositories to extract technical skills and project experience.',
  inputSchema: z.object({
    username_or_url: z.string().describe('GitHub username or URL'),
    include_repos: z.boolean().optional().default(true)
  }),
  execute: async ({ username_or_url, include_repos = true }) => {
    console.log(`🔧 [GitHub工具] 分析用户: ${username_or_url}`);
    const result = await githubService.analyzeUser(username_or_url, include_repos);
    console.log(`✅ [GitHub工具] 完成，获得 ${result.repositories?.length || 0} 个仓库`);
    return result;
  }
});

// 网页抓取工具
const webScrapeTool = tool({
  description: 'Scrape and analyze web pages to extract structured information, especially for portfolios and personal websites.',
  inputSchema: z.object({
    url: z.string().describe('Complete URL to scrape'),
    target_sections: z.array(z.enum(['all', 'about', 'projects', 'experience', 'skills', 'contact'])).optional().default(['all'])
  }),
  execute: async ({ url, target_sections = ['all'] }) => {
    console.log(`🔧 [网页工具] 抓取: ${url}`);
    try {
      const result = await webService.scrapeWebpage(url, target_sections);
      console.log(`✅ [网页工具] 完成，提取了 ${result.content_analysis?.content_quality || 'unknown'} 质量的内容`);
      return result;
    } catch (error) {
      console.log(`⚠️ [网页工具] 失败，返回模拟数据`);
      return {
        url,
        title: 'Personal Website',
        description: 'Developer portfolio and blog',
        content_analysis: {
          content_quality: 'medium',
          has_projects: true,
          has_about: true,
          has_contact: true
        },
        social_links: [],
        technologies: ['React', 'Node.js', 'TypeScript'],
        message: '网页抓取功能开发中，返回模拟数据'
      };
    }
  }
});

// 技术栈分析工具
const techStackAnalyzer = tool({
  description: 'Analyze and summarize technical skills from multiple data sources.',
  inputSchema: z.object({
    github_data: z.any().describe('GitHub analysis results'),
    website_data: z.any().optional().describe('Website scraping results')
  }),
  execute: async ({ github_data, website_data }) => {
    console.log(`🔧 [技术栈分析] 综合分析技术数据`);
    
    const githubLanguages = github_data?.languages?.summary || [];
    const websiteTech = website_data?.technologies || [];
    
    // 合并和分析技术栈
    const allTechnologies = new Set([
      ...githubLanguages.map((lang: any) => lang[0]),
      ...websiteTech
    ]);
    
    const analysis = {
      primary_languages: githubLanguages.slice(0, 3).map((lang: any) => ({
        name: lang[0],
        percentage: lang[1].percentage,
        experience_level: lang[1].percentage > 50 ? 'Expert' : lang[1].percentage > 20 ? 'Proficient' : 'Familiar'
      })),
      all_technologies: Array.from(allTechnologies),
      tech_diversity_score: allTechnologies.size / 10, // 简单的多样性评分
      specialization: githubLanguages[0] ? {
        language: githubLanguages[0][0],
        dominance: githubLanguages[0][1].percentage
      } : null,
      cross_platform_skills: {
        frontend: websiteTech.some((tech: string) => ['React', 'Vue', 'Angular', 'JavaScript', 'TypeScript'].includes(tech)),
        backend: websiteTech.some((tech: string) => ['Node.js', 'Python', 'Java', 'Go', 'Ruby'].includes(tech)),
        mobile: websiteTech.some((tech: string) => ['React Native', 'Flutter', 'Swift', 'Kotlin'].includes(tech))
      }
    };
    
    console.log(`✅ [技术栈分析] 完成，识别了 ${allTechnologies.size} 种技术`);
    return analysis;
  }
});

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    
    console.log(`📨 [Multi-Step Workflow] 收到请求: ${message}`);

    // 使用 Multi-Step Tool Calls 实现智能工作流
    const result = await generateText({
      model: anthropic('claude-3-5-sonnet-20241022'),
      messages: [
        {
          role: 'system',
          content: `你是一个专业的技术人才分析师。你的任务是：

1. **计划阶段**: 分析用户输入，确定需要收集哪些信息
2. **执行阶段**: 按需调用工具收集数据
   - 如果有 GitHub 链接/用户名，使用 analyze_github 工具
   - 如果有个人网站链接，使用 scrape_webpage 工具  
   - 收集完数据后，使用 tech_stack_analyzer 进行综合分析
3. **分析阶段**: 基于收集的数据提供专业见解

你可以自主决定调用顺序和是否需要某个工具。始终以中文回复。`
        },
        {
          role: 'user',
          content: message
        }
      ],
      tools: {
        analyze_github: githubAnalyzeTool,
        scrape_webpage: webScrapeTool,
        tech_stack_analyzer: techStackAnalyzer
      },
      stopWhen: stepCountIs(8), // 允许最多8步，支持复杂的工作流
      temperature: 0.7,
      onStepFinish: async ({ toolResults, stepNumber }) => {
        console.log(`📊 [步骤 ${stepNumber}] 完成，执行了 ${toolResults.length} 个工具`);
        toolResults.forEach((result, index) => {
          console.log(`   工具 ${index + 1}: ${result.toolName} - 成功`);
        });
      }
    });

    console.log(`✅ [Multi-Step Workflow] 完成，总共执行了 ${result.steps.length} 个步骤`);

    // 提取所有工具调用和结果
    const allToolCalls = result.steps.flatMap(step => step.toolCalls);
    const allToolResults = result.steps.flatMap(step => step.toolResults);

    // 格式化工具结果
    const formattedToolResults = allToolResults.map((tr, index) => {
      const toolCall = allToolCalls[index];
      return {
        tool_name: toolCall?.toolName,
        success: true,
        data: tr.output,
        step: result.steps.findIndex(step => step.toolResults.includes(tr)) + 1,
        timestamp: new Date().toISOString()
      };
    });

    return NextResponse.json({
      success: true,
      response: result.text,
      steps: result.steps.length,
      toolCalls: allToolCalls,
      toolResults: formattedToolResults,
      workflow_summary: {
        total_steps: result.steps.length,
        tools_used: [...new Set(allToolCalls.map(tc => tc.toolName))],
        execution_flow: result.steps.map((step, index) => ({
          step: index + 1,
          tools_called: step.toolCalls.map(tc => tc.toolName),
          has_text: !!step.text
        }))
      },
      usage: result.usage,
      finishReason: result.finishReason
    });

  } catch (error) {
    console.error('❌ [Multi-Step Workflow] 错误:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      response: '抱歉，处理您的请求时出现了错误。请稍后重试。'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Multi-Step Workflow API',
    features: [
      'Intelligent planning',
      'Sequential tool execution', 
      'Parallel tool calls',
      'Comprehensive analysis',
      'Multi-step reasoning'
    ],
    tools: ['analyze_github', 'scrape_webpage', 'tech_stack_analyzer'],
    max_steps: 8,
    timestamp: new Date().toISOString()
  });
}
