import { createHash } from 'crypto';
import { CodingSession, CodingFile, ToolExecutionHistory, FileBatchOperation, FileOperation } from '@/lib/types/coding-session';

// 🔧 注意：这是一个模拟实现
// 在实际项目中，这里应该连接到Supabase或其他数据库
// 现在使用内存存储进行演示

class CodingDatabaseService {
  // 模拟数据存储
  private sessions: Map<string, CodingSession> = new Map();
  private files: Map<string, CodingFile> = new Map();
  private toolHistory: Map<string, ToolExecutionHistory[]> = new Map();

  /**
   * 创建或更新coding session
   */
  async upsertSession(sessionData: Partial<CodingSession>): Promise<CodingSession> {
    const now = new Date().toISOString();
    const existingSession = sessionData.sessionId ? this.sessions.get(sessionData.sessionId) : null;

    const session: CodingSession = {
      id: existingSession?.id || `cs_${Date.now()}`,
      userId: sessionData.userId || existingSession?.userId || '',
      sessionId: sessionData.sessionId || existingSession?.sessionId || `session_${Date.now()}`,
      title: sessionData.title || existingSession?.title,
      description: sessionData.description || existingSession?.description,
      status: sessionData.status || existingSession?.status || 'active',
      metadata: {
        mode: 'coding',
        agent_name: 'CodingAgent',
        created_at: now,
        ...existingSession?.metadata,
        ...sessionData.metadata,
        updated_at: now
      },
      files: existingSession?.files || [],
      created_at: existingSession?.created_at || now,
      updated_at: now
    };

    this.sessions.set(session.sessionId, session);
    console.log('💾 [数据库] Session已保存:', session.sessionId);
    
    return session;
  }

  /**
   * 获取coding session
   */
  async getSession(sessionId: string): Promise<CodingSession | null> {
    const session = this.sessions.get(sessionId);
    if (session) {
      // 加载关联的文件
      const files = Array.from(this.files.values()).filter(f => f.sessionId === sessionId);
      session.files = files;
    }
    return session || null;
  }

  /**
   * 创建或更新文件
   */
  async upsertFile(fileData: Omit<CodingFile, 'id' | 'created_at' | 'updated_at'> & { id?: string }): Promise<CodingFile> {
    const now = new Date().toISOString();
    const existingFile = fileData.id ? this.files.get(fileData.id) : 
                        Array.from(this.files.values()).find(f => 
                          f.sessionId === fileData.sessionId && f.path === fileData.path
                        );

    // 计算内容校验和
    const checksum = this.calculateChecksum(fileData.content);
    
    // 判断是否为新版本
    const isContentChanged = existingFile ? existingFile.checksum !== checksum : true;
    const newVersion = existingFile ? (isContentChanged ? existingFile.version + 1 : existingFile.version) : 1;

    const file: CodingFile = {
      id: existingFile?.id || `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sessionId: fileData.sessionId,
      path: fileData.path,
      content: fileData.content,
      language: fileData.language,
      size: fileData.content.length,
      checksum,
      version: newVersion,
      status: isContentChanged ? (existingFile ? 'modified' : 'created') : 'synced',
      metadata: {
        ...existingFile?.metadata,
        ...fileData.metadata,
        last_modified: now
      },
      created_at: existingFile?.created_at || now,
      updated_at: now
    };

    this.files.set(file.id, file);
    
    // 更新session的文件列表
    const session = this.sessions.get(fileData.sessionId);
    if (session) {
      const fileIndex = session.files.findIndex(f => f.path === file.path);
      if (fileIndex >= 0) {
        session.files[fileIndex] = file;
      } else {
        session.files.push(file);
      }
      session.updated_at = now;
      this.sessions.set(session.sessionId, session);
    }

    console.log('📁 [数据库] 文件已保存:', {
      path: file.path,
      version: file.version,
      status: file.status,
      size: file.size
    });

    return file;
  }

  /**
   * 获取session的所有文件
   */
  async getFiles(sessionId: string): Promise<CodingFile[]> {
    return Array.from(this.files.values()).filter(f => f.sessionId === sessionId);
  }

  /**
   * 获取特定文件
   */
  async getFile(sessionId: string, filePath: string): Promise<CodingFile | null> {
    return Array.from(this.files.values()).find(f => 
      f.sessionId === sessionId && f.path === filePath
    ) || null;
  }

  /**
   * 删除文件
   */
  async deleteFile(sessionId: string, filePath: string): Promise<boolean> {
    const file = await this.getFile(sessionId, filePath);
    if (file) {
      this.files.delete(file.id);
      
      // 从session中移除
      const session = this.sessions.get(sessionId);
      if (session) {
        session.files = session.files.filter(f => f.path !== filePath);
        session.updated_at = new Date().toISOString();
        this.sessions.set(sessionId, session);
      }
      
      console.log('🗑️ [数据库] 文件已删除:', filePath);
      return true;
    }
    return false;
  }

  /**
   * 记录工具执行历史
   */
  async recordToolExecution(data: Omit<ToolExecutionHistory, 'id'>): Promise<ToolExecutionHistory> {
    const record: ToolExecutionHistory = {
      id: `tool_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...data
    };

    const sessionHistory = this.toolHistory.get(data.sessionId) || [];
    sessionHistory.push(record);
    this.toolHistory.set(data.sessionId, sessionHistory);

    console.log('🔧 [数据库] 工具执行已记录:', {
      tool: record.toolName,
      status: record.status,
      duration: record.duration
    });

    return record;
  }

  /**
   * 获取工具执行历史
   */
  async getToolHistory(sessionId: string): Promise<ToolExecutionHistory[]> {
    return this.toolHistory.get(sessionId) || [];
  }

  /**
   * 批量文件操作
   */
  async executeBatchOperation(operation: Omit<FileBatchOperation, 'id'>): Promise<FileBatchOperation> {
    const batchOp: FileBatchOperation = {
      id: `batch_${Date.now()}`,
      ...operation
    };

    console.log('📦 [数据库] 执行批量操作:', {
      sessionId: batchOp.sessionId,
      operationCount: batchOp.operations.length,
      description: batchOp.description
    });

    // 执行每个操作
    for (const op of batchOp.operations) {
      try {
        switch (op.type) {
          case 'create':
          case 'update':
            await this.upsertFile(op.file);
            break;
          case 'delete':
            await this.deleteFile(batchOp.sessionId, op.filePath);
            break;
          case 'rename':
            const file = await this.getFile(batchOp.sessionId, op.oldPath);
            if (file) {
              await this.deleteFile(batchOp.sessionId, op.oldPath);
              await this.upsertFile({ ...file, path: op.newPath });
            }
            break;
        }
      } catch (error) {
        console.error('❌ [数据库] 批量操作失败:', op, error);
        throw error;
      }
    }

    return batchOp;
  }

  /**
   * 获取项目统计信息
   */
  async getProjectStats(sessionId: string): Promise<{
    totalFiles: number;
    totalSize: number;
    languageBreakdown: Record<string, number>;
    lastModified: string;
    fileTypes: Record<string, number>;
  }> {
    const files = await this.getFiles(sessionId);
    
    const stats = {
      totalFiles: files.length,
      totalSize: files.reduce((sum, f) => sum + f.size, 0),
      languageBreakdown: {} as Record<string, number>,
      lastModified: files.reduce((latest, f) => 
        f.updated_at > latest ? f.updated_at : latest, ''
      ),
      fileTypes: {} as Record<string, number>
    };

    files.forEach(file => {
      // 语言统计
      stats.languageBreakdown[file.language] = (stats.languageBreakdown[file.language] || 0) + 1;
      
      // 文件类型统计
      const type = file.metadata.type || 'other';
      stats.fileTypes[type] = (stats.fileTypes[type] || 0) + 1;
    });

    return stats;
  }

  /**
   * 计算内容校验和
   */
  private calculateChecksum(content: string): string {
    return createHash('md5').update(content).digest('hex');
  }

  /**
   * 清理过期数据
   */
  async cleanup(olderThanDays: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    const cutoffTime = cutoffDate.toISOString();

    let cleanedCount = 0;

    // 清理过期sessions
    Array.from(this.sessions.entries()).forEach(([sessionId, session]) => {
      if (session.updated_at < cutoffTime && session.status !== 'active') {
        this.sessions.delete(sessionId);
        
        // 清理相关文件
        Array.from(this.files.entries()).forEach(([fileId, file]) => {
          if (file.sessionId === sessionId) {
            this.files.delete(fileId);
            cleanedCount++;
          }
        });
        
        // 清理工具历史
        this.toolHistory.delete(sessionId);
        cleanedCount++;
      }
    });

    console.log('🧹 [数据库] 清理完成:', `删除了 ${cleanedCount} 个过期项目`);
    return cleanedCount;
  }
}

// 导出单例实例
export const codingDb = new CodingDatabaseService(); 