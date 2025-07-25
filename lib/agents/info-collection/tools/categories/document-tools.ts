/**
 * 文档处理工具分类
 * 专门处理各类文档的解析和信息提取
 */

import { ClaudeToolDefinition, ToolCategory } from '../types';

/**
 * 文档解析工具
 */
export const DOCUMENT_PARSE_TOOL: ClaudeToolDefinition = {
  name: 'parse_document',
  category: ToolCategory.DOCUMENT,
  priority: 8,
  description: `专业文档解析工具，专门用于从上传文件中提取结构化信息。这是简历、作品集文档和证书文件处理的核心组件。

支持的文档类型：
- PDF文件：提取文本内容、表格数据、图片信息和基本文档结构
- Word文档（.docx）：完整的文档结构、格式信息、样式和嵌入对象
- Excel文件（.xlsx）：表格数据、图表信息、公式和数据分析
- PowerPoint（.pptx）：幻灯片内容、布局结构、图表和媒体文件
- 纯文本文件：直接内容提取和编码检测

智能解析功能：
- 自动识别简历结构（个人信息、工作经历、教育背景、技能、项目经验）
- 智能提取联系方式和个人详情（邮箱、电话、地址、社交链接）
- 识别工作经历的时间线和职责描述
- 提取技能关键词和技术栈信息
- 分析项目经验和成就亮点
- 检测教育背景和认证信息

高级分析能力：
- 文档质量评估（结构完整性、信息丰富度、专业性）
- 内容相关性分析（与目标职位的匹配度）
- 关键词密度和重要性评分
- 时间线一致性检查
- 联系信息有效性验证

输出格式优化：
- 结构化的JSON数据，便于系统集成
- 分类整理的信息字段，支持快速访问
- 置信度评分，指示提取质量
- 展示建议和优化提示
- 数据完整度评估

错误处理策略：
- 文档格式不支持时的友好提示和替代方案
- 解析失败时的降级处理（部分提取、OCR备选）
- 损坏文档的恢复尝试
- 部分解析成功时的数据保留和补全建议`,
  input_schema: {
    type: 'object',
    properties: {
      file_data: {
        type: 'string',
        description: '文档文件的数据。可以是base64编码的文件内容、文件路径或临时文件URL'
      },
      file_type: {
        type: 'string',
        enum: ['pdf', 'docx', 'xlsx', 'pptx', 'txt', 'rtf'],
        description: '文档文件的类型，用于选择合适的解析策略和优化处理流程'
      },
      extract_mode: {
        type: 'string',
        enum: ['resume', 'portfolio', 'certificate', 'general'],
        description: '提取模式。resume：简历模式，重点提取职业信息；portfolio：作品集模式；certificate：证书模式；general：通用模式'
      },
      language: {
        type: 'string',
        enum: ['auto', 'zh', 'en'],
        description: '文档主要语言，用于优化OCR和关键词识别。auto：自动检测；zh：中文；en：英文'
      }
    },
    required: ['file_data', 'file_type']
  },
  metadata: {
    version: '2.0.0',
    author: 'HeysMe Team',
    tags: ['document-parsing', 'resume', 'ocr', 'text-extraction'],
    estimatedTime: 15000 // 15秒预估时间
  }
};

/**
 * PDF专用分析工具
 */
export const PDF_ANALYZE_TOOL: ClaudeToolDefinition = {
  name: 'analyze_pdf_advanced',
  category: ToolCategory.DOCUMENT,
  priority: 7,
  description: `高级PDF文档分析工具，专门针对PDF格式的深度解析和内容提取。

特殊能力：
- 多页面结构分析和内容关联
- 表格识别和数据提取
- 图片和图表的OCR处理
- 字体和格式信息保留
- 水印和页眉页脚处理

适用场景：
- 复杂简历的深度解析
- 学术论文和证书处理
- 设计作品集的图文分析
- 多页面报告的结构化提取`,
  input_schema: {
    type: 'object',
    properties: {
      file_data: {
        type: 'string',
        description: 'PDF文件的base64编码数据或文件路径'
      },
      extract_images: {
        type: 'boolean',
        description: '是否提取和分析PDF中的图片内容'
      },
      ocr_enable: {
        type: 'boolean',
        description: '是否启用OCR处理扫描版PDF'
      }
    },
    required: ['file_data']
  },
  metadata: {
    version: '1.0.0',
    author: 'HeysMe Team',
    tags: ['pdf', 'ocr', 'advanced-parsing'],
    estimatedTime: 20000
  }
};

/**
 * 文档工具集合
 */
export const DOCUMENT_TOOLS: ClaudeToolDefinition[] = [
  DOCUMENT_PARSE_TOOL,
  PDF_ANALYZE_TOOL
];

/**
 * 文档工具相关的辅助函数
 */
export function getSupportedFileTypes(): string[] {
  return ['pdf', 'docx', 'xlsx', 'pptx', 'txt', 'rtf'];
}

export function validateFileType(fileName: string): { valid: boolean; type?: string; reason?: string } {
  if (!fileName) {
    return { valid: false, reason: '文件名不能为空' };
  }
  
  const extension = fileName.toLowerCase().split('.').pop();
  if (!extension) {
    return { valid: false, reason: '无法识别文件类型' };
  }
  
  const supportedTypes = getSupportedFileTypes();
  if (!supportedTypes.includes(extension)) {
    return { 
      valid: false, 
      reason: `不支持的文件类型：${extension}。支持的类型：${supportedTypes.join(', ')}` 
    };
  }
  
  return { valid: true, type: extension };
}

export function estimateProcessingTime(fileType: string, fileSize?: number): number {
  const baseTime = {
    pdf: 15000,
    docx: 8000,
    xlsx: 10000,
    pptx: 12000,
    txt: 2000,
    rtf: 5000
  };
  
  let time = baseTime[fileType as keyof typeof baseTime] || 10000;
  
  // 根据文件大小调整时间
  if (fileSize) {
    const sizeMB = fileSize / (1024 * 1024);
    if (sizeMB > 5) {
      time *= 1.5; // 大文件增加50%时间
    } else if (sizeMB > 10) {
      time *= 2; // 超大文件翻倍时间
    }
  }
  
  return Math.round(time);
}

export function categorizeDocumentContent(content: string): {
  type: 'resume' | 'portfolio' | 'certificate' | 'general';
  confidence: number;
  sections: string[];
} {
  const text = content.toLowerCase();
  
  // 简历特征检测
  const resumeKeywords = ['work experience', '工作经历', 'education', '教育背景', 'skills', '技能', 'contact', '联系方式'];
  const resumeScore = resumeKeywords.filter(keyword => text.includes(keyword)).length;
  
  // 作品集特征检测
  const portfolioKeywords = ['portfolio', '作品集', 'projects', '项目', 'design', '设计', 'gallery', '画廊'];
  const portfolioScore = portfolioKeywords.filter(keyword => text.includes(keyword)).length;
  
  // 证书特征检测
  const certificateKeywords = ['certificate', '证书', 'certification', '认证', 'award', '奖项', 'achievement', '成就'];
  const certificateScore = certificateKeywords.filter(keyword => text.includes(keyword)).length;
  
  // 确定文档类型
  const maxScore = Math.max(resumeScore, portfolioScore, certificateScore);
  let type: 'resume' | 'portfolio' | 'certificate' | 'general' = 'general';
  let confidence = 0;
  
  if (maxScore > 0) {
    if (resumeScore === maxScore) {
      type = 'resume';
      confidence = Math.min(resumeScore / resumeKeywords.length, 1);
    } else if (portfolioScore === maxScore) {
      type = 'portfolio';
      confidence = Math.min(portfolioScore / portfolioKeywords.length, 1);
    } else {
      type = 'certificate';
      confidence = Math.min(certificateScore / certificateKeywords.length, 1);
    }
  }
  
  // 检测内容区域
  const sections: string[] = [];
  if (text.includes('personal') || text.includes('个人信息')) sections.push('personal');
  if (text.includes('experience') || text.includes('经历')) sections.push('experience');
  if (text.includes('education') || text.includes('教育')) sections.push('education');
  if (text.includes('skills') || text.includes('技能')) sections.push('skills');
  if (text.includes('project') || text.includes('项目')) sections.push('projects');
  if (text.includes('contact') || text.includes('联系')) sections.push('contact');
  
  return { type, confidence, sections };
} 