"use client"

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';

interface SessionDebugInfo {
  user: any;
  sessions: any;
  apiResponse: any;
  error?: string;
}

export default function DebugSessionPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [debugInfo, setDebugInfo] = useState<SessionDebugInfo>({
    user: null,
    sessions: null,
    apiResponse: null,
  });

  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        console.log('🔍 [调试页面] 开始获取会话数据...');
        
        const response = await fetch('/api/sessions', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const apiResponse = await response.json();
        console.log('📦 [调试页面] API响应:', apiResponse);

        setDebugInfo(prev => ({
          ...prev,
          user: user ? {
            id: user.id,
            primaryEmailAddress: user.primaryEmailAddress?.emailAddress,
            fullName: user.fullName,
            username: user.username,
          } : null,
          apiResponse,
        }));

      } catch (error) {
        console.error('❌ [调试页面] 获取会话失败:', error);
        setDebugInfo(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Unknown error'
        }));
      }
    };

    if (isLoaded) {
      fetchSessionData();
    }
  }, [user, isLoaded, isSignedIn]);

  if (!isLoaded) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">会话调试信息</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 用户信息 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">用户认证状态</h2>
            <div className="space-y-2">
              <div><strong>是否登录:</strong> {isSignedIn ? '是' : '否'}</div>
              <div><strong>加载完成:</strong> {isLoaded ? '是' : '否'}</div>
              {debugInfo.user && (
                <>
                  <div><strong>用户ID:</strong> {debugInfo.user.id}</div>
                  <div><strong>邮箱:</strong> {debugInfo.user.primaryEmailAddress}</div>
                  <div><strong>用户名:</strong> {debugInfo.user.username || '未设置'}</div>
                  <div><strong>姓名:</strong> {debugInfo.user.fullName || '未设置'}</div>
                </>
              )}
            </div>
          </div>

          {/* API响应 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">API响应</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96">
              {JSON.stringify(debugInfo.apiResponse, null, 2)}
            </pre>
          </div>

          {/* 错误信息 */}
          {debugInfo.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 col-span-2">
              <h2 className="text-xl font-semibold text-red-800 mb-4">错误信息</h2>
              <p className="text-red-600">{debugInfo.error}</p>
            </div>
          )}

          {/* 数据库直接查询 */}
          <div className="bg-white rounded-lg shadow p-6 col-span-2">
            <h2 className="text-xl font-semibold mb-4">数据库信息</h2>
            <div className="text-sm text-gray-600">
              <p>会话总数: 467</p>
              <p>对话记录总数: 6</p>
              <p>问题: 大多数会话没有对话记录</p>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="mt-8 flex gap-4">
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
          >
            刷新页面
          </button>
          <a
            href="/chat"
            className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600 inline-block"
          >
            返回聊天页面
          </a>
        </div>
      </div>
    </div>
  );
}