-- =====================================
-- Bolt 快速回滚脚本 (修复版本)
-- 仅包含核心回滚操作，正确处理函数依赖
-- =====================================

-- 删除 Bolt 相关表（级联删除会自动处理依赖）
DROP TABLE IF EXISTS public.bolt_collaboration_sessions CASCADE;
DROP TABLE IF EXISTS public.bolt_git_repositories CASCADE;
DROP TABLE IF EXISTS public.bolt_deployments CASCADE;
DROP TABLE IF EXISTS public.bolt_workbench_snapshots CASCADE;
DROP TABLE IF EXISTS public.bolt_project_files CASCADE;

-- 删除 Bolt 相关视图
DROP VIEW IF EXISTS public.bolt_session_statistics;
DROP VIEW IF EXISTS public.bolt_project_overview;

-- 删除 Bolt 专用函数（不影响现有函数）
DROP FUNCTION IF EXISTS public.get_bolt_session_details(text);
DROP FUNCTION IF EXISTS public.cleanup_bolt_data(integer);
DROP FUNCTION IF EXISTS public.update_bolt_file_updated_at();

-- 注意：不删除 update_updated_at_column() 函数，因为它被其他表使用

-- 删除存储桶
DELETE FROM storage.buckets WHERE id = 'bolt-projects';

-- 删除 chat_sessions 表的 Bolt 字段
ALTER TABLE public.chat_sessions 
  DROP COLUMN IF EXISTS bolt_data,
  DROP COLUMN IF EXISTS bolt_workbench_state,
  DROP COLUMN IF EXISTS bolt_file_tree,
  DROP COLUMN IF EXISTS bolt_last_snapshot_at,
  DROP COLUMN IF EXISTS bolt_preview_url,
  DROP COLUMN IF EXISTS bolt_project_type;

-- 删除 conversation_entries 表的 Bolt 字段
ALTER TABLE public.conversation_entries 
  DROP COLUMN IF EXISTS bolt_artifact_id,
  DROP COLUMN IF EXISTS bolt_action_data,
  DROP COLUMN IF EXISTS bolt_file_changes;

-- 完成
SELECT '✅ Bolt 快速回滚完成 (修复版本)' as status; 