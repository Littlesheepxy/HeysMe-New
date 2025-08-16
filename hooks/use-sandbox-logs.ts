/**
 * useSandboxLogs Hook
 * 管理E2B沙盒日志监控和实时流式日志
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

export interface LogEntry {
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  source: 'sandbox' | 'nextjs' | 'system';
  message: string;
  details?: any;
  realtime?: boolean;
}

export interface LogFilters {
  level?: 'info' | 'warn' | 'error' | 'debug' | 'all';
  source?: 'sandbox' | 'nextjs' | 'system' | 'all';
  since?: Date;
  limit?: number;
}

export interface UseSandboxLogsReturn {
  // 状态
  logs: LogEntry[];
  isStreaming: boolean;
  isLoading: boolean;
  error: string | null;
  
  // 控制方法
  fetchLogs: (filters?: LogFilters) => Promise<LogEntry[]>;
  startStreaming: (filters?: LogFilters) => void;
  stopStreaming: () => void;
  clearLogs: () => void;
  addLog: (level: string, source: string, message: string, details?: any) => Promise<void>;
  
  // 实用方法
  getFilteredLogs: (filters?: LogFilters) => LogEntry[];
  getLogCount: (level?: string) => number;
  exportLogs: (format?: 'json' | 'txt') => string;
}

export const useSandboxLogs = (): UseSandboxLogsReturn => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 清理资源
  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // 组件卸载时清理
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // API调用封装
  const apiCall = useCallback(async (url: string, options: RequestInit = {}): Promise<any> => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: abortControllerRef.current.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return null;
      }
      throw err;
    }
  }, []);

  // 获取日志
  const fetchLogs = useCallback(async (filters: LogFilters = {}): Promise<LogEntry[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      
      if (filters.level && filters.level !== 'all') {
        params.append('level', filters.level);
      }
      
      if (filters.source && filters.source !== 'all') {
        params.append('source', filters.source);
      }
      
      if (filters.since) {
        params.append('since', filters.since.toISOString());
      }
      
      if (filters.limit) {
        params.append('limit', filters.limit.toString());
      }

      const url = `/api/e2b-sandbox/logs${params.toString() ? '?' + params.toString() : ''}`;
      const result = await apiCall(url);

      if (!result) return [];

      if (result.success) {
        const fetchedLogs: LogEntry[] = result.logs.map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp),
        }));

        setLogs(prevLogs => {
          // 合并并去重日志
          const combined = [...prevLogs, ...fetchedLogs];
          const uniqueLogs = combined.reduce((acc, log) => {
            const key = `${log.timestamp.getTime()}-${log.message}`;
            if (!acc.some(existing => `${existing.timestamp.getTime()}-${existing.message}` === key)) {
              acc.push(log);
            }
            return acc;
          }, [] as LogEntry[]);
          
          // 按时间排序，最新的在前
          return uniqueLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        });

        console.log('📋 [useSandboxLogs] 获取日志成功，数量:', fetchedLogs.length);
        return fetchedLogs;
      } else {
        throw new Error(result.message || '获取日志失败');
      }
    } catch (err: any) {
      console.error('❌ [useSandboxLogs] 获取日志失败:', err);
      setError(err.message || '获取日志失败');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [apiCall]);

  // 开始流式日志
  const startStreaming = useCallback((filters: LogFilters = {}) => {
    if (isStreaming) return;

    cleanup(); // 清理之前的连接

    console.log('🌊 [useSandboxLogs] 开始流式日志监控...');
    
    const params = new URLSearchParams();
    params.append('follow', 'true');
    
    if (filters.level && filters.level !== 'all') {
      params.append('filter', filters.level);
    }

    const eventSourceUrl = `/api/e2b-sandbox/monitor-logs?${params.toString()}`;
    
    eventSourceRef.current = new EventSource(eventSourceUrl);
    setIsStreaming(true);
    setError(null);

    eventSourceRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'log') {
          const newLog: LogEntry = {
            timestamp: new Date(data.timestamp),
            level: data.level,
            source: data.source,
            message: data.message,
            realtime: true,
          };

          setLogs(prevLogs => [newLog, ...prevLogs].slice(0, 1000)); // 保持最多1000条日志
        } else if (data.type === 'error') {
          setError(data.message);
        } else if (data.type === 'timeout') {
          console.log('⏰ [useSandboxLogs] 流式监控超时，自动重连...');
          // EventSource会自动重连
        }
      } catch (err) {
        console.error('❌ [useSandboxLogs] 解析日志数据失败:', err);
      }
    };

    eventSourceRef.current.onerror = (event) => {
      console.error('❌ [useSandboxLogs] 流式连接错误:', event);
      setError('实时日志连接中断');
    };

    eventSourceRef.current.onopen = () => {
      console.log('✅ [useSandboxLogs] 流式日志连接成功');
      setError(null);
    };
  }, [isStreaming, cleanup]);

  // 停止流式日志
  const stopStreaming = useCallback(() => {
    if (!isStreaming) return;

    console.log('⏹️ [useSandboxLogs] 停止流式日志监控');
    
    cleanup();
    setIsStreaming(false);
  }, [isStreaming, cleanup]);

  // 清空日志
  const clearLogs = useCallback(() => {
    setLogs([]);
    setError(null);
    console.log('🧹 [useSandboxLogs] 日志已清空');
  }, []);

  // 添加日志
  const addLog = useCallback(async (level: string, source: string, message: string, details?: any): Promise<void> => {
    try {
      await apiCall('/api/e2b-sandbox/logs', {
        method: 'POST',
        body: JSON.stringify({
          level,
          source,
          message,
          details,
        }),
      });

      // 本地也添加一条
      const newLog: LogEntry = {
        timestamp: new Date(),
        level: level as any,
        source: source as any,
        message,
        details,
      };

      setLogs(prevLogs => [newLog, ...prevLogs]);
    } catch (err: any) {
      console.error('❌ [useSandboxLogs] 添加日志失败:', err);
    }
  }, [apiCall]);

  // 过滤日志
  const getFilteredLogs = useCallback((filters: LogFilters = {}): LogEntry[] => {
    let filtered = [...logs];

    if (filters.level && filters.level !== 'all') {
      filtered = filtered.filter(log => log.level === filters.level);
    }

    if (filters.source && filters.source !== 'all') {
      filtered = filtered.filter(log => log.source === filters.source);
    }

    if (filters.since) {
      filtered = filtered.filter(log => log.timestamp >= filters.since!);
    }

    if (filters.limit) {
      filtered = filtered.slice(0, filters.limit);
    }

    return filtered;
  }, [logs]);

  // 获取日志数量
  const getLogCount = useCallback((level?: string): number => {
    if (!level || level === 'all') {
      return logs.length;
    }

    return logs.filter(log => log.level === level).length;
  }, [logs]);

  // 导出日志
  const exportLogs = useCallback((format: 'json' | 'txt' = 'txt'): string => {
    if (format === 'json') {
      return JSON.stringify(logs, null, 2);
    }

    return logs
      .map(log => {
        const timestamp = log.timestamp.toISOString();
        const level = log.level.toUpperCase().padEnd(5);
        const source = log.source.padEnd(7);
        return `${timestamp} ${level} [${source}] ${log.message}`;
      })
      .join('\n');
  }, [logs]);

  return {
    // 状态
    logs,
    isStreaming,
    isLoading,
    error,
    
    // 控制方法
    fetchLogs,
    startStreaming,
    stopStreaming,
    clearLogs,
    addLog,
    
    // 实用方法
    getFilteredLogs,
    getLogCount,
    exportLogs,
  };
};
