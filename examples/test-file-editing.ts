/**
 * 文件编辑功能测试脚本
 * 可以实际运行和测试文件编辑功能
 */

import { promises as fs } from 'fs';
import path from 'path';

// 模拟的工具执行器
export class TestFileEditingExecutor {
  private testDir = path.join(process.cwd(), 'test-files');

  constructor() {
    this.ensureTestDir();
  }

  /**
   * 确保测试目录存在
   */
  private async ensureTestDir() {
    try {
      await fs.mkdir(this.testDir, { recursive: true });
    } catch (error) {
      // 目录已存在，忽略错误
    }
  }

  /**
   * 创建测试文件
   */
  async createTestFile(filename: string, content: string): Promise<void> {
    const filePath = path.join(this.testDir, filename);
    await fs.writeFile(filePath, content, 'utf8');
    console.log(`✅ 创建测试文件: ${filename}`);
  }

  /**
   * 读取文件内容
   */
  async readFile(filename: string): Promise<string> {
    const filePath = path.join(this.testDir, filename);
    try {
      const content = await fs.readFile(filePath, 'utf8');
      console.log(`📖 读取文件: ${filename}`);
      return content;
    } catch (error) {
      console.error(`❌ 读取文件失败: ${filename}`, error);
      throw error;
    }
  }

  /**
   * 编辑文件 - 替换内容
   */
  async editFileReplace(filename: string, oldContent: string, newContent: string): Promise<void> {
    const filePath = path.join(this.testDir, filename);
    try {
      let content = await fs.readFile(filePath, 'utf8');
      
      if (!content.includes(oldContent)) {
        throw new Error(`未找到要替换的内容: ${oldContent}`);
      }

      content = content.replace(oldContent, newContent);
      await fs.writeFile(filePath, content, 'utf8');
      
      console.log(`🔧 替换成功: ${filename}`);
      console.log(`   旧内容: ${oldContent.substring(0, 50)}...`);
      console.log(`   新内容: ${newContent.substring(0, 50)}...`);
    } catch (error) {
      console.error(`❌ 编辑文件失败: ${filename}`, error);
      throw error;
    }
  }

  /**
   * 编辑文件 - 追加内容
   */
  async editFileAppend(filename: string, content: string): Promise<void> {
    const filePath = path.join(this.testDir, filename);
    try {
      await fs.appendFile(filePath, content, 'utf8');
      console.log(`➕ 追加内容成功: ${filename}`);
    } catch (error) {
      console.error(`❌ 追加内容失败: ${filename}`, error);
      throw error;
    }
  }

  /**
   * 显示文件内容
   */
  async showFileContent(filename: string): Promise<void> {
    try {
      const content = await this.readFile(filename);
      console.log(`\n📄 文件内容 [${filename}]:`);
      console.log('─'.repeat(50));
      console.log(content);
      console.log('─'.repeat(50));
    } catch (error) {
      console.error(`❌ 无法显示文件内容: ${filename}`);
    }
  }

  /**
   * 清理测试文件
   */
  async cleanup(): Promise<void> {
    try {
      await fs.rmdir(this.testDir, { recursive: true });
      console.log('🧹 清理测试文件完成');
    } catch (error) {
      console.warn('⚠️ 清理测试文件时出现问题:', error);
    }
  }
}

// 测试用例
export const testCases = {
  
  /**
   * 测试1：基础文件编辑
   */
  async testBasicEditing() {
    console.log('\n🧪 测试1：基础文件编辑');
    const executor = new TestFileEditingExecutor();

    try {
      // 创建测试组件
      const buttonComponent = `'use client';

import React, { useState } from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
}

export function Button({ children, onClick, variant = 'primary' }: ButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = () => {
    onClick?.();
  };

  return (
    <button
      onClick={handleClick}
      className={\`px-4 py-2 rounded \${
        variant === 'primary' 
          ? 'bg-blue-500 hover:bg-blue-600 text-white' 
          : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
      }\`}
    >
      {children}
    </button>
  );
}`;

      await executor.createTestFile('Button.tsx', buttonComponent);
      await executor.showFileContent('Button.tsx');

      // 测试替换：添加动画状态
      console.log('\n🔧 添加动画状态...');
      await executor.editFileReplace(
        'Button.tsx',
        'const [isLoading, setIsLoading] = useState(false);',
        `const [isLoading, setIsLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);`
      );

      // 测试替换：修改点击处理函数
      console.log('\n🔧 修改点击处理函数...');
      await executor.editFileReplace(
        'Button.tsx',
        `const handleClick = () => {
    onClick?.();
  };`,
        `const handleClick = () => {
    setIsAnimating(true);
    onClick?.();
    setTimeout(() => setIsAnimating(false), 300);
  };`
      );

      // 测试替换：更新样式
      console.log('\n🔧 更新按钮样式...');
      await executor.editFileReplace(
        'Button.tsx',
        'bg-blue-500 hover:bg-blue-600',
        'bg-green-500 hover:bg-green-600'
      );

      await executor.showFileContent('Button.tsx');

    } catch (error) {
      console.error('❌ 测试失败:', error);
    }
  },

  /**
   * 测试2：工具函数添加
   */
  async testUtilityFunctions() {
    console.log('\n🧪 测试2：工具函数添加');
    const executor = new TestFileEditingExecutor();

    try {
      // 创建基础工具文件
      const utilsContent = `/**
 * 通用工具函数
 */

export function formatDate(date: Date): string {
  return date.toLocaleDateString('zh-CN');
}`;

      await executor.createTestFile('utils.ts', utilsContent);
      await executor.showFileContent('utils.ts');

      // 追加新的工具函数
      console.log('\n➕ 添加文件大小格式化函数...');
      const fileSizeFunction = `

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns 格式化后的文件大小字符串
 */
export function formatFileSize(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}`;

      await executor.editFileAppend('utils.ts', fileSizeFunction);

      // 追加相对时间函数
      console.log('\n➕ 添加相对时间格式化函数...');
      const relativeTimeFunction = `

/**
 * 格式化相对时间
 * @param date 日期对象或时间戳
 * @returns 相对时间字符串（如：2小时前）
 */
export function formatRelativeTime(date: Date | number): string {
  const now = new Date();
  const targetDate = typeof date === 'number' ? new Date(date) : date;
  const diffMs = now.getTime() - targetDate.getTime();
  
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) return \`\${diffDays}天前\`;
  if (diffHours > 0) return \`\${diffHours}小时前\`;
  if (diffMinutes > 0) return \`\${diffMinutes}分钟前\`;
  return '刚刚';
}`;

      await executor.editFileAppend('utils.ts', relativeTimeFunction);
      await executor.showFileContent('utils.ts');

    } catch (error) {
      console.error('❌ 测试失败:', error);
    }
  },

  /**
   * 测试3：CSS样式修改
   */
  async testCSSEditing() {
    console.log('\n🧪 测试3：CSS样式修改');
    const executor = new TestFileEditingExecutor();

    try {
      // 创建CSS文件
      const cssContent = `:root {
  --primary: 222.2 84% 4.9%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96%;
  --secondary-foreground: 222.2 84% 4.9%;
  --accent: 210 40% 96%;
  --accent-foreground: 222.2 84% 4.9%;
}

.button {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  transition: all 0.2s;
}

.button-primary {
  background-color: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
}

.button-primary:hover {
  opacity: 0.9;
}`;

      await executor.createTestFile('styles.css', cssContent);
      await executor.showFileContent('styles.css');

      // 修改主色调为绿色
      console.log('\n🎨 修改主色调为绿色...');
      await executor.editFileReplace(
        'styles.css',
        '--primary: 222.2 84% 4.9%;',
        '--primary: 142 76% 36%;'
      );

      await executor.editFileReplace(
        'styles.css',
        '--primary-foreground: 210 40% 98%;',
        '--primary-foreground: 355 100% 97%;'
      );

      // 添加动画效果
      console.log('\n✨ 添加按钮动画效果...');
      const animationCSS = `

.button-animated {
  transform: scale(1);
  transition: transform 0.2s ease;
}

.button-animated:active {
  transform: scale(0.95);
}

.button-animated:hover {
  transform: scale(1.05);
}`;

      await executor.editFileAppend('styles.css', animationCSS);
      await executor.showFileContent('styles.css');

    } catch (error) {
      console.error('❌ 测试失败:', error);
    }
  },

  /**
   * 运行所有测试
   */
  async runAllTests() {
    console.log('🚀 开始运行文件编辑功能测试\n');
    
    try {
      await this.testBasicEditing();
      await this.testUtilityFunctions();
      await this.testCSSEditing();
      
      console.log('\n✅ 所有测试完成！');
      console.log('\n📁 测试文件位置: test-files/');
      console.log('💡 你可以查看 test-files 目录中的文件来验证编辑结果');
      
    } catch (error) {
      console.error('\n❌ 测试过程中出现错误:', error);
    }
  }
};

// 如果直接运行此文件，执行测试
if (require.main === module) {
  testCases.runAllTests().catch(console.error);
}
