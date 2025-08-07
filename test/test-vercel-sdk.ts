/**
 * Vercel SDK 简化测试
 * 测试 SDK 基本初始化和连接
 */

import { Vercel } from '@vercel/sdk';

// 使用你提供的 token
const VERCEL_TOKEN = 'VsTSn8HMgbKmRoGZ27GP8wXX';

export function createVercelInstance() {
  try {
    const vercel = new Vercel({
      bearerToken: VERCEL_TOKEN,
    });
    
    console.log('✅ Vercel SDK 初始化成功');
    console.log('📋 Token 已配置:', VERCEL_TOKEN.substring(0, 8) + '...');
    
    return vercel;
  } catch (error) {
    console.error('❌ Vercel SDK 初始化失败:', error);
    throw error;
  }
}

export async function testBasicConnection() {
  console.log('🧪 测试 Vercel SDK 基本连接...\n');
  
  try {
    const vercel = createVercelInstance();
    
    // 尝试最简单的 API 调用
    console.log('📡 尝试获取部署信息...');
    
    // 这是一个简单的测试调用
    const deployments = await vercel.deployments.getDeployments({
      limit: 1,
    });
    
    console.log('✅ API 调用成功！');
    console.log('📊 响应数据结构:', Object.keys(deployments));
    
    return true;
  } catch (error) {
    console.error('❌ API 调用失败:', error);
    
    // 检查错误类型
    if (error instanceof Error) {
      console.log('错误消息:', error.message);
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        console.log('💡 提示: Token 可能无效或权限不足');
      }
    }
    
    return false;
  }
}

// 用于你的预览服务的工厂函数
export function createVercelPreviewService() {
  const vercel = createVercelInstance();
  
  return {
    vercel,
    async testDeployment() {
      console.log('🚀 测试部署功能...');
      // 这里可以添加你的部署测试逻辑
      return true;
    }
  };
}

// 如果直接运行此文件，则执行测试
if (require.main === module) {
  testBasicConnection();
} 