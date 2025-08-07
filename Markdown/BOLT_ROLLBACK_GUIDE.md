# Bolt 数据库集成回滚指南

## 📋 概述

本指南提供了四个回滚脚本来撤销 Bolt 与 HeysMe 的数据库集成：

1. **`rollback_bolt_integration_fixed.sql`** - 完整回滚脚本（修复版本，推荐）
2. **`quick_rollback_bolt_fixed.sql`** - 快速回滚脚本（修复版本，紧急使用）
3. **`rollback_bolt_integration.sql`** - 原始完整回滚脚本（可能有函数依赖问题）
4. **`quick_rollback_bolt.sql`** - 原始快速回滚脚本（可能有函数依赖问题）

## ⚠️ 重要警告

> **数据安全警告：执行回滚脚本将永久删除所有 Bolt 相关数据！**
> 
> - 所有 Bolt 项目文件将被删除
> - 所有工作台快照将丢失
> - 所有部署记录将被清除
> - 所有协作会话将终止
> - **此操作不可逆转！**

## 🔧 使用方法

### 方法 1: 使用 Supabase Dashboard（推荐）

1. 登录到 [Supabase Dashboard](https://app.supabase.com)
2. 选择你的项目
3. 进入 **SQL Editor**
4. 复制并粘贴 `rollback_bolt_integration_fixed.sql` 的内容
5. 点击 **Run** 执行脚本

### 方法 2: 使用本地 psql 客户端

```bash
# 连接到你的 Supabase 数据库
psql "postgresql://[USERNAME]:[PASSWORD]@[HOST]:[PORT]/postgres"

# 执行回滚脚本
\i rollback_bolt_integration_fixed.sql
```

### 方法 3: 使用项目中的 Supabase CLI

```bash
# 确保已连接到正确的项目
supabase status

# 执行回滚脚本
psql --dbname=postgresql://localhost:54322/postgres --file=rollback_bolt_integration_fixed.sql
```

## 📊 回滚脚本对比

| 特性 | 修复版完整回滚 | 修复版快速回滚 | 原始完整回滚 | 原始快速回滚 |
|------|---------------|---------------|-------------|-------------|
| **函数依赖处理** | ✅ 正确处理 | ✅ 正确处理 | ❌ 可能失败 | ❌ 可能失败 |
| **安全检查** | ✅ 完整验证 | ❌ 无验证 | ✅ 完整验证 | ❌ 无验证 |
| **错误处理** | ✅ 详细处理 | ⚠️ 基础处理 | ✅ 详细处理 | ⚠️ 基础处理 |
| **进度提示** | ✅ 详细日志 | ❌ 简单状态 | ✅ 详细日志 | ❌ 简单状态 |
| **依赖清理** | ✅ 完整清理 | ⚠️ 依赖级联 | ✅ 完整清理 | ⚠️ 依赖级联 |
| **执行时间** | 较慢 | 很快 | 较慢 | 很快 |
| **推荐场景** | 生产环境 | 紧急恢复 | 测试环境 | 测试环境 |

## 🎯 选择合适的脚本

### 使用修复版完整回滚脚本的情况：
- ✅ 生产环境回滚
- ✅ 需要详细的执行日志
- ✅ 要确保完全清理
- ✅ 有时间进行充分验证
- ✅ **避免函数依赖错误**

### 使用修复版快速回滚脚本的情况：
- ⚡ 紧急情况需要快速恢复
- ⚡ 测试环境快速重置
- ⚡ 确定没有重要数据需要保留
- ⚡ **避免函数依赖错误**

### 原始脚本的问题：
- ❌ 可能遇到 `update_updated_at_column()` 函数依赖错误
- ❌ 需要手动处理函数依赖关系
- ❌ 建议仅用于测试环境

## 🔧 函数依赖问题说明

### 问题描述：
原始回滚脚本尝试删除 `update_updated_at_column()` 函数，但该函数被多个现有表的触发器使用：

- `chat_sessions` 表
- `pages` 表  
- `page_blocks` 表
- `page_shares` 表
- `page_builds` 表
- `user_pages` 表
- `templates` 表
- `creator_verifications` 表
- `user_sensitive_data` 表
- `user_credits` 表
- `user_documents` 表
- `document_parsing_jobs` 表
- `document_parsing_cache` 表

### 解决方案：
修复版脚本：
- ✅ 只删除 Bolt 专用的函数
- ✅ 保留通用的 `update_updated_at_column()` 函数
- ✅ 避免影响现有系统的触发器

## 📋 执行前检查清单

### 🔍 执行前必须检查：

- [ ] **数据备份**：确认已备份重要数据
- [ ] **环境确认**：确认当前连接的是正确的数据库
- [ ] **权限检查**：确认有足够的数据库权限
- [ ] **依赖确认**：确认没有其他系统依赖 Bolt 相关表
- [ ] **时间安排**：选择低峰时段执行
- [ ] **脚本选择**：使用修复版脚本避免函数依赖问题

### 📝 备份重要数据（可选）

如果需要保留某些 Bolt 数据，请在回滚前执行：

```sql
-- 备份 Bolt 项目文件
CREATE TABLE bolt_project_files_backup AS SELECT * FROM public.bolt_project_files;

-- 备份工作台快照
CREATE TABLE bolt_workbench_snapshots_backup AS SELECT * FROM public.bolt_workbench_snapshots;

-- 备份部署记录
CREATE TABLE bolt_deployments_backup AS SELECT * FROM public.bolt_deployments;

-- 备份 chat_sessions 中的 Bolt 数据
CREATE TABLE chat_sessions_bolt_backup AS 
SELECT id, bolt_data, bolt_workbench_state, bolt_file_tree, bolt_preview_url 
FROM public.chat_sessions 
WHERE bolt_data IS NOT NULL;
```

## ✅ 验证回滚成功

回滚完成后，检查以下内容确认成功：

### 1. 检查表是否已删除
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'bolt_%';
-- 应该返回空结果
```

### 2. 检查字段是否已删除
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND column_name LIKE 'bolt_%';
-- 应该返回空结果
```

### 3. 检查存储桶是否已删除
```sql
SELECT id FROM storage.buckets WHERE id = 'bolt-projects';
-- 应该返回空结果
```

### 4. 检查 Bolt 专用函数是否已删除
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
  'get_bolt_session_details',
  'cleanup_bolt_data', 
  'update_bolt_file_updated_at'
);
-- 应该返回空结果
```

### 5. 验证通用函数仍然存在
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'update_updated_at_column';
-- 应该返回 1 行结果
```

## 🔄 重新集成 Bolt

如果需要重新集成 Bolt，请：

1. 确认回滚完全成功
2. 重新运行原始的 Bolt 集成迁移脚本
3. 重新配置相关的应用代码

## 🆘 故障排除

### 常见错误及解决方案：

#### 错误：函数依赖问题
```sql
ERROR: cannot drop function update_updated_at_column() because other objects depend on it
```
**解决方案**：使用修复版回滚脚本，它会正确处理函数依赖关系

#### 错误：权限不足
```sql
ERROR: permission denied for relation [table_name]
```
**解决方案**：确保使用具有足够权限的数据库用户（通常是项目所有者或 postgres 角色）

#### 错误：依赖对象存在
```sql
ERROR: cannot drop table [table_name] because other objects depend on it
```
**解决方案**：使用完整回滚脚本，它会处理依赖关系

#### 错误：表不存在
```sql
ERROR: table "[table_name]" does not exist
```
**解决方案**：这是正常的，说明表已经被删除或从未创建

### 部分回滚失败的处理：

如果某些步骤失败，可以手动执行特定的清理操作：

```sql
-- 手动删除剩余的表
DROP TABLE IF EXISTS public.bolt_project_files CASCADE;
DROP TABLE IF EXISTS public.bolt_workbench_snapshots CASCADE;
-- ... 其他表

-- 手动删除剩余的字段
ALTER TABLE public.chat_sessions DROP COLUMN IF EXISTS bolt_data;
-- ... 其他字段

-- 手动删除 Bolt 专用函数（不删除通用函数）
DROP FUNCTION IF EXISTS public.get_bolt_session_details(text);
DROP FUNCTION IF EXISTS public.cleanup_bolt_data(integer);
DROP FUNCTION IF EXISTS public.update_bolt_file_updated_at();
```

## 📞 获取帮助

如果在回滚过程中遇到问题：

1. 检查数据库日志获取详细错误信息
2. 确认数据库连接和权限
3. 查看本文档的故障排除部分
4. 考虑在测试环境先行验证
5. 使用修复版脚本避免函数依赖问题

## 📝 更新日志

- **v1.0.1** - 修复版本，正确处理函数依赖关系
  - 修复 `update_updated_at_column()` 函数依赖问题
  - 只删除 Bolt 专用函数，保留通用函数
  - 添加详细的函数依赖说明
- **v1.0.0** - 初始版本，包含完整和快速回滚脚本
  - 支持完整的 Bolt 集成撤销
  - 包含详细的验证和错误处理 