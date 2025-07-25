'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface InteractionElement {
  id: string;
  type: 'button' | 'input' | 'select' | 'textarea' | 'checkbox';
  label: string;
  value?: any;
  options?: Array<{
    value: string;
    label: string;
    description?: string;
  }>;
  placeholder?: string;
  required?: boolean;
  validation?: {
    pattern?: string;
    message?: string;
    min?: number;
    max?: number;
  };
}

interface InteractionData {
  type: 'choice' | 'input' | 'form' | 'confirmation';
  title?: string;
  description?: string;
  elements: InteractionElement[];
  required?: boolean;
}

interface InteractionPanelProps {
  interaction: InteractionData;
  onSubmit: (data: any) => void;
  loading?: boolean;
}

export function InteractionPanel({ interaction, onSubmit, loading = false }: InteractionPanelProps) {
  const [selectedValues, setSelectedValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleValueChange = (elementId: string, value: any) => {
    setSelectedValues(prev => ({
      ...prev,
      [elementId]: value
    }));
    
    // 清除对应字段的错误
    if (errors[elementId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[elementId];
        return newErrors;
      });
    }
  };

  const handleSubmit = async () => {
    if (loading || isSubmitting) return;

    const newErrors: Record<string, string> = {};
    
    // 验证必填字段
    interaction.elements.forEach(element => {
      if (element.required && !selectedValues[element.id]) {
        newErrors[element.id] = '此字段为必填项';
      }
      
      // 自定义验证
      if (element.validation && selectedValues[element.id]) {
        const value = selectedValues[element.id];
        const validation = element.validation;
        
        if (validation.pattern) {
          const regex = new RegExp(validation.pattern);
          if (!regex.test(value)) {
            newErrors[element.id] = validation.message || '格式不正确';
          }
        }
        
        if (validation.min && value.length < validation.min) {
          newErrors[element.id] = `最少需要 ${validation.min} 个字符`;
        }
        
        if (validation.max && value.length > validation.max) {
          newErrors[element.id] = `最多 ${validation.max} 个字符`;
        }
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(selectedValues);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleButtonClick = (element: InteractionElement) => {
    if (interaction.type === 'choice') {
      // 单选模式 - 直接提交
      onSubmit({ [element.id]: element.value });
    } else {
      // 多选模式 - 更新状态
      handleValueChange(element.id, element.value);
    }
  };

  const renderElement = (element: InteractionElement) => {
    const hasError = !!errors[element.id];
    
    switch (element.type) {
      case 'button':
        const isSelected = selectedValues[element.id] === element.value;
        const option = element.options?.[0];
        
        return (
          <motion.div
            key={element.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Button
              variant={isSelected ? "default" : "outline"}
              size="lg"
              className={`w-full text-left justify-start h-auto p-4 ${
                hasError ? 'border-red-500' : ''
              } ${isSelected ? 'border-blue-500 bg-blue-50' : ''}`}
              onClick={() => handleButtonClick(element)}
              disabled={loading || isSubmitting}
            >
              <div className="flex items-center space-x-3 w-full">
                <div className="flex-shrink-0">
                  {isSelected ? (
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                  ) : (
                    <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-sm">{element.label}</div>
                  {option?.description && (
                    <div className="text-xs text-gray-500 mt-1">
                      {option.description}
                    </div>
                  )}
                </div>
              </div>
            </Button>
            {hasError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex items-center mt-1 text-red-500 text-xs"
              >
                <AlertCircle className="w-3 h-3 mr-1" />
                {errors[element.id]}
              </motion.div>
            )}
          </motion.div>
        );

      case 'input':
        return (
          <motion.div
            key={element.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <label className="text-sm font-medium text-gray-700">
              {element.label}
              {element.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <Input
              placeholder={element.placeholder}
              value={selectedValues[element.id] || ''}
              onChange={(e) => handleValueChange(element.id, e.target.value)}
              className={hasError ? 'border-red-500' : ''}
              disabled={loading || isSubmitting}
            />
            {hasError && (
              <div className="flex items-center text-red-500 text-xs">
                <AlertCircle className="w-3 h-3 mr-1" />
                {errors[element.id]}
              </div>
            )}
          </motion.div>
        );

      case 'textarea':
        return (
          <motion.div
            key={element.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <label className="text-sm font-medium text-gray-700">
              {element.label}
              {element.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <Textarea
              placeholder={element.placeholder}
              value={selectedValues[element.id] || ''}
              onChange={(e) => handleValueChange(element.id, e.target.value)}
              className={hasError ? 'border-red-500' : ''}
              disabled={loading || isSubmitting}
              rows={3}
            />
            {hasError && (
              <div className="flex items-center text-red-500 text-xs">
                <AlertCircle className="w-3 h-3 mr-1" />
                {errors[element.id]}
              </div>
            )}
          </motion.div>
        );

      case 'select':
        return (
          <motion.div
            key={element.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <label className="text-sm font-medium text-gray-700">
              {element.label}
              {element.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
              value={selectedValues[element.id] || ''}
              onChange={(e) => handleValueChange(element.id, e.target.value)}
              className={`w-full px-3 py-2 border rounded-md ${
                hasError ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={loading || isSubmitting}
            >
              <option value="">请选择...</option>
              {element.options?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {hasError && (
              <div className="flex items-center text-red-500 text-xs">
                <AlertCircle className="w-3 h-3 mr-1" />
                {errors[element.id]}
              </div>
            )}
          </motion.div>
        );

      case 'checkbox':
        return (
          <motion.div
            key={element.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center space-x-2"
          >
            <input
              type="checkbox"
              id={element.id}
              checked={selectedValues[element.id] || false}
              onChange={(e) => handleValueChange(element.id, e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              disabled={loading || isSubmitting}
            />
            <label htmlFor={element.id} className="text-sm text-gray-700">
              {element.label}
              {element.required && <span className="text-red-500 ml-1">*</span>}
            </label>
          </motion.div>
        );

      default:
        return null;
    }
  };

  const shouldShowSubmitButton = interaction.type !== 'choice';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-2xl mx-auto"
    >
      <Card className="shadow-sm border-gray-200">
        {(interaction.title || interaction.description) && (
          <CardHeader className="pb-4">
            {interaction.title && (
              <CardTitle className="text-lg font-semibold text-gray-800">
                {interaction.title}
              </CardTitle>
            )}
            {interaction.description && (
              <CardDescription className="text-gray-600">
                {interaction.description}
              </CardDescription>
            )}
          </CardHeader>
        )}
        
        <CardContent className="space-y-4">
          {interaction.elements.map(renderElement)}
          
          {shouldShowSubmitButton && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="pt-4 border-t"
            >
              <Button
                onClick={handleSubmit}
                disabled={loading || isSubmitting || Object.keys(selectedValues).length === 0}
                size="lg"
                className="w-full"
              >
                {isSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 animate-spin" />
                    <span>提交中...</span>
                  </div>
                ) : (
                  '确认提交'
                )}
              </Button>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
