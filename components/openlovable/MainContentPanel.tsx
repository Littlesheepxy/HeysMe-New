'use client';

import { Button } from '@/components/ui/button';
import FileExplorer from '@/components/openlovable/FileExplorer';
import CodeDisplay from '@/components/openlovable/CodeDisplay';
import SandboxPreview from '@/components/SandboxPreview';

import { GenerationProgress } from '@/types/openlovable';

interface MainContentPanelProps {
  activeTab: 'generation' | 'preview';
  setActiveTab: (tab: 'generation' | 'preview') => void;
  generationProgress: GenerationProgress;
  sandboxData: any;
  loading: boolean;
  isCapturingScreenshot: boolean;
  urlScreenshot: string | null;
  isPreparingDesign: boolean;
  targetUrl: string;
  loadingStage: 'gathering' | 'planning' | 'generating' | null;
  screenshotError: string | null;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  expandedFolders: Set<string>;
  selectedFile: string | null;
  onToggleFolder: (folder: string) => void;
  onFileClick: (file: string) => void;
  onRefreshSandbox: () => void;
}

export default function MainContentPanel({
  activeTab,
  setActiveTab,
  generationProgress,
  sandboxData,
  loading,
  isCapturingScreenshot,
  urlScreenshot,
  isPreparingDesign,
  targetUrl,
  loadingStage,
  screenshotError,
  iframeRef,
  expandedFolders,
  selectedFile,
  onToggleFolder,
  onFileClick,
  onRefreshSandbox
}: MainContentPanelProps) {

  const renderMainContent = () => {
    if (activeTab === 'generation' && (generationProgress.isGenerating || generationProgress.files.length > 0)) {
      return (
        <div className="absolute inset-0 flex overflow-hidden">
          {/* File Explorer - Hide during edits */}
          {!generationProgress.isEdit && (
            <FileExplorer
              generationProgress={generationProgress}
              expandedFolders={expandedFolders}
              selectedFile={selectedFile}
              onToggleFolder={onToggleFolder}
              onFileClick={onFileClick}
            />
          )}
          
          {/* Code Content */}
          <CodeDisplay
            generationProgress={generationProgress}
            selectedFile={selectedFile}
            onCloseFile={() => onFileClick('')}
          />
        </div>
      );
    } else if (activeTab === 'preview') {
      // Show screenshot when we have one and (loading OR generating OR no sandbox yet)
      if (urlScreenshot && (loading || generationProgress.isGenerating || !sandboxData?.url || isPreparingDesign)) {
        return (
          <div className="relative w-full h-full bg-gray-100">
            <img 
              src={urlScreenshot} 
              alt="Website preview" 
              className="w-full h-full object-contain"
            />
            {(generationProgress.isGenerating || isPreparingDesign) && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div className="text-center bg-black/70 rounded-lg p-6 backdrop-blur-sm">
                  <div className="w-12 h-12 border-3 border-gray-300 border-t-white rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-white text-sm font-medium">
                    {generationProgress.isGenerating ? 'Generating code...' : `Preparing your design for ${targetUrl}...`}
                  </p>
                </div>
              </div>
            )}
          </div>
        );
      }
      
      // Check loading stage FIRST to prevent showing old sandbox
      // Don't show loading overlay for edits
      if (loadingStage || (generationProgress.isGenerating && !generationProgress.isEdit)) {
        return (
          <div className="relative w-full h-full bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <div className="mb-8">
                <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto"></div>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {loadingStage === 'gathering' && 'Gathering website information...'}
                {loadingStage === 'planning' && 'Planning your design...'}
                {(loadingStage === 'generating' || generationProgress.isGenerating) && 'Generating your application...'}
              </h3>
              <p className="text-gray-600 text-sm">
                {loadingStage === 'gathering' && 'Analyzing the website structure and content'}
                {loadingStage === 'planning' && 'Creating the optimal React component architecture'}
                {(loadingStage === 'generating' || generationProgress.isGenerating) && 'Writing clean, modern code for your app'}
              </p>
            </div>
          </div>
        );
      }
      
      // Show sandbox iframe only when not in any loading state
      if (sandboxData?.url && !loading) {
        return (
          <div className="relative w-full h-full">
            <SandboxPreview
              sandboxId={sandboxData.sandboxId}
              port={5173}
              type="vite"
              isLoading={loading}
            />
            {/* Refresh button */}
            <button
              onClick={onRefreshSandbox}
              className="absolute bottom-4 right-4 bg-white/90 hover:bg-white text-gray-700 p-2 rounded-lg shadow-lg transition-all duration-200 hover:scale-105"
              title="Refresh sandbox"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        );
      }
      
      // Show loading animation when capturing screenshot
      if (isCapturingScreenshot) {
        return (
          <div className="flex items-center justify-center h-full bg-gray-900">
            <div className="text-center">
              <div className="w-12 h-12 border-3 border-gray-600 border-t-white rounded-full animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white">Gathering website information</h3>
            </div>
          </div>
        );
      }
      
      // Default state when no sandbox and no screenshot
      return (
        <div className="flex items-center justify-center h-full bg-gray-50 text-gray-600 text-lg">
          {screenshotError ? (
            <div className="text-center">
              <p className="mb-2">Failed to capture screenshot</p>
              <p className="text-sm text-gray-500">{screenshotError}</p>
            </div>
          ) : sandboxData ? (
            <div className="text-gray-500">
              <div className="w-8 h-8 border-2 border-gray-300 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm">Loading preview...</p>
            </div>
          ) : (
            <div className="text-gray-500 text-center">
              <p className="text-sm">Start chatting to create your first app</p>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-4 py-2 bg-card border-b border-border flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="flex bg-[#36322F] rounded-lg p-1">
            <button
              onClick={() => setActiveTab('generation')}
              className={`p-2 rounded-md transition-all ${
                activeTab === 'generation' 
                  ? 'bg-black text-white' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
              title="Code"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`p-2 rounded-md transition-all ${
                activeTab === 'preview' 
                  ? 'bg-black text-white' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
              title="Preview"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          {/* Live Code Generation Status - Moved to far right */}
          {activeTab === 'generation' && (generationProgress.isGenerating || generationProgress.files.length > 0) && (
            <div className="flex items-center gap-3">
              {!generationProgress.isEdit && (
                <div className="text-gray-600 text-sm">
                  {generationProgress.files.length} files generated
                </div>
              )}
              <div className={`inline-flex items-center justify-center whitespace-nowrap rounded-[10px] font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-[#36322F] text-white hover:bg-[#36322F] [box-shadow:inset_0px_-2px_0px_0px_#171310,_0px_1px_6px_0px_rgba(58,_33,_8,_58%)] hover:translate-y-[1px] hover:scale-[0.98] hover:[box-shadow:inset_0px_-1px_0px_0px_#171310,_0px_1px_3px_0px_rgba(58,_33,_8,_40%)] active:translate-y-[2px] active:scale-[0.97] active:[box-shadow:inset_0px_1px_1px_0px_#171310,_0px_1px_2px_0px_rgba(58,_33,_8,_30%)] disabled:shadow-none disabled:hover:translate-y-0 disabled:hover:scale-100 h-8 px-3 py-1 text-sm gap-2`}>
                {generationProgress.isGenerating ? (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                    {generationProgress.isEdit ? 'Editing code' : 'Live code generation'}
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-gray-500 rounded-full" />
                    COMPLETE
                  </>
                )}
              </div>
            </div>
          )}
          {sandboxData && !generationProgress.isGenerating && (
            <>
              <Button
                variant="code"
                size="sm"
                asChild
              >
                <a 
                  href={sandboxData.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  title="Open in new tab"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </Button>
            </>
          )}
        </div>
      </div>
      <div className="flex-1 relative overflow-hidden">
        {renderMainContent()}
      </div>
    </div>
  );
}
