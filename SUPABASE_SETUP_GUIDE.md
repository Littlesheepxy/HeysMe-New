# Supabase文档处理系统设置指南

## 🎯 概述

这个指南将帮助你设置基于Supabase的文档上传、存储和解析系统。

## 📋 前置要求

1. ✅ Supabase项目已创建
2. ✅ 环境变量已配置
3. ✅ Clerk认证已设置

## 🗄️ 1. 数据库设置

### 执行SQL脚本

在Supabase Dashboard的SQL编辑器中执行以下脚本：

```sql
-- 执行 supabase-documents-schema.sql 中的所有SQL语句
```

### 验证表创建

确保以下表已创建：
- `user_documents` - 用户文档表
- `document_parsing_jobs` - 解析任务队列
- `document_parsing_cache` - 解析缓存

## 🗂️ 2. Storage设置

### 创建Storage Bucket

1. 在Supabase Dashboard中进入 **Storage**
2. 点击 **New bucket**
3. 设置以下参数：
   - **Name**: `documents`
   - **Public**: `false` (私有bucket)
   - **File size limit**: `10MB`
   - **Allowed MIME types** (支持通配符): 
     - `application/pdf`
     - `application/msword`
     - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
     - `text/*` (支持所有文本类型)
     - `application/json`
     - `image/*` (支持所有图片类型，用于OCR处理)
     - 或留空允许任何MIME类型

### 设置Storage策略

在SQL编辑器中执行：

```sql
-- 允许认证用户上传文档
CREATE POLICY "Authenticated users can upload documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents' AND 
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- 允许用户访问自己的文档
CREATE POLICY "Users can access own documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents' AND 
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- 允许用户删除自己的文档
CREATE POLICY "Users can delete own documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'documents' AND 
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
```

## 🔧 3. 环境变量

确保 `.env.local` 包含：

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Clerk (用于认证)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret

# Supabase S3配置
NEXT_PUBLIC_SUPABASE_REGION=us-east-1
NEXT_PUBLIC_SUPABASE_PROJECT_REF=your_project_ref

# 可选：S3 Access Keys（仅服务端使用）
SUPABASE_S3_ACCESS_KEY_ID=your_access_key
SUPABASE_S3_SECRET_ACCESS_KEY=your_secret_key
```

## 🎯 4. MIME类型配置

### 支持的文件类型

系统支持以下文件类型和MIME类型：

#### 📄 文档类型
- **PDF**: `application/pdf`
- **Word**: `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- **RTF**: `application/rtf`
- **OpenDocument**: `application/vnd.oasis.opendocument.text`

#### 📝 文本类型 (通配符: `text/*`)
- **纯文本**: `text/plain`
- **Markdown**: `text/markdown`
- **CSV**: `text/csv`
- **HTML**: `text/html`
- **XML**: `text/xml`

#### 🖼️ 图片类型 (通配符: `image/*`, 用于OCR)
- **JPEG**: `image/jpeg`
- **PNG**: `image/png`
- **GIF**: `image/gif`
- **BMP**: `image/bmp`
- **TIFF**: `image/tiff`
- **WebP**: `image/webp`

#### 📊 表格类型
- **Excel**: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- **Excel Legacy**: `application/vnd.ms-excel`
- **OpenDocument Spreadsheet**: `application/vnd.oasis.opendocument.spreadsheet`

#### 🎨 演示文稿类型
- **PowerPoint**: `application/vnd.openxmlformats-officedocument.presentationml.presentation`
- **PowerPoint Legacy**: `application/vnd.ms-powerpoint`
- **OpenDocument Presentation**: `application/vnd.oasis.opendocument.presentation`

### 通配符支持

系统支持MIME类型通配符：
- `text/*` - 匹配所有文本类型
- `image/*` - 匹配所有图片类型
- `application/*` - 匹配所有应用程序类型
- 留空 - 允许任何MIME类型

### 自定义配置

在 `lib/services/supabase-document-service.ts` 中修改 `validateFile` 方法的 `allowedTypes` 数组：

```typescript
const allowedTypes = [
  'application/pdf',
  'text/*',           // 支持所有文本类型
  'image/*',          // 支持所有图片类型
  // 添加更多类型...
];

// 或者留空数组允许所有类型
const allowedTypes: string[] = [];
```

## 📦 5. 依赖安装

确保已安装必要的依赖：

```bash
npm install @supabase/supabase-js
npm install pdf-parse mammoth xlsx  # 文档解析依赖
npm install crypto  # 文件哈希生成
```

## 🧪 6. 测试设置

### 测试文档上传

```bash
# 启动开发服务器
npm run dev

# 访问应用并尝试上传文档
```

### 验证功能

1. **文件上传**: 文件应该上传到Supabase Storage
2. **数据库记录**: `user_documents` 表中应该有新记录
3. **文档解析**: 文档内容应该被正确解析
4. **权限控制**: 用户只能访问自己的文档

## 🔍 7. 监控和调试

### 查看日志

- **应用日志**: 在浏览器控制台查看
- **Supabase日志**: 在Dashboard的Logs部分查看
- **API日志**: 在Network面板查看请求

### 常见问题

#### 文件上传失败
- 检查Storage bucket是否存在
- 验证文件大小和类型限制
- 确认Storage策略正确

#### 解析失败
- 检查文档解析依赖是否安装
- 验证文件格式是否支持
- 查看解析错误日志

#### 权限错误
- 确认用户已登录
- 检查RLS策略是否正确
- 验证用户ID匹配

## 🚀 8. 生产部署

### 性能优化

1. **启用缓存**: 使用 `document_parsing_cache` 表
2. **批量处理**: 实现解析任务队列
3. **CDN**: 为静态文件启用CDN

### 安全设置

1. **文件扫描**: 添加病毒扫描
2. **内容验证**: 验证文件内容安全性
3. **访问日志**: 记录文件访问日志

### 监控设置

1. **存储使用量**: 监控Storage使用情况
2. **解析性能**: 跟踪解析时间和成功率
3. **错误率**: 监控上传和解析错误

## 📊 9. 使用统计

### 查询示例

```sql
-- 查看用户文档统计
SELECT 
  user_id,
  COUNT(*) as total_documents,
  SUM(file_size) as total_size,
  COUNT(CASE WHEN parsing_status = 'completed' THEN 1 END) as parsed_count
FROM user_documents 
GROUP BY user_id;

-- 查看解析性能
SELECT 
  file_type,
  AVG(EXTRACT(EPOCH FROM (parsing_completed_at - parsing_started_at))) as avg_parse_time,
  COUNT(*) as total_parsed
FROM user_documents 
WHERE parsing_status = 'completed'
GROUP BY file_type;
```

## 🎉 完成

现在你的Supabase文档处理系统已经设置完成！用户可以：

- ✅ 上传各种格式的文档
- ✅ 自动解析文档内容
- ✅ 在聊天中使用解析结果
- ✅ 管理自己的文档库
- ✅ 享受快速和安全的文档处理 