-- 修复 users 表的 plan 字段约束，允许 admin 计划
-- 这个脚本将删除旧约束并创建新的约束

-- 1. 删除现有的 plan 检查约束
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_plan_check;

-- 2. 创建新的 plan 检查约束，包含 admin
ALTER TABLE public.users ADD CONSTRAINT users_plan_check 
CHECK (plan = ANY (ARRAY['free'::text, 'pro'::text, 'admin'::text]));

-- 3. 验证约束
SELECT conname, pg_get_constraintdef(oid) as definition 
FROM pg_constraint 
WHERE conname = 'users_plan_check' AND conrelid = 'users'::regclass;

-- 4. 现在可以安全地设置 admin 计划
-- UPDATE users SET plan = 'admin' WHERE id = 'user_2xnasVlkxajkwjF2d4JXl8tOQBI';
