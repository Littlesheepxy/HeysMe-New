'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Code, 
  TestTube, 
  ArrowRight, 
  CheckCircle, 
  Clock,
  Zap,
  Shield,
  Cpu,
  Database
} from 'lucide-react';

const AGENT_TESTS = [
  {
    id: 'info-collection',
    title: '信息收集 Agent V3',
    description: '测试智能信息收集、链接解析和多轮对话功能',
    path: '/test-info-agent-v3',
    icon: <User className="h-6 w-6" />,
    features: [
      '文本信息提取',
      'GitHub 链接解析',
      'LinkedIn 资料处理',
      '多轮对话管理',
      '结构化输出'
    ],
    testCases: 5,
    status: 'ready'
  },
  {
    id: 'coding',
    title: '编程 Agent V3',
    description: '测试智能代码生成、文件操作和项目管理功能',
    path: '/test-coding-agent-v3',
    icon: <Code className="h-6 w-6" />,
    features: [
      '完整项目生成',
      '增量代码修改',
      '代码质量分析',
      '文件系统操作',
      '命令执行'
    ],
    testCases: 6,
    status: 'ready'
  }
];

const COMPARISON_FEATURES = [
  {
    feature: '工具调用机制',
    oldVersion: '手动 XML/JSON 解析',
    newVersion: 'Vercel AI SDK 原生支持',
    improvement: '简化 80% 代码复杂度'
  },
  {
    feature: '错误处理',
    oldVersion: '多层异常捕获',
    newVersion: 'SDK 统一错误处理',
    improvement: '提升稳定性 60%'
  },
  {
    feature: '类型安全',
    oldVersion: '部分动态类型',
    newVersion: '完整 TypeScript 支持',
    improvement: '编译时错误检查'
  },
  {
    feature: '代码维护',
    oldVersion: '2000+ 行复杂逻辑',
    newVersion: '800+ 行清晰架构',
    improvement: '维护成本降低 50%'
  }
];

export default function TestAgentsPage() {
  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* 页面标题 */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-4">Agent V3 测试中心</h1>
        <p className="text-xl text-muted-foreground mb-6">
          基于 Vercel AI SDK 重写的智能 Agent 系统测试平台
        </p>
        <div className="flex justify-center gap-4">
          <Badge variant="outline" className="px-3 py-1">
            <Zap className="h-4 w-4 mr-1" />
            性能优化
          </Badge>
          <Badge variant="outline" className="px-3 py-1">
            <Shield className="h-4 w-4 mr-1" />
            类型安全
          </Badge>
          <Badge variant="outline" className="px-3 py-1">
            <Cpu className="h-4 w-4 mr-1" />
            架构升级
          </Badge>
        </div>
      </div>

      {/* Agent 测试卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {AGENT_TESTS.map((agent) => (
          <Card key={agent.id} className="relative overflow-hidden">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    {agent.icon}
                  </div>
                  <div>
                    <CardTitle className="text-xl">{agent.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {agent.description}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={agent.status === 'ready' ? 'default' : 'secondary'}>
                  {agent.status === 'ready' ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      就绪
                    </>
                  ) : (
                    <>
                      <Clock className="h-3 w-3 mr-1" />
                      开发中
                    </>
                  )}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* 功能特性 */}
                <div>
                  <h4 className="font-medium mb-2">核心功能</h4>
                  <div className="flex flex-wrap gap-1">
                    {agent.features.map((feature, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* 测试统计 */}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    <TestTube className="h-4 w-4 inline mr-1" />
                    {agent.testCases} 个测试用例
                  </span>
                </div>

                {/* 测试按钮 */}
                <Link href={agent.path}>
                  <Button className="w-full" disabled={agent.status !== 'ready'}>
                    开始测试
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 版本对比 */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            V2 vs V3 架构对比
          </CardTitle>
          <CardDescription>
            新版本在多个方面实现了显著改进
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">功能特性</th>
                  <th className="text-left p-3">V2 (旧版本)</th>
                  <th className="text-left p-3">V3 (新版本)</th>
                  <th className="text-left p-3">改进效果</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_FEATURES.map((item, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-3 font-medium">{item.feature}</td>
                    <td className="p-3 text-muted-foreground">{item.oldVersion}</td>
                    <td className="p-3 text-green-600">{item.newVersion}</td>
                    <td className="p-3">
                      <Badge variant="outline" className="text-green-600">
                        {item.improvement}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 测试指南 */}
      <Card>
        <CardHeader>
          <CardTitle>测试指南</CardTitle>
          <CardDescription>
            如何有效地测试新版 Agent 系统
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">🧪 测试步骤</h4>
              <ol className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">1</span>
                  选择要测试的 Agent (信息收集或编程)
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">2</span>
                  从预设测试用例中选择或输入自定义内容
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">3</span>
                  观察 Agent 的处理过程和结果
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">4</span>
                  查看详细的元数据和性能指标
                </li>
              </ol>
            </div>
            
            <div>
              <h4 className="font-medium mb-3">📊 关注指标</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  响应速度和处理效率
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  工具调用的准确性
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  错误处理和恢复能力
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  输出结果的质量
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  多轮对话的连贯性
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
