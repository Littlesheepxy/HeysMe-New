import { ChatRequestOptions } from 'ai';

export interface VisualEditRequest {
  elementInfo: {
    selector: string;
    tagName: string;
    className: string;
    textContent: string;
    styles: Record<string, string>;
  };
  prompt: string;
  files: Array<{
    filename: string;
    content: string;
    type: string;
  }>;
  projectContext?: {
    framework: string;
    componentName?: string;
    projectName: string;
  };
}

export interface VisualEditResponse {
  success: boolean;
  modifiedFiles: Array<{
    filename: string;
    content: string;
    changes: string[];
  }>;
  explanation: string;
  error?: string;
}

export class VisualEditService {
  private apiEndpoint: string;

  constructor(apiEndpoint: string = '/api/ai/visual-edit') {
    this.apiEndpoint = apiEndpoint;
  }

  /**
   * 处理可视化编辑请求
   */
  async processVisualEdit(request: VisualEditRequest): Promise<VisualEditResponse> {
    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('可视化编辑请求处理失败:', error);
      return {
        success: false,
        modifiedFiles: [],
        explanation: '处理失败',
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  /**
   * 构建可视化编辑的提示词
   */
  buildVisualEditPrompt(request: VisualEditRequest): string {
    const { elementInfo, prompt, projectContext } = request;
    
    return `
# 可视化编辑请求

## 用户需求
${prompt}

## 目标元素信息
- **元素类型**: ${elementInfo.tagName}
- **选择器**: ${elementInfo.selector}
- **CSS 类名**: ${elementInfo.className || '无'}
- **当前文本内容**: ${elementInfo.textContent || '无文本内容'}
- **当前样式**: ${JSON.stringify(elementInfo.styles, null, 2)}

## 项目上下文
- **框架**: ${projectContext?.framework || 'React'}
- **组件名**: ${projectContext?.componentName || '未知'}
- **项目名**: ${projectContext?.projectName || '未知'}

## 请求说明
请根据用户需求修改目标元素。你需要：

1. **分析当前元素**：理解元素的结构、样式和功能
2. **理解用户意图**：准确把握用户想要的修改
3. **生成修改方案**：提供具体的代码修改建议
4. **确保兼容性**：保证修改不会破坏现有功能

## 输出要求
- 提供修改后的完整组件代码
- 说明具体的修改内容
- 如果需要新增 CSS 类或样式，请一并提供
- 确保代码符合 React + TypeScript + Tailwind CSS 的最佳实践

请开始处理这个可视化编辑请求。
    `.trim();
  }

  /**
   * 解析元素选择器，尝试定位到具体的组件文件
   */
  findTargetComponent(
    elementInfo: VisualEditRequest['elementInfo'], 
    files: VisualEditRequest['files']
  ): { filename: string; content: string } | null {
    // 简单的启发式方法来找到目标组件
    // 1. 查找包含相同文本内容的文件
    // 2. 查找包含相同 CSS 类名的文件
    // 3. 查找主要的组件文件

    const { textContent, className } = elementInfo;

    // 优先查找包含相同文本内容的文件
    if (textContent) {
      const matchingFile = files.find(file => 
        file.content.includes(textContent) && 
        (file.filename.endsWith('.tsx') || file.filename.endsWith('.jsx'))
      );
      if (matchingFile) return matchingFile;
    }

    // 查找包含相同 CSS 类名的文件
    if (className) {
      const classNames = className.split(' ');
      const matchingFile = files.find(file => 
        classNames.some(cls => file.content.includes(cls)) &&
        (file.filename.endsWith('.tsx') || file.filename.endsWith('.jsx'))
      );
      if (matchingFile) return matchingFile;
    }

    // 查找主要组件文件（App.tsx, index.tsx, main.tsx 等）
    const mainFiles = ['App.tsx', 'App.jsx', 'index.tsx', 'index.jsx', 'main.tsx', 'main.jsx'];
    for (const mainFile of mainFiles) {
      const file = files.find(f => f.filename.endsWith(mainFile));
      if (file) return file;
    }

    // 如果都没找到，返回第一个 React 组件文件
    const firstReactFile = files.find(file => 
      file.filename.endsWith('.tsx') || file.filename.endsWith('.jsx')
    );
    
    return firstReactFile || null;
  }

  /**
   * 验证修改后的代码
   */
  validateModifiedCode(code: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 基本的语法检查
    try {
      // 检查是否有基本的 React 结构
      if (!code.includes('export') && !code.includes('function') && !code.includes('const')) {
        errors.push('代码缺少基本的组件结构');
      }

      // 检查是否有未闭合的标签
      const openTags = code.match(/<[^/>]+>/g) || [];
      const closeTags = code.match(/<\/[^>]+>/g) || [];
      const selfClosingTags = code.match(/<[^>]+\/>/g) || [];
      
      if (openTags.length !== closeTags.length + selfClosingTags.length) {
        errors.push('可能存在未闭合的 HTML 标签');
      }

      // 检查是否有基本的 import 语句（如果需要）
      if (code.includes('useState') && !code.includes('import')) {
        errors.push('使用了 React hooks 但缺少 import 语句');
      }

    } catch (error) {
      errors.push(`代码验证失败: ${error}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// 默认实例
export const visualEditService = new VisualEditService(); 