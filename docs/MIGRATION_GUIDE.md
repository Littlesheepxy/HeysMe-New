# 📚 会话文件迁移工具使用指南

## 🎯 概述

你的迁移工具 `migrate-session-files.ts` 已经准备好了！这个工具可以将现有的会话项目文件从 `sessionData.metadata.projectFiles` 迁移到 Supabase 存储系统。

## ❓ 是否需要创建新的存储桶？

**答案：❌ 不需要！**

你的系统采用了**智能双重存储策略**：

### 📊 存储策略详解

```typescript
// 小文件 (<100KB) - 直接存储在数据库
{
  content: "文件内容直接存在这里",
  storage_path: null
}

// 大文件 (≥100KB) - 存储在 Storage，数据库保存引用
{
  content: "",
  storage_path: "project-files/project_123/file_456.tsx",
  storage_bucket: "project-files"
}
```

- **小文件**：直接存储在 `project_files.content` 字段
- **大文件**：存储在 Supabase Storage，使用默认的 `project-files` 桶

## 🚀 使用步骤

### 1. 🛠️ 环境准备

确保你的 `.env.local` 包含：

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. 📊 数据库初始化

运行数据库初始化脚本：

```sql
-- 在 Supabase SQL 编辑器中执行
\i sql/project-file-storage-schema.sql
```

或者手动创建表：
- `projects` - 项目信息
- `project_commits` - 提交记录
- `project_files` - 文件内容
- `file_changes` - 变更记录

### 3. 🎮 访问迁移页面

在浏览器中访问：
```
http://localhost:3000/migrate-data
```

### 4. ✅ 环境检查

页面会自动检查：
- ✅ Supabase 连接状态
- ✅ 数据库表完整性
- ✅ 用户认证状态
- ✅ 存储服务可用性

### 5. 🔄 执行迁移

如果环境检查通过，点击 **"🚀 开始迁移"** 按钮。

## 🔧 迁移工具 API

### 编程方式使用

如果你想通过代码调用迁移：

```typescript
import { sessionFilesMigrator } from '@/lib/utils/migrate-session-files';

// 迁移单个会话
const result = await sessionFilesMigrator.migrateSession(
  sessionData,
  userId,
  false // force = false，跳过已迁移的会话
);

// 批量迁移
const batchResult = await sessionFilesMigrator.migrateBatch(
  sessions,
  userId,
  {
    force: false,
    maxConcurrent: 3,
    onProgress: (completed, total, current) => {
      console.log(`进度: ${completed}/${total}`);
    }
  }
);

// 生成报告
const report = sessionFilesMigrator.generateReport(batchResult.results);
console.log(report);
```

## 📁 迁移后的数据结构

### 原始格式 (会话存储)
```typescript
sessionData.metadata.projectFiles = [
  {
    filename: 'app/page.tsx',
    content: 'export default function Home() {...}',
    language: 'typescript',
    description: '主页组件'
  }
];
```

### 迁移后格式 (Supabase)
```sql
-- projects 表
INSERT INTO projects (id, name, session_id, user_id, framework) 
VALUES ('proj_123', 'Project_session123', 'session_123', 'user_456', 'next.js');

-- project_commits 表  
INSERT INTO project_commits (id, project_id, message, type, ai_agent)
VALUES ('commit_789', 'proj_123', '数据迁移 - 从会话存储迁移到Supabase', 'initial', 'MigrationAgent');

-- project_files 表
INSERT INTO project_files (id, project_id, commit_id, filename, content, file_type)
VALUES ('file_101', 'proj_123', 'commit_789', 'app/page.tsx', '...', 'page');
```

## 🎯 迁移特性

### 🔒 安全性
- ✅ 只迁移未迁移过的会话 (检查 `metadata.migratedToSupabase`)
- ✅ 支持 `force` 参数强制重新迁移
- ✅ 原始数据保持不变
- ✅ RLS 行级安全保护

### 📈 性能
- ✅ 批量处理，默认最多 3 个并发
- ✅ 实时进度反馈
- ✅ 内容去重 (SHA256 哈希)
- ✅ 智能文件类型映射

### 🛡️ 错误处理
- ✅ 事务性操作，要么全部成功要么全部回滚
- ✅ 详细的错误日志和报告
- ✅ 断点续传能力

## 📊 迁移报告示例

```markdown
# 🔄 会话文件迁移报告

## 📊 总体统计
- 🎯 **处理会话数**: 10
- ✅ **成功迁移**: 8  
- ❌ **迁移失败**: 2
- 📁 **迁移文件总数**: 156

## ✅ 成功迁移的会话
- session_001 (12 个文件)
- session_002 (8 个文件)
- session_003 (15 个文件)

## ❌ 迁移失败的会话  
- session_004: 用户权限不足
- session_005: 文件内容格式错误

## 🚀 后续步骤
1. 验证迁移后的项目文件是否完整
2. 更新相关代码以使用新的存储系统
3. 清理旧的会话存储数据（可选）
```

## 🔮 后续集成

### CodingAgent 集成

迁移完成后，你的 CodingAgent 会自动使用新的存储系统：

```typescript
// 自动选择存储方式
if (isAuthenticated && userId) {
  // 🚀 保存到 Supabase
  await projectFileStorage.saveIncrementalEdit(sessionId, userId, prompt, files);
} else {
  // 🔄 降级到会话存储
  sessionData.metadata.projectFiles = files;
}
```

### 项目管理界面

访问 `/project-storage-demo` 查看迁移后的项目：
- 📁 项目列表和文件浏览
- 📈 提交历史时间线
- 📊 统计仪表板
- 🚀 部署状态跟踪

## ❓ 常见问题

### Q: 迁移会删除原始数据吗？
A: **不会**。迁移只是复制数据到新系统，原始会话数据保持不变。

### Q: 如果迁移失败怎么办？
A: 可以重新运行迁移，系统会自动跳过已成功迁移的数据。

### Q: 存储桶权限如何配置？
A: 系统主要使用数据库存储，Storage 只在需要时自动创建，无需手动配置权限。

### Q: 迁移需要多长时间？
A: 取决于文件数量，通常每个会话 1-3 秒，100 个会话大约 5-10 分钟。

## 🎉 完成！

迁移完成后，你的系统将享受到：
- 📱 永久性数据存储
- 🔄 完整的版本控制
- 🚀 无限的扩展能力
- 🔒 企业级的安全性

现在就开始使用你的新存储系统吧！ 🎊
