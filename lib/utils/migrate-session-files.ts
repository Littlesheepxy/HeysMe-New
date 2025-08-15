/**
 * 🔄 会话文件迁移工具
 * 将现有的 sessionData.metadata.projectFiles 迁移到Supabase存储
 */

import { SessionData } from '@/lib/types/session';
import { projectFileStorage, ProjectFile } from '@/lib/services/project-file-storage';

export interface MigrationResult {
  success: boolean;
  projectId?: string;
  commitId?: string;
  migratedFiles: number;
  error?: string;
}

export class SessionFilesMigrator {
  /**
   * 🔄 迁移单个会话的文件
   */
  async migrateSession(
    sessionData: SessionData,
    userId: string,
    force: boolean = false
  ): Promise<MigrationResult> {
    try {
      // 检查是否已经迁移
      const metadata = sessionData.metadata as any;
      if (metadata?.migratedToSupabase && !force) {
        console.log('ℹ️ [迁移跳过] 会话已迁移:', sessionData.id);
        return {
          success: true,
          migratedFiles: 0
        };
      }
      
      // 获取项目文件
      const projectFiles = metadata?.projectFiles || [];
      if (projectFiles.length === 0) {
        console.log('ℹ️ [迁移跳过] 会话无项目文件:', sessionData.id);
        return {
          success: true,
          migratedFiles: 0
        };
      }
      
      console.log('🔄 [开始迁移] 会话:', sessionData.id, '文件数量:', projectFiles.length);
      
      // 转换文件格式
      const convertedFiles: ProjectFile[] = projectFiles.map((file: any) => ({
        filename: file.filename,
        content: file.content,
        language: file.language || 'typescript',
        file_type: this.mapFileType(file.filename),
        description: file.description
      }));
      
      // 保存到Supabase
      const result = await projectFileStorage.saveIncrementalEdit(
        sessionData.id,
        userId,
        '数据迁移 - 从会话存储迁移到Supabase',
        convertedFiles,
        'MigrationAgent'
      );
      
      console.log('✅ [迁移成功] 会话:', sessionData.id, '项目ID:', result.projectId);
      
      return {
        success: true,
        projectId: result.projectId,
        commitId: result.commitId,
        migratedFiles: convertedFiles.length
      };
      
    } catch (error) {
      console.error('❌ [迁移失败] 会话:', sessionData.id, error);
      
      return {
        success: false,
        migratedFiles: 0,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }
  
  /**
   * 🔄 批量迁移多个会话
   */
  async migrateBatch(
    sessions: SessionData[],
    userId: string,
    options: {
      force?: boolean;
      maxConcurrent?: number;
      onProgress?: (completed: number, total: number, current: SessionData) => void;
    } = {}
  ): Promise<{
    total: number;
    success: number;
    failed: number;
    results: Array<{ sessionId: string; result: MigrationResult }>;
  }> {
    const { force = false, maxConcurrent = 3, onProgress } = options;
    const results: Array<{ sessionId: string; result: MigrationResult }> = [];
    
    let completed = 0;
    let success = 0;
    let failed = 0;
    
    // 分批处理，避免并发过多
    for (let i = 0; i < sessions.length; i += maxConcurrent) {
      const batch = sessions.slice(i, i + maxConcurrent);
      
      const batchPromises = batch.map(async (session) => {
        const result = await this.migrateSession(session, userId, force);
        
        completed++;
        if (result.success) {
          success++;
        } else {
          failed++;
        }
        
        if (onProgress) {
          onProgress(completed, sessions.length, session);
        }
        
        return { sessionId: session.id, result };
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }
    
    return {
      total: sessions.length,
      success,
      failed,
      results
    };
  }
  
  /**
   * 📊 生成迁移报告
   */
  generateReport(results: Array<{ sessionId: string; result: MigrationResult }>): string {
    const successful = results.filter(r => r.result.success);
    const failed = results.filter(r => !r.result.success);
    const totalFiles = successful.reduce((sum, r) => sum + r.result.migratedFiles, 0);
    
    let report = `
# 🔄 会话文件迁移报告

## 📊 总体统计
- 🎯 **处理会话数**: ${results.length}
- ✅ **成功迁移**: ${successful.length}
- ❌ **迁移失败**: ${failed.length}
- 📁 **迁移文件总数**: ${totalFiles}

## ✅ 成功迁移的会话
${successful.map(r => `- ${r.sessionId} (${r.result.migratedFiles} 个文件)`).join('\n')}

## ❌ 迁移失败的会话
${failed.map(r => `- ${r.sessionId}: ${r.result.error}`).join('\n')}

## 🚀 后续步骤
1. 验证迁移后的项目文件是否完整
2. 更新相关代码以使用新的存储系统
3. 清理旧的会话存储数据（可选）
`;
    
    return report.trim();
  }
  
  /**
   * 🛠️ 映射文件类型
   */
  private mapFileType(filename: string): 'page' | 'component' | 'config' | 'styles' | 'data' {
    if (filename.includes('/pages/') || (filename.includes('/app/') && filename.endsWith('page.tsx'))) {
      return 'page';
    }
    if (filename.includes('/components/')) {
      return 'component';
    }
    if (filename.includes('.config.') || filename.includes('package.json') || filename.endsWith('.json')) {
      return 'config';
    }
    if (filename.includes('.css') || filename.includes('.scss') || filename.includes('.module.')) {
      return 'styles';
    }
    return 'data';
  }
}

// 🎯 导出单例实例
export const sessionFilesMigrator = new SessionFilesMigrator();
