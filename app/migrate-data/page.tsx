'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, Database, FileText, Users, Clock, AlertTriangle, RefreshCw } from 'lucide-react';

interface MigrationProgress {
  total: number;
  completed: number;
  current?: string;
}

interface MigrationResult {
  success: boolean;
  total: number;
  successCount: number;
  failedCount: number;
  report: string;
}

interface SystemCheck {
  supabaseConnection: boolean;
  databaseTables: boolean;
  userExists: boolean;
  storageReady: boolean;
}

interface EnvironmentStatus {
  ready: boolean;
  checks: SystemCheck;
  message: string;
  recommendations?: string[];
}

export default function MigrateDataPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<MigrationProgress>({ total: 0, completed: 0 });
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [step, setStep] = useState<'ready' | 'migrating' | 'completed'>('ready');
  const [envStatus, setEnvStatus] = useState<EnvironmentStatus | null>(null);
  const [checkingEnv, setCheckingEnv] = useState(true);

  // 检查环境状态
  useEffect(() => {
    checkEnvironment();
  }, []);

  const checkEnvironment = async () => {
    setCheckingEnv(true);
    try {
      const response = await fetch('/api/migrate-sessions/setup');
      const data = await response.json();
      setEnvStatus(data);
    } catch (error) {
      console.error('环境检查失败:', error);
      setEnvStatus({
        ready: false,
        checks: {
          supabaseConnection: false,
          databaseTables: false,
          userExists: false,
          storageReady: false
        },
        message: '环境检查失败',
        recommendations: ['检查网络连接', '确保 API 服务正常运行']
      });
    } finally {
      setCheckingEnv(false);
    }
  };

  const handleMigrate = async () => {
    setIsLoading(true);
    setStep('migrating');
    setProgress({ total: 0, completed: 0 });

    try {
      const response = await fetch('/api/migrate-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: false })
      });

      if (!response.ok) {
        throw new Error('迁移请求失败');
      }

      // 使用 Server-Sent Events 获取实时进度
      const eventSource = new EventSource('/api/migrate-sessions/progress');
      
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'progress') {
          setProgress({
            total: data.total,
            completed: data.completed,
            current: data.current
          });
        } else if (data.type === 'complete') {
          setResult(data.result);
          setStep('completed');
          eventSource.close();
        } else if (data.type === 'error') {
          throw new Error(data.error);
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        throw new Error('连接中断');
      };

    } catch (error) {
      console.error('迁移失败:', error);
      setResult({
        success: false,
        total: 0,
        successCount: 0,
        failedCount: 0,
        report: `迁移失败: ${error instanceof Error ? error.message : '未知错误'}`
      });
      setStep('completed');
    } finally {
      setIsLoading(false);
    }
  };

  const progressPercentage = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Database className="h-8 w-8 text-blue-600" />
          会话数据迁移工具
        </h1>
        <p className="text-muted-foreground">
          将现有的会话项目文件迁移到 Supabase 存储系统
        </p>
      </div>

      {/* 系统状态检查 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {checkingEnv ? (
              <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
            ) : envStatus?.ready ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-red-600" />
            )}
            系统状态检查
          </CardTitle>
          <CardDescription>
            {checkingEnv ? '正在检查系统环境...' : envStatus?.message}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {checkingEnv ? (
            <div className="text-center py-4">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">检查环境配置中...</p>
            </div>
          ) : envStatus ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Supabase 连接</span>
                  <Badge variant={envStatus.checks.supabaseConnection ? "default" : "destructive"}>
                    {envStatus.checks.supabaseConnection ? '正常' : '失败'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-purple-600" />
                  <span className="text-sm">数据库表</span>
                  <Badge variant={envStatus.checks.databaseTables ? "default" : "destructive"}>
                    {envStatus.checks.databaseTables ? '已准备' : '缺失'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-orange-600" />
                  <span className="text-sm">用户认证</span>
                  <Badge variant={envStatus.checks.userExists ? "default" : "destructive"}>
                    {envStatus.checks.userExists ? '已登录' : '未认证'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-green-600" />
                  <span className="text-sm">存储服务</span>
                  <Badge variant={envStatus.checks.storageReady ? "default" : "destructive"}>
                    {envStatus.checks.storageReady ? '可用' : '不可用'}
                  </Badge>
                </div>
              </div>
              
              {!envStatus.ready && envStatus.recommendations && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="mt-2">
                      <p className="font-semibold mb-2">修复建议：</p>
                      <ul className="text-xs space-y-1">
                        {envStatus.recommendations.map((rec, index) => (
                          <li key={index}>• {rec}</li>
                        ))}
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="flex gap-2">
                <Button 
                  onClick={checkEnvironment} 
                  variant="outline" 
                  size="sm"
                  disabled={checkingEnv}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${checkingEnv ? 'animate-spin' : ''}`} />
                  重新检查
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <XCircle className="h-6 w-6 text-red-600 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">环境检查失败</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 迁移说明 */}
      <Card>
        <CardHeader>
          <CardTitle>🔄 迁移说明</CardTitle>
          <CardDescription>
            这个工具会将存储在会话 metadata 中的项目文件迁移到 Supabase 数据库
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold">迁移内容：</h4>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• 会话中的 projectFiles 数据</li>
              <li>• 文件内容和元数据</li>
              <li>• 创建对应的项目和提交记录</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold">安全特性：</h4>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• 只迁移未迁移过的会话</li>
              <li>• 支持断点续传</li>
              <li>• 原始数据保持不变</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* 迁移控制 */}
      {step === 'ready' && (
        <Card>
          <CardHeader>
            <CardTitle>开始迁移</CardTitle>
            <CardDescription>
              点击下方按钮开始迁移过程。这可能需要几分钟时间。
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!envStatus?.ready ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  系统环境检查未通过，请先解决上述问题后再开始迁移。
                </AlertDescription>
              </Alert>
            ) : (
              <Button 
                onClick={handleMigrate} 
                disabled={isLoading || !envStatus?.ready}
                className="w-full"
                size="lg"
              >
                {isLoading ? '正在准备...' : '🚀 开始迁移'}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* 迁移进度 */}
      {step === 'migrating' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 animate-spin" />
              正在迁移...
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>进度</span>
                <span>{progress.completed} / {progress.total}</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
              <div className="text-xs text-muted-foreground">
                {progress.current && `当前处理: ${progress.current}`}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 迁移结果 */}
      {step === 'completed' && result && (
        <div className="space-y-4">
          <Alert>
            <div className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription>
                {result.success 
                  ? `迁移完成！成功处理 ${result.successCount} 个会话，失败 ${result.failedCount} 个`
                  : '迁移过程中遇到错误'
                }
              </AlertDescription>
            </div>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>📊 迁移报告</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={result.report}
                readOnly
                className="min-h-[300px] font-mono text-xs"
              />
            </CardContent>
          </Card>

          <Button 
            onClick={() => {
              setStep('ready');
              setResult(null);
              setProgress({ total: 0, completed: 0 });
            }}
            variant="outline"
            className="w-full"
          >
            重新开始
          </Button>
        </div>
      )}

      {/* 帮助信息 */}
      <Card>
        <CardHeader>
          <CardTitle>❓ 常见问题</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <h4 className="font-semibold">Q: 需要创建新的存储桶吗？</h4>
            <p className="text-muted-foreground">A: 不需要。文件直接存储在数据库中，只有大文件才会使用存储桶。</p>
          </div>
          <div>
            <h4 className="font-semibold">Q: 迁移是否安全？</h4>
            <p className="text-muted-foreground">A: 是的。迁移过程不会删除原始数据，只是复制到新的存储系统。</p>
          </div>
          <div>
            <h4 className="font-semibold">Q: 迁移失败怎么办？</h4>
            <p className="text-muted-foreground">A: 可以重新运行迁移，系统会跳过已成功迁移的数据。</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}