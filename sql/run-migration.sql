-- 🚀 执行数据迁移
-- 使用方法：在 Supabase SQL Editor 中执行以下步骤

-- =====================================
-- 步骤 1：分析现有数据
-- =====================================

-- 查看需要迁移的会话统计
SELECT 
  '📊 需要迁移的会话统计' as info,
  COUNT(*) as total_sessions_with_content,
  COUNT(CASE WHEN generated_content->'codeProject'->'files' IS NOT NULL THEN 1 END) as sessions_with_code_files,
  COUNT(CASE WHEN generated_content->'metadata'->>'migratedToProject' = 'true' THEN 1 END) as already_migrated
FROM chat_sessions 
WHERE generated_content IS NOT NULL 
  AND generated_content != '{}'::jsonb;

-- =====================================
-- 步骤 2：预览将要迁移的会话
-- =====================================

SELECT 
  '🔍 迁移预览' as info,
  id as session_id,
  user_id,
  LEFT(COALESCE(metadata->>'title', '无标题'), 50) as session_title,
  jsonb_array_length(generated_content->'codeProject'->'files') as file_count,
  created_at
FROM chat_sessions 
WHERE generated_content->'codeProject'->'files' IS NOT NULL
  AND (generated_content->'metadata'->>'migratedToProject' IS NULL 
       OR generated_content->'metadata'->>'migratedToProject' != 'true')
ORDER BY created_at DESC;

-- =====================================
-- 步骤 3：执行迁移（取消注释以执行）
-- =====================================

-- 首先确保迁移函数已创建（运行 migrate-sessions-to-projects.sql）

-- 执行批量迁移
SELECT 
  '🔄 迁移结果' as info,
  session_id,
  CASE WHEN success THEN '✅ 成功' ELSE '❌ 失败' END as status,
  project_id,
  files_count,
  COALESCE(error_message, '无错误') as error_message
FROM migrate_all_sessions_to_projects()
ORDER BY success DESC, session_id;

-- =====================================
-- 步骤 4：验证迁移结果
-- =====================================

-- 验证项目表
SELECT 
  '📁 项目表统计' as info,
  COUNT(*) as total_projects,
  SUM(total_files) as total_files,
  COUNT(DISTINCT session_id) as unique_sessions,
  COUNT(CASE WHEN template = 'migration' THEN 1 END) as migrated_projects
FROM projects;

-- 验证会话迁移状态
SELECT 
  '💬 会话迁移状态' as info,
  COUNT(*) as total_sessions_with_code,
  COUNT(CASE WHEN generated_content->'metadata'->>'migratedToProject' = 'true' THEN 1 END) as migrated_sessions,
  COUNT(CASE WHEN generated_content->'metadata'->>'migratedToProject' IS NULL OR generated_content->'metadata'->>'migratedToProject' != 'true' THEN 1 END) as pending_sessions
FROM chat_sessions 
WHERE generated_content->'codeProject'->'files' IS NOT NULL;

-- 验证文件数量匹配
SELECT 
  '🔍 数据一致性检查' as info,
  p.id as project_id,
  p.session_id,
  p.total_files as project_files,
  jsonb_array_length(cs.generated_content->'codeProject'->'files') as session_files,
  CASE 
    WHEN p.total_files = jsonb_array_length(cs.generated_content->'codeProject'->'files') 
    THEN '✅ 一致' 
    ELSE '❌ 不一致' 
  END as consistency_check
FROM projects p
JOIN chat_sessions cs ON p.session_id = cs.id
WHERE p.template = 'migration'
  AND cs.generated_content->'codeProject'->'files' IS NOT NULL
ORDER BY p.created_at DESC;

-- =====================================
-- 步骤 5：查看迁移详情（可选）
-- =====================================

-- 查看迁移的项目详情
SELECT 
  '📋 迁移项目详情' as info,
  p.id as project_id,
  p.name as project_name,
  p.session_id,
  p.total_files,
  p.created_at as migrated_at,
  cs.metadata->>'title' as original_session_title
FROM projects p
JOIN chat_sessions cs ON p.session_id = cs.id
WHERE p.template = 'migration'
ORDER BY p.created_at DESC
LIMIT 10;

-- 查看迁移的文件详情（前10个文件）
SELECT 
  '📄 迁移文件详情' as info,
  pf.filename,
  pf.language,
  pf.file_type,
  pf.file_size,
  p.name as project_name,
  p.session_id
FROM project_files pf
JOIN projects p ON pf.project_id = p.id
WHERE p.template = 'migration'
ORDER BY pf.created_at DESC
LIMIT 10;
