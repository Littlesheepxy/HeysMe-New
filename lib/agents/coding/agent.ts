import { BaseAgent } from '../base-agent';
import { 
  StreamableAgentResponse, 
  AgentCapabilities
} from '@/lib/types/streaming';
import { SessionData } from '@/lib/types/session';
import { CodeFile } from './types';

/**
 * Coding Agent - AI驱动的代码生成
 */
export class CodingAgent extends BaseAgent {
  constructor() {
    const capabilities: AgentCapabilities = {
      canStream: true,
      requiresInteraction: false,
      outputFormats: ['json', 'markdown'],
      maxRetries: 2,
      timeout: 30000
    };
    
    super('CodingAgent', capabilities);
  }

  /**
   * 主处理流程 - AI驱动的代码生成
   */
  async* process(
    input: any,
    sessionData: SessionData,
    context?: Record<string, any>
  ): AsyncGenerator<StreamableAgentResponse, void, unknown> {
    try {
      const userInput = input.user_input || '';
      const mode = input.mode || 'initial'; // 🆕 获取模式参数
      
      console.log('🔧 [CodingAgent] 输入分析:', {
        用户输入: userInput.substring(0, 100) + '...',
        模式: mode,
        上下文: context
      });
      
      // 🎯 根据模式选择不同的处理流程
      if (mode === 'initial') {
        // 🚀 初始模式：完整项目生成
        console.log('🚀 [初始模式] 开始完整项目生成');
        yield* this.handleInitialProjectGeneration(userInput, sessionData, context);
      } else if (mode === 'incremental') {
        // 📊 增量模式：基于上下文的对话修改
        console.log('📊 [增量模式] 开始增量修改');
        yield* this.handleIncrementalModification(userInput, sessionData, context);
      } else {
        // 🔧 兼容旧逻辑：默认使用AI生成模式
        console.log('🔧 [兼容模式] 使用默认AI生成');
        yield* this.handleAIGeneration(userInput, sessionData, context);
      }

    } catch (error) {
      yield await this.handleError(error as Error, sessionData, context);
    }
  }

  /**
   * 🚀 初始项目生成处理
   */
  private async* handleInitialProjectGeneration(
    userInput: string, 
    sessionData: SessionData,
    context?: Record<string, any>
  ): AsyncGenerator<StreamableAgentResponse, void, unknown> {
    try {
      // 步骤1: 思考阶段
      yield this.createThinkingResponse('🤔 正在分析您的项目需求...', 10);
      await this.delay(1000);

      yield this.createThinkingResponse('🎯 准备生成完整项目结构...', 20);
      await this.delay(500);

      // 🚀 完整项目生成：使用现有的流式AI生成逻辑
      console.log('🚀 [初始生成] 调用完整项目生成流程');
      yield* this.handleStreamingAIGeneration(userInput, sessionData, context);

    } catch (error) {
      console.error('❌ [初始项目生成错误]:', error);
      yield this.createResponse({
        immediate_display: {
          reply: '抱歉，生成项目时遇到了问题。请重试或调整您的需求。',
          agent_name: this.name,
          timestamp: new Date().toISOString()
        },
        system_state: {
          intent: 'error',
          done: true
        }
      });
    }
  }

  /**
   * 📊 增量修改处理
   */
  private async* handleIncrementalModification(
    userInput: string, 
    sessionData: SessionData,
    context?: Record<string, any>
  ): AsyncGenerator<StreamableAgentResponse, void, unknown> {
    try {
      // 增量修改不需要长时间的思考，直接开始处理
      yield this.createThinkingResponse('🔄 正在分析您的修改需求...', 20);
      await this.delay(200);

      // 📊 增量修改：直接调用AI，期望工具调用格式
      console.log('📊 [增量修改] 调用增量修改流程');
      yield* this.handleIncrementalAIGeneration(userInput, sessionData, context);

    } catch (error) {
      console.error('❌ [增量修改错误]:', error);
      
      // 🔧 改进错误处理：提供更具体的错误信息
      let errorMessage = '抱歉，修改过程中遇到了问题。';
      
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          errorMessage = '修改请求超时，请重试或简化您的需求。';
        } else if (error.message.includes('network')) {
          errorMessage = '网络连接问题，请检查网络后重试。';
        } else if (error.message.includes('rate limit')) {
          errorMessage = 'API调用频率过高，请稍后再试。';
        } else {
          errorMessage = `修改过程中遇到问题：${error.message}`;
        }
      }
      
      yield this.createResponse({
        immediate_display: {
          reply: errorMessage,
          agent_name: this.name,
          timestamp: new Date().toISOString()
        },
        system_state: {
          intent: 'error',
          done: true,
          metadata: {
            error: error instanceof Error ? error.message : '未知错误',
            retryable: true,
            mode: 'incremental'
          }
        }
      });
    }
  }

  /**
   * AI生成模式处理
   */
  private async* handleAIGeneration(
    userInput: string, 
    sessionData: SessionData,
    context?: Record<string, any>
  ): AsyncGenerator<StreamableAgentResponse, void, unknown> {
    try {
      // 步骤1: 思考阶段
      yield this.createThinkingResponse('🤔 正在分析您的需求...', 10);
      await this.delay(500);

      yield this.createThinkingResponse('🎯 准备调用AI生成代码...', 20);
      await this.delay(500);

      // 🆕 统一使用流式输出，不再区分测试模式和常规模式
      console.log('🌊 [流式模式] 使用流式AI代码生成');
      yield* this.handleStreamingAIGeneration(userInput, sessionData, context);

    } catch (error) {
      console.error('❌ [AI生成错误]:', error);
      yield this.createResponse({
        immediate_display: {
          reply: '抱歉，AI代码生成过程中遇到了问题。请重试或调整您的需求。',
          agent_name: this.name,
          timestamp: new Date().toISOString()
        },
        system_state: {
          intent: 'error',
          done: true
        }
      });
    }
  }

  /**
   * 🆕 流式AI代码生成处理
   */
  private async* handleStreamingAIGeneration(
    userInput: string, 
    sessionData: SessionData,
    context?: Record<string, any>
  ): AsyncGenerator<StreamableAgentResponse, void, unknown> {
    try {
      console.log('🤖 [流式AI调用] 步骤1: 开始导入模块...');
      
      // 动态导入提示词和JSON流式解析器
      const { getCodingPrompt, CODING_EXPERT_MODE_PROMPT } = await import('@/lib/prompts/coding');
      const { JSONStreamParser } = await import('@/lib/streaming/json-streamer');
      
      console.log('🤖 [流式AI调用] 步骤2: 提示词导入成功');
      
      // 🔧 判断使用哪种模式的prompt
      let prompt: string;
      const isExpertMode = this.isExpertMode(sessionData, context);
      
      if (isExpertMode) {
        // 专业模式：用户直接对话
        prompt = CODING_EXPERT_MODE_PROMPT + `\n\n用户需求：${userInput}`;
        console.log('🎯 [模式选择] 使用专业模式 CODING_EXPERT_MODE_PROMPT');
      } else {
        // 正常模式：来自prompt-output agent
        prompt = getCodingPrompt(userInput);
        console.log('🎯 [模式选择] 使用正常模式 CODING_AGENT_PROMPT');
      }
      
      console.log('🤖 [流式AI调用] 步骤3: 提示词构建完成，长度:', prompt.length);
      
      // 🆕 使用流式AI模型生成
      const { generateStreamWithModel } = await import('@/lib/ai-models');
      
      console.log('🌊 [流式生成] 开始流式调用大模型API...');
      
      let chunkCount = 0;
      const messageId = `coding-stream-${Date.now()}`;
      
      // 🆕 创建JSON流式解析器
      const jsonParser = new JSONStreamParser();
      
      // 🔧 关键修复：增加完整的文本累积器
      let fullAccumulatedText = '';
      let lastSentTextLength = 0;
      
      // 流式调用AI模型
      for await (const chunk of generateStreamWithModel(
        'claude',
        'claude-sonnet-4-20250514',
        [
          { role: 'system', content: '你是一个专业的全栈开发工程师，专门生成高质量的代码项目。请按照用户要求生成完整的项目代码，每个文件都要用markdown代码块格式包装，并标明文件名。' },
          { role: 'user', content: prompt }
        ],
        { maxTokens: 64000 }
      )) {
        chunkCount++;
        fullAccumulatedText += chunk;
        
        console.log(`📤 [流式输出] 第${chunkCount}个块，新增内容长度: ${chunk.length}, 累积长度: ${fullAccumulatedText.length}`);
        
        // 🆕 使用JSON流式解析器处理chunk
        const parseResult = jsonParser.processChunk(chunk);
        
        // 🔧 关键修复：使用separateTextAndCode分离内容
        const separated = this.separateTextAndCode(fullAccumulatedText);
        const pureText = separated.text;
        const extractedFiles = separated.codeFiles;
        
        // 🔧 计算新增的纯文本内容（增量发送）
        const newTextToSend = pureText.substring(lastSentTextLength);
        lastSentTextLength = pureText.length;
        
        console.log(`🎯 [内容分离] 纯文本长度: ${pureText.length}, 新增文本: ${newTextToSend.length}, 提取文件: ${extractedFiles.length}`);
        console.log(`📝 [新增文本预览] "${newTextToSend.substring(0, 100)}${newTextToSend.length > 100 ? '...' : ''}"`); // 🔧 只输出分离后的文本预览
        
        // 🔧 详细检查：如果新增文本包含代码块标记，输出警告
        if (newTextToSend.includes('```') || newTextToSend.includes('typescript:') || newTextToSend.includes('json:')) {
          console.error('❌ [分离失败] 新增文本仍包含代码块标记！');
          console.error('❌ [分离失败] 新增文本内容:', newTextToSend);
        }
        
        // 🆕 发送分离后的纯文本内容到对话框
        yield this.createResponse({
          immediate_display: {
            reply: newTextToSend, // 🔧 只发送纯文本，不包含代码块
            agent_name: this.name,
            timestamp: new Date().toISOString()
          },
          system_state: {
            intent: 'generating',
            done: false,
            progress: Math.min(90, 30 + Math.floor(chunkCount / 10) * 10),
            current_stage: `正在生成代码... (${chunkCount} 块)`,
            metadata: {
              streaming: true,
              message_id: messageId,
              chunk_count: chunkCount,
              is_update: chunkCount > 1,
              latest_chunk: newTextToSend, // 🔧 关键修复：传递分离后的纯文本，而不是原始chunk
              accumulated_length: fullAccumulatedText.length,
              // 🆕 明确标识为增量内容
              content_mode: 'incremental',
              stream_type: chunkCount === 1 ? 'start' : 'delta',
              agent_type: 'CodingAgent',
              // 🆕 文件相关信息 - 使用分离后的文件
              hasCodeFiles: extractedFiles.length > 0,
              codeFilesReady: extractedFiles.length > 0,
              projectFiles: extractedFiles.map(f => ({
                filename: f.filename,
                content: f.content,
                description: f.description || `生成的${f.language}文件`,
                language: f.language,
                type: 'file'
              })),
              totalFiles: extractedFiles.length,
              // 🆕 流式文件创建状态
              fileCreationProgress: extractedFiles.map(file => ({
                filename: file.filename,
                status: chunkCount % 3 === 0 ? 'completed' : 'streaming', // 模拟进度
                progress: Math.min(100, (chunkCount / 10) * 100),
                size: file.content.length
              })),
              // 🆕 实时更新标记
              hasNewFile: parseResult.hasNewFile,
              hasContentUpdate: parseResult.hasContentUpdate,
              newFileIndex: parseResult.newFileIndex,
              updatedFileIndex: parseResult.updatedFileIndex
            }
          }
        });
        
        // 如果JSON解析完成，退出循环
        if (parseResult.isComplete) {
          console.log('🎉 [JSON解析] JSON解析完成，文件数量:', parseResult.files.length);
          break;
        }
        
        // 🔧 防止无限循环，但增加限制数量
        if (chunkCount > 2000) {
          console.warn('⚠️ [安全限制] 流式块数超过2000，主动终止');
          break;
        }
      }
      
      console.log('🤖 [流式AI调用] 步骤4: 流式生成完成');
      console.log('🔍 [完整响应] 总长度:', fullAccumulatedText.length);
      
      // 🆕 最终分离内容
      const finalSeparated = this.separateTextAndCode(fullAccumulatedText);
      let finalFiles = finalSeparated.codeFiles;
      const finalText = finalSeparated.text;
      
      console.log(`🎯 [最终分离] 纯文本长度: ${finalText.length}, 文件数量: ${finalFiles.length}`);
      
      // 🔧 修复：如果分离没得到文件，尝试JSON解析器结果或使用备用方案
      if (finalFiles.length === 0) {
        console.log('⚠️ [流式AI调用] 内容分离未得到文件，尝试其他方案');
        
                 // 尝试JSON解析器结果
         let jsonParserFiles = jsonParser.getAllFiles();
         if (jsonParserFiles.length > 0) {
           finalFiles = jsonParserFiles.map(file => ({
             filename: file.filename,
             content: file.content,
             language: file.language || 'text',
             description: file.description || `生成的${file.language || 'text'}文件`
           }));
           console.log('✅ [JSON解析器] 获得', finalFiles.length, '个文件');
        } else {
          // 最后的备用方案
          console.log('🤖 [备用方案] 使用回退文件生成器...');
          const fallbackFiles = this.generateFallbackFiles(userInput);
          finalFiles = fallbackFiles;
          console.log('✅ [备用方案] 生成了', finalFiles.length, '个备用文件');
        }
      }
      
      console.log('🤖 [流式AI调用] 步骤5: 解析完成，得到', finalFiles.length, '个文件');
      
      // 🔧 调试：打印最终文件信息
      finalFiles.forEach((file, index) => {
        console.log(`📄 [最终文件${index + 1}] ${file.filename} (${file.language}) - 内容长度: ${file.content?.length || 0}`);
      });
      
      // 步骤3: 完成响应
      yield this.createThinkingResponse('✨ 代码生成完成！', 100);

      yield this.createResponse({
        immediate_display: {
          reply: `🎉 AI代码生成完成！已为您创建了一个完整的项目，包含 ${finalFiles.length} 个文件。`,
          agent_name: this.name,
          timestamp: new Date().toISOString()
        },
        system_state: {
          intent: 'project_complete',
          done: true,
          progress: 100,
          current_stage: '项目生成完成',
          metadata: {
            streaming: false,
            message_id: messageId,
            stream_type: 'complete',
            is_final: true,
            expertMode: true,
            projectGenerated: true,
            totalFiles: finalFiles.length,
            generatedAt: new Date().toISOString(),
            projectFiles: finalFiles,
            userRequest: userInput,
            hasCodeFiles: true,
            codeFilesReady: true,
            // 🆕 所有文件创建完成
            fileCreationProgress: finalFiles.map((file: any) => ({
              filename: file.filename,
              status: 'completed',
              progress: 100,
              size: file.content.length
            }))
          }
        }
      });

      // 更新会话数据
      this.updateSessionWithProject(sessionData, finalFiles);
      
    } catch (error) {
      console.error('❌ [流式AI生成错误]:', error);
      throw error;
    }
  }

  /**
   * 📊 增量AI生成处理 - 用于已有项目的修改
   */
  private async* handleIncrementalAIGeneration(
    userInput: string, 
    sessionData: SessionData,
    context?: Record<string, any>
  ): AsyncGenerator<StreamableAgentResponse, void, unknown> {
    try {
      console.log('📊 [增量AI调用] 开始增量修改处理...');
      
      // 动态导入
      const { generateStreamWithModel } = await import('@/lib/ai-models');
      const { getIncrementalEditPrompt, INCREMENTAL_EDIT_TOOLS } = await import('@/lib/prompts/coding/incremental-edit');
      
      // 🔧 获取当前项目文件信息
      const existingFiles = (sessionData?.metadata as any)?.projectFiles || [];
      const projectContext = {
        projectType: (sessionData?.metadata as any)?.projectType || 'react',
        framework: (sessionData?.metadata as any)?.framework || 'Next.js',
        totalFiles: existingFiles.length,
        lastModified: new Date().toISOString()
      };
      
      console.log('📊 [项目上下文] 文件数量:', existingFiles.length);
      
      // 🎯 使用新的增量编辑prompt
      const fileStructure = existingFiles.map((f: any) => `${f.filename}: ${f.type || 'file'}`).join('\n');
      const targetFiles = existingFiles.map((f: any) => f.filename).join(', ');
      const contextInfo = JSON.stringify(projectContext, null, 2);
      
      const incrementalPrompt = getIncrementalEditPrompt(
        fileStructure,
        userInput,
        targetFiles,
        contextInfo
      );
      
      console.log('📊 [增量Prompt] 长度:', incrementalPrompt.length);

      const messageId = `incremental-${Date.now()}`;
      let chunkCount = 0;
      let accumulatedResponse = '';
      // 🆕 增加增量模式的文本累积器
      let lastSentTextLength = 0;

      // 🔧 使用专门的增量编辑系统prompt
      const systemPrompt = `你是一个专业的全栈开发工程师和代码助手，专门处理已有项目的增量修改。

## 重要指令：
1. 仔细分析用户的真实意图
2. 基于现有项目状态提供建议和执行工具调用
3. 使用提供的工具来执行文件操作
4. 每次工具调用都要提供清晰的说明

## 工作模式：
- 当前处于项目增量修改模式
- 用户已有一个正在开发的项目
- 你需要分析需求并执行适当的工具调用

## 工具使用指南：
- write_to_file: 创建或更新文件
- read_file: 读取文件内容
- execute_command: 执行命令
- list_files: 列出文件

请基于用户请求执行适当的操作。`;

      // 🆕 流式调用AI模型，支持工具定义
      for await (const chunk of generateStreamWithModel(
        'claude',
        'claude-sonnet-4-20250514',
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: incrementalPrompt }
        ],
        { 
          maxTokens: 8000,
          // 🆕 添加工具定义支持
          tools: INCREMENTAL_EDIT_TOOLS
        }
      )) {
        chunkCount++;
        accumulatedResponse += chunk;
        
        console.log(`📊 [增量流式] 第${chunkCount}个块，新增长度: ${chunk.length}`);
        
        // 🔧 关键修复：对增量模式也进行文本和代码分离
        const separated = this.separateTextAndCode(accumulatedResponse);
        const pureText = separated.text;
        const extractedFiles = separated.codeFiles;
        
        // 🔧 计算新增的纯文本内容（增量发送）
        const newTextToSend = pureText.substring(lastSentTextLength);
        lastSentTextLength = pureText.length;
        
        console.log(`📊 [增量内容分离] 纯文本长度: ${pureText.length}, 新增文本: ${newTextToSend.length}, 提取文件: ${extractedFiles.length}`);
        console.log(`📝 [增量文本预览] "${newTextToSend.substring(0, 100)}${newTextToSend.length > 100 ? '...' : ''}"`); // 🔧 只输出分离后的文本预览
        
        // 🔧 详细检查：如果新增文本包含代码块标记，输出警告
        if (newTextToSend.includes('```') || newTextToSend.includes('typescript:') || newTextToSend.includes('json:')) {
          console.error('❌ [增量分离失败] 新增文本仍包含代码块标记！');
          console.error('❌ [增量分离失败] 新增文本内容:', newTextToSend);
        }
        
        // 🔧 关键修复：只发送分离后的纯文本内容到对话框
        yield this.createResponse({
          immediate_display: {
            reply: newTextToSend, // 🔧 只发送纯文本，不包含代码块
            agent_name: this.name,
            timestamp: new Date().toISOString()
          },
          system_state: {
            intent: 'incremental_editing',
            done: false,
            progress: Math.min(85, 20 + Math.floor(chunkCount / 3) * 10),
            current_stage: `正在处理增量修改... (${chunkCount} 块)`,
            metadata: {
              streaming: true,
              message_id: messageId,
              chunk_count: chunkCount,
              is_update: chunkCount > 1,
              latest_chunk: newTextToSend, // 🔧 关键修复：传递分离后的纯文本，而不是原始chunk
              mode: 'incremental',
              // 🆕 明确标识为增量内容
              content_mode: 'incremental',
              stream_type: chunkCount === 1 ? 'start' : 'delta',
              agent_type: 'CodingAgent',
              // 🔧 保持现有文件信息
              hasCodeFiles: existingFiles.length > 0 || extractedFiles.length > 0,
              codeFilesReady: existingFiles.length > 0 || extractedFiles.length > 0,
              projectFiles: existingFiles.length > 0 ? existingFiles : extractedFiles.map(f => ({
                filename: f.filename,
                content: f.content,
                description: f.description || `增量生成的${f.language}文件`,
                language: f.language,
                type: 'file'
              })),
              totalFiles: existingFiles.length > 0 ? existingFiles.length : extractedFiles.length,
              // 🆕 增量编辑特有信息
              userRequest: userInput,
              projectContext: projectContext,
              accumulatedResponse: pureText.substring(0, 200) + '...', // 🔧 使用分离后的纯文本
              // 🆕 工具调用支持
              toolsAvailable: INCREMENTAL_EDIT_TOOLS.map(t => t.name),
              supportsToolCalls: true,
              // 🆕 新文件检测
              hasNewFiles: extractedFiles.length > 0,
              newFilesCount: extractedFiles.length
            }
          }
        });
      }
      
      console.log('📊 [增量AI调用] 流式修改完成，总块数:', chunkCount);
      
      // 🔧 发送完成响应
      yield this.createResponse({
        immediate_display: {
          reply: '\n\n---\n\n✅ **增量修改处理完成**\n\n如果您需要进一步的修改，请告诉我具体的需求。', 
          agent_name: this.name,
          timestamp: new Date().toISOString()
        },
        system_state: {
          intent: 'incremental_complete',
          done: true,
          progress: 100,
          current_stage: '增量修改完成',
          metadata: {
            streaming: false,
            message_id: messageId,
            is_final: true,
            mode: 'incremental',
            totalChunks: chunkCount,
            // 🔧 保持现有文件信息
            hasCodeFiles: existingFiles.length > 0,
            codeFilesReady: existingFiles.length > 0,
            projectFiles: existingFiles,
            totalFiles: existingFiles.length,
            incrementalComplete: true,
            finalResponse: accumulatedResponse.substring(0, 500) + '...',
            // 🆕 工具调用结果
            toolsUsed: [], // 这里可以记录实际使用的工具
            toolCallsSupported: true
          }
        }
      });
      
    } catch (error) {
      console.error('❌ [增量AI生成错误]:', error);
      
      // 🔧 重新抛出错误，让上层处理
      throw error;
    }
  }

  /**
   * 🆕 分离文本和代码的核心方法
   */
  private separateTextAndCode(content: string): {
    text: string;
    codeFiles: CodeFile[];
  } {
    console.log('🚨🚨🚨 [CRITICAL] separateTextAndCode 方法被调用！');
    console.log('🚨🚨🚨 [CRITICAL] 输入内容长度:', content.length);
    console.log('🚨🚨🚨 [CRITICAL] 输入内容前200字符:', content.substring(0, 200));
    
    // 首先尝试提取代码块
    const codeFiles = this.extractCodeBlocksFromText(content);
    
    // 移除所有代码块，保留纯文本
    let textOnly = content;
    
    // 🔧 精确的代码块匹配模式 - 按优先级排序，避免重复匹配
    const codeBlockPatterns = [
      // 1. 完整的代码块（最高优先级）
      /```[\w]*[\s\S]*?```/g,
      // 2. 不完整的代码块（只有开始，没有结束）
      /```[\w]*[\s\S]*$/g,
      // 3. 行内代码（单个反引号）
      /`[^`\n]+`/g,
    ];
    
    // 4. 文件名和格式标记模式（在代码块移除后处理）
    const fileNamePatterns = [
      // 形如 "typescript:app/page.tsx" 的前缀行
      /^[\w]+:[^\n]+$/gm,
      // 形如 "## app/page.tsx" 的标题行
      /^##?\s+[^\n]*\.[^\n]*$/gm,
      // 形如 "**文件名.ext**" 的粗体文件名
      /\*\*[^*]*\.[^*]+\*\*/g,
      // 形如 "文件名.ext:" 的文件名标记
      /^[^\n:]+\.[^\n:]+:\s*$/gm,
    ];
    
    // 🔧 分步骤精确移除
    console.log('🔧 [分离步骤1] 移除代码块');
    codeBlockPatterns.forEach((pattern, index) => {
      const beforeLength = textOnly.length;
      textOnly = textOnly.replace(pattern, '');
      const afterLength = textOnly.length;
      console.log(`🔧 [模式${index + 1}] 移除了 ${beforeLength - afterLength} 个字符`);
    });
    
    console.log('🔧 [分离步骤2] 移除文件名标记');
    fileNamePatterns.forEach((pattern, index) => {
      const beforeLength = textOnly.length;
      textOnly = textOnly.replace(pattern, '');
      const afterLength = textOnly.length;
      console.log(`🔧 [文件名模式${index + 1}] 移除了 ${beforeLength - afterLength} 个字符`);
    });
    
    // 🔧 更严格的文本清理
    textOnly = textOnly
      .replace(/\n{3,}/g, '\n\n')           // 合并多余换行
      .replace(/^\s+|\s+$/g, '')            // 移除首尾空白
      .replace(/\s*\n\s*/g, '\n')           // 规范化换行
      .replace(/\s{2,}/g, ' ')              // 合并多余空格
      .replace(/^\n+|\n+$/g, '')            // 移除开头结尾换行
      .trim();
    
    // 🔧 移除只包含特殊字符的行
    textOnly = textOnly
      .split('\n')
      .filter(line => {
        const cleaned = line.trim();
        // 过滤掉只包含特殊字符、数字、文件扩展名等的行
        if (!cleaned) return false;
        if (/^[`#*\-_=\s]*$/.test(cleaned)) return false;  // 只有标记符号
        if (/^\d+\.\s*$/.test(cleaned)) return false;      // 只有数字和点
        if (/^[.\w]+\.(ts|tsx|js|jsx|json|css|html|md)$/i.test(cleaned)) return false; // 只有文件名
        return true;
      })
      .join('\n')
      .trim();
    
    // 如果文本为空，生成默认说明
    if (!textOnly && codeFiles.length > 0) {
      textOnly = `我正在为您生成一个完整的项目，包含 ${codeFiles.length} 个文件。\n\n项目结构：\n${codeFiles.map(f => `• ${f.filename}`).join('\n')}`;
    }
    
    // 🔧 最后一次检查，确保没有遗漏的代码块格式
    if (textOnly.includes('```') || textOnly.includes('typescript:') || textOnly.includes('json:')) {
      console.warn('⚠️ [文本分离] 检测到可能遗漏的代码格式，进行最后清理');
      textOnly = textOnly
        .replace(/```[\s\S]*?```/g, '')     // 再次移除任何遗漏的代码块
        .replace(/\w+:[^\s\n]+[\s\S]*?(?=\n\n|\n$|$)/g, '')  // 移除语言:文件名格式
        .replace(/\n{2,}/g, '\n\n')         // 规范化换行
        .trim();
    }
    
    return {
      text: textOnly,
      codeFiles: codeFiles
    };
  }

  /**
   * 解析AI代码响应
   */
  private parseAICodeResponse(response: string): CodeFile[] {
    try {
      let responseText = response;
      
      // 🔧 如果响应是包含text字段的对象，先提取text内容
      if (typeof response === 'string' && response.startsWith('{"text":')) {
        try {
          const responseObj = JSON.parse(response);
          if (responseObj.text) {
            responseText = responseObj.text;
            console.log('🤖 [响应解析] 从响应对象中提取text字段，长度:', responseText.length);
          }
        } catch (e) {
          console.log('🤖 [响应解析] 响应对象解析失败，使用原始响应');
        }
      }
      
      // 🔧 然后尝试提取JSON代码块（处理```json格式）
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/i);
      let jsonText = responseText;
      
      if (jsonMatch) {
        jsonText = jsonMatch[1].trim();
        console.log('🤖 [JSON提取] 从markdown代码块中提取JSON，长度:', jsonText.length);
      } else {
        console.log('🤖 [JSON提取] 未找到markdown代码块，直接解析响应');
      }
      
      // 🔧 清理可能的转义字符问题
      jsonText = jsonText.replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\\\/g, '\\');
      
      // 尝试解析JSON响应
      const parsed = JSON.parse(jsonText);
      
      if (parsed.files && Array.isArray(parsed.files)) {
        console.log('🤖 [JSON解析] 成功解析JSON格式，包含', parsed.files.length, '个文件');
        return parsed.files.map((file: any) => ({
          filename: file.filename || 'unknown.txt',
          content: file.content || '',
          description: file.description || '生成的文件',
          language: file.language || 'text'
        }));
      }
      
      // 如果不是标准格式，尝试其他解析方式
      return this.parseAlternativeFormat(response);
      
    } catch (error) {
      console.error('🤖 [解析错误] JSON解析失败:', error);
      console.log('🤖 [解析错误] 尝试的JSON文本预览:', response.substring(0, 300));
      
      // 尝试从文本中提取代码块
      return this.extractCodeBlocksFromText(response);
    }
  }

  /**
   * 解析备用格式
   */
  private parseAlternativeFormat(response: string): CodeFile[] {
    console.log('🤖 [备用解析] 尝试备用格式解析...');
    return this.extractCodeBlocksFromText(response);
  }

  /**
   * 从文本中提取代码块
   */
  private extractCodeBlocksFromText(text: string): CodeFile[] {
    const files: CodeFile[] = [];
    
    console.log('🤖 [代码块提取] 开始分析文本，长度:', text.length);
    console.log('🤖 [代码块提取] 文本预览:', text.substring(0, 200));
    
    // 🔧 简单测试：检查文本中是否包含代码块标记
    const hasCodeBlocks = text.includes('```');
    const hasColonFormat = /```\w+:[^\s]+/.test(text);
    console.log(`🔍 [格式检测] 包含代码块: ${hasCodeBlocks}, 包含冒号格式: ${hasColonFormat}`);
    
    if (hasColonFormat) {
      // 找到第一个冒号格式的示例
      const colonMatch = text.match(/```(\w+):([^\s\n]+)/);
      if (colonMatch) {
        console.log(`🎯 [格式示例] 找到冒号格式: ${colonMatch[0]}, 语言: ${colonMatch[1]}, 文件名: ${colonMatch[2]}`);
      }
    }
    
    // 🔧 改进的代码块匹配模式
    const patterns = [
      // 🆕 模式1: ```typescript:app/page.tsx 或 ```json:package.json (新的推荐格式，优先匹配)
      /```(\w+):([^\n\s]+)[\s\S]*?\n([\s\S]*?)```/gi,
      // 🆕 模式1b: ```json:package.json { (紧接着内容的格式)
      /```(\w+):([^\n\s]+)\s*\{([\s\S]*?)\}[\s\S]*?```/gi,
      // 🆕 模式1c: ```typescript:app/page.tsx export (紧接着内容的格式)
      /```(\w+):([^\n\s]+)\s*([\s\S]*?)```/gi,
      // 模式2: ```typescript filename="app/page.tsx"
      /```(\w+)\s+filename="([^"]+)"\s*\n([\s\S]*?)```/gi,
      // 模式3: ```app/page.tsx  (直接使用文件名作为语言标识)
      /```([^\s\n]+\.[^\s\n]+)\s*\n([\s\S]*?)```/gi,
      // 模式4: ```typescript (标准代码块，需要推断文件名)
      /```(\w+)?\s*\n([\s\S]*?)```/gi,
      // 🆕 模式5: **文件名** (markdown标题格式)
      /\*\*([^*]+\.[^*]+)\*\*\s*```(\w+)?\s*\n([\s\S]*?)```/gi,
      // 🆕 模式6: ## 文件名 (markdown标题格式)
      /##\s+([^\n]+\.[^\n]+)\s*```(\w+)?\s*\n([\s\S]*?)```/gi,
      // 🆕 模式7: 文件名: (冒号分隔格式)
      /([^\n:]+\.[^\n:]+):\s*```(\w+)?\s*\n([\s\S]*?)```/gi
    ];
    
    for (let patternIndex = 0; patternIndex < patterns.length; patternIndex++) {
      const regex = patterns[patternIndex];
      let match;
      regex.lastIndex = 0; // 重置正则表达式索引
      
      console.log(`🔍 [模式${patternIndex + 1}] 开始匹配...`);
      
      while ((match = regex.exec(text)) !== null) {
        let filename: string | undefined, content: string | undefined, language: string | undefined;
        
        console.log(`✅ [模式${patternIndex + 1}] 匹配成功! 匹配组数: ${match.length}, 匹配内容预览: "${match[0].substring(0, 100)}..."`);
        
        if (patternIndex === 0) {
          // 🆕 模式1: ```typescript:app/page.tsx
          [, language, filename, content] = match;
        } else if (patternIndex === 1) {
          // 🆕 模式1b: ```json:package.json {
          [, language, filename, content] = match;
          content = '{' + content + '}'; // 🔧 补回大括号
        } else if (patternIndex === 2) {
          // 🆕 模式1c: ```typescript:app/page.tsx export
          [, language, filename, content] = match;
        } else if (patternIndex === 3) {
          // 模式2: ```typescript filename="app/page.tsx"
          [, language, filename, content] = match;
        } else if (patternIndex === 4) {
          // 模式3: 文件名作为语言标识
          [, filename, content] = match;
          language = this.getLanguageFromExtension(filename);
        } else if (patternIndex === 5) {
          // 模式4: 标准代码块，需要推断文件名
          [, language, content] = match;
          filename = this.inferFilenameFromContent(content, language || 'text');
        } else if (patternIndex === 6) {
          // 模式5: **文件名**格式
          [, filename, language, content] = match;
          language = language || this.getLanguageFromExtension(filename);
        } else if (patternIndex === 7) {
          // 模式6: ## 文件名格式
          [, filename, language, content] = match;
          language = language || this.getLanguageFromExtension(filename);
        } else if (patternIndex === 8) {
          // 模式7: 文件名:格式
          [, filename, language, content] = match;
          language = language || this.getLanguageFromExtension(filename);
        }
        
        if (filename && content && content.trim().length > 0) {
          // 清理文件名
          filename = filename.trim().replace(/^[#*\s]+|[#*\s]+$/g, '');
          
          // 避免重复添加相同的文件
          if (!files.some(f => f.filename === filename)) {
            const file = {
              filename: filename,
              content: content.trim(),
              description: `从AI响应中提取的${language || ''}文件`,
              language: language || this.getLanguageFromExtension(filename)
            };
            
            files.push(file);
            console.log(`✅ [模式${patternIndex + 1}] 提取文件: ${filename} (${file.language}), 内容长度: ${content.trim().length}`);
          } else {
            console.log(`⚠️ [模式${patternIndex + 1}] 重复文件已跳过: ${filename}`);
          }
        } else {
          console.log(`⚠️ [模式${patternIndex + 1}] 匹配但无效: filename=${filename}, content长度=${content?.length || 0}`);
        }
      }
      
      // 如果已经找到文件，跳出循环
      if (files.length > 0) {
        console.log(`🎉 [代码块提取] 模式${patternIndex + 1}成功提取到${files.length}个文件，停止后续模式匹配`);
        break;
      }
    }
    
    console.log('🤖 [文本提取] 从文本中提取到', files.length, '个代码块');
    
    // 🔧 如果所有模式都没有提取到文件，尝试更宽松的匹配
    if (files.length === 0) {
      console.log('🔧 [宽松匹配] 尝试更宽松的代码块匹配...');
      
      // 查找所有```代码块，不论格式
      const allCodeBlocks = text.match(/```[\s\S]*?```/g);
      if (allCodeBlocks && allCodeBlocks.length > 0) {
        console.log(`🔍 [宽松匹配] 找到${allCodeBlocks.length}个代码块`);
        
        allCodeBlocks.forEach((block, index) => {
          // 提取代码块内容
          const contentMatch = block.match(/```[^\n]*\n([\s\S]*?)```/);
          if (contentMatch) {
            const content = contentMatch[1].trim();
            if (content.length > 10) { // 只处理有意义的代码块
              const filename = this.inferFilenameFromContent(content, 'auto');
              files.push({
                filename: `extracted-${index + 1}-${filename}`,
                content: content,
                description: `从第${index + 1}个代码块提取的文件`,
                language: this.getLanguageFromExtension(filename)
              });
              console.log(`✅ [宽松匹配] 提取代码块${index + 1}: ${filename}, 内容长度: ${content.length}`);
            }
          }
        });
      }
    }
    
    // 如果没有提取到文件，返回回退文件
    if (files.length === 0) {
      console.log('🤖 [文本提取] 未找到代码块，使用回退方案');
      return this.generateFallbackFiles(text.substring(0, 100));
    }
    
    return files;
  }

  /**
   * 从文件扩展名推断语言
   */
  private getLanguageFromExtension(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      'ts': 'typescript',
      'tsx': 'typescript',
      'js': 'javascript',
      'jsx': 'javascript',
      'json': 'json',
      'css': 'css',
      'html': 'html',
      'md': 'markdown',
      'yml': 'yaml',
      'yaml': 'yaml'
    };
    return langMap[ext || ''] || 'text';
  }

  /**
   * 从内容推断文件名
   */
  private inferFilenameFromContent(content: string, language: string): string {
    // 🔧 增强内容分析逻辑
    const lowerContent = content.toLowerCase();
    
    // React/Next.js 组件识别
    if (content.includes('export default function') && content.includes('HomePage')) {
      return 'app/page.tsx';
    }
    if (content.includes('export default function') && content.includes('RootLayout')) {
      return 'app/layout.tsx';
    }
    if (content.includes('export default function') && lowerContent.includes('about')) {
      return 'app/about/page.tsx';
    }
    if (content.includes('export default function') && lowerContent.includes('contact')) {
      return 'app/contact/page.tsx';
    }
    
    // 配置文件识别
    if (content.includes('"name":') && content.includes('"version":') && content.includes('"scripts":')) {
      return 'package.json';
    }
    if (content.includes('tailwind') && content.includes('config')) {
      return 'tailwind.config.js';
    }
    if (content.includes('/** @type {import(\'tailwindcss\').Config} */')) {
      return 'tailwind.config.js';
    }
    if (content.includes('next.config') || content.includes('nextConfig')) {
      return 'next.config.js';
    }
    
    // 样式文件识别
    if (content.includes('@tailwind base') || content.includes('@tailwind components')) {
      return 'app/globals.css';
    }
    if (lowerContent.includes('.module.css') || content.includes('styles.module')) {
      return 'styles/components.module.css';
    }
    
    // 组件文件识别  
    if (content.includes('export default function') || content.includes('export const')) {
      // 尝试从函数名推断
      const functionMatch = content.match(/export default function (\w+)/);
      if (functionMatch) {
        const funcName = functionMatch[1];
        if (funcName !== 'HomePage' && funcName !== 'RootLayout') {
          return `components/${funcName}.tsx`;
        }
      }
    }
    
    // 工具函数识别
    if (content.includes('export function') || content.includes('export const')) {
      return 'lib/utils.ts';
    }
    
    // 类型定义识别
    if (content.includes('export interface') || content.includes('export type')) {
      return 'types/index.ts';
    }
    
    // API路由识别
    if (content.includes('NextRequest') || content.includes('NextResponse')) {
      return 'app/api/route.ts';
    }
    
    // 环境配置识别
    if (content.includes('NEXT_PUBLIC_') || content.includes('DATABASE_URL')) {
      return '.env.local';
    }
    
    // README识别
    if (content.includes('# ') && content.includes('## ') && lowerContent.includes('install')) {
      return 'README.md';
    }
    
    // 🆕 基于语言类型的默认文件名
    const ext = this.getExtensionFromLanguage(language);
    
    // 如果是自动推断模式，尝试更智能的命名
    if (language === 'auto') {
      if (content.includes('function') || content.includes('const') || content.includes('import')) {
        return `generated-file.tsx`;
      }
      if (content.includes('{') && content.includes('}') && content.includes(':')) {
        return `generated-file.json`;
      }
      if (content.includes('color:') || content.includes('background:') || content.includes('.class')) {
        return `generated-file.css`;
      }
    }
    
    return `generated-file.${ext}`;
  }
  
  /**
   * 🆕 根据语言获取文件扩展名
   */
  private getExtensionFromLanguage(language: string): string {
    const langMap: Record<string, string> = {
      'typescript': 'tsx',
      'javascript': 'jsx',
      'json': 'json',
      'css': 'css',
      'html': 'html',
      'markdown': 'md',
      'yaml': 'yml',
      'auto': 'tsx'
    };
    return langMap[language] || 'txt';
  }

  /**
   * 生成回退文件
   */
  private generateFallbackFiles(userInput: string): CodeFile[] {
    console.log('🤖 [回退生成] 使用回退文件生成器...');
    
    const projectType = this.determineProjectType(userInput);
    const projectTitle = this.getProjectTitle(projectType, userInput);
    
    return [
      {
        filename: 'package.json',
        content: JSON.stringify({
          name: 'ai-generated-project',
          version: '1.0.0',
          description: `基于"${userInput}"生成的${projectTitle}项目`,
          scripts: {
            dev: 'next dev',
            build: 'next build',
            start: 'next start',
            lint: 'next lint'
          },
          dependencies: {
            'next': '^15.0.0',
            'react': '^18.2.0',
            'react-dom': '^18.2.0',
            'typescript': '^5.0.0',
            'tailwindcss': '^3.3.0'
          }
        }, null, 2),
        description: '项目配置文件',
        language: 'json'
      },
      {
        filename: 'app/page.tsx',
        content: `export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">
          ${projectTitle}
        </h1>
        <p className="text-lg text-gray-600">
          这是基于您的需求"${userInput}"生成的项目。
        </p>
      </div>
    </div>
  );
}`,
        description: '主页面组件',
        language: 'typescript'
      },
      {
        filename: 'app/layout.tsx',
        content: `import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '${projectTitle}',
  description: '基于AI生成的现代化网站',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}`,
        description: '应用布局文件',
        language: 'typescript'
      },
      {
        filename: 'app/globals.css',
        content: `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}`,
        description: '全局样式文件',
        language: 'css'
      },
      {
        filename: 'tailwind.config.js',
        content: `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`,
        description: 'Tailwind CSS配置',
        language: 'javascript'
      }
    ];
  }

  /**
   * 判断是否为专业模式
   */
  private isExpertMode(sessionData?: SessionData, context?: Record<string, any>): boolean {
    // 1. 优先检查context中的强制模式标记
    if (context?.forceExpertMode || context?.expertMode || context?.testMode) {
      console.log('🎯 [模式判断] Context中指定为专业模式:', context);
      return true;
    }
    
    // 2. 检查会话状态 - 如果当前阶段不是 code_generation，说明是直接调用
    if (sessionData?.metadata?.progress?.currentStage !== 'code_generation') {
      console.log('🎯 [模式判断] 非code_generation阶段，使用专业模式');
      return true;
    }
    
    // 3. 检查是否来自prompt-output阶段（正常流程）
    const hasDesignData = sessionData?.collectedData && 
                         Object.keys(sessionData.collectedData).some(key => {
                           const data = (sessionData.collectedData as any)[key];
                           return data && typeof data === 'object' && Object.keys(data).length > 0;
                         });
    
    if (hasDesignData) {
      console.log('🎯 [模式判断] 有设计数据，使用正常流程模式');
      return false; // 有设计数据，说明是正常流程
    }
    
    // 默认为专业模式
    console.log('🎯 [模式判断] 默认使用专业模式');
    return true;
  }

  /**
   * 项目类型判断
   */
  private determineProjectType(userInput: string): string {
    if (userInput.includes('简历') || userInput.includes('resume')) return 'resume';
    if (userInput.includes('作品集') || userInput.includes('portfolio')) return 'portfolio';
    if (userInput.includes('博客') || userInput.includes('blog')) return 'blog';
    if (userInput.includes('商城') || userInput.includes('shop')) return 'ecommerce';
    if (userInput.includes('登录') || userInput.includes('注册')) return 'auth';
    return 'website';
  }

  /**
   * 获取项目标题
   */
  private getProjectTitle(projectType: string, userInput: string): string {
    const titles: Record<string, string> = {
      resume: '个人简历网站',
      portfolio: '个人作品集',
      blog: '个人博客',
      ecommerce: '电商网站',
      auth: '用户认证系统',
      website: '网站项目'
    };
    
    return titles[projectType] || '网站项目';
  }

  /**
   * 创建思考响应
   */
  protected createThinkingResponse(message: string, progress: number): StreamableAgentResponse {
    return {
      immediate_display: {
        reply: message,
        agent_name: this.name,
        timestamp: new Date().toISOString()
      },
      system_state: {
        intent: 'thinking',
        done: false,
        progress,
        current_stage: message
      }
    };
  }

  /**
   * 更新会话数据
   */
  private updateSessionWithProject(sessionData: SessionData, files: CodeFile[]): void {
    if (sessionData.metadata) {
      (sessionData.metadata as any).generatedProject = {
        files,
        generatedAt: new Date().toISOString(),
        totalFiles: files.length
      };
    }
  }

  /**
   * 延迟函数
   */
  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
} 