"use client"

import { useState, useEffect, useRef } from "react"
import { useChatSystemV2 } from "@/hooks/use-chat-system-v2"
import { useTheme } from "@/contexts/theme-context"
import { generateMockResumeCode } from "@/lib/utils/mockCodeGenerator"
import { useAuthCheck, usePendingAuthAction } from "@/hooks/use-auth-check"
import { AuthPromptDialog } from "@/components/dialogs"
import { useToast } from "@/hooks/use-toast"

// 导入新的组件
import { ChatHeader } from "@/components/chat/ChatHeader"
import { ChatSidebar } from "@/components/chat/ChatSidebar"
import { WelcomeScreen } from "@/components/chat/WelcomeScreen"
import { ChatModeView } from "@/components/chat/ChatModeView"

import { CodeModeView } from "@/components/chat/CodeModeView"
import { ErrorMonitor } from "@/components/ui/error-monitor"
import { VercelStatusIndicator } from "@/components/ui/vercel-status-indicator"
import { useVercelErrorMonitor } from "@/hooks/use-vercel-error-monitor"
import { SessionDebugPanel } from "@/components/debug/SessionDebugPanel"


export default function ChatPage() {
  const { theme } = useTheme()
  const { toast } = useToast()
  
  // 认证状态
  const { isAuthenticated, isLoading: authLoading, userId } = useAuthCheck()
  const { executePendingAction } = usePendingAuthAction()
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [pendingMessage, setPendingMessage] = useState<string>('')
  
  const {
    sessions = [],
    currentSession,
    isGenerating,
    createNewSession,
    selectSession,
    sendMessage,
    updateSessionTitle,
    shareSession,
    deleteSession,
    titleGeneration,
  } = useChatSystemV2()
  
  // 移除 inputValue 状态，让 WelcomeScreen 自己管理
  const [hasStartedChat, setHasStartedChat] = useState(false)
  const [isCodeMode, setIsCodeMode] = useState(false)
  const [userManuallyReturnedToChat, setUserManuallyReturnedToChat] = useState(false) // 🔧 新增：用户是否手动返回过对话模式
  const [generatedCode, setGeneratedCode] = useState<any[]>([])
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [chatMode, setChatMode] = useState<'normal' | 'professional'>('normal')
  const [isPrivacyMode, setIsPrivacyMode] = useState(false)
  const [deploymentUrl, setDeploymentUrl] = useState<string>('')
  
  // Vercel 错误监控状态
  const [showErrorMonitor, setShowErrorMonitor] = useState(false)
  const vercelErrorMonitor = useVercelErrorMonitor({
    config: {
      bearerToken: process.env.NEXT_PUBLIC_VERCEL_TOKEN,
      projectId: process.env.NEXT_PUBLIC_VERCEL_PROJECT_ID,
      teamId: process.env.NEXT_PUBLIC_VERCEL_TEAM_ID,
    },
    autoStart: false, // 只有在 coding 模式下才启动
    onError: (error) => {
      toast({
        title: "检测到构建错误",
        description: `${error.file || '未知文件'}: ${error.message}`,
        variant: "destructive",
      })
    }
  })
  const inputRef = useRef<HTMLInputElement>(null)

  // 监听当前会话变化，如果有会话且有消息，则显示对话模式
  useEffect(() => {
    if (currentSession && currentSession.conversationHistory && currentSession.conversationHistory.length > 0) {
      setHasStartedChat(true)
    }
  }, [currentSession])

  // 监听当前会话变化，检查是否进入代码生成阶段
  useEffect(() => {
    if (currentSession && currentSession.conversationHistory && currentSession.conversationHistory.length > 0) {
      setHasStartedChat(true)
      
      // 检查是否有代码生成相关的消息
      const hasCodeGeneration = currentSession.conversationHistory.some(message => 
        message.metadata?.systemState?.current_stage === '代码生成中' ||
        message.metadata?.codeBlocks ||
        // 🔧 检查直接代码生成模式
        message.metadata?.directCodeGeneration ||
        message.metadata?.projectGenerated ||
        message.metadata?.projectFiles ||
        // 🔧 检查不同的intent状态
        message.metadata?.intent === 'project_complete' ||
        message.metadata?.intent === 'test_project_complete' ||
        // 🔧 添加更多检查条件
        message.metadata?.hasCodeFiles ||
        message.metadata?.codeFilesReady ||
        // 🔧 修复：只有当expertMode有实际代码文件时才切换，等待用户输入时不切换
        (message.metadata?.expertMode && !message.metadata?.awaitingUserInput)
      )
      
      console.log('🔍 [代码检测] hasCodeGeneration:', hasCodeGeneration, 'isCodeMode:', isCodeMode, 'userManuallyReturned:', userManuallyReturnedToChat);
      
      if (hasCodeGeneration) {
        // 🔧 修复：只有当用户没有手动返回过时，才自动切换到代码模式
        if (!isCodeMode && !userManuallyReturnedToChat) {
          console.log('🔄 [模式切换] 自动切换到代码模式');
          setIsCodeMode(true);
        } else if (!isCodeMode && userManuallyReturnedToChat) {
          console.log('🚫 [模式切换] 用户手动返回过，跳过自动切换');
        }
        
        // 提取生成的代码 - 支持多种数据源
        let extractedCode: any[] = []
        
        // 1. 优先检查最新的项目文件（专业模式）
        const projectMessages = currentSession.conversationHistory.filter(msg => 
          msg.metadata?.projectFiles && Array.isArray(msg.metadata.projectFiles)
        );
        
        console.log('🔍 [调试] 总对话历史长度:', currentSession.conversationHistory.length);
        console.log('🔍 [调试] 包含projectFiles的消息数量:', projectMessages.length);
        
        // 🔧 调试：打印所有消息的metadata信息
        currentSession.conversationHistory.forEach((msg, index) => {
          if (msg.metadata) {
            const hasProjectFiles = msg.metadata.projectFiles && Array.isArray(msg.metadata.projectFiles);
            const hasCodeBlocks = msg.metadata.codeBlocks;
            const hasCodeGeneration = msg.metadata.projectGenerated || msg.metadata.hasCodeFiles;
            
            if (hasProjectFiles || hasCodeBlocks || hasCodeGeneration) {
              console.log(`🔍 [调试] 消息${index}:`, {
                hasProjectFiles,
                projectFilesCount: hasProjectFiles ? msg.metadata.projectFiles.length : 0,
                hasCodeBlocks,
                hasCodeGeneration,
                intent: msg.metadata.intent,
                agent: msg.agent
              });
            }
          }
        });
        
        if (projectMessages.length > 0) {
          const latestProjectMessage = projectMessages[projectMessages.length - 1];
          extractedCode = latestProjectMessage.metadata?.projectFiles || [];
          console.log('🎯 [代码提取] 从projectFiles提取到', extractedCode.length, '个文件');
          
          // 🔧 调试：打印文件信息
          extractedCode.forEach((file, index) => {
            console.log(`📄 [文件${index + 1}] ${file.filename} (${file.language}) - 内容长度: ${file.content?.length || 0}`);
          });
        } else {
          // 2. 回退到传统的codeBlocks
          const codeMessages = currentSession.conversationHistory.filter(msg => msg.metadata?.codeBlocks);
          if (codeMessages.length > 0) {
            const latestCodeMessage = codeMessages[codeMessages.length - 1];
            extractedCode = latestCodeMessage.metadata?.codeBlocks || [];
            console.log('🎯 [代码提取] 从codeBlocks提取到', extractedCode.length, '个文件');
          }
        }
        
        // 🔧 修复：只有当提取到的代码与当前代码不同时才更新
        if (extractedCode.length > 0) {
          // 检查文件内容是否真的不同，而不只是数量
          const isDifferent = extractedCode.length !== generatedCode.length || 
                             extractedCode.some((file, index) => 
                               !generatedCode[index] || 
                               file.filename !== generatedCode[index].filename ||
                               file.content !== generatedCode[index].content
                             );
          
          if (isDifferent) {
            setGeneratedCode(extractedCode);
            console.log('✅ [代码设置] 成功设置生成的代码，共', extractedCode.length, '个文件');
          } else {
            console.log('ℹ️ [代码设置] 代码内容未变化，跳过更新');
          }
        } else {
          console.log('⚠️ [代码提取] 未找到任何代码文件');
          
          // 🔧 如果当前有生成的代码但检测不到，说明可能是数据丢失
          if (generatedCode.length > 0) {
            console.log('⚠️ [数据检查] 当前有', generatedCode.length, '个代码文件，但对话历史中检测不到');
            console.log('💡 [建议] 可能需要重新生成或检查数据同步');
          }
        }
      }
    }
  }, [currentSession, isCodeMode, generatedCode.length])

  // 处理登录成功后的继续操作
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      // 检查是否有待执行的操作
      const executed = executePendingAction(() => {
        // 登录成功后继续发送消息
        if (pendingMessage) {
          setTimeout(() => {
            sendMessage(pendingMessage)
            setPendingMessage('')
            setHasStartedChat(true)
          }, 500)
        }
      })
      
      if (executed) {
        console.log('✅ 登录成功，继续执行聊天操作')
      }
    }
  }, [isAuthenticated, authLoading, pendingMessage, executePendingAction, sendMessage])

  // 🔧 恢复保存的预览URL
  useEffect(() => {
    if (currentSession) {
      // 🎯 优先从数据库中的会话数据恢复
      if (currentSession.generatedContent?.codeProject?.metadata?.deploymentUrl) {
        const savedUrl = currentSession.generatedContent.codeProject.metadata.deploymentUrl;
        console.log('🗄️ [预览恢复] 从数据库会话数据恢复预览URL:', savedUrl);
        setDeploymentUrl(savedUrl);
      } else {
        // 🔄 备用方案：从localStorage恢复
        const storageKey = `deployment-url-${currentSession.id}`;
        const savedUrl = localStorage.getItem(storageKey);
        if (savedUrl) {
          console.log('💾 [预览恢复] 从localStorage恢复预览URL:', savedUrl);
          setDeploymentUrl(savedUrl);
        } else {
          // 如果没有保存的URL，清空当前URL
          console.log('🔍 [预览恢复] 未找到保存的预览URL，清空状态');
          setDeploymentUrl('');
        }
      }
    } else {
      setDeploymentUrl('');
    }
  }, [currentSession?.id, currentSession?.generatedContent?.codeProject?.metadata?.deploymentUrl]);

  // 监听键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + B 切换侧边栏
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault()
        setIsSidebarCollapsed(!isSidebarCollapsed)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSidebarCollapsed])

  // 发送消息
  const handleSendMessage = async (messageContent: string) => {
    if (!messageContent.trim()) return

    // 检查认证状态
    if (!authLoading && !isAuthenticated) {
      // 未登录，显示登录提示
      setPendingMessage(messageContent)
      setShowAuthDialog(true)
      return
    }

    // 🔧 修复：立即设置为已开始聊天状态，确保界面立即切换
    if (!hasStartedChat) {
      setHasStartedChat(true)
    }

    // 🔧 检查是否在专业模式测试
    const isInExpertMode = isCodeMode && currentSession?.conversationHistory?.some(msg => 
      msg.metadata?.expertMode && msg.metadata?.awaitingUserInput
    )

    // 根据模式选择不同的处理方式
    let messageToSend = messageContent
    let sendOptions: any = {}

    if (isInExpertMode) {
      // 🎯 专业模式测试：通过context参数传递模式信息
      messageToSend = messageContent
      sendOptions = {
        forceAgent: 'coding',
        context: {
          expertMode: true,
          testMode: true,
          forceExpertMode: true
        }
      }
      console.log('🎯 [专业模式测试发送] 消息:', messageToSend, '选项:', sendOptions)
    } else if (chatMode === 'professional') {
      // 专业模式：通过context参数传递模式信息
      messageToSend = messageContent
      sendOptions = {
        forceAgent: 'coding',
        context: {
          expertMode: true,
          forceExpertMode: true
        }
      }
      // 自动切换到代码模式
      if (!isCodeMode) {
        setIsCodeMode(true)
        setGeneratedCode([])
      }
      console.log('🎯 [专业模式发送] 消息:', messageToSend, '选项:', sendOptions)
    } else {
      // 普通模式：直接使用用户输入
      messageToSend = messageContent
      sendOptions = undefined
    }

    // 🔧 修复：先发送消息，让用户消息立即显示，会话创建在 sendMessage 内部处理
    sendMessage(messageToSend, sendOptions)
  }

  // 处理键盘事件 - 现在由各个组件自己处理

  // 开始新对话
  const handleNewChat = async () => {
    setHasStartedChat(false)
    setIsCodeMode(false)
    setGeneratedCode([])
    
    // 🔧 重置手动返回标志
    setUserManuallyReturnedToChat(false)
    console.log('🔧 [新会话] 重置手动返回标志')
    
    await createNewSession()
  }

  // 处理代码下载
  const handleCodeDownload = () => {
    const projectData = {
      name: currentSession?.id || 'HeysMe项目',
      files: generatedCode
    }
    console.log('下载项目:', projectData)
  }

  // 处理部署
  const handleDeploy = async () => {
    console.log('🚀 开始部署项目...')
    
    if (!generatedCode || generatedCode.length === 0) {
      console.error('❌ 没有可部署的代码文件')
      toast({
        title: "部署失败",
        description: "没有可部署的代码文件",
        variant: "destructive",
      })
      return
    }

    try {
      // 准备部署数据
      const deployData = {
        projectName: currentSession?.id || `heysme-project-${Date.now()}`,
        files: generatedCode.map(file => ({
          filename: file.filename,
          content: file.content,
          language: file.language
        })),
        target: 'production', // 使用生产部署避免部署保护限制
        gitMetadata: {
          commitAuthorName: 'HeysMe User',
          commitMessage: `Deploy project from HeysMe`,
          commitRef: 'main',
          dirty: false,
        },
        projectSettings: {
          buildCommand: 'npm run build',
          installCommand: 'npm install',
        },
        meta: {
          source: 'heysme-chat',
          timestamp: new Date().toISOString(),
        }
      }

      console.log('📤 发送部署请求...', deployData)

      // 调用部署API
      const response = await fetch('/api/vercel-deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(deployData),
      })

      const result = await response.json()
      console.log('📥 部署响应:', result)

      if (!response.ok) {
        throw new Error(result.details || result.error || `HTTP ${response.status}`)
      }

      if (!result.success) {
        throw new Error(result.error || 'Deployment failed')
      }

      // 部署成功
      console.log('✅ 部署成功:', result.deployment)
      toast({
        title: "部署成功",
        description: `项目已成功部署到: ${result.deployment.url}`,
      })

      // 🎯 将部署URL存储到状态中，供预览组件使用
      setDeploymentUrl(result.deployment.url)

      // 🔧 保存部署URL到会话数据中
      if (currentSession && result.deployment.url) {
        // 1. 保存到localStorage（即时备份）
        const storageKey = `deployment-url-${currentSession.id}`;
        localStorage.setItem(storageKey, result.deployment.url);
        
        // 2. 更新当前会话数据，准备同步到数据库
        const updatedSession = {
          ...currentSession,
          generatedContent: {
            ...currentSession.generatedContent,
            codeProject: {
              id: `project-${currentSession.id}`,
              name: currentSession.id,
              description: '通过HeysMe生成的代码项目',
              files: generatedCode.map(file => ({
                filename: file.filename,
                content: file.content,
                language: file.language
              })),
              metadata: {
                template: 'custom',
                framework: 'next',
                generatedAt: new Date(),
                deploymentUrl: result.deployment.url,
                lastDeployedAt: new Date()
              }
            }
          }
        };
        
        // 3. 立即同步到数据库（关键时机）
        try {
          const syncResponse = await fetch('/api/session/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sessionId: currentSession.id,
              sessionData: updatedSession
            })
          });
          
          if (syncResponse.ok) {
            console.log('💾 [部署保存] 预览URL已保存到数据库:', result.deployment.url);
          } else {
            console.warn('⚠️ [部署保存] 数据库保存失败，已保存到localStorage');
          }
        } catch (error) {
          console.warn('⚠️ [部署保存] 数据库同步失败:', error);
        }
        
        console.log('💾 [部署保存] 预览URL保存完成 - localStorage + 数据库同步');
      }

      // 可以选择自动打开预览链接
      if (result.deployment.url) {
        window.open(result.deployment.url, '_blank')
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error('❌ 部署失败:', errorMessage)
      
      toast({
        title: "部署失败",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  // 处理代码编辑
  const handleEditCode = (filename: string) => {
    console.log('编辑文件:', filename)
  }

  // 处理文件上传
  const handleFileUpload = async (file: File) => {
    // 这个函数现在主要用于验证，实际处理在 WelcomeScreen 中进行
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/markdown', 'application/json'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "文件类型不支持",
        description: "请上传 PDF、Word、文本或 Markdown 文件",
        variant: "destructive",
      });
      return;
    }
    
    if (file.size > maxSize) {
      toast({
        title: "文件过大",
        description: "文件大小不能超过 10MB",
        variant: "destructive",
      });
      return;
    }
  };

  // 处理带文件的消息发送
  const handleSendWithFiles = async (message: string, files: any[]) => {
    try {
      // 检查认证状态
      if (!authLoading && !isAuthenticated) {
        setPendingMessage(message);
        setShowAuthDialog(true);
        return;
      }

      if (!hasStartedChat) {
        setHasStartedChat(true);
      }

      // 构建包含文件信息的消息
      let fullMessage = message;
      
      if (files.length > 0) {
        const fileInfos = files.map(fileWithPreview => {
          const file = fileWithPreview.file;
          return `📎 ${file.name}
类型: ${file.type}
大小: ${(file.size / 1024).toFixed(1)}KB
${fileWithPreview.parsedContent ? `内容: ${fileWithPreview.parsedContent}` : ''}`;
        }).join('\n\n');

        fullMessage = `${message}\n\n${fileInfos}`;
      }

      // 发送消息
      sendMessage(fullMessage);

      // 显示成功提示
      toast({
        title: "消息发送成功",
        description: `已发送${files.length > 0 ? `包含 ${files.length} 个文件的` : ''}消息`,
      });

    } catch (error) {
      console.error('发送消息失败:', error);
      toast({
        title: "发送失败",
        description: "请重试",
        variant: "destructive",
      });
    }
  };

  // 读取文件内容的辅助函数
  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          resolve(result);
        } else {
          reject(new Error('无法读取文件内容'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('文件读取失败'));
      };
      
      // 根据文件类型选择读取方式
      if (file.type.includes('text') || file.type.includes('json') || file.type.includes('markdown')) {
        reader.readAsText(file);
      } else {
        // 对于PDF和Word文档，暂时读取为文本（实际项目中可能需要专门的解析库）
        reader.readAsText(file);
      }
    });
  };

  // 转换代码为React预览格式
  const getReactPreviewData = () => {
    if (!generatedCode.length) return null

    return {
      files: generatedCode.map(code => ({
        filename: code.filename,
        content: code.content,
        language: code.language,
        type: code.type || 'component',
        description: code.description
      })),
      projectName: currentSession?.id || 'HeysMe项目',
      description: '基于AI生成的个人简历和作品集',
      assets: extractAssetsFromCode(generatedCode)
    }
  }

  // 从代码中提取资源
  const extractAssetsFromCode = (codeFiles: any[]) => {
    const assets: any[] = []
    
    codeFiles.forEach(file => {
      // 提取图片链接
      const imageMatches = file.content.match(/src=["']([^"']*\.(jpg|jpeg|png|gif|webp|svg))["']/gi)
      if (imageMatches) {
        imageMatches.forEach((match: string) => {
          const url = match.match(/src=["']([^"']+)["']/)?.[1]
          if (url && url.startsWith('http')) {
            assets.push({
              name: url.split('/').pop() || 'image',
              url,
              type: 'image',
              description: '项目图片资源'
            })
          }
        })
      }

      // 提取iframe链接
      const iframeMatches = file.content.match(/src=["']([^"']+)["']/gi)
      if (iframeMatches && file.content.includes('iframe')) {
        iframeMatches.forEach((match: string) => {
          const url = match.match(/src=["']([^"']+)["']/)?.[1]
          if (url && url.startsWith('http') && !url.includes('image')) {
            assets.push({
              name: '作品展示',
              url,
              type: 'link',
              description: '作品链接或演示'
            })
          }
        })
      }
    })

    return assets
  }

  // 启动专业模式测试 - 直接进入专业模式体验
  const generateTestCode = async () => {
    try {
      console.log('🎯 [专业模式测试] 启动专业模式...');
      
      // 设置为代码模式
      setIsCodeMode(true)
      setHasStartedChat(true)
      setGeneratedCode([]) // 清空之前的代码

      // 创建或获取会话
      let session = currentSession
      if (!session) {
        console.log('🎯 [专业模式测试] 创建新会话...');
        session = await createNewSession()
      }

      console.log('🎯 [专业模式测试] 会话ID:', session?.id);

      // 显示专业模式提示
      const expertModePrompt = `🎯 **专业模式已启动！** 请告诉我你想创建什么类型的Web项目？`

      // 手动添加一个系统提示消息到会话历史
      if (session) {
        const expertModeMessage = {
          id: `msg-${Date.now()}-expertmode`,
          timestamp: new Date(),
          type: 'agent_response' as const,
          agent: 'system',
          content: expertModePrompt,
          metadata: {
            expertMode: true,
            awaitingUserInput: true
          }
        }
        
        session.conversationHistory.push(expertModeMessage)
      }

      console.log('🎯 [专业模式测试] 专业模式准备完成，等待用户输入...');

    } catch (error) {
      console.error('❌ [专业模式测试] 启动失败:', error)
    }
  }

  // 返回对话模式
  const handleBackToChat = () => {
    console.log('🔄 [返回对话] 从代码模式返回对话模式');
    
    // 🔧 修复：确保能够返回到对话状态
    setIsCodeMode(false);
    
    // 🔧 标记用户手动返回，防止自动切换回代码模式
    setUserManuallyReturnedToChat(true);
    console.log('🔧 [手动返回] 设置用户手动返回标志，防止自动切换');
    
    // 🔧 选择策略：如果没有实际对话历史，直接返回欢迎页面，否则返回对话模式
    if (currentSession && currentSession.conversationHistory.length > 0) {
      // 有对话历史，尝试返回对话模式
      console.log('📝 [返回策略] 检测到对话历史，返回对话模式');
      setHasStartedChat(true);
      
      // 🔧 只清理等待用户输入的专家模式消息，保留已生成的代码
      const filteredHistory = currentSession.conversationHistory.filter(msg => 
        !(msg.metadata?.expertMode && msg.metadata?.awaitingUserInput)
      );
      
      console.log('🔍 [清理前] 对话历史长度:', currentSession.conversationHistory.length);
      console.log('🔍 [清理后] 对话历史长度:', filteredHistory.length);
      
      currentSession.conversationHistory = filteredHistory;
      
      // 🔧 如果过滤后没有任何对话历史，添加一条系统消息来维持对话状态
      if (filteredHistory.length === 0) {
        console.log('🔧 [修复] 过滤后没有对话历史，添加系统消息');
        const systemMessage = {
          id: `msg-${Date.now()}`,
          timestamp: new Date(),
          type: 'agent_response' as const,
          agent: 'system',
          content: '您已从代码模式返回。您可以继续与我对话，或者重新进入代码模式查看生成的代码。',
          metadata: {}
        };
        currentSession.conversationHistory.push(systemMessage);
      }
    } else {
      // 没有对话历史，返回欢迎页面
      console.log('🏠 [返回策略] 没有对话历史，返回欢迎页面');
      setHasStartedChat(false);
    }
    
    // 🔧 确保生成的代码文件仍然可以被检测到
    if (currentSession) {
      const hasProjectFiles = currentSession.conversationHistory.some(msg => 
        msg.metadata?.projectFiles && Array.isArray(msg.metadata.projectFiles)
      );
      
      console.log('🔍 [检查] 对话历史中是否有projectFiles:', hasProjectFiles);
      if (hasProjectFiles) {
        console.log('✅ [保留] 代码文件数据已保留，可以重新进入代码模式');
      }
    }
  }

  // 处理侧边栏折叠切换
  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed)
  }

  // 🔧 新增：切换到代码模式的函数
  const handleSwitchToCodeMode = () => {
    console.log('🔄 [切换模式] 从对话模式切换到代码模式');
    setIsCodeMode(true);
    
    // 🔧 重置手动返回标志，允许以后自动切换
    setUserManuallyReturnedToChat(false);
    console.log('🔧 [重置标志] 清除手动返回标志，允许自动切换');
    
    // 🔧 如果没有代码数据，尝试重新提取
    if (generatedCode.length === 0 && currentSession) {
      const projectMessages = currentSession.conversationHistory.filter((msg: any) => 
        msg.metadata?.projectFiles && Array.isArray(msg.metadata.projectFiles)
      );
      
      if (projectMessages.length > 0) {
        const latestProjectMessage = projectMessages[projectMessages.length - 1];
        const extractedCode = latestProjectMessage.metadata?.projectFiles || [];
        setGeneratedCode(extractedCode);
        console.log('✅ [重新提取] 成功提取', extractedCode.length, '个代码文件');
      }
    }
  }

  // 🔧 将切换函数暴露到全局，供ChatModeView使用
  useEffect(() => {
    (window as any).switchToCodeMode = handleSwitchToCodeMode;
    
    return () => {
      delete (window as any).switchToCodeMode;
    };
  }, [generatedCode.length, currentSession]);

  // 🔧 新增：会话恢复机制，处理临时会话丢失问题
  useEffect(() => {
    if (currentSession && currentSession.conversationHistory.length > 0) {
      // 检查是否有代码生成但会话可能丢失的情况
      const hasRecentCodeGeneration = currentSession.conversationHistory.some(msg => 
        msg.metadata?.projectGenerated || 
        msg.metadata?.hasCodeFiles ||
        (msg.metadata?.intent === 'project_complete' && msg.timestamp && 
         new Date().getTime() - new Date(msg.timestamp).getTime() < 10 * 60 * 1000) // 10分钟内
      );
      
      if (hasRecentCodeGeneration && !isCodeMode && generatedCode.length === 0) {
        console.log('🔧 [会话恢复] 检测到最近的代码生成，尝试恢复代码模式');
        
        // 尝试重新提取代码文件
        const projectMessages = currentSession.conversationHistory.filter((msg: any) => 
          msg.metadata?.projectFiles && Array.isArray(msg.metadata.projectFiles)
        );
        
        if (projectMessages.length > 0) {
          const latestProjectMessage = projectMessages[projectMessages.length - 1];
          const extractedCode = latestProjectMessage.metadata?.projectFiles || [];
          
          if (extractedCode.length > 0) {
            console.log('✅ [会话恢复] 成功恢复', extractedCode.length, '个代码文件');
            setGeneratedCode(extractedCode);
            // 不自动切换到代码模式，让用户选择
          }
        }
      }
    }
  }, [currentSession, isCodeMode, generatedCode.length]);

  // 🆕 处理会话删除
  const handleDeleteSession = async (sessionId: string) => {
    try {
      await deleteSession(sessionId);
      toast({
        title: "会话已删除",
        description: "会话已成功删除",
      });
      
      // 如果删除的是当前会话，重置状态
      if (currentSession?.id === sessionId) {
        setHasStartedChat(false);
        setIsCodeMode(false);
        setGeneratedCode([]);
      }
    } catch (error) {
      console.error('删除会话失败:', error);
      toast({
        title: "删除失败",
        description: "请重试",
        variant: "destructive",
      });
    }
  };

  // 🆕 处理会话分享
  const handleShareSession = async (sessionId: string) => {
    try {
      const result = await shareSession(sessionId);
      toast({
        title: "分享成功",
        description: "分享链接已复制到剪贴板",
      });
    } catch (error) {
      console.error('分享会话失败:', error);
      toast({
        title: "分享失败",
        description: "请重试",
        variant: "destructive",
      });
    }
  };

  // 🆕 处理标题更新
  const handleUpdateSessionTitle = (sessionId: string, title: string) => {
    updateSessionTitle(sessionId, title);
    toast({
      title: "标题已更新",
      description: `会话标题已更新为: ${title}`,
    });
  };

  // 🔧 管理错误监控生命周期
  useEffect(() => {
    if (isCodeMode && vercelErrorMonitor.deploymentStatus?.status !== 'ready') {
      // 进入代码模式时启动监控
      vercelErrorMonitor.startMonitoring();
    } else if (!isCodeMode && vercelErrorMonitor.isMonitoring) {
      // 离开代码模式时停止监控
      vercelErrorMonitor.stopMonitoring();
    }
  }, [isCodeMode, vercelErrorMonitor.startMonitoring, vercelErrorMonitor.stopMonitoring, vercelErrorMonitor.deploymentStatus, vercelErrorMonitor.isMonitoring]);

  // 🔧 错误监控回调 - 暂时禁用，因为没有全局输入框
  const handleCopyErrorToInput = (errorMessage: string) => {
    // TODO: 需要新的方式来处理错误复制到输入框
    setShowErrorMonitor(false);
    // 聚焦到输入框
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  };

  return (
    <div
      className={`h-screen flex transition-all duration-300 ${
        theme === "light" 
          ? "bg-page-gradient-light" 
          : "bg-page-gradient-dark"
      }`}
    >

      {/* 🎨 左侧侧边栏 - 全高度布局 */}
      <ChatSidebar 
        sessions={sessions}
        currentSession={currentSession}
        isCodeMode={isCodeMode}
        onNewChat={handleNewChat}
        onSelectSession={selectSession}
        onGenerateExpertMode={generateTestCode}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
        onDeleteSession={handleDeleteSession}
        onShareSession={handleShareSession}
        onUpdateSessionTitle={handleUpdateSessionTitle}
      />

      {/* 🎨 主内容区域 - 包含header和内容 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 🎨 顶部导航栏 - 品牌色 - 在所有模式下显示 */}
        <ChatHeader 
          chatMode={chatMode}
          onModeChange={setChatMode}
          isCodeMode={isCodeMode}
          onBackToChat={handleBackToChat}
          isPrivacyMode={isPrivacyMode}
          onPrivacyModeChange={setIsPrivacyMode}
        />

        {/* 🎨 主内容区域 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {isCodeMode ? (
            /* 代码模式 */
            <CodeModeView
              currentSession={currentSession}
              generatedCode={generatedCode}
              isGenerating={isGenerating}
              onBack={handleBackToChat}
              onSendChatMessage={sendMessage}

              onDownload={handleCodeDownload}
              onDeploy={handleDeploy}
              onEditCode={handleEditCode}
              getReactPreviewData={getReactPreviewData}
              onFileUpload={handleFileUpload}
              deploymentUrl={deploymentUrl}
            />
          ) : hasStartedChat ? (
            /* 正常对话模式 */
            <ChatModeView
              currentSession={currentSession}
              isGenerating={isGenerating}
              onSendMessage={sendMessage}

              sessionId={currentSession?.id}
              onFileUpload={handleFileUpload}
            />
          ) : (
            /* 欢迎屏幕 */
            <WelcomeScreen
              onSendMessage={handleSendMessage}
              isGenerating={isGenerating}
              chatMode={chatMode}
              onFileUpload={handleFileUpload}
              onSendWithFiles={handleSendWithFiles}
              sessionId={currentSession?.id}
              isPrivacyMode={isPrivacyMode}
            />
          )}
        </div>
      </div>

      {/* 未登录提醒对话框 */}
      <AuthPromptDialog
        isOpen={showAuthDialog}
        onClose={() => setShowAuthDialog(false)}
        title="需要登录才能继续"
        message="请先登录您的账户来继续使用"
        action="开始对话"
        onLoginSuccess={() => {
          // 登录成功回调会在useEffect中处理
          setShowAuthDialog(false);
        }}
      />

      {/* Vercel 状态指示器 - 只在代码模式下显示 */}
      {isCodeMode && vercelErrorMonitor.deploymentStatus && (
        <div className="fixed bottom-4 right-4 z-50">
          <VercelStatusIndicator
            status={vercelErrorMonitor.deploymentStatus}
            onShowErrors={() => setShowErrorMonitor(true)}
            onOpenDeployment={(url) => window.open(`https://${url}`, '_blank')}
          />
        </div>
      )}

      {/* 错误监控对话框 */}
      <ErrorMonitor
        isVisible={showErrorMonitor}
        onClose={() => setShowErrorMonitor(false)}
        errors={vercelErrorMonitor.errors}
        isMonitoring={vercelErrorMonitor.isMonitoring}
        onToggleMonitoring={() => {
          if (vercelErrorMonitor.isMonitoring) {
            vercelErrorMonitor.stopMonitoring();
          } else {
            vercelErrorMonitor.startMonitoring();
          }
        }}
        onCheckLatest={vercelErrorMonitor.checkLatestDeployment}
        isChecking={vercelErrorMonitor.isChecking}
        onCopyToInput={handleCopyErrorToInput}
      />

      {/* Debug 面板 - 开发模式下显示 */}
      {process.env.NODE_ENV === 'development' && (
        <SessionDebugPanel 
          sessionId={currentSession?.id}
        />
      )}
    </div>
  )
}
