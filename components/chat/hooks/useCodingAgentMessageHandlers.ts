/**
 * Coding Agent Message Handlers Hook
 * 管理Coding Agent的消息处理逻辑
 */

import { useCallback, useRef } from 'react';
import { 
  CodingAgentMessage,
  CodingAgentMessageHandlers,
  CodingAgentMessageMetadata,
  CodingAgentFileOperation,
  CodingAgentMessageFactory,
  CodingAgentAsk,
  CodingAgentSay,
  CodeFile
} from '@/lib/agents/coding/types';

interface CodingAgentMessageHandlersHook extends CodingAgentMessageHandlers {
  // 扩展的处理器
  handleAskResponse: (ask: CodingAgentAsk, response: 'primary' | 'secondary' | string) => Promise<void>;
  handleStreamingMessage: (chunk: any) => void;
  handleToolResult: (toolName: string, result: any) => void;
  
  // 状态管理
  clearError: () => void;
  
  // 当前状态
  currentAsk: CodingAgentAsk | null;
  currentSay: CodingAgentSay | null;
  
  // 配置
  isProcessing: boolean;
}

interface CodingAgentMessageHandlersConfig {
  sessionId?: string;
  addMessage: (message: CodingAgentMessage) => void;
  updateMessage: (id: string, updates: Partial<CodingAgentMessage>) => void;
  setInputValue: (value: string) => void;
  setIsStreaming: (streaming: boolean) => void;
  setAwaitingResponse: (awaiting: boolean) => void;
  setActiveTools: (tools: string[]) => void;
  addActiveTool: (tool: string) => void;
  removeActiveTool: (tool: string) => void;
  addCodeFile: (file: CodeFile) => void;
  setError: (error: string | null) => void;
  incrementRetryCount: () => void;
  resetRetryCount: () => void;
  currentAsk: CodingAgentAsk | null;
  currentSay: CodingAgentSay | null;
  onMessageSent?: (message: CodingAgentMessage) => void;
  onFileChange?: (files: Array<{path: string, content: string, language: string}>) => void;
  onToolExecution?: (toolName: string, params: Record<string, any>) => Promise<any>;
}

export function useCodingAgentMessageHandlers(
  config: CodingAgentMessageHandlersConfig
): CodingAgentMessageHandlersHook {
  // 处理状态
  const isProcessingRef = useRef(false);
  
  // 🎯 发送消息
  const handleSendMessage = useCallback(async (
    text: string, 
    metadata?: CodingAgentMessageMetadata
  ) => {
    if (isProcessingRef.current || !text.trim()) return;
    
    isProcessingRef.current = true;
    config.setIsStreaming(true);
    config.resetRetryCount();
    
    try {
      // 创建用户消息
      const userMessage = CodingAgentMessageFactory.createUserMessage(text, metadata);
      config.addMessage(userMessage);
      
      // 清空输入
      config.setInputValue('');
      
      // 通知外部
      if (config.onMessageSent) {
        config.onMessageSent(userMessage);
      }
      
      // 模拟AI响应
      await simulateAIResponse(userMessage, config);
      
    } catch (error) {
      console.error('发送消息失败:', error);
      config.setError(error instanceof Error ? error.message : '发送失败');
    } finally {
      isProcessingRef.current = false;
      config.setIsStreaming(false);
    }
  }, [config]);

  // 🎯 Ask响应处理
  const handleAskResponse = useCallback(async (
    ask: CodingAgentAsk, 
    response: 'primary' | 'secondary' | string
  ) => {
    try {
      // 创建响应消息
      const responseMessage = CodingAgentMessageFactory.createUserMessage(
        `回应 ${ask}: ${response}`,
        { ask, response }
      );
      
      config.addMessage(responseMessage);
      config.setAwaitingResponse(false);
      
      // 处理不同类型的响应
      switch (response) {
        case 'primary':
          await handlePrimaryResponse(ask, config);
          break;
        case 'secondary':
          await handleSecondaryResponse(ask, config);
          break;
        default:
          await handleCustomResponse(ask, response, config);
          break;
      }
      
    } catch (error) {
      console.error('Ask响应处理失败:', error);
      config.setError(error instanceof Error ? error.message : '响应处理失败');
    }
  }, [config]);

  // 🎯 主按钮点击
  const handlePrimaryButtonClick = useCallback(() => {
    if (config.currentAsk) {
      handleAskResponse(config.currentAsk, 'primary');
    }
  }, [config.currentAsk, handleAskResponse]);

  // 🎯 次按钮点击
  const handleSecondaryButtonClick = useCallback(() => {
    if (config.currentAsk) {
      handleAskResponse(config.currentAsk, 'secondary');
    }
  }, [config.currentAsk, handleAskResponse]);

  // 🎯 自定义按钮点击
  const handleCustomButtonClick = useCallback((action: string) => {
    if (config.currentAsk) {
      handleAskResponse(config.currentAsk, action);
    }
  }, [config.currentAsk, handleAskResponse]);

  // 🎯 文件操作
  const handleFileOperation = useCallback(async (operation: CodingAgentFileOperation) => {
    try {
      config.addActiveTool('file_operation');
      
      // 创建工具消息
      const toolMessage = CodingAgentMessageFactory.createSayMessage(
        'tool_execution_started',
        `正在执行文件操作: ${operation.type} ${operation.path}`,
        { fileOperations: [operation] }
      );
      
      config.addMessage(toolMessage);
      
      // 模拟文件操作
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 创建完成消息
      const completeMessage = CodingAgentMessageFactory.createSayMessage(
        'tool_execution_completed',
        `文件操作完成: ${operation.type} ${operation.path}`,
        { fileOperations: [operation] }
      );
      
      config.addMessage(completeMessage);
      
      // 通知外部
      if (config.onFileChange && operation.content) {
        config.onFileChange([{
          path: operation.path,
          content: operation.content,
          language: getLanguageFromPath(operation.path)
        }]);
      }
      
    } catch (error) {
      console.error('文件操作失败:', error);
      config.setError(error instanceof Error ? error.message : '文件操作失败');
    } finally {
      config.removeActiveTool('file_operation');
    }
  }, [config]);

  // 🎯 工具执行
  const handleToolExecution = useCallback(async (toolName: string, params: Record<string, any>) => {
    try {
      config.addActiveTool(toolName);
      
      // 执行工具
      let result;
      if (config.onToolExecution) {
        result = await config.onToolExecution(toolName, params);
      } else {
        // 默认模拟执行
        await new Promise(resolve => setTimeout(resolve, 1000));
        result = { success: true, message: `工具 ${toolName} 执行成功` };
      }
      
      // 创建结果消息
      const resultMessage = CodingAgentMessageFactory.createSayMessage(
        'tool_execution_completed',
        `工具执行完成: ${toolName}`,
        { toolName, result }
      );
      
      config.addMessage(resultMessage);
      
    } catch (error) {
      console.error('工具执行失败:', error);
      config.setError(error instanceof Error ? error.message : '工具执行失败');
    } finally {
      config.removeActiveTool(toolName);
    }
  }, [config]);

  // 🎯 重试
  const handleRetry = useCallback(() => {
    config.incrementRetryCount();
    config.setError(null);
    
    // 可以重新发送最后一条用户消息
    // 这里简化处理
    console.log('重试操作');
  }, [config]);

  // 🎯 取消
  const handleCancel = useCallback(() => {
    config.setIsStreaming(false);
    config.setAwaitingResponse(false);
    config.setActiveTools([]);
    config.setError(null);
  }, [config]);

  // 🎯 清除错误
  const clearError = useCallback(() => {
    config.setError(null);
    config.resetRetryCount();
  }, [config]);

  // 🎯 流式消息处理
  const handleStreamingMessage = useCallback((chunk: any) => {
    // 处理流式消息块
    console.log('流式消息块:', chunk);
  }, []);

  // 🎯 工具结果处理
  const handleToolResult = useCallback((toolName: string, result: any) => {
    console.log('工具结果:', toolName, result);
  }, []);

  // 新增的处理器方法
  const handleNewTask = useCallback(async () => {
    // 实现新任务处理
    console.log('开始新任务');
  }, []);

  const handleTaskCancel = useCallback(() => {
    // 实现任务取消
    handleCancel();
  }, [handleCancel]);

  const handleCodeReview = useCallback(async (approve: boolean, feedback?: string) => {
    // 实现代码审查处理
    console.log('代码审查:', approve, feedback);
  }, []);

  const handleDeployment = useCallback(async (confirm: boolean) => {
    // 实现部署处理
    console.log('部署确认:', confirm);
  }, []);

  const handleToolSelection = useCallback(async (toolName: string, parameters?: Record<string, any>) => {
    // 实现工具选择处理
    await handleToolExecution(toolName, parameters || {});
  }, [handleToolExecution]);

  return {
    handleSendMessage,
    handlePrimaryButtonClick,
    handleSecondaryButtonClick,
    handleCustomButtonClick,
    handleFileOperation,
    handleToolExecution,
    handleRetry,
    handleCancel,
    handleNewTask,
    handleTaskCancel,
    handleCodeReview,
    handleDeployment,
    handleToolSelection,
    handleAskResponse,
    handleStreamingMessage,
    handleToolResult,
    clearError,
    currentAsk: config.currentAsk,
    currentSay: config.currentSay,
    isProcessing: isProcessingRef.current
  };
}

// ===== 辅助函数 =====

async function simulateAIResponse(userMessage: CodingAgentMessage, config: CodingAgentMessageHandlersConfig) {
  // 模拟AI思考时间
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 创建AI响应
  const aiResponse = CodingAgentMessageFactory.createSayMessage(
    'task_started',
    `我理解了您的需求: "${userMessage.text}"。让我开始处理...`,
    { streaming: false }
  );
  
  config.addMessage(aiResponse);
}

async function handlePrimaryResponse(ask: CodingAgentAsk, config: CodingAgentMessageHandlersConfig) {
  const response = CodingAgentMessageFactory.createSayMessage(
    'task_completed',
    `已确认处理 ${ask}`,
    { ask, action: 'confirmed' }
  );
  
  config.addMessage(response);
}

async function handleSecondaryResponse(ask: CodingAgentAsk, config: CodingAgentMessageHandlersConfig) {
  const response = CodingAgentMessageFactory.createSayMessage(
    'task_completed',
    `已取消处理 ${ask}`,
    { ask, action: 'cancelled' }
  );
  
  config.addMessage(response);
}

async function handleCustomResponse(ask: CodingAgentAsk, response: string, config: CodingAgentMessageHandlersConfig) {
  const responseMessage = CodingAgentMessageFactory.createSayMessage(
    'task_completed',
    `自定义响应 ${ask}: ${response}`,
    { ask, action: 'custom', response }
  );
  
  config.addMessage(responseMessage);
}

function getLanguageFromPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'tsx': case 'jsx': return 'typescript';
    case 'ts': return 'typescript';
    case 'js': return 'javascript';
    case 'css': return 'css';
    case 'json': return 'json';
    case 'md': return 'markdown';
    default: return 'plaintext';
  }
} 