/**
 * 检查 Next.js 错误 API
 * 检查 Next.js 错误和警告
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { userSandboxes } from '../create/route';

// 全局错误缓存
const errorCache = new Map<string, Array<{
  id: string;
  timestamp: Date;
  level: 'error' | 'warning';
  message: string;
  stack?: string;
  file?: string;
  line?: number;
  column?: number;
  source: 'build' | 'runtime' | 'lint';
  resolved?: boolean;
}>>();

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level') as 'error' | 'warning' | null;
    const source = searchParams.get('source') as 'build' | 'runtime' | 'lint' | null;
    const resolved = searchParams.get('resolved') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');

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

    console.log('🔍 [Check Next.js Errors] 检查错误:', { level, source, resolved, limit });

    // 从多个来源检查错误
    const errors = await detectNextjsErrors(sandboxService);
    
    // 获取缓存的错误
    let cachedErrors = errorCache.get(currentSandbox.id) || [];
    
    // 合并新检测到的错误
    for (const error of errors) {
      const existingError = cachedErrors.find(e => 
        e.message === error.message && e.file === error.file && e.line === error.line
      );
      
      if (!existingError) {
        cachedErrors.push({
          ...error,
          id: generateErrorId(),
          timestamp: new Date()
        });
      }
    }

    // 更新缓存
    errorCache.set(currentSandbox.id, cachedErrors);

    // 应用过滤器
    let filteredErrors = cachedErrors;

    if (level) {
      filteredErrors = filteredErrors.filter(e => e.level === level);
    }

    if (source) {
      filteredErrors = filteredErrors.filter(e => e.source === source);
    }

    if (resolved !== null) {
      filteredErrors = filteredErrors.filter(e => !!e.resolved === resolved);
    }

    // 按时间倒序排序
    filteredErrors.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // 限制数量
    const limitedErrors = filteredErrors.slice(0, limit);

    // 统计信息
    const stats = {
      total: cachedErrors.length,
      errors: cachedErrors.filter(e => e.level === 'error').length,
      warnings: cachedErrors.filter(e => e.level === 'warning').length,
      resolved: cachedErrors.filter(e => e.resolved).length,
      unresolved: cachedErrors.filter(e => !e.resolved).length,
      sources: {
        build: cachedErrors.filter(e => e.source === 'build').length,
        runtime: cachedErrors.filter(e => e.source === 'runtime').length,
        lint: cachedErrors.filter(e => e.source === 'lint').length
      }
    };

    return NextResponse.json({
      success: true,
      message: '错误检查完成',
      errors: limitedErrors,
      stats: stats,
      filters: { level, source, resolved, limit },
      sandboxId: currentSandbox.id,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [Check Next.js Errors] 错误检查失败:', error);

    return NextResponse.json({
      success: false,
      error: 'ERROR_CHECK_FAILED',
      message: 'Next.js 错误检查失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

// 标记错误为已解决
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { errorId, resolved = true, note } = body;

    const sandboxService = userSandboxes.get(userId);
    const currentSandbox = sandboxService?.getCurrentSandbox();
    
    if (!currentSandbox) {
      return NextResponse.json({
        success: false,
        error: 'NO_SANDBOX',
        message: '沙盒未激活'
      }, { status: 400 });
    }

    const cachedErrors = errorCache.get(currentSandbox.id) || [];
    const errorIndex = cachedErrors.findIndex(e => e.id === errorId);

    if (errorIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'ERROR_NOT_FOUND',
        message: '未找到指定的错误'
      }, { status: 404 });
    }

    // 更新错误状态
    cachedErrors[errorIndex].resolved = resolved;
    if (note) {
      (cachedErrors[errorIndex] as any).note = note;
    }
    (cachedErrors[errorIndex] as any).resolvedAt = new Date();

    errorCache.set(currentSandbox.id, cachedErrors);

    console.log(`✅ [Check Next.js Errors] 错误状态更新: ${errorId} -> ${resolved ? '已解决' : '未解决'}`);

    return NextResponse.json({
      success: true,
      message: `错误已标记为${resolved ? '已解决' : '未解决'}`,
      errorId,
      resolved,
      note
    });

  } catch (error) {
    console.error('❌ [Check Next.js Errors] 错误状态更新失败:', error);

    return NextResponse.json({
      success: false,
      error: 'ERROR_UPDATE_FAILED',
      message: '错误状态更新失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

// 检测 Next.js 错误
async function detectNextjsErrors(sandboxService: any) {
  const sandbox = (sandboxService as any).sandbox;
  const errors: any[] = [];

  try {
    // 1. 检查构建错误
    const buildErrors = await checkBuildErrors(sandbox);
    errors.push(...buildErrors);

    // 2. 检查运行时错误
    const runtimeErrors = await checkRuntimeErrors(sandbox);
    errors.push(...runtimeErrors);

    // 3. 检查 Lint 错误
    const lintErrors = await checkLintErrors(sandbox);
    errors.push(...lintErrors);

  } catch (error) {
    console.error('检测错误失败:', error);
  }

  return errors;
}

// 检查构建错误
async function checkBuildErrors(sandbox: any) {
  const errors: any[] = [];

  try {
    const result = await sandbox.commands.run(
      'cd /home/user && npm run build 2>&1 | tail -n 100 || true',
      { timeoutMs: 30000 }
    );

    if (result.stderr || result.stdout.includes('Error:') || result.stdout.includes('Failed to compile')) {
      const lines = (result.stdout + result.stderr).split('\n');
      
      for (const line of lines) {
        if (line.includes('Error:') || line.includes('error TS') || line.includes('Failed to compile')) {
          errors.push({
            level: 'error' as const,
            message: line.trim(),
            source: 'build' as const,
            resolved: false
          });
        } else if (line.includes('Warning:') || line.includes('warn')) {
          errors.push({
            level: 'warning' as const,
            message: line.trim(),
            source: 'build' as const,
            resolved: false
          });
        }
      }
    }
  } catch (error) {
    console.warn('构建错误检查失败:', error);
  }

  return errors;
}

// 检查运行时错误
async function checkRuntimeErrors(sandbox: any) {
  const errors: any[] = [];

  try {
    const result = await sandbox.commands.run(
      'cd /home/user && tail -n 50 server.log 2>/dev/null | grep -E "(Error|error|Exception)" || true',
      { timeoutMs: 5000 }
    );

    if (result.stdout) {
      const lines = result.stdout.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        if (line.includes('Error') || line.includes('Exception')) {
          errors.push({
            level: 'error' as const,
            message: line.trim(),
            source: 'runtime' as const,
            resolved: false
          });
        }
      }
    }
  } catch (error) {
    console.warn('运行时错误检查失败:', error);
  }

  return errors;
}

// 检查 Lint 错误
async function checkLintErrors(sandbox: any) {
  const errors: any[] = [];

  try {
    const result = await sandbox.commands.run(
      'cd /home/user && npm run lint 2>&1 || true',
      { timeoutMs: 20000 }
    );

    if (result.stdout) {
      const lines = result.stdout.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        if (line.includes('error') || line.includes('✖')) {
          // 尝试解析 ESLint 输出格式
          const match = line.match(/(.+):(\d+):(\d+): (.+)/);
          if (match) {
            errors.push({
              level: 'error' as const,
              message: match[4],
              file: match[1],
              line: parseInt(match[2]),
              column: parseInt(match[3]),
              source: 'lint' as const,
              resolved: false
            });
          } else {
            errors.push({
              level: 'error' as const,
              message: line.trim(),
              source: 'lint' as const,
              resolved: false
            });
          }
        } else if (line.includes('warning') || line.includes('⚠')) {
          errors.push({
            level: 'warning' as const,
            message: line.trim(),
            source: 'lint' as const,
            resolved: false
          });
        }
      }
    }
  } catch (error) {
    console.warn('Lint 错误检查失败:', error);
  }

  return errors;
}

// 生成错误ID
function generateErrorId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 导出错误缓存（供其他模块使用）
export { errorCache };
