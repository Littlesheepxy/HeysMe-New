/**
 * 会话数据迁移工具
 * 用于将本地存储的会话数据迁移到 Supabase 数据库
 */

import { SessionData } from '@/lib/types/session';
import { sessionManager } from './session-manager';
import { safeCheckAuthStatus } from './auth-helper';

export interface MigrationResult {
  success: boolean;
  migratedCount: number;
  failedCount: number;
  errors: string[];
  details: {
    totalFound: number;
    validSessions: number;
    duplicates: number;
  };
}

export class SessionMigrationTool {
  
  /**
   * 检查本地存储中的会话数据
   */
  static checkLocalSessions(): { found: number; sessions: any[] } {
    if (typeof window === 'undefined') {
      return { found: 0, sessions: [] };
    }

    try {
      // 检查多种可能的本地存储键
      const possibleKeys = [
        'heysme_sessions',
        'sessions',
        'chat_sessions',
        'heysme_chat_sessions',
        'heys_me_sessions'
      ];

      let foundSessions: any[] = [];
      
      for (const key of possibleKeys) {
        const data = localStorage.getItem(key);
        if (data) {
          try {
            const parsed = JSON.parse(data);
            console.log(`🔍 [迁移工具] 在 localStorage['${key}'] 中找到数据:`, parsed);
            
            if (Array.isArray(parsed)) {
              foundSessions = foundSessions.concat(parsed);
            } else if (typeof parsed === 'object' && parsed !== null) {
              // 如果是对象，可能是会话映射
              if (parsed.sessions) {
                foundSessions = foundSessions.concat(parsed.sessions);
              } else {
                foundSessions.push(parsed);
              }
            }
          } catch (parseError) {
            console.warn(`⚠️ [迁移工具] 解析 ${key} 失败:`, parseError);
          }
        }
      }

      // 去重
      const uniqueSessions = foundSessions.filter((session, index, arr) => 
        arr.findIndex(s => s.id === session.id) === index
      );

      console.log(`📊 [迁移工具] 本地数据扫描完成: 找到 ${foundSessions.length} 个原始记录，去重后 ${uniqueSessions.length} 个`);
      
      return { 
        found: uniqueSessions.length, 
        sessions: uniqueSessions 
      };
      
    } catch (error) {
      console.error('❌ [迁移工具] 检查本地会话失败:', error);
      return { found: 0, sessions: [] };
    }
  }

  /**
   * 迁移本地会话到数据库
   */
  static async migrateLocalSessions(): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: false,
      migratedCount: 0,
      failedCount: 0,
      errors: [],
      details: {
        totalFound: 0,
        validSessions: 0,
        duplicates: 0
      }
    };

    try {
      // 1. 检查用户认证状态
      const { userId, isAuthenticated } = await safeCheckAuthStatus();
      if (!isAuthenticated || !userId) {
        result.errors.push('用户未登录，无法进行数据迁移');
        return result;
      }

      console.log(`🔄 [迁移工具] 开始为用户 ${userId} 迁移本地会话数据...`);

      // 2. 扫描本地数据
      const { found, sessions: localSessions } = this.checkLocalSessions();
      result.details.totalFound = found;

      if (found === 0) {
        console.log('ℹ️ [迁移工具] 未找到需要迁移的本地会话数据');
        result.success = true;
        return result;
      }

      // 3. 获取已存在的会话，避免重复迁移
      const existingSessions = await sessionManager.getAllActiveSessions();
      const existingSessionIds = new Set(existingSessions.map(s => s.id));

      // 4. 过滤和验证会话数据
      const validSessions: SessionData[] = [];
      
      for (const localSession of localSessions) {
        try {
          // 检查是否已存在
          if (existingSessionIds.has(localSession.id)) {
            result.details.duplicates++;
            console.log(`⚠️ [迁移工具] 跳过重复会话: ${localSession.id}`);
            continue;
          }

          // 验证会话数据结构
          const sessionData = this.validateAndNormalizeSession(localSession, userId);
          if (sessionData) {
            validSessions.push(sessionData);
            result.details.validSessions++;
          }
        } catch (error) {
          result.failedCount++;
          result.errors.push(`会话 ${localSession.id} 验证失败: ${error}`);
        }
      }

      console.log(`✅ [迁移工具] 验证完成: ${validSessions.length} 个有效会话准备迁移`);

      // 5. 批量迁移会话
      for (const sessionData of validSessions) {
        try {
          // 使用 sessionManager 的 API 来创建会话，确保完整的生命周期管理
          await sessionManager.updateSession(sessionData.id, sessionData);
          result.migratedCount++;
          console.log(`✅ [迁移工具] 会话迁移成功: ${sessionData.id}`);
        } catch (error) {
          result.failedCount++;
          result.errors.push(`会话 ${sessionData.id} 迁移失败: ${error}`);
          console.error(`❌ [迁移工具] 会话迁移失败:`, error);
        }
      }

      result.success = result.migratedCount > 0 || result.failedCount === 0;
      
      console.log(`🎉 [迁移工具] 迁移完成: 成功 ${result.migratedCount} 个，失败 ${result.failedCount} 个`);
      
      return result;

    } catch (error) {
      result.errors.push(`迁移过程发生错误: ${error}`);
      console.error('❌ [迁移工具] 迁移过程失败:', error);
      return result;
    }
  }

  /**
   * 验证和规范化会话数据
   */
  private static validateAndNormalizeSession(rawSession: any, userId: string): SessionData | null {
    try {
      // 基本字段验证
      if (!rawSession.id || typeof rawSession.id !== 'string') {
        throw new Error('会话ID无效');
      }

      // 确保有对话历史
      if (!rawSession.conversationHistory || !Array.isArray(rawSession.conversationHistory)) {
        console.warn(`⚠️ [迁移工具] 会话 ${rawSession.id} 没有有效的对话历史，跳过迁移`);
        return null;
      }

      // 只迁移有实际内容的会话
      if (rawSession.conversationHistory.length === 0) {
        console.warn(`⚠️ [迁移工具] 会话 ${rawSession.id} 对话历史为空，跳过迁移`);
        return null;
      }

      // 构建标准化的会话数据
      const sessionData: SessionData = {
        id: rawSession.id,
        userId: userId, // 关联到当前用户
        status: rawSession.status || 'active',
        title: rawSession.title,
        titleGeneratedAt: rawSession.titleGeneratedAt,
        titleModel: rawSession.titleModel,
        lastTitleMessageCount: rawSession.lastTitleMessageCount,
        
        userIntent: rawSession.userIntent || {
          primary_goal: '恢复的本地会话',
          context: '从本地存储迁移的会话数据'
        },
        
        personalization: rawSession.personalization || {},
        collectedData: rawSession.collectedData || {},
        
        conversationHistory: rawSession.conversationHistory.map((entry: any) => ({
          id: entry.id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          timestamp: new Date(entry.timestamp || Date.now()),
          type: entry.type || 'user_message',
          agent: entry.agent,
          content: entry.content || '',
          metadata: entry.metadata || {},
          userInteraction: entry.userInteraction
        })),
        
        agentFlow: rawSession.agentFlow || [],
        
        metadata: {
          createdAt: new Date(rawSession.metadata?.createdAt || rawSession.createdAt || Date.now()),
          updatedAt: new Date(),
          lastActive: new Date(rawSession.metadata?.lastActive || Date.now()),
          progress: rawSession.metadata?.progress || {},
          migrated: true, // 标记为迁移数据
          migratedAt: new Date().toISOString(),
          originalSource: 'localStorage'
        },
        
        generatedContent: rawSession.generatedContent
      };

      console.log(`✅ [迁移工具] 会话 ${sessionData.id} 验证通过，包含 ${sessionData.conversationHistory.length} 条对话记录`);
      
      return sessionData;
      
    } catch (error) {
      console.error(`❌ [迁移工具] 会话验证失败:`, error);
      return null;
    }
  }

  /**
   * 清理本地存储（迁移完成后调用）
   */
  static cleanupLocalSessions(): void {
    if (typeof window === 'undefined') return;

    const keysToClean = [
      'heysme_sessions',
      'sessions', 
      'chat_sessions',
      'heysme_chat_sessions',
      'heys_me_sessions'
    ];

    for (const key of keysToClean) {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        console.log(`🧹 [迁移工具] 清理本地存储: ${key}`);
      }
    }
  }
}

// 导出便捷方法
export const migrationTool = {
  check: SessionMigrationTool.checkLocalSessions,
  migrate: SessionMigrationTool.migrateLocalSessions,
  cleanup: SessionMigrationTool.cleanupLocalSessions
};