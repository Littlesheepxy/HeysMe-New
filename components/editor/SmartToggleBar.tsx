'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Code2, 
  Eye, 
  Edit3, 
  Save, 
  Wand2,
  Columns3,
  Monitor,
  Zap,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export type ViewMode = 'code' | 'preview' | 'split';
export type EditMode = 'view' | 'edit';

interface SmartToggleBarProps {
  viewMode: ViewMode;
  editMode: EditMode;
  hasUnsavedChanges: boolean;
  projectName: string;
  onViewModeChange: (mode: ViewMode) => void;
  onEditModeChange: (mode: EditMode) => void;
  onSave: () => void;
  onSmartToggle: () => void;
}

export function SmartToggleBar({
  viewMode,
  editMode,
  hasUnsavedChanges,
  projectName,
  onViewModeChange,
  onEditModeChange,
  onSave,
  onSmartToggle
}: SmartToggleBarProps) {
  // 视图模式配置
  const viewModes = [
    { 
      key: 'code' as ViewMode, 
      label: '代码', 
      icon: Code2, 
      description: '专注代码编辑' 
    },
    { 
      key: 'split' as ViewMode, 
      label: '分屏', 
      icon: Columns3, 
      description: '代码+预览' 
    },
    { 
      key: 'preview' as ViewMode, 
      label: '预览', 
      icon: Monitor, 
      description: '实时预览' 
    }
  ];

  // 智能切换提示文本
  const getSmartToggleHint = () => {
    if (editMode === 'edit') {
      return '保存并预览';
    }
    switch (viewMode) {
      case 'code':
        return '切换到预览';
      case 'preview':
        return '进入编辑模式';
      case 'split':
        return '进入编辑模式';
      default:
        return '智能切换';
    }
  };

  return (
    <div className="px-4 py-3 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between">
        {/* 左侧：项目信息和编辑状态 */}
        <div className="flex items-center gap-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{projectName}</h3>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>{editMode === 'edit' ? '编辑模式' : '查看模式'}</span>
              {hasUnsavedChanges && (
                <>
                  <span>•</span>
                  <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                    未保存
                  </Badge>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 中间：视图模式切换 */}
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          {viewModes.map((mode) => {
            const Icon = mode.icon;
            const isActive = viewMode === mode.key;
            
            return (
              <motion.button
                key={mode.key}
                onClick={() => onViewModeChange(mode.key)}
                className={cn(
                  "relative flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors",
                  isActive 
                    ? "bg-white text-blue-600 shadow-sm" 
                    : "text-gray-600 hover:text-gray-900"
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{mode.label}</span>
                
                {isActive && (
                  <motion.div
                    layoutId="activeViewMode"
                    className="absolute inset-0 bg-white rounded-md shadow-sm border border-blue-200"
                    style={{ zIndex: -1 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>

        {/* 右侧：操作按钮 */}
        <div className="flex items-center gap-2">
          {/* 编辑模式切换 */}
          <Button
            variant={editMode === 'edit' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onEditModeChange(editMode === 'edit' ? 'view' : 'edit')}
            className="flex items-center gap-2"
          >
            <Edit3 className="w-4 h-4" />
            {editMode === 'edit' ? '退出编辑' : '编辑'}
          </Button>

          {/* 保存按钮 */}
          {hasUnsavedChanges && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={onSave}
                className="flex items-center gap-2 text-green-600 border-green-300 hover:bg-green-50"
              >
                <Save className="w-4 h-4" />
                保存
              </Button>
            </motion.div>
          )}

          <Separator orientation="vertical" className="h-6" />

          {/* 智能切换按钮 */}
          <Button
            onClick={onSmartToggle}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-md"
            size="sm"
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-4 h-4" />
            </motion.div>
            <span className="font-medium">{getSmartToggleHint()}</span>
          </Button>
        </div>
      </div>

      {/* 快捷键提示 */}
      <div className="mt-2 flex items-center justify-center">
        <div className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
          <kbd className="px-1.5 py-0.5 bg-white rounded border text-gray-600">Cmd</kbd>
          <span className="mx-1">+</span>
          <kbd className="px-1.5 py-0.5 bg-white rounded border text-gray-600">\</kbd>
          <span className="ml-2">智能切换</span>
          <span className="mx-3">•</span>
          <kbd className="px-1.5 py-0.5 bg-white rounded border text-gray-600">Cmd</kbd>
          <span className="mx-1">+</span>
          <kbd className="px-1.5 py-0.5 bg-white rounded border text-gray-600">S</kbd>
          <span className="ml-2">保存</span>
          <span className="mx-3">•</span>
          <kbd className="px-1.5 py-0.5 bg-white rounded border text-gray-600">Cmd</kbd>
          <span className="mx-1">+</span>
          <kbd className="px-1.5 py-0.5 bg-white rounded border text-gray-600">E</kbd>
          <span className="ml-2">编辑模式</span>
        </div>
      </div>
    </div>
  );
}

export default SmartToggleBar; 