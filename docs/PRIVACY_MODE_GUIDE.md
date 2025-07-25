# HeysMe 隐私模式文档处理系统

## 📋 概述

HeysMe 平台提供了统一的文档处理系统，支持两种处理模式：

- **🔒 隐私模式**：文件仅在内存中处理，不存储到服务器
- **💾 标准模式**：文件安全存储到 Supabase，支持持久化和历史查看

## 🚀 核心特性

### 统一处理流程
- ✅ **相同解析能力**：两种模式使用相同的文档解析引擎
- ✅ **一键切换**：页面右上角隐私模式开关，实时切换
- ✅ **批量处理**：支持多文件同时上传和处理
- ✅ **智能识别**：自动识别文档类型并选择最优解析方案

### 隐私保护
- ✅ **零存储**：隐私模式下文件仅在内存中处理
- ✅ **自动清理**：处理结果临时保存1小时后自动清理
- ✅ **会话隔离**：不同会话的文档完全隔离
- ✅ **安全提示**：界面明确显示当前模式状态

## 🏗️ 技术架构

### 后端服务

#### 统一文档服务
- **文件**: `lib/services/unified-document-service.ts`
- **功能**: 根据隐私模式决定存储策略
- **核心方法**:
  ```typescript
  processDocument(file: File, options: DocumentProcessingOptions)
  processMultipleDocuments(files: File[], options: DocumentProcessingOptions)
  getUserDocuments(userId: string, isPrivacyMode: boolean)
  ```

#### 文档解析引擎
- **文件**: `lib/services/document-service.ts`
- **支持格式**: PDF、Word、Excel、PowerPoint、TXT、CSV、JSON、Markdown
- **解析库**: 
  - PDF: `pdf-parse`
  - Word: `mammoth`
  - Excel: `xlsx`
  - PowerPoint: `node-pptx`

### 前端组件

#### 增强文件上传组件
- **文件**: `components/ui/enhanced-file-dropzone.tsx`
- **特性**:
  - 拖拽上传支持
  - 实时进度显示
  - 隐私模式切换
  - 批量文件处理
  - 错误处理和重试

#### 隐私模式切换
- **文件**: `components/ui/privacy-toggle.tsx`
- **位置**: 页面右上角
- **样式**: 紧凑型开关，带状态提示

### API 接口

#### 统一上传接口
- **路径**: `/api/documents/upload`
- **方法**: `POST` (上传) / `GET` (列表)
- **参数**:
  ```typescript
  {
    files: File[],
    isPrivacyMode: boolean,
    sessionId?: string,
    extractMode: 'general' | 'resume' | 'comprehensive'
  }
  ```

## 🔧 使用方式

### 开发者集成

1. **导入组件**:
```typescript
import { EnhancedFileDropzone } from '@/components/ui/enhanced-file-dropzone';
import { PrivacyToggle } from '@/components/ui/privacy-toggle';
```

2. **使用文件上传**:
```typescript
<EnhancedFileDropzone
  onFilesProcessed={(results) => {
    console.log('处理完成:', results);
  }}
  onError={(error) => {
    console.error('处理失败:', error);
  }}
  showPrivacyToggle={true}
  defaultPrivacyMode={false}
  sessionId={sessionId}
/>
```

3. **调用后端服务**:
```typescript
import { unifiedDocumentService } from '@/lib/services/unified-document-service';

const result = await unifiedDocumentService.processDocument(file, {
  isPrivacyMode: true,
  userId: 'user123',
  extractMode: 'comprehensive'
});
```

### 用户操作

1. **切换模式**: 点击页面右上角的隐私模式开关
2. **上传文件**: 拖拽文件到上传区域或点击选择
3. **查看结果**: 处理完成后自动显示解析结果
4. **模式提示**: 界面会显示当前模式的说明

## 📊 性能优化

### 内存管理
- **缓存策略**: 隐私模式使用 Map 数据结构缓存
- **自动清理**: 每5分钟清理过期文档
- **过期时间**: 文档在内存中保存1小时

### 并发处理
- **批量限制**: 最多同时处理3个文件
- **错误隔离**: 单个文件失败不影响其他文件
- **进度追踪**: 实时显示每个文件的处理进度

## 🔐 安全考虑

### 隐私保护
- ✅ 隐私模式下文件不写入磁盘
- ✅ 处理结果不持久化存储
- ✅ 会话结束自动清理内存
- ✅ 用户明确知晓当前模式

### 数据安全
- ✅ 标准模式文件加密存储
- ✅ 用户权限验证
- ✅ 文件类型验证
- ✅ 文件大小限制 (50MB)

## 🚨 注意事项

### 隐私模式限制
- ⚠️ 文件处理结果仅在当前会话有效
- ⚠️ 页面刷新或关闭后数据丢失
- ⚠️ 不支持历史记录查看
- ⚠️ 服务器重启会清空所有缓存

### 推荐使用场景
- **隐私模式**: 处理包含敏感信息的文档
- **标准模式**: 需要保存和分享的文档

## 🔄 更新日志

### v1.0.0 (当前版本)
- ✅ 统一文档处理系统
- ✅ 隐私模式支持
- ✅ 增强文件上传组件
- ✅ 批量处理功能
- ✅ 自动清理机制

---

> 💡 **提示**: 如有问题或建议，请联系开发团队。 