# 🧠 多Agent动态简历生成系统设计文档

## 📋 目录

1. [系统概览](#系统概览)
2. [Agent架构设计](#agent架构设计)
3. [流式显示与交互设计](#流式显示与交互设计)
4. [Prompt模板集](#prompt模板集)
5. [状态管理系统](#状态管理系统)
6. [实现步骤指南](#实现步骤指南)
7. [容错与回退机制](#容错与回退机制)
8. [前端集成方案](#前端集成方案)

---

## 🧱 系统概览

### 核心理念
通过多个专业化的AI Agent协作，为用户生成个性化的动态简历页面。每个Agent负责特定的任务阶段，通过结构化的输入输出和状态管理实现无缝协作。支持流式显示和交互式信息收集。

### Agent流程图
```
用户输入 → Welcome Agent → Info Collection Agent → Prompt Output Agent → Coding Agent → 完成
              ↓              ↓                    ↓                  ↓
           意图识别        信息收集              结构化设计         代码生成
              ↓              ↓                    ↓                  ↓
           角色分类        完整性判断            开发任务描述       页面代码输出
              ↓              ↓                    ↓                  ↓
         流式显示回复    选择题+按钮交互        实时内容预览       代码块流式输出
```

---

## 🌊 流式显示与交互设计

### 流式JSON结构设计

为支持流式显示，我们采用分层JSON结构：

```typescript
interface StreamableAgentResponse {
  // 🔥 立即可显示的内容（流式输出第一部分）
  immediate_display: {
    reply: string;  // 立即显示的回复内容
    thinking?: string;  // 可选：思考过程展示
  };
  
  // 🎯 交互元素（流式输出第二部分）
  interaction?: {
    type: 'choices' | 'input_fields' | 'buttons';
    elements: InteractionElement[];
  };
  
  // 📊 系统状态（流式输出第三部分）
  system_state: {
    intent: 'advance' | 'continue' | 'edit' | 'restart' | 'user_choice_required' | 'done';
    done: boolean;
    current_stage: string;
    progress?: number; // 0-100 进度百分比
  };
  
  // 📈 数据更新（流式输出第四部分）
  data_updates?: any;
}

interface InteractionElement {
  id: string;
  type: 'choice_button' | 'input_field' | 'multi_select' | 'file_upload';
  label: string;
  value?: any;
  required?: boolean;
  placeholder?: string;
  options?: string[];  // 用于选择题
}
```

### 选择题与按钮交互系统

```typescript
// 示例：信息收集阶段的选择题
const exampleInteraction = {
  immediate_display: {
    reply: "让我来了解你的技能背景！"
  },
  interaction: {
    type: 'choices',
    elements: [
      {
        id: 'skills_category',
        type: 'choice_button',
        label: '你的主要技能领域是？',
        options: ['AI/机器学习', '前端开发', '设计创意', '数据分析', '其他']
      },
      {
        id: 'experience_level',
        type: 'choice_button',
        label: '经验水平？',
        options: ['新手(0-1年)', '熟练(1-3年)', '专家(3-5年)', '资深(5年+)']
      },
      {
        id: 'custom_skill',
        type: 'input_field',
        label: '自定义技能',
        placeholder: '如果上面没有合适的，请手动输入...',
        required: false
      }
    ]
  },
  system_state: {
    intent: 'continue',
    done: false,
    current_stage: 'info_collection',
    progress: 30
  }
};
```

---

## 🔧 Agent架构设计

### 1. Welcome Agent（欢迎 + 意图识别）
**职责**：
- 欢迎用户并建立对话上下文
- 识别用户目标（求职、展示、合作等）
- 判断用户身份类型（AI从业者、设计师等）
- **新增**：提供快速选择按钮

**输入**：用户首次发言
**输出**：流式JSON响应 + 选择按钮

### 2. Info Collection Agent（信息收集 + 完整性判断）
**职责**：
- 通过对话+选择题收集用户信息
- 判断信息完整性
- 引导用户补充缺失内容
- **新增**：动态生成选择题和输入框

**输入**：用户输入 + 历史上下文
**输出**：流式结构化信息 + 交互元素

### 3. Prompt Output Agent（页面结构生成提示）
**职责**：
- 将用户信息转换为开发任务描述
- 设计页面结构和风格方案
- 输出标准化开发Prompt
- **新增**：实时预览页面结构

**输入**：完整的用户信息结构
**输出**：开发任务描述 + 结构预览

### 4. Coding Agent（生成代码 + 页面）
**职责**：
- 根据开发任务生成React + Tailwind代码
- 输出完整的页面文件结构
- 提供预览指导
- **新增**：代码块流式生成

**输入**：开发任务描述
**输出**：流式代码块 + 实时预览

### 5. Intent Recognizer（全局意图识别）
**职责**：
- 贯穿各阶段的用户意图判断
- 决定流程推进或保持当前阶段
- 处理用户的修改、重新开始等请求
- **新增**：处理按钮点击和表单提交

### 6. 技术栈选择策略（便捷+美观+开源）

```javascript
// 核心技术栈配置
const TECH_STACK_CONFIG = {
  // 基础框架
  framework: {
    name: "NextJS 14",
    reasons: [
      "零配置部署到Vercel",
      "自动代码分割和优化",
      "内置SEO和性能优化",
      "TypeScript原生支持",
      "App Router最新特性"
    ]
  },
  
  // 样式方案
  styling: {
    primary: "Tailwind CSS",
    reasons: [
      "原子化CSS，易于维护",
      "响应式设计便捷",
      "构建体积优化",
      "社区生态丰富"
    ],
    plugins: ["@tailwindcss/typography", "@tailwindcss/forms"]
  },
  
  // UI组件库
  ui_libraries: {
    primary: "Shadcn/ui",
    reasons: [
      "开源免费，可定制性强",
      "基于Radix UI，可访问性好",
      "代码可复制，无依赖锁定",
      "TypeScript原生支持",
      "设计美观现代"
    ],
    components: ["Button", "Card", "Badge", "Avatar", "Dialog", "Tooltip"],
    
    alternatives: {
      "Headless UI": "更轻量，适合自定义设计",
      "Mantine": "功能丰富，适合快速开发",
      "Chakra UI": "简单易用，主题系统完善"
    }
  },
  
  // 动效库
  animations: {
    primary: "Framer Motion",
    reasons: [
      "声明式动画API",
      "性能优秀",
      "手势支持",
      "布局动画",
      "社区活跃"
    ],
    features: ["页面转场", "元素入场", "悬停效果", "滚动动画"],
    
    secondary: "CSS Modules + Tailwind",
    simple_animations: ["transition-all", "animate-pulse", "animate-bounce"]
  },
  
  // 图标库
  icons: {
    primary: "Lucide React",
    reasons: [
      "轻量级 (2KB gzipped)",
      "图标设计一致",
      "TypeScript支持",
      "树摇优化",
      "开源免费"
    ],
    alternatives: ["Heroicons", "Phosphor Icons", "Tabler Icons"]
  },
  
  // 部署方案
  deployment: {
    primary: "Vercel",
    reasons: [
      "NextJS官方平台",
      "零配置部署",
      "自动HTTPS和CDN",
      "预览部署",
      "域名管理",
      "免费额度充足"
    ],
    alternatives: ["Netlify", "GitHub Pages", "Railway"]
  }
};

// 根据用户身份优化技术选择
const IDENTITY_TECH_OPTIMIZATION = {
  "UI/UX设计师": {
    focus: ["视觉效果", "动效展示", "响应式设计"],
    extra_libraries: ["Lottie React", "React Spring", "Styled Components"],
    features: ["暗黑模式", "主题切换", "动画丰富"]
  },
  
  "产品经理": {
    focus: ["数据可视化", "信息架构", "用户体验"],
    extra_libraries: ["Chart.js", "React Chartjs 2", "React Hot Toast"],
    features: ["数据图表", "表单验证", "通知系统"]
  },
  
  "开发者": {
    focus: ["代码展示", "技术栈展示", "项目链接"],
    extra_libraries: ["Prism React Renderer", "React Markdown", "React Syntax Highlighter"],
    features: ["代码高亮", "技术标签", "GitHub集成"]
  },
  
  "AI/数据科学家": {
    focus: ["算法可视化", "研究成果", "论文展示"],
    extra_libraries: ["D3.js", "Observable Plot", "React Vis"],
    features: ["数据可视化", "研究时间线", "论文列表"]
  }
};
```

### 7. 个性化信息收集策略详解

```javascript
const PERSONALIZATION_STRATEGIES = {
  // 根据用户意图调整收集深度
  intent_based_collection: {
    "正式创建，有具体需求": {
      depth: "深度收集",
      required_fields: ["核心技能", "亮点成就", "目标受众", "风格偏好"],
      optional_fields: ["项目详情", "教育背景", "社交链接"],
      collection_rounds: 2-3
    },
    
    "先体验功能，看看效果": {
      depth: "快速体验",
      required_fields: ["身份类型", "基本技能"],
      optional_fields: ["风格偏好"],
      collection_rounds: 1,
      use_defaults: true
    },
    
    "学习了解，获得灵感": {
      depth: "展示导向",
      required_fields: ["身份类型", "感兴趣领域"],
      show_examples: true,
      provide_templates: true
    },
    
    "紧急需要，尽快完成": {
      depth: "效率优先",
      required_fields: ["核心信息", "联系方式"],
      use_smart_defaults: true,
      fast_track: true
    }
  },
  
  // 身份特定的问题定制
  identity_specific_questions: {
    "UI/UX设计师": {
      core_questions: [
        "你专长哪种设计类型？(UI设计/UX研究/视觉设计/交互设计)",
        "最得意的设计项目是什么？",
        "你的设计理念或方法论是？",
        "使用哪些设计工具？",
        "目标客户或雇主类型？"
      ],
      style_suggestions: [
        "作品集展示型 - 大图展示，视觉冲击",
        "设计思维型 - 过程展示，逻辑清晰", 
        "极简美学型 - 留白艺术，突出品味"
      ]
    },
    
    "产品经理": {
      core_questions: [
        "负责过什么类型的产品？(B端/C端/平台/工具)",
        "最有成就感的产品成果是？",
        "你的产品方法论是什么？",
        "擅长产品生命周期的哪个阶段？",
        "目标职位级别？(专员/经理/总监)"
      ],
      style_suggestions: [
        "数据驱动型 - 突出数据和成果",
        "用户中心型 - 强调用户价值", 
        "商业导向型 - 体现商业思维"
      ]
    },
    
    "开发者": {
      core_questions: [
        "主要技术栈是什么？",
        "最有挑战性的项目经历？", 
        "开源贡献或个人项目？",
        "擅长前端/后端/全栈/移动端？",
        "技术成长方向？"
      ],
      style_suggestions: [
        "技术极客型 - 代码和架构展示",
        "项目驱动型 - 突出解决方案",
        "开源贡献型 - 强调社区参与"
      ]
    }
  },
  
  // 智能默认值生成
  smart_defaults: {
    color_scheme: {
      "UI/UX设计师": "个性渐变",
      "产品经理": "科技蓝", 
      "开发者": "优雅灰",
      "AI/数据科学家": "科技蓝",
      "创意工作者": "活力橙",
      "学生/求职者": "自然绿"
    },
    
    layout_preference: {
      "UI/UX设计师": "作品集式",
      "产品经理": "分块卡片式",
      "开发者": "极简名片式", 
      "AI/数据科学家": "时间线式",
      "创意工作者": "单页滚动式",
      "学生/求职者": "时间线式"
    },
    
    content_priority: {
      "UI/UX设计师": ["项目作品展示", "设计理念", "核心技能"],
      "产品经理": ["数据成果和亮点", "项目经验", "产品思维"],
      "开发者": ["技术项目", "代码能力", "技术栈"],
      "AI/数据科学家": ["研究成果", "算法项目", "学术背景"]
    }
  }
};
```

---

## 🗃️ 状态管理系统

### 会话状态结构（支持流式和交互）

```typescript
interface ConversationSession {
  session_id: string;
  current_stage: 'welcome' | 'info_collection' | 'prompt_output' | 'coding' | 'done';
  user_info: {
    goal?: string;
    type?: string;
  };
  collected_info: {
    bio?: string;
    skills?: string[];
    projects?: Project[];
    style_pref?: string;
    social_links?: SocialLink[];
    completion_rate?: number; // 0-100
  };
  dev_prompt?: string;
  intent: 'advance' | 'continue' | 'edit' | 'restart' | 'user_choice_required' | 'done';
  code_result?: {
    status: 'success' | 'error';
    code_blocks?: CodeBlock[];
    error_message?: string;
    preview_url?: string;
  };
  history: Message[];
  
  // 新增：流式显示状态
  streaming_state: {
    is_streaming: boolean;
    current_chunk: 'display' | 'interaction' | 'system' | 'data';
    chunks_received: string[];
  };
  
  // 新增：当前等待的用户交互
  pending_interaction?: {
    type: 'choices' | 'input_fields' | 'buttons';
    elements: InteractionElement[];
    auto_advance?: boolean; // 是否自动推进到下一阶段
  };
  
  created_at: Date;
  updated_at: Date;
}

interface InteractionElement {
  id: string;
  type: 'choice_button' | 'input_field' | 'multi_select' | 'file_upload';
  label: string;
  value?: any;
  required?: boolean;
  placeholder?: string;
  options?: string[];
  description?: string;
  action?: string; // 'preview', 'download', 'edit' 等
}

interface Project {
  name: string;
  description: string;
  url?: string;
  tech_stack?: string[];
}

interface SocialLink {
  platform: string;
  url: string;
}

interface CodeBlock {
  filename: string;
  content: string;
  description?: string;
  language?: string;
}

interface Message {
  role: 'user' | 'agent';
  content: string;
  agent_type?: string;
  timestamp: Date;
  
  // 新增：交互相关
  interaction_data?: {
    selections?: Record<string, any>;
    button_clicked?: string;
    form_data?: Record<string, any>;
  };
}
```

### 流式显示关键字段

| 字段 | 类型 | 用途说明 |
|------|------|----------|
| `immediate_display.reply` | string | 立即可显示的回复内容（流式第一部分） |
| `interaction.elements` | array | 交互元素（按钮、输入框等） |
| `system_state.intent` | string | 系统行为意图 |
| `system_state.progress` | number | 进度百分比（0-100） |
| `data_updates` | object | 数据更新（用户信息、代码等） |
| `streaming_state` | object | 流式显示状态跟踪 |

---

## 📋 实现步骤指南

### 阶段1：项目初始化（支持流式）
1. **创建项目结构**
   ```
   /multi-agent-resume/
   ├── lib/
   │   ├── agents/
   │   │   ├── base-agent.ts
   │   │   ├── welcome-agent.ts
   │   │   ├── info-collection-agent.ts
   │   │   ├── prompt-output-agent.ts
   │   │   └── coding-agent.ts
   │   ├── types/
   │   │   ├── session.ts
   │   │   └── streaming.ts
   │   ├── prompts/
   │   │   └── templates.ts
   │   ├── utils/
   │   │   ├── session-manager.ts
   │   │   ├── agent-orchestrator.ts
   │   │   ├── streaming-handler.ts
   │   │   └── interaction-handler.ts
   │   └── streaming/
   │       ├── json-streamer.ts
   │       └── chunk-processor.ts
   └── components/
       ├── chat/
       │   ├── ChatInterface.tsx
       │   ├── MessageFlow.tsx
       │   ├── StreamingMessage.tsx
       │   └── InteractionPanel.tsx
       ├── ui/
       │   ├── ChoiceButtons.tsx
       │   ├── InputFields.tsx
       │   └── ProgressBar.tsx
       └── code/
           ├── CodePreview.tsx
           └── CodeBlockStreaming.tsx
   ```

2. **安装依赖（包含流式处理）**
   ```bash
   npm install openai zustand react-markdown prism-react-renderer
   npm install eventsource-parser stream-json
   npm install -D jest @testing-library/react @testing-library/jest-dom
   ```

### 阶段2：流式处理核心实现

#### 步骤2.1：流式JSON处理器
```typescript
// lib/streaming/json-streamer.ts
export class JSONStreamer {
  private buffer = '';
  private currentChunk: 'display' | 'interaction' | 'system' | 'data' = 'display';
  
  processChunk(chunk: string): Partial<StreamableAgentResponse> | null {
    this.buffer += chunk;
    
    // 尝试解析当前缓冲区中的完整JSON片段
    try {
      const parsed = this.extractCompleteJSON();
      if (parsed) {
        this.buffer = '';
        return parsed;
      }
    } catch (error) {
      // 继续等待更多数据
    }
    
    return null;
  }
  
  private extractCompleteJSON(): any {
    // JSON片段提取逻辑
    const match = this.buffer.match(/\{[^}]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
    return null;
  }
}
```

#### 步骤2.2：交互处理器
```typescript
// lib/utils/interaction-handler.ts
export class InteractionHandler {
  async handleUserInteraction(
    sessionId: string,
    interactionType: string,
    data: Record<string, any>
  ): Promise<void> {
    const session = SessionManager.getSession(sessionId);
    if (!session) return;
    
    // 处理按钮点击
    if (interactionType === 'button_click') {
      await this.handleButtonClick(session, data);
    }
    
    // 处理表单提交
    if (interactionType === 'form_submit') {
      await this.handleFormSubmit(session, data);
    }
    
    // 处理多选更新
    if (interactionType === 'selection_change') {
      await this.handleSelectionChange(session, data);
    }
  }
  
  private async handleButtonClick(session: ConversationSession, data: any) {
    const { button_id, action } = data;
    
    // 更新会话状态
    session.pending_interaction = undefined;
    
    // 根据按钮类型执行相应操作
    if (action === 'advance') {
      // 推进到下一阶段
      AgentOrchestrator.advanceStage(session);
    } else if (action === 'preview') {
      // 显示预览
      await this.showPreview(session);
    }
  }
  
  private async handleFormSubmit(session: ConversationSession, data: any) {
    // 更新用户信息
    Object.assign(session.collected_info, data.form_values);
    
    // 检查完整性并决定下一步
    const isComplete = this.checkCompleteness(session.collected_info);
    if (isComplete) {
      AgentOrchestrator.advanceStage(session);
    } else {
      // 继续收集信息
      AgentOrchestrator.continueCollection(session);
    }
  }
}
```

### 阶段3：前端流式显示组件

#### 步骤3.1：流式消息组件
```typescript
// components/chat/StreamingMessage.tsx
export function StreamingMessage({ 
  response, 
  onInteraction 
}: { 
  response: StreamableAgentResponse;
  onInteraction: (type: string, data: any) => void;
}) {
  const [visibleContent, setVisibleContent] = useState('');
  const [showInteraction, setShowInteraction] = useState(false);
  
  useEffect(() => {
    // 流式显示reply内容
    if (response.immediate_display?.reply) {
      animateTextDisplay(response.immediate_display.reply);
    }
  }, [response.immediate_display]);
  
  const animateTextDisplay = (text: string) => {
    let i = 0;
    const timer = setInterval(() => {
      setVisibleContent(text.slice(0, i));
      i++;
      if (i > text.length) {
        clearInterval(timer);
        setShowInteraction(true);
      }
    }, 30); // 打字机效果
  };
  
  return (
    <div className="message-container">
      <div className="reply-content">
        {visibleContent}
        {visibleContent.length < (response.immediate_display?.reply?.length || 0) && (
          <span className="animate-pulse">|</span>
        )}
      </div>
      
      {showInteraction && response.interaction && (
        <InteractionPanel
          interaction={response.interaction}
          onSubmit={(data) => onInteraction('interaction', data)}
        />
      )}
      
      {response.system_state?.progress && (
        <ProgressBar progress={response.system_state.progress} />
      )}
    </div>
  );
}
```

#### 步骤3.2：交互面板组件
```typescript
// components/chat/InteractionPanel.tsx
export function InteractionPanel({ 
  interaction, 
  onSubmit 
}: {
  interaction: { type: string; elements: InteractionElement[] };
  onSubmit: (data: any) => void;
}) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  
  const handleSubmit = () => {
    onSubmit({
      type: 'form_submit',
      form_values: formData
    });
  };
  
  return (
    <div className="interaction-panel bg-gray-50 p-4 rounded-lg mt-4">
      {interaction.elements.map((element) => (
        <div key={element.id} className="mb-4">
          {element.type === 'choice_button' && (
            <ChoiceButtons
              element={element}
              value={formData[element.id]}
              onChange={(value) => setFormData(prev => ({ ...prev, [element.id]: value }))}
            />
          )}
          
          {element.type === 'input_field' && (
            <InputField
              element={element}
              value={formData[element.id] || ''}
              onChange={(value) => setFormData(prev => ({ ...prev, [element.id]: value }))}
            />
          )}
          
          {element.type === 'multi_select' && (
            <MultiSelect
              element={element}
              value={formData[element.id] || []}
              onChange={(value) => setFormData(prev => ({ ...prev, [element.id]: value }))}
            />
          )}
        </div>
      ))}
      
      <button
        onClick={handleSubmit}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        继续
      </button>
    </div>
  );
}
```

#### 步骤3.3：选择按钮组件
```typescript
// components/ui/ChoiceButtons.tsx
export function ChoiceButtons({ 
  element, 
  value, 
  onChange 
}: {
  element: InteractionElement;
  value: any;
  onChange: (value: any) => void;
}) {
  return (
    <div className="choice-buttons">
      <label className="block text-sm font-medium mb-2">
        {element.label}
      </label>
      <div className="grid grid-cols-2 gap-2">
        {element.options?.map((option) => (
          <button
            key={option}
            onClick={() => onChange(option)}
            className={`p-3 text-sm rounded-lg border transition-colors ${
              value === option
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
      {element.description && (
        <p className="text-xs text-gray-500 mt-1">{element.description}</p>
      )}
    </div>
  );
}
```

### 阶段4：Agent流式输出实现

#### 步骤4.1：更新Agent基类
```typescript
// lib/agents/base-agent.ts
export abstract class BaseAgent {
  abstract name: string;
  abstract execute(input: any, session: ConversationSession): AsyncGenerator<Partial<StreamableAgentResponse>>;
  
  protected async *streamLLMResponse(prompt: string): AsyncGenerator<string> {
    // OpenAI流式API调用
    const stream = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      stream: true,
    });
    
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        yield content;
      }
    }
  }
  
  protected parseStreamedJSON(content: string): Partial<StreamableAgentResponse> {
    // 解析流式JSON内容
    try {
      return JSON.parse(content);
    } catch {
      // 处理不完整的JSON
      return { immediate_display: { reply: content } };
    }
  }
}
```

#### 步骤4.2：更新Welcome Agent
```typescript
// lib/agents/welcome-agent.ts
export class WelcomeAgent extends BaseAgent {
  name = 'welcome';
  
  async *execute(input: { user_input: string }, session: ConversationSession) {
    const prompt = this.formatPrompt(WELCOME_AGENT_PROMPT, {
      user_input: input.user_input
    });
    
    let accumulatedContent = '';
    
    for await (const chunk of this.streamLLMResponse(prompt)) {
      accumulatedContent += chunk;
      
      // 尝试解析当前累积的内容
      const parsed = this.parseStreamedJSON(accumulatedContent);
      
      if (parsed.immediate_display?.reply) {
        yield {
          immediate_display: {
            reply: parsed.immediate_display.reply
          }
        };
      }
      
      if (parsed.interaction) {
        yield {
          interaction: parsed.interaction
        };
      }
      
      if (parsed.system_state) {
        yield {
          system_state: parsed.system_state
        };
      }
    }
  }
}
```

---

## 🎨 前端集成方案（支持流式+交互）

### 1. 流式状态管理
```typescript
// 使用 Zustand 管理流式状态
interface AppState {
  currentSession: ConversationSession | null;
  isStreaming: boolean;
  streamingMessage: Partial<StreamableAgentResponse> | null;
  pendingInteractions: InteractionElement[];
  
  // 方法
  updateSession: (session: ConversationSession) => void;
  setStreaming: (streaming: boolean) => void;
  updateStreamingMessage: (message: Partial<StreamableAgentResponse>) => void;
  handleInteraction: (type: string, data: any) => void;
}

const useAppStore = create<AppState>((set, get) => ({
  currentSession: null,
  isStreaming: false,
  streamingMessage: null,
  pendingInteractions: [],
  
  updateSession: (session) => set({ currentSession: session }),
  setStreaming: (streaming) => set({ isStreaming: streaming }),
  updateStreamingMessage: (message) => set({ streamingMessage: message }),
  
  handleInteraction: async (type, data) => {
    const { currentSession } = get();
    if (!currentSession) return;
    
    await InteractionHandler.handleUserInteraction(
      currentSession.session_id, 
      type, 
      data
    );
  },
}));
```

### 2. 主聊天界面（支持流式）
```typescript
// components/chat/ChatInterface.tsx
export function ChatInterface() {
  const {
    currentSession,
    isStreaming,
    streamingMessage,
    updateSession,
    setStreaming,
    updateStreamingMessage,
    handleInteraction
  } = useAppStore();
  
  const [input, setInput] = useState('');
  const orchestrator = new AgentOrchestrator();
  
  const handleSendMessage = async () => {
    if (!input.trim() || !currentSession) return;
    
    setStreaming(true);
    setInput(''); // 立即清空输入框
    
    try {
      const responseStream = orchestrator.processUserInputStreaming(
        currentSession.session_id, 
        input
      );
      
      for await (const chunk of responseStream) {
        updateStreamingMessage(chunk);
        
        // 检查是否需要用户交互
        if (chunk.interaction && !chunk.system_state?.done) {
          setStreaming(false);
          break;
        }
      }
    } catch (error) {
      console.error('流式处理失败:', error);
    } finally {
      setStreaming(false);
    }
  };
  
  return (
    <div className="chat-interface flex flex-col h-screen">
      <div className="messages flex-1 overflow-y-auto p-4">
        {currentSession?.history.map((message, index) => (
          <MessageBubble key={index} message={message} />
        ))}
        
        {streamingMessage && (
          <StreamingMessage
            response={streamingMessage}
            onInteraction={handleInteraction}
          />
        )}
      </div>
      
      <div className="input-area p-4 border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="输入消息..."
            disabled={isStreaming}
            className="flex-1 p-2 border rounded-lg"
          />
          <button
            onClick={handleSendMessage}
            disabled={isStreaming || !input.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50"
          >
            {isStreaming ? '生成中...' : '发送'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 3. 代码块流式显示
```typescript
// components/code/CodeBlockStreaming.tsx
export function CodeBlockStreaming({ codeBlocks }: { codeBlocks: CodeBlock[] }) {
  const [activeTab, setActiveTab] = useState(0);
  const [visibleCode, setVisibleCode] = useState('');
  
  useEffect(() => {
    if (codeBlocks[activeTab]?.content) {
      animateCodeDisplay(codeBlocks[activeTab].content);
    }
  }, [activeTab, codeBlocks]);
  
  const animateCodeDisplay = (code: string) => {
    let i = 0;
    const lines = code.split('\n');
    
    const timer = setInterval(() => {
      setVisibleCode(lines.slice(0, i).join('\n'));
      i++;
      if (i > lines.length) {
        clearInterval(timer);
      }
    }, 100); // 逐行显示
  };
  
  return (
    <div className="code-streaming border rounded-lg overflow-hidden">
      <div className="flex border-b bg-gray-100">
        {codeBlocks.map((block, index) => (
          <button
            key={index}
            onClick={() => setActiveTab(index)}
            className={`px-4 py-2 text-sm ${
              activeTab === index
                ? 'bg-white border-b-2 border-blue-500'
                : 'text-gray-600'
            }`}
          >
            {block.filename}
          </button>
        ))}
      </div>
      
      <div className="relative">
        <pre className="p-4 text-sm overflow-x-auto bg-gray-900 text-green-400">
          <code>{visibleCode}</code>
          {visibleCode.length < (codeBlocks[activeTab]?.content?.length || 0) && (
            <span className="animate-pulse">█</span>
          )}
        </pre>
        
        {codeBlocks[activeTab]?.description && (
          <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
            {codeBlocks[activeTab].description}
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## 🎯 总结

这个增强版的多Agent动态简历生成系统现在支持：

1. **流式显示**：
   - JSON分层结构，reply内容可立即显示
   - 打字机效果的文本动画
   - 代码块逐行流式生成
   - 实时进度指示

2. **选择题交互**：
   - 智能生成选择按钮
   - 多选、单选、输入框组合
   - 自定义输入选项
   - 表单验证和提交

3. **按钮式操作**：
   - 所有关键操作都有按钮化选项
   - 支持预览、下载、编辑等操作
   - 响应式设计，移动端友好

4. **增强用户体验**：
   - 无需等待完整响应即可开始阅读
   - 交互元素降低了输入门槛
   - 进度指示让用户了解当前状态
   - 容错机制提供多种解决方案

通过这种设计，系统能够提供更加流畅和友好的用户体验，同时保持高度的可扩展性。 