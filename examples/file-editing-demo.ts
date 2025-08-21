/**
 * 文件编辑功能演示
 * 展示如何使用各种编辑工具进行精确的代码修改
 */

// 模拟的工具调用示例

export const fileEditingExamples = {
  
  // 示例1：修改组件中的特定函数
  modifyButtonComponent: {
    description: "修改按钮组件的点击处理函数，添加动画效果",
    steps: [
      {
        tool: "read_file",
        params: {
          file_path: "app/components/ui/Button.tsx"
        },
        purpose: "读取当前按钮组件内容"
      },
      {
        tool: "edit_file",
        params: {
          file_path: "app/components/ui/Button.tsx",
          old_content: `const handleClick = () => {
    onClick?.();
  }`,
          new_content: `const handleClick = () => {
    setIsAnimating(true);
    onClick?.();
    setTimeout(() => setIsAnimating(false), 300);
  }`,
          operation: "replace",
          description: "添加点击动画效果"
        },
        purpose: "替换点击处理函数"
      },
      {
        tool: "edit_file",
        params: {
          file_path: "app/components/ui/Button.tsx",
          old_content: "const [isLoading, setIsLoading] = useState(false);",
          new_content: `const [isLoading, setIsLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);`,
          operation: "replace",
          description: "添加动画状态"
        },
        purpose: "添加动画状态管理"
      }
    ]
  },

  // 示例2：添加新的工具函数
  addUtilityFunction: {
    description: "在工具文件中添加新的格式化函数",
    steps: [
      {
        tool: "read_file",
        params: {
          file_path: "app/utils/formatters.ts"
        },
        purpose: "检查现有的格式化函数"
      },
      {
        tool: "edit_file",
        params: {
          file_path: "app/utils/formatters.ts",
          new_content: `
/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns 格式化后的文件大小字符串
 */
export function formatFileSize(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * 格式化相对时间
 * @param date 日期对象或时间戳
 * @returns 相对时间字符串（如：2小时前）
 */
export function formatRelativeTime(date: Date | number): string {
  const now = new Date();
  const targetDate = typeof date === 'number' ? new Date(date) : date;
  const diffMs = now.getTime() - targetDate.getTime();
  
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) return \`\${diffDays}天前\`;
  if (diffHours > 0) return \`\${diffHours}小时前\`;
  if (diffMinutes > 0) return \`\${diffMinutes}分钟前\`;
  return '刚刚';
}`,
          operation: "append",
          description: "添加文件大小和相对时间格式化函数"
        },
        purpose: "扩展工具函数库"
      }
    ]
  },

  // 示例3：修改样式和主题
  updateThemeColors: {
    description: "更新主题配色方案",
    steps: [
      {
        tool: "read_file",
        params: {
          file_path: "app/globals.css",
          start_line: 1,
          end_line: 50
        },
        purpose: "读取当前CSS变量定义"
      },
      {
        tool: "edit_file",
        params: {
          file_path: "app/globals.css",
          old_content: `  --primary: 222.2 84% 4.9%;
  --primary-foreground: 210 40% 98%;`,
          new_content: `  --primary: 142 76% 36%;
  --primary-foreground: 355 100% 97%;`,
          operation: "replace",
          description: "更新主色调为绿色系"
        },
        purpose: "修改主要颜色变量"
      },
      {
        tool: "edit_file",
        params: {
          file_path: "app/globals.css",
          old_content: `  --accent: 210 40% 96%;
  --accent-foreground: 222.2 84% 4.9%;`,
          new_content: `  --accent: 142 76% 96%;
  --accent-foreground: 142 84% 4.9%;`,
          operation: "replace",
          description: "更新强调色为匹配的绿色"
        },
        purpose: "修改强调色变量"
      }
    ]
  },

  // 示例4：重构组件结构
  refactorComponent: {
    description: "将大组件拆分为更小的子组件",
    steps: [
      {
        tool: "read_file",
        params: {
          file_path: "app/components/Dashboard.tsx"
        },
        purpose: "分析当前组件结构"
      },
      {
        tool: "create_file",
        params: {
          file_path: "app/components/dashboard/StatsCard.tsx",
          content: `'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function StatsCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend 
}: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">
            {description}
          </p>
        )}
        {trend && (
          <div className={\`text-xs \${trend.isPositive ? 'text-green-600' : 'text-red-600'}\`}>
            {trend.isPositive ? '+' : ''}{trend.value}%
          </div>
        )}
      </CardContent>
    </Card>
  );
}`,
          description: "创建统计卡片子组件"
        },
        purpose: "提取可复用的统计卡片组件"
      },
      {
        tool: "edit_file",
        params: {
          file_path: "app/components/Dashboard.tsx",
          old_content: `import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';`,
          new_content: `import { StatsCard } from './dashboard/StatsCard';`,
          operation: "replace",
          description: "更新导入语句"
        },
        purpose: "导入新的子组件"
      },
      {
        tool: "edit_file",
        params: {
          file_path: "app/components/Dashboard.tsx",
          old_content: `        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              总用户数
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,350</div>
            <p className="text-xs text-muted-foreground">
              +20.1% 较上月
            </p>
          </CardContent>
        </Card>`,
          new_content: `        <StatsCard
          title="总用户数"
          value="2,350"
          description="+20.1% 较上月"
          icon={Users}
          trend={{ value: 20.1, isPositive: true }}
        />`,
          operation: "replace",
          description: "使用新的StatsCard组件"
        },
        purpose: "替换原有的卡片实现"
      }
    ]
  },

  // 示例5：添加TypeScript类型定义
  addTypeDefinitions: {
    description: "为现有JavaScript代码添加TypeScript类型",
    steps: [
      {
        tool: "create_file",
        params: {
          file_path: "types/api.ts",
          content: `// API响应类型定义

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'user' | 'moderator';
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  collaborators: string[];
  status: 'active' | 'archived' | 'deleted';
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  template?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  status?: Project['status'];
}`,
          description: "创建API类型定义文件"
        },
        purpose: "建立类型系统基础"
      },
      {
        tool: "edit_file",
        params: {
          file_path: "app/api/projects/route.ts",
          old_content: `export async function GET(request) {`,
          new_content: `import { NextRequest } from 'next/server';
import { ApiResponse, Project } from '@/types/api';

export async function GET(request: NextRequest): Promise<Response> {`,
          operation: "replace",
          description: "添加类型导入和函数签名"
        },
        purpose: "为API路由添加类型安全"
      }
    ]
  }
};

// 工具调用执行器示例
export class FileEditingExecutor {
  
  /**
   * 执行文件编辑示例
   * @param exampleName 示例名称
   */
  async executeExample(exampleName: keyof typeof fileEditingExamples) {
    const example = fileEditingExamples[exampleName];
    console.log(`🚀 开始执行示例: ${example.description}`);
    
    for (let i = 0; i < example.steps.length; i++) {
      const step = example.steps[i];
      console.log(`📝 步骤 ${i + 1}: ${step.purpose}`);
      console.log(`🔧 工具: ${step.tool}`);
      console.log(`📋 参数:`, step.params);
      
      // 这里会调用实际的工具执行逻辑
      // const result = await this.executeTool(step.tool, step.params);
      // console.log('✅ 执行结果:', result);
    }
    
    console.log(`✅ 示例执行完成: ${example.description}`);
  }
  
  /**
   * 批量执行多个编辑操作
   */
  async executeBatchEdit(operations: Array<{
    tool: string;
    params: Record<string, any>;
    description: string;
  }>) {
    console.log(`🔄 开始批量编辑，共 ${operations.length} 个操作`);
    
    for (const operation of operations) {
      console.log(`🔧 执行: ${operation.description}`);
      // const result = await this.executeTool(operation.tool, operation.params);
    }
    
    console.log('✅ 批量编辑完成');
  }
}

// 使用示例
export const demoUsage = {
  // 简单的颜色修改
  simpleColorChange: async () => {
    const executor = new FileEditingExecutor();
    await executor.executeBatchEdit([
      {
        tool: "read_file",
        params: { file_path: "app/components/Button.tsx" },
        description: "读取按钮组件"
      },
      {
        tool: "edit_file",
        params: {
          file_path: "app/components/Button.tsx",
          old_content: "bg-blue-500 hover:bg-blue-600",
          new_content: "bg-green-500 hover:bg-green-600",
          operation: "replace"
        },
        description: "将按钮颜色从蓝色改为绿色"
      }
    ]);
  },
  
  // 复杂的组件重构
  complexRefactoring: async () => {
    const executor = new FileEditingExecutor();
    await executor.executeExample('refactorComponent');
  }
};
