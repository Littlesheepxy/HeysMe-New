/**
 * 编程 Agent V3 - 最终版本
 * 基于 Vercel AI SDK 的智能代码生成和文件操作
 */

import { BaseAgentV2, AgentCapabilities, StreamableAgentResponse, SessionData, ToolDefinition } from './base-agent';
import { z } from 'zod';
import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { INCREMENTAL_EDIT_PROMPT } from '@/lib/prompts/coding/incremental-edit';
import { CODING_EXPERT_MODE_PROMPT, getCodingPrompt } from '@/lib/prompts/coding';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// 代码文件接口
interface CodeFile {
  path: string;
  content: string;
  language: string;
  size: number;
  lastModified: Date;
}

// 项目结构接口
interface ProjectStructure {
  files: CodeFile[];
  directories: string[];
  packageJson?: any;
  dependencies?: string[];
  framework?: string;
}

// 编程任务结果接口
interface CodingResult {
  success: boolean;
  filesCreated: string[];
  filesModified: string[];
  filesDeleted: string[];
  commandsExecuted: string[];
  summary: string;
  errors?: string[];
}

export class CodingAgentV3 extends BaseAgentV2 {
  private currentMode: 'initial' | 'incremental' | 'analysis' = 'initial';
  private projectStructure: ProjectStructure | null = null;
  private workingDirectory: string = process.cwd();

  constructor() {
    const capabilities: AgentCapabilities = {
      canStream: true,
      canUseTools: true,
      canAnalyzeCode: true,
      canGenerateCode: true,
      canAccessFiles: true,
      canAccessInternet: false,
      canRememberContext: true,
      maxContextLength: 200000,
      supportedLanguages: ['zh', 'en'],
      specializedFor: ['code_generation', 'file_operations', 'project_development', 'incremental_editing']
    };

    super('智能编程专家V3', 'coding-v3', capabilities);
  }

  /**
   * 定义编程工具集
   */
  getTools(): Record<string, ToolDefinition> {
    return {
      read_file: {
        name: 'read_file',
        description: '读取项目文件内容进行分析',
        inputSchema: z.object({
          file_path: z.string().describe('要读取的文件路径'),
          start_line: z.number().optional().describe('起始行号（可选）'),
          end_line: z.number().optional().describe('结束行号（可选）')
        }),
        execute: async ({ file_path, start_line, end_line }) => {
          console.log(`🔧 [读取文件] ${file_path}`);
          try {
            const fullPath = path.resolve(this.workingDirectory, file_path);
            const content = await fs.readFile(fullPath, 'utf-8');
            
            if (start_line && end_line) {
              const lines = content.split('\n');
              const selectedLines = lines.slice(start_line - 1, end_line);
              return {
                success: true,
                content: selectedLines.join('\n'),
                totalLines: lines.length,
                selectedRange: `${start_line}-${end_line}`
              };
            }
            
            return {
              success: true,
              content,
              size: content.length,
              lines: content.split('\n').length
            };
          } catch (error) {
            console.log(`⚠️ [读取文件] 失败: ${error}`);
            return {
              success: false,
              error: `无法读取文件: ${error instanceof Error ? error.message : '未知错误'}`
            };
          }
        }
      },

      write_file: {
        name: 'write_file',
        description: '创建新文件或完全重写现有文件',
        inputSchema: z.object({
          file_path: z.string().describe('要写入的文件路径'),
          content: z.string().describe('要写入的完整文件内容')
        }),
        execute: async ({ file_path, content }) => {
          console.log(`🔧 [写入文件] ${file_path}`);
          try {
            const fullPath = path.resolve(this.workingDirectory, file_path);
            const dir = path.dirname(fullPath);
            
            // 确保目录存在
            await fs.mkdir(dir, { recursive: true });
            
            // 写入文件
            await fs.writeFile(fullPath, content, 'utf-8');
            
            return {
              success: true,
              file_path,
              size: content.length,
              lines: content.split('\n').length,
              message: `成功写入文件 ${file_path}`
            };
          } catch (error) {
            console.log(`⚠️ [写入文件] 失败: ${error}`);
            return {
              success: false,
              error: `无法写入文件: ${error instanceof Error ? error.message : '未知错误'}`
            };
          }
        }
      },

      edit_file: {
        name: 'edit_file',
        description: '对现有文件进行精确的部分修改',
        inputSchema: z.object({
          file_path: z.string().describe('要编辑的文件路径'),
          old_content: z.string().describe('需要替换的原内容'),
          new_content: z.string().describe('新内容'),
          line_number: z.number().optional().describe('行号（可选）')
        }),
        execute: async ({ file_path, old_content, new_content, line_number }) => {
          console.log(`🔧 [编辑文件] ${file_path}`);
          try {
            const fullPath = path.resolve(this.workingDirectory, file_path);
            const content = await fs.readFile(fullPath, 'utf-8');
            
            // 执行替换
            const updatedContent = content.replace(old_content, new_content);
            
            if (updatedContent === content) {
              return {
                success: false,
                error: '未找到要替换的内容'
              };
            }
            
            // 写回文件
            await fs.writeFile(fullPath, updatedContent, 'utf-8');
            
            return {
              success: true,
              file_path,
              changes_made: 1,
              old_length: content.length,
              new_length: updatedContent.length,
              message: `成功编辑文件 ${file_path}`
            };
          } catch (error) {
            console.log(`⚠️ [编辑文件] 失败: ${error}`);
            return {
              success: false,
              error: `无法编辑文件: ${error instanceof Error ? error.message : '未知错误'}`
            };
          }
        }
      },

      append_to_file: {
        name: 'append_to_file',
        description: '在现有文件末尾添加新内容',
        inputSchema: z.object({
          file_path: z.string().describe('要追加内容的文件路径'),
          content: z.string().describe('要追加的内容')
        }),
        execute: async ({ file_path, content }) => {
          console.log(`🔧 [追加文件] ${file_path}`);
          try {
            const fullPath = path.resolve(this.workingDirectory, file_path);
            await fs.appendFile(fullPath, content, 'utf-8');
            
            return {
              success: true,
              file_path,
              appended_length: content.length,
              message: `成功向文件 ${file_path} 追加内容`
            };
          } catch (error) {
            console.log(`⚠️ [追加文件] 失败: ${error}`);
            return {
              success: false,
              error: `无法追加文件: ${error instanceof Error ? error.message : '未知错误'}`
            };
          }
        }
      },

      delete_file: {
        name: 'delete_file',
        description: '安全删除不再需要的文件',
        inputSchema: z.object({
          file_path: z.string().describe('要删除的文件路径')
        }),
        execute: async ({ file_path }) => {
          console.log(`🔧 [删除文件] ${file_path}`);
          try {
            const fullPath = path.resolve(this.workingDirectory, file_path);
            await fs.unlink(fullPath);
            
            return {
              success: true,
              file_path,
              message: `成功删除文件 ${file_path}`
            };
          } catch (error) {
            console.log(`⚠️ [删除文件] 失败: ${error}`);
            return {
              success: false,
              error: `无法删除文件: ${error instanceof Error ? error.message : '未知错误'}`
            };
          }
        }
      },

      search_code: {
        name: 'search_code',
        description: '在项目代码库中搜索特定的代码内容',
        inputSchema: z.object({
          query: z.string().describe('搜索查询字符串'),
          file_pattern: z.string().optional().describe('文件模式（可选）')
        }),
        execute: async ({ query, file_pattern }) => {
          console.log(`🔧 [搜索代码] "${query}"`);
          try {
            // 简化的搜索实现
            const results: Array<{ file: string; line: number; content: string }> = [];
            
            // 这里可以集成更复杂的搜索逻辑
            return {
              success: true,
              query,
              results,
              total_matches: results.length,
              message: `搜索完成，找到 ${results.length} 个匹配项`
            };
          } catch (error) {
            console.log(`⚠️ [搜索代码] 失败: ${error}`);
            return {
              success: false,
              error: `搜索失败: ${error instanceof Error ? error.message : '未知错误'}`
            };
          }
        }
      },

      get_file_structure: {
        name: 'get_file_structure',
        description: '获取项目的文件和目录结构',
        inputSchema: z.object({
          directory: z.string().optional().describe('目录路径（可选，默认为根目录）')
        }),
        execute: async ({ directory }) => {
          console.log(`🔧 [获取结构] ${directory || '根目录'}`);
          try {
            const targetDir = directory ? path.resolve(this.workingDirectory, directory) : this.workingDirectory;
            const structure = await this.getDirectoryStructure(targetDir);
            
            return {
              success: true,
              directory: directory || '.',
              structure,
              message: '成功获取文件结构'
            };
          } catch (error) {
            console.log(`⚠️ [获取结构] 失败: ${error}`);
            return {
              success: false,
              error: `无法获取文件结构: ${error instanceof Error ? error.message : '未知错误'}`
            };
          }
        }
      },

      run_command: {
        name: 'run_command',
        description: '执行项目构建、测试或开发相关的shell命令',
        inputSchema: z.object({
          command: z.string().describe('要执行的命令'),
          directory: z.string().optional().describe('执行目录（可选）')
        }),
        execute: async ({ command, directory }) => {
          console.log(`🔧 [执行命令] "${command}"`);
          try {
            const execDir = directory ? path.resolve(this.workingDirectory, directory) : this.workingDirectory;
            const { stdout, stderr } = await execAsync(command, { cwd: execDir });
            
            return {
              success: true,
              command,
              directory: directory || '.',
              stdout,
              stderr,
              message: `命令执行完成: ${command}`
            };
          } catch (error: any) {
            console.log(`⚠️ [执行命令] 失败: ${error}`);
            return {
              success: false,
              command,
              error: error.message,
              stdout: error.stdout || '',
              stderr: error.stderr || ''
            };
          }
        }
      },

      list_files: {
        name: 'list_files',
        description: '列出项目中所有文件的简洁清单',
        inputSchema: z.object({
          directory: z.string().optional().describe('目录路径（可选）')
        }),
        execute: async ({ directory }) => {
          console.log(`🔧 [列出文件] ${directory || '根目录'}`);
          try {
            const targetDir = directory ? path.resolve(this.workingDirectory, directory) : this.workingDirectory;
            const files = await this.listFiles(targetDir);
            
            return {
              success: true,
              directory: directory || '.',
              files,
              total_files: files.length,
              message: `找到 ${files.length} 个文件`
            };
          } catch (error) {
            console.log(`⚠️ [列出文件] 失败: ${error}`);
            return {
              success: false,
              error: `无法列出文件: ${error instanceof Error ? error.message : '未知错误'}`
            };
          }
        }
      }
    };
  }

  /**
   * 主处理方法
   */
  async *processRequest(
    userInput: string,
    sessionData: SessionData,
    context?: Record<string, any>
  ): AsyncGenerator<StreamableAgentResponse, void, unknown> {
    
    const messageId = `coding-v3-${Date.now()}`;
    
    try {
      console.log(`📨 [编程V3] 开始处理: ${userInput.substring(0, 100)}...`);

      // 确定处理模式
      const mode = context?.mode || this.determineMode(userInput, context);
      this.currentMode = mode;

      console.log(`🎯 [编程V3] 处理模式: ${mode}`);

      // 发送开始处理的响应
      yield this.createThinkingResponse(`🔍 正在分析您的${mode === 'initial' ? '项目需求' : '修改需求'}...`, 10);

      if (mode === 'initial') {
        // 初始项目生成模式
        yield* this.handleInitialProjectGeneration(userInput, sessionData, context);
      } else if (mode === 'incremental') {
        // 增量修改模式
        yield* this.handleIncrementalModification(userInput, sessionData, context);
      } else {
        // 分析模式
        yield* this.handleCodeAnalysis(userInput, sessionData, context);
      }

    } catch (error) {
      console.error('❌ [编程V3] 处理失败:', error);
      
      yield this.createResponse({
        immediate_display: {
          reply: '抱歉，处理您的编程请求时遇到了问题。请稍后重试或提供更多详细信息。',
          agent_name: this.name,
          timestamp: new Date().toISOString()
        },
        system_state: {
          intent: 'error',
          done: true,
          progress: 0,
          current_stage: '处理失败',
          metadata: {
            message_id: messageId,
            error: error instanceof Error ? error.message : '未知错误'
          }
        }
      });
    }
  }

  /**
   * 处理初始项目生成
   */
  private async *handleInitialProjectGeneration(
    userInput: string,
    sessionData: SessionData,
    context?: Record<string, any>
  ): AsyncGenerator<StreamableAgentResponse, void, unknown> {
    
    yield this.createThinkingResponse('🚀 正在生成完整项目结构...', 20);

    const systemPrompt = this.buildInitialProjectPrompt(userInput, context);
    
    const result = await this.executeMultiStepWorkflow(
      userInput,
      sessionData,
      systemPrompt,
      8 // 初始项目生成可能需要更多步骤
    );

    // 分析生成结果
    const codingResult = this.analyzeCodingResult(result);

    yield this.createResponse({
      immediate_display: {
        reply: result.text,
        agent_name: this.name,
        timestamp: new Date().toISOString()
      },
      system_state: {
        intent: 'project_generation_complete',
        done: true,
        progress: 100,
        current_stage: '项目生成完成',
        metadata: {
          files_created: codingResult.filesCreated,
          files_modified: codingResult.filesModified,
          commands_executed: codingResult.commandsExecuted,
          total_steps: result.steps.length,
          tools_used: Array.from(new Set(result.toolCalls.map(tc => tc.toolName)))
        }
      }
    });

    // 更新对话历史
    this.updateConversationHistory(sessionData, userInput, result.text);
  }

  /**
   * 处理增量修改
   */
  private async *handleIncrementalModification(
    userInput: string,
    sessionData: SessionData,
    context?: Record<string, any>
  ): AsyncGenerator<StreamableAgentResponse, void, unknown> {
    
    yield this.createThinkingResponse('🔧 正在分析现有代码并准备修改...', 30);

    // 首先获取项目结构
    if (!this.projectStructure) {
      yield this.createThinkingResponse('📁 正在分析项目结构...', 40);
      this.projectStructure = await this.analyzeProjectStructure();
    }

    const systemPrompt = this.buildIncrementalEditPrompt(userInput, context);
    
    const result = await this.executeMultiStepWorkflow(
      userInput,
      sessionData,
      systemPrompt,
      6 // 增量修改通常需要较少步骤
    );

    // 分析修改结果
    const codingResult = this.analyzeCodingResult(result);

    yield this.createResponse({
      immediate_display: {
        reply: result.text,
        agent_name: this.name,
        timestamp: new Date().toISOString()
      },
      system_state: {
        intent: 'incremental_modification_complete',
        done: true,
        progress: 100,
        current_stage: '增量修改完成',
        metadata: {
          files_created: codingResult.filesCreated,
          files_modified: codingResult.filesModified,
          files_deleted: codingResult.filesDeleted,
          commands_executed: codingResult.commandsExecuted,
          total_steps: result.steps.length,
          tools_used: Array.from(new Set(result.toolCalls.map(tc => tc.toolName)))
        }
      }
    });

    // 更新对话历史
    this.updateConversationHistory(sessionData, userInput, result.text);
  }

  /**
   * 处理代码分析
   */
  private async *handleCodeAnalysis(
    userInput: string,
    sessionData: SessionData,
    context?: Record<string, any>
  ): AsyncGenerator<StreamableAgentResponse, void, unknown> {
    
    yield this.createThinkingResponse('🔍 正在分析代码结构和内容...', 25);

    const systemPrompt = this.buildAnalysisPrompt(userInput, context);
    
    const result = await this.executeMultiStepWorkflow(
      userInput,
      sessionData,
      systemPrompt,
      4 // 分析模式需要较少步骤
    );

    yield this.createResponse({
      immediate_display: {
        reply: result.text,
        agent_name: this.name,
        timestamp: new Date().toISOString()
      },
      system_state: {
        intent: 'code_analysis_complete',
        done: true,
        progress: 100,
        current_stage: '代码分析完成',
        metadata: {
          total_steps: result.steps.length,
          tools_used: Array.from(new Set(result.toolCalls.map(tc => tc.toolName))),
          analysis_type: 'code_review'
        }
      }
    });

    // 更新对话历史
    this.updateConversationHistory(sessionData, userInput, result.text);
  }

  /**
   * 确定处理模式
   */
  private determineMode(userInput: string, context?: Record<string, any>): 'initial' | 'incremental' | 'analysis' {
    // 检查上下文中的模式设置
    if (context?.mode) {
      return context.mode;
    }

    // 基于用户输入的关键词判断
    const input = userInput.toLowerCase();
    
    if (input.includes('创建') || input.includes('新建') || input.includes('生成项目') || input.includes('初始化')) {
      return 'initial';
    }
    
    if (input.includes('修改') || input.includes('更新') || input.includes('编辑') || input.includes('优化') || input.includes('添加功能')) {
      return 'incremental';
    }
    
    if (input.includes('分析') || input.includes('查看') || input.includes('检查') || input.includes('解释')) {
      return 'analysis';
    }

    // 默认为增量模式
    return 'incremental';
  }

  /**
   * 构建初始项目生成 prompt
   */
  private buildInitialProjectPrompt(userInput: string, context?: Record<string, any>): string {
    // 使用现有的专业编程 prompt，并添加工具调用指导
    const basePrompt = CODING_EXPERT_MODE_PROMPT;
    
    const toolGuidance = `

## 🛠️ 工具调用指导

**🚨 重要：你必须使用工具调用来创建项目文件！**

请按照以下步骤使用工具：

### 第一步：分析项目结构
1. 使用 \`get_file_structure\` 了解当前目录状态
2. 使用 \`list_files\` 查看现有文件

### 第二步：创建项目文件
1. 使用 \`write_file\` 创建 package.json（包含所有必要依赖）
2. 使用 \`write_file\` 创建配置文件（next.config.js, tailwind.config.js 等）
3. 使用 \`write_file\` 创建核心组件和页面文件
4. 使用 \`write_file\` 创建样式文件

### 第三步：项目初始化
1. 使用 \`run_command\` 安装依赖（如 npm install）
2. 使用 \`run_command\` 运行构建测试（如 npm run build）

## 📋 当前项目需求

**用户需求：** ${userInput}

**项目配置：**
- 框架偏好：${context?.framework || 'Next.js'}
- 技术栈：${context?.tech_stack || 'React + TypeScript'}
- 项目类型：${context?.project_type || 'Web应用'}

请严格按照 V0 标准和工具调用流程来创建完整的项目结构。用中文回复，详细说明每个步骤。`;

    return basePrompt + toolGuidance;
  }

  /**
   * 构建增量编辑 prompt
   */
  private buildIncrementalEditPrompt(userInput: string, context?: Record<string, any>): string {
    const fileStructure = this.projectStructure ? 
      JSON.stringify(this.projectStructure, null, 2) : 
      '项目结构分析中...';

    // 使用现有的增量编辑 prompt
    let formattedPrompt = INCREMENTAL_EDIT_PROMPT
      .replace('{file_structure}', fileStructure)
      .replace('{modification_request}', userInput)
      .replace('{target_files}', context?.target_files || '待确定')
      .replace('{context_info}', JSON.stringify(context || {}, null, 2));

    formattedPrompt += `\n\n## 当前修改请求：\n${userInput}`;

    return formattedPrompt;
  }

  /**
   * 构建代码分析 prompt
   */
  private buildAnalysisPrompt(userInput: string, context?: Record<string, any>): string {
    return `你是HeysMe平台的专业代码分析专家，专门进行深度代码审查和架构分析。

## 🔍 代码分析任务

**分析请求：** ${userInput}

**分析上下文：**
- 项目类型：${context?.project_type || '待分析'}
- 技术栈：${context?.tech_stack || '待识别'}
- 关注重点：${context?.focus_areas || '全面分析'}

## 🛠️ 分析工具使用流程

### 第一阶段：项目概览
1. 使用 \`get_file_structure\` 获取完整项目结构
2. 使用 \`list_files\` 列出所有文件清单
3. 使用 \`read_file\` 读取 package.json 了解依赖

### 第二阶段：核心代码分析
1. 使用 \`read_file\` 读取关键文件（入口文件、主要组件等）
2. 使用 \`search_code\` 搜索特定模式和潜在问题
3. 使用 \`read_file\` 深入分析重要模块

### 第三阶段：质量评估
1. 检查代码规范和最佳实践
2. 识别性能瓶颈和安全问题
3. 评估架构设计和可维护性

## 📊 分析报告要求

请提供结构化的分析报告，包括：

### 🏗️ 架构分析
- 项目结构合理性
- 模块化程度评估
- 依赖关系分析

### 🔧 代码质量
- 编码规范遵循情况
- 类型安全性检查
- 错误处理机制

### 🚀 性能评估
- 潜在性能问题
- 优化建议
- 最佳实践推荐

### 🛡️ 安全性检查
- 安全漏洞识别
- 数据验证检查
- 权限控制评估

### 📈 改进建议
- 具体优化方案
- 重构建议
- 技术升级建议

用中文提供详细的专业分析报告。`;
  }

  /**
   * 分析编程结果
   */
  private analyzeCodingResult(result: any): CodingResult {
    const filesCreated: string[] = [];
    const filesModified: string[] = [];
    const filesDeleted: string[] = [];
    const commandsExecuted: string[] = [];

    // 分析工具调用结果
    result.toolResults.forEach((toolResult: any) => {
      const toolName = toolResult.toolName;
      const output = toolResult.output;

      if (toolName === 'write_file' && output.success) {
        filesCreated.push(output.file_path);
      } else if (toolName === 'edit_file' && output.success) {
        filesModified.push(output.file_path);
      } else if (toolName === 'delete_file' && output.success) {
        filesDeleted.push(output.file_path);
      } else if (toolName === 'run_command' && output.success) {
        commandsExecuted.push(output.command);
      }
    });

    return {
      success: true,
      filesCreated,
      filesModified,
      filesDeleted,
      commandsExecuted,
      summary: result.text
    };
  }

  /**
   * 辅助方法
   */
  private async getDirectoryStructure(dir: string): Promise<any> {
    try {
      const items = await fs.readdir(dir, { withFileTypes: true });
      const structure: any = {};

      for (const item of items) {
        if (item.name.startsWith('.')) continue; // 跳过隐藏文件

        if (item.isDirectory()) {
          structure[item.name] = await this.getDirectoryStructure(path.join(dir, item.name));
        } else {
          structure[item.name] = 'file';
        }
      }

      return structure;
    } catch (error) {
      return {};
    }
  }

  private async listFiles(dir: string): Promise<string[]> {
    try {
      const items = await fs.readdir(dir, { withFileTypes: true });
      const files: string[] = [];

      for (const item of items) {
        if (item.name.startsWith('.')) continue;

        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
          const subFiles = await this.listFiles(fullPath);
          files.push(...subFiles.map(f => path.join(item.name, f)));
        } else {
          files.push(item.name);
        }
      }

      return files;
    } catch (error) {
      return [];
    }
  }

  private async analyzeProjectStructure(): Promise<ProjectStructure> {
    try {
      const structure = await this.getDirectoryStructure(this.workingDirectory);
      const files = await this.listFiles(this.workingDirectory);
      
      // 尝试读取 package.json
      let packageJson = null;
      try {
        const packagePath = path.join(this.workingDirectory, 'package.json');
        const packageContent = await fs.readFile(packagePath, 'utf-8');
        packageJson = JSON.parse(packageContent);
      } catch (error) {
        // package.json 不存在或无法解析
      }

      return {
        files: [], // 简化实现
        directories: Object.keys(structure),
        packageJson,
        dependencies: packageJson?.dependencies ? Object.keys(packageJson.dependencies) : [],
        framework: this.detectFramework(packageJson)
      };
    } catch (error) {
      return {
        files: [],
        directories: [],
        dependencies: []
      };
    }
  }

  private detectFramework(packageJson: any): string {
    if (!packageJson?.dependencies) return 'unknown';

    if (packageJson.dependencies['next']) return 'Next.js';
    if (packageJson.dependencies['react']) return 'React';
    if (packageJson.dependencies['vue']) return 'Vue.js';
    if (packageJson.dependencies['angular']) return 'Angular';
    if (packageJson.dependencies['express']) return 'Express.js';

    return 'unknown';
  }

  /**
   * 设置工作目录
   */
  setWorkingDirectory(directory: string): void {
    this.workingDirectory = path.resolve(directory);
    console.log(`📁 [工作目录] 设置为: ${this.workingDirectory}`);
  }
}
