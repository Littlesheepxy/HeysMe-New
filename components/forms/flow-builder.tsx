"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowRight, ArrowLeft, Sparkles, CheckCircle, AlertCircle } from "lucide-react"
import type { UserInput } from "@/types/HeysMe"

interface FlowBuilderProps {
  onComplete: (input: UserInput) => void
  isGenerating?: boolean
  className?: string
}

// 步骤配置 - 定义整个流程的结构
const STEPS = [
  {
    id: "role",
    title: "你的身份",
    description: "告诉我们你是谁",
    icon: "👤",
    helpText: "这将帮助我们为你选择合适的页面风格和内容结构",
  },
  {
    id: "purpose",
    title: "使用目的",
    description: "你想用这个页面做什么",
    icon: "🎯",
    helpText: "明确目标有助于我们优化页面的重点和布局",
  },
  {
    id: "style",
    title: "表达风格",
    description: "选择你喜欢的风格",
    icon: "🎨",
    helpText: "风格将影响页面的视觉设计和交互体验",
  },
  {
    id: "priority",
    title: "展示重点",
    description: "选择要重点展示的内容",
    icon: "⭐",
    helpText: "我们会根据你的选择调整内容的优先级和布局",
  },
]

// 风格选项配置 - 每种风格都有明确的适用场景
const STYLE_OPTIONS = [
  {
    value: "zen",
    label: "极简禅意",
    description: "简洁优雅，专注内容",
    color: "bg-gray-100 text-gray-800",
    suitable: "设计师、艺术家、作家",
  },
  {
    value: "creative",
    label: "创意炫酷",
    description: "个性张扬，视觉冲击",
    color: "bg-purple-100 text-purple-800",
    suitable: "创意工作者、营销人员",
  },
  {
    value: "devgrid",
    label: "科技感",
    description: "现代简约，技术范",
    color: "bg-blue-100 text-blue-800",
    suitable: "开发者、工程师、技术专家",
  },
  {
    value: "minimal",
    label: "现代简约",
    description: "干净利落，专业感",
    color: "bg-green-100 text-green-800",
    suitable: "商务人士、咨询师、经理",
  },
  {
    value: "bold",
    label: "大胆前卫",
    description: "突破传统，引人注目",
    color: "bg-red-100 text-red-800",
    suitable: "创业者、演讲者、网红",
  },
]

// 展示优先级选项 - 涵盖职业发展的各个方面
const PRIORITY_OPTIONS = [
  { value: "projects", label: "项目作品", icon: "🚀", description: "展示你的实际工作成果" },
  { value: "skills", label: "技能专长", icon: "💡", description: "突出你的专业能力" },
  { value: "experience", label: "工作经历", icon: "💼", description: "展示你的职业发展轨迹" },
  { value: "education", label: "教育背景", icon: "🎓", description: "展示你的学术成就" },
  { value: "articles", label: "文章博客", icon: "📝", description: "展示你的思考和见解" },
  { value: "contact", label: "联系方式", icon: "📞", description: "方便他人联系你" },
  { value: "social", label: "社交媒体", icon: "🌐", description: "展示你的社交影响力" },
  { value: "recruit", label: "招聘信息", icon: "👥", description: "如果你在招聘团队成员" },
]

export default function FlowBuilder({ onComplete, isGenerating, className = "" }: FlowBuilderProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<Partial<UserInput>>({
    display_priority: [],
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // 计算进度百分比
  const progress = ((currentStep + 1) / STEPS.length) * 100

  // 验证当前步骤的数据
  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {}

    switch (currentStep) {
      case 0: // 角色验证
        if (!formData.role?.trim()) {
          newErrors.role = "请输入你的角色或职位"
        } else if (formData.role.length < 2) {
          newErrors.role = "角色描述至少需要2个字符"
        }
        break
      case 1: // 目的验证
        if (!formData.purpose?.trim()) {
          newErrors.purpose = "请描述你的使用目的"
        } else if (formData.purpose.length < 5) {
          newErrors.purpose = "请提供更详细的目的描述"
        }
        break
      case 2: // 风格验证
        if (!formData.style) {
          newErrors.style = "请选择一种风格"
        }
        break
      case 3: // 优先级验证
        if (!formData.display_priority?.length) {
          newErrors.priority = "请至少选择一个展示重点"
        }
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 处理下一步
  const handleNext = () => {
    if (!validateCurrentStep()) return

    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      // 最后一步，提交数据
      onComplete(formData as UserInput)
    }
  }

  // 处理上一步
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      setErrors({}) // 清除错误信息
    }
  }

  // 切换优先级选项
  const togglePriority = (value: string) => {
    const current = formData.display_priority || []
    const updated = current.includes(value) ? current.filter((item) => item !== value) : [...current, value]

    setFormData({ ...formData, display_priority: updated })

    // 清除优先级错误
    if (updated.length > 0 && errors.priority) {
      setErrors({ ...errors, priority: "" })
    }
  }

  // 渲染步骤内容
  const renderStepContent = () => {
    const step = STEPS[currentStep]

    switch (currentStep) {
      case 0: // 角色输入
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">{step.icon}</div>
              <p className="text-gray-600">{step.helpText}</p>
            </div>

            <div>
              <Label htmlFor="role" className="text-base font-medium">
                你的角色或职位 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="role"
                placeholder="例如：AI 工程师、独立设计师、应届毕业生..."
                value={formData.role || ""}
                onChange={(e) => {
                  setFormData({ ...formData, role: e.target.value })
                  if (errors.role) setErrors({ ...errors, role: "" })
                }}
                className={`mt-2 text-base ${errors.role ? "border-red-500" : ""}`}
                autoFocus
              />
              {errors.role && (
                <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {errors.role}
                </div>
              )}
            </div>

            {/* 快速选择选项 */}
            <div>
              <Label className="text-sm text-gray-600">或选择常见角色：</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {["AI工程师", "产品经理", "设计师", "创业者", "学生"].map((role) => (
                  <Badge
                    key={role}
                    variant="outline"
                    className="cursor-pointer hover:bg-blue-50"
                    onClick={() => setFormData({ ...formData, role })}
                  >
                    {role}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )

      case 1: // 目的输入
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">{step.icon}</div>
              <p className="text-gray-600">{step.helpText}</p>
            </div>

            <div>
              <Label htmlFor="purpose" className="text-base font-medium">
                使用目的 <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="purpose"
                placeholder="例如：找工作、展示作品、寻求合作、个人品牌建设..."
                value={formData.purpose || ""}
                onChange={(e) => {
                  setFormData({ ...formData, purpose: e.target.value })
                  if (errors.purpose) setErrors({ ...errors, purpose: "" })
                }}
                className={`mt-2 text-base ${errors.purpose ? "border-red-500" : ""}`}
                rows={3}
                autoFocus
              />
              {errors.purpose && (
                <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {errors.purpose}
                </div>
              )}
            </div>

            {/* 目的建议 */}
            <div>
              <Label className="text-sm text-gray-600">常见目的参考：</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {["求职找工作", "展示作品集", "商务合作", "个人品牌", "学术交流", "创业展示"].map((purpose) => (
                  <Badge
                    key={purpose}
                    variant="outline"
                    className="cursor-pointer hover:bg-blue-50 justify-center py-2"
                    onClick={() => setFormData({ ...formData, purpose })}
                  >
                    {purpose}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )

      case 2: // 风格选择
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">{step.icon}</div>
              <p className="text-gray-600">{step.helpText}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {STYLE_OPTIONS.map((option) => (
                <Card
                  key={option.value}
                  className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 ${
                    formData.style === option.value ? "ring-2 ring-blue-500 bg-blue-50" : "hover:bg-gray-50"
                  }`}
                  onClick={() => {
                    setFormData({ ...formData, style: option.value })
                    if (errors.style) setErrors({ ...errors, style: "" })
                  }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-lg">{option.label}</h3>
                      {formData.style === option.value && <CheckCircle className="w-5 h-5 text-blue-500" />}
                    </div>
                    <p className="text-gray-600 mb-3">{option.description}</p>
                    <Badge className={option.color} variant="secondary">
                      适合：{option.suitable}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>

            {errors.style && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                {errors.style}
              </div>
            )}
          </div>
        )

      case 3: // 优先级选择
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">{step.icon}</div>
              <p className="text-gray-600">{step.helpText}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {PRIORITY_OPTIONS.map((option) => (
                <Card
                  key={option.value}
                  className={`cursor-pointer transition-all duration-300 hover:shadow-md ${
                    formData.display_priority?.includes(option.value)
                      ? "ring-2 ring-blue-500 bg-blue-50"
                      : "hover:bg-gray-50"
                  }`}
                  onClick={() => togglePriority(option.value)}
                >
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl mb-2">{option.icon}</div>
                    <h4 className="font-medium mb-1">{option.label}</h4>
                    <p className="text-xs text-gray-600">{option.description}</p>
                    {formData.display_priority?.includes(option.value) && (
                      <CheckCircle className="w-4 h-4 text-blue-500 mx-auto mt-2" />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {formData.display_priority && formData.display_priority.length > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800 mb-2">已选择 {formData.display_priority.length} 个展示重点：</p>
                <div className="flex flex-wrap gap-2">
                  {formData.display_priority.map((priority) => {
                    const option = PRIORITY_OPTIONS.find((opt) => opt.value === priority)
                    return (
                      <Badge key={priority} variant="default">
                        {option?.icon} {option?.label}
                      </Badge>
                    )
                  })}
                </div>
              </div>
            )}

            {errors.priority && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                {errors.priority}
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      {/* 进度指示器 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">创建你的 HeysMe</h2>
          <span className="text-sm text-gray-500">
            {currentStep + 1} / {STEPS.length}
          </span>
        </div>

        <Progress value={progress} className="mb-4" />

        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  index <= currentStep ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-500"
                }`}
              >
                {index < currentStep ? <CheckCircle className="w-5 h-5" /> : index + 1}
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`w-16 h-1 mx-2 transition-colors ${index < currentStep ? "bg-blue-500" : "bg-gray-200"}`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="text-center mt-4">
          <h3 className="text-xl font-semibold">{STEPS[currentStep].title}</h3>
          <p className="text-gray-600">{STEPS[currentStep].description}</p>
        </div>
      </div>

      {/* 步骤内容 */}
      <Card className="mb-8">
        <CardContent className="p-8">{renderStepContent()}</CardContent>
      </Card>

      {/* 导航按钮 */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={handleBack} disabled={currentStep === 0} className="px-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          上一步
        </Button>

        <Button onClick={handleNext} disabled={isGenerating} className="px-6">
          {isGenerating ? (
            <>
              <Sparkles className="w-4 h-4 mr-2 animate-spin" />
              生成中...
            </>
          ) : currentStep === STEPS.length - 1 ? (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              生成页面
            </>
          ) : (
            <>
              下一步
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
