-- 补充：对话会话与页面的关联关系

-- 1. 给 pages 表添加 session_id 字段
ALTER TABLE public.pages 
ADD COLUMN IF NOT EXISTS session_id text REFERENCES public.chat_sessions(id) ON DELETE SET NULL;

-- 2. 创建索引
CREATE INDEX IF NOT EXISTS idx_pages_session_id ON public.pages(session_id);

-- 3. 创建视图：工作台页面（从对话生成的页面）
CREATE OR REPLACE VIEW public.workspace_pages AS
SELECT 
  p.*,
  cs.user_intent,
  cs.created_at as session_created_at,
  cs.status as session_status,
  CASE 
    WHEN p.visibility = 'public' THEN CONCAT('/p/', p.slug)
    ELSE NULL
  END as page_url,
  ps.short_code,
  CASE 
    WHEN ps.short_code IS NOT NULL THEN CONCAT('/r/', ps.short_code)
    ELSE NULL  
  END as share_url
FROM public.pages p
LEFT JOIN public.chat_sessions cs ON p.session_id = cs.id
LEFT JOIN public.page_shares ps ON p.id = ps.page_id
WHERE p.session_id IS NOT NULL  -- 只显示从对话生成的页面
ORDER BY p.created_at DESC;

-- 4. 创建视图：对话记录（用于侧边栏显示）
CREATE OR REPLACE VIEW public.sidebar_sessions AS
SELECT 
  cs.id,
  cs.user_id,
  cs.status,
  cs.user_intent,
  cs.created_at,
  cs.last_active,
  -- 最后一条消息预览
  (
    SELECT ce.content 
    FROM public.conversation_entries ce 
    WHERE ce.session_id = cs.id 
    ORDER BY ce.timestamp DESC 
    LIMIT 1
  ) as last_message,
  -- 消息总数
  (
    SELECT COUNT(*) 
    FROM public.conversation_entries ce 
    WHERE ce.session_id = cs.id
  ) as message_count,
  -- 是否生成了页面
  (
    SELECT COUNT(*) > 0 
    FROM public.pages p 
    WHERE p.session_id = cs.id
  ) as has_generated_page,
  -- 生成的页面信息
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', p.id,
        'title', p.title,
        'slug', p.slug,
        'visibility', p.visibility
      )
    )
    FROM public.pages p 
    WHERE p.session_id = cs.id
  ) as generated_pages
FROM public.chat_sessions cs
ORDER BY cs.last_active DESC;

-- 5. 创建函数：获取工作台数据
CREATE OR REPLACE FUNCTION get_workspace_data(user_id_param text)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'pages', COALESCE(
      jsonb_agg(
        to_jsonb(wp.*) 
        ORDER BY wp.created_at DESC
      ) FILTER (WHERE wp.id IS NOT NULL), 
      '[]'::jsonb
    ),
    'total_pages', COUNT(wp.id),
    'public_pages', COUNT(CASE WHEN wp.visibility = 'public' THEN 1 END),
    'shared_pages', COUNT(CASE WHEN wp.short_code IS NOT NULL THEN 1 END)
  ) INTO result
  FROM public.workspace_pages wp
  WHERE wp.user_id = user_id_param;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. 创建函数：获取侧边栏数据
CREATE OR REPLACE FUNCTION get_sidebar_sessions(user_id_param text, limit_param integer DEFAULT 20)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'sessions', COALESCE(
      jsonb_agg(
        to_jsonb(ss.*) 
        ORDER BY ss.last_active DESC
      ) FILTER (WHERE ss.id IS NOT NULL), 
      '[]'::jsonb
    ),
    'total_sessions', COUNT(ss.id),
    'active_sessions', COUNT(CASE WHEN ss.status = 'active' THEN 1 END),
    'sessions_with_pages', COUNT(CASE WHEN ss.has_generated_page THEN 1 END)
  ) INTO result
  FROM public.sidebar_sessions ss
  WHERE ss.user_id = user_id_param
  LIMIT limit_param;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 