"use client"

import { motion } from "framer-motion"
import { useI18n } from "@/contexts/i18n-context"
import { Quote, Star } from "lucide-react"
import { Marquee } from "@/src/components/magicui/marquee"
import { AvatarCircles } from "@/components/ui/avatar-circles"
import { FlickeringGrid } from "@/components/ui/flickering-grid"
import { cn } from "@/lib/utils"

// 使用渐变头像的测试数据
const reviews = [
  {
    name: "张明",
    role: "UI/UX设计师",
    body: "AI数字分身让我能更好地展示专业能力，获得了更多合作机会。",
    gradientFrom: "from-emerald-400",
    gradientTo: "to-cyan-500",
  },
  {
    name: "刘薇", 
    role: "营销顾问",
    body: "这个平台帮我建立了个人品牌，客户找到我变得更加容易。",
    gradientFrom: "from-blue-400",
    gradientTo: "to-emerald-500",
  },
  {
    name: "陈浩",
    role: "软件工程师", 
    body: "技术很先进，生成的数字分身非常贴近真实的我。",
    gradientFrom: "from-purple-400",
    gradientTo: "to-pink-500",
  },
  {
    name: "王丽",
    role: "产品经理",
    body: "界面设计很人性化，操作简单，效果惊艳。",
    gradientFrom: "from-cyan-400", 
    gradientTo: "to-blue-500",
  },
  {
    name: "李强",
    role: "创业者",
    body: "客服支持很棒，遇到问题都能快速解决。",
    gradientFrom: "from-orange-400",
    gradientTo: "to-red-500",
  },
  {
    name: "赵敏",
    role: "设计师",
    body: "这个工具改变了我展示作品的方式，非常推荐。",
    gradientFrom: "from-pink-400",
    gradientTo: "to-purple-500",
  },
  {
    name: "孙杰",
    role: "内容创作者",
    body: "AI生成的内容质量超出预期，很有创意。",
    gradientFrom: "from-green-400",
    gradientTo: "to-emerald-500",
  },
  {
    name: "周雨",
    role: "自由职业者",
    body: "使用体验流畅，功能强大且实用。",
    gradientFrom: "from-indigo-400",
    gradientTo: "to-cyan-500",
  },
  {
    name: "吴晨",
    role: "投资人",
    body: "看好这个方向，产品体验很棒。",
    gradientFrom: "from-teal-400",
    gradientTo: "to-green-500",
  },
  {
    name: "马琳",
    role: "HR总监",
    body: "帮助我们更好地筛选和展示人才。",
    gradientFrom: "from-rose-400",
    gradientTo: "to-orange-500",
  }
]

const firstRow = reviews.slice(0, reviews.length / 2)
const secondRow = reviews.slice(reviews.length / 2)

// 评价卡片组件
const ReviewCard = ({
  name,
  role,
  body,
  gradientFrom,
  gradientTo,
}: {
  name: string
  role: string
  body: string
  gradientFrom: string
  gradientTo: string
}) => {
  // 获取用户名首字母
  const initial = name.charAt(0).toUpperCase()

  return (
    <figure
      className={cn(
        "relative h-full w-80 cursor-pointer overflow-hidden rounded-xl border p-6 mx-4",
        // light styles
        "border-gray-200 bg-white hover:bg-gray-50 shadow-lg hover:shadow-xl transition-all duration-300",
      )}
    >
      <div className="flex flex-row items-center gap-3 mb-4">
        {/* 渐变头像 */}
        <div 
          className={cn(
            "rounded-full w-10 h-10 flex items-center justify-center text-white font-bold text-sm",
            "bg-gradient-to-br",
            gradientFrom,
            gradientTo
          )}
        >
          {initial}
        </div>
        <div className="flex flex-col">
          <figcaption className="text-sm font-semibold text-gray-900">
            {name}
          </figcaption>
          <p className="text-xs font-medium text-gray-500">{role}</p>
        </div>
      </div>
      
      {/* 星级评分 */}
      <div className="flex gap-1 mb-3">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        ))}
      </div>
      
      {/* 评价内容 */}
      <blockquote className="text-sm text-gray-700 leading-relaxed">
        <Quote className="w-4 h-4 text-gray-400 mb-2" />
        {body}
      </blockquote>
    </figure>
  )
}

// 头像圆圈数据 
const avatarUrls = [
  { imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face", profileUrl: "#" },
  { imageUrl: "https://images.unsplash.com/photo-1494790108755-2616b612b742?w=40&h=40&fit=crop&crop=face", profileUrl: "#" },
  { imageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face", profileUrl: "#" },
  { imageUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face", profileUrl: "#" },
  { imageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=face", profileUrl: "#" },
]

export function TestimonialsSection() {
  const { t } = useI18n()

  return (
    <section className="min-h-screen flex items-center py-20 relative overflow-hidden bg-white">
      {/* Flickering Grid 背景 */}
      <FlickeringGrid
        className="absolute inset-0 z-0"
        squareSize={4}
        gridGap={6}
        color="rgb(16, 185, 129)"
        maxOpacity={0.1}
        flickerChance={0.05}
      />

      <div className="container mx-auto px-6 relative z-10">
        {/* 标题部分 */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-emerald-600 via-cyan-600 to-emerald-600 bg-clip-text text-transparent">
            {t('testimonials.title')}
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t('testimonials.joinText')}
          </p>
        </motion.div>

        {/* Marquee 展示用户评价 - 错位滚动 */}
        <div className="relative mb-16">
          {/* 第一行 - 向右滚动 */}
          <div style={{ "--duration": "25s", "--gap": "1.5rem" } as React.CSSProperties}>
            <Marquee pauseOnHover repeat={4} className="mb-6">
              {firstRow.map((review) => (
                <ReviewCard key={`first-${review.name}`} {...review} />
              ))}
            </Marquee>
          </div>

          {/* 第二行 - 向左滚动，速度稍慢 */}
          <div style={{ "--duration": "30s", "--gap": "1.5rem" } as React.CSSProperties}>
            <Marquee reverse pauseOnHover repeat={4}>
              {secondRow.map((review) => (
                <ReviewCard key={`second-${review.name}`} {...review} />
              ))}
            </Marquee>
          </div>

          {/* 渐变遮罩 */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-1/6 bg-gradient-to-r from-white via-white/80 to-transparent z-10" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-1/6 bg-gradient-to-l from-white via-white/80 to-transparent z-10" />
        </div>

        {/* 用户统计和Avatar Circles */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <div className="flex items-center justify-center gap-6 mb-8">
            <AvatarCircles 
              avatarUrls={avatarUrls}
              numPeople={1995}
              className="flex-shrink-0"
            />
            <div className="text-left">
              <p className="text-2xl font-bold text-gray-800">+2000</p>
              <p className="text-emerald-600 text-sm">满意用户</p>
            </div>
          </div>
          
          {/* 信任指标 */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <motion.div 
              className="text-center"
              whileHover={{ scale: 1.05 }}
            >
              <div className="text-3xl font-bold text-emerald-600 mb-2">98%</div>
              <div className="text-gray-600 text-sm">用户满意度</div>
            </motion.div>
            <motion.div 
              className="text-center"
              whileHover={{ scale: 1.05 }}
            >
              <div className="text-3xl font-bold text-cyan-600 mb-2">24/7</div>
              <div className="text-gray-600 text-sm">智能服务</div>
            </motion.div>
            <motion.div 
              className="text-center"
              whileHover={{ scale: 1.05 }}
            >
              <div className="text-3xl font-bold text-emerald-600 mb-2">3min</div>
              <div className="text-gray-600 text-sm">快速创建</div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}