'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

interface AuthCheckResult {
  isAuthenticated: boolean;
  isLoading: boolean;
  userId: string | null;
  user: any;
}

/**
 * 客户端认证状态检查Hook
 * 基于Clerk的useUser Hook
 */
export function useAuthCheck(): AuthCheckResult {
  const { isLoaded, isSignedIn, user } = useUser();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isLoaded) {
      setIsLoading(false);
    }
  }, [isLoaded]);

  return {
    isAuthenticated: isSignedIn || false,
    isLoading: !isLoaded || isLoading,
    userId: user?.id || null,
    user: user || null,
  };
}

/**
 * 检查登录成功后的待执行操作
 */
export function usePendingAuthAction() {
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [hasPendingCallback, setHasPendingCallback] = useState(false);

  useEffect(() => {
    // 检查是否有待执行的操作
    const action = sessionStorage.getItem('heysme_pending_action');
    const callback = sessionStorage.getItem('heysme_pending_callback');
    
    if (action) {
      setPendingAction(action);
    }
    
    if (callback) {
      setHasPendingCallback(true);
    }
  }, []);

  const clearPendingAction = () => {
    sessionStorage.removeItem('heysme_pending_action');
    sessionStorage.removeItem('heysme_pending_callback');
    setPendingAction(null);
    setHasPendingCallback(false);
  };

  const executePendingAction = (callback?: () => void) => {
    if (pendingAction && hasPendingCallback) {
      // 清除待执行的操作
      clearPendingAction();
      
      // 执行回调
      if (callback) {
        callback();
      }
      
      return true;
    }
    return false;
  };

  return {
    pendingAction,
    hasPendingCallback,
    clearPendingAction,
    executePendingAction,
  };
} 