'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  RefreshCw, 
  ExternalLink, 
  Download,
  Monitor,
  Smartphone,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Terminal,
  Code
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { WebContainerService, type ContainerStatus } from '@/lib/services/webcontainer-service';
import { type CodeFile } from '@/lib/agents/coding/types';
import { StagewiseToolbar } from './StagewiseToolbar';
import { useTheme } from '@/contexts/theme-context';

type DeviceType = 'desktop' | 'mobile';
type EditMode = 'none' | 'text' | 'ai';

interface WebContainerPreviewProps {
  files: CodeFile[];
  projectName: string;
  description?: string;
  isLoading: boolean;
  previewUrl: string | null;
  enableWebContainer: boolean;
  onPreviewReady: (url: string) => void;
  onLoadingChange: (loading: boolean) => void;
  isEditMode?: boolean;
  onContentChange?: (field: string, value: string) => void;
  deviceType?: DeviceType;
  editMode?: EditMode;
}

export function WebContainerPreview({
  files,
  projectName,
  description,
  isLoading,
  previewUrl,
  enableWebContainer,
  onPreviewReady,
  onLoadingChange,
  isEditMode,
  onContentChange,
  deviceType = 'desktop',
  editMode = 'none'
}: WebContainerPreviewProps) {
  
  // ============== 状态管理 ==============
  const [containerStatus, setContainerStatus] = useState<ContainerStatus>('initializing');
  const [buildLogs, setBuildLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [webcontainerService, setWebcontainerService] = useState<WebContainerService | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [packageJsonReady, setPackageJsonReady] = useState(false);
  const [otherFilesReady, setOtherFilesReady] = useState(false);
  
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const packageJsonTimerRef = useRef<NodeJS.Timeout | null>(null);
  const otherFilesTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { theme } = useTheme();

  // ============== 设备配置 ==============
  const deviceConfigs = {
    desktop: {
      width: '100%',
      height: '100%',
      label: '桌面预览',
      icon: Monitor
    },
    mobile: {
      width: '375px',
      height: '667px',
      label: '移动预览',
      icon: Smartphone
    }
  };

  // ============== 工具函数 ==============
  const log = useCallback((message: string) => {
    setBuildLogs(prev => [...prev, message]);
  }, []);

  const generateMockPreviewUrl = useCallback(() => {
    const htmlFile = files.find(f => f.filename.endsWith('.html') || f.filename === 'index.html');
    const tsxFile = files.find(f => f.filename.endsWith('.tsx') && f.filename.includes('page'));
    const jsxFile = files.find(f => f.filename.endsWith('.jsx') && f.filename.includes('page'));
    
    if (htmlFile) {
      return `data:text/html;charset=utf-8,${encodeURIComponent(htmlFile.content)}`;
    }
    
    if (tsxFile || jsxFile) {
      const mockHtml = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${projectName}</title>
  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    body { margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; }
    ${files.find(f => f.filename.includes('globals.css') || f.filename.includes('index.css'))?.content || ''}
    ${files.find(f => f.filename.includes('tailwind') || f.filename.includes('style'))?.content || ''}
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    ${(tsxFile || jsxFile)?.content || ''}
  </script>
</body>
</html>`;
      return `data:text/html;charset=utf-8,${encodeURIComponent(mockHtml)}`;
    }
    
    return `data:text/html;charset=utf-8,${encodeURIComponent(`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${projectName}</title>
  <style>
    body { margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; }
    .container { max-width: 800px; margin: 0 auto; text-align: center; }
    .title { color: #333; margin-bottom: 20px; }
    .description { color: #666; line-height: 1.6; }
    .file-list { margin-top: 30px; text-align: left; }
    .file-item { padding: 10px; margin: 5px 0; background: #f5f5f5; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="container">
    <h1 class="title">${projectName}</h1>
    ${description ? `<p class="description">${description}</p>` : ''}
    <div class="file-list">
      <h3>项目文件：</h3>
      ${files.map(f => `<div class="file-item">${f.filename}</div>`).join('')}
    </div>
  </div>
</body>
</html>
    `)}`;
  }, [files, projectName, description]);

  // ============== 核心逻辑函数 ==============
  const startProgressiveWebContainer = useCallback(async () => {
    if (!webcontainerService || isStarting) return;

    setIsStarting(true);
    try {
      await webcontainerService.progressiveStart(files);
      log('✅ 渐进式启动成功');
    } catch (error) {
      log(`❌ 渐进式启动失败: ${error}`);
      setContainerStatus('error');
      // 降级到模拟预览
      const mockUrl = generateMockPreviewUrl();
      onPreviewReady(mockUrl);
    } finally {
      setIsStarting(false);
    }
  }, [webcontainerService, isStarting, files, log, generateMockPreviewUrl, onPreviewReady]);

  const mountPackageJsonOnly = useCallback(async () => {
    if (!webcontainerService || isStarting) return;

    const packageJsonFile = files.find(f => f.filename === 'package.json');
    if (!packageJsonFile) return;

    try {
      setIsStarting(true);
      await webcontainerService.mountPackageJson(packageJsonFile);
      log('✅ package.json挂载完成，依赖安装中...');
    } catch (error) {
      log(`❌ package.json挂载失败: ${error}`);
      setContainerStatus('error');
    } finally {
      setIsStarting(false);
    }
  }, [webcontainerService, isStarting, files, log]);

  const mountOtherFilesAndStart = useCallback(async () => {
    if (!webcontainerService || isStarting) return;

    const otherFiles = files.filter(f => f.filename !== 'package.json');
    if (otherFiles.length === 0) return;

    try {
      setIsStarting(true);
      await webcontainerService.mountOtherFilesAndStart(otherFiles);
      log('✅ 其他文件挂载完成，服务器启动中...');
    } catch (error) {
      log(`❌ 其他文件挂载失败: ${error}`);
      setContainerStatus('error');
    } finally {
      setIsStarting(false);
    }
  }, [webcontainerService, isStarting, files, log]);

  const refreshPreview = useCallback(() => {
    // 🔄 手动刷新开始
    log('🔄 手动刷新开始...');
    setRefreshKey(prev => prev + 1);
    setIsStarting(false);
    setContainerStatus('initializing');
    setPackageJsonReady(false);
    setOtherFilesReady(false);
    
    // 🔧 如果有WebContainer服务，不销毁实例，而是重置项目状态
    if (webcontainerService) {
      log('🔄 刷新预览，重置项目状态...');
      
             // 重置项目状态，但保留WebContainer实例
       webcontainerService.resetProjectState().then(() => {
         log('🧹 项目状态已重置');
        
        // 如果启用WebContainer且有文件，重新启动项目
        if (enableWebContainer && files.length > 0) {
          log('🚀 开始重新部署项目...');
          
          // 使用渐进式启动
          webcontainerService.progressiveStart(files)
            .then(() => {
              log('✅ 项目重新部署成功');
            })
            .catch((error) => {
              log(`❌ 项目重新部署失败: ${error.message}`);
              setContainerStatus('error');
              
              // 如果是WebContainer实例问题，尝试重新创建服务
              if (error.message.includes('Only a single WebContainer instance can be booted')) {
                log('🔄 尝试重新创建WebContainer服务...');
                recreateService();
              } else {
                // 其他错误，降级到模拟预览
                const mockUrl = generateMockPreviewUrl();
                onPreviewReady(mockUrl);
              }
            });
        }
      }).catch(error => {
        log(`❌ 终止进程失败: ${error.message}`);
        
        // 如果终止进程都失败，说明实例可能有问题，重新创建服务
        recreateService();
      });
    } else {
      // 没有WebContainer服务，创建新服务
      recreateService();
    }

    // 重新创建服务的函数
    function recreateService() {
      log('🔧 重新创建WebContainer服务...');
      
      const service = new WebContainerService({
        clientId: 'wc_api_littlesheepxy_33595e6cd89a5813663cd3f70b26e12d',
        workdirName: projectName.toLowerCase().replace(/\s+/g, '-')
      });

      // 设置事件监听器
      service.onServerReady((port: number, url: string) => {
        log(`🌐 服务器就绪: ${url}`);
        setRefreshKey(prev => prev + 1);
        onPreviewReady(url);
        setContainerStatus('running');
        onLoadingChange(false);
        setIsStarting(false);
      });

      service.onStatusChange((status) => {
        setContainerStatus(status);
        log(`📊 状态变化: ${status}`);
      });

             service.onLog((logMessage) => {
         log(logMessage);
       });

       service.onDependenciesReady(() => {
         log('🎉 依赖安装完成，准备下一步...');
         // 强制触发React状态更新
         setContainerStatus('ready');
         
         // 检查当前状态
         const mountStatus = service.getMountStatus();
         const hasOtherFiles = files.some(f => f.filename !== 'package.json');
         log(`🔍 当前状态检查: packageJsonMounted=${mountStatus.packageJsonMounted}, dependenciesInstalled=${mountStatus.dependenciesInstalled}, hasOtherFiles=${hasOtherFiles}, otherFilesReady=${otherFilesReady}, isStarting=${isStarting}`);
         
         // 立即触发其他文件挂载检查，而不是延迟
         if (!otherFilesReady) {
           log('🔄 设置otherFilesReady=true');
           setOtherFilesReady(true);
         }
         
         // 如果条件满足，直接触发下一步
         if (mountStatus.packageJsonMounted && mountStatus.dependenciesInstalled && !isStarting) {
           if (hasOtherFiles) {
             log('🚀 立即开始挂载其他文件并启动服务器...');
             setIsStarting(true);
             mountOtherFilesAndStart().finally(() => {
               setIsStarting(false);
             });
           } else {
             log('🚀 立即开始启动开发服务器...');
             setIsStarting(true);
             startProgressiveWebContainer().finally(() => {
               setIsStarting(false);
             });
           }
         }
       });

       setWebcontainerService(service);
       
       // 如果启用WebContainer且有文件，立即开始预启动
       if (enableWebContainer && files.length > 0) {
        service.prestart()
          .then(() => {
            log('✅ WebContainer预启动完成');
          })
          .catch((error) => {
            log(`❌ WebContainer预启动失败: ${error.message}`);
            setContainerStatus('error');
            // 降级到模拟预览
            const mockUrl = generateMockPreviewUrl();
            onPreviewReady(mockUrl);
          });
      } else {
        // 没有启用WebContainer，直接使用模拟预览
        const mockUrl = generateMockPreviewUrl();
        onPreviewReady(mockUrl);
        log('🎯 使用模拟预览');
      }
    }
  }, [webcontainerService, onPreviewReady, enableWebContainer, files.length, generateMockPreviewUrl, projectName, log, onLoadingChange]);

  // ============== 生命周期管理 ==============
  
  // 1. 组件初始化 - 只在真正需要时清理
  useEffect(() => {
    // 不要在每次组件渲染时都清理，只在组件卸载时清理
    return () => {
      if (webcontainerService) {
        webcontainerService.destroy().catch(console.warn);
      }
    };
  }, [webcontainerService]);

  // 2. 文件变化处理 - 渐进式检测文件到达
  useEffect(() => {
    // 清理定时器
    if (packageJsonTimerRef.current) {
      clearTimeout(packageJsonTimerRef.current);
    }
    if (otherFilesTimerRef.current) {
      clearTimeout(otherFilesTimerRef.current);
    }

    if (files.length > 0) {
      const hasPackageJson = files.some(f => f.filename === 'package.json');
      const hasOtherFiles = files.some(f => f.filename !== 'package.json');

      // 检测package.json
      if (hasPackageJson && !packageJsonReady) {
        log('📦 检测到package.json，准备挂载...');
        packageJsonTimerRef.current = setTimeout(() => {
          setPackageJsonReady(true);
        }, 1000); // package.json 快速处理
      }

      // 检测其他文件
      if (hasOtherFiles && !otherFilesReady) {
        // 检查关键文件完整性
      const hasEntryFile = files.some(f => 
        f.filename.includes('main.tsx') || 
        f.filename.includes('index.tsx') || 
        f.filename.includes('App.tsx') ||
        f.filename.includes('page.tsx')
      );
      const hasIndexHtml = files.some(f => f.filename === 'index.html');
        
        // 根据文件完整性调整等待时间
        const waitTime = (hasEntryFile || hasIndexHtml) ? 2000 : 4000;
        
        log(`📁 检测到 ${files.length} 个文件，等待文件稳定...`);
        otherFilesTimerRef.current = setTimeout(() => {
          setOtherFilesReady(true);
        }, waitTime);
      }
    }

    return () => {
      if (packageJsonTimerRef.current) {
        clearTimeout(packageJsonTimerRef.current);
      }
      if (otherFilesTimerRef.current) {
        clearTimeout(otherFilesTimerRef.current);
      }
    };
  }, [files, packageJsonReady, otherFilesReady, log]);

  // 3. WebContainer服务初始化
  useEffect(() => {
    if (enableWebContainer && !webcontainerService) {
      log('🚀 初始化WebContainer服务...');
      
      const service = new WebContainerService({
        clientId: 'wc_api_littlesheepxy_33595e6cd89a5813663cd3f70b26e12d',
        workdirName: projectName.toLowerCase().replace(/\s+/g, '-')
      });

      // 设置事件监听器
      service.onServerReady((port: number, url: string) => {
        log(`🌐 服务器就绪: ${url}`);
        setRefreshKey(prev => prev + 1);
        onPreviewReady(url);
        setContainerStatus('running');
        onLoadingChange(false);
        setIsStarting(false);
      });

      service.onStatusChange((status) => {
        setContainerStatus(status);
        log(`📊 状态变化: ${status}`);
      });

      service.onLog((logMessage) => {
        log(logMessage);
      });

      service.onDependenciesReady(() => {
        log('🎉 依赖安装完成，准备下一步...');
        // 强制触发React状态更新
        setContainerStatus('ready');
        
        // 检查当前状态
        const mountStatus = service.getMountStatus();
        const hasOtherFiles = files.some(f => f.filename !== 'package.json');
        log(`🔍 当前状态检查: packageJsonMounted=${mountStatus.packageJsonMounted}, dependenciesInstalled=${mountStatus.dependenciesInstalled}, hasOtherFiles=${hasOtherFiles}, otherFilesReady=${otherFilesReady}, isStarting=${isStarting}`);
        
        // 立即触发其他文件挂载检查，而不是延迟
        if (!otherFilesReady) {
          log('🔄 设置otherFilesReady=true');
          setOtherFilesReady(true);
        }
        
        // 如果条件满足，直接触发下一步
        if (mountStatus.packageJsonMounted && mountStatus.dependenciesInstalled && !isStarting) {
          if (hasOtherFiles) {
            log('🚀 立即开始挂载其他文件并启动服务器...');
            setIsStarting(true);
            mountOtherFilesAndStart().finally(() => {
              setIsStarting(false);
            });
          } else {
            log('🚀 立即开始启动开发服务器...');
            setIsStarting(true);
            startProgressiveWebContainer().finally(() => {
              setIsStarting(false);
            });
          }
        }
      });

      setWebcontainerService(service);
      
      // 开始预启动
      service.prestart()
        .then(() => {
          log('✅ WebContainer预启动完成');
        })
        .catch((error) => {
          log(`❌ WebContainer预启动失败: ${error.message}`);
        setContainerStatus('error');
      });
    }
  }, [enableWebContainer, projectName, webcontainerService, log, onPreviewReady, onLoadingChange]);

  // 4. 渐进式挂载 - package.json 优先处理（增加去重）
  useEffect(() => {
    if (webcontainerService && packageJsonReady && !isStarting) {
      const hasPackageJson = files.some(f => f.filename === 'package.json');
      if (hasPackageJson) {
        const mountStatus = webcontainerService.getMountStatus();
        if (!mountStatus.packageJsonMounted) {
          log('📦 开始挂载package.json并安装依赖...');
          setIsStarting(true); // 防止重复执行
          mountPackageJsonOnly().finally(() => {
            setIsStarting(false);
          });
        }
      }
    }
  }, [webcontainerService, packageJsonReady, isStarting, files, log, mountPackageJsonOnly]);

  // 5. 其他文件挂载和服务器启动
  useEffect(() => {
    if (webcontainerService && otherFilesReady && !isStarting) {
      const mountStatus = webcontainerService.getMountStatus();
      const hasOtherFiles = files.some(f => f.filename !== 'package.json');
      
      if (hasOtherFiles && mountStatus.packageJsonMounted && mountStatus.dependenciesInstalled) {
        log('📁 开始挂载其他文件并启动服务器...');
        setIsStarting(true);
        mountOtherFilesAndStart().finally(() => {
          setIsStarting(false);
        });
      } else if (!hasOtherFiles && mountStatus.packageJsonMounted && mountStatus.dependenciesInstalled) {
        // 只有package.json的情况，直接启动
        log('🚀 开始启动开发服务器...');
        setIsStarting(true);
        startProgressiveWebContainer().finally(() => {
          setIsStarting(false);
        });
      }
    }
  }, [webcontainerService, otherFilesReady, isStarting, files, log, mountOtherFilesAndStart, startProgressiveWebContainer]);

  // 6. 模拟预览生成 - 确保始终有预览内容
  useEffect(() => {
    if (files.length > 0 && !previewUrl) {
      const mockUrl = generateMockPreviewUrl();
      onPreviewReady(mockUrl);
      log('🎯 生成模拟预览');
    }
  }, [files.length, previewUrl, onPreviewReady, generateMockPreviewUrl, log]);

  // 7. 主题变化处理
  useEffect(() => {
    if (files.length > 0 && previewUrl && previewUrl.includes('data:')) {
      // 只在模拟预览时重新生成
      const mockUrl = generateMockPreviewUrl();
      onPreviewReady(mockUrl);
      setRefreshKey(prev => prev + 1);
    }
  }, [theme, files.length, previewUrl, onPreviewReady, generateMockPreviewUrl]);

  // 8. 页面可见性处理
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && webcontainerService && containerStatus === 'error') {
        setTimeout(() => {
          if ((packageJsonReady || otherFilesReady) && !isStarting) {
            startProgressiveWebContainer();
          }
        }, 1000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [webcontainerService, containerStatus, packageJsonReady, otherFilesReady, isStarting, startProgressiveWebContainer]);

  // 9. 组件清理
  useEffect(() => {
    return () => {
      if (webcontainerService) {
        webcontainerService.destroy().catch(console.error);
      }
    };
  }, []);

  // ============== 可视化编辑处理 ==============
  const handleElementModificationRequest = useCallback(async (elementInfo: any, prompt: string) => {
    const visualEditMessage = `
🎯 **可视化编辑请求**

**选中元素：**
- 标签: \`${elementInfo.tagName}\`
- 选择器: \`${elementInfo.selector}\`
- 类名: \`${elementInfo.className}\`
- 文本内容: "${elementInfo.textContent?.slice(0, 100)}${elementInfo.textContent?.length > 100 ? '...' : ''}"

**修改需求：**
${prompt}

**项目上下文：**
- 项目名称: ${projectName}
- 框架: React
- 当前文件数: ${files.length}

请帮我修改代码来实现这个需求。
    `.trim();

    if (onContentChange) {
      onContentChange('visual_edit_request', visualEditMessage);
    } else {
      window.parent.postMessage({
        type: 'VISUAL_EDIT_TO_CHAT',
        message: visualEditMessage,
        elementInfo,
        prompt
      }, '*');
    }
  }, [files.length, projectName, onContentChange]);
    
  // ============== 渲染 ==============
  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 overflow-hidden">
      {/* 顶部工具栏 */}
      <div className={`flex items-center justify-between px-4 py-2 border-b ${
        theme === 'light' 
          ? 'bg-gray-50 border-gray-200' 
          : 'bg-gray-800 border-gray-700'
      }`}>
        <div className="flex items-center gap-3">
          <StatusIndicator status={containerStatus} theme={theme} />
          <Badge variant="outline" className={`text-xs ${
            theme === 'light' 
              ? 'border-gray-300 text-gray-700' 
              : 'border-gray-600 text-gray-300'
          }`}>
            {deviceConfigs[deviceType].label}
          </Badge>
          <Badge 
            variant={previewUrl?.includes('localhost') || previewUrl?.includes('webcontainer-api.io') ? 'default' : 'secondary'} 
            className="text-xs"
          >
            {previewUrl?.includes('localhost') || previewUrl?.includes('webcontainer-api.io') ? 'WebContainer' : '模拟预览'}
          </Badge>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowLogs(!showLogs)}
            className={`flex items-center gap-1 h-7 px-2 text-xs ${
              theme === 'light' 
                ? 'border-gray-300 text-gray-700 hover:bg-gray-100' 
                : 'border-gray-600 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <Terminal className="w-3 h-3" />
            {showLogs ? '隐藏日志' : '显示日志'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setBuildLogs(['🔄 手动刷新开始...']);
              refreshPreview();
            }}
            disabled={isLoading}
            className={`flex items-center gap-1 h-7 px-2 text-xs transition-all duration-200 ${
              theme === 'light' 
                ? 'border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-emerald-300' 
                : 'border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-emerald-500'
            }`}
          >
            <RefreshCw className={cn("w-3 h-3", (isLoading || isStarting) && "animate-spin")} />
            刷新
          </Button>
          
          {enableWebContainer && containerStatus === 'error' && (
            <Button
              variant="default"
              size="sm"
              onClick={startProgressiveWebContainer}
              disabled={isLoading || isStarting}
              className="flex items-center gap-1 h-7 px-2 text-xs text-white"
            >
              <Play className="w-3 h-3" />
              {isStarting ? '启动中...' : '重新启动'}
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 flex">
        {/* 预览区域 */}
        <div className="flex-1 flex flex-col">
          <div className={`flex-1 p-4 ${
            theme === 'light' 
              ? 'bg-gray-100' 
              : 'bg-gray-800'
          }`}>
            <div 
              className={`mx-auto rounded-lg shadow-lg overflow-hidden border ${
                theme === 'light' 
                  ? 'bg-white border-gray-200' 
                  : 'bg-gray-900 border-gray-700'
              }`}
              style={{
                width: deviceConfigs[deviceType].width,
                height: deviceConfigs[deviceType].height,
                maxWidth: '100%',
                maxHeight: '100%'
              }}
            >
              {previewUrl ? (
                <iframe
                  key={refreshKey}
                  ref={iframeRef}
                  src={previewUrl}
                  className="w-full h-full border-0"
                  title={`${projectName} 预览`}
                />
              ) : (
                <PreviewPlaceholder status={containerStatus} theme={theme} />
              )}
            </div>
          </div>
        </div>

        {/* 日志面板 */}
        <AnimatePresence>
          {showLogs && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 350, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className={`border-l text-green-400 font-mono text-xs overflow-hidden ${
                theme === 'light' 
                  ? 'bg-gray-900 border-gray-300' 
                  : 'bg-gray-950 border-gray-700'
              }`}
            >
              <div className={`p-3 border-b flex items-center justify-between ${
                theme === 'light' 
                  ? 'border-gray-700' 
                  : 'border-gray-600'
              }`}>
                <h4 className="font-semibold text-white">构建日志</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setBuildLogs([])}
                  className={`text-gray-400 hover:text-white h-6 px-2 ${
                    theme === 'light' 
                      ? 'hover:bg-gray-800' 
                      : 'hover:bg-gray-700'
                  }`}
                >
                  清空
                </Button>
              </div>
              <div className="p-3 h-full overflow-y-auto max-h-96">
                {buildLogs.length === 0 ? (
                  <div className={`${
                    theme === 'light' 
                      ? 'text-gray-500' 
                      : 'text-gray-400'
                  }`}>暂无日志</div>
                ) : (
                  buildLogs.map((log, index) => (
                    <div key={index} className="mb-1 break-words">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 可视化编辑工具栏 */}
      {editMode === 'ai' && (
        <StagewiseToolbar
          iframeRef={iframeRef}
          onElementModificationRequest={handleElementModificationRequest}
          isEnabled={true}
          onToggle={() => {}}
        />
      )}
    </div>
  );
}

// ============== 子组件 ==============

function StatusIndicator({ status, theme }: { status: ContainerStatus; theme: string }) {
  const statusConfig = {
    initializing: { color: 'bg-blue-400 animate-pulse', label: '初始化中', icon: Loader2 },
    prestarting: { color: 'bg-purple-400 animate-pulse', label: '预启动中', icon: Sparkles },
    installing: { color: 'bg-yellow-400 animate-pulse', label: '安装依赖', icon: Loader2 },
    building: { color: 'bg-orange-400 animate-pulse', label: '构建中', icon: Loader2 },
    ready: { color: 'bg-blue-600', label: '准备就绪', icon: CheckCircle2 },
    running: { color: 'bg-green-400', label: '运行中', icon: CheckCircle2 },
    error: { color: 'bg-red-400', label: '错误', icon: AlertCircle }
  };

  const config = statusConfig[status] || statusConfig.initializing;
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2">
      <div className={cn("w-3 h-3 rounded-full", config.color)} />
      <Icon className={`w-4 h-4 ${
        theme === 'light' 
          ? 'text-gray-600' 
          : 'text-gray-400'
      }`} />
      <span className={`text-sm ${
        theme === 'light' 
          ? 'text-gray-600' 
          : 'text-gray-400'
      }`}>{config.label}</span>
    </div>
  );
}

function PreviewPlaceholder({ status, theme }: { status: ContainerStatus; theme: string }) {
  const messages = {
    initializing: '正在初始化WebContainer...',
    prestarting: '正在预启动WebContainer...',
    installing: '正在安装项目依赖...',
    building: '正在构建项目...',
    ready: 'WebContainer准备就绪...',
    running: '正在加载预览...',
    error: '预览加载失败，请检查代码'
  };

  return (
    <div className={`h-full flex items-center justify-center ${
      theme === 'light' 
        ? 'bg-gray-50' 
        : 'bg-gray-800'
    }`}>
      <div className="text-center">
        <Sparkles className={`w-12 h-12 mx-auto mb-4 ${
          theme === 'light' 
            ? 'text-gray-400' 
            : 'text-gray-500'
        }`} />
        <p className={`${
          theme === 'light' 
            ? 'text-gray-600' 
            : 'text-gray-400'
        }`}>{messages[status] || messages.initializing}</p>
        {status === 'error' && (
          <p className={`text-sm mt-2 ${
            theme === 'light' 
              ? 'text-red-500' 
              : 'text-red-400'
          }`}>
            请检查控制台日志获取详细信息
          </p>
        )}
      </div>
    </div>
  );
}

export default WebContainerPreview; 