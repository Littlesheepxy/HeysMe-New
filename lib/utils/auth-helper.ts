/**
 * 认证助手 - 兼容不同环境的认证状态检查
 */

import { auth } from '@clerk/nextjs/server';
import { currentUser } from '@clerk/nextjs/server';

/**
 * 检查是否在请求上下文中
 */
function isInRequestContext(): boolean {
  try {
    // 🔧 更准确的上下文检测：检查是否在服务端环境
    if (typeof window !== 'undefined') {
      // 客户端环境，不是请求上下文
      return false;
    }
    
    // 服务端环境，尝试访问Next.js的headers函数
    const { headers } = require('next/headers');
    headers(); // 尝试调用，如果成功说明在请求上下文中
    return true;
  } catch (error) {
    // 如果调用失败，说明不在请求上下文中
    return false;
  }
}

export interface AuthResult {
  userId: string | null;
  isAuthenticated: boolean;
  user?: any;
}

/**
 * 🔧 新增：客户端认证状态检查
 * 在客户端环境中使用，避免调用服务端认证函数
 */
export async function checkClientAuthStatus(): Promise<AuthResult> {
  // 客户端环境下，返回未认证状态
  // 实际的认证状态应该通过 useAuthCheck Hook 在组件中获取
  console.log('ℹ️ [认证助手] 客户端环境，请使用 useAuthCheck Hook');
  return { 
    userId: null, 
    isAuthenticated: false 
  };
}

/**
 * 通用认证状态检查
 * 兼容App Router和Pages Router环境
 */
export async function checkAuthStatus(): Promise<AuthResult> {
  // 🔧 客户端环境检查
  if (typeof window !== 'undefined') {
    console.log('ℹ️ [认证助手] 客户端环境，建议使用 useAuthCheck Hook');
    return checkClientAuthStatus();
  }
  
  // 🔧 服务端环境但非请求上下文
  if (!isInRequestContext()) {
    console.log('⚠️ [认证助手] 非请求上下文，跳过认证检查');
    return { 
      userId: null, 
      isAuthenticated: false 
    };
  }

  try {
    // 优先尝试使用 auth() - App Router
    const { userId } = await auth();
    
    if (userId) {
      return { 
        userId, 
        isAuthenticated: true 
      };
    }
    
    return { 
      userId: null, 
      isAuthenticated: false 
    };
    
  } catch (error) {
    console.warn('⚠️ [认证助手] auth()调用失败，尝试备选方案:', error);
    
    try {
      // 备选方案：使用 currentUser() 
      const user = await currentUser();
      
      if (user?.id) {
        return {
          userId: user.id,
          isAuthenticated: true,
          user
        };
      }
      
      return { 
        userId: null, 
        isAuthenticated: false 
      };
      
    } catch (fallbackError) {
      console.warn('⚠️ [认证助手] 备选认证方案也失败:', fallbackError);
      
      // 最终降级：返回未认证状态
      return { 
        userId: null, 
        isAuthenticated: false 
      };
    }
  }
}

/**
 * 🔧 新增：安全的认证状态检查
 * 根据环境自动选择合适的认证检查方式
 */
export async function safeCheckAuthStatus(): Promise<AuthResult> {
  try {
    if (typeof window !== 'undefined') {
      // 客户端环境
      return checkClientAuthStatus();
    } else {
      // 服务端环境
      return checkAuthStatus();
    }
  } catch (error) {
    console.warn('⚠️ [认证助手] 安全认证检查失败:', error);
    return { 
      userId: null, 
      isAuthenticated: false 
    };
  }
}

/**
 * 🔧 新增：临时用户ID生成（用于未登录用户）
 */
export function generateTemporaryUserId(): string {
  // 生成一个临时用户ID，用于未登录用户的会话管理
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `temp_user_${timestamp}_${random}`;
}

/**
 * 🔧 新增：获取或创建临时用户ID
 */
export function getOrCreateTemporaryUserId(): string {
  if (typeof window !== 'undefined') {
    // 客户端环境，使用localStorage存储
    let tempUserId = localStorage.getItem('heysme_temp_user_id');
    if (!tempUserId) {
      tempUserId = generateTemporaryUserId();
      localStorage.setItem('heysme_temp_user_id', tempUserId);
    }
    return tempUserId;
  } else {
    // 服务端环境，生成新的临时ID
    return generateTemporaryUserId();
  }
}

/**
 * 获取当前用户信息
 */
export async function getCurrentUser(): Promise<any | null> {
  try {
    const result = await safeCheckAuthStatus();
    return result.user || null;
  } catch (error) {
    console.warn('⚠️ [认证助手] 获取用户信息失败:', error);
    return null;
  }
}

/**
 * 检查是否为认证环境
 */
export function isAuthEnvironment(): boolean {
  try {
    // 检查环境变量是否配置
    return !!(
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && 
      process.env.CLERK_SECRET_KEY
    );
  } catch {
    return false;
  }
} 