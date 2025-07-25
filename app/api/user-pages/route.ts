import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const offset = (page - 1) * limit

    let query = supabase
      .from('user_pages')
      .select(`
        *,
        users!inner(
          username,
          full_name,
          avatar_url,
          email
        )
      `)
      .eq('is_shared_to_plaza', true)
      .order('updated_at', { ascending: false })

    // 过滤分类
    if (category && category !== '全部') {
      query = query.eq('category', category)
    }

    // 搜索功能
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data, error, count } = await query
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('获取用户页面失败:', error)
      return NextResponse.json({ error: '获取数据失败' }, { status: 500 })
    }

    // 转换数据格式
    const formattedData = data?.map(page => ({
      id: page.id,
      title: page.title,
      description: page.description,
      category: page.category,
      tags: page.tags || [],
      industryTags: page.industry_tags || [],
      location: page.location,
      updatedAt: formatDate(page.updated_at),
      viewCount: page.view_count || 0,
      favoriteCount: page.favorite_count || 0,
      avatar: page.users?.avatar_url || '/placeholder-user.jpg',
      verified: false, // 默认为false，因为表中没有此字段
      trending: false, // 默认为false，因为表中没有此字段
      username: page.users?.username,
      displayName: page.users?.full_name,
      content: page.content
    }))

    return NextResponse.json({
      data: formattedData,
      total: count,
      page,
      totalPages: Math.ceil((count || 0) / limit)
    })

  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 1) return '1天前更新'
  if (diffDays === 2) return '2天前更新'
  if (diffDays < 7) return `${diffDays}天前更新`
  if (diffDays < 30) return `${Math.ceil(diffDays / 7)}周前更新`
  return `${Math.ceil(diffDays / 30)}个月前更新`
} 