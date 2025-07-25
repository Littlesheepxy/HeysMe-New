import { NextRequest, NextResponse } from 'next/server';
import { CodingAgentFileOperation } from '@/lib/agents/coding/types';

// 模拟文件存储（实际应用中应该使用真实的文件系统或云存储）
const mockFileStorage = new Map<string, {
  content: string;
  language: string;
  lastModified: Date;
  created: Date;
}>();

export async function POST(request: NextRequest) {
  try {
    const { sessionId, operation }: { 
      sessionId: string; 
      operation: CodingAgentFileOperation;
    } = await request.json();

    if (!sessionId || !operation) {
      return NextResponse.json(
        { error: 'SessionId and operation are required' },
        { status: 400 }
      );
    }

    console.log(`🔧 [文件操作] 会话: ${sessionId}, 操作: ${operation.type}, 文件: ${operation.path}`);

    let result: any = {};

    switch (operation.type) {
      case 'create':
        result = await handleCreateFile(operation);
        break;
      case 'modify':
        result = await handleModifyFile(operation);
        break;
      case 'delete':
        result = await handleDeleteFile(operation);
        break;
      case 'rename':
        result = await handleRenameFile(operation);
        break;
      case 'move':
        result = await handleMoveFile(operation);
        break;
      default:
        return NextResponse.json(
          { error: `不支持的文件操作类型: ${operation.type}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      operation: operation.type,
      file: result.file,
      message: result.message,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [文件操作] 失败:', error);
    return NextResponse.json(
      { 
        error: '文件操作失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}

// 🎯 创建文件
async function handleCreateFile(operation: CodingAgentFileOperation) {
  const { path, content = '', description } = operation;
  
  if (mockFileStorage.has(path)) {
    throw new Error(`文件 ${path} 已存在`);
  }

  const language = getLanguageFromPath(path);
  const fileData = {
    content,
    language,
    lastModified: new Date(),
    created: new Date()
  };

  mockFileStorage.set(path, fileData);

  console.log(`✅ [文件创建] 创建文件: ${path} (${language})`);

  return {
    file: {
      path,
      content,
      language,
      created: true,
      description
    },
    message: `文件 ${path} 创建成功`
  };
}

// 🎯 修改文件
async function handleModifyFile(operation: CodingAgentFileOperation) {
  const { path, content = '', description } = operation;
  
  if (!mockFileStorage.has(path)) {
    throw new Error(`文件 ${path} 不存在`);
  }

  const existing = mockFileStorage.get(path)!;
  const fileData = {
    ...existing,
    content,
    lastModified: new Date()
  };

  mockFileStorage.set(path, fileData);

  console.log(`✅ [文件修改] 修改文件: ${path}`);

  return {
    file: {
      path,
      content,
      language: existing.language,
      modified: true,
      description
    },
    message: `文件 ${path} 修改成功`
  };
}

// 🎯 删除文件
async function handleDeleteFile(operation: CodingAgentFileOperation) {
  const { path } = operation;
  
  if (!mockFileStorage.has(path)) {
    throw new Error(`文件 ${path} 不存在`);
  }

  mockFileStorage.delete(path);

  console.log(`✅ [文件删除] 删除文件: ${path}`);

  return {
    file: {
      path,
      deleted: true
    },
    message: `文件 ${path} 删除成功`
  };
}

// 🎯 重命名文件
async function handleRenameFile(operation: CodingAgentFileOperation) {
  const { oldPath, newPath } = operation;
  
  if (!oldPath || !newPath) {
    throw new Error('重命名操作需要提供 oldPath 和 newPath');
  }

  if (!mockFileStorage.has(oldPath)) {
    throw new Error(`文件 ${oldPath} 不存在`);
  }

  if (mockFileStorage.has(newPath)) {
    throw new Error(`文件 ${newPath} 已存在`);
  }

  const fileData = mockFileStorage.get(oldPath)!;
  mockFileStorage.delete(oldPath);
  mockFileStorage.set(newPath, {
    ...fileData,
    lastModified: new Date()
  });

  console.log(`✅ [文件重命名] ${oldPath} -> ${newPath}`);

  return {
    file: {
      path: newPath,
      content: fileData.content,
      language: fileData.language,
      renamed: true,
      oldPath
    },
    message: `文件重命名成功: ${oldPath} -> ${newPath}`
  };
}

// 🎯 移动文件
async function handleMoveFile(operation: CodingAgentFileOperation) {
  const { oldPath, newPath } = operation;
  
  if (!oldPath || !newPath) {
    throw new Error('移动操作需要提供 oldPath 和 newPath');
  }

  if (!mockFileStorage.has(oldPath)) {
    throw new Error(`文件 ${oldPath} 不存在`);
  }

  if (mockFileStorage.has(newPath)) {
    throw new Error(`目标位置 ${newPath} 已存在文件`);
  }

  const fileData = mockFileStorage.get(oldPath)!;
  mockFileStorage.delete(oldPath);
  mockFileStorage.set(newPath, {
    ...fileData,
    lastModified: new Date()
  });

  console.log(`✅ [文件移动] ${oldPath} -> ${newPath}`);

  return {
    file: {
      path: newPath,
      content: fileData.content,
      language: fileData.language,
      moved: true,
      oldPath
    },
    message: `文件移动成功: ${oldPath} -> ${newPath}`
  };
}

// 🎯 获取文件列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'SessionId is required' },
        { status: 400 }
      );
    }

    const files = Array.from(mockFileStorage.entries()).map(([path, data]) => ({
      path,
      content: data.content,
      language: data.language,
      lastModified: data.lastModified.toISOString(),
      created: data.created.toISOString(),
      size: data.content.length
    }));

    return NextResponse.json({
      success: true,
      files,
      count: files.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [文件列表] 获取失败:', error);
    return NextResponse.json(
      { 
        error: '获取文件列表失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}

// 🎯 辅助函数：根据文件路径获取语言类型
function getLanguageFromPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();
  
  switch (ext) {
    case 'tsx':
    case 'jsx':
      return 'typescript';
    case 'ts':
      return 'typescript';
    case 'js':
      return 'javascript';
    case 'css':
      return 'css';
    case 'scss':
    case 'sass':
      return 'scss';
    case 'json':
      return 'json';
    case 'md':
      return 'markdown';
    case 'html':
      return 'html';
    case 'py':
      return 'python';
    case 'java':
      return 'java';
    case 'cpp':
    case 'c':
      return 'cpp';
    case 'go':
      return 'go';
    case 'rs':
      return 'rust';
    case 'php':
      return 'php';
    case 'rb':
      return 'ruby';
    case 'swift':
      return 'swift';
    case 'kt':
      return 'kotlin';
    case 'dart':
      return 'dart';
    case 'vue':
      return 'vue';
    case 'svelte':
      return 'svelte';
    case 'yml':
    case 'yaml':
      return 'yaml';
    case 'xml':
      return 'xml';
    case 'sql':
      return 'sql';
    case 'sh':
    case 'bash':
      return 'bash';
    case 'ps1':
      return 'powershell';
    case 'dockerfile':
      return 'dockerfile';
    default:
      return 'plaintext';
  }
} 