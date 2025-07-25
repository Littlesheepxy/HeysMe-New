-- Supabase Storage策略配置
-- 在Supabase Dashboard的SQL编辑器中执行

-- ==================== BUCKET 配置 ====================
-- 注意：如果遇到文件上传失败的MIME类型错误，请先执行 supabase-storage-bucket-fix.sql

-- 1. 删除现有的Storage策略（如果存在）
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can access own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow uploads to documents bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow access to documents bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow delete from documents bucket" ON storage.objects;

-- ==================== 认证用户策略 (推荐用于生产环境) ====================

-- 允许认证用户上传到自己的文件夹
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

-- ==================== 宽松策略 (仅用于开发/测试) ====================
-- 如果上面的认证策略不工作（比如Clerk集成问题），可以临时使用这些策略

/*
-- 允许所有用户上传到documents bucket
CREATE POLICY "Allow uploads to documents bucket" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'documents');

-- 允许所有用户访问documents bucket中的文件
CREATE POLICY "Allow access to documents bucket" ON storage.objects
  FOR SELECT USING (bucket_id = 'documents');

-- 允许所有用户删除documents bucket中的文件
CREATE POLICY "Allow delete from documents bucket" ON storage.objects
  FOR DELETE USING (bucket_id = 'documents');
*/

-- ==================== BUCKET 创建和配置 ====================
-- 支持的文件类型：
-- ✅ PDF文档
-- ✅ Word文档 (doc, docx)
-- ✅ Excel表格 (xls, xlsx) 
-- ✅ PowerPoint演示 (ppt, pptx)
-- ✅ 文本文件 (txt, csv, json, md)
-- ✅ 图片文件 (png, jpg, gif, bmp, webp, tiff) - 用于OCR处理
-- ✅ 其他常用格式 (rtf)

-- 手动创建 bucket 的步骤：
-- 1. 在Supabase Dashboard进入Storage页面
-- 2. 点击 "New bucket"
-- 3. 配置：
--    - Name: documents
--    - Public: false (私有)
--    - File size limit: 50MB
--    - Allowed MIME types: 见 supabase-storage-bucket-fix.sql 或留空允许所有类型
