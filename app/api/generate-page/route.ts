import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getModelById } from "@/types/models"

// HeysMe页面结构Schema
const heysMePageSchema = z.object({
  title: z.string(),
  theme: z.enum(["zen", "creative", "devgrid", "minimal", "bold"]),
  layout: z.enum(["grid", "hero", "twocol", "stack"]),
  created_at: z.string(),
  updated_at: z.string(),
  blocks: z.array(
    z.object({
      id: z.string(),
      type: z.enum(["hero", "project", "skill", "link", "recruit", "about", "contact"]),
      data: z.any(),
      position: z.number(),
      is_visible: z.boolean().default(true),
    }),
  ),
})

export async function POST(request: NextRequest) {
  try {
    const { designStrategy, collectedData, model_id = "claude-sonnet-4-20250514" } = await request.json()

    const modelConfig = getModelById(model_id)
    if (!modelConfig) {
      return NextResponse.json({ success: false, error: "不支持的模型" }, { status: 400 })
    }

    // 构建生成prompt
    const prompt = `
你是一个专业的HeysMe页面生成专家。根据设计策略和收集的用户数据，生成一个完整的个人展示页面。

## 设计策略：
${JSON.stringify(designStrategy, null, 2)}

## 用户数据：
${JSON.stringify(collectedData, null, 2)}

请生成一个HeysMe页面结构，包含：

1. **基础信息**：
   - title: 页面标题
   - theme: 主题风格 (zen/creative/devgrid/minimal/bold)
   - layout: 布局类型 (grid/hero/twocol/stack)
   - created_at/updated_at: 时间戳

2. **页面模块(blocks)**，每个模块包含：
   - id: 唯一标识符
   - type: 模块类型
   - data: 具体数据内容
   - position: 排序位置
   - is_visible: 是否显示

## 模块类型和数据结构：

### hero模块 (个人介绍)：
{
  "name": "真实姓名",
  "title": "职位/身份",
  "description": "个人简介",
  "tagline": "个人标语",
  "avatar": "头像URL",
  "background": "背景图URL"
}

### project模块 (项目展示)：
{
  "title": "项目经验",
  "projects": [
    {
      "name": "项目名称",
      "description": "项目描述", 
      "image": "项目图片URL",
      "tech": ["技术栈"],
      "link": "项目链接",
      "github": "Github链接"
    }
  ]
}

### skill模块 (技能标签)：
{
  "title": "核心技能",
  "skills": ["技能1", "技能2", ...]
}

### link模块 (社交链接)：
{
  "title": "联系方式",
  "links": [
    {
      "type": "github/linkedin/email/website",
      "label": "显示文本", 
      "url": "链接地址"
    }
  ]
}

### about模块 (详细介绍)：
{
  "title": "关于我",
  "content": "详细的个人介绍和经历"
}

### contact模块 (联系信息)：
{
  "title": "联系我",
  "email": "邮箱",
  "phone": "电话",
  "location": "位置",
  "social": {...}
}

要求：
1. 基于真实用户数据生成，不使用占位符
2. 确保内容专业且吸引人
3. 模块顺序符合设计策略的优先级
4. 样式和布局匹配用户身份类型
5. 所有URL使用真实的placeholder图片服务

现在时间：${new Date().toISOString()}
`

    // 统一调用 /api/ai/generate
    const aiResponse = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        options: {
          schema: heysMePageSchema,
          maxTokens: 32000,
        }
      })
    })

    const aiResult = await aiResponse.json()

    if (!aiResponse.ok || !aiResult.success) {
      throw new Error(aiResult.error || 'AI API 调用失败')
    }

    // 检查返回结果类型并提取数据
    if (!('object' in aiResult.data)) {
      throw new Error('生成结果格式不正确');
    }

    const generatedData = aiResult.data.object as z.infer<typeof heysMePageSchema>;

    // 为生成的页面添加ID
    const pageData = {
      ...generatedData,
      id: `page-${Date.now()}`,
      user_id: "demo-user", 
      slug: `demo-page-${Date.now()}`,
      is_public: true,
      meta: {
        generated_by: "agent-system",
        model: modelConfig.name,
        generation_time: new Date().toISOString()
      }
    }

    return NextResponse.json({
      success: true,
      data: pageData,
      model: modelConfig.name,
      provider: modelConfig.provider,
    })
  } catch (error) {
    console.error("页面生成失败:", error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "页面生成失败" 
    }, { status: 500 })
  }
}
