import { NextRequest, NextResponse } from 'next/server';
import { CodingAgent } from '@/lib/agents/coding/agent';
import { validateToolInput } from '@/lib/prompts/coding/anthropic-standard-tools';

interface TestRequest {
  prompt: string;
  projectFiles: Array<{
    filename: string;
    content: string;
    language: string;
  }>;
  scenarioId?: string;
}

interface ToolCallLog {
  id: string;
  name: string;
  input: Record<string, any>;
  timestamp: number;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  result?: string;
  error?: string;
  validationErrors?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, projectFiles, scenarioId }: TestRequest = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: '缺少必需的prompt参数' },
        { status: 400 }
      );
    }

    // 创建流式响应
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 初始化CodingAgent
          const agent = new CodingAgent();
          
          // 创建模拟会话数据，确保格式正确
          const sessionData = {
            id: `test-${Date.now()}`,
            metadata: {
              projectFiles: projectFiles && projectFiles.length > 0 ? projectFiles : [
                {
                  filename: 'components/Hero.tsx',
                  content: `import React from 'react';

export default function Hero() {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-blue-500 text-xl font-bold mb-4">
          欢迎使用HeysMe
        </h1>
        <p className="text-lg text-gray-300 mb-8">
          这是一个用于测试增量修改的示例项目
        </p>
      </div>
    </div>
  );
}`,
                  language: 'typescript'
                }
              ],
              projectType: 'react',
              framework: 'Next.js',
              codingHistory: []
            }
          };

          console.log('📋 [会话数据] 项目文件数量:', sessionData.metadata.projectFiles.length);

          const toolCalls: ToolCallLog[] = [];
          let messageId = 0;

          // 发送初始状态
          const sendUpdate = (data: any) => {
            const chunk = encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
            controller.enqueue(chunk);
          };

          sendUpdate({
            type: 'start',
            message: '开始增量测试...',
            scenarioId,
            timestamp: Date.now()
          });

          // 拦截工具执行以记录调用
          const originalExecuteTool = (agent as any).executeIncrementalTool;
          if (originalExecuteTool) {
            (agent as any).executeIncrementalTool = async function(
              toolName: string, 
              params: Record<string, any>, 
              existingFiles: any[], 
              modifiedFiles: any[]
            ) {
              console.log(`🔧 [工具拦截] 执行 ${toolName}`, params);
              
              const toolCallId = `tool_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
              
              // 创建工具调用日志
              const toolCall: ToolCallLog = {
                id: toolCallId,
                name: toolName,
                input: params,
                timestamp: Date.now(),
                status: 'executing',
                validationErrors: []
              };

              // 验证工具输入
              const validation = validateToolInput(toolName, params);
              if (!validation.valid) {
                toolCall.validationErrors = validation.errors;
                toolCall.status = 'failed';
                toolCall.error = `参数验证失败: ${validation.errors.join(', ')}`;
                console.log(`❌ [工具验证失败] ${toolName}:`, validation.errors);
              }

              toolCalls.push(toolCall);
              
              // 发送工具调用开始事件
              sendUpdate({
                type: 'tool_call_start',
                toolCall: { ...toolCall },
                totalCalls: toolCalls.length
              });

              try {
                if (toolCall.status !== 'failed') {
                  // 执行实际工具调用
                  const result = await originalExecuteTool.call(
                    this, 
                    toolName, 
                    params, 
                    existingFiles, 
                    modifiedFiles
                  );
                  
                  toolCall.status = 'completed';
                  toolCall.result = result;
                  console.log(`✅ [工具执行成功] ${toolName}:`, result);
                }
              } catch (error) {
                toolCall.status = 'failed';
                toolCall.error = error instanceof Error ? error.message : String(error);
                console.error(`❌ [工具执行失败] ${toolName}:`, error);
              }

              // 发送工具调用完成事件
              sendUpdate({
                type: 'tool_call_complete',
                toolCall: { ...toolCall },
                totalCalls: toolCalls.length
              });

              return toolCall.result || toolCall.error || '工具执行完成';
            };
          } else {
            console.warn('⚠️ [警告] 未找到 executeIncrementalTool 方法');
          }

          // 直接调用 CodingAgent 的公共方法
          console.log('🚀 [开始真实AI调用] 创建CodingAgent实例...');
          
          try {
            // 使用CodingAgent的公共方法
            const agentCapabilities = {
              canStream: true,
              requiresInteraction: false,
              outputFormats: ['json']
            };
            
            // 发送开始生成事件
            sendUpdate({
              type: 'ai_generation_start',
              message: '开始AI代码生成...',
              timestamp: Date.now()
            });

            // 调用增量编辑方法 - 增强prompt以确保工具调用
            const enhancedPrompt = `${prompt}

**执行指令：请立即使用工具执行这个修改，不要只是分析。按以下步骤操作：**

1. 使用 read_file 工具读取相关文件
2. 使用 edit_file 或其他适当工具执行具体修改
3. 确保实际完成文件操作

请现在就开始工具调用。`;

            console.log('🎯 [调用参数] 增强prompt长度:', enhancedPrompt.length, 'sessionId:', sessionData.id);
            
            const responses = (agent as any).handleIncrementalAIGeneration(
              enhancedPrompt,
              sessionData,
              { testMode: true, debug: true }
            );

            let hasContent = false;
            let responseCount = 0;
            let lastResponseTime = Date.now();

            console.log('🔄 [开始迭代] 等待AI响应流...');

            try {
              for await (const response of responses) {
                hasContent = true;
                responseCount++;
                const currentTime = Date.now();
                
                console.log(`📦 [响应块 ${responseCount}] 时间间隔: ${currentTime - lastResponseTime}ms`);
                console.log(`📦 [响应内容]`, {
                  type: typeof response,
                  hasImmedateDisplay: !!response?.immediate_display,
                  hasSystemState: !!response?.system_state,
                  isDone: response?.system_state?.done,
                  keys: Object.keys(response || {})
                });
                
                lastResponseTime = currentTime;
                
                // 发送响应块
                sendUpdate({
                  type: 'response_chunk',
                  response,
                  timestamp: currentTime,
                  chunkIndex: responseCount
                });

                // 如果是最终响应，结束流
                if (response?.system_state?.done) {
                  console.log('✅ [AI生成完成] 收到最终响应');
                  break;
                }
                
                // 防止无限循环
                if (responseCount > 50) {
                  console.warn('⚠️ [安全中断] 响应数量超过50，强制结束');
                  break;
                }
              }
            } catch (iterationError) {
              console.error('❌ [迭代错误]:', iterationError);
              throw iterationError;
            }

            if (!hasContent) {
              console.warn('⚠️ [AI响应为空] 可能是配置问题');
              sendUpdate({
                type: 'error',
                message: 'AI响应为空，可能是模型配置或API密钥问题',
                timestamp: Date.now()
              });
            } else {
              console.log(`✅ [AI调用成功] 总共收到 ${responseCount} 个响应块`);
              sendUpdate({
                type: 'ai_generation_complete',
                message: `AI生成完成，共处理 ${responseCount} 个响应块`,
                timestamp: Date.now()
              });
            }

          } catch (aiError) {
            console.error('❌ [AI调用错误]:', aiError);
            sendUpdate({
              type: 'error',
              message: `AI调用失败: ${aiError instanceof Error ? aiError.message : String(aiError)}`,
              timestamp: Date.now()
            });
          }

          // 发送最终统计
          const completedCalls = toolCalls.filter(t => t.status === 'completed').length;
          const failedCalls = toolCalls.filter(t => t.status === 'failed').length;
          const validationErrors = toolCalls.reduce((acc, t) => acc + (t.validationErrors?.length || 0), 0);

          sendUpdate({
            type: 'test_complete',
            summary: {
              totalToolCalls: toolCalls.length,
              completedCalls,
              failedCalls,
              validationErrors,
              toolCalls: toolCalls.map(t => ({
                name: t.name,
                status: t.status,
                executionTime: t.timestamp,
                hasValidationErrors: (t.validationErrors?.length || 0) > 0
              }))
            },
            timestamp: Date.now()
          });

        } catch (error) {
          // 发送错误事件
          const errorData = encoder.encode(`data: ${JSON.stringify({
            type: 'error',
            message: error instanceof Error ? error.message : String(error),
            timestamp: Date.now()
          })}\n\n`);
          controller.enqueue(errorData);
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('增量测试API错误:', error);
    return NextResponse.json(
      { 
        error: '服务器内部错误',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// 健康检查端点
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: '增量测试API正常运行',
    timestamp: new Date().toISOString(),
    endpoints: {
      POST: '执行增量测试',
      GET: '健康检查'
    }
  });
}
