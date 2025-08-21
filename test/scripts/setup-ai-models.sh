#!/bin/bash

# AI 模型提供商安装脚本

echo "🚀 开始安装AI模型提供商支持..."

# 检查是否在项目根目录
if [ ! -f "package.json" ]; then
    echo "❌ 请在项目根目录运行此脚本"
    exit 1
fi

echo "📦 安装依赖包..."

# 安装 AWS Bedrock 支持
echo "- 安装 AWS Bedrock 支持..."
npm install @ai-sdk/amazon-bedrock --legacy-peer-deps

# 安装 AWS SDK (可选，用于直接AWS操作)
echo "- 安装 AWS SDK..."
npm install @aws-sdk/client-bedrock-runtime --legacy-peer-deps

echo "✅ 依赖包安装完成!"

echo ""
echo "🔧 接下来请配置环境变量:"
echo ""
echo "在 .env.local 中添加以下配置:"
echo ""
echo "# AWS Bedrock"
echo "AWS_ACCESS_KEY_ID=your_aws_access_key"
echo "AWS_SECRET_ACCESS_KEY=your_aws_secret_key"
echo "AWS_REGION=us-east-1"
echo "BEDROCK_REGION=us-east-1"
echo ""
echo "# 智谱AI"
echo "ZHIPU_API_KEY=your_zhipu_api_key"
echo "ZHIPU_BASE_URL=https://open.bigmodel.cn/api/paas/v4/"
echo ""

echo "🧪 安装完成后，运行以下命令测试:"
echo "curl http://localhost:3000/api/test-all-models"
echo ""

echo "📚 查看完整文档:"
echo "docs/AI_MODELS_SETUP.md"
echo ""

echo "🎉 安装脚本执行完成!"
