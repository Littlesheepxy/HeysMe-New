import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { auth } from '@clerk/nextjs/server'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const body = await request.json()
    const { type, portfolioUrl, workSamples, credentials, socialLinks, specialties } = body

    const supabase = createServerClient()

    // 检查是否已有相同类型的认证申请
    const { data: existingVerification } = await supabase
      .from('creator_verifications')
      .select('*')
      .eq('user_id', userId)
      .eq('verification_type', type)
      .single()

    if (existingVerification && existingVerification.verification_status === 'pending') {
      return NextResponse.json({ 
        error: '您已有一个待审核的认证申请，请耐心等待审核结果' 
      }, { status: 400 })
    }

    // 创建认证申请记录
    const { data: verificationData, error } = await supabase
      .from('creator_verifications')
      .insert({
        user_id: userId,
        verification_type: type,
        verification_status: 'pending',
        portfolio_url: portfolioUrl,
        work_samples: workSamples || [],
        credentials: credentials || {},
        social_links: socialLinks || {},
        specialties: specialties || [],
        verification_level: 1 // 默认1级认证
      })
      .select()
      .single()

    if (error) {
      console.error('创建认证申请失败:', error)
      throw error
    }

    return NextResponse.json({
      success: true,
      message: '认证申请已提交，我们将在3-5个工作日内审核',
      data: {
        verificationId: verificationData.id,
        status: 'pending',
        estimatedReviewTime: '3-5个工作日'
      }
    })

  } catch (error) {
    console.error('创作者认证申请失败:', error)
    return NextResponse.json({ 
      error: '申请提交失败，请稍后重试' 
    }, { status: 500 })
  }
}

// 获取用户的认证状态
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const supabase = createServerClient()

    // 获取用户的所有认证记录
    const { data: verifications, error } = await supabase
      .from('creator_verifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('获取认证状态失败:', error)
      throw error
    }

    return NextResponse.json({
      success: true,
      data: verifications || []
    })

  } catch (error) {
    console.error('获取认证状态失败:', error)
    return NextResponse.json({ 
      error: '获取认证状态失败' 
    }, { status: 500 })
  }
} 