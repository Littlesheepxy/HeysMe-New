import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 清理文本内容，移除多余的空格和换行符
 */
export function cleanTextContent(content: string): string {
  if (!content) return '';
  
  return content
    // 移除多余的空白字符
    .replace(/\s+/g, ' ')
    // 移除开头和结尾的空白
    .trim()
    // 处理换行符
    .replace(/\n\s*\n/g, '\n\n'); // 保持段落间距
}