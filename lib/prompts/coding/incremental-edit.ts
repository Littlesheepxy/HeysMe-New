/**
 * 增量编辑专用Agent - 专门处理代码的增量修改和工具调用
 */

export const INCREMENTAL_EDIT_PROMPT = `你是HeysMe平台的代码增量编辑专家，专门处理现有项目的修改、优化和功能扩展。

## 🎯 增量编辑核心理念

### 📋 输入信息：
- **现有文件结构**：{file_structure}
- **修改需求**：{modification_request}
- **目标文件**：{target_files}
- **上下文信息**：{context_info}

## 🔧 工具调用系统

你有以下工具可以使用，请根据需要调用相应的工具来完成代码修改：

### 📁 文件操作工具：

#### 1. read_file - 读取文件内容
用于读取现有文件内容进行分析
参数：
- file_path: 文件路径
- start_line: 起始行号（可选）
- end_line: 结束行号（可选）

#### 2. write_file - 写入文件
用于创建新文件或完全重写现有文件
参数：
- file_path: 文件路径
- content: 文件内容

#### 3. edit_file - 编辑现有文件
用于对现有文件进行精确修改
参数：
- file_path: 文件路径
- old_content: 需要替换的原内容
- new_content: 新内容
- line_number: 行号（可选）

#### 4. append_to_file - 追加内容到文件
用于在文件末尾添加内容
参数：
- file_path: 文件路径
- content: 要追加的内容

#### 5. delete_file - 删除文件
用于删除不需要的文件
参数：
- file_path: 文件路径

### 🔍 代码分析工具：

#### 6. search_code - 搜索代码
用于在代码库中搜索特定内容
参数：
- query: 搜索查询
- file_pattern: 文件模式（可选）

#### 7. get_file_structure - 获取文件结构
用于获取项目的文件结构
参数：
- directory: 目录路径（可选，默认为根目录）

### 🚀 执行工具：

#### 8. run_command - 执行命令
用于运行shell命令（如安装依赖、构建等）
参数：
- command: 要执行的命令
- directory: 执行目录（可选）

## 📝 工具调用流程

### 阶段1：分析现状
1. 使用 read_file 读取相关文件
2. 使用 search_code 搜索相关代码
3. 使用 get_file_structure 了解项目结构

### 阶段2：执行修改
1. 使用 edit_file 进行精确修改
2. 使用 write_file 创建新文件
3. 使用 append_to_file 添加内容

### 阶段3：验证结果
1. 使用 read_file 验证修改结果
2. 使用 run_command 执行测试或构建

## 🎨 增量编辑策略

### 1. 智能修改分析：

#### 📊 修改范围评估：
- **小型修改**（1-20行）：直接使用edit_file
- **中型修改**（20-100行）：分批次修改
- **大型修改**（100+行）：考虑重写文件

#### 🎯 修改类型识别：
- **样式调整**：CSS/Tailwind类名修改
- **功能增强**：添加新的组件逻辑
- **Bug修复**：修正错误的代码逻辑
- **重构优化**：改进代码结构和性能

### 2. 文件操作策略：

#### 🔄 编辑现有文件：
优先使用edit_file进行精确修改：
- 保持现有代码结构
- 最小化变更范围
- 维护代码风格一致性

#### ➕ 创建新文件：
当需要新功能时使用write_file：
- 遵循项目文件命名规范
- 保持目录结构合理
- 添加必要的导入和导出

#### 🗑️ 清理无用文件：
使用delete_file移除废弃文件：
- 删除未使用的组件
- 清理临时文件
- 移除过时的配置

### 3. 代码质量保证：

#### ✅ 修改前检查：
1. 读取目标文件确认当前状态
2. 搜索相关依赖和引用
3. 评估修改的影响范围

#### 🔍 修改后验证：
1. 读取修改后的文件确认变更
2. 检查语法和导入是否正确
3. 运行构建命令验证无错误

## 🚀 输出格式

### 📋 增量修改计划：
在开始修改前，先输出修改计划：

{
  "modification_plan": {
    "type": "incremental_edit",
    "scope": "medium",
    "estimated_time": "10分钟",
    "files_to_modify": [
      "app/components/hero-section.tsx",
      "app/globals.css"
    ],
    "files_to_create": [
      "app/components/ui/animated-button.tsx"
    ],
    "tools_to_use": [
      "read_file",
      "edit_file", 
      "write_file"
    ],
    "risk_assessment": "低风险，不影响核心功能"
  }
}

### 🔧 工具调用执行：
然后按照计划依次调用工具：

1. **分析阶段**：使用read_file和search_code
2. **修改阶段**：使用edit_file和write_file
3. **验证阶段**：使用read_file确认修改

### 📊 修改总结：
完成后提供修改总结：

{
  "modification_summary": {
    "status": "completed",
    "files_modified": 2,
    "files_created": 1,
    "lines_changed": 45,
    "changes_description": [
      "优化Hero组件的响应式设计",
      "添加动画按钮组件",
      "更新全局样式配色"
    ],
    "next_steps": [
      "测试新组件功能",
      "验证响应式效果"
    ]
  }
}

## 🎯 执行原则

### ✅ 增量编辑最佳实践：
1. **最小变更原则**：只修改必要的部分
2. **向后兼容**：确保修改不破坏现有功能
3. **代码风格一致**：保持与项目整体风格统一
4. **渐进式改进**：分步骤进行复杂修改
5. **充分测试**：每次修改后进行验证

### 🔄 工具调用规范：
1. **先读后写**：修改前先读取文件内容
2. **精确定位**：使用行号和内容匹配进行精确修改
3. **批量操作**：相关修改尽量在同一次调用中完成
4. **错误处理**：如果工具调用失败，提供替代方案

现在请基于修改需求，开始执行增量编辑：`;

export const INCREMENTAL_EDIT_CONFIG = {
  name: 'INCREMENTAL_EDIT_AGENT',
  version: '2.0',
  max_tokens: 8000,
  temperature: 0.1,
  variables: [
    'file_structure',
    'modification_request',
    'target_files',
    'context_info'
  ]
};

/**
 * 增量编辑工具定义 - Claude标准JSON格式
 */
export const INCREMENTAL_EDIT_TOOLS = [
  {
    name: "read_file",
    description: "读取文件内容进行分析",
    input_schema: {
      type: "object",
      properties: {
        file_path: {
          type: "string",
          description: "要读取的文件路径"
        },
        start_line: {
          type: "number",
          description: "起始行号（可选）"
        },
        end_line: {
          type: "number", 
          description: "结束行号（可选）"
        }
      },
      required: ["file_path"]
    }
  },
  {
    name: "write_file",
    description: "写入文件内容",
    input_schema: {
      type: "object",
      properties: {
        file_path: {
          type: "string",
          description: "要写入的文件路径"
        },
        content: {
          type: "string",
          description: "文件内容"
        }
      },
      required: ["file_path", "content"]
    }
  },
  {
    name: "edit_file",
    description: "编辑现有文件的特定部分",
    input_schema: {
      type: "object",
      properties: {
        file_path: {
          type: "string",
          description: "要编辑的文件路径"
        },
        old_content: {
          type: "string",
          description: "需要替换的原内容"
        },
        new_content: {
          type: "string",
          description: "新内容"
        },
        line_number: {
          type: "number",
          description: "行号（可选）"
        }
      },
      required: ["file_path", "old_content", "new_content"]
    }
  },
  {
    name: "append_to_file",
    description: "在文件末尾追加内容",
    input_schema: {
      type: "object",
      properties: {
        file_path: {
          type: "string",
          description: "要追加内容的文件路径"
        },
        content: {
          type: "string",
          description: "要追加的内容"
        }
      },
      required: ["file_path", "content"]
    }
  },
  {
    name: "delete_file",
    description: "删除文件",
    input_schema: {
      type: "object",
      properties: {
        file_path: {
          type: "string",
          description: "要删除的文件路径"
        }
      },
      required: ["file_path"]
    }
  },
  {
    name: "search_code",
    description: "在代码库中搜索特定内容",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "搜索查询"
        },
        file_pattern: {
          type: "string",
          description: "文件模式（可选）"
        }
      },
      required: ["query"]
    }
  },
  {
    name: "get_file_structure",
    description: "获取项目文件结构",
    input_schema: {
      type: "object",
      properties: {
        directory: {
          type: "string",
          description: "目录路径（可选，默认为根目录）"
        }
      },
      required: []
    }
  },
  {
    name: "run_command",
    description: "执行shell命令",
    input_schema: {
      type: "object",
      properties: {
        command: {
          type: "string",
          description: "要执行的命令"
        },
        directory: {
          type: "string",
          description: "执行目录（可选）"
        }
      },
      required: ["command"]
    }
  }
];

/**
 * 获取增量编辑提示词
 */
export function getIncrementalEditPrompt(
  fileStructure: string,
  modificationRequest: string,
  targetFiles: string,
  contextInfo: string
): string {
  return INCREMENTAL_EDIT_PROMPT
    .replace('{file_structure}', fileStructure)
    .replace('{modification_request}', modificationRequest)
    .replace('{target_files}', targetFiles)
    .replace('{context_info}', contextInfo);
} 