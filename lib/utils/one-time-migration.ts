/**
 * 一次性会话数据迁移工具
 * 用于将本地存储的会话数据迁移到数据库
 */

export interface LocalSessionData {
  id: string;
  conversationHistory: any[];
  [key: string]: any;
}

export interface MigrationResult {
  success: boolean;
  message: string;
  migratedCount: number;
  skippedCount: number;
  errorCount: number;
  errors?: string[];
}

/**
 * 扫描本地存储中的会话数据
 */
export function scanLocalSessions(): LocalSessionData[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    console.log('🔍 [一次性迁移] 开始扫描本地存储...');
    
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
          console.log(`🔍 [一次性迁移] 在 localStorage['${key}'] 中找到数据，类型: ${typeof parsed}`);
          
          if (Array.isArray(parsed)) {
            foundSessions = foundSessions.concat(parsed);
            console.log(`📄 [一次性迁移] 从 ${key} 提取了 ${parsed.length} 个会话`);
          } else if (typeof parsed === 'object' && parsed !== null) {
            // 检查各种可能的对象结构
            if (parsed.sessions && Array.isArray(parsed.sessions)) {
              foundSessions = foundSessions.concat(parsed.sessions);
              console.log(`📄 [一次性迁移] 从 ${key}.sessions 提取了 ${parsed.sessions.length} 个会话`);
            } else if (parsed.id) {
              // 单个会话对象
              foundSessions.push(parsed);
              console.log(`📄 [一次性迁移] 从 ${key} 提取了 1 个会话对象`);
            } else {
              // 可能是Map结构或其他对象
              const values = Object.values(parsed);
              const sessionLikeValues = values.filter(v => 
                v && typeof v === 'object' && (v as any).id && (v as any).conversationHistory
              );
              if (sessionLikeValues.length > 0) {
                foundSessions = foundSessions.concat(sessionLikeValues);
                console.log(`📄 [一次性迁移] 从 ${key} 对象值中提取了 ${sessionLikeValues.length} 个会话`);
              }
            }
          }
        } catch (parseError) {
          console.warn(`⚠️ [一次性迁移] 解析 ${key} 失败:`, parseError);
        }
      }
    }

    // 去重并过滤有效会话
    const uniqueSessions = foundSessions
      .filter((session, index, arr) => 
        session && session.id && arr.findIndex(s => s && s.id === session.id) === index
      )
      .filter(session => 
        session.conversationHistory && 
        Array.isArray(session.conversationHistory) && 
        session.conversationHistory.length > 0
      );

    console.log(`📊 [一次性迁移] 扫描完成: 原始 ${foundSessions.length} 个，去重过滤后 ${uniqueSessions.length} 个有效会话`);
    
    // 显示会话详情
    uniqueSessions.forEach((session, index) => {
      console.log(`📝 [一次性迁移] 会话 ${index + 1}: ${session.id}, 对话数: ${session.conversationHistory?.length || 0}`);
    });
    
    return uniqueSessions;
    
  } catch (error) {
    console.error('❌ [一次性迁移] 扫描本地存储失败:', error);
    return [];
  }
}

/**
 * 执行一次性迁移
 */
export async function performOneTimeMigration(): Promise<MigrationResult> {
  try {
    console.log('🚀 [一次性迁移] 开始执行迁移...');
    
    // 1. 扫描本地数据
    const localSessions = scanLocalSessions();
    
    if (localSessions.length === 0) {
      const result = {
        success: true,
        message: '没有找到需要迁移的本地会话数据',
        migratedCount: 0,
        skippedCount: 0,
        errorCount: 0
      };
      console.log('ℹ️ [一次性迁移] 没有找到本地数据');
      return result;
    }

    console.log(`🔄 [一次性迁移] 准备迁移 ${localSessions.length} 个本地会话...`);

    // 2. 调用后端API进行迁移
    const response = await fetch('/api/migrate-sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        localSessions: localSessions
      })
    });

    if (!response.ok) {
      throw new Error(`迁移API调用失败: ${response.status} ${response.statusText}`);
    }

    const result: MigrationResult = await response.json();
    
    if (result.success && result.migratedCount > 0) {
      console.log(`✅ [一次性迁移] 迁移成功! ${result.migratedCount} 个会话已保存到数据库`);
      
      // 3. 迁移成功后，清理本地存储
      cleanupLocalStorage();
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ [一次性迁移] 迁移失败:', error);
    return {
      success: false,
      message: `迁移失败: ${error instanceof Error ? error.message : '未知错误'}`,
      migratedCount: 0,
      skippedCount: 0,
      errorCount: 1,
      errors: [String(error)]
    };
  }
}

/**
 * 清理本地存储
 */
function cleanupLocalStorage(): void {
  if (typeof window === 'undefined') return;

  const keysToClean = [
    'heysme_sessions',
    'sessions', 
    'chat_sessions',
    'heysme_chat_sessions',
    'heys_me_sessions'
  ];

  console.log('🧹 [一次性迁移] 开始清理本地存储...');
  
  for (const key of keysToClean) {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
      console.log(`🗑️ [一次性迁移] 已清理: ${key}`);
    }
  }
  
  console.log('✨ [一次性迁移] 本地存储清理完成');
}

/**
 * 检查是否需要迁移
 */
export function needsMigration(): boolean {
  const localSessions = scanLocalSessions();
  return localSessions.length > 0;
}

// 导出便捷方法
export const oneTimeMigration = {
  scan: scanLocalSessions,
  migrate: performOneTimeMigration,
  needsMigration,
  cleanup: cleanupLocalStorage
};