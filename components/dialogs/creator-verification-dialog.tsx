'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Shield, 
  Upload, 
  CheckCircle,
  AlertTriangle,
  Palette,
  Code,
  Award,
  Building
} from 'lucide-react'

interface CreatorVerificationDialogProps {
  children: React.ReactNode
  onSubmit?: (verificationData: VerificationData) => Promise<void>
}

interface VerificationData {
  type: 'designer' | 'developer' | 'expert' | 'company'
  portfolioUrl: string
  workSamples: WorkSample[]
  credentials: any
  socialLinks: any
  specialties: string[]
}

interface WorkSample {
  title: string
  description: string
  url: string
  type: 'design' | 'code' | 'project' | 'article'
}

const verificationType = [
  {
    id: 'designer',
    title: '设计师认证',
    description: 'UI/UX设计师、视觉设计师',
    icon: Palette,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  },
  {
    id: 'developer',
    title: '开发者认证',
    description: '前端、后端、全栈开发者',
    icon: Code,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  {
    id: 'expert',
    title: '专家认证',
    description: '行业专家、技术专家',
    icon: Award,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200'
  },
  {
    id: 'company',
    title: '企业认证',
    description: '公司、工作室、团队',
    icon: Building,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  }
]

const specialtiesByType = {
  designer: ['UI设计', 'UX设计', '视觉设计', '品牌设计', '插画', '动效设计', '产品设计'],
  developer: ['前端开发', '后端开发', '全栈开发', '移动开发', 'DevOps', '数据库', '架构设计'],
  expert: ['产品管理', '项目管理', '技术咨询', '创业指导', '投资顾问', '市场营销', '内容创作'],
  company: ['软件开发', '设计服务', '技术咨询', '产品研发', '创业孵化', '投资机构', '教育培训']
}

export function CreatorVerificationDialog({ children, onSubmit }: CreatorVerificationDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)

  const [verificationData, setVerificationData] = useState<VerificationData>({
    type: 'designer',
    portfolioUrl: '',
    workSamples: [],
    credentials: {},
    socialLinks: {},
    specialties: []
  })

  const handleSubmit = async () => {
    if (!onSubmit) return

    setIsLoading(true)
    try {
      await onSubmit(verificationData)
      setIsOpen(false)
      // 重置表单
      setCurrentStep(1)
      setVerificationData({
        type: 'designer',
        portfolioUrl: '',
        workSamples: [],
        credentials: {},
        socialLinks: {},
        specialties: []
      })
    } catch (error) {
      console.error('认证申请失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const addWorkSample = () => {
    setVerificationData(prev => ({
      ...prev,
      workSamples: [...prev.workSamples, {
        title: '',
        description: '',
        url: '',
        type: 'project'
      }]
    }))
  }

  const removeWorkSample = (index: number) => {
    setVerificationData(prev => ({
      ...prev,
      workSamples: prev.workSamples.filter((_, i) => i !== index)
    }))
  }

  const updateWorkSample = (index: number, field: keyof WorkSample, value: string) => {
    setVerificationData(prev => ({
      ...prev,
      workSamples: prev.workSamples.map((sample, i) => 
        i === index ? { ...sample, [field]: value } : sample
      )
    }))
  }

  const toggleSpecialty = (specialty: string) => {
    setVerificationData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty]
    }))
  }

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return verificationData.type && verificationData.specialties.length > 0
      case 2:
        return verificationData.portfolioUrl && verificationData.workSamples.length > 0
      case 3:
        return true // 社交链接是可选的
      default:
        return false
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            创作者认证申请
          </DialogTitle>
        </DialogHeader>

        {/* 步骤指示器 */}
        <div className="flex items-center justify-center space-x-4 mb-6">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step <= currentStep 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {step < currentStep ? <CheckCircle className="w-4 h-4" /> : step}
              </div>
              {step < 4 && (
                <div className={`w-12 h-0.5 mx-2 ${
                  step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* 步骤1: 选择认证类型 */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">选择认证类型</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {verificationType.map((type) => {
                  const Icon = type.icon
                  return (
                    <Card 
                      key={type.id}
                      className={`cursor-pointer transition-all duration-200 ${
                        verificationData.type === type.id 
                          ? `${type.bgColor} ${type.borderColor} border-2` 
                          : 'hover:shadow-md'
                      }`}
                      onClick={() => setVerificationData(prev => ({ 
                        ...prev, 
                        type: type.id as any,
                        specialties: [] // 重置专业领域
                      }))}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <Icon className={`w-6 h-6 ${type.color}`} />
                          <div>
                            <CardTitle className="text-base">{type.title}</CardTitle>
                            <CardDescription className="text-sm">{type.description}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  )
                })}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">选择专业领域</h3>
              <div className="flex flex-wrap gap-2">
                {specialtiesByType[verificationData.type].map((specialty) => (
                  <Badge
                    key={specialty}
                    variant={verificationData.specialties.includes(specialty) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleSpecialty(specialty)}
                  >
                    {specialty}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <Button 
                onClick={() => setCurrentStep(2)}
                disabled={!canProceedToNextStep()}
              >
                下一步
              </Button>
            </div>
          </div>
        )}

        {/* 步骤2: 作品集和案例 */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">作品集链接</h3>
              <div className="space-y-2">
                <Label htmlFor="portfolio-url">个人网站或作品集链接</Label>
                <Input
                  id="portfolio-url"
                  value={verificationData.portfolioUrl}
                  onChange={(e) => setVerificationData(prev => ({ ...prev, portfolioUrl: e.target.value }))}
                  placeholder="https://yourportfolio.com"
                />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">代表作品</h3>
              <div className="space-y-4">
                {verificationData.workSamples.map((sample, index) => (
                  <Card key={index}>
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>作品标题</Label>
                          <Input
                            value={sample.title}
                            onChange={(e) => updateWorkSample(index, 'title', e.target.value)}
                            placeholder="项目名称"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>作品链接</Label>
                          <Input
                            value={sample.url}
                            onChange={(e) => updateWorkSample(index, 'url', e.target.value)}
                            placeholder="https://..."
                          />
                        </div>
                      </div>
                      <div className="space-y-2 mt-4">
                        <Label>作品描述</Label>
                        <Textarea
                          value={sample.description}
                          onChange={(e) => updateWorkSample(index, 'description', e.target.value)}
                          placeholder="简要描述这个项目的背景、你的贡献和成果"
                          rows={3}
                        />
                      </div>
                      <div className="flex justify-end mt-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeWorkSample(index)}
                        >
                          移除
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                <Button
                  variant="outline"
                  onClick={addWorkSample}
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  添加作品
                </Button>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(1)}>
                上一步
              </Button>
              <Button 
                onClick={() => setCurrentStep(3)}
                disabled={!canProceedToNextStep()}
              >
                下一步
              </Button>
            </div>
          </div>
        )}

        {/* 步骤3: 社交媒体和资质 */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">社交媒体链接（可选）</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>GitHub</Label>
                  <Input
                    value={verificationData.socialLinks.github || ''}
                    onChange={(e) => setVerificationData(prev => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, github: e.target.value }
                    }))}
                    placeholder="https://github.com/username"
                  />
                </div>
                <div className="space-y-2">
                  <Label>LinkedIn</Label>
                  <Input
                    value={verificationData.socialLinks.linkedin || ''}
                    onChange={(e) => setVerificationData(prev => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, linkedin: e.target.value }
                    }))}
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">补充信息</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>工作经验年限</Label>
                  <select
                    value={verificationData.credentials.experience || ''}
                    onChange={(e) => setVerificationData(prev => ({
                      ...prev,
                      credentials: { ...prev.credentials, experience: e.target.value }
                    }))}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">请选择</option>
                    <option value="1-2年">1-2年</option>
                    <option value="3-5年">3-5年</option>
                    <option value="5-10年">5-10年</option>
                    <option value="10年以上">10年以上</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>所在公司/组织（可选）</Label>
                  <Input
                    value={verificationData.credentials.company || ''}
                    onChange={(e) => setVerificationData(prev => ({
                      ...prev,
                      credentials: { ...prev.credentials, company: e.target.value }
                    }))}
                    placeholder="目前就职的公司或组织"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(2)}>
                上一步
              </Button>
              <Button onClick={() => setCurrentStep(4)}>
                下一步
              </Button>
            </div>
          </div>
        )}

        {/* 步骤4: 确认提交 */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">确认信息</h3>
              <Card>
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    <div>
                      <Label className="font-medium">认证类型</Label>
                      <p className="text-sm text-muted-foreground">
                        {verificationType.find(t => t.id === verificationData.type)?.title}
                      </p>
                    </div>
                    <div>
                      <Label className="font-medium">专业领域</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {verificationData.specialties.map(s => (
                          <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className="font-medium">作品集</Label>
                      <p className="text-sm text-muted-foreground">{verificationData.portfolioUrl}</p>
                    </div>
                    <div>
                      <Label className="font-medium">代表作品</Label>
                      <p className="text-sm text-muted-foreground">{verificationData.workSamples.length} 个作品</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>认证说明：</strong>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• 我们将在3-5个工作日内审核您的申请</li>
                  <li>• 审核通过后，您将获得创作者认证标识</li>
                  <li>• 认证用户可以获得更多曝光和信任度</li>
                  <li>• 请确保提供的信息真实有效</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(3)}>
                上一步
              </Button>
              <Button onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? '提交中...' : '提交认证申请'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
} 