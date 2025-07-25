# HeysMe 架构文档

## AI 调用架构统一设计

### 设计原则
所有 AI 相关调用统一通过 `/api/ai/generate` API 路由，而不是直接调用 `lib/ai-models.ts`。

### 架构层次

```
客户端/Agent → /api/ai/generate → lib/ai-models.ts → AI SDK → 模型提供商
```

### 调用方式

#### ✅ 推荐方式（统一 API）
```typescript
const response = await fetch('/api/ai/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: "你的 prompt",
    options: {
      schema: yourZodSchema,  // 会自动用 zodSchema() 包装
      maxTokens: 2000,
      system: "系统提示"
    }
  })
})
```

#### ❌ 避免方式（直接调用）
```typescript
// 不要这样做
import { generateWithModel } from "@/lib/ai-models"
const result = await generateWithModel(provider, model, prompt, options)
```

### 优势

1. **统一管理**: 所有 AI 调用都经过统一入口
2. **安全性**: API keys 集中在服务端，不会暴露
3. **错误处理**: 统一的错误处理和日志
4. **Schema 处理**: 自动处理 Zod schema 包装
5. **监控**: 更容易添加监控和限流

### 文件职责

#### `/api/ai/generate/route.ts`
- 统一的 AI 调用入口
- 处理 schema 参数（自动用 zodSchema 包装）
- 统一错误处理和响应格式

#### `lib/ai-models.ts` 
- 底层 AI SDK 封装
- 模型客户端管理
- API key 验证
- 模型回退逻辑

#### Agent 类（`lib/agents/base-agent.ts`）
- 通过 `callLLM()` 方法调用 `/api/ai/generate`
- 不直接调用 `lib/ai-models.ts`

### 迁移状态

✅ **已迁移到统一 API**:
- `BaseAgent.callLLM()`
- `/api/intent-recognition`
- `/api/generate-page`

🔄 **保留直接调用**（合理场景）:
- `/api/ai/generate` - 作为统一入口
- `/api/test-connection` - 测试连接专用

### Schema 处理

现在 schema 参数会在 `/api/ai/generate` 中自动处理：

```typescript
// 输入：原始 Zod schema
const schema = z.object({ name: z.string() })

// API 内部自动处理
if (options.schema._def) {
  processedOptions.schema = zodSchema(options.schema)
}
```

这样避免了在多个地方重复处理 schema 的问题。 