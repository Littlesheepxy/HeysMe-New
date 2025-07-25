/**
 * WebContainer 全局清理管理器
 * 确保在页面刷新、导航或关闭时正确清理WebContainer实例
 */

import { WebContainerService } from './webcontainer-service';

class WebContainerCleanupManager {
  private static hasSetupListeners = false;
  private static activeServices = new Set<WebContainerService>();

  /**
   * 注册WebContainer服务实例
   */
  static registerService(service: WebContainerService): void {
    this.activeServices.add(service);
    this.setupCleanupListeners();
  }

  /**
   * 注销WebContainer服务实例
   */
  static unregisterService(service: WebContainerService): void {
    this.activeServices.delete(service);
  }

  /**
   * 设置清理监听器（只设置一次）
   */
  private static setupCleanupListeners(): void {
    if (this.hasSetupListeners || typeof window === 'undefined') {
      return;
    }

    this.hasSetupListeners = true;

    // 页面卸载时清理
    window.addEventListener('beforeunload', this.cleanup.bind(this));
    
    // 页面隐藏时清理（移动端兼容）
    window.addEventListener('pagehide', this.cleanup.bind(this));
    
    // 页面可见性变化时检查
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        // 页面隐藏，但不立即清理，等待一段时间
        setTimeout(() => {
          if (document.visibilityState === 'hidden') {
            this.cleanup();
          }
        }, 5000);
      }
    });

    console.log('✅ WebContainer清理监听器已设置');
  }

  /**
   * 执行清理操作
   */
  private static async cleanup(): Promise<void> {
    console.log('🧹 开始清理WebContainer资源...');
    
    try {
      // 清理所有注册的服务
      const cleanupPromises = Array.from(this.activeServices).map(service => {
        return service.destroy().catch(error => {
          console.warn('清理WebContainer服务失败:', error);
        });
      });
      
      await Promise.all(cleanupPromises);
      this.activeServices.clear();
      
      // 强制清理全局实例
      await WebContainerService.destroyGlobalInstance();
      
      console.log('✅ WebContainer资源清理完成');
    } catch (error) {
      console.error('❌ WebContainer清理过程中出错:', error);
    }
  }

  /**
   * 手动触发清理（用于开发调试）
   */
  static async manualCleanup(): Promise<void> {
    await this.cleanup();
  }

  /**
   * 检查是否有活跃的服务
   */
  static hasActiveServices(): boolean {
    return this.activeServices.size > 0;
  }

  /**
   * 获取活跃服务数量
   */
  static getActiveServicesCount(): number {
    return this.activeServices.size;
  }
}

export default WebContainerCleanupManager;

// 开发环境下暴露到全局，方便调试
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).webcontainerCleanup = WebContainerCleanupManager;
} 