# 📊 Info Collection Module - 信息收集模块

基于Claude官方工具调用最佳实践的优化版信息收集模块。

## 🎯 模块架构

### 🔄 三种Agent策略

#### 1. InfoCollectionAgent（原始版本）
- **交互方式**：结构化表单
- **适用场景**：传统的材料收集，需要明确的表单字段
- **优势**：流程清晰、用户理解成本低
- **prompt来源**：`AGENT_PROMPTS.INFO_COLLECTION_AGENT`

#### 2. ConversationalInfoCollectionAgent（对话版本）  
- **交互方式**：自然对话 + 自定义工具链
- **适用场景**：复杂的对话交互，需要高度定制的工具逻辑
- **优势**：最大灵活性、可扩展强
- **prompt来源**：`AGENT_PROMPTS.CONVERSATIONAL_INFO_COLLECTION_AGENT`

#### 3. OptimizedInfoCollectionAgent（推荐版本）⭐
- **交互方式**：Claude标准工具调用
- **适用场景**：生产环境、标准化流程
- **优势**：遵循Claude官方最佳实践、性能优化、维护简单
- **prompt来源**：`AGENT_PROMPTS.OPTIMIZED_INFO_COLLECTION_AGENT`

## ✅ 架构优化亮点

### 🎯 统一Prompt管理
```typescript
// 所有Agent都从agent-templates.ts获取prompt
import { AGENT_PROMPTS, formatPrompt } from '@/lib/prompts/agent-templates';

const prompt = formatPrompt(AGENT_PROMPTS.OPTIMIZED_INFO_COLLECTION_AGENT, {
  user_role: welcomeData.userRole,
  use_case: welcomeData.useCase,
  urgency: welcomeData.urgency,
  // ... 其他welcome参数
});
```

### 📋 Welcome参数充分利用
```typescript
// 用户画像信息完整传递
const welcomeData = {
  userRole: '软件工程师',      // 影响收集优先级
  useCase: '求职简历',         // 影响推进阈值  
  urgency: '快速体验',         // 影响完整度要求
  style: '现代简约'            // 影响后续设计
};

// 基于身份的智能收集策略
const collectionPriority = getCollectionPriority(userRole);
// 开发者: ['GitHub', '技术博客', '简历', '开源项目']
// 设计师: ['作品集', 'Behance', 'Dribbble', '简历']
```

### 🛠️ Claude标准工具集
```typescript
// 遵循Claude官方最佳实践的工具定义
export const CLAUDE_INFO_COLLECTION_TOOLS: ClaudeToolDefinition[] = [
  {
    name: 'analyze_github',
    description: `深度分析GitHub用户资料和仓库信息。此工具用于提取用户的技术技能、项目经验和开源贡献情况。
    
    使用场景：
    - 当用户提供GitHub用户名或完整URL时
    - 需要分析开发者的技术背景和项目经验时
    // ... 3-4句详细描述
    `,
    input_schema: {
      type: 'object',
      properties: { /* 详细schema */ },
      required: ['username_or_url']
    }
  }
  // ... 其他工具
];
```

## 🎯 核心特性

### ✅ 遵循Claude官方最佳实践
- 详细的工具描述（3-4句以上）
- 明确的使用场景和参数说明
- 标准化的JSON Schema定义
- 优雅的错误处理和降级机制

### 🛠️ 固定流程设计
1. **分析用户输入** - 智能识别链接和资源
2. **并行工具调用** - 同时处理多个资源提高效率
3. **结果整合** - 标准化数据格式和存储
4. **智能响应** - 根据收集进度决定下一步

### 🔧 工具集合
- `analyze_github` - GitHub深度分析
- `scrape_webpage` - 智能网页抓取
- `parse_document` - 文档解析处理
- `extract_linkedin` - LinkedIn信息提取

## 📋 使用方式

### 1. 导入优化版Agent

```typescript
import { OptimizedInfoCollectionAgent } from '@/lib/agents/info-collection';

// 创建Agent实例
const agent = new OptimizedInfoCollectionAgent();
```

### 2. 处理用户输入

```typescript
// 用户提供GitHub链接的场景
const userInput = {
  user_input: "这是我的GitHub: https://github.com/username 还有我的个人网站 https://mysite.com"
};

// 处理并获取流式响应
for await (const response of agent.process(userInput, sessionData)) {
  console.log(response);
}
```

### 3. 直接使用工具调用

```typescript
import { 
  CLAUDE_INFO_COLLECTION_TOOLS,
  executeToolsInParallel,
  selectToolsForInput
} from '@/lib/agents/info-collection';

// 智能识别需要的工具
const toolSuggestions = selectToolsForInput(userInput);

// 并行执行工具调用
const results = await executeToolsInParallel(toolSuggestions);
```

## 🎨 工具定义示例

### GitHub分析工具

```json
{
  "name": "analyze_github",
  "description": "深度分析GitHub用户资料和仓库信息。此工具用于提取用户的技术技能、项目经验和开源贡献情况。使用场景：当用户提供GitHub用户名或完整URL时，需要分析开发者的技术背景和项目经验时，用于自动填充技术技能和项目信息。返回信息包括：用户基本信息、粉丝数和关注数、主要编程语言统计、前10个最受欢迎的仓库、贡献统计和活跃度分析。",
  "input_schema": {
    "type": "object",
    "properties": {
      "username_or_url": {
        "type": "string",
        "description": "GitHub用户名或完整的GitHub用户页面URL"
      },
      "include_repos": {
        "type": "boolean", 
        "description": "是否包含仓库详细信息，默认为true"
      }
    },
    "required": ["username_or_url"]
  }
}
```

## 📊 数据流转

### 输入处理流程
```
用户输入 → Claude分析 → 工具选择 → 并行执行 → 结果整合 → 响应生成
```

### 数据结构示例

```typescript
// 工具调用结果格式
interface ToolResult {
  tool_name: string;
  success: boolean;
  data?: any;
  confidence: number;
  metadata: {
    extracted_at: string;
    data_quality: 'high' | 'medium' | 'low';
  };
}

// 会话数据更新
interface CollectedData {
  personal: PersonalInfo;
  professional: ProfessionalInfo;
  projects: Project[];
  experience: WorkExperience[];
  // ...
}
```

## 🔄 错误处理策略

### 1. 工具调用失败
- 提供详细错误信息
- 建议替代操作方案
- 支持继续流程或重试

### 2. 部分成功场景
- 展示成功收集的信息
- 标记失败的工具调用
- 引导用户补充缺失信息

### 3. 网络或API问题
- 自动降级到本地分析
- 使用模拟数据保证流程连续性
- 提供用户友好的错误说明

## 📈 性能优化

### 并行工具调用
```typescript
// 同时处理多个链接
const toolCalls = [
  { name: 'analyze_github', params: { username_or_url: githubUrl } },
  { name: 'scrape_webpage', params: { url: portfolioUrl } },
  { name: 'extract_linkedin', params: { profile_url: linkedinUrl } }
];

const results = await executeToolsInParallel(toolCalls);
```

### 智能推进机制
- 根据用户类型设定不同的完整度阈值
- 快速体验模式：30%即可推进
- 标准模式：60%推进
- 详细模式：80%推进

## 🔧 配置选项

### Agent配置
```typescript
const capabilities: AgentCapabilities = {
  canStream: true,
  requiresInteraction: false, // 无需表单交互
  outputFormats: ['json', 'text'],
  maxRetries: 3,
  timeout: 30000
};
```

### 工具配置
```typescript
// 自定义工具执行器
const customExecutors = {
  ...TOOL_EXECUTORS,
  custom_tool: async (params) => {
    // 自定义工具逻辑
    return await customToolService.execute(params);
  }
};
```

## 🚀 最佳实践

1. **详细的工具描述** - 确保Claude能正确理解工具用途
2. **并行处理** - 同时处理多个资源提高效率
3. **渐进式收集** - 根据完整度智能推进流程
4. **优雅降级** - API失败时提供备选方案
5. **用户体验** - 清晰的进度反馈和错误提示

## 📝 注意事项

- LinkedIn工具需要用户授权或数据导出
- 网页抓取受目标网站的CORS和防爬虫策略限制
- GitHub API有速率限制，建议配置GitHub Token
- 文档解析功能需要相应的解析库支持

## 🔄 版本兼容性

- `InfoCollectionAgent` - 原始版本（表单交互）
- `ConversationalInfoCollectionAgent` - 对话版本（自定义工具）
- `OptimizedInfoCollectionAgent` - 优化版本（Claude标准工具）**推荐**

选择`OptimizedInfoCollectionAgent`以获得最佳的Claude工具调用体验！ 