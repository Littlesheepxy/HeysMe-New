-- 🔧 增强版工具调用结果存储表
-- 支持视频、图文、设计、编程等多种平台类型

-- 1. 工具结果存储主表 (增强版)
CREATE TABLE IF NOT EXISTS public.tool_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- 关联信息
  user_id TEXT NOT NULL, -- Clerk 用户ID
  session_id TEXT, -- 关联的聊天会话ID
  agent_name TEXT NOT NULL, -- 调用的 Agent 名称
  
  -- 工具信息 (扩展支持更多平台)
  tool_name TEXT NOT NULL CHECK (tool_name IN (
    -- 代码平台
    'analyze_github', 'analyze_gitlab', 'analyze_codepen', 'analyze_replit',
    -- 设计平台  
    'analyze_behance', 'analyze_dribbble', 'analyze_figma', 'analyze_pinterest',
    -- 视频平台
    'analyze_youtube', 'analyze_bilibili', 'analyze_vimeo', 'analyze_tiktok',
    -- 社交平台
    'extract_linkedin', 'analyze_instagram', 'analyze_twitter', 'analyze_weibo',
    -- 开发部署平台
    'analyze_vercel', 'analyze_netlify', 'analyze_bolt', 'analyze_youware',
    -- 内容平台
    'analyze_xiaohongshu', 'analyze_medium', 'analyze_substack',
    -- 通用工具
    'scrape_webpage', 'parse_document', 'analyze_pdf', 'extract_video_info'
  )),
  
  platform_type TEXT NOT NULL CHECK (platform_type IN (
    'code_repository', 'design_portfolio', 'video_platform', 'social_media',
    'deployment_platform', 'content_platform', 'document', 'webpage', 'other'
  )),
  
  content_type TEXT NOT NULL CHECK (content_type IN (
    'profile', 'project', 'video', 'image', 'article', 'code', 'design', 
    'portfolio', 'social_post', 'document', 'webpage', 'mixed'
  )),
  
  source_url TEXT NOT NULL, -- 原始链接
  url_hash TEXT NOT NULL, -- URL 哈希值，用于去重和快速查找
  
  -- 结果数据 (结构化存储)
  tool_output JSONB NOT NULL, -- 工具的原始输出
  processed_data JSONB, -- 处理后的结构化数据
  
  -- 多媒体内容支持
  media_info JSONB DEFAULT '{}', -- 媒体文件信息 (视频、图片、音频)
  thumbnails JSONB DEFAULT '[]', -- 缩略图URLs
  preview_images JSONB DEFAULT '[]', -- 预览图片
  
  -- 内容分析结果
  content_analysis JSONB DEFAULT '{}', -- AI分析的内容摘要、标签、情感等
  technical_stack JSONB DEFAULT '[]', -- 技术栈信息 (适用于代码项目)
  design_elements JSONB DEFAULT '{}', -- 设计元素分析 (适用于设计作品)
  
  -- 元数据扩展
  metadata JSONB DEFAULT '{}', -- 基础元数据
  platform_metadata JSONB DEFAULT '{}', -- 平台特定元数据
  
  -- 状态信息
  status TEXT DEFAULT 'success' CHECK (status IN ('success', 'failed', 'partial', 'processing')),
  error_message TEXT,
  processing_notes TEXT, -- 处理过程中的注意事项
  
  -- 缓存控制
  cache_expires_at TIMESTAMPTZ,
  is_cacheable BOOLEAN DEFAULT true,
  cache_priority INTEGER DEFAULT 5 CHECK (cache_priority BETWEEN 1 AND 10), -- 缓存优先级
  
  -- 内容质量评估
  quality_score INTEGER CHECK (quality_score BETWEEN 1 AND 100), -- 内容质量评分
  relevance_score INTEGER CHECK (relevance_score BETWEEN 1 AND 100), -- 相关性评分
  completeness_score INTEGER CHECK (completeness_score BETWEEN 1 AND 100), -- 完整性评分
  
  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 约束
  UNIQUE(url_hash, tool_name),
  
  -- 外键
  CONSTRAINT fk_tool_results_session 
    FOREIGN KEY (session_id) 
    REFERENCES public.chat_sessions(id) 
    ON DELETE SET NULL
);

-- 2. 平台特定配置表
CREATE TABLE IF NOT EXISTS public.platform_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  platform_name TEXT NOT NULL UNIQUE,
  platform_type TEXT NOT NULL,
  
  -- API配置
  api_endpoint TEXT,
  rate_limit_per_hour INTEGER DEFAULT 100,
  requires_auth BOOLEAN DEFAULT false,
  auth_type TEXT CHECK (auth_type IN ('api_key', 'oauth', 'cookie', 'none')),
  
  -- 内容提取配置
  extraction_rules JSONB DEFAULT '{}', -- 提取规则配置
  supported_content_types JSONB DEFAULT '[]', -- 支持的内容类型
  
  -- 缓存配置
  default_cache_duration_hours INTEGER DEFAULT 24,
  max_cache_duration_hours INTEGER DEFAULT 168, -- 7天
  
  -- 质量控制
  min_quality_threshold INTEGER DEFAULT 60,
  content_filters JSONB DEFAULT '[]', -- 内容过滤规则
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 内容标签系统
CREATE TABLE IF NOT EXISTS public.content_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tool_result_id UUID NOT NULL REFERENCES public.tool_results(id) ON DELETE CASCADE,
  
  tag_type TEXT NOT NULL CHECK (tag_type IN (
    'skill', 'technology', 'industry', 'style', 'category', 'language', 
    'framework', 'tool', 'platform', 'genre', 'topic', 'auto_generated'
  )),
  
  tag_value TEXT NOT NULL,
  confidence_score DECIMAL(3,2) CHECK (confidence_score BETWEEN 0 AND 1), -- AI标签的置信度
  source TEXT DEFAULT 'auto' CHECK (source IN ('auto', 'manual', 'platform')), -- 标签来源
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tool_result_id, tag_type, tag_value)
);

-- 4. 多媒体文件信息表
CREATE TABLE IF NOT EXISTS public.media_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tool_result_id UUID NOT NULL REFERENCES public.tool_results(id) ON DELETE CASCADE,
  
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'video', 'audio', 'document', 'code')),
  file_url TEXT NOT NULL,
  file_size BIGINT, -- 文件大小 (bytes)
  mime_type TEXT,
  
  -- 媒体特定信息
  dimensions JSONB, -- 图片/视频尺寸 {"width": 1920, "height": 1080}
  duration_seconds INTEGER, -- 视频/音频时长
  bitrate INTEGER, -- 比特率
  format_info JSONB DEFAULT '{}', -- 格式详细信息
  
  -- 缩略图和预览
  thumbnail_url TEXT,
  preview_url TEXT,
  
  -- AI分析结果
  visual_analysis JSONB DEFAULT '{}', -- 视觉内容分析
  text_content TEXT, -- 从媒体中提取的文本 (OCR等)
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 工具结果使用记录表 (增强版)
CREATE TABLE IF NOT EXISTS public.tool_result_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  tool_result_id UUID NOT NULL REFERENCES public.tool_results(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  session_id TEXT,
  
  -- 使用信息
  used_at TIMESTAMPTZ DEFAULT NOW(),
  usage_context TEXT CHECK (usage_context IN (
    'initial_collection', 'supplementary_analysis', 'profile_building',
    'project_showcase', 'skill_verification', 'portfolio_enhancement',
    'content_curation', 'research', 'inspiration', 'other'
  )),
  
  -- 用户交互
  user_rating INTEGER CHECK (user_rating BETWEEN 1 AND 5), -- 用户评分
  user_feedback TEXT, -- 用户反馈
  is_bookmarked BOOLEAN DEFAULT false, -- 是否收藏
  
  -- 性能指标
  cache_hit BOOLEAN DEFAULT false,
  response_time_ms INTEGER,
  data_freshness_hours INTEGER, -- 数据新鲜度
  
  CONSTRAINT fk_usage_session 
    FOREIGN KEY (session_id) 
    REFERENCES public.chat_sessions(id) 
    ON DELETE SET NULL
);

-- 6. 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_tool_results_url_hash ON public.tool_results(url_hash);
CREATE INDEX IF NOT EXISTS idx_tool_results_user_id ON public.tool_results(user_id);
CREATE INDEX IF NOT EXISTS idx_tool_results_platform_type ON public.tool_results(platform_type);
CREATE INDEX IF NOT EXISTS idx_tool_results_content_type ON public.tool_results(content_type);
CREATE INDEX IF NOT EXISTS idx_tool_results_created_at ON public.tool_results(created_at);
CREATE INDEX IF NOT EXISTS idx_tool_results_cache_expires ON public.tool_results(cache_expires_at) WHERE cache_expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tool_results_quality ON public.tool_results(quality_score) WHERE quality_score IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_content_tags_tool_result ON public.content_tags(tool_result_id);
CREATE INDEX IF NOT EXISTS idx_content_tags_type_value ON public.content_tags(tag_type, tag_value);

CREATE INDEX IF NOT EXISTS idx_media_files_tool_result ON public.media_files(tool_result_id);
CREATE INDEX IF NOT EXISTS idx_media_files_type ON public.media_files(file_type);

-- 7. 创建自动更新时间戳的触发器
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

-- 8. 创建清理过期缓存的函数
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

-- 9. 创建获取缓存结果的函数 (增强版)
CREATE OR REPLACE FUNCTION get_cached_tool_result(
  p_url_hash TEXT,
  p_tool_name TEXT,
  p_user_id TEXT DEFAULT NULL,
  p_min_quality_score INTEGER DEFAULT 60
)
RETURNS TABLE(
  id UUID,
  tool_output JSONB,
  processed_data JSONB,
  media_info JSONB,
  content_analysis JSONB,
  created_at TIMESTAMPTZ,
  quality_score INTEGER,
  is_expired BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tr.id,
    tr.tool_output,
    tr.processed_data,
    tr.media_info,
    tr.content_analysis,
    tr.created_at,
    tr.quality_score,
    (tr.cache_expires_at IS NOT NULL AND tr.cache_expires_at < NOW()) as is_expired
  FROM public.tool_results tr
  WHERE tr.url_hash = p_url_hash
    AND tr.tool_name = p_tool_name
    AND tr.status = 'success'
    AND (p_user_id IS NULL OR tr.user_id = p_user_id)
    AND (tr.cache_expires_at IS NULL OR tr.cache_expires_at > NOW())
    AND (tr.quality_score IS NULL OR tr.quality_score >= p_min_quality_score)
  ORDER BY tr.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- 10. 创建内容推荐函数
CREATE OR REPLACE FUNCTION get_similar_content(
  p_tool_result_id UUID,
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE(
  id UUID,
  source_url TEXT,
  platform_type TEXT,
  content_type TEXT,
  quality_score INTEGER,
  similarity_score DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH target_tags AS (
    SELECT tag_type, tag_value, confidence_score
    FROM public.content_tags
    WHERE tool_result_id = p_tool_result_id
  ),
  similar_results AS (
    SELECT 
      tr.id,
      tr.source_url,
      tr.platform_type,
      tr.content_type,
      tr.quality_score,
      COUNT(ct.tag_value) * AVG(ct.confidence_score) as similarity_score
    FROM public.tool_results tr
    JOIN public.content_tags ct ON tr.id = ct.tool_result_id
    JOIN target_tags tt ON ct.tag_type = tt.tag_type AND ct.tag_value = tt.tag_value
    WHERE tr.id != p_tool_result_id
      AND tr.status = 'success'
    GROUP BY tr.id, tr.source_url, tr.platform_type, tr.content_type, tr.quality_score
    HAVING COUNT(ct.tag_value) >= 2 -- 至少有2个共同标签
  )
  SELECT 
    sr.id,
    sr.source_url,
    sr.platform_type,
    sr.content_type,
    sr.quality_score,
    sr.similarity_score
  FROM similar_results sr
  ORDER BY sr.similarity_score DESC, sr.quality_score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- 11. 插入默认平台配置
INSERT INTO public.platform_configs (platform_name, platform_type, rate_limit_per_hour, default_cache_duration_hours) VALUES
-- 代码平台
('github', 'code_repository', 5000, 24),
('gitlab', 'code_repository', 2000, 24),
('codepen', 'code_repository', 1000, 12),
('replit', 'code_repository', 500, 12),

-- 设计平台
('behance', 'design_portfolio', 100, 48),
('dribbble', 'design_portfolio', 100, 48),
('figma', 'design_portfolio', 200, 24),
('pinterest', 'design_portfolio', 200, 72),

-- 视频平台
('youtube', 'video_platform', 10000, 24),
('bilibili', 'video_platform', 1000, 24),
('vimeo', 'video_platform', 500, 24),
('tiktok', 'video_platform', 100, 12),

-- 社交平台
('linkedin', 'social_media', 500, 48),
('instagram', 'social_media', 200, 24),
('twitter', 'social_media', 1500, 6),
('weibo', 'social_media', 1000, 12),

-- 部署平台
('vercel', 'deployment_platform', 1000, 24),
('netlify', 'deployment_platform', 1000, 24),
('bolt', 'deployment_platform', 100, 12),
('youware', 'deployment_platform', 100, 12),

-- 内容平台
('xiaohongshu', 'content_platform', 100, 24),
('medium', 'content_platform', 1000, 48),
('substack', 'content_platform', 500, 48)

ON CONFLICT (platform_name) DO NOTHING;

-- 12. 创建RLS策略确保数据安全
ALTER TABLE public.tool_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_result_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_files ENABLE ROW LEVEL SECURITY;

-- 用户只能访问自己的工具结果
CREATE POLICY "Users can access their own tool results" ON public.tool_results
  FOR ALL USING (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can access their own usage records" ON public.tool_result_usage
  FOR ALL USING (user_id = current_setting('app.current_user_id', true));

-- 标签和媒体文件通过tool_result关联控制访问
CREATE POLICY "Users can access tags for their tool results" ON public.content_tags
  FOR ALL USING (
    tool_result_id IN (
      SELECT id FROM public.tool_results 
      WHERE user_id = current_setting('app.current_user_id', true)
    )
  );

CREATE POLICY "Users can access media for their tool results" ON public.media_files
  FOR ALL USING (
    tool_result_id IN (
      SELECT id FROM public.tool_results 
      WHERE user_id = current_setting('app.current_user_id', true)
    )
  );

-- 13. 创建统计视图
CREATE OR REPLACE VIEW public.tool_results_analytics AS
SELECT 
  platform_type,
  content_type,
  tool_name,
  COUNT(*) as total_results,
  COUNT(*) FILTER (WHERE status = 'success') as successful_results,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_results,
  AVG(quality_score) as avg_quality_score,
  AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_processing_time,
  COUNT(DISTINCT user_id) as unique_users,
  DATE_TRUNC('day', created_at) as result_date
FROM public.tool_results
GROUP BY platform_type, content_type, tool_name, DATE_TRUNC('day', created_at)
ORDER BY result_date DESC, total_results DESC;

-- 14. 创建内容质量监控视图
CREATE OR REPLACE VIEW public.content_quality_monitor AS
SELECT 
  platform_type,
  content_type,
  AVG(quality_score) as avg_quality,
  MIN(quality_score) as min_quality,
  MAX(quality_score) as max_quality,
  COUNT(*) FILTER (WHERE quality_score < 60) as low_quality_count,
  COUNT(*) as total_count,
  ROUND(
    (COUNT(*) FILTER (WHERE quality_score >= 80)::DECIMAL / COUNT(*)) * 100, 
    2
  ) as high_quality_percentage
FROM public.tool_results
WHERE quality_score IS NOT NULL
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY platform_type, content_type
ORDER BY avg_quality DESC;
