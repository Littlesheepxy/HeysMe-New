import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@clerk/nextjs/server'
import { contentSyncManager } from '@/lib/services/content-sync-service'

// POST - 创建同步任务
export async function POST(request: NextRequest) {
  try {
    const { userId } = getAuth(request)
    if (!userId) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      contentId, 
      changes, 
      sessionId, 
      syncStrategy = 'immediate',
      priority = 'medium' 
    } = body

    // 验证必填字段
    if (!contentId || !changes) {
      return NextResponse.json({ error: '缺少必填字段' }, { status: 400 })
    }

    // 验证changes结构
    if (!changes.type || !changes.contentType) {
      return NextResponse.json({ 
        error: '无效的changes格式，需要type和contentType字段' 
      }, { status: 400 })
    }

    // 创建同步任务
    const task = await contentSyncManager.createSyncTask(
      contentId,
      userId,
      changes,
      {
        sessionId,
        syncStrategy,
        priority
      }
    )

    return NextResponse.json({
      success: true,
      data: {
        taskId: task.id,
        status: task.status,
        affectedPages: task.affectedPages.length,
        estimatedTime: task.affectedPages.length * 2, // 简单估算，每页2秒
        affectedPagesDetails: task.affectedPages.map(page => ({
          id: page.id,
          title: page.title,
          type: page.type
        }))
      },
      message: `同步任务已创建，将更新 ${task.affectedPages.length} 个页面`
    })

  } catch (error) {
    console.error('创建同步任务失败:', error)
    return NextResponse.json({ 
      error: '服务器错误',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}

// GET - 查询同步任务状态
export async function GET(request: NextRequest) {
  try {
    const { userId } = getAuth(request)
    if (!userId) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('taskId')
    const action = searchParams.get('action')

    if (action === 'active') {
      // 获取所有活跃任务
      const activeTasks = contentSyncManager.getActiveTasks()
      const userTasks = activeTasks.filter(task => task.userId === userId)
      
      return NextResponse.json({
        success: true,
        data: userTasks.map(task => ({
          id: task.id,
          contentId: task.contentId,
          status: task.status,
          progress: task.progress,
          affectedPages: task.affectedPages.length,
          startTime: task.startTime,
          endTime: task.endTime,
          metadata: task.metadata,
          results: task.results.length > 0 ? task.results : undefined
        })),
        total: userTasks.length
      })
    }

    if (action === 'batch') {
      // 触发批量同步
      try {
        await contentSyncManager.batchSync(userId)
        return NextResponse.json({
          success: true,
          message: '批量同步已启动'
        })
      } catch (error) {
        return NextResponse.json({
          error: '批量同步启动失败',
          details: error instanceof Error ? error.message : '未知错误'
        }, { status: 500 })
      }
    }

    if (taskId) {
      // 查询特定任务状态
      const task = contentSyncManager.getTaskStatus(taskId)
      
      if (!task) {
        return NextResponse.json({ error: '任务不存在' }, { status: 404 })
      }

      if (task.userId !== userId) {
        return NextResponse.json({ error: '无权限访问' }, { status: 403 })
      }

      // 计算执行时间
      const executionTime = task.endTime 
        ? task.endTime.getTime() - task.startTime.getTime()
        : Date.now() - task.startTime.getTime()

      return NextResponse.json({
        success: true,
        data: {
          id: task.id,
          contentId: task.contentId,
          status: task.status,
          progress: task.progress,
          affectedPages: task.affectedPages,
          results: task.results,
          startTime: task.startTime,
          endTime: task.endTime,
          executionTime,
          metadata: task.metadata,
          // 添加成功率统计
          successRate: task.results.length > 0 
            ? Math.round((task.results.filter(r => r.status === 'success').length / task.results.length) * 100)
            : 0
        }
      })
    }

    return NextResponse.json({ error: '缺少查询参数' }, { status: 400 })

  } catch (error) {
    console.error('查询同步任务失败:', error)
    return NextResponse.json({ 
      error: '服务器错误',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}

// DELETE - 取消同步任务
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = getAuth(request)
    if (!userId) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('taskId')
    const action = searchParams.get('action')

    if (action === 'cleanup') {
      // 清理已完成的任务
      const hours = parseInt(searchParams.get('hours') || '24')
      contentSyncManager.cleanup(hours)
      return NextResponse.json({
        success: true,
        message: `已清理 ${hours} 小时前的任务`
      })
    }

    if (!taskId) {
      return NextResponse.json({ error: '缺少任务ID' }, { status: 400 })
    }

    const task = contentSyncManager.getTaskStatus(taskId)
    
    if (!task) {
      return NextResponse.json({ error: '任务不存在' }, { status: 404 })
    }

    if (task.userId !== userId) {
      return NextResponse.json({ error: '无权限访问' }, { status: 403 })
    }

    const cancelled = contentSyncManager.cancelTask(taskId)

    if (cancelled) {
      return NextResponse.json({
        success: true,
        message: '任务已取消',
        data: {
          taskId: task.id,
          status: 'cancelled',
          affectedPages: task.affectedPages.length
        }
      })
    } else {
      return NextResponse.json({
        error: '任务无法取消',
        reason: task.status === 'running' 
          ? '任务正在执行中，无法取消' 
          : '任务已完成或失败',
        currentStatus: task.status
      }, { status: 400 })
    }

  } catch (error) {
    console.error('取消同步任务失败:', error)
    return NextResponse.json({ 
      error: '服务器错误',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}

// PATCH - 重试失败的同步任务
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = getAuth(request)
    if (!userId) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('taskId')
    const action = searchParams.get('action')

    if (!taskId || action !== 'retry') {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 })
    }

    const task = contentSyncManager.getTaskStatus(taskId)
    
    if (!task) {
      return NextResponse.json({ error: '任务不存在' }, { status: 404 })
    }

    if (task.userId !== userId) {
      return NextResponse.json({ error: '无权限访问' }, { status: 403 })
    }

    if (task.status !== 'failed') {
      return NextResponse.json({
        error: '只有失败的任务可以重试',
        currentStatus: task.status
      }, { status: 400 })
    }

    // 重置任务状态并重新加入队列
    task.status = 'pending'
    task.progress = 0
    task.results = []
    task.metadata.retryCount++
    task.startTime = new Date()
    task.endTime = undefined

    // 重新处理队列
    contentSyncManager.processQueue()

    return NextResponse.json({
      success: true,
      message: '任务已重新启动',
      data: {
        taskId: task.id,
        status: task.status,
        retryCount: task.metadata.retryCount
      }
    })

  } catch (error) {
    console.error('重试同步任务失败:', error)
    return NextResponse.json({ 
      error: '服务器错误',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}