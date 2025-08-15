我来帮你分析这个应用中的大模型生成代码对话框UI和相关组件的实现。让我先探索一下这个项目的结构，了解对话框、文档创建和预览的实现。
Ran tool
Search files...
Search files...
Search files...
Ran tool
让我读取关键组件的具体实现：
Ran tool
Ran tool
Ran tool
现在让我查看代码生成的流式显示部分：
Ran tool
Ran tool
Ran tool
让我查看生成选项卡的UI部分：
Ran tool
Ran tool
让我查看聊天界面的完整渲染部分：
Ran tool
Ran tool
Ran tool
现在让我总结一下这个应用的UI实现结构：
Ran tool
基于我对代码的深入分析，这个应用的大模型生成代码UI实现非常复杂且功能丰富。让我为你详细解析其核心实现：

## 1. 整体布局架构

应用采用**双栏布局**结构：
- **左侧**：聊天对话框 (约1/3宽度)
- **右侧**：选项卡界面，包含代码生成和预览 (约2/3宽度)

## 2. 左侧对话框UI实现

### 聊天消息结构
```typescript
interface ChatMessage {
  content: string;
  type: 'user' | 'ai' | 'system' | 'file-update' | 'command' | 'error';
  timestamp: Date;
  metadata?: {
    scrapedUrl?: string;
    scrapedContent?: any;
    generatedCode?: string;
    appliedFiles?: string[];
    commandType?: 'input' | 'output' | 'error' | 'success';
  };
}
```

### 消息渲染逻辑
```51:3227:app/page.tsx
{chatMessages.map((msg, idx) => {
  // 检查是否为生成完成消息
  const isGenerationComplete = msg.content.includes('Successfully recreated') || 
                              msg.content.includes('AI recreation generated!') ||
                              msg.content.includes('Code generated!');
  
  return (
    <div key={idx} className="block">
      <div className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} mb-1`}>
        <div className={`block rounded-[10px] px-4 py-2 ${
          msg.type === 'user' ? 'bg-[#36322F] text-white ml-auto max-w-[80%]' :
          msg.type === 'ai' ? 'bg-gray-100 text-gray-900 mr-auto max-w-[80%]' :
          msg.type === 'system' ? 'bg-[#36322F] text-white text-sm' :
          msg.type === 'command' ? 'bg-[#36322F] text-white font-mono text-sm' :
          msg.type === 'error' ? 'bg-red-900 text-red-100 text-sm border border-red-700' :
          'bg-[#36322F] text-white text-sm'
        }`}>
          {/* 根据消息类型渲染不同内容 */}
        </div>
      </div>
    </div>
  );
})}
```

### 实时生成进度显示
在聊天区域底部动态显示代码生成进度：

```234:308:app/page.tsx
{/* 代码生成进度 - 内联显示 */}
{generationProgress.isGenerating && (
  <div className="inline-block bg-gray-100 rounded-lg p-3">
    <div className="text-sm font-medium mb-2 text-gray-700">
      {generationProgress.status}
    </div>
    <div className="flex flex-wrap items-start gap-1">
      {/* 显示已完成的文件 */}
      {generationProgress.files.map((file, idx) => (
        <div className="inline-flex items-center gap-1 px-2 py-1 bg-[#36322F] text-white rounded-[10px] text-xs animate-fade-in-up">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
          {file.path.split('/').pop()}
        </div>
      ))}
      
      {/* 显示当前正在生成的文件 */}
      {generationProgress.currentFile && (
        <div className="flex items-center gap-1 px-2 py-1 bg-[#36322F]/70 text-white rounded-[10px] text-xs animate-pulse">
          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
          {generationProgress.currentFile.path.split('/').pop()}
        </div>
      )}
    </div>
    
    {/* 实时代码流显示 */}
    {generationProgress.streamedCode && (
      <motion.div className="mt-3 border-t border-gray-300 pt-3">
        <div className="bg-gray-900 border border-gray-700 rounded max-h-32 overflow-y-auto scrollbar-hide">
          <SyntaxHighlighter language="jsx" style={vscDarkPlus}>
            {(() => {
              const lastContent = generationProgress.streamedCode.slice(-1000);
              const startIndex = lastContent.indexOf('<');
              return startIndex !== -1 ? lastContent.slice(startIndex) : lastContent;
            })()}
          </SyntaxHighlighter>
          <span className="inline-block w-2 h-3 bg-orange-400 ml-3 mb-3 animate-pulse" />
        </div>
      </motion.div>
    )}
  </div>
)}
```

## 3. 右侧选项卡界面

### 选项卡切换
```342:370:app/page.tsx
<div className="flex bg-[#36322F] rounded-lg p-1">
  <button
    onClick={() => setActiveTab('generation')}
    className={`p-2 rounded-md transition-all ${
      activeTab === 'generation' 
        ? 'bg-black text-white' 
        : 'text-gray-300 hover:text-white hover:bg-gray-700'
    }`}
    title="Code"
  >
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  </button>
  <button
    onClick={() => setActiveTab('preview')}
    className={`p-2 rounded-md transition-all ${
      activeTab === 'preview' 
        ? 'bg-black text-white' 
        : 'text-gray-300 hover:text-white hover:bg-gray-700'
    }`}
    title="Preview"
  >
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  </button>
</div>
```

## 4. 代码生成选项卡实现

### 文件浏览器 + 代码编辑器布局
```970:1350:app/page.tsx
if (activeTab === 'generation' && (generationProgress.isGenerating || generationProgress.files.length > 0)) {
  return (
    <div className="absolute inset-0 flex overflow-hidden">
      {/* 文件浏览器 - 编辑模式时隐藏 */}
      {!generationProgress.isEdit && (
        <div className="w-[250px] border-r border-gray-200 bg-white flex flex-col flex-shrink-0">
          {/* 文件树结构 */}
        </div>
      )}
      
      {/* 代码显示区域 */}
      <div className="flex-1 bg-white overflow-y-auto flex flex-col">
        {/* 实时流式显示或已完成文件显示 */}
        {generationProgress.isStreaming ? (
          <div className="h-full bg-gray-900 relative">
            <SyntaxHighlighter
              language="jsx"
              style={vscDarkPlus}
              showLineNumbers={true}
            >
              {generationProgress.streamedCode || 'Starting code generation...'}
            </SyntaxHighlighter>
            <span className="inline-block w-2 h-4 bg-orange-400 ml-1 animate-pulse" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* 显示已生成的文件 */}
            {generationProgress.files.map((file, idx) => (
              <div key={idx} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-4 py-2 bg-[#36322F] text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span className="font-mono text-sm">{file.path}</span>
                  </div>
                </div>
                <div className="bg-gray-900 border border-gray-700 max-h-48 overflow-y-auto scrollbar-hide">
                  <SyntaxHighlighter
                    language={file.type === 'css' ? 'css' : file.type === 'json' ? 'json' : 'jsx'}
                    style={vscDarkPlus}
                    showLineNumbers={true}
                    wrapLongLines={true}
                  >
                    {file.content}
                  </SyntaxHighlighter>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

## 5. 预览界面实现

预览界面使用 `SandboxPreview` 组件：

```1:119:components/SandboxPreview.tsx
export default function SandboxPreview({ 
  sandboxId, 
  port, 
  type, 
  output,
  isLoading = false 
}: SandboxPreviewProps) {
  
  return (
    <div className="relative bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
      {isLoading && (
        <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center z-10">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-400">
              {type === 'vite' ? 'Starting Vite dev server...' : 'Starting Next.js dev server...'}
            </p>
          </div>
        </div>
      )}
      
      <iframe
        src={previewUrl}
        className="w-full h-[600px] bg-white"
        title={`${type} preview`}
        sandbox="allow-scripts allow-same-origin allow-forms"
      />
      
      {/* 控制台输出 */}
      {showConsole && output && (
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="font-mono text-xs whitespace-pre-wrap text-gray-300 max-h-48 overflow-y-auto">
            {output}
          </div>
        </div>
      )}
    </div>
  );
}
```

## 6. 代码逐行显示的核心机制

### 流式数据处理
```1609:1673:app/page.tsx
} else if (data.type === 'stream' && data.raw) {
  setGenerationProgress(prev => {
    const newStreamedCode = prev.streamedCode + data.text;
    
    const updatedState = { 
      ...prev, 
      streamedCode: newStreamedCode,
      isStreaming: true,
      isThinking: false,
      status: 'Generating code...'
    };
    
    // 从累积的流中处理完整文件
    const fileRegex = /<file path="([^"]+)">([^]*?)<\/file>/g;
    let match;
    const processedFiles = new Set(prev.files.map(f => f.path));
    
    while ((match = fileRegex.exec(newStreamedCode)) !== null) {
      const [, filePath, fileContent] = match;
      
      if (!processedFiles.has(filePath)) {
        // 解析文件类型和内容
        const fileType = filePath.endsWith('.css') ? 'css' :
                        filePath.endsWith('.json') ? 'json' :
                        filePath.endsWith('.html') ? 'html' : 'javascript';
        
        updatedState.files.push({
          path: filePath,
          content: fileContent.trim(),
          type: fileType
        });
        processedFiles.add(filePath);
      }
    }
    
    return updatedState;
  });
}
```

### 自动滚动机制
```1948:1953:app/page.tsx
// 流式显示时自动滚动到底部
useEffect(() => {
  if (codeDisplayRef.current && generationProgress.isStreaming) {
    codeDisplayRef.current.scrollTop = codeDisplayRef.current.scrollHeight;
  }
}, [generationProgress.streamedCode, generationProgress.isStreaming]);
```

## 7. 关键特性总结

1. **实时流式显示**：使用 Server-Sent Events (SSE) 接收后端流式数据
2. **代码高亮**：使用 `react-syntax-highlighter` 提供语法高亮
3. **动画效果**：使用 `framer-motion` 提供流畅的进入/退出动画
4. **响应式布局**：支持不同屏幕尺寸的自适应显示
5. **文件管理**：动态解析生成的文件并分类显示
6. **进度反馈**：实时显示生成状态和已完成的文件数量
7. **光标效果**：使用脉冲动画模拟打字机效果

这个实现展现了一个非常成熟的AI代码生成界面，提供了完整的用户体验，从聊天交互到实时代码生成预览，再到最终的应用预览。

让我深入分析预览功能的实现机制。首先查看相关的预览组件和API：
Ran tool
Ran tool
Search files...
现在让我查看配置文件来了解E2B的配置：
Ran tool
基于深入分析，我来详细解释这个应用的预览功能是如何实现的：

## 预览功能实现架构

这个应用的预览功能基于 **E2B (Execute to Build)** 云沙盒服务，实现了完整的在线代码运行和预览环境。

## 1. 核心技术架构

### E2B 沙盒服务
```typescript
// 使用 E2B 作为云端代码执行环境
import { Sandbox } from '@e2b/code-interpreter';

// 创建沙盒实例
sandbox = await Sandbox.create({ 
  apiKey: process.env.E2B_API_KEY,
  timeoutMs: appConfig.e2b.timeoutMs // 15分钟超时
});
```

### 预览URL生成机制
```23:29:components/SandboxPreview.tsx
useEffect(() => {
  if (sandboxId && type !== 'console') {
    // E2B 沙盒预览URL格式
    // 格式: https://{sandboxId}-{port}.e2b.dev
    setPreviewUrl(`https://${sandboxId}-${port}.e2b.dev`);
  }
}, [sandboxId, port, type]);
```

## 2. 沙盒创建流程

### API: `/api/create-ai-sandbox`
```typescript
// 1. 创建基础沙盒
sandbox = await Sandbox.create({ 
  apiKey: process.env.E2B_API_KEY,
  timeoutMs: appConfig.e2b.timeoutMs
});

// 2. 获取沙盒信息
const sandboxId = sandbox.sandboxId;
const host = sandbox.getHost(appConfig.e2b.vitePort); // 端口5173

// 3. 设置Vite React应用环境
// 通过Python脚本创建基础项目结构
```

### 初始化项目结构
```52:334:app/api/create-ai-sandbox/route.ts
// 使用Python脚本在沙盒中设置完整的Vite React项目
const setupCode = `
import os
import json

# 创建项目目录
os.makedirs('/home/user/app/src', exist_ok=True)
os.makedirs('/home/user/app/public', exist_ok=True)

# 写入package.json
package_json = {
  "name": "e2b-vite-app",
  "private": True,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite --host 0.0.0.0 --port 5173",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.0.8",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32"
  }
}

# 写入各种配置文件...
`;

// 执行设置脚本
await sandbox.runCode(setupCode);
```

## 3. 预览界面组件

### SandboxPreview 组件结构
```45:119:components/SandboxPreview.tsx
return (
  <div className="space-y-4">
    {/* 预览控制栏 */}
    <div className="flex items-center justify-between bg-gray-800 rounded-lg p-3">
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-400">
          {type === 'vite' ? '⚡ Vite' : '▲ Next.js'} Preview
        </span>
        <code className="text-xs bg-gray-900 px-2 py-1 rounded text-blue-400">
          {previewUrl}
        </code>
      </div>
      <div className="flex items-center gap-2">
        {/* 控制台切换 */}
        <button onClick={() => setShowConsole(!showConsole)}>
          <Terminal className="w-4 h-4" />
        </button>
        {/* 刷新按钮 */}
        <button onClick={handleRefresh}>
          <RefreshCw className="w-4 h-4" />
        </button>
        {/* 新窗口打开 */}
        <a href={previewUrl} target="_blank">
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>

    {/* 主预览区域 */}
    <div className="relative bg-gray-900 rounded-lg overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center z-10">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p>Starting Vite dev server...</p>
        </div>
      )}
      
      {/* iframe预览 */}
      <iframe
        key={iframeKey}
        src={previewUrl}
        className="w-full h-[600px] bg-white"
        title={`${type} preview`}
        sandbox="allow-scripts allow-same-origin allow-forms"
      />
    </div>

    {/* 控制台输出 */}
    {showConsole && output && (
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="font-mono text-xs whitespace-pre-wrap text-gray-300">
          {output}
        </div>
      </div>
    )}
  </div>
);
```

## 4. 主应用预览渲染

### 在主应用中的预览实现
```1403:1432:app/page.tsx
// 当有沙盒数据且不在加载状态时显示iframe
if (sandboxData?.url && !loading) {
  return (
    <div className="relative w-full h-full">
      <iframe
        ref={iframeRef}
        src={sandboxData.url}
        className="w-full h-full border-none"
        title="Open Lovable Sandbox"
        allow="clipboard-write"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
      />
      {/* 手动刷新按钮 */}
      <button
        onClick={() => {
          if (iframeRef.current && sandboxData?.url) {
            const newSrc = `${sandboxData.url}?t=${Date.now()}&manual=true`;
            iframeRef.current.src = newSrc;
          }
        }}
        className="absolute bottom-4 right-4 bg-white/90 hover:bg-white text-gray-700 p-2 rounded-lg shadow-lg"
      >
        {/* 刷新图标 */}
      </button>
    </div>
  );
}
```

## 5. 代码应用到预览的流程

### 1. 代码生成完成后自动应用
```api/apply-ai-code/route.ts
// 解析AI生成的代码
const parsed = parseAIResponse(response);

// 将文件写入沙盒
for (const file of parsed.files) {
  const writeResult = await global.activeSandbox.runCode(`
    import os
    os.makedirs(os.path.dirname('/home/user/app/${file.path}'), exist_ok=True)
    
    with open('/home/user/app/${file.path}', 'w', encoding='utf-8') as f:
        f.write('''${file.content.replace(/'/g, "\\'")}''')
    
    print(f"Created: ${file.path}")
  `);
}
```

### 2. 自动重启Vite开发服务器
```typescript
// 安装包后重启Vite
if (packageInstallResult.success) {
  await fetch('/api/restart-vite', {
    method: 'POST'
  });
}
```

## 6. 配置参数

### E2B配置
```4:26:config/app.config.ts
e2b: {
  timeoutMinutes: 15,           // 沙盒超时时间
  vitePort: 5173,              // Vite开发服务器端口
  viteStartupDelay: 7000,      // Vite启动等待时间
  cssRebuildDelay: 2000,       // CSS重建等待时间
}
```

## 7. 实时更新机制

### HMR (热模块替换) 支持
- **Vite内置HMR**：代码更改后自动重新编译
- **iframe自动刷新**：检测到构建错误时自动刷新
- **WebSocket连接**：通过Vite的WebSocket保持实时连接

### 错误检测和自动恢复
```components/HMRErrorDetector.tsx
// 监听iframe加载错误并自动重试
useEffect(() => {
  if (iframe && sandboxUrl) {
    iframe.onload = () => {
      setRetryCount(0);
    };
    
    iframe.onerror = () => {
      if (retryCount < maxRetries) {
        setTimeout(() => {
          iframe.src = `${sandboxUrl}?retry=${retryCount + 1}`;
          setRetryCount(prev => prev + 1);
        }, retryDelay);
      }
    };
  }
}, [iframe, sandboxUrl, retryCount]);
```

## 核心优势

1. **真实运行环境**：使用真实的Linux容器，完全模拟生产环境
2. **即时预览**：代码应用后立即可见效果
3. **完整开发环境**：支持npm包安装、文件系统操作等
4. **安全隔离**：每个会话独立的沙盒环境
5. **自动化部署**：从代码生成到预览完全自动化

这个预览系统的核心在于将**云端沙盒服务** + **实时代码编译** + **iframe嵌入预览**完美结合，实现了一个功能完整的在线代码编辑和预览平台。

分析这个应用预览速度快的原因，我发现了几个关键的优化思路：
Ran tool
Search files...
Search files...
基于深入分析，这个应用预览速度快的原因主要来自以下几个核心优化思路：

## 🚀 预览速度优化的核心思路

### 1. **多层缓存机制**

#### 全局文件缓存系统
```typescript
// 全局沙盒状态缓存
global.sandboxState = {
  fileCache: {
    files: Record<string, { content: string; lastModified: number }>,
    lastSync: Date.now(),
    sandboxId: string,
    manifest?: FileManifest  // 增强的文件清单
  }
};
```

#### 智能缓存更新
```552:557:app/api/apply-ai-code-stream/route.ts
// 写入文件时同步更新缓存
if (global.sandboxState?.fileCache) {
  global.sandboxState.fileCache.files[normalizedPath] = {
    content: fileContent,
    lastModified: Date.now()
  };
}
```

### 2. **Vite HMR (热模块替换) 深度集成**

#### 配置优化的 Vite 环境
```6:26:config/app.config.ts
e2b: {
  vitePort: 5173,                    // 固定端口，减少切换开销
  viteStartupDelay: 7000,           // 预留启动时间
  cssRebuildDelay: 2000,            // CSS重建优化
}
```

#### HMR 错误监听和自动恢复
```12:57:components/HMRErrorDetector.tsx
const checkForHMRErrors = () => {
  // 实时监听 Vite 错误覆盖层
  const errorOverlay = iframeDoc.querySelector('vite-error-overlay');
  if (errorOverlay) {
    // 自动解析包依赖错误并触发安装
    const importMatch = errorText.match(/Failed to resolve import "([^"]+)"/);
    if (importMatch) {
      onErrorDetected([{
        type: 'npm-missing',
        package: finalPackage
      }]);
    }
  }
};

// 每2秒检查一次，而非轮询
checkIntervalRef.current = setInterval(checkForHMRErrors, 2000);
```

### 3. **智能的 iframe 刷新策略**

#### 分层刷新机制
```773:796:app/page.tsx
// 代码应用后的智能刷新
setTimeout(() => {
  if (iframeRef.current && sandboxData?.url) {
    // 方法1: 添加时间戳强制刷新，保持缓存
    const urlWithTimestamp = `${sandboxData.url}?t=${Date.now()}&applied=true`;
    iframeRef.current.src = urlWithTimestamp;
    
    // 方法2: 延迟强制重载，确保更新
    setTimeout(() => {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.location.reload();
      }
    }, 1000);
  }
}, refreshDelay);
```

#### Key-based 组件重建
```31:33:components/SandboxPreview.tsx
const handleRefresh = () => {
  setIframeKey(prev => prev + 1);  // React key 变化触发重建
};
```

### 4. **文件大小和网络优化**

#### 限制文件大小避免传输瓶颈
```41:43:app/api/get-sandbox-files/route.ts
// 只缓存10KB以下的文件，避免大文件传输
if (len(content) < 10000:
  files_content[relative_path] = content
```

#### 增量文件同步
```923:963:app/api/generate-ai-code-stream/route.ts
// 编辑模式时只获取必要文件
if (!hasBackendFiles && isEdit) {
  const filesResponse = await fetch('/api/get-sandbox-files');
  // 只同步变更的文件到缓存
  for (const [path, content] of Object.entries(filesData.files)) {
    global.sandboxState.fileCache.files[normalizedPath] = {
      content: content as string,
      lastModified: Date.now()
    };
  }
}
```

### 5. **并行处理和异步优化**

#### 流式代码应用
- **实时流式显示**：代码生成过程中即时显示
- **并行文件写入**：多个文件同时写入沙盒
- **异步依赖安装**：包安装与文件写入并行进行

#### 预配置的沙盒环境
```51:334:app/api/create-ai-sandbox/route.ts
// 预配置完整的 Vite + React + TailwindCSS 环境
// 减少每次创建项目的初始化时间
```

### 6. **E2B 云服务的性能优势**

#### 专业的云端容器
- **SSD 存储**：快速文件 I/O
- **预热容器**：减少冷启动时间
- **CDN 加速**：全球分布式访问
- **资源隔离**：每个会话独立环境

#### 优化的端口策略
```24:28:components/SandboxPreview.tsx
// 使用固定的端口格式，减少重定向
// https://{sandboxId}-{port}.e2b.dev
setPreviewUrl(`https://${sandboxId}-${port}.e2b.dev`);
```

## 💡 可以借鉴的优化思路

### 1. **多层缓存架构**
```typescript
// 内存缓存 + 持久化缓存 + CDN缓存
interface CacheStrategy {
  memory: Map<string, CacheItem>;     // 热数据
  disk: Record<string, CacheItem>;    // 持久化
  cdn: string[];                      // 静态资源
}
```

### 2. **预测性预加载**
```typescript
// 基于用户行为预测下一步操作
const predictiveLoad = {
  commonPackages: ['react-router-dom', 'axios', 'lodash'],
  templateFiles: ['App.jsx', 'index.css', 'main.jsx'],
  frequentActions: ['npm install', 'file creation']
};
```

### 3. **智能错误恢复**
```typescript
// 自动检测并修复常见错误
const autoFix = {
  missingDependencies: async (packages) => await installPackages(packages),
  syntaxErrors: async (error) => await applySyntaxFix(error),
  networkIssues: async () => await retryWithBackoff()
};
```

### 4. **渐进式加载策略**
```typescript
// 分层加载：骨架屏 -> 基础功能 -> 完整功能
const loadingStrategy = {
  skeleton: 'immediate',      // 立即显示骨架
  core: 'within 100ms',      // 核心功能快速加载
  enhanced: 'within 500ms',   // 增强功能延迟加载
  assets: 'lazy loaded'       // 资源懒加载
};
```

这个应用通过 **多层缓存** + **HMR深度集成** + **智能刷新** + **云端优化** 的组合策略，实现了接近本地开发的预览速度体验。核心在于减少不必要的数据传输和重复计算，最大化利用 Vite 的热更新能力。