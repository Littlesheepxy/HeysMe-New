'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { appConfig } from '@/config/app.config';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { simpleMessageRouter } from '@/lib/routers/simple-message-router';
import { ChatMessage, GenerationProgress, ConversationContext, SandboxData } from '@/types/openlovable';

// Import our modular components
import TopBar from '@/components/openlovable/TopBar';
import ChatPanel from '@/components/openlovable/ChatPanel';
import MainContentPanel from '@/components/openlovable/MainContentPanel';
import { CodeApplicationState } from '@/components/CodeApplicationProgress';

/**
 * AI代码生成页面 - 完整的Open Lovable功能集成
 * 这个页面将Open Lovable的完整功能集成到HeysMe中
 */
export default function CodingPage() {
  // Core state
  const [sandboxData, setSandboxData] = useState<SandboxData | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ text: 'Not connected', active: false });
  
  // 移除HomeScreen相关状态，直接显示聊天界面
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      content: '🚀 欢迎来到HeysMe AI代码生成器！\n\n我可以根据您的需求生成完整的React应用。您可以：\n\n• 描述您想要的功能和设计\n• 我会自动创建开发环境\n• 实时预览生成的代码\n• 所有代码都可以下载使用\n\n请开始描述您的项目需求吧！',
      type: 'system',
      timestamp: new Date()
    }
  ]);
  const [aiChatInput, setAiChatInput] = useState('');
  
  // UI state
  const [activeTab, setActiveTab] = useState<'generation' | 'preview'>('preview');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['app', 'src', 'src/components']));
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  
  // Generation state
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress>({
    isGenerating: false,
    status: '',
    components: [],
    currentComponent: 0,
    streamedCode: '',
    isStreaming: false,
    isThinking: false,
    files: [],
    lastProcessedPosition: 0
  });
  
  // Code application state
  const [codeApplicationState, setCodeApplicationState] = useState<CodeApplicationState>({
    stage: null
  });
  
  // Conversation context
  const [conversationContext, setConversationContext] = useState<ConversationContext>({
    scrapedWebsites: [],
    generatedComponents: [],
    appliedCode: [],
    currentProject: '',
    lastGeneratedCode: undefined
  });
  
  // 简化UI状态，移除不需要的截图和URL相关状态
  const [loadingStage, setLoadingStage] = useState<'gathering' | 'planning' | 'generating' | null>(null);
  
  // Router and search params
  const searchParams = useSearchParams();
  const router = useRouter();
  const [aiModel, setAiModel] = useState(() => {
    const modelParam = searchParams.get('model');
    return appConfig.ai.availableModels.includes(modelParam || '') ? modelParam! : appConfig.ai.defaultModel;
  });
  
  // Refs
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  
  // Initialize sandbox on mount
  useEffect(() => {
    let isMounted = true;

    const initializePage = async () => {
      // Clear old conversation
      try {
        await fetch('/api/conversation-state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'clear-old' })
        });
        console.log('[coding] Cleared old conversation data on mount');
      } catch (error) {
        console.error('[coding] Failed to clear old conversation:', error);
      }
      
      if (!isMounted) return;

      // Check if sandbox ID is in URL
      const sandboxIdParam = searchParams.get('sandbox');
      
      setLoading(true);
      try {
        if (sandboxIdParam) {
          console.log('[coding] Attempting to restore sandbox:', sandboxIdParam);
          await createSandbox(true);
        } else {
          console.log('[coding] No sandbox in URL, creating new sandbox automatically...');
          await createSandbox(true);
        }
      } catch (error) {
        console.error('[coding] Failed to create or restore sandbox:', error);
        if (isMounted) {
          addChatMessage('Failed to create or restore sandbox.', 'error');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    initializePage();

    return () => {
      isMounted = false;
    };
  }, []); // Run only on mount
  
  // 移除HomeScreen相关的键盘事件处理，因为我们直接显示聊天界面
  
  // Utility functions
  const updateStatus = (text: string, active: boolean) => {
    setStatus({ text, active });
  };

  const addChatMessage = (content: string, type: ChatMessage['type'], metadata?: ChatMessage['metadata']) => {
    setChatMessages(prev => {
      // Skip duplicate consecutive system messages
      if (type === 'system' && prev.length > 0) {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage.type === 'system' && lastMessage.content === content) {
          return prev; // Skip duplicate
        }
      }
      return [...prev, { content, type, timestamp: new Date(), metadata }];
    });
  };
  
  // Sandbox management
  const createSandbox = async (fromHomeScreen = false) => {
    console.log('[createSandbox] Starting sandbox creation...');
    setLoading(true);
    updateStatus('Creating sandbox...', false);
    
    try {
      const response = await fetch('/api/create-ai-sandbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      
      const data = await response.json();
      console.log('[createSandbox] Response data:', data);
      
      if (data.success) {
        setSandboxData(data);
        updateStatus('Sandbox active', true);
        
        // Update URL with sandbox ID
        const newParams = new URLSearchParams(searchParams.toString());
        newParams.set('sandbox', data.sandboxId);
        newParams.set('model', aiModel);
        router.push(`/coding?${newParams.toString()}`, { scroll: false });
        
        // Only add welcome message if not coming from home screen
        if (!fromHomeScreen) {
          addChatMessage(`Sandbox created! ID: ${data.sandboxId}. I now have context of your sandbox and can help you build your app. Just ask me to create components and I'll automatically apply them!

Tip: I automatically detect and install npm packages from your code imports (like react-router-dom, axios, etc.)`, 'system');
        }
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error: any) {
      console.error('[createSandbox] Error:', error);
      updateStatus('Error', false);
      addChatMessage(`Failed to create sandbox: ${error.message}`, 'system');
    } finally {
      setLoading(false);
    }
  };

  const reapplyLastGeneration = async () => {
    if (!conversationContext.lastGeneratedCode) {
      addChatMessage('No previous generation to re-apply', 'system');
      return;
    }
    
    if (!sandboxData) {
      addChatMessage('Please create a sandbox first', 'system');
      return;
    }
    
    addChatMessage('Re-applying last generation...', 'system');
    // Here you would implement the re-apply logic using simpleMessageRouter
  };

  const downloadZip = async () => {
    if (!sandboxData) {
      addChatMessage('No active sandbox to download. Create a sandbox first!', 'system');
      return;
    }
    
    setLoading(true);
    addChatMessage('Creating ZIP file of your Vite app...', 'system');
    
    try {
      const response = await fetch('/api/create-zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      if (data.success) {
        addChatMessage('ZIP file created! Download starting...', 'system');
        
        const link = document.createElement('a');
        link.href = data.dataUrl;
        link.download = data.fileName || 'e2b-project.zip';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        addChatMessage(
          'Your Vite app has been downloaded! To run it locally:\n' +
          '1. Unzip the file\n' +
          '2. Run: npm install\n' +
          '3. Run: npm run dev\n' +
          '4. Open http://localhost:5173',
          'system'
        );
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      addChatMessage(`Failed to create ZIP: ${error.message}`, 'system');
    } finally {
      setLoading(false);
    }
  };
  
  // Chat functions
  const sendChatMessage = async () => {
    const message = aiChatInput.trim();
    if (!message) return;
    
    addChatMessage(message, 'user');
    setAiChatInput('');
    
    // Use the simpleMessageRouter to handle the message
    try {
      const sessionData = {
        sessionId: 'coding-session',
        userId: 'coding-user',
        id: 'coding-session',
        status: 'active',
        userIntent: message,
        personalization: {},
        stage: 'code_generation',
        metadata: {
          hasUserProfile: true,
          mode: 'professional',
          userProfile: {
            displayName: "HeysMe Coding User",
            role: "developer",
            experience: "intermediate",
            primarySkills: ["React", "JavaScript"],
            designStyle: "modern"
          }
        },
        messages: chatMessages,
        createdAt: new Date(),
        updatedAt: new Date()
      } as any;

      const responseStream = simpleMessageRouter.callOpenLovableGeneration(message, sessionData);
      
      for await (const response of responseStream) {
        if (response.type === 'agent_response') {
          if (response.immediate_display?.reply) {
            addChatMessage(response.immediate_display.reply, 'ai');
          }
          
          // Handle different stages of progress
          if (response.system_state?.current_stage === '环境准备') {
            setGenerationProgress(prev => ({ ...prev, isGenerating: true, status: 'Creating sandbox...' }));
          } else if (response.system_state?.current_stage === 'AI代码生成中') {
            setGenerationProgress(prev => ({ ...prev, status: 'Generating code...' }));
          } else if (response.system_state?.current_stage === '完成') {
            setGenerationProgress(prev => ({ ...prev, isGenerating: false, status: 'Complete!' }));
            // Update sandbox data if available
            if (response.system_state?.metadata?.sandbox) {
              setSandboxData(response.system_state.metadata.sandbox);
            }
          }
        }
      }
    } catch (error: any) {
      addChatMessage(`Error: ${error.message}`, 'system');
    }
  };
  
  // 移除HomeScreen相关函数，因为我们直接使用聊天界面

  // File management
  const toggleFolder = (folderPath: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderPath)) {
      newExpanded.delete(folderPath);
    } else {
      newExpanded.add(folderPath);
    }
    setExpandedFolders(newExpanded);
  };

  const handleFileClick = (filePath: string) => {
    setSelectedFile(filePath || null);
  };

  const handleRefreshSandbox = () => {
    if (iframeRef.current && sandboxData?.url) {
      const newSrc = `${sandboxData.url}?t=${Date.now()}&manual=true`;
      iframeRef.current.src = newSrc;
    }
  };

  return (
    <div className="font-sans bg-background text-foreground h-screen flex flex-col">
      {/* Theme Toggle */}
      <ThemeToggle />
      
      {/* Top Bar */}
      <TopBar
        aiModel={aiModel}
        setAiModel={setAiModel}
        status={status}
        onCreateSandbox={() => createSandbox()}
        onReapplyLastGeneration={reapplyLastGeneration}
        onDownloadZip={downloadZip}
        canReapply={!!(conversationContext.lastGeneratedCode && sandboxData)}
        sandboxData={sandboxData}
        searchParams={searchParams}
        router={router}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Chat Panel */}
        <ChatPanel
          conversationContext={conversationContext}
          chatMessages={chatMessages}
          codeApplicationState={codeApplicationState}
          generationProgress={generationProgress}
          aiChatInput={aiChatInput}
          setAiChatInput={setAiChatInput}
          onSendMessage={sendChatMessage}
        />

        {/* Main Content Panel */}
        <MainContentPanel
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          generationProgress={generationProgress}
          sandboxData={sandboxData}
          loading={loading}
          isCapturingScreenshot={false}
          urlScreenshot={null}
          isPreparingDesign={false}
          targetUrl=""
          loadingStage={loadingStage}
          screenshotError={null}
          iframeRef={iframeRef}
          expandedFolders={expandedFolders}
          selectedFile={selectedFile}
          onToggleFolder={toggleFolder}
          onFileClick={handleFileClick}
          onRefreshSandbox={handleRefreshSandbox}
        />
      </div>
    </div>
  );
}