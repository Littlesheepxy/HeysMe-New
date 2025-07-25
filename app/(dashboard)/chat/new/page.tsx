/**
 * 新建项目聊天页面
 *
 * 功能：
 * - 启动新的HeysMe创建流程
 * - 使用Agent工作流系统
 * - 实时预览生成的页面
 *
 * TODO:
 * - [ ] 添加项目模板选择
 * - [ ] 支持从现有项目复制
 * - [ ] 添加协作邀请功能
 */

"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import ChatInterface from "@/components/interfaces/chat-interface"
import { useChatSystemV2 } from "@/hooks/use-chat-system-v2"
import { supabase } from "@/lib/supabase"
import { ChatSession } from "@/types/chat"
export default function NewChatPage() {
  const router = useRouter()
  const { currentSession, isGenerating, generatedPage, createNewSession, sendMessage } =
    useChatSystemV2()

  // 检查用户认证状态
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login?redirect=/chat/new")
        return
      }
    }

    checkAuth()
  }, [router])

  // 自动创建新会话
  useEffect(() => {
    if (!currentSession) {
      createNewSession()
    }
  }, [currentSession, createNewSession])

  return (
    <div className="h-screen flex">
      {/* 聊天界面 */}
      <div className="flex-1">
        <ChatInterface
          session={currentSession as unknown as ChatSession}
          isGenerating={isGenerating}
          onSendMessage={sendMessage}
          showBackButton={true}
          backUrl="/dashboard"
        />
      </div>

      {/* 预览面板 */}
      {generatedPage && (
        <div className="w-1/2 border-l">
          {/* <PagePreview page={generatedPage} /> */}
        </div>
      )}
    </div>
  )
}
