/**
 * 分析编辑意图 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userInput, currentFiles = {}, context = {} } = body;

    if (!userInput) {
      return NextResponse.json({
        success: false,
        error: 'MISSING_INPUT',
        message: '必须提供用户输入'
      }, { status: 400 });
    }

    console.log('🧠 [Analyze Edit Intent] 分析编辑意图:', userInput.substring(0, 100) + '...');

    // 简单的意图分析（实际项目中应该使用更复杂的 NLP）
    const analysis = analyzeIntent(userInput, currentFiles, context);

    return NextResponse.json({
      success: true,
      message: '编辑意图分析完成',
      analysis,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'ANALYSIS_FAILED',
      message: '编辑意图分析失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

function analyzeIntent(userInput: string, currentFiles: any, context: any) {
  const input = userInput.toLowerCase();
  
  // 意图分类
  let intent = 'modify';
  let confidence = 0.8;
  
  if (input.includes('新建') || input.includes('创建') || input.includes('添加')) {
    intent = 'create';
    confidence = 0.9;
  } else if (input.includes('删除') || input.includes('移除')) {
    intent = 'delete';
    confidence = 0.9;
  } else if (input.includes('修改') || input.includes('更新') || input.includes('改')) {
    intent = 'modify';
    confidence = 0.9;
  } else if (input.includes('重构') || input.includes('优化')) {
    intent = 'refactor';
    confidence = 0.8;
  }

  // 文件类型检测
  const fileTypes = [];
  if (input.includes('组件') || input.includes('component')) {
    fileTypes.push('component');
  }
  if (input.includes('样式') || input.includes('css') || input.includes('style')) {
    fileTypes.push('style');
  }
  if (input.includes('api') || input.includes('接口')) {
    fileTypes.push('api');
  }
  if (input.includes('页面') || input.includes('page')) {
    fileTypes.push('page');
  }

  return {
    intent,
    confidence,
    fileTypes,
    suggestedMode: intent === 'create' ? 'initial' : 'incremental',
    keywords: extractKeywords(userInput),
    complexity: estimateComplexity(userInput)
  };
}

function extractKeywords(input: string): string[] {
  // 简单的关键词提取
  const keywords = input
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 2)
    .filter(word => !['的', '是', '在', '和', 'the', 'and', 'or', 'but'].includes(word));
    
  return [...new Set(keywords)];
}

function estimateComplexity(input: string): 'low' | 'medium' | 'high' {
  if (input.length < 50) return 'low';
  if (input.length < 200) return 'medium';
  return 'high';
}
