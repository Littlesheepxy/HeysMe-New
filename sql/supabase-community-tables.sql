-- HeysMe 社区功能数据库表结构
-- 创建时间: 2025-01-27

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 用户身份页面表（增强版）
CREATE TABLE user_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 基础信息
  title VARCHAR(200) NOT NULL,
  description TEXT,
  content JSONB NOT NULL DEFAULT '{}',
  
  -- 分享相关
  is_shared_to_plaza BOOLEAN DEFAULT false,
  plaza_share_config JSONB DEFAULT '{}',
  
  -- 分类和标签
  category VARCHAR(50),
  tags TEXT[] DEFAULT '{}',
  industry_tags TEXT[] DEFAULT '{}',
  location VARCHAR(100),
  
  -- 隐私设置
  privacy_settings JSONB DEFAULT '{"allow_view": true, "allow_favorite": true, "show_username": false}',
  
  -- 统计信息
  view_count INTEGER DEFAULT 0,
  favorite_count INTEGER DEFAULT 0,
  
  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  shared_at TIMESTAMP WITH TIME ZONE
);

-- 敏感信息表（加密存储）
CREATE TABLE user_sensitive_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 个人信息（加密存储）
  real_name_encrypted TEXT,
  phone_encrypted TEXT,
  email_encrypted TEXT,
  id_number_encrypted TEXT,
  address_encrypted TEXT,
  
  -- 职业信息（加密存储）
  company_name_encrypted TEXT,
  project_details_encrypted JSONB,
  salary_info_encrypted JSONB,
  education_details_encrypted JSONB,
  work_history_encrypted JSONB,
  
  -- 元数据
  encryption_key_id VARCHAR(50),
  data_completeness_score INTEGER DEFAULT 0,
  last_verified_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- 模板表（增强版）
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_page_id UUID REFERENCES user_pages(id) ON DELETE SET NULL,
  
  -- 基础信息
  title VARCHAR(200) NOT NULL,
  description TEXT,
  
  -- 脱敏内容
  sanitized_content JSONB NOT NULL DEFAULT '{}',
  sanitized_prompt_history JSONB DEFAULT '[]',
  
  -- 分类和标签
  category VARCHAR(50),
  tags TEXT[] DEFAULT '{}',
  design_tags TEXT[] DEFAULT '{}',
  
  -- 统计信息
  fork_count INTEGER DEFAULT 0,
  use_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  
  -- 状态
  is_featured BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'published', -- published, pending, rejected
  
  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创作者认证表
CREATE TABLE creator_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 认证信息
  verification_type VARCHAR(50) NOT NULL, -- 'designer', 'developer', 'expert', 'company'
  verification_status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
  
  -- 认证材料
  portfolio_url TEXT,
  work_samples JSONB DEFAULT '[]',
  credentials JSONB DEFAULT '{}',
  social_links JSONB DEFAULT '{}',
  
  -- 认证结果
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES auth.users(id),
  verification_notes TEXT,
  
  -- 认证等级
  verification_level INTEGER DEFAULT 1, -- 1-5级认证
  specialties TEXT[] DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, verification_type)
);

-- 分享记录表
CREATE TABLE share_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  page_id UUID NOT NULL REFERENCES user_pages(id) ON DELETE CASCADE,
  
  share_type VARCHAR(20) NOT NULL, -- 'plaza', 'template', 'link'
  share_config JSONB DEFAULT '{}',
  
  -- 分享统计
  view_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 数据脱敏日志表
CREATE TABLE sanitization_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  
  original_fields JSONB DEFAULT '{}',
  sanitized_fields JSONB DEFAULT '{}',
  sanitization_rules JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fork关系表
CREATE TABLE template_forks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Fork后的修改
  customizations JSONB DEFAULT '{}',
  
  forked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(template_id, user_id)
);

-- 收藏表
CREATE TABLE user_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  target_type VARCHAR(20) NOT NULL, -- 'page' or 'template'
  target_id UUID NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, target_type, target_id)
);

-- 付费功能使用记录表
CREATE TABLE premium_feature_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  feature_type VARCHAR(50) NOT NULL, -- 'contact_info', 'detailed_profile', 'batch_export'
  target_user_id UUID REFERENCES auth.users(id),
  
  credits_consumed INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用户积分表
CREATE TABLE user_credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  total_credits INTEGER DEFAULT 0,
  used_credits INTEGER DEFAULT 0,
  available_credits INTEGER GENERATED ALWAYS AS (total_credits - used_credits) STORED,
  
  -- 积分来源记录
  credit_history JSONB DEFAULT '[]',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- 创建索引
CREATE INDEX idx_user_pages_user_id ON user_pages(user_id);
CREATE INDEX idx_user_pages_shared ON user_pages(is_shared_to_plaza) WHERE is_shared_to_plaza = true;
CREATE INDEX idx_user_pages_category ON user_pages(category);
CREATE INDEX idx_user_pages_location ON user_pages(location);
CREATE INDEX idx_user_pages_tags ON user_pages USING GIN(tags);
CREATE INDEX idx_user_pages_industry_tags ON user_pages USING GIN(industry_tags);
CREATE INDEX idx_user_pages_search ON user_pages USING GIN(to_tsvector('english', title || ' ' || COALESCE(description, '')));

CREATE INDEX idx_templates_creator ON templates(creator_id);
CREATE INDEX idx_templates_category ON templates(category);
CREATE INDEX idx_templates_status ON templates(status);
CREATE INDEX idx_templates_featured ON templates(is_featured) WHERE is_featured = true;
CREATE INDEX idx_templates_tags ON templates USING GIN(tags);
CREATE INDEX idx_templates_design_tags ON templates USING GIN(design_tags);
CREATE INDEX idx_templates_search ON templates USING GIN(to_tsvector('english', title || ' ' || COALESCE(description, '')));

CREATE INDEX idx_creator_verifications_user ON creator_verifications(user_id);
CREATE INDEX idx_creator_verifications_status ON creator_verifications(verification_status);
CREATE INDEX idx_creator_verifications_type ON creator_verifications(verification_type);

CREATE INDEX idx_share_records_user ON share_records(user_id);
CREATE INDEX idx_share_records_page ON share_records(page_id);
CREATE INDEX idx_share_records_type ON share_records(share_type);

CREATE INDEX idx_template_forks_template ON template_forks(template_id);
CREATE INDEX idx_template_forks_user ON template_forks(user_id);

CREATE INDEX idx_user_favorites_user ON user_favorites(user_id);
CREATE INDEX idx_user_favorites_target ON user_favorites(target_type, target_id);

CREATE INDEX idx_premium_usage_user ON premium_feature_usage(user_id);
CREATE INDEX idx_premium_usage_feature ON premium_feature_usage(feature_type);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_pages_updated_at BEFORE UPDATE ON user_pages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_creator_verifications_updated_at BEFORE UPDATE ON creator_verifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_sensitive_data_updated_at BEFORE UPDATE ON user_sensitive_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_credits_updated_at BEFORE UPDATE ON user_credits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 创建RLS策略
ALTER TABLE user_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sensitive_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_forks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_feature_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;

-- 用户页面访问策略
CREATE POLICY "Users can view their own pages" ON user_pages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own pages" ON user_pages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own pages" ON user_pages FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own pages" ON user_pages FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view shared pages" ON user_pages FOR SELECT USING (is_shared_to_plaza = true);

-- 敏感数据访问策略（仅用户本人可访问）
CREATE POLICY "Users can only access their own sensitive data" ON user_sensitive_data FOR ALL USING (auth.uid() = user_id);

-- 模板访问策略
CREATE POLICY "Users can view published templates" ON templates FOR SELECT USING (status = 'published');
CREATE POLICY "Users can manage their own templates" ON templates FOR ALL USING (auth.uid() = creator_id);

-- 其他表的基础访问策略
CREATE POLICY "Users can manage their own data" ON creator_verifications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own shares" ON share_records FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own forks" ON template_forks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own favorites" ON user_favorites FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own premium usage" ON premium_feature_usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own credits" ON user_credits FOR ALL USING (auth.uid() = user_id);

-- 创建视图用于统计
CREATE VIEW community_stats AS
SELECT 
  (SELECT COUNT(*) FROM user_pages WHERE is_shared_to_plaza = true) as total_shared_pages,
  (SELECT COUNT(*) FROM templates WHERE status = 'published') as total_templates,
  (SELECT COUNT(*) FROM creator_verifications WHERE verification_status = 'approved') as verified_creators,
  (SELECT COUNT(*) FROM template_forks) as total_forks;

COMMENT ON TABLE user_pages IS '用户身份页面表';
COMMENT ON TABLE user_sensitive_data IS '用户敏感信息表（加密存储）';
COMMENT ON TABLE templates IS '模板表';
COMMENT ON TABLE creator_verifications IS '创作者认证表';
COMMENT ON TABLE share_records IS '分享记录表';
COMMENT ON TABLE sanitization_logs IS '数据脱敏日志表';
COMMENT ON TABLE template_forks IS 'Fork关系表';
COMMENT ON TABLE user_favorites IS '收藏表';
COMMENT ON TABLE premium_feature_usage IS '付费功能使用记录表';
COMMENT ON TABLE user_credits IS '用户积分表'; 