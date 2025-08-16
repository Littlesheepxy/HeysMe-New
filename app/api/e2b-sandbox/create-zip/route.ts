/**
 * 创建项目压缩包 API
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
      projectPath = '/home/user', 
      excludePatterns = ['node_modules', '.next', '.git', '*.log'],
      zipName 
    } = body;

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

    console.log('📦 [Create Zip] 创建压缩包:', { projectPath, excludePatterns });

    const sandbox = (sandboxService as any).sandbox;
    const finalZipName = zipName || `project_${Date.now()}.zip`;
    const zipPath = `/tmp/${finalZipName}`;

    // 构建排除参数
    const excludeArgs = excludePatterns.map(pattern => `-x "${pattern}"`).join(' ');
    
    // 创建 ZIP 文件
    const createCommand = `cd ${projectPath} && zip -r ${zipPath} . ${excludeArgs}`;
    
    try {
      const result = await sandbox.commands.run(createCommand, {
        timeoutMs: 60000
      });

      if (result.exitCode !== 0) {
        throw new Error(`ZIP 创建失败: ${result.stderr}`);
      }

      // 获取文件信息
      const statResult = await sandbox.commands.run(`stat -f%z ${zipPath} 2>/dev/null || stat -c%s ${zipPath}`, {
        timeoutMs: 5000
      });

      const fileSize = parseInt(statResult.stdout.trim()) || 0;

      // 读取 ZIP 文件内容
      const zipContent = await sandbox.files.read(zipPath, { format: 'bytes' });

      return NextResponse.json({
        success: true,
        message: 'ZIP 文件创建成功',
        zip: {
          name: finalZipName,
          path: zipPath,
          size: fileSize,
          content: Array.from(zipContent), // 转换为数组以便 JSON 序列化
          projectPath,
          excludePatterns
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ [Create Zip] ZIP 创建失败:', error);
      
      return NextResponse.json({
        success: false,
        error: 'ZIP_CREATION_FAILED',
        message: 'ZIP 文件创建失败',
        details: error instanceof Error ? error.message : '未知错误'
      }, { status: 500 });
    }

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'REQUEST_FAILED',
      message: 'ZIP 创建请求失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
