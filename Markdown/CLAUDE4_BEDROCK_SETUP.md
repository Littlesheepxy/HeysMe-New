# 🚀 Claude 4 Bedrock 完整配置指南

## 📋 问题说明

Claude 4 (`anthropic.claude-sonnet-4-20250514-v1:0`) 在 AWS Bedrock 中不支持 **on-demand** 调用方式，会出现以下错误：

```
Invocation of model ID anthropic.claude-sonnet-4-20250514-v1:0 with on-demand throughput isn't supported. 
Retry your request with the ID or ARN of an inference profile that contains this model.
```

## 🛠️ 解决方案

### 方案1: 推理配置文件 (推荐)

#### 1. 创建推理配置文件

1. 访问 [AWS Bedrock Console](https://console.aws.amazon.com/bedrock/)
2. 选择 **us-east-1** 地区
3. 进入 **推理配置文件 (Inference profiles)** 页面
4. 点击 **创建推理配置文件**
5. 选择 Claude 4 Sonnet 模型
6. 配置名称：例如 `claude-4-sonnet-profile`
7. 记录生成的 ARN

#### 2. 配置环境变量

在 `.env.local` 中添加：

```bash
# AWS 基本配置
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1

# Claude 4 推理配置文件 ARN
CLAUDE4_INFERENCE_PROFILE_ARN=arn:aws:bedrock:us-east-1:123456789012:inference-profile/claude-4-sonnet-profile
```

#### 3. 测试配置

```bash
# 测试连接
curl http://localhost:3000/api/test-bedrock
```

### 方案2: 预置吞吐量 (成本较高)

1. 在 Bedrock 控制台配置预置吞吐量
2. 获取预置吞吐量的 ARN
3. 在环境变量中设置对应的 ARN

### 方案3: 使用 Claude 3.5 Sonnet (最简单)

如果您不需要 Claude 4 的特定功能，可以使用 Claude 3.5 Sonnet：

```typescript
// 在代码中指定使用 Claude 3.5
const result = await generateWithModel(
  "bedrock", 
  "anthropic.claude-sonnet-4-20250514-v2:0", 
  "您的问题"
)
```

## 🔧 智能配置检测

您的应用已经内置了智能配置检测：

1. **自动检测**：系统会自动检测是否配置了推理配置文件
2. **智能回退**：如果 Claude 4 不可用，会自动使用其他模型
3. **清晰提示**：提供详细的配置建议和错误说明

## 🧪 验证配置

```typescript
import { validateClaude4Config } from '@/lib/bedrock-config'

const config = validateClaude4Config()
console.log(config.message)
console.log(config.recommendations)
```

## 💰 成本对比

| 方案 | 成本 | 复杂度 | 推荐度 |
|------|------|--------|--------|
| 推理配置文件 | 中等 | 中等 | ⭐⭐⭐⭐⭐ |
| 预置吞吐量 | 高 | 高 | ⭐⭐⭐ |
| Claude 3.5 Sonnet | 低 | 低 | ⭐⭐⭐⭐ |

## 🎯 推荐策略

1. **开发测试**：使用 Claude 3.5 Sonnet (完全 on-demand)
2. **生产环境**：根据需求选择 Claude 4 推理配置文件或 Claude 3.5
3. **成本敏感**：优先使用 Claude 3.5 Sonnet

## 📚 相关文档

- [AWS Bedrock 推理配置文件文档](https://docs.aws.amazon.com/bedrock/latest/userguide/inference-profiles.html)
- [Claude 模型对比](https://docs.anthropic.com/claude/docs/models-overview)
- 项目文档：`BEDROCK_QUICK_START.md`
