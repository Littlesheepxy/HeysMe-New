/**
 * HeysMe 核心类型定义
 *
 * 功能：定义整个应用的核心数据结构
 * 用途：类型安全、数据一致性、开发体验
 *
 * TODO:
 * - [ ] 添加页面版本控制字段
 * - [ ] 支持多语言内容结构
 * - [ ] 添加SEO相关字段
 * - [ ] 支持自定义域名配置
 * - [ ] 添加页面访问统计字段
 */

// 用户基础信息结构
export interface User {
  id: string // 用户唯一标识
  email: string // 用户邮箱（登录凭证）
  username?: string // 用户名（可选，用于个性化URL）
  plan: "free" | "pro" // 订阅计划（免费版/专业版）
  default_model: string // 默认AI模型偏好
  created_at: string // 账户创建时间
  updated_at: string // 最后更新时间

  // TODO: 添加以下字段
  avatar_url?: string // 用户头像URL
  preferences?: any // 用户偏好设置
  subscription_expires?: string // 订阅到期时间
  usage_stats?: any // 使用统计
}

// 页面主体结构 - HeysMe的核心实体
export interface FlowPage {
  id: string // 页面唯一标识
  user_id: string // 所属用户ID
  slug: string // URL友好的页面标识符
  title: string // 页面标题
  theme: string // 视觉主题（zen/creative/devgrid等）
  layout: string // 布局类型（grid/hero/twocol/stack）
  visibility: "public" | "private" | "link-only" // 可见性设置
  is_featured: boolean // 是否为精选页面
  blocks: PageBlock[] // 页面模块数组
  created_at: string // 创建时间
  updated_at: string // 最后更新时间

  // TODO: 添加以下字段
  version?: number // 页面版本号
  seo_title?: string // SEO标题
  seo_description?: string // SEO描述
  custom_domain?: string // 自定义域名
  view_count?: number // 访问次数
  last_viewed?: string // 最后访问时间
}

// 页面模块结构 - 组成页面的基本单元
export interface PageBlock {
  id: string // 模块唯一标识
  page_id: string // 所属页面ID
  type: BlockType // 模块类型
  data: any // 模块数据（根据type变化）
  position: number // 排序位置
  is_visible: boolean // 是否可见

  // TODO: 添加以下字段
  created_at?: string // 模块创建时间
  updated_at?: string // 模块更新时间
  animation?: string // 动画效果
  responsive_settings?: any // 响应式设置
}

// 支持的模块类型枚举
export type BlockType =
  | "hero" // 个人介绍模块
  | "project" // 项目展示模块
  | "skill" // 技能标签模块
  | "link" // 社交链接模块
  | "recruit" // 招聘信息模块
  | "custom" // 自定义模块
  | "about" // 关于我模块
  | "contact" // 联系方式模块

  // TODO: 添加更多模块类型
  | "timeline" // 时间线模块
  | "testimonial" // 推荐信模块
  | "blog" // 博客文章模块
  | "gallery" // 图片画廊模块
  | "video" // 视频展示模块

// 用户输入数据结构 - 用于AI生成页面
export interface UserInput {
  role: string // 用户角色/职位
  purpose: string // 创建目的
  style: string // 风格偏好
  display_priority: string[] // 展示优先级
  model_type?: string // 使用的AI模型

  // TODO: 添加更多输入字段
  industry?: string // 所属行业
  target_audience?: string // 目标受众
  color_preferences?: string[] // 颜色偏好
  inspiration_urls?: string[] // 参考网站
}

// AI生成的页面结构
export interface GeneratedPageStructure {
  title: string // 生成的页面标题
  theme: string // 推荐的主题
  layout: string // 推荐的布局
  blocks: Omit<PageBlock, "id" | "page_id">[] // 生成的模块（不含ID）

  // TODO: 添加生成元数据
  generation_metadata?: {
    model_used: string // 使用的AI模型
    generation_time: number // 生成耗时
    confidence_score: number // 置信度分数
    suggestions: string[] // 优化建议
  }
}
