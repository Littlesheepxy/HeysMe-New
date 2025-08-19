import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { auth } from '@clerk/nextjs/server'

// 生成随机邀请码
function generateInviteCode(length: number = 8, prefix: string = ''): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = prefix.toUpperCase()
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  return result
}

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

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ 
        success: false,
        error: '需要登录才能生成邀请码' 
      }, { status: 401 })
    }

    // 验证管理员权限
    if (!(await isAdmin(userId))) {
      return NextResponse.json({
        success: false,
        error: '权限不足，只有管理员可以生成邀请码'
      }, { status: 403 })
    }

    const {
      name,
      maxUses = 1,
      expiresAt,
      permissions = {
        plan: 'free',
        features: ['chat', 'page_creation'],
        projects: ['HeysMe'],
        special_access: false,
        admin_access: false
      },
      batchId,
      count = 1,
      codePrefix = ''
    } = await request.json()

    const supabase = createServerClient()
    const generatedCodes = []

    // 生成多个邀请码
    for (let i = 0; i < count; i++) {
      let code: string
      let attempts = 0
      const maxAttempts = 10

      // 确保生成的邀请码唯一
      do {
        code = generateInviteCode(8, codePrefix)
        attempts++
        
        if (attempts >= maxAttempts) {
          throw new Error('生成唯一邀请码失败，请重试')
        }

        // 检查是否已存在
        const { data: existing } = await supabase
          .from('invite_codes')
          .select('id')
          .eq('code', code)
          .limit(1)

        if (!existing || existing.length === 0) {
          break
        }
      } while (attempts < maxAttempts)

      // 插入邀请码
      const { data: inviteCode, error } = await supabase
        .from('invite_codes')
        .insert({
          code,
          name: count > 1 ? `${name || '批量邀请码'} #${i + 1}` : name,
          created_by: userId,
          max_uses: maxUses,
          expires_at: expiresAt || null,
          permissions,
          batch_id: batchId || null,
          metadata: {
            generatedAt: new Date().toISOString(),
            generator: 'admin-panel',
            batchIndex: count > 1 ? i + 1 : null
          }
        })
        .select()
        .single()

      if (error) {
        console.error('生成邀请码失败:', error)
        throw new Error(`生成第 ${i + 1} 个邀请码失败: ${error.message}`)
      }

      generatedCodes.push(inviteCode)
    }

    return NextResponse.json({
      success: true,
      data: {
        codes: generatedCodes,
        count: generatedCodes.length,
        message: `成功生成 ${generatedCodes.length} 个邀请码`
      }
    })

  } catch (error) {
    console.error('生成邀请码失败:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '生成邀请码失败'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ 
        success: false,
        error: '需要登录才能查看邀请码' 
      }, { status: 401 })
    }

    // 验证管理员权限
    if (!(await isAdmin(userId))) {
      return NextResponse.json({
        success: false,
        error: '权限不足，只有管理员可以查看邀请码'
      }, { status: 403 })
    }

    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const status = url.searchParams.get('status') // active, expired, used_up
    const batchId = url.searchParams.get('batchId')

    const supabase = createServerClient()

    let query = supabase
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
        created_at,
        updated_at,
        batch_id,
        created_by,
        users!invite_codes_created_by_fkey(email, first_name, last_name)
      `)
      .order('created_at', { ascending: false })

    // 状态过滤
    if (status === 'active') {
      query = query
        .eq('is_active', true)
        .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
        .or('max_uses.is.null,current_uses.lt.max_uses')
    } else if (status === 'expired') {
      query = query.lt('expires_at', new Date().toISOString())
    } else if (status === 'used_up') {
      query = query
        .not('max_uses', 'is', null)
        .gte('current_uses', 'max_uses')
    }

    // 批次过滤
    if (batchId) {
      query = query.eq('batch_id', batchId)
    }

    // 分页
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: codes, error, count } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      data: {
        codes: codes || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      }
    })

  } catch (error) {
    console.error('获取邀请码列表失败:', error)
    return NextResponse.json({
      success: false,
      error: '获取邀请码列表失败'
    }, { status: 500 })
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 })
}
