/**
 * 公开页面展示
 *
 * 功能：
 * - 展示用户的HeysMe页面
 * - 支持SEO优化
 * - 访问统计
 * - 社交分享
 *
 * TODO:
 * - [ ] 添加页面评论功能
 * - [ ] 实现访客留言
 * - [ ] 支持页面点赞
 * - [ ] 添加相关推荐
 */

import type { Metadata } from "next"
import { notFound } from "next/navigation"
import PageRenderer from "@/components/rendering/page-renderer"
import { createServerClient } from "@/lib/supabase-server"
import type { FlowPage } from "@/types/HeysMe"

// 扩展FlowPage类型以包含用户关联数据
type FlowPageWithUser = FlowPage & {
  users?: {
    username: string
    email: string
  }
}

interface PageProps {
  params: {
    slug: string
  }
}

// 获取页面数据
async function getPageBySlug(slug: string): Promise<FlowPageWithUser | null> {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from("pages")
    .select(`
      *,
      page_blocks (*),
      users!inner (username, email)
    `)
    .eq("slug", slug)
    .eq("visibility", "public")
    .single()

  if (error || !data) {
    return null
  }

  return data
}

// 生成页面元数据
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const page = await getPageBySlug(params.slug)

  if (!page) {
    return {
      title: "页面不存在 - HeysMe",
    }
  }

  const heroBlock = page.blocks?.find((block) => block.type === "hero")
  const description = heroBlock?.data?.description || `${page.title} - 由 HeysMe 创建的专业职业主页`

  return {
    title: `${page.title} - HeysMe`,
    description,
    keywords: `${page.title}, HeysMe, 职业主页, 个人品牌, ${heroBlock?.data?.title || ""}`,
    authors: [{ name: page.users?.username || "HeysMe用户" }],
    openGraph: {
      title: page.title,
      description,
      type: "profile",
      url: `https://HeysMe.app/p/${page.slug}`,
      images: [
        {
          url: heroBlock?.data?.avatar || "/og-image.png",
          width: 1200,
          height: 630,
          alt: page.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description,
      images: [heroBlock?.data?.avatar || "/og-image.png"],
    },
  }
}

export default async function PublicPageView({ params }: PageProps) {
  const page = await getPageBySlug(params.slug)

  if (!page) {
    notFound()
  }

  // TODO: 记录页面访问统计
  // await recordPageView(page.id)

  return (
    <div>
      <PageRenderer page={page} />

      {/* 页面底部信息 */}
      <footer className="border-t bg-gray-50 py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-gray-600 mb-4">
            这个页面由 <strong>{page.users?.username}</strong> 使用 HeysMe 创建
          </p>
          <div className="flex justify-center gap-4">
            <a href="/create" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              创建你的专属页面
            </a>
            <span className="text-gray-300">|</span>
            <a href="/about" className="text-gray-600 hover:text-gray-700 text-sm">
              了解 HeysMe
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
