'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createVercelInstance, testBasicConnection } from '@/test-vercel-sdk';
import { DEFAULT_VERCEL_CONFIG } from '@/lib/config/vercel-config';

export default function TestVercelSDKPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<string>('');
  const [error, setError] = useState<string>('');

  const runSDKTest = async () => {
    setIsLoading(true);
    setTestResult('');
    setError('');

    try {
      setTestResult('🧪 开始测试 Vercel SDK...\n');
      
      // 1. 测试 SDK 初始化
      setTestResult(prev => prev + '1️⃣ 测试 SDK 初始化...\n');
      const vercel = createVercelInstance();
      setTestResult(prev => prev + '✅ SDK 初始化成功\n');
      
      // 2. 测试基本连接
      setTestResult(prev => prev + '2️⃣ 测试 API 连接...\n');
      const connectionSuccess = await testBasicConnection();
      
      if (connectionSuccess) {
        setTestResult(prev => prev + '✅ API 连接测试成功！\n');
        setTestResult(prev => prev + '🎉 所有测试通过！Vercel SDK 已准备就绪。\n');
      } else {
        setTestResult(prev => prev + '❌ API 连接测试失败\n');
        setError('API 连接失败，请检查 Token 或网络连接');
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError(`测试失败: ${errorMessage}`);
      setTestResult(prev => prev + `❌ 测试失败: ${errorMessage}\n`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vercel SDK 测试</h1>
          <p className="text-gray-600 mt-2">测试 Vercel SDK 连接和基本功能</p>
        </div>

        {/* 配置信息 */}
        <Card>
          <CardHeader>
            <CardTitle>当前配置</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Token</label>
                <p className="text-sm font-mono bg-gray-100 p-2 rounded mt-1">
                  {DEFAULT_VERCEL_CONFIG.bearerToken?.substring(0, 12)}...
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Team ID</label>
                <p className="text-sm font-mono bg-gray-100 p-2 rounded mt-1">
                  {DEFAULT_VERCEL_CONFIG.teamId || '未设置'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 测试控制 */}
        <Card>
          <CardHeader>
            <CardTitle>SDK 测试</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button 
                onClick={runSDKTest} 
                disabled={isLoading}
                className="w-full md:w-auto"
              >
                {isLoading ? '测试中...' : '开始测试 Vercel SDK'}
              </Button>

              {/* 测试状态 */}
              <div className="flex gap-2">
                <Badge variant={isLoading ? 'default' : 'secondary'}>
                  {isLoading ? '运行中' : '待测试'}
                </Badge>
                
                {error && (
                  <Badge variant="destructive">错误</Badge>
                )}
                
                {testResult.includes('🎉') && (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    成功
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 测试结果 */}
        {testResult && (
          <Card>
            <CardHeader>
              <CardTitle>测试结果</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">
                {testResult}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 错误信息 */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                <span className="text-red-800 font-medium">错误</span>
              </div>
              <p className="text-red-700 mt-2">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* 说明文档 */}
        <Card>
          <CardHeader>
            <CardTitle>关于 Vercel SDK</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <div className="space-y-4 text-sm text-gray-600">
              <div>
                <h4 className="font-medium text-gray-900">SDK 初始化</h4>
                <p>使用提供的 Token 创建 Vercel SDK 实例</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">API 连接测试</h4>
                <p>测试与 Vercel API 的基本连接和权限</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">部署功能</h4>
                <p>验证是否能够正常进行项目部署和管理</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 