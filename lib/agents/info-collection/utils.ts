/**
 * Info Collection Agent 工具函数、常量和类型定义
 */

// =================== 类型定义 ===================

export interface MaterialCollectionState {
  completeness: number;
  hasDocuments: boolean;
  hasLinks: boolean;
  userOptedOut: boolean;
  missingCritical: string[];
  canProceed: boolean;
}

// =================== 常量配置 ===================

export const COLLECTION_THRESHOLDS = {
  quick: 30,
  standard: 70,
  comprehensive: 90
};

export const USER_TYPE_COMPLETION_REQUIREMENTS = {
  '开发者': 70,
  '设计师': 80,
  '产品经理': 60,
  '学生': 40,
  '创业者': 60,
  'default': 50
};

export const REQUIRED_MATERIALS = {
  '开发者': {
    required: ['github', 'resume'],
    optional: ['blog', 'projects', 'linkedin']
  },
  '设计师': {
    required: ['portfolio', 'resume'], 
    optional: ['behance', 'dribbble', 'website']
  },
  '产品经理': {
    required: ['resume', 'linkedin'],
    optional: ['portfolio', 'projects', 'blog']
  },
  '学生': {
    required: ['resume'],
    optional: ['projects', 'github', 'portfolio']
  },
  '创业者': {
    required: ['linkedin'],
    optional: ['website', 'projects', 'resume']
  },
  'default': {
    required: ['resume'],
    optional: ['linkedin', 'portfolio', 'projects']
  }
};

export const MATERIAL_REQUEST_MESSAGES = {
  '开发者': `作为软件工程师，如果您有以下材料会让页面更加出色：
🔗 **GitHub链接**（最重要）- 展示您的代码能力
📄 **现有简历** - 我可以提取关键信息  
🌐 **技术博客** - 体现您的技术深度
⭐ **开源项目链接** - 突出您的贡献

如果暂时没有也没关系，我们可以先创建一个基础版本！`,

  '设计师': `作为设计师，这些材料能让您的页面更加吸引人：
🎨 **作品集**（Behance/Dribbble链接或文件）- 最重要
📄 **现有简历** - 了解您的经历
🌐 **个人网站** - 如果已有设计页面  
📱 **项目截图** - 重要作品的视觉展示

没有完整作品集也可以，我们一起创建一个！`,

  'default': `现在让我了解一下您现有的材料，这样能为您创建更精准的页面：
📄 **现有简历** - 基础信息来源
🔗 **LinkedIn档案** - 职业展示
🌐 **个人网站/博客** - 现有在线展示
📱 **相关链接** - 任何能展示您能力的链接

没有这些材料也完全没问题，我们可以帮您创建！`
};

export const MATERIAL_GUIDES = {
  '开发者': {
    primary: [
      {
        id: 'github',
        label: '🔗 GitHub 链接',
        description: '您的GitHub主页链接',
        placeholder: 'https://github.com/yourusername',
        priority: 'high'
      },
      {
        id: 'resume',
        label: '📄 现有简历',
        description: '上传PDF简历或提供在线链接',
        type: 'file_or_link',
        priority: 'high'
      }
    ],
    secondary: [
      {
        id: 'blog',
        label: '📝 技术博客',
        description: '个人技术博客或专栏链接',
        placeholder: 'https://yourblog.com'
      },
      {
        id: 'projects',
        label: '⭐ 重点项目',
        description: '重要项目的链接或描述',
        type: 'textarea'
      }
    ]
  },
  '设计师': {
    primary: [
      {
        id: 'portfolio',
        label: '🎨 作品集',
        description: 'Behance、Dribbble或个人作品集链接',
        placeholder: 'https://behance.net/yourusername',
        priority: 'high'
      },
      {
        id: 'resume',
        label: '📄 现有简历',
        description: '上传PDF简历或提供在线链接',
        type: 'file_or_link',
        priority: 'high'
      }
    ],
    secondary: [
      {
        id: 'website',
        label: '🌐 个人网站',
        description: '如果已有个人展示网站',
        placeholder: 'https://yourportfolio.com'
      }
    ]
  },
  'default': {
    primary: [
      {
        id: 'resume',
        label: '📄 现有简历',
        description: '上传PDF简历或提供在线链接',
        type: 'file_or_link',
        priority: 'high'
      },
      {
        id: 'linkedin',
        label: '🔗 LinkedIn 档案',
        description: '您的LinkedIn个人资料链接',
        placeholder: 'https://linkedin.com/in/yourusername'
      }
    ],
    secondary: [
      {
        id: 'website',
        label: '🌐 个人网站/博客',
        description: '现有的在线展示页面',
        placeholder: 'https://yourwebsite.com'
      }
    ]
  }
};

// =================== 工具函数 ===================

/**
 * 提取用户目标
 */
export function extractUserGoal(sessionData: any): string {
  return sessionData.metadata?.intentData?.use_case || 
         sessionData.userIntent?.primary_goal?.split('（')[0] || 
         '其他';
}

/**
 * 提取用户类型
 */
export function extractUserType(sessionData: any): string {
  return sessionData.metadata?.intentData?.user_role || 
         sessionData.personalization?.identity?.profession || 
         'default';
}

/**
 * 提取紧急程度
 */
export function extractUrgency(sessionData: any): string {
  return sessionData.userIntent?.urgency || 'exploring';
}

/**
 * 确定收集模式
 */
export function determineCollectionMode(userGoal: string, urgency: string): 'quick' | 'standard' | 'comprehensive' {
  if (userGoal === '试试看' || urgency === 'exploring') return 'quick';
  if (userGoal === '求职' || userGoal === '作品展示') return 'comprehensive';
  return 'standard';
}

/**
 * 获取所需材料配置
 */
export function getRequiredMaterials(userType: string): { required: string[], optional: string[] } {
  return REQUIRED_MATERIALS[userType as keyof typeof REQUIRED_MATERIALS] || REQUIRED_MATERIALS.default;
}

/**
 * 获取必需的完整度阈值
 */
export function getRequiredCompleteness(userType: string): number {
  return USER_TYPE_COMPLETION_REQUIREMENTS[userType as keyof typeof USER_TYPE_COMPLETION_REQUIREMENTS] || 
         USER_TYPE_COMPLETION_REQUIREMENTS.default;
}

/**
 * 检查是否有特定材料
 */
export function hasMaterial(materials: any, materialKey: string): boolean {
  return materials.links?.some((link: any) => link.type === materialKey) || false;
}

/**
 * 获取缺失的关键材料
 */
export function getMissingCriticalMaterials(materials: any, userType: string): string[] {
  const required = getRequiredMaterials(userType).required;
  return required.filter(material => !hasMaterial(materials, material));
}

/**
 * 判断是否应该推进到设计阶段
 */
export function shouldAdvanceToDesign(state: MaterialCollectionState, mode: string): boolean {
  const thresholds = COLLECTION_THRESHOLDS;
  return state.completeness >= thresholds[mode as keyof typeof thresholds] || state.userOptedOut;
}

/**
 * 评估材料收集状态
 */
export function assessMaterialCollectionState(sessionData: any): MaterialCollectionState {
  const materials = sessionData.collectedData || {
    documents: [],
    links: [],
    userOptedOut: false
  };

  // 计算收集完整度
  let completeness = 0;
  const userType = extractUserType(sessionData);
  const requiredMaterials = getRequiredMaterials(userType);
  
  // 检查必需材料
  let hasRequiredMaterials = 0;
  requiredMaterials.required.forEach(material => {
    if (hasMaterial(materials, material)) {
      hasRequiredMaterials++;
    }
  });
  
  completeness = (hasRequiredMaterials / requiredMaterials.required.length) * 100;

  return {
    completeness,
    hasDocuments: (materials as any).documents?.length > 0 || false,
    hasLinks: (materials as any).links?.length > 0 || false,
    userOptedOut: (materials as any).userOptedOut || false,
    missingCritical: getMissingCriticalMaterials(materials, userType),
    canProceed: completeness >= getRequiredCompleteness(userType) || (materials as any).userOptedOut
  };
}

/**
 * 获取材料指南
 */
export function getMaterialGuide(userType: string): any {
  return MATERIAL_GUIDES[userType as keyof typeof MATERIAL_GUIDES] || MATERIAL_GUIDES.default;
}

/**
 * 生成材料请求消息
 */
export function generateMaterialRequestMessage(userType: string, userGoal: string, mode: string): string {
  let baseMessage = MATERIAL_REQUEST_MESSAGES[userType as keyof typeof MATERIAL_REQUEST_MESSAGES] || 
                   MATERIAL_REQUEST_MESSAGES.default;
  
  if (mode === 'quick') {
    baseMessage += '\n\n⚡ **快速体验模式**：您可以跳过材料收集，直接体验效果！';
  }
  
  return baseMessage;
}

/**
 * 构建材料收集表单元素
 */
export function buildMaterialCollectionElements(materialGuide: any, currentState: MaterialCollectionState): any[] {
  const elements = [];

  // 主要材料
  materialGuide.primary.forEach((item: any) => {
    if (item.type === 'file_or_link') {
      elements.push({
        id: item.id + '_file',
        type: 'file',
        label: item.label + ' (文件)',
        description: '上传' + item.description,
        accept: '.pdf,.doc,.docx',
        required: false
      });
      elements.push({
        id: item.id + '_link',
        type: 'input',
        label: item.label + ' (链接)',
        description: '或提供在线链接',
        placeholder: item.placeholder,
        required: false
      });
    } else {
      elements.push({
        id: item.id,
        type: item.type || 'input',
        label: item.label,
        description: item.description,
        placeholder: item.placeholder,
        required: item.priority === 'high'
      });
    }
  });

  // 次要材料
  materialGuide.secondary.forEach((item: any) => {
    elements.push({
      id: item.id,
      type: item.type || 'input',
      label: item.label,
      description: item.description,
      placeholder: item.placeholder,
      required: false
    });
  });

  // 跳过选项
  elements.push({
    id: 'skip_materials',
    type: 'checkbox',
    label: '⏭️ 我暂时没有这些材料，跳过此步骤',
    description: '我们将使用默认数据为您创建基础版本',
    required: false
  });

  return elements;
}

/**
 * 生成材料摘要
 */
export function generateMaterialSummary(materials: any): string {
  if (!materials || (!materials.documents?.length && !materials.links?.length)) {
    return '暂无上传材料，将使用默认数据创建';
  }

  let summary = '已收集材料：\n';
  
  if (materials.documents?.length > 0) {
    summary += `📄 文档：${materials.documents.length}个\n`;
  }
  
  if (materials.links?.length > 0) {
    summary += `🔗 链接：${materials.links.length}个\n`;
  }

  return summary;
}

/**
 * 处理材料提交
 */
export function processMaterialSubmission(data: any): any {
  const processedMaterials = {
    documents: [],
    links: [],
    userOptedOut: data.skip_materials || false
  };

  // 处理文件上传
  Object.keys(data).forEach(key => {
    if (key.endsWith('_file') && data[key]) {
      (processedMaterials.documents as any[]).push({
        type: key.replace('_file', ''),
        file: data[key],
        uploadedAt: new Date().toISOString()
      });
    }
  });

  // 处理链接
  Object.keys(data).forEach(key => {
    if ((key.endsWith('_link') || (!key.includes('_') && key !== 'skip_materials')) && data[key]) {
      const linkType = key.replace('_link', '');
      (processedMaterials.links as any[]).push({
        type: linkType,
        url: data[key],
        addedAt: new Date().toISOString()
      });
    }
  });

  return processedMaterials;
}

/**
 * 延迟函数
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
} 