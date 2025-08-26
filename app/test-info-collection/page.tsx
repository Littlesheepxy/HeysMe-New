"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Send, Bot, User, Settings, RefreshCw } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'agent'
  content: string
  timestamp: string
  metadata?: any
}

interface TestSession {
  id: string
  metadata: {
    infoCollectionWelcomeSent?: boolean
    infoCollectionHistory?: any[]
    collectedInfo?: any
    toolResults?: any[]
  }
}

export default function TestInfoCollectionPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [userInput, setUserInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [session, setSession] = useState<TestSession>({
    id: `test-session-${Date.now()}`,
    metadata: {}
  })
  const [welcomeData, setWelcomeData] = useState({
    user_role: '软件工程师',
    use_case: '个人简历',
    commitment_level: '认真制作',
    style: '现代简约'
  })

  const addMessage = (role: 'user' | 'agent', content: string, metadata?: any) => {
    const message: Message = {
      id: `msg-${Date.now()}-${Math.random()}`,
      role,
      content,
      timestamp: new Date().toISOString(),
      metadata
    }
    setMessages(prev => [...prev, message])
    return message
  }

  const testAgent = async () => {
    if (!userInput.trim()) return

    setLoading(true)
    
    // 添加用户消息
    addMessage('user', userInput)
    const currentInput = userInput
    setUserInput('')

    try {
      // 调用测试 API
      const response = await fetch('/api/test/info-collection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_input: currentInput,
          session_data: session,
          welcome_data: welcomeData
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let accumulatedResponse = ''
      let currentMessageId = ''

      if (reader) {
        // 创建初始的 agent 消息
        const agentMessage = addMessage('agent', '')
        currentMessageId = agentMessage.id

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))
                
                if (data.immediate_display?.reply) {
                  accumulatedResponse += data.immediate_display.reply
                  
                  // 更新消息内容
                  setMessages(prev => prev.map(msg => 
                    msg.id === currentMessageId 
                      ? { ...msg, content: accumulatedResponse, metadata: data.system_state }
                      : msg
                  ))
                }

                // 更新会话状态
                if (data.system_state) {
                  setSession(prev => ({
                    ...prev,
                    metadata: {
                      ...prev.metadata,
                      ...data.system_state.metadata
                    }
                  }))
                }
              } catch (e) {
                console.warn('解析流式数据失败:', line)
              }
            }
          }
        }
      }

    } catch (error) {
      console.error('测试失败:', error)
      addMessage('agent', `❌ 测试失败: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setLoading(false)
    }
  }

  const resetSession = () => {
    setMessages([])
    setSession({
      id: `test-session-${Date.now()}`,
      metadata: {}
    })
  }

  const updateWelcomeData = (field: string, value: string) => {
    setWelcomeData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">信息收集 Agent 测试</h1>
          <p className="text-muted-foreground">
            直接测试 OptimizedInfoCollectionAgent 的功能
          </p>
        </div>
        <Button onClick={resetSession} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          重置会话
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 配置面板 */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="mr-2 h-5 w-5" />
              配置参数
            </CardTitle>
            <CardDescription>
              模拟 Welcome Agent 传递的数据
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">用户角色</label>
              <select 
                className="w-full mt-1 p-2 border rounded"
                value={welcomeData.user_role}
                onChange={(e) => updateWelcomeData('user_role', e.target.value)}
              >
                <option>软件工程师</option>
                <option>产品经理</option>
                <option>设计师</option>
                <option>学生</option>
                <option>创业者</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">使用目的</label>
              <select 
                className="w-full mt-1 p-2 border rounded"
                value={welcomeData.use_case}
                onChange={(e) => updateWelcomeData('use_case', e.target.value)}
              >
                <option>个人简历</option>
                <option>作品集</option>
                <option>个人品牌</option>
                <option>求职展示</option>
                <option>创业项目</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">承诺级别</label>
              <select 
                className="w-full mt-1 p-2 border rounded"
                value={welcomeData.commitment_level}
                onChange={(e) => updateWelcomeData('commitment_level', e.target.value)}
              >
                <option>试一试</option>
                <option>快速体验</option>
                <option>认真制作</option>
                <option>专业制作</option>
              </select>
            </div>

            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-2">会话状态</h4>
              <div className="space-y-1 text-xs">
                <div>会话ID: {session.id.slice(-8)}</div>
                <div>欢迎消息: {session.metadata.infoCollectionWelcomeSent ? '已发送' : '未发送'}</div>
                <div>收集信息: {Object.keys(session.metadata.collectedInfo || {}).length} 项</div>
                <div>工具结果: {(session.metadata.toolResults || []).length} 个</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 对话面板 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bot className="mr-2 h-5 w-5" />
              对话测试
            </CardTitle>
            <CardDescription>
              与信息收集 Agent 进行对话
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* 消息列表 */}
            <div className="space-y-4 max-h-96 overflow-y-auto mb-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  开始对话来测试信息收集 Agent...
                  <div className="mt-2 text-sm">
                    💡 试试发送链接：GitHub、LinkedIn 或其他网站
                  </div>
                </div>
              )}
              
              {messages.map((message) => (
                <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex gap-2 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      message.role === 'user' ? 'bg-blue-500' : 'bg-green-500'
                    }`}>
                      {message.role === 'user' ? (
                        <User className="w-4 h-4 text-white" />
                      ) : (
                        <Bot className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div className={`p-3 rounded-lg ${
                      message.role === 'user' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-white dark:bg-gray-800 border'
                    }`}>
                      <div className="whitespace-pre-wrap">{message.content}</div>
                      {message.metadata && (
                        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                          <div className="flex flex-wrap gap-1">
                            {message.metadata.intent && (
                              <Badge variant="secondary" className="text-xs">
                                {message.metadata.intent}
                              </Badge>
                            )}
                            {message.metadata.progress && (
                              <Badge variant="outline" className="text-xs">
                                {message.metadata.progress}%
                              </Badge>
                            )}
                            {message.metadata.tool_calls_executed && (
                              <Badge variant="default" className="text-xs">
                                工具: {message.metadata.tool_calls_executed}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                      <div className="mt-1 text-xs opacity-60">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 输入区域 */}
            <div className="flex gap-2">
              <Textarea
                placeholder="输入消息... 试试发送 GitHub 链接或其他信息"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    testAgent()
                  }
                }}
                className="flex-1"
                rows={2}
              />
              <Button 
                onClick={testAgent} 
                disabled={loading || !userInput.trim()}
                className="px-4"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="mt-2 text-xs text-muted-foreground">
              按 Enter 发送，Shift+Enter 换行
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 测试建议 */}
      <Card>
        <CardHeader>
          <CardTitle>测试建议</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">🔧 工具调用测试</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• 发送 GitHub 链接</li>
                <li>• 发送 LinkedIn 链接</li>
                <li>• 发送普通网站链接</li>
                <li>• 同时发送多个链接</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">📊 结束条件测试</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• 进行多轮对话</li>
                <li>• 提供详细信息</li>
                <li>• 观察何时自动推进</li>
                <li>• 测试不同承诺级别</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">🎯 边界情况测试</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• 发送无效链接</li>
                <li>• 发送空消息</li>
                <li>• 重置会话测试</li>
                <li>• 修改配置参数</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
