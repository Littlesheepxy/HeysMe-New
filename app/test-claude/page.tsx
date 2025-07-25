"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

export default function TestClaudePage() {
  const [input, setInput] = useState('帮我生成一个马斯克的简历，风格参考特斯拉的官网')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 简化测试 - 使用短提示词
  const testSimpleClaudeAPI = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      console.log('🧪 开始简化测试 Claude API...')
      
      const { generateWithModel } = await import('@/lib/ai-models')
      
      const simplePrompt = `请生成一个简单的 Next.js 页面代码，要求：
1. 使用 TypeScript
2. 包含一个标题 "Hello World"
3. 使用 Tailwind CSS 样式

请直接返回代码，不需要解释。`

      console.log('🧪 简化提示词长度:', simplePrompt.length)
      console.log('🧪 开始调用 Claude API...')
      
      const apiResult = await generateWithModel(
        'claude',
        'claude-sonnet-4-20250514',
        [{ role: 'user', content: simplePrompt }],
        { maxTokens: 1000 }  // 使用较小的 token 限制
      )

      console.log('🧪 API 调用成功:', apiResult)
      
      const responseText = 'text' in apiResult ? apiResult.text : JSON.stringify(apiResult)
      
      setResult({
        success: true,
        responseLength: responseText.length,
        responsePreview: responseText.substring(0, 500),
        fullResponse: responseText
      })

    } catch (err) {
      console.error('🧪 API 调用失败:', err)
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  const testClaudeAPI = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      console.log('🧪 开始测试 Claude API...')
      
      // 动态导入 AI models
      const { generateWithModel } = await import('@/lib/ai-models')
      const { CODING_EXPERT_MODE_PROMPT } = await import('@/lib/prompts/coding')
      
      const fullPrompt = `${CODING_EXPERT_MODE_PROMPT}

## 🎯 用户需求：
${input}

## 📋 输出要求：
请生成一个完整的Next.js项目，包含以下文件：
1. package.json - 项目配置
2. tailwind.config.js - Tailwind配置  
3. tsconfig.json - TypeScript配置
4. app/layout.tsx - 应用布局
5. app/page.tsx - 主页面
6. app/globals.css - 全局样式
7. components/ui/button.tsx - Button组件
8. lib/utils.ts - 工具函数

请以JSON格式返回，每个文件包含filename、content、description、language字段。`

      console.log('🧪 提示词长度:', fullPrompt.length)
      console.log('🧪 开始调用 Claude API...')
      
      const apiResult = await generateWithModel(
        'claude',
        'claude-sonnet-4-20250514',
        [{ role: 'user', content: fullPrompt }],
        { maxTokens: 64000 }  // Claude 4 支持最多64K输出tokens
      )

      console.log('🧪 API 调用成功:', apiResult)
      
      const responseText = 'text' in apiResult ? apiResult.text : JSON.stringify(apiResult)
      
      setResult({
        success: true,
        responseLength: responseText.length,
        responsePreview: responseText.substring(0, 500),
        fullResponse: responseText
      })

    } catch (err) {
      console.error('🧪 API 调用失败:', err)
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Claude API 测试</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">测试输入：</label>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={3}
              className="w-full"
            />
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={testSimpleClaudeAPI} 
              disabled={loading}
              variant="outline"
              className="flex-1"
            >
              {loading ? '测试中...' : '简化测试'}
            </Button>
            
            <Button 
              onClick={testClaudeAPI} 
              disabled={loading}
              className="flex-1"
            >
              {loading ? '测试中...' : '完整测试'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">错误</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm text-red-600 whitespace-pre-wrap">
              {error}
            </pre>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">测试结果</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <strong>响应长度:</strong> {result.responseLength} 字符
            </div>
            
            <div>
              <strong>响应预览 (前500字符):</strong>
              <pre className="mt-2 p-4 bg-gray-100 rounded text-sm whitespace-pre-wrap">
                {result.responsePreview}
              </pre>
            </div>

            <details>
              <summary className="cursor-pointer font-medium">查看完整响应</summary>
              <pre className="mt-2 p-4 bg-gray-50 rounded text-xs whitespace-pre-wrap max-h-96 overflow-y-auto">
                {result.fullResponse}
              </pre>
            </details>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
