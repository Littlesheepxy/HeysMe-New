-- HeysMe 项目数据库表结构
-- 基于现有的 users 表扩展

-- 1. 扩展 users 表，添加 HeysMe 需要的字段
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS username text UNIQUE,
ADD COLUMN IF NOT EXISTS full_name text,
ADD COLUMN IF NOT EXISTS projects text[] DEFAULT '{HeysMe}',
ADD COLUMN IF NOT EXISTS plan text DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
ADD COLUMN IF NOT EXISTS default_model text DEFAULT 'claude-sonnet-4-20250514';

-- 2. 创建页面表
CREATE TABLE public.pages (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id text NOT NULL,
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  theme text DEFAULT 'zen' CHECK (theme IN ('zen', 'creative', 'devgrid', 'minimal', 'bold')),
  layout text DEFAULT 'stack' CHECK (layout IN ('hero', 'twocol', 'stack', 'grid')),
  visibility text DEFAULT 'private' CHECK (visibility IN ('public', 'private', 'unlisted')),
  is_featured boolean DEFAULT false,
  content jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT pages_pkey PRIMARY KEY (id),
  CONSTRAINT pages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- 3. 创建页面模块表
CREATE TABLE public.page_blocks (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  page_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('hero', 'project', 'skill', 'link', 'about', 'contact', 'recruit', 'custom')),
  data jsonb NOT NULL DEFAULT '{}',
  position integer NOT NULL DEFAULT 0,
  is_visible boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT page_blocks_pkey PRIMARY KEY (id),
  CONSTRAINT page_blocks_page_id_fkey FOREIGN KEY (page_id) REFERENCES public.pages(id) ON DELETE CASCADE
);

-- 4. 创建页面分享表
CREATE TABLE public.page_shares (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  page_id uuid NOT NULL,
  user_id text NOT NULL,
  short_code varchar(10) UNIQUE NOT NULL,
  password varchar(255) NULL,
  expires_at timestamp with time zone NULL,
  allowed_viewers text[] NULL,
  enable_analytics boolean DEFAULT true,
  view_count integer DEFAULT 0,
  last_accessed_at timestamp with time zone NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT page_shares_pkey PRIMARY KEY (id),
  CONSTRAINT page_shares_page_id_fkey FOREIGN KEY (page_id) REFERENCES public.pages(id) ON DELETE CASCADE,
  CONSTRAINT page_shares_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- 5. 创建分享访问统计表
CREATE TABLE public.page_share_analytics (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  share_id uuid NOT NULL,
  visitor_ip varchar(45) NULL,
  user_agent text NULL,
  referer text NULL,
  visited_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT page_share_analytics_pkey PRIMARY KEY (id),
  CONSTRAINT page_share_analytics_share_id_fkey FOREIGN KEY (share_id) REFERENCES public.page_shares(id) ON DELETE CASCADE
);

-- 6. 创建页面构建表
CREATE TABLE public.page_builds (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  page_id uuid NOT NULL,
  user_id text NOT NULL,
  status varchar(20) DEFAULT 'pending' CHECK (status IN ('pending', 'building', 'completed', 'failed')),
  build_options jsonb DEFAULT '{}',
  deploy_url text NULL,
  build_logs text[] DEFAULT '{}',
  error_message text NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  completed_at timestamp with time zone NULL,
  CONSTRAINT page_builds_pkey PRIMARY KEY (id),
  CONSTRAINT page_builds_page_id_fkey FOREIGN KEY (page_id) REFERENCES public.pages(id) ON DELETE CASCADE,
  CONSTRAINT page_builds_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- 7. 创建索引以提高查询性能
-- 页面表索引
CREATE INDEX idx_pages_user_id ON public.pages(user_id);
CREATE INDEX idx_pages_slug ON public.pages(slug);
CREATE INDEX idx_pages_visibility ON public.pages(visibility);
CREATE INDEX idx_pages_created_at ON public.pages(created_at);

-- 页面模块表索引
CREATE INDEX idx_page_blocks_page_id ON public.page_blocks(page_id);
CREATE INDEX idx_page_blocks_type ON public.page_blocks(type);
CREATE INDEX idx_page_blocks_position ON public.page_blocks(page_id, position);

-- 分享表索引
CREATE INDEX idx_page_shares_short_code ON public.page_shares(short_code);
CREATE INDEX idx_page_shares_page_id ON public.page_shares(page_id);
CREATE INDEX idx_page_shares_user_id ON public.page_shares(user_id);

-- 分享统计表索引
CREATE INDEX idx_page_share_analytics_share_id ON public.page_share_analytics(share_id);
CREATE INDEX idx_page_share_analytics_visited_at ON public.page_share_analytics(visited_at);

-- 构建表索引
CREATE INDEX idx_page_builds_page_id ON public.page_builds(page_id);
CREATE INDEX idx_page_builds_user_id ON public.page_builds(user_id);
CREATE INDEX idx_page_builds_status ON public.page_builds(status);
CREATE INDEX idx_page_builds_created_at ON public.page_builds(created_at);

-- 8. 创建更新时间触发器函数（如果不存在）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 9. 为需要的表添加更新时间触发器
CREATE TRIGGER update_pages_updated_at 
  BEFORE UPDATE ON public.pages 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_page_blocks_updated_at 
  BEFORE UPDATE ON public.page_blocks 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_page_shares_updated_at 
  BEFORE UPDATE ON public.page_shares 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_page_builds_updated_at 
  BEFORE UPDATE ON public.page_builds 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. 行级安全策略 (RLS)
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_share_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_builds ENABLE ROW LEVEL SECURITY;

-- 页面表策略
CREATE POLICY "用户可以访问自己的页面" ON public.pages
  FOR ALL USING (user_id = auth.uid()::text);

CREATE POLICY "公开页面可被所有人查看" ON public.pages
  FOR SELECT USING (visibility = 'public');

-- 页面模块表策略
CREATE POLICY "用户可以管理自己页面的模块" ON public.page_blocks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.pages 
      WHERE pages.id = page_blocks.page_id 
      AND pages.user_id = auth.uid()::text
    )
  );

CREATE POLICY "公开页面的模块可被查看" ON public.page_blocks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.pages 
      WHERE pages.id = page_blocks.page_id 
      AND pages.visibility = 'public'
    )
  );

-- 分享表策略
CREATE POLICY "用户可以管理自己的分享" ON public.page_shares
  FOR ALL USING (user_id = auth.uid()::text);

-- 分享统计表策略
CREATE POLICY "分享统计可被插入" ON public.page_share_analytics
  FOR INSERT WITH CHECK (true);

CREATE POLICY "用户可以查看自己分享的统计" ON public.page_share_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.page_shares 
      WHERE page_shares.id = page_share_analytics.share_id 
      AND page_shares.user_id = auth.uid()::text
    )
  );

-- 构建表策略
CREATE POLICY "用户可以管理自己的构建" ON public.page_builds
  FOR ALL USING (user_id = auth.uid()::text); 