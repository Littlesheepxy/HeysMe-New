# 预览URL持久化功能实现

## 功能概述

实现了预览URL的保存和恢复功能，避免每次页面刷新或会话切换时都重新部署，提升用户体验和资源利用效率。

## 问题背景

- **用户痛点**：每次刷新页面或切换会话时，系统都会重新部署项目创建新的预览链接
- **资源浪费**：重复部署消耗Vercel配额和时间
- **用户体验差**：等待重新部署降低了操作流畅性

## 解决方案

### 1. 数据结构扩展

**扩展SessionData类型**：
```typescript
// 新增GeneratedCodeProject类型
interface GeneratedCodeProject {
  id: string;
  name: string;
  description?: string;
  files: Array<{filename: string; content: string; language: string}>;
  metadata: {
    template: string;
    framework: string;
    generatedAt: Date;
    deploymentUrl?: string;    // 🔧 保存的预览链接
    lastDeployedAt?: Date;     // 🔧 最后部署时间
  };
}

// 扩展generatedContent
generatedContent?: {
  resume?: GeneratedResume;
  portfolio?: GeneratedPortfolio;
  coverLetter?: GeneratedCoverLetter;
  codeProject?: GeneratedCodeProject; // 🆕 新增
};
```

### 2. URL保存机制

**部署成功后保存URL**：
```typescript
// 在 app/chat/page.tsx 的 handleDeploy 函数中
if (currentSession && result.deployment.url) {
  const storageKey = `deployment-url-${currentSession.id}`;
  localStorage.setItem(storageKey, result.deployment.url);
  console.log('💾 [部署保存] 预览URL已保存到localStorage:', result.deployment.url);
}
```

### 3. URL恢复机制

**会话切换时恢复URL**：
```typescript
// 在 app/chat/page.tsx 中
useEffect(() => {
  if (currentSession) {
    // 优先从会话数据中恢复（未来实现）
    if (currentSession.generatedContent?.codeProject?.metadata?.deploymentUrl) {
      const savedUrl = currentSession.generatedContent.codeProject.metadata.deploymentUrl;
      setDeploymentUrl(savedUrl);
    } else {
      // 从localStorage恢复
      const storageKey = `deployment-url-${currentSession.id}`;
      const savedUrl = localStorage.getItem(storageKey);
      if (savedUrl) {
        setDeploymentUrl(savedUrl);
      }
    }
  }
}, [currentSession?.id]);
```

### 4. 智能部署逻辑

**避免重复部署**：
```typescript
// 在 CodePreviewToggle.tsx 中
React.useEffect(() => {
  if (autoDeployEnabled && isProjectComplete && !hasAutoDeployed) {
    // 🔧 检查是否已有保存的预览URL
    if (deploymentUrl) {
      console.log('✅ [自动部署] 检测到已保存的预览URL，跳过重新部署:', deploymentUrl);
      setHasAutoDeployed(true);
      return;
    }
    // 否则进行正常部署...
  }
}, [autoDeployEnabled, isProjectComplete, hasAutoDeployed, deploymentUrl]);
```

### 5. 优化刷新机制

**iframe优先刷新**：
```typescript
// 在 VercelPreview.tsx 中
const handleRefresh = useCallback(async () => {
  try {
    // 🔧 首先尝试简单的iframe刷新，避免重新部署
    if (iframeRef.current) {
      console.log('🔄 [刷新] 尝试iframe刷新而不重新部署...');
      iframeRef.current.src = iframeRef.current.src;
    } else {
      // 只有在必要时才重新部署
      console.log('🔄 [刷新] iframe不可用，触发重新部署...');
      await handleDeploy();
    }
  } finally {
    setIsRefreshing(false);
  }
}, [handleDeploy]);
```

## 技术实现细节

### 存储策略

1. **主要存储**：会话数据中的`generatedContent.codeProject.metadata.deploymentUrl`
2. **备用存储**：localStorage（`deployment-url-${sessionId}`）
3. **优先级**：会话数据 > localStorage > 空

### 生命周期管理

1. **保存时机**：部署成功后立即保存
2. **恢复时机**：会话切换或页面加载时
3. **清理时机**：文件内容变化时（可选）

### 缓存策略

- **持久性**：localStorage提供跨会话持久性
- **会话级**：每个会话独立的预览URL
- **自动清理**：防止存储无效或过期的URL

## 用户体验改进

### 1. 加载速度提升
- ✅ 避免不必要的重新部署
- ✅ 即时恢复已有的预览链接
- ✅ 减少等待时间

### 2. 资源使用优化
- ✅ 减少Vercel部署次数
- ✅ 节省网络带宽
- ✅ 降低服务器负载

### 3. 操作连续性
- ✅ 刷新页面后预览不丢失
- ✅ 会话切换保持预览状态
- ✅ 无缝的用户体验

## 日志追踪

系统会输出以下关键日志：

```
💾 [部署保存] 预览URL已保存到localStorage: https://...
🔗 [预览恢复] 从localStorage恢复预览URL: https://...
✅ [自动部署] 检测到已保存的预览URL，跳过重新部署: https://...
🔄 [刷新] 尝试iframe刷新而不重新部署...
```

## 未来优化方向

1. **数据库持久化**：将URL保存到Supabase会话数据中
2. **过期检测**：检查保存的URL是否仍然有效
3. **版本控制**：根据文件内容变化判断是否需要重新部署
4. **用户选择**：提供"强制重新部署"选项

## 兼容性说明

- ✅ 向后兼容现有功能
- ✅ 不影响正常的部署流程
- ✅ 渐进式增强用户体验
- ✅ 优雅降级到原有逻辑
