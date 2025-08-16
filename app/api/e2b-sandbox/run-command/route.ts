/**
 * 运行命令 API
 * 在沙盒中运行命令
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { userSandboxes } from '../create/route';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      command, 
      cwd = '/home/user', 
      timeout = 30000, 
      background = false,
      env = {}
    } = body;

    if (!command) {
      return NextResponse.json({
        success: false,
        error: 'MISSING_COMMAND',
        message: '必须提供命令'
      }, { status: 400 });
    }

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

    console.log('⚡ [Run Command] 执行命令:', { command, cwd, background });

    const sandbox = (sandboxService as any).sandbox;
    
    const fullCommand = `cd ${cwd} && ${command}`;
    
    try {
      const result = await sandbox.commands.run(fullCommand, {
        background,
        timeoutMs: timeout,
        env: Object.keys(env).length > 0 ? env : undefined
      });

      return NextResponse.json({
        success: true,
        message: '命令执行完成',
        command: {
          original: command,
          full: fullCommand,
          cwd,
          background,
          timeout
        },
        result: {
          exitCode: result.exitCode,
          stdout: result.stdout,
          stderr: result.stderr,
          pid: result.pid || null
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ [Run Command] 命令执行失败:', error);
      
      return NextResponse.json({
        success: false,
        error: 'COMMAND_EXECUTION_FAILED',
        message: '命令执行失败',
        command: {
          original: command,
          full: fullCommand,
          cwd
        },
        details: error instanceof Error ? error.message : '未知错误'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ [Run Command] 请求处理失败:', error);

    return NextResponse.json({
      success: false,
      error: 'REQUEST_FAILED',
      message: '命令请求处理失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
