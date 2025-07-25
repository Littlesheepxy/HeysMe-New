/**
 * 分享短链接 API
 * 
 * 功能：
 * - POST: 生成短链接
 * - GET: 短链接重定向
 * 
 * 链接格式: https://yourdomain.com/r/abc123
 */

import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { z } from "zod";
import { auth } from '@clerk/nextjs/server'

// 生成短链接的请求schema
const generateShortLinkSchema = z.object({
  pageId: z.string().uuid("无效的页面ID"),
  userId: z.string().uuid("无效的用户ID"),
  password: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
  allowedViewers: z.array(z.string().email()).optional(),
  analytics: z.boolean().default(true),
});

/**
 * POST /api/share
 * 生成分享短链接
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const body = await request.json()
    const { type, config, pageId, pageTitle, pageContent, conversationHistory } = body

    const supabase = createServerClient()

    switch (type) {
      case 'plaza':
        return await handlePlazaShare(supabase, userId, config, pageId, pageTitle, pageContent, conversationHistory)
      
      case 'template':
        return await handleTemplateShare(supabase, userId, config, pageId, pageTitle, pageContent, conversationHistory)
      
      case 'link':
        return await handlePrivateLinkShare(supabase, userId, config, pageId, pageTitle, pageContent)
      
      default:
        return NextResponse.json({ error: '不支持的分享类型' }, { status: 400 })
    }
  } catch (error) {
    console.error('分享失败:', error)
    return NextResponse.json({ error: '分享失败' }, { status: 500 })
  }
}

// 处理数字身份广场分享
async function handlePlazaShare(
  supabase: any, 
  userId: string, 
  config: any, 
  pageId: string, 
  pageTitle: string, 
  pageContent: any,
  conversationHistory: any[]
) {
  try {
    // 首先创建或更新用户页面记录
    const { data: existingPage, error: selectError } = await supabase
      .from('user_pages')
      .select('*')
      .eq('user_id', userId)
      .eq('id', pageId)
      .single()

    let pageData
    if (existingPage) {
      // 更新现有页面
      const { data, error } = await supabase
        .from('user_pages')
        .update({
          title: config.title,
          description: config.description,
          category: config.category,
          tags: config.tags || [],
          industry_tags: config.industryTags || [],
          location: config.location,
          is_shared_to_plaza: true,
          plaza_share_config: config,
          privacy_settings: config.privacySettings,
          content: pageContent,
          shared_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', pageId)
        .select()
        .single()

      if (error) throw error
      pageData = data
    } else {
      // 创建新页面
      const { data, error } = await supabase
        .from('user_pages')
        .insert({
          id: pageId,
          user_id: userId,
          title: config.title,
          description: config.description,
          category: config.category,
          tags: config.tags || [],
          industry_tags: config.industryTags || [],
          location: config.location,
          is_shared_to_plaza: true,
          plaza_share_config: config,
          privacy_settings: config.privacySettings,
          content: pageContent
        })
        .select()
        .single()

      if (error) throw error
      pageData = data
    }

    // 记录分享行为
    await supabase
      .from('share_records')
      .insert({
        user_id: userId,
        page_id: pageId,
        share_type: 'plaza',
        share_config: config
      })

    return NextResponse.json({
      success: true,
      message: '已成功分享到数字身份广场',
      data: {
        pageId: pageData.id,
        shareUrl: `/p/${pageData.id}`,
        type: 'plaza'
      }
    })
  } catch (error) {
    console.error('数字身份广场分享失败:', error)
    throw error
  }
}

// 处理模板库分享
async function handleTemplateShare(
  supabase: any, 
  userId: string, 
  config: any, 
  pageId: string, 
  pageTitle: string, 
  pageContent: any,
  conversationHistory: any[]
) {
  try {
    // 数据脱敏处理
    const sanitizedContent = await sanitizePageContent(pageContent)
    const sanitizedPromptHistory = config.includePromptHistory 
      ? await sanitizePromptHistory(conversationHistory)
      : []

    // 创建模板记录
    const { data: templateData, error } = await supabase
      .from('templates')
      .insert({
        creator_id: userId,
        source_page_id: pageId,
        title: config.title,
        description: config.description,
        category: config.category,
        tags: config.tags || [],
        design_tags: config.designTags || [],
        sanitized_content: sanitizedContent,
        sanitized_prompt_history: sanitizedPromptHistory,
        status: 'published'
      })
      .select()
      .single()

    if (error) throw error

    // 记录分享行为
    await supabase
      .from('share_records')
      .insert({
        user_id: userId,
        page_id: pageId,
        share_type: 'template',
        share_config: config
      })

    // 记录脱敏日志
    await supabase
      .from('sanitization_logs')
      .insert({
        template_id: templateData.id,
        original_fields: { pageContent, conversationHistory },
        sanitized_fields: { sanitizedContent, sanitizedPromptHistory },
        sanitization_rules: getSanitizationRules()
      })

    return NextResponse.json({
      success: true,
      message: '已成功分享到灵感模板库',
      data: {
        templateId: templateData.id,
        shareUrl: `/templates/${templateData.id}`,
        type: 'template'
      }
    })
  } catch (error) {
    console.error('模板库分享失败:', error)
    throw error
  }
}

// 处理私密链接分享
async function handlePrivateLinkShare(
  supabase: any, 
  userId: string, 
  config: any, 
  pageId: string, 
  pageTitle: string, 
  pageContent: any
) {
  try {
    // 生成私密分享码
    const shareCode = generateShareCode()
    
    // 记录分享行为
    const { data: shareRecord, error } = await supabase
      .from('share_records')
      .insert({
        user_id: userId,
        page_id: pageId,
        share_type: 'link',
        share_config: {
          ...config,
          shareCode,
          createdAt: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (error) throw error

    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/r/${shareCode}`

    return NextResponse.json({
      success: true,
      message: '私密分享链接已生成',
      data: {
        shareCode,
        shareUrl,
        type: 'link'
      }
    })
  } catch (error) {
    console.error('私密链接生成失败:', error)
    throw error
  }
}

// 数据脱敏函数
async function sanitizePageContent(content: any) {
  if (!content) return {}

  const sanitized = JSON.parse(JSON.stringify(content))

  // 脱敏规则
  const sensitivePatterns = {
    // 手机号
    phone: /1[3-9]\d{9}/g,
    // 邮箱
    email: /[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}/g,
    // 身份证号
    idCard: /\d{17}[\dXx]/g,
    // 银行卡号
    bankCard: /\d{16,19}/g
  }

  function sanitizeText(text: string): string {
    if (typeof text !== 'string') return text

    return text
      .replace(sensitivePatterns.phone, '138****8888')
      .replace(sensitivePatterns.email, '****@example.com')
      .replace(sensitivePatterns.idCard, '******************')
      .replace(sensitivePatterns.bankCard, '****************')
  }

  // 递归脱敏对象
  function sanitizeObject(obj: any): any {
    if (typeof obj === 'string') {
      return sanitizeText(obj)
    } else if (Array.isArray(obj)) {
      return obj.map(sanitizeObject)
    } else if (obj && typeof obj === 'object') {
      const sanitizedObj: any = {}
      for (const [key, value] of Object.entries(obj)) {
        sanitizedObj[key] = sanitizeObject(value)
      }
      return sanitizedObj
    }
    return obj
  }

  return sanitizeObject(sanitized)
}

// 脱敏对话历史
async function sanitizePromptHistory(history: any[]) {
  if (!Array.isArray(history)) return []

  return history.map(message => ({
    ...message,
    content: typeof message.content === 'string' 
      ? message.content.replace(/[\u4e00-\u9fa5]{2,4}/g, '****') // 替换中文姓名
      : message.content,
    // 移除可能包含敏感信息的字段
    metadata: message.metadata ? {
      ...message.metadata,
      userInfo: undefined,
      personalData: undefined
    } : undefined
  }))
}

// 获取脱敏规则
function getSanitizationRules() {
  return {
    personalNames: { pattern: '[\u4e00-\u9fa5]{2,4}', replacement: '****' },
    phoneNumbers: { pattern: '1[3-9]\\d{9}', replacement: '138****8888' },
    emails: { pattern: '[\\w.-]+@[\\w.-]+\\.[a-zA-Z]{2,}', replacement: '****@example.com' },
    companyNames: { replacement: '某知名公司' },
    projectNames: { replacement: '某项目' }
  }
}

// 生成分享码
function generateShareCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * GET /api/share?code=abc123
 * 获取短链接信息（重定向前验证）
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const password = searchParams.get("password");

    if (!code) {
      return NextResponse.json(
        { success: false, error: "缺少短链接码" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    
    // 查找分享记录
    const { data: share, error: shareError } = await supabase
      .from("page_shares")
      .select(`
        *,
        pages (
          id,
          slug,
          title,
          theme,
          layout,
          user_id,
          users (
            username,
            full_name
          )
        )
      `)
      .eq("short_code", code)
      .single();

    if (shareError || !share) {
      return NextResponse.json(
        { success: false, error: "分享链接不存在或已失效" },
        { status: 404 }
      );
    }

    // 检查是否过期
    if (share.expires_at && new Date(share.expires_at) < new Date()) {
      return NextResponse.json(
        { success: false, error: "分享链接已过期" },
        { status: 410 }
      );
    }

    // 检查密码
    if (share.password && share.password !== password) {
      return NextResponse.json(
        { 
          success: false, 
          error: "需要密码",
          requiresPassword: true 
        },
        { status: 401 }
      );
    }

    // 记录访问
    if (share.enable_analytics) {
      await supabase
        .from("page_share_analytics")
        .insert({
          share_id: share.id,
          visitor_ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || "unknown",
          user_agent: request.headers.get("user-agent") || "unknown",
          referer: request.headers.get("referer"),
          visited_at: new Date().toISOString(),
        });

      // 更新访问次数
      await supabase
        .from("page_shares")
        .update({ 
          view_count: (share.view_count || 0) + 1,
          last_accessed_at: new Date().toISOString()
        })
        .eq("id", share.id);
    }

    return NextResponse.json({
      success: true,
      data: {
        pageId: share.pages.id,
        pageSlug: share.pages.slug,
        pageTitle: share.pages.title,
        pageTheme: share.pages.theme,
        pageLayout: share.pages.layout,
        authorName: share.pages.users?.full_name || share.pages.users?.username,
        redirectUrl: `/p/${share.pages.slug}`,
        shareInfo: {
          createdAt: share.created_at,
          viewCount: share.view_count || 0,
          hasPassword: !!share.password,
        }
      },
    });

  } catch (error) {
    console.error("获取分享信息失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: "获取分享信息失败",
        details: process.env.NODE_ENV === "development" ? error : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * 生成6位随机短链接码
 */
function generateShortCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
} 