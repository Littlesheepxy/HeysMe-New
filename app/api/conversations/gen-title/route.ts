/**
 * 会话标题生成 API
 * 
 * 功能：
 * - 根据会话历史自动生成简洁的标题
 * - 支持不同AI模型
 * - 提供标题长度控制
 */

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getModelById } from "@/types/models";

// 请求验证schema
const genTitleSchema = z.object({
  conversationId: z.string().min(1, "会话ID不能为空"),
  messageCount: z.number().optional(),
  model: z.string().optional().default("claude-sonnet-4-20250514"),
  maxLength: z.number().optional().default(20),
});

/**
 * POST /api/conversations/gen-title
 * 生成会话标题
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 验证请求数据
    const validationResult = genTitleSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "请求数据验证失败",
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { conversationId, messageCount, model, maxLength } = validationResult.data;

    // 获取会话数据
    const sessionResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/session?sessionId=${conversationId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!sessionResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          error: "会话不存在或无法访问",
        },
        { status: 404 }
      );
    }

    const sessionData = await sessionResponse.json();
    const conversation = sessionData.session;

    if (!conversation || !conversation.conversationHistory) {
      return NextResponse.json(
        {
          success: false,
          error: "会话历史为空，无法生成标题",
        },
        { status: 400 }
      );
    }

    // 如果已有标题且消息数量没有显著增加，返回现有标题
    if (conversation.title && messageCount && messageCount <= (conversation.lastTitleMessageCount || 0) + 3) {
      return NextResponse.json({
        success: true,
        title: conversation.title,
        cached: true,
        generatedAt: conversation.titleGeneratedAt || new Date().toISOString(),
      });
    }

    // 提取前几条有意义的消息用于生成标题
    const messages = conversation.conversationHistory
      .filter((msg: any) => msg.content && msg.content.trim().length > 0)
      .slice(0, 6); // 只取前6条消息

    if (messages.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "没有足够的消息内容生成标题",
        },
        { status: 400 }
      );
    }

    // 构建上下文
    const context = messages
      .map((msg: any) => {
        const role = msg.type === 'user_message' ? '用户' : 'AI';
        const content = msg.content.length > 200 ? msg.content.substring(0, 200) + '...' : msg.content;
        return `${role}: ${content}`;
      })
      .join('\n');

    // 构建标题生成prompt
    const titlePrompt = `
基于以下对话内容，生成一个简洁、准确的标题。

要求：
1. 标题长度不超过${maxLength}个字符
2. 准确概括对话的主要话题
3. 使用简洁、专业的语言
4. 避免使用"对话"、"聊天"等词汇
5. 直接返回标题，不要引号或其他标记

对话内容：
${context}

标题：`;

    // 调用AI生成标题
    const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000';
    const aiResponse = await fetch(`${baseUrl}/api/ai/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: titlePrompt,
        options: {
          maxTokens: 100,
          temperature: 0.7,
          model: model,
        }
      })
    });

    const aiResult = await aiResponse.json();
    console.log('🔍 [标题生成] AI返回结果:', JSON.stringify(aiResult, null, 2));

    if (!aiResponse.ok) {
      console.error('❌ [标题生成] HTTP请求失败:', aiResponse.status, aiResult);
      return NextResponse.json(
        {
          success: false,
          error: "AI标题生成请求失败",
          details: aiResult,
        },
        { status: 500 }
      );
    }

    if (!aiResult.success) {
      console.error('❌ [标题生成] AI处理失败:', aiResult.error);
      return NextResponse.json(
        {
          success: false,
          error: "AI标题生成失败",
          details: aiResult.error,
        },
        { status: 500 }
      );
    }

    // 提取并清理标题 - 更灵活的数据提取
    let generatedTitle = '';
    
    // 尝试多种数据结构
    if (aiResult.data) {
      if (typeof aiResult.data === 'string') {
        generatedTitle = aiResult.data;
      } else if (typeof aiResult.data === 'object') {
        // 尝试各种可能的字段
        generatedTitle = aiResult.data.text || 
                        aiResult.data.content || 
                        aiResult.data.message ||
                        aiResult.data.result ||
                        (aiResult.data.choices?.[0]?.message?.content) ||
                        '';
      }
    }
    
    // 如果data为空，尝试直接从result获取
    if (!generatedTitle && aiResult.result) {
      generatedTitle = typeof aiResult.result === 'string' ? aiResult.result : '';
    }
    
    console.log('📝 [标题生成] 提取的原始标题:', generatedTitle);

    // 清理标题
    const cleanTitle = generatedTitle
      .trim()
      .replace(/^["'`]|["'`]$/g, '') // 移除首尾引号
      .replace(/^\s*标题[:：]\s*/i, '') // 移除"标题："前缀
      .replace(/\n.*$/, '') // 只保留第一行
      .substring(0, maxLength) // 限制长度
      .trim();

    if (!cleanTitle) {
      return NextResponse.json(
        {
          success: false,
          error: "生成的标题为空",
        },
        { status: 500 }
      );
    }

    // 更新会话标题
    const updateResponse = await fetch('/api/session/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId: conversationId,
        sessionData: {
          ...conversation,
          title: cleanTitle,
          titleGeneratedAt: new Date().toISOString(),
          titleModel: model,
          lastTitleMessageCount: messages.length,
        }
      })
    });

    if (!updateResponse.ok) {
      console.warn('会话标题更新失败，但仍返回生成的标题');
    }

    return NextResponse.json({
      success: true,
      title: cleanTitle,
      generatedAt: new Date().toISOString(),
      model: model,
      messageCount: messages.length,
    });

  } catch (error) {
    console.error('标题生成失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: "标题生成失败",
        details: error instanceof Error ? error.message : "未知错误",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/conversations/gen-title
 * 获取标题生成配置
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    config: {
      autoGenerate: true,
      messageThreshold: 3,
      maxTitleLength: 20,
      regenerateOnEdit: false,
      supportedModels: ["claude-sonnet-4-20250514", "gpt-4", "gpt-3.5-turbo"],
    }
  });
} 