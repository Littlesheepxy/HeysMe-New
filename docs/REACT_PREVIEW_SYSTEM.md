# React+TypeScript 代码预览系统

## 🎯 系统概述

HeysMe的React+TypeScript代码预览系统是一个完整的前端渲染解决方案，支持实时预览生成的React组件、集成链接和作品iframe展示。

## 🚀 核心功能

### 1. **React应用实时预览**
- 支持React 18 + TypeScript
- 使用iframe沙箱环境运行代码
- 支持Tailwind CSS样式框架
- 集成Framer Motion动画库
- 响应式设计预览（桌面/平板/移动端）

### 2. **富媒体内容支持**
- **外部链接**: 支持GitHub、作品网站等外部链接
- **作品iframe**: 可以嵌入CodeSandbox、GitHub Pages等作品展示
- **图片资源**: 自动识别和加载项目图片
- **视频内容**: 支持视频作品展示

### 3. **项目管理功能**
- 多文件代码管理
- 项目依赖配置
- 资源文件管理
- 一键下载项目
- 部署集成支持

## 📁 文件结构

```
components/code/
├── ReactPreviewRenderer.tsx     # 主预览渲染器
├── CodeBlockStreaming.tsx       # 代码块展示组件
└── CodePreview.tsx             # 传统HTML预览组件

lib/utils/
└── mockCodeGenerator.ts        # 模拟代码生成器
```

## 🎨 预览界面特性

### 设备响应式预览
```typescript
const deviceSizes = {
  desktop: { width: '100%', height: '700px', label: '桌面端' },
  tablet: { width: '768px', height: '700px', label: '平板端' },
  mobile: { width: '375px', height: '700px', label: '移动端' }
};
```

### 构建状态管理
- **idle**: 等待启动
- **building**: 正在构建React应用
- **success**: 构建成功，预览可用
- **error**: 构建失败，显示错误信息

## 🔧 技术架构

### 前端技术栈
```html
<!-- React & ReactDOM -->
<script src="https://unpkg.com/react@18/umd/react.development.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>

<!-- Babel for JSX transformation -->
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

<!-- Styling & Icons -->
<script src="https://cdn.tailwindcss.com"></script>
<script src="https://unpkg.com/lucide-react@latest/dist/umd/lucide-react.js"></script>

<!-- Animation -->
<script src="https://unpkg.com/framer-motion@latest/dist/framer-motion.js"></script>
```

### 代码转换流程
1. **代码解析**: 提取React组件、样式和数据文件
2. **依赖注入**: 自动注入必要的库和依赖
3. **JSX转换**: 使用Babel实时转换JSX代码
4. **沙箱渲染**: 在iframe中安全运行代码

## 🎪 作品展示功能

### 项目卡片组件
```tsx
function ProjectCard({ project }: { project: Project }) {
  return (
    <div className="project-card">
      {project.iframe ? (
        <div className="project-iframe-container">
          <iframe
            src={project.iframe}
            className="project-iframe"
            title={project.title}
            loading="lazy"
          />
        </div>
      ) : (
        <img src={project.image} alt={project.title} />
      )}
      
      <div className="project-content">
        <h3>{project.title}</h3>
        <p>{project.description}</p>
        
        <div className="project-technologies">
          {project.technologies.map(tech => (
            <span className="tech-tag">{tech}</span>
          ))}
        </div>
        
        <div className="project-links">
          {project.liveUrl && (
            <a href={project.liveUrl} className="project-link">
              查看项目
            </a>
          )}
          {project.githubUrl && (
            <a href={project.githubUrl} className="project-link">
              源代码
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
```

### 支持的项目类型
- **网站项目**: 可以通过iframe嵌入实际网站
- **GitHub项目**: 直接链接到GitHub仓库
- **CodeSandbox**: 嵌入在线代码演示
- **设计作品**: 展示UI/UX设计图片
- **视频项目**: 嵌入视频演示

## 🔗 链接和资源管理

### 自动资源提取
```typescript
const extractAssetsFromCode = (codeFiles: any[]) => {
  const assets: any[] = []
  
  codeFiles.forEach(file => {
    // 提取图片链接
    const imageMatches = file.content.match(/src=["']([^"']*\.(jpg|jpeg|png|gif|webp|svg))["']/gi)
    
    // 提取iframe链接
    const iframeMatches = file.content.match(/src=["']([^"']+)["']/gi)
    
    // 处理外部链接
    // ...
  })
  
  return assets
}
```

### 链接交互处理
```javascript
// 预览增强功能
window.addEventListener('load', function() {
  // 处理外部链接
  document.querySelectorAll('a[href^="http"]').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      window.parent.postMessage({
        type: 'external-link',
        url: this.href
      }, '*');
    });
  });
  
  // 处理iframe加载
  document.querySelectorAll('iframe').forEach(iframe => {
    iframe.addEventListener('load', function() {
      this.style.opacity = '1';
    });
  });
});
```

## 🎛️ 使用方法

### 1. 基本预览
```tsx
<ReactPreviewRenderer
  data={{
    files: codeFiles,
    projectName: "我的作品集",
    description: "基于React的个人作品集",
    assets: extractedAssets
  }}
  onDownload={handleDownload}
  onDeploy={handleDeploy}
  onEditCode={handleEdit}
/>
```

### 2. 生成测试代码
```typescript
import { generateMockResumeCode } from "@/lib/utils/mockCodeGenerator"

const mockUserData = {
  name: "张三",
  title: "前端开发工程师",
  projects: [
    {
      title: "个人作品集",
      iframe: "https://codesandbox.io/embed/portfolio",
      liveUrl: "https://portfolio.example.com"
    }
  ]
}

const mockCode = generateMockResumeCode(mockUserData)
```

### 3. 处理预览事件
```typescript
// 启动预览
const startPreview = async () => {
  setIsRunning(true)
  setBuildStatus('building')
  
  try {
    await buildReactApp()
    setBuildStatus('success')
  } catch (error) {
    setBuildStatus('error')
    setBuildError(error.message)
  }
}

// 处理外部链接
const handleExternalLink = (url: string) => {
  window.open(url, '_blank', 'noopener,noreferrer')
}
```

## 🎯 最佳实践

### 1. 性能优化
- 使用`loading="lazy"`延迟加载iframe
- 合理控制预览尺寸
- 避免过大的资源文件

### 2. 安全考虑
- 使用iframe沙箱环境
- 限制外部资源访问
- 验证用户输入的链接

### 3. 用户体验
- 提供构建状态反馈
- 支持响应式预览
- 优雅的错误处理

## 🚀 扩展功能

### 即将支持
- [ ] 实时代码编辑
- [ ] 版本历史管理
- [ ] 团队协作功能
- [ ] 更多动画效果
- [ ] PWA支持
- [ ] 离线预览

### 集成计划
- [ ] Vercel部署集成
- [ ] Netlify部署支持
- [ ] GitHub Pages自动发布
- [ ] 自定义域名绑定

## 📖 示例项目

查看完整的示例代码，了解如何创建一个包含iframe作品展示的React简历：

1. 访问聊天页面
2. 点击"生成测试代码"按钮
3. 切换到"React预览"模式
4. 体验完整的预览功能

这个系统展示了如何将AI生成的代码转换为可交互的React应用，支持作品集展示、外部链接集成和响应式设计。 