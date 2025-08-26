'use client';

import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Sparkles,
  MessageSquare,
  Palette,
  Code,
  Activity,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StageIndicatorProps {
  currentStage: string;
  percentage: number;
  mode?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'capsule' | 'minimal';
}

/**
 * 阶段指示器组件 - 显示当前进度阶段和百分比
 */
export function StageIndicator({ 
  currentStage, 
  percentage, 
  mode,
  className,
  size = 'md',
  variant = 'capsule'
}: StageIndicatorProps) {
  
  // 阶段配置
  const stageConfig = {
    welcome: {
      label: '欢迎引导',
      color: 'bg-blue-500',
      icon: Sparkles,
      description: '初始化对话'
    },
    info_collection: {
      label: '信息收集',
      color: 'bg-purple-500',
      icon: MessageSquare,
      description: '收集用户信息'
    },
    page_design: {
      label: '页面设计',
      color: 'bg-pink-500',
      icon: Palette,
      description: '设计页面样式'
    },
    code_generation: {
      label: '代码生成',
      color: 'bg-green-500',
      icon: Code,
      description: '生成项目代码'
    },
    completed: {
      label: '完成',
      color: 'bg-emerald-500',
      icon: CheckCircle,
      description: '任务完成'
    }
  };

  const config = stageConfig[currentStage as keyof typeof stageConfig] || {
    label: currentStage,
    color: 'bg-gray-500',
    icon: Activity,
    description: '进行中'
  };

  const Icon = config.icon;

  // 模式配置
  const modeConfig = {
    coding: {
      label: 'Coding',
      color: 'bg-orange-500 text-white',
      bgColor: 'bg-orange-50 border-orange-200'
    },
    design: {
      label: 'Design',
      color: 'bg-purple-500 text-white',
      bgColor: 'bg-purple-50 border-purple-200'
    },
    chat: {
      label: 'Chat',
      color: 'bg-blue-500 text-white',
      bgColor: 'bg-blue-50 border-blue-200'
    }
  };

  const modeInfo = mode ? modeConfig[mode as keyof typeof modeConfig] : null;

  // 尺寸配置
  const sizeConfig = {
    sm: {
      container: 'gap-2 px-3 py-1.5 text-xs',
      icon: 'w-3 h-3',
      progress: 'h-1',
      badge: 'text-xs px-2 py-0.5'
    },
    md: {
      container: 'gap-3 px-4 py-2 text-sm',
      icon: 'w-4 h-4',
      progress: 'h-2',
      badge: 'text-xs px-2 py-1'
    },
    lg: {
      container: 'gap-4 px-5 py-3 text-base',
      icon: 'w-5 h-5',
      progress: 'h-3',
      badge: 'text-sm px-3 py-1'
    }
  };

  const sizes = sizeConfig[size];

  if (variant === 'minimal') {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Icon className={cn(sizes.icon, "text-gray-500")} />
        <span className="text-gray-600 font-medium">{config.label}</span>
        <Badge variant="secondary" className={sizes.badge}>
          {percentage}%
        </Badge>
        {modeInfo && (
          <Badge className={cn(modeInfo.color, sizes.badge)}>
            {modeInfo.label}
          </Badge>
        )}
      </div>
    );
  }

  if (variant === 'default') {
    return (
      <div className={cn("flex items-center gap-2 text-sm", className)}>
        <Icon className={cn(sizes.icon)} />
        <span className="text-gray-600">{config.label}</span>
        <span className="text-blue-600 font-medium">{percentage}%</span>
        {modeInfo && (
          <span className="text-orange-600">({modeInfo.label}模式)</span>
        )}
      </div>
    );
  }

  // 胶囊形式（默认）
  return (
    <div className={cn(
      "flex items-center rounded-full border bg-white shadow-sm",
      modeInfo?.bgColor || "bg-gray-50 border-gray-200",
      sizes.container,
      className
    )}>
      {/* 阶段图标和名称 */}
      <div className="flex items-center gap-2">
        <div className={cn(
          "p-1.5 rounded-full text-white",
          config.color
        )}>
          <Icon className={sizes.icon} />
        </div>
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{config.label}</span>
          <span className="text-xs text-gray-500">{config.description}</span>
        </div>
      </div>

      {/* 进度条 */}
      <div className="flex-1 min-w-16 mx-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-gray-700">{percentage}%</span>
        </div>
        <Progress 
          value={percentage} 
          className={cn("w-full", sizes.progress)}
        />
      </div>

      {/* 模式标识 */}
      {modeInfo && (
        <Badge className={cn(modeInfo.color, sizes.badge)}>
          {modeInfo.label}
        </Badge>
      )}
    </div>
  );
}

/**
 * 悬浮版阶段指示器 - 紧凑设计
 */
export function FloatingStageIndicator({ 
  currentStage, 
  percentage, 
  mode,
  className 
}: Omit<StageIndicatorProps, 'size' | 'variant'>) {
  
  // 阶段配置
  const stageConfig = {
    welcome: {
      label: '欢迎',
      color: 'bg-blue-500',
      icon: Sparkles,
    },
    info_collection: {
      label: '收集',
      color: 'bg-purple-500',
      icon: MessageSquare,
    },
    page_design: {
      label: '设计',
      color: 'bg-pink-500',
      icon: Palette,
    },
    code_generation: {
      label: '生成',
      color: 'bg-green-500',
      icon: Code,
    },
    completed: {
      label: '完成',
      color: 'bg-emerald-500',
      icon: CheckCircle,
    }
  };

  const config = stageConfig[currentStage as keyof typeof stageConfig] || {
    label: currentStage,
    color: 'bg-gray-500',
    icon: Activity,
  };

  const Icon = config.icon;

  // 模式颜色
  const modeColors = {
    coding: 'border-orange-200 bg-orange-50',
    design: 'border-purple-200 bg-purple-50',
    chat: 'border-blue-200 bg-blue-50'
  };

  const modeColor = mode ? modeColors[mode as keyof typeof modeColors] : 'border-gray-200 bg-white';

  return (
    <div className={cn(
      "inline-flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-lg backdrop-blur-sm",
      modeColor,
      "hover:shadow-xl transition-all duration-200",
      className
    )}>
      {/* 阶段图标 */}
      <div className={cn(
        "p-1 rounded-full text-white",
        config.color
      )}>
        <Icon className="w-3 h-3" />
      </div>
      
      {/* 阶段名称 */}
      <span className="text-sm font-medium text-gray-700">
        {config.label}
      </span>
      
      {/* 进度 */}
      <div className="flex items-center gap-1">
        <div className="w-8 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={cn("h-full transition-all duration-300", config.color)}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-xs font-medium text-gray-600 min-w-[2rem]">
          {percentage}%
        </span>
      </div>
      
      {/* 模式标识 */}
      {mode && (
        <div className={cn(
          "px-1.5 py-0.5 rounded-full text-xs font-medium",
          mode === 'coding' && 'bg-orange-200 text-orange-700',
          mode === 'design' && 'bg-purple-200 text-purple-700',
          mode === 'chat' && 'bg-blue-200 text-blue-700'
        )}>
          {mode === 'coding' ? 'Code' : mode === 'design' ? 'Design' : 'Chat'}
        </div>
      )}
    </div>
  );
}

/**
 * 紧凑版阶段指示器
 */
export function CompactStageIndicator({ 
  currentStage, 
  percentage, 
  mode,
  className 
}: Omit<StageIndicatorProps, 'size' | 'variant'>) {
  return (
    <StageIndicator
      currentStage={currentStage}
      percentage={percentage}
      mode={mode}
      className={className}
      size="sm"
      variant="minimal"
    />
  );
}
