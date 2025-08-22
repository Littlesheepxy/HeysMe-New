// 这个文件是ChatInterface.tsx，负责处理聊天界面的核心逻辑，包括消息发送、流式数据处理、系统级loading状态等。
// 它不负责单个消息的内容渲染，也不负责消息内的交互表单，也不负责消息级别的loading状态。
// 它只负责全局状态管理、流式数据接收和分发、系统级loading状态、工具执行状态管理、错误处理和重试逻辑、输入框和发送逻辑。

//暂时废弃不用


'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { InteractionPanel } from './InteractionPanel';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Bot, 
  User, 
  Cpu, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  MessageSquare,
  Sparkles,
  Send,
  Activity,
  Paperclip,
  Code,
  FileText,
  Settings,
  Loader2,
  Zap,
  RotateCcw
} from 'lucide-react';
import { 
  StreamableAgentResponse, 
  AgentSessionState 
} from '@/lib/types/streaming';
import { SessionData, ConversationEntry } from '@/lib/types/session';
import { MessageBubble } from './MessageBubble';
import { UnifiedLoading, ThinkingLoader, GeneratingLoader } from '@/components/ui/unified-loading';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LoadingCarousel, LOADING_SEQUENCES } from '@/components/ui/loading-carousel';
import { AuthPromptDialog } from '@/components/dialogs';
import { useAuthCheck, usePendingAuthAction } from '@/hooks/use-auth-check';
import { StreamingToolExecutor } from '@/lib/agents/coding/streaming-tool-executor';
// import { CodingModeUI } from './CodingModeUI'; // 暂时不使用
import { 
  CodingAgentAsk,
  CodingAgentSay,
  CodeFile,
  CodingAgentMessage
} from '@/lib/agents/coding/types';
import { FloatingStageIndicator } from '@/components/ui/stage-indicator';

interface ChatInterfaceProps {
  sessionId?: string;
  onSessionUpdate?: (session: SessionData) => void;
  className?: string;
  onFileUpload?: (file: File) => void;
}

/**
 * 🎯 ChatInterface 职责分工：
 * 
 * 【核心职责】
 * 1. 全局状态管理 (会话、认证、模式切换)
 * 2. 流式数据接收和分发 
 * 3. 系统级Loading状态 (轮播、全局等待)
 * 4. 工具执行状态管理 (activeTools, 代码文件)
 * 5. 错误处理和重试逻辑
 * 6. 输入框和发送逻辑
 * 
 * 【不负责】
 * ❌ 单个消息的内容渲染
 * ❌ 消息内的交互表单
 * ❌ 消息级别的loading状态
 */
export function ChatInterface({ sessionId: initialSessionId, onSessionUpdate, className = '', onFileUpload }: ChatInterfaceProps) {
  // ===== 认证状态 =====
  const { isAuthenticated, isLoading: authLoading, userId } = useAuthCheck();
  const { executePendingAction } = usePendingAuthAction();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string>('');
  
  // ===== 核心状态管理 =====
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId || null);
  const [messages, setMessages] = useState<ConversationEntry[]>([]);
  const [sessionStatus, setSessionStatus] = useState<any>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  
  // ===== 系统级Loading状态 =====
  // 🎯 系统级临时loading消息 (轮播、全局等待状态)
  const [systemLoadingState, setSystemLoadingState] = useState<{
    content: string;
    type: 'carousel' | 'simple' | 'thinking';
    sequence?: string;
    visible: boolean;
  } | null>(null);

  // ===== Coding模式状态 =====
  const [isCodingMode, setIsCodingMode] = useState(false);
  const [toolExecutor, setToolExecutor] = useState<StreamingToolExecutor | null>(null);
  const [activeTools, setActiveTools] = useState<string[]>([]);
  const [codeFiles, setCodeFiles] = useState<Array<{path: string, content: string, language: string}>>([]);
  const [showFileTree, setShowFileTree] = useState(true);
  const [accumulatedAIResponse, setAccumulatedAIResponse] = useState('');
  
  // ===== Coding Agent错误状态 =====
  const [codingAgentError, setCodingAgentError] = useState<string | null>(null);
  const [awaitingCodingResponse, setAwaitingCodingResponse] = useState(false);
  const [currentAsk, setCurrentAsk] = useState<CodingAgentAsk | null>(null);
  const [currentSay, setCurrentSay] = useState<CodingAgentSay | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // ===== 上下文状态 =====
  const [codingContext, setCodingContext] = useState<{
    projectType?: string;
    framework?: string;
    conversationHistory?: string[];
  }>({
    projectType: 'unknown',
    framework: 'unknown',
    conversationHistory: []
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const processingMessagesRef = useRef<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, systemLoadingState]);

  // 🎯 Coding模式状态指示器 - 在header显示
  const CodingStatusIndicator = useMemo(() => {
    if (!isCodingMode) return null;

    if (isStreaming) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Loader2 className="w-3 h-3 animate-spin" />
          正在生成代码...
        </Badge>
      );
    }
    
    if (awaitingCodingResponse) {
      return (
        <Badge variant="outline" className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          等待确认
        </Badge>
      );
    }
    
    if (codingAgentError) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          代码生成错误
        </Badge>
      );
    }
    
    if (activeTools.length > 0) {
      return (
        <Badge variant="default" className="flex items-center gap-1">
          <Settings className="w-3 h-3 animate-spin" />
          工具执行中 ({activeTools.length})
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline" className="flex items-center gap-1">
        <Code className="w-3 h-3" />
        Coding 模式
      </Badge>
    );
  }, [isCodingMode, isStreaming, awaitingCodingResponse, codingAgentError, activeTools]);

  // 🎯 工具执行按钮状态管理
  const buttonState = useMemo(() => {
    if (!isCodingMode) return null;

    const hasError = !!codingAgentError;
    const canInteract = !isStreaming && !awaitingCodingResponse;

    if (currentAsk) {
      return {
        showPrimaryButton: true,
        primaryButtonText: '确认',
        primaryButtonVariant: 'default' as const,
        showSecondaryButton: true,
        secondaryButtonText: '取消',
        secondaryButtonVariant: 'outline' as const,
        enabled: canInteract
      };
    }

    if (hasError) {
      return {
        showPrimaryButton: true,
        primaryButtonText: '重试',
        primaryButtonVariant: 'default' as const,
        showSecondaryButton: true,
        secondaryButtonText: '清除错误',
        secondaryButtonVariant: 'outline' as const,
        enabled: canInteract
      };
    }

    return null;
  }, [isCodingMode, currentAsk, codingAgentError, isStreaming, awaitingCodingResponse]);

  // 🎯 工具执行实际操作
  const executeActualTool = async (toolName: string, params: Record<string, string>): Promise<string> => {
    try {
      switch (toolName) {
        case 'write_to_file':
          if (params.path && params.content) {
            setCodeFiles(prev => {
              const existing = prev.find(f => f.path === params.path);
              const language = getLanguageFromPath(params.path!);
              
              if (existing) {
                return prev.map(f => 
                  f.path === params.path 
                    ? { ...f, content: params.content!, language }
                    : f
                );
              } else {
                return [...prev, { 
                  path: params.path!, 
                  content: params.content!, 
                  language 
                }];
              }
            });
            
            return `✅ 文件 ${params.path} 已创建/更新，内容长度: ${params.content.length} 字符`;
          }
          break;
          
        case 'read_file':
          if (params.path) {
            const file = codeFiles.find(f => f.path === params.path);
            if (file) {
              return `📖 文件内容:\n\`\`\`${file.language}\n${file.content}\n\`\`\``;
            } else {
              return `❌ 文件 ${params.path} 不存在`;
            }
          }
          break;
          
        case 'execute_command':
          if (params.command) {
            return `🔧 模拟执行命令: ${params.command}\n✅ 命令执行完成`;
          }
          break;
          
        case 'list_files':
          const fileList = codeFiles.map(f => f.path).join('\n');
          return `📁 当前文件列表:\n${fileList || '(无文件)'}`;
          
        default:
          return `❌ 不支持的工具: ${toolName}`;
      }
      
      return `❌ 工具 ${toolName} 参数不完整`;
    } catch (error) {
      return `❌ 工具执行失败: ${error instanceof Error ? error.message : '未知错误'}`;
    }
  };

  // 🎯 获取语言类型
  const getLanguageFromPath = (path: string): string => {
    const ext = path.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'tsx': case 'jsx': return 'typescript';
      case 'ts': return 'typescript';
      case 'js': return 'javascript';
      case 'css': return 'css';
      case 'scss': return 'scss';
      case 'json': return 'json';
      case 'md': return 'markdown';
      case 'html': return 'html';
      case 'py': return 'python';
      default: return 'plaintext';
    }
  };

  // 🎯 检测并切换到Coding模式
  useEffect(() => {
    const initializeCodingMode = async () => {
      const shouldEnableCodingMode = sessionStatus?.currentStage === 'coding' || 
                                     sessionStatus?.currentStage === 'code_generation' ||
                                     sessionStatus?.currentStage === 'development' ||
                                     sessionStatus?.currentStage === '项目生成完成' ||
                                     (sessionStatus?.metadata?.mode === 'coding') ||
                                     (sessionStatus?.metadata?.agent_name === 'CodingAgent') ||
                                     messages.some(msg => 
                                       msg.metadata?.hasCodeFiles === true ||
                                       msg.metadata?.projectFiles?.length > 0 ||
                                       msg.metadata?.projectGenerated === true ||
                                       msg.metadata?.intent === 'project_complete'
                                     );
      
      if (shouldEnableCodingMode !== isCodingMode) {
        setIsCodingMode(shouldEnableCodingMode);
        console.log(`🔧 [模式切换] ${shouldEnableCodingMode ? '启用' : '禁用'} Coding 模式`);
        
        if (shouldEnableCodingMode && !toolExecutor) {
          try {
            const { UnifiedToolExecutor } = await import('@/lib/agents/coding/streaming-tool-executor');
            const executor = new UnifiedToolExecutor({
              onTextUpdate: async (text: string, partial: boolean) => {
                console.log('📝 [工具文本]', text, partial ? '(部分)' : '(完整)');
              },
              onToolExecute: async (toolName: string, params: Record<string, any>) => {
                console.log('🔧 [工具执行]', toolName, params);
                setActiveTools(prev => [...prev, toolName]);
                
                const result = await executeActualTool(toolName, params);
                
                setActiveTools(prev => prev.filter(t => t !== toolName));
                
                return result;
              },
              onToolResult: async (result: string) => {
                console.log('✅ [工具结果]', result);
              }
            });
            
            setToolExecutor(executor as any);
          } catch (error) {
            console.error('❌ [工具执行器初始化失败]:', error);
          }
        }
        
        if (shouldEnableCodingMode) {
          const allCodeFiles: Array<{path: string, content: string, language: string}> = [];
          
          messages.forEach(msg => {
            if (msg.metadata?.projectFiles && Array.isArray(msg.metadata.projectFiles)) {
              msg.metadata.projectFiles.forEach((file: any) => {
                if (!allCodeFiles.find(f => f.path === file.filename)) {
                  allCodeFiles.push({
                    path: file.filename,
                    content: file.content,
                    language: file.language || getLanguageFromPath(file.filename)
                  });
                }
              });
            }
          });
          
          if (allCodeFiles.length > 0) {
            console.log(`🔧 [文件提取] 从消息中提取了 ${allCodeFiles.length} 个代码文件`);
            setCodeFiles(allCodeFiles);
          }
        }
      }
    };
    
    initializeCodingMode();
  }, [sessionStatus, isCodingMode, toolExecutor, codeFiles, messages]);

  // 🎯 Coding模式按钮处理
  const handleCodingPrimaryButton = useCallback(() => {
    if (currentAsk) {
      setCurrentAsk(null);
      setAwaitingCodingResponse(false);
      
      sendMessage('确认操作', { 
        type: 'coding_interaction', 
        action: 'confirm',
        ask: currentAsk 
      });
    } else if (codingAgentError) {
      setRetryCount(prev => prev + 1);
      setCodingAgentError(null);
      
      const lastUserMessage = messages.findLast(m => m.type === 'user_message');
      if (lastUserMessage) {
        sendMessage(lastUserMessage.content, { type: 'retry' });
      }
    }
  }, [currentAsk, codingAgentError, messages]);

  const handleCodingSecondaryButton = useCallback(() => {
    if (currentAsk) {
      setCurrentAsk(null);
      setAwaitingCodingResponse(false);
      
      sendMessage('取消操作', { 
        type: 'coding_interaction', 
        action: 'cancel',
        ask: currentAsk 
      });
    } else if (codingAgentError) {
      setCodingAgentError(null);
      setRetryCount(0);
    }
  }, [currentAsk, codingAgentError]);

  // 🎯 处理Coding Agent响应
  const handleCodingAgentResponse = useCallback((response: Partial<StreamableAgentResponse>) => {
    if (response.system_state?.metadata?.ask) {
      setCurrentAsk(response.system_state.metadata.ask as CodingAgentAsk);
      setAwaitingCodingResponse(true);
    }

    if (response.system_state?.metadata?.say) {
      setCurrentSay(response.system_state.metadata.say as CodingAgentSay);
    }

    if (response.system_state?.metadata?.projectFiles) {
      const newFiles = response.system_state.metadata.projectFiles.map((file: any) => ({
        path: file.filename,
        content: file.content,
        language: file.language || getLanguageFromPath(file.filename)
      }));
      setCodeFiles(prev => {
        const updated = [...prev];
        newFiles.forEach((newFile: any) => {
          const existingIndex = updated.findIndex(f => f.path === newFile.path);
          if (existingIndex >= 0) {
            updated[existingIndex] = newFile;
          } else {
            updated.push(newFile);
          }
        });
        return updated;
      });
    }

    if (response.system_state?.metadata?.error) {
      setCodingAgentError(response.system_state.metadata.error);
    }

    if (response.system_state?.done) {
      setCurrentAsk(null);
      setCurrentSay(null);
      setAwaitingCodingResponse(false);
      if (toolExecutor) {
        setAccumulatedAIResponse('');
      }
    }
  }, [toolExecutor]);

  // 处理登录成功后的继续对话
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      const executed = executePendingAction(() => {
        if (pendingMessage) {
          setTimeout(() => {
            sendMessage(pendingMessage);
            setPendingMessage('');
          }, 500);
        }
      });
      
      if (executed) {
        console.log('✅ 登录成功，继续执行待执行的对话操作');
      }
    }
  }, [isAuthenticated, authLoading, pendingMessage, executePendingAction]);

  // 初始化会话
  useEffect(() => {
    if (!sessionId) {
      createNewSession();
    } else {
      loadSessionStatus();
    }
  }, []);

  // 处理sessionId变化
  useEffect(() => {
    if (initialSessionId !== sessionId) {
      setSessionId(initialSessionId || null);
      setMessages([]);
      setError(null);
      setIsStreaming(false);
      
      if (initialSessionId) {
        loadSessionStatus();
      }
    }
  }, [initialSessionId]);

  const createNewSession = async () => {
    try {
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        throw new Error('Failed to create session');
      }

      const data = await response.json();
      setSessionId(data.sessionId);

    } catch (error) {
      console.error('Session creation error:', error);
      setError('创建会话失败，请刷新页面重试');
    }
  };

  const loadSessionStatus = async () => {
    if (!sessionId) return;

    try {
      const response = await fetch(`/api/session?sessionId=${sessionId}`);
      
      if (response.ok) {
        const data = await response.json();
        setSessionStatus(data.session);
      }
    } catch (error) {
      console.error('Failed to load session status:', error);
    }
  };

  const buildContextualPrompt = (userInput: string) => {
    if (!codingContext) return userInput;

    const context = codingContext;
    let enhancedPrompt = userInput;

    if (context.projectType && context.projectType !== 'unknown') {
      enhancedPrompt = `【当前项目类型：${context.projectType}】\n${enhancedPrompt}`;
    }

    if (context.framework && context.framework !== 'unknown') {
      enhancedPrompt = `【使用技术栈：${context.framework}】\n${enhancedPrompt}`;
    }

    if (context.conversationHistory && context.conversationHistory.length > 0) {
      const recentHistory = context.conversationHistory.slice(-2).join('\n- ');
      enhancedPrompt = `【最近对话：\n- ${recentHistory}】\n\n${enhancedPrompt}`;
    }

    return enhancedPrompt;
  };

  // 🎯 核心发送消息函数 - ChatInterface负责
  const sendMessage = async (message: string, options?: any) => {
    // 认证检查
    if (!authLoading && !isAuthenticated) {
      setPendingMessage(message);
      setShowAuthDialog(true);
      return;
    }
    
    if (!sessionId || (!message.trim() && !options) || isStreaming) return;
    
    // 防重复提交
    const messageKey = `${sessionId}-${message}-${JSON.stringify(options)}`;
    
    if (processingMessagesRef.current.has(messageKey)) {
      console.log('⏸️ [防重复] 忽略重复提交的消息:', message);
      return;
    }
    
    processingMessagesRef.current.add(messageKey);
    
    const cleanup = () => {
      processingMessagesRef.current.delete(messageKey);
    };

    // 🎯 处理系统级loading状态消息
    if (options && (options.type === 'system_loading' || options.type === 'system_loading_carousel' || options.type === 'system_error' || options.type === 'system_success')) {
      setSystemLoadingState({
        content: message,
        type: options.type === 'system_loading_carousel' ? 'carousel' : 'simple',
        sequence: options.sequence,
        visible: true
      });
      
      // 自动清除loading消息
      if (options.type === 'system_loading' || options.type === 'system_loading_carousel') {
        const duration = options.type === 'system_loading_carousel' ? 4000 : 3000;
        setTimeout(() => {
          setSystemLoadingState(null);
        }, duration);
      }
      return;
    }

    const isInitialCodingCall = isCodingMode && codeFiles.length === 0;
    
    let enhancedMessage = message;
    let apiEndpoint = '/api/chat/stream';
    let requestBody: any = {
      message,
      sessionId,
      currentStage: sessionStatus?.currentStage
    };

    // Coding模式处理
    if (isCodingMode) {
      if (isInitialCodingCall) {
        apiEndpoint = '/api/coding-agent';
        requestBody = {
          message: message,
          sessionId,
          mode: 'initial',
          sessionData: sessionStatus
        };
      } else {
        enhancedMessage = buildContextualPrompt(message);
        requestBody = {
          message: enhancedMessage,
          sessionId,
          mode: 'incremental',
          currentStage: sessionStatus?.currentStage,
          // 🔧 修复：添加context来指示coding模式
          context: {
            mode: 'coding',
            codingAgent: true,
            forceAgent: 'coding'
          }
        };
        
        setCodingContext(prev => ({
          ...prev,
          conversationHistory: [...(prev.conversationHistory || []), message].slice(-10)
        }));
      }
    }

    // 添加用户消息
    const userMessage: ConversationEntry = {
      id: `user-${Date.now()}`,
      timestamp: new Date(),
      type: 'user_message',
      content: message,
      metadata: { 
        ...options,
        isInitialCoding: isInitialCodingCall,
        enhanced: isCodingMode && !isInitialCodingCall
      }
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsStreaming(true);
    setError(null);

    try {
      if (options && (options.type || options.interactionType)) {
        apiEndpoint = '/api/chat/interact';
        requestBody = {
          sessionId,
          interactionType: options.interactionType || 'interaction',
          data: options
        };
      }

      console.log('📡 [发送请求] 端点:', apiEndpoint, '数据:', requestBody);

      eventSourceRef.current?.close();
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      // 🎯 流式响应处理
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              setIsStreaming(false);
              cleanup();
              loadSessionStatus();
              break;
            }

            try {
              const parsedData = JSON.parse(data);
              handleStreamingResponse(parsedData);
            } catch (error) {
              console.error('Failed to parse streaming data:', error);
            }
          }
        }
      }

    } catch (error) {
      console.error('Send message error:', error);
      setError('发送消息失败，请重试');
      setIsStreaming(false);
      cleanup();
    }
  };

    // 🎯 流式响应处理 - ChatInterface负责数据分发  
  const handleStreamingResponse = (response: Partial<StreamableAgentResponse>) => {
     // Coding 模式处理
    if (isCodingMode) {
      handleCodingAgentResponse(response);
      
      // 🔧 关键修复：对于Coding模式，只累积分离后的纯文本内容
      if (toolExecutor && response.immediate_display?.reply) {
        // 使用已经分离后的纯文本内容进行累积
        const cleanReply = response.immediate_display.reply;
        const accumulatedCleanText = accumulatedAIResponse + cleanReply;
        setAccumulatedAIResponse(accumulatedCleanText);
        
        // 🔧 只处理纯文本内容，不包含代码块
        toolExecutor.processStreamChunk(accumulatedCleanText).catch(error => {
          console.error('🔧 [工具执行] 处理流式内容失败:', error);
        });
      }
    }

    // 消息创建和更新
    if (response.immediate_display?.reply) {
      const messageId = `agent-${Date.now()}`;
      
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        const isStreamingMessage = lastMessage?.metadata?.streaming === true;
        
        if (isStreamingMessage && lastMessage.type === 'agent_response') {
          return prev.map((msg, index) => 
            index === prev.length - 1 
              ? {
                  ...msg,
                  // 🔧 关键修复：根据content_mode决定是追加还是替换内容
                  content: response.system_state?.metadata?.content_mode === 'complete' 
                    ? (response.immediate_display?.reply || '')
                    : (msg.content || '') + (response.immediate_display?.reply || ''),
                  metadata: {
                    ...msg.metadata,
                    streaming: !response.system_state?.done,
                    ...response.system_state?.metadata
                  }
                }
              : msg
          );
        } else {
          const agentMessage: ConversationEntry = {
            id: messageId,
            timestamp: new Date(),
            type: 'agent_response',
            agent: response.immediate_display?.agent_name || 'system',
            // 🔧 关键修复：CodingAgent的reply已经是分离后的纯文本，直接使用
            content: response.immediate_display?.reply || '',
            metadata: {
              streaming: !response.system_state?.done,
              ...response.system_state?.metadata
            }
          };
          
          return [...prev, agentMessage];
        }
      });
    }

    // 响应完成处理
    if (response.system_state?.done || response.system_state?.intent === 'advance') {
      setMessages(prev => 
        prev.map((msg, index) => 
          index === prev.length - 1 && msg.type === 'agent_response'
            ? { ...msg, metadata: { ...msg.metadata, streaming: false } }
            : msg
        )
      );
    }
  };

  const handleUserInteraction = async (type: string, data: any) => {
    if (!sessionId) return;

    try {
      const response = await fetch('/api/chat/interact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          interactionType: type,
          data
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send user interaction');
      }

      const result = await response.json();
      
      if (result.result?.action === 'advance') {
        setTimeout(() => {
          sendMessage('');
        }, 500);
      }

    } catch (error) {
      console.error('User interaction error:', error);
      setError('交互失败，请重试');
    }
  };

  const handleRetry = () => {
    setIsRetrying(true);
    setError(null);
    
    setTimeout(() => {
      setIsRetrying(false);
    }, 1000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputMessage);
  };

  const handleFileUpload = (file: File) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/markdown', 'application/json'];
    const maxSize = 10 * 1024 * 1024;
    
    if (!allowedTypes.includes(file.type)) {
      setError('不支持的文件类型。请上传 PDF、Word、文本或 Markdown 文件。');
      return;
    }
    
    if (file.size > maxSize) {
      setError('文件大小不能超过 10MB。');
      return;
    }
    
    const uploadMessage = `📎 已上传文件：${file.name} (${(file.size / 1024).toFixed(1)}KB)`;
    sendMessage(uploadMessage, {
      type: 'file_upload',
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });
    
    if (onFileUpload) {
      onFileUpload(file);
    }
  };

  const handleFileUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
    if (e.target) {
      e.target.value = '';
    }
  };

  const renderMessage = (message: ConversationEntry, index: number) => {
    const isUser = message.type === 'user_message';
    const isLast = messages[messages.length - 1]?.id === message.id;
    
    const messageData = {
      sender: message.metadata?.sender || (isUser ? 'user' : 'assistant'),
      agent: message.metadata?.agent || (isUser ? 'user' : message.agent || 'system'),
      content: message.content,
      metadata: message.metadata
    };
    
    return (
      <MessageBubble
        key={message.id}
        message={messageData}
        isLast={isLast}
        isGenerating={isLast && isStreaming && !isUser}
        isStreaming={isLast && isStreaming && !isUser}
        onSendMessage={sendMessage}
        sessionId={sessionId || undefined}
        messageIndex={index} // 传递消息索引用于版本号计算
      />
    );
  };

  if (!sessionId) {
    return (
      <div className="flex items-center justify-center h-64">
        <ThinkingLoader 
          text="正在初始化会话..."
          size="lg"
        />
      </div>
    );
  }

  return (
    <>
      <Card className={`h-full flex flex-col ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isCodingMode ? (
                <Code className="w-5 h-5" />
              ) : (
                <MessageSquare className="w-5 h-5" />
              )}
              HeysMe AI {isCodingMode && '- Coding 模式'}
            </div>
            
            <div className="flex items-center gap-2">
              {/* 🎯 Coding模式状态指示器 */}
              {CodingStatusIndicator}
              
              {/* 🎯 新的悬浮阶段指示器 */}
              {sessionStatus && (
                <FloatingStageIndicator
                  currentStage={sessionStatus.currentStage}
                  percentage={sessionStatus.overallProgress || 0}
                  mode={isCodingMode ? 'coding' : 'chat'}
                />
              )}
            </div>
          </CardTitle>
          
          {/* 🎯 活跃工具显示 - ChatInterface负责 */}
          {isCodingMode && activeTools.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {activeTools.map(tool => (
                <Badge key={tool} variant="secondary" className="text-xs">
                  <Settings className="w-3 h-3 mr-1" />
                  {tool}
                </Badge>
              ))}
            </div>
          )}
          
          {/* 进度条 */}
          {sessionStatus && (
            <ProgressBar 
              progress={sessionStatus.overallProgress} 
              stage={sessionStatus.currentStage}
            />
          )}
        </CardHeader>

      <CardContent className="flex-1 flex flex-col overflow-hidden">
        {/* 消息列表 */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.map((message, index) => renderMessage(message, index))}
          
          {/* 🎯 系统级Loading状态 - ChatInterface负责 */}
          {systemLoadingState?.visible && (
            <>
              {systemLoadingState.type === 'carousel' ? (
                <LoadingCarousel
                  messages={LOADING_SEQUENCES[systemLoadingState.sequence as keyof typeof LOADING_SEQUENCES] || LOADING_SEQUENCES.INTERACTION_PROCESSING}
                  onComplete={() => setSystemLoadingState(null)}
                />
              ) : (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-start gap-4 max-w-4xl mx-auto px-6 py-4"
                >
                  <Avatar className="w-8 h-8 shrink-0">
                    <AvatarFallback className="bg-gray-100 text-gray-600">
                      <Sparkles className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="inline-block max-w-full text-gray-800">
                      <div className="whitespace-pre-wrap break-words">
                        <GeneratingLoader 
                          text={systemLoadingState.content.replace('...', '')}
                          size="sm"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </>
          )}
          
          {/* 🎯 系统级错误处理 - ChatInterface负责 */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg"
            >
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-red-700 text-sm">{error}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRetry}
                disabled={isRetrying}
              >
                {isRetrying ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  '重试'
                )}
              </Button>
            </motion.div>
          )}

          {/* 🎯 Coding模式特定错误 - ChatInterface负责 */}
          {isCodingMode && codingAgentError && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-4"
            >
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">代码生成错误</span>
              </div>
              <p className="text-sm mt-1">{codingAgentError}</p>
              {retryCount > 0 && (
                <p className="text-xs mt-1 text-muted-foreground">重试次数: {retryCount}</p>
              )}
            </motion.div>
          )}

          {/* 🎯 Coding模式代码文件显示 - ChatInterface负责 */}
          {isCodingMode && codeFiles.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4" />
                <span className="text-sm font-medium">生成的文件</span>
                <Badge variant="secondary">{codeFiles.length}</Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {codeFiles.map((file) => (
                  <motion.div 
                    key={file.path}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="border rounded-lg p-3 hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => {
                      console.log('文件点击:', file);
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-3 h-3 text-muted-foreground" />
                      <span className="text-sm font-mono">{file.path}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {file.language}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {(file.content.length / 1000).toFixed(1)}KB
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          

          {/* 🎯 Coding模式操作按钮 - ChatInterface负责 */}
          {isCodingMode && buttonState && (
            <div className="flex gap-2 mb-4">
              <AnimatePresence>
                {buttonState.showPrimaryButton && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <Button
                      onClick={handleCodingPrimaryButton}
                      disabled={!buttonState.enabled}
                      variant={buttonState.primaryButtonVariant}
                      className="flex items-center gap-2"
                    >
                      {isStreaming ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Zap className="w-4 h-4" />
                      )}
                      {buttonState.primaryButtonText}
                    </Button>
                  </motion.div>
                )}
                
                {buttonState.showSecondaryButton && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <Button
                      onClick={handleCodingSecondaryButton}
                      disabled={!buttonState.enabled}
                      variant={buttonState.secondaryButtonVariant}
                    >
                      {buttonState.secondaryButtonText}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* 🎯 输入区域 - ChatInterface负责 */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          {!isCodingMode && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleFileUploadClick}
              disabled={isStreaming}
              className="flex-shrink-0"
              title="上传文件"
            >
              <Paperclip className="w-4 h-4" />
            </Button>
          )}
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={isCodingMode ? "输入代码需求或问题..." : "输入消息..."}
            disabled={isStreaming}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={isStreaming || !inputMessage.trim()}
            className="px-6"
          >
            {isStreaming ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </CardContent>
    </Card>

    {/* 隐藏的文件上传输入 */}
    <input
      ref={fileInputRef}
      type="file"
      accept=".pdf,.doc,.docx,.txt,.md,.json"
      onChange={handleFileChange}
      className="hidden"
    />

    {/* 未登录提醒对话框 */}
    <AuthPromptDialog
      isOpen={showAuthDialog}
      onClose={() => setShowAuthDialog(false)}
      title="需要登录才能继续"
      message="请先登录您的账户来继续使用智能对话功能"
      action="发送消息"
      onLoginSuccess={() => {
        setShowAuthDialog(false);
      }}
    />
  </>
  );
}
