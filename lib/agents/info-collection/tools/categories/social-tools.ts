/**
 * 社交平台工具分类
 * 专门处理各类社交平台的信息提取
 * 基于Anthropic工具使用最佳实践优化
 */

import { ClaudeToolDefinition, ToolCategory } from '../types';

/**
 * LinkedIn信息提取工具
 */
export const LINKEDIN_EXTRACT_TOOL: ClaudeToolDefinition = {
  name: 'extract_linkedin',
  category: ToolCategory.SOCIAL,
  priority: 9,
  description: `LinkedIn专业档案信息提取工具。这个工具专门用于从LinkedIn个人资料链接中提取职业相关信息，构建完整的职业档案。该工具应该在用户提供LinkedIn个人资料URL或希望分析职业背景信息时使用。

该工具会返回结构化的职业信息，包括工作经历、教育背景、技能列表和职业成就。它不会进行实时数据抓取，而是提供合规的数据获取方案和标准化的数据模板。

⚠️ 重要使用限制和合规声明：
由于LinkedIn的服务条款限制和反爬虫机制，此工具采用以下合规方式：
1. 返回标准化的数据结构模板，供用户参考和手动填充
2. 处理用户手动导出的LinkedIn数据文件（支持JSON、CSV格式）
3. 支持LinkedIn官方PDF导出功能生成的简历文件解析
4. 提供LinkedIn数据导入的最佳实践指导，而不是自动抓取

何时使用此工具：
- 用户提供了LinkedIn个人资料URL
- 需要分析专业职业背景信息
- 用户希望将LinkedIn数据导入到职业页面中
- 需要创建职业档案但没有其他数据源

何时不使用此工具：
- 用户没有提供LinkedIn相关信息
- 需要实时抓取LinkedIn数据（违反服务条款）
- 用户明确表示不希望使用LinkedIn信息

工具返回的信息类型：
- 基本资料：姓名、职位、当前公司、工作地点、个人简介
- 职业摘要：个人品牌描述、职业亮点、价值主张
- 工作经历：详细的职位历史、公司信息、时间段、职责描述、主要成就
- 教育背景：学校名称、学位、专业、毕业年份、学术成就
- 核心技能：专业技能列表、技能认可数、相关证书
- 推荐信息：同事和客户的推荐内容、推荐人信息
- 成就与奖项：专业认证、获奖记录、发表文章
- 语言能力：掌握的语言和熟练程度

数据质量和完整性：
- 提供详细的数据结构模板和字段说明
- 支持增量数据补充和更新
- 数据格式标准化，便于系统集成
- 包含质量评分和完整度检查

合规和隐私保护：
- 严格遵守LinkedIn服务条款和隐私政策
- 不进行未授权的数据抓取或API调用
- 提供合法的替代数据获取方案
- 确保用户数据安全和隐私保护`,
  input_schema: {
    type: 'object',
    properties: {
      profile_url: {
        type: 'string',
        description: 'LinkedIn个人资料页面的完整URL，必须是有效的LinkedIn个人页面地址，格式如：https://linkedin.com/in/username 或 https://www.linkedin.com/in/username/。这个URL主要用于验证格式正确性和提供相应的数据结构模板，工具不会实际访问该URL进行数据抓取。'
      },
      data_source: {
        type: 'string',
        enum: ['url_reference', 'exported_data', 'pdf_resume', 'manual_input'],
        description: '指定数据来源类型，影响工具的处理方式。url_reference：仅使用URL作为参考，返回模板；exported_data：处理用户从LinkedIn导出的数据文件；pdf_resume：处理LinkedIn生成的PDF简历；manual_input：用户手动输入模式，提供输入指导。默认为url_reference。'
      },
      data_file: {
        type: 'string',
        description: '可选参数。当data_source为exported_data或pdf_resume时需要提供。应该是用户从LinkedIn导出的数据文件（JSON或CSV格式）或LinkedIn生成的PDF简历的base64编码字符串。文件大小不应超过10MB。'
      }
    },
    required: ['profile_url']
  },
  metadata: {
    version: '2.1.0',
    author: 'HeysMe Team',
    tags: ['linkedin', 'professional-profile', 'career', 'compliance'],
    estimatedTime: 5000 // 5秒预估时间（主要是模板生成）
  }
};

/**
 * 通用社交媒体分析工具
 */
export const SOCIAL_MEDIA_TOOL: ClaudeToolDefinition = {
  name: 'analyze_social_media',
  category: ToolCategory.SOCIAL,
  priority: 7,
  description: `通用社交媒体平台分析工具。这个工具用于分析各类专业社交平台和创意网站，提取用户的专业形象、技能展示和影响力信息。它是一个万能工具，可以处理不在其他专用工具覆盖范围内的社交平台。

该工具支持多种平台类型，包括设计平台（Behance、Dribbble）、技术平台（CodePen、Dev.to）、内容平台（Medium、YouTube）等。它应该在用户提供了这些平台的链接并且希望展示相关专业能力时使用。

支持的主要平台类型：
- 设计平台：Behance（设计作品集）、Dribbble（设计展示）、Adobe Portfolio
- 技术平台：CodePen（前端作品）、Dev.to（技术博客）、GitLab（代码托管）
- 内容平台：Medium（专业写作）、YouTube（视频内容）、Bilibili（中文视频）
- 专业平台：Figma Community（设计协作）、GitHub Pages（项目展示）

何时使用此工具：
- 用户提供了上述支持平台的链接
- 需要分析专业技能和创作能力
- 其他专用工具无法覆盖的平台
- 需要综合评估多平台的专业表现

何时不使用此工具：
- 用户提供的是已有专用工具的平台（LinkedIn、Instagram、TikTok、X）
- 链接指向的不是个人专业页面
- 平台内容与职业发展无关

工具分析的信息维度：
- 平台活跃度：发布频率、持续性、参与度
- 内容质量：专业水准、创意水平、技术含量
- 影响力指标：关注者、点赞、分享、评论数据
- 专业技能：技术能力、设计水平、写作能力
- 网络形象：个人品牌、专业一致性、行业认知

工具返回的结果类型：
- 基本档案信息和平台特征
- 发布内容的统计和质量分析
- 互动数据和影响力评估
- 专业技能标签和能力评分
- 职业相关性和价值评估`,
  input_schema: {
    type: 'object',
    properties: {
      platform_url: {
        type: 'string',
        description: '社交媒体平台的个人主页完整URL，必须是有效的个人档案或作品集页面地址。例如：https://behance.net/username, https://dribbble.com/username, https://medium.com/@username 等。确保URL可以公开访问。'
      },
      platform_type: {
        type: 'string',
        enum: ['behance', 'dribbble', 'medium', 'youtube', 'codepen', 'devto', 'figma', 'gitlab', 'auto_detect'],
        description: '平台类型，用于选择合适的分析策略。如果不确定可以选择auto_detect让工具自动识别。不同平台类型会影响分析的重点和数据提取方式。behance/dribbble专注设计能力，medium/devto关注写作和技术分享，codepen看重前端技能等。'
      },
      analysis_focus: {
        type: 'string',
        enum: ['profile', 'content', 'influence', 'skills'],
        description: '分析重点，决定信息提取的主要方向。profile：专注基本档案和个人品牌；content：深度分析发布内容的质量和专业性；influence：重点评估影响力和社交价值；skills：专门提取和评估专业技能展示。'
      }
    },
    required: ['platform_url']
  },
  metadata: {
    version: '1.6.0',
    author: 'HeysMe Team',
    tags: ['social-media', 'multi-platform', 'professional-analysis'],
    estimatedTime: 8000
  }
};

/**
 * 社交网络整合工具
 */
export const SOCIAL_NETWORK_TOOL: ClaudeToolDefinition = {
  name: 'integrate_social_network',
  category: ToolCategory.SOCIAL,
  priority: 6,
  description: `社交网络整合分析工具。这个工具用于将用户在多个社交平台的信息整合，形成统一的数字身份档案和综合影响力评估。它应该在已经收集到用户多个社交平台信息后使用，不适合作为首个信息收集工具。

该工具的核心功能是跨平台数据整合、一致性分析和综合评估。它会分析用户在不同平台上的信息是否一致，计算综合影响力评分，并提供个人品牌优化建议。

何时使用此工具：
- 已经成功分析了用户的2个或更多社交平台
- 需要形成统一的数字身份档案
- 用户希望了解跨平台影响力和一致性
- 需要提供个人品牌优化建议

何时不使用此工具：
- 只有单一平台的信息
- 还没有收集到足够的社交媒体数据
- 用户明确表示不需要跨平台分析

整合分析的功能模块：
- 跨平台身份验证：确认多个平台属于同一人
- 信息一致性检查：姓名、职位、简介等关键信息的一致性
- 综合影响力评估：基于多平台数据计算总体影响力
- 专业形象分析：分析个人品牌在不同平台的表现
- 网络声誉评估：综合评价数字形象和专业声誉

工具输出的结果类型：
- 统一的数字身份档案（整合多平台信息）
- 跨平台影响力评分和排名
- 专业形象一致性报告和问题识别
- 个人品牌优化建议和改进方案
- 数字资产价值评估

数据处理和质量保障：
- 智能数据去重和冲突解决
- 信息可信度评估和权重分配
- 隐私敏感信息的识别和处理
- 数据完整性检查和补充建议`,
  input_schema: {
    type: 'object',
    properties: {
      platform_profiles: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            platform: { 
              type: 'string',
              description: '平台名称，如linkedin、instagram、x、github等'
            },
            url: { 
              type: 'string',
              description: '平台个人主页URL' 
            },
            data: { 
              type: 'object',
              description: '该平台分析得到的结构化数据' 
            }
          },
          required: ['platform', 'url']
        },
        description: '多个平台的档案信息数组，每个元素包含平台名称、URL和分析数据。至少需要2个平台的信息才能进行有效整合。data字段可以为空，工具会尝试重新分析。'
      },
      primary_platform: {
        type: 'string',
        description: '主要平台名称，用作身份验证和信息冲突时的基准平台。通常选择信息最完整、最专业的平台，如LinkedIn或个人官网。如果不指定，工具会自动选择数据质量最高的平台。'
      },
      integration_focus: {
        type: 'string',
        enum: ['comprehensive', 'consistency', 'influence', 'professional'],
        description: '整合分析的重点方向。comprehensive：全面分析所有维度；consistency：专注一致性检查；influence：重点计算影响力；professional：侧重专业形象分析。默认为comprehensive。'
      }
    },
    required: ['platform_profiles']
  },
  metadata: {
    version: '1.2.0',
    author: 'HeysMe Team',
    tags: ['integration', 'digital-identity', 'multi-platform', 'comprehensive-analysis'],
    estimatedTime: 10000
  }
};

/**
 * Instagram信息提取工具
 */
export const INSTAGRAM_EXTRACT_TOOL: ClaudeToolDefinition = {
  name: 'extract_instagram',
  category: ToolCategory.SOCIAL,
  priority: 8,
  description: `Instagram个人资料信息提取工具。这个工具专门用于从Instagram个人主页中提取创意和生活方式相关信息，适用于创意工作者、设计师、内容创作者和生活方式博主。

该工具会分析Instagram账户的视觉风格、内容主题、创意水平和社交影响力。它应该在用户提供Instagram链接并且职业身份与创意、设计、内容创作或个人品牌相关时使用。

⚠️ 重要使用限制和合规声明：
由于Instagram的服务条款限制和反爬虫机制，此工具采用以下合规方式：
1. 返回标准化的模拟数据结构，供用户参考
2. 支持分析用户提供的截图内容
3. 提供Instagram数据导出的操作指导
4. 严格遵守Instagram隐私政策和使用条款

何时使用此工具：
- 用户提供了Instagram个人主页URL
- 用户身份是创意工作者、设计师、摄影师、艺术家
- 需要展示视觉创意能力和个人风格
- 分析个人品牌的视觉一致性

何时不使用此工具：
- 用户没有Instagram账户或不希望展示
- 职业身份与视觉创意无关（如纯技术开发者）
- Instagram账户是私人性质，不适合职业展示

工具返回的信息类型：
- 基本资料：用户名、显示名称、简介、认证状态、关注数据
- 内容分析：发布风格、视觉主题、色彩偏好、主题标签策略
- 创意评估：视觉风格一致性、内容质量评分、原创性水平
- 影响力指标：粉丝数量、参与度、互动质量、品牌合作潜力
- 专业价值：创意技能展示、行业相关性、专业网络建立

适用的职业场景：
- 创意工作者个人品牌展示
- 视觉设计师作品集补充
- 生活方式博主档案建立
- 社交媒体运营能力证明
- 个人IP和影响力评估`,
  input_schema: {
    type: 'object',
    properties: {
      profile_url: {
        type: 'string',
        description: 'Instagram个人主页的完整URL，必须是有效的Instagram账户地址，格式如：https://instagram.com/username 或 https://www.instagram.com/username/。确保这是一个公开可访问的账户URL。'
      },
      data_source: {
        type: 'string',
        enum: ['url_reference', 'screenshot_analysis', 'manual_input'],
        description: '数据来源类型，决定分析方式。url_reference：基于URL提供分析模板；screenshot_analysis：分析用户提供的Instagram截图；manual_input：引导用户手动描述Instagram内容特点。'
      },
      analysis_focus: {
        type: 'string',
        enum: ['creative', 'lifestyle', 'business', 'personal'],
        description: '分析重点方向，影响提取的信息类型。creative：专注创意技能和视觉风格；lifestyle：关注生活方式和个人品牌；business：商业价值和影响力分析；personal：个人特色和独特性。默认为creative。'
      }
    },
    required: ['profile_url']
  },
  metadata: {
    version: '1.1.0',
    author: 'HeysMe Team',
    tags: ['instagram', 'creative', 'lifestyle', 'visual-content'],
    estimatedTime: 4000
  }
};

/**
 * TikTok信息提取工具
 */
export const TIKTOK_EXTRACT_TOOL: ClaudeToolDefinition = {
  name: 'extract_tiktok',
  category: ToolCategory.SOCIAL,
  priority: 8,
  description: `TikTok个人资料信息提取工具。这个工具专门用于从TikTok个人主页中提取短视频创作和娱乐相关信息，适用于内容创作者、教育工作者、娱乐从业者和新媒体运营人员。

该工具会分析TikTok账户的内容创作能力、视频制作技巧、话题把握能力和社交媒体影响力。它应该在用户提供TikTok链接并且职业身份与内容创作、教育传播、娱乐行业或社交媒体运营相关时使用。

⚠️ 重要使用限制和合规声明：
由于TikTok的服务条款限制和平台特性，此工具采用以下合规方式：
1. 返回标准化的数据结构模板，供用户参考
2. 支持分析用户提供的TikTok截图内容
3. 提供TikTok数据导出和分析的操作指导
4. 严格遵守TikTok隐私政策和使用条款

何时使用此工具：
- 用户提供了TikTok个人主页URL（@username格式）
- 用户身份是内容创作者、教育工作者、娱乐从业者
- 需要展示短视频创作能力和创意水平
- 分析社交媒体运营和趋势把握能力

何时不使用此工具：
- 用户没有TikTok账户或内容与职业无关
- 职业身份传统保守，不适合展示TikTok内容
- TikTok内容纯娱乐性质，无法体现专业能力

工具返回的信息类型：
- 基本资料：用户名、显示名称、简介、认证状态、关注数据
- 内容分析：视频风格、内容主题、热门话题参与、创作频率
- 创作能力：视频质量、创意水平、剪辑技巧、趋势把握
- 影响力指标：粉丝数量、点赞总数、分享数据、评论互动
- 专业价值：内容策划能力、社交媒体运营技能、趋势敏感度

适用的职业场景：
- 短视频创作者能力展示
- 新媒体运营经验证明
- 教育内容传播者档案
- 娱乐行业从业者简历
- 创意内容制作者作品集`,
  input_schema: {
    type: 'object',
    properties: {
      profile_url: {
        type: 'string',
        description: 'TikTok个人主页的完整URL，必须是有效的TikTok账户地址，格式如：https://tiktok.com/@username 或 https://www.tiktok.com/@username。注意TikTok用户名前面需要包含@符号。'
      },
      data_source: {
        type: 'string',
        enum: ['url_reference', 'screenshot_analysis', 'manual_input'],
        description: '数据来源类型，影响分析方法。url_reference：基于URL格式提供模板；screenshot_analysis：分析用户提供的TikTok页面截图；manual_input：引导用户描述TikTok内容特点和成就。'
      },
      analysis_focus: {
        type: 'string',
        enum: ['entertainment', 'education', 'lifestyle', 'business'],
        description: '分析重点方向，决定提取信息的侧重点。entertainment：娱乐内容和创意表现；education：教育价值和知识分享；lifestyle：生活方式和个人品牌；business：商业价值和营销能力。默认为entertainment。'
      }
    },
    required: ['profile_url']
  },
  metadata: {
    version: '1.1.0',
    author: 'HeysMe Team',
    tags: ['tiktok', 'short-video', 'entertainment', 'viral-content'],
    estimatedTime: 4000
  }
};

/**
 * X(前Twitter)信息提取工具
 */
export const X_EXTRACT_TOOL: ClaudeToolDefinition = {
  name: 'extract_x_twitter',
  category: ToolCategory.SOCIAL,
  priority: 7,
  description: `X平台（前Twitter）个人资料信息提取工具。这个工具专门用于从X平台个人主页中提取专业观点、行业影响力和思想领导力相关信息，适用于行业专家、意见领袖、技术专家和商务人士。

该工具会分析X账户的专业声誉、观点影响力、行业参与度和网络价值。它应该在用户提供X/Twitter链接并且希望展示行业专业性、思想领导力或专业网络影响力时使用。

⚠️ 重要使用限制和合规声明：
由于X平台的服务条款限制和API访问限制，此工具采用以下合规方式：
1. 返回标准化的数据结构模板，供用户参考
2. 支持分析用户提供的X平台截图内容
3. 提供X平台数据导出和分析的操作指导
4. 严格遵守X平台隐私政策和使用条款

何时使用此工具：
- 用户提供了X（或Twitter）个人主页URL
- 用户是行业专家、技术专家、商务人士或意见领袖
- 需要展示专业观点和行业影响力
- 分析思想领导力和专业网络价值

何时不使用此工具：
- 用户没有X账户或很少使用社交媒体
- X账户内容主要是个人生活而非专业相关
- 用户希望保持低调，不愿意展示社交媒体影响力

工具返回的信息类型：
- 基本资料：用户名、显示名称、简介、认证状态、关注数据
- 专业声誉：行业地位、专业领域、观点影响力、权威性评估
- 内容分析：推文风格、专业话题参与、互动质量、观点独特性
- 影响力指标：关注者数量、转发数据、提及频率、网络价值
- 思想领导力：原创观点、行业洞察、知识分享、专业讨论参与

适用的职业场景：
- 行业专家声誉展示
- 技术专家影响力证明
- 意见领袖地位确认
- 商务人士网络价值展示
- 专业观点输出能力证明`,
  input_schema: {
    type: 'object',
    properties: {
      profile_url: {
        type: 'string',
        description: 'X或Twitter个人主页的完整URL，支持新旧域名格式，如：https://x.com/username 或 https://twitter.com/username 或 https://www.x.com/username。工具会自动识别和处理两种域名格式。'
      },
      data_source: {
        type: 'string',
        enum: ['url_reference', 'screenshot_analysis', 'manual_input'],
        description: '数据来源类型，决定处理方式。url_reference：基于URL提供模板和分析框架；screenshot_analysis：分析用户提供的X平台截图；manual_input：引导用户描述X平台的专业活动和影响力。'
      },
      analysis_focus: {
        type: 'string',
        enum: ['professional', 'influence', 'expertise', 'networking'],
        description: '分析重点方向，影响信息提取的侧重点。professional：专业活动和职业相关内容；influence：影响力和传播能力；expertise：专业知识和技术见解；networking：网络建设和社交价值。默认为professional。'
      }
    },
    required: ['profile_url']
  },
  metadata: {
    version: '2.1.0',
    author: 'HeysMe Team',
    tags: ['x', 'twitter', 'professional', 'influence', 'expertise'],
    estimatedTime: 4000
  }
};

/**
 * 社交工具集合
 */
export const SOCIAL_TOOLS: ClaudeToolDefinition[] = [
  LINKEDIN_EXTRACT_TOOL,
  INSTAGRAM_EXTRACT_TOOL,
  TIKTOK_EXTRACT_TOOL,
  X_EXTRACT_TOOL,
  SOCIAL_MEDIA_TOOL,
  SOCIAL_NETWORK_TOOL
];

/**
 * 社交工具相关的辅助函数
 */
export function detectSocialPlatform(url: string): { platform: string; valid: boolean; reason?: string } {
  const platforms = {
    linkedin: /linkedin\.com\/in\//i,
    behance: /behance\.net\//i,
    dribbble: /dribbble\.com\//i,
    github: /github\.com\//i,
    medium: /medium\.com\/@/i,
    x: /(x\.com\/|twitter\.com\/)/i,
    instagram: /instagram\.com\//i,
    tiktok: /tiktok\.com\/@/i,
    youtube: /youtube\.com\/(c\/|channel\/|@)/i,
    codepen: /codepen\.io\//i,
    devto: /dev\.to\//i
  };
  
  for (const [platform, pattern] of Object.entries(platforms)) {
    if (pattern.test(url)) {
      return { platform, valid: true };
    }
  }
  
  return { platform: 'unknown', valid: false, reason: '不支持的社交平台' };
}

export function validateLinkedInUrl(url: string): { valid: boolean; reason?: string } {
  if (!url) {
    return { valid: false, reason: 'LinkedIn URL不能为空' };
  }
  
  const linkedinPattern = /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9\-_%]+\/?$/;
  if (!linkedinPattern.test(url)) {
    return { 
      valid: false, 
      reason: 'LinkedIn URL格式不正确，应为：https://linkedin.com/in/username' 
    };
  }
  
  return { valid: true };
}

export function extractSocialUsername(url: string, platform: string): string {
  const patterns: Record<string, RegExp> = {
    linkedin: /linkedin\.com\/in\/([^\/\?]+)/i,
    behance: /behance\.net\/([^\/\?]+)/i,
    dribbble: /dribbble\.com\/([^\/\?]+)/i,
    github: /github\.com\/([^\/\?]+)/i,
    medium: /medium\.com\/@([^\/\?]+)/i,
    x: /(?:x\.com|twitter\.com)\/([^\/\?]+)/i,
    instagram: /instagram\.com\/([^\/\?]+)/i,
    tiktok: /tiktok\.com\/@([^\/\?]+)/i,
    codepen: /codepen\.io\/([^\/\?]+)/i,
    devto: /dev\.to\/([^\/\?]+)/i
  };
  
  const pattern = patterns[platform];
  if (pattern) {
    const match = url.match(pattern);
    return match ? match[1] : '';
  }
  
  return '';
}

export function getSocialPlatformPriority(userRole: string): Record<string, number> {
  const priorities: Record<string, Record<string, number>> = {
    '开发者': {
      github: 10,
      linkedin: 8,
      devto: 7,
      medium: 6,
      codepen: 6,
      x: 5
    },
    '设计师': {
      behance: 10,
      dribble: 10,
      instagram: 8,
      linkedin: 7,
      x: 5,
      tiktok: 4
    },
    '产品经理': {
      linkedin: 10,
      medium: 8,
      x: 7,
      youtube: 5,
      github: 4
    },
    'AI工程师': {
      github: 10,
      linkedin: 8,
      medium: 7,
      x: 6,
      youtube: 5
    },
    '内容创作者': {
      youtube: 10,
      instagram: 9,
      tiktok: 8,
      x: 7,
      medium: 6
    },
    '营销专家': {
      linkedin: 9,
      instagram: 8,
      x: 8,
      tiktok: 7,
      youtube: 6
    }
  };
  
  return priorities[userRole] || {
    linkedin: 8,
    github: 6,
    medium: 5,
    x: 4,
    instagram: 4
  };
}

export function generateLinkedInDataTemplate(): any {
  return {
    profile: {
      name: '请填写您的姓名',
      title: '请填写您的职位',
      company: '请填写您的公司',
      location: '请填写您的工作地点',
      summary: '请填写您的个人简介'
    },
    experience: [
      {
        title: '职位名称',
        company: '公司名称',
        duration: '工作时间段',
        description: '工作职责和成就'
      }
    ],
    education: [
      {
        school: '学校名称',
        degree: '学位',
        field: '专业',
        year: '毕业年份'
      }
    ],
    skills: ['技能1', '技能2', '技能3'],
    note: '这是一个数据模板，请根据您的LinkedIn资料填写实际信息'
  };
} 