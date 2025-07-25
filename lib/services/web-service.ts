/**
 * 网页抓取服务 - 专门处理网页内容的智能抓取和分析
 * 注意：这个服务只能在服务端使用
 */

// @ts-nocheck
// 运行时检查 - 确保只在服务端使用
if (typeof window !== 'undefined') {
  throw new Error('WebService 只能在服务端使用');
}

// 动态导入避免客户端捆绑问题
let metascraper: any;
let metascraperAuthor: any;
let metascraperDate: any;
let metascraperDescription: any;
let metascraperImage: any;
let metascraperLogo: any;
let metascraperTitle: any;
let metascraperUrl: any;
let cheerio: any;

// 延迟加载依赖
const loadDependencies = async () => {
  if (!metascraper) {
    const [
      metascraperModule,
      metascraperAuthorModule,
      metascraperDateModule,
      metascraperDescriptionModule,
      metascraperImageModule,
      metascraperLogoModule,
      metascraperTitleModule,
      metascraperUrlModule,
      cheerioModule,
    ] = await Promise.all([
      import('metascraper'),
      import('metascraper-author'),
      import('metascraper-date'),
      import('metascraper-description'),
      import('metascraper-image'),
      import('metascraper-logo'),
      import('metascraper-title'),
      import('metascraper-url'),
      import('cheerio'),
    ]);

    metascraper = metascraperModule.default;
    metascraperAuthor = metascraperAuthorModule.default;
    metascraperDate = metascraperDateModule.default;
    metascraperDescription = metascraperDescriptionModule.default;
    metascraperImage = metascraperImageModule.default;
    metascraperLogo = metascraperLogoModule.default;
    metascraperTitle = metascraperTitleModule.default;
    metascraperUrl = metascraperUrlModule.default;
    cheerio = cheerioModule;
  }
};

import { isValidUrl } from './utils/web-utils';

export class WebService {
  private metascraperInstance: any;
  private isInitialized: boolean = false;

  constructor() {
    // 延迟初始化
  }

  private async initialize() {
    if (!this.isInitialized) {
      await loadDependencies();
      
      // 初始化metascraper实例
      this.metascraperInstance = metascraper([
        metascraperAuthor(),
        metascraperDate(),
        metascraperDescription(),
        metascraperImage(),
        metascraperLogo(),
        metascraperTitle(),
        metascraperUrl(),
      ]);
      
      this.isInitialized = true;
    }
  }

  /**
   * 智能网页内容抓取和分析
   */
  async scrapeWebpage(url: string, targetSections: string[] = ['all']): Promise<any> {
    try {
      // 确保依赖已加载
      await this.initialize();
      
      console.log(`🌐 [网页抓取] ${url} | 目标区域: ${targetSections.join(', ')}`);

      // URL验证
      if (!isValidUrl(url)) {
        throw new Error('无效的URL格式');
      }

      // 获取页面内容
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br'
        },
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      const targetUrl = response.url; // 可能有重定向

      // 使用metascraper提取基础元数据
      const metadata = await this.metascraperInstance({ html, url: targetUrl });

      // 使用cheerio进行内容分析
      const $ = cheerio.load(html);
      
      // 网站类型检测
      const websiteType = this.detectWebsiteType(url, metadata.title, html);
      
      // 技术栈分析
      const techStack = this.analyzeTechnicalStack($, html);
      
      // 社交链接提取
      const socialLinks = this.extractSocialLinks($);
      
      // 内容结构分析
      const contentStructure = this.analyzeContentStructure($, targetSections);
      
      // iframe适用性评估
      const iframeSuitability = this.assessIframeSuitability($, websiteType, url);

      // SEO分析
      const seoAnalysis = this.analyzeSEO($, metadata);

      return {
        url: targetUrl,
        title: metadata.title || '未知页面',
        description: metadata.description,
        image: metadata.image,
        logo: metadata.logo,
        author: metadata.author,
        date: metadata.date,
        type: websiteType,
        content_analysis: {
          is_accessible: true,
          has_valuable_content: contentStructure.sections.length > 0,
          content_quality: this.assessContentQuality(contentStructure, metadata),
          technical_stack: techStack,
          social_links: socialLinks,
          seo_score: seoAnalysis.score,
        },
        extracted_content: contentStructure,
        seo_analysis: seoAnalysis,
        suggestions: {
          iframe_display: iframeSuitability.suitable,
          reason: iframeSuitability.reason,
          iframe_settings: iframeSuitability.suitable ? {
            height: websiteType === 'portfolio' ? '800px' : '600px',
            responsive: true,
            sandbox: 'allow-same-origin allow-scripts allow-forms',
            security_level: 'medium'
          } : null,
          alternative_display: !iframeSuitability.suitable ? 'card' : 'iframe',
          content_highlights: contentStructure.highlights
        },
        extraction_confidence: this.calculateExtractionConfidence(contentStructure, techStack, socialLinks, metadata),
        metadata: {
          domain: new URL(targetUrl).hostname,
          extracted_at: new Date().toISOString(),
          content_length: html.length,
          analysis_sections: targetSections,
          final_url: targetUrl, // 记录可能的重定向
        }
      };

    } catch (error: any) {
      console.error('网页抓取失败:', error);
      
      const errorType = this.classifyWebpageError(error, url);
      
      return {
        url,
        error: errorType.message,
        error_type: errorType.type,
        content_analysis: {
          is_accessible: false,
          access_issue: errorType.type
        },
        suggestions: {
          iframe_display: false,
          reason: `网页访问失败: ${errorType.message}`,
          alternative_actions: errorType.suggestions
        },
        extraction_confidence: 0,
        metadata: {
          domain: this.extractDomain(url),
          extracted_at: new Date().toISOString(),
          error_occurred: true
        }
      };
    }
  }

  // =============== 私有方法 ===============

  private detectWebsiteType(url: string, title?: string, html?: string): string {
    const domain = this.extractDomain(url).toLowerCase();
    const text = `${title || ''} ${html || ''}`.toLowerCase();
    
    // 专业平台检测
    if (domain.includes('behance.net')) return 'behance-portfolio';
    if (domain.includes('dribbble.com')) return 'dribbble-portfolio';
    if (domain.includes('linkedin.com')) return 'linkedin-profile';
    if (domain.includes('medium.com')) return 'medium-blog';
    if (domain.includes('github.io') || domain.includes('netlify.app') || domain.includes('vercel.app')) return 'portfolio';
    
    // 内容关键词检测
    if (text.includes('portfolio') || text.includes('作品集')) return 'portfolio';
    if (text.includes('blog') || text.includes('博客')) return 'blog';
    if (text.includes('resume') || text.includes('简历')) return 'resume';
    if (text.includes('about') || text.includes('关于')) return 'personal';
    if (text.includes('company') || text.includes('公司')) return 'company';
    
    return 'general';
  }

  private analyzeTechnicalStack($: any, html: string): string[] {
    const techStack: string[] = [];
    
    // 检测前端框架
    if (html.includes('react') || $('script[src*="react"]').length > 0) {
      techStack.push('React');
    }
    if (html.includes('vue') || $('script[src*="vue"]').length > 0) {
      techStack.push('Vue.js');
    }
    if (html.includes('angular') || $('script[src*="angular"]').length > 0) {
      techStack.push('Angular');
    }
    if ($('script[src*="jquery"]').length > 0) {
      techStack.push('jQuery');
    }
    
    // 检测CSS框架
    if ($('link[href*="bootstrap"]').length > 0 || html.includes('bootstrap')) {
      techStack.push('Bootstrap');
    }
    if ($('link[href*="tailwind"]').length > 0 || html.includes('tailwind')) {
      techStack.push('Tailwind CSS');
    }
    
    // 检测构建工具和服务
    if (html.includes('webpack')) techStack.push('Webpack');
    if (html.includes('vite')) techStack.push('Vite');
    if ($('meta[name="generator"]').attr('content')?.includes('Next.js')) {
      techStack.push('Next.js');
    }
    if ($('meta[name="generator"]').attr('content')?.includes('Gatsby')) {
      techStack.push('Gatsby');
    }
    
    // 检测分析工具
    if ($('script[src*="google-analytics"]').length > 0 || html.includes('gtag')) {
      techStack.push('Google Analytics');
    }
    
    // 检测CDN
    if ($('link[href*="cdn.jsdelivr.net"]').length > 0 || $('script[src*="cdn.jsdelivr.net"]').length > 0) {
      techStack.push('jsDelivr CDN');
    }
    
    return Array.from(new Set(techStack)); // 去重
  }

  private extractSocialLinks($: any): Record<string, string> {
    const socialLinks: Record<string, string> = {};
    
    const socialPatterns = {
      github: /github\.com\/[^\/\s"']+/i,
      linkedin: /linkedin\.com\/in\/[^\/\s"']+/i,
      twitter: /twitter\.com\/[^\/\s"']+/i,
      instagram: /instagram\.com\/[^\/\s"']+/i,
      behance: /behance\.net\/[^\/\s"']+/i,
      dribbble: /dribbble\.com\/[^\/\s"']+/i,
      youtube: /youtube\.com\/(c\/|channel\/|@)[^\/\s"']+/i,
      medium: /medium\.com\/@[^\/\s"']+/i,
      dev: /dev\.to\/[^\/\s"']+/i,
      codepen: /codepen\.io\/[^\/\s"']+/i,
    };

    // 检查所有链接
    $('a[href]').each((_, element) => {
      const href = $(element).attr('href');
      if (href) {
        for (const [platform, pattern] of Object.entries(socialPatterns)) {
          const match = href.match(pattern);
          if (match && !socialLinks[platform]) {
            socialLinks[platform] = href.startsWith('http') ? href : `https://${match[0]}`;
          }
        }
      }
    });

    // 检查页面文本中的链接
    const pageText = $('body').text();
    for (const [platform, pattern] of Object.entries(socialPatterns)) {
      if (!socialLinks[platform]) {
        const match = pageText.match(pattern);
        if (match) {
          socialLinks[platform] = `https://${match[0]}`;
        }
      }
    }

    return socialLinks;
  }

  private analyzeContentStructure($: any, targetSections: string[]): any {
    const structure = {
      sections: [] as any[],
      highlights: [] as string[],
      word_count: 0,
      has_images: false,
      has_videos: false,
    };

    if (targetSections.includes('all') || targetSections.includes('about')) {
      const aboutSection = this.extractAboutSection($);
      if (aboutSection) structure.sections.push(aboutSection);
    }

    if (targetSections.includes('all') || targetSections.includes('projects')) {
      const projectsSection = this.extractProjectsSection($);
      if (projectsSection) structure.sections.push(projectsSection);
    }

    if (targetSections.includes('all') || targetSections.includes('experience')) {
      const experienceSection = this.extractExperienceSection($);
      if (experienceSection) structure.sections.push(experienceSection);
    }

    if (targetSections.includes('all') || targetSections.includes('skills')) {
      const skillsSection = this.extractSkillsSection($);
      if (skillsSection) structure.sections.push(skillsSection);
    }

    if (targetSections.includes('all') || targetSections.includes('contact')) {
      const contactSection = this.extractContactSection($);
      if (contactSection) structure.sections.push(contactSection);
    }

    // 基础统计
    structure.word_count = $('body').text().trim().split(/\s+/).length;
    structure.has_images = $('img').length > 0;
    structure.has_videos = $('video, iframe[src*="youtube"], iframe[src*="vimeo"]').length > 0;

    // 提取亮点
    structure.highlights = this.extractHighlights($);

    return structure;
  }

  private extractAboutSection($: any): any | null {
    const selectors = [
      'section[id*="about"]',
      'div[id*="about"]',
      'section[class*="about"]',
      'div[class*="about"]',
      '.bio',
      '.introduction',
    ];

    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length && element.text().trim().length > 50) {
        return {
          type: 'about',
          title: this.extractSectionTitle(element),
          content: element.text().trim().substring(0, 500),
          word_count: element.text().trim().split(/\s+/).length,
        };
      }
    }

    return null;
  }

  private extractProjectsSection($: any): any | null {
    const selectors = [
      'section[id*="project"]',
      'div[id*="project"]',
      'section[class*="project"]',
      'div[class*="project"]',
      '.portfolio',
      '.work',
    ];

    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length) {
        const projects = element.find('.project, .work-item, .portfolio-item').map((_, item) => {
          const $item = $(item);
          return {
            title: $item.find('h1, h2, h3, h4, .title').first().text().trim(),
            description: $item.find('p, .description').first().text().trim().substring(0, 200),
            image: $item.find('img').first().attr('src'),
            link: $item.find('a').first().attr('href'),
          };
        }).get();

        if (projects.length > 0) {
          return {
            type: 'projects',
            title: this.extractSectionTitle(element),
            projects: projects.slice(0, 5), // 限制数量
            total_projects: projects.length,
          };
        }
      }
    }

    return null;
  }

  private extractExperienceSection($: any): any | null {
    // 简化实现，类似于其他section提取方法
    const selectors = [
      'section[id*="experience"]',
      'div[id*="experience"]',
      'section[class*="experience"]',
      'div[class*="experience"]',
    ];

    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length && element.text().trim().length > 50) {
        return {
          type: 'experience',
          title: this.extractSectionTitle(element),
          content: element.text().trim().substring(0, 500),
        };
      }
    }

    return null;
  }

  private extractSkillsSection($: any): any | null {
    const selectors = [
      'section[id*="skill"]',
      'div[id*="skill"]',
      'section[class*="skill"]',
      'div[class*="skill"]',
    ];

    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length) {
        const skills = element.find('li, .skill, .tag').map((_, item) => 
          $(item).text().trim()
        ).get().filter(skill => skill.length > 0);

        if (skills.length > 0) {
          return {
            type: 'skills',
            title: this.extractSectionTitle(element),
            skills: skills.slice(0, 20), // 限制数量
            total_skills: skills.length,
          };
        }
      }
    }

    return null;
  }

  private extractContactSection($: any): any | null {
    const selectors = [
      'section[id*="contact"]',
      'div[id*="contact"]',
      'section[class*="contact"]',
      'div[class*="contact"]',
      'footer',
    ];

    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length) {
        const contact = {
          type: 'contact',
          title: this.extractSectionTitle(element),
          email: element.text().match(/[\w\.-]+@[\w\.-]+\.\w+/)?.[0],
          phone: element.text().match(/[\+\d\s\-\(\)]{10,}/)?.[0],
          social_links: this.extractSocialLinks($),
        };

        if (contact.email || contact.phone || Object.keys(contact.social_links).length > 0) {
          return contact;
        }
      }
    }

    return null;
  }

  private extractSectionTitle(element: any): string {
    const titleSelectors = ['h1', 'h2', 'h3', 'h4', '.title', '.heading'];
    
    for (const selector of titleSelectors) {
      const title = element.find(selector).first().text().trim();
      if (title && title.length < 100) {
        return title;
      }
    }
    
    return '未知标题';
  }

  private extractHighlights($: any): string[] {
    const highlights: string[] = [];
    
    // 提取重要标题
    $('h1, h2, h3').each((_: any, element: any) => {
      const text = $(element).text().trim();
      if (text.length > 5 && text.length < 100) {
        highlights.push(text);
      }
    });

    // 提取关键词
    const keywords = $('meta[name="keywords"]').attr('content');
    if (keywords) {
      highlights.push(...keywords.split(',').map(k => k.trim()).slice(0, 5));
    }

    return highlights.slice(0, 10); // 限制数量
  }

  private assessIframeSuitability($: any, websiteType: string, url: string): { suitable: boolean; reason: string } {
    // 检查X-Frame-Options限制
    const hasFrameRestriction = $('meta[http-equiv="X-Frame-Options"]').length > 0;
    if (hasFrameRestriction) {
      return { suitable: false, reason: '网站设置了X-Frame-Options限制' };
    }

    // 检查CSP限制
    const csp = $('meta[http-equiv="Content-Security-Policy"]').attr('content');
    if (csp && csp.includes('frame-ancestors')) {
      return { suitable: false, reason: '网站CSP策略禁止iframe嵌入' };
    }

    // 个人域名通常适合iframe
    if (this.isPersonalDomain(this.extractDomain(url))) {
      return { suitable: true, reason: '个人网站适合iframe展示' };
    }

    // 根据网站类型判断
    const suitableTypes = ['portfolio', 'personal', 'blog', 'behance-portfolio', 'dribbble-portfolio'];
    if (suitableTypes.includes(websiteType)) {
      return { suitable: true, reason: `${websiteType}类型网站适合iframe展示` };
    }

    return { suitable: false, reason: '无法确定iframe兼容性，建议使用卡片展示' };
  }

  private analyzeSEO($: any, metadata: any): any {
    let score = 0;
    const factors: string[] = [];
    const issues: string[] = [];

    // 标题检查
    if (metadata.title) {
      score += 20;
      factors.push('有页面标题');
      if (metadata.title.length >= 30 && metadata.title.length <= 60) {
        score += 10;
        factors.push('标题长度适中');
      }
    } else {
      issues.push('缺少页面标题');
    }

    // 描述检查
    if (metadata.description) {
      score += 20;
      factors.push('有页面描述');
      if (metadata.description.length >= 120 && metadata.description.length <= 160) {
        score += 10;
        factors.push('描述长度适中');
      }
    } else {
      issues.push('缺少页面描述');
    }

    // 标题结构检查
    const h1Count = $('h1').length;
    if (h1Count === 1) {
      score += 15;
      factors.push('有唯一H1标题');
    } else if (h1Count === 0) {
      issues.push('缺少H1标题');
    } else {
      issues.push('H1标题过多');
    }

    // 图片alt属性检查
    const imagesTotal = $('img').length;
    const imagesWithAlt = $('img[alt]').length;
    if (imagesTotal > 0 && imagesWithAlt / imagesTotal >= 0.8) {
      score += 15;
      factors.push('图片alt属性完整');
    } else if (imagesTotal > 0) {
      issues.push('部分图片缺少alt属性');
    }

    // 内部链接检查
    const internalLinks = $('a[href^="/"], a[href^="./"], a[href^="../"]').length;
    if (internalLinks > 0) {
      score += 10;
      factors.push('有内部链接结构');
    }

    // 响应式设计检查
    const viewport = $('meta[name="viewport"]').attr('content');
    if (viewport && viewport.includes('width=device-width')) {
      score += 10;
      factors.push('支持响应式设计');
    } else {
      issues.push('可能不支持响应式设计');
    }

    return {
      score: Math.min(score, 100),
      level: score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'average' : 'poor',
      factors,
      issues,
      recommendations: this.generateSEORecommendations({ score, factors, issues }),
    };
  }

  private generateSEORecommendations(seoAnalysis: any): string[] {
    const recommendations: string[] = [];
    
    if (seoAnalysis.issues.includes('缺少页面标题')) {
      recommendations.push('添加独特且描述性的页面标题');
    }
    if (seoAnalysis.issues.includes('缺少页面描述')) {
      recommendations.push('添加120-160字符的页面描述');
    }
    if (seoAnalysis.issues.includes('缺少H1标题')) {
      recommendations.push('为页面添加唯一的H1标题');
    }
    if (seoAnalysis.issues.includes('部分图片缺少alt属性')) {
      recommendations.push('为所有图片添加描述性的alt属性');
    }
    if (seoAnalysis.issues.includes('可能不支持响应式设计')) {
      recommendations.push('添加viewport meta标签以支持移动设备');
    }

    if (recommendations.length === 0) {
      recommendations.push('网站SEO基础良好，继续保持');
    }

    return recommendations;
  }

  private assessContentQuality(contentStructure: any, metadata: any): number {
    let quality = 0;
    
    // 内容丰富度
    if (contentStructure.word_count > 300) quality += 30;
    else if (contentStructure.word_count > 100) quality += 20;
    else quality += 10;
    
    // 结构完整性
    if (contentStructure.sections.length >= 3) quality += 25;
    else if (contentStructure.sections.length >= 2) quality += 15;
    else quality += 5;
    
    // 媒体内容
    if (contentStructure.has_images && contentStructure.has_videos) quality += 20;
    else if (contentStructure.has_images || contentStructure.has_videos) quality += 10;
    
    // 元数据完整性
    if (metadata.title && metadata.description) quality += 15;
    else if (metadata.title || metadata.description) quality += 10;
    
    // 亮点内容
    if (contentStructure.highlights.length > 5) quality += 10;
    else if (contentStructure.highlights.length > 0) quality += 5;
    
    return Math.min(quality, 100);
  }

  private calculateExtractionConfidence(contentStructure: any, techStack: string[], socialLinks: Record<string, string>, metadata: any): number {
    let confidence = 0.5; // 基础分
    
    if (metadata.title) confidence += 0.1;
    if (metadata.description) confidence += 0.1;
    if (contentStructure.sections.length > 0) confidence += 0.2;
    if (techStack.length > 0) confidence += 0.05;
    if (Object.keys(socialLinks).length > 0) confidence += 0.05;
    
    return Math.min(confidence, 1.0);
  }

  private classifyWebpageError(error: any, url: string): { type: string; message: string; suggestions: string[] } {
    const errorMessage = error.message || error.toString();
    
    if (errorMessage.includes('timeout') || errorMessage.includes('TIMEOUT')) {
      return {
        type: 'timeout',
        message: '网页响应超时',
        suggestions: ['检查网络连接', '稍后重试', '网站可能响应较慢']
      };
    }
    
    if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
      return {
        type: 'not_found',
        message: '页面不存在',
        suggestions: ['检查URL是否正确', '页面可能已被删除', '尝试访问网站首页']
      };
    }
    
    if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
      return {
        type: 'access_denied',
        message: '访问被拒绝',
        suggestions: ['网站可能需要登录', '检查是否有访问权限', '尝试使用不同的访问方式']
      };
    }
    
    if (errorMessage.includes('CORS') || errorMessage.includes('MIXED_CONTENT')) {
      return {
        type: 'security_restriction',
        message: '浏览器安全限制',
        suggestions: ['这是正常的安全机制', '建议提供其他材料', '可以尝试截图方式']
      };
    }
    
    return {
      type: 'unknown',
      message: '网络或服务器错误',
      suggestions: ['检查网络连接', '稍后重试', '提供备用链接或材料']
    };
  }

  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return url.split('/')[2] || url;
    }
  }

  private isPersonalDomain(domain: string): boolean {
    const personalIndicators = [
      '.github.io',
      '.netlify.app',
      '.vercel.app',
      '.herokuapp.com',
      '.surge.sh',
      '.now.sh',
    ];
    
    return personalIndicators.some(indicator => domain.includes(indicator)) ||
           domain.split('.').length === 2; // 可能是个人域名
  }
}

export const webService = new WebService(); 