"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { oneTimeMigration, MigrationResult } from '@/lib/utils/one-time-migration';
import { CheckCircle, AlertCircle, Database, Upload, Trash2, Search } from 'lucide-react';

export default function MigrateDataPage() {
  const [scanning, setScanning] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [localSessions, setLocalSessions] = useState<any[]>([]);
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);
  const [hasScanned, setHasScanned] = useState(false);

  const handleScan = async () => {
    setScanning(true);
    try {
      const sessions = oneTimeMigration.scan();
      setLocalSessions(sessions);
      setHasScanned(true);
      console.log('扫描到的会话:', sessions);
    } catch (error) {
      console.error('扫描失败:', error);
    } finally {
      setScanning(false);
    }
  };

  const handleMigrate = async () => {
    setMigrating(true);
    try {
      const result = await oneTimeMigration.migrate();
      setMigrationResult(result);
      
      if (result.success) {
        // 迁移成功后重新扫描
        setLocalSessions([]);
      }
    } catch (error) {
      console.error('迁移失败:', error);
    } finally {
      setMigrating(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">数据迁移工具</h1>
          <p className="text-muted-foreground">
            一次性将本地存储的会话数据迁移到数据库
          </p>
        </div>

        {/* 扫描本地数据 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              扫描本地数据
            </CardTitle>
            <CardDescription>
              检查浏览器本地存储中是否有会话数据需要迁移
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleScan} 
              disabled={scanning}
              className="w-full"
            >
              {scanning ? '扫描中...' : '开始扫描'}
            </Button>

            {hasScanned && (
              <Alert>
                <Database className="w-4 h-4" />
                <AlertDescription>
                  {localSessions.length > 0 
                    ? `找到 ${localSessions.length} 个本地会话需要迁移`
                    : '没有找到需要迁移的本地数据'
                  }
                </AlertDescription>
              </Alert>
            )}

            {/* 显示找到的会话 */}
            {localSessions.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">找到的会话:</h4>
                <div className="grid gap-2 max-h-60 overflow-y-auto">
                  {localSessions.map((session, index) => (
                    <div key={session.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex-1">
                        <div className="font-mono text-sm">{session.id}</div>
                        <div className="text-xs text-muted-foreground">
                          {session.conversationHistory?.length || 0} 条对话记录
                        </div>
                      </div>
                      <Badge variant="secondary">会话 {index + 1}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 执行迁移 */}
        {localSessions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                执行迁移
              </CardTitle>
              <CardDescription>
                将本地会话数据保存到数据库
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={handleMigrate} 
                disabled={migrating}
                className="w-full"
              >
                {migrating ? '迁移中...' : `迁移 ${localSessions.length} 个会话`}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 迁移结果 */}
        {migrationResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {migrationResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
                迁移结果
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className={migrationResult.success ? 'border-green-200' : 'border-red-200'}>
                <AlertDescription>
                  {migrationResult.message}
                </AlertDescription>
              </Alert>

              {migrationResult.success && (
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 border rounded">
                    <div className="text-2xl font-bold text-green-600">
                      {migrationResult.migratedCount}
                    </div>
                    <div className="text-sm text-muted-foreground">已迁移</div>
                  </div>
                  <div className="p-3 border rounded">
                    <div className="text-2xl font-bold text-yellow-600">
                      {migrationResult.skippedCount}
                    </div>
                    <div className="text-sm text-muted-foreground">已跳过</div>
                  </div>
                  <div className="p-3 border rounded">
                    <div className="text-2xl font-bold text-red-600">
                      {migrationResult.errorCount}
                    </div>
                    <div className="text-sm text-muted-foreground">错误</div>
                  </div>
                </div>
              )}

              {migrationResult.errors && migrationResult.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-red-600">错误详情:</h4>
                  <div className="space-y-1">
                    {migrationResult.errors.map((error, index) => (
                      <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {migrationResult.success && migrationResult.migratedCount > 0 && (
                <Alert className="border-green-200">
                  <CheckCircle className="w-4 h-4" />
                  <AlertDescription>
                    迁移完成！您现在可以在聊天界面的侧边栏中看到您之前的所有对话记录。
                    本地存储已被清理。
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* 说明信息 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              重要说明
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• 这是一次性迁移工具，迁移完成后您的对话记录将保存在数据库中</p>
            <p>• 迁移成功后，本地存储的数据将被自动清理</p>
            <p>• 已存在的会话不会被重复迁移</p>
            <p>• 只有包含对话记录的会话才会被迁移</p>
            <p>• 迁移完成后，请访问 <a href="/chat" className="text-primary underline">/chat</a> 查看您的对话记录</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}