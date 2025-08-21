-- 🔄 数据迁移SQL脚本
-- 将现有 chat_sessions 中的 generated_content 迁移到项目表

-- =====================================
-- 第一步：分析现有数据
-- =====================================

-- 查看需要迁移的会话统计
SELECT 
  '需要迁移的会话统计' as analysis_type,
  COUNT(*) as total_sessions_with_content,
  COUNT(CASE WHEN generated_content->'codeProject'->'files' IS NOT NULL THEN 1 END) as sessions_with_code_files,
  COUNT(CASE WHEN generated_content->'metadata'->>'migratedToProject' = 'true' THEN 1 END) as already_migrated
FROM chat_sessions 
WHERE generated_content IS NOT NULL 
  AND generated_content != '{}'::jsonb;

-- 查看具体的会话详情
SELECT 
  id as session_id,
  user_id,
  metadata->>'title' as session_title,
  jsonb_array_length(generated_content->'codeProject'->'files') as file_count,
  generated_content->'metadata'->>'migratedToProject' as is_migrated,
  created_at
FROM chat_sessions 
WHERE generated_content->'codeProject'->'files' IS NOT NULL
  AND (generated_content->'metadata'->>'migratedToProject' IS NULL 
       OR generated_content->'metadata'->>'migratedToProject' != 'true')
ORDER BY created_at DESC;

-- =====================================
-- 第二步：创建迁移函数
-- =====================================

-- 创建迁移单个会话的函数
CREATE OR REPLACE FUNCTION migrate_session_to_project(
  session_id_param TEXT,
  user_id_param TEXT DEFAULT NULL
) RETURNS TABLE(
  success BOOLEAN,
  project_id TEXT,
  commit_id TEXT,
  files_count INTEGER,
  error_message TEXT
) AS $$
DECLARE
  session_record RECORD;
  project_id_var TEXT;
  commit_id_var TEXT;
  files_data JSONB;
  file_record JSONB;
  files_count_var INTEGER := 0;
  project_name_var TEXT;
BEGIN
  -- 获取会话数据
  SELECT * INTO session_record 
  FROM chat_sessions 
  WHERE id = session_id_param;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::TEXT, NULL::TEXT, 0, 'Session not found';
    RETURN;
  END IF;
  
  -- 检查是否有代码文件
  files_data := session_record.generated_content->'codeProject'->'files';
  IF files_data IS NULL THEN
    RETURN QUERY SELECT FALSE, NULL::TEXT, NULL::TEXT, 0, 'No code files found';
    RETURN;
  END IF;
  
  files_count_var := jsonb_array_length(files_data);
  
  -- 检查是否已经迁移
  IF session_record.generated_content->'metadata'->>'migratedToProject' = 'true' THEN
    RETURN QUERY SELECT FALSE, NULL::TEXT, NULL::TEXT, files_count_var, 'Already migrated';
    RETURN;
  END IF;
  
  -- 使用传入的user_id或会话中的user_id
  IF user_id_param IS NULL THEN
    user_id_param := session_record.user_id;
  END IF;
  
  IF user_id_param IS NULL THEN
    RETURN QUERY SELECT FALSE, NULL::TEXT, NULL::TEXT, files_count_var, 'No user_id available';
    RETURN;
  END IF;
  
  -- 生成项目名称
  project_name_var := COALESCE(
    session_record.metadata->>'title',
    '迁移项目_' || RIGHT(session_id_param, 8)
  );
  project_name_var := LEFT(project_name_var, 50); -- 限制长度
  
  -- 生成项目ID和提交ID
  project_id_var := 'proj_' || EXTRACT(EPOCH FROM NOW())::BIGINT || '_' || 
                    SUBSTRING(MD5(session_id_param), 1, 8);
  commit_id_var := 'commit_' || EXTRACT(EPOCH FROM NOW())::BIGINT || '_' || 
                   SUBSTRING(MD5(session_id_param || 'commit'), 1, 8);
  
  -- 创建项目记录
  INSERT INTO projects (
    id,
    user_id,
    session_id,
    name,
    description,
    framework,
    template,
    status,
    total_files,
    total_commits,
    created_at,
    updated_at
  ) VALUES (
    project_id_var,
    user_id_param,
    session_id_param,
    project_name_var,
    '从会话 ' || session_id_param || ' 自动迁移的项目',
    'next.js',
    'migration',
    'active',
    files_count_var,
    1,
    NOW(),
    NOW()
  );
  
  -- 创建提交记录
  INSERT INTO project_commits (
    id,
    project_id,
    user_id,
    message,
    type,
    ai_agent,
    user_prompt,
    files_added,
    files_modified,
    files_deleted,
    created_at
  ) VALUES (
    commit_id_var,
    project_id_var,
    user_id_param,
    '🎉 Initial commit - 从会话迁移',
    'initial',
    'MigrationScript',
    '数据迁移',
    files_count_var,
    0,
    0,
    NOW()
  );
  
  -- 创建文件记录
  FOR file_record IN SELECT * FROM jsonb_array_elements(files_data)
  LOOP
    INSERT INTO project_files (
      id,
      project_id,
      commit_id,
      filename,
      content,
      content_hash,
      file_size,
      language,
      file_type,
      change_type,
      description,
      created_at
    ) VALUES (
      'file_' || EXTRACT(EPOCH FROM NOW())::BIGINT || '_' || 
      SUBSTRING(MD5(file_record->>'filename'), 1, 8),
      project_id_var,
      commit_id_var,
      file_record->>'filename',
      file_record->>'content',
      MD5(file_record->>'content'),
      LENGTH(file_record->>'content'),
      COALESCE(file_record->>'language', 
               CASE 
                 WHEN file_record->>'filename' LIKE '%.tsx' THEN 'typescript'
                 WHEN file_record->>'filename' LIKE '%.ts' THEN 'typescript'
                 WHEN file_record->>'filename' LIKE '%.jsx' THEN 'javascript'
                 WHEN file_record->>'filename' LIKE '%.js' THEN 'javascript'
                 WHEN file_record->>'filename' LIKE '%.json' THEN 'json'
                 WHEN file_record->>'filename' LIKE '%.css' THEN 'css'
                 WHEN file_record->>'filename' LIKE '%.html' THEN 'html'
                 WHEN file_record->>'filename' LIKE '%.md' THEN 'markdown'
                 ELSE 'text'
               END),
      CASE 
        WHEN file_record->>'filename' LIKE '%/pages/%' OR 
             (file_record->>'filename' LIKE '%/app/%' AND file_record->>'filename' LIKE '%page.tsx') 
        THEN 'page'
        WHEN file_record->>'filename' LIKE '%/components/%' THEN 'component'
        WHEN file_record->>'filename' LIKE '%.config.%' OR 
             file_record->>'filename' = 'package.json' OR 
             file_record->>'filename' LIKE '%.json' 
        THEN 'config'
        WHEN file_record->>'filename' LIKE '%.css' OR 
             file_record->>'filename' LIKE '%.scss' OR 
             file_record->>'filename' LIKE '%.module.%' 
        THEN 'styles'
        ELSE 'data'
      END,
      'added',
      COALESCE(file_record->>'description', '从会话迁移的文件'),
      NOW()
    );
  END LOOP;
  
  -- 更新会话，标记已迁移
  UPDATE chat_sessions 
  SET 
    generated_content = jsonb_set(
      generated_content,
      '{metadata}',
      COALESCE(generated_content->'metadata', '{}'::jsonb) || jsonb_build_object(
        'migratedToProject', true,
        'projectId', project_id_var,
        'commitId', commit_id_var,
        'migratedAt', NOW()::TEXT
      )
    ),
    updated_at = NOW()
  WHERE id = session_id_param;
  
  RETURN QUERY SELECT TRUE, project_id_var, commit_id_var, files_count_var, NULL::TEXT;
  
EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT FALSE, NULL::TEXT, NULL::TEXT, files_count_var, SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- =====================================
-- 第三步：批量迁移函数
-- =====================================

-- 创建批量迁移函数
CREATE OR REPLACE FUNCTION migrate_all_sessions_to_projects()
RETURNS TABLE(
  session_id TEXT,
  success BOOLEAN,
  project_id TEXT,
  files_count INTEGER,
  error_message TEXT
) AS $$
DECLARE
  session_record RECORD;
  migration_result RECORD;
BEGIN
  -- 遍历所有需要迁移的会话
  FOR session_record IN 
    SELECT id, user_id
    FROM chat_sessions 
    WHERE generated_content->'codeProject'->'files' IS NOT NULL
      AND (generated_content->'metadata'->>'migratedToProject' IS NULL 
           OR generated_content->'metadata'->>'migratedToProject' != 'true')
    ORDER BY created_at DESC
  LOOP
    -- 迁移单个会话
    SELECT * INTO migration_result 
    FROM migrate_session_to_project(session_record.id, session_record.user_id);
    
    RETURN QUERY SELECT 
      session_record.id,
      migration_result.success,
      migration_result.project_id,
      migration_result.files_count,
      migration_result.error_message;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================
-- 第四步：执行迁移（注释掉，需要手动执行）
-- =====================================

-- 预览迁移（查看将要迁移的会话）
/*
SELECT 
  '=== 迁移预览 ===' as info,
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
*/

-- 执行批量迁移（取消注释以执行）
/*
SELECT 
  '=== 迁移结果 ===' as info,
  session_id,
  CASE WHEN success THEN '✅ 成功' ELSE '❌ 失败' END as status,
  project_id,
  files_count,
  error_message
FROM migrate_all_sessions_to_projects()
ORDER BY success DESC, session_id;
*/

-- 迁移后验证
/*
SELECT 
  '=== 迁移验证 ===' as info,
  COUNT(*) as total_projects,
  SUM(total_files) as total_files,
  COUNT(DISTINCT session_id) as unique_sessions
FROM projects 
WHERE template = 'migration';

SELECT 
  '=== 会话迁移状态 ===' as info,
  COUNT(*) as total_sessions_with_code,
  COUNT(CASE WHEN generated_content->'metadata'->>'migratedToProject' = 'true' THEN 1 END) as migrated_sessions,
  COUNT(CASE WHEN generated_content->'metadata'->>'migratedToProject' IS NULL OR generated_content->'metadata'->>'migratedToProject' != 'true' THEN 1 END) as pending_sessions
FROM chat_sessions 
WHERE generated_content->'codeProject'->'files' IS NOT NULL;
*/

-- =====================================
-- 第五步：清理函数（可选）
-- =====================================

-- 删除迁移函数（迁移完成后可选执行）
/*
DROP FUNCTION IF EXISTS migrate_session_to_project(TEXT, TEXT);
DROP FUNCTION IF EXISTS migrate_all_sessions_to_projects();
*/
