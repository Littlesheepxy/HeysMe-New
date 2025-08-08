-- 简化版：仅添加generated_content字段和基本索引
-- 适用于快速部署，避免复杂的索引问题

-- 1. 添加generated_content字段
ALTER TABLE public.chat_sessions 
ADD COLUMN IF NOT EXISTS generated_content jsonb DEFAULT '{}';

-- 2. 添加基本的JSONB索引（这个应该不会有问题）
CREATE INDEX IF NOT EXISTS idx_chat_sessions_generated_content 
ON public.chat_sessions USING gin (generated_content);

-- 3. 添加注释
COMMENT ON COLUMN public.chat_sessions.generated_content IS '存储AI生成的内容，包括代码项目、简历、作品集等';

-- 4. 数据迁移：将现有metadata中的generatedContent移动到新字段
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

-- 5. 验证迁移结果
SELECT 
  COUNT(*) as total_sessions,
  COUNT(generated_content) as sessions_with_generated_content,
  COUNT(CASE WHEN generated_content != '{}' THEN 1 END) as sessions_with_actual_content
FROM public.chat_sessions;
