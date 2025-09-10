'use client';

import { useRef, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { 
  SiJavascript, 
  SiReact, 
  SiCss3, 
  SiJson,
  FiFile
} from '@/lib/icons';

import { GenerationProgress } from '@/types/openlovable';

interface CodeDisplayProps {
  generationProgress: GenerationProgress;
  selectedFile: string | null;
  onCloseFile: () => void;
}

export default function CodeDisplay({
  generationProgress,
  selectedFile,
  onCloseFile
}: CodeDisplayProps) {
  const codeDisplayRef = useRef<HTMLDivElement>(null);

  // Auto-scroll code display to bottom when streaming
  useEffect(() => {
    if (codeDisplayRef.current && generationProgress.isStreaming) {
      codeDisplayRef.current.scrollTop = codeDisplayRef.current.scrollHeight;
    }
  }, [generationProgress.streamedCode, generationProgress.isStreaming]);

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    
    if (ext === 'jsx' || ext === 'js') {
      return <SiJavascript className="w-4 h-4 text-yellow-500" />;
    } else if (ext === 'tsx' || ext === 'ts') {
      return <SiReact className="w-4 h-4 text-blue-500" />;
    } else if (ext === 'css') {
      return <SiCss3 className="w-4 h-4 text-blue-500" />;
    } else if (ext === 'json') {
      return <SiJson className="w-4 h-4 text-gray-600" />;
    } else {
      return <FiFile className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Thinking Mode Display - Only show during active generation */}
      {generationProgress.isGenerating && (generationProgress.isThinking || generationProgress.thinkingText) && (
        <div className="px-6 pb-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="text-purple-600 font-medium flex items-center gap-2">
              {generationProgress.isThinking ? (
                <>
                  <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse" />
                  AI is thinking...
                </>
              ) : (
                <>
                  <span className="text-purple-600">✓</span>
                  Thought for {generationProgress.thinkingDuration || 0} seconds
                </>
              )}
            </div>
          </div>
          {generationProgress.thinkingText && (
            <div className="bg-purple-950 border border-purple-700 rounded-lg p-4 max-h-48 overflow-y-auto scrollbar-hide">
              <pre className="text-xs font-mono text-purple-300 whitespace-pre-wrap">
                {generationProgress.thinkingText}
              </pre>
            </div>
          )}
        </div>
      )}
      
      {/* Live Code Display */}
      <div className="flex-1 rounded-lg p-6 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto min-h-0 scrollbar-hide" ref={codeDisplayRef}>
          {/* Show selected file if one is selected */}
          {selectedFile ? (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="bg-black border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                <div className="px-4 py-2 bg-[#36322F] text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getFileIcon(selectedFile)}
                    <span className="font-mono text-sm">{selectedFile}</span>
                  </div>
                  <button
                    onClick={onCloseFile}
                    className="hover:bg-black/20 p-1 rounded transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="bg-gray-900 border border-gray-700 rounded">
                  <SyntaxHighlighter
                    language={(() => {
                      const ext = selectedFile.split('.').pop()?.toLowerCase();
                      if (ext === 'css') return 'css';
                      if (ext === 'json') return 'json';
                      if (ext === 'html') return 'html';
                      return 'jsx';
                    })()}
                    style={vscDarkPlus}
                    customStyle={{
                      margin: 0,
                      padding: '1rem',
                      fontSize: '0.875rem',
                      background: 'transparent',
                    }}
                    showLineNumbers={true}
                  >
                    {(() => {
                      // Find the file content from generated files
                      const file = generationProgress.files.find(f => f.path === selectedFile);
                      return file?.content || '// File content will appear here';
                    })()}
                  </SyntaxHighlighter>
                </div>
              </div>
            </div>
          ) : /* If no files parsed yet, show loading or raw stream */
          generationProgress.files.length === 0 && !generationProgress.currentFile ? (
            generationProgress.isThinking ? (
              // Beautiful loading state while thinking
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="mb-8 relative">
                    <div className="w-24 h-24 mx-auto">
                      <div className="absolute inset-0 border-4 border-gray-800 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-green-500 rounded-full animate-spin border-t-transparent"></div>
                    </div>
                  </div>
                  <h3 className="text-xl font-medium text-white mb-2">AI is analyzing your request</h3>
                  <p className="text-gray-400 text-sm">{generationProgress.status || 'Preparing to generate code...'}</p>
                </div>
              </div>
            ) : (
              <div className="bg-black border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-4 py-2 bg-gray-100 text-gray-900 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    <span className="font-mono text-sm">Streaming code...</span>
                  </div>
                </div>
                <div className="p-4 bg-gray-900 rounded">
                  <SyntaxHighlighter
                    language="jsx"
                    style={vscDarkPlus}
                    customStyle={{
                      margin: 0,
                      padding: '1rem',
                      fontSize: '0.875rem',
                      background: 'transparent',
                    }}
                    showLineNumbers={true}
                  >
                    {generationProgress.streamedCode || 'Starting code generation...'}
                  </SyntaxHighlighter>
                  <span className="inline-block w-2 h-4 bg-orange-400 ml-1 animate-pulse" />
                </div>
              </div>
            )
          ) : (
            <div className="space-y-4">
              {/* Show current file being generated */}
              {generationProgress.currentFile && (
                <div className="bg-black border-2 border-gray-400 rounded-lg overflow-hidden shadow-sm">
                  <div className="px-4 py-2 bg-[#36322F] text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span className="font-mono text-sm">{generationProgress.currentFile.path}</span>
                      <span className={`px-2 py-0.5 text-xs rounded ${
                        generationProgress.currentFile.type === 'css' ? 'bg-blue-600 text-white' :
                        generationProgress.currentFile.type === 'javascript' ? 'bg-yellow-600 text-white' :
                        generationProgress.currentFile.type === 'json' ? 'bg-green-600 text-white' :
                        'bg-gray-200 text-gray-700'
                      }`}>
                        {generationProgress.currentFile.type === 'javascript' ? 'JSX' : generationProgress.currentFile.type.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="bg-gray-900 border border-gray-700 rounded">
                    <SyntaxHighlighter
                      language={
                        generationProgress.currentFile.type === 'css' ? 'css' :
                        generationProgress.currentFile.type === 'json' ? 'json' :
                        generationProgress.currentFile.type === 'html' ? 'html' :
                        'jsx'
                      }
                      style={vscDarkPlus}
                      customStyle={{
                        margin: 0,
                        padding: '1rem',
                        fontSize: '0.75rem',
                        background: 'transparent',
                      }}
                      showLineNumbers={true}
                    >
                      {generationProgress.currentFile.content}
                    </SyntaxHighlighter>
                    <span className="inline-block w-2 h-3 bg-orange-400 ml-4 mb-4 animate-pulse" />
                  </div>
                </div>
              )}
              
              {/* Show completed files */}
              {generationProgress.files.map((file, idx) => (
                <div key={idx} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="px-4 py-2 bg-[#36322F] text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span className="font-mono text-sm">{file.path}</span>
                    </div>
                    <span className={`px-2 py-0.5 text-xs rounded ${
                      file.type === 'css' ? 'bg-blue-600 text-white' :
                      file.type === 'javascript' ? 'bg-yellow-600 text-white' :
                      file.type === 'json' ? 'bg-green-600 text-white' :
                      'bg-gray-200 text-gray-700'
                    }`}>
                      {file.type === 'javascript' ? 'JSX' : file.type.toUpperCase()}
                    </span>
                  </div>
                  <div className="bg-gray-900 border border-gray-700  max-h-48 overflow-y-auto scrollbar-hide">
                    <SyntaxHighlighter
                      language={
                        file.type === 'css' ? 'css' :
                        file.type === 'json' ? 'json' :
                        file.type === 'html' ? 'html' :
                        'jsx'
                      }
                      style={vscDarkPlus}
                      customStyle={{
                        margin: 0,
                        padding: '1rem',
                        fontSize: '0.75rem',
                        background: 'transparent',
                      }}
                      showLineNumbers={true}
                      wrapLongLines={true}
                    >
                      {file.content}
                    </SyntaxHighlighter>
                  </div>
                </div>
              ))}
              
              {/* Show remaining raw stream if there's content after the last file */}
              {!generationProgress.currentFile && generationProgress.streamedCode.length > 0 && (
                <div className="bg-black border border-gray-200 rounded-lg overflow-hidden">
                  <div className="px-4 py-2 bg-[#36322F] text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                      <span className="font-mono text-sm">Processing...</span>
                    </div>
                  </div>
                  <div className="bg-gray-900 border border-gray-700 rounded">
                    <SyntaxHighlighter
                      language="jsx"
                      style={vscDarkPlus}
                      customStyle={{
                        margin: 0,
                        padding: '1rem',
                        fontSize: '0.75rem',
                        background: 'transparent',
                      }}
                      showLineNumbers={false}
                    >
                      {(() => {
                        // Show only the tail of the stream after the last file
                        const lastFileEnd = generationProgress.files.length > 0 
                          ? generationProgress.streamedCode.lastIndexOf('</file>') + 7
                          : 0;
                        let remainingContent = generationProgress.streamedCode.slice(lastFileEnd).trim();
                        
                        // Remove explanation tags and content
                        remainingContent = remainingContent.replace(/<explanation>[\s\S]*?<\/explanation>/g, '').trim();
                        
                        // If only whitespace or nothing left, show waiting message
                        return remainingContent || 'Waiting for next file...';
                      })()}
                    </SyntaxHighlighter>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Progress indicator */}
      {generationProgress.components.length > 0 && (
        <div className="mx-6 mb-6">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-300"
              style={{
                width: `${(generationProgress.currentComponent / Math.max(generationProgress.components.length, 1)) * 100}%`
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
