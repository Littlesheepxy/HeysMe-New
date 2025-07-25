'use client'

import { Suspense, useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Search, Filter, Users, MapPin, Clock, Sparkles, Heart, Eye, MessageSquare, ChevronRight, Star, TrendingUp, BookTemplate, ArrowLeft, Folder } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useTheme } from '@/contexts/theme-context'

const categories = [
  '全部',
  '求职',
  '招聘',
  '寻找合作',
  '寻找投资人/投资机会',
  '托管/运营服务',
  '咨询服务',
  '个人展示/KOL',
  '内容创作者/自媒体',
  '教育辅导',
  '自由职业/开发者',
  '其他'
]

function UserCard({ user, index }: { user: any, index: number }) {
  const { theme } = useTheme()
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ 
        y: -8,
        scale: 1.02,
        transition: { type: "spring", stiffness: 300 }
      }}
    >
      <Card className={`group overflow-hidden border-2 transition-all duration-300 hover:shadow-2xl cursor-pointer ${
        theme === "light" 
          ? "bg-white/90 backdrop-blur border-emerald-100/60 hover:border-emerald-200 hover:shadow-emerald-100/20" 
          : "bg-gray-800/90 backdrop-blur border-emerald-700/30 hover:border-emerald-600/50 hover:shadow-emerald-900/20"
      }`}>
        <CardContent className="p-6">
          {/* 用户信息头部 */}
          <div className="flex items-start gap-4 mb-4">
            <div className="relative">
              <Avatar className="w-12 h-12 ring-2 ring-emerald-500/20">
                <AvatarImage src={user.avatar} alt={user.displayName} />
                <AvatarFallback className="bg-emerald-500 text-white">
                  {user.displayName?.slice(0, 2) || user.username?.slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              {user.verified && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
              )}
              {user.trending && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge 
                  variant="secondary" 
                  className={`text-xs font-medium ${
                    theme === "light" 
                      ? "bg-emerald-100 text-emerald-700 border-emerald-200" 
                      : "bg-emerald-900/50 text-emerald-300 border-emerald-700"
                  }`}
                >
                  {user.category}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <MapPin className="w-3 h-3" />
                <span>{user.location}</span>
                <Clock className="w-3 h-3 ml-2" />
                <span>{user.updatedAt}</span>
              </div>
            </div>
          </div>

          {/* 标题和描述 */}
          <div className="mb-4">
            <h3 className={`font-bold text-lg mb-2 group-hover:text-emerald-600 transition-colors line-clamp-2 ${
              theme === "light" ? "text-gray-900" : "text-white"
            }`}>
              {user.title}
            </h3>
            <p className={`text-sm leading-relaxed line-clamp-3 ${
              theme === "light" ? "text-gray-600" : "text-gray-400"
            }`}>
              {user.description}
            </p>
          </div>

          {/* 标签 */}
          <div className="flex flex-wrap gap-2 mb-4">
            {user.tags?.slice(0, 2).map((tag: string, i: number) => (
              <Badge 
                key={i} 
                variant="outline" 
                className={`text-xs ${
                  theme === "light" 
                    ? "border-gray-200 text-gray-600 bg-gray-50" 
                    : "border-gray-600 text-gray-300 bg-gray-700/50"
                }`}
              >
                {tag}
              </Badge>
            ))}
            {user.industryTags?.slice(0, 1).map((tag: string, i: number) => (
              <Badge 
                key={`industry-${i}`} 
                variant="outline" 
                className={`text-xs ${
                  theme === "light" 
                    ? "border-blue-200 text-blue-600 bg-blue-50" 
                    : "border-blue-600 text-blue-300 bg-blue-700/50"
                }`}
              >
                {tag}
              </Badge>
            ))}
          </div>

          {/* 统计和操作 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span>{user.viewCount}</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart className="w-4 h-4" />
                <span>{user.favoriteCount}</span>
              </div>
            </div>
            <Button
              size="sm"
              className={`group-hover:bg-emerald-600 transition-all duration-300 ${
                theme === "light" 
                  ? "bg-emerald-500 hover:bg-emerald-600" 
                  : "bg-emerald-600 hover:bg-emerald-500"
              }`}
            >
              查看详情
              <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function SearchAndFilter({ searchTerm, setSearchTerm, selectedCategory, setSelectedCategory }: {
  searchTerm: string
  setSearchTerm: (term: string) => void
  selectedCategory: string
  setSelectedCategory: (category: string) => void
}) {
  const { theme } = useTheme()
  
  return (
    <motion.div 
      className="space-y-6 mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      {/* 搜索框 */}
      <div className="relative max-w-2xl mx-auto">
        <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
          theme === "light" ? "text-gray-400" : "text-gray-500"
        }`} />
        <Input
          placeholder="搜索感兴趣的人和项目..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`pl-12 pr-4 py-4 text-lg rounded-2xl transition-all duration-300 border-2 ${
            theme === "light" 
              ? "bg-white/80 border-emerald-100/60 focus:border-emerald-300 focus:bg-white" 
              : "bg-gray-800/80 border-emerald-700/30 focus:border-emerald-600 focus:bg-gray-800"
          }`}
        />
      </div>
      
      {/* 分类筛选 */}
      <div className="flex flex-wrap justify-center gap-3">
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(category)}
            className={`rounded-full px-4 py-2 transition-all duration-300 ${
              selectedCategory === category
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-500' 
                : theme === "light"
                  ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300'
                  : 'border-emerald-700 text-emerald-300 hover:bg-emerald-900/30 hover:border-emerald-600'
            }`}
          >
            {category}
          </Button>
        ))}
      </div>
    </motion.div>
  )
}

function UserGrid({ users, loading, error, onRetry }: {
  users: any[]
  loading: boolean
  error: string | null
  onRetry: () => void
}) {
  const { theme } = useTheme()

  if (loading) return <LoadingSkeleton />
  
  if (error) return (
    <div className="text-center py-12">
      <p className={`text-lg mb-4 ${theme === "light" ? "text-red-600" : "text-red-400"}`}>
        {error}
      </p>
      <Button onClick={onRetry} variant="outline">
        重试
      </Button>
    </div>
  )

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {users.map((user, index) => (
        <UserCard key={user.id} user={user} index={index} />
      ))}
      {users.length === 0 && (
        <div className="col-span-full text-center py-12">
          <div className="max-w-md mx-auto">
            <Users className={`w-16 h-16 mx-auto mb-4 ${
              theme === "light" ? "text-gray-400" : "text-gray-600"
            }`} />
            <p className={`text-lg mb-2 ${theme === "light" ? "text-gray-600" : "text-gray-400"}`}>
              暂无匹配的用户
            </p>
            <p className={`text-sm ${theme === "light" ? "text-gray-500" : "text-gray-500"}`}>
              尝试调整搜索条件或创建你的第一个页面分享到广场
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function LoadingSkeleton() {
  const { theme } = useTheme()
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {[...Array(6)].map((_, i) => (
        <Card key={i} className={`overflow-hidden ${
          theme === "light" 
            ? "bg-white/80 border-emerald-100/60" 
            : "bg-gray-800/80 border-emerald-700/30"
        }`}>
          <CardContent className="p-6">
            <div className="flex items-start gap-4 mb-4">
              <Skeleton className="w-12 h-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
            <div className="space-y-3">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <div className="flex gap-2 mt-4 mb-4">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-20" />
            </div>
            <div className="flex justify-between items-center">
              <div className="flex gap-3">
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-4 w-8" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function PeoplePage() {
  const { theme } = useTheme()
  const contentRef = useRef<HTMLElement>(null)
  const [hasScrolled, setHasScrolled] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('全部')
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 滚动到内容区域的函数
  const scrollToContent = () => {
    if (contentRef.current) {
      contentRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      })
      setHasScrolled(true)
    }
  }

  // 监听鼠标滚轮事件
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // 只有向下滚动且还没有滚动过时才触发
      if (e.deltaY > 0 && !hasScrolled) {
        setTimeout(() => {
          scrollToContent()
        }, 100) // 小延迟确保滚动体验更自然
      }
    }

    window.addEventListener('wheel', handleWheel, { passive: true })
    
    return () => {
      window.removeEventListener('wheel', handleWheel)
    }
  }, [hasScrolled])

  // 监听键盘事件（向下箭头键）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'ArrowDown' || e.key === 'PageDown') && !hasScrolled) {
        e.preventDefault()
        scrollToContent()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [hasScrolled])

  // 获取用户数据
  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams()
      if (selectedCategory !== '全部') params.append('category', selectedCategory)
      if (searchTerm.trim()) params.append('search', searchTerm.trim())
      
      const response = await fetch(`/api/user-pages?${params}`)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      setUsers(result.data || [])
    } catch (err: any) {
      setError(err.message || '获取数据失败')
      console.error('获取用户数据失败:', err)
    } finally {
      setLoading(false)
    }
  }

  // 页面加载时获取数据
  useEffect(() => {
    fetchUsers()
  }, [selectedCategory])

  // 搜索防抖
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchUsers()
    }, 500)
    return () => clearTimeout(timeoutId)
  }, [searchTerm])
  
  return (
    <div className={`min-h-screen transition-all duration-300 ${
      theme === "light" 
        ? "bg-page-gradient-light" 
        : "bg-page-gradient-dark"
    }`}>
      {/* 顶部导航栏 */}
      <header className={`sticky top-0 z-50 backdrop-blur-xl border-b transition-all duration-300 ${
        theme === "light" 
          ? "bg-white/80 border-emerald-100/50" 
          : "bg-gray-900/80 border-emerald-700/30"
      }`}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo区域 */}
            <motion.div 
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className={`text-xl font-bold ${
                  theme === "light" ? "text-gray-900" : "text-white"
                }`}>
                  HeysMe
                </h1>
                <p className={`text-sm ${
                  theme === "light" ? "text-emerald-600" : "text-emerald-400"
                }`}>
                  数字身份广场
                </p>
              </div>
            </motion.div>

            {/* 导航菜单 */}
            <motion.div 
              className="flex items-center gap-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Button 
                variant="ghost"
                className={`rounded-xl ${
                  theme === "light"
                    ? "text-gray-600 hover:text-emerald-600 hover:bg-emerald-50"
                    : "text-gray-400 hover:text-emerald-400 hover:bg-emerald-900/20"
                }`}
              >
                <a href="/templates" className="flex items-center gap-2">
                  <BookTemplate className="w-4 h-4" />
                  模板库
                </a>
              </Button>
              <Button 
                variant="ghost"
                className={`rounded-xl ${
                  theme === "light"
                    ? "text-gray-600 hover:text-emerald-600 hover:bg-emerald-50"
                    : "text-gray-400 hover:text-emerald-400 hover:bg-emerald-900/20"
                }`}
              >
                <a href="/content-manager" className="flex items-center gap-2">
                  <Folder className="w-4 h-4" />
                  内容管理
                </a>
              </Button>
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
              <Button 
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl"
                onClick={scrollToContent}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                创建页面
              </Button>
            </motion.div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6">
        {/* 主要内容区域 - 全屏高度 */}
        <div className="min-h-[calc(100vh-80px)] flex flex-col">
          
          {/* Hero区域 - 突出价值主张 */}
          <motion.section 
            className="flex-1 flex items-center justify-center py-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="max-w-4xl mx-auto text-center space-y-8">
              
              {/* 主标题和价值主张 */}
              <div className="space-y-6">
                <motion.h1 
                  className="text-6xl sm:text-7xl lg:text-8xl font-bold"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                    发现
                  </span>
                  <br />
                  <span className={`${
                    theme === "light" ? "text-gray-900" : "text-white"
                  }`}>
                    有趣的人
                  </span>
                </motion.h1>

                <motion.div 
                  className="space-y-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <p className={`text-2xl sm:text-3xl font-semibold ${
                    theme === "light" ? "text-gray-700" : "text-gray-300"
                  }`}>
                    寻找合作机会，建立有价值的连接
                  </p>
                  <p className={`text-lg ${
                    theme === "light" ? "text-emerald-600" : "text-emerald-400"
                  }`}>
                    Words are cheap, show your demo.
                  </p>
                </motion.div>
              </div>

              {/* 统计数据 */}
              <motion.div 
                className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                {[
                  { label: "活跃用户", value: "1,234+", icon: Users },
                  { label: "成功连接", value: "856+", icon: Heart },
                  { label: "合作项目", value: "2,156+", icon: Star }
                ].map((stat, index) => (
                  <motion.div 
                    key={stat.label}
                    className={`text-center p-6 rounded-2xl backdrop-blur-sm border cursor-pointer ${
                      theme === "light" 
                        ? "bg-white/60 border-white/80" 
                        : "bg-gray-800/60 border-gray-700/80"
                    }`}
                    whileHover={{ scale: 1.05, y: -5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    onClick={scrollToContent}
                  >
                    <stat.icon className={`w-8 h-8 mx-auto mb-4 ${
                      theme === "light" ? "text-emerald-600" : "text-emerald-400"
                    }`} />
                    <div className={`text-3xl font-bold mb-2 ${
                      theme === "light" ? "text-gray-900" : "text-white"
                    }`}>
                      {stat.value}
                    </div>
                    <div className={`text-sm ${
                      theme === "light" ? "text-gray-600" : "text-gray-400"
                    }`}>
                      {stat.label}
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              {/* CTA按钮组 */}
              <motion.div 
                className="flex flex-col sm:flex-row gap-4 justify-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-8 py-4 text-lg rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300"
                  onClick={scrollToContent}
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  创建我的页面
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  className={`px-8 py-4 text-lg rounded-2xl border-2 transition-all duration-300 ${
                    theme === "light"
                      ? "border-emerald-200 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50"
                      : "border-emerald-700 text-emerald-400 hover:border-emerald-600 hover:bg-emerald-900/20"
                  }`}
                  onClick={scrollToContent}
                >
                  <Eye className="w-5 h-5 mr-2" />
                  浏览精选用户
                </Button>
              </motion.div>
            </div>
          </motion.section>

          {/* 快速搜索区域 */}
          <motion.section 
            className="py-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
          >
            <div className="max-w-3xl mx-auto">
              <div className="relative">
                <Search className={`absolute left-6 top-1/2 transform -translate-y-1/2 w-6 h-6 ${
                  theme === "light" ? "text-gray-400" : "text-gray-500"
                }`} />
                <Input
                  placeholder="搜索感兴趣的人、技能、项目..."
                  className={`pl-16 h-16 text-lg rounded-2xl border-2 transition-all duration-300 ${
                    theme === "light"
                      ? "bg-white/80 border-emerald-100 focus:border-emerald-300 focus:bg-white"
                      : "bg-gray-800/80 border-emerald-700/30 focus:border-emerald-500 focus:bg-gray-800"
                  }`}
                  onFocus={scrollToContent}
                />
              </div>
            </div>
          </motion.section>
        </div>

        {/* 用户网格区域 - 添加ref引用 */}
        <motion.section
          ref={contentRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="pb-16"
        >
          <SearchAndFilter 
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
          />
           <Suspense fallback={<LoadingSkeleton />}>
             <UserGrid 
               users={users}
               loading={loading}
               error={error}
               onRetry={fetchUsers}
             />
           </Suspense>
        </motion.section>
      </div>
      
      {/* 背景装饰 */}
      <div className="fixed top-20 left-10 w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full opacity-5 animate-pulse"></div>
      <div className="fixed bottom-20 right-10 w-32 h-32 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full opacity-3 animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="fixed top-1/2 right-20 w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full opacity-5 animate-pulse" style={{ animationDelay: '2s' }}></div>
    </div>
  )
} 