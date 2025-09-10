// App configuration for Open Lovable integration
export const appConfig = {
  ai: {
    // Default AI model - prioritize fast inference
    defaultModel: 'groq-llama-3.1-70b',
    
    // Available models (order matters for UI display)
    availableModels: [
      'groq-llama-3.1-70b',
      'claude-3-sonnet',
      'claude-3-haiku',
      'gpt-4o',
      'gemini-1.5-pro'
    ],
    
    // Model configurations
    models: {
      'groq-llama-3.1-70b': {
        provider: 'groq',
        modelId: 'llama-3.1-70b-versatile',
        displayName: 'Llama 3.1 70B (Fast)',
        maxTokens: 8000,
        temperature: 0.7
      },
      'claude-3-sonnet': {
        provider: 'anthropic',
        modelId: 'claude-3-sonnet-20240229',
        displayName: 'Claude 3 Sonnet',
        maxTokens: 4000,
        temperature: 0.7
      },
      'claude-3-haiku': {
        provider: 'anthropic',
        modelId: 'claude-3-haiku-20240307',
        displayName: 'Claude 3 Haiku (Fast)',
        maxTokens: 4000,
        temperature: 0.7
      },
      'gpt-4o': {
        provider: 'openai',
        modelId: 'gpt-4o',
        displayName: 'GPT-4o',
        maxTokens: 4000,
        temperature: 0.7
      },
      'gemini-1.5-pro': {
        provider: 'google',
        modelId: 'gemini-1.5-pro',
        displayName: 'Gemini 1.5 Pro',
        maxTokens: 4000,
        temperature: 0.7
      }
    }
  },
  
  // E2B sandbox configuration
  e2b: {
    // Timeout settings
    timeoutMs: 30 * 60 * 1000, // 30 minutes
    timeoutMinutes: 30,
    
    // Vite server settings
    vitePort: 5173,
    viteStartupDelay: 5000, // 5 seconds
    
    // File watching
    watchInterval: 1000, // 1 second
    
    // Cleanup settings
    autoCleanup: true,
    cleanupDelay: 5 * 60 * 1000 // 5 minutes
  },
  
  // File handling configuration  
  files: {
    // Max file size (1MB)
    maxFileSize: 1024 * 1024,
    
    // Supported file extensions
    supportedExtensions: [
      '.js', '.jsx', '.ts', '.tsx',
      '.css', '.scss', '.sass',
      '.html', '.json', '.md',
      '.vue', '.svelte'
    ],
    
    // Files to exclude from AI context
    excludeFromContext: [
      'node_modules',
      '.git',
      '.next',
      'dist',
      'build',
      '.env',
      '.env.local'
    ]
  },
  
  // UI configuration
  ui: {
    // Theme settings
    defaultTheme: 'dark',
    
    // Animation settings
    animationDuration: 300,
    
    // Code editor settings
    codeEditor: {
      theme: 'vscDarkPlus',
      fontSize: 14,
      tabSize: 2,
      wordWrap: true
    }
  },
  
  // HeysMe specific configuration
  heysme: {
    // Integration settings
    enableOpenLovable: true,
    
    // User flow settings
    requireUserProfile: true,
    allowSkipProfile: false,
    
    // Default project settings
    defaultProjectType: 'react-app',
    defaultFramework: 'vite-react'
  }
};
