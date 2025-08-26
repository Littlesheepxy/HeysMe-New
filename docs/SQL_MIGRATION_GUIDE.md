# 🗄️ SQL数据迁移指南

## 📋 概述

使用SQL脚本将现有 `chat_sessions` 中的 `generated_content` 迁移到项目表，这种方式比JavaScript脚本更简单、更可靠。

### 📊 当前数据统计

根据分析，您的系统中有：
- **4个会话**包含代码项目文件
- **总计46个文件**需要迁移
- **0个会话**已经迁移（全新迁移）

**会话详情：**
- `session-1755762566684-mtw34ska2`: 7个文件
- `session-1755761975726-bqt3j5n8p`: 7个文件  
- `session-1755082177969-ggyyklf42`: 13个文件
- `session-1754643826395-z5rakla60`: 19个文件（马斯克简历项目）

## 🚀 执行步骤

### 步骤 1：准备迁移函数

在 Supabase SQL Editor 中执行：

```sql
-- 执行完整的迁移函数创建脚本
\i sql/migrate-sessions-to-projects.sql
```

或者直接复制 `sql/migrate-sessions-to-projects.sql` 的内容到 SQL Editor 执行。

### 步骤 2：分析现有数据

```sql
-- 查看需要迁移的会话统计
SELECT 
  COUNT(*) as total_sessions_with_content,
  COUNT(CASE WHEN generated_content->'codeProject'->'files' IS NOT NULL THEN 1 END) as sessions_with_code_files,
  COUNT(CASE WHEN generated_content->'metadata'->>'migratedToProject' = 'true' THEN 1 END) as already_migrated
FROM chat_sessions 
WHERE generated_content IS NOT NULL 
  AND generated_content != '{}'::jsonb;
```

### 步骤 3：预览迁移

```sql
-- 查看将要迁移的会话详情
SELECT 
  id as session_id,
  user_id,
  metadata->>'title' as session_title,
  jsonb_array_length(generated_content->'codeProject'->'files') as file_count,
  created_at
FROM chat_sessions 
WHERE generated_content->'codeProject'->'files' IS NOT NULL
  AND (generated_content->'metadata'->>'migratedToProject' IS NULL 
       OR generated_content->'metadata'->>'migratedToProject' != 'true')
ORDER BY created_at DESC;
```

### 步骤 4：执行迁移

```sql
-- 执行批量迁移
SELECT 
  session_id,
  CASE WHEN success THEN '✅ 成功' ELSE '❌ 失败' END as status,
  project_id,
  files_count,
  error_message
FROM migrate_all_sessions_to_projects()
ORDER BY success DESC, session_id;
```

### 步骤 5：验证结果

```sql
-- 验证项目表
SELECT 
  COUNT(*) as total_projects,
  SUM(total_files) as total_files,
  COUNT(DISTINCT session_id) as unique_sessions
FROM projects 
WHERE template = 'migration';

-- 验证会话迁移状态
SELECT 
  COUNT(*) as total_sessions_with_code,
  COUNT(CASE WHEN generated_content->'metadata'->>'migratedToProject' = 'true' THEN 1 END) as migrated_sessions
FROM chat_sessions 
WHERE generated_content->'codeProject'->'files' IS NOT NULL;
```

## 🔧 迁移函数说明

### `migrate_session_to_project(session_id, user_id)`

迁移单个会话到项目表。

**参数：**
- `session_id`: 会话ID
- `user_id`: 用户ID（可选，默认使用会话中的user_id）

**返回：**
- `success`: 是否成功
- `project_id`: 创建的项目ID
- `commit_id`: 创建的提交ID
- `files_count`: 迁移的文件数量
- `error_message`: 错误信息（如果失败）

**示例：**
```sql
SELECT * FROM migrate_session_to_project('session-1755762566684-mtw34ska2');
```

### `migrate_all_sessions_to_projects()`

批量迁移所有需要迁移的会话。

**返回：**
- `session_id`: 会话ID
- `success`: 是否成功
- `project_id`: 创建的项目ID
- `files_count`: 迁移的文件数量
- `error_message`: 错误信息（如果失败）

## 📊 数据结构映射

### 迁移前（chat_sessions）
```json
{
  "generated_content": {
    "codeProject": {
      "files": [
        {
          "filename": "app/page.tsx",
          "content": "...",
          "language": "typescript",
          "description": "主页组件"
        }
      ]
    }
  }
}
```

### 迁移后（项目表）

**projects 表：**
- `id`: 自动生成的项目ID
- `session_id`: 原会话ID
- `name`: 从会话标题生成
- `template`: 'migration'
- `total_files`: 文件数量

**project_files 表：**
- `filename`: 文件路径
- `content`: 文件内容
- `language`: 自动检测的语言类型
- `file_type`: 自动分类的文件类型

**project_commits 表：**
- `message`: "🎉 Initial commit - 从会话迁移"
- `type`: 'initial'
- `ai_agent`: 'MigrationScript'

### 迁移标记

会话的 `generated_content` 会被更新，添加迁移标记：

```json
{
  "generated_content": {
    "codeProject": { ... },
    "metadata": {
      "migratedToProject": true,
      "projectId": "proj_1640995200000_abc12345",
      "commitId": "commit_1640995200000_def67890",
      "migratedAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

## 🛡️ 安全特性

### 1. 幂等性
- 已迁移的会话会被跳过
- 重复执行不会产生重复数据

### 2. 数据完整性
- 使用事务确保原子性
- 完整的错误处理和回滚

### 3. 数据验证
- 检查必要字段存在
- 验证文件数量一致性

## 🔍 故障排除

### 常见错误

**1. "Session not found"**
- 会话ID不存在
- 检查会话ID是否正确

**2. "No code files found"**
- 会话中没有代码项目文件
- 这是正常情况，会被跳过

**3. "No user_id available"**
- 会话中没有用户ID
- 手动指定user_id参数

**4. "Already migrated"**
- 会话已经迁移过
- 这是正常情况，会被跳过

### 手动修复

如果需要重新迁移某个会话：

```sql
-- 清除迁移标记
UPDATE chat_sessions 
SET generated_content = generated_content #- '{metadata,migratedToProject}'
WHERE id = 'your-session-id';

-- 删除对应的项目（如果需要）
DELETE FROM projects WHERE session_id = 'your-session-id';

-- 重新迁移
SELECT * FROM migrate_session_to_project('your-session-id');
```

## 📈 监控查询

### 迁移进度监控
```sql
SELECT 
  COUNT(*) as total_code_sessions,
  COUNT(CASE WHEN generated_content->'metadata'->>'migratedToProject' = 'true' THEN 1 END) as migrated,
  COUNT(CASE WHEN generated_content->'metadata'->>'migratedToProject' IS NULL THEN 1 END) as pending,
  ROUND(
    COUNT(CASE WHEN generated_content->'metadata'->>'migratedToProject' = 'true' THEN 1 END) * 100.0 / COUNT(*), 
    2
  ) as migration_percentage
FROM chat_sessions 
WHERE generated_content->'codeProject'->'files' IS NOT NULL;
```

### 数据一致性检查
```sql
SELECT 
  p.session_id,
  p.total_files as project_files,
  jsonb_array_length(cs.generated_content->'codeProject'->'files') as session_files,
  CASE 
    WHEN p.total_files = jsonb_array_length(cs.generated_content->'codeProject'->'files') 
    THEN '✅ 一致' 
    ELSE '❌ 不一致' 
  END as status
FROM projects p
JOIN chat_sessions cs ON p.session_id = cs.id
WHERE p.template = 'migration'
  AND cs.generated_content->'codeProject'->'files' IS NOT NULL;
```

## 🧹 清理

迁移完成后，可以删除迁移函数：

```sql
DROP FUNCTION IF EXISTS migrate_session_to_project(TEXT, TEXT);
DROP FUNCTION IF EXISTS migrate_all_sessions_to_projects();
```

## 🎯 总结

使用SQL迁移的优势：
- ✅ **简单可靠** - 直接在数据库层面操作
- ✅ **事务安全** - 自动回滚错误操作
- ✅ **幂等性** - 可重复执行
- ✅ **可监控** - 实时查看进度
- ✅ **可恢复** - 支持手动修复

这种方式避免了复杂的模块导入问题，直接在数据库层面完成迁移，更加稳定可靠。
