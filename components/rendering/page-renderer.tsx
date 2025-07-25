"use client"

import type { MorphPage } from "@/types/morphid"
import type { PageBlock } from "@/types/HeysMe"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Github,
  Linkedin,
  Twitter,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  Star,
  Calendar,
  Award,
  Download,
  Share2,
  Heart,
  Eye,
} from "lucide-react"

interface PageRendererProps {
  page: MorphPage
  isPreview?: boolean
  showControls?: boolean
  className?: string
}

// 主题样式配置 - 每个主题都有独特的视觉风格
const THEME_STYLES = {
  zen: {
    background: "bg-gradient-to-br from-gray-50 to-white",
    card: "bg-white/80 backdrop-blur-sm border-gray-200/50",
    text: "text-gray-800",
    accent: "text-blue-600",
    button: "bg-gray-800 hover:bg-gray-700",
  },
  creative: {
    background: "bg-gradient-to-br from-purple-100 via-pink-50 to-orange-100",
    card: "bg-white/90 backdrop-blur-sm border-purple-200/50",
    text: "text-gray-800",
    accent: "text-purple-600",
    button: "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600",
  },
  devgrid: {
    background: "bg-gradient-to-br from-slate-900 to-slate-800",
    card: "bg-slate-800/80 backdrop-blur-sm border-slate-700/50",
    text: "text-white",
    accent: "text-cyan-400",
    button: "bg-cyan-500 hover:bg-cyan-600",
  },
  minimal: {
    background: "bg-white",
    card: "bg-gray-50/80 backdrop-blur-sm border-gray-200/50",
    text: "text-gray-900",
    accent: "text-green-600",
    button: "bg-green-600 hover:bg-green-700",
  },
  bold: {
    background: "bg-gradient-to-br from-red-500 via-pink-500 to-purple-600",
    card: "bg-white/90 backdrop-blur-sm border-white/20",
    text: "text-gray-800",
    accent: "text-red-600",
    button: "bg-red-600 hover:bg-red-700",
  },
}

export default function PageRenderer({
  page,
  isPreview = false,
  showControls = false,
  className = "",
}: PageRendererProps) {
  const themeStyle = THEME_STYLES[page.theme as keyof typeof THEME_STYLES] || THEME_STYLES.zen

  // 过滤并排序可见的模块
  const visibleBlocks = page.blocks?.filter((block) => block.is_visible).sort((a, b) => a.position - b.position) || []

  // 根据布局类型获取CSS类名
  const getLayoutClass = () => {
    switch (page.layout) {
      case "hero":
        return "space-y-8" // 垂直堆叠，适合突出个人品牌
      case "twocol":
        return "grid grid-cols-1 lg:grid-cols-2 gap-8" // 双列布局
      case "stack":
        return "space-y-6" // 紧密堆叠
      default:
        return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" // 网格布局
    }
  }

  // 渲染单个模块
  const renderBlock = (block: PageBlock) => {
    const blockProps = {
      block,
      theme: page.theme,
      themeStyle,
      key: block.id,
    }

    switch (block.type) {
      case "hero":
        return <HeroBlock {...blockProps} />
      case "project":
        return <ProjectBlock {...blockProps} />
      case "skill":
        return <SkillBlock {...blockProps} />
      case "link":
        return <LinkBlock {...blockProps} />
      case "about":
        return <AboutBlock {...blockProps} />
      case "contact":
        return <ContactBlock {...blockProps} />
      case "recruit":
        return <RecruitBlock {...blockProps} />
      default:
        return <CustomBlock {...blockProps} />
    }
  }

  return (
    <div className={`min-h-screen ${themeStyle.background} ${className}`}>
      {/* 预览模式提示 */}
      {isPreview && (
        <div className="sticky top-0 z-50 bg-blue-100 border-b border-blue-200 px-4 py-3">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-blue-800 font-medium">预览模式</p>
                <p className="text-blue-600 text-sm">这是你的页面预览，确认无误后可以保存并分享</p>
              </div>
            </div>
            {showControls && (
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  导出
                </Button>
                <Button size="sm" variant="outline">
                  <Share2 className="w-4 h-4 mr-2" />
                  分享
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 页面内容 */}
      <div className="container mx-auto px-4 py-8">
        {/* 页面标题区域 */}
        <div className="text-center mb-8">
          <h1 className={`text-3xl font-bold mb-2 ${themeStyle.text}`}>{page.title}</h1>
          {!isPreview && (
            <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                1,234 次访问
              </span>
              <span className="flex items-center gap-1">
                <Heart className="w-4 h-4" />
                56 个赞
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                更新于 {new Date(page.updated_at).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        {/* 模块渲染区域 */}
        <div className={getLayoutClass()}>{visibleBlocks.map(renderBlock)}</div>

        {/* 页脚信息 */}
        {!isPreview && (
          <footer className="mt-16 pt-8 border-t border-gray-200/50 text-center">
            <p className={`text-sm ${themeStyle.text} opacity-70`}>
              由 <span className="font-semibold">HeysMe</span> 强力驱动 •
              <a href="/create" className={`ml-1 ${themeStyle.accent} hover:underline`}>
                创建你的专属页面
              </a>
            </p>
          </footer>
        )}
      </div>
    </div>
  )
}

// 个人介绍模块 - 页面的核心，展示个人品牌
function HeroBlock({ block, themeStyle }: { block: PageBlock; themeStyle: any }) {
  const { name, title, description, avatar, tagline, location } = block.data

  return (
    <div className="col-span-full text-center py-12">
      {/* 头像 */}
      <Avatar className="w-32 h-32 mx-auto mb-6 ring-4 ring-white/50 shadow-xl">
        <AvatarImage src={avatar || "/placeholder.svg?height=128&width=128"} alt={name} />
        <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
          {name?.charAt(0)?.toUpperCase() || "U"}
        </AvatarFallback>
      </Avatar>

      {/* 基本信息 */}
      <h1 className={`text-4xl md:text-5xl font-bold mb-3 ${themeStyle.text}`}>{name || "Your Name"}</h1>

      <h2 className={`text-xl md:text-2xl mb-4 ${themeStyle.accent} font-medium`}>{title || "Your Title"}</h2>

      {/* 标语 */}
      {tagline && <p className={`text-lg md:text-xl font-medium mb-6 ${themeStyle.text} opacity-80`}>"{tagline}"</p>}

      {/* 位置信息 */}
      {location && (
        <div className={`flex items-center justify-center gap-2 mb-6 ${themeStyle.text} opacity-70`}>
          <MapPin className="w-4 h-4" />
          <span>{location}</span>
        </div>
      )}

      {/* 描述 */}
      {description && (
        <p className={`text-base md:text-lg leading-relaxed max-w-3xl mx-auto ${themeStyle.text} opacity-80`}>
          {description}
        </p>
      )}

      {/* 行动按钮 */}
      <div className="flex flex-wrap gap-4 justify-center mt-8">
        <Button className={`${themeStyle.button} text-white px-6 py-3 rounded-full`}>
          <Mail className="w-4 h-4 mr-2" />
          联系我
        </Button>
        <Button variant="outline" className="px-6 py-3 rounded-full">
          <Download className="w-4 h-4 mr-2" />
          下载简历
        </Button>
      </div>
    </div>
  )
}

// 项目展示模块 - 展示工作成果和作品集
function ProjectBlock({ block, themeStyle }: { block: PageBlock; themeStyle: any }) {
  const { title, projects } = block.data

  return (
    <Card className={`h-fit ${themeStyle.card} shadow-lg hover:shadow-xl transition-shadow`}>
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 ${themeStyle.text}`}>
          <Star className={`w-5 h-5 ${themeStyle.accent}`} />
          {title || "项目作品"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {projects?.map((project: any, index: number) => (
            <div
              key={index}
              className={`border-l-4 ${themeStyle.accent.includes("blue") ? "border-blue-500" : "border-current"} pl-4`}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className={`font-semibold text-lg ${themeStyle.text}`}>{project.name}</h3>
                {project.featured && (
                  <Badge variant="secondary" className="ml-2">
                    <Award className="w-3 h-3 mr-1" />
                    精选
                  </Badge>
                )}
              </div>

              <p className={`text-sm mb-3 ${themeStyle.text} opacity-80`}>{project.description}</p>

              {/* 技术栈 */}
              {project.tech && project.tech.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {project.tech.map((tech: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {tech}
                    </Badge>
                  ))}
                </div>
              )}

              {/* 项目链接 */}
              <div className="flex gap-2">
                {project.link && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={project.link} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-3 h-3 mr-1" />
                      查看项目
                    </a>
                  </Button>
                )}
                {project.github && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={project.github} target="_blank" rel="noopener noreferrer">
                      <Github className="w-3 h-3 mr-1" />
                      源码
                    </a>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// 技能展示模块 - 展示专业技能和能力
function SkillBlock({ block, themeStyle }: { block: PageBlock; themeStyle: any }) {
  const { title, skills, categories } = block.data

  return (
    <Card className={`h-fit ${themeStyle.card} shadow-lg hover:shadow-xl transition-shadow`}>
      <CardHeader>
        <CardTitle className={`${themeStyle.text}`}>{title || "技能专长"}</CardTitle>
      </CardHeader>
      <CardContent>
        {categories ? (
          // 分类显示技能
          <div className="space-y-4">
            {Object.entries(categories).map(([category, categorySkills]: [string, any]) => (
              <div key={category}>
                <h4 className={`font-medium mb-2 ${themeStyle.text} opacity-80`}>{category}</h4>
                <div className="flex flex-wrap gap-2">
                  {categorySkills.map((skill: string, index: number) => (
                    <Badge key={index} variant="default" className="text-sm">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // 简单列表显示
          <div className="flex flex-wrap gap-2">
            {skills?.map((skill: string, index: number) => (
              <Badge key={index} variant="default" className="text-sm">
                {skill}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// 社交链接模块 - 展示各种社交媒体和联系方式
function LinkBlock({ block, themeStyle }: { block: PageBlock; themeStyle: any }) {
  const { title, links } = block.data

  const getIcon = (type: string) => {
    const iconMap: Record<string, any> = {
      github: Github,
      linkedin: Linkedin,
      twitter: Twitter,
      email: Mail,
      website: ExternalLink,
    }
    const IconComponent = iconMap[type] || ExternalLink
    return <IconComponent className="w-4 h-4" />
  }

  return (
    <Card className={`h-fit ${themeStyle.card} shadow-lg hover:shadow-xl transition-shadow`}>
      <CardHeader>
        <CardTitle className={`${themeStyle.text}`}>{title || "社交链接"}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {links?.map((link: any, index: number) => (
            <Button
              key={index}
              variant="outline"
              className="w-full justify-start hover:scale-105 transition-transform"
              asChild
            >
              <a href={link.url} target="_blank" rel="noopener noreferrer">
                {getIcon(link.type)}
                <span className="ml-2">{link.label}</span>
              </a>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// 关于我模块 - 详细的个人介绍
function AboutBlock({ block, themeStyle }: { block: PageBlock; themeStyle: any }) {
  const { title, content, highlights } = block.data

  return (
    <Card className={`h-fit ${themeStyle.card} shadow-lg hover:shadow-xl transition-shadow`}>
      <CardHeader>
        <CardTitle className={`${themeStyle.text}`}>{title || "关于我"}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className={`${themeStyle.text} opacity-80 leading-relaxed`}>{content}</p>

          {/* 亮点展示 */}
          {highlights && highlights.length > 0 && (
            <div>
              <h4 className={`font-medium mb-3 ${themeStyle.text}`}>亮点成就</h4>
              <div className="space-y-2">
                {highlights.map((highlight: string, index: number) => (
                  <div key={index} className="flex items-start gap-2">
                    <Star className={`w-4 h-4 mt-0.5 ${themeStyle.accent} flex-shrink-0`} />
                    <span className={`text-sm ${themeStyle.text} opacity-80`}>{highlight}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// 联系方式模块 - 展示联系信息
function ContactBlock({ block, themeStyle }: { block: PageBlock; themeStyle: any }) {
  const { title, email, phone, location, wechat, availability } = block.data

  return (
    <Card className={`h-fit ${themeStyle.card} shadow-lg hover:shadow-xl transition-shadow`}>
      <CardHeader>
        <CardTitle className={`${themeStyle.text}`}>{title || "联系方式"}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {email && (
            <div className="flex items-center gap-3">
              <Mail className={`w-5 h-5 ${themeStyle.accent}`} />
              <a href={`mailto:${email}`} className={`${themeStyle.accent} hover:underline`}>
                {email}
              </a>
            </div>
          )}

          {phone && (
            <div className="flex items-center gap-3">
              <Phone className={`w-5 h-5 ${themeStyle.accent}`} />
              <a href={`tel:${phone}`} className={`${themeStyle.text} opacity-80`}>
                {phone}
              </a>
            </div>
          )}

          {location && (
            <div className="flex items-center gap-3">
              <MapPin className={`w-5 h-5 ${themeStyle.accent}`} />
              <span className={`${themeStyle.text} opacity-80`}>{location}</span>
            </div>
          )}

          {wechat && (
            <div className="flex items-center gap-3">
              <span className={`w-5 h-5 text-center ${themeStyle.accent} font-bold`}>微</span>
              <span className={`${themeStyle.text} opacity-80`}>{wechat}</span>
            </div>
          )}

          {availability && (
            <div className={`mt-4 p-3 rounded-lg ${themeStyle.background} border`}>
              <p className={`text-sm ${themeStyle.text} opacity-80`}>
                <strong>当前状态：</strong> {availability}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// 招聘信息模块 - 展示团队招聘需求
function RecruitBlock({ block, themeStyle }: { block: PageBlock; themeStyle: any }) {
  const { title, positions, company, description } = block.data

  return (
    <Card className={`h-fit ${themeStyle.card} shadow-lg hover:shadow-xl transition-shadow`}>
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 ${themeStyle.text}`}>
          <span className="text-2xl">👥</span>
          {title || "我们在招聘"}
        </CardTitle>
        {company && <p className={`text-sm ${themeStyle.text} opacity-70`}>{company}</p>}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {description && <p className={`text-sm ${themeStyle.text} opacity-80`}>{description}</p>}

          <div className="space-y-3">
            {positions?.map((position: any, index: number) => (
              <div key={index} className="border rounded-lg p-3">
                <div className="flex items-start justify-between mb-2">
                  <h4 className={`font-medium ${themeStyle.text}`}>{position.title}</h4>
                  {position.urgent && (
                    <Badge variant="destructive" className="text-xs">
                      急招
                    </Badge>
                  )}
                </div>

                <p className={`text-sm ${themeStyle.text} opacity-70 mb-2`}>{position.description}</p>

                <div className="flex flex-wrap gap-2 mb-3">
                  {position.requirements?.map((req: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {req}
                    </Badge>
                  ))}
                </div>

                {position.salary && (
                  <p className={`text-sm font-medium ${themeStyle.accent}`}>薪资：{position.salary}</p>
                )}
              </div>
            ))}
          </div>

          <Button className={`w-full ${themeStyle.button} text-white`}>
            <Mail className="w-4 h-4 mr-2" />
            投递简历
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// 自定义模块 - 处理未知类型的模块
function CustomBlock({ block, themeStyle }: { block: PageBlock; themeStyle: any }) {
  return (
    <Card className={`h-fit ${themeStyle.card} shadow-lg hover:shadow-xl transition-shadow`}>
      <CardHeader>
        <CardTitle className={`${themeStyle.text}`}>自定义模块</CardTitle>
      </CardHeader>
      <CardContent>
        <p className={`text-sm ${themeStyle.text} opacity-70`}>模块类型：{block.type}</p>
        <pre className={`text-xs mt-2 p-2 rounded bg-gray-100 ${themeStyle.text} opacity-60`}>
          {JSON.stringify(block.data, null, 2)}
        </pre>
      </CardContent>
    </Card>
  )
}
