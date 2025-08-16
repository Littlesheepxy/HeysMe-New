/**
 * 流式应用 AI 代码 API
 * 流式应用代码（实时反馈）
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
    const { response, packages = [] } = body;

    const sandboxService = userSandboxes.get(userId);
    
    if (!sandboxService) {
      return NextResponse.json({
        success: false,
        error: 'NO_SANDBOX',
        message: '沙盒不存在'
      }, { status: 400 });
    }

    // 创建流式响应
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 发送开始事件
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'start',
            message: '开始应用 AI 代码...',
            timestamp: new Date().toISOString()
          })}\n\n`));

          // 解析 AI 响应
          const parsed = parseAIResponse(response);
          
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'parsed',
            message: `解析到 ${parsed.files.length} 个文件`,
            files: parsed.files.map(f => ({ path: f.path, size: f.content.length }))
          })}\n\n`));

          // 安装依赖（如果有）
          if (packages.length > 0) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'install_deps',
              message: `安装依赖: ${packages.join(', ')}`,
              packages
            })}\n\n`));

            const installResponse = await fetch('/api/e2b-sandbox/detect-packages', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ files: Object.fromEntries(parsed.files.map(f => [f.path, f.content])) })
            });

            const installResult = await installResponse.json();
            
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'install_complete',
              message: installResult.success ? '依赖安装完成' : '依赖安装失败',
              success: installResult.success,
              details: installResult
            })}\n\n`));
          }

          // 应用文件
          for (const file of parsed.files) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'apply_file',
              message: `应用文件: ${file.path}`,
              path: file.path,
              progress: (parsed.files.indexOf(file) + 1) / parsed.files.length
            })}\n\n`));

            try {
              const sandbox = (sandboxService as any).sandbox;
              await sandbox.files.write(file.path, file.content);
              
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                type: 'file_success',
                message: `文件应用成功: ${file.path}`,
                path: file.path
              })}\n\n`));
            } catch (error) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                type: 'file_error',
                message: `文件应用失败: ${file.path}`,
                path: file.path,
                error: error instanceof Error ? error.message : '未知错误'
              })}\n\n`));
            }
          }

          // 完成
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'complete',
            message: '代码应用完成',
            timestamp: new Date().toISOString(),
            totalFiles: parsed.files.length
          })}\n\n`));

          controller.close();

        } catch (error) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'error',
            message: '应用代码时发生错误',
            error: error instanceof Error ? error.message : '未知错误'
          })}\n\n`));
          
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'STREAM_FAILED',
      message: '流式应用失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

// 解析 AI 响应
function parseAIResponse(response: string) {
  const files: Array<{ path: string; content: string }> = [];
  
  // 简单的代码块提取（实际项目中应该更复杂）
  const codeBlockRegex = /```(?:json|typescript|javascript|tsx|jsx|css|html)?\s*\n([\s\S]*?)```/g;
  let match;
  
  while ((match = codeBlockRegex.exec(response)) !== null) {
    const content = match[1];
    
    // 尝试推断文件名
    const pathMatch = response.substring(0, match.index).match(/(?:文件名|文件|file|path)[：:]?\s*([^\n\r]+)/gi);
    const fileName = pathMatch ? pathMatch[pathMatch.length - 1].split(':')[1]?.trim() : `file_${files.length}.txt`;
    
    files.push({
      path: fileName,
      content: content.trim()
    });
  }
  
  return { files };
}
