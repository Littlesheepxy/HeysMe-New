import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

// 模拟单个工具结果数据获取
const mockToolResults = {
  'tr-1': {
    id: 'tr-1',
    tool_name: 'analyze_github',
    source_url: 'https://github.com/octocat',
    extracted_data: {
      github: {
        username: 'octocat',
        name: 'The Octocat',
        bio: 'GitHub mascot and open source enthusiast',
        followers: 1234,
        following: 567,
        public_repos: 89,
        avatar_url: 'https://github.com/octocat.png',
        top_languages: ['JavaScript', 'Python', 'TypeScript', 'Go'],
        top_repos: [
          {
            name: 'Hello-World',
            stars: 1200,
            description: 'My first repository on GitHub!',
            language: 'JavaScript',
            url: 'https://github.com/octocat/Hello-World'
          }
        ]
      }
    },
    cache_info: {
      created_at: '2024-01-15T08:00:00Z',
      expires_at: '2024-01-16T08:00:00Z',
      hit_count: 5,
      status: 'cached' as const,
      last_accessed: '2024-01-15T14:30:00Z'
    },
    usage_stats: {
      used_in_pages: ['page-1', 'page-2'],
      sync_count: 3,
      last_sync: '2024-01-15T12:00:00Z'
    },
    tags: ['开源', 'GitHub', '全栈开发']
  }
}

// GET /api/content/tool-results/[id] - 获取特定工具结果
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // TODO: 从数据库获取
    const result = mockToolResults[id as keyof typeof mockToolResults]

    if (!result) {
      return NextResponse.json(
        { success: false, error: '工具结果不存在' },
        { status: 404 }
      )
    }

    // 更新访问计数和时间
    result.cache_info.hit_count += 1
    result.cache_info.last_accessed = new Date().toISOString()

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('获取工具结果失败:', error)
    return NextResponse.json(
      { success: false, error: '获取工具结果失败' },
      { status: 500 }
    )
  }
}

// PUT /api/content/tool-results/[id] - 更新工具结果
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()

    // TODO: 从数据库获取并更新
    const result = mockToolResults[id as keyof typeof mockToolResults]

    if (!result) {
      return NextResponse.json(
        { success: false, error: '工具结果不存在' },
        { status: 404 }
      )
    }

    // 更新字段
    if (body.tags) result.tags = body.tags
    if (body.extracted_data) result.extracted_data = body.extracted_data

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('更新工具结果失败:', error)
    return NextResponse.json(
      { success: false, error: '更新工具结果失败' },
      { status: 500 }
    )
  }
}

// DELETE /api/content/tool-results/[id] - 删除工具结果
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // TODO: 从数据库删除
    const result = mockToolResults[id as keyof typeof mockToolResults]

    if (!result) {
      return NextResponse.json(
        { success: false, error: '工具结果不存在' },
        { status: 404 }
      )
    }

    // 检查是否有页面在使用
    if (result.usage_stats.used_in_pages.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: '该工具结果正在被页面使用，无法删除',
          used_pages: result.usage_stats.used_in_pages
        },
        { status: 400 }
      )
    }

    // 删除逻辑
    delete (mockToolResults as any)[id]

    return NextResponse.json({
      success: true,
      message: '工具结果已删除'
    })

  } catch (error) {
    console.error('删除工具结果失败:', error)
    return NextResponse.json(
      { success: false, error: '删除工具结果失败' },
      { status: 500 }
    )
  }
}
