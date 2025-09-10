import { BaseAgent } from '../base-agent';
import { 
  StreamableAgentResponse, 
  AgentCapabilities,
  UserIntent,
  PersonalizationProfile
} from '@/lib/types/streaming';
import { SessionData } from '@/lib/types/session';
import { BASIC_INFO_COLLECTION_PROMPT, formatPrompt } from '@/lib/prompts';
import {
  MaterialCollectionState,
  extractUserGoal,
  extractUserType,
  extractUrgency,
  determineCollectionMode,
  assessMaterialCollectionState,
  shouldAdvanceToDesign,
  getMaterialGuide,
  generateMaterialRequestMessage,
  buildMaterialCollectionElements,
  generateMaterialSummary,
  processMaterialSubmission,
  delay
} from './utils';

/**
 * Info Collection Agent - 材料和链接收集
 */
export class InfoCollectionAgent extends BaseAgent {
  constructor() {
    const capabilities: AgentCapabilities = {
      canStream: true,
      requiresInteraction: true,
      outputFormats: ['json', 'html'],
      maxRetries: 3,
      timeout: 15000
    };
    
    super('InfoCollectionAgent', capabilities);
  }

  /**
   * 主处理流程 - 收集用户已有材料和链接
   */
  async* process(
    input: any,
    sessionData: SessionData,
    context?: Record<string, any>
  ): AsyncGenerator<StreamableAgentResponse, void, unknown> {
    try {
      // 步骤1: 分析用户画像和收集策略
      yield this.createThinkingResponse('正在准备材料收集清单...', 25);
      await delay(1000);

      const userGoal = extractUserGoal(sessionData);
      const userType = extractUserType(sessionData);
      const urgency = extractUrgency(sessionData);
      
      // 判断收集模式
      const collectionMode = determineCollectionMode(userGoal, urgency);

      // 检查当前收集状态
      const currentState = assessMaterialCollectionState(sessionData);
      
      if (shouldAdvanceToDesign(currentState, collectionMode)) {
        // 材料足够或用户选择跳过，推进到下一阶段
        yield this.createAdvanceResponse(currentState, sessionData);
        return;
      }

      // 生成材料收集请求
      const materialRequest = this.generateMaterialRequest(userType, userGoal, currentState, collectionMode);
      yield materialRequest;

    } catch (error) {
      yield await this.handleError(error as Error, sessionData, context);
    }
  }

  /**
   * 生成材料收集请求
   */
  private generateMaterialRequest(
    userType: string,
    userGoal: string,
    currentState: MaterialCollectionState,
    mode: string
  ): StreamableAgentResponse {
    const materialGuide = getMaterialGuide(userType);
    
    return this.createResponse({
      immediate_display: {
        reply: generateMaterialRequestMessage(userType, userGoal, mode),
        agent_name: this.name,
        timestamp: new Date().toISOString()
      },
      interaction: {
        type: 'form',
        title: '材料收集',
        description: '请提供您已有的材料和链接，或选择跳过使用默认数据',
        elements: buildMaterialCollectionElements(materialGuide, currentState)
      },
      system_state: {
        intent: 'collecting_materials',
        done: false,
        progress: 40,
        current_stage: '材料收集',
        metadata: {
          collectionMode: mode,
          userType,
          userGoal
        }
      }
    });
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
        current_stage: '分析中...'
      }
    });
  }

  /**
   * 创建推进响应
   */
  private createAdvanceResponse(state: MaterialCollectionState, sessionData: SessionData): StreamableAgentResponse {
    const materials = sessionData.collectedData as any; // 使用类型断言
    const summary = generateMaterialSummary(materials);

    return this.createResponse({
      immediate_display: {
        reply: `✅ 材料收集完成！\n\n${summary}\n\n现在开始设计您的页面结构...`,
        agent_name: this.name,
        timestamp: new Date().toISOString()
      },
      system_state: {
        intent: 'advance',
        done: true,
        progress: 60,
        current_stage: '材料收集完成',
        metadata: {
          collectionState: state,
          materialsCount: {
            documents: materials?.documents?.length || 0,
            links: materials?.links?.length || 0
          }
        }
      }
    });
  }

  /**
   * 处理用户交互
   */
  async handleInteraction(
    interactionType: string,
    data: any,
    sessionData: SessionData
  ): Promise<any> {
    console.log(`📝 [Info Collection Agent交互] 处理用户交互`);
    console.log(`📝 [交互类型] ${interactionType}`);
    console.log(`📄 [交互数据] ${JSON.stringify(data)}`);

    if (interactionType === 'interaction') {
      // 处理材料提交
      const processedMaterials = processMaterialSubmission(data);
      
      // 更新会话数据
      if (!sessionData.collectedData) {
        sessionData.collectedData = {
          personal: {},
          professional: {} as any,
          experience: [],
          education: [],
          projects: [],
          certifications: []
        } as any;
      }

      // 将材料数据合并到会话中
      Object.assign(sessionData.collectedData, processedMaterials);

      // 重新评估收集状态
      const newState = assessMaterialCollectionState(sessionData);
      const userGoal = extractUserGoal(sessionData);
      const urgency = extractUrgency(sessionData);
      const collectionMode = determineCollectionMode(userGoal, urgency);
      
      if (shouldAdvanceToDesign(newState, collectionMode)) {
        return {
          status: 'completed',
          data: processedMaterials,
          message: '材料收集完成，准备进入设计阶段'
        };
      }

      return {
        status: 'continue',
        data: processedMaterials,
        message: '材料已收集，请继续提供更多材料'
      };
    }

    return {
      status: 'unknown',
      message: '未知的交互类型'
    };
  }

  /**
   * AI增强的意图理解
   */
  private async enhanceUserIntentUnderstanding(
    userInput: string, 
    sessionData: SessionData
  ): Promise<{
    intent: 'skip' | 'provide_materials' | 'ask_question' | 'continue_collection';
    confidence: number;
    suggestedAction: string;
    naturalResponse: string;
  }> {
    console.log(`🧠 [AI增强意图理解] 开始分析用户输入: "${userInput}"`);

    // 🆕 新架构：分离system prompt和用户输入
    const systemPrompt = `你是材料收集阶段的意图理解专家。分析用户输入，判断他们的真实意图。

## 分析任务：
1. 判断用户的核心意图（skip/provide_materials/ask_question/continue_collection）
2. 评估意图的置信度（0-1）
3. 建议最合适的下一步行动
4. 生成自然友好的回复

## 输出格式：
{
  "intent": "用户意图分类",
  "confidence": 置信度数值,
  "suggestedAction": "建议的行动",
  "naturalResponse": "自然的回复文本"
}`;

    const userInput_clean = userInput.trim();
    const context = {
      collected_info: sessionData.collectedData,
      user_goal: extractUserGoal(sessionData),
      user_type: extractUserType(sessionData),
      urgency: extractUrgency(sessionData)
    };

    const llmResponse = await this.callLLM(userInput_clean, {
      system: systemPrompt,
      schemaType: 'intentAnalysis',
              maxTokens: 32000,
      sessionId: sessionData.id,
      useHistory: false // 单次分析不需要历史
    });

    console.log(`🧠 [意图分析结果] ${JSON.stringify(llmResponse)}`);
    
    return llmResponse;
  }

  /**
   * 使用AI增强的处理流程
   */
  async* processWithAIEnhancement(
    input: { user_input: string },
    sessionData: SessionData
  ): AsyncGenerator<StreamableAgentResponse, void, unknown> {
    try {
      console.log(`🤖 [AI增强模式] 开始处理用户输入: "${input.user_input}"`);

      // 步骤1: AI意图理解
      yield this.createThinkingResponse('正在理解您的意图...', 35);
      await delay(800);

      const intentAnalysis = await this.enhanceUserIntentUnderstanding(input.user_input, sessionData);
      
      // 步骤2: 基于意图生成响应
      if (intentAnalysis.intent === 'skip') {
        // 用户想跳过材料收集
        yield this.createAdvanceResponse(
          assessMaterialCollectionState(sessionData), 
          sessionData
        );
        return;
      }

      // 步骤3: 生成个性化的材料收集请求
      yield this.createThinkingResponse('正在为您定制收集方案...', 45);
      await delay(1000);

      const materialRequest = this.createEnhancedMaterialRequest(intentAnalysis, sessionData);
      yield materialRequest;

    } catch (error) {
      yield await this.handleError(error as Error, sessionData);
    }
  }

  /**
   * 创建增强的材料收集请求
   */
  private createEnhancedMaterialRequest(
    intentAnalysis: any, 
    sessionData: SessionData
  ): StreamableAgentResponse {
    const userType = extractUserType(sessionData);
    const userGoal = extractUserGoal(sessionData);
    const currentState = assessMaterialCollectionState(sessionData);
    const materialGuide = getMaterialGuide(userType);

    return this.createResponse({
      immediate_display: {
        reply: intentAnalysis.naturalResponse,
        agent_name: this.name,
        timestamp: new Date().toISOString()
      },
      interaction: {
        type: 'form',
        title: '材料收集 - AI定制版',
        description: `基于您的${userType}身份和"${userGoal}"目标，我为您定制了以下收集方案：`,
        elements: buildMaterialCollectionElements(materialGuide, currentState)
      },
      system_state: {
        intent: 'collecting_materials_enhanced',
        done: false,
        progress: 50,
        current_stage: 'AI增强材料收集',
        metadata: {
          aiEnhanced: true,
          intentAnalysis,
          userType,
          userGoal
        }
      }
    });
  }
} 