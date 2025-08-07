-- =====================================
-- Bolt 数据库集成回滚脚本
-- 执行时间: 2025-01-27
-- 版本: 1.0.0 (完整回滚)
-- 说明: 撤销所有 Bolt 相关的数据库更改
-- =====================================

-- 开始事务
BEGIN;

-- =====================================
-- 1. 删除触发器
-- =====================================

-- 删除 bolt_project_files 触发器
DROP TRIGGER IF EXISTS trigger_update_bolt_file_updated_at ON public.bolt_project_files;

-- 删除 bolt_git_repositories 触发器
DROP TRIGGER IF EXISTS trigger_update_bolt_git_updated_at ON public.bolt_git_repositories;

-- =====================================
-- 2. 删除函数
-- =====================================

-- 删除 Bolt 相关函数
DROP FUNCTION IF EXISTS public.get_bolt_session_details(text);
DROP FUNCTION IF EXISTS public.cleanup_bolt_data(integer);
DROP FUNCTION IF EXISTS public.update_bolt_file_updated_at();
DROP FUNCTION IF EXISTS public.update_updated_at_column();

-- =====================================
-- 3. 删除视图
-- =====================================

-- 删除 Bolt 相关视图
DROP VIEW IF EXISTS public.bolt_session_statistics;
DROP VIEW IF EXISTS public.bolt_project_overview;

-- =====================================
-- 4. 删除 Storage 策略
-- =====================================

-- 删除 Bolt 项目存储桶策略
DO $$ 
BEGIN 
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage' 
    AND policyname = '用户只能访问自己的Bolt项目文件'
  ) THEN
    DROP POLICY "用户只能访问自己的Bolt项目文件" ON storage.objects;
  END IF;
END $$;

-- =====================================
-- 5. 删除 Storage 桶
-- =====================================

-- 删除 Bolt 项目存储桶
DELETE FROM storage.buckets WHERE id = 'bolt-projects';

-- =====================================
-- 6. 删除 RLS 策略
-- =====================================

-- 删除 bolt_project_files RLS 策略
DO $$ 
BEGIN 
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'bolt_project_files' 
    AND policyname = '用户只能访问自己的Bolt项目文件'
  ) THEN
    DROP POLICY "用户只能访问自己的Bolt项目文件" ON public.bolt_project_files;
  END IF;
END $$;

-- 删除 bolt_workbench_snapshots RLS 策略
DO $$ 
BEGIN 
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'bolt_workbench_snapshots' 
    AND policyname = '用户只能访问自己的工作台快照'
  ) THEN
    DROP POLICY "用户只能访问自己的工作台快照" ON public.bolt_workbench_snapshots;
  END IF;
END $$;

-- 删除 bolt_deployments RLS 策略
DO $$ 
BEGIN 
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'bolt_deployments' 
    AND policyname = '用户只能访问自己的部署记录'
  ) THEN
    DROP POLICY "用户只能访问自己的部署记录" ON public.bolt_deployments;
  END IF;
END $$;

-- 删除 bolt_git_repositories RLS 策略
DO $$ 
BEGIN 
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'bolt_git_repositories' 
    AND policyname = '用户只能访问自己的Git仓库'
  ) THEN
    DROP POLICY "用户只能访问自己的Git仓库" ON public.bolt_git_repositories;
  END IF;
END $$;

-- 删除 bolt_collaboration_sessions RLS 策略
DO $$ 
BEGIN 
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'bolt_collaboration_sessions' 
    AND policyname = '用户只能访问自己创建或参与的协作会话'
  ) THEN
    DROP POLICY "用户只能访问自己创建或参与的协作会话" ON public.bolt_collaboration_sessions;
  END IF;
END $$;

-- =====================================
-- 7. 删除新创建的表（按依赖关系顺序）
-- =====================================

-- 删除协作会话表
DROP TABLE IF EXISTS public.bolt_collaboration_sessions CASCADE;

-- 删除Git仓库表
DROP TABLE IF EXISTS public.bolt_git_repositories CASCADE;

-- 删除部署记录表
DROP TABLE IF EXISTS public.bolt_deployments CASCADE;

-- 删除工作台快照表
DROP TABLE IF EXISTS public.bolt_workbench_snapshots CASCADE;

-- 删除项目文件表
DROP TABLE IF EXISTS public.bolt_project_files CASCADE;

-- =====================================
-- 8. 删除扩展的表字段
-- =====================================

-- 恢复 chat_sessions 表（删除 Bolt 专用字段）
DO $$ 
BEGIN
  -- 删除 bolt_data 字段
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chat_sessions' 
    AND column_name = 'bolt_data'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.chat_sessions DROP COLUMN bolt_data;
  END IF;

  -- 删除 bolt_workbench_state 字段
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chat_sessions' 
    AND column_name = 'bolt_workbench_state'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.chat_sessions DROP COLUMN bolt_workbench_state;
  END IF;

  -- 删除 bolt_file_tree 字段
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chat_sessions' 
    AND column_name = 'bolt_file_tree'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.chat_sessions DROP COLUMN bolt_file_tree;
  END IF;

  -- 删除 bolt_last_snapshot_at 字段
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chat_sessions' 
    AND column_name = 'bolt_last_snapshot_at'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.chat_sessions DROP COLUMN bolt_last_snapshot_at;
  END IF;

  -- 删除 bolt_preview_url 字段
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chat_sessions' 
    AND column_name = 'bolt_preview_url'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.chat_sessions DROP COLUMN bolt_preview_url;
  END IF;

  -- 删除 bolt_project_type 字段
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chat_sessions' 
    AND column_name = 'bolt_project_type'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.chat_sessions DROP COLUMN bolt_project_type;
  END IF;
END $$;

-- 恢复 conversation_entries 表（删除 Bolt 消息相关字段）
DO $$ 
BEGIN
  -- 删除 bolt_artifact_id 字段
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'conversation_entries' 
    AND column_name = 'bolt_artifact_id'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.conversation_entries DROP COLUMN bolt_artifact_id;
  END IF;

  -- 删除 bolt_action_data 字段
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'conversation_entries' 
    AND column_name = 'bolt_action_data'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.conversation_entries DROP COLUMN bolt_action_data;
  END IF;

  -- 删除 bolt_file_changes 字段
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'conversation_entries' 
    AND column_name = 'bolt_file_changes'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.conversation_entries DROP COLUMN bolt_file_changes;
  END IF;
END $$;

-- =====================================
-- 9. 清理数据备份（可选）
-- =====================================

-- 注意：如果你需要保留原始数据，请在执行回滚前备份相关数据
-- 以下操作会清理在迁移过程中修改的现有数据

-- 清理 chat_sessions 中的 Bolt 相关数据（如果有其他字段被修改）
-- 这里我们不执行，因为原始脚本只是设置了默认值，没有修改现有重要数据

-- =====================================
-- 10. 验证回滚
-- =====================================

DO $$
DECLARE
  table_count integer;
  column_count integer;
  bucket_count integer;
BEGIN
  -- 检查 Bolt 表是否已删除
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN (
    'bolt_project_files',
    'bolt_workbench_snapshots', 
    'bolt_deployments',
    'bolt_git_repositories',
    'bolt_collaboration_sessions'
  );
  
  IF table_count > 0 THEN
    RAISE EXCEPTION '❌ 部分 Bolt 表未成功删除，剩余: % 个表', table_count;
  END IF;
  
  -- 检查 Bolt 字段是否已删除
  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns 
  WHERE table_schema = 'public'
  AND (
    (table_name = 'chat_sessions' AND column_name LIKE 'bolt_%') OR
    (table_name = 'conversation_entries' AND column_name LIKE 'bolt_%')
  );
  
  IF column_count > 0 THEN
    RAISE EXCEPTION '❌ 部分 Bolt 字段未成功删除，剩余: % 个字段', column_count;
  END IF;
  
  -- 检查存储桶是否已删除
  SELECT COUNT(*) INTO bucket_count
  FROM storage.buckets 
  WHERE id = 'bolt-projects';
  
  IF bucket_count > 0 THEN
    RAISE EXCEPTION '❌ bolt-projects 存储桶未成功删除';
  END IF;
  
  RAISE NOTICE '✅ Bolt 数据库集成回滚完成！';
  RAISE NOTICE '🗑️ 已删除表: bolt_project_files, bolt_workbench_snapshots, bolt_deployments, bolt_git_repositories, bolt_collaboration_sessions';
  RAISE NOTICE '🗑️ 已删除存储桶: bolt-projects';
  RAISE NOTICE '🗑️ 已删除视图: bolt_session_statistics, bolt_project_overview';
  RAISE NOTICE '🗑️ 已删除函数: get_bolt_session_details(), cleanup_bolt_data()';
  RAISE NOTICE '🗑️ 已删除所有 Bolt 相关字段和策略';
  RAISE NOTICE '📊 数据库已恢复到 Bolt 集成之前的状态';
END $$;

-- 提交事务
COMMIT;

-- =====================================
-- 回滚完成提示
-- =====================================

-- 执行完成后的说明
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '==========================================';
  RAISE NOTICE '🎯 Bolt 数据库集成回滚脚本执行完成';
  RAISE NOTICE '==========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📋 已完成的回滚操作:';
  RAISE NOTICE '   ✅ 删除了 5 个 Bolt 专用表';
  RAISE NOTICE '   ✅ 删除了 chat_sessions 表的 6 个 Bolt 字段';
  RAISE NOTICE '   ✅ 删除了 conversation_entries 表的 3 个 Bolt 字段';
  RAISE NOTICE '   ✅ 删除了所有 Bolt 相关的索引';
  RAISE NOTICE '   ✅ 删除了所有 Bolt 相关的 RLS 策略';
  RAISE NOTICE '   ✅ 删除了 bolt-projects 存储桶';
  RAISE NOTICE '   ✅ 删除了 2 个 Bolt 视图';
  RAISE NOTICE '   ✅ 删除了 4 个 Bolt 函数';
  RAISE NOTICE '   ✅ 删除了 2 个 Bolt 触发器';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  注意事项:';
  RAISE NOTICE '   - 所有 Bolt 相关数据已被永久删除';
  RAISE NOTICE '   - 如需重新集成 Bolt，请重新运行迁移脚本';
  RAISE NOTICE '   - 建议在生产环境执行前先在测试环境验证';
  RAISE NOTICE '';
  RAISE NOTICE '🔄 如需重新集成 Bolt，请执行原始迁移脚本';
  RAISE NOTICE '==========================================';
END $$; 