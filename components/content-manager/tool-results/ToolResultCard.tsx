'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Code, 
  Link2, 
  User, 
  Clock, 
  Zap, 
  AlertCircle, 
  CheckCircle,
  RefreshCw,
  Edit3,
  MoreHorizontal,
  ExternalLink,
  Star,
  Users,
  GitBranch,
  Calendar
} from 'lucide-react'
import { useTheme } from '@/contexts/theme-context'

// 工具结果数据类型
interface ToolResultData {
  id: string
  tool_name: 'analyze_github' | 'scrape_webpage' | 'extract_linkedin'
  source_url: string
  extracted_data: {
    github?: {
      username: string
      name: string
      bio: string
      followers: number
      following: number
      public_repos: number
      avatar_url: string
      top_languages: string[]
      top_repos: Array<{
        name: string
        stars: number
        description: string
        language: string
      }>
    }
    webpage?: {
      title: string
      description: string
      content_preview: string
      links_count: number
      images_count: number
      metadata: {
        author?: string
        keywords?: string[]
        type?: string
      }
    }
    linkedin?: {
      name: string
      headline: string
      location: string
      connections: number
      experience_count: number
      skills: string[]
      current_position?: string
    }
  }
  cache_info: {
    created_at: string
    expires_at: string
    hit_count: number
    status: 'fresh' | 'cached' | 'expired'
  }
  usage_stats: {
    used_in_pages: string[]
    sync_count: number
    last_sync: string
  }
  tags: string[]
}

interface ToolResultCardProps {
  data: ToolResultData
  onEdit: (data: ToolResultData) => void
  onRefresh: (data: ToolResultData) => void
  onSync: (data: ToolResultData) => void
  onDelete: (data: ToolResultData) => void
}

// 缓存状态指示器
function CacheStatusIndicator({ status, expiresAt }: {
  status: 'fresh' | 'cached' | 'expired'
  expiresAt: string
}) {
  const getStatusConfig = () => {
    switch (status) {
      case 'fresh':
        return {
          icon: <Zap className="w-4 h-4" />,
          text: '实时数据',
          color: 'text-green-500 bg-green-50 border-green-200'
        }
      case 'cached':
        return {
          icon: <Clock className="w-4 h-4" />,
          text: '缓存有效',
          color: 'text-blue-500 bg-blue-50 border-blue-200'
        }
      case 'expired':
        return {
          icon: <AlertCircle className="w-4 h-4" />,
          text: '缓存过期',
          color: 'text-red-500 bg-red-50 border-red-200'
        }
    }
  }

  const config = getStatusConfig()

  return (
    <Badge variant="outline" className={`text-xs ${config.color}`}>
      {config.icon}
      <span className="ml-1">{config.text}</span>
    </Badge>
  )
}

// 工具类型图标
function ToolTypeIcon({ toolName }: { toolName: string }) {
  const iconMap = {
    'analyze_github': <Code className="w-4 h-4" />,
    'scrape_webpage': <Link2 className="w-4 h-4" />,
    'extract_linkedin': <User className="w-4 h-4" />
  }
  
  return iconMap[toolName as keyof typeof iconMap] || <Code className="w-4 h-4" />
}

// GitHub 数据预览
function GitHubPreview({ data }: { data: ToolResultData['extracted_data']['github'] }) {
  if (!data) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="font-medium">{data.name || data.username}</span>
        <Badge variant="secondary" className="text-xs">
          @{data.username}
        </Badge>
      </div>
      <p className="text-sm text-gray-600 line-clamp-2">{data.bio}</p>
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          {data.followers} followers
        </span>
        <span className="flex items-center gap-1">
          <GitBranch className="w-3 h-3" />
          {data.public_repos} repos
        </span>
      </div>
      {data.top_languages && data.top_languages.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {data.top_languages.slice(0, 3).map((lang) => (
            <Badge key={lang} variant="outline" className="text-xs">
              {lang}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

// 网页数据预览
function WebpagePreview({ data }: { data: ToolResultData['extracted_data']['webpage'] }) {
  if (!data) return null

  return (
    <div className="space-y-2">
      <h4 className="font-medium line-clamp-1">{data.title}</h4>
      <p className="text-sm text-gray-600 line-clamp-2">{data.description}</p>
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span>{data.links_count} 个链接</span>
        <span>{data.images_count} 张图片</span>
      </div>
      {data.metadata.keywords && data.metadata.keywords.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {data.metadata.keywords.slice(0, 3).map((keyword) => (
            <Badge key={keyword} variant="outline" className="text-xs">
              {keyword}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

// LinkedIn 数据预览
function LinkedInPreview({ data }: { data: ToolResultData['extracted_data']['linkedin'] }) {
  if (!data) return null

  return (
    <div className="space-y-2">
      <div>
        <h4 className="font-medium">{data.name}</h4>
        <p className="text-sm text-gray-600 line-clamp-1">{data.headline}</p>
      </div>
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span>{data.connections}+ connections</span>
        <span>{data.experience_count} 工作经历</span>
      </div>
      {data.skills && data.skills.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {data.skills.slice(0, 3).map((skill) => (
            <Badge key={skill} variant="outline" className="text-xs">
              {skill}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ToolResultCard({
  data,
  onEdit,
  onRefresh,
  onSync,
  onDelete
}: ToolResultCardProps) {
  const { theme } = useTheme()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const getToolDisplayName = (toolName: string) => {
    const nameMap = {
      'analyze_github': 'GitHub 分析',
      'scrape_webpage': '网页抓取',
      'extract_linkedin': 'LinkedIn 提取'
    }
    return nameMap[toolName as keyof typeof nameMap] || toolName
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await onRefresh(data)
    } finally {
      setIsRefreshing(false)
    }
  }

  const renderDataPreview = () => {
    switch (data.tool_name) {
      case 'analyze_github':
        return <GitHubPreview data={data.extracted_data.github} />
      case 'scrape_webpage':
        return <WebpagePreview data={data.extracted_data.webpage} />
      case 'extract_linkedin':
        return <LinkedInPreview data={data.extracted_data.linkedin} />
      default:
        return <div className="text-sm text-gray-500">暂无预览</div>
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Card className={`group overflow-hidden border-2 transition-all duration-300 hover:shadow-lg cursor-pointer ${
        theme === "light" 
          ? "bg-white/90 backdrop-blur border-purple-100/60 hover:border-purple-200" 
          : "bg-gray-800/90 backdrop-blur border-purple-700/30 hover:border-purple-600/50"
      }`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge 
                  variant="secondary"
                  className={`text-xs flex items-center gap-1 ${
                    theme === "light" 
                      ? "bg-purple-100 text-purple-700 border-purple-200" 
                      : "bg-purple-900/50 text-purple-300 border-purple-700"
                  }`}
                >
                  <ToolTypeIcon toolName={data.tool_name} />
                  {getToolDisplayName(data.tool_name)}
                </Badge>
                <CacheStatusIndicator 
                  status={data.cache_info.status} 
                  expiresAt={data.cache_info.expires_at} 
                />
              </div>
              <CardTitle className={`text-lg group-hover:text-purple-600 transition-colors ${
                theme === "light" ? "text-gray-900" : "text-white"
              }`}>
                <div className="flex items-center gap-2">
                  <span className="line-clamp-1">{new URL(data.source_url).hostname}</span>
                  <ExternalLink className="w-4 h-4 opacity-60" />
                </div>
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className={`opacity-0 group-hover:opacity-100 transition-opacity ${
                  theme === "light" 
                    ? "hover:bg-gray-100 text-gray-600" 
                    : "hover:bg-gray-700 text-gray-400"
                }`}
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* 数据预览 */}
          <div className={`${
            theme === "light" ? "text-gray-700" : "text-gray-300"
          }`}>
            {renderDataPreview()}
          </div>

          {/* 标签 */}
          {data.tags && data.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {data.tags.slice(0, 3).map((tag) => (
                <Badge 
                  key={tag} 
                  variant="outline" 
                  className={`text-xs ${
                    theme === "light"
                      ? "border-gray-200 text-gray-600"
                      : "border-gray-600 text-gray-400"
                  }`}
                >
                  #{tag}
                </Badge>
              ))}
            </div>
          )}

          {/* 使用情况和时间 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className={`text-xs ${
                theme === "light" ? "text-gray-500" : "text-gray-400"
              }`}>
                用于 {data.usage_stats.used_in_pages.length} 个页面
              </span>
              <span className={`text-xs ${
                theme === "light" ? "text-gray-500" : "text-gray-400"
              }`}>
                命中 {data.cache_info.hit_count} 次
              </span>
            </div>
            <span className={`text-xs flex items-center gap-1 ${
              theme === "light" ? "text-gray-500" : "text-gray-400"
            }`}>
              <Calendar className="w-3 h-3" />
              {new Date(data.cache_info.created_at).toLocaleDateString()}
            </span>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onEdit(data)}
              className={`flex-1 ${
                theme === "light"
                  ? "border-purple-200 text-purple-700 hover:bg-purple-50"
                  : "border-purple-700 text-purple-400 hover:bg-purple-900/20"
              }`}
            >
              <Edit3 className="w-3 h-3 mr-1" />
              编辑
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing || data.cache_info.status === 'fresh'}
              className={`${
                theme === "light"
                  ? "border-blue-200 text-blue-700 hover:bg-blue-50"
                  : "border-blue-700 text-blue-400 hover:bg-blue-900/20"
              }`}
            >
              <RefreshCw className={`w-3 h-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? '刷新中' : '刷新'}
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onSync(data)}
              disabled={data.usage_stats.used_in_pages.length === 0}
              className={`${
                theme === "light"
                  ? "border-green-200 text-green-700 hover:bg-green-50"
                  : "border-green-700 text-green-400 hover:bg-green-900/20"
              }`}
            >
              <CheckCircle className="w-3 h-3 mr-1" />
              同步
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
