import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
  try {
    // 1. 认证检查
    const { userId, getToken } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    // 2. 获取用户JWT令牌
    const userToken = await getToken();
    if (!userToken) {
      return NextResponse.json(
        { error: '无法获取用户令牌' },
        { status: 401 }
      );
    }

    // 3. 解析请求参数
    const { filename, sessionId, extractMode, expiresIn } = await req.json();

    if (!filename) {
      return NextResponse.json(
        { error: '文件名不能为空' },
        { status: 400 }
      );
    }

    console.log(`🔗 [预签名URL] 用户 ${userId} 请求生成: ${filename}`);

    // 4. 生成预签名URL（这里使用标准Storage API作为示例）
    // 在实际项目中，你需要安装 @aws-sdk/client-s3 并使用 supabaseS3DocumentService
    
    const presignedResult = {
      uploadUrl: `/api/documents/upload`, // 回退到标准上传
      documentId: `temp-${Date.now()}`,
      fields: {
        'Content-Type': 'application/octet-stream'
      },
      expiresAt: new Date(Date.now() + (expiresIn || 3600) * 1000).toISOString()
    };

    console.log(`✅ [预签名URL] 生成成功`);

    return NextResponse.json({
      success: true,
      result: presignedResult
    });

  } catch (error) {
    console.error('❌ [预签名URL] 生成失败:', error);
    
    return NextResponse.json(
      { 
        error: '预签名URL生成失败', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 