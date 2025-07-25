import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 🔧 全局内容清理函数：彻底清理文本中的多余空行和空格
 * 用于统一处理AI输出、用户输入和渲染内容中的空行问题
 */
export function cleanTextContent(content: string): string {
  if (!content) return '';
  
  return content
    // 1. 移除开头和结尾的空白
    .trim()
    // 2. 标准化换行符
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // 3. 移除3个或更多连续空行，保留最多两个换行符（即一个空行）
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    // 4. 移除行尾空格和制表符
    .replace(/[ \t]+$/gm, '')
    // 5. 移除多余的空格（连续空格变为单个）
    .replace(/[ \t]+/g, ' ')
    // 6. 最终清理：确保开头结尾没有空行
    .trim();
}

/**
 * 🔧 轻量级内容清理函数：仅处理基本的空行问题
 * 用于不需要深度处理的场景
 */
export function cleanBasicContent(content: string): string {
  if (!content) return '';
  
  return content
    .trim()
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .replace(/[ \t]+$/gm, '')
    .trim();
}
