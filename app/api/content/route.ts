import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { getAuth } from '@clerk/nextjs/server'

// 内容类型定义
interface ContentItem {
  id: string
  user_id: string
  session_id?: string
  type: 'personal' | 'professional' | 'project' | 'education' | 'experience' | 'media'
  category: string
  title: string
  content: any
  tags: string[]
  used_in_pages: string[]
  source: 'manual' | 'imported' | 'ai_generated'
  sync_status: 'synced' | 'pending' | 'failed'
  created_at: string
  updated_at: string
}

// GET - 获取用户的所有内容
export async function GET(request: NextRequest) {
  try {
    const { userId } = getAuth(request)
    if (!userId) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const supabase = createServerClient()
    
    // 从chat_sessions表中获取用户的collected_data
    const { data: sessions, error: sessionsError } = await supabase
      .from('chat_sessions')
      .select('id, collected_data, created_at, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (sessionsError) {
      console.error('获取会话数据失败:', sessionsError)
      return NextResponse.json({ error: '获取数据失败' }, { status: 500 })
    }

    // 将collected_data转换为ContentItem格式
    const contentItems: ContentItem[] = []
    
    sessions?.forEach(session => {
      const collectedData = session.collected_data as any
      
      // 个人信息
      if (collectedData?.personal) {
        contentItems.push({
          id: `personal-${session.id}`,
          user_id: userId,
          session_id: session.id,
          type: 'personal',
          category: 'basic_info',
          title: '个人基础信息',
          content: collectedData.personal,
          tags: ['个人信息', '基础资料'],
          used_in_pages: [], // TODO: 从pages表查询
          source: 'ai_generated',
          sync_status: 'synced',
          created_at: session.created_at,
          updated_at: session.updated_at
        })
      }

      // 专业技能
      if (collectedData?.professional?.skills?.length > 0) {
        contentItems.push({
          id: `skills-${session.id}`,
          user_id: userId,
          session_id: session.id,
          type: 'professional',
          category: 'skills',
          title: '技术技能',
          content: { skills: collectedData.professional.skills },
          tags: ['技能', '专业能力'],
          used_in_pages: [],
          source: 'ai_generated',
          sync_status: 'synced',
          created_at: session.created_at,
          updated_at: session.updated_at
        })
      }

      // 项目经历
      if (collectedData?.projects?.length > 0) {
        collectedData.projects.forEach((project: any, index: number) => {
          contentItems.push({
            id: `project-${session.id}-${index}`,
            user_id: userId,
            session_id: session.id,
            type: 'project',
            category: 'tech_projects',
            title: project.name || project.title || `项目 ${index + 1}`,
            content: project,
            tags: ['项目', '作品集'],
            used_in_pages: [],
            source: 'ai_generated',
            sync_status: 'synced',
            created_at: session.created_at,
            updated_at: session.updated_at
          })
        })
      }

      // 工作经历
      if (collectedData?.experience?.length > 0) {
        collectedData.experience.forEach((exp: any, index: number) => {
          contentItems.push({
            id: `experience-${session.id}-${index}`,
            user_id: userId,
            session_id: session.id,
            type: 'experience',
            category: 'positions',
            title: `${exp.company || '工作经历'} - ${exp.position || ''}`,
            content: exp,
            tags: ['工作经历', '职业发展'],
            used_in_pages: [],
            source: 'ai_generated',
            sync_status: 'synced',
            created_at: session.created_at,
            updated_at: session.updated_at
          })
        })
      }

      // 教育背景
      if (collectedData?.education?.length > 0) {
        collectedData.education.forEach((edu: any, index: number) => {
          contentItems.push({
            id: `education-${session.id}-${index}`,
            user_id: userId,
            session_id: session.id,
            type: 'education',
            category: 'degrees',
            title: `${edu.school || '教育经历'} - ${edu.degree || ''}`,
            content: edu,
            tags: ['教育', '学历'],
            used_in_pages: [],
            source: 'ai_generated',
            sync_status: 'synced',
            created_at: session.created_at,
            updated_at: session.updated_at
          })
        })
      }
    })

    return NextResponse.json({
      success: true,
      data: contentItems,
      total: contentItems.length
    })

  } catch (error) {
    console.error('获取内容列表失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

// POST - 创建新内容
export async function POST(request: NextRequest) {
  try {
    const { userId } = getAuth(request)
    if (!userId) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const body = await request.json()
    const { type, category, title, content, tags, sessionId } = body

    // 验证必填字段
    if (!type || !category || !title || !content) {
      return NextResponse.json({ error: '缺少必填字段' }, { status: 400 })
    }

    const supabase = createServerClient()

    // TODO: 创建独立的content表来存储用户自定义内容
    // 目前先返回成功响应，实际存储逻辑待实现
    const newContent: ContentItem = {
      id: `manual-${Date.now()}`,
      user_id: userId,
      session_id: sessionId,
      type,
      category,
      title,
      content,
      tags: tags || [],
      used_in_pages: [],
      source: 'manual',
      sync_status: 'synced',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      data: newContent
    })

  } catch (error) {
    console.error('创建内容失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

// PUT - 更新内容
export async function PUT(request: NextRequest) {
  try {
    const { userId } = getAuth(request)
    if (!userId) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const body = await request.json()
    const { id, title, content, tags, syncStrategy } = body

    // 验证必填字段
    if (!id || !title || !content) {
      return NextResponse.json({ error: '缺少必填字段' }, { status: 400 })
    }

    const supabase = createServerClient()

    // 解析内容ID以确定更新策略
    const [contentType, sessionId, index] = id.split('-')

    if (sessionId && sessionId.startsWith('session-')) {
      // 更新chat_sessions中的collected_data
      const { data: session, error: fetchError } = await supabase
        .from('chat_sessions')
        .select('collected_data')
        .eq('id', sessionId)
        .eq('user_id', userId)
        .single()

      if (fetchError) {
        console.error('获取会话数据失败:', fetchError)
        return NextResponse.json({ error: '会话不存在' }, { status: 404 })
      }

      const collectedData = session.collected_data as any

      // 根据内容类型更新对应数据
      switch (contentType) {
        case 'personal':
          collectedData.personal = content
          break
        case 'skills':
          if (!collectedData.professional) collectedData.professional = {}
          collectedData.professional.skills = content.skills
          break
        case 'project':
          if (!collectedData.projects) collectedData.projects = []
          if (index && !isNaN(parseInt(index))) {
            collectedData.projects[parseInt(index)] = content
          }
          break
        case 'experience':
          if (!collectedData.experience) collectedData.experience = []
          if (index && !isNaN(parseInt(index))) {
            collectedData.experience[parseInt(index)] = content
          }
          break
        case 'education':
          if (!collectedData.education) collectedData.education = []
          if (index && !isNaN(parseInt(index))) {
            collectedData.education[parseInt(index)] = content
          }
          break
      }

      // 更新数据库
      const { error: updateError } = await supabase
        .from('chat_sessions')
        .update({
          collected_data: collectedData,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .eq('user_id', userId)

      if (updateError) {
        console.error('更新会话数据失败:', updateError)
        return NextResponse.json({ error: '更新失败' }, { status: 500 })
      }

      // TODO: 如果syncStrategy为'immediate'，触发页面同步
      if (syncStrategy === 'immediate') {
        // 启动后台同步任务
        console.log('启动页面同步任务...')
      }

      return NextResponse.json({
        success: true,
        message: '内容更新成功',
        syncTriggered: syncStrategy === 'immediate'
      })
    }

    return NextResponse.json({ error: '不支持的内容类型' }, { status: 400 })

  } catch (error) {
    console.error('更新内容失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

// DELETE - 删除内容
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = getAuth(request)
    if (!userId) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: '缺少内容ID' }, { status: 400 })
    }

    // TODO: 实现删除逻辑
    // 注意：删除collected_data中的内容需要谨慎处理，可能影响页面生成

    return NextResponse.json({
      success: true,
      message: '内容删除成功'
    })

  } catch (error) {
    console.error('删除内容失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
} 