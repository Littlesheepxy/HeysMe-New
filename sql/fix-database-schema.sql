-- HeysMe 数据库结构修复脚本
-- 解决重复表和不一致字段的问题

-- 1. 首先备份重要数据（如果有的话）
-- 这里假设是开发环境，可以安全重建

-- 2. 删除有问题的重复表和约束
DROP TABLE IF EXISTS public.user_pages CASCADE;
DROP TABLE IF EXISTS public.user_sensitive_data CASCADE;
DROP TABLE IF EXISTS public.templates CASCADE;
DROP TABLE IF EXISTS public.creator_verifications CASCADE;
DROP TABLE IF EXISTS public.share_records CASCADE;
DROP TABLE IF EXISTS public.sanitization_logs CASCADE;
DROP TABLE IF EXISTS public.template_forks CASCADE;
DROP TABLE IF EXISTS public.user_favorites CASCADE;
DROP TABLE IF EXISTS public.premium_feature_usage CASCADE;
DROP TABLE IF EXISTS public.user_credits CASCADE;

-- 3. 修复现有表的外键约束问题
-- 删除有问题的外键约束
ALTER TABLE IF EXISTS public.pages DROP CONSTRAINT IF EXISTS pages_session_id_fkey;
ALTER TABLE IF EXISTS public.share_records DROP CONSTRAINT IF EXISTS share_records_page_id_fkey;
ALTER TABLE IF EXISTS public.sanitization_logs DROP CONSTRAINT IF EXISTS sanitization_logs_template_id_fkey;

-- 4. 重新创建社区功能表（与现有表兼容）

-- 用户身份页面表（基于现有pages表扩展）
CREATE TABLE public.user_pages (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id text NOT NULL, -- 使用text类型匹配现有users表
  
  -- 基础信息
  title varchar(200) NOT NULL,
  description text,
  content jsonb NOT NULL DEFAULT '{}',
  
  -- 分享相关
  is_shared_to_plaza boolean DEFAULT false,
  plaza_share_config jsonb DEFAULT '{}',
  
  -- 分类和标签
  category varchar(50),
  tags text[] DEFAULT '{}',
  industry_tags text[] DEFAULT '{}',
  location varchar(100),
  
  -- 隐私设置
  privacy_settings jsonb DEFAULT '{"allow_view": true, "allow_favorite": true, "show_username": false}',
  
  -- 统计信息
  view_count integer DEFAULT 0,
  favorite_count integer DEFAULT 0,
  
  -- 时间戳
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  shared_at timestamp with time zone,
  
  CONSTRAINT user_pages_pkey PRIMARY KEY (id),
  CONSTRAINT user_pages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- 敏感信息表（使用text类型的user_id）
CREATE TABLE public.user_sensitive_data (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id text NOT NULL UNIQUE, -- 使用text类型匹配现有users表
  
  -- 个人信息（加密存储）
  real_name_encrypted text,
  phone_encrypted text,
  email_encrypted text,
  id_number_encrypted text,
  address_encrypted text,
  
  -- 职业信息（加密存储）
  company_name_encrypted text,
  project_details_encrypted jsonb,
  salary_info_encrypted jsonb,
  education_details_encrypted jsonb,
  work_history_encrypted jsonb,
  
  -- 元数据
  encryption_key_id varchar(50),
  data_completeness_score integer DEFAULT 0,
  last_verified_at timestamp with time zone,
  
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  
  CONSTRAINT user_sensitive_data_pkey PRIMARY KEY (id),
  CONSTRAINT user_sensitive_data_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- 模板表（使用text类型的creator_id）
CREATE TABLE public.templates (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  creator_id text NOT NULL, -- 使用text类型匹配现有users表
  source_page_id uuid,
  
  -- 基础信息
  title varchar(200) NOT NULL,
  description text,
  
  -- 脱敏内容
  sanitized_content jsonb NOT NULL DEFAULT '{}',
  sanitized_prompt_history jsonb DEFAULT '[]',
  
  -- 分类和标签
  category varchar(50),
  tags text[] DEFAULT '{}',
  design_tags text[] DEFAULT '{}',
  
  -- 统计信息
  fork_count integer DEFAULT 0,
  use_count integer DEFAULT 0,
  view_count integer DEFAULT 0,
  
  -- 状态
  is_featured boolean DEFAULT false,
  status varchar(20) DEFAULT 'published',
  
  -- 时间戳
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  
  CONSTRAINT templates_pkey PRIMARY KEY (id),
  CONSTRAINT templates_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT templates_source_page_id_fkey FOREIGN KEY (source_page_id) REFERENCES public.user_pages(id) ON DELETE SET NULL
);

-- 创作者认证表（使用text类型的user_id）
CREATE TABLE public.creator_verifications (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id text NOT NULL, -- 使用text类型匹配现有users表
  
  -- 认证信息
  verification_type varchar(50) NOT NULL,
  verification_status varchar(20) DEFAULT 'pending',
  
  -- 认证材料
  portfolio_url text,
  work_samples jsonb DEFAULT '[]',
  credentials jsonb DEFAULT '{}',
  social_links jsonb DEFAULT '{}',
  
  -- 认证结果
  verified_at timestamp with time zone,
  verified_by text, -- 使用text类型
  verification_notes text,
  
  -- 认证等级
  verification_level integer DEFAULT 1,
  specialties text[] DEFAULT '{}',
  
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  
  CONSTRAINT creator_verifications_pkey PRIMARY KEY (id),
  CONSTRAINT creator_verifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT creator_verifications_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.users(id),
  CONSTRAINT creator_verifications_user_type_unique UNIQUE(user_id, verification_type)
);

-- 分享记录表（修复外键引用）
CREATE TABLE public.share_records (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id text NOT NULL, -- 使用text类型匹配现有users表
  page_id uuid NOT NULL,
  
  share_type varchar(20) NOT NULL,
  share_config jsonb DEFAULT '{}',
  
  -- 分享统计
  view_count integer DEFAULT 0,
  click_count integer DEFAULT 0,
  
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  
  CONSTRAINT share_records_pkey PRIMARY KEY (id),
  CONSTRAINT share_records_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT share_records_page_id_fkey FOREIGN KEY (page_id) REFERENCES public.user_pages(id) ON DELETE CASCADE
);

-- 数据脱敏日志表
CREATE TABLE public.sanitization_logs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  template_id uuid NOT NULL,
  
  original_fields jsonb DEFAULT '{}',
  sanitized_fields jsonb DEFAULT '{}',
  sanitization_rules jsonb DEFAULT '{}',
  
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  
  CONSTRAINT sanitization_logs_pkey PRIMARY KEY (id),
  CONSTRAINT sanitization_logs_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.templates(id) ON DELETE CASCADE
);

-- Fork关系表（使用text类型的user_id）
CREATE TABLE public.template_forks (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  template_id uuid NOT NULL,
  user_id text NOT NULL, -- 使用text类型匹配现有users表
  
  -- Fork后的修改
  customizations jsonb DEFAULT '{}',
  
  forked_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  
  CONSTRAINT template_forks_pkey PRIMARY KEY (id),
  CONSTRAINT template_forks_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.templates(id) ON DELETE CASCADE,
  CONSTRAINT template_forks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT template_forks_unique UNIQUE(template_id, user_id)
);

-- 收藏表（使用text类型的user_id）
CREATE TABLE public.user_favorites (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id text NOT NULL, -- 使用text类型匹配现有users表
  
  target_type varchar(20) NOT NULL,
  target_id uuid NOT NULL,
  
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  
  CONSTRAINT user_favorites_pkey PRIMARY KEY (id),
  CONSTRAINT user_favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT user_favorites_unique UNIQUE(user_id, target_type, target_id)
);

-- 付费功能使用记录表（使用text类型的user_id）
CREATE TABLE public.premium_feature_usage (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id text NOT NULL, -- 使用text类型匹配现有users表
  
  feature_type varchar(50) NOT NULL,
  target_user_id text, -- 使用text类型
  
  credits_consumed integer DEFAULT 0,
  
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  
  CONSTRAINT premium_feature_usage_pkey PRIMARY KEY (id),
  CONSTRAINT premium_feature_usage_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT premium_feature_usage_target_user_id_fkey FOREIGN KEY (target_user_id) REFERENCES public.users(id)
);

-- 用户积分表（使用text类型的user_id）
CREATE TABLE public.user_credits (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id text NOT NULL UNIQUE, -- 使用text类型匹配现有users表
  
  total_credits integer DEFAULT 0,
  used_credits integer DEFAULT 0,
  available_credits integer DEFAULT 0, -- 改为普通字段，通过触发器更新
  
  -- 积分来源记录
  credit_history jsonb DEFAULT '[]',
  
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  
  CONSTRAINT user_credits_pkey PRIMARY KEY (id),
  CONSTRAINT user_credits_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- 5. 创建索引
CREATE INDEX idx_user_pages_user_id ON public.user_pages(user_id);
CREATE INDEX idx_user_pages_shared ON public.user_pages(is_shared_to_plaza) WHERE is_shared_to_plaza = true;
CREATE INDEX idx_user_pages_category ON public.user_pages(category);
CREATE INDEX idx_user_pages_location ON public.user_pages(location);
CREATE INDEX idx_user_pages_tags ON public.user_pages USING GIN(tags);
CREATE INDEX idx_user_pages_industry_tags ON public.user_pages USING GIN(industry_tags);

CREATE INDEX idx_templates_creator ON public.templates(creator_id);
CREATE INDEX idx_templates_category ON public.templates(category);
CREATE INDEX idx_templates_status ON public.templates(status);
CREATE INDEX idx_templates_featured ON public.templates(is_featured) WHERE is_featured = true;
CREATE INDEX idx_templates_tags ON public.templates USING GIN(tags);
CREATE INDEX idx_templates_design_tags ON public.templates USING GIN(design_tags);

CREATE INDEX idx_creator_verifications_user ON public.creator_verifications(user_id);
CREATE INDEX idx_creator_verifications_status ON public.creator_verifications(verification_status);
CREATE INDEX idx_creator_verifications_type ON public.creator_verifications(verification_type);

CREATE INDEX idx_share_records_user ON public.share_records(user_id);
CREATE INDEX idx_share_records_page ON public.share_records(page_id);
CREATE INDEX idx_share_records_type ON public.share_records(share_type);

CREATE INDEX idx_template_forks_template ON public.template_forks(template_id);
CREATE INDEX idx_template_forks_user ON public.template_forks(user_id);

CREATE INDEX idx_user_favorites_user ON public.user_favorites(user_id);
CREATE INDEX idx_user_favorites_target ON public.user_favorites(target_type, target_id);

CREATE INDEX idx_premium_usage_user ON public.premium_feature_usage(user_id);
CREATE INDEX idx_premium_usage_feature ON public.premium_feature_usage(feature_type);

CREATE INDEX idx_user_credits_user ON public.user_credits(user_id);

-- 6. 创建触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 创建积分计算触发器
CREATE OR REPLACE FUNCTION update_available_credits()
RETURNS TRIGGER AS $$
BEGIN
    NEW.available_credits = NEW.total_credits - NEW.used_credits;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. 创建触发器
CREATE TRIGGER update_user_pages_updated_at 
    BEFORE UPDATE ON public.user_pages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at 
    BEFORE UPDATE ON public.templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_creator_verifications_updated_at 
    BEFORE UPDATE ON public.creator_verifications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_sensitive_data_updated_at 
    BEFORE UPDATE ON public.user_sensitive_data 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_credits_updated_at 
    BEFORE UPDATE ON public.user_credits 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_credits_available 
    BEFORE INSERT OR UPDATE ON public.user_credits 
    FOR EACH ROW EXECUTE FUNCTION update_available_credits();

-- 8. 启用RLS（Row Level Security）
ALTER TABLE public.user_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sensitive_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_forks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.premium_feature_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

-- 9. 创建RLS策略
-- 用户页面访问策略
CREATE POLICY "Users can view their own pages" ON public.user_pages 
    FOR SELECT USING (user_id = (SELECT id FROM public.users WHERE id = auth.jwt() ->> 'sub'));

CREATE POLICY "Users can insert their own pages" ON public.user_pages 
    FOR INSERT WITH CHECK (user_id = (SELECT id FROM public.users WHERE id = auth.jwt() ->> 'sub'));

CREATE POLICY "Users can update their own pages" ON public.user_pages 
    FOR UPDATE USING (user_id = (SELECT id FROM public.users WHERE id = auth.jwt() ->> 'sub'));

CREATE POLICY "Users can delete their own pages" ON public.user_pages 
    FOR DELETE USING (user_id = (SELECT id FROM public.users WHERE id = auth.jwt() ->> 'sub'));

CREATE POLICY "Anyone can view shared pages" ON public.user_pages 
    FOR SELECT USING (is_shared_to_plaza = true);

-- 敏感数据访问策略（仅用户本人可访问）
CREATE POLICY "Users can only access their own sensitive data" ON public.user_sensitive_data 
    FOR ALL USING (user_id = (SELECT id FROM public.users WHERE id = auth.jwt() ->> 'sub'));

-- 模板访问策略
CREATE POLICY "Users can view published templates" ON public.templates 
    FOR SELECT USING (status = 'published');

CREATE POLICY "Users can manage their own templates" ON public.templates 
    FOR ALL USING (creator_id = (SELECT id FROM public.users WHERE id = auth.jwt() ->> 'sub'));

-- 其他表的基础访问策略
CREATE POLICY "Users can manage their own data" ON public.creator_verifications 
    FOR ALL USING (user_id = (SELECT id FROM public.users WHERE id = auth.jwt() ->> 'sub'));

CREATE POLICY "Users can manage their own shares" ON public.share_records 
    FOR ALL USING (user_id = (SELECT id FROM public.users WHERE id = auth.jwt() ->> 'sub'));

CREATE POLICY "Users can manage their own forks" ON public.template_forks 
    FOR ALL USING (user_id = (SELECT id FROM public.users WHERE id = auth.jwt() ->> 'sub'));

CREATE POLICY "Users can manage their own favorites" ON public.user_favorites 
    FOR ALL USING (user_id = (SELECT id FROM public.users WHERE id = auth.jwt() ->> 'sub'));

CREATE POLICY "Users can view their own premium usage" ON public.premium_feature_usage 
    FOR SELECT USING (user_id = (SELECT id FROM public.users WHERE id = auth.jwt() ->> 'sub'));

CREATE POLICY "Users can manage their own credits" ON public.user_credits 
    FOR ALL USING (user_id = (SELECT id FROM public.users WHERE id = auth.jwt() ->> 'sub'));

-- 10. 创建视图用于统计
CREATE OR REPLACE VIEW community_stats AS
SELECT 
  (SELECT COUNT(*) FROM public.user_pages WHERE is_shared_to_plaza = true) as total_shared_pages,
  (SELECT COUNT(*) FROM public.templates WHERE status = 'published') as total_templates,
  (SELECT COUNT(*) FROM public.creator_verifications WHERE verification_status = 'approved') as verified_creators,
  (SELECT COUNT(*) FROM public.template_forks) as total_forks;

-- 11. 添加表注释
COMMENT ON TABLE public.user_pages IS '用户身份页面表';
COMMENT ON TABLE public.user_sensitive_data IS '用户敏感信息表（加密存储）';
COMMENT ON TABLE public.templates IS '模板表';
COMMENT ON TABLE public.creator_verifications IS '创作者认证表';
COMMENT ON TABLE public.share_records IS '分享记录表';
COMMENT ON TABLE public.sanitization_logs IS '数据脱敏日志表';
COMMENT ON TABLE public.template_forks IS 'Fork关系表';
COMMENT ON TABLE public.user_favorites IS '收藏表';
COMMENT ON TABLE public.premium_feature_usage IS '付费功能使用记录表';
COMMENT ON TABLE public.user_credits IS '用户积分表';

-- 12. 修复现有pages表与session_id的关系（如果需要的话）
-- 由于chat_sessions表存在，我们可以重新建立这个关系
ALTER TABLE public.pages 
ADD CONSTRAINT pages_session_id_fkey 
FOREIGN KEY (session_id) REFERENCES public.chat_sessions(id) ON DELETE SET NULL;

-- 完成
SELECT 'Database schema fixed successfully!' as status;