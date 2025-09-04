/**
 * 基于 Vercel AI SDK 的编程 Agent
 * 使用多步骤工具调用实现智能代码生成和文件操作
 */

import { BaseAgent } from '../base-agent';
import { AgentCapabilities, StreamableAgentResponse } from '@/lib/types/streaming';
import { SessionData } from '@/lib/types/session';
import { anthropic } from '@ai-sdk/anthropic';
import { generateText, tool, stepCountIs } from 'ai';
import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';

export class VercelAICodingAgent extends BaseAgent {
  constructor() {
    const capabilities: AgentCapabilities = {
      canStream: true,
      requiresInteraction: false,
      outputFormats: ['text', 'json', 'markdown'],
      maxRetries: 3,
      timeout: 60000
    };

    super('VercelAI编程专家', capabilities);
  }

  /**
   * 定义编程工具集 - 使用数据库存储
   */
  private getTools(sessionData?: any) {
    // 🎯 使用统一的数据库文件工具
    const { DatabaseFileTools } = require('@/lib/agents/coding/database-file-tools');
    
    return DatabaseFileTools.getAllDatabaseTools({ 
      sessionId: sessionData?.id || sessionData?.sessionId 
    });
  }

  /**
   * 暂时保留的本地文件工具 (备用)
   */
  private getLocalTools() {
    return {
      edit_file: tool({
        description: 'Edit an existing file by replacing specific content or adding new content.',
        inputSchema: z.object({
          file_path: z.string().describe('Path to the file to edit'),
          old_content: z.string().optional().describe('Content to replace (if doing replacement)'),
          new_content: z.string().describe('New content to add or replace with'),
          operation: z.enum(['replace', 'append', 'prepend']).describe('Type of edit operation'),
          description: z.string().optional().describe('Brief description of the changes')
        }),
        execute: async ({ file_path, old_content, new_content, operation, description }) => {
          console.log(`🔧 [编辑文件] ${file_path} - ${operation}`);
          try {
            let currentContent = '';
            try {
              currentContent = await fs.readFile(file_path, 'utf8');
            } catch (error) {
              if (operation === 'replace' && old_content) {
                throw new Error(`文件不存在: ${file_path}`);
              }
              // 对于 append/prepend，如果文件不存在就创建
              currentContent = '';
            }

            let updatedContent = '';
            switch (operation) {
              case 'replace':
                if (old_content) {
                  if (!currentContent.includes(old_content)) {
                    throw new Error(`未找到要替换的内容`);
                  }
                  updatedContent = currentContent.replace(old_content, new_content);
                } else {
                  updatedContent = new_content;
                }
                break;
              case 'append':
                updatedContent = currentContent + new_content;
                break;
              case 'prepend':
                updatedContent = new_content + currentContent;
                break;
            }

            // 确保目录存在
            const dir = path.dirname(file_path);
            await fs.mkdir(dir, { recursive: true });
            
            await fs.writeFile(file_path, updatedContent, 'utf8');
            const stats = await fs.stat(file_path);
            
            console.log(`✅ [文件编辑成功] ${file_path} (${stats.size} bytes)`);
            
            return {
              success: true,
              file_path,
              operation,
              size: stats.size,
              description: description || `执行了 ${operation} 操作`,
              action: 'modified'
            };
          } catch (error) {
            console.error(`❌ [文件编辑失败] ${file_path}:`, error);
            throw error;
          }
        }
      }),

      read_file: tool({
        description: 'Read the content of an existing file to understand its current state.',
        inputSchema: z.object({
          file_path: z.string().describe('Path to the file to read'),
          encoding: z.enum(['utf8', 'base64']).optional().default('utf8').describe('File encoding')
        }),
        execute: async ({ file_path, encoding = 'utf8' }) => {
          console.log(`🔧 [读取文件] ${file_path}`);
          try {
            const content = await fs.readFile(file_path, encoding);
            const stats = await fs.stat(file_path);
            
            console.log(`✅ [文件读取成功] ${file_path} (${stats.size} bytes)`);
            
            return {
              success: true,
              file_path,
              content,
              size: stats.size,
              modified: stats.mtime.toISOString(),
              action: 'read'
            };
          } catch (error) {
            console.error(`❌ [文件读取失败] ${file_path}:`, error);
            throw error;
          }
        }
      }),

      list_files: tool({
        description: 'List files and directories in a specified path to understand project structure.',
        inputSchema: z.object({
          directory_path: z.string().describe('Directory path to list (e.g., "src", ".", "components")'),
          include_hidden: z.boolean().optional().default(false).describe('Whether to include hidden files'),
          max_depth: z.number().optional().default(2).describe('Maximum depth to traverse')
        }),
        execute: async ({ directory_path, include_hidden = false, max_depth = 2 }) => {
          console.log(`🔧 [列出文件] ${directory_path}`);
          try {
            const listDirectory = async (dir: string, currentDepth: number = 0): Promise<any[]> => {
              if (currentDepth >= max_depth) return [];
              
              const items = await fs.readdir(dir);
              const result = [];
              
              for (const item of items) {
                if (!include_hidden && item.startsWith('.')) continue;
                
                const itemPath = path.join(dir, item);
                const stats = await fs.stat(itemPath);
                
                const itemInfo: any = {
                  name: item,
                  path: itemPath,
                  type: stats.isDirectory() ? 'directory' : 'file',
                  size: stats.size,
                  modified: stats.mtime.toISOString()
                };
                
                if (stats.isDirectory() && currentDepth < max_depth - 1) {
                  try {
                    itemInfo.children = await listDirectory(itemPath, currentDepth + 1);
                  } catch (error) {
                    // 忽略无法访问的目录
                  }
                }
                
                result.push(itemInfo);
              }
              
              return result;
            };

            const files = await listDirectory(directory_path);
            console.log(`✅ [文件列表成功] ${directory_path} (${files.length} items)`);
            
            return {
              success: true,
              directory_path,
              files,
              total_items: files.length,
              action: 'listed'
            };
          } catch (error) {
            console.error(`❌ [文件列表失败] ${directory_path}:`, error);
            throw error;
          }
        }
      }),

      analyze_project: tool({
        description: 'Analyze the project structure and provide insights about the codebase.',
        inputSchema: z.object({
          project_path: z.string().optional().default('.').describe('Root path of the project to analyze'),
          focus_areas: z.array(z.enum(['structure', 'dependencies', 'technologies', 'patterns'])).optional().default(['structure']).describe('Areas to focus the analysis on')
        }),
        execute: async ({ project_path = '.', focus_areas = ['structure'] }) => {
          console.log(`🔧 [项目分析] ${project_path}`);
          try {
            const analysis: any = {
              project_path,
              structure: {},
              dependencies: {},
              technologies: [],
              patterns: [],
              recommendations: []
            };

            if (focus_areas.includes('structure')) {
              // 分析项目结构
              try {
                const packageJsonPath = path.join(project_path, 'package.json');
                const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
                analysis.structure = {
                  name: packageJson.name,
                  version: packageJson.version,
                  type: packageJson.type || 'commonjs',
                  main: packageJson.main,
                  scripts: Object.keys(packageJson.scripts || {}),
                  hasTypeScript: !!packageJson.devDependencies?.typescript || !!packageJson.dependencies?.typescript
                };
              } catch (error) {
                analysis.structure = { error: '无法读取 package.json' };
              }
            }

            if (focus_areas.includes('dependencies')) {
              // 分析依赖
              try {
                const packageJsonPath = path.join(project_path, 'package.json');
                const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
                analysis.dependencies = {
                  production: Object.keys(packageJson.dependencies || {}),
                  development: Object.keys(packageJson.devDependencies || {}),
                  total: Object.keys(packageJson.dependencies || {}).length + Object.keys(packageJson.devDependencies || {}).length
                };
              } catch (error) {
                analysis.dependencies = { error: '无法分析依赖' };
              }
            }

            if (focus_areas.includes('technologies')) {
              // 检测技术栈
              const techStack = [];
              try {
                await fs.access(path.join(project_path, 'tsconfig.json'));
                techStack.push('TypeScript');
              } catch {}
              
              try {
                await fs.access(path.join(project_path, 'next.config.js'));
                techStack.push('Next.js');
              } catch {}
              
              try {
                await fs.access(path.join(project_path, 'tailwind.config.js'));
                techStack.push('Tailwind CSS');
              } catch {}

              analysis.technologies = techStack;
            }

            console.log(`✅ [项目分析成功] 检测到技术: ${analysis.technologies.join(', ')}`);
            
            return {
              success: true,
              ...analysis,
              action: 'analyzed'
            };
          } catch (error) {
            console.error(`❌ [项目分析失败] ${project_path}:`, error);
            throw error;
          }
        }
      }),

      execute_command: tool({
        description: 'Execute shell commands for development tasks like installing packages, running tests, etc.',
        inputSchema: z.object({
          command: z.string().describe('Shell command to execute'),
          working_directory: z.string().optional().default('.').describe('Working directory for the command'),
          timeout: z.number().optional().default(30000).describe('Timeout in milliseconds')
        }),
        execute: async ({ command, working_directory = '.', timeout = 30000 }) => {
          console.log(`🔧 [执行命令] ${command} (在 ${working_directory})`);
          
          // 安全检查 - 只允许常见的开发命令
          const allowedCommands = [
            'npm', 'yarn', 'pnpm', 'node', 'tsc', 'eslint', 'prettier',
            'git', 'ls', 'pwd', 'mkdir', 'cat', 'echo', 'which'
          ];
          
          const commandParts = command.trim().split(' ');
          const baseCommand = commandParts[0];
          
          if (!allowedCommands.includes(baseCommand)) {
            throw new Error(`不允许执行的命令: ${baseCommand}`);
          }

          try {
            const { exec } = require('child_process');
            const { promisify } = require('util');
            const execAsync = promisify(exec);

            const result = await Promise.race([
              execAsync(command, { cwd: working_directory }),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('命令执行超时')), timeout)
              )
            ]);

            console.log(`✅ [命令执行成功] ${command}`);
            
            return {
              success: true,
              command,
              working_directory,
              stdout: result.stdout,
              stderr: result.stderr,
              action: 'executed'
            };
          } catch (error) {
            console.error(`❌ [命令执行失败] ${command}:`, error);
            throw error;
          }
        }
      })
    };
  }

  /**
   * 实现 BaseAgent 的抽象方法
   */
  async *process(
    input: any,
    sessionData: SessionData,
    context?: Record<string, any>
  ): AsyncGenerator<StreamableAgentResponse, void, unknown> {
    const userInput = typeof input === 'string' ? input : input?.user_input || '';
    yield* this.processRequest(userInput, sessionData, context);
  }

  /**
   * 主要处理方法 - 使用 Vercel AI SDK 的多步骤工具调用
   */
  async *processRequest(
    userInput: string,
    sessionData: SessionData,
    context?: Record<string, any>
  ): AsyncGenerator<StreamableAgentResponse, void, unknown> {
    const messageId = `vercel-ai-coding-${Date.now()}`;
    
    try {
      console.log(`📨 [VercelAI编程] 开始处理: ${userInput.substring(0, 100)}...`);

      // 发送开始处理的响应
      yield this.createResponse({
        immediate_display: {
          reply: '🚀 正在分析您的编程需求，准备执行相关操作...',
          agent_name: this.name,
          timestamp: new Date().toISOString()
        },
        system_state: {
          intent: 'analyzing',
          done: false,
          progress: 10,
          current_stage: '需求分析',
          metadata: { message_id: messageId, mode: 'vercel_ai_coding' }
        }
      });

      // 构建对话历史
      const conversationHistory = this.conversationHistory.get(sessionData.id) || [];
      const messages = [
        {
          role: 'system' as const,
          content: `你是一个专业的编程助手。你的任务是：

1. **需求理解**: 分析用户的编程需求和目标
2. **项目分析**: 了解当前项目结构和技术栈
3. **智能编程**: 根据需求创建、编辑文件，执行必要的命令
4. **质量保证**: 确保代码质量和项目结构合理
5. **用户指导**: 提供清晰的说明和建议

可用工具：
- analyze_project: 分析项目结构和技术栈
- list_files: 列出文件和目录结构
- read_file: 读取现有文件内容
- create_file: 创建新文件
- edit_file: 编辑现有文件
- execute_command: 执行开发相关命令

请根据用户需求智能选择和组合使用这些工具。始终确保代码质量和项目的一致性。用中文回复。`
        },
        ...conversationHistory.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        })),
        {
          role: 'user' as const,
          content: userInput
        }
      ];

      // 发送工具调用开始的响应
      yield this.createResponse({
        immediate_display: {
          reply: '🛠️ 开始执行编程工具调用...',
          agent_name: this.name,
          timestamp: new Date().toISOString()
        },
        system_state: {
          intent: 'tool_calling',
          done: false,
          progress: 30,
          current_stage: '工具执行',
          metadata: { message_id: messageId }
        }
      });

      // 使用 Vercel AI SDK 的多步骤工具调用
      const result = await generateText({
        model: anthropic('claude-3-5-sonnet-20241022'),
        messages,
        tools: this.getTools(sessionData),
        stopWhen: stepCountIs(8), // 允许最多8步：分析 + 多个文件操作
        temperature: 0.3, // 编程任务使用较低温度
        onStepFinish: async ({ toolResults }) => {
          console.log(`📊 [步骤完成] 执行了 ${toolResults.length} 个工具`);
          // 注意：这里不能使用 yield，因为这是在回调函数中
          // 步骤完成的通知将在主流程中处理
        }
      });

      console.log(`✅ [VercelAI编程] 完成，执行了 ${result.steps.length} 个步骤`);

      // 提取所有工具调用结果
      const allToolCalls = result.steps.flatMap(step => step.toolCalls);
      const allToolResults = result.steps.flatMap(step => step.toolResults);

      // 统计文件操作
      const fileOperations = allToolResults.filter(tr => 
        ['create_file', 'edit_file', 'read_file'].includes(
          allToolCalls[allToolResults.indexOf(tr)]?.toolName
        )
      );

      // 发送最终结果
      yield this.createResponse({
        immediate_display: {
          reply: result.text,
          agent_name: this.name,
          timestamp: new Date().toISOString()
        },
        system_state: {
          intent: 'coding_complete',
          done: true,
          progress: 100,
          current_stage: '编程完成',
          metadata: {
            message_id: messageId,
            steps_executed: result.steps.length,
            tools_used: Array.from(new Set(allToolCalls.map(tc => tc.toolName))),
            files_modified: fileOperations.length,
            total_tokens: result.usage?.totalTokens
          }
        }
      });

      // 更新对话历史
      this.updateConversationHistory(sessionData, userInput, result.text);

    } catch (error) {
      console.error('❌ [VercelAI编程] 处理失败:', error);
      
      yield this.createResponse({
        immediate_display: {
          reply: '抱歉，处理您的编程请求时遇到了问题。请检查您的需求描述或稍后重试。',
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
   * 更新对话历史
   */
  private updateConversationHistory(sessionData: SessionData, userInput: string, assistantResponse: string) {
    if (!this.conversationHistory.has(sessionData.id)) {
      this.conversationHistory.set(sessionData.id, []);
    }

    const history = this.conversationHistory.get(sessionData.id)!;
    history.push(
      { role: 'user', content: userInput },
      { role: 'assistant', content: assistantResponse }
    );

    // 保持历史记录在合理范围内（编程任务可能需要更多上下文）
    if (history.length > 30) {
      history.splice(0, history.length - 30);
    }
  }
}
