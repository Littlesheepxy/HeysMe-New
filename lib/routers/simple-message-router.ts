/**
 * 简单消息路由器 - 替代复杂的AgentOrchestrator
 * 
 * 核心功能：
 * 1. 用户档案检查 - 首次使用时收集用户信息
 * 2. 模式选择 - 普通模式（表单）vs 专业模式（对话）  
 * 3. 直接路由到Open Lovable Agent
 * 4. 简化的流式响应处理
 */

import { SessionData } from '@/lib/types/session';
import { StreamableAgentResponse } from '@/lib/types/streaming';
import { CodingAgent } from '@/lib/agents/coding';

// 用户档案接口
export interface UserProfile {
  displayName: string;
  role: 'developer' | 'designer' | 'product_manager' | 'entrepreneur' | 'student' | 'other';
  customRole?: string;
  experience: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  primarySkills: string[];
  interests: string[];
  preferredStack: string[];
  designStyle: 'modern' | 'minimal' | 'colorful' | 'professional' | 'creative';
  projectTypes: string[];
  teamSize: 'solo' | 'small_team' | 'large_team' | 'flexible';
  githubUrl?: string;
  portfolioUrl?: string;
  linkedinUrl?: string;
  preferredAIModel?: string;
  communicationStyle: 'direct' | 'detailed' | 'conversational' | 'technical';
}

// 项目需求接口
export interface ProjectRequirement {
  projectType: 'website' | 'webapp' | 'landing' | 'portfolio' | 'ecommerce' | 'blog';
  projectName: string;
  description: string;
  targetAudience: string;
  keyFeatures: string[];
  designStyle: 'modern' | 'minimal' | 'colorful' | 'professional' | 'creative';
  techStack: string[];
  referenceUrl?: string;
  additionalInfo?: string;
}

// 路由器输入类型
export interface RouterInput {
  message: string;
  action?: 'check_profile' | 'save_profile' | 'select_mode' | 'submit_form' | 'chat';
  data?: any;
}

/**
 * 简单消息路由器类
 */
export class SimpleMessageRouter {
  private openLovableAgent: CodingAgent;

  constructor() {
    // 现阶段先使用现有的CodingAgent，后续重构为OpenLovableAgent
    this.openLovableAgent = new CodingAgent();
  }

  /**
   * 主要处理方法 - 处理所有用户输入
   */
  async* process(
    input: RouterInput,
    sessionData: SessionData
  ): AsyncGenerator<StreamableAgentResponse, void, unknown> {
    const { message, action, data } = input;

    console.log(`🚀 [SimpleRouter] 处理输入: action=${action}, message="${message?.substring(0, 50)}..."`);

    try {
      // 步骤1: 检查用户档案
      if (!this.hasUserProfile(sessionData)) {
        yield* this.handleUserProfileCollection(input, sessionData);
        return;
      }

      // 步骤2: 检查对话模式
      if (!this.hasSelectedMode(sessionData)) {
        yield* this.handleModeSelection(input, sessionData);
        return;
      }

      // 步骤3: 根据模式处理
      const mode = this.getSessionMode(sessionData);
      if (mode === 'form') {
        yield* this.handleFormMode(input, sessionData);
      } else if (mode === 'professional') {
        yield* this.handleProfessionalMode(input, sessionData);
      } else {
        throw new Error(`未知的对话模式: ${mode}`);
      }

    } catch (error) {
      console.error('🚨 [SimpleRouter] 处理错误:', error);
      yield this.createErrorResponse(error instanceof Error ? error.message : '处理请求时发生错误');
    }
  }

  /**
   * 检查用户是否有档案
   */
  private hasUserProfile(sessionData: SessionData): boolean {
    return !!((sessionData.metadata as any)?.hasUserProfile || (sessionData.metadata as any)?.userProfile);
  }

  /**
   * 检查是否已选择对话模式
   */
  private hasSelectedMode(sessionData: SessionData): boolean {
    return !!((sessionData.metadata as any)?.mode);
  }

  /**
   * 获取会话模式
   */
  private getSessionMode(sessionData: SessionData): 'form' | 'professional' | null {
    return (sessionData.metadata as any)?.mode || null;
  }

  /**
   * 处理用户档案收集
   */
  private async* handleUserProfileCollection(
    input: RouterInput,
    sessionData: SessionData
  ): AsyncGenerator<StreamableAgentResponse, void, unknown> {
    
    if (input.action === 'save_profile' && input.data) {
      // 保存用户档案
      const userProfile: UserProfile = input.data;
      
      // 更新会话元数据
      sessionData.metadata = {
        ...sessionData.metadata,
        hasUserProfile: true,
        userProfile: userProfile
      } as any;

      yield {
        immediate_display: {
          reply: '✅ 用户档案已保存！现在请选择您的使用模式。',
          agent_name: 'SimpleRouter',
          timestamp: new Date().toISOString()
        },
        system_state: {
          intent: 'profile_saved',
          done: false,
          progress: 25,
          current_stage: '模式选择',
          metadata: { 
            action: 'show_mode_selector',
            userProfile: userProfile
          }
        }
      };
    } else {
      // 显示用户档案收集表单
      yield {
        immediate_display: {
          reply: '👋 欢迎使用HeysMe！为了为您提供更好的服务，请先完善您的用户档案。',
          agent_name: 'SimpleRouter',
          timestamp: new Date().toISOString()
        },
        system_state: {
          intent: 'collect_user_profile',
          done: false,
          progress: 10,
          current_stage: '用户档案收集',
          metadata: { 
            action: 'show_profile_form',
            isRequired: true
          }
        }
      };
    }
  }

  /**
   * 处理模式选择
   */
  private async* handleModeSelection(
    input: RouterInput,
    sessionData: SessionData
  ): AsyncGenerator<StreamableAgentResponse, void, unknown> {
    
    if (input.action === 'select_mode' && input.data) {
      const selectedMode = input.data.mode;
      
      // 更新会话模式
      sessionData.metadata = {
        ...sessionData.metadata,
        mode: selectedMode
      } as any;

      if (selectedMode === 'form') {
        yield {
          immediate_display: {
            reply: '📝 您选择了普通模式！请填写项目需求表单，我们将为您生成专业的开发提示。',
            agent_name: 'SimpleRouter',
            timestamp: new Date().toISOString()
          },
          system_state: {
            intent: 'mode_selected_form',
            done: false,
            progress: 40,
            current_stage: '项目需求收集',
            metadata: { 
              action: 'show_project_form',
              mode: 'form'
            }
          }
        };
      } else {
        yield {
          immediate_display: {
            reply: '🚀 您选择了专业模式！您可以直接与我对话，描述您的项目需求。',
            agent_name: 'SimpleRouter',
            timestamp: new Date().toISOString()
          },
          system_state: {
            intent: 'mode_selected_professional',
            done: false,
            progress: 60,
            current_stage: '专业对话',
            metadata: { 
              action: 'start_professional_chat',
              mode: 'professional'
            }
          }
        };
      }
    } else {
      // 显示模式选择器
      yield {
        immediate_display: {
          reply: '请选择您偏好的使用模式：',
          agent_name: 'SimpleRouter',
          timestamp: new Date().toISOString()
        },
        system_state: {
          intent: 'show_mode_selector',
          done: false,
          progress: 30,
          current_stage: '模式选择',
          metadata: { 
            action: 'show_mode_selector',
            options: [
              {
                id: 'form',
                title: '普通模式',
                description: '通过表单填写项目需求，系统生成专业提示词',
                icon: 'form'
              },
              {
                id: 'professional', 
                title: '专业模式',
                description: '直接对话描述需求，适合有经验的用户',
                icon: 'chat'
              }
            ]
          }
        }
      };
    }
  }

  /**
   * 处理普通模式（表单）
   */
  private async* handleFormMode(
    input: RouterInput,
    sessionData: SessionData
  ): AsyncGenerator<StreamableAgentResponse, void, unknown> {
    
    if (input.action === 'submit_form' && input.data) {
      // 用户提交了项目需求表单
      const projectRequirement: ProjectRequirement = input.data;
      
      // 生成专业的开发提示词
      const generatedPrompt = this.generatePromptFromForm(projectRequirement, (sessionData.metadata as any)?.userProfile);
      
      // 保存表单数据
      sessionData.metadata = {
        ...sessionData.metadata,
        formData: projectRequirement
      } as any;

      yield {
        immediate_display: {
          reply: '🎯 项目需求收集完成！正在为您生成专业的开发提示词...',
          agent_name: 'SimpleRouter',
          timestamp: new Date().toISOString()
        },
        system_state: {
          intent: 'form_submitted',
          done: false,
          progress: 70,
          current_stage: '提示词生成',
          metadata: { 
            formData: projectRequirement,
            generatedPrompt: generatedPrompt
          }
        }
      };

      // 调用Open Lovable代码生成
      yield* this.callOpenLovableGeneration(
        generatedPrompt,
        sessionData,
        { 
          mode: 'form',
          originalRequirement: projectRequirement,
          userProfile: (sessionData.metadata as any)?.userProfile
        }
      );

    } else {
      // 显示项目需求表单
      yield {
        immediate_display: {
          reply: '请填写以下项目需求信息：',
          agent_name: 'SimpleRouter',
          timestamp: new Date().toISOString()
        },
        system_state: {
          intent: 'show_project_form',
          done: false,
          progress: 50,
          current_stage: '项目需求收集',
          metadata: { 
            action: 'show_project_form',
            userProfile: (sessionData.metadata as any)?.userProfile
          }
        }
      };
    }
  }

  /**
   * 处理专业模式（直接对话）
   */
  private async* handleProfessionalMode(
    input: RouterInput,
    sessionData: SessionData
  ): AsyncGenerator<StreamableAgentResponse, void, unknown> {
    
    // 直接将用户输入传递给Open Lovable代码生成
    yield* this.callOpenLovableGeneration(
      input.message,
      sessionData,
      { 
        mode: 'professional',
        userProfile: (sessionData.metadata as any)?.userProfile
      }
    );
  }

  /**
   * 从表单数据生成专业提示词
   */
  private generatePromptFromForm(requirement: ProjectRequirement, userProfile?: UserProfile): string {
    const prompt = `
请帮我创建一个${requirement.projectType === 'website' ? '网站' : '应用'}项目：

## 项目基本信息
- 项目名称：${requirement.projectName}
- 项目类型：${this.getProjectTypeDescription(requirement.projectType)}
- 设计风格：${this.getDesignStyleDescription(requirement.designStyle)}

## 项目描述
${requirement.description}

## 目标用户
${requirement.targetAudience}

## 核心功能
${requirement.keyFeatures.map(feature => `- ${feature}`).join('\n')}

## 技术栈要求
${requirement.techStack.join(', ')}

${requirement.referenceUrl ? `## 参考网站\n${requirement.referenceUrl}` : ''}

${requirement.additionalInfo ? `## 补充说明\n${requirement.additionalInfo}` : ''}

${userProfile ? `## 用户背景\n- 角色：${userProfile.role}\n- 经验水平：${userProfile.experience}\n- 沟通风格：${userProfile.communicationStyle}` : ''}

请根据以上需求创建一个完整的项目，包括所有必要的文件和代码。
    `.trim();

    return prompt;
  }

  /**
   * 获取项目类型描述
   */
  private getProjectTypeDescription(type: string): string {
    const descriptions = {
      'website': '企业官网',
      'webapp': 'Web应用程序',
      'landing': '产品落地页',
      'portfolio': '个人作品集',
      'ecommerce': '电商网站',
      'blog': '博客网站'
    };
    return descriptions[type as keyof typeof descriptions] || type;
  }

  /**
   * 获取设计风格描述
   */
  private getDesignStyleDescription(style: string): string {
    const descriptions = {
      'modern': '现代简约',
      'minimal': '极简主义',
      'colorful': '色彩丰富',
      'professional': '商务专业',
      'creative': '创意设计'
    };
    return descriptions[style as keyof typeof descriptions] || style;
  }

  /**
   * 创建错误响应
   */
  private createErrorResponse(errorMessage: string): StreamableAgentResponse {
    return {
      immediate_display: {
        reply: `❌ 抱歉，处理您的请求时遇到了问题：${errorMessage}`,
        agent_name: 'SimpleRouter',
        timestamp: new Date().toISOString()
      },
      system_state: {
        intent: 'error',
        done: true,
        progress: 0,
        current_stage: '错误处理',
        metadata: { 
          error: errorMessage,
          action: 'retry_or_contact_support'
        }
      }
    };
  }

  /**
   * 兼容性方法：获取会话数据
   * 临时方法，用于与现有API保持兼容
   */
  async getSessionData(sessionId: string): Promise<SessionData | null> {
    // TODO: 实现从数据库获取会话数据
    // 目前返回一个基本的会话结构
    return {
      id: sessionId,
      userId: 'unknown',
      status: 'active',
      userIntent: {} as any,
      personalization: {} as any,
      collectedData: {} as any,
      agentFlow: {} as any,
      metadata: {
        progress: {
          currentStage: 'start',
          percentage: 0
        }
      } as any, // 临时类型断言，后续修复类型定义
      conversationHistory: []
    } as SessionData;
  }

  /**
   * 兼容性方法：流式处理用户输入
   * 临时方法，用于与现有API保持兼容
   */
  async* processUserInputStreaming(
    sessionId: string,
    message: string,
    sessionData?: SessionData,
    context?: any
  ): AsyncGenerator<StreamableAgentResponse, void, unknown> {
    
    // 获取或创建会话数据
    const currentSession = sessionData || await this.getSessionData(sessionId) || {
      id: sessionId,
      userId: 'unknown',
      status: 'active',
      userIntent: {} as any,
      personalization: {} as any,
      collectedData: {} as any,
      agentFlow: {} as any,
      metadata: {} as any, // 临时类型断言
      conversationHistory: []
    } as SessionData;

    // 构建路由器输入
    const routerInput = {
      message,
      action: context?.action || 'chat',
      data: context?.data
    };

    // 调用主处理方法
    yield* this.process(routerInput, currentSession);
  }

  /**
   * 兼容性方法：同步获取会话数据
   */
  getSessionDataSync(sessionId: string): SessionData | null {
    // TODO: 实现同步会话获取（暂时返回null）
    return null;
  }

  /**
   * 兼容性方法：创建新会话
   */
  async createSession(): Promise<string> {
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    // TODO: 实现会话创建逻辑
    return sessionId;
  }

  /**
   * 兼容性方法：获取所有活跃会话
   */
  async getAllActiveSessions(): Promise<SessionData[]> {
    // TODO: 实现获取活跃会话列表
    return [];
  }

  /**
   * 兼容性方法：处理用户交互
   */
  async handleUserInteraction(
    sessionId: string,
    interactionType: string,
    data: any,
    sessionData: SessionData
  ): Promise<any> {
    // 根据交互类型处理
    if (interactionType === 'interaction') {
      // 检查是否是保存用户档案的交互
      if (data.user_role || data.use_case || data.style) {
        return {
          action: 'stream_response',
          nextAgent: 'SimpleRouter',
          message: '正在处理您的选择...'
        };
      }
      
      // 其他交互类型，返回流式响应
      return {
        action: 'stream_response',
        nextAgent: 'SimpleRouter',
        message: '正在处理您的请求...'
      };
    }

    // 默认返回
    return {
      action: 'processed',
      nextAgent: 'SimpleRouter'
    };
  }

  /**
   * 兼容性方法：获取会话状态
   */
  async getSessionStatus(sessionId: string): Promise<any> {
    const sessionData = await this.getSessionData(sessionId);
    if (!sessionData) {
      return null;
    }
    
    return {
      id: sessionId,
      currentStage: (sessionData.metadata as any)?.progress?.currentStage || 'start',
      percentage: (sessionData.metadata as any)?.progress?.percentage || 0,
      status: sessionData.status,
      metadata: sessionData.metadata
    };
  }

  /**
   * 兼容性方法：重置会话到指定阶段
   */
  async resetSessionToStage(sessionId: string, targetStage: string): Promise<boolean> {
    // TODO: 实现会话重置逻辑
    console.log(`🔄 [会话重置] 重置会话 ${sessionId} 到阶段 ${targetStage}`);
    return true;
  }

  /**
   * Open Lovable 代码生成集成
   */
  async* callOpenLovableGeneration(
    message: string,
    sessionData: SessionData,
    context?: any
  ): AsyncGenerator<StreamableAgentResponse, void, unknown> {
    try {
      // 创建沙箱（如果不存在）
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const sandboxResponse = await fetch(`${baseUrl}/api/create-ai-sandbox`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!sandboxResponse.ok) {
        throw new Error('Failed to create sandbox');
      }

      const sandboxData = await sandboxResponse.json();
      
      yield {
        type: 'agent_response',
        immediate_display: {
          reply: `🚀 正在创建开发环境...\n沙箱ID: ${sandboxData.sandboxId}`,
          agent_name: 'OpenLovable',
          timestamp: new Date().toISOString()
        },
        system_state: {
          intent: 'code_generation',
          done: false,
          progress: 25,
          current_stage: '环境准备',
          metadata: {
            sandbox: sandboxData,
            agent_type: 'OpenLovable'
          }
        }
      };

      // 调用AI代码生成流式API
      const generateResponse = await fetch(`${baseUrl}/api/generate-ai-code-stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: message,
          model: 'claude-3-5-sonnet-20241022', // 使用Claude模型
          context: {
            sandboxId: sandboxData.sandboxId,
            currentProject: 'HeysMe Generated Project',
            userPreferences: (sessionData.metadata as any)?.userProfile || {}
          }
        })
      });

      if (!generateResponse.ok) {
        throw new Error('Failed to generate code');
      }

      // 流式处理AI响应
      const reader = generateResponse.body?.getReader();
      if (!reader) {
        throw new Error('No response stream available');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.content) {
                yield {
                  type: 'agent_response',
                  immediate_display: {
                    reply: data.content,
                    agent_name: 'OpenLovable',
                    timestamp: new Date().toISOString()
                  },
                  system_state: {
                    intent: 'code_generation',
                    done: false,
                    progress: 75,
                    current_stage: 'AI代码生成中',
                    metadata: {
                      streaming: true,
                      agent_type: 'OpenLovable'
                    }
                  }
                };
              }
            } catch (e) {
              // 忽略JSON解析错误，继续处理
            }
          }
        }
      }

      // 完成
      yield {
        type: 'agent_response',
        immediate_display: {
          reply: `✅ 代码生成完成！\n\n🔗 实时预览：${sandboxData.url}`,
          agent_name: 'OpenLovable',
          timestamp: new Date().toISOString()
        },
        system_state: {
          intent: 'code_generation',
          done: true,
          progress: 100,
          current_stage: '完成',
          metadata: {
            sandbox: sandboxData,
            preview_url: sandboxData.url,
            agent_type: 'OpenLovable'
          }
        }
      };

    } catch (error) {
      console.error('OpenLovable generation error:', error);
      
      yield {
        type: 'agent_response',
        immediate_display: {
          reply: `❌ 代码生成失败：${error instanceof Error ? error.message : '未知错误'}`,
          agent_name: 'OpenLovable',
          timestamp: new Date().toISOString()
        },
        system_state: {
          intent: 'error',
          done: true,
          metadata: {
            error: error instanceof Error ? error.message : String(error),
            agent_type: 'OpenLovable'
          }
        }
      };
    }
  }

}

// 导出单例实例
export const simpleMessageRouter = new SimpleMessageRouter();
