'use client';

import { useState } from 'react';

export default function TestVercelAIIncrementalPage() {
  const [userInput, setUserInput] = useState('请在 Button 组件中添加一个 onClick 处理函数，当点击时显示 alert');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testIncrementalEdit = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/test/vercel-ai-incremental', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userInput
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : '请求失败'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">🧪 Vercel AI 增量编辑测试</h1>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold text-blue-800 mb-2">测试说明</h2>
        <p className="text-blue-700">
          这个页面测试新的基于 Vercel AI SDK 的增量编辑功能，它替换了之前有 bug 的实现。
          测试会模拟一个包含 Button.tsx 和 index.tsx 的项目，然后执行增量修改。
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="userInput" className="block text-sm font-medium text-gray-700 mb-2">
            增量编辑指令：
          </label>
          <textarea
            id="userInput"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            placeholder="输入您的增量编辑需求..."
          />
        </div>

        <button
          onClick={testIncrementalEdit}
          disabled={loading || !userInput.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
        >
          {loading ? '🔄 测试中...' : '🚀 开始测试'}
        </button>
      </div>

      {result && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">测试结果</h2>
          
          {result.success ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <span className="text-green-600 text-lg">✅</span>
                <span className="ml-2 font-medium text-green-800">测试成功</span>
              </div>
              
              <div className="space-y-3 text-sm">
                <div>
                  <strong>响应数量：</strong> {result.data?.totalResponses}
                </div>
                
                {result.data?.finalResponse && (
                  <div>
                    <strong>最终状态：</strong> {result.data.finalResponse.system_state?.intent}
                  </div>
                )}

                {result.data?.finalResponse?.immediate_display?.reply && (
                  <div>
                    <strong>AI 回复：</strong>
                    <div className="mt-2 p-3 bg-white border rounded text-gray-700">
                      {result.data.finalResponse.immediate_display.reply}
                    </div>
                  </div>
                )}

                {result.data?.finalResponse?.system_state?.metadata?.modifiedFiles?.length > 0 && (
                  <div>
                    <strong>修改的文件：</strong>
                    <ul className="mt-2 list-disc list-inside text-gray-600">
                      {result.data.finalResponse.system_state.metadata.modifiedFiles.map((file: any, index: number) => (
                        <li key={index}>{file.filename}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <details className="mt-4">
                  <summary className="cursor-pointer font-medium text-blue-600 hover:text-blue-800">
                    查看完整响应数据
                  </summary>
                  <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-96">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </details>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <span className="text-red-600 text-lg">❌</span>
                <span className="ml-2 font-medium text-red-800">测试失败</span>
              </div>
              
              <div className="text-sm text-red-700">
                <strong>错误信息：</strong> {result.error}
              </div>

              {result.stack && (
                <details className="mt-3">
                  <summary className="cursor-pointer font-medium text-red-600 hover:text-red-800">
                    查看错误堆栈
                  </summary>
                  <pre className="mt-2 p-3 bg-red-100 rounded text-xs overflow-auto max-h-96">
                    {result.stack}
                  </pre>
                </details>
              )}
            </div>
          )}
        </div>
      )}

      <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-800 mb-2">🔧 技术说明</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• 使用 Vercel AI SDK 的 generateText 和多步骤工具调用</li>
          <li>• 支持 create_file、edit_file、read_file、list_files 工具</li>
          <li>• 自动检测文件语言类型和项目结构</li>
          <li>• 智能的错误处理和用户反馈</li>
          <li>• 替换了之前有 bug 的增量编辑实现</li>
        </ul>
      </div>
    </div>
  );
}
