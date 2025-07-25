# 部署和集成指南

## 📁 文件结构

```
integration-components/
├── components/           # React组件
│   ├── Chat/
│   │   ├── Messages/    # 消息渲染组件
│   │   └── Input/       # 输入框组件
│   ├── Conversations/   # 侧边栏组件
│   ├── ui/             # 基础UI组件
│   └── svg/            # 图标组件
├── hooks/              # React Hooks
├── utils/              # 工具函数
├── store/              # Recoil状态管理
├── providers/          # React Context Providers
├── types/              # TypeScript类型定义
├── data-provider/      # 数据提供者
├── example/            # 使用示例
├── package.json        # 依赖配置
├── index.ts           # 主导出文件
└── README.md          # 使用文档
```

## 🚀 快速部署

### 1. 复制到你的项目

将整个 `integration-components` 文件夹复制到你的项目中：

```bash
cp -r integration-components/ your-project/src/librechat-components/
```

### 2. 安装依赖

在你的项目根目录运行：

```bash
npm install @ariakit/react @radix-ui/react-dialog @tanstack/react-query recoil react-markdown lucide-react tailwind-merge clsx
```

### 3. 配置路径别名

在你的构建工具中配置路径别名：

**Vite配置 (vite.config.ts):**
```typescript
export default defineConfig({
  resolve: {
    alias: {
      '~/': path.resolve(__dirname, 'src/librechat-components/'),
    },
  },
});
```

**Webpack配置:**
```javascript
module.exports = {
  resolve: {
    alias: {
      '~': path.resolve(__dirname, 'src/librechat-components'),
    },
  },
};
```

**TypeScript配置 (tsconfig.json):**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "~/*": ["src/librechat-components/*"]
    }
  }
}
```

### 4. 配置Tailwind CSS

更新你的 `tailwind.config.js`：

```javascript
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./src/librechat-components/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        'text-primary': '#374151',
        'text-secondary': '#6B7280',
        'surface-primary': '#FFFFFF',
        'surface-hover': '#F3F4F6',
        'border-light': '#E5E7EB',
      },
    },
  },
  plugins: [],
};
```

### 5. 添加必要的CSS

在你的主CSS文件中添加：

```css
/* 流式输出动画 */
.result-streaming::after {
  content: "▋";
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

/* 消息样式 */
.message-content {
  line-height: 1.6;
}

.hover-button {
  transition: all 0.2s ease;
}

/* Markdown样式 */
.markdown {
  max-width: none;
}

.markdown pre {
  background-color: #f6f8fa;
  border-radius: 6px;
  padding: 16px;
  overflow-x: auto;
}

.markdown code {
  background-color: #f6f8fa;
  padding: 2px 4px;
  border-radius: 3px;
  font-size: 0.875em;
}
```

## 🔧 核心组件使用

### 消息渲染

```tsx
import { MessageRender } from '~/components/Chat/Messages/ui/MessageRender';

function ChatMessages({ messages }) {
  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <MessageRender 
          key={message.messageId}
          message={message}
          currentEditId={null}
          setCurrentEditId={() => {}}
          siblingIdx={0}
          setSiblingIdx={() => {}}
          siblingCount={1}
        />
      ))}
    </div>
  );
}
```

### 输入框

```tsx
import { ChatForm } from '~/components/Chat/Input/ChatForm';

function ChatInput() {
  return <ChatForm index={0} />;
}
```

### 侧边栏

```tsx
import { Conversations } from '~/components/Conversations/Conversations';

function Sidebar({ conversations }) {
  return (
    <Conversations 
      conversations={conversations}
      moveToTop={() => {}}
      toggleNav={() => {}}
      containerRef={React.createRef()}
      loadMoreConversations={() => {}}
      isLoading={false}
      isSearchLoading={false}
    />
  );
}
```

## 🔌 API集成

你需要实现以下API端点：

### 消息相关API
```typescript
// 发送消息
POST /api/ask
{
  "text": "用户输入的文本",
  "conversationId": "对话ID"
}

// 消息反馈
POST /api/messages/:messageId/feedback
{
  "rating": "thumbsUp" | "thumbsDown",
  "tag": { "key": "helpful", "label": "有帮助" },
  "text": "详细反馈文本"
}

// 编辑消息
PUT /api/messages/:messageId
{
  "text": "编辑后的文本"
}
```

### 语音相关API
```typescript
// 文本转语音
POST /api/speech/text-to-speech
{
  "text": "要转换的文本",
  "voice": "语音类型"
}

// 语音转文本
POST /api/speech/speech-to-text
FormData: { audio: File }
```

### 搜索相关API
```typescript
// Web搜索
POST /api/search
{
  "query": "搜索关键词",
  "options": { "reranker": "jina" }
}
```

## 🎨 自定义主题

### 使用Recoil状态

```tsx
import { useRecoilState } from 'recoil';
import { store } from '~/store';

function ThemeSettings() {
  const [fontSize] = useRecoilState(store.fontSize);
  const [textToSpeech, setTextToSpeech] = useRecoilState(store.textToSpeech);
  
  return (
    <div>
      <button onClick={() => setTextToSpeech(!textToSpeech)}>
        {textToSpeech ? '关闭' : '开启'}朗读功能
      </button>
    </div>
  );
}
```

### 自定义样式

```css
/* 自定义消息气泡 */
.user-turn .message-content {
  background-color: #3B82F6;
  color: white;
  border-radius: 18px;
  padding: 12px 16px;
  margin-left: auto;
  max-width: 80%;
}

.agent-turn .message-content {
  background-color: #F3F4F6;
  border-radius: 18px;
  padding: 12px 16px;
  max-width: 80%;
}
```

## 🔍 故障排除

### 常见问题

1. **样式不生效**
   - 检查Tailwind配置是否包含了组件路径
   - 确认CSS文件已正确导入

2. **组件报错**
   - 确认所有Providers都已正确设置
   - 检查路径别名配置

3. **API调用失败**
   - 检查API端点是否正确实现
   - 确认数据格式匹配

### 调试技巧

```tsx
// 开启调试模式
localStorage.setItem('debug', 'librechat:*');

// 查看状态
import { useRecoilValue } from 'recoil';
import { store } from '~/store';

function DebugInfo() {
  const conversation = useRecoilValue(store.conversation);
  console.log('当前对话:', conversation);
  return null;
}
```

## 📱 移动端适配

组件已包含响应式设计，但你可以进一步优化：

```css
@media (max-width: 768px) {
  .chat-container {
    padding: 8px;
  }
  
  .sidebar {
    position: fixed;
    z-index: 50;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }
  
  .sidebar.open {
    transform: translateX(0);
  }
}
```

## 🔄 更新和维护

定期检查LibreChat的更新，并同步重要的功能改进：

```bash
# 检查原项目更新
git remote add upstream https://github.com/danny-avila/LibreChat.git
git fetch upstream

# 比较差异
git diff upstream/main -- client/src/components/Chat/Messages/
```

## 📞 获取支持

如果遇到问题：

1. 检查这份文档
2. 查看示例代码
3. 提交Issue到LibreChat仓库
4. 加入社区讨论 