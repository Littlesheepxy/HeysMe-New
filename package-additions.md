# 需要安装的依赖包

请运行以下命令安装新的AI提供商支持：

```bash
# AWS Bedrock 支持
npm install @ai-sdk/amazon-bedrock

# 智谱AI 支持 (通过 OpenAI 兼容API)
npm install @ai-sdk/openai-compatible

# 或者如果有专门的智谱SDK
npm install zhipuai-sdk

# AWS SDK (如果直接使用 AWS Bedrock)
npm install @aws-sdk/client-bedrock-runtime
```

## 环境变量配置

在 `.env.local` 中添加：

```bash
# AWS Bedrock
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
BEDROCK_REGION=us-east-1

# 智谱AI
ZHIPU_API_KEY=your_zhipu_api_key
ZHIPU_BASE_URL=https://open.bigmodel.cn/api/paas/v4
```
