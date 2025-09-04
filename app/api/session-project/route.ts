/**
 * 会话项目管理API
 * 用于测试和管理会话级别的项目文件
 */

import { NextRequest, NextResponse } from 'next/server';
import { sessionProjectManager } from '@/lib/services/session-project-manager';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const userId = searchParams.get('userId');
    const action = searchParams.get('action') || 'stats';

    if (!sessionId || !userId) {
      return NextResponse.json(
        { error: 'Missing sessionId or userId' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'stats':
        const stats = await sessionProjectManager.getSessionProjectStats(sessionId, userId);
        return NextResponse.json({ success: true, data: stats });

      case 'files':
        const files = await sessionProjectManager.getSessionProjectFiles(sessionId, userId);
        return NextResponse.json({ success: true, data: files });

      case 'versions':
        const versions = await sessionProjectManager.getSessionProjectVersions(sessionId, userId);
        return NextResponse.json({ success: true, data: versions });

      case 'version-files':
        const version = searchParams.get('version');
        if (!version) {
          return NextResponse.json(
            { error: 'Missing version parameter' },
            { status: 400 }
          );
        }
        const versionFiles = await sessionProjectManager.getVersionFiles(sessionId, userId, version);
        return NextResponse.json({ success: true, data: versionFiles });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('❌ [会话项目API] 失败:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Session project operation failed', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { sessionId, userId, files, commitMessage } = await request.json();

    if (!sessionId || !userId || !files || !Array.isArray(files)) {
      return NextResponse.json(
        { error: 'Missing required parameters: sessionId, userId, files' },
        { status: 400 }
      );
    }

    const result = await sessionProjectManager.addFilesToSessionProject(
      sessionId,
      userId,
      files,
      commitMessage
    );

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('❌ [会话项目API] 添加文件失败:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to add files to session project', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { sessionId, userId, deploymentUrl } = await request.json();

    if (!sessionId || !userId || !deploymentUrl) {
      return NextResponse.json(
        { error: 'Missing required parameters: sessionId, userId, deploymentUrl' },
        { status: 400 }
      );
    }

    await sessionProjectManager.updateSessionProjectDeployment(
      sessionId,
      userId,
      deploymentUrl
    );

    return NextResponse.json({
      success: true,
      message: 'Deployment URL updated successfully'
    });

  } catch (error) {
    console.error('❌ [会话项目API] 更新部署URL失败:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update deployment URL', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}
