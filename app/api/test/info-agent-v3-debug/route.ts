/**
 * 调试信息收集 Agent V3 - 不依赖外部 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { tool } from 'ai';
import { z } from 'zod';

export async function POST(req: NextRequest) {
  try {
    const { message, sessionId, context, round } = await req.json();

    if (!message) {
      return NextResponse.json({
        success: false,
        error: 'Message is required'
      }, { status: 400 });
    }

    console.log(`🚀 [调试] 处理信息收集请求: ${message.substring(0, 100)}...`);
    console.log(`📋 [调试] 轮次: ${round || 1}`);

    // 定义简化的工具（不依赖外部服务）
    const tools = {
      analyze_github: tool({
        description: '分析 GitHub 用户资料和仓库信息',
        inputSchema: z.object({
          username_or_url: z.string().describe('GitHub 用户名或 URL'),
          include_repos: z.boolean().optional().default(true)
        }),
        execute: async ({ username_or_url, include_repos = true }) => {
          console.log(`🔧 [GitHub] 分析: ${username_or_url}`);
          return {
            username: username_or_url.split('/').pop() || username_or_url,
            profile: { 
              name: '开发者', 
              bio: '技术专家',
              followers: 100,
              following: 50
            },
            repositories: include_repos ? [
              { name: 'awesome-project', stars: 150, language: 'JavaScript' },
              { name: 'cool-library', stars: 80, language: 'TypeScript' }
            ] : [],
            message: 'GitHub 分析完成'
          };
        }
      }),

      scrape_webpage: tool({
        description: '抓取和分析网页内容',
        inputSchema: z.object({
          url: z.string().describe('要抓取的网页 URL'),
          target_sections: z.array(z.string()).optional().default(['all'])
        }),
        execute: async ({ url, target_sections = ['all'] }) => {
          console.log(`🔧 [网页] 抓取: ${url}`);
          return {
            url,
            title: '个人作品集网站',
            description: '展示专业技能和项目经验的个人网站',
            content: '这是一个专业的个人网站，展示了丰富的项目经验和技术能力。',
            message: '网页分析完成'
          };
        }
      }),

      extract_linkedin: tool({
        description: '提取 LinkedIn 专业信息',
        inputSchema: z.object({
          profile_url: z.string().describe('LinkedIn 档案 URL')
        }),
        execute: async ({ profile_url }) => {
          console.log(`🔧 [LinkedIn] 分析: ${profile_url}`);
          return {
            profile_url,
            name: '专业人士',
            title: '高级软件工程师',
            summary: '经验丰富的软件开发专家，专注于前端技术和用户体验设计。',
            experience: [
              { company: '科技公司', position: '高级工程师', duration: '2020-现在' }
            ],
            message: 'LinkedIn 分析完成'
          };
        }
      })
    };

    // 检测链接
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const detectedLinks = message.match(urlRegex) || [];
    
    console.log(`🔍 [调试] 检测到 ${detectedLinks.length} 个链接: ${detectedLinks.join(', ')}`);

    // 构建 prompt
    const prompt = `你是一个专业的信息收集专家。用户提供了以下信息：

"${message}"

检测到的链接：${detectedLinks.length > 0 ? detectedLinks.join(', ') : '无'}

请分析用户提供的信息：
1. 如果有 GitHub 链接，使用 analyze_github 工具分析
2. 如果有个人网站链接，使用 scrape_webpage 工具分析  
3. 如果有 LinkedIn 链接，使用 extract_linkedin 工具分析
4. 提取文本中的基本信息（姓名、职业、技能等）

请调用相应的工具来分析链接，然后提供一个综合分析。`;

    // 执行工具调用
    const result = await generateText({
      model: anthropic('claude-3-5-sonnet-20241022'),
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      tools,
      maxTokens: 4000,
      temperature: 0.1,
    });

    console.log(`✅ [调试] 完成，工具调用数: ${result.toolCalls.length}`);

    return NextResponse.json({
      success: true,
      sessionId: sessionId || `debug-session-${Date.now()}`,
      currentRound: round || 1,
      maxRounds: 2,
      message: result.text,
      detectedLinks,
      toolCalls: result.toolCalls.map(tc => ({
        toolName: tc.toolName,
        input: tc.args
      })),
      toolResults: result.toolResults.map(tr => ({
        toolName: tr.toolName,
        output: tr.result,
        success: true
      })),
      totalTools: result.toolCalls.length,
      metadata: {
        agent_name: '信息收集调试版',
        processing_time: new Date().toISOString(),
        tools_used: result.toolCalls.map(tc => tc.toolName),
        links_processed: detectedLinks
      }
    });

  } catch (error: any) {
    console.error('❌ [调试] 处理失败:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || '处理请求时发生错误',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
