# 阶段1：依赖关系分析报告

## 🔍 AgentOrchestrator 依赖分析

基于代码分析，`AgentOrchestrator` 被以下20个文件引用：

### 🚨 核心依赖文件 (需要重点处理)

1. **API路由文件**
   - `app/api/chat/stream/route.ts` - 主要聊天流处理入口
   - `app/api/chat/interact/route.ts` - 用户交互处理
   - `app/api/session/route.ts` - 会话管理

2. **核心业务逻辑**
   - `hooks/use-chat-system-v2.ts` - 前端聊天系统主要hook
   - `lib/agents/base-agent.ts` - 基础Agent类
   - `lib/agents/data-flow-example.ts` - Agent间数据流示例

### 📚 文档和配置文件 (可以暂时保留)

3. **文档文件**
   - `docs/AGENT_DATA_FLOW_SUMMARY.md`
   - `docs/CODING_AGENT_IMPLEMENTATION_SUMMARY.md`
   - `lib/agents/coding/README.md`
   - `lib/utils/README.md`
   - 以及其他Markdown文档

### 🏗️ AgentOrchestrator 导入的依赖

```typescript
// 需要一起删除的Agent
import { ConversationalWelcomeAgent } from '@/lib/agents/welcome';
import { VercelAIInfoCollectionAgent } from '@/lib/agents/info-collection/vercel-ai-agent';
import { EnhancedPromptOutputAgent } from '@/lib/agents/prompt-output/enhanced-agent';

// 需要重构保留的Agent
import { CodingAgent } from '@/lib/agents/coding';

// 相关工具类
import { sessionManager } from './session-manager';
import { agentMappings } from './agent-mappings';
```

## 📋 阶段1详细执行计划

### Step 1.1: 创建备份和新的简单路由器 ⏳

```bash
# 备份现有文件
cp lib/utils/agent-orchestrator.ts lib/utils/agent-orchestrator-backup.ts
cp lib/agents.ts lib/agents-backup.ts
```

### Step 1.2: 创建新的简单消息路由器 ⏳

**文件**: `lib/routers/simple-message-router.ts`

**核心功能**:
- 用户档案检查
- 模式选择处理
- 直接路由到合适的Agent
- 简化的流式响应处理

### Step 1.3: 更新API路由文件 ⏳

#### `app/api/chat/stream/route.ts`
```typescript
// 旧的导入
import { agentOrchestrator } from '@/lib/utils/agent-orchestrator';

// 新的导入
import { simpleMessageRouter } from '@/lib/routers/simple-message-router';
```

#### `app/api/chat/interact/route.ts`
```typescript
// 简化交互处理逻辑
// 删除复杂的阶段管理
// 改为简单的模式切换
```

### Step 1.4: 更新前端Hook ⏳

#### `hooks/use-chat-system-v2.ts`
- 删除复杂的阶段管理逻辑
- 简化消息处理流程
- 添加用户档案和模式状态管理

### Step 1.5: 安全删除文件 ⏳

**删除顺序**（避免破坏依赖）:
1. 先更新所有引用文件
2. 删除Agent目录：
   - `lib/agents/welcome/`
   - `lib/agents/info-collection/`
   - `lib/agents/prompt-output/`
3. 删除工具文件：
   - `lib/utils/agent-orchestrator.ts`
   - `lib/utils/agent-mappings.ts`
4. 清理相关类型定义

## 🗄️ 数据库兼容性分析

### 现有会话数据结构
```typescript
chat_sessions.metadata = {
  progress: {
    currentStage: 'welcome' | 'info_collection' | 'page_design' | 'code_generation',
    percentage: number
  },
  welcomeHistory: any[],
  collectedInfo: any,
  // ... 其他复杂字段
}
```

### 新的简化结构
```typescript
chat_sessions.metadata = {
  mode: 'form' | 'professional' | null,
  hasUserProfile: boolean,
  formData?: ProjectRequirement,
  userProfile?: UserProfile
}
```

### 迁移策略
- **现有会话**: 保持兼容，添加默认值
- **新会话**: 使用新的简化结构
- **渐进式迁移**: 不强制迁移现有数据

## ⚠️ 风险评估和缓解策略

### 高风险点
1. **API中断**: 删除AgentOrchestrator可能导致现有API调用失败
2. **会话丢失**: 现有用户会话可能无法继续
3. **前端错误**: use-chat-system-v2的变更可能影响UI

### 缓解措施
1. **分步执行**: 一次只修改一个文件，立即测试
2. **回滚准备**: 保留备份文件，可快速回滚
3. **兼容性层**: 提供临时的兼容性适配器
4. **测试验证**: 每个步骤后都进行功能验证

## 📊 执行时间估算

| 任务 | 预计时间 | 风险等级 |
|------|----------|----------|
| 1.1 备份和分析 | 30分钟 | 低 |
| 1.2 创建简单路由器 | 90分钟 | 中 |
| 1.3 更新API路由 | 60分钟 | 高 |
| 1.4 更新前端Hook | 45分钟 | 高 |
| 1.5 安全删除文件 | 30分钟 | 中 |
| **总计** | **4.25小时** | **中高** |

## 🎯 成功标准

### 阶段1完成标准
- [ ] 所有AgentOrchestrator引用已更新
- [ ] 新的SimpleMessageRouter可以处理基本消息
- [ ] API路由正常响应
- [ ] 前端可以发送和接收消息
- [ ] 现有会话数据保持兼容
- [ ] 删除的文件不再被引用

### 验证步骤
1. **启动测试**: 应用可以正常启动
2. **API测试**: /api/chat/stream 端点正常响应
3. **前端测试**: 可以创建新会话并发送消息
4. **兼容性测试**: 现有会话数据可以正常加载

## 📝 下一步行动

**立即可以开始的任务**:
1. 创建`lib/routers/simple-message-router.ts`基础框架
2. 分析`app/api/chat/stream/route.ts`的现有逻辑
3. 准备`hooks/use-chat-system-v2.ts`的简化方案

**需要谨慎处理的任务**:
1. 更新API路由逻辑（影响现有功能）
2. 删除Agent目录（不可逆操作）
3. 数据库结构变更（影响持久化）

---

**分析完成时间**: 2025-01-08
**风险评级**: 中高风险
**建议**: 建议从低风险任务开始，逐步推进
