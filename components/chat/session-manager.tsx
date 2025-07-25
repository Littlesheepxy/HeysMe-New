"use client"

import { useState } from "react"
import { SessionData } from "@/lib/types/session"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  MessageSquare, 
  Trash2, 
  Clock, 
  Users, 
  CheckCircle, 
  AlertCircle,
  Pause,
  Plus
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { zhCN } from "date-fns/locale"

interface SessionManagerProps {
  sessions: SessionData[]
  currentSession: SessionData | null
  onSelectSession: (sessionId: string) => void
  onDeleteSession: (sessionId: string) => void
  onCreateNewSession: () => void
}

export function SessionManager({
  sessions,
  currentSession,
  onSelectSession,
  onDeleteSession,
  onCreateNewSession
}: SessionManagerProps) {
  const [showAll, setShowAll] = useState(false)

  const getStatusIcon = (status: SessionData['status']) => {
    switch (status) {
      case 'active':
        return <AlertCircle className="h-3 w-3 text-blue-500" />
      case 'completed':
        return <CheckCircle className="h-3 w-3 text-green-500" />
      case 'paused':
        return <Pause className="h-3 w-3 text-yellow-500" />
      case 'abandoned':
        return <AlertCircle className="h-3 w-3 text-gray-400" />
      default:
        return <AlertCircle className="h-3 w-3 text-gray-400" />
    }
  }

  const getStatusText = (status: SessionData['status']) => {
    switch (status) {
      case 'active':
        return '进行中'
      case 'completed':
        return '已完成'
      case 'paused':
        return '已暂停'
      case 'abandoned':
        return '已放弃'
      default:
        return '未知'
    }
  }

  const getProgressText = (session: SessionData) => {
    const stage = session.metadata.progress.currentStage
    const percentage = session.metadata.progress.percentage

    const stageNames: Record<string, string> = {
      'welcome': '意图识别',
      'info_collection': '信息收集',
      'prompt_output': '页面设计',
      'coding': '代码生成'
    }

    return `${stageNames[stage] || stage} (${percentage}%)`
  }

  const sessionsToShow = showAll ? sessions : sessions.slice(0, 5)

  return (
    <div className="border rounded-lg p-4 bg-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          会话管理
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={onCreateNewSession}
          className="gap-2"
        >
          <Plus className="h-3 w-3" />
          新建
        </Button>
      </div>

      <ScrollArea className="h-[400px] pr-4">
        {sessions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>暂无会话</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessionsToShow.map((session) => (
              <div
                key={session.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  currentSession?.id === session.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-muted/50'
                }`}
                onClick={() => onSelectSession(session.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(session.status)}
                    <span className="font-medium text-sm">
                      {session.userIntent.primary_goal || '创建个人页面'}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteSession(session.id)
                    }}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>

                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="text-xs">
                      {getStatusText(session.status)}
                    </Badge>
                    <span className="ml-1">{getProgressText(session)}</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(session.metadata.updatedAt, {
                        addSuffix: true,
                        locale: zhCN
                      })}
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {session.metadata.metrics.userInteractions} 交互
                    </div>
                  </div>

                  {session.metadata.metrics.errorsEncountered > 0 && (
                    <div className="flex items-center gap-1 text-red-500">
                      <AlertCircle className="h-3 w-3" />
                      {session.metadata.metrics.errorsEncountered} 错误
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {sessions.length > 5 && (
        <div className="mt-4 text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? '显示较少' : `显示全部 (${sessions.length})`}
          </Button>
        </div>
      )}
    </div>
  )
}

// 会话统计组件
export function SessionStats({ sessions }: { sessions: SessionData[] }) {
  const stats = {
    total: sessions.length,
    active: sessions.filter(s => s.status === 'active').length,
    completed: sessions.filter(s => s.status === 'completed').length,
    totalInteractions: sessions.reduce((sum, s) => sum + s.metadata.metrics.userInteractions, 0),
    totalErrors: sessions.reduce((sum, s) => sum + s.metadata.metrics.errorsEncountered, 0)
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
      <div className="text-center p-3 border rounded-lg">
        <div className="text-2xl font-bold">{stats.total}</div>
        <div className="text-xs text-muted-foreground">总会话</div>
      </div>
      <div className="text-center p-3 border rounded-lg">
        <div className="text-2xl font-bold text-blue-500">{stats.active}</div>
        <div className="text-xs text-muted-foreground">进行中</div>
      </div>
      <div className="text-center p-3 border rounded-lg">
        <div className="text-2xl font-bold text-green-500">{stats.completed}</div>
        <div className="text-xs text-muted-foreground">已完成</div>
      </div>
      <div className="text-center p-3 border rounded-lg">
        <div className="text-2xl font-bold">{stats.totalInteractions}</div>
        <div className="text-xs text-muted-foreground">总交互</div>
      </div>
      <div className="text-center p-3 border rounded-lg">
        <div className="text-2xl font-bold text-red-500">{stats.totalErrors}</div>
        <div className="text-xs text-muted-foreground">总错误</div>
      </div>
    </div>
  )
} 