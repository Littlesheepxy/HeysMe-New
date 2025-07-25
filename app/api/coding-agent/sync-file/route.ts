import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    // 验证用户认证
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId, file } = body;

    // 验证请求参数
    if (!sessionId || !file || !file.path || !file.content) {
      return NextResponse.json({ 
        error: 'Missing required fields: sessionId, file.path, file.content' 
      }, { status: 400 });
    }

    console.log('📁 [文件同步] 收到同步请求:', {
      sessionId,
      filePath: file.path,
      contentLength: file.content.length,
      language: file.language
    });

    // 🆕 使用真实的数据库服务
    const { codingDb } = await import('@/lib/services/coding-database');
    
    // 首先确保session存在
    let session = await codingDb.getSession(sessionId);
    if (!session) {
      console.log('📁 [文件同步] 创建新session:', sessionId);
      session = await codingDb.upsertSession({
        sessionId,
        userId,
        metadata: {
          mode: 'coding',
          agent_name: 'CodingAgent',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      });
    }

    // 🆕 辅助函数：根据文件路径推断文件类型
    const inferFileType = (filePath: string): 'component' | 'config' | 'style' | 'data' | 'other' => {
      const ext = filePath.split('.').pop()?.toLowerCase() || '';
      if (['tsx', 'jsx', 'ts', 'js'].includes(ext)) return 'component';
      if (['css', 'scss', 'sass', 'less'].includes(ext)) return 'style';
      if (['json', 'yaml', 'yml', 'toml'].includes(ext)) return 'config';
      if (['md', 'txt', 'doc'].includes(ext)) return 'data';
      return 'other';
    };

    // 保存文件到数据库
    const savedFile = await codingDb.upsertFile({
      sessionId,
      path: file.path,
      content: file.content,
      language: file.language,
      size: file.content.length,
      version: 1, // 新文件从版本1开始
      status: 'synced',
      metadata: {
        type: inferFileType(file.path),
        sync_timestamp: file.timestamp || new Date().toISOString()
      }
    });

    const result = {
      id: savedFile.id,
      sessionId: savedFile.sessionId,
      path: savedFile.path,
      language: savedFile.language,
      size: savedFile.size,
      version: savedFile.version,
      checksum: savedFile.checksum,
      timestamp: savedFile.updated_at,
      status: savedFile.status
    };

    console.log('✅ [文件同步] 同步成功:', result);

    return NextResponse.json({
      success: true,
      file: result,
      message: `文件 ${file.path} 已成功同步到数据库`
    });

  } catch (error) {
    console.error('❌ [文件同步] API错误:', error);
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 });
  }
}

// 获取会话的所有文件
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ 
        error: 'Missing sessionId parameter' 
      }, { status: 400 });
    }

    // 模拟获取文件列表
    const mockFiles = [
      {
        id: 'file_1',
        sessionId,
        path: 'example.tsx',
        language: 'typescript',
        size: 1024,
        timestamp: new Date().toISOString(),
        status: 'synced'
      }
    ];

    return NextResponse.json({
      success: true,
      files: mockFiles,
      count: mockFiles.length
    });

  } catch (error) {
    console.error('❌ [文件获取] API错误:', error);
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
} 