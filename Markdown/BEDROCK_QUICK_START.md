# 🚀 AWS Bedrock 快速启动指南

## ✅ 已完成的配置

您的应用已经配置为优先使用 AWS Bedrock！以下功能已就绪：

- ✅ **Bedrock 集成**：支持 Claude 3.5 Sonnet (Bedrock)
- ✅ **智能回退**：Bedrock 失败时自动尝试其他模型
- ✅ **默认优先级**：系统默认使用 Bedrock
- ✅ **依赖包**：已安装 `@ai-sdk/amazon-bedrock`

## 🔧 只需3步即可使用

### 1. 配置 AWS 凭证

在 `.env.local` 中添加：

```bash
AWS_ACCESS_KEY_ID=your_aws_access_key_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_key_here
AWS_REGION=us-east-1
```

### 2. 启用 Bedrock 模型访问

1. 访问 [AWS Bedrock Console](https://console.aws.amazon.com/bedrock/)
2. 选择 **us-east-1** 地区
3. 进入 **Model access** 页面
4. 请求访问 **Claude 3.5 Sonnet** 模型
5. 等待审批（通常几分钟）

### 3. 开始使用

```typescript
import { generateWithBestAvailableModel } from '@/lib/ai-models'

// 系统会自动优先使用 Bedrock
const result = await generateWithBestAvailableModel("你好，请介绍一下自己")
console.log(result.text)
```

## 🧪 测试方法

### 方法1: API 测试（推荐）
```bash
# 启动开发服务器
npm run dev

# 在新终端测试
curl http://localhost:3000/api/test-bedrock
```

### 方法2: 代码测试
```typescript
// 在您的代码中
import { generateWithBedrockClaude } from '@/lib/ai-models'

try {
  const result = await generateWithBedrockClaude("Hello, Bedrock!")
  console.log("✅ Bedrock 工作正常:", result.text)
} catch (error) {
  console.error("❌ Bedrock 错误:", error.message)
}
```

## 🎯 可用函数

```typescript
// 1. 直接使用 Bedrock
generateWithBedrockClaude("你的问题")

// 2. 智能选择（优先 Bedrock）
generateWithBestAvailableModel("你的问题")

// 3. 指定模型
generateWithModel("bedrock", "anthropic.claude-sonnet-4-20250514-v2:0", "你的问题")
```

## 🔑 获取 AWS 凭证

1. 登录 [AWS Console](https://console.aws.amazon.com/)
2. 搜索并进入 **IAM** 服务
3. 创建新用户或选择现有用户
4. 附加权限策略：**AmazonBedrockFullAccess**
5. 创建访问密钥
6. 复制 Access Key ID 和 Secret Access Key

## 💡 优势

- **企业级**：AWS 托管，高可用性
- **安全**：符合企业安全标准
- **成本**：按使用量付费
- **稳定**：相比直接API调用更稳定
- **合规**：符合各种合规要求

## 🔧 故障排除

| 错误 | 解决方案 |
|------|----------|
| `credentials not configured` | 检查 AWS_ACCESS_KEY_ID 和 AWS_SECRET_ACCESS_KEY |
| `AccessDeniedException` | 确认 IAM 用户有 Bedrock 权限 |
| `ValidationException` | 确认模型 ID 正确 |
| `model not available` | 在 Bedrock 控制台启用模型访问 |

## 📚 相关文件

- `bedrock-setup.md` - 详细配置指南
- `examples/bedrock-example.ts` - 完整使用示例
- `app/api/test-bedrock/route.ts` - 专用测试 API

---

**🎉 准备就绪！** 配置好 AWS 凭证后，您的应用就可以使用 AWS Bedrock 了！
