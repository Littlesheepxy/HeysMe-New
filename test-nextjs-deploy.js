/**
 * 测试 Vercel SDK 部署简单的 Next.js 项目
 */

// 加载环境变量
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { Vercel } from '@vercel/sdk';

// 模拟简单的 Next.js 项目文件
const nextjsFiles = [
  {
    filename: 'package.json',
    content: JSON.stringify({
      "name": "heysme-nextjs-test",
      "version": "1.0.0",
      "private": true,
      "scripts": {
        "dev": "next dev",
        "build": "next build",
        "start": "next start",
        "lint": "next lint"
      },
      "dependencies": {
        "next": "14.0.0",
        "react": "^18",
        "react-dom": "^18"
      },
      "engines": {
        "node": ">=18.17.0"
      }
    }, null, 2)
  },
  {
    filename: 'next.config.js',
    content: `/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    appDir: true,
  },
}

module.exports = nextConfig`
  },
  {
    filename: 'app/layout.js',
    content: `export const metadata = {
  title: 'HeysMe Next.js Test',
  description: 'Simple Next.js app deployed via Vercel SDK',
}

export default function RootLayout({ children }) {
  return (
    <html lang="zh">
      <body>{children}</body>
    </html>
  )
}`
  },
  {
    filename: 'app/page.js',
    content: `export default function Home() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <h1>🎉 HeysMe Next.js 测试</h1>
      <p>这是通过 Vercel SDK 部署的简单 Next.js 应用！</p>
      <div style={{ 
        background: '#f0f0f0', 
        padding: '1rem', 
        borderRadius: '8px',
        marginTop: '1rem' 
      }}>
        <h2>✅ 部署成功！</h2>
        <p>时间: ${new Date().toLocaleString()}</p>
        <p>版本: 1.0.0</p>
      </div>
      <div style={{ marginTop: '2rem' }}>
        <h3>🚀 技术栈:</h3>
        <ul>
          <li>Next.js 14</li>
          <li>React 18</li>
          <li>Vercel SDK</li>
          <li>HeysMe Platform</li>
        </ul>
      </div>
    </main>
  )
}`
  },
  {
    filename: 'app/api/hello/route.js',
    content: `export async function GET() {
  return Response.json({ 
    message: 'Hello from HeysMe Next.js API!',
    timestamp: new Date().toISOString(),
    status: 'success'
  })
}`
  },
  {
    filename: 'public/favicon.ico',
    content: '' // 简单的占位符
  }
];

async function testNextjsDeploy() {
  console.log('🚀 测试 Next.js 项目部署...\n');

  // 验证环境变量
  const bearerToken = process.env.VERCEL_TOKEN;
  if (!bearerToken) {
    console.error('❌ 错误: 请设置 VERCEL_TOKEN 环境变量');
    return;
  }

  console.log('✅ 环境变量检查通过');
  console.log('Token 存在:', !!bearerToken);
  console.log('Token 前缀:', bearerToken.substring(0, 10) + '...\n');

  try {
    // 创建 Vercel SDK 实例
    const vercel = new Vercel({
      bearerToken: bearerToken,
    });

    console.log('🔨 开始部署 Next.js 项目...\n');
    
    // 直接使用 Vercel SDK 创建部署
    const result = await vercel.deployments.createDeployment({
      teamId: process.env.VERCEL_TEAM_ID,
      slug: process.env.VERCEL_TEAM_SLUG,
      requestBody: {
        name: 'heysme-nextjs-test',
        files: nextjsFiles.map(file => ({
          file: file.filename,
          data: file.content,
        })),
        target: 'preview',
        gitMetadata: {
          remoteUrl: "https://github.com/heysme/nextjs-test",
          commitMessage: 'Test Next.js deployment from HeysMe SDK',
          commitRef: 'main',
          commitAuthorName: 'HeysMe Bot',
          commitAuthorEmail: 'bot@heysme.com',
          dirty: false,
        },
        projectSettings: {
          buildCommand: 'npm run build',
          installCommand: 'npm install',
        },
        meta: {
          framework: 'nextjs',
          source: 'heysme-test',
          version: '1.0.0',
        }
      }
    });

    console.log('\n🎉 部署成功！');
    console.log('━'.repeat(50));
    console.log('📋 部署详情:');
    console.log(`   ID: ${result.id}`);
    console.log(`   URL: https://${result.url}`);
    console.log(`   状态: ${result.readyState || 'BUILDING'}`);
    console.log(`   创建时间: ${new Date(result.createdAt || Date.now()).toLocaleString()}`);

    console.log('\n🌐 访问链接:');
    console.log(`   主页: https://${result.url}`);
    console.log(`   API: https://${result.url}/api/hello`);
    
    console.log('\n💡 提示: 点击上面的链接查看部署的 Next.js 应用！');

  } catch (error) {
    console.error('\n❌ 部署失败:');
    console.error('错误信息:', error.message);
    
    if (error.message.includes('403')) {
      console.error('\n🔍 403 错误可能的原因:');
      console.error('   - Token 权限不足');
      console.error('   - Token 已过期');
      console.error('   - 团队访问权限问题');
    } else if (error.message.includes('400')) {
      console.error('\n🔍 400 错误可能的原因:');
      console.error('   - 请求参数格式错误');
      console.error('   - 项目设置缺失或错误');
      console.error('   - 文件格式问题');
    }
    
    console.error('\n🔧 建议解决方案:');
    console.error('   1. 检查 Vercel Dashboard 中的 Token 状态');
    console.error('   2. 确保 Token 有足够的权限');
    console.error('   3. 检查项目名称是否符合规范');
  }
}

// 运行测试
testNextjsDeploy();