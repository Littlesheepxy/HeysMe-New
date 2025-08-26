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
        
        // 🔧 按照官方文档正确提取用户数据
        const userData = {
          id: data.id, // Clerk用户ID
          email: data.email_addresses?.[0]?.email_address || '',
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          avatar_url: data.image_url || '',
          projects: ["HeysMe"], // 默认给予HeysMe访问权限
          plan: "free",
          default_model: "claude-sonnet-4-20250514",
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

        console.log('✅ [Webhook] 用户创建成功:', user.id)
        return NextResponse.json({ 
          success: true, 
          message: "用户创建成功",
          user: { id: user.id, email: user.email }
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