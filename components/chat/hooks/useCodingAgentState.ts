/**
 * Coding Agent State Hook
 * 管理Coding Agent的状态
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  CodingAgentState,
  CodingAgentMessage,
  CodingAgentAction,
  CodeFile,
  CodingAgentToolResult,
  CodingAgentConfig
} from '@/lib/agents/coding/types';

interface CodingAgentStateHook extends CodingAgentState {
  // 状态更新方法
  addMessage: (message: CodingAgentMessage) => void;
  updateMessage: (id: string, updates: Partial<CodingAgentMessage>) => void;
  removeMessage: (id: string) => void;
  setInputValue: (value: string) => void;
  setIsStreaming: (streaming: boolean) => void;
  setEnableButtons: (enable: boolean) => void;
  setAwaitingResponse: (awaiting: boolean) => void;
  setCodeFiles: (files: CodeFile[]) => void;
  addCodeFile: (file: CodeFile) => void;
  updateCodeFile: (filename: string, updates: Partial<CodeFile>) => void;
  setActiveTools: (tools: string[]) => void;
  addActiveTool: (tool: string) => void;
  removeActiveTool: (tool: string) => void;
  addToolResult: (result: CodingAgentToolResult) => void;
  setError: (error: string | null) => void;
  setSessionId: (sessionId: string) => void;
  incrementRetryCount: () => void;
  resetRetryCount: () => void;
  reset: () => void;
  
  // 计算属性
  lastMessage?: CodingAgentMessage;
  secondLastMessage?: CodingAgentMessage;
  currentAsk?: any;
  currentSay?: any;
  canSendMessage: boolean;
  hasActiveTools: boolean;
  hasCodeFiles: boolean;
}

export function useCodingAgentState(
  initialState?: Partial<CodingAgentState>,
  config?: CodingAgentConfig
): CodingAgentStateHook {
  // 🎯 基础状态
  const [state, setState] = useState<CodingAgentState>(() => ({
    // 消息列表
    messages: [],
    
    // 输入状态
    inputValue: '',
    
    // 流式处理状态
    isStreaming: false,
    streamingMessageId: undefined,
    
    // 交互状态
    enableButtons: false,
    awaitingResponse: false,
    
    // 文件状态
    codeFiles: [],
    
    // 工具状态
    activeTools: [],
    toolResults: [],
    
    // 会话状态
    sessionId: undefined,
    
    // 错误状态
    error: undefined,
    retryCount: 0,
    
    // UI状态 - 补充缺失的字段
    isTextAreaFocused: false,
    selectedImages: [],
    selectedFiles: [],
    activeQuote: null,
    expandedRows: {},
    
    // 工作区状态
    currentWorkspace: '',
    
    // 历史记录
    taskHistory: [],
    
    // 设置
    showSettings: false,
    showHistory: false,
    showFileTree: false,
    showPreview: false,
    
    // 合并初始状态
    ...initialState
  }));

  // 🎯 消息管理
  const addMessage = useCallback((message: CodingAgentMessage) => {
    setState(prev => ({ 
      ...prev, 
      messages: [...prev.messages, message] 
    }));
  }, []);

  const updateMessage = useCallback((id: string, updates: Partial<CodingAgentMessage>) => {
    setState(prev => ({ 
      ...prev, 
      messages: prev.messages.map(msg => 
        msg.id === id ? { ...msg, ...updates } : msg
      )
    }));
  }, []);

  const removeMessage = useCallback((id: string) => {
    setState(prev => ({ 
      ...prev, 
      messages: prev.messages.filter(msg => msg.id !== id)
    }));
  }, []);

  // 🎯 输入管理
  const setInputValue = useCallback((value: string) => {
    setState(prev => ({ ...prev, inputValue: value }));
  }, []);

  // 🎯 流式状态管理
  const setIsStreaming = useCallback((streaming: boolean) => {
    setState(prev => ({ ...prev, isStreaming: streaming }));
  }, []);

  // 🎯 按钮状态管理
  const setEnableButtons = useCallback((enable: boolean) => {
    setState(prev => ({ ...prev, enableButtons: enable }));
  }, []);

  const setAwaitingResponse = useCallback((awaiting: boolean) => {
    setState(prev => ({ ...prev, awaitingResponse: awaiting }));
  }, []);

  // 🎯 文件管理
  const setCodeFiles = useCallback((files: CodeFile[]) => {
    setState(prev => ({ ...prev, codeFiles: files }));
  }, []);

  const addCodeFile = useCallback((file: CodeFile) => {
    setState(prev => ({
      ...prev,
      codeFiles: [...prev.codeFiles.filter(f => f.filename !== file.filename), file]
    }));
  }, []);

  const updateCodeFile = useCallback((filename: string, updates: Partial<CodeFile>) => {
    setState(prev => ({
      ...prev,
      codeFiles: prev.codeFiles.map(file => 
        file.filename === filename ? { ...file, ...updates } : file
      )
    }));
  }, []);

  // 🎯 工具管理
  const setActiveTools = useCallback((tools: string[]) => {
    setState(prev => ({ ...prev, activeTools: tools }));
  }, []);

  const addActiveTool = useCallback((tool: string) => {
    setState(prev => ({
      ...prev,
      activeTools: prev.activeTools.includes(tool) 
        ? prev.activeTools 
        : [...prev.activeTools, tool]
    }));
  }, []);

  const removeActiveTool = useCallback((tool: string) => {
    setState(prev => ({
      ...prev,
      activeTools: prev.activeTools.filter(t => t !== tool)
    }));
  }, []);

  const addToolResult = useCallback((result: CodingAgentToolResult) => {
    setState(prev => ({
      ...prev,
      toolResults: [...prev.toolResults, result]
    }));
  }, []);

  // 🎯 错误管理
  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error: error || undefined }));
  }, []);

  // 🎯 会话管理
  const setSessionId = useCallback((sessionId: string) => {
    setState(prev => ({ ...prev, sessionId }));
  }, []);

  // 🎯 重试管理
  const incrementRetryCount = useCallback(() => {
    setState(prev => ({ ...prev, retryCount: prev.retryCount + 1 }));
  }, []);

  const resetRetryCount = useCallback(() => {
    setState(prev => ({ ...prev, retryCount: 0 }));
  }, []);

  // 🎯 重置状态
  const reset = useCallback(() => {
    setState({
      messages: [],
      inputValue: '',
      isStreaming: false,
      streamingMessageId: undefined,
      enableButtons: false,
      awaitingResponse: false,
      codeFiles: [],
      activeTools: [],
      toolResults: [],
      sessionId: undefined,
      error: undefined,
      retryCount: 0,
      isTextAreaFocused: false,
      selectedImages: [],
      selectedFiles: [],
      activeQuote: null,
      expandedRows: {},
      currentWorkspace: '',
      taskHistory: [],
      showSettings: false,
      showHistory: false,
      showFileTree: false,
      showPreview: false,
      ...initialState
    });
  }, [initialState]);

  // 🎯 计算属性
  const lastMessage = useMemo(() => {
    return state.messages[state.messages.length - 1];
  }, [state.messages]);

  const secondLastMessage = useMemo(() => {
    return state.messages[state.messages.length - 2];
  }, [state.messages]);

  const currentAsk = useMemo(() => {
    return lastMessage?.ask;
  }, [lastMessage]);

  const currentSay = useMemo(() => {
    return lastMessage?.say;
  }, [lastMessage]);

  const canSendMessage = useMemo(() => {
    return !state.isStreaming && !state.awaitingResponse && state.inputValue.trim().length > 0;
  }, [state.isStreaming, state.awaitingResponse, state.inputValue]);

  const hasActiveTools = useMemo(() => {
    return state.activeTools.length > 0;
  }, [state.activeTools]);

  const hasCodeFiles = useMemo(() => {
    return state.codeFiles.length > 0;
  }, [state.codeFiles]);

  // 🎯 效果管理
  useEffect(() => {
    // 自动启用按钮当有Ask消息时
    if (currentAsk && !state.isStreaming) {
      setEnableButtons(true);
      setAwaitingResponse(true);
    } else if (!currentAsk) {
      setAwaitingResponse(false);
    }
  }, [currentAsk, state.isStreaming]);

  useEffect(() => {
    // 配置应用
    if (config?.maxMessages && state.messages.length > config.maxMessages) {
      setState(prev => ({
        ...prev,
        messages: prev.messages.slice(-config.maxMessages!)
      }));
    }
  }, [state.messages.length, config?.maxMessages]);

  return {
    // 状态
    ...state,
    
    // 更新方法
    addMessage,
    updateMessage,
    removeMessage,
    setInputValue,
    setIsStreaming,
    setEnableButtons,
    setAwaitingResponse,
    setCodeFiles,
    addCodeFile,
    updateCodeFile,
    setActiveTools,
    addActiveTool,
    removeActiveTool,
    addToolResult,
    setError,
    setSessionId,
    incrementRetryCount,
    resetRetryCount,
    reset,
    
    // 计算属性
    lastMessage,
    secondLastMessage,
    currentAsk,
    currentSay,
    canSendMessage,
    hasActiveTools,
    hasCodeFiles
  };
} 