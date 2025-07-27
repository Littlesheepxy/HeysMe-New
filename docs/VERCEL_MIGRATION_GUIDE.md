# Vercel 预览系统迁移指南

## 概述

本指南介绍如何从 WebContainer 预览系统迁移到 Vercel SDK 预览系统。新系统提供真实的生产级部署预览，支持自动回退和完整的部署管理功能。

## 🚀 核心优势

### 1. 真实部署环境
- **生产级预览**: 直接部署到 Vercel，提供真实的生产环境预览
- **全球 CDN**: 利用 Vercel 的全球内容分发网络
- **自动优化**: 自动进行性能优化和资源压缩

### 2. 完整部署管理
- **版本控制**: 每次部署都会保存历史版本
- **一键回退**: 支持快速回退到之前的任何版本
- **状态跟踪**: 实时监控部署状态和进度

### 3. 环境配置
- **环境变量管理**: 完整的环境变量配置支持
- **项目设置**: 灵活的构建和部署配置
- **团队协作**: 支持团队级别的项目管理

## 📋 配置步骤

### 1. 环境变量配置

在你的 `.env.local` 文件中添加以下配置：

```bash
# Vercel 部署配置
VERCEL_TOKEN="your-vercel-token"
VERCEL_TEAM_ID="your-team-id"          # 可选
VERCEL_TEAM_SLUG="your-team-slug"      # 可选

# 启用 Vercel 预览功能
ENABLE_VERCEL_PREVIEW="true"
```

### 2. 获取 Vercel Token

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 进入 Settings → Tokens
3. 创建新的 API Token
4. 复制 Token 并添加到环境变量

### 3. 获取团队信息（可选）

如果你是团队成员：

1. 在 Vercel Dashboard 中选择你的团队
2. 在 URL 中找到团队 ID 或 Slug
3. 添加到相应的环境变量

## 🔧 使用方法

### 基础使用

```tsx
import { VercelPreview } from '@/components/editor/VercelPreview';
import { getVercelConfig } from '@/lib/config/vercel-config';

function MyEditor() {
  const vercelConfig = getVercelConfig();
  const [files, setFiles] = useState<CodeFile[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  return (
    <VercelPreview
      files={files}
      projectName="my-awesome-project"
      description="项目描述"
      isLoading={false}
      previewUrl={previewUrl}
      enableVercelDeploy={vercelConfig.enabled}
      onPreviewReady={setPreviewUrl}
      onLoadingChange={(loading) => console.log('Loading:', loading)}
      vercelConfig={vercelConfig}
    />
  );
}
```

### 在代码编辑器中使用

```tsx
import { CodeEditorPanel } from '@/components/editor/CodeEditorPanel';

function EditorPage() {
  const [files, setFiles] = useState<CodeFile[]>([]);

  return (
    <CodeEditorPanel
      files={files}
      onFileUpdate={(filename, content) => {
        // 更新文件内容
      }}
      projectName="我的项目"
      description="项目描述"
      showPreview={true}  // 启用预览
    />
  );
}
```

## 🎛️ 高级配置

### 自定义部署配置

```tsx
import { VercelPreviewService } from '@/lib/services/vercel-preview-service';

const deploymentConfig = {
  projectName: 'my-project',
  files: codeFiles,
  target: 'preview', // 或 'production'
  gitMetadata: {
    commitAuthorName: 'Developer',
    commitMessage: 'Update from HeysMe',
    commitRef: 'main',
  },
  environmentVariables: [
    {
      key: 'NODE_ENV',
      value: 'production',
      target: ['preview'],
    },
    {
      key: 'CUSTOM_API_URL',
      value: 'https://api.example.com',
      target: ['preview', 'production'],
    },
  ],
};

const service = new VercelPreviewService(vercelConfig);
const deployment = await service.deployProject(deploymentConfig);
```

### 部署管理

```tsx
// 获取当前部署
const currentDeployment = service.getCurrentDeployment();

// 获取部署历史
const history = service.getDeploymentHistory();

// 回退到上一个版本
const rollbackDeployment = await service.rollbackToPrevious();

// 删除当前部署
await service.deleteCurrentDeployment();
```

## 🔄 迁移对比

### WebContainer vs Vercel 预览

| 功能 | WebContainer | Vercel 预览 |
|------|-------------|-------------|
| 运行环境 | 浏览器沙盒 | Vercel 云端 |
| 部署速度 | 快速 | 中等 |
| 真实性 | 模拟环境 | 真实生产环境 |
| 版本管理 | 无 | 完整版本控制 |
| 回退功能 | 无 | 一键回退 |
| 环境变量 | 有限支持 | 完整支持 |
| 全球访问 | 仅本地 | 全球 CDN |
| 持久化 | 会话级 | 永久保存 |

### 何时使用哪种方案

**使用 Vercel 预览：**
- 需要真实的生产环境测试
- 要与团队成员分享预览
- 需要版本管理和回退功能
- 项目需要复杂的构建流程

**使用 WebContainer（降级方案）：**
- 快速原型开发
- 本地测试和调试
- 网络环境受限
- 简单的静态页面预览

## 🛠️ 故障排除

### 常见问题

1. **部署失败**
   ```
   错误: 创建部署失败: Unauthorized
   ```
   解决方案: 检查 VERCEL_TOKEN 是否正确配置

2. **项目创建失败**
   ```
   错误: 项目名称不符合要求
   ```
   解决方案: 项目名称只能包含小写字母、数字和连字符

3. **部署超时**
   ```
   错误: 部署超时
   ```
   解决方案: 检查项目文件大小和网络连接

### 调试技巧

1. **启用详细日志**
   ```tsx
   service.onLog((log) => console.log(log));
   ```

2. **检查部署状态**
   ```tsx
   service.onStatusChange((status) => {
     console.log('Status:', status);
   });
   ```

3. **查看部署历史**
   ```tsx
   const history = service.getDeploymentHistory();
   console.log('Deploy history:', history);
   ```

## 📊 性能优化

### 减少部署频率

```tsx
// 使用防抖来避免频繁部署
const debouncedDeploy = useCallback(
  debounce(() => {
    if (files.length > 0) {
      deployToVercel();
    }
  }, 2000),
  [files]
);

useEffect(() => {
  debouncedDeploy();
}, [files, debouncedDeploy]);
```

### 文件过滤

```tsx
// 过滤不需要的文件
const filteredFiles = files.filter(file => 
  !file.filename.includes('node_modules') &&
  !file.filename.includes('.git')
);
```

## 🔐 安全考虑

1. **Token 安全**
   - 不要在客户端代码中硬编码 Token
   - 使用环境变量管理敏感信息
   - 定期更新 API Token

2. **团队权限**
   - 合理设置团队成员权限
   - 使用只读 Token 进行查看操作
   - 定期审核团队成员访问权限

## 📚 API 参考

详细的 API 文档请参考：
- [VercelPreviewService API](./API_REFERENCE.md#vercelpreviewservice)
- [Vercel SDK 官方文档](https://github.com/vercel/sdk)

## 🤝 支持

如果遇到问题，请：
1. 查看本文档的故障排除部分
2. 检查 [Vercel 官方文档](https://vercel.com/docs)
3. 在项目仓库中创建 Issue 