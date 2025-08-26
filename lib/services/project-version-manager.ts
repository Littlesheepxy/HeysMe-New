/**
 * 🔄 项目版本管理服务
 * 管理项目的不同版本，支持V1、V2等版本切换和部署
 */

import { CodeFile } from '@/lib/agents/coding/types';

export interface ProjectVersion {
  id: string;
  version: string; // 'v1', 'v2', 'v3', etc.
  name: string; // '初始版本', '修复样式', '添加功能'
  description: string;
  files: CodeFile[];
  createdAt: Date;
  commitMessage?: string;
  isActive: boolean; // 当前激活的版本
}

export interface VersionHistory {
  sessionId: string;
  versions: ProjectVersion[];
  currentVersion: string;
}

export class ProjectVersionManager {
  private static instance: ProjectVersionManager;
  private versionHistory = new Map<string, VersionHistory>();

  static getInstance(): ProjectVersionManager {
    if (!ProjectVersionManager.instance) {
      ProjectVersionManager.instance = new ProjectVersionManager();
    }
    return ProjectVersionManager.instance;
  }

  /**
   * 🆕 创建新版本
   */
  createVersion(
    sessionId: string,
    files: CodeFile[],
    description: string,
    commitMessage?: string
  ): ProjectVersion {
    const history = this.versionHistory.get(sessionId) || {
      sessionId,
      versions: [],
      currentVersion: 'v1'
    };

    // 确定版本号
    const versionNumber = history.versions.length + 1;
    const versionId = `v${versionNumber}`;

    // 创建新版本
    const newVersion: ProjectVersion = {
      id: `${sessionId}-${versionId}-${Date.now()}`,
      version: versionId,
      name: this.generateVersionName(versionNumber, description),
      description,
      files: [...files], // 深拷贝文件
      createdAt: new Date(),
      commitMessage,
      isActive: true // 新版本默认激活
    };

    // 将之前的版本设为非激活
    history.versions.forEach(v => v.isActive = false);

    // 添加新版本
    history.versions.push(newVersion);
    history.currentVersion = versionId;

    // 保存到内存
    this.versionHistory.set(sessionId, history);

    console.log(`✅ [版本管理] 创建新版本: ${versionId} - ${newVersion.name}`);
    return newVersion;
  }

  /**
   * 📋 获取版本历史
   */
  getVersionHistory(sessionId: string): VersionHistory | null {
    return this.versionHistory.get(sessionId) || null;
  }

  /**
   * 🔍 获取指定版本
   */
  getVersion(sessionId: string, versionId: string): ProjectVersion | null {
    const history = this.versionHistory.get(sessionId);
    if (!history) return null;

    return history.versions.find(v => v.version === versionId) || null;
  }

  /**
   * 🎯 获取当前激活版本
   */
  getCurrentVersion(sessionId: string): ProjectVersion | null {
    const history = this.versionHistory.get(sessionId);
    if (!history) return null;

    return history.versions.find(v => v.isActive) || null;
  }

  /**
   * 🔄 切换到指定版本
   */
  switchToVersion(sessionId: string, versionId: string): ProjectVersion | null {
    const history = this.versionHistory.get(sessionId);
    if (!history) return null;

    const targetVersion = history.versions.find(v => v.version === versionId);
    if (!targetVersion) return null;

    // 更新激活状态
    history.versions.forEach(v => v.isActive = (v.version === versionId));
    history.currentVersion = versionId;

    this.versionHistory.set(sessionId, history);

    console.log(`🔄 [版本管理] 切换到版本: ${versionId} - ${targetVersion.name}`);
    return targetVersion;
  }

  /**
   * 📊 获取版本统计
   */
  getVersionStats(sessionId: string): {
    totalVersions: number;
    currentVersion: string;
    latestVersion: string;
    hasMultipleVersions: boolean;
  } {
    const history = this.versionHistory.get(sessionId);
    if (!history || history.versions.length === 0) {
      return {
        totalVersions: 0,
        currentVersion: 'v1',
        latestVersion: 'v1',
        hasMultipleVersions: false
      };
    }

    const latestVersion = history.versions[history.versions.length - 1];

    return {
      totalVersions: history.versions.length,
      currentVersion: history.currentVersion,
      latestVersion: latestVersion.version,
      hasMultipleVersions: history.versions.length > 1
    };
  }

  /**
   * 🗑️ 删除版本
   */
  deleteVersion(sessionId: string, versionId: string): boolean {
    const history = this.versionHistory.get(sessionId);
    if (!history) return false;

    const versionIndex = history.versions.findIndex(v => v.version === versionId);
    if (versionIndex === -1) return false;

    // 不能删除最后一个版本
    if (history.versions.length === 1) {
      console.warn(`⚠️ [版本管理] 不能删除最后一个版本: ${versionId}`);
      return false;
    }

    const deletedVersion = history.versions[versionIndex];
    history.versions.splice(versionIndex, 1);

    // 如果删除的是当前激活版本，切换到最新版本
    if (deletedVersion.isActive) {
      const latestVersion = history.versions[history.versions.length - 1];
      latestVersion.isActive = true;
      history.currentVersion = latestVersion.version;
    }

    this.versionHistory.set(sessionId, history);

    console.log(`🗑️ [版本管理] 删除版本: ${versionId} - ${deletedVersion.name}`);
    return true;
  }

  /**
   * 🏷️ 生成版本名称
   */
  private generateVersionName(versionNumber: number, description: string): string {
    if (versionNumber === 1) {
      return '初始版本';
    }

    // 根据描述生成简洁的版本名
    if (description.includes('修复') || description.includes('fix')) {
      return `修复更新 V${versionNumber}`;
    } else if (description.includes('添加') || description.includes('新增') || description.includes('add')) {
      return `功能更新 V${versionNumber}`;
    } else if (description.includes('优化') || description.includes('improve')) {
      return `优化更新 V${versionNumber}`;
    } else if (description.includes('样式') || description.includes('UI') || description.includes('style')) {
      return `样式更新 V${versionNumber}`;
    } else {
      return `版本 V${versionNumber}`;
    }
  }

  /**
   * 💾 导出版本数据（用于持久化存储）
   */
  exportVersionData(sessionId: string): VersionHistory | null {
    return this.versionHistory.get(sessionId) || null;
  }

  /**
   * 📥 导入版本数据（从持久化存储恢复）
   */
  importVersionData(sessionId: string, data: VersionHistory): void {
    this.versionHistory.set(sessionId, data);
    console.log(`📥 [版本管理] 导入版本数据: ${sessionId}, ${data.versions.length} 个版本`);
  }

  /**
   * 🧹 清理会话版本数据
   */
  clearSessionVersions(sessionId: string): void {
    this.versionHistory.delete(sessionId);
    console.log(`🧹 [版本管理] 清理会话版本: ${sessionId}`);
  }
}
