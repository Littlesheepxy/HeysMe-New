# 🔄 信息和展示策略传递给 Prompt Output Agent 总结

## 🎯 **回答您的问题**

关于"信息和展示策略如何传递给 `@prompt-output/` 这个agent"，我已经设计了一套完整的解决方案：

## 📊 **数据传递流程**

### 1. **数据流向设计**
```
用户输入 → Info Collection Agent → 工具调用结果 → Content Display Engine → 展示策略分析 → Enhanced Prompt Output Agent → 设计策略 + 开发提示
```

### 2. **三种传递方式**

#### 方式1: 直接参数传递（推荐）
```typescript
// 创建增强版的 EnhancedPromptOutputAgent
const enhancedAgent = new EnhancedPromptOutputAgent();

// 准备完整的输入数据
const input: EnhancedPromptOutputInput = {
  collected_data: collectedData,        // 用户基础信息
  tool_results: toolResults,            // 工具解析结果
  display_strategies: displayStrategies, // 展示策略分析
  content_analysis: contentAnalysis,     // 内容分析结果
  user_goal: "create_portfolio",
  user_type: "developer"
};

// 调用处理
for await (const response of enhancedAgent.process(input, sessionData)) {
  // 处理流式响应
}
```

#### 方式2: Session Data 传递
```typescript
// 将数据存储在 sessionData 中
sessionData.metadata.toolResults = toolResults;
sessionData.metadata.displayStrategies = displayStrategies;
sessionData.metadata.contentAnalysis = contentAnalysis;

// Agent 从 session 中读取
const agent = new EnhancedPromptOutputAgent();
await agent.process({}, sessionData);
```

#### 方式3: Agent 编排器（完整流程）
```typescript
// 使用 AgentOrchestrator 管理整个流程
const orchestrator = new AgentOrchestrator();
const result = await orchestrator.processUserRequest(userInput, sessionData);

// 自动处理: 信息收集 → 内容分析 → 设计策略 → 开发提示
```

## 🔧 **核心实现文件**

### 1. **增强版 Agent** (`lib/agents/prompt-output/enhanced-agent.ts`)
- 集成了内容展示策略分析
- 支持响应式设计优化
- 处理不可访问内容的备选方案
- 生成详细的开发指导

### 2. **类型定义** (`lib/agents/prompt-output/types.ts`)
- `EnhancedPromptOutputInput`: 输入数据格式
- `ContentDisplayStrategy`: 展示策略定义
- `ContentAnalysisResult`: 内容分析结果
- `AgentDataTransfer`: Agent间数据传递格式

### 3. **数据流示例** (`lib/agents/data-flow-example.ts`)
- 完整的 Agent 编排器实现
- 展示了端到端的数据传递流程
- 包含错误处理和回退机制

### 4. **集成指南** (`lib/agents/prompt-output/integration-guide.md`)
- 详细的使用说明和最佳实践
- 配置选项和性能优化建议
- 实际代码示例

## 📋 **数据结构示例**

### 输入数据格式
```typescript
{
  // 基础信息
  collected_data: {
    user_info: { name, role, skills },
    preferences: { style, colors }
  },
  
  // 工具解析结果
  tool_results: [
    {
      id: "github_1",
      tool_name: "analyze_github",
      source_url: "https://github.com/user",
      extracted_data: { github: {...} },
      display_strategy: {
        content_classification: {...},
        accessibility_status: {...},
        embedding_capability: {...}
      }
    }
  ],
  
  // 用户目标
  user_goal: "create_portfolio",
  user_type: "developer"
}
```

### 输出数据格式
```typescript
{
  // 增强的设计策略
  design_strategy: {
    layout: "portfolio_showcase",
    theme: "tech_blue",
    sections: [...],
    contentIntegration: {
      displayMethods: [...],
      restrictedContentHandling: [...],
      interactionPatterns: [...]
    }
  },
  
  // 详细的开发提示
  development_prompt: "包含具体实现细节的开发指导..."
}
```

## 🚀 **使用方法**

### 快速开始
```typescript
// 1. 创建增强版 agent
const agent = new EnhancedPromptOutputAgent();

// 2. 准备数据
const input = {
  collected_data: sessionData.collectedData,
  tool_results: sessionData.metadata?.toolResults || [],
  user_goal: extractUserGoal(sessionData),
  user_type: extractUserType(sessionData)
};

// 3. 处理请求
for await (const response of agent.process(input, sessionData)) {
  if (response.system_state?.done) {
    const designStrategy = response.system_state.metadata?.designStrategy;
    const developmentPrompt = response.system_state.metadata?.developmentPrompt;
    
    // 传递给下一个 agent
    await codingAgent.process({ designStrategy, developmentPrompt });
  }
}
```

### 集成到现有系统
```typescript
// 在现有的 agent 协调器中
export class ExistingAgentCoordinator {
  async processDesignRequest(sessionData: SessionData) {
    // 获取信息收集结果
    const toolResults = sessionData.metadata?.toolResults || [];
    
    // 分析展示策略
    const displayStrategies = toolResults.map(result => 
      contentDisplayEngine.analyzeContent(result)
    );
    
    // 调用增强版 prompt-output agent
    const enhancedAgent = new EnhancedPromptOutputAgent();
    return enhancedAgent.process({
      collected_data: sessionData.collectedData,
      tool_results: toolResults,
      display_strategies: displayStrategies,
      user_goal: sessionData.userGoal,
      user_type: sessionData.userType
    }, sessionData);
  }
}
```

## ✨ **主要优势**

### 1. **智能内容分析**
- 自动分析每个信息源的最佳展示方式
- 识别不可访问内容并提供备选方案
- 基于内容质量调整展示策略

### 2. **响应式优化**
- 为桌面、平板、移动端制定不同策略
- 确保在所有设备上的最佳用户体验
- 支持渐进式增强

### 3. **个性化设计**
- 基于用户类型（开发者、设计师等）定制方案
- 考虑用户偏好和目标受众
- 整合所有信息源的展示策略

### 4. **详细开发指导**
- 生成包含具体实现细节的开发提示
- 提供技术栈建议和性能优化指导
- 包含无障碍功能和SEO考虑

## 🎯 **总结**

通过这套完整的解决方案，您可以：

1. ✅ **无缝数据传递**: 从信息收集到设计策略的完整数据流
2. ✅ **智能策略分析**: AI自动分析最佳展示方式
3. ✅ **响应式优化**: 针对不同设备的专门优化
4. ✅ **灵活集成**: 支持多种集成方式，适应现有架构
5. ✅ **完整文档**: 详细的使用指南和最佳实践

现在您的 `prompt-output` agent 不仅能接收基础的用户信息，还能获得详细的内容展示策略分析，从而生成更智能、更个性化的页面设计方案！
