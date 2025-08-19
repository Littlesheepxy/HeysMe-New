# 🚀 邀请码功能快速启动指南

## 📝 问题修复

✅ **已修复 PostgreSQL 数组语法错误**
- 原错误: `projects @> '["admin"]'` 
- 已修复: `projects @> ARRAY['admin']`
- 使用修复版文件: `sql/invite-codes-schema-fixed.sql`

## 🛠️ 3分钟快速设置

### 1. 执行数据库迁移
在 Supabase Dashboard → SQL Editor 中执行：

```sql
-- 复制粘贴 sql/invite-codes-schema-fixed.sql 的全部内容
-- 一次性执行，会自动创建所有表和策略
```

### 2. 设置管理员权限

#### 🔧 方法1: 使用调试页面（推荐）
1. 启动开发服务器: `npm run dev`
2. 登录或注册一个账户
3. 访问 `http://localhost:3000/debug-admin`
4. 复制显示的 SQL 语句
5. 在 Supabase SQL Editor 中执行

#### 📝 方法2: 手动设置
在 Supabase → Table Editor → users 表中：

```sql
-- 方法1: 设置你的用户为管理员
UPDATE users SET plan = 'admin' WHERE email = 'your-email@example.com';

-- 或者方法2: 添加管理员项目权限
UPDATE users SET projects = array_append(projects, 'admin') WHERE email = 'your-email@example.com';
```

### 3. 测试功能
```bash
# 运行测试脚本
node scripts/test-invite-codes.js

# 启动开发服务器（如果还没运行）
npm run dev
```

### 4. 使用功能
1. 访问 `http://localhost:3000/admin/invite-codes` - 管理邀请码
2. 访问 `http://localhost:3000/sign-up` - 测试注册流程

## 🎯 核心功能

### 管理员功能
- ✅ 生成邀请码（单个/批量）
- ✅ 设置使用次数限制
- ✅ 设置过期时间
- ✅ 配置用户权限
- ✅ 查看使用统计

### 用户功能  
- ✅ 邀请码验证
- ✅ 注册流程集成
- ✅ 自动权限分配

### 安全特性
- ✅ IP 地址记录
- ✅ 使用次数限制
- ✅ 过期时间控制
- ✅ 邮箱唯一性验证
- ✅ 行级安全策略

## 🔧 API 端点

### 公开 API
- `POST /api/invite-codes/verify` - 验证邀请码
- `POST /api/invite-codes/use` - 使用邀请码

### 管理员 API
- `POST /api/admin/invite-codes/generate` - 生成邀请码
- `GET /api/admin/invite-codes/generate` - 获取邀请码列表
- `GET /api/admin/invite-codes/[id]` - 获取详情
- `PATCH /api/admin/invite-codes/[id]` - 更新邀请码
- `DELETE /api/admin/invite-codes/[id]` - 删除邀请码

## 🐛 故障排除

### 常见错误
1. **数组语法错误**
   ```
   ERROR: 22P02: malformed array literal: "["admin"]"
   ```
   **解决**: 使用 `sql/invite-codes-schema-fixed.sql`

2. **无法访问管理面板**
   **解决**: 检查用户是否有管理员权限

3. **邀请码验证失败**
   **解决**: 检查邀请码格式和有效期

### 检查清单
- [ ] 数据库表已创建
- [ ] 用户有管理员权限
- [ ] 环境变量配置正确
- [ ] 开发服务器运行中

## 📚 完整文档
详细文档请参考 `docs/INVITE_CODES_SETUP.md`

---

🎉 **现在你的 HeysMe 项目已经具备完整的内测邀请码功能！**
