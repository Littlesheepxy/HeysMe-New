/**
 * Supabase 客户端配置 - 客户端版本
 *
 * 功能：
 * - 提供客户端Supabase连接
 * - 支持实时订阅和文件存储
 * - 不包含服务端功能，避免导入冲突
 *
 * 架构说明：
 * - 认证：使用Clerk进行用户认证
 * - 数据库：使用共享的Supabase数据库
 * - 用户表：使用Clerk ID作为主键，支持多项目访问控制
 */

import { createClient } from "@supabase/supabase-js"

// 环境变量验证
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables")
}

/**
 * 客户端 Supabase 实例
 * 用于：前端组件、数据查询、文件上传
 * 注意：不使用Supabase Auth，认证由Clerk处理
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // 不使用Supabase的会话管理
  },
  realtime: {
    params: {
      eventsPerSecond: 10, // 实时事件频率限制
    },
  },
})

// 常用查询辅助函数（客户端版本）
export const queries = {
  // 获取用户的所有 HeysMe 页面
  getUserHeysMePages: async (clerkUserId: string) => {
    return supabase
      .from("HeysMe_pages")
      .select(`
        *,
        HeysMe_page_blocks(*),
        HeysMe_page_analytics(views_count, shares_count)
      `)
      .eq("user_id", clerkUserId)
      .order("updated_at", { ascending: false })
  },

  // 获取页面详情
  getHeysMePage: async (pageId: string) => {
    return supabase
      .from("HeysMe_pages")
      .select(`
        *,
        HeysMe_page_blocks(*),
        users!inner(first_name, last_name, avatar_url)
      `)
      .eq("id", pageId)
      .single()
  },

  // 通过 slug 获取页面
  getHeysPageBySlug: async (slug: string) => {
    return supabase
      .from("HeysMe_pages")
      .select(`
        *,
        HeysMe_page_blocks(*),
        users!inner(first_name, last_name, avatar_url)
      `)
      .eq("slug", slug)
      .single()
  },

  // 获取用户公开页面（用于发现页面）
  getPublicHeysMePages: async (limit = 10) => {
    return supabase
      .from("HeysMe_pages")
      .select(`
        *,
        users!inner(first_name, last_name, avatar_url),
        HeysMe_page_analytics(views_count, shares_count)
      `)
      .eq("visibility", "public")
      .order("updated_at", { ascending: false })
      .limit(limit)
  },

  // 获取精选页面
  getFeaturedHeysMePages: async () => {
    return supabase
      .from("HeysMe_pages")
      .select(`
        *,
        users!inner(first_name, last_name, avatar_url),
        HeysMe_page_analytics(views_count, shares_count)
      `)
      .eq("visibility", "public")
      .eq("is_featured", true)
      .order("updated_at", { ascending: false })
  },
}

/**
 * 共享数据库表结构说明：
 *
 * users 表（现有表结构 + HeysMe 扩展）：
 * - id (text, primary key) - Clerk用户ID
 * - email (text, unique, not null)
 * - first_name (text, nullable)
 * - last_name (text, nullable)
 * - avatar_url (text, nullable)
 * - projects (text[], default: '{}') - 用户可访问的项目列表
 * - plan (text, default: 'free') - 用户计划
 * - default_model (text, default: 'claude-sonnet-4-20250514') - 默认AI模型
 * - created_at (timestamp)
 * - updated_at (timestamp)
 *
 * HeysMe_pages 表：
 * - id (uuid, primary key)
 * - user_id (text, foreign key to users.id)
 * - slug (text, unique)
 * - title (text)
 * - theme (text)
 * - layout (text)
 * - visibility (text, default: 'private')
 * - is_featured (boolean, default: false)
 * - created_at (timestamp)
 * - updated_at (timestamp)
 *
 * HeysMe_page_blocks 表：
 * - id (uuid, primary key)
 * - page_id (uuid, foreign key)
 * - type (text)
 * - data (jsonb)
 * - position (integer)
 * - is_visible (boolean, default: true)
 * - created_at (timestamp)
 * - updated_at (timestamp)
 *
 * 其他 HeysMe 表：
 * - HeysMe_page_analytics (页面访问统计)
 * - HeysMe_templates (页面模板)
 * - HeysMe_user_assets (用户上传的资源)
 */
