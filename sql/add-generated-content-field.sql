-- 为chat_sessions表添加generated_content字段
-- 用于存储AI生成的内容，包括代码项目、简历、作品集等

-- 添加generated_content字段
ALTER TABLE public.chat_sessions 
ADD COLUMN IF NOT EXISTS generated_content jsonb DEFAULT '{}';

-- 添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_chat_sessions_generated_content 
ON public.chat_sessions USING gin (generated_content);

-- 添加索引以快速查找有部署URL的会话
-- 使用btree索引查找具体的URL值
CREATE INDEX IF NOT EXISTS idx_chat_sessions_deployment_url 
ON public.chat_sessions USING btree ((generated_content->'codeProject'->'metadata'->>'deploymentUrl'));

-- 可选：如果需要URL模糊搜索，可以添加gin索引用于文本搜索
-- 需要pg_trgm扩展支持
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- CREATE INDEX IF NOT EXISTS idx_chat_sessions_deployment_url_search 
-- ON public.chat_sessions USING gin ((generated_content->'codeProject'->'metadata'->>'deploymentUrl') gin_trgm_ops);

-- 创建函数来查询有预览URL的会话
CREATE OR REPLACE FUNCTION get_sessions_with_deployment_urls(user_id_param text)
RETURNS TABLE(
  session_id text,
  deployment_url text,
  last_deployed_at timestamp with time zone,
  project_name text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cs.id as session_id,
    cs.generated_content->'codeProject'->'metadata'->>'deploymentUrl' as deployment_url,
    (cs.generated_content->'codeProject'->'metadata'->>'lastDeployedAt')::timestamp with time zone as last_deployed_at,
    cs.generated_content->'codeProject'->>'name' as project_name
  FROM public.chat_sessions cs
  WHERE cs.user_id = user_id_param
    AND cs.generated_content->'codeProject'->'metadata'->>'deploymentUrl' IS NOT NULL
    AND cs.generated_content->'codeProject'->'metadata'->>'deploymentUrl' != ''
  ORDER BY last_deployed_at DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建函数来清理过期的预览URL（可选）
CREATE OR REPLACE FUNCTION cleanup_expired_deployment_urls(days_threshold integer DEFAULT 30)
RETURNS integer AS $$
DECLARE
  updated_count integer;
BEGIN
  -- 清理超过指定天数且状态为archived的会话中的部署URL
  UPDATE public.chat_sessions 
  SET generated_content = jsonb_set(
    generated_content,
    '{codeProject,metadata,deploymentUrl}',
    'null'::jsonb
  )
  WHERE status = 'archived'
    AND last_active < (CURRENT_TIMESTAMP - INTERVAL '1 day' * days_threshold)
    AND generated_content->'codeProject'->'metadata'->>'deploymentUrl' IS NOT NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 添加注释
COMMENT ON COLUMN public.chat_sessions.generated_content IS '存储AI生成的内容，包括代码项目、简历、作品集等';
COMMENT ON INDEX idx_chat_sessions_generated_content IS '提高generated_content字段查询性能的GIN索引';
COMMENT ON INDEX idx_chat_sessions_deployment_url IS '快速查找有部署URL的会话';
COMMENT ON FUNCTION get_sessions_with_deployment_urls IS '查询指定用户的所有有部署URL的会话';
COMMENT ON FUNCTION cleanup_expired_deployment_urls IS '清理过期会话中的部署URL以节省存储空间';

-- 数据迁移：将现有metadata中的generatedContent移动到新字段
-- 只在有数据的情况下执行迁移
DO $$ 
DECLARE
  migration_count integer;
BEGIN
  -- 检查是否有需要迁移的数据
  SELECT COUNT(*) INTO migration_count
  FROM public.chat_sessions 
  WHERE metadata->'generatedContent' IS NOT NULL;
  
  IF migration_count > 0 THEN
    RAISE NOTICE '发现 % 条记录需要迁移generatedContent数据', migration_count;
    
    -- 迁移数据：将metadata中的generatedContent移动到新字段
    UPDATE public.chat_sessions 
    SET 
      generated_content = metadata->'generatedContent',
      metadata = metadata - 'generatedContent'
    WHERE metadata->'generatedContent' IS NOT NULL;
    
    RAISE NOTICE '已完成 % 条记录的generatedContent数据迁移', migration_count;
  ELSE
    RAISE NOTICE '没有发现需要迁移的generatedContent数据';
  END IF;
END $$;
