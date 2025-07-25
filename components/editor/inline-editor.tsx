'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Edit3, Save, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InlineEditorProps {
  value: string;
  type?: 'text' | 'textarea' | 'title';
  className?: string;
  onSave: (value: string) => Promise<void>;
  placeholder?: string;
  maxLength?: number;
  autoSave?: boolean;
  autoSaveDelay?: number;
}

export function InlineEditor({
  value,
  type = 'text',
  className,
  onSave,
  placeholder,
  maxLength,
  autoSave = true,
  autoSaveDelay = 1000
}: InlineEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const autoSaveTimer = useRef<NodeJS.Timeout>();

  // 监听值变化
  useEffect(() => {
    setEditValue(value);
  }, [value]);

  // 自动保存逻辑
  useEffect(() => {
    if (autoSave && hasChanges && editValue !== value) {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
      
      autoSaveTimer.current = setTimeout(async () => {
        await handleSave();
      }, autoSaveDelay);
    }

    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [editValue, hasChanges, autoSave, autoSaveDelay, value, handleSave]);

  const handleEdit = () => {
    setIsEditing(true);
    setEditValue(value);
    setHasChanges(false);
    
    // 聚焦输入框
    setTimeout(() => {
      inputRef.current?.focus();
      if (type === 'text' || type === 'title') {
        inputRef.current?.select();
      }
    }, 100);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue(value);
    setHasChanges(false);
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }
  };

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(editValue);
      setIsEditing(false);
      setHasChanges(false);
    } catch (error) {
      console.error('保存失败:', error);
      // 可以添加错误提示
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (newValue: string) => {
    setEditValue(newValue);
    setHasChanges(newValue !== value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && type !== 'textarea') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="relative group">
        {type === 'textarea' ? (
          <Textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={editValue}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => !autoSave && handleSave()}
            placeholder={placeholder}
            maxLength={maxLength}
            className={cn(
              "resize-none min-h-[100px] focus-visible:ring-2 focus-visible:ring-blue-500",
              className
            )}
          />
        ) : (
          <Input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            value={editValue}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => !autoSave && handleSave()}
            placeholder={placeholder}
            maxLength={maxLength}
            className={cn(
              "focus-visible:ring-2 focus-visible:ring-blue-500",
              type === 'title' && "text-2xl font-bold",
              className
            )}
          />
        )}
        
        {/* 操作按钮 */}
        {!autoSave && (
          <div className="flex gap-1 mt-2">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
              className="h-8"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancel}
              className="h-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
        
        {/* 自动保存状态指示 */}
        {autoSave && (
          <div className="absolute -top-6 right-0 text-xs text-gray-500">
            {isSaving ? (
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                保存中...
              </span>
            ) : hasChanges ? (
              <span>未保存</span>
            ) : (
              <span className="text-green-600">已保存</span>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group relative cursor-pointer rounded px-2 py-1 hover:bg-gray-100 transition-colors",
        "border border-transparent hover:border-gray-200",
        type === 'title' && "text-2xl font-bold",
        className
      )}
      onClick={handleEdit}
    >
      <span className={cn(
        value ? "" : "text-gray-400 italic",
      )}>
        {value || placeholder || "点击编辑..."}
      </span>
      
      {/* 编辑图标 */}
      <Edit3 className="w-4 h-4 opacity-0 group-hover:opacity-100 absolute -right-6 top-1/2 -translate-y-1/2 text-gray-400 transition-opacity" />
    </div>
  );
} 