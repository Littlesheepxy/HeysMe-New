#!/bin/bash

echo "🚀 启动增强版多Agent简历生成系统开发（流式+交互）..."
echo ""

# 创建扩展的项目目录结构
echo "📁 创建项目目录结构..."
mkdir -p lib/{agents,types,prompts,utils,streaming}
mkdir -p components/{chat,ui,code}
mkdir -p __tests__/{agents,integration,streaming}
mkdir -p public/icons
mkdir -p api/openai

# 创建基础文件
echo "📝 创建基础文件..."

# 类型定义
touch lib/types/session.ts
touch lib/types/streaming.ts

# Agent相关
touch lib/agents/base-agent.ts
touch lib/agents/welcome-agent.ts
touch lib/agents/info-collection-agent.ts
touch lib/agents/prompt-output-agent.ts
touch lib/agents/coding-agent.ts

# 工具类
touch lib/utils/session-manager.ts
touch lib/utils/agent-orchestrator.ts
touch lib/utils/interaction-handler.ts

# 流式处理
touch lib/streaming/json-streamer.ts
touch lib/streaming/chunk-processor.ts

# Prompt模板
touch lib/prompts/templates.ts

# UI组件
touch components/chat/ChatInterface.tsx
touch components/chat/MessageFlow.tsx
touch components/chat/StreamingMessage.tsx
touch components/chat/InteractionPanel.tsx

# UI元素
touch components/ui/ChoiceButtons.tsx
touch components/ui/InputFields.tsx
touch components/ui/ProgressBar.tsx
touch components/ui/AgentStatusIndicator.tsx

# 代码相关组件
touch components/code/CodePreview.tsx
touch components/code/CodeBlockStreaming.tsx

# 测试文件
touch __tests__/agents/welcome-agent.test.ts
touch __tests__/agents/info-collection-agent.test.ts
touch __tests__/streaming/json-streamer.test.ts
touch __tests__/integration/full-flow.test.ts

# API路由
touch api/openai/stream.ts

echo ""
echo "📦 安装依赖包..."

# 检查是否有package.json
if [ ! -f "package.json" ]; then
    echo "初始化 package.json..."
    npm init -y
fi

# 安装核心依赖
echo "安装流式处理和UI依赖..."
npm install zustand react-markdown prism-react-renderer
npm install eventsource-parser stream-json
npm install react-hot-toast framer-motion
npm install lucide-react clsx tailwind-merge

# 安装开发依赖
echo "安装开发和测试依赖..."
npm install -D jest @testing-library/react @testing-library/jest-dom
npm install -D typescript @types/react @types/node
npm install -D eslint eslint-config-next
npm install -D tailwindcss postcss autoprefixer

echo ""
echo "⚙️ 创建配置文件..."

# 创建 TypeScript 配置
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@/lib/*": ["./lib/*"],
      "@/components/*": ["./components/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
EOF

# 创建 Tailwind 配置
cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-subtle': 'bounce 1s ease-in-out infinite',
      },
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        }
      }
    },
  },
  plugins: [],
}
EOF

# 创建环境变量模板
cat > .env.example << 'EOF'
# OpenAI API配置
OPENAI_API_KEY=your_openai_api_key_here

# 应用配置
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# 可选：数据库配置（用于持久化会话）
DATABASE_URL=your_database_url_here
EOF

# 创建启动脚本
cat > package.json.scripts << 'EOF'
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:agents": "jest __tests__/agents/",
    "test:streaming": "jest __tests__/streaming/",
    "lint": "eslint . --ext .ts,.tsx",
    "type-check": "tsc --noEmit"
  }
}
EOF

echo ""
echo "🎨 创建示例组件..."

# 创建示例流式消息组件
cat > components/chat/StreamingMessage.tsx << 'EOF'
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { InteractionPanel } from './InteractionPanel';

interface StreamableAgentResponse {
  immediate_display?: {
    reply: string;
    thinking?: string;
  };
  interaction?: {
    type: string;
    elements: any[];
  };
  system_state?: {
    progress?: number;
    intent: string;
    done: boolean;
  };
}

export function StreamingMessage({ 
  response, 
  onInteraction 
}: { 
  response: Partial<StreamableAgentResponse>;
  onInteraction: (type: string, data: any) => void;
}) {
  const [visibleContent, setVisibleContent] = useState('');
  const [showInteraction, setShowInteraction] = useState(false);
  const [isTyping, setIsTyping] = useState(true);
  
  useEffect(() => {
    if (response.immediate_display?.reply) {
      animateTextDisplay(response.immediate_display.reply);
    }
  }, [response.immediate_display]);
  
  const animateTextDisplay = (text: string) => {
    setIsTyping(true);
    let i = 0;
    
    const timer = setInterval(() => {
      setVisibleContent(text.slice(0, i));
      i++;
      
      if (i > text.length) {
        clearInterval(timer);
        setIsTyping(false);
        setShowInteraction(true);
      }
    }, 30);
  };
  
  return (
    <motion.div 
      className="message-container bg-white p-4 rounded-lg shadow-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="reply-content text-gray-800">
        {visibleContent}
        {isTyping && (
          <motion.span 
            className="inline-block w-2 h-5 bg-blue-500 ml-1"
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}
      </div>
      
      {response.system_state?.progress && (
        <div className="mt-3">
          <ProgressBar progress={response.system_state.progress} />
        </div>
      )}
      
      {showInteraction && response.interaction && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <InteractionPanel
            interaction={response.interaction}
            onSubmit={(data) => onInteraction('interaction', data)}
          />
        </motion.div>
      )}
    </motion.div>
  );
}
EOF

# 创建简单的进度条组件
cat > components/ui/ProgressBar.tsx << 'EOF'
'use client';

import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

export function ProgressBar({ progress, stage }: { progress: number; stage?: string }) {
  return (
    <div className="progress-bar w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600">
          {stage ? `${stage} 阶段` : '进度'}
        </span>
        <span className="text-sm font-medium text-blue-600">
          {progress}%
        </span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <motion.div
          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      
      {progress === 100 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center mt-2 text-green-600"
        >
          <CheckCircle className="w-4 h-4 mr-1" />
          <span className="text-sm">完成!</span>
        </motion.div>
      )}
    </div>
  );
}
EOF

echo ""
echo "✅ 项目结构创建完成！"
echo ""
echo "📋 下一步任务："
echo "1. 🔐 复制 .env.example 到 .env 并填入你的 OpenAI API key"
echo "2. 📝 实现 lib/types/streaming.ts 中的流式类型定义"
echo "3. 🔧 实现 lib/streaming/json-streamer.ts 流式JSON处理器"
echo "4. 🤖 实现 lib/agents/base-agent.ts 支持异步生成器的基类"
echo "5. 💬 实现各个具体Agent的流式输出逻辑"
echo ""
echo "📚 参考文档："
echo "- MULTI_AGENT_RESUME_SYSTEM.md (完整设计方案 + 智能个性化Prompt)"
echo "- IMPLEMENTATION_ROADMAP.md (详细实现步骤)"
echo "- TECH_STACK_GUIDE.md (技术栈选择与部署指南)"
echo ""
echo "🧠 智能个性化特性："
echo "✅ 意图识别：区分正式需求 vs 试用体验"  
echo "✅ 身份定制：为设计师、产品、开发者等提供专业化选项"
echo "✅ 风格建议：根据用户身份和目标受众智能推荐"
echo "✅ 技术优化：NextJS+TypeScript+Shadcn/ui，便捷部署到Vercel"
echo ""
echo "🎯 第1周目标：完成智能意图识别和个性化信息收集"
echo ""
echo "🚀 准备启动开发服务器："
echo "   npm run dev"
echo ""
echo "📊 实时进度跟踪建议："
echo "   - 使用 GitHub Issues 跟踪每个任务"
echo "   - 每日检查点确保按时完成"
echo "   - 优先实现个性化Prompt和流式显示核心功能" 