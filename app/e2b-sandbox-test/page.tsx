/**
 * E2B Sandbox Test Page
 * 全面的E2B沙盒测试界面
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { 
  Play, 
  Square, 
  Settings,
  Code2,
  FileText,
  Download,
  Upload,
  TestTube,
  Rocket,
  Monitor,
  Terminal,
  Package,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Eye,
  EyeOff,
  RefreshCw,
  Zap,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/theme-context';
import { useE2BSandbox } from '@/hooks/use-e2b-sandbox';
import { useSandboxStatus } from '@/hooks/use-sandbox-status';
import { useSandboxLogs } from '@/hooks/use-sandbox-logs';
import { E2BSandboxPreview } from '@/components/editor/E2BSandboxPreview';
import { SandboxControlPanel } from '@/components/editor/SandboxControlPanel';

// 测试用的示例代码
const sampleProjects = {
  'react-hello': {
    name: 'React Hello World',
    description: '简单的React应用',
    files: [
      {
        filename: 'app/page.js',
        content: `export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white mb-8">
          Hello E2B! 🚀
        </h1>
        <p className="text-xl text-blue-100 mb-8">
          欢迎使用E2B沙盒预览系统
        </p>
        <button className="bg-white text-blue-600 px-8 py-3 rounded-full font-semibold hover:bg-blue-50 transition-colors">
          开始探索
        </button>
      </div>
    </div>
  );
}`,
        language: 'jsx',
        type: 'page' as const,
      },
      {
        filename: 'app/layout.js',
        content: `export const metadata = {
  title: 'E2B Test App',
  description: 'Testing E2B Sandbox',
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh">
      <body>{children}</body>
    </html>
  );
}`,
        language: 'jsx',
        type: 'config' as const,
      },
    ],
  },
  'tailwind-landing': {
    name: 'Tailwind 落地页',
    description: '使用Tailwind CSS的现代落地页',
    files: [
      {
        filename: 'app/page.js',
        content: `export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* 头部导航 */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-gray-800">E2B Test</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <a href="#" className="text-gray-700 hover:text-blue-600">首页</a>
              <a href="#" className="text-gray-700 hover:text-blue-600">关于</a>
              <a href="#" className="text-gray-700 hover:text-blue-600">联系</a>
            </div>
          </div>
        </div>
      </nav>

      {/* 英雄区域 */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-20">
        <div className="max-w-7xl mx-auto text-center px-4">
          <h1 className="text-5xl font-bold mb-6">
            E2B 沙盒预览系统
          </h1>
          <p className="text-xl mb-8 text-blue-100">
            快速、安全、高效的代码预览解决方案
          </p>
          <button className="bg-white text-blue-600 px-8 py-3 rounded-full font-semibold text-lg hover:bg-blue-50 transition-colors">
            立即开始
          </button>
        </div>
      </section>

      {/* 特性区域 */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
            核心特性
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">极速部署</h3>
              <p className="text-gray-600">秒级代码部署和预览</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-green-600 text-2xl">🔒</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">安全隔离</h3>
              <p className="text-gray-600">独立的沙盒环境</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-purple-600 text-2xl">🚀</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">实时同步</h3>
              <p className="text-gray-600">代码变更实时预览</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}`,
        language: 'jsx',
        type: 'page' as const,
      },
      {
        filename: 'app/layout.js',
        content: `import './globals.css';

export const metadata = {
  title: 'E2B Tailwind Landing',
  description: 'Modern landing page with Tailwind CSS',
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh">
      <body className="antialiased">{children}</body>
    </html>
  );
}`,
        language: 'jsx',
        type: 'config' as const,
      },
      {
        filename: 'app/globals.css',
        content: `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    scroll-behavior: smooth;
  }
  
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
}

@layer components {
  .btn-primary {
    @apply bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors;
  }
}`,
        language: 'css',
        type: 'styles' as const,
      },
      {
        filename: 'tailwind.config.js',
        content: `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
    },
  },
  plugins: [],
}`,
        language: 'javascript',
        type: 'config' as const,
      },
    ],
  },
  'dashboard': {
    name: '仪表板界面',
    description: '现代化的仪表板组件',
    files: [
      {
        filename: 'app/page.js',
        content: `export default function Dashboard() {
  const stats = [
    { label: '总用户', value: '12,345', change: '+12%' },
    { label: '月收入', value: '¥56,789', change: '+8%' },
    { label: '订单数', value: '1,234', change: '+15%' },
    { label: '转化率', value: '3.2%', change: '+2%' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 侧边栏 */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-800">仪表板</h1>
        </div>
        <nav className="mt-6">
          <div className="px-6 space-y-2">
            <a href="#" className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg">
              📊 概览
            </a>
            <a href="#" className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              👥 用户
            </a>
            <a href="#" className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              📈 分析
            </a>
            <a href="#" className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              ⚙️ 设置
            </a>
          </div>
        </nav>
      </div>

      {/* 主内容 */}
      <div className="ml-64 p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800">欢迎回来！</h2>
          <p className="text-gray-600 mt-2">这是您的仪表板概览</p>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className="text-green-600 text-sm font-medium">
                  {stat.change}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 图表区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-bold mb-4">用户增长趋势</h3>
            <div className="h-64 bg-gradient-to-t from-blue-100 to-blue-50 rounded flex items-end justify-center">
              <p className="text-blue-600 font-medium">图表区域</p>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-bold mb-4">收入分析</h3>
            <div className="h-64 bg-gradient-to-t from-green-100 to-green-50 rounded flex items-end justify-center">
              <p className="text-green-600 font-medium">图表区域</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}`,
        language: 'jsx',
        type: 'page' as const,
      },
      {
        filename: 'app/layout.js',
        content: `import './globals.css';

export const metadata = {
  title: 'E2B Dashboard',
  description: 'Modern dashboard interface',
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh">
      <body className="bg-gray-50">{children}</body>
    </html>
  );
}`,
        language: 'jsx',
        type: 'config' as const,
      },
      {
        filename: 'app/globals.css',
        content: `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
}`,
        language: 'css',
        type: 'styles' as const,
      },
    ],
  },
};

export default function E2BSandboxTestPage() {
  const { theme } = useTheme();
  
  // E2B Hooks
  const {
    sandbox,
    isLoading,
    error,
    isConnected,
    createSandbox,
    destroySandbox,
    clearError,
  } = useE2BSandbox();

  const {
    health,
    isMonitoring,
    getStatusColor,
    getStatusText,
  } = useSandboxStatus();

  // 本地状态
  const [selectedProject, setSelectedProject] = useState<keyof typeof sampleProjects>('react-hello');
  const [customCode, setCustomCode] = useState('');
  const [showControlPanel, setShowControlPanel] = useState(false);
  const [testResults, setTestResults] = useState<Array<{ test: string; result: 'success' | 'failed' | 'pending'; message: string }>>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string>('');

  // 切换展开状态
  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? '' : section);
  };

  // 运行API测试
  const runAPITests = useCallback(async () => {
    setIsRunningTests(true);
    setTestResults([]);

    const tests = [
      {
        name: '连接测试',
        endpoint: '/api/e2b-sandbox/test-connection',
        method: 'GET',
      },
      {
        name: '沙盒状态',
        endpoint: '/api/e2b-sandbox/status',
        method: 'GET',
      },
      {
        name: '创建沙盒',
        endpoint: '/api/e2b-sandbox/create',
        method: 'POST',
      },
    ];

    for (const test of tests) {
      setTestResults(prev => [...prev, { test: test.name, result: 'pending', message: '测试中...' }]);
      
      try {
        const response = await fetch(test.endpoint, {
          method: test.method,
          headers: { 'Content-Type': 'application/json' },
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
          setTestResults(prev => prev.map(item => 
            item.test === test.name 
              ? { ...item, result: 'success', message: data.message || '测试通过' }
              : item
          ));
        } else {
          throw new Error(data.message || `HTTP ${response.status}`);
        }
      } catch (error: any) {
        setTestResults(prev => prev.map(item => 
          item.test === test.name 
            ? { ...item, result: 'failed', message: error.message || '测试失败' }
            : item
        ));
      }
      
      // 添加延迟避免过快请求
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsRunningTests(false);
  }, []);

  // 部署选中的项目
  const deployProject = useCallback(async () => {
    const project = sampleProjects[selectedProject];
    if (!project) return;

    // 这里会通过 E2BSandboxPreview 组件自动处理部署
    console.log('部署项目:', project.name);
  }, [selectedProject]);

  // 获取当前项目数据
  const currentProject = sampleProjects[selectedProject];

  return (
    <div className={`min-h-screen ${theme === 'light' ? 'bg-gray-50' : 'bg-gray-900'}`}>
      {/* 🎨 头部 */}
      <div className={`border-b ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}`}>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-3xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>
                E2B 沙盒测试中心
              </h1>
              <p className={`mt-2 text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                测试E2B沙盒预览系统的完整功能
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* 状态指示器 */}
              {sandbox && (
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    getStatusColor() === 'green' ? 'bg-emerald-500' :
                    getStatusColor() === 'yellow' ? 'bg-amber-500' :
                    getStatusColor() === 'red' ? 'bg-red-500' :
                    'bg-gray-500'
                  } animate-pulse`} />
                  <Badge variant="outline">
                    {getStatusText()}
                  </Badge>
                </div>
              )}
              
              <Button
                onClick={() => setShowControlPanel(true)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                控制面板
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-12 gap-8">
          {/* 🎮 左侧控制区 */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* API测试 */}
            <Card>
              <CardHeader
                className="cursor-pointer"
                onClick={() => toggleSection('api-test')}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <TestTube className="w-5 h-5" />
                    API 连接测试
                  </CardTitle>
                  {expandedSection === 'api-test' ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </CardHeader>
              
              <AnimatePresence>
                {expandedSection === 'api-test' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    <CardContent className="space-y-4">
                      <Button
                        onClick={runAPITests}
                        disabled={isRunningTests}
                        className="w-full"
                      >
                        {isRunningTests ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Play className="w-4 h-4 mr-2" />
                        )}
                        运行API测试
                      </Button>

                      {testResults.length > 0 && (
                        <div className="space-y-2">
                          {testResults.map((result, index) => (
                            <div
                              key={index}
                              className={`flex items-center justify-between p-3 rounded-lg text-sm ${
                                result.result === 'success'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : result.result === 'failed'
                                    ? 'bg-red-50 text-red-700 border border-red-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {result.result === 'success' && <CheckCircle2 className="w-4 h-4" />}
                                {result.result === 'failed' && <AlertCircle className="w-4 h-4" />}
                                {result.result === 'pending' && <Loader2 className="w-4 h-4 animate-spin" />}
                                <span className="font-medium">{result.test}</span>
                              </div>
                              <span className="text-xs">{result.message}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>

            {/* 示例项目选择 */}
            <Card>
              <CardHeader
                className="cursor-pointer"
                onClick={() => toggleSection('projects')}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Rocket className="w-5 h-5" />
                    示例项目
                  </CardTitle>
                  {expandedSection === 'projects' ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </CardHeader>
              
              <AnimatePresence>
                {(expandedSection === 'projects' || expandedSection === '') && (
                  <motion.div
                    initial={{ height: expandedSection === '' ? 'auto' : 0, opacity: expandedSection === '' ? 1 : 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    <CardContent className="space-y-3">
                      {Object.entries(sampleProjects).map(([key, project]) => (
                        <button
                          key={key}
                          onClick={() => setSelectedProject(key as keyof typeof sampleProjects)}
                          className={cn(
                            "w-full p-3 rounded-lg border text-left transition-all",
                            selectedProject === key
                              ? theme === 'light'
                                ? "border-emerald-300 bg-emerald-50"
                                : "border-emerald-600 bg-emerald-900/20"
                              : theme === 'light'
                                ? "border-gray-200 hover:border-gray-300"
                                : "border-gray-700 hover:border-gray-600"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-sm">{project.name}</h4>
                              <p className="text-xs text-gray-500">{project.description}</p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {project.files.length} 文件
                            </Badge>
                          </div>
                        </button>
                      ))}
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>

            {/* 自定义代码 */}
            <Card>
              <CardHeader
                className="cursor-pointer"
                onClick={() => toggleSection('custom-code')}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Code2 className="w-5 h-5" />
                    自定义代码
                  </CardTitle>
                  {expandedSection === 'custom-code' ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </CardHeader>
              
              <AnimatePresence>
                {expandedSection === 'custom-code' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    <CardContent className="space-y-4">
                      <Textarea
                        value={customCode}
                        onChange={(e) => setCustomCode(e.target.value)}
                        placeholder="输入自定义React代码..."
                        className="font-mono text-sm h-32"
                      />
                      <Button
                        onClick={() => {
                          // 这里可以实现自定义代码的部署
                          console.log('部署自定义代码:', customCode);
                        }}
                        disabled={!customCode.trim()}
                        className="w-full"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        部署自定义代码
                      </Button>
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>

            {/* 错误信息 */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-red-50 border border-red-200 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="font-medium text-red-700">错误</span>
                </div>
                <p className="text-sm text-red-600 mt-1">{error}</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={clearError}
                  className="mt-2 text-red-600 border-red-300 hover:bg-red-50"
                >
                  清除错误
                </Button>
              </motion.div>
            )}
          </div>

          {/* 🖥️ 右侧预览区 */}
          <div className="lg:col-span-8">
            <Card className="h-[800px] overflow-hidden">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="w-5 h-5" />
                    实时预览
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {currentProject.name}
                    </Badge>
                    {currentProject.files.length > 0 && (
                      <Button
                        size="sm"
                        onClick={deployProject}
                        className="bg-brand-gradient hover:opacity-90"
                      >
                        <Sparkles className="w-3 h-3 mr-2" />
                        部署预览
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="h-[calc(800px-88px)] p-0">
                {currentProject.files.length > 0 ? (
                  <E2BSandboxPreview
                    files={currentProject.files}
                    projectName={currentProject.name}
                    description={currentProject.description}
                    enableAutoRefresh={true}
                    onPreviewReady={(url) => {
                      console.log('✅ 预览就绪:', url);
                    }}
                    onLoadingChange={(loading) => {
                      console.log('📊 加载状态:', loading);
                    }}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 bg-gray-200 rounded-2xl flex items-center justify-center mx-auto">
                        <FileText className="w-8 h-8 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-lg font-medium text-gray-700">选择项目开始预览</p>
                        <p className="text-sm text-gray-500">从左侧选择一个示例项目或输入自定义代码</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* 🎛️ 控制面板 */}
      <SandboxControlPanel
        isOpen={showControlPanel}
        onClose={() => setShowControlPanel(false)}
        onSandboxChange={(sandbox) => {
          console.log('沙盒状态变更:', sandbox);
        }}
      />
    </div>
  );
}
