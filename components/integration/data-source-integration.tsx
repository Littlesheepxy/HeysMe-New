"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Upload, Link, Check } from "lucide-react"
import { DATA_SOURCES } from "@/lib/agents/data-collection-agent"
import { useTheme } from "@/contexts/theme-context"

interface DataSourceIntegrationProps {
  onDataIntegrated: (sourceId: string, data: any) => void
  className?: string
}

export function DataSourceIntegration({ onDataIntegrated, className = "" }: DataSourceIntegrationProps) {
  const { theme } = useTheme()
  const [selectedSource, setSelectedSource] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectedSources, setConnectedSources] = useState<string[]>([])

  const handleSourceSelect = async (sourceId: string) => {
    setSelectedSource(sourceId)
    setIsConnecting(true)

    try {
      // 模拟数据集成过程
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // 模拟获取的数据
      const mockData = generateMockData(sourceId)
      onDataIntegrated(sourceId, mockData)

      setConnectedSources((prev) => [...prev, sourceId])
      setSelectedSource(null)
    } catch (error) {
      console.error("数据集成失败:", error)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsConnecting(true)

    try {
      // 模拟文件处理
      await new Promise((resolve) => setTimeout(resolve, 3000))

      const mockResumeData = {
        fileName: file.name,
        content: "模拟简历内容解析结果",
        skills: ["JavaScript", "React", "Node.js"],
        experience: ["前端开发工程师 - 3年", "全栈开发工程师 - 2年"],
        education: ["计算机科学学士"],
      }

      onDataIntegrated("resume", mockResumeData)
      setConnectedSources((prev) => [...prev, "resume"])
    } catch (error) {
      console.error("文件上传失败:", error)
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <div className={`space-y-6 p-6 ${className}`}>
      <div className="text-center">
        <h3 className={`text-2xl font-bold mb-2 ${theme === "light" ? "text-gray-900" : "text-white"}`}>
          选择数据源
        </h3>
        <p className={`text-sm ${theme === "light" ? "text-emerald-600" : "text-emerald-400"}`}>
          连接你的数据源，让 AI 更好地了解你
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {DATA_SOURCES.map((source) => (
          <Card
            key={source.id}
            variant={connectedSources.includes(source.id) ? "brand" : "brand-outline"}
            className={`cursor-pointer transition-all duration-300 hover:scale-105 interactive-hover ${
              connectedSources.includes(source.id)
                ? "ring-2 ring-emerald-500 shadow-brand-lg"
                : selectedSource === source.id
                  ? "ring-2 ring-cyan-500 shadow-cyan-glow"
                  : "hover:shadow-brand"
            }`}
            onClick={() => {
              if (source.id === "resume") {
                document.getElementById("file-upload")?.click()
              } else {
                handleSourceSelect(source.id)
              }
            }}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{source.icon}</span>
                  <div>
                    <CardTitle className={`text-base ${theme === "light" ? "text-gray-900" : "text-white"}`}>
                      {source.name}
                    </CardTitle>
                    <p className={`text-sm ${theme === "light" ? "text-gray-600" : "text-gray-400"}`}>
                      {source.description}
                    </p>
                  </div>
                </div>
                {connectedSources.includes(source.id) ? (
                  <Check className="w-6 h-6 text-emerald-500" />
                ) : source.authRequired ? (
                  <Link className="w-6 h-6 text-cyan-500" />
                ) : (
                  <Upload className="w-6 h-6 text-emerald-400" />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Badge 
                  variant={source.authRequired ? "default" : "secondary"} 
                  className={`text-xs ${
                    source.authRequired 
                      ? "bg-cyan-100 text-cyan-700 border-cyan-200" 
                      : "bg-emerald-100 text-emerald-700 border-emerald-200"
                  }`}
                >
                  {source.authRequired ? "需要授权" : "直接使用"}
                </Badge>
                {isConnecting && selectedSource === source.id && (
                  <div className="flex items-center gap-2 text-sm text-emerald-600">
                    <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    连接中...
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 隐藏的文件上传输入 */}
      <input id="file-upload" type="file" accept=".pdf,.doc,.docx" onChange={handleFileUpload} className="hidden" />

      {/* 连接状态显示 */}
      {connectedSources.length > 0 && (
        <Card
          variant="brand"
          className="animate-brand-fade-up"
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                <Check className="w-5 h-5 text-emerald-600" />
              </div>
              <span className={`font-semibold ${theme === "light" ? "text-emerald-800" : "text-emerald-300"}`}>
                已连接的数据源
              </span>
            </div>
            <div className="flex flex-wrap gap-3">
              {connectedSources.map((sourceId) => {
                const source = DATA_SOURCES.find((s) => s.id === sourceId)
                return (
                  <Badge 
                    key={sourceId} 
                    className="text-sm bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-200 transition-colors"
                  >
                    <span className="mr-2">{source?.icon}</span>
                    {source?.name}
                  </Badge>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 底部提示 */}
      <div className={`text-center p-4 rounded-lg glass-brand`}>
        <p className={`text-sm ${theme === "light" ? "text-emerald-600" : "text-emerald-400"}`}>
          💡 连接数据源后，AI 将基于你的真实信息生成更准确的页面内容
        </p>
      </div>
    </div>
  )
}

// 生成模拟数据的辅助函数
function generateMockData(sourceId: string) {
  switch (sourceId) {
    case "linkedin":
      return {
        name: "张三",
        title: "高级前端工程师",
        company: "科技公司",
        location: "北京",
        connections: 500,
        skills: ["JavaScript", "React", "Vue.js", "Node.js"],
        experience: [
          {
            title: "高级前端工程师",
            company: "科技公司",
            duration: "2021-至今",
          },
        ],
      }

    case "github":
      return {
        username: "zhangsan",
        name: "张三",
        bio: "Full-stack developer passionate about web technologies",
        followers: 150,
        following: 80,
        repositories: 25,
        languages: ["JavaScript", "TypeScript", "Python"],
        topRepos: [
          { name: "awesome-project", stars: 120, language: "JavaScript" },
          { name: "react-components", stars: 85, language: "TypeScript" },
        ],
      }

    case "twitter":
      return {
        username: "@zhangsan",
        name: "张三",
        bio: "前端工程师 | 技术分享者",
        followers: 1200,
        following: 300,
        tweets: 450,
        topics: ["前端开发", "React", "JavaScript", "技术分享"],
      }

    default:
      return { message: `来自 ${sourceId} 的模拟数据` }
  }
}
