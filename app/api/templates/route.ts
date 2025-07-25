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
    const sortBy = searchParams.get('sortBy') || 'newest'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const offset = (page - 1) * limit

    let query = supabase
      .from('templates')
      .select(`
        *,
        users!inner(
          username,
          full_name,
          avatar_url
        )
      `)
      .eq('status', 'published')

    // 过滤分类
    if (category && category !== '全部') {
      query = query.eq('category', category)
    }

    // 搜索功能
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // 排序
    switch (sortBy) {
      case 'popular':
        query = query.order('fork_count', { ascending: false })
        break
      case 'trending':
        query = query.eq('is_trending', true).order('created_at', { ascending: false })
        break
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false })
        break
    }

    const { data, error, count } = await query
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('获取模板失败:', error)
      return NextResponse.json({ error: '获取数据失败' }, { status: 500 })
    }

    // 转换数据格式
    const formattedData = data?.map(template => ({
      id: template.id,
      title: template.title,
      description: template.description,
      category: template.category,
      tags: template.tags || [],
      designTags: template.design_tags || [],
      creator: {
        name: template.users?.full_name || template.users?.username,
        avatar: template.users?.avatar_url || '/placeholder-user.jpg',
        verified: false // 默认为false，因为表中没有此字段
      },
      forkCount: template.fork_count || 0,
      useCount: template.use_count || 0,
      viewCount: template.view_count || 0,
      favoriteCount: 0, // 默认为0，因为表中没有此字段
      isFeatured: template.is_featured || false,
      trending: false, // 默认为false，因为表中没有此字段
      thumbnail: '/placeholder.jpg', // 默认缩略图，因为表中没有此字段
      createdAt: formatDate(template.created_at),
      difficulty: 'intermediate', // 默认难度，因为表中没有此字段
      content: template.sanitized_content
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      title, 
      description, 
      category, 
      tags, 
      designTags, 
      content,
      userId 
    } = body

    const { data, error } = await supabase
      .from('templates')
      .insert({
        title,
        description,
        category,
        tags,
        design_tags: designTags,
        sanitized_content: content,
        creator_id: userId,
        status: 'published',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('创建模板失败:', error)
      return NextResponse.json({ error: '创建模板失败' }, { status: 500 })
    }

    return NextResponse.json({ data })

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
  
  if (diffDays === 1) return '1天前'
  if (diffDays === 2) return '2天前'
  if (diffDays < 7) return `${diffDays}天前`
  if (diffDays < 30) return `${Math.ceil(diffDays / 7)}周前`
  return `${Math.ceil(diffDays / 30)}个月前`
} 