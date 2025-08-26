# 🔧 AI模型调用故障排除指南

## 🚨 常见问题：大模型没有返回

### 🔍 症状
- 看到消息数组构建成功
- 但是没有AI响应返回
- 终端日志停止在消息构建后

### 📝 可能原因与解决方案

#### 1. **API密钥问题**
```bash
# 检查环境变量
echo $ANTHROPIC_API_KEY
echo $OPENAI_API_KEY

# 确保API密钥有效且有余额
```

#### 2. **网络连接问题**
```bash
# 测试API连接
curl -X POST https://api.anthropic.com/v1/messages \
  -H "Content-Type: application/json" \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 100,
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

#### 3. **模型配置问题**
- 检查模型ID是否正确：`claude-sonnet-4-20250514`
- 确认使用的模型在API中可用

#### 4. **请求超时**
- 检查是否有超时设置
- 增加timeout时间

#### 5. **内存/资源问题**
```bash
# 检查系统资源
top
df -h
```

### 🛠️ 调试步骤

1. **查看详细日志**
   - 现在已添加详细的AI调用日志
   - 查看是否有错误信息

2. **测试简单调用**
   ```javascript
   // 在浏览器控制台测试
   fetch('/api/ai/generate', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       provider: 'claude',
       model: 'claude-sonnet-4-20250514',
       messages: [{ role: 'user', content: 'Hello' }]
     })
   }).then(r => r.json()).then(console.log)
   ```

3. **检查API路由**
   - 确认 `/api/ai/generate` 路由工作正常
   - 查看API路由的错误日志

### 📋 现在测试的改进

我已经添加了详细的诊断日志，现在再次测试时你会看到：

```
🚀 [AI调用开始] 调用 generateStreamWithModel
📡 [API调用] 准备调用 streamText...
✅ [流式开始] 文本流式生成开始
📤 [流式块] 第1个，长度: XX
📥 [AI响应块] 第1个块，长度: XX
✅ [AI调用完成] 总共收到 X 个响应块
```

如果你看不到这些日志，说明问题出现在AI API调用层面。
