import { redirect } from 'next/navigation'

export default function AuthLoginPage({
  searchParams,
}: {
  searchParams: { redirect_url?: string }
}) {
  // 使用服务端重定向，避免客户端循环
  const redirectUrl = searchParams.redirect_url || '/dashboard'
  redirect(`/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`)
} 