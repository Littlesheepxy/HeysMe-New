'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  Code, 
  Link2, 
  User, 
  Clock, 
  Zap, 
  AlertCircle,
  ExternalLink,
  Star,
  Users,
  GitBranch,
  Calendar,
  RefreshCw,
  Edit3,
  Trash2,
  CheckCircle,
  BarChart3,
  Globe,
  MapPin,
  Briefcase,
  Award,
  Eye,
  MousePointer
} from 'lucide-react'
import { useTheme } from '@/contexts/theme-context'
import { type ToolResultData } from './ToolResultCard'

// 工具结果数据类型已从 ToolResultCard 导入

interface ToolResultDetailPanelProps {
  data: ToolResultData | null
  isOpen: boolean
  onClose: () => void
  onEdit: (data: ToolResultData) => void
  onRefresh: (data: ToolResultData) => void
  onSync: (data: ToolResultData) => void
  onDelete: (data: ToolResultData) => void
}

// GitHub 详情组件
function GitHubDetails({ data }: { data: ToolResultData['extracted_data']['github'] }) {
  if (!data) return null

  return (
    <div className="space-y-6">
      {/* 基础信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5" />
            基础信息
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            {data.avatar_url && (
              <img 
                src={data.avatar_url} 
                alt={data.name}
                className="w-16 h-16 rounded-full border-2 border-gray-200"
              />
            )}
            <div>
              <h3 className="text-lg font-semibold">{data.name || data.username}</h3>
              <p className="text-gray-600">@{data.username}</p>
              <p className="text-sm text-gray-500 mt-1">{data.bio}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{data.followers}</div>
              <div className="text-sm text-gray-600">Followers</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{data.following}</div>
              <div className="text-sm text-gray-600">Following</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{data.public_repos}</div>
              <div className="text-sm text-gray-600">Repositories</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 热门仓库 */}
      {data.top_repos && data.top_repos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5" />
              热门仓库
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.top_repos.map((repo, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-blue-600 hover:underline cursor-pointer">
                        {repo.name}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">{repo.description}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1 text-sm text-gray-500">
                          <Star className="w-3 h-3" />
                          {repo.stars}
                        </span>
                        {repo.language && (
                          <Badge variant="outline" className="text-xs">
                            {repo.language}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 编程语言 */}
      {data.top_languages && data.top_languages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>主要编程语言</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.top_languages.map((lang) => (
                <Badge key={lang} variant="secondary" className="text-sm">
                  {lang}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// 网页详情组件
function WebpageDetails({ data }: { data: ToolResultData['extracted_data']['webpage'] }) {
  if (!data) return null

  return (
    <div className="space-y-6">
      {/* 基础信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            页面信息
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">{data.title}</h3>
            <p className="text-gray-600 mt-2">{data.description}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{data.links_count}</div>
              <div className="text-sm text-gray-600">链接数量</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{data.images_count}</div>
              <div className="text-sm text-gray-600">图片数量</div>
            </div>
          </div>

          {data.metadata.author && (
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500" />
              <span className="text-sm">作者: {data.metadata.author}</span>
            </div>
          )}
          
          {data.metadata.published_date && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm">发布时间: {data.metadata.published_date}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 内容预览 */}
      <Card>
        <CardHeader>
          <CardTitle>内容预览</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-40">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {data.content_preview}
            </p>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* 提取的链接 */}
      {data.extracted_links && data.extracted_links.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="w-5 h-5" />
              提取的链接
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-60">
              <div className="space-y-2">
                {data.extracted_links.map((link, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 border rounded">
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{link.text}</div>
                      <div className="text-xs text-gray-500 truncate">{link.url}</div>
                    </div>
                    <Badge variant={link.type === 'external' ? 'default' : 'secondary'} className="text-xs">
                      {link.type === 'external' ? '外部' : '内部'}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// LinkedIn 详情组件
function LinkedInDetails({ data }: { data: ToolResultData['extracted_data']['linkedin'] }) {
  if (!data) return null

  return (
    <div className="space-y-6">
      {/* 基础信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            个人信息
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">{data.name}</h3>
            <p className="text-gray-600">{data.headline}</p>
            {data.location && (
              <div className="flex items-center gap-1 mt-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">{data.location}</span>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{data.connections}+</div>
              <div className="text-sm text-gray-600">Connections</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{data.experience_count}</div>
              <div className="text-sm text-gray-600">工作经历</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 工作经历 */}
      {data.experience && data.experience.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              工作经历
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.experience.map((exp, index) => (
                <div key={index} className="border-l-2 border-blue-200 pl-4">
                  <h4 className="font-semibold">{exp.title}</h4>
                  <p className="text-blue-600">{exp.company}</p>
                  <p className="text-sm text-gray-500">{exp.duration}</p>
                  <p className="text-sm text-gray-700 mt-2">{exp.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 技能 */}
      {data.skills && data.skills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              技能
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.skills.map((skill) => (
                <Badge key={skill} variant="secondary" className="text-sm">
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 教育背景 */}
      {data.education && data.education.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              教育背景
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.education.map((edu, index) => (
                <div key={index} className="border-l-2 border-green-200 pl-4">
                  <h4 className="font-semibold">{edu.school}</h4>
                  <p className="text-green-600">{edu.degree} in {edu.field}</p>
                  <p className="text-sm text-gray-500">{edu.year}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function ToolResultDetailPanel({
  data,
  isOpen,
  onClose,
  onEdit,
  onRefresh,
  onSync,
  onDelete
}: ToolResultDetailPanelProps) {
  const { theme } = useTheme()
  const [isRefreshing, setIsRefreshing] = useState(false)

  if (!data) return null

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await onRefresh(data)
    } finally {
      setIsRefreshing(false)
    }
  }

  const getToolDisplayName = (toolName: string) => {
    const nameMap = {
      'analyze_github': 'GitHub 分析',
      'scrape_webpage': '网页抓取',
      'extract_linkedin': 'LinkedIn 提取'
    }
    return nameMap[toolName as keyof typeof nameMap] || toolName
  }

  const getCacheStatusColor = (status: string) => {
    switch (status) {
      case 'fresh': return 'text-green-600 bg-green-50'
      case 'cached': return 'text-blue-600 bg-blue-50'
      case 'expired': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-6xl max-h-[90vh] overflow-hidden ${
        theme === "light" 
          ? "bg-white border-gray-200" 
          : "bg-gray-900 border-gray-700"
      }`}>
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {data.tool_name === 'analyze_github' && <Code className="w-6 h-6 text-purple-600" />}
              {data.tool_name === 'scrape_webpage' && <Link2 className="w-6 h-6 text-blue-600" />}
              {data.tool_name === 'extract_linkedin' && <User className="w-6 h-6 text-blue-600" />}
              <span>{getToolDisplayName(data.tool_name)} - 详细信息</span>
            </div>
            <Badge className={`${getCacheStatusColor(data.cache_info.status)}`}>
              {data.cache_info.status === 'fresh' && '实时数据'}
              {data.cache_info.status === 'cached' && '缓存有效'}
              {data.cache_info.status === 'expired' && '缓存过期'}
            </Badge>
          </DialogTitle>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <ExternalLink className="w-4 h-4" />
            <span className="truncate">{data.source_url}</span>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="content" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="content">内容详情</TabsTrigger>
              <TabsTrigger value="cache">缓存信息</TabsTrigger>
              <TabsTrigger value="usage">使用统计</TabsTrigger>
              <TabsTrigger value="actions">操作</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-hidden">
              <TabsContent value="content" className="h-full">
                <ScrollArea className="h-[60vh]">
                  {data.tool_name === 'analyze_github' && (
                    <GitHubDetails data={data.extracted_data.github} />
                  )}
                  {data.tool_name === 'scrape_webpage' && (
                    <WebpageDetails data={data.extracted_data.webpage} />
                  )}
                  {data.tool_name === 'extract_linkedin' && (
                    <LinkedInDetails data={data.extracted_data.linkedin} />
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="cache" className="h-full">
                <ScrollArea className="h-[60vh]">
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Clock className="w-5 h-5" />
                          缓存状态
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-600">创建时间</label>
                            <p className="text-sm">{new Date(data.cache_info.created_at).toLocaleString()}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">过期时间</label>
                            <p className="text-sm">{new Date(data.cache_info.expires_at).toLocaleString()}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">命中次数</label>
                            <p className="text-sm">{data.cache_info.hit_count}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">最后访问</label>
                            <p className="text-sm">{new Date(data.cache_info.last_accessed).toLocaleString()}</p>
                          </div>
                        </div>
                        
                        <div className="pt-4 border-t">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">缓存有效期进度</span>
                            <span className="text-xs text-gray-500">
                              {Math.max(0, Math.round((new Date(data.cache_info.expires_at).getTime() - Date.now()) / (1000 * 60 * 60)))} 小时剩余
                            </span>
                          </div>
                          <Progress 
                            value={Math.max(0, Math.min(100, 
                              ((new Date(data.cache_info.expires_at).getTime() - Date.now()) / 
                               (new Date(data.cache_info.expires_at).getTime() - new Date(data.cache_info.created_at).getTime())) * 100
                            ))} 
                            className="mt-2" 
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="usage" className="h-full">
                <ScrollArea className="h-[60vh]">
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BarChart3 className="w-5 h-5" />
                          使用统计
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center p-3 bg-blue-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">{data.usage_stats.used_in_pages.length}</div>
                            <div className="text-sm text-gray-600">使用页面</div>
                          </div>
                          <div className="text-center p-3 bg-green-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">{data.usage_stats.sync_count}</div>
                            <div className="text-sm text-gray-600">同步次数</div>
                          </div>
                          <div className="text-center p-3 bg-purple-50 rounded-lg">
                            <div className="text-2xl font-bold text-purple-600">{data.cache_info.hit_count}</div>
                            <div className="text-sm text-gray-600">缓存命中</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {data.usage_stats.page_details && data.usage_stats.page_details.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle>使用页面详情</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {data.usage_stats.page_details.map((page, index) => (
                              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                  <h4 className="font-medium">{page.page_title}</h4>
                                  <p className="text-sm text-gray-500">最后同步: {new Date(page.last_sync).toLocaleString()}</p>
                                </div>
                                <Badge variant={
                                  page.sync_status === 'success' ? 'default' :
                                  page.sync_status === 'failed' ? 'destructive' : 'secondary'
                                }>
                                  {page.sync_status === 'success' && '成功'}
                                  {page.sync_status === 'failed' && '失败'}
                                  {page.sync_status === 'pending' && '待处理'}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="actions" className="h-full">
                <div className="space-y-6 p-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>操作面板</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <Button 
                          onClick={() => onEdit(data)}
                          className="flex items-center gap-2"
                        >
                          <Edit3 className="w-4 h-4" />
                          编辑内容
                        </Button>
                        <Button 
                          onClick={handleRefresh}
                          disabled={isRefreshing}
                          variant="outline"
                          className="flex items-center gap-2"
                        >
                          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                          {isRefreshing ? '刷新中...' : '刷新缓存'}
                        </Button>
                        <Button 
                          onClick={() => onSync(data)}
                          disabled={data.usage_stats.used_in_pages.length === 0}
                          variant="outline"
                          className="flex items-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          同步到页面
                        </Button>
                        <Button 
                          onClick={() => onDelete(data)}
                          variant="destructive"
                          className="flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          删除数据
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
