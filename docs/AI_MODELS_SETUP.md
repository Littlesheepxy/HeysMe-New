# AI 模型提供商集成指南

## 🎯 概述

您的应用现在支持 4 个主要的 AI 提供商：
- **OpenAI** (GPT-4o)
- **Anthropic Claude** (Claude 4 Sonnet)
- **AWS Bedrock** (Claude 3.5 Sonnet, Titan, Llama)
- **智谱AI** (GLM-4 系列)

## 📦 安装依赖

```bash
# 安装新的AI提供商支持
npm install @ai-sdk/amazon-bedrock

# 如果需要直接使用AWS SDK
npm install @aws-sdk/client-bedrock-runtime
```

## 🔧 环境变量配置

在 `.env.local` 中添加以下配置：

```bash
# OpenAI (已有)
OPENAI_API_KEY=sk-...

# Anthropic Claude (已有)
ANTHROPIC_API_KEY=sk-ant-...

# AWS Bedrock
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
BEDROCK_REGION=us-east-1

# 智谱AI
ZHIPU_API_KEY=...
ZHIPU_BASE_URL=https://open.bigmodel.cn/api/paas/v4/
```

## 🚀 使用方法

### 1. 基本使用

```typescript
import { generateWithModel } from '@/lib/ai-models'

// 使用特定提供商
const result = await generateWithModel("zhipu", "glm-4.5", "你好，请介绍一下智谱AI")

// 使用智能选择（自动回退）
const smartResult = await generateWithBestAvailableModel("Hello, world!")
```

### 2. 便捷函数

```typescript
import { 
  generateWithGPT4o,
  generateWithClaude,
  generateWithBedrockClaude,
  generateWithZhipu
} from '@/lib/ai-models'

// OpenAI GPT-4o
const gptResult = await generateWithGPT4o("分析这段代码")

// Anthropic Claude
const claudeResult = await generateWithClaude("写一首诗")

// AWS Bedrock Claude
const bedrockResult = await generateWithBedrockClaude("解释量子计算")

// 智谱AI
const zhipuResult = await generateWithZhipu("翻译成英文：你好世界")
```

### 3. 结构化输出

```typescript
import { z } from 'zod'

const schema = z.object({
  title: z.string(),
  summary: z.string(),
  tags: z.array(z.string())
})

const result = await generateWithModel("zhipu", "glm-4.5", "分析这篇文章", {
  schema,
  maxTokens: 1000
})

console.log(result.object) // 类型安全的结构化数据
```

### 4. 流式响应

```typescript
import { generateStreamWithModel } from '@/lib/ai-models'

for await (const chunk of generateStreamWithModel("zhipu", "glm-4-flash", "讲个故事")) {
  console.log(chunk) // 实时输出文本块
}
```

## 🧪 测试连接

### 测试所有模型
```bash
curl http://localhost:3000/api/test-all-models
```

### 测试特定模型
```bash
curl -X POST http://localhost:3000/api/test-all-models \
  -H "Content-Type: application/json" \
  -d '{"provider": "zhipu", "modelId": "glm-4.5"}'
```

## 📊 可用模型

### OpenAI
- `gpt-4o` - 最新多模态模型

### Anthropic Claude
- `claude-sonnet-4-20250514` - Claude 4 Sonnet

### AWS Bedrock
- `anthropic.claude-sonnet-4-20250514-v2:0` - Claude 3.5 Sonnet
- `amazon.titan-text-premier-v1:0` - Amazon Titan
- `meta.llama3-2-90b-instruct-v1:0` - Llama 3.2 90B

### 智谱AI
- `glm-4.5` - 最强模型
- `glm-4-0520` - 基础模型
- `glm-4-flash` - 快速响应

## 🔄 智能回退机制

系统会按优先级自动回退：
1. **Claude 4 Sonnet** (主力模型)
2. **GPT-4o** (备用模型)
3. **glm-4.5** (智谱AI)
4. **Bedrock Claude** (AWS托管)

## 🔑 获取API密钥

### AWS Bedrock
1. 登录 [AWS Console](https://console.aws.amazon.com/)
2. 进入 IAM 创建用户和访问密钥
3. 确保用户有 Bedrock 权限
4. 在 Bedrock 控制台启用所需模型

### 智谱AI
1. 访问 [智谱AI开放平台](https://open.bigmodel.cn/)
2. 注册并认证账户
3. 创建API密钥
4. 查看[文档](https://open.bigmodel.cn/dev/api)了解使用方法

## 🛠️ 故障排除

### 常见问题

1. **AWS Bedrock 403错误**
   ```bash
   # 检查权限和区域
   aws bedrock list-foundation-models --region us-east-1
   ```

2. **智谱AI 网络错误**
   ```bash
   # 测试连接
   curl -H "Authorization: Bearer YOUR_API_KEY" https://open.bigmodel.cn/api/paas/v4/chat/completions
   ```

3. **模型未启用**
   - AWS Bedrock: 在控制台启用所需模型
   - 智谱AI: 确认账户有足够余额

### 调试命令

```bash
# 检查所有API状态
curl http://localhost:3000/api/test-all-models | jq

# 检查环境变量
env | grep -E "(OPENAI|ANTHROPIC|AWS|ZHIPU)"

# 测试网络连接
curl -I https://open.bigmodel.cn/api/paas/v4/
```

## 💡 最佳实践

1. **成本优化**
   - 使用 `glm-4-flash` 进行快速响应
   - 根据任务复杂度选择合适模型

2. **性能优化**
   - 开启智能回退避免单点故障
   - 使用流式响应提升用户体验

3. **安全性**
   - 定期轮换API密钥
   - 使用环境变量存储敏感信息

## 📈 监控和分析

系统会自动记录：
- 模型使用统计
- 响应时间
- 错误率
- 回退频率

查看日志了解模型性能和使用情况。
