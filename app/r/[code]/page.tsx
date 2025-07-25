/**
 * 短链接重定向页面
 * 路径: /r/[code]
 * 
 * 功能：
 * - 解析短链接码
 * - 验证访问权限（密码、过期时间等）
 * - 重定向到实际页面
 * - 记录访问统计
 */

import { redirect, notFound } from 'next/navigation';
import { Suspense } from 'react';
import { createServerClient } from '@/lib/supabase-server';
import { PasswordForm } from '@/components/forms/password-form';
// import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface PageProps {
  params: {
    code: string;
  };
  searchParams: {
    password?: string;
  };
}

export default async function ShortLinkRedirectPage({ params, searchParams }: PageProps) {
  const { code } = params;
  const { password } = searchParams;

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
      <ShortLinkHandler code={code} password={password} />
    </Suspense>
  );
}

async function ShortLinkHandler({ code, password }: { code: string; password?: string }) {
  try {
    const supabase = createServerClient();
    
    // 查找分享记录
    const { data: share, error: shareError } = await supabase
      .from('page_shares')
      .select(`
        *,
        pages (
          id,
          slug,
          title,
          theme,
          layout,
          visibility,
          users (
            username,
            full_name
          )
        )
      `)
      .eq('short_code', code)
      .single();

    if (shareError || !share) {
      return <NotFoundPage />;
    }

    // 检查页面是否存在
    if (!share.pages) {
      return <NotFoundPage />;
    }

    // 检查是否过期
    if (share.expires_at && new Date(share.expires_at) < new Date()) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">链接已过期</h1>
            <p className="text-gray-600 mb-6">
              该分享链接已于 {new Date(share.expires_at).toLocaleDateString()} 过期
            </p>
            <p className="text-sm text-gray-500">
              请联系页面作者获取新的分享链接
            </p>
          </div>
        </div>
      );
    }

    // 检查密码
    if (share.password && share.password !== password) {
      return <PasswordForm code={code} pageTitle={share.pages.title} />;
    }

    // 记录访问统计
    if (share.enable_analytics) {
      // 异步记录，不阻塞重定向
      recordVisit(share.id).catch(console.error);
    }

    // 重定向到实际页面
    redirect(`/p/${share.pages.slug}`);

  } catch (error) {
    console.error('处理短链接失败:', error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">访问出错</h1>
          <p className="text-gray-600 mb-6">
            处理您的请求时出现了问题，请稍后重试
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }
}

/**
 * 记录访问统计
 */
async function recordVisit(shareId: string) {
  try {
    const supabase = createServerClient();
    
    // 记录访问日志
    await supabase
      .from('page_share_analytics')
      .insert({
        share_id: shareId,
        visitor_ip: 'server-side', // 服务端无法直接获取客户端IP
        user_agent: 'server-side',
        visited_at: new Date().toISOString(),
      });

    // 更新访问次数
    const { data: currentShare } = await supabase
      .from('page_shares')
      .select('view_count')
      .eq('id', shareId)
      .single();

    await supabase
      .from('page_shares')
      .update({ 
        view_count: (currentShare?.view_count || 0) + 1,
        last_accessed_at: new Date().toISOString()
      })
      .eq('id', shareId);

  } catch (error) {
    console.error('记录访问统计失败:', error);
  }
}

/**
 * 404页面
 */
export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="text-gray-400 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">链接不存在</h1>
        <p className="text-gray-600 mb-6">
          该分享链接不存在或已被删除
        </p>
        <a 
          href="/"
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          返回首页
        </a>
      </div>
    </div>
  );
} 