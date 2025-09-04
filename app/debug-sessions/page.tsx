'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, RefreshCw, FileText, Database, GitBranch, Info } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SessionData {
  id: string;
  metadata?: any;
  conversationHistory?: any[];
  status?: string;
  created_at?: string;
}

interface ProjectData {
  project_id: string;
  name: string;
  session_id: string;
  total_files: number;
  total_commits: number;
  created_at: string;
  actual_files: number;
  file_list?: string;
}

interface VersionData {
  version: string;
  commitId: string;
  timestamp: number;
  filesCount: number;
  filesTypes: string[];
  commitMessage: string;
  isDeployed?: boolean;
  deploymentUrl?: string;
  files?: any[];
}

export default function DebugSessionsPage() {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [selectedSessionVersions, setSelectedSessionVersions] = useState<{[key: string]: VersionData[]}>({});
  const [expandedSessions, setExpandedSessions] = useState<{[key: string]: boolean}>({});
  const [expandedVersions, setExpandedVersions] = useState<{[key: string]: boolean}>({});
  const [loading, setLoading] = useState(false);

  // 获取会话数据
  const fetchSessions = async () => {
    try {
      setLoading(true);
      console.log('🔍 [调试页面] 开始获取会话数据...');
      
      const response = await fetch('/api/debug/sessions');
      console.log('🔍 [调试页面] API响应状态:', response.status, response.statusText);
      
      if (response.ok) {
        const result = await response.json();
        console.log('🔍 [调试页面] API响应数据:', result);
        
        if (result.success && result.data) {
          const { sessions: sessionData, projects: projectData } = result.data;
          
          // 处理会话数据，确保有基本字段
          const processedSessions = (sessionData || []).map((session: any) => ({
            id: session.id,
            metadata: session.metadata || {},
            status: session.status || 'unknown',
            created_at: session.created_at || new Date().toISOString()
          }));
          
          // 处理项目数据，确保有基本字段
          const processedProjects = (projectData || []).map((project: any) => ({
            project_id: project.project_id,
            name: project.name || `项目-${project.project_id}`,
            session_id: project.session_id,
            total_files: Number(project.total_files) || 0,
            total_commits: Number(project.total_commits) || 0,
            created_at: project.created_at || new Date().toISOString(),
            actual_files: Number(project.actual_files) || 0,
            file_list: project.file_list || ''
          }));
          
          setSessions(processedSessions);
          setProjects(processedProjects);
          
          console.log('✅ [调试页面] 数据设置成功:', {
            sessions: processedSessions.length,
            projects: processedProjects.length,
            sessionsWithProjects: processedSessions.filter((s: SessionData) => 
              processedProjects.some((p: ProjectData) => p.session_id === s.id)
            ).length
          });
        } else {
          console.error('❌ [调试页面] API响应格式错误:', result);
          throw new Error(result.error || '数据格式错误');
        }
      } else {
        const errorText = await response.text();
        console.error('❌ [调试页面] API请求失败:', response.status, errorText);
        throw new Error(`API请求失败: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ [调试页面] 获取会话数据失败:', error);
      
      // 显示错误信息给用户
      setSessions([]);
      setProjects([]);
      
      // 可选：显示一个错误提示
      alert(`获取数据失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  // 获取会话版本信息
  const fetchSessionVersions = async (sessionId: string, userId: string = 'user_2xnasVlkxajkwjF2d4JXl8tOQBI') => {
    try {
      console.log(`🔍 [版本获取] 开始获取会话版本: ${sessionId}`);
      const response = await fetch(`/api/session-project?sessionId=${sessionId}&userId=${userId}&action=versions`);
      console.log(`🔍 [版本获取] API响应状态: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`🔍 [版本获取] API响应数据:`, data);
        
        if (data.success && data.data && data.data.versions) {
          console.log(`✅ [版本获取] 获取到${data.data.versions.length}个版本`);
          setSelectedSessionVersions(prev => ({
            ...prev,
            [sessionId]: data.data.versions || []
          }));
          return data.data.versions;
        } else {
          console.warn(`⚠️ [版本获取] API返回格式异常:`, data);
        }
      } else {
        const errorText = await response.text();
        console.error(`❌ [版本获取] API请求失败: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('❌ [版本获取] 获取版本信息失败:', error);
    }
    return [];
  };

  // 获取特定版本的文件
  const fetchVersionFiles = async (sessionId: string, version: string, userId: string = 'user_2xnasVlkxajkwjF2d4JXl8tOQBI') => {
    try {
      const response = await fetch(`/api/session-project?sessionId=${sessionId}&userId=${userId}&action=version-files&version=${version}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          return data.data || [];
        }
      }
    } catch (error) {
      console.error('获取版本文件失败:', error);
    }
    return [];
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // 自动获取有项目但没有版本信息的会话的版本数据
  useEffect(() => {
    console.log('🔄 [版本自动获取] 检查需要获取版本的会话...', {
      sessionsCount: sessions.length,
      projectsCount: projects.length,
      versionCacheKeys: Object.keys(selectedSessionVersions)
    });

    sessions.forEach(session => {
      const sessionProjects = projects.filter(p => p.session_id === session.id);
      const versions = selectedSessionVersions[session.id];
      
      console.log(`🔍 [版本检查] 会话 ${session.id}:`, {
        projectCount: sessionProjects.length,
        hasVersions: !!versions,
        versionCount: versions?.length || 0
      });
      
      // 如果有项目但没有版本信息，异步获取
      if (sessionProjects.length > 0 && !versions) {
        console.log(`🚀 [版本获取] 自动获取会话版本: ${session.id}`);
        fetchSessionVersions(session.id).catch(error => {
          console.error(`❌ [版本获取] 获取会话 ${session.id} 版本信息失败:`, error);
        });
      }
    });
  }, [sessions, projects, selectedSessionVersions]);

  const toggleSession = async (sessionId: string) => {
    const wasExpanded = expandedSessions[sessionId];
    
    setExpandedSessions(prev => ({
      ...prev,
      [sessionId]: !prev[sessionId]
    }));

    // 如果展开且还没有获取版本信息，则获取
    if (!wasExpanded && !selectedSessionVersions[sessionId]) {
      console.log(`🔄 [会话展开] 自动获取版本信息: ${sessionId}`);
      await fetchSessionVersions(sessionId);
    }
  };

  const toggleVersion = async (sessionId: string, version: string) => {
    const versionKey = `${sessionId}-${version}`;
    setExpandedVersions(prev => ({
      ...prev,
      [versionKey]: !prev[versionKey]
    }));

    // 如果展开且还没有文件数据，则获取
    const versions = selectedSessionVersions[sessionId];
    const versionData = versions?.find(v => v.version === version);
    if (!expandedVersions[versionKey] && versionData && !versionData.files) {
      const files = await fetchVersionFiles(sessionId, version);
      
      // 更新版本数据包含文件信息
      setSelectedSessionVersions(prev => ({
        ...prev,
        [sessionId]: prev[sessionId].map(v => 
          v.version === version ? { ...v, files } : v
        )
      }));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🔍 会话和文件调试器</h1>
          <p className="text-muted-foreground mt-2">
            查看每个对话的ID、项目关联、版本历史和文件详情
          </p>
        </div>
        <Button onClick={fetchSessions} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          刷新数据
        </Button>
      </div>

      {/* 总览统计 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">会话总数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{sessions.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">项目总数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{projects.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">总文件数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {projects.reduce((sum, p) => sum + p.actual_files, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 临时项目总览 */}
      {projects.some(p => p.session_id.startsWith('temp-session-')) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">⚠️ 临时项目分析</CardTitle>
            <CardDescription>
              这些项目是由增量模式或其他工具创建的临时项目，可能包含重要文件
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects
                .filter(p => p.session_id.startsWith('temp-session-'))
                .slice(0, 6) // 只显示前6个
                .map((project) => (
                  <div key={project.project_id} className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <div className="font-medium text-sm">{project.name}</div>
                    <div className="text-xs text-muted-foreground font-mono mb-2">{project.session_id}</div>
                    <div className="text-xs">
                      📁 {project.actual_files} 个文件 | 📝 {project.total_commits} 次提交
                    </div>
                    {project.file_list && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        {project.file_list.length > 60 
                          ? `${project.file_list.substring(0, 60)}...` 
                          : project.file_list
                        }
                      </div>
                    )}
                  </div>
                ))}
            </div>
            {projects.filter(p => p.session_id.startsWith('temp-session-')).length > 6 && (
              <div className="mt-3 text-sm text-muted-foreground text-center">
                还有 {projects.filter(p => p.session_id.startsWith('temp-session-')).length - 6} 个临时项目未显示...
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 会话详情 */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">📋 会话详情</h2>
        
        {sessions.map((session) => {
          const sessionProjects = projects.filter(p => p.session_id === session.id);
          const versions = selectedSessionVersions[session.id] || [];
          const isExpanded = expandedSessions[session.id];
          
          return (
            <Card key={session.id} className="w-full">
              <Collapsible open={isExpanded} onOpenChange={() => toggleSession(session.id)}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                        <div>
                          <CardTitle className="text-lg">
                            {session.metadata?.title || session.metadata?.name || '未命名会话'}
                          </CardTitle>
                          <CardDescription className="font-mono text-sm">{session.id}</CardDescription>
                          <div className="text-xs text-muted-foreground mt-1">
                            创建时间: {session.created_at ? new Date(session.created_at).toLocaleString() : '未知'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={session.status === 'active' ? 'default' : 'secondary'}>
                          {session.status || 'unknown'}
                        </Badge>
                        <Badge variant="outline">
                          {sessionProjects.length} 个项目
                        </Badge>
                        <Badge variant="outline">
                          {versions.length} 个版本
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    {/* 项目信息 */}
                    <div className="mb-6">
                      <h4 className="text-lg font-medium mb-3 flex items-center">
                        <Database className="w-4 h-4 mr-2" />
                        关联项目 ({sessionProjects.length})
                      </h4>
                      {sessionProjects.length > 0 ? (
                        <div className="space-y-2">
                          {sessionProjects.map((project) => {
                            const isTemporary = project.session_id.startsWith('temp-session-');
                            const hasFilesMismatch = project.actual_files !== project.total_files;
                            
                            return (
                              <div key={project.project_id} className={`p-3 rounded-lg ${
                                isTemporary ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800' : 'bg-muted'
                              }`}>
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="flex items-center space-x-2">
                                      <div className="font-medium">{project.name}</div>
                                      {isTemporary && (
                                        <Badge variant="outline" className="text-xs bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200">
                                          临时项目
                                        </Badge>
                                      )}
                                      {hasFilesMismatch && (
                                        <Badge variant="outline" className="text-xs bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200">
                                          统计不一致
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="text-sm text-muted-foreground font-mono">{project.project_id}</div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-sm">
                                      文件: <span className={hasFilesMismatch ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
                                        {project.actual_files}/{project.total_files}
                                      </span> | 
                                      提交: {project.total_commits}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {new Date(project.created_at).toLocaleString()}
                                    </div>
                                  </div>
                                </div>
                                {project.file_list && (
                                  <div className="mt-2 text-sm text-muted-foreground">
                                    <span className="font-medium">项目总文件:</span> {project.file_list}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-muted-foreground italic">此会话暂无关联项目</div>
                      )}
                    </div>

                    {/* 版本历史 */}
                    <div>
                      <h4 className="text-lg font-medium mb-3 flex items-center">
                        <GitBranch className="w-4 h-4 mr-2" />
                        版本历史 ({versions.length})
                      </h4>
                      {versions.length > 0 ? (
                        <div className="space-y-2">
                          {versions.map((version) => {
                            const versionKey = `${session.id}-${version.version}`;
                            const isVersionExpanded = expandedVersions[versionKey];
                            
                            return (
                              <Card key={version.version} className="bg-muted/30">
                                <Collapsible open={isVersionExpanded} onOpenChange={() => toggleVersion(session.id, version.version)}>
                                  <CollapsibleTrigger asChild>
                                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                          {isVersionExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                          <div>
                                            <div className="font-medium">{version.version}</div>
                                            <div className="text-sm text-muted-foreground">
                                              {version.commitMessage}
                                            </div>
                                          </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <Badge variant="outline">{version.filesCount} 文件</Badge>
                                          <Badge variant="outline">
                                            {new Date(version.timestamp).toLocaleString()}
                                          </Badge>
                                          {version.isDeployed && (
                                            <Badge variant="default">已部署</Badge>
                                          )}
                                        </div>
                                      </div>
                                    </CardHeader>
                                  </CollapsibleTrigger>
                                  
                                  <CollapsibleContent>
                                    <CardContent className="pt-0">
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                          <h5 className="font-medium mb-2">版本信息</h5>
                                          <div className="space-y-1 text-sm">
                                            <div>提交ID: <code className="text-xs">{version.commitId}</code></div>
                                            <div>文件数量: {version.filesCount}</div>
                                            <div>文件类型: {version.filesTypes.join(', ')}</div>
                                            {version.deploymentUrl && (
                                              <div>部署地址: <a href={version.deploymentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{version.deploymentUrl}</a></div>
                                            )}
                                          </div>
                                        </div>
                                        
                                        <div>
                                          <h5 className="font-medium mb-2">版本文件 (累积)</h5>
                                          {version.version === 'V1' && version.filesCount === 0 ? (
                                            <div className="p-3 bg-muted/50 rounded text-sm text-muted-foreground">
                                              <div className="flex items-center space-x-2">
                                                <Info className="w-4 h-4" />
                                                <span>V1 是初始版本，只包含项目创建提交，暂无代码文件</span>
                                              </div>
                                            </div>
                                          ) : version.files ? (
                                            <ScrollArea className="h-40">
                                              <div className="space-y-1">
                                                {version.files.map((file: any, index: number) => (
                                                  <div key={index} className="p-2 bg-background rounded border text-xs">
                                                    <div className="flex items-center justify-between">
                                                      <span className="font-mono">{file.filename}</span>
                                                      <Badge variant="outline" className="text-xs">
                                                        {file.language}
                                                      </Badge>
                                                    </div>
                                                    <div className="text-muted-foreground mt-1">
                                                      {file.content?.length || 0} 字符 | {file.change_type}
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            </ScrollArea>
                                          ) : (
                                            <div className="text-muted-foreground italic">点击展开加载文件详情...</div>
                                          )}
                                        </div>
                                      </div>
                                    </CardContent>
                                  </CollapsibleContent>
                                </Collapsible>
                              </Card>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-muted-foreground italic">此会话暂无版本历史</div>
                      )}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>

      {sessions.length === 0 && !loading && (
        <Card>
          <CardContent className="py-8 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">暂无会话数据</p>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
}
