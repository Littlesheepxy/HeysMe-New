import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { unifiedDocumentService } from '@/lib/services/unified-document-service';

export async function POST(req: NextRequest) {
  try {
    // 1. 认证检查
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    // 2. 解析表单数据
    const formData = await req.formData();
    const files: File[] = [];
    const isPrivacyMode = formData.get('isPrivacyMode') === 'true';
    const sessionId = formData.get('sessionId') as string;
    const extractMode = (formData.get('extractMode') as string) || 'comprehensive';

    // 收集所有文件
    formData.forEach((value, key) => {
      if (key.startsWith('file') && value instanceof File) {
        files.push(value);
      }
    });

    if (files.length === 0) {
      return NextResponse.json(
        { error: '未提供文件' },
        { status: 400 }
      );
    }

    console.log(`📄 [API] 用户 ${userId} 上传 ${files.length} 个文件 (隐私模式: ${isPrivacyMode})`);

    // 3. 处理文档
    const results = await unifiedDocumentService.processMultipleDocuments(files, {
      isPrivacyMode,
      sessionId,
      extractMode: extractMode as 'general' | 'resume' | 'comprehensive',
      userId: isPrivacyMode ? undefined : userId
    });

    // 4. 返回结果
    const response = {
      success: true,
      message: `成功处理 ${results.length} 个文档`,
      documents: results,
      privacyMode: isPrivacyMode,
      ...(isPrivacyMode && {
        notice: '隐私模式：文档仅在内存中处理，不会持久化存储'
      })
    };

    console.log(`✅ [API] 文档处理完成: ${results.length} 个文档`);
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ [API] 文档上传失败:', error);
    
    return NextResponse.json(
      { 
        error: '文档处理失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // 获取用户文档列表
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const isPrivacyMode = url.searchParams.get('isPrivacyMode') === 'true';

    const documents = await unifiedDocumentService.getUserDocuments(userId, isPrivacyMode);

    return NextResponse.json({
      success: true,
      documents,
      privacyMode: isPrivacyMode,
      count: documents.length
    });

  } catch (error) {
    console.error('❌ [API] 获取文档列表失败:', error);
    
    return NextResponse.json(
      { 
        error: '获取文档列表失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
} 