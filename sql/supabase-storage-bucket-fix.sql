-- Supabase Storage Bucket 配置修复
-- 解决 docx 和其他文档类型上传失败的问题

-- 1. 更新 documents bucket 的配置，允许所有必要的文件类型
UPDATE storage.buckets 
SET 
  allowed_mime_types = ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'text/markdown',
    'application/json',
    'application/rtf',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/gif',
    'image/bmp',
    'image/webp',
    'image/tiff',
    'image/tif'
  ]
WHERE name = 'documents';

-- 2. 如果 documents bucket 不存在，创建它
INSERT INTO storage.buckets (id, name, owner, created_at, updated_at, public, avif_autodetection, file_size_limit, allowed_mime_types)
SELECT 
  'documents',
  'documents',
  NULL,
  NOW(),
  NOW(),
  false,
  false,
  52428800, -- 50MB in bytes
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'text/markdown',
    'application/json',
    'application/rtf',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/gif',
    'image/bmp',
    'image/webp',
    'image/tiff',
    'image/tif'
  ]
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE name = 'documents'
);

-- 3. 验证配置
SELECT 
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE name = 'documents';

-- 如果你希望允许所有文件类型（最简单但安全性较低的方案），
-- 可以取消注释下面的语句：
/*
UPDATE storage.buckets 
SET allowed_mime_types = NULL 
WHERE name = 'documents';
*/ 