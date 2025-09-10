'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, EyeOff, Settings, Cpu, Zap, Code, Sparkles } from 'lucide-react';

// 模型配置
const MODEL_PROVIDERS = {
  openai: {
    name: 'OpenAI',
    icon: '🤖',
    baseUrl: 'https://api.openai.com/v1',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', type: 'general', description: '最新的多模态模型' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', type: 'fast', description: '轻量级版本' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', type: 'general', description: '增强版GPT-4' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', type: 'fast', description: '快速高效' }
    ]
  },
  anthropic: {
    name: 'Anthropic',
    icon: '🧠',
    baseUrl: 'https://api.anthropic.com/v1',
    models: [
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude-3.5 Sonnet', type: 'general', description: '最新的Claude模型' },
      { id: 'claude-3-haiku-20240307', name: 'Claude-3 Haiku', type: 'fast', description: '快速响应版本' }
    ]
  },
  zhipu: {
    name: '智谱AI',
    icon: '🧠',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    models: [
      { id: 'glm-4.5', name: 'GLM-4.5', type: 'general', description: '3550亿参数 MoE 架构' },
      { id: 'glm-4.5-air', name: 'GLM-4.5-Air', type: 'fast', description: '1060亿参数轻量版' },
      { id: 'glm-4.5v', name: 'GLM-4.5V', type: 'vision', description: '多模态视觉模型' },
      { id: 'glm-4', name: 'GLM-4', type: 'general', description: '通用智能模型' },
      { id: 'glm-z1-air', name: 'GLM-Z1-Air', type: 'creative', description: '创意写作专用' }
    ]
  },
  moonshot: {
    name: 'Kimi (月之暗面)',
    icon: '🌙',
    baseUrl: 'https://api.moonshot.cn/v1',
    models: [
      { id: 'kimi-k2', name: 'Kimi-K2', type: 'general', description: '1T参数 MoE 模型' },
      { id: 'kimi-k2-0905-preview', name: 'Kimi-K2-0905-Preview', type: 'preview', description: '最新预览版本' },
      { id: 'moonshot-v1-8k', name: 'Moonshot V1 8K', type: 'fast', description: '8K上下文' },
      { id: 'moonshot-v1-32k', name: 'Moonshot V1 32K', type: 'general', description: '32K上下文' },
      { id: 'moonshot-v1-128k', name: 'Moonshot V1 128K', type: 'general', description: '128K上下文' }
    ]
  },
  qwen: {
    name: '通义千问',
    icon: '🔥',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    models: [
      { id: 'qwen3-coder', name: 'Qwen3-Coder', type: 'code', description: '专业编程助手' },
      { id: 'qwen3-coder-plus', name: 'Qwen3-Coder-Plus', type: 'code', description: '增强版编程模型' },
      { id: 'qwen3-32b', name: 'Qwen3-32B', type: 'general', description: '320亿参数通用模型' },
      { id: 'qwen2.5-omni', name: 'Qwen2.5-Omni', type: 'vision', description: '多模态全能模型' },
      { id: 'qwen2.5-vl', name: 'Qwen2.5-VL', type: 'vision', description: '视觉语言模型' }
    ]
  },
  groq: {
    name: 'Groq',
    icon: '⚡',
    baseUrl: 'https://api.groq.com/openai/v1',
    models: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', type: 'general', description: '多用途模型' },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', type: 'general', description: 'MoE架构' }
    ]
  }
};

const MODEL_TYPE_INFO = {
  general: { icon: Cpu, color: 'bg-blue-500', label: '通用' },
  fast: { icon: Zap, color: 'bg-green-500', label: '快速' },
  code: { icon: Code, color: 'bg-purple-500', label: '编程' },
  vision: { icon: Eye, color: 'bg-orange-500', label: '视觉' },
  creative: { icon: Sparkles, color: 'bg-pink-500', label: '创意' },
  preview: { icon: Sparkles, color: 'bg-yellow-500', label: '预览' }
};

interface ModelConfig {
  provider: string;
  model: string;
  apiKey: string;
}

export default function ModelSelector() {
  const [open, setOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<ModelConfig>({
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
    apiKey: ''
  });
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});

  // 从本地存储加载配置
  useEffect(() => {
    const savedConfig = localStorage.getItem('heysme-model-config');
    const savedApiKeys = localStorage.getItem('heysme-api-keys');
    
    if (savedConfig) {
      try {
        setSelectedConfig(JSON.parse(savedConfig));
      } catch (e) {
        console.error('Failed to parse saved config:', e);
      }
    }
    
    if (savedApiKeys) {
      try {
        setApiKeys(JSON.parse(savedApiKeys));
      } catch (e) {
        console.error('Failed to parse saved API keys:', e);
      }
    }
  }, []);

  // 保存配置到本地存储
  const saveConfig = (config: ModelConfig) => {
    localStorage.setItem('heysme-model-config', JSON.stringify(config));
    setSelectedConfig(config);
  };

  const saveApiKeys = (keys: Record<string, string>) => {
    localStorage.setItem('heysme-api-keys', JSON.stringify(keys));
    setApiKeys(keys);
  };

  const handleProviderChange = (provider: string) => {
    const providerModels = MODEL_PROVIDERS[provider as keyof typeof MODEL_PROVIDERS].models;
    const firstModel = providerModels[0];
    const newConfig = {
      ...selectedConfig,
      provider,
      model: firstModel.id
    };
    saveConfig(newConfig);
  };

  const handleModelChange = (model: string) => {
    const newConfig = { ...selectedConfig, model };
    saveConfig(newConfig);
  };

  const handleApiKeyChange = (provider: string, apiKey: string) => {
    const newKeys = { ...apiKeys, [provider]: apiKey };
    saveApiKeys(newKeys);
    
    if (provider === selectedConfig.provider) {
      const newConfig = { ...selectedConfig, apiKey };
      saveConfig(newConfig);
    }
  };

  const toggleApiKeyVisibility = (provider: string) => {
    setShowApiKey(prev => ({ ...prev, [provider]: !prev[provider] }));
  };

  const getCurrentModel = () => {
    const provider = MODEL_PROVIDERS[selectedConfig.provider as keyof typeof MODEL_PROVIDERS];
    const model = provider?.models.find(m => m.id === selectedConfig.model);
    return { provider, model };
  };

  const { provider: currentProvider, model: currentModel } = getCurrentModel();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 min-w-[120px] justify-start gap-2 border-gray-300 bg-white hover:bg-gray-50"
        >
          <span className="text-sm">{currentProvider?.icon}</span>
          <span className="text-xs font-medium truncate">
            {currentModel?.name || 'Select Model'}
          </span>
          <Settings className="ml-auto h-3 w-3 opacity-50" />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            AI 模型配置
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="model-selection" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="model-selection">模型选择</TabsTrigger>
            <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          </TabsList>
          
          <TabsContent value="model-selection" className="space-y-6 max-h-[60vh] overflow-y-auto">
            <div className="space-y-4">
              <div>
                <Label htmlFor="provider" className="text-sm font-medium">
                  选择服务商
                </Label>
                <Select value={selectedConfig.provider} onValueChange={handleProviderChange}>
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(MODEL_PROVIDERS).map(([key, provider]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <span>{provider.icon}</span>
                          <span>{provider.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="model" className="text-sm font-medium">
                  选择模型
                </Label>
                <div className="grid grid-cols-1 gap-3 mt-3">
                  {currentProvider?.models.map((model) => {
                    const typeInfo = MODEL_TYPE_INFO[model.type as keyof typeof MODEL_TYPE_INFO];
                    const IconComponent = typeInfo.icon;
                    const isSelected = selectedConfig.model === model.id;
                    
                    return (
                      <div
                        key={model.id}
                        className={`
                          relative border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md
                          ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
                        `}
                        onClick={() => handleModelChange(model.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium text-sm">{model.name}</h3>
                              <Badge variant="secondary" className={`text-xs text-white ${typeInfo.color}`}>
                                <IconComponent className="w-3 h-3 mr-1" />
                                {typeInfo.label}
                              </Badge>
                              {isSelected && (
                                <Badge variant="default" className="text-xs">
                                  当前选择
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-600">{model.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="api-keys" className="space-y-6 max-h-[60vh] overflow-y-auto">
            <div className="space-y-4">
              <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                <p>🔒 API密钥仅保存在本地浏览器中，不会上传到服务器</p>
              </div>
              
              {Object.entries(MODEL_PROVIDERS).map(([key, provider]) => (
                <div key={key} className="space-y-2 p-4 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{provider.icon}</span>
                    <h3 className="font-medium">{provider.name}</h3>
                  </div>
                  
                  <div className="relative">
                    <Input
                      type={showApiKey[key] ? 'text' : 'password'}
                      placeholder={`请输入 ${provider.name} API Key`}
                      value={apiKeys[key] || ''}
                      onChange={(e) => handleApiKeyChange(key, e.target.value)}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                      onClick={() => toggleApiKeyVisibility(key)}
                    >
                      {showApiKey[key] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </Button>
                  </div>
                  
                  <p className="text-xs text-gray-500">
                    API Base URL: {provider.baseUrl}
                  </p>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button onClick={() => setOpen(false)}>
            保存配置
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
