# 会话阶段恢复修复方案

## 问题描述

用户在coding模式下发送增量修改请求（如"可否把hero的模块加一些动效呢"），但系统错误地回退到welcome阶段，而不是继续在code_generation阶段处理请求。

## 问题分析

### 根本原因
1. **会话恢复时阶段信息丢失**：从Supabase数据库恢复会话时，`metadata.progress.currentStage`信息不完整或错误
2. **前端模式判断失败**：前端基于消息历史和阶段状态判断是否启用coding模式，如果阶段信息错误，会导致模式判断失败
3. **Agent选择错误**：编排器根据`currentStage`选择Agent，错误的阶段导致选择了welcome agent而不是coding agent

### 问题链条
```
用户发送增量修改请求 
→ 系统恢复会话（currentStage = 'welcome'，应该是'code_generation'）
→ 前端判断不启用coding模式 
→ 编排器选择welcome agent 
→ 用户看到欢迎响应而不是代码修改
```

## 解决方案

### 1. 后端修复：会话恢复时的阶段推断

**文件：** `lib/utils/session-storage.ts`

**修复内容：**
- 添加了`inferProgressFromSession`方法，根据会话内容智能推断当前阶段
- 检查消息历史中的metadata标记（如`projectGenerated`、agent类型等）
- 如果存储的progress信息缺失或不完整，自动推断正确的阶段

**推断逻辑：**
```typescript
// 检查代码生成相关消息
const hasCodeGeneration = conversationHistory.some(entry => 
  entry.metadata?.projectGenerated === true ||
  entry.metadata?.intent === 'project_complete' ||
  entry.metadata?.hasCode === true ||
  entry.agent === 'coding' ||
  (entry.type === 'agent_response' && entry.content?.includes('```'))
);

if (hasCodeGeneration) {
  inferredStage = 'code_generation';
}
```

### 2. 前端现有保护机制

**文件：** `components/chat/ChatInterface.tsx`

前端已有多重检查机制确保coding模式正确启用：

```typescript
const shouldEnableCodingMode = 
  sessionStatus?.currentStage === 'code_generation' ||  // 阶段检查
  messages.some(msg => msg.metadata?.projectGenerated) ||  // 消息metadata检查
  sessionStatus?.metadata?.agent_name === 'CodingAgent';   // Agent类型检查
```

## 技术细节

### 阶段推断策略

1. **优先级1：存储的阶段信息**
   - 如果metadata.progress.currentStage存在且有效，直接使用

2. **优先级2：消息历史分析**
   - 代码生成阶段：包含代码、project完成等标记
   - 设计阶段：包含prompt_output agent或设计完成标记
   - 信息收集阶段：包含info_collection agent
   - 默认：welcome阶段

3. **优先级3：前端备用检查**
   - 基于currentStage状态
   - 基于消息metadata
   - 基于agent类型

### 日志追踪

修复后会看到以下日志：
```
🔧 [会话恢复] 根据消息历史推断阶段: code_generation (消息数: 15)
🔧 [模式切换] 启用 Coding 模式
🎯 [编排器] 阶段 code_generation -> Agent coding
```

## 验证方法

1. **正常流程验证**：
   - 用户完成项目生成
   - 关闭浏览器或刷新页面
   - 重新打开会话
   - 发送增量修改请求
   - 确认系统使用coding agent处理

2. **异常情况测试**：
   - 手动修改数据库中的currentStage为错误值
   - 验证系统能自动修正

3. **日志监控**：
   - 监控会话恢复日志
   - 确认阶段推断正确
   - 确认Agent选择正确

## 预期效果

- ✅ 会话恢复时正确识别coding阶段
- ✅ 增量修改请求路由到正确的Agent
- ✅ 用户体验连续性得到保障
- ✅ 减少因阶段错误导致的用户困惑

## 注意事项

1. **向后兼容性**：修复不影响现有正常运行的会话
2. **性能影响**：阶段推断逻辑简单高效，不会显著影响恢复速度
3. **数据一致性**：修复后的阶段信息会在下次保存时更新到数据库
