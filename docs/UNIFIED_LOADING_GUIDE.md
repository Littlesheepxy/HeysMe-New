# 统一Loading系统使用指南

## 概述

新的统一Loading系统提供了OpenAI风格的光照扫描效果，解决了之前loading状态不统一和不消失的问题。

## 特性

✨ **统一设计语言**: 所有loading状态使用一致的视觉设计  
🌟 **光照扫描效果**: 类似OpenAI的loading动画  
🔄 **自动消失**: 支持自动隐藏和手动控制  
🎨 **多种变体**: 思考、生成、处理、分析四种状态  
📱 **响应式**: 支持三种尺寸(sm/md/lg)  
🎯 **易用性**: 简化的API和便捷的hooks  

## 基础使用

### 导入组件

```tsx
import { 
  UnifiedLoading,
  ThinkingLoader,
  GeneratingLoader,
  ProcessingLoader,
  AnalyzingLoader,
  SimpleTextLoader
} from '@/components/ui/unified-loading';
```

### 基础组件

```tsx
// 基础统一loading
<UnifiedLoading variant="thinking" text="AI正在思考" size="md" />

// 预设的快捷组件
<ThinkingLoader text="正在分析您的问题" size="sm" />
<GeneratingLoader text="正在生成内容" size="md" />
<ProcessingLoader text="正在处理请求" size="lg" />
<AnalyzingLoader text="正在分析数据" />

// 简单文本loading
<SimpleTextLoader text="加载中" className="text-blue-600" />
```

## 全局Loading管理

### 使用LoadingProvider

```tsx
import { LoadingProvider } from '@/contexts/LoadingContext';

function App() {
  return (
    <LoadingProvider>
      <YourAppContent />
    </LoadingProvider>
  );
}
```

### 使用Loading Hooks

```tsx
import { useLoading, useThinkingLoader } from '@/contexts/LoadingContext';

function MyComponent() {
  const { showLoading, hideLoading } = useLoading();
  const showThinking = useThinkingLoader();

  const handleSubmit = async () => {
    // 显示loading
    const loadingId = showLoading({
      variant: 'processing',
      text: '正在提交数据',
      autoHide: true,
      timeout: 5000
    });

    try {
      await submitData();
    } finally {
      hideLoading(loadingId);
    }
  };

  const handleThinking = () => {
    // 便捷方法
    showThinking('AI正在深度思考', true); // 自动隐藏
  };
}
```

## 组件参数说明

### UnifiedLoading Props

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| variant | 'thinking' \| 'generating' \| 'processing' \| 'analyzing' | 'thinking' | loading类型 |
| text | string | - | 显示文本 |
| size | 'sm' \| 'md' \| 'lg' | 'md' | 尺寸大小 |
| className | string | '' | 自定义样式 |
| autoHide | boolean | false | 自动隐藏 |
| onComplete | () => void | - | 完成回调 |

### Loading变体说明

- **thinking**: 蓝色主题，适用于AI思考、分析场景
- **generating**: 紫色主题，适用于内容生成场景  
- **processing**: 绿色主题，适用于数据处理场景
- **analyzing**: 橙色主题，适用于数据分析场景

## 迁移指南

### 从旧的LoadingText迁移

```tsx
// 旧的方式
<LoadingText text="加载中" duration={2000} className="text-gray-600" />

// 新的方式
<SimpleTextLoader text="加载中" className="text-gray-600" />
```

### 从旧的LoadingDots迁移

```tsx
// 旧的方式
<LoadingDots className="scale-75" />

// 新的方式
<SimpleTextLoader text="加载中" />
```

### 从旧的LoadingState迁移

```tsx
// 旧的方式
<LoadingState type="generating" message="生成中" progress={50} />

// 新的方式
<GeneratingLoader text="生成中" />
```

## 在聊天界面中使用

### MessageBubble组件

```tsx
// 思考状态
{isGenerating && (
  <ThinkingLoader 
    text="正在思考中"
    size="sm"
    className="bg-gray-50"
  />
)}

// 生成状态
{preparingInteraction && (
  <GeneratingLoader 
    text="正在准备个性化选项"
    size="md"
    className="bg-purple-50"
  />
)}
```

### 按钮loading状态

```tsx
<Button disabled={isSubmitting}>
  {isSubmitting ? (
    <SimpleTextLoader text="提交中" className="text-white" />
  ) : (
    '确认提交'
  )}
</Button>
```

## 最佳实践

### 1. 语义化使用
根据场景选择合适的变体：
- 用户等待AI思考 → `thinking`
- AI生成内容 → `generating`  
- 处理用户请求 → `processing`
- 分析数据 → `analyzing`

### 2. 及时隐藏
确保loading状态在操作完成后及时消失：

```tsx
const handleAction = async () => {
  const loadingId = showLoading({ variant: 'processing', text: '处理中' });
  
  try {
    await someAsyncOperation();
  } finally {
    hideLoading(loadingId); // 确保隐藏
  }
};
```

### 3. 用户反馈
为长时间操作提供清晰的状态反馈：

```tsx
// 阶段性反馈
showLoading({ variant: 'analyzing', text: '正在分析数据...' });
setTimeout(() => {
  showLoading({ variant: 'generating', text: '正在生成报告...' });
}, 2000);
```

### 4. 错误处理
操作失败时及时清除loading状态：

```tsx
try {
  await riskyOperation();
} catch (error) {
  hideAllLoading(); // 清除所有loading
  showErrorMessage(error);
}
```

## 样式自定义

### CSS变量
可以通过Tailwind配置自定义动画：

```css
/* 自定义光照扫描速度 */
.custom-shimmer {
  animation: shimmer 1.5s infinite;
}

/* 自定义跳动效果 */
.custom-dots {
  animation: typing-dots 1s infinite ease-in-out;
}
```

### 主题适配
组件支持暗色主题自动适配：

```tsx
<UnifiedLoading 
  variant="thinking"
  className="dark:bg-gray-800 dark:text-gray-200"
/>
```

## 性能优化

### 1. 懒加载
仅在需要时渲染loading组件：

```tsx
{isLoading && <ThinkingLoader />}
```

### 2. 防抖处理
避免频繁的loading状态切换：

```tsx
const debouncedLoading = useMemo(() => 
  debounce((show: boolean) => {
    if (show) showLoading();
    else hideAllLoading();
  }, 300), []
);
```

## 故障排除

### Loading不消失
确保调用了对应的隐藏方法：
```tsx
// 记住loading ID
const id = showLoading(...);
// 在适当时机隐藏
hideLoading(id);
```

### 动画不流畅
检查是否正确配置了Tailwind动画：
```js
// tailwind.config.ts
animation: {
  'shimmer': 'shimmer 2.5s infinite',
  'typing-dots': 'typing-dots 1.4s infinite ease-in-out',
}
```

### 样式冲突
使用更具体的CSS选择器或!important：
```tsx
<UnifiedLoading className="!bg-blue-100" />
``` 