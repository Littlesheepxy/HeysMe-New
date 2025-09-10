/**
 * 项目管理仪表板 - 专业的项目管理中心 - 品牌UI升级版
 *
 * 核心功能：
 * - 项目概览和统计分析
 * - 项目搜索、筛选和批量操作
 * - 项目状态管理和发布控制
 * - 访问数据分析和性能监控
 *
 * 设计理念：
 * - 🎨 统一品牌设计语言（翠绿色渐变系）
 * - 🚀 现代化玻璃拟态界面
 * - ✨ 优雅的交互动画
 * - 📊 直观的数据可视化
 */

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Share2,
  Trash2,
  Calendar,
  TrendingUp,
  Users,
  Settings,
  LogOut,
  Sparkles,
  MessageSquare,
  Code2,
  Globe,
  Clock,
  ChevronRight,
  ExternalLink,
  Download,
  Star,
  Activity,
} from "lucide-react"
import { useTheme } from "@/contexts/theme-context"
import { ThemeToggle } from "@/components/navigation/theme-toggle"
import { supabase } from "@/lib/supabase"

// 项目数据类型定义
interface Project {
  id: string
  title: string
  slug: string
  theme: string
  layout: string
  visibility: 'public' | 'private'
  is_featured: boolean
  blocks?: any[]
  updated_at: string
  created_at: string
  views?: number
  shares?: number
  status: 'draft' | 'published' | 'archived'
}

export default function DashboardPage() {
  const { theme } = useTheme()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'published' | 'archived'>('all')
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const [user, setUser] = useState<any>(null)

  // 获取用户信息和项目
  useEffect(() => {
    const fetchUserAndProjects = async () => {
      try {
        // 获取当前用户
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          router.push("/sign-in")
          return
        }
        setUser(user)

        // 获取用户项目
        const response = await fetch(`/api/pages?userId=${user.id}`)
        const result = await response.json()

        if (result.success) {
          setProjects(result.data)
        }
      } catch (error) {
        console.error("获取数据失败:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserAndProjects()
  }, [router])

  // 返回聊天界面（主要创建入口）
  const handleBackToChat = () => {
    router.push("/chat")
  }

  // 创建新项目（从dashboard快速创建）
  const handleQuickCreate = () => {
    router.push("/chat")
  }

  // 编辑项目
  const handleEditProject = (projectId: string) => {
    router.push(`/chat?session=${projectId}`)
  }

  // 预览项目
  const handlePreviewProject = (slug: string) => {
    window.open(`/p/${slug}`, "_blank")
  }

  // 发布/取消发布项目
  const handleTogglePublish = async (projectId: string, currentStatus: string) => {
    // TODO: 实现发布状态切换
    console.log('Toggle publish:', projectId, currentStatus)
  }

  // 删除项目
  const handleDeleteProject = async (projectId: string) => {
    if (confirm('确定要删除这个项目吗？此操作不可恢复。')) {
      // TODO: 实现删除功能
      console.log('Delete project:', projectId)
    }
  }

  // 批量操作
  const handleBatchAction = (action: 'publish' | 'unpublish' | 'delete') => {
    if (selectedProjects.length === 0) return
    console.log('Batch action:', action, selectedProjects)
    // TODO: 实现批量操作
  }

  // 登出
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  // 高级过滤项目
  const filteredProjects = projects.filter((project) => {
    const matchesSearch = 
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.slug.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || project.status === filterStatus
    
    return matchesSearch && matchesStatus
  })

  // 计算统计数据
  const stats = {
    total: projects.length,
    published: projects.filter(p => p.status === 'published').length,
    draft: projects.filter(p => p.status === 'draft').length,
    totalViews: projects.reduce((sum, p) => sum + (p.views || 0), 0),
    totalShares: projects.reduce((sum, p) => sum + (p.shares || 0), 0),
    thisMonthGrowth: 23 // TODO: 计算真实增长率
  }

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-all duration-300 ${
        theme === "light" 
          ? "bg-page-gradient-light" 
          : "bg-page-gradient-dark"
      }`}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-brand animate-brand-breathe overflow-hidden">
            <img 
              src="/logo.png" 
              alt="HeysMe Logo" 
              className="w-12 h-12 object-contain"
            />
          </div>
          <p className={`text-lg font-medium ${theme === "light" ? "text-gray-600" : "text-gray-300"}`}>
            加载项目数据中...
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div
      className={`min-h-screen transition-all duration-300 ${
        theme === "light" 
          ? "bg-page-gradient-light" 
          : "bg-page-gradient-dark"
      }`}
    >
      {/* 🎨 顶部导航 - 品牌设计升级 */}
      <header
        className={`backdrop-blur-xl px-6 py-4 transition-all duration-300 ${
          theme === "light" 
            ? "bg-white/80 shadow-brand-sm" 
            : "bg-[#181818]/80 shadow-brand-sm"
        }`}
      >
        <div className="flex items-center justify-between">
          <motion.div 
            className="flex items-center gap-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-brand overflow-hidden">
              <img 
                src="/logo.png" 
                alt="HeysMe Logo" 
                className="w-10 h-10 object-contain"
              />
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${theme === "light" ? "text-gray-900" : "text-white"}`}>
                项目管理中心
              </h1>
              <p className={`text-sm ${theme === "light" ? "text-emerald-600" : "text-emerald-400"}`}>
                专业的项目管理和数据分析平台
              </p>
            </div>
          </motion.div>

          <motion.div 
            className="flex items-center gap-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Button 
              variant="outline" 
              onClick={handleBackToChat}
              className={`rounded-2xl border-2 transition-all duration-300 ${
                theme === "light"
                  ? "border-emerald-200 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50"
                  : "border-emerald-700 text-emerald-400 hover:border-emerald-600 hover:bg-emerald-900/20"
              }`}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              回到聊天界面
            </Button>
            
            <Button 
              asChild
              variant="outline" 
              className={`rounded-2xl border-2 transition-all duration-300 ${
                theme === "light"
                  ? "border-emerald-200 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50"
                  : "border-emerald-700 text-emerald-400 hover:border-emerald-600 hover:bg-emerald-900/20"
              }`}
            >
              <a href="/content-manager" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                内容管理
              </a>
            </Button>
            
            <ThemeToggle />

            {/* 用户菜单 - 品牌色升级 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="ghost" className="relative h-12 w-12 rounded-2xl">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user?.user_metadata?.avatar_url || "/placeholder.svg"} alt={user?.email} />
                      <AvatarFallback className="bg-brand-gradient text-white font-semibold">
                        {user?.email?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </motion.div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.user_metadata?.username || "用户"}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>设置</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Users className="mr-2 h-4 w-4" />
                  <span>团队</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>登出</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </motion.div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* 🎨 统计卡片 - 品牌设计升级 */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ staggerChildren: 0.1 }}
        >
          {[
            {
              icon: Sparkles,
              label: "总项目",
              value: stats.total,
              subtitle: `${stats.published} 已发布 · ${stats.draft} 草稿`,
              color: "emerald",
              gradient: "from-emerald-500 to-teal-500"
            },
            {
              icon: Eye,
              label: "总访问",
              value: stats.totalViews.toLocaleString(),
              subtitle: `平均 ${Math.round(stats.totalViews / Math.max(stats.published, 1))} 次/项目`,
              color: "cyan",
              gradient: "from-cyan-500 to-blue-500"
            },
            {
              icon: TrendingUp,
              label: "本月增长",
              value: `+${stats.thisMonthGrowth}%`,
              subtitle: "较上月增长",
              color: "teal",
              gradient: "from-teal-500 to-emerald-500"
            },
            {
              icon: Share2,
              label: "分享次数",
              value: stats.totalShares,
              subtitle: `平均 ${Math.round(stats.totalShares / Math.max(stats.published, 1))} 次/项目`,
              color: "blue",
              gradient: "from-blue-500 to-cyan-500"
            }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <Card className={`relative overflow-hidden transition-all duration-300 hover:shadow-brand-lg ${
                theme === "light" 
                  ? "bg-white/80 border-emerald-100/60 backdrop-blur-xl" 
                  : "bg-gray-800/80 border-emerald-700/30 backdrop-blur-xl"
              }`}>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className={`p-3 rounded-2xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="ml-4 flex-1">
                      <p className={`text-sm font-medium ${
                        theme === "light" ? "text-gray-600" : "text-gray-400"
                      }`}>
                        {stat.label}
                      </p>
                      <p className={`text-2xl font-bold ${
                        theme === "light" ? "text-gray-900" : "text-white"
                      }`}>
                        {stat.value}
                      </p>
                      <p className={`text-xs ${
                        stat.label === "本月增长" 
                          ? "text-emerald-600" 
                          : theme === "light" ? "text-gray-500" : "text-gray-400"
                      }`}>
                        {stat.subtitle}
                      </p>
                    </div>
                  </div>
                </CardContent>
                {/* 背景装饰 */}
                <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${stat.gradient} opacity-5 rounded-bl-3xl`}></div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* 🎨 项目管理区域 - 品牌设计升级 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className={`transition-all duration-300 ${
            theme === "light" 
              ? "bg-white/80 border-emerald-100/60 backdrop-blur-xl shadow-brand" 
              : "bg-gray-800/80 border-emerald-700/30 backdrop-blur-xl shadow-brand"
          }`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-gradient rounded-2xl flex items-center justify-center shadow-brand">
                    <Code2 className="w-5 h-5 text-white" />
                  </div>
                  <CardTitle className={`text-xl ${theme === "light" ? "text-gray-900" : "text-white"}`}>
                    我的项目
                  </CardTitle>
                </div>
                <Button 
                  onClick={handleQuickCreate} 
                  className="rounded-2xl h-12 px-6 text-white font-medium transition-all duration-300 hover:shadow-lg transform hover:scale-105"
                  style={{
                    background: 'linear-gradient(135deg, #34D399 0%, #2DD4BF 50%, #22D3EE 100%)',
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  快速创建
                </Button>
              </div>

              {/* 🎨 搜索和筛选 - 品牌设计升级 */}
              <div className="flex items-center gap-4 mt-6">
                <div className="relative flex-1 max-w-sm">
                  <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                    theme === "light" ? "text-gray-400" : "text-gray-500"
                  }`} />
                  <Input
                    placeholder="搜索项目..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`pl-12 h-12 rounded-2xl border-2 transition-all duration-300 ${
                      theme === "light"
                        ? "border-emerald-200 focus:border-emerald-400 bg-white/60"
                        : "border-emerald-700 focus:border-emerald-500 bg-gray-800/60"
                    }`}
                  />
                </div>
                
                {/* 状态筛选 - 品牌色升级 */}
                <div className="flex gap-2">
                  {(['all', 'published', 'draft', 'archived'] as const).map((status) => (
                    <Button
                      key={status}
                      variant={filterStatus === status ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterStatus(status)}
                      className={`rounded-2xl h-10 px-4 transition-all duration-300 ${
                        filterStatus === status
                          ? "bg-brand-gradient text-white border-0 shadow-brand"
                          : theme === "light"
                            ? "border-emerald-200 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50"
                            : "border-emerald-700 text-emerald-400 hover:border-emerald-600 hover:bg-emerald-900/20"
                      }`}
                    >
                      {status === 'all' && '全部'}
                      {status === 'published' && '已发布'}
                      {status === 'draft' && '草稿'}
                      {status === 'archived' && '已归档'}
                    </Button>
                  ))}
                </div>

                {/* 批量操作 - 品牌色升级 */}
                {selectedProjects.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className={`rounded-2xl h-10 border-2 transition-all duration-300 ${
                          theme === "light"
                            ? "border-emerald-300 text-emerald-700 bg-emerald-50"
                            : "border-emerald-600 text-emerald-400 bg-emerald-900/20"
                        }`}
                      >
                        批量操作 ({selectedProjects.length})
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleBatchAction('publish')}>
                        批量发布
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBatchAction('unpublish')}>
                        批量取消发布
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleBatchAction('delete')}
                        className="text-red-600"
                      >
                        批量删除
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </CardHeader>

            <CardContent>
              <AnimatePresence>
                {filteredProjects.length > 0 ? (
                  <motion.div 
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    layout
                  >
                    {filteredProjects.map((project, index) => (
                      <motion.div
                        key={project.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ y: -4, transition: { duration: 0.2 } }}
                      >
                        <Card className={`relative group cursor-pointer transition-all duration-300 overflow-hidden hover:shadow-brand-lg ${
                          theme === "light" 
                            ? "bg-white/60 border-emerald-100/60 backdrop-blur-sm hover:bg-white/80" 
                            : "bg-gray-800/60 border-emerald-700/30 backdrop-blur-sm hover:bg-gray-800/80"
                        }`}>
                          <CardContent className="p-6">
                            {/* 项目状态和操作 */}
                            <div className="flex items-center justify-between mb-4">
                              <Badge 
                                variant={project.status === 'published' ? 'default' : 'secondary'}
                                className={`rounded-full text-xs font-medium ${
                                  project.status === 'published' 
                                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                                    : project.status === 'draft'
                                      ? 'bg-amber-100 text-amber-700 border-amber-200'
                                      : 'bg-gray-100 text-gray-700 border-gray-200'
                                }`}
                              >
                                {project.status === 'published' && '已发布'}
                                {project.status === 'draft' && '草稿'}
                                {project.status === 'archived' && '已归档'}
                              </Badge>
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className={`w-8 h-8 p-0 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 ${
                                      theme === "light"
                                        ? "hover:bg-emerald-100 text-emerald-600"
                                        : "hover:bg-emerald-800 text-emerald-400"
                                    }`}
                                  >
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEditProject(project.id)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    编辑
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handlePreviewProject(project.slug)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    预览
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Share2 className="mr-2 h-4 w-4" />
                                    分享
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteProject(project.id)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    删除
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            {/* 项目信息 */}
                            <div className="space-y-4">
                              <div>
                                <h3 className={`font-semibold text-lg truncate ${
                                  theme === "light" ? "text-gray-900" : "text-white"
                                }`}>
                                  {project.title}
                                </h3>
                                <p className={`text-sm mt-1 ${
                                  theme === "light" ? "text-gray-500" : "text-gray-400"
                                }`}>
                                  {project.slug}
                                </p>
                              </div>

                              {/* 统计信息 */}
                              <div className="flex items-center gap-4 text-sm">
                                <div className={`flex items-center gap-1 ${
                                  theme === "light" ? "text-gray-600" : "text-gray-400"
                                }`}>
                                  <Eye className="w-4 h-4" />
                                  <span>{project.views || 0}</span>
                                </div>
                                <div className={`flex items-center gap-1 ${
                                  theme === "light" ? "text-gray-600" : "text-gray-400"
                                }`}>
                                  <Share2 className="w-4 h-4" />
                                  <span>{project.shares || 0}</span>
                                </div>
                                <div className={`flex items-center gap-1 ${
                                  theme === "light" ? "text-gray-600" : "text-gray-400"
                                }`}>
                                  <Clock className="w-4 h-4" />
                                  <span>{new Date(project.updated_at).toLocaleDateString()}</span>
                                </div>
                              </div>

                              {/* 操作按钮 */}
                              <div className="flex gap-2 pt-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleEditProject(project.id)}
                                  className={`flex-1 rounded-xl transition-all duration-300 ${
                                    theme === "light"
                                      ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                                      : "bg-emerald-900/20 text-emerald-400 hover:bg-emerald-900/30 border border-emerald-700"
                                  }`}
                                  variant="outline"
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  编辑
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handlePreviewProject(project.slug)}
                                  className={`flex-1 rounded-xl transition-all duration-300 ${
                                    theme === "light"
                                      ? "bg-cyan-50 text-cyan-700 hover:bg-cyan-100 border border-cyan-200"
                                      : "bg-cyan-900/20 text-cyan-400 hover:bg-cyan-900/30 border border-cyan-700"
                                  }`}
                                  variant="outline"
                                >
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  预览
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                          
                          {/* 鼠标悬停时的装饰 */}
                          <div className="absolute top-0 left-0 w-full h-1 bg-brand-gradient opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </Card>
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`text-center py-16 ${theme === "light" ? "text-gray-500" : "text-gray-400"}`}
                  >
                    <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center ${
                      theme === "light" ? "bg-emerald-100" : "bg-emerald-900/30"
                    }`}>
                      <Code2 className={`w-10 h-10 ${
                        theme === "light" ? "text-emerald-500" : "text-emerald-400"
                      }`} />
                    </div>
                    <h3 className="text-lg font-medium mb-2">暂无项目</h3>
                    <p className="text-sm mb-6">点击「快速创建」开始制作你的第一个项目</p>
                    <Button 
                      onClick={handleQuickCreate}
                      className="rounded-2xl text-white font-medium transition-all duration-300 hover:shadow-lg transform hover:scale-105"
                      style={{
                        background: 'linear-gradient(135deg, #34D399 0%, #2DD4BF 50%, #22D3EE 100%)',
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      创建第一个项目
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* 🎨 装饰性背景元素 - 与landing页面保持一致 */}
      <div className="fixed top-20 left-10 w-20 h-20 bg-brand-gradient rounded-full opacity-5 animate-brand-pulse"></div>
      <div className="fixed bottom-20 right-10 w-32 h-32 bg-brand-gradient rounded-full opacity-3 animate-brand-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="fixed top-1/2 right-20 w-16 h-16 bg-brand-gradient rounded-full opacity-5 animate-brand-pulse" style={{ animationDelay: '2s' }}></div>
    </div>
  )
}
