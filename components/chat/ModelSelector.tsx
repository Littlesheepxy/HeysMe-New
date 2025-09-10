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
// 使用简单的图标组件，通过 CSS 控制暗色模式显示
const IconWrapper = ({ src, alt, size = 16 }: { src: string; alt: string; size?: number }) => (
  <img 
    src={src} 
    alt={alt} 
    width={size} 
    height={size} 
    className="inline-block align-middle filter dark:invert dark:brightness-0 dark:contrast-100" 
    style={{ display: 'inline-block', verticalAlign: 'middle' }}
  />
);

// 使用 Lobe Icons 的 CDN 静态资源 - 使用原始彩色图标
const OpenAI = ({ size = 16 }: { size?: number }) => (
  <IconWrapper 
    src="https://unpkg.com/@lobehub/icons-static-svg@latest/icons/openai.svg" 
    alt="OpenAI" 
    size={size} 
  />
);

const Anthropic = ({ size = 16 }: { size?: number }) => (
  <IconWrapper 
    src="https://unpkg.com/@lobehub/icons-static-svg@latest/icons/anthropic.svg" 
    alt="Anthropic" 
    size={size} 
  />
);

const Zhipu = ({ size = 16 }: { size?: number }) => (
  <IconWrapper 
    src="https://unpkg.com/@lobehub/icons-static-svg@latest/icons/zhipu.svg" 
    alt="智谱AI" 
    size={size} 
  />
);

const Moonshot = ({ size = 16 }: { size?: number }) => (
  <IconWrapper 
    src="https://unpkg.com/@lobehub/icons-static-svg@latest/icons/moonshot.svg" 
    alt="Moonshot" 
    size={size} 
  />
);

const Tongyi = ({ size = 16 }: { size?: number }) => (
  <IconWrapper 
    src="https://unpkg.com/@lobehub/icons-static-svg@latest/icons/qwen.svg" 
    alt="通义千问" 
    size={size} 
  />
);

const Groq = ({ size = 16 }: { size?: number }) => (
  <IconWrapper 
    src="https://unpkg.com/@lobehub/icons-static-svg@latest/icons/groq.svg" 
    alt="Groq" 
    size={size} 
  />
);

// 模型配置
const MODEL_PROVIDERS = {
  openai: {
    name: 'OpenAI',
    icon: OpenAI,
    baseUrl: 'https://api.openai.com/v1',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', type: 'general', description: '最新的多模态模型' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', type: 'fast', description: '轻量级快速模型' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', type: 'general', description: '强大的通用模型' },
      { id: 'gpt-4.1', name: 'GPT-4.1', type: 'general', description: '2025年最新模型' },
      { id: 'o1', name: 'o1', type: 'reasoning', description: '推理专用模型' },
      { id: 'o1-mini', name: 'o1-mini', type: 'reasoning', description: '轻量推理模型' },
      { id: 'o3-mini', name: 'o3-mini', type: 'reasoning', description: '最新推理模型' }
    ]
  },
  anthropic: {
    name: 'Anthropic',
    icon: Anthropic,
    baseUrl: 'https://api.anthropic.com/v1',
    models: [
      { id: 'claude-4-sonnet-20250805', name: 'Claude 4 Sonnet', type: 'general', description: '最新Claude 4模型' },
      { id: 'claude-sonnet-3-7', name: 'Claude Sonnet 3.7', type: 'general', description: '128K输出支持' },
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet v2', type: 'general', description: '增强版本' },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', type: 'fast', description: '最新快速模型' },
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', type: 'fast', description: '经典快速版本' }
    ]
  },
  zhipu: {
    name: '智谱AI',
    icon: Zhipu,
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
    icon: Moonshot,
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
    icon: Tongyi,
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
    icon: Groq,
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
  preview: { icon: Sparkles, color: 'bg-yellow-500', label: '预览' },
  reasoning: { icon: Sparkles, color: 'bg-indigo-500', label: '推理' }
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
          className="h-8 min-w-[120px] justify-start gap-2 rounded-[10px] border-gray-300 bg-white hover:bg-gray-50 dark:border-[#2a2a2a] dark:bg-[#212121] dark:hover:bg-[#2a2a2a] dark:text-white"
        >
          {currentProvider?.icon && <currentProvider.icon size={14} />}
          <span className="text-xs font-medium truncate">
            {currentModel?.name || 'Select Model'}
          </span>
          <Settings className="ml-auto h-3 w-3 opacity-50" />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-3xl max-h-[75vh] overflow-hidden bg-white dark:bg-[#181818] border dark:border-[#2a2a2a] rounded-[16px]">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-lg">
            <Settings className="h-4 w-4" />
            AI 模型配置
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="model-selection" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-[#212121] rounded-[10px] h-9">
            <TabsTrigger value="model-selection" className="text-sm dark:text-gray-200 dark:data-[state=active]:bg-[#2a2a2a] dark:data-[state=active]:text-white rounded-[8px] data-[state=active]:shadow-sm">模型选择</TabsTrigger>
            <TabsTrigger value="api-keys" className="text-sm dark:text-gray-200 dark:data-[state=active]:bg-[#2a2a2a] dark:data-[state=active]:text-white rounded-[8px] data-[state=active]:shadow-sm">API Keys</TabsTrigger>
          </TabsList>
          
          <TabsContent value="model-selection" className="space-y-4 max-h-[55vh] overflow-y-auto mt-4">
            <div className="space-y-3">
              <div>
                <Label htmlFor="provider" className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  选择服务商
                </Label>
                <Select value={selectedConfig.provider} onValueChange={handleProviderChange}>
                  <SelectTrigger className="w-full h-10 bg-white dark:bg-[#212121] border-gray-300 dark:border-[#2a2a2a] text-gray-900 dark:text-white rounded-[10px] focus:border-emerald-500 dark:focus:border-emerald-400">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-[#212121] border dark:border-[#2a2a2a] rounded-[10px]">
                    {Object.entries(MODEL_PROVIDERS).map(([key, provider]) => (
                      <SelectItem key={key} value={key} className="dark:text-gray-200 dark:focus:bg-[#2a2a2a] dark:focus:text-white">
                        <div className="flex items-center gap-2">
                          <provider.icon size={14} />
                          <span className="text-sm">{provider.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="model" className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                  选择模型
                </Label>
                <div className="space-y-1.5">
                  {currentProvider?.models.map((model) => {
                    const typeInfo = MODEL_TYPE_INFO[model.type as keyof typeof MODEL_TYPE_INFO];
                    const IconComponent = typeInfo.icon;
                    const isSelected = selectedConfig.model === model.id;
                    
                    return (
                      <div
                        key={model.id}
                        className={`
                          w-full flex items-center gap-3 h-10 px-3 rounded-[10px] cursor-pointer transition-all duration-150
                          ${isSelected 
                            ? 'bg-emerald-50 text-emerald-700 shadow-sm dark:bg-emerald-900/25 dark:text-emerald-300' 
                            : 'text-gray-600 dark:text-gray-400 bg-transparent hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-[#2a2a2a] dark:hover:text-emerald-300'
                          }
                        `}
                        onClick={() => handleModelChange(model.id)}
                      >
                        {/* 选择指示器 */}
                        <div className={`w-3 h-3 rounded-full border-2 flex items-center justify-center transition-colors ${
                          isSelected 
                            ? 'border-emerald-500 bg-emerald-500' 
                            : 'border-gray-300 dark:border-gray-500 hover:border-emerald-400'
                        }`}>
                          {isSelected && <div className="w-1 h-1 bg-white rounded-full" />}
                        </div>
                        
                        {/* 模型名称 */}
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-sm truncate block">{model.name}</span>
                        </div>
                        
                        {/* 类型标签 */}
                        <div className={`w-6 h-6 rounded-[6px] flex items-center justify-center ${typeInfo.color}`} title={`${typeInfo.label} - ${model.description}`}>
                          <IconComponent className="w-3 h-3 text-white" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="api-keys" className="space-y-4 max-h-[55vh] overflow-y-auto mt-4">
            <div className="space-y-3">
              <div className="text-xs text-gray-600 dark:text-gray-300 bg-blue-50 dark:bg-[#212121] p-3 rounded-[10px] border dark:border-[#2a2a2a]">
                <p>🔒 API密钥仅保存在本地浏览器中，不会上传到服务器</p>
              </div>
              
              {Object.entries(MODEL_PROVIDERS).map(([key, provider]) => (
                <div key={key} className="space-y-2">
                  {/* 厂商标签 */}
                  <div className="flex items-center gap-2 px-1">
                    <provider.icon size={14} />
                    <span className="font-medium text-xs text-gray-700 dark:text-gray-300">{provider.name}</span>
                    {apiKeys[key] && (
                      <div className="w-2 h-2 bg-emerald-500 rounded-full" title="已配置" />
                    )}
                  </div>
                  
                  {/* API Key 输入 - 单行 */}
                  <div className="relative">
                    <Input
                      type={showApiKey[key] ? 'text' : 'password'}
                      placeholder={`请输入 ${provider.name} API Key`}
                      value={apiKeys[key] || ''}
                      onChange={(e) => handleApiKeyChange(key, e.target.value)}
                      className="pr-10 h-9 text-sm bg-white dark:bg-[#212121] border-gray-300 dark:border-[#2a2a2a] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-[10px] focus:border-emerald-500 dark:focus:border-emerald-400"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-[6px] dark:hover:bg-[#2a2a2a]"
                      onClick={() => toggleApiKeyVisibility(key)}
                    >
                      {showApiKey[key] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end gap-3 pt-4 border-t dark:border-[#2a2a2a]">
          <Button variant="outline" onClick={() => setOpen(false)} className="h-9 px-6 text-sm border-gray-300 dark:border-[#2a2a2a] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] rounded-[10px]">
            取消
          </Button>
          <Button onClick={() => setOpen(false)} className="h-9 px-6 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-[10px] shadow-sm">
            保存配置
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
