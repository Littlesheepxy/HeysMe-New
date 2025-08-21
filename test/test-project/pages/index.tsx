import React, { useState } from 'react';
import Hero from '../components/Hero';
import Button from '../components/Button';
import Card from '../components/Card';

export default function HomePage() {
  const [counter, setCounter] = useState(0);
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Hero />
      
      <main className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card 
            title="计数器示例" 
            description="测试useState钩子的使用"
          >
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800 mb-4">
                {counter}
              </p>
              <div className="space-x-2">
                <Button 
                  onClick={() => setCounter(counter + 1)}
                  size="sm"
                >
                  增加
                </Button>
                <Button 
                  onClick={() => setCounter(counter - 1)}
                  variant="secondary"
                  size="sm"
                >
                  减少
                </Button>
                <Button 
                  onClick={() => setCounter(0)}
                  variant="danger"
                  size="sm"
                >
                  重置
                </Button>
              </div>
            </div>
          </Card>

          <Card 
            title="模态框示例" 
            description="测试条件渲染和状态管理"
          >
            <div className="text-center">
              <Button onClick={() => setShowModal(true)}>
                打开模态框
              </Button>
              
              {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                  <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
                    <h3 className="text-lg font-semibold mb-4">
                      示例模态框
                    </h3>
                    <p className="text-gray-600 mb-6">
                      这是一个用于测试的模态框组件。
                    </p>
                    <div className="flex justify-end space-x-3">
                      <Button 
                        variant="secondary" 
                        onClick={() => setShowModal(false)}
                      >
                        取消
                      </Button>
                      <Button onClick={() => setShowModal(false)}>
                        确认
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card 
            title="功能展示" 
            description="各种组件和功能的演示"
          >
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 mb-2">按钮尺寸：</p>
                <div className="space-x-2">
                  <Button size="sm">小</Button>
                  <Button size="md">中</Button>
                  <Button size="lg">大</Button>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-600 mb-2">按钮变体：</p>
                <div className="space-x-2">
                  <Button variant="primary" size="sm">主要</Button>
                  <Button variant="secondary" size="sm">次要</Button>
                  <Button variant="danger" size="sm">危险</Button>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-600 mb-2">禁用状态：</p>
                <Button disabled size="sm">
                  禁用按钮
                </Button>
              </div>
            </div>
          </Card>
        </div>
        
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            HeysMe 测试项目
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            这是一个用于测试增量修改功能的示例项目。包含了各种常见的React组件和模式，
            可以用来测试AI代理的代码修改能力。
          </p>
        </div>
      </main>
      
      <footer className="bg-gray-800 text-white py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2024 HeysMe. 用于测试的示例项目。</p>
        </div>
      </footer>
    </div>
  );
}
