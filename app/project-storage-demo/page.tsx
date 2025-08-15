'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Database, 
  GitBranch, 
  FileText, 
  Clock, 
  User, 
  Code2,
  Package,
  ExternalLink,
  RefreshCw,
  Upload,
  Download
} from 'lucide-react';

interface ProjectInfo {
  id: string;
  name: string;
  description?: string;
  framework: string;
  status: string;
  deployment_url?: string;
  total_files: number;
  total_commits: number;
  created_at: string;
  updated_at: string;
}

interface CommitInfo {
  id: string;
  message: string;
  type: string;
  ai_agent?: string;
  user_prompt?: string;
  files_added: number;
  files_modified: number;
  files_deleted: number;
  created_at: string;
}

interface ProjectFile {
  id: string;
  filename: string;
  content: string;
  language: string;
  file_type: string;
  file_size: number;
  created_at: string;
}

export default function ProjectStorageDemoPage() {
  const [projects, setProjects] = useState<ProjectInfo[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectInfo | null>(null);
  const [commits, setCommits] = useState<CommitInfo[]>([]);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);

  // 模拟数据加载
  useEffect(() => {
    loadMockData();
  }, []);

  const loadMockData = () => {
    // 模拟项目数据
    const mockProjects: ProjectInfo[] = [
      {
        id: 'proj_1702123456_abc123',
        name: 'AI生成的电商网站',
        description: '基于用户需求生成的完整电商解决方案',
        framework: 'next.js',
        status: 'active',
        deployment_url: 'https://ai-ecommerce-demo.vercel.app',
        total_files: 12,
        total_commits: 5,
        created_at: '2024-01-15T10:30:00Z',
        updated_at: '2024-01-15T14:45:00Z'
      },
      {
        id: 'proj_1702123789_def456',
        name: '博客管理系统',
        description: 'AI助手生成的个人博客平台',
        framework: 'next.js',
        status: 'active',
        total_files: 8,
        total_commits: 3,
        created_at: '2024-01-14T09:15:00Z',
        updated_at: '2024-01-14T16:20:00Z'
      }
    ];

    // 模拟提交历史
    const mockCommits: CommitInfo[] = [
      {
        id: 'commit_1702123456_abc',
        message: '🤖 AI编辑: 修改主页标题颜色为绿色',
        type: 'ai_edit',
        ai_agent: 'CodingAgent',
        user_prompt: '修改主页标题颜色为绿色',
        files_added: 0,
        files_modified: 1,
        files_deleted: 0,
        created_at: '2024-01-15T14:45:00Z'
      },
      {
        id: 'commit_1702123400_bcd',
        message: '🤖 AI编辑: 添加购物车功能',
        type: 'ai_edit',
        ai_agent: 'CodingAgent',
        user_prompt: '添加购物车功能',
        files_added: 2,
        files_modified: 3,
        files_deleted: 0,
        created_at: '2024-01-15T13:30:00Z'
      },
      {
        id: 'commit_1702123300_cde',
        message: '🎉 Initial commit - Project created',
        type: 'initial',
        files_added: 12,
        files_modified: 0,
        files_deleted: 0,
        created_at: '2024-01-15T10:30:00Z'
      }
    ];

    // 模拟文件列表
    const mockFiles: ProjectFile[] = [
      {
        id: 'file_1702123456_001',
        filename: 'app/page.tsx',
        content: 'export default function HomePage() {\n  return (\n    <div className="text-green-600">\n      <h1>欢迎来到我们的网站</h1>\n    </div>\n  );\n}',
        language: 'typescript',
        file_type: 'page',
        file_size: 156,
        created_at: '2024-01-15T14:45:00Z'
      },
      {
        id: 'file_1702123456_002',
        filename: 'components/Header.tsx',
        content: 'export default function Header() {\n  return (\n    <header className="bg-white shadow">\n      <nav>导航栏</nav>\n    </header>\n  );\n}',
        language: 'typescript',
        file_type: 'component',
        file_size: 142,
        created_at: '2024-01-15T10:30:00Z'
      },
      {
        id: 'file_1702123456_003',
        filename: 'package.json',
        content: '{\n  "name": "ai-ecommerce",\n  "version": "1.0.0",\n  "dependencies": {\n    "next": "14.0.0",\n    "react": "18.0.0"\n  }\n}',
        language: 'json',
        file_type: 'config',
        file_size: 128,
        created_at: '2024-01-15T10:30:00Z'
      }
    ];

    setProjects(mockProjects);
    setSelectedProject(mockProjects[0]);
    setCommits(mockCommits);
    setFiles(mockFiles);
    
    // 模拟统计数据
    setStats({
      totalFiles: 12,
      totalCommits: 5,
      fileTypes: {
        page: 3,
        component: 5,
        config: 2,
        styles: 2
      }
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  const getFileTypeIcon = (fileType: string) => {
    switch (fileType) {
      case 'page': return '📄';
      case 'component': return '🧩';
      case 'config': return '⚙️';
      case 'styles': return '🎨';
      default: return '📁';
    }
  };

  const getCommitTypeColor = (type: string) => {
    switch (type) {
      case 'initial': return 'bg-blue-100 text-blue-800';
      case 'ai_edit': return 'bg-green-100 text-green-800';
      case 'manual': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🚀 Supabase项目文件存储系统演示
          </h1>
          <p className="text-gray-600">
            类似Git的文件版本控制，基于Supabase Database + Storage实现
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：项目列表 */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  项目列表
                </CardTitle>
                <Button variant="outline" size="sm" onClick={loadMockData}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-80">
                  <div className="space-y-3">
                    {projects.map((project) => (
                      <div
                        key={project.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedProject?.id === project.id
                            ? 'bg-blue-50 border-blue-200'
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedProject(project)}
                      >
                        <div className="font-medium text-sm">{project.name}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {project.framework} • {project.total_files} 文件 • {project.total_commits} 提交
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {project.status}
                          </Badge>
                          {project.deployment_url && (
                            <Badge variant="outline" className="text-xs">
                              已部署
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* 右侧：项目详情 */}
          <div className="lg:col-span-2 space-y-6">
            {selectedProject && (
              <>
                {/* 项目概览 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Package className="w-5 h-5" />
                        {selectedProject.name}
                      </span>
                      {selectedProject.deployment_url && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={selectedProject.deployment_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4" />
                            预览
                          </a>
                        </Button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{selectedProject.total_files}</div>
                        <div className="text-sm text-blue-800">文件总数</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{selectedProject.total_commits}</div>
                        <div className="text-sm text-green-800">提交次数</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{selectedProject.framework}</div>
                        <div className="text-sm text-purple-800">技术框架</div>
                      </div>
                    </div>
                    
                    {selectedProject.description && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-600">{selectedProject.description}</div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 提交历史 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GitBranch className="w-5 h-5" />
                      提交历史
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-64">
                      <div className="space-y-3">
                        {commits.map((commit) => (
                          <div key={commit.id} className="border-l-4 border-blue-200 pl-4 py-2">
                            <div className="flex items-center justify-between">
                              <div className="font-medium text-sm">{commit.message}</div>
                              <Badge className={`text-xs ${getCommitTypeColor(commit.type)}`}>
                                {commit.type}
                              </Badge>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              <Clock className="w-3 h-3 inline mr-1" />
                              {formatDate(commit.created_at)}
                            </div>
                            {commit.ai_agent && (
                              <div className="text-xs text-green-600 mt-1">
                                🤖 {commit.ai_agent} • "{commit.user_prompt}"
                              </div>
                            )}
                            <div className="flex gap-4 text-xs text-gray-500 mt-2">
                              <span className="text-green-600">+{commit.files_added}</span>
                              <span className="text-blue-600">~{commit.files_modified}</span>
                              <span className="text-red-600">-{commit.files_deleted}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* 文件列表 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      项目文件
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-80">
                      <div className="space-y-2">
                        {files.map((file) => (
                          <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <span className="text-lg">{getFileTypeIcon(file.file_type)}</span>
                              <div>
                                <div className="font-medium text-sm">{file.filename}</div>
                                <div className="text-xs text-gray-500">
                                  {file.language} • {formatFileSize(file.file_size)}
                                </div>
                              </div>
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatDate(file.created_at)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>

        {/* 底部说明 */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>🎯 系统特性</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Database className="w-8 h-8 mx-auto text-blue-600 mb-2" />
                <div className="font-semibold text-blue-800">Supabase存储</div>
                <div className="text-xs text-blue-600">数据库+文件存储</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <GitBranch className="w-8 h-8 mx-auto text-green-600 mb-2" />
                <div className="font-semibold text-green-800">版本控制</div>
                <div className="text-xs text-green-600">类似Git的提交历史</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <User className="w-8 h-8 mx-auto text-purple-600 mb-2" />
                <div className="font-semibold text-purple-800">用户隔离</div>
                <div className="text-xs text-purple-600">RLS行级安全策略</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <Code2 className="w-8 h-8 mx-auto text-orange-600 mb-2" />
                <div className="font-semibold text-orange-800">AI集成</div>
                <div className="text-xs text-orange-600">自动记录AI编辑</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
