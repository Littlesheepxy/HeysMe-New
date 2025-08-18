# Vercel 增强日志和错误分析功能

## 🎯 概述

基于 Vercel 官方文档，我们实现了增强的部署日志和错误分析功能，解决了"部署错误信息不明确，只有error"的问题。

## 🔧 主要改进

### 1. 增强的错误详情获取
- **多层次事件分类**：错误事件、警告事件、构建日志
- **时间戳标记**：每个事件都有准确的时间戳
- **智能错误匹配**：识别更多错误关键词（error, failed, exception, cannot, unable to）

### 2. 完整的部署分析报告
```typescript
interface DeploymentAnalysis {
  deployment: any;           // 部署基础信息
  events: any[];            // 所有部署事件
  buildLogs: string[];      // 格式化的构建日志
  errorSummary: string;     // 错误摘要
  suggestions: string[];    // 智能建议
}
```

### 3. 智能建议系统
根据错误内容自动生成针对性建议：
- **依赖问题**：package.json 检查、node_modules 重装
- **构建问题**：语法错误、环境变量检查
- **性能问题**：内存优化、超时处理
- **权限问题**：Token 权限、团队设置

## 🚀 使用方法

### API 端点

#### 1. 增强的部署错误信息
```bash
POST /api/vercel-deploy
```
现在返回详细的错误分析和建议：
```json
{
  "success": false,
  "error": "Vercel deployment failed",
  "troubleshooting": [
    "检查 package.json 中的依赖版本是否正确",
    "确保所有必需的环境变量已设置"
  ],
  "errorInfo": {
    "deploymentId": "dpl_xxx",
    "debugUrls": {
      "detailedAnalysis": "/api/vercel-deploy/debug?deploymentId=dpl_xxx",
      "onlineLogs": "https://deployment-url/_logs",
      "cliCommand": "vc logs dpl_xxx"
    }
  },
  "analysis": {
    "errorSummary": "具体的错误描述",
    "buildLogsCount": 25,
    "errorEventsCount": 3,
    "warningEventsCount": 1,
    "hasDetailedLogs": true
  }
}
```

#### 2. 详细分析调试端点
```bash
GET /api/vercel-deploy/debug?deploymentId=dpl_xxx
```
返回完整的部署分析报告：
```json
{
  "success": true,
  "deployment": { /* 部署信息 */ },
  "diagnostics": {
    "deploymentId": "dpl_xxx",
    "errorCount": 3,
    "warningCount": 1,
    "buildLogsCount": 25,
    "lastAnalysisTime": "2024-01-01T12:00:00Z"
  },
  "analysis": {
    "errorSummary": "详细的错误摘要",
    "suggestions": ["建议1", "建议2"],
    "buildLogs": ["格式化的构建日志"],
    "totalEvents": 50
  },
  "errorEvents": [/* 错误事件列表 */],
  "warningEvents": [/* 警告事件列表 */],
  "buildEvents": [/* 构建事件列表 */],
  "logUrls": {
    "vercelDashboard": "https://vercel.com/dashboard/deployments/dpl_xxx",
    "onlineLogs": "https://deployment-url/_logs",
    "cliCommand": "vc logs dpl_xxx"
  }
}
```

### 编程接口

#### 使用 VercelPreviewService
```typescript
const vercelService = createVercelService(config);

// 获取完整分析报告
const analysis = await vercelService.getDeploymentAnalysis(deploymentId);
console.log('错误摘要:', analysis.errorSummary);
console.log('建议:', analysis.suggestions);

// 获取构建日志
const logs = await vercelService.getDeploymentLogs(deploymentId);
logs.forEach(log => console.log(log));
```

## 📋 基于 Vercel 官方文档的实现

### 1. 部署事件类型
根据 Vercel 官方文档，我们监听以下事件：
```javascript
[
  // 文件事件
  'hashes-calculated',
  'file-count',
  'file-uploaded', 
  'all-files-uploaded',
  // 部署事件
  'created',
  'building',
  'ready',
  'alias-assigned',
  'warning',
  'error'
]
```

### 2. 日志访问方法
- **Vercel CLI**: `vc logs <deploymentId>`
- **在线日志**: `https://<deployment-url>/_logs`
- **控制台**: `https://vercel.com/dashboard/deployments/<deploymentId>`

### 3. 事件监听和分析
```typescript
// 监听部署事件的完整流程
for await (const event of createDeployment(deploymentConfig)) {
  if (event.type === 'ready') {
    deployment = event.payload;
    break;
  }
  if (event.type === 'error') {
    // 处理错误事件
    handleErrorEvent(event);
  }
}
```

## 🔍 调试步骤

当部署失败时，按以下步骤排查：

1. **查看错误摘要**
   ```bash
   curl "/api/vercel-deploy/debug?deploymentId=dpl_xxx"
   ```

2. **检查具体建议**
   - 查看返回的 `suggestions` 数组
   - 按建议逐一检查和修复

3. **查看详细日志**
   - 访问 `vercelDashboardUrl` 链接
   - 或使用 CLI: `vc logs <deploymentId>`

4. **分析构建事件**
   - 查看 `buildEvents` 了解构建过程
   - 重点关注 `stderr` 类型的事件

## 🎯 智能建议示例

### 依赖问题
```
检查 package.json 中的依赖版本是否正确
尝试删除 node_modules 并重新安装依赖
```

### 构建问题
```
检查代码中是否有语法错误或类型错误
确保所有必需的环境变量已设置
```

### 性能问题
```
考虑优化构建脚本以减少内存使用
检查是否有无限循环或重复的依赖安装
```

### 权限问题
```
检查 Vercel Token 权限是否正确
确保项目配置和团队设置正确
```

## 🔗 相关链接

- [Vercel CLI 文档](https://vercel.com/docs/cli)
- [Vercel API 文档](https://vercel.com/docs/rest-api)
- [部署事件监听](https://github.com/vercel/vercel/blob/main/packages/client/README.md)

## 💡 最佳实践

1. **总是检查详细分析**：使用 `/api/vercel-deploy/debug` 端点
2. **关注建议**：智能建议通常能直接指出问题所在
3. **查看完整日志**：使用提供的链接访问完整日志
4. **本地测试**：确保本地构建成功后再部署
5. **及时更新**：保持依赖和配置的最新状态
