# Components 组织结构

## 当前问题
- layout 文件夹名称不够清晰，主要包含代码相关的组件
- components 根目录文件过多，缺乏清晰的分类
- 功能相关的组件分散在不同位置

## 新的组织结构建议

```
components/
├── ui/                    # 基础UI组件（保持不变）
├── chat/                  # 聊天相关组件（已存在，保持）
├── editor/               # 代码编辑相关组件（重命名自layout）
│   ├── CodeEditorPanel.tsx
│   ├── CodePreviewToggle.tsx
│   ├── WebContainerPreview.tsx
│   ├── SmartToggleBar.tsx
│   └── inline-editor.tsx        # 从根目录移入
├── forms/                # 表单相关组件
│   ├── password-form.tsx        # 从根目录移入
│   └── flow-builder.tsx         # 从根目录移入
├── dialogs/              # 对话框相关组件
│   └── share-dialog.tsx         # 从根目录移入
├── rendering/            # 渲染相关组件
│   ├── page-renderer.tsx        # 从根目录移入
│   └── MarkdownRenderer.tsx     # 从ui文件夹移入（如果需要）
├── navigation/           # 导航和选择器组件
│   ├── model-selector.tsx       # 从根目录移入
│   └── theme-toggle.tsx         # 从根目录移入
├── integration/          # 集成相关组件
│   ├── data-source-integration.tsx  # 从根目录移入
│   └── theme-provider.tsx           # 从根目录移入
└── interfaces/           # 主要界面组件
    └── chat-interface.tsx       # 从根目录移入
```

## 重命名建议

1. **layout** → **editor**
   - 更准确地反映了文件夹内容（代码编辑相关）
   - 避免与Next.js的layout概念混淆

2. 按功能域分组，便于：
   - 快速定位相关组件
   - 维护和更新
   - 新成员理解项目结构

## 重构完成状态 ✅

### 已完成的重构
1. ✅ 重命名 `layout` → `editor`
2. ✅ 创建 `forms/` 文件夹并移入表单组件
3. ✅ 创建 `dialogs/` 文件夹并移入对话框组件
4. ✅ 创建 `rendering/` 文件夹并移入渲染组件
5. ✅ 创建 `navigation/` 文件夹并移入导航组件
6. ✅ 创建 `integration/` 文件夹并移入集成组件
7. ✅ 创建 `interfaces/` 文件夹并移入界面组件
8. ✅ 为每个文件夹创建了索引文件（index.ts）

### 当前文件夹结构
```
components/
├── ui/                    # 基础UI组件
├── chat/                  # 聊天相关组件
├── editor/               # 代码编辑相关组件 ✅
│   ├── CodeEditorPanel.tsx
│   ├── CodePreviewToggle.tsx
│   ├── WebContainerPreview.tsx
│   ├── SmartToggleBar.tsx
│   ├── inline-editor.tsx
│   └── index.ts
├── forms/                # 表单相关组件 ✅
│   ├── password-form.tsx
│   ├── flow-builder.tsx
│   └── index.ts
├── dialogs/              # 对话框相关组件 ✅
│   ├── share-dialog.tsx
│   └── index.ts
├── rendering/            # 渲染相关组件 ✅
│   ├── page-renderer.tsx
│   └── index.ts
├── navigation/           # 导航和选择器组件 ✅
│   ├── model-selector.tsx
│   ├── theme-toggle.tsx
│   └── index.ts
├── integration/          # 集成相关组件 ✅
│   ├── data-source-integration.tsx
│   ├── theme-provider.tsx
│   └── index.ts
└── interfaces/           # 主要界面组件 ✅
    ├── chat-interface.tsx
    └── index.ts
```

## 注意事项

1. 移动文件时需要更新所有导入路径
2. 确保TypeScript类型导入正确
3. 更新相关的配置文件（如果有）
4. 考虑创建index.ts文件方便导入 