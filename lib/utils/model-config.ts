// 模型配置工具函数

interface ModelConfig {
  provider: string;
  model: string;
  apiKey: string;
}

interface StoredApiKeys {
  [provider: string]: string;
}

// 从请求头或者请求体中获取模型配置
export function getModelConfigFromRequest(headers: Headers, body?: any): {
  provider: string;
  model: string;
  apiKey?: string;
} {
  // 首先尝试从请求体获取
  if (body?.modelConfig) {
    return body.modelConfig;
  }

  // 然后尝试从headers获取
  const configHeader = headers.get('x-model-config');
  if (configHeader) {
    try {
      return JSON.parse(configHeader);
    } catch (e) {
      console.warn('Failed to parse model config from header:', e);
    }
  }

  // 默认配置
  return {
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022'
  };
}

// 根据提供商和模型ID生成正确的模型客户端配置
export function getProviderConfig(provider: string, model: string, apiKey?: string) {
  const baseConfigs = {
    openai: {
      baseURL: 'https://api.openai.com/v1',
      provider: 'openai'
    },
    anthropic: {
      baseURL: 'https://api.anthropic.com/v1',
      provider: 'anthropic'
    },
    zhipu: {
      baseURL: 'https://open.bigmodel.cn/api/paas/v4',
      provider: 'zhipu'
    },
    moonshot: {
      baseURL: 'https://api.moonshot.cn/v1',
      provider: 'moonshot'
    },
    qwen: {
      baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      provider: 'qwen'
    },
    groq: {
      baseURL: 'https://api.groq.com/openai/v1',
      provider: 'groq'
    }
  };

  const config = baseConfigs[provider as keyof typeof baseConfigs];
  if (!config) {
    throw new Error(`Unsupported provider: ${provider}`);
  }

  return {
    ...config,
    model,
    apiKey
  };
}

// 将模型名称转换为AI SDK兼容的格式
export function getModelProviderAndId(provider: string, model: string): {
  aiProvider: string;
  modelId: string;
} {
  // 映射到AI SDK的提供商名称
  const providerMapping = {
    openai: 'openai',
    anthropic: 'anthropic',
    zhipu: 'zhipu',
    moonshot: 'moonshot',
    qwen: 'qwen',
    groq: 'groq'
  };

  const aiProvider = providerMapping[provider as keyof typeof providerMapping] || provider;
  
  return {
    aiProvider,
    modelId: model
  };
}
