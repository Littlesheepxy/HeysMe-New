import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { SessionData } from '@/lib/types/session';
import { sessionManager } from '@/lib/utils/session-manager';

export async function POST(req: NextRequest) {
  try {
    console.log('🔄 [迁移API] 开始会话数据迁移...');

    // 检查用户认证
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: '用户未登录' 
      }, { status: 401 });
    }

    console.log(`🔍 [迁移API] 用户已登录: ${userId}`);

    // 获取前端传来的本地会话数据
    const { localSessions } = await req.json();
    
    if (!Array.isArray(localSessions) || localSessions.length === 0) {
      return NextResponse.json({
        success: true,
        message: '没有需要迁移的会话数据',
        migratedCount: 0
      });
    }

    console.log(`📊 [迁移API] 接收到 ${localSessions.length} 个本地会话`);

    // 获取已存在的会话，避免重复
    const existingSessions = await sessionManager.getAllActiveSessions();
    const existingSessionIds = new Set(existingSessions.map(s => s.id));

    let migratedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    // 逐个迁移会话
    for (const localSession of localSessions) {
      try {
        // 检查会话是否已存在
        if (existingSessionIds.has(localSession.id)) {
          skippedCount++;
          console.log(`⚠️ [迁移API] 跳过已存在的会话: ${localSession.id}`);
          continue;
        }

        // 验证和规范化会话数据
        const sessionData = validateAndNormalizeSession(localSession, userId);
        if (!sessionData) {
          skippedCount++;
          console.log(`⚠️ [迁移API] 跳过无效会话: ${localSession.id}`);
          continue;
        }

        // 保存会话到数据库
        await sessionManager.updateSession(sessionData.id, sessionData);
        migratedCount++;
        console.log(`✅ [迁移API] 会话迁移成功: ${sessionData.id}`);

      } catch (error) {
        errors.push(`会话 ${localSession.id} 迁移失败: ${error}`);
        console.error(`❌ [迁移API] 会话迁移失败:`, error);
      }
    }

    console.log(`🎉 [迁移API] 迁移完成: 成功 ${migratedCount} 个，跳过 ${skippedCount} 个，错误 ${errors.length} 个`);

    return NextResponse.json({
      success: true,
      message: `会话迁移完成！成功迁移 ${migratedCount} 个会话`,
      migratedCount,
      skippedCount,
      errorCount: errors.length,
      errors: errors.slice(0, 5) // 只返回前5个错误，避免响应过大
    });

  } catch (error) {
    console.error('❌ [迁移API] 迁移过程失败:', error);
    return NextResponse.json({
      success: false,
      error: `迁移失败: ${error instanceof Error ? error.message : '未知错误'}`
    }, { status: 500 });
  }
}

/**
 * 验证和规范化会话数据
 */
function validateAndNormalizeSession(rawSession: any, userId: string): SessionData | null {
  try {
    // 基本验证
    if (!rawSession.id || typeof rawSession.id !== 'string') {
      throw new Error('会话ID无效');
    }

    // 确保有对话历史且不为空
    if (!rawSession.conversationHistory || 
        !Array.isArray(rawSession.conversationHistory) || 
        rawSession.conversationHistory.length === 0) {
      return null; // 跳过空会话
    }

    // 构建标准化会话数据
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

    return sessionData;
    
  } catch (error) {
    console.error(`❌ [迁移API] 会话验证失败:`, error);
    return null;
  }
}