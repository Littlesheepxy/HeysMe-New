# HeysMe 邀请码系统设置指南

## 📋 功能概述

HeysMe 邀请码系统是一个完整的内测用户管理解决方案，支持：

- 🎫 **邀请码生成与管理** - 灵活的邀请码创建和配置
- 🔐 **权限控制** - 不同邀请码授予不同的用户权限
- 📊 **使用统计** - 实时跟踪邀请码使用情况
- 👥 **用户注册限制** - 只有有效邀请码才能注册
- 🛡️ **安全验证** - 多重验证确保邀请码使用安全

## 🚀 安装步骤

### 1. 数据库设置

在 Supabase SQL Editor 中执行邀请码表结构：

```bash
# 在项目根目录执行
cd /path/to/HeysMe-New
```

然后在 Supabase Dashboard → SQL Editor 中执行：

```sql
-- 复制并执行 sql/invite-codes-schema-fixed.sql 中的所有内容
-- 注意：使用 invite-codes-schema-fixed.sql 而不是 invite-codes-schema.sql
-- 修复版已经解决了 PostgreSQL 数组语法错误
```

**重要提示**：
- 使用 `sql/invite-codes-schema-fixed.sql` 文件
- 该文件已修复了 PostgreSQL 数组语法错误（`ARRAY['admin']` 而不是 `'["admin"]'`）
- 自动添加了必要的 `metadata` 字段到 `users` 表

### 2. 环境变量配置

确保您的 `.env.local` 包含必要的环境变量：

```env
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Clerk 认证配置
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_WEBHOOK_SECRET=your_webhook_secret
```

### 3. 管理员权限设置

要访问邀请码管理功能，需要设置管理员用户：

1. 注册一个用户账户
2. 在 Supabase → Table Editor → users 表中，找到您的用户记录
3. 修改以下字段之一：
   ```sql
   -- 方式1：设置 plan 为 admin
   UPDATE users SET plan = 'admin' WHERE id = 'your_user_id';
   
   -- 方式2：添加 admin 项目权限
   UPDATE users SET projects = array_append(projects, 'admin') WHERE id = 'your_user_id';
   
   -- 方式3：在 metadata 中设置 role
   UPDATE users SET metadata = jsonb_set(metadata, '{role}', '"admin"') WHERE id = 'your_user_id';
   ```

### 4. 验证安装

1. 启动开发服务器：
   ```bash
   npm run dev
   ```

2. 访问管理员面板：
   ```
   http://localhost:3000/admin/invite-codes
   ```

3. 测试注册页面：
   ```
   http://localhost:3000/sign-up
   ```

## 🎯 使用方法

### 生成邀请码

1. 登录管理员账户
2. 访问 `/admin/invite-codes`
3. 点击"生成邀请码"按钮
4. 配置邀请码参数：
   - **名称**：邀请码用途描述
   - **数量**：一次生成多少个
   - **使用次数**：每个邀请码可使用几次
   - **过期时间**：可选的过期日期
   - **用户权限**：免费版/专业版等

### 用户注册流程

1. 用户访问 `/sign-up`
2. 输入邀请码并验证
3. 验证成功后显示注册表单
4. 完成注册自动应用邀请码权限

### 监控邀请码使用

在管理面板中可以：
- 查看所有邀请码列表
- 查看每个邀请码的使用详情
- 禁用或删除邀请码
- 查看注册用户信息

## 🔧 高级配置

### 权限配置

邀请码权限配置示例：

```typescript
const permissions = {
  plan: 'pro',                    // 账户类型
  features: [                     // 功能权限
    'chat',
    'page_creation',
    'template_access',
    'advanced_ai'
  ],
  projects: ['HeysMe'],           // 项目访问权限
  special_access: true,           // 特殊访问权限
  admin_access: false             // 管理员权限
}
```

### 批量管理

支持批量生成邀请码：

```typescript
// 生成100个相同配置的邀请码
const request = {
  name: '内测用户批量邀请',
  count: 100,
  maxUses: 1,
  permissions: {
    plan: 'free',
    features: ['chat', 'page_creation']
  }
}
```

### API 集成

如果需要在其他系统中集成，可以直接调用 API：

```javascript
// 验证邀请码
const verifyResponse = await fetch('/api/invite-codes/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ code: 'ABC12345' })
})

// 使用邀请码
const useResponse = await fetch('/api/invite-codes/use', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    code: 'ABC12345',
    email: 'user@example.com'
  })
})
```

## 🔒 安全考虑

### 防滥用措施

1. **IP 限制**：记录使用邀请码的 IP 地址
2. **邮箱唯一性**：同一邮箱不能重复使用邀请码
3. **使用次数限制**：每个邀请码有使用次数上限
4. **过期时间**：支持设置邀请码过期时间

### 权限验证

1. **管理员验证**：只有管理员可以生成/管理邀请码
2. **行级安全**：使用 Supabase RLS 确保数据安全
3. **API 权限**：所有敏感操作都需要认证

### 数据保护

1. **敏感信息脱敏**：公开 API 不返回敏感信息
2. **审计日志**：记录所有邀请码操作
3. **数据备份**：重要数据自动备份

## 🛠️ 故障排除

### 常见问题

1. **无法访问管理面板**
   - 检查用户是否有管理员权限
   - 确认数据库表已正确创建

2. **邀请码验证失败**
   - 检查邀请码格式是否正确
   - 确认邀请码未过期且有剩余使用次数

3. **注册后权限未生效**
   - 检查 Clerk Webhook 是否正确配置
   - 查看服务器日志确认权限应用过程

### 调试工具

1. **数据库查询**：
   ```sql
   -- 查看所有邀请码
   SELECT * FROM invite_codes ORDER BY created_at DESC;
   
   -- 查看使用记录
   SELECT * FROM invite_code_usages ORDER BY used_at DESC;
   ```

2. **API 测试**：
   使用 Postman 或 curl 测试 API 端点

3. **日志监控**：
   查看 Next.js 服务器日志了解详细错误信息

## 📚 API 文档

### 邀请码验证
- `POST /api/invite-codes/verify`
- 参数：`{ code: string }`
- 返回：邀请码有效性和权限信息

### 邀请码使用
- `POST /api/invite-codes/use`
- 参数：`{ code, email, userAgent?, ipAddress? }`
- 返回：使用结果和权限信息

### 管理员功能
- `POST /api/admin/invite-codes/generate` - 生成邀请码
- `GET /api/admin/invite-codes/generate` - 获取邀请码列表
- `GET /api/admin/invite-codes/[id]` - 获取邀请码详情
- `PATCH /api/admin/invite-codes/[id]` - 更新邀请码
- `DELETE /api/admin/invite-codes/[id]` - 删除邀请码

## 🎉 完成

现在您已经成功设置了 HeysMe 邀请码系统！用户需要有效的邀请码才能注册，您可以通过管理面板灵活控制用户访问权限。

如果遇到问题，请检查：
1. 数据库表是否正确创建
2. 环境变量是否正确配置
3. 管理员权限是否正确设置
4. Clerk Webhook 是否正常工作
