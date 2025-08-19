import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { auth } from '@clerk/nextjs/server'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    const { code, email, userAgent, ipAddress } = await request.json()
    
    if (!code || typeof code !== 'string') {
      return NextResponse.json({ 
        success: false,
        error: '请提供有效的邀请码' 
      }, { status: 400 })
    }

    const supabase = createServerClient()

    // 先验证邀请码（重复验证逻辑以确保安全）
    const { data: inviteCode, error: verifyError } = await supabase
      .from('invite_codes')
      .select(`
        id,
        code,
        name,
        max_uses,
        current_uses,
        expires_at,
        permissions,
        is_active
      `)
      .eq('code', code.toUpperCase())
      .single()

    if (verifyError || !inviteCode) {
      return NextResponse.json({
        success: false,
        error: '邀请码不存在或无效'
      }, { status: 404 })
    }

    // 重复所有验证检查
    if (!inviteCode.is_active) {
      return NextResponse.json({
        success: false,
        error: '邀请码已被禁用'
      }, { status: 400 })
    }

    if (inviteCode.expires_at && new Date(inviteCode.expires_at) < new Date()) {
      return NextResponse.json({
        success: false,
        error: '邀请码已过期'
      }, { status: 400 })
    }

    if (inviteCode.max_uses && inviteCode.current_uses >= inviteCode.max_uses) {
      return NextResponse.json({
        success: false,
        error: '邀请码使用次数已达上限'
      }, { status: 400 })
    }

    // 检查是否已经使用过该邀请码（同一邮箱或用户ID）
    const { data: existingUsage } = await supabase
      .from('invite_code_usages')
      .select('id')
      .eq('invite_code_id', inviteCode.id)
      .or(`email.eq.${email}${userId ? `,user_id.eq.${userId}` : ''}`)
      .limit(1)

    if (existingUsage && existingUsage.length > 0) {
      return NextResponse.json({
        success: false,
        error: '该邀请码已被使用过'
      }, { status: 400 })
    }

    // 记录邀请码使用
    const { data: usageRecord, error: usageError } = await supabase
      .from('invite_code_usages')
      .insert({
        invite_code_id: inviteCode.id,
        code: inviteCode.code,
        user_id: userId || null,
        email: email,
        ip_address: ipAddress || null,
        user_agent: userAgent || null,
        metadata: {
          registrationSource: 'web',
          timestamp: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (usageError) {
      console.error('记录邀请码使用失败:', usageError)
      return NextResponse.json({
        success: false,
        error: '记录使用信息失败'
      }, { status: 500 })
    }

    // 如果有用户ID，更新用户权限
    if (userId) {
      const permissions = inviteCode.permissions as any
      
      const { error: updateError } = await supabase
        .from('users')
        .update({
          plan: permissions.plan || 'free',
          projects: permissions.projects || ['HeysMe'],
          metadata: {
            inviteCode: inviteCode.code,
            inviteCodeUsedAt: new Date().toISOString(),
            specialAccess: permissions.special_access || false,
            grantedFeatures: permissions.features || []
          }
        })
        .eq('id', userId)

      if (updateError) {
        console.error('更新用户权限失败:', updateError)
        // 不返回错误，因为邀请码使用记录已经成功创建
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        usageId: usageRecord.id,
        permissions: inviteCode.permissions,
        message: '邀请码使用成功！欢迎加入 HeysMe 内测！'
      }
    })

  } catch (error) {
    console.error('邀请码使用失败:', error)
    return NextResponse.json({
      success: false,
      error: '服务器错误，请稍后重试'
    }, { status: 500 })
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 })
}
