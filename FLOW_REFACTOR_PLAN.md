# HeysMe 流程重构计划

## 🎯 总体目标

将现有的复杂多代理流程重构为简化的用户体验：
- **用户信息收集**：首次使用时收集用户画像
- **模式选择**：每次新对话选择普通模式（表单）或专业模式（直接对话）
- **Open Lovable 集成**：统一使用 Open Lovable 进行代码生成

## 📋 当前状态

- ✅ **Git 分支创建**：`feature/simplified-flow-architecture`
- ⏳ **架构分析**：正在进行
- ⏳ **重构计划**：制定中

## 🏗️ 重构架构概览

### 现有架构（需要删除）
```
用户输入 → AgentOrchestrator → WelcomeAgent → InfoCollectionAgent → PromptOutputAgent → CodingAgent
```

### 新架构（目标）
```
用户输入 → SimpleRouter → [用户档案检查] → [模式选择] → Open Lovable Agent
```

## 📂 文件变更计划

### 🗑️ 需要删除的文件
- [ ] `lib/utils/agent-orchestrator.ts`
- [ ] `lib/utils/agent-mappings.ts` 
- [ ] `lib/agents/welcome/` (整个目录)
- [ ] `lib/agents/info-collection/` (整个目录)
- [ ] `lib/agents/prompt-output/` (整个目录)

### 🔄 需要重构的文件
- [ ] `lib/agents.ts` → 简化为 `SimpleMessageRouter`
- [ ] `hooks/use-chat-system-v2.ts` → 简化消息处理逻辑
- [ ] `lib/agents/coding/` → 重命名/重构为 `lib/agents/open-lovable/`

### 🆕 需要创建的文件
- [ ] `lib/routers/simple-message-router.ts`
- [ ] `lib/services/user-profile-service.ts`
- [ ] `components/onboarding/UserProfileForm.tsx`
- [ ] `components/chat/ModeSelector.tsx`
- [ ] `components/forms/ProjectRequirementForm.tsx`
- [ ] `lib/agents/open-lovable/agent.ts`

## 🗄️ 数据库变更

### 新增表
```sql
-- 用户档案表
CREATE TABLE user_profiles (
  user_id text PRIMARY KEY REFERENCES users(id),
  profile_data jsonb NOT NULL,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);
```

### 会话元数据简化
```typescript
// 现有复杂结构
sessionData.metadata = {
  progress: { currentStage, percentage },
  welcomeHistory: [...],
  collectedInfo: {...},
  // 等等复杂字段
}

// 新的简化结构
sessionData.metadata = {
  mode: 'form' | 'professional',
  hasUserProfile: boolean,
  formData?: ProjectRequirement,
  userProfile?: UserProfile
}
```

## 🚀 实施阶段

### 阶段 1：清理现有代码 
**目标**：删除复杂的多代理编排系统

**子任务**：
- [ ] 1.1 分析依赖关系，确定安全删除顺序
- [ ] 1.2 删除 `AgentOrchestrator` 相关文件
- [ ] 1.3 删除 Welcome/InfoCollection/PromptOutput Agent
- [ ] 1.4 简化会话状态管理
- [ ] 1.5 更新 API 路由，移除复杂的阶段管理

**预计时间**：2-3小时

### 阶段 2：实现新的简单路由器
**目标**：创建简化的消息处理逻辑

**子任务**：
- [ ] 2.1 创建 `SimpleMessageRouter` 类
- [ ] 2.2 实现用户档案检查逻辑
- [ ] 2.3 实现模式选择逻辑
- [ ] 2.4 集成 Open Lovable Agent 基础框架
- [ ] 2.5 更新 API 端点处理逻辑

**预计时间**：3-4小时

### 阶段 3：前端界面适配
**目标**：在现有聊天界面内集成新的组件

**子任务**：
- [ ] 3.1 创建 `UserProfileForm` 组件
- [ ] 3.2 创建 `ModeSelector` 组件  
- [ ] 3.3 创建 `ProjectRequirementForm` 组件
- [ ] 3.4 在 `ChatModeView` 内添加条件渲染逻辑
- [ ] 3.5 更新前端状态管理

**预计时间**：4-5小时

### 阶段 4：测试和集成
**目标**：确保新流程正常工作

**子任务**：
- [ ] 4.1 端到端流程测试
- [ ] 4.2 数据库迁移和兼容性测试
- [ ] 4.3 UI/UX 优化
- [ ] 4.4 错误处理和边界情况
- [ ] 4.5 性能优化

**预计时间**：2-3小时

## 📊 进度跟踪

### 完成情况
- [x] 项目分析和计划制定
- [x] Git 分支创建
- [ ] 阶段 1：清理现有代码 (0%)
- [ ] 阶段 2：实现简单路由器 (0%)
- [ ] 阶段 3：前端界面适配 (0%)
- [ ] 阶段 4：测试和集成 (0%)

**总体进度：10%**

## 🎯 成功标准

### 用户体验目标
1. **首次用户**：注册后立即收集用户档案，一次性完成
2. **每次对话**：清晰的模式选择，无需多轮对话确认
3. **普通模式**：通过表单快速输入项目需求
4. **专业模式**：直接对话，适合有经验的用户
5. **代码生成**：统一使用 Open Lovable，提供一致的体验

### 技术目标
1. **代码简化**：删除 80% 的复杂多代理代码
2. **性能提升**：减少 50% 的对话轮次
3. **维护性**：新架构易于理解和扩展
4. **兼容性**：保持现有数据和用户会话的兼容

## 🚨 风险评估

### 高风险
- **数据丢失**：删除代理时可能影响现有会话
- **用户体验中断**：重构期间功能可能不可用

### 缓解措施
- 在分支上进行所有开发
- 保留数据库备份
- 分阶段部署，可随时回滚

## 📝 下一步行动

1. **立即执行**：开始阶段1的依赖关系分析
2. **短期计划**：完成现有代码清理工作
3. **中期计划**：实现新的简单路由器
4. **长期计划**：完整的前端适配和测试

---

**文档创建时间**：2025-01-08
**最后更新时间**：2025-01-08
**负责人**：开发团队
**状态**：进行中
