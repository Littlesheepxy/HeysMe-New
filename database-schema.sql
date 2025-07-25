-- 页面分享表
CREATE TABLE page_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id UUID REFERENCES pages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  short_code VARCHAR(10) UNIQUE NOT NULL,
  password VARCHAR(255) NULL,
  expires_at TIMESTAMP WITH TIME ZONE NULL,
  allowed_viewers TEXT[] NULL,
  enable_analytics BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 分享访问统计表
CREATE TABLE page_share_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  share_id UUID REFERENCES page_shares(id) ON DELETE CASCADE,
  visitor_ip VARCHAR(45) NULL,
  user_agent TEXT NULL,
  referer TEXT NULL,
  visited_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 为分享码创建索引
CREATE INDEX idx_page_shares_short_code ON page_shares(short_code);
CREATE INDEX idx_page_shares_page_id ON page_shares(page_id);
CREATE INDEX idx_page_shares_user_id ON page_shares(user_id);
CREATE INDEX idx_page_share_analytics_share_id ON page_share_analytics(share_id);
CREATE INDEX idx_page_share_analytics_visited_at ON page_share_analytics(visited_at);

-- 更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_page_shares_updated_at 
  BEFORE UPDATE ON page_shares 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 页面构建表
CREATE TABLE page_builds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id UUID REFERENCES pages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'building', 'completed', 'failed')),
  build_options JSONB DEFAULT '{}',
  deploy_url TEXT NULL,
  build_logs TEXT[] DEFAULT '{}',
  error_message TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE NULL
);

-- 构建表索引
CREATE INDEX idx_page_builds_page_id ON page_builds(page_id);
CREATE INDEX idx_page_builds_user_id ON page_builds(user_id);
CREATE INDEX idx_page_builds_status ON page_builds(status);
CREATE INDEX idx_page_builds_created_at ON page_builds(created_at);

-- 构建表更新时间触发器
CREATE TRIGGER update_page_builds_updated_at 
  BEFORE UPDATE ON page_builds 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 页面表添加可见性字段（如果还没有）
ALTER TABLE pages ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) DEFAULT 'private' CHECK (visibility IN ('public', 'private', 'unlisted'));
ALTER TABLE pages ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false; 