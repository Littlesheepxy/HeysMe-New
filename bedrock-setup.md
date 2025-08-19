# AWS Bedrock 快速配置指南

## 🎯 设置 AWS Bedrock

### 1. 配置环境变量

在 `.env.local` 文件中添加：

```bash
# AWS Bedrock 配置
AWS_ACCESS_KEY_ID=your_aws_access_key_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_key_here
AWS_REGION=us-east-1
BEDROCK_REGION=us-east-1
```

### 2. 获取 AWS 凭证

1. 登录 [AWS Console](https://console.aws.amazon.com/)
2. 进入 IAM 服务
3. 创建新用户或使用现有用户
4. 附加权限策略：`AmazonBedrockFullAccess`
5. 创建访问密钥

### 3. 启用 Bedrock 模型

1. 进入 [AWS Bedrock Console](https://console.aws.amazon.com/bedrock/)
2. 选择地区（建议 us-east-1）
3. 在 Model access 中请求访问 Claude 4 模型
4. 等待审批（通常几分钟到几小时）

### 4. 测试连接

```bash
# 测试单个 Bedrock 模型
curl -X POST http://localhost:3000/api/test-all-models \
  -H "Content-Type: application/json" \
  -d '{"provider": "bedrock", "modelId": "anthropic.claude-sonnet-4-20250514-v1:0"}'
```

### 5. 在代码中使用

```typescript
import { generateWithBedrockClaude } from '@/lib/ai-models'

// 使用 Bedrock Claude
const result = await generateWithBedrockClaude("解释什么是AWS Bedrock")
console.log(result.text)
```

## 🔧 故障排除

### 常见错误：

1. **AccessDeniedException**: 检查 IAM 权限
2. **ValidationException**: 检查模型 ID 是否正确
3. **ThrottlingException**: 请求过于频繁，稍后重试
4. **Model not available**: 需要在 Bedrock 控制台请求模型访问权限

### AWS CLI 测试：

```bash
# 测试 AWS 连接
aws bedrock list-foundation-models --region us-east-1

# 测试特定模型
aws bedrock-runtime invoke-model \
  --model-id anthropic.claude-sonnet-4-20250514-v1:0 \
  --body '{"messages":[{"role":"user","content":"Hello"}],"max_tokens":100}' \
  --region us-east-1 \
  output.json
```
