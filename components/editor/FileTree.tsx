'use client';

import React from 'react';
import { Tree, NodeApi } from 'react-arborist';
import { FileCode, Folder, FolderOpen, ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/contexts/theme-context';

export interface FileTreeNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  language?: string;
  fileType?: 'component' | 'page' | 'styles' | 'config' | 'data';
  children?: FileTreeNode[];
  content?: string;
}

interface FileTreeProps {
  data: FileTreeNode[];
  selectedFileId?: string;
  onFileSelect: (fileId: string) => void;
  className?: string;
}

export function FileTree({ data, selectedFileId, onFileSelect, className }: FileTreeProps) {
  const { theme } = useTheme();
  
  return (
    <div className={cn("h-full", className)}>
      <div className="p-2">
        <Tree
          data={data}
          openByDefault={false}
          width="100%"
          height={400}
          indent={16}
          rowHeight={32}
          onSelect={(nodes) => {
            const node = nodes[0];
            if (node && node.data.type === 'file') {
              onFileSelect(node.data.id);
            }
          }}
          selection={selectedFileId}
        >
          {Node}
        </Tree>
      </div>
    </div>
  );
}

// 文件树节点渲染组件
function Node({ node, style, dragHandle }: { 
  node: NodeApi<FileTreeNode>; 
  style: React.CSSProperties;
  dragHandle?: (el: HTMLDivElement | null) => void;
}) {
  const { theme } = useTheme();
  const data = node.data;
  const isSelected = node.isSelected;
  const isFolder = data.type === 'folder';
  
  // 获取文件图标
  const getFileIcon = () => {
    if (isFolder) {
      return node.isOpen ? <FolderOpen className="w-4 h-4" /> : <Folder className="w-4 h-4" />;
    }
    
    // 根据文件扩展名返回不同图标
    if (data.name.endsWith('.tsx') || data.name.endsWith('.ts')) return '⚛️';
    if (data.name.endsWith('.css') || data.name.endsWith('.scss')) return '🎨';
    if (data.name.endsWith('.js') || data.name.endsWith('.jsx')) return '🟨';
    if (data.name.endsWith('.json')) return '📋';
    if (data.name.endsWith('.md')) return '📝';
    return <FileCode className="w-4 h-4" />;
  };

  // 获取文件类型颜色 - 适配暗色模式
  const getFileTypeColor = (type?: string) => {
    const baseClasses = theme === 'light' ? {
      component: 'bg-green-100 text-green-800 border-green-200',
      page: 'bg-blue-100 text-blue-800 border-blue-200',
      styles: 'bg-purple-100 text-purple-800 border-purple-200',
      config: 'bg-gray-100 text-gray-800 border-gray-200',
      data: 'bg-orange-100 text-orange-800 border-orange-200',
      default: 'bg-gray-100 text-gray-800 border-gray-200'
    } : {
      component: 'bg-green-900 text-green-200 border-green-700',
      page: 'bg-blue-900 text-blue-200 border-blue-700',
      styles: 'bg-purple-900 text-purple-200 border-purple-700',
      config: 'bg-gray-700 text-gray-200 border-gray-600',
      data: 'bg-orange-900 text-orange-200 border-orange-700',
      default: 'bg-gray-700 text-gray-200 border-gray-600'
    };
    
    return baseClasses[type as keyof typeof baseClasses] || baseClasses.default;
  };

  return (
    <div
      ref={dragHandle}
      style={style}
      className={cn(
        "flex items-center gap-2 px-2 py-1 text-sm cursor-pointer rounded-md mx-1 transition-all duration-150",
        isSelected 
          ? theme === 'light'
            ? "bg-blue-100 text-blue-900 border border-blue-200"
            : "bg-blue-900 text-blue-200 border border-blue-700"
          : theme === 'light'
            ? "hover:bg-gray-100 text-gray-900"
            : "hover:bg-gray-700 text-gray-300"
      )}
      onClick={() => {
        if (isFolder) {
          node.toggle();
        } else {
          node.select();
        }
      }}
    >
      {/* 展开/收起图标 */}
      {isFolder && (
        <span className="flex items-center justify-center w-4 h-4">
          {node.isOpen ? (
            <ChevronDown className={`w-3 h-3 ${
              theme === 'light' ? 'text-gray-600' : 'text-gray-400'
            }`} />
          ) : (
            <ChevronRight className={`w-3 h-3 ${
              theme === 'light' ? 'text-gray-600' : 'text-gray-400'
            }`} />
          )}
        </span>
      )}
      
      {/* 文件/文件夹图标 */}
      <span className="flex items-center justify-center w-4 h-4">
        {getFileIcon()}
      </span>
      
      {/* 文件名 */}
      <span className="flex-1 truncate font-medium">
        {data.name}
      </span>
      
      {/* 文件类型标签 */}
      {!isFolder && data.fileType && (
        <Badge 
          variant="outline" 
          className={cn("text-xs px-1.5 py-0.5", getFileTypeColor(data.fileType))}
        >
          {data.fileType}
        </Badge>
      )}
    </div>
  );
} 