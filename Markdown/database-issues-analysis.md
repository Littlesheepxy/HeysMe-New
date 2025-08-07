# HeysMe 数据库结构问题分析与解决方案

## 🔍 问题分析

### 1. 主要问题

1. **数据类型不一致**
   - 现有 `users` 表使用 `text` 类型的 `id`
   - 社区功能表使用 `UUID` 类型的 `user_id`
   - 导致外键约束失败

2. **重复的表结构**
   - 同时存在多个版本的社区功能表
   - 表之间的外键引用混乱

3. **约束冲突**
   - 外键约束指向不存在的表或字段类型不匹配
   - RLS策略配置不正确

### 2. 具体错误

```sql
-- 错误示例：类型不匹配
CONSTRAINT user_pages_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id)  -- auth.users(id) 是 UUID
-- 但实际应该引用 public.users(id) 是 text 类型
```

## 🛠️ 解决方案

### 方案一：执行修复脚本（推荐）

1. **在 Supabase SQL Editor 中执行 `fix-database-schema.sql`**
   - 清理重复表
   - 重新创建正确的表结构
   - 使用正确的数据类型

2. **主要修复点**：
   ```sql
   -- 修复前：错误的外键引用
   user_id UUID REFERENCES auth.users(id)
   
   -- 修复后：正确的外键引用
   user_id text REFERENCES public.users(id)
   ```

### 方案二：手动修复（如果方案一失败）

如果自动修复脚本遇到问题，可以手动执行以下步骤：

#### 步骤1：清理重复表
```sql
-- 删除重复的社区功能表
DROP TABLE IF EXISTS public.user_pages CASCADE;
DROP TABLE IF EXISTS public.user_sensitive_data CASCADE;
DROP TABLE IF EXISTS public.templates CASCADE;
DROP TABLE IF EXISTS public.creator_verifications CASCADE;
DROP TABLE IF EXISTS public.share_records CASCADE;
DROP TABLE IF EXISTS public.template_forks CASCADE;
DROP TABLE IF EXISTS public.user_favorites CASCADE;
DROP TABLE IF EXISTS public.premium_feature_usage CASCADE;
DROP TABLE IF EXISTS public.user_credits CASCADE;
```

#### 步骤2：重新创建核心表
```sql
-- 用户身份页面表（使用正确的数据类型）
CREATE TABLE public.user_pages (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id text NOT NULL, -- 使用text类型匹配现有users表
  title varchar(200) NOT NULL,
  description text,
  content jsonb NOT NULL DEFAULT '{}',
  is_shared_to_plaza boolean DEFAULT false,
  plaza_share_config jsonb DEFAULT '{}',
  category varchar(50),
  tags text[] DEFAULT '{}',
  industry_tags text[] DEFAULT '{}',
  location varchar(100),
  privacy_settings jsonb DEFAULT '{"allow_view": true, "allow_favorite": true, "show_username": false}',
  view_count integer DEFAULT 0,
  favorite_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  shared_at timestamp with time zone,
  
  CONSTRAINT user_pages_pkey PRIMARY KEY (id),
  CONSTRAINT user_pages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);
```

## ✅ 验证修复结果

执行修复后，检查以下内容：

### 1. 表结构验证
```sql
-- 检查表是否正确创建
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('user_pages', 'templates', 'creator_verifications')
ORDER BY table_name, ordinal_position;
```

### 2. 外键约束验证
```sql
-- 检查外键约束是否正确
SELECT 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE constraint_type = 'FOREIGN KEY' 
  AND tc.table_name LIKE '%user_%' OR tc.table_name = 'templates';
```

### 3. 功能测试
```sql
-- 测试插入数据（需要先有用户数据）
INSERT INTO public.user_pages (user_id, title, description, content)
VALUES ('your-user-id', '测试页面', '这是一个测试页面', '{}');
```

## 🚀 下一步操作

修复完成后：

1. **更新前端代码**
   - 确保API调用使用正确的表名和字段
   - 更新TypeScript类型定义

2. **测试社区功能**
   - 测试数字身份广场页面
   - 测试模板库功能
   - 测试分享功能

3. **数据迁移**（如果有现有数据）
   - 将现有页面数据迁移到新的表结构
   - 更新用户关联关系

## 📝 注意事项

1. **备份数据**：在执行修复脚本前，确保重要数据已备份
2. **测试环境**：建议先在测试环境执行修复
3. **权限检查**：确保数据库用户有足够权限执行DDL操作
4. **RLS策略**：修复后需要验证行级安全策略是否正常工作

## 🔧 常见问题

### Q: 执行脚本时提示权限不足
A: 确保使用的是 `service_role` 密钥，而不是 `anon` 密钥

### Q: 外键约束仍然失败
A: 检查引用的表和字段是否存在，数据类型是否匹配

### Q: RLS策略不工作
A: 检查策略中的用户身份验证逻辑，确保与Clerk集成正确

---

*修复完成后，HeysMe的社区功能应该能够正常工作。* 