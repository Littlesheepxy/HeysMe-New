-- 🚀 项目文件存储和版本控制系统
-- 基于Supabase实现类似Git的文件管理

-- 1. 项目表 (类似Git仓库)
CREATE TABLE public.projects (
  id TEXT PRIMARY KEY, -- 项目ID，格式: proj_timestamp_randomstring
  user_id TEXT NOT NULL,
  session_id TEXT NOT NULL, -- 关联到chat_sessions
  
  -- 项目基本信息
  name TEXT NOT NULL,
  description TEXT,
  framework TEXT DEFAULT 'next.js', -- next.js, react, vue, etc.
  template TEXT, -- 使用的模板
  
  -- 状态信息
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  
  -- 部署信息
  deployment_url TEXT, -- Vercel部署URL
  deployment_status TEXT DEFAULT 'none' CHECK (deployment_status IN ('none', 'pending', 'deployed', 'failed')),
  last_deployed_at TIMESTAMPTZ,
  
  -- 统计信息
  total_files INTEGER DEFAULT 0,
  total_commits INTEGER DEFAULT 0,
  latest_commit_id TEXT,
  
  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 外键约束
  CONSTRAINT fk_project_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_project_session FOREIGN KEY (session_id) REFERENCES public.chat_sessions(id) ON DELETE CASCADE
);

-- 2. 提交表 (类似Git commits)
CREATE TABLE public.project_commits (
  id TEXT PRIMARY KEY, -- 提交ID，格式: commit_timestamp_hash
  project_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  
  -- 提交信息
  message TEXT NOT NULL, -- 提交消息
  type TEXT DEFAULT 'manual' CHECK (type IN ('initial', 'manual', 'auto', 'ai_edit')), -- 提交类型
  
  -- 变更统计
  files_added INTEGER DEFAULT 0,
  files_modified INTEGER DEFAULT 0,
  files_deleted INTEGER DEFAULT 0,
  
  -- 父提交（用于分支合并）
  parent_commit_id TEXT,
  
  -- AI相关信息
  ai_agent TEXT, -- 执行修改的AI代理
  user_prompt TEXT, -- 用户的修改请求
  
  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 外键约束
  CONSTRAINT fk_commit_project FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_commit_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_commit_parent FOREIGN KEY (parent_commit_id) REFERENCES public.project_commits(id) ON DELETE SET NULL
);

-- 3. 文件表 (类似Git文件系统)
CREATE TABLE public.project_files (
  id TEXT PRIMARY KEY, -- 文件ID，格式: file_timestamp_hash
  project_id TEXT NOT NULL,
  commit_id TEXT NOT NULL,
  
  -- 文件信息
  filename TEXT NOT NULL, -- 相对路径，如: app/page.tsx
  file_type TEXT NOT NULL, -- page, component, config, styles, etc.
  language TEXT NOT NULL, -- typescript, javascript, css, json, etc.
  mime_type TEXT,
  
  -- 文件内容
  content TEXT NOT NULL, -- 文件完整内容
  content_hash TEXT NOT NULL, -- 内容SHA256哈希，用于去重
  file_size INTEGER NOT NULL, -- 文件大小（字节）
  
  -- 存储信息
  storage_path TEXT, -- Supabase Storage中的路径（可选，用于大文件）
  storage_bucket TEXT DEFAULT 'project-files',
  
  -- 变更信息
  change_type TEXT DEFAULT 'added' CHECK (change_type IN ('added', 'modified', 'deleted', 'renamed')),
  previous_file_id TEXT, -- 指向上一个版本的文件
  
  -- 统计信息
  line_count INTEGER DEFAULT 0,
  
  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 外键约束
  CONSTRAINT fk_file_project FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_file_commit FOREIGN KEY (commit_id) REFERENCES public.project_commits(id) ON DELETE CASCADE,
  CONSTRAINT fk_file_previous FOREIGN KEY (previous_file_id) REFERENCES public.project_files(id) ON DELETE SET NULL
);

-- 4. 文件变更记录表 (类似Git diff)
CREATE TABLE public.file_changes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  commit_id TEXT NOT NULL,
  file_id TEXT NOT NULL,
  
  -- 变更详情
  change_type TEXT NOT NULL CHECK (change_type IN ('line_added', 'line_removed', 'line_modified')),
  line_number INTEGER,
  old_content TEXT, -- 原始内容
  new_content TEXT, -- 新内容
  
  -- 上下文
  context_before TEXT, -- 变更前的上下文
  context_after TEXT, -- 变更后的上下文
  
  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 外键约束
  CONSTRAINT fk_change_commit FOREIGN KEY (commit_id) REFERENCES public.project_commits(id) ON DELETE CASCADE,
  CONSTRAINT fk_change_file FOREIGN KEY (file_id) REFERENCES public.project_files(id) ON DELETE CASCADE
);

-- 5. 项目分支表 (扩展功能)
CREATE TABLE public.project_branches (
  id TEXT PRIMARY KEY, -- 分支ID
  project_id TEXT NOT NULL,
  name TEXT NOT NULL, -- 分支名称
  head_commit_id TEXT NOT NULL, -- 当前提交
  
  -- 分支信息
  description TEXT,
  is_main BOOLEAN DEFAULT FALSE, -- 是否为主分支
  
  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 外键约束
  CONSTRAINT fk_branch_project FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_branch_commit FOREIGN KEY (head_commit_id) REFERENCES public.project_commits(id) ON DELETE RESTRICT,
  
  -- 唯一约束
  UNIQUE(project_id, name)
);

-- 6. 创建索引以提高查询性能
-- 项目表索引
CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_projects_session_id ON public.projects(session_id);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_projects_created_at ON public.projects(created_at);

-- 提交表索引
CREATE INDEX idx_commits_project_id ON public.project_commits(project_id);
CREATE INDEX idx_commits_user_id ON public.project_commits(user_id);
CREATE INDEX idx_commits_parent ON public.project_commits(parent_commit_id);
CREATE INDEX idx_commits_created_at ON public.project_commits(created_at);

-- 文件表索引
CREATE INDEX idx_files_project_id ON public.project_files(project_id);
CREATE INDEX idx_files_commit_id ON public.project_files(commit_id);
CREATE INDEX idx_files_filename ON public.project_files(filename);
CREATE INDEX idx_files_content_hash ON public.project_files(content_hash); -- 用于去重
CREATE INDEX idx_files_change_type ON public.project_files(change_type);

-- 变更记录索引
CREATE INDEX idx_changes_commit_id ON public.file_changes(commit_id);
CREATE INDEX idx_changes_file_id ON public.file_changes(file_id);

-- 分支表索引
CREATE INDEX idx_branches_project_id ON public.project_branches(project_id);
CREATE INDEX idx_branches_head_commit ON public.project_branches(head_commit_id);

-- 7. 触发器 - 自动更新统计信息
CREATE OR REPLACE FUNCTION update_project_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- 更新项目的文件统计
  UPDATE public.projects SET
    total_files = (
      SELECT COUNT(DISTINCT filename) 
      FROM public.project_files 
      WHERE project_id = NEW.project_id 
        AND change_type != 'deleted'
    ),
    total_commits = (
      SELECT COUNT(*) 
      FROM public.project_commits 
      WHERE project_id = NEW.project_id
    ),
    latest_commit_id = NEW.id,
    updated_at = NOW()
  WHERE id = NEW.project_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 应用触发器
CREATE TRIGGER trigger_update_project_stats
  AFTER INSERT ON public.project_commits
  FOR EACH ROW EXECUTE FUNCTION update_project_stats();

-- 8. 行级安全策略 (RLS)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_commits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_branches ENABLE ROW LEVEL SECURITY;

-- 项目访问策略
CREATE POLICY "用户可以访问自己的项目" ON public.projects
  FOR ALL USING (user_id = auth.uid()::text);

-- 提交访问策略
CREATE POLICY "用户可以访问自己项目的提交" ON public.project_commits
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = project_commits.project_id 
      AND projects.user_id = auth.uid()::text
    )
  );

-- 文件访问策略
CREATE POLICY "用户可以访问自己项目的文件" ON public.project_files
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = project_files.project_id 
      AND projects.user_id = auth.uid()::text
    )
  );

-- 变更记录访问策略
CREATE POLICY "用户可以访问自己项目的变更记录" ON public.file_changes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.project_commits pc
      JOIN public.projects p ON p.id = pc.project_id
      WHERE pc.id = file_changes.commit_id 
      AND p.user_id = auth.uid()::text
    )
  );

-- 分支访问策略
CREATE POLICY "用户可以访问自己项目的分支" ON public.project_branches
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = project_branches.project_id 
      AND projects.user_id = auth.uid()::text
    )
  );

-- 9. 有用的视图和函数

-- 项目概览视图
CREATE VIEW public.project_overview AS
SELECT 
  p.id,
  p.name,
  p.description,
  p.framework,
  p.status,
  p.deployment_url,
  p.deployment_status,
  p.total_files,
  p.total_commits,
  p.created_at,
  p.updated_at,
  pc.message as latest_commit_message,
  pc.created_at as latest_commit_at,
  cs.metadata->'title' as session_title
FROM public.projects p
LEFT JOIN public.project_commits pc ON p.latest_commit_id = pc.id
LEFT JOIN public.chat_sessions cs ON p.session_id = cs.id;

-- 获取项目最新文件列表的函数
CREATE OR REPLACE FUNCTION get_project_files(project_id_param TEXT)
RETURNS jsonb AS $$
DECLARE
  files_json jsonb;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', pf.id,
      'filename', pf.filename,
      'content', pf.content,
      'language', pf.language,
      'file_type', pf.file_type,
      'file_size', pf.file_size,
      'change_type', pf.change_type,
      'created_at', pf.created_at
    )
    ORDER BY pf.filename
  ) INTO files_json
  FROM public.project_files pf
  WHERE pf.project_id = project_id_param
    AND pf.commit_id = (
      SELECT latest_commit_id 
      FROM public.projects 
      WHERE id = project_id_param
    )
    AND pf.change_type != 'deleted';
  
  RETURN COALESCE(files_json, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建新提交的函数
CREATE OR REPLACE FUNCTION create_commit(
  project_id_param TEXT,
  user_id_param TEXT,
  message_param TEXT,
  files_param jsonb,
  commit_type_param TEXT DEFAULT 'manual',
  ai_agent_param TEXT DEFAULT NULL,
  user_prompt_param TEXT DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
  commit_id TEXT;
  file_record jsonb;
  new_file_id TEXT;
  var_files_added INTEGER := 0;
  var_files_modified INTEGER := 0;
  var_files_deleted INTEGER := 0;
  current_hash TEXT;
BEGIN
  -- 生成提交ID
  commit_id := 'commit_' || extract(epoch from now())::text || '_' || substr(md5(random()::text), 1, 8);
  
  -- 创建提交记录
  INSERT INTO public.project_commits (
    id, project_id, user_id, message, type, ai_agent, user_prompt, created_at
  ) VALUES (
    commit_id, project_id_param, user_id_param, message_param, 
    commit_type_param, ai_agent_param, user_prompt_param, NOW()
  );
  
  -- 处理文件变更
  FOR file_record IN SELECT * FROM jsonb_array_elements(files_param) LOOP
    -- 生成文件ID和内容哈希
    new_file_id := 'file_' || extract(epoch from now())::text || '_' || substr(md5(random()::text), 1, 8);
    current_hash := encode(sha256((file_record->>'content')::bytea), 'hex');
    
    -- 插入文件记录
    INSERT INTO public.project_files (
      id, project_id, commit_id, filename, file_type, language,
      content, content_hash, file_size, change_type, line_count, created_at
    ) VALUES (
      new_file_id,
      project_id_param,
      commit_id,
      file_record->>'filename',
      COALESCE(file_record->>'file_type', 'component'),
      COALESCE(file_record->>'language', 'typescript'),
      file_record->>'content',
      current_hash,
      length(file_record->>'content'),
      COALESCE(file_record->>'change_type', 'added'),
      array_length(string_to_array(file_record->>'content', E'\n'), 1),
      NOW()
    );
    
    -- 统计变更
    CASE file_record->>'change_type'
      WHEN 'added' THEN var_files_added := var_files_added + 1;
      WHEN 'modified' THEN var_files_modified := var_files_modified + 1;
      WHEN 'deleted' THEN var_files_deleted := var_files_deleted + 1;
    END CASE;
  END LOOP;
  
  -- 更新提交统计 (使用局部变量值)
  UPDATE public.project_commits 
  SET files_added = var_files_added,
      files_modified = var_files_modified,
      files_deleted = var_files_deleted
  WHERE id = commit_id;
  
  RETURN commit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
