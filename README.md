# 🧠 智能个性化多Agent简历生成系统

> **版本**: v2.1 - 架构统一版  
> **技术栈**: NextJS 14 + TypeScript + Tailwind CSS + Shadcn/ui + Framer Motion  
> **特色**: 流式显示 + 交互式信息收集 + 智能意图识别 + 个性化定制

## 🎯 系统概览

这是一个基于多Agent协作的智能简历/个人页面生成系统，通过AI驱动的对话式交互，为不同身份的用户生成个性化的专业展示页面。

### 🌟 核心特色
- **🧠 智能意图识别**：区分正式需求、试用体验、学习了解、紧急需要四种意图
- **👥 身份个性化定制**：为UI/UX设计师、产品经理、开发者、AI科学家等提供专业化方案
- **⚡ 流式显示体验**：打字机效果 + 实时进度 + 流式代码生成
- **🎯 交互式信息收集**：选择题按钮 + 智能表单 + 动态问题生成
- **🚀 极致便捷部署**：Vercel一键部署，GitHub自动同步
- **🔄 统一架构设计**：聊天与管理界面分离，专业化页面分工

### 🏗️ 页面架构设计

#### 💬 聊天创建中心 `/chat`
```
功能：所有创建和对话的统一入口
特点：左侧会话列表 + 右侧对话界面
权限：无需登录即可体验，登录后保存记录
用途：新建项目、编辑现有项目、AI对话交互
```

#### 📊 项目管理中心 `/dashboard`
```
功能：已生成项目的集中管理和展示
特点：网格布局、批量操作、数据统计
权限：需要登录认证
用途：项目预览、批量管理、数据分析、发布设置
```

#### 🌐 落地页 `/`
```
功能：产品介绍和用户引导
特点：营销展示、功能介绍
权限：公开访问
用途：吸引用户、演示功能、引导注册
```

### 🏗️ 多Agent架构
```
用户输入 → Welcome Agent → Info Collection Agent → Prompt Output Agent → Coding Agent → 完成
           ↓              ↓                      ↓                    ↓
        意图识别        个性化信息收集           结构化设计方案        NextJS代码生成
           ↓              ↓                      ↓                    ↓
        身份判断        选择题+智能默认          风格+布局选择         流式代码输出
```

### 🎨 支持的身份类型
- **UI/UX设计师**：作品集展示，设计思维突出
- **产品经理**：数据驱动，商业价值体现
- **开发者**：技术项目，代码能力展示
- **AI/数据科学家**：研究成果，算法深度
- **创意工作者**：创意作品，品牌案例
- **学生/求职者**：成长轨迹，潜力展示

## 🚀 快速开始

### 前置要求
- Node.js 18+
- OpenAI API Key（用于AI对话）

### 一键启动

```bash
# 1. 运行增强版启动脚本
chmod +x quick-start-enhanced.sh
./quick-start-enhanced.sh

# 2. 配置环境变量
cp .env.example .env.local
# 添加你的 OpenAI API Key

# 3. 启动开发服务器
npm run dev
```

### 立即体验
访问 `http://localhost:3000` 开始使用智能个性化简历生成器！

## 📚 文档指南

- **[系统设计文档](MULTI_AGENT_RESUME_SYSTEM.md)** - 完整的多Agent架构设计和流式交互方案
- **[技术栈指南](TECH_STACK_GUIDE.md)** - NextJS + TypeScript技术栈选择说明
- **[实现路线图](IMPLEMENTATION_ROADMAP.md)** - 4周详细开发计划和任务分解
- **[个性化策略](lib/prompts/personalization-strategies.ts)** - 智能个性化实现代码

## 🛠️ 技术栈

### 核心框架
- **NextJS 14** - React全栈框架，App Router
- **TypeScript** - 类型安全，开发效率
- **Tailwind CSS** - 原子化CSS，响应式设计

### UI与动效
- **Shadcn/ui** - 开源组件库，高度可定制
- **Framer Motion** - 流畅动画效果
- **Lucide React** - 现代化图标库

### 部署方案
- **Vercel** - 零配置部署，全球CDN
- **GitHub** - 代码版本管理，自动部署

## 🎯 智能个性化特性

### 意图识别
- **正式创建**：深度信息收集，3轮问答
- **试用体验**：快速生成，智能默认值
- **学习了解**：提供示例，展示模板
- **紧急需要**：效率优先，一键生成

### 身份定制
- **技能选项**：根据身份动态生成专业技能列表
- **风格建议**：个性化配色、布局、内容优先级
- **问题定制**：针对不同身份的核心问题

### 技术优化
```json
{
  "设计师": ["Lottie动画", "主题切换", "作品集布局"],
  "产品经理": ["数据图表", "成果展示", "商业思维"],
  "开发者": ["代码高亮", "技术标签", "项目展示"],
  "AI科学家": ["研究可视化", "论文列表", "算法展示"]
}
```

## 🌊 流式显示体验

### 实时流式输出
- **500ms首字符显示**：用户无需等待即可开始阅读
- **打字机动画效果**：自然流畅的文本显示
- **分层JSON结构**：reply → interaction → system → data

### 交互式组件
- **选择题按钮**：降低输入门槛，提升体验
- **多选技能面板**：快速选择专业技能
- **实时进度指示**：用户始终了解当前状态

## 📊 系统优势

| 特性 | 传统方案 | 智能个性化系统 |
|------|----------|----------------|
| 信息收集 | 长表单填写 | 智能对话+选择题 |
| 风格选择 | 固定模板 | 身份个性化推荐 |
| 代码生成 | 静态输出 | 流式生成+实时预览 |
| 部署难度 | 复杂配置 | Vercel一键部署 |
| 用户体验 | 等待加载 | 实时响应交互 |
| 界面架构 | 页面分散 | 统一聊天+专业管理 |

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 开源协议

本项目采用 MIT 协议 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🎯 发展路线

- **v2.0** ✅ 智能个性化多Agent系统
- **v2.1** ✅ 架构统一化，页面职责清晰
- **v2.2** 🚧 多语言支持，主题系统
- **v2.3** 📋 数据可视化，图表组件
- **v2.4** 📋 社交分享，SEO优化
- **v3.0** 📋 实时协作，团队版本

---

⭐ 如果这个项目对你有帮助，请给我们一个星标！

## 🎨 UI 设计升级 (v2.0)

### 品牌色彩系统

我们已经完成了基于青绿渐变色的品牌色彩系统升级：

#### 主要色彩
- **主渐变色**: `from-emerald-400 via-teal-400 to-cyan-400` (#34D399 → #2DD4BF → #22D3EE)
- **深色变体**: `from-emerald-500 to-cyan-500` (#10B981 → #06B6D4)
- **浅色变体**: `from-emerald-100 to-cyan-100` (#D1FAE5 → #CFFAFE)
- **核心品牌色**: `#10B981` (emerald-500)
- **辅助色**: `#06B6D4` (cyan-500)
- **强调色**: `#0891B2` (深青色)

#### 背景色彩
- **主背景**: 纯白 `#FFFFFF`
- **辅助背景**: 浅青色 `#F0FDFA`
- **表面色**: 浅绿色 `#ECFDF5`

### 升级的组件

#### 1. 按钮组件 (`components/ui/button.tsx`)
- ✅ 品牌渐变按钮 (`brand`, `brand-dark`)
- ✅ 品牌边框按钮 (`brand-outline`)
- ✅ 品牌幽灵按钮 (`brand-ghost`)
- ✅ 玻璃拟态按钮 (`brand-glass`)
- ✅ 发光效果按钮 (`brand-glow`)
- ✅ 波纹点击效果
- ✅ 悬停缩放动画

#### 2. 输入框组件 (`components/ui/input.tsx`)
- ✅ 品牌聚焦效果 (`brand`)
- ✅ 品牌边框样式 (`brand-outline`)
- ✅ 玻璃拟态输入框 (`brand-glass`)
- ✅ 青绿色占位符文字
- ✅ 品牌色光晕效果

#### 3. 卡片组件 (`components/ui/card.tsx`)
- ✅ 品牌渐变卡片 (`brand`)
- ✅ 玻璃拟态卡片 (`brand-glass`)
- ✅ 品牌边框卡片 (`brand-outline`)
- ✅ 品牌渐变背景卡片 (`brand-gradient`)
- ✅ 交互悬停效果 (`interactive`)

#### 4. 聊天界面 (`components/chat-interface.tsx`)
- ✅ 品牌渐变头部背景
- ✅ 青绿色消息气泡
- ✅ 品牌色Agent状态指示
- ✅ 青绿色加载动画
- ✅ 品牌色滚动条

#### 5. 加载组件 (`components/ui/loading-text.tsx`)
- ✅ 品牌加载点动画
- ✅ 品牌打字光标
- ✅ 品牌骨架屏
- ✅ 品牌进度条
- ✅ 青绿色高光效果

### 动画效果系统

#### 品牌动画
- `animate-brand-gradient`: 渐变背景移动
- `animate-brand-pulse`: 青绿色脉冲效果
- `animate-brand-shimmer`: 高光划过效果
- `animate-brand-loading-dots`: 加载点跳动
- `animate-brand-fade-up`: 淡入上滑动画
- `animate-brand-slide-in`: 滑入动画

#### 阴影效果
- `shadow-brand`: 基础品牌阴影
- `shadow-brand-lg`: 大型品牌阴影
- `shadow-brand-xl`: 超大品牌阴影
- `shadow-brand-glow`: 品牌发光效果
- `shadow-cyan-glow`: 青色发光效果

### 全局样式升级

#### CSS变量 (`app/globals.css`)
- ✅ 品牌色CSS变量定义
- ✅ 深色模式品牌色适配
- ✅ 青绿色滚动条样式
- ✅ 品牌选择高亮
- ✅ 玻璃拟态效果类

#### Tailwind配置 (`tailwind.config.ts`)
- ✅ 完整的青绿色系定义
- ✅ 品牌渐变背景
- ✅ 品牌阴影系统
- ✅ 品牌动画关键帧

### 页面升级

#### 主页 (`app/page.tsx`)
- ✅ 品牌渐变背景
- ✅ 青绿色Hero区域
- ✅ 品牌卡片特性展示
- ✅ 品牌渐变CTA区域
- ✅ 装饰性品牌元素

#### 数据源集成 (`components/data-source-integration.tsx`)
- ✅ 品牌卡片样式
- ✅ 青绿色状态指示
- ✅ 品牌悬停效果
- ✅ 连接状态动画

### 响应式设计

- ✅ 移动端适配
- ✅ 平板端优化
- ✅ 桌面端完整体验
- ✅ 触摸友好的交互

### 可访问性

- ✅ 高对比度色彩搭配
- ✅ 键盘导航支持
- ✅ 屏幕阅读器友好
- ✅ 焦点指示清晰

### 技术栈

- **React 18** + **TypeScript**
- **Tailwind CSS** + **CSS变量**
- **Framer Motion** (动画)
- **Lucide React** (图标)
- **shadcn/ui** (组件基础)
- **class-variance-authority** (变体管理)

### 使用示例

```tsx
// 品牌按钮
<Button variant="brand" size="lg">
  开始使用
</Button>

// 品牌输入框
<Input variant="brand" placeholder="输入内容..." />

// 品牌卡片
<Card variant="brand-glass">
  <CardContent>内容</CardContent>
</Card>

// 品牌加载
<LoadingText variant="typing" text="AI 正在思考..." />
```

### 下一步计划

- [ ] 深色模式完整适配
- [ ] 更多品牌动画效果
- [ ] 组件文档完善
- [ ] 性能优化
- [ ] 无障碍功能增强

---

## 项目简介

HeysMe 是一个 AI 驱动的职业身份平台，通过智能对话帮助用户生成个性化的职业主页。

### 核心功能

- 🤖 **AI 智能对话**: 通过自然语言交互收集用户信息
- 🎨 **智能页面生成**: 基于用户输入自动生成专业页面
- 📊 **多数据源集成**: 支持 LinkedIn、GitHub 等平台数据导入
- 🔧 **实时编辑**: 支持页面内容的实时修改和预览
- 🌐 **响应式设计**: 完美适配各种设备和屏幕尺寸

### 技术特色

- **Agent 工作流**: 多阶段智能助手协作
- **实时数据集成**: 动态获取和处理外部数据
- **组件化架构**: 高度可复用的 React 组件
- **类型安全**: 完整的 TypeScript 类型定义
- **现代化 UI**: 基于 Tailwind CSS 的响应式设计

### 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

### 环境要求

- Node.js 18+
- npm 或 yarn
- 现代浏览器支持

### 贡献指南

欢迎提交 Issue 和 Pull Request！请确保：

1. 遵循现有的代码风格
2. 添加适当的类型定义
3. 包含必要的测试
4. 更新相关文档

### 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件。 