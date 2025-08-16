/**
 * 获取沙盒文件 API
 * 获取沙盒文件结构和内容
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { userSandboxes } from '../create/route';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path') || '/home/user';
    const includeContent = searchParams.get('includeContent') === 'true';
    const maxDepth = parseInt(searchParams.get('maxDepth') || '3');
    const fileTypes = searchParams.get('fileTypes')?.split(',') || [];

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

    console.log('📁 [Get Sandbox Files] 获取文件:', { path, includeContent, maxDepth });

    const sandbox = (sandboxService as any).sandbox;

    // 获取文件结构
    const fileStructure = await getFileStructure(sandbox, path, maxDepth, fileTypes);

    // 如果需要文件内容，读取内容
    if (includeContent) {
      await populateFileContents(sandbox, fileStructure, fileTypes);
    }

    return NextResponse.json({
      success: true,
      message: '文件信息获取成功',
      files: fileStructure,
      sandboxId: currentSandbox.id,
      path: path,
      options: {
        includeContent,
        maxDepth,
        fileTypes
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [Get Sandbox Files] 获取文件失败:', error);

    return NextResponse.json({
      success: false,
      error: 'GET_FILES_FAILED',
      message: '获取沙盒文件失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

// 读取特定文件内容
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { filePaths } = body;

    if (!filePaths || !Array.isArray(filePaths)) {
      return NextResponse.json({
        success: false,
        error: 'INVALID_PATHS',
        message: '必须提供文件路径数组'
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

    const sandbox = (sandboxService as any).sandbox;
    const files: Record<string, any> = {};

    for (const filePath of filePaths) {
      try {
        const content = await sandbox.files.read(filePath);
        files[filePath] = {
          path: filePath,
          content: content,
          size: content.length,
          readAt: new Date().toISOString()
        };
      } catch (error) {
        files[filePath] = {
          path: filePath,
          error: error instanceof Error ? error.message : '读取失败',
          readAt: new Date().toISOString()
        };
      }
    }

    return NextResponse.json({
      success: true,
      message: '文件内容读取完成',
      files: files,
      totalFiles: filePaths.length,
      successCount: Object.values(files).filter(f => !f.error).length
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'READ_FILES_FAILED',
      message: '读取文件内容失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

// 获取文件结构
async function getFileStructure(sandbox: any, basePath: string, maxDepth: number, fileTypes: string[], currentDepth = 0): Promise<any[]> {
  if (currentDepth >= maxDepth) {
    return [];
  }

  try {
    const items = await sandbox.files.list(basePath);
    const result = [];

    for (const item of items) {
      const itemPath = `${basePath}/${item.name}`.replace('//', '/');

      // 跳过隐藏文件和系统文件
      if (item.name.startsWith('.') && !['package.json', 'next.config.js'].includes(item.name)) {
        continue;
      }

      const fileInfo: any = {
        name: item.name,
        path: itemPath,
        type: item.type,
        size: item.size || 0,
        modifiedAt: item.modifiedAt || new Date().toISOString()
      };

      if (item.type === 'directory') {
        // 递归获取子目录
        fileInfo.children = await getFileStructure(sandbox, itemPath, maxDepth, fileTypes, currentDepth + 1);
        fileInfo.childCount = fileInfo.children.length;
      } else if (item.type === 'file') {
        // 检查文件类型过滤
        if (fileTypes.length > 0) {
          const extension = item.name.split('.').pop()?.toLowerCase();
          if (!fileTypes.includes(extension || '')) {
            continue;
          }
        }
      }

      result.push(fileInfo);
    }

    return result;

  } catch (error) {
    console.warn(`获取目录失败 ${basePath}:`, error);
    return [];
  }
}

// 填充文件内容
async function populateFileContents(sandbox: any, fileStructure: any[], fileTypes: string[]) {
  for (const item of fileStructure) {
    if (item.type === 'file') {
      // 检查文件大小限制（避免读取过大文件）
      if (item.size > 1024 * 1024) { // 1MB
        item.contentSkipped = true;
        item.skipReason = '文件过大';
        continue;
      }

      // 检查文件类型
      if (fileTypes.length > 0) {
        const extension = item.name.split('.').pop()?.toLowerCase();
        if (!fileTypes.includes(extension || '')) {
          continue;
        }
      }

      // 只读取文本文件
      if (isTextFile(item.name)) {
        try {
          item.content = await sandbox.files.read(item.path);
        } catch (error) {
          item.contentError = error instanceof Error ? error.message : '读取失败';
        }
      } else {
        item.contentSkipped = true;
        item.skipReason = '非文本文件';
      }
    } else if (item.type === 'directory' && item.children) {
      await populateFileContents(sandbox, item.children, fileTypes);
    }
  }
}

// 判断是否为文本文件
function isTextFile(fileName: string): boolean {
  const textExtensions = [
    'txt', 'md', 'json', 'js', 'jsx', 'ts', 'tsx', 'css', 'scss', 'sass', 'less',
    'html', 'htm', 'xml', 'yaml', 'yml', 'env', 'gitignore', 'dockerignore',
    'py', 'java', 'c', 'cpp', 'h', 'hpp', 'cs', 'php', 'rb', 'go', 'rs',
    'sh', 'bash', 'zsh', 'fish', 'ps1', 'bat', 'cmd'
  ];

  const extension = fileName.split('.').pop()?.toLowerCase();
  return textExtensions.includes(extension || '') || !fileName.includes('.');
}
