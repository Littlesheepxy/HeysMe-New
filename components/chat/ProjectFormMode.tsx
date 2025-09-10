"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, X, Sparkles, Code, Palette, Users, Globe } from "lucide-react"
import { ProjectRequirement } from "@/lib/routers/simple-message-router"

interface ProjectFormModeProps {
  onBack: () => void
  onSubmit: (requirement: ProjectRequirement, generatedPrompt: string) => void
}

export function ProjectFormMode({ onBack, onSubmit }: ProjectFormModeProps) {
  const [formData, setFormData] = useState<ProjectRequirement>({
    projectType: 'webapp',
    projectName: '',
    description: '',
    targetAudience: '',
    keyFeatures: [],
    designStyle: 'modern',
    techStack: [],
    referenceUrl: '',
    additionalInfo: ''
  })

  const [newFeature, setNewFeature] = useState('')
  const [newTech, setNewTech] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const projectTypes = [
    { value: 'website', label: '企业官网', icon: Globe },
    { value: 'webapp', label: 'Web应用', icon: Code },
    { value: 'landing', label: '落地页', icon: Palette },
    { value: 'portfolio', label: '作品集', icon: Users },
    { value: 'ecommerce', label: '电商网站', icon: Globe },
    { value: 'blog', label: '博客', icon: Globe }
  ]

  const designStyles = [
    { value: 'modern', label: '现代简约' },
    { value: 'minimal', label: '极简主义' },
    { value: 'colorful', label: '色彩丰富' },
    { value: 'professional', label: '商务专业' },
    { value: 'creative', label: '创意设计' }
  ]

  const commonTechs = [
    'React', 'Vue', 'Angular', 'Next.js', 'Nuxt.js', 'TypeScript', 'JavaScript',
    'Node.js', 'Express', 'MongoDB', 'PostgreSQL', 'MySQL', 'Tailwind CSS',
    'Bootstrap', 'Material-UI', 'Ant Design', 'Redux', 'Zustand', 'GraphQL'
  ]

  const addFeature = () => {
    if (newFeature.trim() && !formData.keyFeatures.includes(newFeature.trim())) {
      setFormData(prev => ({
        ...prev,
        keyFeatures: [...prev.keyFeatures, newFeature.trim()]
      }))
      setNewFeature('')
    }
  }

  const removeFeature = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      keyFeatures: prev.keyFeatures.filter(f => f !== feature)
    }))
  }

  const addTech = (tech: string) => {
    if (!formData.techStack.includes(tech)) {
      setFormData(prev => ({
        ...prev,
        techStack: [...prev.techStack, tech]
      }))
    }
  }

  const removeTech = (tech: string) => {
    setFormData(prev => ({
      ...prev,
      techStack: prev.techStack.filter(t => t !== tech)
    }))
  }

  const generatePrompt = (data: ProjectRequirement): string => {
    return `请帮我创建一个${data.projectType === 'website' ? '网站' : 'Web应用'}项目：

## 项目信息
- 项目名称：${data.projectName}
- 项目类型：${projectTypes.find(t => t.value === data.projectType)?.label}
- 设计风格：${designStyles.find(s => s.value === data.designStyle)?.label}

## 项目描述
${data.description}

## 目标用户
${data.targetAudience}

## 核心功能
${data.keyFeatures.map(feature => `- ${feature}`).join('\n')}

## 技术栈要求
${data.techStack.join(', ')}

${data.referenceUrl ? `## 参考网站\n${data.referenceUrl}` : ''}

${data.additionalInfo ? `## 补充说明\n${data.additionalInfo}` : ''}

请根据以上需求创建一个完整的项目，包括所有必要的文件和代码。`
  }

  const handleSubmit = async () => {
    if (!formData.projectName.trim() || !formData.description.trim()) {
      return
    }

    setIsSubmitting(true)
    const generatedPrompt = generatePrompt(formData)
    
    // 模拟一个短暂的处理时间
    setTimeout(() => {
      onSubmit(formData, generatedPrompt)
      setIsSubmitting(false)
    }, 500)
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-4 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回模式选择
        </Button>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
            普通模式 - 项目需求表单
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            请详细填写您的项目需求，我们将为您生成专业的开发提示
          </p>
        </motion.div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-blue-500" />
            <span>项目基本信息</span>
          </CardTitle>
          <CardDescription>
            告诉我们您想要创建的项目类型和基本信息
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Project Type */}
          <div className="space-y-2">
            <Label htmlFor="projectType">项目类型</Label>
            <Select
              value={formData.projectType}
              onValueChange={(value) => setFormData(prev => ({ ...prev, projectType: value as any }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择项目类型" />
              </SelectTrigger>
              <SelectContent>
                {projectTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center space-x-2">
                      <type.icon className="w-4 h-4" />
                      <span>{type.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Project Name */}
          <div className="space-y-2">
            <Label htmlFor="projectName">项目名称</Label>
            <Input
              id="projectName"
              value={formData.projectName}
              onChange={(e) => setFormData(prev => ({ ...prev, projectName: e.target.value }))}
              placeholder="例如：我的个人博客、公司官网、在线商城等"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">项目描述</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="详细描述您的项目用途、主要功能和期望效果..."
              rows={4}
            />
          </div>

          {/* Target Audience */}
          <div className="space-y-2">
            <Label htmlFor="targetAudience">目标用户</Label>
            <Input
              id="targetAudience"
              value={formData.targetAudience}
              onChange={(e) => setFormData(prev => ({ ...prev, targetAudience: e.target.value }))}
              placeholder="例如：企业客户、个人用户、开发者、学生等"
            />
          </div>

          {/* Key Features */}
          <div className="space-y-2">
            <Label>核心功能</Label>
            <div className="flex space-x-2">
              <Input
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                placeholder="添加一个核心功能..."
                onKeyPress={(e) => e.key === 'Enter' && addFeature()}
              />
              <Button onClick={addFeature} type="button">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.keyFeatures.map((feature, index) => (
                <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                  <span>{feature}</span>
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-red-500"
                    onClick={() => removeFeature(feature)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          {/* Design Style */}
          <div className="space-y-2">
            <Label htmlFor="designStyle">设计风格</Label>
            <Select
              value={formData.designStyle}
              onValueChange={(value) => setFormData(prev => ({ ...prev, designStyle: value as any }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择设计风格" />
              </SelectTrigger>
              <SelectContent>
                {designStyles.map(style => (
                  <SelectItem key={style.value} value={style.value}>
                    {style.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tech Stack */}
          <div className="space-y-2">
            <Label>技术栈</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {commonTechs.map(tech => (
                <Button
                  key={tech}
                  type="button"
                  variant={formData.techStack.includes(tech) ? "default" : "outline"}
                  size="sm"
                  onClick={() => formData.techStack.includes(tech) ? removeTech(tech) : addTech(tech)}
                >
                  {tech}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.techStack.map((tech, index) => (
                <Badge key={index} className="flex items-center space-x-1">
                  <span>{tech}</span>
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-red-500"
                    onClick={() => removeTech(tech)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          {/* Reference URL */}
          <div className="space-y-2">
            <Label htmlFor="referenceUrl">参考网站（可选）</Label>
            <Input
              id="referenceUrl"
              value={formData.referenceUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, referenceUrl: e.target.value }))}
              placeholder="https://example.com"
            />
          </div>

          {/* Additional Info */}
          <div className="space-y-2">
            <Label htmlFor="additionalInfo">补充说明（可选）</Label>
            <Textarea
              id="additionalInfo"
              value={formData.additionalInfo}
              onChange={(e) => setFormData(prev => ({ ...prev, additionalInfo: e.target.value }))}
              placeholder="其他需要说明的特殊要求或细节..."
              rows={3}
            />
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <Button
              onClick={handleSubmit}
              disabled={!formData.projectName.trim() || !formData.description.trim() || isSubmitting}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold py-3"
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>生成中...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4" />
                  <span>生成项目并开始开发</span>
                </div>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
