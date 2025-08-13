/**
 * Anthropic标准格式的工具定义
 * 基于官方最佳实践优化的完整工具集
 */

/**
 * 🔧 文件操作工具 - 符合Anthropic JSON Schema标准
 */
export const ANTHROPIC_STANDARD_TOOLS = [
  {
    name: "read_file",
    description: "读取项目文件内容进行分析。支持读取完整文件或指定行号范围。用于理解现有代码结构、分析文件内容或检查特定代码段。适用于所有文本文件类型，包括源代码、配置文件、文档等。",
    input_schema: {
      type: "object",
      properties: {
        file_path: {
          type: "string",
          description: "要读取的文件路径，支持相对路径（如 'app/page.tsx'）和绝对路径。必须是项目内的有效文件路径。"
        },
        start_line: {
          type: "integer",
          minimum: 1,
          description: "起始行号（可选），从1开始计数。用于读取文件的特定部分时指定开始位置。"
        },
        end_line: {
          type: "integer",
          minimum: 1,
          description: "结束行号（可选），必须大于等于start_line。用于读取文件的特定行范围。"
        }
      },
      required: ["file_path"],
      additionalProperties: false
    }
  },

  {
    name: "write_file",
    description: "创建新文件或完全重写现有文件。用于生成全新的代码文件、配置文件或文档。当需要创建完整的组件、页面或配置时使用。会覆盖目标文件的所有内容，因此请谨慎使用于现有文件。",
    input_schema: {
      type: "object",
      properties: {
        file_path: {
          type: "string",
          description: "要写入的文件路径，支持相对路径和绝对路径。如果文件不存在将创建新文件，如果存在将完全覆盖。路径中的目录如果不存在将自动创建。"
        },
        content: {
          type: "string",
          description: "要写入的完整文件内容。应包含有效的代码或文本内容。对于代码文件，确保包含必要的导入语句、类型定义和正确的语法结构。"
        }
      },
      required: ["file_path", "content"],
      additionalProperties: false
    }
  },

  {
    name: "edit_file",
    description: "对现有文件进行精确的部分修改。用于修改特定的代码行、函数、组件或配置项，而不影响文件的其他部分。这是最常用的代码修改工具，遵循最小变更原则。支持多行内容的精确替换。",
    input_schema: {
      type: "object",
      properties: {
        file_path: {
          type: "string",
          description: "要编辑的文件路径。文件必须已存在，否则操作将失败。支持相对路径和绝对路径。"
        },
        old_content: {
          type: "string",
          description: "需要被替换的原始内容。必须与文件中的内容完全匹配，包括空格、缩进和换行符。建议包含足够的上下文以确保唯一匹配。"
        },
        new_content: {
          type: "string",
          description: "用于替换的新内容。应保持与原内容相同的代码风格和缩进格式。确保新内容在语法和逻辑上正确。"
        },
        line_number: {
          type: "integer",
          minimum: 1,
          description: "目标内容所在的大致行号（可选）。用于辅助定位，提高替换的准确性。如果指定，将优先在该行附近搜索匹配内容。"
        }
      },
      required: ["file_path", "old_content", "new_content"],
      additionalProperties: false
    }
  },

  {
    name: "append_to_file",
    description: "在现有文件末尾添加新内容。用于向文件添加新的函数、组件、样式规则、配置项或文档内容，而不修改现有内容。自动在原内容和新内容之间添加适当的分隔符。",
    input_schema: {
      type: "object",
      properties: {
        file_path: {
          type: "string",
          description: "要追加内容的文件路径。文件必须已存在。支持相对路径和绝对路径。"
        },
        content: {
          type: "string",
          description: "要追加的内容。将自动在原文件内容和新内容之间添加换行符。确保内容格式正确，包含必要的缩进和语法结构。"
        }
      },
      required: ["file_path", "content"],
      additionalProperties: false
    }
  },

  {
    name: "delete_file",
    description: "安全删除不再需要的文件。用于清理过时的组件、临时文件、废弃的配置或测试文件。操作是可逆的（通过版本控制），但请确认文件确实不再被项目使用。",
    input_schema: {
      type: "object",
      properties: {
        file_path: {
          type: "string",
          description: "要删除的文件路径。文件必须存在且在项目范围内。支持相对路径和绝对路径。"
        }
      },
      required: ["file_path"],
      additionalProperties: false
    }
  },

  {
    name: "search_code",
    description: "在项目代码库中搜索特定的代码内容、函数名、变量名或文本模式。用于查找特定功能的实现位置、检查代码使用情况或定位需要修改的代码片段。支持大小写不敏感的搜索。",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          minLength: 1,
          description: "要搜索的内容。可以是函数名、变量名、类名、特定的代码片段或任何文本内容。搜索是大小写不敏感的。"
        },
        file_pattern: {
          type: "string",
          description: "文件名过滤模式（可选）。用于限制搜索范围到特定类型的文件。例如：'components'（搜索包含components的路径）、'.tsx'（搜索TypeScript React文件）、'utils'（搜索工具文件）。"
        }
      },
      required: ["query"],
      additionalProperties: false
    }
  },

  {
    name: "get_file_structure",
    description: "获取项目的文件和目录结构树状视图。用于了解项目组织结构、查找文件位置或规划新文件的放置位置。显示文件夹层次关系和文件分布情况。",
    input_schema: {
      type: "object",
      properties: {
        directory: {
          type: "string",
          description: "要获取结构的目录路径（可选）。如果不指定，将显示整个项目的结构。可以指定子目录以获取特定部分的结构，例如：'components'、'app'、'lib'等。"
        }
      },
      required: [],
      additionalProperties: false
    }
  },

  {
    name: "run_command",
    description: "执行项目构建、测试或开发相关的shell命令。用于安装依赖、运行构建脚本、执行测试或启动开发服务器。支持常见的npm、yarn、git等命令。出于安全考虑，某些系统级命令可能被限制。",
    input_schema: {
      type: "object",
      properties: {
        command: {
          type: "string",
          minLength: 1,
          description: "要执行的shell命令。支持npm/yarn命令（如'npm install'、'npm run build'）、git命令（如'git status'、'git add .'）和其他开发相关命令。避免使用危险的系统命令。"
        },
        directory: {
          type: "string",
          description: "命令执行的工作目录（可选）。如果不指定，将在项目根目录执行。可以指定子目录来在特定位置执行命令。"
        }
      },
      required: ["command"],
      additionalProperties: false
    }
  },

  {
    name: "list_files",
    description: "列出项目中所有文件的简洁清单，包括文件类型信息。用于快速了解项目包含的文件，特别是在开始工作前获取项目概览。显示文件名和检测到的编程语言类型。",
    input_schema: {
      type: "object",
      properties: {},
      required: [],
      additionalProperties: false
    }
  }
];

/**
 * 🎯 工具使用最佳实践配置
 */
export const TOOL_USAGE_CONFIG = {
  // 工具调用的推荐顺序
  recommended_sequence: [
    "get_file_structure",  // 1. 了解项目结构
    "list_files",          // 2. 查看文件清单
    "read_file",           // 3. 读取相关文件
    "search_code",         // 4. 搜索特定内容
    "edit_file",           // 5. 进行修改
    "run_command"          // 6. 测试验证
  ],
  
  // 安全限制
  security_rules: [
    "只允许操作项目目录内的文件",
    "禁止执行系统级危险命令",
    "文件路径必须经过验证",
    "大文件操作需要确认"
  ],
  
  // 性能优化
  performance_tips: [
    "使用line_number参数提高edit_file精确度",
    "使用file_pattern参数缩小search_code范围",
    "优先使用edit_file而不是write_file进行修改",
    "批量操作时按逻辑顺序执行工具调用"
  ]
};

/**
 * 🔧 工具验证函数
 */
export function validateToolInput(toolName: string, input: Record<string, any>): {
  valid: boolean;
  errors: string[];
} {
  const tool = ANTHROPIC_STANDARD_TOOLS.find(t => t.name === toolName);
  if (!tool) {
    return { valid: false, errors: [`Unknown tool: ${toolName}`] };
  }

  const errors: string[] = [];
  const schema = tool.input_schema;
  
  // 检查必需参数
  for (const required of schema.required || []) {
    if (!(required in input)) {
      errors.push(`Missing required parameter: ${required}`);
    }
  }
  
  // 检查参数类型
  for (const [key, value] of Object.entries(input)) {
    const properties = schema.properties as Record<string, any> || {};
    const property = properties[key];
    
    if (!property) {
      if (!schema.additionalProperties) {
        errors.push(`Unknown parameter: ${key}`);
      }
      continue;
    }
    
    // 基础类型检查
    if (property.type === 'string' && typeof value !== 'string') {
      errors.push(`Parameter ${key} must be a string`);
    } else if (property.type === 'integer' && (!Number.isInteger(value as number) || (value as number) < (property.minimum || -Infinity))) {
      errors.push(`Parameter ${key} must be a valid integer${property.minimum ? ` >= ${property.minimum}` : ''}`);
    }
    
    // 字符串长度检查
    if (property.type === 'string' && property.minLength && typeof value === 'string' && value.length < property.minLength) {
      errors.push(`Parameter ${key} must be at least ${property.minLength} characters long`);
    }
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * 🎨 工具描述生成器 - 用于动态文档
 */
export function generateToolDocumentation(): string {
  let doc = "# Anthropic标准工具文档\n\n";
  
  for (const tool of ANTHROPIC_STANDARD_TOOLS) {
    doc += `## ${tool.name}\n\n`;
    doc += `**描述**: ${tool.description}\n\n`;
    doc += `**参数**:\n`;
    
    const properties = tool.input_schema.properties as Record<string, any> || {};
    for (const [paramName, paramDef] of Object.entries(properties)) {
      const requiredParams = tool.input_schema.required as string[] || [];
      const isRequired = requiredParams.includes(paramName) ? " **(必需)**" : " (可选)";
      doc += `- \`${paramName}\`${isRequired}: ${paramDef.description}\n`;
    }
    
    doc += "\n---\n\n";
  }
  
  return doc;
}

/**
 * 📊 导出工具统计信息
 */
export const TOOL_STATISTICS = {
  total_tools: ANTHROPIC_STANDARD_TOOLS.length,
  categories: {
    file_operations: ["read_file", "write_file", "edit_file", "append_to_file", "delete_file"],
    analysis_tools: ["search_code", "get_file_structure", "list_files"],
    execution_tools: ["run_command"]
  },
  complexity_levels: {
    simple: ["read_file", "list_files", "delete_file"],
    medium: ["write_file", "append_to_file", "search_code", "get_file_structure"],
    complex: ["edit_file", "run_command"]
  }
};
