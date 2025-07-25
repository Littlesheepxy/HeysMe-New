# 环境变量设置指南

## 问题描述
您遇到的 "Missing Supabase environment variables" 错误是因为缺少必需的环境变量配置。

## 解决方案

### 1. 创建环境变量文件
在项目根目录创建 `.env.local` 文件：

```bash
cp env.template .env.local
```

### 2. 配置 Supabase 环境变量

#### 2.1 创建 Supabase 项目
1. 访问 [https://supabase.com](https://supabase.com)
2. 注册或登录账户
3. 创建新项目
4. 等待项目初始化完成

#### 2.2 获取 Supabase 配置
在 Supabase 项目仪表板中：

1. **项目 URL** (`NEXT_PUBLIC_SUPABASE_URL`)
   - 路径：Project Settings → API
   - 复制 "Project URL"

2. **匿名密钥** (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - 路径：Project Settings → API
   - 复制 "anon public" 密钥

3. **服务角色密钥** (`SUPABASE_SERVICE_ROLE_KEY`)
   - 路径：Project Settings → API
   - 复制 "service_role" 密钥
   - ⚠️ 注意：此密钥拥有完整数据库权限，请妥善保管

### 3. 配置 Clerk 身份验证（可选）

如果您需要用户身份验证功能：

#### 3.1 创建 Clerk 应用
1. 访问 [https://clerk.com](https://clerk.com)
2. 注册或登录账户
3. 创建新应用

#### 3.2 获取 Clerk 配置
在 Clerk 仪表板中：

1. **发布密钥** (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`)
   - 路径：API Keys
   - 复制 "Publishable key"

2. **密钥** (`CLERK_SECRET_KEY`)
   - 路径：API Keys
   - 复制 "Secret key"

3. **Webhook 密钥** (`CLERK_WEBHOOK_SECRET`)
   - 路径：Webhooks → Add Endpoint
   - 配置 webhook 后获取密钥

### 4. 示例配置文件

```env
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Clerk 身份验证配置（可选）
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_abcd1234...
CLERK_SECRET_KEY=sk_test_abcd1234...
CLERK_WEBHOOK_SECRET=whsec_abcd1234...

# Next.js 配置
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. 验证配置

配置完成后，重启开发服务器：

```bash
npm run dev
```

如果配置正确，错误应该消失。

## 安全注意事项

1. **永远不要提交** `.env.local` 文件到版本控制
2. **服务角色密钥** 拥有完整数据库权限，仅在服务器端使用
3. **定期轮换** API 密钥
4. **生产环境** 使用环境变量或密钥管理服务

## 故障排除

### 常见问题

1. **环境变量不生效**
   - 确保文件名为 `.env.local`
   - 重启开发服务器
   - 检查变量名拼写

2. **Supabase 连接失败**
   - 验证项目 URL 格式
   - 确认密钥有效性
   - 检查网络连接

3. **权限错误**
   - 确认使用正确的密钥类型
   - 检查 RLS（行级安全）策略

如果仍有问题，请检查浏览器控制台和服务器日志获取详细错误信息。 