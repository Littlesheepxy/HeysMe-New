-- 修复文档表的RLS策略，使其与Clerk认证兼容
-- 由于我们使用的是Clerk而非Supabase Auth，需要调整策略

-- 🔍 检查发现：文档表已存在，RLS策略已设为允许所有访问
-- 当前策略：Users can access their own documents via user_id - qual: true (允许所有)
-- 问题：set_current_user_id 函数不存在，导致代码调用RPC失败

-- 删除现有的策略
DROP POLICY IF EXISTS "Users can only access their own documents" ON user_documents;
DROP POLICY IF EXISTS "Users can access parsing jobs for their documents" ON document_parsing_jobs;
DROP POLICY IF EXISTS "Users can access their own documents via user_id" ON user_documents;
DROP POLICY IF EXISTS "Users can access their parsing jobs" ON document_parsing_jobs;

-- 方案1: 使用改进的RLS策略，兼容Clerk和user_id验证

-- 1. 用户文档表：允许用户访问自己的文档
CREATE POLICY "Users can manage their own documents" ON user_documents
    FOR ALL 
    USING (
        user_id = COALESCE(current_setting('app.current_user_id', true), '') 
        OR current_setting('app.current_user_id', true) IS NULL
        OR current_setting('app.current_user_id', true) = ''
    )
    WITH CHECK (
        user_id = COALESCE(current_setting('app.current_user_id', true), '') 
        OR current_setting('app.current_user_id', true) IS NULL
        OR current_setting('app.current_user_id', true) = ''
    );

-- 2. 解析任务表：允许访问相关的解析任务  
CREATE POLICY "Users can manage parsing jobs" ON document_parsing_jobs
    FOR ALL 
    USING (
        document_id IN (
            SELECT id FROM user_documents 
            WHERE user_id = COALESCE(current_setting('app.current_user_id', true), '')
        )
        OR current_setting('app.current_user_id', true) IS NULL
        OR current_setting('app.current_user_id', true) = ''
    )
    WITH CHECK (
        document_id IN (
            SELECT id FROM user_documents 
            WHERE user_id = COALESCE(current_setting('app.current_user_id', true), '')
        )
        OR current_setting('app.current_user_id', true) IS NULL
        OR current_setting('app.current_user_id', true) = ''
    );

-- 方案2: 如果要保持严格的RLS控制，需要设置用户上下文
-- 注意：这需要在每次数据库操作前设置用户ID

-- 创建设置用户上下文的函数
CREATE OR REPLACE FUNCTION set_current_user_id(user_id_value TEXT)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_user_id', user_id_value, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 可选：恢复严格的RLS策略（需要配合设置用户上下文使用）
/*
DROP POLICY IF EXISTS "Users can manage their own documents" ON user_documents;
DROP POLICY IF EXISTS "Users can manage parsing jobs" ON document_parsing_jobs;

CREATE POLICY "Users can only access their own documents" ON user_documents
    FOR ALL USING (
        user_id = current_setting('app.current_user_id', true) OR 
        current_setting('app.current_user_id', true) = ''
    );

CREATE POLICY "Users can access parsing jobs for their documents" ON document_parsing_jobs
    FOR ALL USING (
        document_id IN (
            SELECT id FROM user_documents 
            WHERE user_id = current_setting('app.current_user_id', true)
        ) OR current_setting('app.current_user_id', true) = ''
    );
*/
