import React from 'react';

export default function Hero() {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-blue-500 text-xl font-bold mb-4">
          欢迎使用HeysMe
        </h1>
        <p className="text-lg text-gray-300 mb-8">
          这是一个用于测试增量修改的示例项目
        </p>
        <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors">
          开始使用
        </button>
      </div>
    </div>
  );
}
