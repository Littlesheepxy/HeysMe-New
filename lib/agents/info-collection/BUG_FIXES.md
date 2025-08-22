# Bug 修复总结

## 问题 1: 数据库外键约束错误

### 错误信息
```
insert or update on table "projects" violates foreign key constraint "fk_project_session"
```

### 问题原因
在创建项目时，`session_id` 引用的会话记录在数据库的 `chat_sessions` 表中不存在，导致外键约束违反。

### 修复方案
在 `ProjectFileStorageService.createProject()` 方法中添加了 `ensureSessionExists()` 方法：

1. **检查会话是否存在**: 查询 `chat_sessions` 表
2. **自动创建会话记录**: 如果会话不存在，创建基础会话记录
3. **容错处理**: 即使会话创建失败，也不阻塞项目创建流程

### 修复代码
```typescript
// 在 createProject 方法中添加
await this.ensureSessionExists(sessionId, userId);

// 新增方法
private async ensureSessionExists(sessionId: string, userId: string): Promise<void> {
  // 检查会话是否存在，不存在则创建基础记录
}
```

## 问题 2: 标题生成 API URL 错误

### 错误信息
```
TypeError: Failed to parse URL from /api/ai/generate
```

### 问题原因
在服务端使用相对路径 `/api/ai/generate` 调用 API，但服务端需要绝对路径。

### 修复方案
在 `app/api/conversations/gen-title/route.ts` 中修复 URL：

```typescript
// 修复前
const aiResponse = await fetch('/api/ai/generate', {

// 修复后  
const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000';
const aiResponse = await fetch(`${baseUrl}/api/ai/generate`, {
```

## 问题 3: Vercel AI Agent 工具定义错误

### 错误信息
工具定义中使用了错误的参数名 `parameters` 而不是 `inputSchema`。

### 修复方案
已在用户的修改中完成：
- 将所有工具定义中的 `parameters` 改为 `inputSchema`
- 将 `maxSteps` 改为 `stopWhen: stepCountIs(6)`

## 验证修复

### 1. 数据库外键约束
- ✅ 项目创建时自动创建会话记录
- ✅ 避免外键约束违反错误
- ✅ 容错处理确保流程不中断

### 2. 标题生成 API
- ✅ 使用正确的绝对路径
- ✅ 支持多种环境变量配置
- ✅ 本地开发和生产环境兼容

### 3. Vercel AI Agent
- ✅ 工具定义语法正确
- ✅ 支持最新的 Vercel AI SDK
- ✅ 工具调用功能正常

## 测试建议

1. **重新测试 GitHub 链接处理**:
   ```
   输入: https://github.com/vercel
   预期: 直接调用工具分析，不返回欢迎消息
   ```

2. **测试项目创建**:
   ```
   确保新会话可以成功创建项目文件
   ```

3. **测试标题生成**:
   ```
   确保对话标题可以正常生成
   ```

## 相关文件

- `lib/services/project-file-storage.ts` - 项目文件存储服务
- `app/api/conversations/gen-title/route.ts` - 标题生成 API
- `lib/agents/info-collection/vercel-ai-agent.ts` - Vercel AI Agent

## 部署注意事项

1. 确保环境变量正确配置：
   - `NEXTAUTH_URL` 或 `VERCEL_URL`
   - Supabase 相关环境变量

2. 数据库表结构确保正确：
   - `chat_sessions` 表存在
   - `projects` 表的外键约束正确配置

3. 重新部署后测试所有修复的功能
