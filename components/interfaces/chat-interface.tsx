/**
 * 聊天界面组件 - 重构版
 *
 * 功能：
 * - 支持新建和编辑两种模式
 * - 集成Agent工作流系统
 * - 实时数据源集成
 * - 智能消息处理
 * - 品牌青绿色彩设计系统
 *
 * TODO:
 * - [ ] 添加消息搜索功能
 * - [ ] 支持消息导出
 * - [ ] 实现语音输入
 * - [ ] 添加快捷回复
 */

"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Send,
  Sparkles,
  User,
  Bot,
  Mic,
  Paperclip,
  MoreHorizontal,
  ArrowLeft,
  Database,
  Brain,
  Palette,
} from "lucide-react"
import { useTheme } from "@/contexts/theme-context"
import { DataSourceIntegration } from "@/components/integration/data-source-integration"
import { ModelSelector } from "@/components/navigation/model-selector"
import { MarkdownRenderer } from "@/components/ui/markdown-renderer"
import type { ChatMessage, ChatSession, ChatOption } from "@/types/chat"
import type { FlowPage } from "@/types/HeysMe"

interface ChatInterfaceProps {
  session?: ChatSession | null
  project?: FlowPage
  projectId?: string
  isGenerating?: boolean
  onSendMessage?: (message: string, option?: any) => void
  onDataIntegration?: (sourceId: string, data: any) => void
  onProjectUpdate?: (project: FlowPage) => void
  showBackButton?: boolean
  backUrl?: string
  className?: string
}

export default function ChatInterface({
  session,
  project,
  projectId,
  isGenerating = false,
  onSendMessage,
  onDataIntegration,
  onProjectUpdate,
  showBackButton = false,
  backUrl = "/dashboard",
  className = "",
}: ChatInterfaceProps) {
  const { theme } = useTheme()
  const [inputValue, setInputValue] = useState("")
  const [selectedModel, setSelectedModel] = useState("claude-sonnet-4-20250514")
  const [activeTab, setActiveTab] = useState("chat")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [session?.messages])

  // 发送消息
  const handleSendMessage = () => {
    if (!inputValue.trim() || isGenerating) return

    onSendMessage?.(inputValue)
    setInputValue("")
  }

  // 处理选项点击
  const handleOptionClick = (option: any) => {
    onSendMessage?.(option.label, option)
  }

  // 处理键盘事件
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // 获取当前Agent状态
  const getCurrentAgentInfo = () => {
    if (!session?.messages?.length) return null

    // 从最新的系统消息中获取当前状态
    const latestSystemMessage = session.messages
      .filter(msg => msg.type === "system")
      .pop()
    
    if (!latestSystemMessage?.metadata?.system_state?.current_stage) return null

    const currentAgent = latestSystemMessage.metadata.system_state.current_stage
    const agentInfo = {
      data_collection: { name: "信息收集助手", icon: Database, color: "text-emerald-500" },
      summary: { name: "分析总结助手", icon: Brain, color: "text-teal-500" },
      page_creation: { name: "页面创建助手", icon: Palette, color: "text-cyan-500" },
    }

    return agentInfo[currentAgent as keyof typeof agentInfo]
  }

  const currentAgent = getCurrentAgentInfo()

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* 聊天头部 - 品牌渐变背景 */}
      <div
        className={`flex items-center justify-between p-4 border-b transition-all duration-300 ${
          theme === "light" 
            ? "bg-brand-gradient border-emerald-200/50 shadow-brand" 
            : "bg-brand-gradient-dark border-emerald-700/50 shadow-brand-lg"
        }`}
      >
        <div className="flex items-center gap-3">
          {showBackButton && (
            <Button variant="brand-ghost" size="sm" className="text-white hover:bg-white/20" asChild>
              <a href={backUrl}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                返回
              </a>
            </Button>
          )}

          <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>

          <div>
            <h2 className="font-semibold text-white">
              {project ? `编辑 ${project.title}` : "HeysMe AI 助手"}
            </h2>
            {currentAgent && (
              <div className="flex items-center gap-2 mt-1">
                <currentAgent.icon className={`w-3 h-3 text-white/80`} />
                <span className="text-xs text-white/80">
                  当前：{currentAgent.name}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ModelSelector selectedModel={selectedModel} onModelChange={setSelectedModel} />
          <Button variant="brand-ghost" size="sm" className="text-white hover:bg-white/20">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="flex-1 flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          {/* 标签栏 - 品牌色 */}
          <TabsList className="grid w-full grid-cols-2 mx-4 mt-4 bg-emerald-50 border border-emerald-200">
            <TabsTrigger 
              value="chat" 
              className="data-[state=active]:bg-brand-gradient data-[state=active]:text-white data-[state=active]:shadow-brand"
            >
              对话
            </TabsTrigger>
            <TabsTrigger 
              value="data"
              className="data-[state=active]:bg-brand-gradient data-[state=active]:text-white data-[state=active]:shadow-brand"
            >
              数据源
            </TabsTrigger>
          </TabsList>

          {/* 标签内容 */}
          <TabsContent value="chat" className="flex-1 flex flex-col m-0">
            {/* 消息列表 */}
            <ScrollArea className="flex-1 p-4 brand-scrollbar">
              <div className="space-y-4">
                {session?.messages?.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    onOptionClick={handleOptionClick}
                    isGenerating={isGenerating}
                    theme={theme}
                  />
                ))}

                {isGenerating && (
                  <div className="flex items-center gap-3 animate-brand-fade-up">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-emerald-100">
                        <Bot className="w-4 h-4 text-emerald-600" />
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`flex items-center gap-2 backdrop-blur-sm rounded-2xl px-4 py-3 border glass-brand ${
                        theme === "light" ? "border-emerald-200/50" : "border-emerald-700/30"
                      }`}
                    >
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 rounded-full animate-brand-loading-dots"></div>
                        <div className="w-2 h-2 rounded-full animate-brand-loading-dots" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 rounded-full animate-brand-loading-dots" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                      <span className="text-sm text-emerald-600">AI 正在思考...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* 输入区域 - 品牌色设计 */}
            <div className={`p-4 border-t ${theme === "light" ? "bg-emerald-50/50 border-emerald-200" : "bg-emerald-950/30 border-emerald-700"}`}>
              <div className="flex items-end gap-3 max-w-4xl mx-auto">
                <Button variant="brand-ghost" size="icon" className="mb-2">
                  <Paperclip className="w-4 h-4" />
                </Button>

                <div className="flex-1 relative">
                  <Input
                    variant="brand"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="输入消息..."
                    className="min-h-[48px] resize-none rounded-xl pr-12"
                    disabled={isGenerating}
                  />
                  <Button
                    variant="brand"
                    size="icon-sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isGenerating}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>

                <Button variant="brand-ghost" size="icon" className="mb-2">
                  <Mic className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="data" className="flex-1 m-0">
            <DataSourceIntegration
              onDataIntegrated={(sourceId, data) => {
                onDataIntegration?.(sourceId, data)
                setActiveTab("chat") // 切换回聊天标签
              }}
              className="h-full"
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

interface MessageBubbleProps {
  message: ChatMessage
  onOptionClick: (option: any) => void
  isGenerating: boolean
  theme: "light" | "dark"
}

function MessageBubble({ message, onOptionClick, isGenerating, theme }: MessageBubbleProps) {
  const isUser = message.type === "user"

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} animate-brand-fade-up`}>
      <div className={`flex items-start gap-3 max-w-[80%] ${isUser ? "flex-row-reverse" : "flex-row"}`}>
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarFallback className={isUser ? "bg-brand-gradient text-white" : "bg-emerald-100"}>
            {isUser ? (
              <User className="w-4 h-4" />
            ) : (
              <Bot className="w-4 h-4 text-emerald-600" />
            )}
          </AvatarFallback>
        </Avatar>

        <div className={`flex flex-col gap-2 ${isUser ? "items-end" : "items-start"}`}>
          <div
            className={`rounded-2xl px-4 py-3 ${
              isUser
                ? "bg-brand-gradient text-white shadow-brand ml-4"
                : theme === "light"
                ? "bg-white border border-emerald-200 text-gray-900 border-l-4 border-l-emerald-500 shadow-sm mr-4"
                : "bg-gray-800 border border-emerald-700 text-white border-l-4 border-l-emerald-400 mr-4"
            }`}
          >
            <MarkdownRenderer content={message.content} />
          </div>

          {/* 消息选项按钮 */}
          {message.metadata?.options && message.metadata.options.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {message.metadata.options.map((option: ChatOption, index: number) => (
                <Button
                  key={option.id || index}
                  variant="brand-outline"
                  size="sm"
                  onClick={() => onOptionClick(option)}
                  className="text-xs"
                >
                  {option.label}
                </Button>
              ))}
            </div>
          )}

          {/* 时间戳 - 品牌色 */}
          <div className={`text-xs ${theme === "light" ? "text-emerald-600" : "text-emerald-400"}`}>
            {new Date(message.timestamp).toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  )
}
