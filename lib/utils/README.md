# Agent编排器模块重构说明

## 重构目标

原始的 `agent-orchestrator.ts` 文件过于庞大（1135行），包含了多个不同的职责，不利于维护和测试。重构后将其分拆为多个职责单一的模块。

## 新的模块架构

### 1. `types/orchestrator.ts` - 类型定义
**职责**: 定义编排器相关的TypeScript类型接口

**主要类型**:
- `AgentMappingConfig` - Agent映射配置
- `AgentMetrics` - Agent执行统计
- `AgentFlowRecord` - Agent执行记录  
- `RecoveryRecommendation` - 错误恢复建议
- `SessionHealth` - 会话健康状态
- `SessionStats` - 会话统计信息
- `UserInteractionResult` - 用户交互结果

### 2. `agent-mappings.ts` - Agent映射管理
**职责**: 管理Agent与阶段之间的映射关系，提供统一的配置接口

**核心功能**:
- Agent名称与阶段名称的双向映射
- Agent执行序列管理
- 进度计算
- 名称标准化
- 配置验证

**使用示例**:
```typescript
import { agentMappings } from './agent-mappings';

// 获取下一个Agent
const nextAgent = agentMappings.getNextAgent('welcome');

// 计算进度
const progress = agentMappings.calculateProgress('info_collection');

// 验证配置
const isValid = agentMappings.isValidStage('welcome');
```

### 3. `session-storage.ts` - 会话存储管理
**职责**: 负责会话数据的持久化存储，支持多种存储方式

**核心功能**:
- 浏览器localStorage支持
- 服务器文件系统存储
- 自动环境检测
- 数据序列化/反序列化
- 存储统计和清理

**存储位置**:
- 浏览器: `localStorage['heysme_sessions']`
- 服务器: `${process.cwd()}/.sessions/*.json`

### 4. `session-manager.ts` - 会话生命周期管理
**职责**: 负责会话的CRUD操作和状态管理

**核心功能**:
- 会话创建、查询、更新、删除
- 会话健康状态监控
- 错误恢复建议
- Agent执行记录
- 过期会话清理

**API示例**:
```typescript
import { sessionManager } from './session-manager';

// 创建会话
const sessionId = sessionManager.createSession();

// 获取会话
const session = sessionManager.getSession(sessionId);

// 获取统计
const stats = sessionManager.getSessionStats();
```

### 5. `agent-orchestrator-refactored.ts` - 主编排器
**职责**: 专注于Agent的协调和流程控制，会话管理委托给SessionManager

**核心功能**:
- Agent初始化和管理
- 流式响应处理
- 用户交互处理
- Agent间的跳转控制
- 错误处理和恢复

## 使用方式

### 更新导入路径

**旧方式**:
```typescript
import { agentOrchestrator } from '@/lib/utils/agent-orchestrator';
```

**新方式**:
```typescript
import { agentOrchestrator } from '@/lib/utils/agent-orchestrator-refactored';
```

### API保持兼容

所有公开的API保持不变，可以无缝替换：

```typescript
// 创建会话
const sessionId = agentOrchestrator.createSession();

// 处理用户输入
for await (const response of agentOrchestrator.processUserInputStreaming(sessionId, userInput)) {
  // 处理响应
}

// 处理用户交互
const result = await agentOrchestrator.handleUserInteraction(sessionId, 'interaction', data, sessionData);
```

## 切换步骤

1. **备份原文件**:
   ```bash
   mv lib/utils/agent-orchestrator.ts lib/utils/agent-orchestrator-backup.ts
   ```

2. **重命名新文件**:
   ```bash
   mv lib/utils/agent-orchestrator-refactored.ts lib/utils/agent-orchestrator.ts
   ```

3. **验证导入**:
   确保所有使用 `agentOrchestrator` 的地方都能正常工作

4. **测试功能**:
   运行完整的测试套件确保功能正常

## 优势

### 1. **职责分离**
- 每个模块专注于单一职责
- 降低模块间耦合度
- 提高代码复用性

### 2. **可维护性**
- 文件大小合理（每个模块<500行）
- 清晰的模块边界
- 完善的类型定义和注释

### 3. **可测试性**
- 每个模块可独立测试
- Mock和Stub更容易实现
- 测试覆盖率更高

### 4. **可扩展性**
- 新功能可以添加到对应模块
- 配置集中管理
- 存储机制可插拔

## 性能影响

- **内存**: 模块化后内存占用基本相同
- **启动**: 可能略微增加模块加载时间（<10ms）
- **运行**: 运行时性能基本相同
- **存储**: 支持文件系统存储，提高持久性

## 监控和调试

每个模块都有详细的日志输出，便于调试：

```
✅ [编排器] 初始化了 4 个Agent
✅ [会话管理器] 初始化完成，恢复了 3 个会话
✅ [存储-服务器] 从文件系统加载了 3 个会话
🎯 [编排器] 阶段 welcome -> Agent welcome
```

## 注意事项

1. **依赖关系**: 确保新模块的导入路径正确
2. **类型兼容**: AgentFlowRecord类型已调整为兼容SessionData
3. **存储权限**: 服务器环境需要写入`.sessions`目录的权限
4. **异步操作**: SessionManager的某些方法现在是异步的

## 后续优化

1. **Redis支持**: 可以添加Redis作为存储后端
2. **配置外部化**: 将配置移到外部配置文件
3. **插件机制**: 支持自定义Agent和存储插件
4. **性能监控**: 添加详细的性能监控指标 

# 工具集合

## 会话管理系统

### 存储架构
- **数据库**: Supabase PostgreSQL
- **表结构**: 
  - `chat_sessions` - 会话主表
  - `conversation_entries` - 对话记录表
  - `agent_flows` - 代理流程表

### 使用方法
```typescript
import { sessionManager } from '@/lib/utils/session-manager';

// 创建会话
const sessionId = await sessionManager.createSession();

// 获取会话
const session = await sessionManager.getSession(sessionId);

// 更新会话
await sessionManager.updateSession(sessionId, updatedSession);
```

### 数据安全
- 使用 Clerk 用户认证
- 行级安全策略 (RLS)
- 用户数据隔离 