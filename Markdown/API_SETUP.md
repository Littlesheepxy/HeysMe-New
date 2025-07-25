# 🔑 API Keys 配置指导

## 问题解决
现在系统已经修复为使用 **API 路由模式**，API keys 将安全地在服务端处理。

## 配置步骤

### 1. 编辑环境变量文件
打开项目根目录的 `.env.local` 文件，添加以下任一 API key：

```env
# OpenAI API Key (推荐使用)
OPENAI_API_KEY=sk-your-actual-openai-api-key-here

# 或者 Anthropic API Key  
ANTHROPIC_API_KEY=sk-ant-api03-your-actual-anthropic-key-here
```

### 2. 获取 API Keys

#### OpenAI (推荐)
1. 访问：https://platform.openai.com/api-keys
2. 登录或注册账户
3. 点击 "Create new secret key"
4. 复制生成的 key（以 `sk-` 开头）

#### Anthropic Claude
1. 访问：https://console.anthropic.com/
2. 登录或注册账户
3. 创建 API key
4. 复制生成的 key（以 `sk-ant-` 开头）

### 3. 重启服务
配置完成后，重启开发服务器：
```bash
npm run dev
```

## ✅ 修复内容

1. **架构优化**：将 AI 调用从客户端移至服务端 API 路由
2. **安全性提升**：API keys 现在安全地在服务端使用，不会暴露到客户端
3. **错误处理**：改进了错误信息和调试日志
4. **会话管理**：修复了重复 session ID 的问题

## 🎯 现在可以正常使用
配置任一 API key 后，系统将能够：
- ✅ 智能识别用户意图
- ✅ 个性化信息收集
- ✅ 生成定制化页面
- ✅ 流式对话体验 