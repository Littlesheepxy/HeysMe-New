/**
 * Supabase 客户端配置 - 纯客户端版本
 * 
 * 用于客户端组件的Supabase连接
 * 不包含服务端专用的功能
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