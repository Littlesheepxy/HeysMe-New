import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseDocumentService } from '@/lib/services/supabase-document-service';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    // 1. 认证检查
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    const documentId = params.id;

    console.log(`🔍 [API] 用户 ${userId} 请求解析文档: ${documentId}`);

    // 2. 解析文档
    const parseResult = await supabaseDocumentService.parseDocument(documentId);

    console.log(`✅ [API] 文档解析完成: ${documentId}`);

    return NextResponse.json({
      success: true,
      result: parseResult
    });

  } catch (error) {
    console.error('❌ [API] 文档解析失败:', error);
    
    return NextResponse.json(
      { 
        error: '文档解析失败', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    // 1. 认证检查
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    const documentId = params.id;

    // 2. 获取文档内容
    const content = await supabaseDocumentService.getDocumentContent(documentId);

    return NextResponse.json({
      success: true,
      content
    });

  } catch (error) {
    console.error('❌ [API] 获取文档内容失败:', error);
    
    return NextResponse.json(
      { 
        error: '获取文档内容失败', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 