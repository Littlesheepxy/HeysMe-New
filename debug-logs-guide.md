# 🔍 详细调试日志指南

## 新增的日志系统

为了帮助您在测试过程中快速定位问题，我在关键组件中添加了丰富的日志信息。

## 📊 日志分类

### 1. **流程控制日志** 🚀
- **Agent 编排器流程**
  - `🚀 [流程开始]` - 用户输入处理开始
  - `🎯 [Agent选择]` - 选择的 Agent
  - `⏰ [Agent启动]` - Agent 开始处理时间
  - `📤 [响应流]` - 每个响应的详细信息
  - `✅ [Agent完成]` - Agent 处理完毕
  - `🔄 [流程推进]` - 准备启动下一个 Agent
  - `⏹️ [流程结束]` - 整个流程完成

### 2. **Agent 跳转决策日志** 🔍
- `🔍 [Agent跳转检查]` - 检查是否需要跳转
- `✅ [Agent跳转允许]` - Welcome Agent 收集完成
- `⏸️ [Agent跳转拒绝]` - 信息收集未完成，继续当前阶段
- `🚀 [Agent跳转执行]` - 实际执行跳转

### 3. **Welcome Agent 意图识别日志** 🤖
- `🤖 [Welcome Agent]` - 开始处理
- `💬 [对话模式]` - 首次调用 vs 继续对话
- `📊 [已收集信息]` - 当前收集的数据状态
- `📄 [Prompt构建]` - Prompt 构建方式和长度
- `📋 [意图识别结果]` - AI 识别的结果详情
- `🎉 [收集完成]` - 信息收集完整
- `🔄 [继续收集]` - 需要继续收集信息

### 4. **对话历史管理日志** 💬
- `💬 [对话历史模式]` - 启用对话历史
- `🆕 [历史创建]` - 为新会话创建历史
- `📚 [历史状态]` - 当前历史长度
- `📝 [System Prompt]` - System prompt 添加状态
- `💾 [历史保存]` - AI 响应保存到历史
- `💬 [消息数组]` - 显示完整的对话历史：
  - `📝 [系统X]` - System prompt 消息
  - `👤 [用户X]` - 用户输入消息  
  - `🤖 [助手X]` - AI 助手响应消息

### 5. **API 调用日志** 🔗
- `🔗 [Base Agent LLM]` - 开始调用 AI API
- `⚙️ [调用配置]` - 调用参数详情
- `🚀 [API请求]` - 发送请求
- `📦 [请求体]` - 请求体结构
- `📡 [API响应]` - 响应状态
- `✅ [调用成功]` - 调用成功详情

### 6. **模型层调用日志** 🚀
- `🚀 [Model]` - 模型生成开始
- `📊 [输入分析]` - 输入类型和参数
- `💬 [Messages模式]` - 对话历史模式
- `📝 [Prompt模式]` - 单次 prompt 模式
- `🔧 [结构化输出]` - 使用 generateObject
- `✅ [生成成功]` - 生成完成统计

## 🧪 测试场景和对应日志

### 场景 1: 首次用户输入 "我想做简历"

**期望看到的日志流程**：
```bash
🚀 [流程开始] 处理用户输入
📝 [用户输入] 我想做简历
🎯 [Agent选择] 使用 welcome 处理请求

🤖 [Welcome Agent] 开始处理用户输入
💬 [对话模式] 首次调用
📄 [Prompt构建] 首次调用，使用完整模板

🔗 [Base Agent LLM] WelcomeAgent - 开始调用 AI API
💬 [对话历史模式] 启用对话历史管理
🆕 [历史创建] 为会话创建新的对话历史
📝 [System Prompt] 首次添加 system prompt (Agent Prompt模板)

🌐 [AI API] 接收到新请求
💬 [对话模式] 消息详情:
  📝 [系统0] (Agent Prompt模板) 你是一个专业的意图识别助手，目标是理解用户想要制作的网页简历需求...
  👤 [用户1] (用户输入) 我想做简历
🚀 [模型调用] 准备调用模型生成服务

📋 [意图识别结果] user_role: null, use_case: "求职找工作", completion_status: "collecting"
🔄 [继续收集] 信息不完整，继续收集 (状态: collecting)

📤 [响应流] welcome 第1个响应: {intent: 'awaiting_interaction', done: false, hasInteraction: true}
⏹️ [流程结束] 当前Agent完成，无需跳转下一个Agent (因为 done: false)
```

### 场景 2: 用户提交表单但信息不完整

**期望看到的日志流程**：
```bash
🔄 [Agent编排器] 处理用户交互: {interactionType: 'interaction', currentAgent: 'welcome'}

🎯 [Welcome Agent交互] 处理用户交互
📝 [交互类型] interaction
📄 [交互数据] {"user_role": null, "use_case": "求职找工作"}
📊 [交互前状态] {"user_role": null, "use_case": "求职找工作", "style": null}
📊 [交互后状态] {"user_role": null, "use_case": "求职找工作", "style": null}
🔍 [完整性检查] user_role: null, use_case: "求职找工作", 完整: false
⏸️ [交互结果] 信息不完整，继续收集

📋 [交互处理结果] {action: 'continue', summary: '已更新部分信息，还需要：身份类型'}
⏸️ [编排器继续] Agent返回continue，保持在当前阶段
```

### 场景 3: 用户提交完整信息

**期望看到的日志流程**：
```bash
🔄 [Agent编排器] 处理用户交互: {interactionType: 'interaction', currentAgent: 'welcome'}

🎯 [Welcome Agent交互] 处理用户交互
📝 [交互类型] interaction  
📄 [交互数据] {"user_role": "开发者", "use_case": "求职找工作"}
📊 [交互前状态] {"user_role": null, "use_case": "求职找工作", "style": null}
📊 [交互后状态] {"user_role": "开发者", "use_case": "求职找工作", "style": null}
🔍 [完整性检查] user_role: "开发者", use_case: "求职找工作", 完整: true
✅ [交互结果] 信息收集完整，允许推进到下一阶段

📋 [交互处理结果] {action: 'advance', summary: '已确认：开发者 - 求职找工作'}
🚀 [编排器跳转] Agent返回advance，准备跳转到下一阶段
➡️ [编排器跳转] welcome -> info_collection
```

### 场景 4: 错误调试

**期望看到的错误日志**：
```bash
❌ [API错误] 请求失败: status: 500, error: "模型调用失败"
❌ [生成失败] claude model claude-sonnet-4-20250514 错误
🔄 [模型回退] Claude 失败，尝试回退到 GPT-4o...
❌ [调用失败] WelcomeAgent - AI 调用失败
❌ [Welcome Agent错误] 处理失败
```

## 🔍 常见问题调试指南

### 问题 1: Agent 不跳转
**查找日志**：
- 寻找 `🔍 [Agent跳转检查]` 
- 检查 `completion_status` 值
- 确认是否看到 `⏸️ [Agent跳转拒绝]`

### 问题 2: 对话历史不工作
**查找日志**：
- 寻找 `💬 [对话历史模式]`
- 检查 `📚 [历史状态]` 中的历史长度
- 确认 `📝 [System Prompt]` 状态

### 问题 3: AI 响应格式错误
**查找日志**：
- 寻找 `📋 [意图识别结果]`
- 检查 `✅ [LLM成功]` 和返回数据
- 查看 `❌ [LLM错误]` 详情

### 问题 4: API 调用失败
**查找日志**：
- 寻找 `🌐 [AI API] 接收到新请求`
- 检查 `📡 [API响应]` 状态码
- 查看 `❌ [API错误]` 错误信息

## 📱 日志过滤技巧

在浏览器控制台中，您可以使用以下过滤器：

```javascript
// 只看流程控制日志
console.log = (...args) => args[0].includes('[流程') && console.info(...args)

// 只看 Agent 跳转日志  
console.log = (...args) => args[0].includes('[Agent跳转') && console.info(...args)

// 只看错误日志
console.log = (...args) => args[0].includes('❌') && console.error(...args)

// 只看意图识别结果
console.log = (...args) => args[0].includes('[意图识别结果]') && console.info(...args)
```

## 🎯 性能监控

新增的性能监控日志：
- `⏰ [Agent启动]` - 包含启动时间戳
- `📊 [流程统计]` - 响应数量统计  
- `✅ [请求完成]` - 包含处理时间
- `📊 [结果统计]` - 数据大小统计

## 🚀 下一步优化

基于这些详细日志，您可以：
1. **性能分析** - 找出处理慢的环节
2. **错误追踪** - 快速定位失败原因
3. **用户体验** - 优化响应时间
4. **系统监控** - 建立监控报警机制

现在您拥有了完整的可视化调试系统！🎉 