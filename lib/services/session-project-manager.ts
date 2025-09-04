/**
 * 会话级别的项目管理服务
 * 确保增量模式下所有文件都保存到同一个项目中
 */

import { ProjectFileStorageService } from './project-file-storage';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface SessionProjectFile {
  filename: string;
  content: string;
  language: string;
  file_type?: string;
  change_type?: 'added' | 'modified' | 'deleted';
}

export class SessionProjectManager {
  private static instance: SessionProjectManager;
  private projectFileService: ProjectFileStorageService;
  private sessionProjects: Map<string, string> = new Map(); // sessionId -> projectId

  constructor() {
    this.projectFileService = new ProjectFileStorageService();
  }

  static getInstance(): SessionProjectManager {
    if (!SessionProjectManager.instance) {
      SessionProjectManager.instance = new SessionProjectManager();
    }
    return SessionProjectManager.instance;
  }

  /**
   * 获取或创建会话对应的项目
   */
  async getOrCreateSessionProject(
    sessionId: string,
    userId: string,
    projectName?: string
  ): Promise<string> {
    try {
      // 1. 检查内存缓存
      if (this.sessionProjects.has(sessionId)) {
        const cachedProjectId = this.sessionProjects.get(sessionId)!;
        console.log('🎯 [会话项目] 使用缓存项目:', cachedProjectId);
        return cachedProjectId;
      }

      // 2. 检查数据库中是否已有项目
      const { data: existingProject, error: queryError } = await supabase
        .from('projects')
        .select('id, name, total_files')
        .eq('session_id', sessionId)
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!queryError && existingProject) {
        console.log('📋 [会话项目] 找到已有项目:', existingProject.id);
        this.sessionProjects.set(sessionId, existingProject.id);
        return existingProject.id;
      }

      // 3. 创建新项目
      const name = projectName || `HeysMe-Project-${Date.now()}`;
      const { projectId } = await this.projectFileService.createProject(
        sessionId,
        userId,
        {
          name,
          description: '通过HeysMe AI助手生成的项目',
          framework: 'next.js',
          template: 'custom'
        },
        [] // 初始文件为空，文件将通过增量提交添加
      );

      console.log('🆕 [会话项目] 创建新项目:', projectId);
      this.sessionProjects.set(sessionId, projectId);
      return projectId;

    } catch (error) {
      console.error('❌ [会话项目] 获取或创建项目失败:', error);
      throw error;
    }
  }

  /**
   * 向会话项目添加文件（增量模式）
   */
  async addFilesToSessionProject(
    sessionId: string,
    userId: string,
    files: SessionProjectFile[],
    commitMessage?: string
  ): Promise<{ projectId: string; commitId: string }> {
    try {
      console.log(`📁 [会话项目] 添加${files.length}个文件到会话项目`);

      // 1. 获取会话对应的项目
      const projectId = await this.getOrCreateSessionProject(sessionId, userId);

      // 2. 创建提交（增量添加文件）
      const commitId = await this.projectFileService.createCommit(
        projectId,
        userId,
        commitMessage || `增量添加${files.length}个文件`,
        files.map(file => ({
          filename: file.filename,
          content: file.content,
          language: file.language,
          file_type: (file.file_type as 'page' | 'component' | 'config' | 'styles' | 'data') || this.getFileType(file.filename),
          change_type: file.change_type || 'added'
        })),
        'ai_edit',
        'incremental-agent',
        '增量文件生成'
      );

      console.log(`✅ [会话项目] 文件添加成功:`, { projectId, commitId });

      return { projectId, commitId };

    } catch (error) {
      console.error('❌ [会话项目] 添加文件失败:', error);
      throw error;
    }
  }

  /**
   * 获取会话项目的所有文件
   */
  async getSessionProjectFiles(sessionId: string, userId: string): Promise<SessionProjectFile[]> {
    try {
      const projectId = await this.getOrCreateSessionProject(sessionId, userId);
      const files = await this.projectFileService.getProjectFiles(projectId);
      
      return files.map(file => ({
        filename: file.filename,
        content: file.content,
        language: file.language,
        file_type: file.file_type,
        change_type: file.change_type === 'renamed' ? 'modified' : file.change_type
      }));

    } catch (error) {
      console.error('❌ [会话项目] 获取文件失败:', error);
      throw error;
    }
  }

  /**
   * 更新会话项目的部署URL
   */
  async updateSessionProjectDeployment(
    sessionId: string,
    userId: string,
    deploymentUrl: string
  ): Promise<void> {
    try {
      const projectId = await this.getOrCreateSessionProject(sessionId, userId);
      
      const { error } = await supabase
        .from('projects')
        .update({
          deployment_url: deploymentUrl,
          deployment_status: 'deployed',
          last_deployed_at: new Date().toISOString()
        })
        .eq('id', projectId);

      if (error) {
        throw new Error(`更新部署状态失败: ${error.message}`);
      }

      console.log('✅ [会话项目] 部署URL更新成功:', deploymentUrl);

    } catch (error) {
      console.error('❌ [会话项目] 更新部署URL失败:', error);
      throw error;
    }
  }

  /**
   * 清理会话项目缓存
   */
  clearSessionCache(sessionId: string): void {
    this.sessionProjects.delete(sessionId);
    console.log('🧹 [会话项目] 清理会话缓存:', sessionId);
  }

  /**
   * 根据文件名推断文件类型
   */
  private getFileType(filename: string): 'page' | 'component' | 'config' | 'styles' | 'data' {
    const ext = filename.split('.').pop()?.toLowerCase();
    
    switch (ext) {
      case 'tsx':
      case 'jsx':
        return 'component';
      case 'ts':
      case 'js':
        return filename.includes('page') ? 'page' : 'component';
      case 'css':
      case 'scss':
      case 'sass':
        return 'styles';
      case 'json':
        return 'config';
      case 'md':
      case 'html':
        return 'page';
      default:
        return 'data';
    }
  }

  /**
   * 获取会话项目统计信息
   */
  async getSessionProjectStats(sessionId: string, userId: string): Promise<{
    projectId: string;
    totalFiles: number;
    totalCommits: number;
    deploymentUrl?: string;
    lastDeployedAt?: string;
  }> {
    try {
      const projectId = await this.getOrCreateSessionProject(sessionId, userId);
      
      const { data: project, error } = await supabase
        .from('projects')
        .select('total_files, total_commits, deployment_url, last_deployed_at')
        .eq('id', projectId)
        .single();

      if (error) {
        throw new Error(`获取项目统计失败: ${error.message}`);
      }

      return {
        projectId,
        totalFiles: project.total_files || 0,
        totalCommits: project.total_commits || 0,
        deploymentUrl: project.deployment_url,
        lastDeployedAt: project.last_deployed_at
      };

    } catch (error) {
      console.error('❌ [会话项目] 获取统计信息失败:', error);
      throw error;
    }
  }

  /**
   * 获取会话项目的版本历史
   */
  async getSessionProjectVersions(sessionId: string, userId: string): Promise<{
    projectId: string;
    versions: Array<{
      version: string;
      commitId: string;
      timestamp: number;
      filesCount: number;
      filesTypes: string[];
      commitMessage: string;
      isDeployed: boolean;
      deploymentUrl?: string;
      commits?: Array<{ id: string; message: string; created_at: string; }>;
    }>;
    currentVersion: string;
  }> {
    try {
      const projectId = await this.getOrCreateSessionProject(sessionId, userId);
      
      // 获取所有提交历史
      const { data: commits, error: commitsError } = await supabase
        .from('project_commits')
        .select(`
          id,
          message,
          files_added,
          files_modified,
          files_deleted,
          created_at,
          type
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (commitsError) {
        throw new Error(`获取提交历史失败: ${commitsError.message}`);
      }

      // 获取项目信息（包含部署状态）
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('deployment_url, latest_commit_id')
        .eq('id', projectId)
        .single();

      if (projectError) {
        throw new Error(`获取项目信息失败: ${projectError.message}`);
      }

      // 按对话分组提交，生成版本
      const versions: Array<{
        version: string;
        commitId: string;
        timestamp: number;
        filesCount: number;
        filesTypes: string[];
        commitMessage: string;
        isDeployed: boolean;
        deploymentUrl?: string;
        commits: Array<{ id: string; message: string; created_at: string; }>;
      }> = [];

      if (commits && commits.length > 0) {
               // 1. 初始版本 (V1) - 包含初始提交
       const initialCommit = commits[commits.length - 1]; // 最早的提交
       if (initialCommit && initialCommit.type === 'initial') {
         versions.push({
           version: 'V1',
           commitId: initialCommit.id,
           timestamp: new Date(initialCommit.created_at).getTime(),
           filesCount: 0,
           filesTypes: [],
           commitMessage: initialCommit.message,
           isDeployed: false,
           deploymentUrl: undefined,
           commits: [{ id: initialCommit.id, message: initialCommit.message, created_at: initialCommit.created_at }]
         });
       }

        // 2. 按对话会话分组AI编辑提交（更智能的版本分组）
        const aiCommits = commits.filter(c => c.type === 'ai_edit').reverse(); // 按时间正序
        const groupedCommits: Array<Array<typeof commits[0]>> = [];
        let currentGroup: Array<typeof commits[0]> = [];
        
        for (let i = 0; i < aiCommits.length; i++) {
          const commit = aiCommits[i];
          const commitTime = new Date(commit.created_at).getTime();
          
          if (currentGroup.length === 0) {
            currentGroup = [commit];
          } else {
            const lastCommitTime = new Date(currentGroup[currentGroup.length - 1].created_at).getTime();
            // 如果距离上一个提交时间超过2分钟，认为是新的版本（缩短时间窗口）
            if (commitTime - lastCommitTime > 2 * 60 * 1000) {
              groupedCommits.push(currentGroup);
              currentGroup = [commit];
            } else {
              currentGroup.push(commit);
            }
          }
        }
        
        if (currentGroup.length > 0) {
          groupedCommits.push(currentGroup);
        }

               // 3. 为每个分组创建版本（累积式文件统计）
       let cumulativeFiles: Set<string> = new Set(); // 累积文件名集合
       
       for (let groupIndex = 0; groupIndex < groupedCommits.length; groupIndex++) {
         const commitGroup = groupedCommits[groupIndex];
         const versionNumber = `V${groupIndex + 2}`; // V2, V3, V4...
         const latestCommit = commitGroup[commitGroup.length - 1];
          
          // 获取该版本组的新增文件
          const newFiles: any[] = [];
          for (const commit of commitGroup) {
            const { data: files } = await supabase
              .from('project_files')
              .select('filename, language, file_type')
              .eq('commit_id', commit.id);
            
            if (files) {
              newFiles.push(...files);
              // 累积到总文件集合中
              files.forEach(f => cumulativeFiles.add(f.filename));
            }
          }
          
          // 获取到此版本为止的所有累积文件
          const { data: allFilesUpToVersion } = await supabase
            .from('project_files')
            .select('filename, language, file_type')
            .eq('project_id', projectId)
            .lte('created_at', latestCommit.created_at)
            .neq('change_type', 'deleted');
          
          const totalFiles = allFilesUpToVersion || [];
          const filesTypes = totalFiles.length > 0 ? Array.from(new Set(totalFiles.map(f => f.language || f.file_type))) : [];
          const newFileNames = newFiles.map(f => f.filename.split('/').pop()).join(', ');
          
                   versions.push({
           version: versionNumber,
           commitId: latestCommit.id,
           timestamp: new Date(latestCommit.created_at).getTime(),
           filesCount: totalFiles.length, // 累积文件数量
           filesTypes,
           commitMessage: `${versionNumber}: ${newFiles.length > 1 ? '批量创建' : '新增'} ${newFileNames} (累积${totalFiles.length}个文件)`,
           isDeployed: project.deployment_url && latestCommit.id === project.latest_commit_id,
           deploymentUrl: (project.deployment_url && latestCommit.id === project.latest_commit_id) ? project.deployment_url : undefined,
           commits: commitGroup.map(c => ({ id: c.id, message: c.message, created_at: c.created_at }))
         });
        }
      }

      // 当前版本是最新的版本（按版本号排序）
      versions.sort((a, b) => {
        const aNum = parseFloat(a.version.replace('v', ''));
        const bNum = parseFloat(b.version.replace('v', ''));
        return bNum - aNum; // 降序，最新版本在前
      });
      
      const currentVersion = versions.length > 0 ? versions[0].version : 'v1.0';

      return {
        projectId,
        versions,
        currentVersion
      };

    } catch (error) {
      console.error('❌ [会话项目] 获取版本历史失败:', error);
      throw error;
    }
  }

  /**
   * 根据版本获取特定版本的文件
   */
  async getVersionFiles(sessionId: string, userId: string, version: string): Promise<SessionProjectFile[]> {
    try {
      const projectId = await this.getOrCreateSessionProject(sessionId, userId);
      
      // 先获取版本信息来找到对应的提交
      const versionInfo = await this.getSessionProjectVersions(sessionId, userId);
      
      // 查找目标版本
      const targetVersion = versionInfo.versions.find(v => v.version === version);
      
      if (!targetVersion) {
        console.error(`❌ [版本查找] 版本 ${version} 不存在`, {
          requestedVersion: version,
          availableVersions: versionInfo.versions.map(v => v.version),
          projectId
        });
        throw new Error(`版本 ${version} 不存在，可用版本: ${versionInfo.versions.map(v => v.version).join(', ')}`);
      }

      // 如果是V1（初始版本），返回空文件列表
      if (version === 'V1') {
        return [];
      }

      // 获取该版本的所有累积文件（到该版本时间点为止的所有文件）
      const allFiles: SessionProjectFile[] = [];
      
      // 直接获取到该版本时间点为止的所有文件（累积式）
      const { data: files, error: filesError } = await supabase
        .from('project_files')
        .select('filename, content, language, file_type, change_type, created_at')
        .eq('project_id', projectId)
        .lte('created_at', new Date(targetVersion.timestamp).toISOString())
        .neq('change_type', 'deleted')
        .order('created_at', { ascending: true });

      if (filesError) {
        throw new Error(`获取版本文件失败: ${filesError.message}`);
      }

      // 处理文件去重（如果同一文件有多个版本，保留最新的）
      const fileMap = new Map<string, any>();
      
      (files || []).forEach(file => {
        fileMap.set(file.filename, {
          filename: file.filename,
          content: file.content,
          language: file.language,
          file_type: file.file_type,
          change_type: file.change_type === 'renamed' ? 'modified' : file.change_type
        });
      });
      
      allFiles.push(...Array.from(fileMap.values()));

      return allFiles;

    } catch (error) {
      console.error('❌ [会话项目] 获取版本文件失败:', error);
      throw error;
    }
  }
}

export const sessionProjectManager = SessionProjectManager.getInstance();
