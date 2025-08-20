import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

// 模拟工具结果数据
const mockToolResults = [
  {
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
          },
          {
            name: 'Spoon-Knife',
            stars: 890,
            description: 'This repo is for demonstration purposes only.',
            language: 'HTML',
            url: 'https://github.com/octocat/Spoon-Knife'
          }
        ],
        recent_activity: [
          {
            type: 'push',
            repo: 'Hello-World',
            date: '2024-01-15T10:30:00Z'
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
      last_sync: '2024-01-15T12:00:00Z',
      page_details: [
        {
          page_id: 'page-1',
          page_title: '个人简历页面',
          last_sync: '2024-01-15T12:00:00Z',
          sync_status: 'success' as const
        },
        {
          page_id: 'page-2',
          page_title: '作品集页面',
          last_sync: '2024-01-15T11:30:00Z',
          sync_status: 'success' as const
        }
      ]
    },
    tags: ['开源', 'GitHub', '全栈开发', 'JavaScript']
  },
  {
    id: 'tr-2',
    tool_name: 'scrape_webpage',
    source_url: 'https://johndoe.com',
    extracted_data: {
      webpage: {
        title: 'John Doe - 个人作品集',
        description: '展示我的设计和开发项目',
        content_preview: '欢迎来到我的个人网站！我是一名全栈开发者，专注于现代Web技术...',
        links_count: 15,
        images_count: 8,
        metadata: {
          author: 'John Doe',
          keywords: ['设计', '开发', '作品集', '前端'],
          type: 'website',
          published_date: '2024-01-10'
        },
        extracted_links: [
          {
            text: '联系我',
            url: 'mailto:john@example.com',
            type: 'external' as const
          },
          {
            text: '项目展示',
            url: '/projects',
            type: 'internal' as const
          }
        ],
        content_sections: [
          {
            heading: '关于我',
            content: '我是一名有5年经验的全栈开发者...'
          },
          {
            heading: '技能',
            content: 'React, Node.js, Python, AWS...'
          }
        ]
      }
    },
    cache_info: {
      created_at: '2024-01-14T16:00:00Z',
      expires_at: '2024-01-15T16:00:00Z',
      hit_count: 2,
      status: 'expired' as const,
      last_accessed: '2024-01-15T10:00:00Z'
    },
    usage_stats: {
      used_in_pages: ['page-3'],
      sync_count: 1,
      last_sync: '2024-01-14T18:00:00Z',
      page_details: [
        {
          page_id: 'page-3',
          page_title: '关于页面',
          last_sync: '2024-01-14T18:00:00Z',
          sync_status: 'success' as const
        }
      ]
    },
    tags: ['作品集', '个人网站', '设计', '前端']
  },
  {
    id: 'tr-3',
    tool_name: 'extract_linkedin',
    source_url: 'https://linkedin.com/in/johndoe',
    extracted_data: {
      linkedin: {
        name: 'John Doe',
        headline: 'Senior Full Stack Developer at TechCorp',
        location: 'San Francisco, CA',
        connections: 500,
        experience_count: 4,
        skills: ['React', 'Node.js', 'Python', 'AWS', 'Docker', 'GraphQL'],
        current_position: 'Senior Full Stack Developer',
        experience: [
          {
            title: 'Senior Full Stack Developer',
            company: 'TechCorp',
            duration: '2022 - Present',
            description: '负责开发和维护大规模Web应用程序...'
          },
          {
            title: 'Full Stack Developer',
            company: 'StartupXYZ',
            duration: '2020 - 2022',
            description: '参与多个项目的前后端开发...'
          }
        ],
        education: [
          {
            school: 'Stanford University',
            degree: 'Bachelor of Science',
            field: 'Computer Science',
            year: '2016-2020'
          }
        ]
      }
    },
    cache_info: {
      created_at: '2024-01-15T09:00:00Z',
      expires_at: '2024-01-17T09:00:00Z',
      hit_count: 1,
      status: 'fresh' as const,
      last_accessed: '2024-01-15T09:00:00Z'
    },
    usage_stats: {
      used_in_pages: [],
      sync_count: 0,
      last_sync: '',
      page_details: []
    },
    tags: ['LinkedIn', '职业经历', '技能', '教育背景']
  }
]

// GET /api/content/tool-results - 获取工具结果列表
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const toolName = searchParams.get('tool_name')
    const cacheStatus = searchParams.get('cache_status')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // 模拟筛选逻辑
    let filteredResults = mockToolResults

    if (toolName) {
      filteredResults = filteredResults.filter(result => result.tool_name === toolName)
    }

    if (cacheStatus) {
      filteredResults = filteredResults.filter(result => result.cache_info.status === cacheStatus)
    }

    // 分页
    const paginatedResults = filteredResults.slice(offset, offset + limit)

    return NextResponse.json({
      success: true,
      data: {
        results: paginatedResults,
        total: filteredResults.length,
        limit,
        offset,
        has_more: offset + limit < filteredResults.length
      }
    })

  } catch (error) {
    console.error('获取工具结果失败:', error)
    return NextResponse.json(
      { success: false, error: '获取工具结果失败' },
      { status: 500 }
    )
  }
}

// POST /api/content/tool-results - 创建新的工具结果（通常由Agent调用）
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { tool_name, source_url, extracted_data, tags } = body

    // 验证必需字段
    if (!tool_name || !source_url || !extracted_data) {
      return NextResponse.json(
        { success: false, error: '缺少必需字段' },
        { status: 400 }
      )
    }

    // 生成新的工具结果
    const newResult = {
      id: `tr-${Date.now()}`,
      tool_name,
      source_url,
      extracted_data,
      cache_info: {
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24小时后过期
        hit_count: 0,
        status: 'fresh' as const,
        last_accessed: new Date().toISOString()
      },
      usage_stats: {
        used_in_pages: [],
        sync_count: 0,
        last_sync: '',
        page_details: []
      },
      tags: tags || []
    }

    // TODO: 实际存储到数据库
    // await supabase.from('tool_results').insert(newResult)

    return NextResponse.json({
      success: true,
      data: newResult
    })

  } catch (error) {
    console.error('创建工具结果失败:', error)
    return NextResponse.json(
      { success: false, error: '创建工具结果失败' },
      { status: 500 }
    )
  }
}
