-- 文档管理相关表结构
-- 用于HeysMe项目的文档上传、存储和处理

-- 1. 用户上传的文档表
CREATE TABLE IF NOT EXISTS user_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL, -- Clerk用户ID
    session_id TEXT, -- 关联的聊天会话ID
    
    -- 文件基本信息
    original_filename TEXT NOT NULL,
    file_type TEXT NOT NULL, -- pdf, docx, txt, etc.
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    
    -- Supabase Storage信息
    storage_path TEXT NOT NULL, -- 在storage中的路径
    storage_bucket TEXT DEFAULT 'documents' NOT NULL,
    
    -- 解析状态
    parsing_status TEXT DEFAULT 'pending' CHECK (parsing_status IN ('pending', 'processing', 'completed', 'failed')),
    parsing_started_at TIMESTAMPTZ,
    parsing_completed_at TIMESTAMPTZ,
    parsing_error TEXT,
    
    -- 解析结果
    extracted_text TEXT, -- 提取的纯文本
    extracted_metadata JSONB, -- 文档元数据
    parsed_content JSONB, -- 结构化解析结果
    
    -- 时间戳
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 索引
    CONSTRAINT fk_session FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE SET NULL
);

-- 2. 文档解析任务队列表
CREATE TABLE IF NOT EXISTS document_parsing_jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES user_documents(id) ON DELETE CASCADE,
    
    -- 任务信息
    job_type TEXT DEFAULT 'parse_document' NOT NULL, -- parse_document, extract_advanced, etc.
    priority INTEGER DEFAULT 5, -- 1-10, 1最高优先级
    max_retries INTEGER DEFAULT 3,
    current_retry INTEGER DEFAULT 0,
    
    -- 任务状态
    status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    
    -- 任务配置
    parsing_options JSONB DEFAULT '{}', -- 解析选项
    result JSONB, -- 解析结果
    
    -- 时间戳
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 文档处理缓存表（可选，用于缓存常见文档的解析结果）
CREATE TABLE IF NOT EXISTS document_parsing_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- 文件标识
    file_hash TEXT NOT NULL UNIQUE, -- 文件内容的MD5/SHA256哈希
    file_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    
    -- 缓存的解析结果
    extracted_text TEXT,
    parsed_content JSONB,
    parsing_metadata JSONB,
    
    -- 缓存统计
    hit_count INTEGER DEFAULT 1,
    last_accessed TIMESTAMPTZ DEFAULT NOW(),
    
    -- 时间戳
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_user_documents_user_id ON user_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_documents_session_id ON user_documents(session_id);
CREATE INDEX IF NOT EXISTS idx_user_documents_status ON user_documents(parsing_status);
CREATE INDEX IF NOT EXISTS idx_user_documents_created ON user_documents(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_parsing_jobs_document_id ON document_parsing_jobs(document_id);
CREATE INDEX IF NOT EXISTS idx_parsing_jobs_status ON document_parsing_jobs(status);
CREATE INDEX IF NOT EXISTS idx_parsing_jobs_priority ON document_parsing_jobs(priority DESC, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_parsing_cache_hash ON document_parsing_cache(file_hash);
CREATE INDEX IF NOT EXISTS idx_parsing_cache_accessed ON document_parsing_cache(last_accessed DESC);

-- 更新时间戳触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_documents_updated_at 
    BEFORE UPDATE ON user_documents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parsing_jobs_updated_at 
    BEFORE UPDATE ON document_parsing_jobs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parsing_cache_updated_at 
    BEFORE UPDATE ON document_parsing_cache 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) 策略
ALTER TABLE user_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_parsing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_parsing_cache ENABLE ROW LEVEL SECURITY;

-- 用户只能访问自己的文档
CREATE POLICY "Users can only access their own documents" ON user_documents
    FOR ALL USING (user_id = current_setting('app.current_user_id', true));

-- 解析任务的访问权限基于文档所有权
CREATE POLICY "Users can access parsing jobs for their documents" ON document_parsing_jobs
    FOR ALL USING (
        document_id IN (
            SELECT id FROM user_documents 
            WHERE user_id = current_setting('app.current_user_id', true)
        )
    );

-- 缓存表允许所有认证用户读取（但不能修改）
CREATE POLICY "Authenticated users can read parsing cache" ON document_parsing_cache
    FOR SELECT USING (true);

-- 只有系统可以写入缓存
CREATE POLICY "Only system can write to parsing cache" ON document_parsing_cache
    FOR INSERT WITH CHECK (false);

CREATE POLICY "Only system can update parsing cache" ON document_parsing_cache
    FOR UPDATE USING (false); 