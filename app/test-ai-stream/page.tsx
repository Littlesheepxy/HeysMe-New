'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Play, Square, Trash2, Copy, Download, FileDown } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

interface StreamMessage {
  id: string;
  timestamp: string;
  type: 'thinking' | 'ai_response' | 'generating' | 'project_complete' | 'complete' | 'error';
  content: string;
  displayContent?: string;
  isStreaming?: boolean;
  metadata?: any;
}

export default function AIStreamTestPage() {
  const [input, setInput] = useState('帮我生成一个马斯克的简历，风格参考特斯拉的官网');
  const [isStreaming, setIsStreaming] = useState(false);
  const [messages, setMessages] = useState<StreamMessage[]>([]);
  const [rawResponse, setRawResponse] = useState('');
  const [fullAIResponse, setFullAIResponse] = useState('');
  const [accumulatedAIContent, setAccumulatedAIContent] = useState('');
  const [sessionId, setSessionId] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const fullResponseRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [streamingMessageIds, setStreamingMessageIds] = useState<Set<string>>(new Set());
  const typewriterIntervals = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    if (fullResponseRef.current) {
      fullResponseRef.current.scrollTop = fullResponseRef.current.scrollHeight;
    }
  }, [messages, rawResponse, fullAIResponse]);

  const startTypewriterEffect = (messageId: string, fullContent: string, speed: number = 50) => {
    const existingInterval = typewriterIntervals.current.get(messageId);
    if (existingInterval) {
      clearInterval(existingInterval);
    }

    let currentIndex = 0;
    setStreamingMessageIds(prev => new Set(prev).add(messageId));

    const interval = setInterval(() => {
      if (currentIndex <= fullContent.length) {
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, displayContent: fullContent.substring(0, currentIndex), isStreaming: true }
            : msg
        ));
        currentIndex++;
      } else {
        clearInterval(interval);
        typewriterIntervals.current.delete(messageId);
        setStreamingMessageIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(messageId);
          return newSet;
        });
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, displayContent: fullContent, isStreaming: false }
            : msg
        ));
      }
    }, speed);

    typewriterIntervals.current.set(messageId, interval);
  };

  const generateSessionId = () => {
    const newSessionId = `test-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(newSessionId);
    return newSessionId;
  };

  const exportAIContent = () => {
    if (!accumulatedAIContent.trim()) {
      toast.error('没有AI返回内容可导出');
      return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `ai-response-${timestamp}.md`;
    
    const documentContent = `# AI代码生成结果

**生成时间**: ${new Date().toLocaleString()}
**会话ID**: ${sessionId}
**用户输入**: ${input}

---

## 完整AI返回内容

${accumulatedAIContent}

---

*此文档由HeysMe AI流式测试工具自动生成*
`;

    const blob = new Blob([documentContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`AI内容已导出为 ${filename}`);
  };

  const startStream = async () => {
    if (!input.trim()) {
      toast.error('请输入测试内容');
      return;
    }

    setIsStreaming(true);
    setMessages([]);
    setRawResponse('');
    setFullAIResponse('');
    setAccumulatedAIContent('');
    
    typewriterIntervals.current.forEach(interval => clearInterval(interval));
    typewriterIntervals.current.clear();
    setStreamingMessageIds(new Set());
    
    const currentSessionId = generateSessionId();
    abortControllerRef.current = new AbortController();
    let currentStreamingMessageId: string | null = null;

    try {
      const startMessage: StreamMessage = {
        id: `start-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'thinking',
        content: '🚀 开始AI流式生成测试...',
        displayContent: '🚀 开始AI流式生成测试...',
        isStreaming: false
      };
      setMessages([startMessage]);

      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          sessionId: currentSessionId,
          forceAgent: 'coding',
          testMode: true
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        setRawResponse(prev => prev + chunk);

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            
            if (data === '[DONE]') {
              const completeMessage: StreamMessage = {
                id: `complete-${Date.now()}`,
                timestamp: new Date().toISOString(),
                type: 'complete',
                content: '✅ 流式生成完成！',
                displayContent: '✅ 流式生成完成！',
                isStreaming: false
              };
              setMessages(prev => [...prev, completeMessage]);
              continue;
            }

            try {
              const parsed = JSON.parse(data);
              
              if (parsed.type === 'agent_response' && parsed.immediate_display) {
                const messageId = `msg-${Date.now()}-${Math.random()}`;
                const isGeneratingType = parsed.system_state?.intent === 'generating';
                const isStreamingUpdate = parsed.system_state?.metadata?.is_update;
                
                const replyContent = parsed.immediate_display.reply || '';
                if (replyContent.trim()) {
                  if (isGeneratingType && isStreamingUpdate) {
                    setAccumulatedAIContent(prev => {
                      const lines = prev.split('\n\n');
                      lines[lines.length - 1] = replyContent;
                      return lines.join('\n\n');
                    });
                    setFullAIResponse(replyContent);
                  } else {
                    setAccumulatedAIContent(prev => prev ? prev + '\n\n' + replyContent : replyContent);
                    setFullAIResponse(prev => prev ? prev + '\n\n' + replyContent : replyContent);
                  }
                }

                if (isGeneratingType && isStreamingUpdate && currentStreamingMessageId) {
                  const fullContent = parsed.immediate_display.reply;
                  setMessages(prev => prev.map(msg => 
                    msg.id === currentStreamingMessageId 
                      ? { ...msg, content: fullContent }
                      : msg
                  ));
                  
                  startTypewriterEffect(currentStreamingMessageId, fullContent, 30);
                } else {
                  const message: StreamMessage = {
                    id: messageId,
                    timestamp: parsed.immediate_display.timestamp,
                    type: parsed.system_state?.intent || 'ai_response',
                    content: parsed.immediate_display.reply,
                    displayContent: '',
                    isStreaming: true,
                    metadata: {
                      agent: parsed.immediate_display.agent_name,
                      progress: parsed.system_state?.progress,
                      stage: parsed.system_state?.current_stage,
                      done: parsed.system_state?.done,
                      ...parsed.system_state?.metadata
                    }
                  };
                  
                  setMessages(prev => [...prev, message]);
                  
                  if (isGeneratingType) {
                    currentStreamingMessageId = messageId;
                    startTypewriterEffect(messageId, parsed.immediate_display.reply, 50);
                  } else {
                    setTimeout(() => {
                      setMessages(prev => prev.map(msg => 
                        msg.id === messageId 
                          ? { ...msg, displayContent: msg.content, isStreaming: false }
                          : msg
                      ));
                    }, 200);
                  }
                }
              }
            } catch (e) {
              console.warn('解析SSE数据失败:', e, data);
            }
          }
        }
      }

    } catch (error: any) {
      if (error.name === 'AbortError') {
        const abortMessage: StreamMessage = {
          id: `abort-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'error',
          content: '❌ 用户取消了请求',
          displayContent: '❌ 用户取消了请求',
          isStreaming: false
        };
        setMessages(prev => [...prev, abortMessage]);
      } else {
        console.error('Stream error:', error);
        const errorMessage: StreamMessage = {
          id: `error-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'error',
          content: `❌ 请求失败: ${error.message}`,
          displayContent: `❌ 请求失败: ${error.message}`,
          isStreaming: false
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
      currentStreamingMessageId = null;
      
      typewriterIntervals.current.forEach(interval => clearInterval(interval));
      typewriterIntervals.current.clear();
      setStreamingMessageIds(new Set());
    }
  };

  const stopStream = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const clearLogs = () => {
    setMessages([]);
    setRawResponse('');
    setFullAIResponse('');
    setAccumulatedAIContent('');
    setSessionId('');
    
    typewriterIntervals.current.forEach(interval => clearInterval(interval));
    typewriterIntervals.current.clear();
    setStreamingMessageIds(new Set());
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('已复制到剪贴板');
  };

  const downloadLogs = () => {
    const logData = {
      sessionId,
      input,
      timestamp: new Date().toISOString(),
      messages,
      rawResponse,
      fullAIResponse,
      accumulatedAIContent
    };
    
    const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-stream-test-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('日志已下载');
  };

  const getMessageStyle = (type: string) => {
    switch (type) {
      case 'thinking':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'ai_response':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'generating':
        return 'bg-amber-50 border-amber-200 text-amber-800';
      case 'project_complete':
        return 'bg-purple-50 border-purple-200 text-purple-800';
      case 'complete':
        return 'bg-emerald-50 border-emerald-200 text-emerald-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🤖 CodingAgent AI流式测试
          </h1>
          <p className="text-gray-600">
            实时查看大模型的流式返回内容和处理过程
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="w-5 h-5" />
              测试控制台
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                测试输入内容
              </label>
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="输入您想要测试的内容..."
                rows={3}
                disabled={isStreaming}
              />
            </div>

            {sessionId && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>会话ID:</span>
                <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                  {sessionId}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(sessionId)}
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={startStream}
                disabled={isStreaming}
                className="flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                开始测试
              </Button>
              
              {isStreaming && (
                <Button
                  variant="destructive"
                  onClick={stopStream}
                  className="flex items-center gap-2"
                >
                  <Square className="w-4 h-4" />
                  停止
                </Button>
              )}
              
              <Button
                variant="outline"
                onClick={clearLogs}
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                清空
              </Button>
              
              {accumulatedAIContent && (
                <Button
                  variant="outline"
                  onClick={exportAIContent}
                  className="flex items-center gap-2"
                >
                  <FileDown className="w-4 h-4" />
                  导出AI内容
                </Button>
              )}
              
              {messages.length > 0 && (
                <Button
                  variant="outline"
                  onClick={downloadLogs}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  下载日志
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>📝 结构化消息流</span>
                <Badge variant="secondary">
                  {messages.length} 条消息
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96" ref={scrollRef}>
                <div className="space-y-3">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-3 rounded-lg border ${getMessageStyle(message.type)}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {message.type}
                          </Badge>
                          {message.isStreaming && (
                            <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
                          )}
                        </div>
                        <span className="text-xs opacity-70">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      
                      <div className="text-sm mb-2 prose prose-sm max-w-none">
                        <ReactMarkdown>
                          {message.displayContent || message.content}
                        </ReactMarkdown>
                      </div>
                      
                      {message.metadata && (
                        <div className="text-xs opacity-70 space-y-1">
                          {message.metadata.agent && (
                            <div>Agent: {message.metadata.agent}</div>
                          )}
                          {message.metadata.progress !== undefined && (
                            <div>进度: {message.metadata.progress}%</div>
                          )}
                          {message.metadata.stage && (
                            <div>阶段: {message.metadata.stage}</div>
                          )}
                          {message.metadata.chunk_count && (
                            <div>块数: {message.metadata.chunk_count}</div>
                          )}
                          {message.metadata.accumulated_length && (
                            <div>长度: {message.metadata.accumulated_length}</div>
                          )}
                          {message.metadata.estimated_lines && (
                            <div>行数: {message.metadata.estimated_lines}</div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>🧠 大模型完整返回</span>
                <div className="flex gap-2">
                  <Badge variant="secondary">
                    {fullAIResponse.length} 字符
                  </Badge>
                  {fullAIResponse && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(fullAIResponse)}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96" ref={fullResponseRef}>
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>
                    {fullAIResponse || '等待大模型返回...'}
                  </ReactMarkdown>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>🔍 原始响应流</span>
                <div className="flex gap-2">
                  <Badge variant="secondary">
                    {rawResponse.length} 字符
                  </Badge>
                  {rawResponse && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(rawResponse)}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono">
                  {rawResponse || '等待响应...'}
                </pre>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {isStreaming && (
          <div className="fixed bottom-6 right-6">
            <div className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              正在流式生成...
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 