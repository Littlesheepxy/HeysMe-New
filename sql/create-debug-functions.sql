-- 🔍 调试用的数据库函数
-- 用于获取项目和文件的详细统计信息

-- 创建获取项目统计的函数
CREATE OR REPLACE FUNCTION get_projects_with_stats()
RETURNS TABLE (
  project_id TEXT,
  name TEXT,
  session_id TEXT,
  total_files INTEGER,
  total_commits INTEGER,
  created_at TIMESTAMPTZ,
  status TEXT,
  actual_files BIGINT,
  actual_commits BIGINT,
  file_list TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as project_id,
    p.name,
    p.session_id,
    p.total_files,
    p.total_commits,
    p.created_at,
    p.status,
    COUNT(DISTINCT pf.filename) FILTER (WHERE pf.change_type != 'deleted') as actual_files,
    COUNT(DISTINCT pc.id) as actual_commits,
    STRING_AGG(DISTINCT pf.filename, ', ' ORDER BY pf.filename) as file_list
  FROM projects p
  LEFT JOIN project_files pf ON p.id = pf.project_id
  LEFT JOIN project_commits pc ON p.id = pc.project_id
  GROUP BY p.id, p.name, p.session_id, p.total_files, p.total_commits, p.created_at, p.status
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建获取会话项目详情的函数
CREATE OR REPLACE FUNCTION get_session_project_details(session_id_param TEXT)
RETURNS TABLE (
  project_id TEXT,
  project_name TEXT,
  total_files INTEGER,
  total_commits INTEGER,
  actual_files BIGINT,
  file_names TEXT[],
  latest_commit_message TEXT,
  latest_commit_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as project_id,
    p.name as project_name,
    p.total_files,
    p.total_commits,
    COUNT(DISTINCT pf.filename) FILTER (WHERE pf.change_type != 'deleted') as actual_files,
    ARRAY_AGG(DISTINCT pf.filename ORDER BY pf.filename) FILTER (WHERE pf.filename IS NOT NULL) as file_names,
    pc_latest.message as latest_commit_message,
    pc_latest.created_at as latest_commit_at
  FROM projects p
  LEFT JOIN project_files pf ON p.id = pf.project_id
  LEFT JOIN project_commits pc_latest ON p.latest_commit_id = pc_latest.id
  WHERE p.session_id = session_id_param
  GROUP BY p.id, p.name, p.total_files, p.total_commits, pc_latest.message, pc_latest.created_at
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建获取临时会话项目的函数
CREATE OR REPLACE FUNCTION get_temp_session_projects()
RETURNS TABLE (
  project_id TEXT,
  session_id TEXT,
  name TEXT,
  filename TEXT,
  content_length INTEGER,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as project_id,
    p.session_id,
    p.name,
    pf.filename,
    LENGTH(pf.content) as content_length,
    p.created_at
  FROM projects p
  JOIN project_files pf ON p.id = pf.project_id
  WHERE p.session_id LIKE 'temp-session-%'
  ORDER BY p.created_at DESC, pf.filename;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
