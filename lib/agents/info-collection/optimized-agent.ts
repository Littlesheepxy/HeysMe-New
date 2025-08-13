import { BaseAgent } from '../base-agent';
import { StreamableAgentResponse, AgentCapabilities } from '@/lib/types/streaming';
import { SessionData } from '@/lib/types/session';
import { generateStreamWithModel } from '@/lib/ai-models';
import { formatPrompt } from '@/lib/prompts';
import { OPTIMIZED_INFO_COLLECTION_PROMPT } from '@/lib/prompts/info-collection/optimized-agent';
import { cleanTextContent } from '@/lib/utils';
import { 
  CLAUDE_INFO_COLLECTION_TOOLS, 
  TOOL_EXECUTORS, 
  executeToolsInParallel,
  formatToolResult 
} from './claude-tools';

// 🆕 添加隐藏控制信息处理相关的类型定义
interface InfoCollectionHiddenControl {
  collection_status: 'CONTINUE' | 'READY_TO_ADVANCE' | 'NEED_CLARIFICATION';
  user_type: 'trial_user' | 'information_rich' | 'guided_discovery';
  collected_data: {
    core_identity?: string;
    key_skills?: string[];
    achievements?: string[];
    values?: string[];
    goals?: string[];
  };
  tool_calls?: Array<{
    tool: string;
    status: 'pending' | 'success' | 'failed';
    result: string;
  }>;
  confidence_level: 'HIGH' | 'MEDIUM' | 'LOW';
  reasoning: string;
  next_focus?: string;
  collection_summary?: string;
}

interface StreamContentSeparation {
  visibleContent: string;
  hiddenControl: InfoCollectionHiddenControl | null;
  isComplete: boolean;
}

// 🆕 流式内容处理器 - 分离可见内容和隐藏控制信息
class InfoCollectionStreamProcessor {
  private accumulatedContent = '';
  private lastVisibleContent = '';
  
  processChunk(chunk: string): {
    newVisibleContent: string;
    hiddenControl: InfoCollectionHiddenControl | null;
    isComplete: boolean;
  } {
    this.accumulatedContent += chunk;
    
    const separation = this.separateVisibleAndHiddenContent(this.accumulatedContent);
    
    // 计算新增的可见内容
    const newVisibleContent = separation.visibleContent.slice(this.lastVisibleContent.length);
    this.lastVisibleContent = separation.visibleContent;
    
    return {
      newVisibleContent,
      hiddenControl: separation.hiddenControl,
      isComplete: separation.isComplete
    };
  }
  
  getCurrentVisibleContent(): string {
    return this.lastVisibleContent;
  }
  
  reset(): void {
    this.accumulatedContent = '';
    this.lastVisibleContent = '';
  }
  
  /**
   * 分离可见内容和隐藏控制信息
   */
  private separateVisibleAndHiddenContent(content: string): StreamContentSeparation {
    const patterns = [
      /```HIDDEN_CONTROL\s*([\s\S]*?)\s*```/,
      /HIDDEN_CONTROL\s*([\s\S]*?)(?=\n\n|$)/
    ];
    
    let match: RegExpMatchArray | null = null;
    
    // 尝试各种模式
    for (const pattern of patterns) {
      match = content.match(pattern);
      if (match) break;
    }
    
    if (match) {
      // 🔧 修复：分离可见内容并清理空行
      const beforeHidden = content.substring(0, match.index || 0);
      const afterHidden = content.substring((match.index || 0) + match[0].length);
      const cleanVisibleContent = this.cleanupContent(beforeHidden + afterHidden);
      
      // 提取JSON字符串
      const jsonStr = match[1].trim();
      
      if (jsonStr) {
        try {
          // 检查JSON是否完整
          if (!this.isCompleteJSON(jsonStr)) {
            return {
              visibleContent: cleanVisibleContent,
              hiddenControl: null,
              isComplete: false
            };
          }
          
          const hiddenJson = JSON.parse(jsonStr);
          const hiddenControl: InfoCollectionHiddenControl = {
            collection_status: hiddenJson.collection_status || 'CONTINUE',
            user_type: hiddenJson.user_type || 'guided_discovery',
            collected_data: hiddenJson.collected_data || {},
            tool_calls: hiddenJson.tool_calls || [],
            confidence_level: hiddenJson.confidence_level || 'MEDIUM',
            reasoning: hiddenJson.reasoning || '默认推理',
            next_focus: hiddenJson.next_focus,
            collection_summary: hiddenJson.collection_summary
          };
          
          return {
            visibleContent: cleanVisibleContent,
            hiddenControl,
            isComplete: true
          };
        } catch (error) {
          console.warn('⚠️ [隐藏控制信息解析失败]:', error);
          
          // 尝试修复JSON
          const fixedJson = this.tryFixJSON(jsonStr);
          if (fixedJson) {
            try {
              const hiddenJson = JSON.parse(fixedJson);
              const hiddenControl: InfoCollectionHiddenControl = {
                collection_status: hiddenJson.collection_status || 'CONTINUE',
                user_type: hiddenJson.user_type || 'guided_discovery',
                collected_data: hiddenJson.collected_data || {},
                tool_calls: hiddenJson.tool_calls || [],
                confidence_level: hiddenJson.confidence_level || 'MEDIUM',
                reasoning: hiddenJson.reasoning || '修复后的默认推理',
                next_focus: hiddenJson.next_focus,
                collection_summary: hiddenJson.collection_summary
              };
              
              return {
                visibleContent: cleanVisibleContent,
                hiddenControl,
                isComplete: true
              };
            } catch (fixError) {
              console.warn('⚠️ [JSON修复也失败了]:', fixError);
            }
          }
        }
      }
    }
    
    // 没有找到隐藏控制信息，返回清理后的原始内容
    return {
      visibleContent: this.cleanupContent(content),
      hiddenControl: null,
      isComplete: false
    };
  }
  
  /**
   * 🔧 使用全局内容清理函数
   */
  private cleanupContent(content: string): string {
    return cleanTextContent(content);
  }
  
  /**
   * 检查JSON字符串是否完整
   */
  private isCompleteJSON(jsonStr: string): boolean {
    const trimmed = jsonStr.trim();
    
    if (!trimmed.startsWith('{')) {
      return false;
    }
    
    let braceCount = 0;
    let inString = false;
    let escaped = false;
    
    for (let i = 0; i < trimmed.length; i++) {
      const char = trimmed[i];
      
      if (escaped) {
        escaped = false;
        continue;
      }
      
      if (char === '\\') {
        escaped = true;
        continue;
      }
      
      if (char === '"') {
        inString = !inString;
        continue;
      }
      
      if (!inString) {
        if (char === '{') {
          braceCount++;
        } else if (char === '}') {
          braceCount--;
        }
      }
    }
    
    return braceCount === 0 && trimmed.endsWith('}');
  }
  
  /**
   * 尝试修复常见的JSON问题
   */
  private tryFixJSON(jsonStr: string): string | null {
    try {
      let fixed = jsonStr.trim();
      
      // 修复1：移除末尾的逗号
      fixed = fixed.replace(/,(\s*[}\]])/g, '$1');
      
      // 修复2：确保字符串值被正确引用
      fixed = fixed.replace(/:\s*([^",{}\[\]]+)(?=\s*[,}])/g, (match, value) => {
        const trimmedValue = value.trim();
        if (!/^(true|false|null|\d+(\.\d+)?)$/.test(trimmedValue)) {
          return `: "${trimmedValue}"`;
        }
        return match;
      });
      
      // 验证修复后的JSON
      JSON.parse(fixed);
      return fixed;
      
    } catch (error) {
      return null;
    }
  }
}

/**
 * 优化的信息收集Agent - 支持隐藏控制信息和Claude标准工具调用
 */
export class OptimizedInfoCollectionAgent extends BaseAgent {
  constructor() {
    const capabilities: AgentCapabilities = {
      canStream: true,
      requiresInteraction: false,
      outputFormats: ['json'],
      maxRetries: 3,
      timeout: 30000
    };
    
    super('OptimizedInfoCollectionAgent', capabilities);
  }

  /**
   * 主处理流程 - 支持隐藏控制信息和Claude工具调用的流式对话
   */
  async* process(
    input: { user_input: string },
    sessionData: SessionData,
    context?: Record<string, any>
  ): AsyncGenerator<StreamableAgentResponse, void, unknown> {
    console.log(`\n🎯 [优化信息收集Agent] 开始处理用户输入`);
    console.log(`📝 [用户输入] "${input.user_input}"`);
    
    try {
      // 提取Welcome数据
      const welcomeData = this.extractWelcomeData(sessionData);
      
      // 🆕 检查是否是第一次进入信息收集阶段
      const currentTurn = this.getTurnCount(sessionData);
      const isFirstTime = (currentTurn === 0 && this.isFirstTimeInInfoCollection(sessionData)) || 
                          (input.user_input === '' && this.isFirstTimeInInfoCollection(sessionData));
      
      if (isFirstTime) {
        console.log(`🌟 [首次启动] 这是Info Collection阶段的第一次启动，发送引导消息`);
        yield* this.createWelcomeToInfoCollectionFlow(welcomeData, sessionData);
        return;
      }
      
      // 检查轮次限制
      const maxTurns = this.getMaxTurns(sessionData);
      
      if (currentTurn >= maxTurns) {
        console.log(`⏰ [轮次限制] 已达到最大轮次 ${maxTurns}，强制推进到下一阶段`);
        yield* this.createForceAdvanceResponseStream(sessionData);
        return;
      }
      
      // 增加轮次计数
      this.incrementTurnCount(sessionData);
      
      console.log(`🔄 [轮次信息] 当前第${currentTurn + 1}轮，最大${maxTurns}轮`);
      
      // 显示分析进度
      yield this.createThinkingResponse('🔍 正在分析您提供的信息...', 20);
      
      // 使用流式处理调用Claude分析（支持工具调用）
      yield* this.analyzeInputWithClaudeToolCalling(input.user_input, welcomeData, sessionData);
      
    } catch (error) {
      console.error(`❌ [优化信息收集Agent错误] 处理失败:`, error);
      yield await this.handleError(error as Error, sessionData, context);
    }
  }

  /**
   * 使用Claude标准工具调用进行信息分析
   */
  private async* analyzeInputWithClaudeToolCalling(
    userInput: string,
    welcomeData: any,
    sessionData: SessionData
  ): AsyncGenerator<StreamableAgentResponse, void, unknown> {
    try {
      console.log(`🧠 [Claude工具调用分析] 开始调用Claude进行智能分析`);
      
      // 🚀 检查是否有预解析的文件内容
      const uploadedFiles = this.extractUploadedFiles(userInput);
      const hasPreParsedFiles = uploadedFiles.length > 0;
      const parsedFileContent = uploadedFiles.map(file => 
        `文件名: ${file.name}\n类型: ${file.type}\n内容: ${file.content}`
      ).join('\n\n');

      // 🔗 检查是否有链接需要处理（无论是否有预解析文件）
      const hasLinks = this.detectLinksInInput(userInput);
      const linkInfo = hasLinks ? this.extractLinkInfo(userInput) : '无链接';

      // 🔧 构建系统prompt
      const sessionHistory = this.conversationHistory.get(sessionData.id) || [];
      const turnCount = Math.floor(sessionHistory.length / 2);

      // 构建系统prompt
      const systemPrompt = formatPrompt(OPTIMIZED_INFO_COLLECTION_PROMPT, {
        user_role: welcomeData.user_role || '未知身份',
        use_case: welcomeData.use_case || '个人展示',
        style: welcomeData.style || '简约现代',
        highlight_focus: welcomeData.highlight_focus || '综合展示',
        commitment_level: welcomeData.commitment_level || '认真制作',
        reasoning: welcomeData.reasoning || '基于用户表达分析',
        should_use_samples: welcomeData.should_use_samples || false,
        sample_reason: welcomeData.sample_reason || '根据用户需求判断',
        // 🆕 文件相关信息
        uploaded_files_count: uploadedFiles.length,
        files_pre_parsed: hasPreParsedFiles,
        parsed_file_content: parsedFileContent || '无',
        // 🆕 链接相关信息
        has_links: hasLinks,
        link_info: linkInfo,
        // 原有信息
        collection_priority: welcomeData.collection_priority || 'balanced',
        current_collected_data: JSON.stringify(welcomeData.current_collected_data || {}),
        available_tools: JSON.stringify(welcomeData.available_tools || []),
        context_for_next_agent: welcomeData.context_for_next_agent || '继续信息收集',
        // 轮次信息
        turn_count: turnCount
      });
      
      // 🔧 使用Claude标准工具调用
      const messages = [
        { role: 'user' as const, content: userInput }
      ];

      // 添加对话历史
      const history = this.conversationHistory.get(sessionData.id) || [];
      const fullMessages = [...history, ...messages];

      console.log(`🛠️ [工具调用] 传递 ${CLAUDE_INFO_COLLECTION_TOOLS.length} 个工具给Claude`);
      
      // 首先尝试使用工具调用模式
      let hasToolCalls = false;
      let toolCallResults: any[] = [];
      const messageId = `info-collection-${Date.now()}`;

      try {
        // 🔧 关键修复：将session历史同步到BaseAgent
        const infoCollectionHistory = (sessionData?.metadata as any)?.infoCollectionHistory || [];
        if (!this.conversationHistory.has(sessionData.id)) {
          this.conversationHistory.set(sessionData.id, []);
        }
        const baseAgentHistory = this.conversationHistory.get(sessionData.id)!;
        if (baseAgentHistory.length === 0 && infoCollectionHistory.length > 0) {
          console.log(`🔄 [OptimizedInfo历史同步] 从session恢复 ${infoCollectionHistory.length} 条历史到BaseAgent`);
          baseAgentHistory.push(...infoCollectionHistory);
        }

        // 使用非流式方式获取完整响应以检查工具调用
        const responseData = await this.callLLM(userInput, {
          system: systemPrompt,
          maxTokens: 64000,
          sessionId: sessionData.id,
          useHistory: true
        });

        // 🔧 关键修复：提取实际的文本内容进行工具调用检测
        let response: string;
        if (typeof responseData === 'object' && responseData?.text) {
          response = responseData.text;
        } else if (typeof responseData === 'string') {
          response = responseData;
        } else {
          console.warn(`⚠️ [工具检测异常] 期望文本，实际收到:`, typeof responseData);
          response = String(responseData);
        }

        // 检查响应中是否包含工具调用标记
        const hasToolCallPattern = /\[Tool:(.*?)\]/g;
        const toolMatches = Array.from(response.matchAll(hasToolCallPattern));
        
        if (toolMatches.length > 0) {
          hasToolCalls = true;
          console.log(`🔧 [工具调用检测] 检测到 ${toolMatches.length} 个工具调用`);
          
          yield this.createThinkingResponse('🛠️ 正在执行智能工具分析...', 80);
          
          // 解析并执行工具调用
          toolCallResults = await this.parseAndExecuteTools(response, userInput);
          
          if (toolCallResults.length > 0) {
            // 更新会话数据
            this.updateSessionWithToolResults(sessionData, toolCallResults);
            
            // 基于工具结果生成最终响应
            const finalResponse = await this.generateFinalResponseWithToolResults(
              userInput, systemPrompt, toolCallResults, sessionData
            );
            
            // 发送最终响应
            yield this.createResponse({
              immediate_display: {
                reply: finalResponse,
                agent_name: this.name,
                timestamp: new Date().toISOString()
              },
              system_state: {
                intent: 'collecting',
                done: false,
                progress: 90,
                current_stage: '分析完成',
                metadata: {
                  streaming: false,
                  message_id: messageId,
                  stream_type: 'complete',
                  tool_calls_executed: toolCallResults.length
                }
              }
            });
            
            // 更新对话历史
            this.updateConversationHistory(sessionData, userInput, finalResponse);
          }
        } else {
          // 🔧 关键修复：没有工具调用时，使用流式方式重新生成响应
          console.log(`💬 [流式响应] 无工具调用，使用流式方式生成AI分析结果`);
          
          let accumulatedResponse = '';
          for await (const chunk of this.callLLMStreaming(userInput, {
            system: systemPrompt,
            maxTokens: 64000,
            sessionId: sessionData.id,
            useHistory: true
          })) {
            accumulatedResponse += chunk;
            
            // 发送流式响应块
            yield this.createResponse({
              immediate_display: {
                reply: chunk,
                agent_name: this.name,
                timestamp: new Date().toISOString()
              },
              system_state: {
                intent: 'collecting',
                done: false,
                progress: 80,
                current_stage: '分析中',
                metadata: {
                  streaming: true,
                  message_id: messageId,
                  stream_type: 'chunk',
                  has_tool_calls: false
                }
              }
            });
          }
          
          console.log(`✅ [流式分析完成] 流式分析响应生成完毕，总长度: ${accumulatedResponse.length}`);
          
          // 🔧 流式模式：历史已由BaseAgent自动管理，无需手动更新
        }
      } catch (error) {
        console.error(`❌ [工具调用失败] 回退到普通模式:`, error);
        
        // 🔧 回退模式也需要历史同步（如果前面没有同步）
        const baseAgentHistory = this.conversationHistory.get(sessionData.id)!;
        if (baseAgentHistory.length === 0) {
          const infoCollectionHistory = (sessionData?.metadata as any)?.infoCollectionHistory || [];
          if (infoCollectionHistory.length > 0) {
            console.log(`🔄 [回退模式历史同步] 从session恢复 ${infoCollectionHistory.length} 条历史到BaseAgent`);
            baseAgentHistory.push(...infoCollectionHistory);
          }
        }

        // 🔧 关键修复：回退到流式普通模式
        console.log(`🌊 [流式回退] 使用流式方式生成回退响应...`);
        
        let accumulatedFallbackResponse = '';
        for await (const chunk of this.callLLMStreaming(userInput, {
          system: systemPrompt,
          maxTokens: 64000,
          sessionId: sessionData.id,
          useHistory: true
        })) {
          accumulatedFallbackResponse += chunk;
          
          // 发送流式回退响应块
          yield this.createResponse({
            immediate_display: {
              reply: chunk,
              agent_name: this.name,
              timestamp: new Date().toISOString()
            },
            system_state: {
              intent: 'collecting',
              done: false,
              progress: 80,
              current_stage: '分析中',
              metadata: {
                streaming: true,
                message_id: messageId,
                stream_type: 'chunk',
                fallback_mode: true
              }
            }
          });
        }
        
        console.log(`✅ [流式回退完成] 流式回退响应生成完毕，总长度: ${accumulatedFallbackResponse.length}`);
        
        // 🔧 流式模式：历史已由BaseAgent自动管理，无需手动更新
      }
      
      // 检查是否应该推进到下一阶段
      const shouldAdvance = this.shouldAdvanceToNextStage(sessionData, welcomeData);
      
      if (shouldAdvance) {
        console.log(`🎉 [信息收集完成] 准备推进到下一阶段`);
        // 创建一个简单的推进状态
        const advanceData = {
          collection_status: 'READY_TO_ADVANCE' as const,
          user_type: 'information_rich' as const,
          collected_data: {},
          confidence_level: 'HIGH' as const,
          reasoning: '基于工具调用结果推进'
        };
        yield* this.createAdvanceResponseStream(advanceData, sessionData);
      } else {
        console.log(`🔄 [继续收集] 继续信息收集流程`);
        yield this.createDefaultContinueResponse(messageId);
      }
      
    } catch (error) {
      console.error(`❌ [Claude工具调用分析失败]:`, error);
      throw new Error('Claude工具调用分析失败');
    }
  }

  /**
   * 解析响应并执行工具调用
   */
  private async parseAndExecuteTools(response: string, userInput: string): Promise<any[]> {
    const toolCallPattern = /\[Tool:(.*?)\]\s*\{([^}]*)\}/g;
    const toolCalls: Array<{ name: string; params: any }> = [];
    
    let match;
    while ((match = toolCallPattern.exec(response)) !== null) {
      try {
        const toolName = match[1].trim();
        const paramsStr = match[2].trim();
        
        // 简单的参数解析
        const params: any = {};
        if (paramsStr) {
          // 解析简单的键值对格式
          const paramPairs = paramsStr.split(',');
          for (const pair of paramPairs) {
            const [key, value] = pair.split(':').map(s => s.trim());
            if (key && value) {
              params[key] = value.replace(/['"]/g, '');
            }
          }
        }
        
        // 对于某些工具，从用户输入中自动提取参数
        if (toolName === 'analyze_github') {
          const githubMatch = userInput.match(/github\.com\/([^\/\s]+)/i);
          if (githubMatch) {
            params.username_or_url = githubMatch[0];
            params.include_repos = true;
          }
        } else if (toolName === 'scrape_webpage') {
          const urlMatch = userInput.match(/https?:\/\/[^\s]+/i);
          if (urlMatch) {
            params.url = urlMatch[0];
            params.target_sections = ['all'];
          }
        }
        
        toolCalls.push({ name: toolName, params });
        console.log(`🔧 [工具解析] ${toolName}:`, params);
      } catch (error) {
        console.error(`❌ [工具解析失败] ${match[1]}:`, error);
      }
    }
    
    if (toolCalls.length > 0) {
      console.log(`⚡ [并行工具执行] 开始执行 ${toolCalls.length} 个工具`);
      return await executeToolsInParallel(toolCalls);
    }
    
    return [];
  }

  /**
   * 解析Claude响应中的工具调用
   */
  private async processToolCalls(response: string): Promise<any[]> {
    // 这里需要解析Claude的工具调用响应
    // 由于我们使用的是简化的callLLM，可能需要调整
    // 暂时返回空数组，后续完善
    return [];
  }

  /**
   * 执行工具调用（支持并行执行）
   */
  private async executeToolCalls(toolCalls: any[]): Promise<any[]> {
    if (toolCalls.length === 0) return [];
    
    console.log(`⚡ [并行工具执行] 开始执行 ${toolCalls.length} 个工具`);
    
    // 使用已有的并行执行函数
    const results = await executeToolsInParallel(toolCalls.map(call => ({
      name: call.name,
      params: call.input
    })));
    
    console.log(`✅ [并行工具执行完成] 成功执行 ${results.filter(r => r.success).length}/${results.length} 个工具`);
    
    return results;
  }

  /**
   * 基于工具执行结果生成最终响应
   */
  private async generateFinalResponseWithToolResults(
    userInput: string,
    systemPrompt: string,
    toolResults: any[],
    sessionData: SessionData
  ): Promise<string> {
    // 构建包含工具结果的prompt
    const toolResultsText = toolResults.map(result => {
      if (result.success) {
        return `工具 ${result.tool_name} 执行成功:\n${JSON.stringify(result.data, null, 2)}`;
      } else {
        return `工具 ${result.tool_name} 执行失败: ${result.error}`;
      }
    }).join('\n\n');

    const finalPrompt = `${systemPrompt}

基于以下工具执行结果，请生成对用户的最终回复：

工具执行结果：
${toolResultsText}

用户原始输入：${userInput}

请基于工具结果提供有价值的分析和建议。`;

    const responseData = await this.callLLM(finalPrompt, {
      maxTokens: 4000,
      sessionId: sessionData.id,
      useHistory: false
    });

    // 🔧 关键修复：提取实际的文本内容
    let response: string;
    if (typeof responseData === 'object' && responseData?.text) {
      response = responseData.text;
    } else if (typeof responseData === 'string') {
      response = responseData;
    } else {
      console.warn(`⚠️ [工具结果响应格式异常] 期望文本，实际收到:`, typeof responseData);
      response = "已基于您提供的信息进行分析，我会为您准备详细的展示方案。";
    }

    return response;
  }

  /**
   * 更新会话数据（基于工具执行结果）
   */
  private updateSessionWithToolResults(sessionData: SessionData, toolResults: any[]): void {
    const metadata = sessionData.metadata as any;
    
    if (!metadata.collectedInfo) {
      metadata.collectedInfo = {};
    }
    
    // 处理各种工具的结果
    toolResults.forEach(result => {
      if (!result.success) return;
      
      switch (result.tool_name) {
        case 'analyze_github':
          metadata.collectedInfo.github = result.data;
          break;
        case 'scrape_webpage':
          if (!metadata.collectedInfo.websites) metadata.collectedInfo.websites = [];
          metadata.collectedInfo.websites.push(result.data);
          break;
        case 'parse_document':
          if (!metadata.collectedInfo.documents) metadata.collectedInfo.documents = [];
          metadata.collectedInfo.documents.push(result.data);
          break;
        case 'extract_linkedin':
          metadata.collectedInfo.linkedin = result.data;
          break;
      }
    });
    
    console.log(`💾 [会话数据更新] 已更新 ${toolResults.filter(r => r.success).length} 个工具的结果`);
  }

  /**
   * 判断是否应该推进到下一阶段
   */
  private shouldAdvanceToNextStage(sessionData: SessionData, welcomeData: any): boolean {
    const metadata = sessionData.metadata as any;
    const collectedInfo = metadata.collectedInfo || {};
    
    // 基于收集到的信息量和用户承诺级别判断
    const infoCount = Object.keys(collectedInfo).length;
    const commitmentLevel = welcomeData.commitment_level || '认真制作';
    
    const thresholds: Record<string, number> = {
      '试一试': 1,
      '认真制作': 2
    };
    
    const threshold = thresholds[commitmentLevel] || 2;
    return infoCount >= threshold;
  }

  /**
   * 创建推进到下一阶段的响应
   */
  private async* createAdvanceResponseStream(
    hiddenControl: InfoCollectionHiddenControl,
    sessionData: SessionData
  ): AsyncGenerator<StreamableAgentResponse, void, unknown> {
    // 构建收集总结
    const collectionSummary = {
      user_type: hiddenControl.user_type,
      core_identity: hiddenControl.collected_data.core_identity || '未知身份',
      key_skills: hiddenControl.collected_data.key_skills || [],
      achievements: hiddenControl.collected_data.achievements || [],
      values: hiddenControl.collected_data.values || [],
      goals: hiddenControl.collected_data.goals || [],
      confidence_level: hiddenControl.confidence_level,
      reasoning: hiddenControl.reasoning,
      collection_summary: hiddenControl.collection_summary || '信息收集完成'
    };
    
    // 保存到会话数据供下一个Agent使用
    const metadata = sessionData.metadata as any;
    metadata.infoCollectionSummary = collectionSummary;
    
    yield this.createResponse({
      immediate_display: {
        reply: '✅ 信息收集完成！正在为您准备个性化的页面设计方案...',
        agent_name: this.name,
        timestamp: new Date().toISOString()
      },
      system_state: {
        intent: 'advance_to_next_agent',
        done: true,
        progress: 100,
        current_stage: '信息收集完成',
        next_agent: 'design_agent',
        metadata: {
          collection_summary: collectionSummary,
          ready_for_next_stage: true
        }
      }
    });
  }

  /**
   * 创建继续收集的响应
   */
  private createContinueResponse(
    hiddenControl: InfoCollectionHiddenControl,
    messageId: string
  ): StreamableAgentResponse {
    return this.createResponse({
      immediate_display: {
        reply: '', // 可见内容已经在流式过程中发送
        agent_name: this.name,
        timestamp: new Date().toISOString()
      },
      system_state: {
        intent: 'collecting',
        done: false,
        progress: this.calculateCollectionProgress(hiddenControl),
        current_stage: '信息收集中',
        metadata: {
          streaming: false,
          message_id: messageId,
          stream_type: 'complete',
          is_final: true,
          collection_status: hiddenControl.collection_status,
          user_type: hiddenControl.user_type,
          next_focus: hiddenControl.next_focus,
          confidence_level: hiddenControl.confidence_level
        }
      }
    });
  }

  /**
   * 创建默认继续响应（当没有检测到控制信息时）
   */
  private createDefaultContinueResponse(messageId: string): StreamableAgentResponse {
    return this.createResponse({
      immediate_display: {
        reply: '请继续提供更多信息，或者告诉我您还有什么想要补充的。',
        agent_name: this.name,
        timestamp: new Date().toISOString()
      },
      system_state: {
        intent: 'collecting',
        done: false,
        progress: 50,
        current_stage: '信息收集中',
        metadata: {
          streaming: false,
          message_id: messageId,
          stream_type: 'complete',
          is_final: true,
          collection_status: 'CONTINUE',
          fallback_mode: true
        }
      }
    });
  }

  /**
   * 更新会话数据
   */
  private updateSessionData(sessionData: SessionData, hiddenControl: InfoCollectionHiddenControl): void {
    const metadata = sessionData.metadata as any;
    
    // 更新收集到的数据
    if (!metadata.collectedInfo) {
      metadata.collectedInfo = {};
    }
    
    Object.assign(metadata.collectedInfo, hiddenControl.collected_data);
    
    // 更新用户类型和状态
    metadata.userType = hiddenControl.user_type;
    metadata.collectionStatus = hiddenControl.collection_status;
    metadata.confidenceLevel = hiddenControl.confidence_level;
    
    console.log(`💾 [会话数据更新] 用户类型: ${hiddenControl.user_type}, 状态: ${hiddenControl.collection_status}`);
  }

  /**
   * 计算收集进度
   */
  private calculateCollectionProgress(hiddenControl: InfoCollectionHiddenControl): number {
    const data = hiddenControl.collected_data;
    let progress = 30; // 基础进度
    
    if (data.core_identity) progress += 20;
    if (data.key_skills && data.key_skills.length > 0) progress += 15;
    if (data.achievements && data.achievements.length > 0) progress += 15;
    if (data.values && data.values.length > 0) progress += 10;
    if (data.goals && data.goals.length > 0) progress += 10;
    
    return Math.min(progress, 90); // 最高90%，完成时才是100%
  }

  /**
   * 创建强制推进响应流
   */
  private async* createForceAdvanceResponseStream(sessionData: SessionData): AsyncGenerator<StreamableAgentResponse, void, unknown> {
    const metadata = sessionData.metadata as any;
    const collectedInfo = metadata.collectedInfo || {};
    
    const forceSummary = {
      user_type: 'guided_discovery',
      core_identity: collectedInfo.core_identity || '多才多艺的专业人士',
      key_skills: collectedInfo.key_skills || ['沟通协调', '问题解决', '学习能力'],
      achievements: collectedInfo.achievements || ['积极参与项目', '持续学习成长'],
      values: collectedInfo.values || ['专业负责', '团队合作'],
      goals: collectedInfo.goals || ['职业发展', '技能提升'],
      confidence_level: 'MEDIUM',
      reasoning: '达到最大轮次限制，使用已收集信息推进',
      collection_summary: '基于有限信息完成收集，推进到下一阶段'
    };
    
    metadata.infoCollectionSummary = forceSummary;
    
    yield this.createResponse({
      immediate_display: {
        reply: '⏰ 基于您目前提供的信息，我来为您准备个性化的页面设计方案...',
        agent_name: this.name,
        timestamp: new Date().toISOString()
      },
      system_state: {
        intent: 'advance_to_next_agent',
        done: true,
        progress: 100,
        current_stage: '信息收集完成',
        next_agent: 'design_agent',
        metadata: {
          collection_summary: forceSummary,
          ready_for_next_stage: true,
          force_advance: true
        }
      }
    });
  }

  /**
   * 提取Welcome数据
   */
  private extractWelcomeData(sessionData: SessionData): any {
    const metadata = sessionData.metadata as any;
    const welcomeSummary = metadata.welcomeSummary;
    
    if (!welcomeSummary) {
      console.warn('⚠️ [Welcome数据缺失] 使用默认数据');
      return {
        user_role: '专业人士',
        use_case: '个人展示',
        style: '简约现代',
        highlight_focus: '综合展示',
        commitment_level: '认真制作',
        reasoning: '默认分析',
        should_use_samples: false,
        sample_reason: '用户未明确表示体验需求',
        collection_priority: 'balanced',
        current_collected_data: {},
        available_tools: [],
        context_for_next_agent: '继续信息收集'
      };
    }
    
    return {
      user_role: welcomeSummary.summary?.user_role || '专业人士',
      use_case: welcomeSummary.summary?.use_case || '个人展示',
      style: welcomeSummary.summary?.style || '简约现代',
      highlight_focus: welcomeSummary.summary?.highlight_focus || '综合展示',
      commitment_level: welcomeSummary.user_intent?.commitment_level || '认真制作',
      reasoning: welcomeSummary.user_intent?.reasoning || '基于用户表达分析',
      should_use_samples: welcomeSummary.sample_suggestions?.should_use_samples || false,
      sample_reason: welcomeSummary.sample_suggestions?.sample_reason || '根据用户需求判断',
      collection_priority: welcomeSummary.collection_priority || 'balanced',
      current_collected_data: welcomeSummary.current_collected_data || {},
      available_tools: welcomeSummary.available_tools || [],
      context_for_next_agent: welcomeSummary.context_for_next_agent || '继续信息收集'
    };
  }

  /**
   * 获取轮次计数
   */
  private getTurnCount(sessionData: SessionData): number {
    const metadata = sessionData.metadata as any;
    return metadata.infoCollectionTurns || 0;
  }

  /**
   * 获取最大轮次限制
   */
  private getMaxTurns(sessionData: SessionData): number {
    const welcomeData = this.extractWelcomeData(sessionData);
    
    const maxTurns: Record<string, number> = {
      '试一试': 3,
      '认真制作': 6
    };
    
    return maxTurns[welcomeData.commitment_level] || 6;
  }

  /**
   * 增加轮次计数
   */
  private incrementTurnCount(sessionData: SessionData): void {
    const metadata = sessionData.metadata as any;
    metadata.infoCollectionTurns = (metadata.infoCollectionTurns || 0) + 1;
  }

  /**
   * 创建思考响应
   */
  protected createThinkingResponse(message: string, progress: number): StreamableAgentResponse {
    return this.createResponse({
      immediate_display: {
        reply: message,
        agent_name: this.name,
        timestamp: new Date().toISOString()
      },
      system_state: {
        intent: 'thinking',
        done: false,
        progress,
        current_stage: '分析中',
        metadata: {
          thinking: true,
          message
        }
      }
    });
  }

  /**
   * 从用户输入中提取已上传的文件信息
   */
  private extractUploadedFiles(userInput: string): Array<{name: string, type: string, content: string}> {
    const files: Array<{name: string, type: string, content: string}> = [];
    
    // 匹配文件信息的正则表达式
    const filePattern = /📎\s+([^\n]+)\n类型:\s+([^\n]+)\n大小:\s+[^\n]+\n(?:内容:\s+([\s\S]*?)(?=\n\n📎|\n\n$|$))?/g;
    
    let match;
    while ((match = filePattern.exec(userInput)) !== null) {
      const fileName = match[1]?.trim();
      const fileType = match[2]?.trim();
      const fileContent = match[3]?.trim() || '';
      
      if (fileName && fileType) {
        files.push({
          name: fileName,
          type: fileType,
          content: fileContent
        });
      }
    }
    
    console.log(`📎 [文件提取] 从用户输入中提取到 ${files.length} 个文件`);
    if (files.length > 0) {
      files.forEach((file, index) => {
        console.log(`📄 [文件${index + 1}] ${file.name} (${file.type}) - 内容长度: ${file.content.length}`);
      });
    }
    
    return files;
  }

  /**
   * 检测用户输入中是否包含链接
   */
  private detectLinksInInput(userInput: string): boolean {
    const linkPatterns = [
      /https?:\/\/[^\s]+/g,
      /linkedin\.com\/in\/[^\s]+/g,
      /github\.com\/[^\s]+/g,
      /instagram\.com\/[^\s]+/g,
      /twitter\.com\/[^\s]+/g,
      /x\.com\/[^\s]+/g,
      /behance\.net\/[^\s]+/g,
      /dribbble\.com\/[^\s]+/g
    ];

    return linkPatterns.some(pattern => pattern.test(userInput));
  }

  /**
   * 提取用户输入中的链接信息
   */
  private extractLinkInfo(userInput: string): string {
    const links: string[] = [];
    const linkPattern = /https?:\/\/[^\s]+/g;
    
    let match;
    while ((match = linkPattern.exec(userInput)) !== null) {
      links.push(match[0]);
    }

    if (links.length === 0) {
      return '无链接';
    }

    return links.map((link, index) => 
      `链接${index + 1}: ${link}`
    ).join('\n');
  }

  /**
   * 检查是否是第一次进入信息收集阶段
   */
  private isFirstTimeInInfoCollection(sessionData: SessionData): boolean {
    const metadata = sessionData.metadata as any;
    const infoCollectionHistory = metadata.infoCollectionHistory || [];
    return infoCollectionHistory.length === 0;
  }

  /**
   * 🌟 创建信息收集阶段的自然对话欢迎流程
   */
  private async* createWelcomeToInfoCollectionFlow(
    welcomeData: any, 
    sessionData: SessionData
  ): AsyncGenerator<StreamableAgentResponse, void, unknown> {
    
    // 🔧 关键修复：使用AI生成自然的欢迎对话，而不是硬编码的系统提示
    const commitmentLevel = welcomeData.commitment_level || '认真制作';
    const userRole = welcomeData.user_role || '专业人士';
    const useCase = welcomeData.use_case || '个人展示';
    const style = welcomeData.style || '简约现代';
    
    // 构建引导prompt，让AI生成自然的对话
    const welcomePrompt = `基于Welcome阶段收集的信息，用户是一位${userRole}，想要${useCase}，偏好${style}风格，意图程度为${commitmentLevel}。

现在需要开始信息收集阶段，请用自然的对话方式引导用户提供更详细的信息。

要求：
1. 用自然对话的语气，不要使用系统提示的格式
2. 基于用户的身份和需求给出个性化的引导
3. 鼓励用户提供具体的资料或经历，比如文本、文档、链接等，不要让用户感到压力
4. 语调要友好专业，符合用户的意图程度
5、我们支持文档的解析和链接的爬取，比如领英/github/网站等，请用户提供链接，我们支持解析和爬取

请直接回复，不需要任何特殊格式。`;

    console.log(`🤖 [AI欢迎生成] 调用AI生成自然的欢迎对话`);
    
    try {
      // 🔧 关键修复：使用流式AI生成自然的欢迎消息
      console.log(`🌊 [流式欢迎] 开始流式生成欢迎消息...`);
      
      let accumulatedWelcome = '';
      for await (const chunk of this.callLLMStreaming(welcomePrompt, {
        maxTokens: 2000,
        sessionId: sessionData.id,
        useHistory: false // 不使用历史，这是独立的欢迎生成
      })) {
        accumulatedWelcome += chunk;
        
        // 发送流式欢迎响应块
        yield this.createResponse({
          immediate_display: {
            reply: chunk,
            agent_name: this.name,
            timestamp: new Date().toISOString()
          },
          system_state: {
            intent: 'welcome_to_info_collection',
            done: false,
            progress: 35,
            current_stage: '信息收集阶段',
            metadata: {
              first_time_welcome: true,
              user_commitment_level: commitmentLevel,
              ai_generated_welcome: true,
              streaming: true,
              stream_type: 'chunk',
              waiting_for_user_input: false
            }
          }
        });
      }

      console.log(`✅ [流式欢迎完成] 流式欢迎消息生成完毕，总长度: ${accumulatedWelcome.length}`);

      // 标记已经发送过欢迎消息
      const metadata = sessionData.metadata as any;
      metadata.infoCollectionWelcomeSent = true;
      
      console.log(`🌟 [AI欢迎完成] 已发送AI生成的自然欢迎消息 (${commitmentLevel}用户)`);
      
    } catch (error) {
      console.error(`❌ [AI欢迎生成失败] 回退到预设消息:`, error);
      
      // 🔧 回退到简单的预设消息（如果AI调用失败）
      const fallbackMessage = `很好！现在让我们更深入地了解您的背景。作为${userRole}，您可以分享一些具体的资料或经历，这样我能为您打造更加个性化的页面。`;
      
      yield this.createResponse({
        immediate_display: {
          reply: fallbackMessage,
          agent_name: this.name,
          timestamp: new Date().toISOString()
        },
        system_state: {
          intent: 'welcome_to_info_collection',
          done: false,
          progress: 35,
          current_stage: '信息收集阶段',
          metadata: {
            first_time_welcome: true,
            user_commitment_level: commitmentLevel,
            fallback_welcome: true,
            waiting_for_user_input: true
          }
        }
      });
    }
  }

  /**
   * 更新对话历史 - 与Welcome Agent保持一致的格式
   */
  private updateConversationHistory(sessionData: SessionData, userInput: string, agentResponse: string): void {
    const metadata = sessionData.metadata as any;
    
    // 初始化info collection对话历史（如果不存在）
    if (!metadata.infoCollectionHistory) {
      metadata.infoCollectionHistory = [];
    }
    
    // 添加用户消息和助手回复（与Welcome Agent相同的格式）
    metadata.infoCollectionHistory.push(
      { role: 'user', content: userInput },
      { role: 'assistant', content: agentResponse }
    );

    console.log(`💬 [对话历史更新] Info Collection历史长度: ${metadata.infoCollectionHistory.length}`);
  }
} 