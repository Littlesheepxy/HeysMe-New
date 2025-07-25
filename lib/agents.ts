import type { Agent, AgentResponse } from "@/types/agent"
import type { UserInput } from "@/types/userInput"
import { ConversationalWelcomeAgent } from './agents/welcome'
import { SessionData } from '@/lib/types/session'

export const AGENTS: Record<string, Agent> = {
  HeysMe_creator: {
    id: "HeysMe_creator",
    name: "HeysMe 创建助手",
    description: "专门帮助用户创建个性化职业主页",
    systemPrompt: `你是 HeysMe 创建助手，专门帮助用户创建个性化的职业主页。
你需要通过友好的对话收集以下信息：
1. 用户的身份角色
2. 创建页面的目的
3. 喜欢的设计风格
4. 想要展示的重点内容

请保持对话自然流畅，一次只问一个问题，并提供选项让用户快速选择。`,
    capabilities: ["collect_user_info", "generate_page_structure", "provide_suggestions"],
  },
  HeysMe_editor: {
    id: "HeysMe_editor",
    name: "HeysMe 编辑助手",
    description: "帮助用户编辑和优化现有页面",
    systemPrompt: `你是 HeysMe 编辑助手，帮助用户修改和优化现有的职业主页。
你可以帮助用户：
1. 修改页面内容
2. 调整设计风格
3. 重新组织页面结构
4. 优化展示效果`,
    capabilities: ["edit_content", "modify_style", "restructure_layout"],
  },
  general_assistant: {
    id: "general_assistant",
    name: "通用助手",
    description: "回答一般性问题和提供帮助",
    systemPrompt: `你是 HeysMe 的通用助手，可以回答关于平台功能、使用方法等问题。
保持友好和专业，如果用户想要创建或编辑页面，引导他们使用相应的功能。`,
    capabilities: ["answer_questions", "provide_help", "guide_users"],
  },
}

export class AgentManager {
  private currentAgent: Agent | null = null
  private conversationState: Record<string, any> = {}
  private welcomeAgent: ConversationalWelcomeAgent
  private sessionData: SessionData | null = null

  constructor() {
    this.welcomeAgent = new ConversationalWelcomeAgent()
  }

  setAgent(agentId: string) {
    this.currentAgent = AGENTS[agentId]
    this.conversationState = {}
  }

  setSessionData(sessionData: SessionData) {
    this.sessionData = sessionData
  }

  async processMessage(
    message: string, 
    userInput?: Partial<UserInput>,
    currentStep?: string
  ): Promise<AgentResponse> {
    if (!this.currentAgent) {
      throw new Error("No agent selected")
    }

    console.log("🎯 AgentManager处理消息:", {
      agentId: this.currentAgent.id,
      message,
      userInput,
      currentStep,
      conversationStateStep: this.conversationState.step
    })

    // 如果传入了当前步骤，使用它来更新conversation state
    if (currentStep) {
      this.conversationState.step = currentStep
      console.log("🔄 更新conversation state步骤:", currentStep)
    }

    switch (this.currentAgent.id) {
      case "HeysMe_creator":
        return this.handleHeysMeCreation(message, userInput)
      case "HeysMe_editor":
        return this.handleHeysMeEditing(message, userInput)
      default:
        return this.handleGeneralChat(message)
    }
  }

  /**
   * 使用新的 Welcome Agent 进行智能意图识别
   */
  async processWithWelcomeAgent(message: string, sessionData: SessionData): Promise<any> {
    console.log("🤖 使用 Welcome Agent 处理消息:", message)
    
    try {
      // 使用 Welcome Agent 的流式处理
      const generator = this.welcomeAgent.process(
        { user_input: message },
        sessionData
      )
      
      let finalResponse: any = null
      
      // 收集所有流式响应
      for await (const response of generator) {
        finalResponse = response
      }
      
      console.log("✅ Welcome Agent 处理完成:", finalResponse)
      
      // 转换为兼容格式
      if (finalResponse?.immediate_display) {
        return {
          content: finalResponse.immediate_display.reply,
          agentResponse: finalResponse,
          sessionUpdated: true
        }
      }
      
      // 如果有交互元素，转换为选项格式
      if (finalResponse?.interaction?.elements) {
        const options = finalResponse.interaction.elements.map((element: any) => {
          if (element.type === 'select' && element.options) {
            return element.options.map((option: any) => ({
              id: option.value.toLowerCase().replace(/\s+/g, '-'),
              label: option.label,
              value: option.value,
              type: 'selection'
            }))
          }
          return []
        }).flat()
        
        return {
          content: finalResponse.interaction.title || finalResponse.interaction.description || "请选择一个选项：",
          options: options,
          agentResponse: finalResponse,
          sessionUpdated: true
        }
      }
      
      return {
        content: finalResponse?.immediate_display?.reply || "我正在处理您的请求...",
        agentResponse: finalResponse,
        sessionUpdated: true
      }
      
    } catch (error) {
      console.error("❌ Welcome Agent 处理失败:", error)
      
      // 回退到旧逻辑
      return {
        content: "抱歉，我遇到了一些问题。让我们重新开始：您想要创建什么样的页面？",
        options: [
          { id: "create", label: "🆕 创建新页面", value: "create", type: "action" },
          { id: "help", label: "❓ 了解功能", value: "help", type: "action" }
        ]
      }
    }
  }

  private handleHeysMeCreation(message: string, userInput?: Partial<UserInput>): AgentResponse {
    const state = this.conversationState

    console.log("📋 处理HeysMe创建:", {
      currentStateStep: state.step,
      userInput,
      message
    })

    // 确定当前步骤 - 优先使用传入的状态
    if (!state.step) {
      state.step = "role"
      console.log("🚀 初始化步骤为: role")
    }

    console.log("🎪 当前处理步骤:", state.step)

    switch (state.step) {
      case "role":
        if (!userInput?.role) {
          console.log("❓ 询问角色选择")
          return {
            content: "👋 很高兴为你创建 HeysMe！首先，请告诉我你的身份角色：",
            options: [
              { id: "ai-engineer", label: "🤖 AI 工程师", value: "AI工程师", type: "selection" },
              { id: "designer", label: "🎨 设计师", value: "设计师", type: "selection" },
              { id: "developer", label: "💻 开发者", value: "开发者", type: "selection" },
              { id: "student", label: "🎓 学生", value: "学生", type: "selection" },
              { id: "freelancer", label: "🌟 自由职业者", value: "自由职业者", type: "selection" },
              { id: "custom", label: "✍️ 其他", value: "custom", type: "input" },
            ],
            nextStep: "intent_clarification",
          }
        } else {
          // 已有角色信息，继续下一步
          console.log("✅ 已有角色信息，推进到intent_clarification步骤")
          state.step = "intent_clarification"
          return this.handleHeysMeCreation("", userInput)
        }

      case "intent_clarification":
        console.log("❓ 询问用户真实意图")
        return {
          content: `好的，${userInput?.role || ""}！我想了解一下你的具体需求，这样能为你提供更合适的建议：`,
          options: [
            { id: "serious", label: "🎯 认真撰写，用于求职或商务", value: "serious", type: "selection" },
            { id: "exploring", label: "👀 随便看看，了解一下功能", value: "exploring", type: "selection" },
            { id: "showcase", label: "✨ 展示作品，建立个人品牌", value: "showcase", type: "selection" },
          ],
          nextStep: "purpose",
        }

      case "purpose":
        if (!userInput?.purpose) {
          console.log("❓ 询问目的选择")
          return {
            content: `很好！现在告诉我你创建这个页面的主要目的：`,
            options: [
              { id: "job", label: "🔍 寻找工作机会", value: "寻找工作机会", type: "selection" },
              { id: "showcase", label: "🎯 展示作品技能", value: "展示作品技能", type: "selection" },
              { id: "network", label: "🤝 拓展人脉网络", value: "拓展人脉网络", type: "selection" },
              { id: "business", label: "💼 商务合作", value: "商务合作", type: "selection" },
              { id: "personal", label: "✨ 个人品牌建设", value: "个人品牌建设", type: "selection" },
              { id: "custom", label: "✍️ 其他目的", value: "custom", type: "input" },
            ],
            nextStep: "style",
          }
        } else {
          // 已有目的信息，继续下一步
          console.log("✅ 已有目的信息，推进到style步骤")
          state.step = "style"
          return this.handleHeysMeCreation("", userInput)
        }

      case "style":
        if (!userInput?.style) {
          console.log("❓ 询问风格选择")
          return {
            content: `明白了！${userInput?.purpose || ""} 是很好的目标。现在选择你喜欢的设计风格：`,
            options: [
              { id: "zen", label: "🧘 极简禅意", value: "极简禅意", type: "selection" },
              { id: "creative", label: "🎨 创意炫酷", value: "创意炫酷", type: "selection" },
              { id: "tech", label: "⚡ 科技未来", value: "科技未来", type: "selection" },
              { id: "professional", label: "💼 商务专业", value: "商务专业", type: "selection" },
              { id: "bold", label: "🔥 大胆前卫", value: "大胆前卫", type: "selection" },
            ],
            nextStep: "priority",
          }
        } else {
          // 已有风格信息，继续下一步
          console.log("✅ 已有风格信息，推进到priority步骤")
          state.step = "priority"
          return this.handleHeysMeCreation("", userInput)
        }

      case "priority":
        if (!userInput?.display_priority || userInput.display_priority.length === 0) {
          console.log("❓ 询问优先级选择")
          return {
            content: `${userInput?.style || ""} 风格很棒！最后，选择你想要重点展示的内容（可多选）：`,
            options: [
              { id: "projects", label: "🚀 项目作品", value: "projects", type: "selection" },
              { id: "skills", label: "💡 技能专长", value: "skills", type: "selection" },
              { id: "experience", label: "💼 工作经历", value: "experience", type: "selection" },
              { id: "education", label: "🎓 教育背景", value: "education", type: "selection" },
              { id: "articles", label: "📝 文章博客", value: "articles", type: "selection" },
              { id: "social", label: "🌐 社交媒体", value: "social", type: "selection" },
              { id: "done", label: "✅ 完成选择", value: "done", type: "action" },
            ],
            nextStep: "final_confirmation",
          }
        } else {
          // 已有优先级信息，进入最终确认
          console.log("✅ 已有优先级信息，推进到final_confirmation步骤")
          state.step = "final_confirmation"
          return this.handleHeysMeCreation("", userInput)
        }

      case "final_confirmation":
        console.log("📋 显示最终确认信息")
        return {
          content:
            "完美！让我确认一下收集到的信息：\n\n" +
            `👤 身份：${userInput?.role || "未设置"}\n` +
            `🎯 目的：${userInput?.purpose || "未设置"}\n` +
            `🎨 风格：${userInput?.style || "未设置"}\n` +
            `📋 重点：${userInput?.display_priority?.join("、") || "未设置"}\n\n` +
            "信息正确吗？确认后我将开始为你生成专属的 HeysMe 页面。",
          options: [
            { id: "confirm", label: "✅ 确认生成", value: "confirm", type: "action" },
            { id: "modify", label: "✏️ 修改信息", value: "modify", type: "action" },
          ],
          nextStep: "generate",
        }

      case "generate":
        // 处理生成阶段
        console.log("🚀 开始生成页面")
        return {
          content:
            "正在为你生成专属的 HeysMe 页面...\n\n" +
            "✨ 根据你的需求定制设计风格\n" +
            "🎯 优化内容布局和展示重点\n" +
            "🔧 配置最佳的功能组合\n\n" +
            "请稍等片刻，马上就好！",
          nextStep: "complete",
          metadata: { readyToGenerate: true },
        }

      default:
        return {
          content: "信息收集完成，准备生成页面！",
          nextStep: "complete",
        }
    }
  }

  private handleHeysMeEditing(message: string, userInput?: Partial<UserInput>): AgentResponse {
    return {
      content: "HeysMe 编辑功能正在开发中，敬请期待！",
      options: [
        { id: "create_new", label: "创建新页面", value: "create_new", type: "action" },
        { id: "back", label: "返回", value: "back", type: "action" },
      ],
    }
  }

  private handleGeneralChat(message: string): AgentResponse {
    return {
      content: `我是 HeysMe 助手，可以帮你创建专业的职业主页。你想要：`,
      options: [
        { id: "create", label: "🆕 创建新页面", value: "create", type: "action" },
        { id: "help", label: "❓ 了解功能", value: "help", type: "action" },
        { id: "examples", label: "👀 查看示例", value: "examples", type: "action" },
      ],
    }
  }
}
