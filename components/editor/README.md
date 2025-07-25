# Editor Components 编辑器组件

HeysMe项目的编辑器模块，提供代码预览、编辑和可视化交互功能。

## 📁 文件结构

```
components/editor/
├── CodePreviewToggle.tsx     # 主要的代码预览切换组件
├── WebContainerPreview.tsx   # WebContainer预览渲染组件
├── CodeEditorPanel.tsx       # 代码编辑面板组件
├── FileTree.tsx              # 文件树组件
├── StagewiseToolbar.tsx      # 可视化编辑工具栏
├── SmartToggleBar.tsx        # 智能切换工具栏
├── inline-editor.tsx         # 内联编辑器组件
└── index.ts                  # 组件导出文件
```

## 🔧 核心组件功能

### 1. CodePreviewToggle.tsx
**主要的代码预览切换组件** - 35KB, 904行

#### 功能特性
- **双模式切换**: 支持"预览"和"代码"两种查看模式
- **文件管理**: 左侧文件树显示项目结构
- **设备预览**: 支持桌面/平板/手机三种设备模式预览
- **实时编辑**: 可视化编辑模式，支持在预览中直接修改元素
- **语法高亮**: VS Code风格的代码语法高亮
- **文件操作**: 复制代码、编辑文件等操作

#### 主要接口
```typescript
interface CodePreviewToggleProps {
  files: CodeFile[];
  isStreaming?: boolean;
  previewData?: PreviewData;
  onDownload?: () => void;
  onDeploy?: () => void;
  onEditCode?: (filename: string) => void;
  onSendMessage?: (message: string, options?: any) => void;
}
```

#### 使用场景
- AI生成代码后的预览展示
- 项目代码的查看和编辑
- 响应式设计的设备适配预览

---

### 2. WebContainerPreview.tsx
**WebContainer预览渲染组件** - 15KB, 478行

#### 功能特性
- **模拟预览**: 将React代码转换为可运行的HTML预览
- **WebContainer集成**: 支持真实的容器化运行环境
- **代码处理**: 自动处理import/export语句，适配浏览器环境
- **CSS集成**: 自动注入样式文件到预览页面
- **可视化编辑**: 支持StagewiseIO可视化编辑工具集成

#### 主要功能
```typescript
// 生成预览HTML
generatePreviewHTML(): string

// 处理React组件代码
processReactComponent(content: string): string

// 刷新预览
refreshPreview(): void
```

#### 技术实现
- 使用iframe渲染预览内容
- 通过Babel转译JSX代码
- 集成React 18 UMD版本
- 支持TailwindCSS样式框架

---

### 3. CodeEditorPanel.tsx
**代码编辑面板组件** - 全新架构，基于Monaco Editor

#### 功能特性
- **文件树导航**: 使用react-arborist实现VS Code风格的文件树
- **Monaco编辑器**: 集成VS Code同源的Monaco编辑器
- **实时编辑**: 直接在编辑器中修改代码，自动保存
- **语法高亮**: 支持TypeScript、JavaScript、CSS等多种语言
- **智能提示**: 代码自动补全、错误检测、格式化
- **主题支持**: 支持亮色/暗色主题切换

#### 支持的文件类型
- **Component**: React组件文件 (⚛️)
- **Styles**: CSS/SCSS样式文件 (🎨)
- **Config**: 配置文件 (📋)
- **Data**: 数据文件 (📊)
- **Page**: 页面文件 (📄)

#### 技术特性
- **Monaco Editor**: VS Code同源编辑器，功能完整
- **React Arborist**: 现代化文件树组件，支持拖拽和层级结构
- **实时同步**: 编辑内容实时同步到父组件
- **性能优化**: 虚拟滚动、按需加载

---

### 4. FileTree.tsx
**文件树组件** - 基于react-arborist的现代文件树

#### 功能特性
- **VS Code风格**: 仿VS Code侧边栏的文件树设计
- **层级结构**: 支持文件夹和文件的嵌套显示
- **智能图标**: 根据文件类型自动显示对应图标
- **选择状态**: 高亮显示当前选中的文件
- **类型标签**: 显示文件类型标识（component、styles等）
- **展开收起**: 文件夹支持展开和收起操作

#### 主要接口
```typescript
interface FileTreeNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  language?: string;
  fileType?: 'component' | 'page' | 'styles' | 'config' | 'data';
  children?: FileTreeNode[];
  content?: string;
}

interface FileTreeProps {
  data: FileTreeNode[];
  selectedFileId?: string;
  onFileSelect: (fileId: string) => void;
  className?: string;
}
```

#### 技术实现
- **React Arborist**: 高性能的树形组件库
- **虚拟滚动**: 支持大量文件的高效渲染
- **自定义节点**: 完全自定义的文件节点渲染
- **响应式设计**: 适配不同屏幕尺寸

---

### 5. StagewiseToolbar.tsx
**可视化编辑工具栏** - 3.1KB, 102行

#### 功能特性
- **可视化选择**: 在预览页面中点击选择元素
- **智能提示**: 基于选中元素生成修改建议
- **元素信息**: 显示选中元素的标签、类名、内容等
- **编辑请求**: 将可视化编辑请求发送到聊天系统

#### 集成技术
- **StagewiseIO**: 第三方可视化编辑工具
- **React Plugin**: 专门为React项目优化
- **消息通信**: 通过postMessage与iframe通信

#### 使用方式
```typescript
<StagewiseToolbar
  iframeRef={iframeRef}
  onElementModificationRequest={handleModification}
  isEnabled={isVisualEditEnabled}
  onToggle={() => setIsVisualEditEnabled(!isVisualEditEnabled)}
/>
```

---

### 6. SmartToggleBar.tsx
**智能切换工具栏** - 6.7KB, 213行

#### 功能特性
- **视图模式切换**: 代码/分屏/预览三种模式
- **编辑状态管理**: 编辑/预览状态切换
- **智能提示**: 根据当前状态提供操作建议
- **未保存提醒**: 检测未保存更改并提醒用户

#### 视图模式
- **代码模式**: 专注代码编辑
- **分屏模式**: 代码+预览同时显示
- **预览模式**: 专注预览效果

#### 状态管理
```typescript
type ViewMode = 'code' | 'split' | 'preview';
type EditMode = 'view' | 'edit';
```

---

### 7. inline-editor.tsx
**内联编辑器组件** - 6.0KB, 218行

#### 功能特性
- **就地编辑**: 直接在显示位置进行编辑
- **多种类型**: 支持文本、多行文本、标题编辑
- **自动保存**: 可配置的自动保存功能
- **状态指示**: 显示保存状态和未保存提醒
- **快捷键**: 支持Enter保存、Escape取消

#### 编辑类型
- **text**: 单行文本编辑
- **textarea**: 多行文本编辑  
- **title**: 标题样式编辑

#### 使用示例
```typescript
<InlineEditor
  value={content}
  type="textarea"
  onSave={handleSave}
  autoSave={true}
  autoSaveDelay={1000}
/>
```

---

## 🔄 组件协作流程

### 1. 代码生成 → 预览流程
```
AI生成代码 → CodePreviewToggle → WebContainerPreview → 显示预览
```

### 2. 可视化编辑流程
```
用户点击元素 → StagewiseToolbar → 发送编辑请求 → 聊天系统 → AI修改代码
```

### 3. 代码编辑流程
```
选择文件 → CodeEditorPanel → 编辑代码 → 实时保存 → 更新预览
```

## 📦 依赖技术

### 核心依赖
- **React 18**: 组件框架
- **Framer Motion**: 动画效果
- **Lucide React**: 图标库
- **TailwindCSS**: 样式框架

### 第三方集成
- **Monaco Editor**: VS Code同源的代码编辑器
- **React Arborist**: 现代化文件树组件
- **StagewiseIO**: 可视化编辑工具
- **WebContainer**: 浏览器内容器化运行环境
- **Babel Standalone**: 浏览器端JSX转译

### UI组件
- **shadcn/ui**: 基础UI组件库
- **自定义主题**: 支持亮色/暗色主题切换

## 🎯 使用场景

### 1. AI代码生成后预览
- 显示生成的React组件效果
- 支持多设备响应式预览
- 提供代码查看和编辑功能

### 2. 可视化编辑工作流
- 用户在预览中选择要修改的元素
- 系统智能识别元素信息
- 将修改需求发送给AI进行代码更新

### 3. 开发调试环境
- 实时预览代码修改效果
- 支持多文件项目结构
- 提供完整的代码编辑体验

## 🚀 性能优化

### 1. 组件懒加载
- 使用React.lazy进行组件分割
- 按需加载重型组件

### 2. 预览优化
- iframe沙盒隔离
- 模拟预览优先，WebContainer备用
- 自动处理代码兼容性

### 3. 编辑体验
- 防抖自动保存
- 语法高亮缓存
- 快捷键操作支持

## 📝 开发指南

### 添加新的文件类型支持
1. 在`CodeFile`接口中添加新类型
2. 在`getFileIcon`函数中添加图标映射
3. 在`getFileTypeColor`中添加颜色样式

### 扩展预览功能
1. 修改`WebContainerPreview`的`generatePreviewHTML`方法
2. 添加新的依赖库到CDN引用
3. 更新代码处理逻辑

### 集成新的编辑工具
1. 参考`StagewiseToolbar`的实现模式
2. 实现消息通信接口
3. 添加到`CodePreviewToggle`组件中

---

*最后更新: 2024年12月* 