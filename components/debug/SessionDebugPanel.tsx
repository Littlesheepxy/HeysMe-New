"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Bug, RefreshCw, Eye, EyeOff } from 'lucide-react';

interface SessionDebugData {
  sessionId: string;
  currentStage: string;
  progress: number;
  welcomeHistory: any[];
  collectedInfo: any;
  agentFlow: any;
  metadata: any;
  lastUpdated: string;
  // 新增：所有Agent的对话历史
  allAgentHistories: {
    welcomeHistory: any[];
    infoCollectionHistory: any[];
    codingHistory: any[];
    conversationHistory: any[];
  };
  // 新增：当前Agent的历史
  currentAgentHistory: any[];
  // 新增：详细调试信息
  debugLogs?: {
    aiCallHistory: any[];
    storageStatus: any;
    roundTracking: any[];
    lastAiPrompt?: string;
    lastAiResponse?: string;
  };
}

interface SessionDebugPanelProps {
  sessionId?: string;
  className?: string;
}

export function SessionDebugPanel({ sessionId, className = '' }: SessionDebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [debugData, setDebugData] = useState<SessionDebugData | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // 获取会话调试数据
  const fetchDebugData = async () => {
    if (!sessionId) {
      console.log('🔍 [调试面板] 没有sessionId，跳过数据获取');
      return;
    }
    
    setLoading(true);
    try {
      console.log(`🔍 [调试面板] 开始获取会话数据: ${sessionId}`);
      const response = await fetch(`/api/session?sessionId=${sessionId}`);
      const data = await response.json();
      
      console.log(`🔍 [调试面板] API响应:`, data);
      
      if (data.success && data.session) {
        const session = data.session;
        const metadata = session.metadata || {};
        
        // 🔧 提取所有Agent的对话历史
        const allAgentHistories = {
          welcomeHistory: metadata.welcomeHistory || [],
          infoCollectionHistory: metadata.infoCollectionHistory || [],
          codingHistory: metadata.codingHistory || [],
          conversationHistory: session.conversationHistory || []
        };
        
        // 🔧 根据当前阶段确定当前Agent的历史
        const getCurrentAgentHistory = (stage: string) => {
          switch (stage) {
            case 'welcome':
              return allAgentHistories.welcomeHistory;
            case 'info_collection':
            case 'information_collection':
              return allAgentHistories.infoCollectionHistory;
            case 'coding':
            case 'code_generation':
              return allAgentHistories.codingHistory;
            default:
              return allAgentHistories.conversationHistory;
          }
        };
        
        const currentAgentHistory = getCurrentAgentHistory(metadata.progress?.currentStage || 'unknown');
        
        console.log(`🔍 [调试面板] 会话数据:`, {
          sessionId: session.id,
          currentStage: metadata.progress?.currentStage,
          welcomeHistoryLength: allAgentHistories.welcomeHistory.length,
          infoCollectionHistoryLength: allAgentHistories.infoCollectionHistory.length,
          codingHistoryLength: allAgentHistories.codingHistory.length,
          conversationHistoryLength: allAgentHistories.conversationHistory.length,
          currentAgentHistoryLength: currentAgentHistory.length,
          collectedInfoKeys: Object.keys(metadata.collectedInfo || {})
        });
        
        setDebugData({
          sessionId: session.id || session.sessionId,
          currentStage: metadata.progress?.currentStage || 'unknown',
          progress: metadata.progress?.percentage || 0,
          welcomeHistory: metadata.welcomeHistory || [],
          collectedInfo: metadata.collectedInfo || {},
          agentFlow: session.agentFlow || {},
          metadata: metadata,
          lastUpdated: new Date().toLocaleTimeString(),
          allAgentHistories,
          currentAgentHistory,
          debugLogs: {
            aiCallHistory: metadata.aiCallHistory || [],
            storageStatus: metadata.storageStatus || {},
            roundTracking: metadata.roundTracking || [],
            lastAiPrompt: metadata.lastAiPrompt,
            lastAiResponse: metadata.lastAiResponse
          }
        });
      } else {
        console.warn(`⚠️ [调试面板] API返回错误:`, data);
        // 设置空数据，但显示错误信息
        setDebugData({
          sessionId: sessionId,
          currentStage: 'unknown',
          progress: 0,
          welcomeHistory: [],
          collectedInfo: {},
          agentFlow: {},
          metadata: { error: data.error || 'Unknown error' },
          lastUpdated: new Date().toLocaleTimeString(),
          allAgentHistories: {
            welcomeHistory: [],
            infoCollectionHistory: [],
            codingHistory: [],
            conversationHistory: []
          },
          currentAgentHistory: [],
          debugLogs: {
            aiCallHistory: [],
            storageStatus: {},
            roundTracking: [],
            lastAiPrompt: undefined,
            lastAiResponse: undefined
          }
        });
      }
    } catch (error) {
      console.error('🚨 [调试面板] 获取调试数据失败:', error);
      // 设置错误状态
      setDebugData({
        sessionId: sessionId,
        currentStage: 'error',
        progress: 0,
        welcomeHistory: [],
        collectedInfo: {},
        agentFlow: {},
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' },
        lastUpdated: new Date().toLocaleTimeString(),
        allAgentHistories: {
          welcomeHistory: [],
          infoCollectionHistory: [],
          codingHistory: [],
          conversationHistory: []
        },
        currentAgentHistory: [],
        debugLogs: {
          aiCallHistory: [],
          storageStatus: {},
          roundTracking: [],
          lastAiPrompt: undefined,
          lastAiResponse: undefined
        }
      });
    } finally {
      setLoading(false);
    }
  };

  // 自动刷新
  useEffect(() => {
    if (isOpen && sessionId && autoRefresh) {
      fetchDebugData();
      const interval = setInterval(fetchDebugData, 2000); // 每2秒刷新
      return () => clearInterval(interval);
    }
  }, [isOpen, sessionId, autoRefresh]);

  // 键盘快捷键：Ctrl+D 打开/关闭
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        setIsOpen(!isOpen);
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isOpen]);

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        className={`fixed bottom-4 right-4 z-50 bg-gray-900 text-white border-gray-700 hover:bg-gray-800 ${className}`}
        onClick={() => setIsOpen(true)}
      >
        <Bug className="w-4 h-4 mr-1" />
        Debug
      </Button>
    );
  }

  return (
    <Card className={`fixed bottom-4 right-4 z-50 w-96 bg-gray-900 text-white border-gray-700 ${isMinimized ? 'h-12' : 'h-96'} ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center">
            <Bug className="w-4 h-4 mr-2" />
            会话调试 
            {debugData && (
              <Badge variant="outline" className="ml-2 text-xs">
                {debugData.currentStage}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-gray-400 hover:text-white"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-gray-400 hover:text-white"
              onClick={fetchDebugData}
              disabled={loading}
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-gray-400 hover:text-white"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              {isMinimized ? '□' : '−'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-gray-400 hover:text-white"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {!isMinimized && (
        <CardContent className="pt-0">
          <ScrollArea className="h-80">
            {debugData ? (
              <div className="space-y-3 text-xs">
                {/* 基本信息 */}
                <div>
                  <h4 className="text-yellow-400 font-semibold mb-1">基本信息</h4>
                  <div className="space-y-1 text-gray-300">
                    <div>会话ID: <span className="text-blue-400">{debugData.sessionId || '无'}</span></div>
                    <div>当前阶段: <span className="text-green-400">{debugData.currentStage}</span></div>
                    <div>进度: <span className="text-purple-400">{debugData.progress}%</span></div>
                    <div>更新时间: <span className="text-gray-400">{debugData.lastUpdated}</span></div>
                    {debugData.metadata?.error && (
                      <div className="mt-2 p-2 bg-red-900/50 rounded">
                        <span className="text-red-400">错误: {debugData.metadata.error}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 对话历史 - 显示当前Agent的历史 */}
                <div>
                  <h4 className="text-yellow-400 font-semibold mb-1">
                    对话历史 ({debugData.currentAgentHistory?.length || 0})
                    <span className="text-xs text-gray-400 ml-1">
                      (当前: {debugData.currentStage})
                    </span>
                  </h4>
                  {debugData.currentAgentHistory && debugData.currentAgentHistory.length > 0 ? (
                    <div className="space-y-1">
                      {debugData.currentAgentHistory.slice(-3).map((msg: any, index: number) => (
                        <div key={index} className="text-gray-300 text-xs">
                          <span className={msg.role === 'user' ? 'text-blue-400' : 'text-green-400'}>
                            {msg.role}:
                          </span>
                          <span className="ml-1">
                            {msg.content.length > 50 ? msg.content.slice(0, 50) + '...' : msg.content}
                          </span>
                        </div>
                      ))}
                      {debugData.currentAgentHistory.length > 3 && (
                        <div className="text-xs text-gray-500">
                          ...还有 {debugData.currentAgentHistory.length - 3} 条历史记录
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-red-400">❌ 无历史记录</div>
                  )}
                  
                  {/* 显示所有Agent的历史统计 */}
                  <details className="mt-2">
                    <summary className="text-xs text-gray-500 cursor-pointer">
                      所有Agent历史统计
                    </summary>
                    <div className="text-xs text-gray-400 mt-1 space-y-1">
                      <div>Welcome: {debugData.allAgentHistories?.welcomeHistory?.length || 0} 条</div>
                      <div>Info Collection: {debugData.allAgentHistories?.infoCollectionHistory?.length || 0} 条</div>
                      <div>Coding: {debugData.allAgentHistories?.codingHistory?.length || 0} 条</div>
                      <div>General: {debugData.allAgentHistories?.conversationHistory?.length || 0} 条</div>
                      
                      {/* 显示General历史详情 */}
                      {debugData.allAgentHistories?.conversationHistory?.length > 0 && (
                        <details className="mt-2">
                          <summary className="text-cyan-400 cursor-pointer">
                            查看General历史详情
                          </summary>
                          <div className="mt-1 space-y-1 max-h-32 overflow-y-auto">
                            {debugData.allAgentHistories.conversationHistory.map((msg: any, index: number) => (
                              <div key={index} className="text-xs border-l-2 border-gray-600 pl-2">
                                <div className="text-gray-400">
                                  ID: {msg.id} | Type: {msg.type} | Agent: {msg.agent}
                                </div>
                                <div className="text-gray-300">
                                  {msg.content?.length > 100 ? msg.content.slice(0, 100) + '...' : msg.content}
                                </div>
                                <div className="text-xs text-gray-500">
                                  时间: {new Date(msg.timestamp).toLocaleTimeString()}
                                </div>
                              </div>
                            ))}
                          </div>
                        </details>
                      )}
                    </div>
                  </details>
                </div>

                {/* 收集信息 */}
                <div>
                  <h4 className="text-yellow-400 font-semibold mb-1">收集信息</h4>
                  <div className="text-gray-300 text-xs">
                    {Object.keys(debugData.collectedInfo).length > 0 ? (
                      Object.entries(debugData.collectedInfo).map(([key, value]: [string, any]) => (
                        <div key={key}>
                          <span className="text-orange-400">{key}:</span>
                          <span className="ml-1 text-gray-300">
                            {typeof value === 'string' ? value : JSON.stringify(value)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-red-400">❌ 无收集信息</div>
                    )}
                  </div>
                </div>

                {/* Agent流程 */}
                <div>
                  <h4 className="text-yellow-400 font-semibold mb-1">Agent流程</h4>
                  <div className="text-gray-300 text-xs">
                    {debugData.agentFlow.currentAgent ? (
                      <div>
                        <div>当前Agent: <span className="text-cyan-400">{debugData.agentFlow.currentAgent}</span></div>
                        <div>历史: <span className="text-gray-400">{debugData.agentFlow.agentHistory?.join(' → ') || '无'}</span></div>
                      </div>
                    ) : (
                      <div className="text-red-400">❌ 无Agent流程信息</div>
                    )}
                  </div>
                </div>

                {/* 详细调试日志 */}
                {debugData.debugLogs && (
                  <div>
                    <h4 className="text-yellow-400 font-semibold mb-1">详细调试日志</h4>
                    
                    {/* 轮次跟踪 */}
                    <details className="mb-2">
                      <summary className="text-xs text-cyan-400 cursor-pointer">
                        轮次跟踪 ({debugData.debugLogs.roundTracking.length} 轮)
                      </summary>
                      <div className="text-xs text-gray-300 mt-1 space-y-1 max-h-32 overflow-y-auto">
                        {debugData.debugLogs.roundTracking.length > 0 ? (
                          debugData.debugLogs.roundTracking.map((round: any, index: number) => (
                            <div key={index} className="border-l-2 border-blue-500 pl-2">
                              <div className="text-blue-400">第{index + 1}轮: {round.isFirstRound ? '首轮' : '续轮'}</div>
                              <div className="text-xs text-gray-400">
                                输入: {round.userInput?.slice(0, 30)}...
                              </div>
                              <div className="text-xs text-gray-400">
                                历史长度: {round.historyLength}, 时间: {round.timestamp}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-red-400">无轮次记录</div>
                        )}
                      </div>
                    </details>
                    
                    {/* AI调用历史 */}
                    <details className="mb-2">
                      <summary className="text-xs text-cyan-400 cursor-pointer">
                        AI调用历史 ({debugData.debugLogs.aiCallHistory.length} 次)
                      </summary>
                      <div className="text-xs text-gray-300 mt-1 space-y-1 max-h-32 overflow-y-auto">
                        {debugData.debugLogs.aiCallHistory.length > 0 ? (
                          debugData.debugLogs.aiCallHistory.map((call: any, index: number) => (
                            <div key={index} className="border-l-2 border-green-500 pl-2">
                              <div className="text-green-400">调用{index + 1}: {call.timestamp}</div>
                              <div className="text-xs text-gray-400">
                                消息数: {call.messageCount}, 响应长度: {call.responseLength}
                              </div>
                              <div className="text-xs text-gray-400">
                                状态: {call.status}, 耗时: {call.duration}ms
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-red-400">无AI调用记录</div>
                        )}
                      </div>
                    </details>
                    
                    {/* 最后一次AI Prompt */}
                    {debugData.debugLogs.lastAiPrompt && (
                      <details className="mb-2">
                        <summary className="text-xs text-orange-400 cursor-pointer">
                          最后一次AI Prompt ({debugData.debugLogs.lastAiPrompt.length} 字符)
                        </summary>
                        <pre className="text-xs text-gray-300 mt-1 max-h-40 overflow-y-auto bg-gray-900 p-2 rounded">
                          {debugData.debugLogs.lastAiPrompt}
                        </pre>
                      </details>
                    )}
                    
                    {/* 实时诊断 - 检查问题 */}
                    <details className="mb-2">
                      <summary className="text-xs text-red-400 cursor-pointer">
                        🔍 实时诊断
                      </summary>
                      <div className="text-xs text-gray-300 mt-1 space-y-1">
                        {/* 检查为什么没有Welcome历史 */}
                        <div className="text-yellow-400">问题诊断:</div>
                        <div>• General历史: {debugData.allAgentHistories.conversationHistory.length} 条</div>
                        <div>• Welcome历史: {debugData.allAgentHistories.welcomeHistory.length} 条</div>
                        <div>• 轮次记录: {debugData.debugLogs.roundTracking.length} 轮</div>
                        <div>• AI调用: {debugData.debugLogs.aiCallHistory.length} 次</div>
                        
                        {debugData.allAgentHistories.conversationHistory.length > 0 && debugData.allAgentHistories.welcomeHistory.length === 0 && (
                          <div className="text-red-400 mt-2">
                            ⚠️ 检测到问题: 有General历史但无Welcome历史，可能Welcome Agent未被正确调用
                          </div>
                        )}
                        
                        {debugData.debugLogs.roundTracking.length === 0 && debugData.metadata.metrics.userInteractions > 0 && (
                          <div className="text-red-400 mt-2">
                            ⚠️ 检测到问题: 有用户交互但无轮次记录，调试日志可能未启用
                          </div>
                        )}
                      </div>
                    </details>
                    
                    {/* 最后一次AI响应 */}
                    {debugData.debugLogs.lastAiResponse && (
                      <details className="mb-2">
                        <summary className="text-xs text-orange-400 cursor-pointer">
                          最后一次AI响应 ({debugData.debugLogs.lastAiResponse.length} 字符)
                        </summary>
                        <pre className="text-xs text-gray-300 mt-1 max-h-40 overflow-y-auto bg-gray-900 p-2 rounded">
                          {debugData.debugLogs.lastAiResponse}
                        </pre>
                      </details>
                    )}
                    
                    {/* 存储状态 */}
                    <details className="mb-2">
                      <summary className="text-xs text-purple-400 cursor-pointer">
                        存储状态
                      </summary>
                      <div className="text-xs text-gray-300 mt-1">
                        <div>数据库同步: {debugData.debugLogs.storageStatus.dbSynced ? '✅' : '❌'}</div>
                        <div>内存状态: {debugData.debugLogs.storageStatus.memoryStatus || '未知'}</div>
                        <div>最后保存: {debugData.debugLogs.storageStatus.lastSaved || '未保存'}</div>
                      </div>
                    </details>
                  </div>
                )}

                {/* 原始元数据 */}
                <details>
                  <summary className="text-yellow-400 font-semibold cursor-pointer">原始元数据</summary>
                  <pre className="text-xs text-gray-400 mt-1 overflow-x-auto">
                    {JSON.stringify(debugData.metadata, null, 2)}
                  </pre>
                </details>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2">
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
                    <div>加载中...</div>
                  </>
                ) : sessionId ? (
                  <>
                    <div className="text-red-400">❌ 无法获取会话数据</div>
                    <div className="text-xs">会话ID: {sessionId}</div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchDebugData}
                      className="mt-2 text-xs"
                    >
                      重试
                    </Button>
                  </>
                ) : (
                  <>
                    <div>📱 无活跃会话</div>
                    <div className="text-xs text-center">
                      开始新对话后将显示调试信息
                    </div>
                  </>
                )}
              </div>
            )}
          </ScrollArea>
          
          {/* 操作提示 */}
          <div className="mt-2 pt-2 border-t border-gray-700 text-xs text-gray-500">
            <div>快捷键: Ctrl+D 开关 | 自动刷新: {autoRefresh ? '开' : '关'}</div>
            {process.env.NODE_ENV === 'development' && (
              <button
                onClick={() => {
                  console.log('🔍 [调试面板] 当前完整数据:', debugData);
                  console.log('🔍 [调试面板] SessionId:', sessionId);
                }}
                className="mt-1 text-xs text-blue-400 hover:text-blue-300 underline"
              >
                打印完整调试数据到控制台
              </button>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
