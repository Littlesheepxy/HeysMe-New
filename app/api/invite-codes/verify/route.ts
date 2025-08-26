import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()
    
    if (!code || typeof code !== 'string') {
      return NextResponse.json({ 
        success: false,
        error: '请提供有效的邀请码' 
      }, { status: 400 })
    }

    const supabase = createServerClient()

    // 验证邀请码
    const { data: inviteCode, error } = await supabase
      .from('invite_codes')
      .select(`
        id,
        code,
        name,
        max_uses,
        current_uses,
        expires_at,
        permissions,
        is_active,
        created_at
      `)
      .eq('code', code.toUpperCase())
      .single()

    if (error || !inviteCode) {
      return NextResponse.json({
        success: false,
        error: '邀请码不存在或无效'
      }, { status: 404 })
    }

    // 检查邀请码状态
    if (!inviteCode.is_active) {
      return NextResponse.json({
        success: false,
        error: '邀请码已被禁用'
      }, { status: 400 })
    }

    // 检查过期时间
    if (inviteCode.expires_at && new Date(inviteCode.expires_at) < new Date()) {
      return NextResponse.json({
        success: false,
        error: '邀请码已过期'
      }, { status: 400 })
    }

    // 检查使用次数限制
    if (inviteCode.max_uses && inviteCode.current_uses >= inviteCode.max_uses) {
      return NextResponse.json({
        success: false,
        error: '邀请码使用次数已达上限'
      }, { status: 400 })
    }

    // 返回验证成功信息
    return NextResponse.json({
      success: true,
      data: {
        code: inviteCode.code,
        name: inviteCode.name,
        permissions: inviteCode.permissions,
        remainingUses: inviteCode.max_uses ? 
          Math.max(0, inviteCode.max_uses - inviteCode.current_uses) : null,
        expiresAt: inviteCode.expires_at
      }
    })

  } catch (error) {
    console.error('邀请码验证失败:', error)
    return NextResponse.json({
      success: false,
      error: '服务器错误，请稍后重试'
    }, { status: 500 })
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 })
}
