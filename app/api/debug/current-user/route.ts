import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { auth } from '@clerk/nextjs/server'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ 
        success: false,
        error: '未登录',
        userId: null
      })
    }

    const supabase = createServerClient()
    
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, plan, projects, metadata, created_at')
      .eq('id', userId)
      .single()

    if (error) {
      return NextResponse.json({
        success: false,
        error: '用户不存在于数据库中',
        userId,
        dbError: error.message
      })
    }

    // 检查管理员权限
    const isAdmin = (
      user.plan === 'admin' ||
      user.projects?.includes('admin') ||
      user.metadata?.role === 'admin'
    )

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        isAdmin,
        clerkUserId: userId
      },
      permissions: {
        canGenerateInviteCodes: isAdmin,
        canManageUsers: isAdmin
      }
    })

  } catch (error) {
    console.error('获取当前用户信息失败:', error)
    return NextResponse.json({
      success: false,
      error: '服务器错误'
    }, { status: 500 })
  }
}
