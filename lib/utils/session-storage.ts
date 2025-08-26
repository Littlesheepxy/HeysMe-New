/**
 * 会话存储管理 - Supabase版本
 * 
 * 负责会话数据的Supabase数据库存储
 */

import { SessionData } from '@/lib/types/session';
import { createServerClient } from '@/lib/supabase-server';
import { safeCheckAuthStatus } from './auth-helper';

/**
 * Supabase会话存储管理器
 * 
 * 提供基于Supabase数据库的存储接口
 */
export class SessionStorageManager {
  private supabase = createServerClient();

  /**
   * 确保值是Date对象，如果不是则转换为Date
   */
  private ensureDate(value: any): Date {
    if (value instanceof Date) {
      return value;
    }
    if (typeof value === 'string' || typeof value === 'number') {
      return new Date(value);
    }
    return new Date(); // 默认返回当前时间
  }

  /**
   * 从Supabase加载所有会话数据
   * @returns 会话数据Map
   */
  async loadAllSessions(): Promise<Map<string, SessionData>> {
    const sessions = new Map<string, SessionData>();
    
    try {
      const { userId, isAuthenticated } = await safeCheckAuthStatus();
      if (!isAuthenticated) {
        console.warn('⚠️ [存储] 用户未登录，无法加载会话');
        return sessions;
      }

      const { data: chatSessions, error } = await this.supabase
        .from('chat_sessions')
        .select(`
          *,
          conversation_entries(*),
          agent_flows(*)
        `)
        .eq('user_id', userId)
        .order('last_active', { ascending: false });

      if (error) {
        throw error;
      }

      if (chatSessions) {
        for (const session of chatSessions) {
          const sessionData = this.convertFromSupabase(session);
          sessions.set(sessionData.id, sessionData);
        }
        
        console.log(`✅ [存储-Supabase] 加载了 ${sessions.size} 个会话`);
      }
    } catch (error) {
      console.warn('⚠️ [存储] 从Supabase加载会话失败:', error);
    }

    return sessions;
  }

  /**
   * 保存所有会话数据到Supabase
   * @param sessions 会话数据Map
   */
  async saveAllSessions(sessions: Map<string, SessionData>): Promise<void> {
    try {
      const { userId, isAuthenticated } = await safeCheckAuthStatus();
      if (!isAuthenticated) {
        console.warn('⚠️ [存储] 用户未登录，无法保存会话');
        return;
      }

      const sessionEntries = Array.from(sessions.entries());
      
      for (const [sessionId, sessionData] of sessionEntries) {
        await this.saveSession(sessionData, userId || undefined);
      }
      
      console.log(`✅ [存储-Supabase] 保存了 ${sessions.size} 个会话`);
    } catch (error) {
      console.warn('⚠️ [存储] 保存会话到Supabase失败:', error);
    }
  }

  /**
   * 保存单个会话到Supabase
   * @param sessionData 会话数据
   * @param userId 用户ID
   */
  async saveSession(sessionData: SessionData, userId?: string): Promise<void> {
    try {
      // 🔧 环境变量检查，如果Supabase未配置则跳过
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.log('⚠️ [存储] Supabase未配置，跳过保存');
        return;
      }

      if (!userId) {
        const { userId: currentUserId, isAuthenticated } = await safeCheckAuthStatus();
        if (!isAuthenticated || !currentUserId) {
          console.log('⚠️ [存储] 用户未登录，会话将保存在内存中');
          return; // 改为return而不是throw，避免阻塞
        }
        userId = currentUserId;
      }

      // 🔧 修复：确保用户记录存在
      await this.ensureUserExists(userId);

      // 保存会话主记录（包含标题）
      const sessionMetadata = {
        ...sessionData.metadata,
        title: sessionData.title, // 将标题存储在metadata中
      };

      const { error: sessionError } = await this.supabase
        .from('chat_sessions')
        .upsert({
          id: sessionData.id,
          user_id: userId,
          status: sessionData.status,
          user_intent: sessionData.userIntent,
          personalization: sessionData.personalization,
          collected_data: sessionData.collectedData,
          metadata: sessionMetadata,
          generated_content: sessionData.generatedContent || {}, // 🔧 使用专门的字段存储生成内容
          created_at: this.ensureDate(sessionData.metadata.createdAt).toISOString(),
          updated_at: this.ensureDate(sessionData.metadata.updatedAt).toISOString(),
          last_active: this.ensureDate(sessionData.metadata.lastActive).toISOString(),
        });

      if (sessionError) {
        throw sessionError;
      }

      // 保存对话历史记录
      if (sessionData.conversationHistory.length > 0) {
        const conversationEntries = sessionData.conversationHistory.map(entry => ({
          id: entry.id,
          session_id: sessionData.id,
          timestamp: this.ensureDate(entry.timestamp).toISOString(),
          type: entry.type,
          agent: entry.agent,
          content: entry.content,
          metadata: entry.metadata || {},
          user_interaction: entry.userInteraction || null,
        }));

        const { error: conversationError } = await this.supabase
          .from('conversation_entries')
          .upsert(conversationEntries);

        if (conversationError) {
          throw conversationError;
        }
      }

      // 保存代理流程记录
      if (sessionData.agentFlow.length > 0) {
        const agentFlows = sessionData.agentFlow.map(flow => ({
          session_id: sessionData.id,
          agent_name: flow.agent || 'unknown', // 🔧 修复：确保agent_name不为null
          stage: flow.agent || 'unknown', // 🔧 修复：确保stage不为null
          status: flow.status || 'completed', // 🔧 修复：确保status不为null
          data: flow.input || {},
          start_time: this.ensureDate(flow.startTime).toISOString(),
          end_time: flow.endTime ? this.ensureDate(flow.endTime).toISOString() : null,
        }));

        const { error: flowError } = await this.supabase
          .from('agent_flows')
          .upsert(agentFlows);

        if (flowError) {
          throw flowError;
        }
      }

    } catch (error) {
      console.warn(`⚠️ [存储] 保存会话失败 ${sessionData.id}:`, error);
      console.warn('⚠️ [存储] 保存会话到Supabase失败:', error);
      
      // 🔧 网络错误时不抛出异常，避免阻塞系统运行
      if (error instanceof Error && error.message.includes('fetch failed')) {
        console.warn('⚠️ [存储] 网络连接失败，会话仅保存在内存中');
        return;
      }
      
      // 🔧 外键约束错误时，尝试创建用户后重试
      if (error && typeof error === 'object' && 'code' in error && error.code === '23503') {
        console.log('🔄 [存储] 检测到外键约束错误，尝试创建用户记录');
        try {
          await this.ensureUserExists(userId!);
          // 重试保存
          await this.saveSession(sessionData, userId);
          return;
        } catch (retryError) {
          console.warn('⚠️ [存储] 重试保存失败:', retryError);
        }
      }
      
      // 其他错误不抛出，避免阻塞系统
      return;
    }
  }

  /**
   * 🔧 新增：确保用户记录存在
   * @param userId 用户ID
   */
  private async ensureUserExists(userId: string): Promise<void> {
    try {
      // 检查用户是否存在
      const { data: existingUser, error: checkError } = await this.supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();

      if (existingUser) {
        return; // 用户已存在
      }

      // 如果用户不存在，创建用户记录
      if (checkError?.code === 'PGRST116') { // 记录不存在
        console.log(`🆕 [存储] 创建用户记录: ${userId}`);
        
        // 🔧 修复：处理邮箱唯一性约束
        const userEmail = `user_${userId.slice(-8)}@temp.heysme.local`;
        
        const { error: createError } = await this.supabase
          .from('users')
          .insert({
            id: userId,
            email: userEmail, // 使用临时邮箱避免冲突
            projects: ['HeysMe'],
            plan: 'free',
            default_model: 'claude-sonnet-4-20250514',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (createError) {
          // 🔧 如果仍然有邮箱冲突，尝试使用时间戳
          if (createError.code === '23505' && createError.message.includes('email')) {
            console.log('⚠️ [存储] 邮箱冲突，尝试使用时间戳邮箱');
            
            const timestampEmail = `user_${userId.slice(-8)}_${Date.now()}@temp.heysme.local`;
            const { error: retryError } = await this.supabase
              .from('users')
              .insert({
                id: userId,
                email: timestampEmail,
                projects: ['HeysMe'],
                plan: 'free',
                default_model: 'claude-sonnet-4-20250514',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });
              
            if (retryError) {
              console.warn('⚠️ [存储] 重试创建用户记录失败:', retryError);
              // 🔧 最后尝试：检查是否邮箱字段可以为null
              const { error: nullEmailError } = await this.supabase
                .from('users')
                .insert({
                  id: userId,
                  // email: null, // 尝试不设置邮箱
                  projects: ['HeysMe'],
                  plan: 'free',
                  default_model: 'claude-sonnet-4-20250514',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                });
                
              if (nullEmailError) {
                throw nullEmailError;
              }
            }
          } else {
            throw createError;
          }
        }
        
        console.log(`✅ [存储] 用户记录创建成功: ${userId}`);
      } else {
        throw checkError;
      }
    } catch (error) {
      console.warn(`⚠️ [存储] 确保用户存在失败 ${userId}:`, error);
      throw error;
    }
  }

  /**
   * 删除单个会话
   * @param sessionId 会话ID
   */
  async deleteSession(sessionId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('chat_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) {
        throw error;
      }
      
      console.log(`🗑️ [存储-Supabase] 删除会话: ${sessionId}`);
    } catch (error) {
      console.warn(`⚠️ [存储] 删除会话失败 ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * 清理过期的会话
   * @param expiredThreshold 过期时间阈值（毫秒）
   */
  async cleanupExpiredSessions(expiredThreshold: number = 24 * 60 * 60 * 1000): Promise<number> {
    try {
      const { userId, isAuthenticated } = await safeCheckAuthStatus();
      if (!isAuthenticated) {
        return 0;
      }

      const expiredDate = new Date(Date.now() - expiredThreshold);
      
      const { data, error } = await this.supabase
        .from('chat_sessions')
        .delete()
        .eq('user_id', userId)
        .eq('status', 'archived')
        .lt('last_active', expiredDate.toISOString())
        .select('id');

      if (error) {
        throw error;
      }

      const cleanedCount = data?.length || 0;
      if (cleanedCount > 0) {
        console.log(`🧹 [存储-Supabase] 清理了 ${cleanedCount} 个过期会话`);
      }

      return cleanedCount;
    } catch (error) {
      console.warn('⚠️ [存储] 清理过期会话失败:', error);
      return 0;
    }
  }

  /**
   * 获取存储统计信息
   */
  async getStorageStats(): Promise<{
    environment: 'supabase';
    storageLocation: string;
    totalSessions?: number;
    activeSessions?: number;
  }> {
    try {
      const { userId, isAuthenticated } = await safeCheckAuthStatus();
      if (!isAuthenticated) {
        return {
          environment: 'supabase',
          storageLocation: 'Supabase Database',
          totalSessions: 0,
          activeSessions: 0,
        };
      }

      const { count: totalSessions } = await this.supabase
        .from('chat_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      const { count: activeSessions } = await this.supabase
        .from('chat_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'active');

      return {
        environment: 'supabase',
        storageLocation: 'Supabase Database',
        totalSessions: totalSessions || 0,
        activeSessions: activeSessions || 0,
      };
    } catch (error) {
      console.warn('⚠️ [存储] 获取存储统计失败:', error);
      return {
        environment: 'supabase',
        storageLocation: 'Supabase Database',
        totalSessions: 0,
        activeSessions: 0,
      };
    }
  }

  /**
   * 将Supabase数据转换为SessionData格式
   */
  private convertFromSupabase(supabaseSession: any): SessionData {
    const conversationHistory = (supabaseSession.conversation_entries || []).map((entry: any) => ({
      id: entry.id,
      timestamp: new Date(entry.timestamp),
      type: entry.type,
      agent: entry.agent,
      content: entry.content,
      metadata: entry.metadata || {},
      userInteraction: entry.user_interaction || undefined,
    }));

    // 🎯 生成会话标题：优先使用存储的标题，否则根据第一条用户消息生成
    let title = supabaseSession.title || supabaseSession.metadata?.title;
    
    if (!title && conversationHistory.length > 0) {
      // 查找第一条用户消息
      const firstUserMessage = conversationHistory.find((entry: any) => entry.type === 'user_message');
      if (firstUserMessage && firstUserMessage.content) {
        // 生成简短标题（前20个字符）
        title = this.generateTitleFromContent(firstUserMessage.content);
      } else {
        title = '新对话';
      }
    } else if (!title) {
      title = '新对话';
    }

    return {
      id: supabaseSession.id,
      title, // 🎯 添加标题字段
      status: supabaseSession.status,
      userIntent: supabaseSession.user_intent || {},
      personalization: supabaseSession.personalization || {},
      collectedData: supabaseSession.collected_data || {},
      conversationHistory,
      agentFlow: (supabaseSession.agent_flows || []).map((flow: any) => ({
        id: flow.id,
        agentName: flow.agent_name,
        stage: flow.stage,
        status: flow.status,
        data: flow.data || {},
        startTime: new Date(flow.start_time),
        endTime: flow.end_time ? new Date(flow.end_time) : undefined,
      })),
      // 🔧 从专门的generated_content字段恢复
      generatedContent: supabaseSession.generated_content || undefined,
      metadata: {
        ...supabaseSession.metadata,
        createdAt: new Date(supabaseSession.created_at),
        updatedAt: new Date(supabaseSession.updated_at),
        lastActive: new Date(supabaseSession.last_active),
        // 🔧 修复：确保progress字段正确恢复，如果缺失则根据会话内容推断
        progress: this.inferProgressFromSession(supabaseSession, conversationHistory),
      },
    };
  }

  /**
   * 🔧 根据会话内容推断progress信息
   */
  private inferProgressFromSession(supabaseSession: any, conversationHistory: any[]): any {
    // 如果metadata中已有progress且包含currentStage，直接使用
    if (supabaseSession.metadata?.progress?.currentStage) {
      console.log(`✅ [会话恢复] 使用存储的阶段: ${supabaseSession.metadata.progress.currentStage}`);
      return supabaseSession.metadata.progress;
    }

    // 根据消息历史推断当前阶段
    let inferredStage = 'welcome';
    
    // 检查是否有代码生成相关的消息
    const hasCodeGeneration = conversationHistory.some(entry => 
      entry.metadata?.projectGenerated === true ||
      entry.metadata?.intent === 'project_complete' ||
      entry.metadata?.hasCode === true ||
      entry.agent === 'coding' ||
      (entry.type === 'agent_response' && entry.content?.includes('```'))
    );

    // 检查是否有设计相关的消息
    const hasDesign = conversationHistory.some(entry =>
      entry.agent === 'prompt_output' ||
      entry.metadata?.intent === 'design_complete'
    );

    // 检查是否有信息收集相关的消息
    const hasInfoCollection = conversationHistory.some(entry =>
      entry.agent === 'info_collection' ||
      entry.metadata?.intent === 'info_complete'
    );

    // 推断阶段
    if (hasCodeGeneration) {
      inferredStage = 'code_generation';
    } else if (hasDesign) {
      inferredStage = 'page_design';
    } else if (hasInfoCollection) {
      inferredStage = 'info_collection';
    } else {
      inferredStage = 'welcome';
    }

    console.log(`🔧 [会话恢复] 根据消息历史推断阶段: ${inferredStage} (消息数: ${conversationHistory.length})`);

    return {
      currentStage: inferredStage,
      completedStages: this.getCompletedStages(inferredStage),
      totalStages: 4,
      percentage: this.getProgressPercentage(inferredStage)
    };
  }

  /**
   * 根据当前阶段获取已完成的阶段列表
   */
  private getCompletedStages(currentStage: string): string[] {
    const stageOrder = ['welcome', 'info_collection', 'page_design', 'code_generation'];
    const currentIndex = stageOrder.indexOf(currentStage);
    return currentIndex > 0 ? stageOrder.slice(0, currentIndex) : [];
  }

  /**
   * 根据当前阶段获取进度百分比
   */
  private getProgressPercentage(currentStage: string): number {
    const stageProgress: Record<string, number> = {
      'welcome': 10,
      'info_collection': 40,
      'page_design': 70,
      'code_generation': 90
    };
    return stageProgress[currentStage] || 0;
  }

  /**
   * 🎯 从内容生成标题
   * @param content 消息内容
   * @returns 生成的标题
   */
  private generateTitleFromContent(content: string): string {
    // 清理内容
    const cleanContent = content.replace(/\n+/g, ' ').trim();
    
    // 如果内容太短，直接使用
    if (cleanContent.length <= 20) {
      return cleanContent;
    }
    
    // 截取前20个字符，确保不会截断单词
    let title = cleanContent.substring(0, 20);
    
    // 如果最后一个字符不是空格，找到最后一个空格
    if (cleanContent[20] && cleanContent[20] !== ' ') {
      const lastSpaceIndex = title.lastIndexOf(' ');
      if (lastSpaceIndex > 10) { // 确保标题不会太短
        title = title.substring(0, lastSpaceIndex);
      }
    }
    
    return title + '...';
  }
}

// 导出单例实例
export const sessionStorage = new SessionStorageManager(); 