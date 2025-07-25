/**
 * 页面管理 API 路由
 *
 * 功能：
 * - GET: 获取用户的所有页面
 * - POST: 创建新页面
 * - PUT: 更新页面信息
 * - DELETE: 删除页面
 *
 * 安全性：
 * - 用户身份验证
 * - 数据验证
 * - 权限检查
 * - SQL注入防护
 *
 * TODO:
 * - [ ] 添加分页支持
 * - [ ] 实现页面搜索
 * - [ ] 添加批量操作
 * - [ ] 支持页面导入/导出
 * - [ ] 添加访问日志
 */

import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { z } from "zod"

// 请求数据验证模式
const createPageSchema = z.object({
  userId: z.string().uuid("无效的用户ID"),
  slug: z.string().min(1, "页面标识不能为空").max(50, "页面标识过长"),
  title: z.string().min(1, "页面标题不能为空").max(100, "页面标题过长"),
  theme: z.enum(["zen", "creative", "devgrid", "minimal", "bold"], {
    errorMap: () => ({ message: "无效的主题类型" }),
  }),
  layout: z.enum(["grid", "hero", "twocol", "stack"], {
    errorMap: () => ({ message: "无效的布局类型" }),
  }),
  blocks: z
    .array(
      z.object({
        type: z.string(),
        data: z.any(),
        position: z.number().int().min(0),
        is_visible: z.boolean().default(true),
      }),
    )
    .optional(),
})

/**
 * GET /api/pages
 * 获取用户的所有页面
 *
 * 查询参数：
 * - userId: 用户ID（必需）
 * - limit: 返回数量限制（可选，默认20）
 * - offset: 偏移量（可选，用于分页）
 * - search: 搜索关键词（可选）
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const offset = Number.parseInt(searchParams.get("offset") || "0")
    const search = searchParams.get("search")

    // 参数验证
    if (!userId) {
      return NextResponse.json({ error: "用户ID必需", code: "MISSING_USER_ID" }, { status: 400 })
    }

    if (!z.string().uuid().safeParse(userId).success) {
      return NextResponse.json({ error: "无效的用户ID格式", code: "INVALID_USER_ID" }, { status: 400 })
    }

    const supabase = createServerClient()

    // 构建查询
    let query = supabase
      .from("pages")
      .select(`
        *,
        page_blocks (
          id,
          type,
          data,
          position,
          is_visible,
          created_at
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    // 添加搜索条件
    if (search) {
      query = query.or(`title.ilike.%${search}%,slug.ilike.%${search}%`)
    }

    const { data: pages, error, count } = await query

    if (error) {
      console.error("获取页面失败:", error)
      throw error
    }

    // 处理返回数据
    const processedPages = pages?.map((page) => ({
      ...page,
      page_blocks: page.page_blocks
        ?.sort((a: any, b: any) => a.position - b.position)
        ?.filter((block: any) => block.is_visible),
    }))

    return NextResponse.json({
      success: true,
      data: processedPages,
      pagination: {
        total: count,
        limit,
        offset,
        hasMore: count ? offset + limit < count : false,
      },
    })
  } catch (error) {
    console.error("获取页面失败:", error)
    return NextResponse.json(
      {
        success: false,
        error: "获取页面失败",
        code: "FETCH_PAGES_ERROR",
        details: process.env.NODE_ENV === "development" ? error : undefined,
      },
      { status: 500 },
    )
  }
}

/**
 * POST /api/pages
 * 创建新页面
 *
 * 请求体：
 * - userId: 用户ID
 * - slug: 页面标识符
 * - title: 页面标题
 * - theme: 主题
 * - layout: 布局
 * - blocks: 页面模块数组（可选）
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // 数据验证
    const validationResult = createPageSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "数据验证失败",
          code: "VALIDATION_ERROR",
          details: validationResult.error.errors,
        },
        { status: 400 },
      )
    }

    const { userId, slug, title, theme, layout, blocks } = validationResult.data
    const supabase = createServerClient()

    // 检查slug是否已存在
    const { data: existingPage } = await supabase.from("pages").select("id").eq("slug", slug).single()

    if (existingPage) {
      return NextResponse.json(
        {
          error: "页面标识符已存在",
          code: "SLUG_EXISTS",
          suggestion: `尝试使用 ${slug}-${Date.now()}`,
        },
        { status: 409 },
      )
    }

    // 开始数据库事务
    const { data: page, error: pageError } = await supabase
      .from("pages")
      .insert({
        user_id: userId,
        slug,
        title,
        theme,
        layout,
        visibility: "private", // 默认私有
        is_featured: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (pageError) {
      console.error("创建页面失败:", pageError)
      throw pageError
    }

    // 创建页面模块
    if (blocks && blocks.length > 0) {
      const blocksToInsert = blocks.map((block, index) => ({
        page_id: page.id,
        type: block.type,
        data: block.data,
        position: block.position ?? index,
        is_visible: block.is_visible ?? true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }))

      const { error: blocksError } = await supabase.from("page_blocks").insert(blocksToInsert)

      if (blocksError) {
        // 如果模块创建失败，删除已创建的页面
        await supabase.from("pages").delete().eq("id", page.id)
        console.error("创建页面模块失败:", blocksError)
        throw blocksError
      }
    }

    // 返回完整的页面数据
    const { data: fullPage } = await supabase
      .from("pages")
      .select(`
        *,
        page_blocks (*)
      `)
      .eq("id", page.id)
      .single()

    return NextResponse.json({
      success: true,
      data: fullPage,
      message: "页面创建成功",
    })
  } catch (error) {
    console.error("创建页面失败:", error)
    return NextResponse.json(
      {
        success: false,
        error: "创建页面失败",
        code: "CREATE_PAGE_ERROR",
        details: process.env.NODE_ENV === "development" ? error : undefined,
      },
      { status: 500 },
    )
  }
}

/**
 * PUT /api/pages/[id]
 * 更新页面信息
 * TODO: 实现页面更新功能
 */

/**
 * DELETE /api/pages/[id]
 * 删除页面
 * TODO: 实现页面删除功能，包括级联删除模块
 */

// TODO: 添加以下功能
// - 页面复制功能
// - 页面模板保存
// - 页面版本历史
// - 页面分享设置
// - 页面SEO优化
// - 页面性能分析
