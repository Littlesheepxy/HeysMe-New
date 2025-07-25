"use client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, Zap, Brain } from "lucide-react"
import { AVAILABLE_MODELS, type ModelConfig } from "@/types/models"
import { useTheme } from "@/contexts/theme-context"

interface ModelSelectorProps {
  selectedModel: string
  onModelChange: (modelId: string) => void
  className?: string
}

export function ModelSelector({ selectedModel, onModelChange, className = "" }: ModelSelectorProps) {
  const { theme } = useTheme()
  const currentModel = AVAILABLE_MODELS.find((model) => model.id === selectedModel) || AVAILABLE_MODELS[0]

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case "openai":
        return <Zap className="w-4 h-4" />
      case "claude":
        return <Brain className="w-4 h-4" />
      default:
        return <Zap className="w-4 h-4" />
    }
  }

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case "openai":
        return "text-green-600"
      case "claude":
        return "text-orange-600"
      default:
        return "text-gray-600"
    }
  }

  const groupedModels = AVAILABLE_MODELS.reduce(
    (acc, model) => {
      if (!acc[model.provider]) {
        acc[model.provider] = []
      }
      acc[model.provider].push(model)
      return acc
    },
    {} as Record<string, ModelConfig[]>,
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={`rounded-2xl backdrop-blur-sm transition-all duration-300 ${
            theme === "light" ? "border-white/30 bg-white/60" : "border-gray-700/30 bg-gray-800/60"
          } ${className}`}
        >
          <div className="flex items-center gap-2">
            <span className={getProviderColor(currentModel.provider)}>{getProviderIcon(currentModel.provider)}</span>
            <span className="font-medium">{currentModel.name}</span>
            <ChevronDown className="w-4 h-4 opacity-50" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className={`w-80 rounded-2xl backdrop-blur-xl border shadow-xl ${
          theme === "light" ? "bg-white/90 border-white/30" : "bg-gray-900/90 border-gray-700/30"
        }`}
      >
        <DropdownMenuLabel className={theme === "light" ? "text-gray-900" : "text-gray-100"}>
          选择 AI 模型
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {Object.entries(groupedModels).map(([provider, models]) => (
          <div key={provider}>
            <DropdownMenuLabel
              className={`text-sm font-semibold ${
                theme === "light" ? "text-gray-700" : "text-gray-300"
              } ${getProviderColor(provider)}`}
            >
              <div className="flex items-center gap-2">
                {getProviderIcon(provider)}
                {provider === "openai" ? "OpenAI" : "Anthropic"}
              </div>
            </DropdownMenuLabel>
            {models.map((model) => (
              <DropdownMenuItem
                key={model.id}
                onClick={() => onModelChange(model.id)}
                className={`rounded-xl mx-2 mb-1 cursor-pointer transition-all duration-200 ${
                  selectedModel === model.id
                    ? theme === "light"
                      ? "bg-blue-50 text-blue-900"
                      : "bg-blue-900/30 text-blue-200"
                    : theme === "light"
                      ? "hover:bg-gray-50"
                      : "hover:bg-gray-800/50"
                }`}
              >
                <div className="flex flex-col gap-1 w-full">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{model.name}</span>
                    {selectedModel === model.id && (
                      <Badge variant="secondary" className="text-xs">
                        当前
                      </Badge>
                    )}
                  </div>
                  <p className={`text-xs ${theme === "light" ? "text-gray-500" : "text-gray-400"}`}>
                    {model.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {(model.maxTokens / 1000).toFixed(0)}K tokens
                    </Badge>
                    {model.supportsFunctions && (
                      <Badge variant="outline" className="text-xs">
                        函数调用
                      </Badge>
                    )}
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
