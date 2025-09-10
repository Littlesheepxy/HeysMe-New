'use client';

import { 
  FiChevronRight, 
  FiChevronDown,
  BsFolderFill, 
  BsFolder2Open,
  SiJavascript, 
  SiReact, 
  SiCss3, 
  SiJson,
  FiFile
} from '@/lib/icons';

import { GenerationProgress } from '@/types/openlovable';

interface FileExplorerProps {
  generationProgress: GenerationProgress;
  expandedFolders: Set<string>;
  selectedFile: string | null;
  onToggleFolder: (folder: string) => void;
  onFileClick: (file: string) => void;
}

export default function FileExplorer({
  generationProgress,
  expandedFolders,
  selectedFile,
  onToggleFolder,
  onFileClick
}: FileExplorerProps) {
  
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
    <div className="w-[250px] border-r border-gray-200 bg-white flex flex-col flex-shrink-0">
      <div className="p-3 bg-gray-100 text-gray-900 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BsFolderFill className="w-4 h-4" />
          <span className="text-sm font-medium">Explorer</span>
        </div>
      </div>
      
      {/* File Tree */}
      <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
        <div className="text-sm">
          {/* Root app folder */}
          <div 
            className="flex items-center gap-1 py-1 px-2 hover:bg-gray-100 rounded cursor-pointer text-gray-700"
            onClick={() => onToggleFolder('app')}
          >
            {expandedFolders.has('app') ? (
              <FiChevronDown className="w-4 h-4 text-gray-600" />
            ) : (
              <FiChevronRight className="w-4 h-4 text-gray-600" />
            )}
            {expandedFolders.has('app') ? (
              <BsFolder2Open className="w-4 h-4 text-blue-500" />
            ) : (
              <BsFolderFill className="w-4 h-4 text-blue-500" />
            )}
            <span className="font-medium text-gray-800">app</span>
          </div>
          
          {expandedFolders.has('app') && (
            <div className="ml-4">
              {(() => {
                const fileTree: { [key: string]: Array<{ name: string; edited?: boolean }> } = {};
                
                // Create a map of edited files
                const editedFiles = new Set(
                  generationProgress.files
                    .filter(f => f.edited)
                    .map(f => f.path)
                );
                
                // Process all files from generation progress
                generationProgress.files.forEach(file => {
                  const parts = file.path.split('/');
                  const dir = parts.length > 1 ? parts.slice(0, -1).join('/') : '';
                  const fileName = parts[parts.length - 1];
                  
                  if (!fileTree[dir]) fileTree[dir] = [];
                  fileTree[dir].push({
                    name: fileName,
                    edited: file.edited || false
                  });
                });
                
                return Object.entries(fileTree).map(([dir, files]) => (
                  <div key={dir} className="mb-1">
                    {dir && (
                      <div 
                        className="flex items-center gap-1 py-1 px-2 hover:bg-gray-100 rounded cursor-pointer text-gray-700"
                        onClick={() => onToggleFolder(dir)}
                      >
                        {expandedFolders.has(dir) ? (
                          <FiChevronDown className="w-4 h-4 text-gray-600" />
                        ) : (
                          <FiChevronRight className="w-4 h-4 text-gray-600" />
                        )}
                        {expandedFolders.has(dir) ? (
                          <BsFolder2Open className="w-4 h-4 text-yellow-600" />
                        ) : (
                          <BsFolderFill className="w-4 h-4 text-yellow-600" />
                        )}
                        <span className="text-gray-700">{dir.split('/').pop()}</span>
                      </div>
                    )}
                    {(!dir || expandedFolders.has(dir)) && (
                      <div className={dir ? 'ml-6' : ''}>
                        {files.sort((a, b) => a.name.localeCompare(b.name)).map(fileInfo => {
                          const fullPath = dir ? `${dir}/${fileInfo.name}` : fileInfo.name;
                          const isSelected = selectedFile === fullPath;
                          
                          return (
                            <div 
                              key={fullPath} 
                              className={`flex items-center gap-2 py-1 px-2 rounded cursor-pointer transition-all ${
                                isSelected 
                                  ? 'bg-blue-500 text-white' 
                                  : 'text-gray-700 hover:bg-gray-100'
                              }`}
                              onClick={() => onFileClick(fullPath)}
                            >
                              {getFileIcon(fileInfo.name)}
                              <span className={`text-xs flex items-center gap-1 ${isSelected ? 'font-medium' : ''}`}>
                                {fileInfo.name}
                                {fileInfo.edited && (
                                  <span className={`text-[10px] px-1 rounded ${
                                    isSelected ? 'bg-blue-400' : 'bg-orange-500 text-white'
                                  }`}>✓</span>
                                )}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ));
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
