import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { auth } from '@clerk/nextjs/server'

// 验证管理员权限
async function isAdmin(userId: string): Promise<boolean> {
  const supabase = createServerClient()
  
  const { data: user } = await supabase
    .from('users')
    .select('plan, projects, metadata')
    .eq('id', userId)
    .single()
  
  if (!user) return false
  
  return (
    user.plan === 'admin' ||
    user.projects?.includes('admin') ||
    user.metadata?.role === 'admin'
  )
}

// 获取单个邀请码详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ 
        success: false,
        error: '需要登录才能查看邀请码详情' 
      }, { status: 401 })
    }

    // 验证管理员权限
    if (!(await isAdmin(userId))) {
      return NextResponse.json({
        success: false,
        error: '权限不足'
      }, { status: 403 })
    }

    const supabase = createServerClient()
    const { id } = params

    // 获取邀请码详情
    const { data: inviteCode, error } = await supabase
      .from('invite_codes')
      .select(`
        *,
        users!invite_codes_created_by_fkey(email, first_name, last_name),
        invite_code_batches(name, description)
      `)
      .eq('id', id)
      .single()

    if (error || !inviteCode) {
      return NextResponse.json({
        success: false,
        error: '邀请码不存在'
      }, { status: 404 })
    }

    // 获取使用记录
    const { data: usages, error: usagesError } = await supabase
      .from('invite_code_usages')
      .select(`
        *,
        users(email, first_name, last_name, avatar_url)
      `)
      .eq('invite_code_id', id)
      .order('used_at', { ascending: false })

    if (usagesError) {
      console.error('获取使用记录失败:', usagesError)
    }

    return NextResponse.json({
      success: true,
      data: {
        inviteCode,
        usages: usages || []
      }
    })

  } catch (error) {
    console.error('获取邀请码详情失败:', error)
    return NextResponse.json({
      success: false,
      error: '获取邀请码详情失败'
    }, { status: 500 })
  }
}

// 更新邀请码
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ 
        success: false,
        error: '需要登录才能更新邀请码' 
      }, { status: 401 })
    }

    // 验证管理员权限
    if (!(await isAdmin(userId))) {
      return NextResponse.json({
        success: false,
        error: '权限不足'
      }, { status: 403 })
    }

    const {
      name,
      maxUses,
      expiresAt,
      permissions,
      isActive
    } = await request.json()

    const supabase = createServerClient()
    const { id } = params

    // 构建更新数据
    const updateData: any = {}
    
    if (name !== undefined) updateData.name = name
    if (maxUses !== undefined) updateData.max_uses = maxUses
    if (expiresAt !== undefined) updateData.expires_at = expiresAt
    if (permissions !== undefined) updateData.permissions = permissions
    if (isActive !== undefined) updateData.is_active = isActive

    // 更新邀请码
    const { data: updatedCode, error } = await supabase
      .from('invite_codes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('更新邀请码失败:', error)
      return NextResponse.json({
        success: false,
        error: '更新邀请码失败'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: updatedCode,
      message: '邀请码更新成功'
    })

  } catch (error) {
    console.error('更新邀请码失败:', error)
    return NextResponse.json({
      success: false,
      error: '更新邀请码失败'
    }, { status: 500 })
  }
}

// 删除邀请码
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ 
        success: false,
        error: '需要登录才能删除邀请码' 
      }, { status: 401 })
    }

    // 验证管理员权限
    if (!(await isAdmin(userId))) {
      return NextResponse.json({
        success: false,
        error: '权限不足'
      }, { status: 403 })
    }

    const supabase = createServerClient()
    const { id } = params

    // 检查邀请码是否已被使用
    const { data: usages, error: usagesError } = await supabase
      .from('invite_code_usages')
      .select('id')
      .eq('invite_code_id', id)
      .limit(1)

    if (usagesError) {
      console.error('检查使用记录失败:', usagesError)
      return NextResponse.json({
        success: false,
        error: '检查邀请码使用情况失败'
      }, { status: 500 })
    }

    if (usages && usages.length > 0) {
      return NextResponse.json({
        success: false,
        error: '无法删除已被使用的邀请码，建议禁用代替删除'
      }, { status: 400 })
    }

    // 删除邀请码
    const { error } = await supabase
      .from('invite_codes')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('删除邀请码失败:', error)
      return NextResponse.json({
        success: false,
        error: '删除邀请码失败'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: '邀请码删除成功'
    })

  } catch (error) {
    console.error('删除邀请码失败:', error)
    return NextResponse.json({
      success: false,
      error: '删除邀请码失败'
    }, { status: 500 })
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 })
}
