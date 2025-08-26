-- HeysMe 邀请码系统数据库表结构
-- 创建时间: 2025-01-27

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 邀请码表
CREATE TABLE public.invite_codes (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  
  -- 邀请码信息
  code varchar(20) UNIQUE NOT NULL, -- 邀请码（8-20位字符）
  name varchar(100), -- 邀请码名称/描述
  
  -- 创建者信息
  created_by text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  
  -- 使用限制
  max_uses integer DEFAULT 1, -- 最大使用次数，null表示无限制
  current_uses integer DEFAULT 0, -- 当前使用次数
  expires_at timestamp with time zone, -- 过期时间，null表示永不过期
  
  -- 权限配置
  permissions jsonb DEFAULT '{
    "plan": "free",
    "features": ["chat", "page_creation"],
    "projects": ["HeysMe"],
    "special_access": false,
    "admin_access": false
  }', -- 邀请码权限配置
  
  -- 状态
  is_active boolean DEFAULT true, -- 是否激活
  
  -- 元数据
  metadata jsonb DEFAULT '{}', -- 额外的元数据（如来源、批次等）
  
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  
  CONSTRAINT invite_codes_pkey PRIMARY KEY (id)
);

-- 邀请码使用记录表
CREATE TABLE public.invite_code_usages (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  
  -- 关联信息
  invite_code_id uuid NOT NULL REFERENCES public.invite_codes(id) ON DELETE CASCADE,
  code varchar(20) NOT NULL, -- 冗余存储，便于查询
  user_id text REFERENCES public.users(id) ON DELETE SET NULL, -- 使用者ID
  
  -- 使用信息
  email varchar(255), -- 注册时的邮箱（即使后续用户被删除也保留）
  ip_address inet, -- 使用时的IP地址
  user_agent text, -- 用户代理信息
  
  -- 时间戳
  used_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  
  -- 额外信息
  metadata jsonb DEFAULT '{}', -- 使用时的额外信息
  
  CONSTRAINT invite_code_usages_pkey PRIMARY KEY (id)
);

-- 邀请码批次表（用于批量管理）
CREATE TABLE public.invite_code_batches (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  
  -- 批次信息
  name varchar(200) NOT NULL, -- 批次名称
  description text, -- 批次描述
  
  -- 创建者
  created_by text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  
  -- 批次配置
  total_codes integer NOT NULL, -- 批次中的邀请码总数
  code_prefix varchar(10), -- 邀请码前缀
  default_permissions jsonb DEFAULT '{
    "plan": "free",
    "features": ["chat", "page_creation"],
    "projects": ["HeysMe"]
  }', -- 默认权限配置
  default_max_uses integer DEFAULT 1, -- 默认最大使用次数
  default_expires_at timestamp with time zone, -- 默认过期时间
  
  -- 状态
  is_active boolean DEFAULT true,
  
  -- 统计信息
  generated_codes integer DEFAULT 0, -- 已生成的邀请码数量
  total_uses integer DEFAULT 0, -- 总使用次数
  
  -- 元数据
  metadata jsonb DEFAULT '{}',
  
  CONSTRAINT invite_code_batches_pkey PRIMARY KEY (id)
);

-- 添加批次关联到邀请码表
ALTER TABLE public.invite_codes 
ADD COLUMN batch_id uuid REFERENCES public.invite_code_batches(id) ON DELETE SET NULL;

-- 创建索引
CREATE INDEX idx_invite_codes_code ON public.invite_codes(code);
CREATE INDEX idx_invite_codes_created_by ON public.invite_codes(created_by);
CREATE INDEX idx_invite_codes_expires_at ON public.invite_codes(expires_at);
CREATE INDEX idx_invite_codes_is_active ON public.invite_codes(is_active);

CREATE INDEX idx_invite_code_usages_invite_code_id ON public.invite_code_usages(invite_code_id);
CREATE INDEX idx_invite_code_usages_user_id ON public.invite_code_usages(user_id);
CREATE INDEX idx_invite_code_usages_email ON public.invite_code_usages(email);
CREATE INDEX idx_invite_code_usages_used_at ON public.invite_code_usages(used_at);

CREATE INDEX idx_invite_code_batches_created_by ON public.invite_code_batches(created_by);
CREATE INDEX idx_invite_code_batches_is_active ON public.invite_code_batches(is_active);

-- 创建触发器：自动更新时间戳
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_invite_codes_updated_at BEFORE UPDATE ON public.invite_codes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 创建触发器：更新邀请码使用统计
CREATE OR REPLACE FUNCTION update_invite_code_usage_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- 更新邀请码的使用次数
  UPDATE public.invite_codes 
  SET current_uses = current_uses + 1
  WHERE id = NEW.invite_code_id;
  
  -- 更新批次的使用统计
  UPDATE public.invite_code_batches 
  SET total_uses = total_uses + 1
  WHERE id = (
    SELECT batch_id 
    FROM public.invite_codes 
    WHERE id = NEW.invite_code_id
  );
  
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_invite_code_usage_stats_trigger 
  AFTER INSERT ON public.invite_code_usages
  FOR EACH ROW EXECUTE FUNCTION update_invite_code_usage_stats();

-- RLS 策略（行级安全）
ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invite_code_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invite_code_batches ENABLE ROW LEVEL SECURITY;

-- 管理员可以看到所有邀请码
CREATE POLICY invite_codes_admin_policy ON public.invite_codes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid()::text 
      AND (
        plan = 'admin' OR 
        (metadata->>'role')::text = 'admin' OR
        projects @> ARRAY['admin']
      )
    )
  );

-- 创建者可以看到自己创建的邀请码
CREATE POLICY invite_codes_creator_policy ON public.invite_codes
  FOR ALL USING (created_by = auth.uid()::text);

-- 所有认证用户可以查看邀请码（用于验证），但不能看到敏感信息
CREATE POLICY invite_codes_public_read_policy ON public.invite_codes
  FOR SELECT USING (
    is_active = true AND 
    (expires_at IS NULL OR expires_at > now()) AND
    (max_uses IS NULL OR current_uses < max_uses)
  );

-- 邀请码使用记录的访问策略
CREATE POLICY invite_code_usages_admin_policy ON public.invite_code_usages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid()::text 
      AND (
        plan = 'admin' OR 
        (metadata->>'role')::text = 'admin' OR
        projects @> ARRAY['admin']
      )
    )
  );

-- 用户可以查看自己的使用记录
CREATE POLICY invite_code_usages_user_policy ON public.invite_code_usages
  FOR SELECT USING (user_id = auth.uid()::text);

-- 批次访问策略
CREATE POLICY invite_code_batches_admin_policy ON public.invite_code_batches
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid()::text 
      AND (
        plan = 'admin' OR 
        (metadata->>'role')::text = 'admin' OR
        projects @> ARRAY['admin']
      )
    )
  );

-- 创建者可以看到自己创建的批次
CREATE POLICY invite_code_batches_creator_policy ON public.invite_code_batches
  FOR ALL USING (created_by = auth.uid()::text);

-- 添加注释
COMMENT ON TABLE public.invite_codes IS '邀请码表：存储系统的邀请码信息';
COMMENT ON TABLE public.invite_code_usages IS '邀请码使用记录表：跟踪邀请码的使用情况';
COMMENT ON TABLE public.invite_code_batches IS '邀请码批次表：用于批量管理邀请码';

COMMENT ON COLUMN public.invite_codes.permissions IS '邀请码权限配置：定义使用该邀请码注册的用户可获得的权限';
COMMENT ON COLUMN public.invite_codes.metadata IS '邀请码元数据：存储额外的配置信息，如来源标识、特殊标签等';
COMMENT ON COLUMN public.invite_code_usages.metadata IS '使用记录元数据：存储使用时的额外信息，如注册来源、设备信息等';
