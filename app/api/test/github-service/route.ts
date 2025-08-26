import { NextRequest, NextResponse } from 'next/server';
import { githubService } from '@/lib/services';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username') || 'octocat';
    
    console.log(`🔧 [GitHub Service Test] 测试用户: ${username}`);
    
    const result = await githubService.analyzeUser(username, true);
    
    console.log(`✅ [GitHub Service Test] 分析完成`);
    console.log(`📊 [结果]`, JSON.stringify(result, null, 2));
    
    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ [GitHub Service Test] 错误:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { username_or_url, include_repos = true } = await req.json();
    
    console.log(`🔧 [GitHub Service Test] POST 测试用户: ${username_or_url}`);
    
    const result = await githubService.analyzeUser(username_or_url, include_repos);
    
    console.log(`✅ [GitHub Service Test] POST 分析完成`);
    
    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ [GitHub Service Test] POST 错误:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
