import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ClerkProvider } from "@clerk/nextjs"
import { ThemeProvider } from "@/contexts/theme-context"
import { StagewiseToolbar } from "@stagewise/toolbar-next"
import ReactPlugin from "@stagewise-plugins/react"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  metadataBase: new URL('https://heysme.app'),
  title: "HeysMe - AI 驱动的职业身份平台",
  description: "通过多轮智能对话，为你生成个性化的职业主页",
  keywords: "HeysMe, AI, 职业主页, 个人品牌, 智能生成",
  authors: [{ name: "HeysMe Team" }],
  openGraph: {
    title: "HeysMe - AI 驱动的职业身份平台",
    description: "通过多轮智能对话，为你生成个性化的职业主页",
    url: "https://HeysMe.app",
    siteName: "HeysMe",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "HeysMe - AI 驱动的职业身份平台",
      },
    ],
    locale: "zh_CN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "HeysMe - AI 驱动的职业身份平台",
    description: "通过多轮智能对话，为你生成个性化的职业主页",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="zh-CN" suppressHydrationWarning>
        <body className={inter.className}>
          <ThemeProvider>
            {children}
            <Toaster />
            {/* 只在开发环境显示 stagewise 工具栏，并添加样式隔离 */}
            {process.env.NODE_ENV === 'development' && (
              <div style={{ isolation: 'isolate', zIndex: 9999 }}>
                <StagewiseToolbar 
                  config={{
                    plugins: [ReactPlugin]
                  }}
                />
              </div>
            )}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
