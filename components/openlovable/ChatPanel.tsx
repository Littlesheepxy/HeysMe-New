'use client';

import { useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { motion } from 'framer-motion';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import CodeApplicationProgress, { type CodeApplicationState } from '@/components/CodeApplicationProgress';
import { ChatMessage, GenerationProgress, ConversationContext } from '@/types/openlovable';


interface ChatPanelProps {
  conversationContext: ConversationContext;
  chatMessages: ChatMessage[];
  codeApplicationState: CodeApplicationState;
  generationProgress: GenerationProgress;
  aiChatInput: string;
  setAiChatInput: (value: string) => void;
  onSendMessage: () => void;
}

export default function ChatPanel({
  conversationContext,
  chatMessages,
  codeApplicationState,
  generationProgress,
  aiChatInput,
  setAiChatInput,
  onSendMessage
}: ChatPanelProps) {
  const chatMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatMessages]);

  return (
    <div className="flex-1 max-w-[400px] flex flex-col border-r border-border bg-background">
      {conversationContext.scrapedWebsites.length > 0 && (
        <div className="p-4 bg-card">
          <div className="flex flex-col gap-2">
            {conversationContext.scrapedWebsites.map((site, idx) => {
              // Extract favicon and site info from the scraped data
              const metadata = site.content?.metadata || {};
              const sourceURL = metadata.sourceURL || site.url;
              const favicon = metadata.favicon || `https://www.google.com/s2/favicons?domain=${new URL(sourceURL).hostname}&sz=32`;
              const siteName = metadata.ogSiteName || metadata.title || new URL(sourceURL).hostname;
              
              return (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <img 
                    src={favicon} 
                    alt={siteName}
                    className="w-4 h-4 rounded"
                    onError={(e) => {
                      e.currentTarget.src = `https://www.google.com/s2/favicons?domain=${new URL(sourceURL).hostname}&sz=32`;
                    }}
                  />
                  <a 
                    href={sourceURL} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-black hover:text-gray-700 truncate max-w-[250px]"
                    title={sourceURL}
                  >
                    {siteName}
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-1 scrollbar-hide" ref={chatMessagesRef}>
        {chatMessages.map((msg, idx) => {
          // Check if this message is from a successful generation
          const isGenerationComplete = msg.content.includes('Successfully recreated') || 
                                     msg.content.includes('AI recreation generated!') ||
                                     msg.content.includes('Code generated!');
          
          // Get the files from metadata if this is a completion message
          const completedFiles = msg.metadata?.appliedFiles || [];
          
          return (
            <div key={idx} className="block">
              <div className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} mb-1`}>
                <div className="block">
                  <div className={`block rounded-[10px] px-4 py-2 ${
                    msg.type === 'user' ? 'bg-[#36322F] text-white ml-auto max-w-[80%]' :
                    msg.type === 'ai' ? 'bg-gray-100 text-gray-900 mr-auto max-w-[80%]' :
                    msg.type === 'system' ? 'bg-[#36322F] text-white text-sm' :
                    msg.type === 'command' ? 'bg-[#36322F] text-white font-mono text-sm' :
                    msg.type === 'error' ? 'bg-red-900 text-red-100 text-sm border border-red-700' :
                    'bg-[#36322F] text-white text-sm'
                  }`}>
                {msg.type === 'command' ? (
                  <div className="flex items-start gap-2">
                    <span className={`text-xs ${
                      msg.metadata?.commandType === 'input' ? 'text-blue-400' :
                      msg.metadata?.commandType === 'error' ? 'text-red-400' :
                      msg.metadata?.commandType === 'success' ? 'text-green-400' :
                      'text-gray-400'
                    }`}>
                      {msg.metadata?.commandType === 'input' ? '$' : '>'}
                    </span>
                    <span className="flex-1 whitespace-pre-wrap text-white">{msg.content}</span>
                  </div>
                ) : msg.type === 'error' ? (
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-red-800 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-red-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold mb-1">Build Errors Detected</div>
                      <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
                      <div className="mt-2 text-xs opacity-70">Press 'F' or click the Fix button above to resolve</div>
                    </div>
                  </div>
                ) : (
                  msg.content
                )}
                  </div>
              
                  {/* Show applied files if this is an apply success message */}
                  {msg.metadata?.appliedFiles && msg.metadata.appliedFiles.length > 0 && (
                <div className="mt-2 inline-block bg-gray-100 rounded-[10px] p-3">
                  <div className="text-xs font-medium mb-1 text-gray-700">
                    {msg.content.includes('Applied') ? 'Files Updated:' : 'Generated Files:'}
                  </div>
                  <div className="flex flex-wrap items-start gap-1">
                    {msg.metadata.appliedFiles.map((filePath, fileIdx) => {
                      const fileName = filePath.split('/').pop() || filePath;
                      const fileExt = fileName.split('.').pop() || '';
                      const fileType = fileExt === 'jsx' || fileExt === 'js' ? 'javascript' :
                                      fileExt === 'css' ? 'css' :
                                      fileExt === 'json' ? 'json' : 'text';
                      
                      return (
                        <div
                          key={`applied-${fileIdx}`}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-[#36322F] text-white rounded-[10px] text-xs animate-fade-in-up"
                          style={{ animationDelay: `${fileIdx * 30}ms` }}
                        >
                          <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                            fileType === 'css' ? 'bg-blue-400' :
                            fileType === 'javascript' ? 'bg-yellow-400' :
                            fileType === 'json' ? 'bg-green-400' :
                            'bg-gray-400'
                          }`} />
                          {fileName}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
                  {/* Show generated files for completion messages - but only if no appliedFiles already shown */}
                  {isGenerationComplete && generationProgress.files.length > 0 && idx === chatMessages.length - 1 && !msg.metadata?.appliedFiles && !chatMessages.some(m => m.metadata?.appliedFiles) && (
                <div className="mt-2 inline-block bg-gray-100 rounded-[10px] p-3">
                  <div className="text-xs font-medium mb-1 text-gray-700">Generated Files:</div>
                  <div className="flex flex-wrap items-start gap-1">
                    {generationProgress.files.map((file, fileIdx) => (
                      <div
                        key={`complete-${fileIdx}`}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-[#36322F] text-white rounded-[10px] text-xs animate-fade-in-up"
                        style={{ animationDelay: `${fileIdx * 30}ms` }}
                      >
                        <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                          file.type === 'css' ? 'bg-blue-400' :
                          file.type === 'javascript' ? 'bg-yellow-400' :
                          file.type === 'json' ? 'bg-green-400' :
                          'bg-gray-400'
                        }`} />
                        {file.path.split('/').pop()}
                      </div>
                    ))}
                  </div>
                </div>
              )}
                </div>
                </div>
              </div>
          );
        })}
        
        {/* Code application progress */}
        {codeApplicationState.stage && (
          <CodeApplicationProgress state={codeApplicationState} />
        )}
        
        {/* File generation progress - inline display (during generation) */}
        {generationProgress.isGenerating && (
          <div className="inline-block bg-gray-100 rounded-lg p-3">
            <div className="text-sm font-medium mb-2 text-gray-700">
              {generationProgress.status}
            </div>
            <div className="flex flex-wrap items-start gap-1">
              {/* Show completed files */}
              {generationProgress.files.map((file, idx) => (
                <div
                  key={`file-${idx}`}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-[#36322F] text-white rounded-[10px] text-xs animate-fade-in-up"
                  style={{ animationDelay: `${idx * 30}ms` }}
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                  {file.path.split('/').pop()}
                </div>
              ))}
              
              {/* Show current file being generated */}
              {generationProgress.currentFile && (
                <div className="flex items-center gap-1 px-2 py-1 bg-[#36322F]/70 text-white rounded-[10px] text-xs animate-pulse"
                  style={{ animationDelay: `${generationProgress.files.length * 30}ms` }}>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {generationProgress.currentFile.path.split('/').pop()}
                </div>
              )}
            </div>
            
            {/* Live streaming response display */}
            {generationProgress.streamedCode && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-3 border-t border-gray-300 pt-3"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-xs font-medium text-gray-600">AI Response Stream</span>
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent" />
                </div>
                <div className="bg-gray-900 border border-gray-700 rounded max-h-32 overflow-y-auto scrollbar-hide">
                  <SyntaxHighlighter
                    language="jsx"
                    style={vscDarkPlus}
                    customStyle={{
                      margin: 0,
                      padding: '0.75rem',
                      fontSize: '11px',
                      lineHeight: '1.5',
                      background: 'transparent',
                      maxHeight: '8rem',
                      overflow: 'hidden'
                    }}
                  >
                    {(() => {
                      const lastContent = generationProgress.streamedCode.slice(-1000);
                      // Show the last part of the stream, starting from a complete tag if possible
                      const startIndex = lastContent.indexOf('<');
                      return startIndex !== -1 ? lastContent.slice(startIndex) : lastContent;
                    })()}
                  </SyntaxHighlighter>
                  <span className="inline-block w-2 h-3 bg-orange-400 ml-3 mb-3 animate-pulse" />
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border bg-card">
        <div className="relative">
          <Textarea
            className="min-h-[60px] pr-12 resize-y border-2 border-black focus:outline-none"
            placeholder=""
            value={aiChatInput}
            onChange={(e) => setAiChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSendMessage();
              }
            }}
            rows={3}
          />
          <button
            onClick={onSendMessage}
            className="absolute right-2 bottom-2 p-2 bg-[#36322F] text-white rounded-[10px] hover:bg-[#4a4542] [box-shadow:inset_0px_-2px_0px_0px_#171310,_0px_1px_6px_0px_rgba(58,_33,_8,_58%)] hover:translate-y-[1px] hover:scale-[0.98] hover:[box-shadow:inset_0px_-1px_0px_0px_#171310,_0px_1px_3px_0px_rgba(58,_33,_8,_40%)] active:translate-y-[2px] active:scale-[0.97] active:[box-shadow:inset_0px_1px_1px_0px_#171310,_0px_1px_2px_0px_rgba(58,_33,_8,_30%)] transition-all duration-200"
            title="Send message (Enter)"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
