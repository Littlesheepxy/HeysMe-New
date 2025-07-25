/**
 * Supabase 服务器端配置
 * 
 * 功能：
 * - 提供服务端的Supabase连接
 * - 处理Clerk用户与共享Supabase数据库的同步
 * - 支持管理员操作和数据同步
 *
 * 架构说明：
 * - 认证：使用Clerk进行用户认证
 * - 数据库：使用共享的Supabase数据库，具有完整权限
 * - 用户表：使用Clerk ID作为主键，支持多项目访问控制
 */

import { createClient } from "@supabase/supabase-js"
import { auth } from "@clerk/nextjs/server"

// 环境变量验证
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables")
}

/**
 * 服务端 Supabase 实例
 * 用于：API路由、管理员操作、数据同步
 * 权限：完整的数据库访问权限，需谨慎使用
 */
export const createServerClient = () => {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false, // 服务端不持久化会话
    },
  })
}

/**
 * 获取当前用户的Supabase用户记录
 * 如果用户不存在，则创建新记录
 */
export async function getCurrentUser() {
  const { userId } = await auth()
  
  if (!userId) {
    return null
  }

  const serverClient = createServerClient()
  
  // 首先尝试获取现有用户
  const { data: existingUser, error: fetchError } = await serverClient
    .from("users")
    .select("*")
    .eq("id", userId) // 使用 Clerk ID 作为主键
    .single()

  if (existingUser) {
    return existingUser
  }

  // 如果用户不存在，创建新用户记录
  if (fetchError?.code === "PGRST116") { // 记录不存在
    const { data: newUser, error: createError } = await serverClient
      .from("users")
      .insert({
        id: userId, // 使用 Clerk ID 作为主键
        email: "", // 将在 syncUserWithClerk 中更新
        projects: ["HeysMe"], // 默认给予 HeysMe 访问权限
        plan: "free",
        default_model: "claude-sonnet-4-20250514",
      })
      .select()
      .single()

    if (createError) {
      console.error("Error creating user:", createError)
      return null
    }

    return newUser
  }

  console.error("Error fetching user:", fetchError)
  return null
}

/**
 * 同步Clerk用户信息到共享Supabase数据库
 * 在用户登录或信息更新时调用
 */
export async function syncUserWithClerk(clerkUser: any) {
  const serverClient = createServerClient()
  
  const userData = {
    id: clerkUser.id, // 使用 Clerk ID 作为主键
    email: clerkUser.emailAddresses[0]?.emailAddress,
    first_name: clerkUser.firstName,
    last_name: clerkUser.lastName,
    avatar_url: clerkUser.imageUrl,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await serverClient
    .from("users")
    .upsert(userData, { 
      onConflict: "id", // 基于 Clerk ID 进行 upsert
      ignoreDuplicates: false 
    })
    .select()
    .single()

  if (error) {
    console.error("Error syncing user:", error)
    return null
  }

  return data
}

// 服务器端查询辅助函数
export const serverQueries = {
  // 获取用户的项目权限
  getUserProjects: async (clerkUserId: string) => {
    const serverClient = createServerClient()
    return serverClient
      .from("users")
      .select("projects")
      .eq("id", clerkUserId)
      .single()
  },

  // 检查用户是否有 HeysMe 访问权限
  checkHeysMeAccess: async (clerkUserId: string) => {
    const serverClient = createServerClient()
    const { data, error } = await serverClient
      .from("users")
      .select("projects")
      .eq("id", clerkUserId)
      .single()
    
    if (error || !data) return false
    
    const projects = data.projects || []
    return projects.includes("HeysMe")
  },

  // 创建或更新页面（服务端权限）
  upsertPage: async (pageData: any) => {
    const serverClient = createServerClient()
    return serverClient
      .from("HeysMe_pages")
      .upsert(pageData)
      .select()
      .single()
  },

  // 删除页面及其相关数据
  deletePage: async (pageId: string, userId: string) => {
    const serverClient = createServerClient()
    
    // 验证页面所有权
    const { data: page } = await serverClient
      .from("HeysMe_pages")
      .select("user_id")
      .eq("id", pageId)
      .single()
    
    if (!page || page.user_id !== userId) {
      throw new Error("Unauthorized or page not found")
    }

    // 删除页面块
    await serverClient
      .from("HeysMe_page_blocks")
      .delete()
      .eq("page_id", pageId)

    // 删除页面
    return serverClient
      .from("HeysMe_pages")
      .delete()
      .eq("id", pageId)
  },
} 