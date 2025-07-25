/**
 * 基于Cline架构的流式Coding Agent示例
 * 演示如何实现"输出文本 → 调用工具 → 输出文本 → 调用工具"的交互
 */

import React, { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { StreamingToolExecutor, CodingAgentWithStreaming } from '@/lib/agents/coding/streaming-tool-executor';
import { FileText, Terminal, Code, Play, Pause, RotateCcw } from 'lucide-react';

// ===== 消息类型 =====

interface StreamingMessage {
  id: string;
  type: 'user' | 'assistant' | 'tool';
  content: string;
  timestamp: number;
  partial?: boolean;
  toolName?: string;
  toolStatus?: 'executing' | 'completed' | 'error';
}

// ===== 主组件 =====

export function StreamingCodingAgent() {
  const [messages, setMessages] = useState<StreamingMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<{
    totalBlocks: number;
    currentIndex: number;
    isProcessing: boolean;
  }>({ totalBlocks: 0, currentIndex: 0, isProcessing: false });
  
  const agentRef = useRef<CodingAgentWithStreaming | null>(null);
  const currentMessageIdRef = useRef<string | null>(null);
  
  // 初始化Agent
  const initializeAgent = useCallback(() => {
    if (agentRef.current) return;
    
    const agent = new CodingAgentWithStreaming();
    
    // 配置流式工具执行器
    agent.toolExecutor = new StreamingToolExecutor({
      onTextUpdate: async (text: string, partial: boolean) => {
        const messageId = currentMessageIdRef.current || Date.now().toString();
        currentMessageIdRef.current = messageId;
        
        setMessages(prev => {
          const existing = prev.find(m => m.id === messageId);
          if (existing) {
            return prev.map(m => 
              m.id === messageId 
                ? { ...m, content: text, partial }
                : m
            );
          } else {
            return [...prev, {
              id: messageId,
              type: 'assistant',
              content: text,
              timestamp: Date.now(),
              partial
            }];
          }
        });
      },
      
      onToolExecute: async (toolName: string, params: Record<string, string>) => {
        // 添加工具执行消息
        const toolMessageId = Date.now().toString();
        setMessages(prev => [...prev, {
          id: toolMessageId,
          type: 'tool',
          content: `执行工具: ${toolName}`,
          timestamp: Date.now(),
          toolName,
          toolStatus: 'executing'
        }]);
        
        // 模拟工具执行
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 执行具体工具
        const result = await executeActualTool(toolName, params);
        
        // 更新工具状态
        setMessages(prev => prev.map(m => 
          m.id === toolMessageId 
            ? { ...m, content: `${m.content}\n结果: ${result}`, toolStatus: 'completed' }
            : m
        ));
        
        return result;
      },
      
      onToolResult: async (result: string) => {
        console.log('工具结果:', result);
      }
    });
    
    agentRef.current = agent;
  }, []);
  
  // 模拟工具执行
  const executeActualTool = async (toolName: string, params: Record<string, string>): Promise<string> => {
    switch (toolName) {
      case 'write_to_file':
        return `✅ 文件 ${params.path} 创建成功，内容长度: ${params.content?.length || 0} 字符`;
      case 'execute_command':
        return `✅ 命令 "${params.command}" 执行成功`;
      case 'read_file':
        return `✅ 文件 ${params.path} 读取成功`;
      case 'create_component':
        return `✅ 组件 ${params.name} 创建成功`;
      case 'deploy_code':
        return `✅ 代码部署成功`;
      default:
        return `❌ 未知工具: ${toolName}`;
    }
  };
  
  // 发送消息
  const handleSendMessage = useCallback(async () => {
    if (!input.trim() || isStreaming) return;
    
    initializeAgent();
    
    // 添加用户消息
    const userMessage: StreamingMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);
    currentMessageIdRef.current = null;
    
    try {
      // 模拟流式AI响应
      const mockStreamingResponse = generateMockStreamingResponse(input);
      
      for (const chunk of mockStreamingResponse) {
        await new Promise(resolve => setTimeout(resolve, 100)); // 模拟流式延迟
        
        if (agentRef.current) {
          await agentRef.current.handleStreamingResponse(chunk);
          
          // 更新处理状态
          const status = agentRef.current.toolExecutor.getProcessingStatus();
          setProcessingStatus(status);
        }
      }
    } catch (error) {
      console.error('流式处理错误:', error);
    } finally {
      setIsStreaming(false);
      currentMessageIdRef.current = null;
    }
  }, [input, isStreaming, initializeAgent]);
  
  // 生成模拟的流式响应
  const generateMockStreamingResponse = (userInput: string): string[] => {
    const response = `
我来帮你${userInput.includes('创建') ? '创建' : '处理'}这个需求。

<write_to_file>
<path>src/components/Example.tsx</path>
<content>
import React from 'react';

export const Example: React.FC = () => {
  return (
    <div className="p-4">
      <h1>示例组件</h1>
      <p>这是根据你的需求创建的组件</p>
    </div>
  );
};
</content>
</write_to_file>

好的，文件创建完成！现在让我执行一个命令来验证：

<execute_command>
<command>npm run build</command>
</execute_command>

构建成功！你的需求已经完成了。
    `.trim();
    
    // 将响应分割成块来模拟流式传输
    const chunks: string[] = [];
    let currentChunk = '';
    
    for (const char of response) {
      currentChunk += char;
      
      // 在单词边界或标签边界处分割
      if (char === ' ' || char === '\n' || char === '>') {
        chunks.push(currentChunk);
        currentChunk = '';
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk);
    }
    
    return chunks;
  };
  
  // 重置对话
  const handleReset = () => {
    setMessages([]);
    setInput('');
    setIsStreaming(false);
    setProcessingStatus({ totalBlocks: 0, currentIndex: 0, isProcessing: false });
    agentRef.current?.toolExecutor.reset();
    currentMessageIdRef.current = null;
  };
  
  // 获取消息图标
  const getMessageIcon = (message: StreamingMessage) => {
    switch (message.type) {
      case 'user':
        return <div className="w-2 h-2 bg-blue-500 rounded-full" />;
      case 'assistant':
        return <div className="w-2 h-2 bg-green-500 rounded-full" />;
      case 'tool':
        return message.toolStatus === 'executing' ? 
          <Terminal className="w-4 h-4 text-orange-500 animate-spin" /> :
          <Terminal className="w-4 h-4 text-green-500" />;
      default:
        return <div className="w-2 h-2 bg-gray-500 rounded-full" />;
    }
  };
  
  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto p-4">
      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Code className="w-5 h-5" />
              流式Coding Agent
            </CardTitle>
            <div className="flex items-center gap-2">
              {processingStatus.isProcessing && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Play className="w-3 h-3" />
                  处理中: {processingStatus.currentIndex}/{processingStatus.totalBlocks}
                </Badge>
              )}
              {isStreaming && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  流式传输中
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="flex items-center gap-1"
              >
                <RotateCcw className="w-4 h-4" />
                重置
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col">
          {/* 消息列表 */}
          <ScrollArea className="flex-1 mb-4 p-2 border rounded-md">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>开始对话来体验流式工具调用</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-start gap-3 p-3 rounded-lg ${
                      message.type === 'user' 
                        ? 'bg-blue-50 ml-8' 
                        : message.type === 'tool'
                        ? 'bg-orange-50 mr-8'
                        : 'bg-green-50 mr-8'
                    }`}
                  >
                    <div className="flex-shrink-0 mt-1">
                      {getMessageIcon(message)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {message.type === 'user' ? '用户' : 
                           message.type === 'tool' ? `工具: ${message.toolName}` : 
                           'AI助手'}
                        </span>
                        {message.partial && (
                          <Badge variant="secondary" className="text-xs">
                            输出中...
                          </Badge>
                        )}
                        {message.toolStatus && (
                          <Badge 
                            variant={message.toolStatus === 'completed' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {message.toolStatus === 'executing' ? '执行中' : 
                             message.toolStatus === 'completed' ? '已完成' : '错误'}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm whitespace-pre-wrap">
                        {message.content}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          
          {/* 输入区域 */}
          <div className="space-y-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="试试说：'创建一个React组件'或'帮我写一个登录页面'"
              className="min-h-[100px]"
              disabled={isStreaming}
            />
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                支持的工具: write_to_file, execute_command, read_file, create_component, deploy_code
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={!input.trim() || isStreaming}
                className="flex items-center gap-2"
              >
                {isStreaming ? (
                  <>
                    <Pause className="w-4 h-4" />
                    处理中...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    发送
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default StreamingCodingAgent; 