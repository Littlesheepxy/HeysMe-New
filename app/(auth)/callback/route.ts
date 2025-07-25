/**
 * 认证回调处理
 *
 * 功能：
 * - 处理OAuth回调
 * - 创建用户记录
 * - 重定向到目标页面
 *
 * TODO:
 * - [ ] 添加错误处理和重试机制
 * - [ ] 支持邀请码验证
 * - [ ] 记录登录日志
 */

import { createServerClient } from "@/lib/supabase-server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const redirect = searchParams.get("redirect") || "/dashboard"

  if (code) {
    const supabase = createServerClient()

    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) throw error

      // 检查是否是新用户，如果是则创建用户记录
      if (data.user) {
        const { data: existingUser } = await supabase.from("users").select("id").eq("id", data.user.id).single()

        if (!existingUser) {
          // 创建新用户记录
          await supabase.from("users").insert({
            id: data.user.id,
            email: data.user.email!,
            username: data.user.user_metadata?.username || data.user.email?.split("@")[0],
            plan: "free",
            default_model: "claude-sonnet-4-20250514",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
        }
      }

      return NextResponse.redirect(`${origin}${redirect}`)
    } catch (error) {
      console.error("Auth callback error:", error)
      return NextResponse.redirect(`${origin}/auth/login?error=callback_error`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/login`)
}
