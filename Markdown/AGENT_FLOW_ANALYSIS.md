# Agent 流程分析文档

## 📋 主流程概览

用户输入 → 意图识别 → 信息收集 → 代码prompt生成 → 代码生成和预览

## 🔄 核心流程实现状态

### 1. 主函数位置
**核心入口**: `hooks/use-chat-system.ts` 中的 `sendMessage` 函数（第48-291行）

```typescript
const sendMessage = useCallback(
  async (content: string, option?: any) => {
    // 1. 创建/获取会话
    // 2. 添加用户消息
    // 3. 调用 AgentManager.processWithWelcomeAgent()
    // 4. 处理Agent响应和状态更新
  }
)
```

### 2. Agent编排器
**位置**: `lib/utils/agent-orchestrator.ts`
- ✅ **已实现**: 完整的Agent流程编排
- ✅ **已实现**: 阶段间自动跳转逻辑
- ✅ **已实现**: 流式响应处理

## 🎯 各阶段实现分析

### 阶段1: 意图识别 (Welcome Agent)
**文件**: `lib/agents/welcome-agent.ts`

#### ✅ 实现状态: 完整
- **输入**: 用户自然语言描述
- **处理**: AI分析用户意图、身份、目标
- **输出**: JSON格式的意图识别结果
- **跳转判断**: `completion_status === 'ready'`

```typescript
// 关键跳转逻辑
if (validatedResponse.completion_status === 'ready') {
  // 信息收集完成，准备推进到下一阶段
  yield this.createReadyToAdvanceResponse(validatedResponse, sessionData);
} else {
  // 需要继续收集信息
  yield this.createCollectionResponse(validatedResponse, sessionData);
}
```

#### JSON输出格式:
```json
{
  "identified": {
    "user_role": "开发者",
    "use_case": "求职",
    "style": "科技未来",
    "highlight_focus": ["项目经验", "技术栈"]
  },
  "completion_status": "ready",
  "system_state": {
    "intent": "advance",
    "done": true,
    "progress": 50
  }
}
```

### 阶段2: 信息收集 (Info Collection Agent)
**文件**: `lib/agents/info-collection-agent.ts`

#### ✅ 实现状态: 完整
- **输入**: 用户材料和链接
- **处理**: 收集简历、GitHub、作品集等
- **输出**: 结构化的用户数据
- **跳转判断**: `state.canProceed || state.userOptedOut`

```typescript
// 关键跳转逻辑
if (this.shouldAdvanceToDesign(currentState, collectionMode)) {
  // 材料足够或用户选择跳过，推进到下一阶段
  yield this.createAdvanceResponse(currentState, sessionData);
  return;
}
```

#### JSON输出格式:
```json
{
  "system_state": {
    "intent": "advance",
    "done": true,
    "progress": 60,
    "metadata": {
      "materialsSummary": "收集到：2个文档、3个链接",
      "usingDefaults": false
    }
  }
}
```

### 阶段3: 页面设计 (Prompt Output Agent)
**文件**: `lib/agents/prompt-output-agent.ts`

#### ✅ 实现状态: 完整
- **输入**: 用户意图和收集的数据
- **处理**: AI生成页面设计策略
- **输出**: 设计方案和开发任务描述
- **跳转判断**: 自动推进到代码生成

```typescript
// 关键跳转逻辑
yield this.createResponse({
  system_state: {
    intent: 'advance',
    done: true,
    progress: 75,
    metadata: {
      designStrategy,
      developmentPrompt,
      readyForCoding: true
    }
  }
});
```

#### JSON输出格式:
```json
{
  "designStrategy": {
    "layout": "project_grid",
    "theme": "tech_blue",
    "sections": [...],
    "features": {...}
  },
  "developmentPrompt": "完整的开发任务描述",
  "system_state": {
    "intent": "advance",
    "done": true,
    "progress": 75
  }
}
```

### 阶段4: 代码生成 (Coding Agent)
**文件**: `lib/agents/coding-agent.ts`

#### ✅ 实现状态: 完整
- **输入**: 设计策略和开发任务
- **处理**: 生成完整的项目代码
- **输出**: 多个代码文件和部署指导
- **跳转判断**: 流程完成

```typescript
// 最终完成
yield this.createResponse({
  system_state: {
    intent: 'done',
    done: true,
    progress: 100,
    metadata: {
      success: true,
      filesGenerated: true,
      deploymentReady: true
    }
  }
});
```

## 🔗 Agent间跳转机制

### 1. 自动跳转逻辑
**位置**: `lib/utils/agent-orchestrator.ts` 第232-254行

```typescript
private getNextAgentName(currentAgent: string): string | null {
  const agentSequence = ['welcome', 'info_collection', 'prompt_output', 'coding'];
  const currentIndex = agentSequence.indexOf(currentAgent);
  
  if (currentIndex >= 0 && currentIndex < agentSequence.length - 1) {
    return agentSequence[currentIndex + 1];
  }
  
  return null;
}
```

### 2. 跳转触发条件
每个Agent通过返回特定的JSON格式来触发跳转：

```typescript
// 推进到下一阶段
{
  "system_state": {
    "intent": "advance",
    "done": true
  }
}

// 继续当前阶段
{
  "system_state": {
    "intent": "continue",
    "done": false
  }
}
```

### 3. 用户交互处理
**位置**: `app/api/chat/interact/route.ts`

```typescript
// 处理用户交互并决定下一步
const result = await agentOrchestrator.handleUserInteraction(
  sessionId,
  'interaction',
  data,
  sessionData
);

if (result?.action === 'advance') {
  // 推进到下一个Agent
  const nextAgent = await agentOrchestrator.advanceStage(sessionData);
}
```

## 📊 数据流转记录

### SessionData结构
```typescript
interface SessionData {
  id: string;
  status: 'active' | 'completed';
  userIntent: UserIntent;           // Welcome Agent 填充
  personalization: PersonalizationProfile; // Welcome Agent 填充
  collectedData: CollectedResumeData;      // Info Collection Agent 填充
  agentFlow: AgentFlowEntry[];             // 记录每个Agent的执行结果
  metadata: SessionMetadata;               // 进度和状态信息
}
```

### 各阶段数据更新
1. **Welcome Agent**: 更新 `userIntent` 和 `personalization`
2. **Info Collection Agent**: 更新 `collectedData`
3. **Prompt Output Agent**: 在 `agentFlow` 中存储设计方案
4. **Coding Agent**: 在 `agentFlow` 中存储生成的代码

## ✅ 问题修复和优化成果

### 1. 流程控制统一 ✅
**修复内容**:
- 创建 `hooks/use-chat-system-v2.ts` 使用完整的 `AgentOrchestrator` 编排
- 实现流式响应处理和自动Agent切换
- 统一使用 `SessionData` 类型管理会话状态

**核心改进**:
```typescript
// 新版本使用 AgentOrchestrator 的完整流程
const responseGenerator = agentOrchestrator.processUserInputStreaming(
  session.id,
  userInput || '',
  session
);

for await (const response of responseGenerator) {
  // 处理流式响应
  responses.push(response);
  setStreamingResponses([...responses]);
}
```

### 2. 状态管理统一 ✅
**修复内容**:
- 统一使用 `SessionData` 类型替代 `ChatSession`
- 实现完整的会话生命周期管理
- 添加会话统计和健康监控

**数据结构优化**:
```typescript
interface SessionData {
  id: string;
  status: 'active' | 'completed' | 'paused' | 'abandoned';
  conversationHistory: ConversationEntry[];
  agentFlow: AgentFlowEntry[];
  metadata: SessionMetadata; // 包含进度、指标、设置
}
```

### 3. 错误处理完善 ✅
**修复内容**:
- 实现智能重试机制 (最多3次)
- 添加会话健康状态监控
- 创建错误恢复建议系统
- 支持阶段重置和流程回退

**错误处理特性**:
```typescript
// 自动重试机制
if (retryCount < 3) {
  setRetryCount(prev => prev + 1);
  setTimeout(() => sendMessage(content, option), 1000 * (retryCount + 1));
}

// 智能恢复建议
const recommendation = agentOrchestrator.getRecoveryRecommendation(sessionData, error);
// recommendation.action: 'retry' | 'reset' | 'restart'
```

## 🆕 新增功能组件

### 1. 错误处理组件
**文件**: `components/chat/error-handler.tsx`
- 统一的错误显示界面
- 智能重试和重置按钮
- 错误分类和建议提示

### 2. 会话管理组件  
**文件**: `components/chat/session-manager.tsx`
- 会话列表显示和切换
- 会话状态和进度可视化
- 会话统计和健康监控

### 3. 增强的编排器功能
**文件**: `lib/utils/agent-orchestrator.ts`
- 会话健康状态检查 (`getSessionHealth`)
- 错误恢复建议 (`getRecoveryRecommendation`)  
- 阶段重置功能 (`resetToStage`)

## 🔧 使用方式

### 1. 启用新版本聊天系统
```typescript
// 替换原有的 useChatSystem
import { useChatSystemV2 } from "@/hooks/use-chat-system-v2";

const {
  currentSession,
  streamingResponses,
  currentError,
  retryCount,
  sendMessage,
  retryCurrentOperation,
  resetToStage
} = useChatSystemV2();
```

### 2. 集成错误处理
```tsx
<ErrorHandler
  error={currentError}
  retryCount={retryCount}
  onRetry={retryCurrentOperation}
  onReset={() => resetToStage('welcome')}
/>
```

### 3. 添加会话管理
```tsx
<SessionManager
  sessions={sessions}
  currentSession={currentSession}
  onSelectSession={selectSession}
  onDeleteSession={deleteSession}
  onCreateNewSession={createNewSession}
/>
```

## ✅ 总结

**主流程实现状态**: 🟢 基本完整

- ✅ 意图识别: 完整实现，AI驱动
- ✅ 信息收集: 完整实现，支持跳过
- ✅ 设计生成: 完整实现，AI增强
- ✅ 代码生成: 完整实现，多文件输出
- ⚠️ 流程编排: 部分实现，需要统一
- ⚠️ 状态管理: 基本实现，需要优化

**各模块间跳转**: 🟡 基本明确，需要完善

- ✅ JSON输出格式统一
- ✅ 跳转判断逻辑清晰
- ⚠️ 自动编排机制未完全启用
- ⚠️ 错误处理和回退机制待完善 