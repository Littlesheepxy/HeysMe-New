'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Bug, Database } from 'lucide-react';

export function DebugNav() {
  // 只在开发环境显示
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Link href="/debug-sessions">
        <Button variant="outline" size="sm" className="bg-background/80 backdrop-blur-sm">
          <Bug className="w-4 h-4 mr-2" />
          调试工具
        </Button>
      </Link>
    </div>
  );
}
