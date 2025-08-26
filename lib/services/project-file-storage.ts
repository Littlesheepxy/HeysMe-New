/**
 * 🚀 项目文件存储服务
 * 基于Supabase实现类似Git的文件版本控制
 */

import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

// 🎯 类型定义
export interface ProjectFile {
  id?: string;
  filename: string;
  content: string;
  language: string;
  file_type: 'page' | 'component' | 'config' | 'styles' | 'data';
  change_type?: 'added' | 'modified' | 'deleted' | 'renamed';
  description?: string;
}

export interface ProjectInfo {
  id: string;
  name: string;
  description?: string;
  framework: string;
  session_id: string;
  user_id: string;
  deployment_url?: string;
  status: 'active' | 'archived' | 'deleted';
}

export interface CommitInfo {
  id: string;
  message: string;
  type: 'initial' | 'manual' | 'auto' | 'ai_edit';
  ai_agent?: string;
  user_prompt?: string;
  files_added: number;
  files_modified: number;
  files_deleted: number;
  created_at: string;
}

// 🔧 Supabase客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export class ProjectFileStorageService {
  /**
   * 🆕 创建新项目
   */
  async createProject(
    sessionId: string,
    userId: string,
    projectData: {
      name: string;
      description?: string;
      framework?: string;
      template?: string;
    },
    initialFiles: ProjectFile[]
  ): Promise<{ projectId: string; commitId: string }> {
    try {
      // 1. 生成项目ID
      const projectId = `proj_${Date.now()}_${this.generateRandomString(8)}`;
      
      console.log('🚀 [项目创建] 开始创建项目:', projectId);
      
      // 2. 确保会话记录存在（避免外键约束错误）
      await this.ensureSessionExists(sessionId, userId);
      
      // 3. 创建项目记录
      const { error: projectError } = await supabase
        .from('projects')
        .insert({
          id: projectId,
          user_id: userId,
          session_id: sessionId,
          name: projectData.name,
          description: projectData.description,
          framework: projectData.framework || 'next.js',
          template: projectData.template,
          status: 'active',
          total_files: initialFiles.length,
          total_commits: 1
        });
      
      if (projectError) {
        throw new Error(`项目创建失败: ${projectError.message}`);
      }
      
      // 3. 创建初始提交
      const commitId = await this.createCommit(
        projectId,
        userId,
        '🎉 Initial commit - Project created',
        initialFiles,
        'initial'
      );
      
      console.log('✅ [项目创建] 项目创建成功:', { projectId, commitId });
      
      return { projectId, commitId };
      
    } catch (error) {
      console.error('❌ [项目创建] 失败:', error);
      throw error;
    }
  }
  
  /**
   * 📝 创建新提交（保存文件变更）
   */
  async createCommit(
    projectId: string,
    userId: string,
    message: string,
    files: ProjectFile[],
    type: CommitInfo['type'] = 'manual',
    aiAgent?: string,
    userPrompt?: string
  ): Promise<string> {
    try {
      console.log('📝 [提交创建] 开始创建提交:', { projectId, message, filesCount: files.length });
      
      // 使用数据库函数创建提交
      const { data, error } = await supabase.rpc('create_commit', {
        project_id_param: projectId,
        user_id_param: userId,
        message_param: message,
        files_param: files.map(file => ({
          filename: file.filename,
          content: file.content,
          language: file.language,
          file_type: file.file_type,
          change_type: file.change_type || 'added'
        })),
        commit_type_param: type,
        ai_agent_param: aiAgent,
        user_prompt_param: userPrompt
      });
      
      if (error) {
        throw new Error(`提交创建失败: ${error.message}`);
      }
      
      const commitId = data as string;
      console.log('✅ [提交创建] 提交创建成功:', commitId);
      
      return commitId;
      
    } catch (error) {
      console.error('❌ [提交创建] 失败:', error);
      throw error;
    }
  }
  
  /**
   * 📖 获取项目最新文件
   */
  async getProjectFiles(projectId: string): Promise<ProjectFile[]> {
    try {
      console.log('📖 [文件读取] 获取项目文件:', projectId);
      
      const { data, error } = await supabase.rpc('get_project_files', {
        project_id_param: projectId
      });
      
      if (error) {
        throw new Error(`文件读取失败: ${error.message}`);
      }
      
      const files = (data as any[]).map(file => ({
        id: file.id,
        filename: file.filename,
        content: file.content,
        language: file.language,
        file_type: file.file_type,
        change_type: file.change_type
      })) as ProjectFile[];
      
      console.log('✅ [文件读取] 成功读取文件:', files.length);
      
      return files;
      
    } catch (error) {
      console.error('❌ [文件读取] 失败:', error);
      throw error;
    }
  }
  
  /**
   * 🔍 根据会话ID查找项目
   */
  async getProjectBySessionId(sessionId: string): Promise<ProjectInfo | null> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('session_id', sessionId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw new Error(`项目查询失败: ${error.message}`);
      }
      
      return data as ProjectInfo || null;
      
    } catch (error) {
      console.error('❌ [项目查询] 失败:', error);
      return null;
    }
  }
  
  /**
   * 🔄 AI增量编辑（类似Git的增量提交）
   */
  async saveIncrementalEdit(
    sessionId: string,
    userId: string,
    userPrompt: string,
    modifiedFiles: ProjectFile[],
    aiAgent: string = 'CodingAgent'
  ): Promise<{ projectId: string; commitId: string }> {
    try {
      console.log('🔄 [增量编辑] 开始保存:', { sessionId, filesCount: modifiedFiles.length });
      
      // 1. 查找或创建项目
      let project = await this.getProjectBySessionId(sessionId);
      
      if (!project) {
        // 创建新项目
        const result = await this.createProject(
          sessionId,
          userId,
          {
            name: `Project_${sessionId.slice(-8)}`,
            description: `AI生成的项目 - ${userPrompt.slice(0, 50)}...`,
            framework: 'next.js'
          },
          modifiedFiles
        );
        
        return result;
      }
      
      // 2. 创建增量提交
      const commitMessage = `🤖 AI编辑: ${userPrompt.slice(0, 100)}${userPrompt.length > 100 ? '...' : ''}`;
      
      const commitId = await this.createCommit(
        project.id,
        userId,
        commitMessage,
        modifiedFiles,
        'ai_edit',
        aiAgent,
        userPrompt
      );
      
      console.log('✅ [增量编辑] 保存成功:', { projectId: project.id, commitId });
      
      return { projectId: project.id, commitId };
      
    } catch (error) {
      console.error('❌ [增量编辑] 失败:', error);
      throw error;
    }
  }
  
  /**
   * 📊 获取项目统计信息
   */
  async getProjectStats(projectId: string): Promise<{
    totalFiles: number;
    totalCommits: number;
    latestCommit: CommitInfo | null;
    fileTypes: Record<string, number>;
  }> {
    try {
      // 获取项目基本信息
      const { data: project, error: projectError } = await supabase
        .from('project_overview')
        .select('*')
        .eq('id', projectId)
        .single();
      
      if (projectError) {
        throw new Error(`项目信息查询失败: ${projectError.message}`);
      }
      
      // 获取最新提交
      const { data: latestCommit, error: commitError } = await supabase
        .from('project_commits')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      // 获取文件类型统计
      const { data: fileStats, error: fileStatsError } = await supabase
        .from('project_files')
        .select('file_type')
        .eq('project_id', projectId)
        .neq('change_type', 'deleted');
      
      const fileTypes = (fileStats || []).reduce((acc, file) => {
        acc[file.file_type] = (acc[file.file_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      return {
        totalFiles: project.total_files || 0,
        totalCommits: project.total_commits || 0,
        latestCommit: latestCommit as CommitInfo || null,
        fileTypes
      };
      
    } catch (error) {
      console.error('❌ [项目统计] 失败:', error);
      throw error;
    }
  }
  
  /**
   * 🚀 更新部署信息
   */
  async updateDeployment(
    projectId: string,
    deploymentUrl: string,
    status: 'deployed' | 'failed' = 'deployed'
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          deployment_url: deploymentUrl,
          deployment_status: status,
          last_deployed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId);
      
      if (error) {
        throw new Error(`部署信息更新失败: ${error.message}`);
      }
      
      console.log('✅ [部署更新] 部署信息已更新:', { projectId, deploymentUrl, status });
      
    } catch (error) {
      console.error('❌ [部署更新] 失败:', error);
      throw error;
    }
  }
  
  /**
   * 🔍 查询提交历史
   */
  async getCommitHistory(projectId: string, limit: number = 10): Promise<CommitInfo[]> {
    try {
      const { data, error } = await supabase
        .from('project_commits')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) {
        throw new Error(`提交历史查询失败: ${error.message}`);
      }
      
      return data as CommitInfo[];
      
    } catch (error) {
      console.error('❌ [提交历史] 失败:', error);
      throw error;
    }
  }
  
  /**
   * 🔧 确保会话记录存在（避免外键约束错误）
   */
  private async ensureSessionExists(sessionId: string, userId: string): Promise<void> {
    try {
      // 检查会话是否存在
      const { data: existingSession, error: checkError } = await supabase
        .from('chat_sessions')
        .select('id')
        .eq('id', sessionId)
        .single();

      if (checkError && checkError.code === 'PGRST116') {
        // 会话不存在，创建基础会话记录
        console.log('🔧 [会话创建] 创建基础会话记录:', sessionId);
        
        const { error: insertError } = await supabase
          .from('chat_sessions')
          .insert({
            id: sessionId,
            user_id: userId,
            status: 'active',
            user_intent: {},
            personalization: {},
            collected_data: {},
            metadata: {
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              lastActive: new Date().toISOString(),
              source: 'project_creation'
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            last_active: new Date().toISOString()
          });

        if (insertError) {
          console.warn('⚠️ [会话创建] 创建会话记录失败:', insertError.message);
          // 不抛出错误，继续项目创建流程
        } else {
          console.log('✅ [会话创建] 基础会话记录创建成功');
        }
      } else if (checkError) {
        console.warn('⚠️ [会话检查] 检查会话存在性失败:', checkError.message);
      } else {
        console.log('✅ [会话检查] 会话记录已存在');
      }
    } catch (error) {
      console.warn('⚠️ [会话确保] 确保会话存在失败:', error);
      // 不抛出错误，让项目创建继续进行
    }
  }

  /**
   * 🛠️ 工具方法：生成随机字符串
   */
  private generateRandomString(length: number): string {
    return Math.random().toString(36).substring(2, 2 + length);
  }
  
  /**
   * 🛠️ 工具方法：生成内容哈希
   */
  private generateContentHash(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }
}

// 🎯 导出单例实例
export const projectFileStorage = new ProjectFileStorageService();
