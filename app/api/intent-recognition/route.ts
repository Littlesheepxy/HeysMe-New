import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const intentSchema = z.object({
  type: z.enum(["create_HeysMe", "edit_HeysMe", "general_chat", "help"]),
  confidence: z.number().min(0).max(1),
  entities: z.object({
    profession: z.string().optional(), // 提取的职业信息
    purpose: z.string().optional(), // 提取的目的信息
    style: z.string().optional(), // 提取的风格偏好
    urgency: z.enum(["serious", "casual", "exploring"]).optional(), // 用户的认真程度
    content_type: z.string().optional(), // 内容类型（简历、作品集等）
  }).optional(),
  reasoning: z.string(),
  extracted_info: z.object({
    role: z.string().optional(),
    purpose: z.string().optional(), 
    style: z.string().optional(),
    display_priority: z.array(z.string()).optional(),
  }).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()

    console.log("🎯 意图识别开始:", { message })

    if (!message || typeof message !== "string") {
      console.log("❌ 消息内容无效:", { message })
      return NextResponse.json(
        {
          success: false,
          error: "消息内容不能为空",
        },
        { status: 400 },
      )
    }

    const prompt = `
你是一个智能的意图识别和信息提取助手。分析用户消息，不仅要识别意图，还要提取用户已经提供的具体信息，并针对缺失信息提供合理建议。

用户消息: "${message}"

## 任务要求：

### 1. 意图识别
- create_HeysMe: 用户想要创建新的职业主页/简历/个人页面
- edit_HeysMe: 用户想要编辑或修改现有页面
- general_chat: 一般性聊天或询问
- help: 寻求帮助或了解功能

### 2. 信息提取
从用户消息中提取以下信息（如果有的话）：

**角色身份映射**：
- "软件工程师", "程序员", "开发者", "码农" → "开发者"
- "AI工程师", "算法工程师", "机器学习工程师" → "AI工程师"  
- "设计师", "UI设计师", "平面设计师" → "设计师"
- "学生", "在校生", "大学生" → "学生"
- "自由职业者", "自由职业", "独立工作者" → "自由职业者"

**目的映射**：
- "求职", "找工作", "面试", "投简历" → "寻找工作机会"
- "展示", "作品集", "项目展示" → "展示作品技能"
- "合作", "商务", "客户" → "商务合作"
- "个人品牌", "形象", "知名度" → "个人品牌建设"

**风格映射**：
- "简约", "简洁", "极简" → "极简禅意"
- "科技", "现代", "未来" → "科技未来"
- "专业", "商务", "正式" → "商务专业"
- "创意", "个性", "独特" → "创意炫酷"

**认真程度判断**：
- "试试看", "看看", "了解一下", "随便" → "exploring"
- "正式", "认真", "专业", "工作用" → "serious"  
- "玩玩", "体验", "感受" → "casual"

### 3. 缺失信息分析
分析哪些关键信息缺失，并为每个缺失项提供：
- 默认建议选项
- 问询话术
- 优先级评级

### 4. 智能推荐
基于已提取信息，为缺失项推荐最合适的选项：
- 如果是学生求职 → 推荐"商务专业"风格，重点展示"项目作品"和"技能专长"
- 如果是开发者 → 推荐"科技未来"风格，重点展示"项目作品"和"技能专长"
- 如果是设计师 → 推荐"创意炫酷"风格，重点展示"项目作品"

### 5. 输出格式
请返回JSON格式，包含：
- type: 意图类型
- confidence: 置信度(0-1)
- entities: 原始提取的实体
- reasoning: 分析推理过程
- extracted_info: 格式化后的信息，用于直接填入用户输入表单
- missing_info: 缺失信息分析和建议
- smart_suggestions: 智能推荐方案

特别注意：如果用户提到了具体的职业、目的、风格等信息，一定要准确提取并映射到对应的选项。

### 6. 缺失信息处理示例：
对于学生求职场景，如果缺失风格信息，应推荐"商务专业"或"科技未来"风格；
如果缺失展示重点，应推荐"项目作品"、"技能专长"、"教育背景"。
`

    console.log("🎯 Starting enhanced intent recognition...")
    console.log("📝 Prompt:", prompt)
    
    // 统一调用 /api/ai/generate
    const aiResponse = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        options: {
          schema: intentSchema,
          maxTokens: 32000,
        }
      })
    })

    const aiResult = await aiResponse.json()

    if (!aiResponse.ok || !aiResult.success) {
      throw new Error(aiResult.error || 'AI API 调用失败')
    }

    // 类型检查：确保返回的是带有object属性的结果
    if ('object' in aiResult.data) {
      const intentResult = aiResult.data.object as {
        type: "create_HeysMe" | "edit_HeysMe" | "general_chat" | "help";
        confidence: number;
        reasoning: string;
        entities?: any;
        extracted_info?: {
          role?: string;
          purpose?: string;
          style?: string;
          display_priority?: string[];
        };
      }
      
      console.log("✅ 增强的意图识别结果:", {
        type: intentResult.type,
        confidence: intentResult.confidence,
        reasoning: intentResult.reasoning,
        entities: intentResult.entities,
        extracted_info: intentResult.extracted_info
      })

      return NextResponse.json({
        success: true,
        data: intentResult,
        model: "Best Available Model",
      })
    } else {
      console.error("❌ 返回结果格式不正确:", aiResult.data)
      throw new Error("意图识别返回格式不正确")
    }
  } catch (error) {
    console.error("❌ 意图识别失败:", error)

    // 返回更详细的错误信息
    const errorMessage = error instanceof Error ? error.message : "意图识别失败"

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        suggestion: "请检查 API key 配置或网络连接",
      },
      { status: 500 },
    )
  }
}
