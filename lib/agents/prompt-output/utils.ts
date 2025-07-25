/**
 * Prompt Output Agent 工具函数、常量和类型定义
 */

// =================== 类型定义 ===================

export type LayoutType = 'portfolio_showcase' | 'project_grid' | 'classic_timeline' | 'professional_blocks' | 'modern_card' | 'consultation_layout';
export type ThemeType = 'tech_blue' | 'creative_purple' | 'business_gray' | 'nature_green' | 'vibrant_orange' | 'modern' | 'classic' | 'creative' | 'minimal' | 'corporate';

export interface DesignStrategy {
  layout: LayoutType;
  theme: ThemeType; 
  sections: PageSection[];
  features: FeatureConfig;
  customizations: CustomizationConfig;
  priority: 'speed' | 'quality' | 'features';
  audience: string;
}

export interface PageSection {
  id: string;
  title: string;
  type: string;
  priority: 'high' | 'medium' | 'low';
  content: any;
  required: boolean;
}

export interface FeatureConfig {
  darkMode: boolean;
  responsive: boolean;
  animations: boolean;
  downloadPdf: boolean;
  socialLinks: boolean;
  contactForm: boolean;
  analytics: boolean;
  seo: boolean;
  lazyLoading?: boolean;
  progressiveEnhancement?: boolean;
}

export interface CustomizationConfig {
  colorScheme: string;
  typography: string;
  spacing: string;
  borderRadius: string;
  shadows: string;
  portfolioFeatures?: any;
  techFeatures?: any;
  businessFeatures?: any;
}

export interface TechStack {
  framework: string;
  styling: string;
  components: string;
  animations: string;
  icons: string;
  deployment: string;
  extras: string[];
}

// =================== 常量配置 ===================

export const LAYOUT_CONFIG = {
  portfolio_showcase: {
    name: '作品展示型',
    description: '突出作品和项目的视觉展示',
    suited: ['设计师', '创意人', '艺术家']
  },
  project_grid: {
    name: '项目网格型',
    description: '项目以网格形式整齐展示',
    suited: ['开发者', '产品经理', '项目经理']
  },
  classic_timeline: {
    name: '经典时间线',
    description: '按时间顺序展示经历和成就',
    suited: ['求职者', '学生', '职场人士']
  },
  professional_blocks: {
    name: '专业区块型',
    description: '信息分块展示，专业正式',
    suited: ['商务人士', '咨询师', '管理者']
  },
  modern_card: {
    name: '现代卡片型',
    description: '现代化的卡片式布局',
    suited: ['技术从业者', '创新人才']
  },
  consultation_layout: {
    name: '咨询展示型',
    description: '突出服务和咨询能力',
    suited: ['顾问', '自由职业者', '服务提供者']
  }
};

export const THEME_CONFIG = {
  tech_blue: { primary: '#0066CC', secondary: '#E6F3FF', accent: '#4A90E2' },
  creative_purple: { primary: '#7B68EE', secondary: '#F0EFFF', accent: '#9B59B6' },
  business_gray: { primary: '#2C3E50', secondary: '#F8F9FA', accent: '#34495E' },
  nature_green: { primary: '#27AE60', secondary: '#E8F8F5', accent: '#16A085' },
  vibrant_orange: { primary: '#FF6B35', secondary: '#FFF4F0', accent: '#E67E22' },
  modern: { primary: '#1A1A1A', secondary: '#F5F5F5', accent: '#007AFF' },
  classic: { primary: '#333333', secondary: '#F9F9F9', accent: '#0056B3' },
  creative: { primary: '#8E44AD', secondary: '#FCF3FF', accent: '#E74C3C' },
  minimal: { primary: '#000000', secondary: '#FFFFFF', accent: '#666666' },
  corporate: { primary: '#003366', secondary: '#F0F4F8', accent: '#0066CC' }
};

export const TECH_STACK_CONFIG = {
  modern_react: {
    framework: 'React + TypeScript',
    styling: 'Tailwind CSS',
    components: 'Framer Motion + Lucide Icons',
    animations: 'Framer Motion',
    icons: 'Lucide React',
    deployment: 'Vercel'
  },
  vue_ecosystem: {
    framework: 'Vue 3 + TypeScript', 
    styling: 'Tailwind CSS',
    components: 'Vue 3 Composition API',
    animations: 'Vue Transition',
    icons: 'Heroicons',
    deployment: 'Netlify'
  },
  next_fullstack: {
    framework: 'Next.js 14',
    styling: 'Tailwind CSS + CSS Modules',
    components: 'React + Custom Components',
    animations: 'Framer Motion',
    icons: 'React Icons',
    deployment: 'Vercel'
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
 * 智能提取用户类型 - 不再局限于预设分类
 */
export function extractUserType(sessionData: any): string {
  const userRole = sessionData.metadata?.intentData?.user_role || 
                  sessionData.personalization?.identity?.profession || 
                  'unknown';
  
  // 返回原始用户描述，而不是映射到预设类型
  return userRole;
}

/**
 * 智能确定页面布局 - 基于数据分析而非硬编码规则
 */
export function determineLayout(userGoal: string, userType: string, collectedData: any): LayoutType {
  // 这里应该用更智能的分析，暂时保留基本逻辑作为fallback
  // 实际上应该让LLM来决定最佳布局
  
  // 基于数据丰富度和用户目标进行智能判断
  const hasProjects = collectedData?.projects?.length > 0;
  const hasCreativeWork = collectedData?.creative_work?.length > 0;
  const hasExtensiveExperience = collectedData?.experience?.length > 2;
  
  if (hasCreativeWork || userType.includes('设计') || userType.includes('创意')) {
    return 'portfolio_showcase';
  }
  if (hasProjects && (userType.includes('开发') || userType.includes('技术'))) {
    return 'project_grid';
  }
  if (userGoal === '求职' || hasExtensiveExperience) {
    return 'classic_timeline';
  }
  if (userType.includes('管理') || userType.includes('咨询') || userType.includes('商务')) {
    return 'professional_blocks';
  }
  
  // 默认现代卡片布局
  return 'modern_card';
}

/**
 * 智能确定主题 - 基于用户特征而非固定映射
 */
export function determineTheme(userType: string, personalization?: any): ThemeType {
  // 基于关键词智能匹配，而不是硬编码
  const lowerType = userType.toLowerCase();
  
  if (lowerType.includes('开发') || lowerType.includes('技术') || lowerType.includes('程序')) {
    return 'tech_blue';
  }
  if (lowerType.includes('设计') || lowerType.includes('创意') || lowerType.includes('艺术')) {
    return 'creative_purple';
  }
  if (lowerType.includes('商务') || lowerType.includes('管理') || lowerType.includes('咨询')) {
    return 'business_gray';
  }
  if (lowerType.includes('学生') || lowerType.includes('学习')) {
    return 'modern';
  }
  if (lowerType.includes('创业') || lowerType.includes('自由')) {
    return 'vibrant_orange';
  }
  
  // 默认经典主题
  return 'classic';
}

/**
 * 确定页面功能
 */
export function determineFeatures(userGoal: string, userType: string, collectedData: any): FeatureConfig {
  const baseFeatures: FeatureConfig = {
    darkMode: true,
    responsive: true,
    animations: userType === '设计师' || userType === '创意人',
    downloadPdf: userGoal === '求职',
    socialLinks: true,
    contactForm: userGoal !== '试试看',
    analytics: userGoal === '个人品牌' || userGoal === '商务展示',
    seo: userGoal !== '试试看',
    lazyLoading: true,
    progressiveEnhancement: true
  };

  // 根据收集的数据调整功能
  if (collectedData?.links?.length > 0) {
    baseFeatures.socialLinks = true;
  }

  return baseFeatures;
}

/**
 * 生成页面章节
 */
export function determineSections(userGoal: string, userType: string, collectedData: any): PageSection[] {
  const sections: PageSection[] = [
    {
      id: 'hero',
      title: '主页横幅',
      type: 'hero',
      priority: 'high',
      content: generateHeroContent(collectedData),
      required: true
    }
  ];

  // 根据用户类型添加不同章节
  if (userType === '开发者' || userType === '设计师') {
    sections.push({
      id: 'skills',
      title: '技能专长',
      type: 'skills',
      priority: 'high', 
      content: generateSkillsContent(collectedData?.skills || [], userType),
      required: true
    });

    sections.push({
      id: 'projects',
      title: '项目作品',
      type: 'projects',
      priority: 'high',
      content: generateProjectsContent(collectedData?.projects || [], userType),
      required: true
    });
  }

  if (userGoal === '求职' || userGoal === '个人品牌') {
    sections.push({
      id: 'experience',
      title: '工作经历',
      type: 'experience',
      priority: 'medium',
      content: generateExperienceContent(collectedData?.experience || []),
      required: true
    });
  }

  sections.push({
    id: 'contact',
    title: '联系方式',
    type: 'contact',
    priority: 'medium',
    content: generateContactContent(collectedData?.personal || {}),
    required: true
  });

  return sections;
}

/**
 * 生成定制化配置
 */
export function generateCustomizations(userType: string, collectedData: any): CustomizationConfig {
  return {
    colorScheme: getColorScheme(userType),
    typography: getTypography(userType),
    spacing: 'comfortable',
    borderRadius: userType === '设计师' ? 'rounded' : 'minimal',
    shadows: userType === '创意人' ? 'dramatic' : 'subtle'
  };
}

/**
 * 确定优先级
 */
export function determinePriority(userGoal: string): 'speed' | 'quality' | 'features' {
  if (userGoal === '试试看') return 'speed';
  if (userGoal === '求职' || userGoal === '作品展示') return 'quality';
  return 'features';
}

/**
 * 确定目标受众
 */
export function determineAudience(userGoal: string): string {
  const audienceMap: Record<string, string> = {
    '求职': '招聘经理和HR',
    '作品展示': '潜在客户和同行',
    '个人品牌': '行业内专业人士',
    '商务展示': '商业合作伙伴',
    '找合作': '项目合作者',
    '试试看': '任何访问者'
  };

  return audienceMap[userGoal] || '专业观众';
}

/**
 * 获取推荐技术栈
 */
export function getRecommendedTechStack(strategy: DesignStrategy, userType: string): TechStack {
  if (strategy.features.animations && userType === '设计师') {
    return {
      ...TECH_STACK_CONFIG.modern_react,
      extras: ['Lottie动画', '3D效果库', '粒子效果']
    };
  }

  if (strategy.priority === 'speed') {
    return {
      ...TECH_STACK_CONFIG.vue_ecosystem,
      extras: ['静态生成', '图片优化']
    };
  }

  return {
    ...TECH_STACK_CONFIG.next_fullstack,
    extras: getTechStackExtras(strategy, userType)
  };
}

/**
 * 获取技术栈额外功能
 */
export function getTechStackExtras(strategy: DesignStrategy, userType: string): string[] {
  const extras = [];

  if (strategy.features.analytics) extras.push('Google Analytics');
  if (strategy.features.seo) extras.push('SEO优化');
  if (strategy.features.downloadPdf) extras.push('PDF生成');
  if (strategy.features.contactForm) extras.push('表单处理');
  if (userType === '开发者') extras.push('代码高亮', 'GitHub集成');
  if (userType === '设计师') extras.push('图片懒加载', '作品集优化');

  return extras;
}

/**
 * 生成开发任务描述
 */
export function generateDevelopmentPrompt(
  strategy: DesignStrategy,
  userGoal: string,
  userType: string,
  collectedData: any
): string {
  const techStack = getRecommendedTechStack(strategy, userType);
  
  return `# 个人页面开发任务

## 项目概述
为${userType}创建一个${userGoal}的个人页面，采用${getLayoutDescription(strategy.layout)}布局。

## 技术要求
- **框架**: ${techStack.framework}
- **样式**: ${techStack.styling}
- **组件**: ${techStack.components}
- **动画**: ${techStack.animations}
- **图标**: ${techStack.icons}
- **部署**: ${techStack.deployment}

## 设计规格
- **主题**: ${getThemeDescription(strategy.theme)}
- **布局**: ${strategy.layout}
- **优先级**: ${strategy.priority}
- **目标受众**: ${strategy.audience}

## 功能要求
${Object.entries(strategy.features)
  .filter(([_, enabled]) => enabled)
  .map(([feature, _]) => `- ${feature}`)
  .join('\n')}

## 页面结构
${strategy.sections.map(section => 
  `### ${section.title} (${section.type})
优先级: ${section.priority}
必需: ${section.required ? '是' : '否'}`
).join('\n\n')}

## 内容数据
${JSON.stringify(collectedData, null, 2)}

## 设计重点
${getDesignFocus(userType, strategy)}

请根据以上要求创建一个完整的、可部署的个人页面。`;
}

/**
 * 生成章节内容
 */
export function generateSectionContent(sectionType: string, collectedData: any, userType: string): any {
  switch (sectionType) {
    case 'hero':
      return generateHeroContent(collectedData);
    case 'skills':
      return generateSkillsContent(collectedData?.skills || [], userType);
    case 'projects':
      return generateProjectsContent(collectedData?.projects || [], userType);
    case 'experience':
      return generateExperienceContent(collectedData?.experience || []);
    case 'contact':
      return generateContactContent(collectedData?.personal || {});
    case 'social_links':
      return generateSocialLinksContent(collectedData?.social || {}, collectedData?.links || []);
    case 'external_links':
      return generateExternalLinksContent(collectedData?.external_links || [], userType);
    default:
      return { type: sectionType, placeholder: true };
  }
}

/**
 * 生成Hero内容
 */
export function generateHeroContent(collectedData: any): any {
  return {
    title: collectedData?.personal?.name || '您的姓名',
    subtitle: collectedData?.personal?.title || '专业标题',
    description: collectedData?.personal?.bio || '简短的个人介绍',
    avatar: collectedData?.personal?.avatar || null,
    cta: {
      primary: '查看作品',
      secondary: '联系我'
    }
  };
}

/**
 * 生成技能内容
 */
export function generateSkillsContent(skills: string[], userType: string): any {
  return {
    skills: skills.length > 0 ? skills : getDefaultSkills(userType),
    displayType: getSkillsDisplayType(userType),
    categories: groupSkillsByCategory(skills, userType)
  };
}

/**
 * 生成项目内容
 */
export function generateProjectsContent(projects: any[], userType: string): any {
  return {
    projects: projects.length > 0 ? projects : getDefaultProjects(userType),
    displayType: userType === '设计师' ? 'gallery' : 'cards',
    featured: projects.slice(0, 3)
  };
}

/**
 * 生成经历内容
 */
export function generateExperienceContent(experience: any[]): any {
  return {
    experience: experience.length > 0 ? experience : [],
    displayType: 'timeline',
    showDuration: true
  };
}

/**
 * 生成联系内容
 */
export function generateContactContent(personal: any): any {
  return {
    email: personal?.email || '',
    phone: personal?.phone || '',
    location: personal?.location || '',
    social: personal?.social || {},
    availability: personal?.availability || 'available'
  };
}

/**
 * 生成社交链接内容
 */
export function generateSocialLinksContent(social: any, links: any[]): any {
  return {
    social_links: social,
    external_links: links,
    displayType: 'buttons',
    fallback_enabled: true
  };
}

/**
 * 生成外部链接内容 - 处理无法提取信息的链接
 */
export function generateExternalLinksContent(external_links: any[], userType: string): any {
  return {
    links: external_links.map((link: any) => ({
      url: link.url,
      title: link.title || extractTitleFromUrl(link.url),
      platform: detectPlatformFromUrl(link.url),
      display_mode: determineLinkDisplayMode(link.platform, userType),
      extraction_failed: link.extraction_failed || false,
      fallback_config: generateFallbackConfig(link.platform, link.url)
    })),
    show_as_buttons: true,
    responsive_layout: true
  };
}

/**
 * 从URL提取标题
 */
function extractTitleFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace('www.', '');
    return hostname.charAt(0).toUpperCase() + hostname.slice(1);
  } catch {
    return 'External Link';
  }
}

/**
 * 从URL检测平台类型
 */
function detectPlatformFromUrl(url: string): string {
  const platformPatterns: Record<string, RegExp> = {
    github: /github\.com/i,
    linkedin: /linkedin\.com/i,
    behance: /behance\.net/i,
    dribbble: /dribbble\.com/i,
    instagram: /instagram\.com/i,
    twitter: /twitter\.com|x\.com/i,
    tiktok: /tiktok\.com/i,
    medium: /medium\.com/i,
    youtube: /youtube\.com/i,
    personal: /\.(com|net|org|io)$/i
  };

  for (const [platform, pattern] of Object.entries(platformPatterns)) {
    if (pattern.test(url)) {
      return platform;
    }
  }
  return 'external';
}

/**
 * 确定链接显示模式
 */
function determineLinkDisplayMode(platform: string, userType: string): 'button' | 'card' | 'iframe' {
  // 基于平台和用户类型决定最佳显示模式
  if (platform === 'behance' || platform === 'dribbble') {
    return userType === '设计师' ? 'iframe' : 'card';
  }
  if (platform === 'github') {
    return userType === '开发者' ? 'card' : 'button';
  }
  return 'button';
}

/**
 * 生成fallback配置
 */
function generateFallbackConfig(platform: string, url: string): any {
  const configs: Record<string, any> = {
    github: {
      button_text: 'View on GitHub',
      icon: 'github',
      theme: 'dark',
      description: 'Check out my code repositories'
    },
    linkedin: {
      button_text: 'Professional Profile',
      icon: 'linkedin',
      theme: 'blue',
      description: 'Connect with me professionally'
    },
    behance: {
      button_text: 'View Portfolio',
      icon: 'behance',
      theme: 'blue',
      description: 'Explore my creative work'
    },
    dribbble: {
      button_text: 'Design Shots',
      icon: 'dribbble',
      theme: 'pink',
      description: 'See my design portfolio'
    },
    instagram: {
      button_text: 'Follow Me',
      icon: 'instagram',
      theme: 'gradient',
      description: 'Follow my creative journey'
    },
    twitter: {
      button_text: 'Follow on X',
      icon: 'twitter',
      theme: 'black',
      description: 'Join the conversation'
    },
    default: {
      button_text: 'Visit Link',
      icon: 'external-link',
      theme: 'neutral',
      description: 'Visit external link'
    }
  };

  return configs[platform] || configs.default;
}

// =================== 辅助函数 ===================

export function getLayoutDescription(layout: LayoutType): string {
  return LAYOUT_CONFIG[layout]?.description || '标准布局';
}

export function getThemeDescription(theme: ThemeType): string {
  const themeDescriptions: Record<ThemeType, string> = {
    tech_blue: '科技蓝主题',
    creative_purple: '创意紫主题',
    business_gray: '商务灰主题',
    nature_green: '自然绿主题',
    vibrant_orange: '活力橙主题',
    modern: '现代简约',
    classic: '经典正式',
    creative: '创意个性',
    minimal: '极简风格',
    corporate: '企业级'
  };
  
  return themeDescriptions[theme] || '标准主题';
}

export function getDesignFocus(userType: string, strategy: DesignStrategy): string {
  const lowerType = userType.toLowerCase();
  
  // 基于关键词智能匹配设计重点
  if (lowerType.includes('开发') || lowerType.includes('程序') || lowerType.includes('技术')) {
    return '突出技术能力和项目经验，展示代码质量和解决问题的能力';
  }
  if (lowerType.includes('设计') || lowerType.includes('创意') || lowerType.includes('艺术')) {
    return '重视视觉效果和创意展示，突出设计作品和美学能力';
  }
  if (lowerType.includes('产品') || lowerType.includes('管理')) {
    return '强调项目管理和商业思维，展示产品成功案例';
  }
  if (lowerType.includes('学生') || lowerType.includes('学习')) {
    return '展示学习能力和潜力，突出实践项目和技能成长';
  }
  if (lowerType.includes('创业') || lowerType.includes('自由')) {
    return '突出创新思维和执行能力，展示商业成就';
  }
  
  // 默认平衡展示
  return '平衡展示各方面能力，注重专业性和可信度';
}

function getColorScheme(userType: string): string {
  const lowerType = userType.toLowerCase();
  
  if (lowerType.includes('开发') || lowerType.includes('技术')) return 'blue-tech';
  if (lowerType.includes('设计') || lowerType.includes('创意')) return 'purple-creative';
  if (lowerType.includes('商务') || lowerType.includes('管理')) return 'gray-professional';
  if (lowerType.includes('学生') || lowerType.includes('学习')) return 'green-fresh';
  if (lowerType.includes('创业') || lowerType.includes('自由')) return 'orange-dynamic';
  
  return 'blue-classic';
}

function getTypography(userType: string): string {
  const lowerType = userType.toLowerCase();
  
  if (lowerType.includes('开发') || lowerType.includes('程序')) return 'mono-modern';
  if (lowerType.includes('设计') || lowerType.includes('创意')) return 'sans-creative';
  if (lowerType.includes('商务') || lowerType.includes('管理')) return 'sans-professional';
  if (lowerType.includes('学生')) return 'sans-friendly';
  if (lowerType.includes('创业')) return 'sans-bold';
  
  return 'sans-classic';
}

function getSkillsDisplayType(userType: string): string {
  return userType.toLowerCase().includes('开发') ? 'progress-bars' : 'tags';
}

function getDefaultSkills(userType: string): string[] {
  const lowerType = userType.toLowerCase();
  
  // 基于关键词智能匹配默认技能
  if (lowerType.includes('开发') || lowerType.includes('程序') || lowerType.includes('技术')) {
    return ['JavaScript', 'React', 'Node.js', 'TypeScript', 'Python'];
  }
  if (lowerType.includes('设计') || lowerType.includes('创意') || lowerType.includes('艺术')) {
    return ['Figma', 'Photoshop', 'UI/UX设计', '原型设计', '品牌设计'];
  }
  if (lowerType.includes('产品') || lowerType.includes('管理')) {
    return ['产品规划', '需求分析', '项目管理', '数据分析', '用户研究'];
  }
  if (lowerType.includes('营销') || lowerType.includes('运营')) {
    return ['数字营销', '内容策划', '用户增长', '数据分析', '品牌建设'];
  }
  if (lowerType.includes('数据') || lowerType.includes('分析')) {
    return ['数据分析', 'SQL', 'Python', '数据可视化', '机器学习'];
  }
  
  // 通用软技能
  return ['沟通能力', '团队合作', '问题解决', '学习能力', '创新思维'];
}

function getDefaultProjects(userType: string): any[] {
  // 返回默认项目模板
  return [];
}

function groupSkillsByCategory(skills: string[], userType: string): any {
  // 简化实现，实际可以更复杂的分类逻辑
  return {
    technical: skills.filter(skill => skill.includes('JavaScript') || skill.includes('React')),
    design: skills.filter(skill => skill.includes('设计') || skill.includes('Figma')),
    soft: skills.filter(skill => skill.includes('沟通') || skill.includes('团队'))
  };
} 