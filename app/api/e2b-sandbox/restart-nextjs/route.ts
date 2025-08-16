/**
 * 重启 Next.js 服务器 API
 * 重启 Next.js 开发服务器
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { userSandboxes } from '../create/route';
import { sandboxLogs } from '../logs/route';

interface RestartNextjsRequest {
  force?: boolean;
  port?: number;
  timeout?: number;
  clearCache?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: RestartNextjsRequest = await request.json();
    const { 
      force = false, 
      port = 3000, 
      timeout = 30000,
      clearCache = false 
    } = body;

    console.log('🔄 [Restart Next.js] 重启服务器请求:', { force, port, timeout, clearCache });

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
    addLog(currentSandbox.id, 'info', 'nextjs', '开始重启 Next.js 服务器...');

    const restartResult = {
      killResult: null as any,
      clearCacheResult: null as any,
      startResult: null as any,
      healthCheck: null as any,
      success: false,
      serverPid: null as number | null,
      serverUrl: `https://${currentSandbox.id}-${port}.e2b.dev`
    };

    try {
      // 1. 停止现有的 Next.js 进程
      console.log('🛑 [Restart Next.js] 停止现有进程...');
      
      if (force) {
        // 强制杀死所有相关进程
        restartResult.killResult = await sandbox.commands.run(
          'pkill -f "next dev" && pkill -f "node.*next" && pkill -9 -f "next" || true',
          { timeoutMs: 10000 }
        );
        addLog(currentSandbox.id, 'warn', 'nextjs', '强制终止所有 Next.js 进程');
      } else {
        // 优雅停止
        restartResult.killResult = await sandbox.commands.run(
          'pkill -TERM -f "next dev" || true',
          { timeoutMs: 5000 }
        );
        addLog(currentSandbox.id, 'info', 'nextjs', '发送终止信号到 Next.js 进程');
      }

      // 等待进程完全停止
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 2. 清理缓存（如果需要）
      if (clearCache) {
        console.log('🧹 [Restart Next.js] 清理缓存...');
        
        restartResult.clearCacheResult = await sandbox.commands.run(
          'cd /home/user && rm -rf .next && npm cache clean --force 2>/dev/null || true',
          { timeoutMs: 15000 }
        );
        addLog(currentSandbox.id, 'info', 'nextjs', '清理 Next.js 缓存和 npm 缓存');
      }

      // 3. 启动新的 Next.js 服务器
      console.log('🚀 [Restart Next.js] 启动新的服务器...');
      
      // 后台启动 Next.js 开发服务器
      const startHandle = await sandbox.commands.run(
        `cd /home/user && PORT=${port} npm run dev`,
        {
          background: true,
          timeoutMs: 0,
          onStdout: (data) => {
            console.log(`[Next.js] ${data}`);
            addLog(currentSandbox.id, 'info', 'nextjs', data.trim());
          },
          onStderr: (data) => {
            console.log(`[Next.js Error] ${data}`);
            addLog(currentSandbox.id, 'error', 'nextjs', data.trim());
          }
        }
      );

      restartResult.serverPid = startHandle.pid;
      addLog(currentSandbox.id, 'info', 'nextjs', `Next.js 服务器启动中... (PID: ${startHandle.pid})`);

      // 4. 等待服务器启动
      console.log('⏳ [Restart Next.js] 等待服务器就绪...');
      
      const startTime = Date.now();
      let isReady = false;

      while (Date.now() - startTime < timeout && !isReady) {
        try {
          // 检查端口是否被监听
          const portCheck = await sandbox.commands.run(
            `netstat -tulpn | grep :${port} | grep LISTEN || ss -tulpn | grep :${port} | grep LISTEN || true`,
            { timeoutMs: 3000 }
          );

          if (portCheck.stdout.includes(`:${port}`)) {
            isReady = true;
            break;
          }

          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          console.warn('⚠️ [Restart Next.js] 端口检查失败:', error);
        }
      }

      // 5. 健康检查
      if (isReady) {
        console.log('✅ [Restart Next.js] 执行健康检查...');
        
        try {
          // 检查服务器响应
          const healthResult = await sandbox.commands.run(
            `curl -s -o /dev/null -w "%{http_code}" http://localhost:${port} --connect-timeout 5 --max-time 10 || echo "failed"`,
            { timeoutMs: 15000 }
          );

          const statusCode = healthResult.stdout.trim();
          restartResult.healthCheck = {
            success: statusCode === '200' || statusCode === '404', // 404 也算正常，可能是根路径没有内容
            statusCode,
            responseTime: Date.now() - startTime
          };

          if (restartResult.healthCheck.success) {
            restartResult.success = true;
            addLog(currentSandbox.id, 'info', 'nextjs', 
              `Next.js 服务器重启成功 (状态码: ${statusCode}, 响应时间: ${restartResult.healthCheck.responseTime}ms)`);
          } else {
            addLog(currentSandbox.id, 'error', 'nextjs', 
              `Next.js 服务器健康检查失败 (状态码: ${statusCode})`);
          }

        } catch (error) {
          console.warn('⚠️ [Restart Next.js] 健康检查异常:', error);
          restartResult.healthCheck = {
            success: false,
            error: error instanceof Error ? error.message : '健康检查失败'
          };
        }
      } else {
        addLog(currentSandbox.id, 'error', 'nextjs', `Next.js 服务器启动超时 (${timeout}ms)`);
      }

    } catch (error) {
      console.error('❌ [Restart Next.js] 重启失败:', error);
      
      addLog(currentSandbox.id, 'error', 'nextjs', 
        `服务器重启失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }

    return NextResponse.json({
      success: restartResult.success,
      message: restartResult.success ? 'Next.js 服务器重启成功' : 'Next.js 服务器重启失败',
      serverInfo: {
        pid: restartResult.serverPid,
        port: port,
        url: restartResult.serverUrl
      },
      restartDetails: {
        killResult: restartResult.killResult?.exitCode === 0,
        clearCacheResult: clearCache ? restartResult.clearCacheResult?.exitCode === 0 : 'skipped',
        healthCheck: restartResult.healthCheck
      },
      settings: {
        force,
        port,
        timeout,
        clearCache
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [Restart Next.js] 请求处理失败:', error);

    return NextResponse.json({
      success: false,
      error: 'RESTART_REQUEST_FAILED',
      message: 'Next.js 重启请求处理失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

// 获取 Next.js 服务器状态
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const port = parseInt(searchParams.get('port') || '3000');

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

    console.log('📊 [Restart Next.js] 查询服务器状态...');

    const sandbox = (sandboxService as any).sandbox;
    const status = {
      running: false,
      pid: null as number | null,
      port: port,
      processes: [] as any[],
      portListening: false,
      serverUrl: `https://${currentSandbox.id}-${port}.e2b.dev`
    };

    try {
      // 1. 检查 Next.js 进程
      const processResult = await sandbox.commands.run(
        'ps aux | grep -E "(next|npm.*dev)" | grep -v grep || true',
        { timeoutMs: 5000 }
      );

      if (processResult.stdout.trim()) {
        status.running = true;
        status.processes = processResult.stdout
          .split('\n')
          .filter(line => line.trim())
          .map(line => {
            const parts = line.trim().split(/\s+/);
            return {
              pid: parseInt(parts[1]),
              command: parts.slice(10).join(' ')
            };
          });

        // 尝试获取主进程PID
        const mainProcess = status.processes.find(p => p.command.includes('next dev'));
        if (mainProcess) {
          status.pid = mainProcess.pid;
        }
      }

      // 2. 检查端口监听
      const portResult = await sandbox.commands.run(
        `netstat -tulpn | grep :${port} | grep LISTEN || ss -tulpn | grep :${port} | grep LISTEN || true`,
        { timeoutMs: 3000 }
      );

      status.portListening = portResult.stdout.includes(`:${port}`);

      return NextResponse.json({
        success: true,
        message: '服务器状态查询成功',
        status: status,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ [Restart Next.js] 状态查询失败:', error);
      
      return NextResponse.json({
        success: false,
        error: 'STATUS_QUERY_FAILED',
        message: '服务器状态查询失败',
        details: error instanceof Error ? error.message : '未知错误'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ [Restart Next.js] GET 请求失败:', error);

    return NextResponse.json({
      success: false,
      error: 'GET_REQUEST_FAILED',
      message: 'GET 请求处理失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

// 辅助函数
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
