# 文本和代码分离显示实现指南

## 🎯 功能概述

实现了AI代码生成过程中文本内容和代码文件的分离显示：
- **文本内容**：AI解释和思考过程显示在对话框
- **代码文件**：独立文件创建面板，支持流式进度显示

## 🏗️ 实现原理

### 1. 核心分离算法

在 `lib/agents/coding/agent.ts` 中实现内容分离：

```typescript
private separateTextAndCode(content: string): {
  text: string;
  codeFiles: CodeFile[];
} {
  // 1. 提取代码块
  const codeFiles = this.extractCodeBlocksFromText(content);
  
  // 2. 移除代码块，保留纯文本
  let textOnly = content;
  const codeBlockPatterns = [
    /```[\s\S]*?```/g,  // 标准代码块
    /`[^`\n]*`/g,       // 行内代码
  ];
  
  codeBlockPatterns.forEach(pattern => {
    textOnly = textOnly.replace(pattern, '');
  });
  
  // 3. 清理文本格式
  textOnly = textOnly
    .replace(/\n{3,}/g, '\n\n')
    .trim();
    
  return { text: textOnly, codeFiles };
}
```

### 2. 流式响应结构

修改流式输出，分离发送文本和代码：

```typescript
// 实时分离内容
const separated = this.separateTextAndCode(accumulatedResponse);
extractedText = separated.text;
extractedCodeFiles = separated.codeFiles;

// 发送分离后的数据
yield this.createResponse({
  immediate_display: {
    reply: extractedText, // 只发送文本到对话框
  },
  system_state: {
    metadata: {
      hasCodeFiles: extractedCodeFiles.length > 0,
      projectFiles: extractedCodeFiles,
      fileCreationProgress: extractedCodeFiles.map(file => ({
        filename: file.filename,
        status: 'creating',
        progress: Math.min(100, (chunkCount / 10) * 100)
      }))
    }
  }
});
```

### 3. 前端文件创建面板

在 `MessageBubble.tsx` 中添加文件创建显示：

```jsx
{/* 文件创建状态面板 */}
{!actualIsUser && hasCodeFiles && codeFiles.length > 0 && (
  <motion.div className="mt-4 p-4 bg-gray-50 rounded-xl">
    <div className="flex items-center gap-2 mb-3">
      <FolderOpen className="w-4 h-4 text-blue-600" />
      <h4 className="font-semibold">正在创建项目文件</h4>
      <span className="text-sm text-gray-500">
        ({createdCount}/{totalCount})
      </span>
    </div>
    
    <div className="space-y-2">
      {codeFiles.map(file => (
        <FileCreationItem
          key={file.filename}
          filename={file.filename}
          status={fileStatus[file.filename]?.status || 'pending'}
          content={file.content}
          progress={fileStatus[file.filename]?.progress || 0}
          onFileCreated={() => handleFileCreated(file.filename)}
        />
      ))}
    </div>
  </motion.div>
)}
```

### 4. 文件创建组件

`FileCreationItem.tsx` 实现单个文件的流式创建：

```typescript
// 模拟流式文件创建
useEffect(() => {
  if (status === 'creating' && content) {
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < content.length) {
        const chunkSize = Math.random() * 30 + 5;
        const chunk = content.slice(currentIndex, currentIndex + chunkSize);
        setStreamedContent(prev => prev + chunk);
        
        const newProgress = (currentIndex / content.length) * 100;
        setCurrentProgress(newProgress);
        currentIndex += chunkSize;
      } else {
        clearInterval(interval);
        onFileCreated?.();
      }
    }, 80);
    
    return () => clearInterval(interval);
  }
}, [status, content]);
```

## 🎨 UI设计特点

### 1. 视觉分离
- **对话框**：显示AI的文字说明
- **文件面板**：独立区域显示代码文件
- **颜色编码**：不同状态使用不同颜色

### 2. 动画效果
- **文字流式**：打字机效果显示文本
- **进度动画**：平滑的进度条更新
- **状态转换**：图标旋转、颜色渐变

### 3. 交互功能
- **文件预览**：点击查看文件内容
- **进度显示**：实时显示创建进度
- **状态指示**：清晰的视觉状态反馈

## 🔄 数据流程

```
用户输入 → AI生成 → 内容分离 → 分别显示
         ↓
    原始AI响应
         ↓
  separateTextAndCode()
         ↓
    {text, codeFiles}
         ↓
    text → 对话框
    codeFiles → 文件面板
```

## 🧪 测试体验

访问 `/test-text-code-separation` 查看演示：

1. 输入项目需求（如"创建React应用"）
2. 观察文本内容在对话框中流式显示
3. 查看代码文件在独立面板中创建
4. 体验文件进度和内容预览功能

## 🚀 核心优势

1. **清晰分离**：文本和代码各司其职，界面清爽
2. **流式体验**：实时显示AI工作过程，用户体验流畅
3. **可视化进度**：直观的文件创建进度显示
4. **交互友好**：支持文件预览和状态查看

这个实现让用户能够同时看到AI的思考过程和具体的代码生成结果，提供了更好的用户体验。 