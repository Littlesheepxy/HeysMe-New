-- 修复 create_commit 函数
-- 问题：UPDATE 语句中的列名与函数变量名冲突
-- 解决：重命名函数内部变量，避免与表列名冲突

DROP FUNCTION IF EXISTS create_commit(TEXT, TEXT, TEXT, jsonb, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION create_commit(
  project_id_param TEXT,
  user_id_param TEXT,
  message_param TEXT,
  files_param jsonb,
  commit_type_param TEXT DEFAULT 'manual',
  ai_agent_param TEXT DEFAULT NULL,
  user_prompt_param TEXT DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
  commit_id TEXT;
  file_record jsonb;
  new_file_id TEXT;
  var_files_added INTEGER := 0;
  var_files_modified INTEGER := 0;
  var_files_deleted INTEGER := 0;
  current_hash TEXT;
BEGIN
  -- 生成提交ID
  commit_id := 'commit_' || extract(epoch from now())::text || '_' || substr(md5(random()::text), 1, 8);
  
  -- 创建提交记录
  INSERT INTO public.project_commits (
    id, project_id, user_id, message, type, ai_agent, user_prompt, created_at
  ) VALUES (
    commit_id, project_id_param, user_id_param, message_param, 
    commit_type_param, ai_agent_param, user_prompt_param, NOW()
  );
  
  -- 处理文件变更
  FOR file_record IN SELECT * FROM jsonb_array_elements(files_param) LOOP
    -- 生成文件ID和内容哈希
    new_file_id := 'file_' || extract(epoch from now())::text || '_' || substr(md5(random()::text), 1, 8);
    current_hash := encode(sha256((file_record->>'content')::bytea), 'hex');
    
    -- 插入文件记录
    INSERT INTO public.project_files (
      id, project_id, commit_id, filename, file_type, language,
      content, content_hash, file_size, change_type, line_count, created_at
    ) VALUES (
      new_file_id,
      project_id_param,
      commit_id,
      file_record->>'filename',
      COALESCE(file_record->>'file_type', 'component'),
      COALESCE(file_record->>'language', 'typescript'),
      file_record->>'content',
      current_hash,
      length(file_record->>'content'),
      COALESCE(file_record->>'change_type', 'added'),
      array_length(string_to_array(file_record->>'content', E'\n'), 1),
      NOW()
    );
    
    -- 统计变更
    CASE file_record->>'change_type'
      WHEN 'added' THEN var_files_added := var_files_added + 1;
      WHEN 'modified' THEN var_files_modified := var_files_modified + 1;
      WHEN 'deleted' THEN var_files_deleted := var_files_deleted + 1;
    END CASE;
  END LOOP;
  
  -- 更新提交统计 (使用重命名的局部变量)
  UPDATE public.project_commits 
  SET files_added = var_files_added,
      files_modified = var_files_modified,
      files_deleted = var_files_deleted
  WHERE id = commit_id;
  
  RETURN commit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 验证函数创建
SELECT 'create_commit function recreated successfully' as status;
