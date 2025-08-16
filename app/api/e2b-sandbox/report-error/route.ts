/**
 * 报告 Next.js 错误 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { userSandboxes } from '../create/route';
import { errorCache } from '../check-errors/route';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      level = 'error', 
      message, 
      stack, 
      file, 
      line, 
      column, 
      source = 'runtime' 
    } = body;

    if (!message) {
      return NextResponse.json({
        success: false,
        error: 'MISSING_MESSAGE',
        message: '错误消息不能为空'
      }, { status: 400 });
    }

    const sandboxService = userSandboxes.get(userId);
    const currentSandbox = sandboxService?.getCurrentSandbox();
    
    if (!currentSandbox) {
      return NextResponse.json({
        success: false,
        error: 'NO_SANDBOX',
        message: '沙盒未激活'
      }, { status: 400 });
    }

    // 创建错误记录
    const errorRecord = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      timestamp: new Date(),
      level: level as 'error' | 'warning',
      message: String(message),
      stack: stack ? String(stack) : undefined,
      file: file ? String(file) : undefined,
      line: line ? parseInt(String(line)) : undefined,
      column: column ? parseInt(String(column)) : undefined,
      source: source as 'build' | 'runtime' | 'lint',
      resolved: false
    };

    // 添加到错误缓存
    let errors = errorCache.get(currentSandbox.id) || [];
    errors.push(errorRecord);

    // 保持缓存大小限制
    if (errors.length > 500) {
      errors = errors.slice(-500);
    }

    errorCache.set(currentSandbox.id, errors);

    console.log(`🚨 [Report Next.js Error] 新错误报告: [${level.toUpperCase()}] ${message}`);

    return NextResponse.json({
      success: true,
      message: '错误报告已记录',
      errorId: errorRecord.id,
      error: errorRecord,
      totalErrors: errors.length
    });

  } catch (error) {
    console.error('❌ [Report Next.js Error] 错误报告失败:', error);

    return NextResponse.json({
      success: false,
      error: 'REPORT_ERROR_FAILED',
      message: '错误报告失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
