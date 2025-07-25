/**
 * 内容同步服务
 * 
 * 功能：
 * - 管理内容修改后的多页面同步
 * - 支持批量同步和实时同步
 * - 提供同步状态监控
 * - 处理同步任务队列
 */

import { createServerClient } from '@/lib/supabase-server'

// 同步任务定义
export interface SyncTask {
  id: string
  contentId: string
  userId: string
  sessionId?: string
  affectedPages: Array<{
    id: string
    title: string
    type: 'user_page' | 'template' | 'generated_page'
  }>
  changes: {
    type: 'update' | 'delete' | 'create'
    contentType: string
    oldContent?: any
    newContent?: any
  }
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  progress: number
  startTime: Date
  endTime?: Date
  results: Array<{
    pageId: string
    status: 'success' | 'error' | 'skipped'
    changes?: string
    error?: string
    executionTime?: number
  }>
  metadata: {
    syncStrategy: 'immediate' | 'batch' | 'manual'
    priority: 'high' | 'medium' | 'low'
    retryCount: number
    maxRetries: number
  }
}

// 同步策略配置
export interface SyncConfig {
  maxConcurrentTasks: number
  retryAttempts: number
  retryDelay: number
  batchSize: number
  timeoutMs: number
}

// 默认配置
const DEFAULT_SYNC_CONFIG: SyncConfig = {
  maxConcurrentTasks: 3,
  retryAttempts: 3,
  retryDelay: 1000,
  batchSize: 5,
  timeoutMs: 30000
}

/**
 * 内容同步管理器
 */
export class ContentSyncManager {
  private taskQueue: SyncTask[] = []
  private runningTasks: Map<string, SyncTask> = new Map()
  private config: SyncConfig
  private eventListeners: Map<string, Function[]> = new Map()

  constructor(config: Partial<SyncConfig> = {}) {
    this.config = { ...DEFAULT_SYNC_CONFIG, ...config }
  }

  /**
   * 创建同步任务
   */
  async createSyncTask(
    contentId: string,
    userId: string,
    changes: SyncTask['changes'],
    options: {
      sessionId?: string
      syncStrategy?: 'immediate' | 'batch' | 'manual'
      priority?: 'high' | 'medium' | 'low'
    } = {}
  ): Promise<SyncTask> {
    // 查找受影响的页面
    const affectedPages = await this.findAffectedPages(contentId, userId)

    const task: SyncTask = {
      id: `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      contentId,
      userId,
      sessionId: options.sessionId,
      affectedPages,
      changes,
      status: 'pending',
      progress: 0,
      startTime: new Date(),
      results: [],
      metadata: {
        syncStrategy: options.syncStrategy || 'immediate',
        priority: options.priority || 'medium',
        retryCount: 0,
        maxRetries: this.config.retryAttempts
      }
    }

    // 添加到队列
    this.taskQueue.push(task)
    this.emit('taskCreated', task)

    // 如果是立即同步，开始处理
    if (task.metadata.syncStrategy === 'immediate') {
      this.processQueue()
    }

    return task
  }

  /**
   * 查找受影响的页面
   */
  private async findAffectedPages(
    contentId: string,
    userId: string
  ): Promise<SyncTask['affectedPages']> {
    const supabase = createServerClient()
    const affectedPages: SyncTask['affectedPages'] = []

    try {
      // 从pages表查询使用该内容的页面
      const { data: pages, error: pagesError } = await supabase
        .from('pages')
        .select('id, title, content')
        .eq('user_id', userId)

      if (pagesError) {
        console.error('查询pages表失败:', pagesError)
        return affectedPages
      }

      // 检查页面内容中是否引用了该contentId
      pages?.forEach(page => {
        if (this.pageContainsContent(page.content, contentId)) {
          affectedPages.push({
            id: page.id,
            title: page.title,
            type: 'generated_page'
          })
        }
      })

      // 从user_pages表查询
      const { data: userPages, error: userPagesError } = await supabase
        .from('user_pages')
        .select('id, title, content')
        .eq('user_id', userId)

      if (!userPagesError && userPages) {
        userPages.forEach(page => {
          if (this.pageContainsContent(page.content, contentId)) {
            affectedPages.push({
              id: page.id,
              title: page.title,
              type: 'user_page'
            })
          }
        })
      }

      // 从templates表查询
      const { data: templates, error: templatesError } = await supabase
        .from('templates')
        .select('id, title, sanitized_content')
        .eq('creator_id', userId)

      if (!templatesError && templates) {
        templates.forEach(template => {
          if (this.pageContainsContent(template.sanitized_content, contentId)) {
            affectedPages.push({
              id: template.id,
              title: template.title,
              type: 'template'
            })
          }
        })
      }

    } catch (error) {
      console.error('查找受影响页面失败:', error)
    }

    return affectedPages
  }

  /**
   * 检查页面内容是否包含指定内容
   */
  private pageContainsContent(pageContent: any, contentId: string): boolean {
    if (!pageContent) return false
    
    const contentStr = JSON.stringify(pageContent)
    
    // 检查是否直接引用了contentId
    if (contentStr.includes(contentId)) return true
    
    // 检查是否包含来自该session的数据
    if (contentId.includes('session-')) {
      const sessionId = contentId.split('-').slice(0, 2).join('-')
      if (contentStr.includes(sessionId)) return true
    }
    
    return false
  }

  /**
   * 处理同步队列
   */
  async processQueue(): Promise<void> {
    // 检查是否还有空余的并发槽位
    if (this.runningTasks.size >= this.config.maxConcurrentTasks) {
      return
    }

    // 获取优先级最高的待处理任务
    const pendingTasks = this.taskQueue
      .filter(task => task.status === 'pending')
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        return priorityOrder[b.metadata.priority] - priorityOrder[a.metadata.priority]
      })

    const availableSlots = this.config.maxConcurrentTasks - this.runningTasks.size
    const tasksToProcess = pendingTasks.slice(0, availableSlots)

    // 并行处理任务
    await Promise.all(
      tasksToProcess.map(task => this.executeTask(task))
    )
  }

  /**
   * 执行单个同步任务
   */
  private async executeTask(task: SyncTask): Promise<void> {
    // 更新任务状态
    task.status = 'running'
    task.startTime = new Date()
    this.runningTasks.set(task.id, task)
    this.emit('taskStarted', task)

    try {
      // 处理每个受影响的页面
      const pageResults = await Promise.allSettled(
        task.affectedPages.map(page => 
          this.syncSinglePage(page, task.changes, task.userId)
        )
      )

      // 汇总结果
      task.results = pageResults.map((result, index) => {
        const page = task.affectedPages[index]
        
        if (result.status === 'fulfilled') {
          return {
            pageId: page.id,
            status: 'success' as const,
            changes: result.value.changes,
            executionTime: result.value.executionTime
          }
        } else {
          return {
            pageId: page.id,
            status: 'error' as const,
            error: result.reason?.message || '未知错误'
          }
        }
      })

      // 计算成功率
      const successCount = task.results.filter(r => r.status === 'success').length
      const totalCount = task.results.length
      task.progress = totalCount > 0 ? Math.round((successCount / totalCount) * 100) : 100

      // 更新任务状态
      task.status = successCount === totalCount ? 'completed' : 'failed'
      task.endTime = new Date()

      this.emit('taskCompleted', task)

    } catch (error) {
      console.error(`同步任务 ${task.id} 执行失败:`, error)
      
      task.status = 'failed'
      task.endTime = new Date()
      task.results = task.affectedPages.map(page => ({
        pageId: page.id,
        status: 'error' as const,
        error: error instanceof Error ? error.message : '执行失败'
      }))

      this.emit('taskFailed', task)

      // 如果还有重试次数，重新加入队列
      if (task.metadata.retryCount < task.metadata.maxRetries) {
        task.metadata.retryCount++
        task.status = 'pending'
        setTimeout(() => {
          this.processQueue()
        }, this.config.retryDelay * task.metadata.retryCount)
      }
    } finally {
      this.runningTasks.delete(task.id)
      
      // 继续处理队列中的其他任务
      setTimeout(() => this.processQueue(), 100)
    }
  }

  /**
   * 同步单个页面
   */
  private async syncSinglePage(
    page: SyncTask['affectedPages'][0],
    changes: SyncTask['changes'],
    userId: string
  ): Promise<{ changes: string, executionTime: number }> {
    const startTime = Date.now()
    
    const supabase = createServerClient()
    
    try {
      let tableName: string
      let updateData: any = {}
      
      // 根据页面类型确定表名和更新策略
      switch (page.type) {
        case 'generated_page':
          tableName = 'pages'
          // TODO: 实现页面内容的智能更新逻辑
          updateData = { updated_at: new Date().toISOString() }
          break
          
        case 'user_page':
          tableName = 'user_pages'
          // TODO: 实现用户页面的内容更新逻辑
          updateData = { updated_at: new Date().toISOString() }
          break
          
        case 'template':
          tableName = 'templates'
          // TODO: 实现模板的内容更新逻辑
          updateData = { updated_at: new Date().toISOString() }
          break
          
        default:
          throw new Error(`不支持的页面类型: ${page.type}`)
      }

      // 执行数据库更新
      const { error } = await supabase
        .from(tableName)
        .update(updateData)
        .eq('id', page.id)
        .eq('user_id', userId)

      if (error) {
        throw new Error(`数据库更新失败: ${error.message}`)
      }

      const executionTime = Date.now() - startTime
      
      return {
        changes: `已更新 ${changes.contentType} 内容`,
        executionTime
      }

    } catch (error) {
      throw new Error(`页面 ${page.id} 同步失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 获取任务状态
   */
  getTaskStatus(taskId: string): SyncTask | null {
    return this.taskQueue.find(task => task.id === taskId) || 
           this.runningTasks.get(taskId) || 
           null
  }

  /**
   * 获取所有活跃任务
   */
  getActiveTasks(): SyncTask[] {
    return [
      ...Array.from(this.runningTasks.values()),
      ...this.taskQueue.filter(task => task.status === 'pending')
    ]
  }

  /**
   * 取消任务
   */
  cancelTask(taskId: string): boolean {
    const task = this.getTaskStatus(taskId)
    if (!task) return false

    if (task.status === 'pending') {
      task.status = 'cancelled'
      this.emit('taskCancelled', task)
      return true
    }

    return false
  }

  /**
   * 事件监听
   */
  on(event: string, listener: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(listener)
  }

  /**
   * 触发事件
   */
  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event) || []
    listeners.forEach(listener => {
      try {
        listener(data)
      } catch (error) {
        console.error(`事件监听器执行失败 (${event}):`, error)
      }
    })
  }

  /**
   * 批量同步
   */
  async batchSync(userId: string): Promise<void> {
    const pendingTasks = this.taskQueue.filter(
      task => task.status === 'pending' && 
               task.userId === userId && 
               task.metadata.syncStrategy === 'batch'
    )

    if (pendingTasks.length === 0) return

    // 按优先级和创建时间排序
    pendingTasks.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      const priorityDiff = priorityOrder[b.metadata.priority] - priorityOrder[a.metadata.priority]
      if (priorityDiff !== 0) return priorityDiff
      return a.startTime.getTime() - b.startTime.getTime()
    })

    // 分批处理
    const batches = []
    for (let i = 0; i < pendingTasks.length; i += this.config.batchSize) {
      batches.push(pendingTasks.slice(i, i + this.config.batchSize))
    }

    for (const batch of batches) {
      await Promise.all(batch.map(task => this.executeTask(task)))
    }
  }

  /**
   * 清理已完成的任务
   */
  cleanup(olderThanHours: number = 24): void {
    const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000)
    
    this.taskQueue = this.taskQueue.filter(task => {
      const shouldKeep = task.status === 'pending' || 
                        task.status === 'running' ||
                        (task.endTime && task.endTime > cutoffTime)
      
      if (!shouldKeep) {
        this.emit('taskCleaned', task)
      }
      
      return shouldKeep
    })
  }
}

// 全局同步管理器实例
export const contentSyncManager = new ContentSyncManager()

// 自动清理任务（每小时执行一次）
if (typeof window === 'undefined') { // 仅在服务器端运行
  setInterval(() => {
    contentSyncManager.cleanup()
  }, 60 * 60 * 1000)
} 