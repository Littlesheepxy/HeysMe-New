/**
 * 监控 Next.js 日志 API
 * 监控 Next.js 运行状态和日志
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { userSandboxes } from '../create/route';
import { sandboxLogs } from '../logs/route';

interface MonitorRequest {
  follow?: boolean;
  tail?: number;
  filter?: 'info' | 'warn' | 'error' | 'all';
}

// 全局存储活跃的监控会话
const activeMonitors = new Map<string, {
  userId: string;
  sandboxId: string;
  startTime: Date;
  logCount: number;
  lastActivity: Date;
}>();

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const follow = searchParams.get('follow') === 'true';
    const tail = parseInt(searchParams.get('tail') || '50');
    const filter = searchParams.get('filter') as 'info' | 'warn' | 'error' | 'all' || 'all';

    console.log('👀 [Monitor Next.js] 开始监控日志:', { follow, tail, filter });

    const sandboxService = userSandboxes.get(userId);
    
    if (!sandboxService) {
      return NextResponse.json({
        success: false,
        error: 'NO_SANDBOX',
        message: '沙盒不存在，请先创建沙盒'
      }, { status: 400 });
    }

    const currentSandbox = sandboxService.getCurrentSandbox();
    if (!currentSandbox) {
      return NextResponse.json({
        success: false,
        error: 'SANDBOX_NOT_ACTIVE',
        message: '沙盒未激活'
      }, { status: 400 });
    }

    const sandbox = (sandboxService as any).sandbox;
    const monitorId = `${userId}_${currentSandbox.id}`;

    // 如果是流式监控
    if (follow) {
      return handleStreamingLogs(sandbox, currentSandbox.id, monitorId, tail, filter);
    }

    // 一次性获取日志
    const logs = await fetchNextjsLogs(sandbox, tail, filter);

    return NextResponse.json({
      success: true,
      message: '日志获取成功',
      logs: logs,
      totalLogs: logs.length,
      sandboxId: currentSandbox.id,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [Monitor Next.js] 监控请求失败:', error);

    return NextResponse.json({
      success: false,
      error: 'MONITOR_REQUEST_FAILED',
      message: 'Next.js 日志监控失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

// 启动/停止监控
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, options = {} } = body;

    console.log('🎛️ [Monitor Next.js] 监控操作:', action);

    const sandboxService = userSandboxes.get(userId);
    
    if (!sandboxService) {
      return NextResponse.json({
        success: false,
        error: 'NO_SANDBOX',
        message: '沙盒不存在'
      }, { status: 400 });
    }

    const currentSandbox = sandboxService.getCurrentSandbox();
    if (!currentSandbox) {
      return NextResponse.json({
        success: false,
        error: 'SANDBOX_NOT_ACTIVE',
        message: '沙盒未激活'
      }, { status: 400 });
    }

    const monitorId = `${userId}_${currentSandbox.id}`;

    switch (action) {
      case 'start':
        // 启动监控
        activeMonitors.set(monitorId, {
          userId,
          sandboxId: currentSandbox.id,
          startTime: new Date(),
          logCount: 0,
          lastActivity: new Date()
        });

        addLog(currentSandbox.id, 'info', 'system', 'Next.js 日志监控已启动');

        return NextResponse.json({
          success: true,
          message: '日志监控已启动',
          monitorId,
          options
        });

      case 'stop':
        // 停止监控
        const monitor = activeMonitors.get(monitorId);
        if (monitor) {
          activeMonitors.delete(monitorId);
          
          addLog(currentSandbox.id, 'info', 'system', 
            `Next.js 日志监控已停止 (运行时间: ${Date.now() - monitor.startTime.getTime()}ms, 处理日志: ${monitor.logCount} 条)`);

          return NextResponse.json({
            success: true,
            message: '日志监控已停止',
            statistics: {
              duration: Date.now() - monitor.startTime.getTime(),
              logCount: monitor.logCount,
              startTime: monitor.startTime,
              endTime: new Date()
            }
          });
        } else {
          return NextResponse.json({
            success: false,
            error: 'MONITOR_NOT_FOUND',
            message: '未找到活跃的监控会话'
          }, { status: 404 });
        }

      case 'status':
        // 获取监控状态
        const activeMonitor = activeMonitors.get(monitorId);
        
        return NextResponse.json({
          success: true,
          monitoring: !!activeMonitor,
          monitorInfo: activeMonitor ? {
            startTime: activeMonitor.startTime,
            duration: Date.now() - activeMonitor.startTime.getTime(),
            logCount: activeMonitor.logCount,
            lastActivity: activeMonitor.lastActivity
          } : null,
          totalActiveMonitors: activeMonitors.size
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'INVALID_ACTION',
          message: `不支持的操作: ${action}`
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ [Monitor Next.js] POST 请求失败:', error);

    return NextResponse.json({
      success: false,
      error: 'POST_REQUEST_FAILED',
      message: 'POST 请求处理失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

// 处理流式日志监控
async function handleStreamingLogs(
  sandbox: any, 
  sandboxId: string, 
  monitorId: string, 
  tail: number, 
  filter: string
) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        console.log('🌊 [Monitor Next.js] 开始流式监控...');

        // 发送初始响应
        const initialData = {
          type: 'init',
          message: 'Next.js 日志监控已启动',
          timestamp: new Date().toISOString()
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(initialData)}\n\n`));

        // 获取历史日志
        const historicalLogs = await fetchNextjsLogs(sandbox, tail, filter);
        
        for (const log of historicalLogs) {
          const logData = {
            type: 'log',
            ...log
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(logData)}\n\n`));
        }

        // 启动实时监控
        let monitorHandle: any = null;

        try {
          // 使用 tail -f 监控服务器日志
          monitorHandle = await sandbox.commands.run(
            'cd /home/user && tail -f server.log 2>/dev/null || tail -f .next/trace 2>/dev/null || echo "No log files found"',
            {
              background: true,
              timeoutMs: 0,
              onStdout: (data: string) => {
                try {
                  const lines = data.split('\n').filter(line => line.trim());
                  
                  for (const line of lines) {
                    const logEntry = parseNextjsLogLine(line);
                    
                    if (shouldIncludeLog(logEntry, filter)) {
                      const logData = {
                        type: 'log',
                        ...logEntry,
                        realtime: true
                      };
                      
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify(logData)}\n\n`));
                      
                      // 更新监控统计
                      const monitor = activeMonitors.get(monitorId);
                      if (monitor) {
                        monitor.logCount++;
                        monitor.lastActivity = new Date();
                      }
                    }
                  }
                } catch (error) {
                  console.error('流式日志处理错误:', error);
                }
              },
              onStderr: (data: string) => {
                const errorData = {
                  type: 'error',
                  message: data,
                  timestamp: new Date().toISOString(),
                  level: 'error',
                  source: 'nextjs'
                };
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorData)}\n\n`));
              }
            }
          );

          // 监控会话超时处理（10分钟）
          setTimeout(() => {
            try {
              const timeoutData = {
                type: 'timeout',
                message: '监控会话超时，自动关闭',
                timestamp: new Date().toISOString()
              };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(timeoutData)}\n\n`));
              
              if (monitorHandle) {
                monitorHandle.kill();
              }
              activeMonitors.delete(monitorId);
              controller.close();
            } catch (e) {
              console.error('监控超时处理错误:', e);
            }
          }, 10 * 60 * 1000);

        } catch (error) {
          console.error('❌ [Monitor Next.js] 实时监控启动失败:', error);
          
          const errorData = {
            type: 'error',
            message: `实时监控启动失败: ${error instanceof Error ? error.message : '未知错误'}`,
            timestamp: new Date().toISOString()
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorData)}\n\n`));
        }

      } catch (error) {
        console.error('❌ [Monitor Next.js] 流式监控初始化失败:', error);
        controller.error(error);
      }
    },

    cancel() {
      console.log('🛑 [Monitor Next.js] 流式监控已取消');
      activeMonitors.delete(monitorId);
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}

// 获取 Next.js 日志
async function fetchNextjsLogs(sandbox: any, tail: number, filter: string) {
  const logs: any[] = [];

  try {
    // 尝试多个日志源
    const logSources = [
      'server.log',
      '.next/trace',
      '.next/server/trace'
    ];

    for (const source of logSources) {
      try {
        const result = await sandbox.commands.run(
          `cd /home/user && tail -n ${tail} ${source} 2>/dev/null || true`,
          { timeoutMs: 5000 }
        );

        if (result.stdout && result.stdout.trim()) {
          const lines = result.stdout.split('\n').filter(line => line.trim());
          
          for (const line of lines) {
            const logEntry = parseNextjsLogLine(line);
            logEntry.source = source;
            
            if (shouldIncludeLog(logEntry, filter)) {
              logs.push(logEntry);
            }
          }
        }
      } catch (error) {
        console.warn(`无法读取日志源 ${source}:`, error);
      }
    }

    // 按时间戳排序
    logs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // 返回最新的日志
    return logs.slice(-tail);

  } catch (error) {
    console.error('获取 Next.js 日志失败:', error);
    return [];
  }
}

// 解析 Next.js 日志行
function parseNextjsLogLine(line: string) {
  const timestamp = new Date().toISOString();
  
  // 尝试解析常见的 Next.js 日志格式
  let level = 'info';
  let message = line;

  // 检测日志级别
  if (line.includes('[ERROR]') || line.includes('Error:') || line.includes('error')) {
    level = 'error';
  } else if (line.includes('[WARN]') || line.includes('Warning:') || line.includes('warn')) {
    level = 'warn';
  } else if (line.includes('[DEBUG]') || line.includes('debug')) {
    level = 'debug';
  }

  return {
    timestamp,
    level,
    message: message.trim(),
    source: 'nextjs',
    raw: line
  };
}

// 判断是否应该包含此日志
function shouldIncludeLog(logEntry: any, filter: string): boolean {
  if (filter === 'all') {
    return true;
  }
  
  return logEntry.level === filter;
}

// 添加日志
function addLog(sandboxId: string, level: string, source: string, message: string) {
  let logs = sandboxLogs.get(sandboxId);
  if (!logs) {
    logs = [];
    sandboxLogs.set(sandboxId, logs);
  }

  logs.push({
    timestamp: new Date(),
    level: level as any,
    source: source as any,
    message
  });

  if (logs.length > 1000) {
    logs.splice(0, logs.length - 1000);
  }
}
