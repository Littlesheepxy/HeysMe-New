# 🛠️ Claude工具架构 - 完善版设计文档

## 🎯 架构概述

新的Claude工具架构采用**模块化分类管理**设计，将原有的单一工具文件拆分为清晰的分类结构，提供更好的可维护性和扩展性。

### 📂 目录结构

```
lib/agents/info-collection/tools/
├── index.ts                    # 统一导出接口
├── types.ts                   # TypeScript类型定义
├── config.ts                  # 工具配置管理
├── registry.ts               # 工具注册表
├── executors.ts              # 工具执行器
├── utils.ts                  # 通用工具函数
├── categories/               # 分类工具定义
│   ├── github-tools.ts       # GitHub相关工具
│   ├── web-tools.ts          # 网页抓取工具
│   ├── document-tools.ts     # 文档处理工具
│   └── social-tools.ts       # 社交平台工具
└── README.md                 # 本文档
```

## 🔧 核心组件

### 1. **类型系统 (types.ts)**
- 定义了完整的TypeScript类型接口
- 支持工具分类、优先级、元数据等高级特性
- 提供强类型检查和IDE支持

```typescript
export interface ClaudeToolDefinition {
  name: string;
  description: string;
  category: ToolCategory;
  priority: number;
  input_schema: { /* JSON Schema */ };
  metadata?: {
    version: string;
    estimatedTime: number;
    tags: string[];
  };
}
```

### 2. **配置管理 (config.ts)**
- 集中管理所有工具的配置参数
- 支持超时、重试、并行等策略配置
- 基于用户角色的优先级动态调整

```typescript
export const TOOL_CONFIGS: Record<string, ToolConfig> = {
  analyze_github: {
    timeout: 15000,
    retries: 2,
    parallel: true,
    cache: true
  }
  // ...
};
```

### 3. **工具注册表 (registry.ts)**
- 单例模式的工具管理器
- 支持动态注册、查询、分类和搜索
- 智能工具选择算法

```typescript
// 根据用户角色获取推荐工具
const tools = getRecommendedTools('开发者', 5);

// 智能工具选择
const optimal = selectOptimalTools({
  userInput: "这是我的GitHub",
  userRole: '开发者',
  maxTools: 3
});
```

### 4. **执行器系统 (executors.ts)**
- 连接工具定义与实际服务实现
- 提供安全执行、重试机制、并行处理
- 统一的错误处理和结果格式化

```typescript
// 安全执行单个工具
const result = await executeToolSafely('analyze_github', params);

// 并行执行多个工具
const results = await executeToolsInParallel([
  { name: 'analyze_github', params: githubParams },
  { name: 'scrape_webpage', params: webParams }
]);
```

## 📋 工具分类

### 🐙 GitHub工具 (github-tools.ts)
- **analyze_github**: 深度分析GitHub用户和仓库
- **analyze_github_repo**: 单个仓库深度分析（规划中）

**特点**：
- 支持用户名和URL自动识别
- 技术栈统计和活跃度分析
- 项目影响力评估

### 🌐 网页工具 (web-tools.ts)
- **scrape_webpage**: 智能网页内容抓取
- **extract_social_links**: 社交链接专门提取
- **analyze_webpage_seo**: SEO分析（规划中）

**特点**：
- 智能网站类型识别
- iframe适用性评估
- 安全的内容解析

### 📄 文档工具 (document-tools.ts)
- **parse_document**: 通用文档解析
- **analyze_pdf_advanced**: 高级PDF分析

**特点**：
- 多格式支持（PDF、Word、Excel等）
- 智能结构识别
- OCR和表格处理

### 💼 社交工具 (social-tools.ts)
- **extract_linkedin**: LinkedIn信息提取（合规版）
- **analyze_social_media**: 通用社交媒体分析
- **integrate_social_network**: 跨平台整合（规划中）

**特点**：
- 合规的数据获取方式
- 多平台支持
- 影响力评估

## 🎯 优势特性

### ✅ **模块化架构**
- **高内聚低耦合**：每个分类独立管理
- **易于扩展**：新增工具只需添加到相应分类
- **便于维护**：修改不影响其他模块

### 🔧 **智能化管理**
- **角色优化**：根据用户身份推荐最适合的工具
- **动态配置**：实时调整超时、重试等参数
- **智能选择**：自动识别输入内容并推荐工具

### 🛡️ **安全可靠**
- **错误隔离**：单个工具失败不影响整体流程
- **重试机制**：指数退避的智能重试
- **超时保护**：避免长时间阻塞

### 📊 **性能优化**
- **并行执行**：多工具同时处理提升效率
- **缓存策略**：稳定数据的智能缓存
- **资源管理**：合理的并发控制

## 🚀 使用示例

### 基础使用

```typescript
import { 
  analyzeUserInput,
  executeToolsInParallel,
  getRecommendedTools
} from '@/lib/agents/info-collection/tools';

// 1. 分析用户输入
const analysis = analyzeUserInput(
  "这是我的GitHub: https://github.com/username", 
  '开发者'
);

// 2. 执行推荐的工具
const results = await executeToolsInParallel(
  analysis.tool_suggestions.map(s => ({
    name: s.name,
    params: s.params
  }))
);

// 3. 处理结果
results.forEach(result => {
  if (result.success) {
    console.log(`${result.tool_name} 成功:`, result.data);
  } else {
    console.error(`${result.tool_name} 失败:`, result.error);
  }
});
```

### 高级用法

```typescript
// 获取角色推荐工具
const recommendedTools = getRecommendedTools('设计师', 5);

// 搜索特定功能的工具
const githubTools = searchTools('github');

// 验证工具参数
const validation = validateToolParams('analyze_github', {
  username_or_url: 'username',
  include_repos: true
});

// 生成使用建议
const suggestions = generateToolUsageSuggestions('开发者');
```

## 📈 与原版本的对比

| 特性 | 原版本 (claude-tools.ts) | 新版本 (模块化架构) |
|------|-------------------------|-------------------|
| **文件组织** | 单一文件，580行代码 | 多文件模块，平均150行 ✅ |
| **工具管理** | 静态数组 | 动态注册表 ✅ |
| **配置管理** | 硬编码 | 集中配置管理 ✅ |
| **类型安全** | 基础类型 | 完整类型系统 ✅ |
| **扩展性** | 修改核心文件 | 独立模块添加 ✅ |
| **错误处理** | 基础处理 | 多层级错误策略 ✅ |
| **性能优化** | 串行执行 | 智能并行处理 ✅ |
| **用户体验** | 通用推荐 | 角色化个性推荐 ✅ |

## 🔄 迁移指南

### 从原版本迁移

1. **更新导入**：
```typescript
// 原版本
import { CLAUDE_INFO_COLLECTION_TOOLS } from './claude-tools';

// 新版本
import { getAllTools, getRecommendedTools } from './tools';
```

2. **使用新API**：
```typescript
// 原版本
const tools = CLAUDE_INFO_COLLECTION_TOOLS;

// 新版本
const tools = getRecommendedTools(userRole);
```

3. **执行工具**：
```typescript
// 原版本
const results = await executeToolsInParallel(toolCalls);

// 新版本（相同API，功能增强）
const results = await executeToolsInParallel(toolCalls);
```

### 向后兼容

新架构保持了与现有系统的兼容性：
- ✅ Agent接口不变
- ✅ 工具执行结果格式一致
- ✅ 错误处理机制兼容
- ✅ 现有配置继续有效

## 🎯 最佳实践

### 1. 工具开发
- 每个工具应有详细的描述（>300字符）
- 提供完整的参数验证
- 包含错误处理和降级方案
- 添加适当的元数据和标签

### 2. 配置管理
- 根据工具特性设置合理的超时时间
- 考虑网络条件调整重试策略
- 为稳定数据启用缓存
- 设置适当的并行限制

### 3. 性能优化
- 优先使用并行执行
- 避免不必要的重复调用
- 合理使用缓存策略
- 监控执行时间和成功率

### 4. 用户体验
- 提供清晰的错误信息
- 给出具体的解决建议
- 支持渐进式功能降级
- 保持响应式的用户反馈

## 🔮 未来规划

### 短期目标
- [ ] 完善所有规划中的工具实现
- [ ] 添加工具执行监控和统计
- [ ] 优化缓存策略和性能
- [ ] 完善错误分类和处理

### 长期目标
- [ ] AI驱动的工具推荐优化
- [ ] 分布式工具执行支持
- [ ] 插件化工具加载机制
- [ ] 工具执行可视化面板

## 📝 总结

新的Claude工具架构通过模块化设计，实现了：

🎯 **清晰的结构** - 分类管理，职责明确
🔧 **强大的功能** - 智能推荐，动态配置
🛡️ **可靠的执行** - 错误隔离，安全保护
📈 **优秀的性能** - 并行处理，缓存优化
🚀 **便捷的使用** - 简单API，丰富功能

这个架构为HeysMe平台的信息收集能力提供了坚实的技术基础，支持未来的扩展和优化需求。 