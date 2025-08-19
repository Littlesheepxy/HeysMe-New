import { headers } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { verifyWebhook } from "@clerk/nextjs/webhooks"
import { createServerClient } from "@/lib/supabase-server"

export async function POST(req: NextRequest) {
  try {
    // 🔧 使用官方推荐的 verifyWebhook 方法
    const evt = await verifyWebhook(req)
    
    const { type, data } = evt
    console.log(`🔔 [Webhook] 处理事件: ${type}, 用户ID: ${data.id}`)

    // 创建Supabase服务端客户端
    const supabase = createServerClient()

    switch (type) {
      case "user.created": {
        console.log(`👤 [Webhook] 处理用户创建: ${data.id}`)
        
        const userEmail = data.email_addresses?.[0]?.email_address || ''
        
        // 🆕 检查是否有关联的邀请码使用记录
        const { data: inviteUsage } = await supabase
          .from('invite_code_usages')
          .select(`
            id,
            invite_code_id,
            invite_codes (
              permissions,
              code,
              name
            )
          `)
          .eq('email', userEmail)
          .is('user_id', null) // 找到还未关联用户ID的使用记录
          .single()

        console.log(`🎟️ [Webhook] 邀请码使用记录:`, inviteUsage ? '找到' : '未找到')

        // 🚫 强制要求邀请码（可通过环境变量控制）
        const requireInviteCode = process.env.REQUIRE_INVITE_CODE !== 'false'
        
        if (requireInviteCode && !inviteUsage) {
          console.error('❌ [Webhook] 注册被拒绝: 没有有效的邀请码')
          return NextResponse.json({
            error: '注册失败：HeysMe 目前为内测阶段，需要有效的邀请码才能注册。请先在注册页面验证邀请码。',
            code: 'INVITE_CODE_REQUIRED',
            userEmail: userEmail,
            hint: '请访问 /sign-up 页面获取邀请码并验证后再注册'
          }, { status: 403 })
        }

        // 从邀请码获取用户权限
        let userPermissions = {
          plan: "free",
          projects: ["HeysMe"],
          metadata: {}
        }

        if (inviteUsage?.invite_codes?.[0]?.permissions) {
          const inviteCode = inviteUsage.invite_codes[0]
          const permissions = inviteCode.permissions
          userPermissions = {
            plan: permissions.plan || "free",
            projects: permissions.projects || ["HeysMe"],
            metadata: {
              inviteCode: inviteCode.code,
              inviteCodeName: inviteCode.name,
              inviteCodeUsedAt: new Date().toISOString(),
              specialAccess: permissions.special_access || false,
              grantedFeatures: permissions.features || []
            }
          }
          
          console.log(`🎁 [Webhook] 应用邀请码权限:`, {
            code: inviteCode.code,
            plan: userPermissions.plan,
            features: (userPermissions.metadata as any).grantedFeatures
          })
        }
        
        // 🔧 按照官方文档正确提取用户数据
        const userData = {
          id: data.id, // Clerk用户ID
          email: userEmail,
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          avatar_url: data.image_url || '',
          projects: userPermissions.projects,
          plan: userPermissions.plan,
          default_model: "claude-sonnet-4-20250514",
          metadata: userPermissions.metadata,
          created_at: new Date(data.created_at).toISOString(),
          updated_at: new Date(data.updated_at).toISOString(),
        }

        console.log(`📝 [Webhook] 用户数据:`, {
          id: userData.id,
          email: userData.email,
          first_name: userData.first_name,
          last_name: userData.last_name,
          avatar_url: userData.avatar_url ? '有头像' : '无头像'
        })

        const { data: user, error } = await supabase
          .from('users')
          .insert(userData)
          .select()
          .single()

        if (error) {
          console.error('❌ [Webhook] 创建用户失败:', error)
          return NextResponse.json({ 
            error: error.message,
            code: error.code,
            details: error.details 
          }, { status: 500 })
        }

        // 🆕 如果有邀请码使用记录，更新记录关联用户ID
        if (inviteUsage) {
          const { error: updateError } = await supabase
            .from('invite_code_usages')
            .update({ 
              user_id: data.id,
              metadata: {
                userLinkedAt: new Date().toISOString(),
                registrationCompleted: true
              }
            })
            .eq('id', inviteUsage.id)

          if (updateError) {
            console.error('❌ [Webhook] 更新邀请码使用记录失败:', updateError)
          } else {
            console.log('✅ [Webhook] 邀请码使用记录已关联用户')
          }
        }

        console.log('✅ [Webhook] 用户创建成功:', user.id)
        return NextResponse.json({ 
          success: true, 
          message: "用户创建成功",
          user: { id: user.id, email: user.email },
          inviteCodeApplied: !!inviteUsage
        })
      }

      case "user.updated": {
        console.log(`🔄 [Webhook] 处理用户更新: ${data.id}`)
        
        // 🔧 按照官方文档正确提取更新的用户数据
        const updateData = {
          email: data.email_addresses?.[0]?.email_address || '',
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          avatar_url: data.image_url || '',
          updated_at: new Date(data.updated_at).toISOString(),
        }

        console.log(`📝 [Webhook] 更新数据:`, {
          id: data.id,
          email: updateData.email,
          first_name: updateData.first_name,
          last_name: updateData.last_name,
          avatar_url: updateData.avatar_url ? '有头像' : '无头像'
        })

        const { data: user, error } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', data.id)
          .select()
          .single()

        if (error) {
          console.error('❌ [Webhook] 更新用户失败:', error)
          return NextResponse.json({ 
            error: error.message,
            code: error.code,
            details: error.details 
          }, { status: 500 })
        }

        console.log('✅ [Webhook] 用户更新成功:', user.id)
        return NextResponse.json({ 
          success: true, 
          message: "用户更新成功",
          user: { id: user.id, email: user.email }
        })
      }

      case "user.deleted": {
        console.log(`🗑️ [Webhook] 处理用户删除: ${data.id}`)
        
        // 软删除：添加deleted标记而不是物理删除
        const { data: user, error } = await supabase
          .from('users')
          .update({ 
            deleted: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', data.id)
          .select()
          .single()

        if (error) {
          console.error('❌ [Webhook] 删除用户失败:', error)
          return NextResponse.json({ 
            error: error.message,
            code: error.code,
            details: error.details 
          }, { status: 500 })
        }

        console.log('✅ [Webhook] 用户删除成功:', user.id)
        return NextResponse.json({ 
          success: true, 
          message: "用户删除成功",
          user: { id: user.id }
        })
      }

      default: {
        console.log(`ℹ️ [Webhook] 未处理的事件类型: ${type}`)
        return NextResponse.json({ 
          success: true, 
          message: `事件 ${type} 已接收但未处理` 
        })
      }
    }

  } catch (error) {
    console.error('❌ [Webhook] 验证或处理失败:', error)
    return NextResponse.json({ 
      error: "Webhook处理失败", 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 400 })
  }
} 