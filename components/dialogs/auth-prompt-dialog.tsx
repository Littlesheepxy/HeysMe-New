'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  Lock, 
  MessageSquare,
  Sparkles,
  LogIn
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AuthPromptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  action?: string;
  onLoginSuccess?: () => void;
}

export function AuthPromptDialog({ 
  isOpen, 
  onClose,
  title = "需要登录",
  message = "请先登录您的账户来继续使用聊天功能",
  action = "发送消息",
  onLoginSuccess
}: AuthPromptDialogProps) {
  const router = useRouter();

  const handleLogin = () => {
    // 保存当前页面路径和待执行的操作
    const currentPath = window.location.pathname + window.location.search;
    const redirectUrl = `/sign-in?redirect_url=${encodeURIComponent(currentPath)}`;
    
    // 如果有待执行的操作，保存到sessionStorage
    if (onLoginSuccess) {
      sessionStorage.setItem('heysme_pending_action', 'continue_chat');
      sessionStorage.setItem('heysme_pending_callback', 'true');
    }
    
    // 跳转到登录页面
    router.push(redirectUrl);
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-center justify-center">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <span>{title}</span>
          </DialogTitle>
          <DialogDescription className="text-center pt-2">
            {message}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 功能说明 */}
          <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
            <MessageSquare className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              登录后您可以：
              <ul className="mt-2 space-y-1 text-sm">
                <li className="flex items-center gap-2">
                  <Sparkles className="w-3 h-3" />
                  与AI助手进行智能对话
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="w-3 h-3" />
                  保存聊天历史记录
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="w-3 h-3" />
                  创建个性化页面
                </li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* 操作按钮 */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              稍后再说
            </Button>
            <Button
              onClick={handleLogin}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
            >
              <LogIn className="w-4 h-4 mr-2" />
              立即登录
            </Button>
          </div>

          {/* 注册提示 */}
          <div className="text-center text-sm text-muted-foreground">
            还没有账户？{' '}
            <button
              onClick={() => router.push('/sign-up')}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
            >
              立即注册
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 