import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  message?: string;
}

export function LoadingSpinner({ 
  size = 'md', 
  className,
  message = '加载中...' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={cn(
      'flex flex-col items-center justify-center space-y-4',
      className
    )}>
      <div className={cn(
        'border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin',
        sizeClasses[size]
      )} />
      {message && (
        <p className="text-sm text-gray-600 animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
}

export function FullPageLoadingSpinner({ message = '加载中...' }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <LoadingSpinner size="lg" message={message} />
    </div>
  );
} 