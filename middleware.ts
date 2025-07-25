/**
 * Next.js 中间件 - Clerk 认证集成
 *
 * 功能：
 * - Clerk 认证保护
 * - 路由重定向处理
 * - 请求日志记录
 *
 * TODO:
 * - [ ] 添加速率限制
 * - [ ] 实现地理位置重定向
 * - [ ] 添加A/B测试支持
 */

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

// 定义受保护的路由
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/people(.*)",
  "/templates(.*)",
  "/chat(.*)",
  "/settings(.*)",
  "/api/pages(.*)",
  "/api/generate-page(.*)",
  "/api/deploy(.*)"
])

// 定义公开路由（不需要认证）
const isPublicRoute = createRouteMatcher([
  "/api/webhooks(.*)", // Clerk webhooks
  "/api/debug(.*)",    // 调试接口
  "/api/env-check(.*)" // 环境检查
])

export default clerkMiddleware(async (auth, req) => {
  // 🔧 公开路由直接放行，不需要认证检查
  if (isPublicRoute(req)) {
    return NextResponse.next()
  }

  const authData = await auth()
  
  // 重定向旧的登录路由到新的 Clerk 登录页面
  if (req.nextUrl.pathname.startsWith("/auth/login")) {
    const redirectUrl = req.nextUrl.searchParams.get("redirect_url") || "/dashboard"
    const signInUrl = new URL("/sign-in", req.url)
    signInUrl.searchParams.set("redirect_url", redirectUrl)
    return NextResponse.redirect(signInUrl)
  }
  
  // 如果是受保护的路由且用户未登录，重定向到登录页面
  if (isProtectedRoute(req) && !authData.userId) {
    const signInUrl = new URL("/sign-in", req.url)
    signInUrl.searchParams.set("redirect_url", req.url)
    return NextResponse.redirect(signInUrl)
  }

  // 如果用户已登录且访问登录/注册页面，重定向到仪表板
  if (authData.userId && (req.nextUrl.pathname === "/sign-in" || req.nextUrl.pathname === "/sign-up")) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    /*
     * 匹配所有请求路径，除了：
     * - _next/static (静态文件)
     * - _next/image (图片优化文件)
     * - favicon.ico (网站图标)
     * - public 文件夹中的文件
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
