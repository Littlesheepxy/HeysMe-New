# 🔗 Clerk Webhook 设置指南

## 📋 概述
配置 Clerk webhook 将用户注册/更新事件自动同步到 Supabase 数据库。

## 🛠️ 设置步骤

### 1. **获取 Webhook 端点 URL**

在开发环境中，你需要使用工具暴露本地端点：

#### 方法A: 使用 ngrok（推荐）
```bash
# 安装 ngrok (如果未安装)
brew install ngrok

# 启动 ngrok 隧道
ngrok http 3000

# 你会看到类似这样的输出:
# Forwarding https://abc123.ngrok.io -> http://localhost:3000
```

你的 webhook URL 将是: `https://abc123.ngrok.io/api/webhooks/clerk`

#### 方法B: 使用 Vercel（生产环境）
如果已部署到 Vercel: `https://your-app.vercel.app/api/webhooks/clerk`

### 2. **配置 Clerk Dashboard**

1. **访问 Clerk Dashboard**
   - 打开 [https://dashboard.clerk.com](https://dashboard.clerk.com)
   - 选择你的应用

2. **导航到 Webhooks**
   - 在左侧菜单点击 **"Webhooks"**
   - 点击 **"Add Endpoint"**

3. **配置 Webhook 端点**
   ```
   Endpoint URL: https://abc123.ngrok.io/api/webhooks/clerk
   Description: Supabase User Sync
   ```

4. **选择事件类型**
   勾选以下事件：
   - ✅ `user.created` - 用户注册时同步到数据库
   - ✅ `user.updated` - 用户信息更新时同步
   - ✅ `user.deleted` - 用户删除时软删除

5. **保存配置**
   - 点击 **"Create"**
   - 复制生成的 **Signing Secret**

### 3. **配置环境变量**

在 `.env.local` 文件中添加 Clerk Webhook Secret：

```bash
# Clerk Webhook
CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx

# 邀请码强制验证 (默认为 true，设为 false 可跳过邀请码验证)
REQUIRE_INVITE_CODE=true
```

### 4. **验证 Webhook 配置**

#### 测试方法1: 创建新用户
1. 访问 `http://localhost:3000/sign-up`
2. 使用新的 Google 账户注册
3. 检查终端日志，应该看到：
   ```
   🔔 [Webhook] 处理事件: user.created, 用户ID: user_xxx
   👤 [Webhook] 处理用户创建: user_xxx
   ✅ [Webhook] 用户创建成功: user_xxx
   ```

#### 测试方法2: 检查数据库
访问 Supabase → Table Editor → users 表，应该看到新创建的用户。

#### 测试方法3: 使用调试页面
访问 `http://localhost:3000/debug-admin` 应该显示正确的用户信息。

### 5. **常见问题排查**

#### 问题1: Webhook 验证失败
```
❌ [Webhook] 验证或处理失败: Webhook verification failed
```
**解决方案**: 检查 `CLERK_WEBHOOK_SECRET` 是否正确设置

#### 问题2: 用户创建失败
```
❌ [Webhook] 创建用户失败: duplicate key value violates unique constraint
```
**解决方案**: 用户可能已存在，这是正常的

#### 问题3: ngrok 隧道断开
**解决方案**: 重新启动 ngrok 并更新 Clerk 中的 webhook URL

### 6. **生产环境部署**

部署到 Vercel 后：

1. **更新 Webhook URL**
   - 在 Clerk Dashboard 中更新端点 URL 为: 
   - `https://your-app.vercel.app/api/webhooks/clerk`

2. **确保环境变量设置**
   - 在 Vercel Dashboard 中设置 `CLERK_WEBHOOK_SECRET`

## 🧪 测试命令

```bash
# 测试 webhook 端点
curl -X POST http://localhost:3000/api/webhooks/clerk \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# 应该返回 400 错误（正常，因为缺少正确的 webhook 签名）
```

## 📝 日志示例

成功的 webhook 处理日志：
```
🔔 [Webhook] 处理事件: user.created, 用户ID: user_2abc123
👤 [Webhook] 处理用户创建: user_2abc123
📝 [Webhook] 用户数据: {
  id: 'user_2abc123',
  email: 'user@gmail.com',
  first_name: 'John',
  last_name: 'Doe',
  avatar_url: '有头像'
}
✅ [Webhook] 用户创建成功: user_2abc123
```

## 🎯 预期结果

设置成功后：
- ✅ 用户通过 Google 登录时自动创建到 Supabase
- ✅ 用户信息更新时自动同步
- ✅ 支持邀请码权限自动应用
- ✅ 调试页面显示正确的用户信息
