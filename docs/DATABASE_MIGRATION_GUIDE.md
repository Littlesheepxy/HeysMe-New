# 数据库迁移指南：添加generated_content字段

## 🎯 迁移目的

为了更好地存储和管理AI生成的内容（如代码项目、预览URL等），我们需要：

1. 在`chat_sessions`表中添加专门的`generated_content`字段
2. 将现有的数据从`metadata`中迁移到新字段
3. 更新应用代码以使用新的字段结构

## 📋 需要执行的操作

### 1. **执行数据库迁移**

运行迁移脚本：
```sql
-- 在Supabase SQL编辑器中执行
\i sql/add-generated-content-field.sql
```

或者直接复制`sql/add-generated-content-field.sql`中的内容到Supabase Dashboard的SQL编辑器执行。

### 2. **迁移包含的内容**

✅ **添加新字段**：
```sql
ALTER TABLE public.chat_sessions 
ADD COLUMN IF NOT EXISTS generated_content jsonb DEFAULT '{}';
```

✅ **性能优化索引**：
```sql
-- 通用查询索引
CREATE INDEX idx_chat_sessions_generated_content 
ON public.chat_sessions USING gin (generated_content);

-- 部署URL专用索引
CREATE INDEX idx_chat_sessions_deployment_url 
ON public.chat_sessions USING gin ((generated_content->'codeProject'->'metadata'->>'deploymentUrl'));
```

✅ **实用查询函数**：
```sql
-- 查询用户的所有有预览URL的项目
SELECT * FROM get_sessions_with_deployment_urls('user_123');

-- 清理过期的预览URL
SELECT cleanup_expired_deployment_urls(30); -- 清理30天前的
```

✅ **自动数据迁移**：
- 检测现有的`metadata.generatedContent`数据
- 自动迁移到新的`generated_content`字段
- 清理旧的嵌套结构

### 3. **验证迁移结果**

执行后检查：

```sql
-- 检查字段是否添加成功
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'chat_sessions' AND column_name = 'generated_content';

-- 检查索引是否创建成功
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'chat_sessions' 
AND indexname LIKE '%generated_content%';

-- 检查数据迁移情况
SELECT COUNT(*) as total_sessions,
       COUNT(generated_content) as sessions_with_content,
       COUNT(generated_content->'codeProject') as sessions_with_code_projects
FROM chat_sessions;
```

## 🔄 应用代码更改

### 更改的文件

1. **`lib/utils/session-storage.ts`**：
   - ✅ 保存时使用`generated_content`字段
   - ✅ 读取时从`generated_content`字段恢复
   - ✅ 清理了嵌套存储逻辑

### 数据结构对比

**迁移前（嵌套在metadata中）**：
```json
{
  "metadata": {
    "progress": {...},
    "generatedContent": {
      "codeProject": {
        "metadata": {
          "deploymentUrl": "https://..."
        }
      }
    }
  }
}
```

**迁移后（独立字段）**：
```json
{
  "metadata": {
    "progress": {...}
  },
  "generated_content": {
    "codeProject": {
      "metadata": {
        "deploymentUrl": "https://..."
      }
    }
  }
}
```

## 🎊 迁移优势

### 1. **性能提升**
- ✅ 专门的GIN索引提升查询速度
- ✅ 减少JSON嵌套层级
- ✅ 优化大数据量下的查询性能

### 2. **结构清晰**
- ✅ 生成内容与元数据分离
- ✅ 更符合数据库范式
- ✅ 便于未来扩展

### 3. **功能增强**
- ✅ 快速查询有预览URL的项目
- ✅ 批量管理生成内容
- ✅ 支持复杂的内容筛选

### 4. **兼容性保证**
- ✅ 自动数据迁移，无数据丢失
- ✅ 向后兼容现有功能
- ✅ 渐进式升级，不影响现有用户

## ⚡ 实际效果

### 预览URL保存和恢复
```typescript
// 现在的数据路径更清晰
currentSession.generatedContent.codeProject.metadata.deploymentUrl

// 数据库查询更高效
SELECT generated_content->'codeProject'->'metadata'->>'deploymentUrl' 
FROM chat_sessions 
WHERE user_id = $1;
```

### 查询性能
```sql
-- 快速找到所有有预览URL的项目
SELECT session_id, deployment_url, project_name
FROM get_sessions_with_deployment_urls('user_123')
ORDER BY last_deployed_at DESC;
```

## 🛡️ 安全性

- ✅ 使用`IF NOT EXISTS`防止重复执行
- ✅ 事务性迁移，要么全成功要么全回滚
- ✅ 保留原有数据作为备份
- ✅ 详细的日志记录迁移过程

## 📊 监控和维护

### 定期清理
```sql
-- 每月清理过期的预览URL（节省存储空间）
SELECT cleanup_expired_deployment_urls(30);
```

### 数据统计
```sql
-- 查看生成内容的使用情况
SELECT 
  COUNT(*) as total_sessions,
  COUNT(generated_content->'codeProject') as code_projects,
  COUNT(generated_content->'codeProject'->'metadata'->>'deploymentUrl') as deployed_projects
FROM chat_sessions;
```

这个迁移让我们的预览URL持久化功能更加稳定、高效，为未来的功能扩展打下了良好基础！ 🚀
