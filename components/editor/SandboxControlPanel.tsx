/**
 * SandboxControlPanel Component
 * E2B沙盒控制面板 - 提供详细的沙盒管理功能
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  Play, 
  Square, 
  RefreshCw, 
  Terminal, 
  Package, 
  FileText, 
  Settings,
  Activity,
  Clock,
  Cpu,
  MemoryStick,
  HardDrive,
  Network,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  Download,
  Upload,
  Trash2,
  Plus,
  Minus,
  Code2,
  Zap,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/theme-context';
import { useE2BSandbox, SandboxInfo } from '@/hooks/use-e2b-sandbox';
import { useSandboxStatus, SandboxHealth } from '@/hooks/use-sandbox-status';
import { useSandboxLogs, LogEntry } from '@/hooks/use-sandbox-logs';

interface SandboxControlPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSandboxChange?: (sandbox: SandboxInfo | null) => void;
}

interface CommandHistory {
  id: string;
  command: string;
  timestamp: Date;
  output?: string;
  exitCode?: number;
  duration?: number;
}

export const SandboxControlPanel: React.FC<SandboxControlPanelProps> = ({
  isOpen,
  onClose,
  onSandboxChange,
}) => {
  const { theme } = useTheme();
  
  // Hooks
  const {
    sandbox,
    isLoading,
    error,
    isConnected,
    createSandbox,
    destroySandbox,
    restartServer,
    installPackages,
    runCommand,
    refreshStatus,
  } = useE2BSandbox();

  const {
    health,
    metrics,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    getStatusColor,
    getStatusText,
    formatUptime,
  } = useSandboxStatus();

  const {
    logs,
    isStreaming,
    startStreaming,
    stopStreaming,
    clearLogs,
    getFilteredLogs,
    getLogCount,
    exportLogs,
  } = useSandboxLogs();

  // 本地状态
  const [activeTab, setActiveTab] = useState<'overview' | 'terminal' | 'packages' | 'files' | 'logs'>('overview');
  const [terminalInput, setTerminalInput] = useState('');
  const [packageInput, setPackageInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<CommandHistory[]>([]);
  const [isRunningCommand, setIsRunningCommand] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['status', 'metrics']));

  // 通知父组件沙盒变化
  useEffect(() => {
    onSandboxChange?.(sandbox);
  }, [sandbox, onSandboxChange]);

  // 自动开始监控
  useEffect(() => {
    if (sandbox && !isMonitoring) {
      startMonitoring(10000); // 10秒间隔
      startStreaming({ level: 'all', limit: 200 });
    }
  }, [sandbox, isMonitoring, startMonitoring, startStreaming]);

  // 创建沙盒
  const handleCreateSandbox = useCallback(async () => {
    const newSandbox = await createSandbox();
    if (newSandbox) {
      console.log('✅ 沙盒创建成功:', newSandbox.id);
    }
  }, [createSandbox]);

  // 销毁沙盒
  const handleDestroySandbox = useCallback(async () => {
    const success = await destroySandbox();
    if (success) {
      setCommandHistory([]);
      stopMonitoring();
      stopStreaming();
      console.log('🗑️ 沙盒已销毁');
    }
  }, [destroySandbox, stopMonitoring, stopStreaming]);

  // 执行终端命令
  const handleRunCommand = useCallback(async () => {
    if (!terminalInput.trim() || isRunningCommand) return;

    const command = terminalInput.trim();
    const commandId = `cmd_${Date.now()}`;
    const startTime = Date.now();

    setIsRunningCommand(true);
    setTerminalInput('');

    // 添加到历史记录（开始执行）
    const historyEntry: CommandHistory = {
      id: commandId,
      command,
      timestamp: new Date(),
    };
    setCommandHistory(prev => [historyEntry, ...prev]);

    try {
      const result = await runCommand(command);
      const duration = Date.now() - startTime;

      // 更新历史记录（执行完成）
      setCommandHistory(prev => prev.map(entry => 
        entry.id === commandId 
          ? {
              ...entry,
              output: result?.stdout || result?.output || '命令执行成功',
              exitCode: result?.exitCode || 0,
              duration,
            }
          : entry
      ));

    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      setCommandHistory(prev => prev.map(entry => 
        entry.id === commandId 
          ? {
              ...entry,
              output: error.message || '命令执行失败',
              exitCode: 1,
              duration,
            }
          : entry
      ));
    } finally {
      setIsRunningCommand(false);
    }
  }, [terminalInput, isRunningCommand, runCommand]);

  // 安装包
  const handleInstallPackage = useCallback(async () => {
    if (!packageInput.trim()) return;

    const packages = packageInput.trim().split(/\s+/);
    const success = await installPackages(packages);
    
    if (success) {
      setPackageInput('');
      console.log('✅ 包安装成功:', packages);
    }
  }, [packageInput, installPackages]);

  // 切换展开状态
  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  }, []);

  // 获取状态样式
  const getStatusBadgeStyle = useCallback((color: string) => {
    const styles = {
      green: 'bg-emerald-100 text-emerald-700 border-emerald-300',
      yellow: 'bg-amber-100 text-amber-700 border-amber-300',
      red: 'bg-red-100 text-red-700 border-red-300',
      gray: 'bg-gray-100 text-gray-700 border-gray-300',
    };
    return styles[color as keyof typeof styles] || styles.gray;
  }, []);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className={`w-full max-w-6xl h-[80vh] rounded-2xl shadow-2xl overflow-hidden ${
          theme === 'light' ? 'bg-white' : 'bg-gray-900'
        }`}
      >
        {/* 🎨 头部 */}
        <div className={`flex items-center justify-between p-6 border-b ${
          theme === 'light' ? 'border-gray-200' : 'border-gray-700'
        }`}>
          <div className="flex items-center gap-4">
            <div className="p-2 bg-brand-gradient rounded-xl">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>
                E2B 沙盒控制面板
              </h2>
              <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                管理和监控您的开发环境
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {sandbox && (
              <Badge className={getStatusBadgeStyle(getStatusColor())}>
                {getStatusText()}
              </Badge>
            )}
            <Button variant="ghost" onClick={onClose}>
              <XCircle className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="flex h-[calc(80vh-88px)]">
          {/* 🔧 左侧标签栏 */}
          <div className={`w-48 border-r ${
            theme === 'light' ? 'border-gray-200 bg-gray-50' : 'border-gray-700 bg-gray-800'
          }`}>
            <div className="p-4 space-y-1">
              {[
                { key: 'overview', label: '概览', icon: Activity },
                { key: 'terminal', label: '终端', icon: Terminal },
                { key: 'packages', label: '包管理', icon: Package },
                { key: 'files', label: '文件', icon: FileText },
                { key: 'logs', label: '日志', icon: Code2 },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as any)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all",
                    activeTab === key
                      ? theme === 'light'
                        ? "bg-white text-emerald-700 shadow-sm"
                        : "bg-gray-700 text-emerald-400 shadow-sm"
                      : theme === 'light'
                        ? "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                        : "text-gray-400 hover:text-gray-200 hover:bg-gray-700/50"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                  {key === 'logs' && getLogCount('error') > 0 && (
                    <Badge variant="destructive" className="ml-auto text-xs">
                      {getLogCount('error')}
                    </Badge>
                  )}
                </button>
              ))}
            </div>

            <Separator className="my-4" />

            {/* 快速操作 */}
            <div className="p-4 space-y-2">
              <h4 className={`font-medium text-xs uppercase tracking-wider ${
                theme === 'light' ? 'text-gray-500' : 'text-gray-400'
              }`}>
                快速操作
              </h4>
              
              {!sandbox ? (
                <Button
                  onClick={handleCreateSandbox}
                  disabled={isLoading}
                  className="w-full text-xs bg-brand-gradient hover:opacity-90"
                  size="sm"
                >
                  {isLoading ? (
                    <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                  ) : (
                    <Play className="w-3 h-3 mr-2" />
                  )}
                  创建沙盒
                </Button>
              ) : (
                <div className="space-y-2">
                  <Button
                    onClick={() => restartServer({ force: true })}
                    disabled={isLoading}
                    variant="outline"
                    className="w-full text-xs"
                    size="sm"
                  >
                    <RefreshCw className="w-3 h-3 mr-2" />
                    重启服务
                  </Button>
                  
                  <Button
                    onClick={handleDestroySandbox}
                    disabled={isLoading}
                    variant="destructive"
                    className="w-full text-xs"
                    size="sm"
                  >
                    <Trash2 className="w-3 h-3 mr-2" />
                    销毁沙盒
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* 🎨 右侧内容区 */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-6">
                {/* 概览页 */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* 沙盒状态 */}
                    <Card>
                      <CardHeader 
                        className="cursor-pointer"
                        onClick={() => toggleSection('status')}
                      >
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2">
                            <Activity className="w-5 h-5" />
                            沙盒状态
                          </CardTitle>
                          {expandedSections.has('status') ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </CardHeader>
                      
                      <AnimatePresence>
                        {expandedSections.has('status') && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                          >
                            <CardContent className="space-y-4">
                              {sandbox ? (
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">沙盒ID</label>
                                    <p className="text-xs font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded">
                                      {sandbox.id}
                                    </p>
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">预览URL</label>
                                    <p className="text-xs font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded break-all">
                                      {sandbox.url}
                                    </p>
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">创建时间</label>
                                    <p className="text-sm">{sandbox.createdAt.toLocaleString()}</p>
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">最后活动</label>
                                    <p className="text-sm">{sandbox.lastActivity.toLocaleString()}</p>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center py-8">
                                  <Square className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                                  <p className="text-gray-600">暂无活动沙盒</p>
                                </div>
                              )}
                            </CardContent>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>

                    {/* 性能指标 */}
                    {health && (
                      <Card>
                        <CardHeader
                          className="cursor-pointer"
                          onClick={() => toggleSection('metrics')}
                        >
                          <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                              <Cpu className="w-5 h-5" />
                              性能指标
                            </CardTitle>
                            {expandedSections.has('metrics') ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </div>
                        </CardHeader>
                        
                        <AnimatePresence>
                          {expandedSections.has('metrics') && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                            >
                              <CardContent>
                                <div className="grid grid-cols-3 gap-6">
                                  <div className="text-center space-y-2">
                                    <Clock className="w-8 h-8 mx-auto text-blue-500" />
                                    <div>
                                      <p className="text-2xl font-bold">{formatUptime(health.uptimeMinutes)}</p>
                                      <p className="text-xs text-gray-600">运行时间</p>
                                    </div>
                                  </div>
                                  
                                  <div className="text-center space-y-2">
                                    <Network className="w-8 h-8 mx-auto text-emerald-500" />
                                    <div>
                                      <p className="text-2xl font-bold">{metrics?.responseTime || 0}ms</p>
                                      <p className="text-xs text-gray-600">响应时间</p>
                                    </div>
                                  </div>
                                  
                                  <div className="text-center space-y-2">
                                    <Zap className="w-8 h-8 mx-auto text-purple-500" />
                                    <div>
                                      <p className="text-2xl font-bold">{metrics?.requestCount || 0}</p>
                                      <p className="text-xs text-gray-600">请求次数</p>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Card>
                    )}
                  </div>
                )}

                {/* 终端页 */}
                {activeTab === 'terminal' && (
                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Terminal className="w-5 h-5" />
                          命令终端
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex gap-2">
                          <Input
                            value={terminalInput}
                            onChange={(e) => setTerminalInput(e.target.value)}
                            placeholder="输入命令..."
                            className="font-mono"
                            onKeyPress={(e) => e.key === 'Enter' && handleRunCommand()}
                            disabled={!sandbox || isRunningCommand}
                          />
                          <Button
                            onClick={handleRunCommand}
                            disabled={!sandbox || !terminalInput.trim() || isRunningCommand}
                          >
                            {isRunningCommand ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </Button>
                        </div>

                        {/* 命令历史 */}
                        <ScrollArea className="h-96">
                          <div className="space-y-2">
                            {commandHistory.map((entry) => (
                              <div
                                key={entry.id}
                                className="p-3 bg-gray-50 dark:bg-gray-800 rounded font-mono text-sm"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-emerald-600 dark:text-emerald-400">
                                    $ {entry.command}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    {entry.duration && (
                                      <span className="text-xs text-gray-500">
                                        {entry.duration}ms
                                      </span>
                                    )}
                                    <span className="text-xs text-gray-500">
                                      {entry.timestamp.toLocaleTimeString()}
                                    </span>
                                  </div>
                                </div>
                                
                                {entry.output && (
                                  <pre className={`whitespace-pre-wrap text-xs ${
                                    entry.exitCode === 0 
                                      ? 'text-gray-700 dark:text-gray-300' 
                                      : 'text-red-600 dark:text-red-400'
                                  }`}>
                                    {entry.output}
                                  </pre>
                                )}
                              </div>
                            ))}
                            
                            {commandHistory.length === 0 && (
                              <div className="text-center py-8 text-gray-500">
                                <Terminal className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p>暂无命令历史</p>
                              </div>
                            )}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* 包管理页 */}
                {activeTab === 'packages' && (
                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Package className="w-5 h-5" />
                          NPM 包管理
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex gap-2">
                          <Input
                            value={packageInput}
                            onChange={(e) => setPackageInput(e.target.value)}
                            placeholder="例: lodash @types/node react"
                            onKeyPress={(e) => e.key === 'Enter' && handleInstallPackage()}
                            disabled={!sandbox}
                          />
                          <Button
                            onClick={handleInstallPackage}
                            disabled={!sandbox || !packageInput.trim()}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            安装
                          </Button>
                        </div>
                        
                        <div className="text-sm text-gray-600">
                          <p>• 可以同时安装多个包，用空格分隔</p>
                          <p>• 支持指定版本号，如: lodash@4.17.21</p>
                          <p>• 自动检测并安装代码中的依赖包</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* 日志页 */}
                {activeTab === 'logs' && (
                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2">
                            <Code2 className="w-5 h-5" />
                            实时日志
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {isStreaming ? '监听中' : '已停止'}
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={clearLogs}
                            >
                              清空
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-96">
                          <div className="space-y-2">
                            {logs.map((log, index) => (
                              <div
                                key={index}
                                className={`p-3 rounded text-sm ${
                                  log.level === 'error' 
                                    ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                                    : log.level === 'warn'
                                      ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                                      : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                                }`}
                              >
                                <div className="flex items-center gap-2 mb-2 text-xs">
                                  <span className="text-gray-500">
                                    {log.timestamp.toLocaleTimeString()}
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    {log.source}
                                  </Badge>
                                  <Badge 
                                    variant={log.level === 'error' ? 'destructive' : 'secondary'} 
                                    className="text-xs"
                                  >
                                    {log.level}
                                  </Badge>
                                  {log.realtime && (
                                    <Badge variant="outline" className="text-xs">
                                      实时
                                    </Badge>
                                  )}
                                </div>
                                <p className="font-mono text-xs break-all">{log.message}</p>
                              </div>
                            ))}
                            
                            {logs.length === 0 && (
                              <div className="text-center py-8 text-gray-500">
                                <Code2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p>暂无日志数据</p>
                              </div>
                            )}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SandboxControlPanel;
