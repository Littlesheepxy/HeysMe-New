'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  UnifiedLoading, 
  ThinkingLoader, 
  GeneratingLoader, 
  ProcessingLoader, 
  AnalyzingLoader,
  SimpleTextLoader
} from '@/components/ui/unified-loading';
import { LoadingProvider, useLoading } from '@/contexts/LoadingContext';

function LoadingDemoContent() {
  const [activeLoader, setActiveLoader] = useState<string | null>(null);
  const { showLoading, hideLoading } = useLoading();

  const startGlobalLoading = (variant: 'thinking' | 'generating' | 'processing' | 'analyzing') => {
    const texts = {
      thinking: 'AI 正在深度思考您的问题',
      generating: '正在为您生成个性化内容',
      processing: '正在处理复杂的数据分析',
      analyzing: '正在分析您的输入并优化结果'
    };
    
    const id = showLoading({
      variant,
      text: texts[variant],
      autoHide: true,
      timeout: 5000
    });
    
    setActiveLoader(id);
    
    // 5秒后清除引用
    setTimeout(() => {
      setActiveLoader(null);
    }, 5000);
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">
          简洁Loading效果演示
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          简化版OpenAI风格文字光照扫描loading效果，去掉多余的框架和动效，只保留核心的文字扫描动画。
        </p>
      </div>

      {/* 基础组件演示 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">思考状态</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div><ThinkingLoader size="sm" /></div>
            <div><ThinkingLoader size="md" /></div>
            <div><ThinkingLoader size="lg" /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">生成状态</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div><GeneratingLoader size="sm" /></div>
            <div><GeneratingLoader size="md" /></div>
            <div><GeneratingLoader size="lg" /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">处理状态</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div><ProcessingLoader size="sm" /></div>
            <div><ProcessingLoader size="md" /></div>
            <div><ProcessingLoader size="lg" /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">分析状态</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div><AnalyzingLoader size="sm" /></div>
            <div><AnalyzingLoader size="md" /></div>
            <div><AnalyzingLoader size="lg" /></div>
          </CardContent>
        </Card>
      </div>

      {/* 自定义文本演示 */}
      <Card>
        <CardHeader>
          <CardTitle>自定义文本示例</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <UnifiedLoading variant="thinking" text="正在分析您的代码质量" />
          <UnifiedLoading variant="generating" text="AI正在为您编写文档" />
          <UnifiedLoading variant="processing" text="正在优化性能参数" />
          <UnifiedLoading variant="analyzing" text="正在检测潜在的安全漏洞" />
        </CardContent>
      </Card>

      {/* 简单文本loader */}
      <Card>
        <CardHeader>
          <CardTitle>简单文本Loading</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SimpleTextLoader text="加载中" />
          <SimpleTextLoader text="提交中" className="text-blue-600" />
          <SimpleTextLoader text="保存中" className="text-green-600" />
          <SimpleTextLoader text="删除中" className="text-red-600" />
        </CardContent>
      </Card>

      {/* 全局loading演示 */}
      <Card>
        <CardHeader>
          <CardTitle>全局Loading演示</CardTitle>
          <p className="text-sm text-gray-600">
            点击按钮将在屏幕右上角显示全局loading，5秒后自动消失
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              onClick={() => startGlobalLoading('thinking')}
              className="bg-blue-500 hover:bg-blue-600"
            >
              思考中
            </Button>
            <Button 
              onClick={() => startGlobalLoading('generating')}
              className="bg-purple-500 hover:bg-purple-600"
            >
              生成中
            </Button>
            <Button 
              onClick={() => startGlobalLoading('processing')}
              className="bg-green-500 hover:bg-green-600"
            >
              处理中
            </Button>
            <Button 
              onClick={() => startGlobalLoading('analyzing')}
              className="bg-orange-500 hover:bg-orange-600"
            >
              分析中
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 使用场景示例 */}
      <Card>
        <CardHeader>
          <CardTitle>实际使用场景</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <h4 className="font-medium">聊天界面</h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm">AI</span>
                </div>
                <div className="flex-1">
                  <ThinkingLoader text="正在理解您的问题" size="sm" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium">表单提交</h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span>提交用户信息</span>
                <SimpleTextLoader text="提交中" className="text-blue-600" />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium">内容生成</h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <GeneratingLoader text="AI正在为您生成个性化建议" size="md" />
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium">交互分析状态</h4>
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm">AI</span>
                </div>
                <div className="flex-1">
                  <GeneratingLoader text="正在分析您的选择，请稍候" size="sm" />
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm">AI</span>
                </div>
                <div className="flex-1">
                  <GeneratingLoader text="正在为您生成个性化建议" size="sm" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoadingDemoPage() {
  return (
    <LoadingProvider>
      <LoadingDemoContent />
    </LoadingProvider>
  );
} 