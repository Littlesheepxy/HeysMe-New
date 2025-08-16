# E2B Sandbox API 使用指南

## 📁 API 结构概览

所有 E2B 沙盒相关的 API 端点都统一在 `/api/e2b-sandbox/` 目录下，共包含 **21个核心端点**，分为 6 大功能模块。

## 🎯 完整端点列表

### 🏗️ 沙盒管理类 (4个)
```
POST   /api/e2b-sandbox/create              # 创建沙盒并初始化环境
GET    /api/e2b-sandbox/status              # 检查沙盒状态和健康度
DELETE /api/e2b-sandbox/kill                # 销毁沙盒实例
GET    /api/e2b-sandbox/logs                # 获取沙盒运行日志
```

### 📦 依赖管理类 (2个)
```
POST   /api/e2b-sandbox/detect-packages     # 自动检测代码中的依赖并安装
POST   /api/e2b-sandbox/install-packages    # 手动安装指定的npm包
GET    /api/e2b-sandbox/install-packages    # 查询已安装的包信息
```

### 🔄 服务器管理类 (5个)
```
POST   /api/e2b-sandbox/restart-nextjs      # 重启Next.js开发服务器
GET    /api/e2b-sandbox/restart-nextjs      # 获取Next.js服务器状态
GET    /api/e2b-sandbox/monitor-logs        # 监控Next.js运行状态
POST   /api/e2b-sandbox/monitor-logs        # 启动/停止日志监控
GET    /api/e2b-sandbox/check-errors        # 检查Next.js错误
POST   /api/e2b-sandbox/check-errors        # 标记错误为已解决
DELETE /api/e2b-sandbox/clear-errors-cache  # 清除错误缓存
POST   /api/e2b-sandbox/report-error        # 报告Next.js错误
```

### 📂 文件管理类 (3个)
```
GET    /api/e2b-sandbox/files               # 获取沙盒文件结构和内容
POST   /api/e2b-sandbox/files               # 读取特定文件内容
POST   /api/e2b-sandbox/deploy              # 应用AI生成的代码到沙盒
POST   /api/e2b-sandbox/apply-code-stream   # 流式应用代码（实时反馈）
```

### 🤖 AI交互类 (3个)
```
POST   /api/e2b-sandbox/generate-code-stream # 流式生成AI代码
POST   /api/e2b-sandbox/analyze-intent      # 分析编辑意图
GET    /api/e2b-sandbox/conversation-state  # 获取对话状态
POST   /api/e2b-sandbox/conversation-state  # 更新对话状态
```

### 🛠️ 工具类 (4个)
```
POST   /api/e2b-sandbox/run-command         # 在沙盒中运行命令
POST   /api/e2b-sandbox/create-zip          # 创建项目压缩包
POST   /api/e2b-sandbox/scrape-screenshot   # 截取网页截图
POST   /api/e2b-sandbox/scrape-url          # 增强版网页内容抓取
```

### 🔧 基础设施 (1个)
```
GET    /api/e2b-sandbox/test-connection     # 测试E2B连接
```

## 🚀 使用示例

### 1. 创建沙盒
```typescript
const response = await fetch('/api/e2b-sandbox/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
});
const { sandboxId, url } = await response.json();
```

### 2. 部署代码
```typescript
const response = await fetch('/api/e2b-sandbox/deploy', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    files: {
      'app/page.tsx': 'export default function Home() { return <h1>Hello!</h1>; }'
    },
    packages: ['react', 'react-dom']
  })
});
```

### 3. 检查状态
```typescript
const response = await fetch('/api/e2b-sandbox/status');
const { status, healthStatus } = await response.json();
```

### 4. 流式监控日志
```typescript
const eventSource = new EventSource('/api/e2b-sandbox/monitor-logs?follow=true');
eventSource.onmessage = (event) => {
  const logData = JSON.parse(event.data);
  console.log('Log:', logData.message);
};
```

## 🔐 认证要求

所有API端点都需要用户认证，使用 Clerk 进行身份验证：

```typescript
import { auth } from '@clerk/nextjs/server';

// 在API路由中
const { userId } = await auth();
if (!userId) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

## 📝 响应格式

所有API都使用统一的响应格式：

```typescript
// 成功响应
{
  success: true,
  message: "操作成功",
  data: { /* 具体数据 */ },
  timestamp: "2024-01-01T00:00:00.000Z"
}

// 错误响应
{
  success: false,
  error: "ERROR_CODE",
  message: "错误描述",
  details: "详细错误信息"
}
```

## 🏃‍♂️ 快速开始

1. **安装依赖**：确保项目已安装 `e2b` 和 `@e2b/code-interpreter`
2. **配置API Key**：在 `.env.local` 中设置 `E2B_API_KEY`
3. **测试连接**：访问 `/api/e2b-sandbox/test-connection`
4. **创建沙盒**：调用 `/api/e2b-sandbox/create`
5. **开始使用**：部署代码并享受快速预览！

---

## 📞 技术支持

如需技术支持或有疑问，请查看：
- 主要实施文档：`E2B_SANDBOX_PREVIEW_IMPLEMENTATION.md`
- E2B官方文档：https://e2b.dev/docs
