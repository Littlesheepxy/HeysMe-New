# LibreChat 核心功能组件集成包

这个包提取了 LibreChat 的三个核心功能，方便在其他项目中集成使用：

1. **对话栏大模型流式输出的渲染及UI** - 包括消息渲染、Markdown解析、以及每段回复后的功能（朗读、复制、编辑、点赞、踩和重新生成）
2. **输入框的web search和语音输入** - 包括语音识别、web搜索功能
3. **侧边栏会话显示** - 能够显示总结文本作为标题的对话列表

## 📦 安装

```bash
npm install librechat-integration-components
```

## 🚀 快速开始

### 基础设置

首先，你需要在你的应用根部设置必要的Providers：

```tsx
import React from 'react';
import { RecoilRoot } from 'recoil';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { 
  ChatContextProvider, 
  ToastContextProvider,
  AuthContextProvider 
} from 'librechat-integration-components';

const queryClient = new QueryClient();

function App() {
  return (
    <RecoilRoot>
      <QueryClientProvider client={queryClient}>
        <ToastContextProvider>
          <AuthContextProvider>
            <ChatContextProvider>
              {/* 你的应用内容 */}
            </ChatContextProvider>
          </AuthContextProvider>
        </ToastContextProvider>
      </QueryClientProvider>
    </RecoilRoot>
  );
}
```

### 1. 消息渲染组件

```tsx
import React from 'react';
import { MessageRender, MessageContent } from 'librechat-integration-components';

function ChatMessages({ messages }) {
  return (
    <div className="chat-container">
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

### 2. 输入框组件

```tsx
import React from 'react';
import { ChatForm } from 'librechat-integration-components';

function ChatInput() {
  return (
    <div className="chat-input-container">
      <ChatForm index={0} />
    </div>
  );
}
```

### 3. 侧边栏组件

```tsx
import React from 'react';
import { Conversations } from 'librechat-integration-components';

function ChatSidebar({ conversations }) {
  return (
    <div className="sidebar">
      <Conversations 
        conversations={conversations}
        moveToTop={() => {}}
        toggleNav={() => {}}
        containerRef={React.createRef()}
        loadMoreConversations={() => {}}
        isLoading={false}
        isSearchLoading={false}
      />
    </div>
  );
}
```

## 🎨 样式配置

这个包使用 Tailwind CSS。确保你的项目中包含了必要的 Tailwind 配置：

```js
// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./node_modules/librechat-integration-components/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      // 添加必要的主题扩展
    },
  },
  plugins: [],
}
```

## 🔧 必要的CSS

确保在你的应用中包含这些CSS类：

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
  /* 你的消息内容样式 */
}

.hover-button {
  /* 悬停按钮样式 */
}
```

## 📋 核心功能说明

### 消息渲染功能
- ✅ 流式输出渲染
- ✅ Markdown 支持
- ✅ 代码高亮
- ✅ 数学公式渲染
- ✅ 朗读功能 (TTS)
- ✅ 复制功能
- ✅ 编辑功能
- ✅ 点赞/踩功能
- ✅ 重新生成功能

### 输入框功能
- ✅ 语音输入 (STT)
- ✅ Web搜索集成
- ✅ 文件上传
- ✅ 自动调整大小
- ✅ 快捷键支持

### 侧边栏功能
- ✅ 对话列表
- ✅ 对话标题显示
- ✅ 对话搜索
- ✅ 对话管理（重命名、删除等）

## 🔌 API 集成

你需要实现以下API端点来支持完整功能：

```typescript
// 消息相关
POST /api/ask - 发送消息
POST /api/messages/:messageId/feedback - 消息反馈
PUT /api/messages/:messageId - 编辑消息

// 语音相关  
POST /api/speech/text-to-speech - 文本转语音
POST /api/speech/speech-to-text - 语音转文本

// 搜索相关
POST /api/search - Web搜索

// 对话相关
GET /api/conversations - 获取对话列表
POST /api/conversations - 创建对话
PUT /api/conversations/:id - 更新对话
DELETE /api/conversations/:id - 删除对话
```

## 🛠️ 高级配置

### 自定义主题

```tsx
import { useRecoilState } from 'recoil';
import { store } from 'librechat-integration-components';

function ThemeCustomizer() {
  const [fontSize] = useRecoilState(store.fontSize);
  const [textToSpeech] = useRecoilState(store.textToSpeech);
  
  // 自定义主题逻辑
}
```

### 自定义Hooks

```tsx
import { useMessageActions, useSpeechToText } from 'librechat-integration-components';

function CustomChatComponent() {
  const messageActions = useMessageActions({
    message: currentMessage,
    currentEditId: null,
    setCurrentEditId: () => {},
  });
  
  const speechToText = useSpeechToText(
    (text) => console.log('识别到文本:', text),
    (text) => console.log('完成识别:', text)
  );
  
  // 你的组件逻辑
}
```

## 📝 类型定义

```typescript
import type { 
  TMessage, 
  TConversation, 
  TMessageProps,
  TFeedback 
} from 'librechat-integration-components';

// 使用类型定义来确保类型安全
```

## 🐛 故障排除

### 常见问题

1. **样式不显示**: 确保正确配置了 Tailwind CSS
2. **组件报错**: 检查是否正确设置了所有必要的 Providers
3. **API调用失败**: 确认API端点实现正确

### 调试模式

```tsx
// 开启调试模式
localStorage.setItem('debug', 'librechat:*');
```

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 支持

如果你在集成过程中遇到问题，可以：

1. 查看 [LibreChat 官方文档](https://docs.librechat.ai/)
2. 提交 [GitHub Issue](https://github.com/danny-avila/LibreChat/issues)
3. 加入社区讨论 