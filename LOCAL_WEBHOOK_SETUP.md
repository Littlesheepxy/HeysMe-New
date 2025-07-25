# 本地开发Webhook设置指南

## 快速设置（推荐）

使用提供的自动化脚本：

```bash
# 1. 启动Next.js开发服务器
npm run dev

# 2. 在新终端窗口运行设置脚本
./setup-local-webhook.sh
```

## 手动设置步骤

### 1. 安装ngrok

```bash
# macOS (使用Homebrew)
brew install ngrok

# 或访问 https://ngrok.com/download 下载
```

### 2. 注册ngrok账户

1. 访问 [ngrok.com](https://ngrok.com)
2. 注册免费账户
3. 在Dashboard中复制您的Authtoken

### 3. 配置ngrok认证

```bash
ngrok config add-authtoken YOUR_AUTHTOKEN
```

### 4. 启动开发环境

#### 终端1: 启动Next.js
```bash
npm run dev
```

#### 终端2: 启动ngrok隧道
```bash
ngrok http 3000
```

### 5. 获取公开URL

ngrok启动后，您会看到类似这样的输出：
```
Session Status                online
Account                       your-email@example.com
Version                       3.x.x
Region                        United States (us)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123.ngrok-free.app -> http://localhost:3000
```

**您的Webhook URL**: `https://abc123.ngrok-free.app/api/webhooks/clerk`

### 6. 在Clerk Dashboard中配置Webhook

1. 访问 [Clerk Dashboard](https://clerk.com/dashboard)
2. 选择您的应用
3. 导航到 **Configure > Webhooks**
4. 点击 **Add Endpoint**
5. 配置：
   - **Endpoint URL**: `https://abc123.ngrok-free.app/api/webhooks/clerk`
   - **Events**: 选择以下事件
     - ✅ `user.created`
     - ✅ `user.updated`
     - ✅ `user.deleted`
6. 点击 **Create**

### 7. 测试Webhook

#### 方法1: 在Clerk Dashboard中测试
1. 在Webhook设置页面，点击 **Testing** 标签
2. 选择 `user.created` 事件
3. 点击 **Send Example**
4. 检查您的终端日志

#### 方法2: 注册新用户测试
1. 在您的应用中注册新用户
2. 检查终端日志是否显示webhook事件
3. 验证Supabase `users` 表中是否有新记录

## 常见问题

### Q: ngrok URL每次都变化怎么办？
**A**: 免费版ngrok每次重启都会生成新URL。解决方案：
- 升级到ngrok付费版获得固定域名
- 或每次重启后更新Clerk配置

### Q: Webhook接收不到数据？
**A**: 检查以下项目：
1. ngrok隧道是否正常运行 (`http://localhost:4040`)
2. Next.js服务器是否在运行 (`http://localhost:3000`)
3. Clerk Dashboard中的URL是否正确
4. 环境变量 `CLERK_WEBHOOK_SIGNING_SECRET` 是否配置

### Q: 如何查看ngrok请求日志？
**A**: 访问 `http://localhost:4040` 查看ngrok Web界面，可以看到所有请求详情

### Q: 测试时收到403错误？
**A**: 检查中间件配置，确保 `/api/webhooks/*` 路由是公开的

## 生产环境部署

生产环境中，请使用您的实际域名：
- **Webhook URL**: `https://yourdomain.com/api/webhooks/clerk`
- 确保HTTPS已启用
- 配置正确的环境变量

## 有用的命令

```bash
# 检查ngrok状态
curl http://localhost:4040/api/tunnels

# 查看当前ngrok URL
curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url'

# 测试webhook端点
curl -X POST https://your-ngrok-url.ngrok-free.app/api/webhooks/clerk

# 查看Next.js日志
npm run dev

# 停止所有后台进程
pkill -f ngrok
```

## 自动化脚本

项目根目录提供了 `setup-local-webhook.sh` 脚本来自动化整个设置过程。

```bash
./setup-local-webhook.sh
```

此脚本会：
- 检查依赖
- 启动ngrok隧道
- 显示配置信息
- 保存URL到文件
- 提供测试命令 