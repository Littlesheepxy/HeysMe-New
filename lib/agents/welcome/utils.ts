/**
 * Welcome Agent 工具函数
 */

import { 
  WELCOME_SYSTEM_PROMPT,
  FIRST_ROUND_PROMPT_TEMPLATE,
  CONTINUATION_PROMPT_TEMPLATE
} from '@/lib/prompts/welcome';
import { generateStreamWithModel } from '@/lib/ai-models';
import { cleanTextContent } from '@/lib/utils';

/**
 * 收集到的信息接口
 */
export interface CollectedInfo {
  user_role?: string;
  use_case?: string;
  style?: string;
  highlight_focus?: string;
}

/**
 * 用户意图分析接口
 */
export interface UserIntentAnalysis {
  commitment_level: '试一试' | '认真制作';
  reasoning: string;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * AI响应接口 - 更新版本
 */
export interface WelcomeAIResponse {
  reply: string;
  collected_info: CollectedInfo;
  completion_status: 'collecting' | 'ready';
  user_intent_analysis: UserIntentAnalysis;
  next_question?: string;
}

/**
 * Welcome Agent汇总结果接口 - 匹配 optimized-agent 需求
 */
export interface WelcomeSummaryResult {
  summary: {
    user_role: string;
    use_case: string;
    style: string;
    highlight_focus: string;
  };
  user_intent: {
    commitment_level: '试一试' | '认真制作';
    reasoning: string;
  };
  sample_suggestions: {
    should_use_samples: boolean;
    sample_reason: string;
  };
  collection_priority: string;
  current_collected_data: CollectedInfo;
  available_tools: string[];
  context_for_next_agent: string;
}

/**
 * 格式化第一轮Prompt
 */
export function getFirstRoundPrompt(userInput: string): string {
  return FIRST_ROUND_PROMPT_TEMPLATE.replace('{userInput}', userInput);
}

/**
 * 格式化后续轮次Prompt
 */
export function getContinuationPrompt(
  userInput: string, 
  conversationHistory: string, 
  currentInfo: CollectedInfo,
  currentIntent?: UserIntentAnalysis
): string {
  return CONTINUATION_PROMPT_TEMPLATE
    .replace('{userInput}', userInput)
    .replace('{conversationHistory}', conversationHistory)
    .replace('{currentInfo}', JSON.stringify(currentInfo, null, 2))
    .replace('{currentIntent}', JSON.stringify(currentIntent || {}, null, 2));
}

/**
 * 尝试解析部分流式响应，检测是否包含完整的JSON
 */
export function tryParseStreamingResponse(partialResponse: string): {
  isComplete: boolean;
  parsedResponse?: WelcomeAIResponse;
  displayText: string;
} {
  // 先尝试提取显示文本
  let displayText = partialResponse;
  
  // 如果看起来像JSON，尝试提取reply字段
  if (partialResponse.includes('"reply"') && partialResponse.includes(':')) {
    try {
      // 尝试提取reply内容
      const replyMatch = partialResponse.match(/"reply"\s*:\s*"([^"]*(?:\\.[^"]*)*)"/);
      if (replyMatch) {
        displayText = replyMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n');
      }
    } catch (error) {
      // 提取失败，使用原始文本
    }
  }
  
  // 检查是否是完整的JSON
  try {
    const parsed = JSON.parse(partialResponse);
    if (parsed.reply && parsed.completion_status) {
      return {
        isComplete: true,
        parsedResponse: parseAIResponse(partialResponse),
        displayText: parsed.reply
      };
    }
  } catch (error) {
    // 不是完整的JSON，继续流式处理
  }
  
  return {
    isComplete: false,
    displayText: displayText
  };
}

/**
 * 流式内容分离结果
 */
export interface StreamContentSeparation {
  visibleContent: string;
  hiddenControl: WelcomeAIResponse | null;
  isComplete: boolean;
}

/**
 * 分离可见内容和隐藏控制信息
 * 支持流式处理中的部分内容解析
 */
export function separateVisibleAndHiddenContent(content: string): StreamContentSeparation {
  // 🔧 增强：多种隐藏控制标记匹配
  const patterns = [
    /```HIDDEN_CONTROL\s*([\s\S]*?)\s*```/,  // 代码块格式
    /HIDDEN_CONTROL\s*([\s\S]*?)(?=\n\n|$)/   // 简单格式
  ];
  
  let match: RegExpMatchArray | null = null;
  let patternUsed = '';
  
  // 尝试各种模式
  for (const pattern of patterns) {
    match = content.match(pattern);
    if (match) {
      patternUsed = pattern.source;
      break;
    }
  }
  
  if (match) {
    console.log(`🔍 [隐藏控制] 使用正则 ${patternUsed} 匹配到内容`);
    
    // 🔧 关键修复：正确分离可见内容，完全移除隐藏控制部分并清理空行
    const beforeHidden = content.substring(0, match.index || 0);
    const afterHidden = content.substring((match.index || 0) + match[0].length);
    
    // 🔧 新增：智能清理空行和空格
    const cleanVisibleContent = cleanupContent(beforeHidden + afterHidden);
    
    // 提取JSON字符串
    const jsonStr = match[1].trim();
    
    // 🔧 增强：JSON解析容错处理
    if (jsonStr) {
      try {
        // 🔧 检查JSON是否完整
        if (!isCompleteJSON(jsonStr)) {
          console.log(`⚠️ [JSON不完整] 等待更多数据: ${jsonStr.substring(0, 50)}...`);
          return {
            visibleContent: cleanVisibleContent,
            hiddenControl: null,
            isComplete: false
          };
        }
        
        console.log(`📄 [JSON解析] 尝试解析: ${jsonStr.substring(0, 100)}...`);
        
        const hiddenJson = JSON.parse(jsonStr);
        const hiddenControl: WelcomeAIResponse = {
          reply: cleanVisibleContent, // 使用清理后的可见内容
          collected_info: hiddenJson.collected_info || {},
          completion_status: hiddenJson.completion_status || 'collecting',
          user_intent_analysis: hiddenJson.user_intent_analysis || {
            commitment_level: '认真制作',
            reasoning: '默认分析',
            confidence: 'low'
          },
          next_question: hiddenJson.next_question
        };
        
        console.log(`✅ [隐藏控制解析成功] completion_status: ${hiddenControl.completion_status}, commitment_level: ${hiddenControl.user_intent_analysis.commitment_level}`);
        
        return {
          visibleContent: cleanVisibleContent,
          hiddenControl,
          isComplete: true
        };
      } catch (error) {
        console.warn('⚠️ [隐藏控制信息解析失败]:', error);
        console.warn('📄 [原始匹配内容]:', match[0]);
        
        // 🔧 增强：尝试修复常见的JSON问题
        const fixedJson = tryFixJSON(jsonStr);
        if (fixedJson) {
          try {
            const hiddenJson = JSON.parse(fixedJson);
            console.log('✅ [JSON修复成功] 使用修复后的JSON');
            
            const hiddenControl: WelcomeAIResponse = {
              reply: cleanVisibleContent, // 使用清理后的可见内容
              collected_info: hiddenJson.collected_info || {},
              completion_status: hiddenJson.completion_status || 'collecting',
              user_intent_analysis: hiddenJson.user_intent_analysis || {
                commitment_level: '认真制作',
                reasoning: '修复后的默认分析',
                confidence: 'low'
              },
              next_question: hiddenJson.next_question
            };
            
            return {
              visibleContent: cleanVisibleContent,
              hiddenControl,
              isComplete: true
            };
          } catch (fixError) {
            console.warn('⚠️ [JSON修复也失败了]:', fixError);
          }
        }
        
        // 🔧 修复：即使解析失败，也要返回清理后的可见内容
        return {
          visibleContent: cleanVisibleContent,
          hiddenControl: null,
          isComplete: false
        };
      }
    }
  }
  
  // 没有找到隐藏控制信息，返回清理后的原始内容
  return {
    visibleContent: cleanupContent(content),
    hiddenControl: null,
    isComplete: false
  };
}

/**
 * 🔧 使用全局内容清理函数
 */
function cleanupContent(content: string): string {
  return cleanTextContent(content);
}

/**
 * 🔧 新增：检查JSON字符串是否完整
 */
function isCompleteJSON(jsonStr: string): boolean {
  // 基本完整性检查
  const trimmed = jsonStr.trim();
  
  // 必须以 { 开始
  if (!trimmed.startsWith('{')) {
    return false;
  }
  
  // 简单的括号匹配检查
  let braceCount = 0;
  let inString = false;
  let escaped = false;
  
  for (let i = 0; i < trimmed.length; i++) {
    const char = trimmed[i];
    
    if (escaped) {
      escaped = false;
      continue;
    }
    
    if (char === '\\') {
      escaped = true;
      continue;
    }
    
    if (char === '"') {
      inString = !inString;
      continue;
    }
    
    if (!inString) {
      if (char === '{') {
        braceCount++;
      } else if (char === '}') {
        braceCount--;
      }
    }
  }
  
  // JSON完整的条件：括号平衡且以}结尾
  return braceCount === 0 && trimmed.endsWith('}');
}

/**
 * 🔧 新增：尝试修复常见的JSON问题
 */
function tryFixJSON(jsonStr: string): string | null {
  try {
    let fixed = jsonStr.trim();
    
    // 修复1：移除末尾的逗号
    fixed = fixed.replace(/,(\s*[}\]])/g, '$1');
    
    // 修复2：确保字符串值被正确引用
    fixed = fixed.replace(/:\s*([^",{}\[\]]+)(?=\s*[,}])/g, (match, value) => {
      const trimmedValue = value.trim();
      // 如果不是数字、布尔值或null，则添加引号
      if (!/^(true|false|null|\d+(\.\d+)?)$/.test(trimmedValue)) {
        return `: "${trimmedValue}"`;
      }
      return match;
    });
    
    // 修复3：处理不完整的字符串
    const lastQuoteIndex = fixed.lastIndexOf('"');
    const lastColonIndex = fixed.lastIndexOf(':');
    
    if (lastColonIndex > lastQuoteIndex && !fixed.endsWith('}')) {
      // 可能是不完整的字符串值
      const afterColon = fixed.substring(lastColonIndex + 1).trim();
      if (afterColon && !afterColon.startsWith('"')) {
        // 补全字符串引号和结束括号
        fixed = fixed.substring(0, lastColonIndex + 1) + ` "${afterColon}"`;
      }
      
      // 确保有结束括号
      if (!fixed.trim().endsWith('}')) {
        // 计算需要的结束括号数量
        const openBraces = (fixed.match(/{/g) || []).length;
        const closeBraces = (fixed.match(/}/g) || []).length;
        const needed = openBraces - closeBraces;
        
        for (let i = 0; i < needed; i++) {
          fixed += '}';
        }
      }
    }
    
    // 验证修复后的JSON
    JSON.parse(fixed);
    return fixed;
    
  } catch (error) {
    return null;
  }
}

/**
 * 流式内容处理器 - 实时分离可见和隐藏内容
 */
export class StreamContentProcessor {
  private accumulatedContent = '';
  private lastVisibleContent = '';
  
  /**
   * 处理新的流式内容块
   */
  processChunk(chunk: string): {
    newVisibleContent: string;
    hiddenControl: WelcomeAIResponse | null;
    isComplete: boolean;
  } {
    this.accumulatedContent += chunk;
    
    const separation = separateVisibleAndHiddenContent(this.accumulatedContent);
    
    // 🔧 修复：计算真正新增的可见内容，避免重复发送
    const currentVisibleContent = separation.visibleContent;
    const newVisibleContent = currentVisibleContent.slice(this.lastVisibleContent.length);
    
    // 🔧 修复：只有当真正有新内容时才更新
    if (newVisibleContent.length > 0) {
      this.lastVisibleContent = currentVisibleContent;
    }
    
    // 🔧 调试日志：显示内容处理状态
    if (newVisibleContent.length > 0) {
      console.log(`📝 [内容处理器] 新增可见内容长度: ${newVisibleContent.length}, 累计长度: ${currentVisibleContent.length}`);
    }
    
    return {
      newVisibleContent,
      hiddenControl: separation.hiddenControl,
      isComplete: separation.isComplete
    };
  }
  
  /**
   * 重置处理器
   */
  reset(): void {
    this.accumulatedContent = '';
    this.lastVisibleContent = '';
  }
  
  /**
   * 获取当前可见内容
   */
  getCurrentVisibleContent(): string {
    return this.lastVisibleContent;
  }
}

/**
 * 解析AI响应 - 更新为支持新格式
 */
export function parseAIResponse(response: string): WelcomeAIResponse {
  console.log(`🔍 [parseAIResponse] 开始解析AI响应`);
  console.log(`📄 [原始响应] 长度: ${response.length}, 前200字符: ${response.substring(0, 200)}`);
  
  // 🆕 使用新的内容分离函数
  const separation = separateVisibleAndHiddenContent(response);
  
  if (separation.hiddenControl) {
    console.log(`✅ [解析成功] 找到隐藏控制信息`);
    return separation.hiddenControl;
  }
  
  // 🔧 回退：尝试直接JSON解析（兼容旧格式）
  try {
    console.log(`🔄 [回退解析] 尝试直接JSON解析`);
    const parsed = JSON.parse(response.trim());
    
    // 🔧 确保包含必需的用户意图分析
    if (!parsed.user_intent_analysis) {
      parsed.user_intent_analysis = {
        commitment_level: '认真制作',
        reasoning: '未提供意图分析，默认为认真制作',
        confidence: 'low'
      };
    }
    
    console.log(`✅ [回退解析成功] completion_status: ${parsed.completion_status}`);
    return parsed;
  } catch (error) {
    console.warn('⚠️ [JSON解析失败]:', error);
    
    // 🔧 最后的回退：从文本中提取信息
    const extractedInfo = extractInfoFromText(response);
    console.log(`🔄 [文本提取] 提取到的信息:`, extractedInfo);
    
    return {
      reply: response,
      collected_info: extractedInfo,
      completion_status: 'collecting',
      user_intent_analysis: {
        commitment_level: '认真制作',
        reasoning: '从文本分析推断',
        confidence: 'low'
      }
    };
  }
}

/**
 * 从文本中提取收集到的信息
 */
function extractInfoFromText(text: string): CollectedInfo {
  const info: CollectedInfo = {};
  
  // 简单的关键词匹配提取信息
  if (text.includes('社交媒体') || text.includes('粉丝')) {
    info.use_case = '分享给社交媒体粉丝';
  }
  
  return info;
}

/**
 * 计算收集进度
 */
export function calculateCollectionProgress(collectedInfo: CollectedInfo): number {
  const fields = ['user_role', 'use_case', 'style', 'highlight_focus'];
  const completedFields = fields.filter(field => collectedInfo[field as keyof CollectedInfo]);
  return Math.round((completedFields.length / fields.length) * 100);
}

/**
 * 构建对话历史文本
 */
export function buildConversationHistoryText(conversationHistory: any[]): string {
  return conversationHistory
    .map(msg => `${msg.role}: ${msg.content}`)
    .join('\n\n');
}

/**
 * 验证收集信息的完整性
 */
export function isInfoCollectionComplete(collectedInfo: CollectedInfo): boolean {
  return !!(
    collectedInfo.user_role && 
    collectedInfo.use_case && 
    collectedInfo.style && 
    collectedInfo.highlight_focus
  );
}

/**
 * 生成收集状态摘要
 */
export function generateCollectionSummary(collectedInfo: CollectedInfo): string {
  const items = [];
  if (collectedInfo.user_role) items.push(`身份: ${collectedInfo.user_role}`);
  if (collectedInfo.use_case) items.push(`目的: ${collectedInfo.use_case}`);
  if (collectedInfo.style) items.push(`风格: ${collectedInfo.style}`);
  if (collectedInfo.highlight_focus) items.push(`重点: ${collectedInfo.highlight_focus}`);
  
  return items.length > 0 ? items.join(', ') : '信息收集中';
}

/**
 * 获取系统Prompt
 */
export function getSystemPrompt(): string {
  return WELCOME_SYSTEM_PROMPT;
} 