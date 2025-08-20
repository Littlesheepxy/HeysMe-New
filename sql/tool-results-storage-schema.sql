-- 🔧 工具调用结果存储表
-- 用于缓存和持久化 Agent 工具调用的结果

-- 1. 工具结果存储主表
CREATE TABLE IF NOT EXISTS public.tool_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- 关联信息
  user_id TEXT NOT NULL, -- Clerk 用户ID
  session_id TEXT, -- 关联的聊天会话ID
  agent_name TEXT NOT NULL, -- 调用的 Agent 名称
  
  -- 工具信息
  tool_name TEXT NOT NULL, -- 工具名称 (analyze_github, scrape_webpage, extract_linkedin)
  source_url TEXT NOT NULL, -- 原始链接
  url_hash TEXT NOT NULL, -- URL 哈希值，用于去重和快速查找
  
  -- 结果数据
  tool_output JSONB NOT NULL, -- 工具的原始输出
  processed_data JSONB, -- 处理后的结构化数据
  metadata JSONB DEFAULT '{}', -- 元数据 (响应时间、状态等)
  
  -- 状态信息
  status TEXT DEFAULT 'success' CHECK (status IN ('success', 'failed', 'partial')),
  error_message TEXT, -- 如果失败，记录错误信息
  
  -- 缓存控制
  cache_expires_at TIMESTAMPTZ, -- 缓存过期时间
  is_cacheable BOOLEAN DEFAULT true, -- 是否可缓存
  
  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 索引约束
  UNIQUE(url_hash, tool_name), -- 同一URL同一工具只存储一次
  
  -- 外键约束
  CONSTRAINT fk_tool_results_session 
    FOREIGN KEY (session_id) 
    REFERENCES public.chat_sessions(id) 
    ON DELETE SET NULL
);

-- 2. 工具结果使用记录表 (用于统计和分析)
CREATE TABLE IF NOT EXISTS public.tool_result_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  tool_result_id UUID NOT NULL REFERENCES public.tool_results(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  session_id TEXT,
  
  -- 使用信息
  used_at TIMESTAMPTZ DEFAULT NOW(),
  usage_context TEXT, -- 使用场景 (initial_collection, supplementary_analysis, etc.)
  
  -- 性能指标
  cache_hit BOOLEAN DEFAULT false, -- 是否命中缓存
  response_time_ms INTEGER, -- 响应时间
  
  CONSTRAINT fk_usage_session 
    FOREIGN KEY (session_id) 
    REFERENCES public.chat_sessions(id) 
    ON DELETE SET NULL
);

-- 3. 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_tool_results_url_hash ON public.tool_results(url_hash);
CREATE INDEX IF NOT EXISTS idx_tool_results_user_id ON public.tool_results(user_id);
CREATE INDEX IF NOT EXISTS idx_tool_results_created_at ON public.tool_results(created_at);
CREATE INDEX IF NOT EXISTS idx_tool_results_cache_expires ON public.tool_results(cache_expires_at) WHERE cache_expires_at IS NOT NULL;

-- 4. 创建自动更新时间戳的触发器
CREATE OR REPLACE FUNCTION update_tool_results_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_tool_results_updated_at
  BEFORE UPDATE ON public.tool_results
  FOR EACH ROW
  EXECUTE FUNCTION update_tool_results_updated_at();

-- 5. 创建清理过期缓存的函数
CREATE OR REPLACE FUNCTION cleanup_expired_tool_results()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.tool_results 
  WHERE cache_expires_at IS NOT NULL 
    AND cache_expires_at < NOW()
    AND is_cacheable = true;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 6. 创建获取缓存结果的函数
CREATE OR REPLACE FUNCTION get_cached_tool_result(
  p_url_hash TEXT,
  p_tool_name TEXT,
  p_user_id TEXT DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  tool_output JSONB,
  processed_data JSONB,
  created_at TIMESTAMPTZ,
  is_expired BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tr.id,
    tr.tool_output,
    tr.processed_data,
    tr.created_at,
    (tr.cache_expires_at IS NOT NULL AND tr.cache_expires_at < NOW()) as is_expired
  FROM public.tool_results tr
  WHERE tr.url_hash = p_url_hash
    AND tr.tool_name = p_tool_name
    AND tr.status = 'success'
    AND (p_user_id IS NULL OR tr.user_id = p_user_id)
    AND (tr.cache_expires_at IS NULL OR tr.cache_expires_at > NOW())
  ORDER BY tr.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- 7. 创建RLS策略确保数据安全
ALTER TABLE public.tool_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_result_usage ENABLE ROW LEVEL SECURITY;

-- 用户只能访问自己的工具结果
CREATE POLICY "Users can access their own tool results" ON public.tool_results
  FOR ALL USING (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can access their own usage records" ON public.tool_result_usage
  FOR ALL USING (user_id = current_setting('app.current_user_id', true));

-- 8. 创建统计视图
CREATE OR REPLACE VIEW public.tool_results_stats AS
SELECT 
  tool_name,
  COUNT(*) as total_calls,
  COUNT(*) FILTER (WHERE status = 'success') as successful_calls,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_calls,
  AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_processing_time,
  COUNT(DISTINCT user_id) as unique_users,
  DATE_TRUNC('day', created_at) as call_date
FROM public.tool_results
GROUP BY tool_name, DATE_TRUNC('day', created_at)
ORDER BY call_date DESC, tool_name;

-- 9. 创建缓存命中率统计
CREATE OR REPLACE VIEW public.cache_hit_stats AS
SELECT 
  DATE_TRUNC('day', used_at) as usage_date,
  COUNT(*) as total_usage,
  COUNT(*) FILTER (WHERE cache_hit = true) as cache_hits,
  ROUND(
    (COUNT(*) FILTER (WHERE cache_hit = true)::DECIMAL / COUNT(*)) * 100, 
    2
  ) as cache_hit_rate_percent
FROM public.tool_result_usage
GROUP BY DATE_TRUNC('day', used_at)
ORDER BY usage_date DESC;
