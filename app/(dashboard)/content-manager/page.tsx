'use client'

import { Suspense, useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Search, 
  Filter, 
  Plus, 
  Edit3, 
  Trash2, 
  Upload, 
  Download, 
  Share2, 
  Eye, 
  MoreHorizontal,
  Folder,
  FileText,
  Image,
  Link2,
  Code,
  Briefcase,
  GraduationCap,
  User,
  Settings,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  ArrowLeft,
  MessageSquare,
  Zap,
  Target
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useTheme } from '@/contexts/theme-context'

// 内容类型定义
interface ContentItem {
  id: string
  type: 'personal' | 'professional' | 'project' | 'education' | 'experience' | 'media'
  category: string
  title: string
  content: any
  tags: string[]
  usedInPages: string[]
  lastModified: Date
  syncStatus: 'synced' | 'pending' | 'failed'
  source: 'manual' | 'imported' | 'ai_generated'
}

// 同步任务定义
interface SyncTask {
  id: string
  contentId: string
  affectedPages: Array<{ id: string, title: string }>
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  startTime: Date
  results: Array<{
    pageId: string
    status: 'success' | 'error'
    changes?: string
    error?: string
  }>
}

// 内容分类配置
const contentCategories = [
  {
    id: 'all',
    label: '全部内容',
    icon: Folder,
    count: 0
  },
  {
    id: 'personal',
    label: '个人身份',
    icon: User,
    subcategories: [
      { id: 'basic_info', label: '基础信息', icon: FileText },
      { id: 'social_links', label: '社交链接', icon: Link2 },
      { id: 'media', label: '头像媒体', icon: Image }
    ]
  },
  {
    id: 'professional',
    label: '专业展示',
    icon: Briefcase,
    subcategories: [
      { id: 'skills', label: '技能标签', icon: Code },
      { id: 'achievements', label: '成就证书', icon: Target },
      { id: 'goals', label: '职业目标', icon: Zap }
    ]
  },
  {
    id: 'projects',
    label: '项目作品',
    icon: Code,
    subcategories: [
      { id: 'tech_projects', label: '技术项目', icon: Code },
      { id: 'design_works', label: '设计作品', icon: Image },
      { id: 'business_cases', label: '商业案例', icon: Briefcase }
    ]
  },
  {
    id: 'education',
    label: '教育经历',
    icon: GraduationCap,
    subcategories: [
      { id: 'degrees', label: '学历信息', icon: GraduationCap },
      { id: 'certifications', label: '培训证书', icon: Target }
    ]
  },
  {
    id: 'experience',
    label: '工作经历',
    icon: Briefcase,
    subcategories: [
      { id: 'positions', label: '职位经历', icon: Briefcase },
      { id: 'recommendations', label: '推荐信', icon: FileText }
    ]
  }
]

// 模拟数据
const mockContentItems: ContentItem[] = [
  {
    id: '1',
    type: 'personal',
    category: 'basic_info',
    title: '个人基础信息',
    content: {
      fullName: '张三',
      email: 'zhangsan@example.com',
      phone: '+86 138****8888',
      location: '北京市朝阳区'
    },
    tags: ['个人信息', '联系方式'],
    usedInPages: ['page-1', 'page-2'],
    lastModified: new Date('2024-01-15'),
    syncStatus: 'synced',
    source: 'manual'
  },
  {
    id: '2',
    type: 'professional',
    category: 'skills',
    title: '技术技能',
    content: {
      skills: ['React', 'TypeScript', 'Node.js', 'Python', 'AI/ML']
    },
    tags: ['技能', '编程', 'AI'],
    usedInPages: ['page-1', 'page-3'],
    lastModified: new Date('2024-01-14'),
    syncStatus: 'pending',
    source: 'imported'
  },
  {
    id: '3',
    type: 'project',
    category: 'tech_projects',
    title: 'HeysMe 智能简历平台',
    content: {
      name: 'HeysMe',
      description: 'AI驱动的智能简历生成平台',
      technologies: ['React', 'Next.js', 'TypeScript', 'Supabase'],
      repository: 'https://github.com/user/heysme',
      liveUrl: 'https://heysme.vercel.app',
      highlights: ['10k+ 用户', '99.9% 正常运行时间']
    },
    tags: ['项目', 'AI', '全栈开发'],
    usedInPages: ['page-1'],
    lastModified: new Date('2024-01-13'),
    syncStatus: 'synced',
    source: 'ai_generated'
  }
]

// 内容卡片组件
function ContentCard({ item, onEdit, onSync, onDelete }: {
  item: ContentItem
  onEdit: (item: ContentItem) => void
  onSync: (item: ContentItem) => void
  onDelete: (item: ContentItem) => void
}) {
  const { theme } = useTheme()
  
  const getSyncStatusIcon = (status: string) => {
    switch (status) {
      case 'synced': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-500" />
      default: return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getSourceBadgeColor = (source: string) => {
    switch (source) {
      case 'manual': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'imported': return 'bg-green-100 text-green-700 border-green-200'
      case 'ai_generated': return 'bg-purple-100 text-purple-700 border-purple-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
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
          ? "bg-white/90 backdrop-blur border-emerald-100/60 hover:border-emerald-200" 
          : "bg-gray-800/90 backdrop-blur border-emerald-700/30 hover:border-emerald-600/50"
      }`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge 
                  variant="secondary"
                  className={`text-xs ${
                    theme === "light" 
                      ? "bg-emerald-100 text-emerald-700 border-emerald-200" 
                      : "bg-emerald-900/50 text-emerald-300 border-emerald-700"
                  }`}
                >
                  {item.category}
                </Badge>
                <Badge 
                  variant="outline"
                  className={`text-xs ${getSourceBadgeColor(item.source)}`}
                >
                  {item.source === 'manual' ? '手动创建' : 
                   item.source === 'imported' ? '导入' : 'AI生成'}
                </Badge>
              </div>
              <CardTitle className={`text-lg group-hover:text-emerald-600 transition-colors ${
                theme === "light" ? "text-gray-900" : "text-white"
              }`}>
                {item.title}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {getSyncStatusIcon(item.syncStatus)}
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
          {/* 内容预览 */}
          <div className={`text-sm ${
            theme === "light" ? "text-gray-600" : "text-gray-400"
          }`}>
            {item.type === 'personal' && (
              <div>姓名: {item.content.fullName}, 邮箱: {item.content.email}</div>
            )}
            {item.type === 'professional' && item.category === 'skills' && (
              <div>技能: {item.content.skills?.slice(0, 3).join(', ')}...</div>
            )}
            {item.type === 'project' && (
              <div>{item.content.description}</div>
            )}
          </div>

          {/* 标签 */}
          <div className="flex flex-wrap gap-1">
            {item.tags.slice(0, 3).map((tag) => (
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

          {/* 使用情况 */}
          <div className="flex items-center justify-between">
            <span className={`text-xs ${
              theme === "light" ? "text-gray-500" : "text-gray-400"
            }`}>
              用于 {item.usedInPages.length} 个页面
            </span>
            <span className={`text-xs ${
              theme === "light" ? "text-gray-500" : "text-gray-400"
            }`}>
              {item.lastModified.toLocaleDateString()}
            </span>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onEdit(item)}
              className={`flex-1 ${
                theme === "light"
                  ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  : "border-emerald-700 text-emerald-400 hover:bg-emerald-900/20"
              }`}
            >
              <Edit3 className="w-3 h-3 mr-1" />
              编辑
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onSync(item)}
              disabled={item.usedInPages.length === 0}
              className={`${
                theme === "light"
                  ? "border-blue-200 text-blue-700 hover:bg-blue-50"
                  : "border-blue-700 text-blue-400 hover:bg-blue-900/20"
              }`}
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              同步
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// 内容编辑对话框
function ContentEditDialog({ 
  item, 
  isOpen, 
  onClose, 
  onSave 
}: {
  item: ContentItem | null
  isOpen: boolean
  onClose: () => void
  onSave: (updatedItem: ContentItem, affectedPages: string[]) => void
}) {
  const { theme } = useTheme()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')
  const [syncStrategy, setSyncStrategy] = useState<'immediate' | 'batch' | 'manual'>('immediate')

  useEffect(() => {
    if (item) {
      setTitle(item.title)
      setContent(JSON.stringify(item.content, null, 2))
      setTags(item.tags.join(', '))
    }
  }, [item])

  const handleSave = () => {
    if (!item) return

    const updatedItem: ContentItem = {
      ...item,
      title,
      content: JSON.parse(content),
      tags: tags.split(',').map(tag => tag.trim()),
      lastModified: new Date(),
      syncStatus: 'pending'
    }

    onSave(updatedItem, item.usedInPages)
  }

  if (!item) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-4xl max-h-[80vh] overflow-y-auto ${
        theme === "light" 
          ? "bg-white border-gray-200" 
          : "bg-gray-900 border-gray-700"
      }`}>
        <DialogHeader>
          <DialogTitle>编辑内容 - {item.title}</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-6">
          {/* 左侧：内容编辑 */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">标题</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="内容标题"
              />
            </div>
            
            <div>
              <Label htmlFor="content">内容 (JSON格式)</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="内容数据"
                rows={15}
                className="font-mono text-sm"
              />
            </div>
            
            <div>
              <Label htmlFor="tags">标签 (逗号分隔)</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="标签1, 标签2, 标签3"
              />
            </div>
          </div>

          {/* 右侧：同步设置 */}
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-3">
                影响的页面 ({item.usedInPages.length})
              </h3>
              <ScrollArea className="h-40 border rounded-md p-3">
                {item.usedInPages.map(pageId => (
                  <div key={pageId} className="flex items-center gap-2 p-2">
                    <Checkbox defaultChecked />
                    <span>页面 {pageId}</span>
                  </div>
                ))}
              </ScrollArea>
            </div>

            <div>
              <Label>同步策略</Label>
              <Select value={syncStrategy} onValueChange={(value: any) => setSyncStrategy(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">立即同步</SelectItem>
                  <SelectItem value="batch">批量同步</SelectItem>
                  <SelectItem value="manual">手动同步</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className={`p-4 rounded-lg border ${
              theme === "light" 
                ? "bg-yellow-50 border-yellow-200 text-yellow-800"
                : "bg-yellow-900/20 border-yellow-700/30 text-yellow-300"
            }`}>
              <h4 className="font-semibold mb-2">⚠️ 同步提醒</h4>
              <p className="text-sm">
                修改此内容将会影响 {item.usedInPages.length} 个页面。
                系统将自动生成对应的修改指令并执行多线程同步。
              </p>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="ghost"
                onClick={handleSave} 
                className="flex-1 !bg-emerald-600 hover:!bg-emerald-700 !text-white !border-0"
              >
                保存并同步
              </Button>
              <Button 
                variant="outline" 
                onClick={onClose}
                className={`${
                  theme === "light"
                    ? "border-gray-200 text-gray-700 hover:bg-gray-50"
                    : "border-gray-600 text-gray-300 hover:bg-gray-700"
                }`}
              >
                取消
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// 同步状态监控器
function SyncStatusMonitor({ 
  activeTasks 
}: { 
  activeTasks: SyncTask[] 
}) {
  const { theme } = useTheme()

  if (activeTasks.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className="fixed bottom-4 right-4 w-80 z-50"
    >
      <Card className={`${
        theme === "light"
          ? "bg-white border-emerald-200 shadow-lg"
          : "bg-gray-800 border-emerald-700 shadow-lg"
      }`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
            同步进行中 ({activeTasks.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {activeTasks.map(task => (
            <div key={task.id} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>更新 {task.affectedPages.length} 个页面</span>
                <span className={`font-medium ${
                  task.status === 'completed' ? 'text-green-600' :
                  task.status === 'failed' ? 'text-red-600' :
                  'text-blue-600'
                }`}>
                  {task.status === 'running' ? `${task.progress}%` : task.status}
                </span>
              </div>
              <Progress value={task.progress} className="h-2" />
              {task.status === 'completed' && (
                <div className="text-xs text-green-600">
                  ✓ 同步完成
                </div>
              )}
              {task.status === 'failed' && (
                <div className="text-xs text-red-600">
                  ✗ 同步失败，请重试
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default function ContentManagerPage() {
  const { theme } = useTheme()
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [contentItems, setContentItems] = useState<ContentItem[]>(mockContentItems)
  const [loading, setLoading] = useState(false)
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [activeSyncTasks, setActiveSyncTasks] = useState<SyncTask[]>([])

  // 获取内容数据
  const fetchContentData = async () => {
    setLoading(true)
    try {
      // TODO: 实际的API调用
      // const response = await fetch('/api/content')
      // const data = await response.json()
      // setContentItems(data.items)
      
      // 模拟API延迟
      await new Promise(resolve => setTimeout(resolve, 1000))
      setContentItems(mockContentItems)
    } catch (error) {
      console.error('获取内容数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContentData()
  }, [])

  // 筛选内容
  const filteredItems = contentItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || 
                           item.type === selectedCategory ||
                           item.category === selectedCategory
    const matchesSearch = searchTerm === '' ||
                         item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  // 处理编辑
  const handleEdit = (item: ContentItem) => {
    setEditingItem(item)
    setShowEditDialog(true)
  }

  // 处理保存
  const handleSave = async (updatedItem: ContentItem, affectedPages: string[]) => {
    // 更新本地状态
    setContentItems(prev => 
      prev.map(item => item.id === updatedItem.id ? updatedItem : item)
    )

    // 创建同步任务
    if (affectedPages.length > 0) {
      const syncTask: SyncTask = {
        id: `sync-${Date.now()}`,
        contentId: updatedItem.id,
        affectedPages: affectedPages.map(id => ({ id, title: `页面 ${id}` })),
        status: 'pending',
        progress: 0,
        startTime: new Date(),
        results: []
      }

      setActiveSyncTasks(prev => [...prev, syncTask])
      
      // 模拟同步过程
      simulateSyncProcess(syncTask)
    }

    setShowEditDialog(false)
    setEditingItem(null)
  }

  // 模拟同步过程
  const simulateSyncProcess = async (task: SyncTask) => {
    // 更新任务状态为运行中
    setActiveSyncTasks(prev => 
      prev.map(t => t.id === task.id ? { ...t, status: 'running' as const } : t)
    )

    // 模拟同步进度
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200))
      setActiveSyncTasks(prev => 
        prev.map(t => t.id === task.id ? { ...t, progress: i } : t)
      )
    }

    // 完成同步
    setActiveSyncTasks(prev => 
      prev.map(t => t.id === task.id ? { 
        ...t, 
        status: 'completed' as const, 
        progress: 100,
        results: task.affectedPages.map(page => ({
          pageId: page.id,
          status: 'success' as const,
          changes: '内容已更新'
        }))
      } : t)
    )

    // 3秒后移除完成的任务
    setTimeout(() => {
      setActiveSyncTasks(prev => prev.filter(t => t.id !== task.id))
    }, 3000)
  }

  // 处理同步
  const handleSync = async (item: ContentItem) => {
    if (item.usedInPages.length === 0) return

    const syncTask: SyncTask = {
      id: `sync-${Date.now()}`,
      contentId: item.id,
      affectedPages: item.usedInPages.map(id => ({ id, title: `页面 ${id}` })),
      status: 'pending',
      progress: 0,
      startTime: new Date(),
      results: []
    }

    setActiveSyncTasks(prev => [...prev, syncTask])
    simulateSyncProcess(syncTask)
  }

  // 处理删除
  const handleDelete = async (item: ContentItem) => {
    if (confirm('确定要删除这个内容吗？这可能会影响相关页面的显示。')) {
      setContentItems(prev => prev.filter(i => i.id !== item.id))
    }
  }

  return (
    <div className={`min-h-screen transition-all duration-300 ${
      theme === "light" 
        ? "bg-gradient-to-br from-emerald-50/30 via-white to-blue-50/30" 
        : "bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800"
    }`}>
      {/* 顶部导航栏 */}
      <header className={`sticky top-0 z-40 backdrop-blur-xl border-b transition-all duration-300 ${
        theme === "light" 
          ? "bg-white/80 border-emerald-100/50" 
          : "bg-gray-900/80 border-emerald-700/30"
      }`}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost"
                className={`rounded-xl ${
                  theme === "light"
                    ? "text-gray-600 hover:text-emerald-600 hover:bg-emerald-50"
                    : "text-gray-400 hover:text-emerald-400 hover:bg-emerald-900/20"
                }`}
              >
                <a href="/chat" className="flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  返回对话
                </a>
              </Button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className={`text-2xl font-bold ${
                  theme === "light" ? "text-gray-900" : "text-white"
                }`}>
                  内容管理中心
                </h1>
                <p className={`text-sm ${
                  theme === "light" ? "text-emerald-600" : "text-emerald-400"
                }`}>
                  管理您的所有内容素材，实现多页面智能同步
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button 
                variant="outline"
                className={`rounded-xl ${
                  theme === "light"
                    ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                    : "border-emerald-700 text-emerald-400 hover:bg-emerald-900/20"
                }`}
              >
                <Upload className="w-4 h-4 mr-2" />
                导入内容
              </Button>
              <Button 
                variant="ghost"
                className="!bg-gradient-to-r !from-emerald-500 !to-teal-500 hover:!from-emerald-600 hover:!to-teal-600 !text-white rounded-xl !border-0"
              >
                <Plus className="w-4 h-4 mr-2" />
                新建内容
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* 左侧分类导航 */}
          <div className="col-span-3">
            <Card className={`sticky top-24 ${
              theme === "light" 
                ? "bg-white/80 border-emerald-100/60" 
                : "bg-gray-800/80 border-emerald-700/30"
            }`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Folder className="w-5 h-5" />
                  内容分类
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {contentCategories.map((category) => (
                  <div key={category.id}>
                    <Button
                      variant="ghost"
                      style={selectedCategory === category.id ? {
                        background: 'linear-gradient(to right, #10b981, #14b8a6)',
                        color: 'white',
                        border: 'none'
                      } : {}}
                      className={`w-full justify-start text-left ${
                        selectedCategory === category.id
                          ? ""
                          : theme === "light"
                            ? "text-gray-700 hover:bg-emerald-50"
                            : "text-gray-300 hover:bg-emerald-900/20"
                      }`}
                      onMouseEnter={(e) => {
                        if (selectedCategory === category.id) {
                          e.currentTarget.style.background = 'linear-gradient(to right, #059669, #0d9488)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedCategory === category.id) {
                          e.currentTarget.style.background = 'linear-gradient(to right, #10b981, #14b8a6)'
                        }
                      }}
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      <category.icon className="w-4 h-4 mr-2" />
                      {category.label}
                      <span className="ml-auto text-xs opacity-60">
                        {category.id === 'all' ? contentItems.length : 
                         contentItems.filter(item => 
                           item.type === category.id || item.category === category.id
                         ).length}
                      </span>
                    </Button>
                    
                    {/* 子分类 */}
                    {selectedCategory === category.id && category.subcategories && (
                      <div className="ml-6 mt-2 space-y-1">
                        {category.subcategories.map((sub) => (
                          <Button
                            key={sub.id}
                            variant="ghost"
                            size="sm"
                            className={`w-full justify-start text-left ${
                              theme === "light"
                                ? "text-gray-600 hover:bg-emerald-50"
                                : "text-gray-400 hover:bg-emerald-900/20"
                            }`}
                            onClick={() => setSelectedCategory(sub.id)}
                          >
                            <sub.icon className="w-3 h-3 mr-2" />
                            {sub.label}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* 主内容区域 */}
          <div className="col-span-9 space-y-6">
            {/* 搜索和筛选工具栏 */}
            <Card className={`${
              theme === "light" 
                ? "bg-white/80 border-emerald-100/60" 
                : "bg-gray-800/80 border-emerald-700/30"
            }`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                      theme === "light" ? "text-gray-400" : "text-gray-500"
                    }`} />
                    <Input
                      placeholder="搜索内容、标签..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className={`${
                      theme === "light"
                        ? "border-gray-200 text-gray-700 hover:bg-gray-50"
                        : "border-gray-600 text-gray-300 hover:bg-gray-700"
                    }`}
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    筛选
                  </Button>
                  <div className={`text-sm ${
                    theme === "light" ? "text-gray-600" : "text-gray-400"
                  }`}>
                    共 {filteredItems.length} 项内容
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 内容网格 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {loading ? (
                // 加载骨架
                Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className={`${
                    theme === "light" 
                      ? "bg-white/80 border-emerald-100/60" 
                      : "bg-gray-800/80 border-emerald-700/30"
                  }`}>
                    <CardHeader>
                      <div className="flex items-center gap-2 mb-2">
                        <Skeleton className="h-5 w-16" />
                        <Skeleton className="h-5 w-12" />
                      </div>
                      <Skeleton className="h-6 w-3/4" />
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                      <div className="flex gap-2">
                        <Skeleton className="h-6 w-12" />
                        <Skeleton className="h-6 w-16" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <ContentCard
                    key={item.id}
                    item={item}
                    onEdit={handleEdit}
                    onSync={handleSync}
                    onDelete={handleDelete}
                  />
                ))
              ) : (
                <div className="col-span-2 text-center py-12">
                  <div className={`text-6xl mb-4 opacity-20 ${
                    theme === "light" ? "text-gray-400" : "text-gray-600"
                  }`}>
                    📁
                  </div>
                  <p className={`text-lg font-medium mb-2 ${
                    theme === "light" ? "text-gray-700" : "text-gray-300"
                  }`}>
                    暂无内容
                  </p>
                  <p className={`text-sm ${
                    theme === "light" ? "text-gray-500" : "text-gray-400"
                  }`}>
                    {selectedCategory === 'all' 
                      ? '还没有任何内容，开始创建您的第一个内容吧！'
                      : '当前分类下暂无内容，试试其他分类或创建新内容。'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 内容编辑对话框 */}
      <ContentEditDialog
        item={editingItem}
        isOpen={showEditDialog}
        onClose={() => {
          setShowEditDialog(false)
          setEditingItem(null)
        }}
        onSave={handleSave}
      />

      {/* 同步状态监控器 */}
      <AnimatePresence>
        <SyncStatusMonitor activeTasks={activeSyncTasks} />
      </AnimatePresence>
    </div>
  )
} 