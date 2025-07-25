-- HeysMe 聊天会话数据库表结构
-- 用于替代本地 .sessions 文件存储

-- 1. 聊天会话表
CREATE TABLE public.chat_sessions (
  id text NOT NULL, -- 会话ID，格式: session-timestamp-randomstring
  user_id text NOT NULL, -- 关联到用户表
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'archived')),
  
  -- 用户意图信息
  user_intent jsonb DEFAULT '{}', -- 存储整个 userIntent 对象
  
  -- 个性化设置
  personalization jsonb DEFAULT '{}', -- 存储整个 personalization 对象
  
  -- 收集的数据
  collected_data jsonb DEFAULT '{}', -- 存储整个 collectedData 对象
  
  -- 系统元数据
  metadata jsonb DEFAULT '{}', -- 存储进度、指标、设置等
  
  -- 时间字段
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  last_active timestamp with time zone DEFAULT timezone('utc'::text, now()),
  
  -- 约束
  CONSTRAINT chat_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT chat_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- 2. 对话历史记录表
CREATE TABLE public.conversation_entries (
  id text NOT NULL, -- 消息ID
  session_id text NOT NULL, -- 关联到会话表
  timestamp timestamp with time zone DEFAULT timezone('utc'::text, now()),
  type text NOT NULL CHECK (type IN ('user_message', 'agent_response', 'system_event')),
  agent text NULL, -- 代理名称（如果是代理消息）
  content text NOT NULL, -- 消息内容
  metadata jsonb DEFAULT '{}', -- 扩展元数据
  
  -- 用户交互数据
  user_interaction jsonb NULL, -- 存储用户交互信息
  
  CONSTRAINT conversation_entries_pkey PRIMARY KEY (id),
  CONSTRAINT conversation_entries_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.chat_sessions(id) ON DELETE CASCADE
);

-- 3. 代理流程记录表
CREATE TABLE public.agent_flows (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  session_id text NOT NULL, -- 关联到会话表
  agent_name text NOT NULL, -- 代理名称
  stage text NOT NULL, -- 阶段名称
  status text DEFAULT 'active' CHECK (status IN ('pending', 'active', 'completed', 'error')),
  data jsonb DEFAULT '{}', -- 代理相关数据
  start_time timestamp with time zone DEFAULT timezone('utc'::text, now()),
  end_time timestamp with time zone NULL,
  
  CONSTRAINT agent_flows_pkey PRIMARY KEY (id),
  CONSTRAINT agent_flows_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.chat_sessions(id) ON DELETE CASCADE
);

-- 4. 创建索引
-- 会话表索引
CREATE INDEX idx_chat_sessions_user_id ON public.chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_status ON public.chat_sessions(status);
CREATE INDEX idx_chat_sessions_created_at ON public.chat_sessions(created_at);
CREATE INDEX idx_chat_sessions_last_active ON public.chat_sessions(last_active);

-- 对话记录表索引
CREATE INDEX idx_conversation_entries_session_id ON public.conversation_entries(session_id);
CREATE INDEX idx_conversation_entries_timestamp ON public.conversation_entries(timestamp);
CREATE INDEX idx_conversation_entries_type ON public.conversation_entries(type);
CREATE INDEX idx_conversation_entries_agent ON public.conversation_entries(agent);

-- 代理流程表索引
CREATE INDEX idx_agent_flows_session_id ON public.agent_flows(session_id);
CREATE INDEX idx_agent_flows_agent_name ON public.agent_flows(agent_name);
CREATE INDEX idx_agent_flows_status ON public.agent_flows(status);
CREATE INDEX idx_agent_flows_start_time ON public.agent_flows(start_time);

-- 5. 更新时间触发器
CREATE TRIGGER update_chat_sessions_updated_at 
  BEFORE UPDATE ON public.chat_sessions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. 行级安全策略 (RLS)
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_flows ENABLE ROW LEVEL SECURITY;

-- 会话表策略
CREATE POLICY "用户可以访问自己的会话" ON public.chat_sessions
  FOR ALL USING (user_id = auth.uid()::text);

-- 对话记录表策略
CREATE POLICY "用户可以访问自己会话的对话记录" ON public.conversation_entries
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.chat_sessions 
      WHERE chat_sessions.id = conversation_entries.session_id 
      AND chat_sessions.user_id = auth.uid()::text
    )
  );

-- 代理流程表策略
CREATE POLICY "用户可以访问自己会话的代理流程" ON public.agent_flows
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.chat_sessions 
      WHERE chat_sessions.id = agent_flows.session_id 
      AND chat_sessions.user_id = auth.uid()::text
    )
  );

-- 7. 有用的视图和函数

-- 创建视图：会话统计
CREATE VIEW public.session_statistics AS
SELECT 
  cs.id as session_id,
  cs.user_id,
  cs.status,
  cs.created_at,
  cs.last_active,
  COUNT(ce.id) as message_count,
  COUNT(CASE WHEN ce.type = 'user_message' THEN 1 END) as user_messages,
  COUNT(CASE WHEN ce.type = 'agent_response' THEN 1 END) as agent_responses,
  COUNT(DISTINCT af.agent_name) as agents_used,
  EXTRACT(EPOCH FROM (cs.last_active - cs.created_at)) / 60 as duration_minutes
FROM public.chat_sessions cs
LEFT JOIN public.conversation_entries ce ON cs.id = ce.session_id
LEFT JOIN public.agent_flows af ON cs.id = af.session_id
GROUP BY cs.id, cs.user_id, cs.status, cs.created_at, cs.last_active;

-- 创建函数：获取会话详情
CREATE OR REPLACE FUNCTION get_session_details(session_id_param text)
RETURNS jsonb AS $$
DECLARE
  session_data jsonb;
BEGIN
  SELECT jsonb_build_object(
    'session', to_jsonb(cs.*),
    'conversation_history', COALESCE(
      jsonb_agg(
        to_jsonb(ce.*) 
        ORDER BY ce.timestamp
      ) FILTER (WHERE ce.id IS NOT NULL), 
      '[]'::jsonb
    ),
    'agent_flows', COALESCE(
      jsonb_agg(
        to_jsonb(af.*) 
        ORDER BY af.start_time
      ) FILTER (WHERE af.id IS NOT NULL), 
      '[]'::jsonb
    )
  ) INTO session_data
  FROM public.chat_sessions cs
  LEFT JOIN public.conversation_entries ce ON cs.id = ce.session_id
  LEFT JOIN public.agent_flows af ON cs.id = af.session_id
  WHERE cs.id = session_id_param
  GROUP BY cs.id;
  
  RETURN session_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建函数：清理旧会话
CREATE OR REPLACE FUNCTION cleanup_old_sessions(days_threshold integer DEFAULT 30)
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.chat_sessions 
  WHERE status = 'archived' 
    AND last_active < (CURRENT_TIMESTAMP - INTERVAL '1 day' * days_threshold);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 