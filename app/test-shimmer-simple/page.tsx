'use client';

import React from 'react';

export default function TestShimmerSimplePage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center mb-8">白光扫描效果测试</h1>
        
        {/* 测试1: 直接CSS动画 */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">测试1: 直接CSS动画</h2>
          <div className="relative inline-block overflow-hidden text-gray-700">
            正在为您生成个性化建议
            <div 
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0) 30%, rgba(255, 255, 255, 0.8) 50%, rgba(255, 255, 255, 0) 70%, transparent 100%)',
                width: '200%',
                height: '100%',
                left: '-100%',
                animation: 'white-shimmer 1.5s ease-in-out infinite'
              }}
            />
          </div>
        </div>

        {/* 测试2: 使用transform keyframes */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">测试2: 简化版</h2>
          <div 
            className="relative inline-block overflow-hidden text-gray-700"
          >
            正在分析您的选择，请稍候
            <div 
              className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/50 to-transparent"
              style={{
                animation: 'shimmer 2s infinite'
              }}
            />
          </div>
        </div>

        {/* 测试3: 优化后的深色背景效果 */}
        <div className="bg-gray-900 p-6 rounded-lg">
          <h2 className="text-lg font-semibold mb-4 text-white">测试3: 优化深色背景 (调整光照宽度)</h2>
          <div className="relative inline-block overflow-hidden text-gray-300">
            AI正在处理您的请求
            <div 
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0) 35%, rgba(255, 255, 255, 0.6) 50%, rgba(255, 255, 255, 0) 65%, transparent 100%)',
                width: '200%',
                height: '100%',
                left: '-100%',
                animation: 'white-shimmer 1.5s ease-in-out infinite'
              }}
            />
          </div>
        </div>

        {/* 测试4: 手动定义keyframes */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">测试4: 手动定义动画</h2>
          <style jsx>{`
            @keyframes manual-shimmer {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(100%); }
            }
            .manual-shimmer {
              animation: manual-shimmer 1.5s ease-in-out infinite;
            }
          `}</style>
          <div className="relative inline-block overflow-hidden text-gray-700">
            手动定义的白光扫描效果
            <div 
              className="absolute inset-0 manual-shimmer"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0) 30%, rgba(255, 255, 255, 0.8) 50%, rgba(255, 255, 255, 0) 70%, transparent 100%)',
                width: '200%',
                height: '100%',
                left: '-100%'
              }}
            />
          </div>
        </div>

        {/* 测试5: 最终优化效果 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border-2 border-green-200">
          <h2 className="text-lg font-semibold mb-4 text-green-800">✨ 最终优化效果 (类似ChatGPT)</h2>
          <div className="space-y-3">
            <div className="relative inline-block overflow-hidden text-gray-700">
              正在为您生成个性化建议
              <div 
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0) 35%, rgba(255, 255, 255, 0.7) 50%, rgba(255, 255, 255, 0) 65%, transparent 100%)',
                  width: '200%',
                  height: '100%',
                  left: '-100%',
                  animation: 'white-shimmer 1.5s ease-in-out infinite'
                }}
              />
            </div>
            <div className="relative inline-block overflow-hidden text-gray-700">
              正在分析您的选择，请稍候
              <div 
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0) 35%, rgba(255, 255, 255, 0.7) 50%, rgba(255, 255, 255, 0) 65%, transparent 100%)',
                  width: '200%',
                  height: '100%',
                  left: '-100%',
                  animation: 'white-shimmer 1.5s ease-in-out infinite'
                }}
              />
            </div>
          </div>
        </div>

        {/* 说明 */}
        <div className="bg-blue-50 p-6 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">测试结果总结：</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• ✅ 测试1：直接CSS动画 - 效果正常</li>
            <li>• ❌ 测试2：简化版 - 不动 (shimmer动画不存在)</li>
            <li>• ✅ 测试3：深色背景 - 已优化光照宽度</li>
            <li>• ✅ 测试4：手动定义动画 - 效果正常</li>
            <li>• ⭐ 测试5：最终优化版 - 完美!</li>
          </ul>
          <div className="mt-4 p-3 bg-green-100 rounded-lg">
            <p className="text-sm text-green-800">
              <strong>优化说明：</strong> 调整了光照渐变范围从30%-70%缩小到35%-65%，
              降低了透明度从0.8降到0.7，使效果更接近ChatGPT的自然白光扫描。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 