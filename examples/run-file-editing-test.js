/**
 * 文件编辑功能测试运行脚本
 * 使用 Node.js 直接运行测试
 */

const fs = require('fs').promises;
const path = require('path');

class SimpleFileEditingTest {
  constructor() {
    this.testDir = path.join(__dirname, 'test-output');
  }

  async ensureTestDir() {
    try {
      await fs.mkdir(this.testDir, { recursive: true });
    } catch (error) {
      // 目录已存在，忽略
    }
  }

  async createFile(filename, content) {
    const filePath = path.join(this.testDir, filename);
    await fs.writeFile(filePath, content, 'utf8');
    console.log(`✅ 创建文件: ${filename}`);
  }

  async readFile(filename) {
    const filePath = path.join(this.testDir, filename);
    const content = await fs.readFile(filePath, 'utf8');
    console.log(`📖 读取文件: ${filename}`);
    return content;
  }

  async editFile(filename, oldContent, newContent) {
    const filePath = path.join(this.testDir, filename);
    let content = await fs.readFile(filePath, 'utf8');
    
    if (!content.includes(oldContent)) {
      throw new Error(`未找到要替换的内容: ${oldContent}`);
    }

    content = content.replace(oldContent, newContent);
    await fs.writeFile(filePath, content, 'utf8');
    
    console.log(`🔧 编辑成功: ${filename}`);
    console.log(`   替换: ${oldContent.substring(0, 30)}...`);
    console.log(`   为: ${newContent.substring(0, 30)}...`);
  }

  async appendToFile(filename, content) {
    const filePath = path.join(this.testDir, filename);
    await fs.appendFile(filePath, content, 'utf8');
    console.log(`➕ 追加内容: ${filename}`);
  }

  async showFile(filename) {
    const content = await this.readFile(filename);
    console.log(`\n📄 [${filename}] 内容:`);
    console.log('─'.repeat(50));
    console.log(content);
    console.log('─'.repeat(50));
  }

  async runTest() {
    console.log('🚀 开始文件编辑功能测试\n');

    await this.ensureTestDir();

    try {
      // 测试1：创建和编辑React组件
      console.log('🧪 测试1：React组件编辑');
      
      const buttonComponent = `import React, { useState } from 'react';

export function Button({ children, onClick }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = () => {
    onClick?.();
  };

  return (
    <button
      onClick={handleClick}
      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
    >
      {children}
    </button>
  );
}`;

      await this.createFile('Button.jsx', buttonComponent);
      await this.showFile('Button.jsx');

      // 编辑1：添加动画状态
      console.log('\n🔧 步骤1：添加动画状态');
      await this.editFile(
        'Button.jsx',
        'const [isLoading, setIsLoading] = useState(false);',
        `const [isLoading, setIsLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);`
      );

      // 编辑2：修改点击处理
      console.log('\n🔧 步骤2：修改点击处理函数');
      await this.editFile(
        'Button.jsx',
        `const handleClick = () => {
    onClick?.();
  };`,
        `const handleClick = () => {
    setIsAnimating(true);
    onClick?.();
    setTimeout(() => setIsAnimating(false), 300);
  };`
      );

      // 编辑3：修改颜色
      console.log('\n🔧 步骤3：修改按钮颜色');
      await this.editFile(
        'Button.jsx',
        'bg-blue-500 hover:bg-blue-600',
        'bg-green-500 hover:bg-green-600'
      );

      await this.showFile('Button.jsx');

      // 测试2：CSS文件编辑
      console.log('\n🧪 测试2：CSS文件编辑');
      
      const cssContent = `.button {
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-size: 14px;
}

.button-primary {
  background-color: #3b82f6;
  color: white;
}

.button-primary:hover {
  background-color: #2563eb;
}`;

      await this.createFile('button.css', cssContent);
      await this.showFile('button.css');

      // 编辑CSS：修改颜色
      console.log('\n🎨 修改CSS颜色');
      await this.editFile(
        'button.css',
        'background-color: #3b82f6;',
        'background-color: #10b981;'
      );

      await this.editFile(
        'button.css',
        'background-color: #2563eb;',
        'background-color: #059669;'
      );

      // 添加动画
      console.log('\n✨ 添加CSS动画');
      await this.appendToFile('button.css', `

.button-animated {
  transition: all 0.2s ease;
  transform: scale(1);
}

.button-animated:hover {
  transform: scale(1.05);
}

.button-animated:active {
  transform: scale(0.95);
}`);

      await this.showFile('button.css');

      console.log('\n✅ 所有测试完成！');
      console.log(`📁 测试文件保存在: ${this.testDir}`);
      console.log('💡 你可以查看生成的文件来验证编辑结果');

    } catch (error) {
      console.error('\n❌ 测试失败:', error.message);
    }
  }
}

// 运行测试
const test = new SimpleFileEditingTest();
test.runTest().catch(console.error);
