/**
 * 跨项目用户数据同步服务 - 共享数据库版本
 * 
 * 功能：
 * - 在共享的 Supabase 数据库中管理用户数据
 * - 支持多项目标识和权限管理
 * - 处理 HeysMe 特定的业务逻辑
 * 
 * 使用场景：
 * - 用户在父项目注册后，自动获得 HeysMe 访问权限
 * - 用户信息更新时，所有项目实时同步
 * - 跨项目数据查询和访问控制
 */

import { syncUserWithClerk } from "./supabase-server"

/**
 * 同步用户数据并确保 HeysMe 访问权限
 */
export async function syncUserAcrossProjects(clerkUser: any) {
  try {
    console.log(`Syncing user ${clerkUser.id} with HeysMe access`)
    
    // 1. 同步用户基本信息到共享数据库
    const user = await syncUserWithClerk(clerkUser)
    
    // 2. 确保用户有 HeysMe 项目访问权限
    if (user) {
      await ensureHeysMeAccess(user.id)
    }
    
    return user
  } catch (error) {
    console.error('Error syncing user across projects:', error)
    throw error
  }
}

/**
 * 确保用户有 HeysMe 访问权限
 */
export async function ensureHeysMeAccess(userId: string) {
  const { createServerClient } = await import("./supabase-server")
  const serverClient = createServerClient()
  
  try {
    // 检查用户当前的项目权限
    const { data: user, error } = await serverClient
      .from("users")
      .select("projects")
      .eq("id", userId)
      .single()
    
    if (error) {
      console.error("Error fetching user projects:", error)
      return
    }
    
    const currentProjects = user.projects || []
    
    // 如果用户还没有 HeysMe 访问权限，则添加
    if (!currentProjects.includes('HeysMe')) {
      const updatedProjects = [...currentProjects, 'HeysMe']
      
      const { error: updateError } = await serverClient
        .from("users")
        .update({ projects: updatedProjects })
        .eq("id", userId)
      
      if (updateError) {
        console.error("Error updating user projects:", updateError)
      } else {
        console.log(`Added HeysMe access for user ${userId}`)
      }
    }
  } catch (error) {
    console.error("Error ensuring HeysMe access:", error)
  }
}

/**
 * 检查用户是否有 HeysMe 访问权限
 */
export async function checkUserHeysMeAccess(clerkUserId: string): Promise<boolean> {
  try {
    const { getCurrentUser } = await import("./supabase-server")
    const user = await getCurrentUser()
    
    if (!user) {
      return false
    }
    
    // 检查用户的项目权限
    const projects = user.projects || []
    return projects.includes('HeysMe')
  } catch (error) {
    console.error('Error checking user HeysMe access:', error)
    return false
  }
}

/**
 * 获取用户在所有项目中的统计数据
 */
export async function getUserCrossProjectStats(clerkUserId: string) {
  try {
    const { getCurrentUser } = await import("./supabase-server")
    const user = await getCurrentUser()
    
    if (!user) {
      return null
    }
    
    const { createServerClient } = await import("./supabase-server")
    const serverClient = createServerClient()
    
    // 获取用户的页面数量
    const { count: pagesCount } = await serverClient
      .from("pages")
      .select("*", { count: 'exact', head: true })
      .eq("user_id", user.id)
    
    return {
      userId: user.id,
      clerkId: user.clerk_id,
      plan: user.plan,
      projects: user.projects || [],
      HeysMePagesCount: pagesCount || 0,
      joinedAt: user.created_at,
      hasHeysMeAccess: (user.projects || []).includes('HeysMe')
    }
  } catch (error) {
    console.error('Error fetching cross-project stats:', error)
    return null
  }
}

/**
 * 处理用户删除的跨项目同步
 */
export async function handleUserDeletion(clerkUserId: string) {
  try {
    const { createServerClient } = await import("./supabase-server")
    const serverClient = createServerClient()
    
    // 在共享数据库中，用户删除会通过级联删除自动清理相关数据
    console.log(`User ${clerkUserId} deletion will be handled by database cascade`)
    
    // 可以在这里添加额外的清理逻辑，比如：
    // - 清理文件存储
    // - 发送通知
    // - 记录审计日志等
    
  } catch (error) {
    console.error('Error handling user deletion:', error)
  }
}

/**
 * 为用户创建默认的 HeysMe 页面（可选）
 */
export async function createDefaultHeysMePage(userId: string) {
  try {
    const { createServerClient } = await import("./supabase-server")
    const serverClient = createServerClient()
    
    // 检查用户是否已经有页面
    const { data: existingPages } = await serverClient
      .from("pages")
      .select("id")
      .eq("user_id", userId)
      .limit(1)
    
    if (existingPages && existingPages.length > 0) {
      console.log(`User ${userId} already has pages, skipping default creation`)
      return
    }
    
    // 创建默认页面
    const { data: page, error } = await serverClient
      .from("pages")
      .insert({
        user_id: userId,
        title: "我的个人主页",
        slug: `user-${userId.slice(0, 8)}`,
        theme: "zen",
        layout: "grid",
        visibility: "private"
      })
      .select()
      .single()
    
    if (error) {
      console.error("Error creating default page:", error)
      return
    }
    
    // 创建默认的页面模块
    const defaultBlocks = [
      {
        page_id: page.id,
        type: "hero",
        data: {
          title: "欢迎来到我的主页",
          subtitle: "这是由 HeysMe AI 生成的个性化页面",
          description: "您可以通过对话来自定义这个页面的内容和风格"
        },
        position: 0
      }
    ]
    
    if (defaultBlocks.length > 0) {
      await serverClient
        .from("page_blocks")
        .insert(defaultBlocks.map((block, index) => ({
          ...block,
          page_id: page.id,
          position: index
        })))
    }
    
    console.log(`Created default page for user ${userId}`)
    return page
  } catch (error) {
    console.error('Error creating default HeysMe page:', error)
  }
} 