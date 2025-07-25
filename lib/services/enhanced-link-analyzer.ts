/**
 * 增强的链接分析服务 - 智能处理未知链接
 */

export interface LinkAnalysisResult {
  url: string;
  detected_type: string;
  confidence: number;
  platform: string;
  content_category: string;
  suggested_extraction: {
    method: 'api' | 'scrape' | 'iframe' | 'manual' | 'scrape_with_iframe_option';
    sections: string[];
    reasoning: string;
  };
  metadata: {
    title?: string;
    description?: string;
    domain: string;
    is_personal_site: boolean;
    has_contact_info: boolean;
    technology_stack?: string[];
  };
}

export class EnhancedLinkAnalyzer {
  private static instance: EnhancedLinkAnalyzer;
  
  private constructor() {}
  
  public static getInstance(): EnhancedLinkAnalyzer {
    if (!EnhancedLinkAnalyzer.instance) {
      EnhancedLinkAnalyzer.instance = new EnhancedLinkAnalyzer();
    }
    return EnhancedLinkAnalyzer.instance;
  }

  /**
   * 智能分析任何链接
   */
  async analyzeLink(url: string, userContext?: any): Promise<LinkAnalysisResult> {
    console.log(`🔍 [智能链接分析] 开始分析: ${url}`);
    
    try {
      // 第一步：基础URL分析
      const basicAnalysis = this.analyzeUrlStructure(url);
      console.log(`📋 [基础分析]`, basicAnalysis);
      
      // 第二步：已知平台快速识别
      const knownPlatform = this.detectKnownPlatform(url);
      if (knownPlatform) {
        console.log(`✅ [已知平台] ${knownPlatform.platform}`);
        return this.createKnownPlatformResult(url, knownPlatform);
      }
      
      // 第三步：网页内容智能分析
      const contentAnalysis = await this.analyzePageContent(url);
      console.log(`🧠 [内容分析]`, contentAnalysis);
      
      // 第四步：LLM辅助分类
      const llmClassification = await this.llmClassifyContent(url, contentAnalysis, userContext);
      console.log(`🤖 [LLM分类]`, llmClassification);
      
      // 第五步：综合判断和建议
      return this.synthesizeAnalysis(url, basicAnalysis, contentAnalysis, llmClassification);
      
    } catch (error) {
      console.error(`❌ [链接分析失败]`, error);
      return this.createFallbackResult(url, error);
    }
  }

  /**
   * 分析URL结构
   */
  private analyzeUrlStructure(url: string) {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.toLowerCase();
    const path = urlObj.pathname;
    const subdomain = domain.split('.')[0];
    
    return {
      domain,
      subdomain,
      path,
      has_subdomain: domain.split('.').length > 2,
      is_personal_domain: this.isPersonalDomain(domain),
      url_patterns: this.extractUrlPatterns(path),
      tech_indicators: this.detectTechIndicators(url)
    };
  }

  /**
   * 检测已知平台
   */
  private detectKnownPlatform(url: string) {
    const platforms = [
      // 代码/开发平台
      { domain: 'github.com', platform: 'github', type: 'code_repository' },
      { domain: 'gitlab.com', platform: 'gitlab', type: 'code_repository' },
      { domain: 'bitbucket.org', platform: 'bitbucket', type: 'code_repository' },
      { domain: 'huggingface.co', platform: 'huggingface', type: 'ai_models' },
      { domain: 'kaggle.com', platform: 'kaggle', type: 'data_science' },
      
      // 设计平台
      { domain: 'behance.net', platform: 'behance', type: 'design_portfolio' },
      { domain: 'dribbble.com', platform: 'dribbble', type: 'design_portfolio' },
      { domain: 'figma.com', platform: 'figma', type: 'design_tool' },
      { domain: 'deviantart.com', platform: 'deviantart', type: 'art_portfolio' },
      
      // 职业平台
      { domain: 'linkedin.com', platform: 'linkedin', type: 'professional_profile' },
      { domain: 'xing.com', platform: 'xing', type: 'professional_profile' },
      
      // 博客平台
      { domain: 'medium.com', platform: 'medium', type: 'blog' },
      { domain: 'dev.to', platform: 'dev.to', type: 'tech_blog' },
      { domain: 'hashnode.com', platform: 'hashnode', type: 'tech_blog' },
      { domain: 'substack.com', platform: 'substack', type: 'newsletter_blog' },
      { domain: 'notion.site', platform: 'notion', type: 'documentation' },
      
      // 作品展示平台
      { domain: 'codepen.io', platform: 'codepen', type: 'code_showcase' },
      { domain: 'codesandbox.io', platform: 'codesandbox', type: 'code_showcase' },
      { domain: 'replit.com', platform: 'replit', type: 'code_showcase' },
      { domain: 'vercel.app', platform: 'vercel', type: 'deployed_project' },
      { domain: 'netlify.app', platform: 'netlify', type: 'deployed_project' },
      { domain: 'herokuapp.com', platform: 'heroku', type: 'deployed_project' },
      
      // 视频/展示平台
      { domain: 'youtube.com', platform: 'youtube', type: 'video_content' },
      { domain: 'vimeo.com', platform: 'vimeo', type: 'video_content' },
      { domain: 'loom.com', platform: 'loom', type: 'screen_recording' },
      
      // 文档/简历平台
      { domain: 'docs.google.com', platform: 'google_docs', type: 'document' },
      { domain: 'dropbox.com', platform: 'dropbox', type: 'file_sharing' },
      { domain: 'drive.google.com', platform: 'google_drive', type: 'file_sharing' }
    ];
    
    return platforms.find(p => url.includes(p.domain));
  }

  /**
   * 分析页面内容
   */
  private async analyzePageContent(url: string): Promise<any> {
    try {
      // 模拟页面内容获取（实际应该用爬虫服务）
      console.log(`🌐 [页面内容获取] ${url}`);
      
      // 这里会调用实际的网页抓取服务
      return {
        title: '页面标题',
        meta_description: '页面描述',
        h1_tags: ['主标题1', '主标题2'],
        keywords: ['react', 'javascript', 'portfolio'],
        has_contact_form: false,
        has_project_gallery: true,
        has_blog_posts: false,
        technology_mentions: ['React', 'TypeScript', 'Node.js'],
        social_links: {
          github: 'https://github.com/username',
          twitter: 'https://twitter.com/username'
        },
        content_indicators: {
          is_portfolio: true,
          is_blog: false,
          is_company_site: false,
          is_personal_site: true,
          has_code_examples: true,
          has_design_work: false
        }
      };
      
    } catch (error) {
      console.error('页面内容分析失败:', error);
      return {
        error: '无法获取页面内容',
        accessible: false
      };
    }
  }

  /**
   * LLM辅助内容分类
   */
  private async llmClassifyContent(url: string, contentAnalysis: any, userContext?: any): Promise<any> {
    // 构建LLM分析prompt
    const prompt = `
分析这个网页并分类其类型和价值：

URL: ${url}
页面信息: ${JSON.stringify(contentAnalysis)}
用户背景: ${userContext ? JSON.stringify(userContext) : '未知'}

请判断：
1. 这个网页的主要类型（个人作品集、技术博客、开源项目、职业档案等）
2. 对于简历制作的价值等级（高/中/低）
3. 建议的信息提取方式（API调用、网页抓取、iframe展示、手动输入）
4. 最适合提取的信息类型（项目经历、技能展示、个人介绍等）

返回JSON格式的分析结果。
`;

    try {
      // 这里会调用LLM API进行智能分析
      // const response = await callLLM(prompt);
      
      // 模拟LLM响应
      return {
        content_type: 'personal_portfolio',
        value_level: 'high',
        extraction_method: 'scrape_with_iframe_option',
        recommended_sections: ['projects', 'about', 'skills', 'contact'],
        reasoning: '这是一个个人技术作品集网站，包含丰富的项目展示，对简历制作有很高价值',
        confidence: 0.85
      };
      
    } catch (error) {
      console.error('LLM分类失败:', error);
      return {
        content_type: 'unknown',
        value_level: 'medium',
        extraction_method: 'scrape',
        recommended_sections: ['all'],
        reasoning: '无法进行智能分类，使用通用抓取策略',
        confidence: 0.3
      };
    }
  }

  /**
   * 综合分析结果
   */
  private synthesizeAnalysis(
    url: string, 
    basicAnalysis: any, 
    contentAnalysis: any, 
    llmClassification: any
  ): LinkAnalysisResult {
    return {
      url,
      detected_type: llmClassification.content_type,
      confidence: llmClassification.confidence,
      platform: basicAnalysis.domain,
      content_category: this.categorizeContent(llmClassification.content_type),
      suggested_extraction: {
        method: llmClassification.extraction_method,
        sections: llmClassification.recommended_sections,
        reasoning: llmClassification.reasoning
      },
      metadata: {
        title: contentAnalysis.title,
        description: contentAnalysis.meta_description,
        domain: basicAnalysis.domain,
        is_personal_site: basicAnalysis.is_personal_domain || contentAnalysis.content_indicators?.is_personal_site,
        has_contact_info: contentAnalysis.has_contact_form,
        technology_stack: contentAnalysis.technology_mentions
      }
    };
  }

  /**
   * 创建已知平台结果
   */
  private createKnownPlatformResult(url: string, platformInfo: any): LinkAnalysisResult {
    const extractionStrategies = {
      'code_repository': { method: 'api' as const, sections: ['repos', 'profile', 'contributions'] },
      'design_portfolio': { method: 'scrape' as const, sections: ['projects', 'profile', 'about'] },
      'professional_profile': { method: 'scrape' as const, sections: ['experience', 'education', 'skills'] },
      'blog': { method: 'scrape' as const, sections: ['posts', 'about', 'bio'] },
      'deployed_project': { method: 'iframe' as const, sections: ['demo', 'features'] }
    };

    const strategy = extractionStrategies[platformInfo.type as keyof typeof extractionStrategies] || 
                    { method: 'scrape' as const, sections: ['all'] };

    return {
      url,
      detected_type: platformInfo.type,
      confidence: 0.95,
      platform: platformInfo.platform,
      content_category: this.categorizeContent(platformInfo.type),
      suggested_extraction: {
        method: strategy.method,
        sections: strategy.sections,
        reasoning: `已知平台 ${platformInfo.platform}，使用专门的提取策略`
      },
      metadata: {
        domain: new URL(url).hostname,
        is_personal_site: true,
        has_contact_info: false
      }
    };
  }

  /**
   * 创建回退结果
   */
  private createFallbackResult(url: string, error: any): LinkAnalysisResult {
    return {
      url,
      detected_type: 'unknown',
      confidence: 0.1,
      platform: 'unknown',
      content_category: 'general',
      suggested_extraction: {
        method: 'manual',
        sections: ['basic_info'],
        reasoning: `链接分析失败: ${error.message}，建议用户手动描述内容`
      },
      metadata: {
        domain: 'unknown',
        is_personal_site: false,
        has_contact_info: false
      }
    };
  }

  // ============== 辅助方法 ==============

  private isPersonalDomain(domain: string): boolean {
    // 个人域名特征
    const personalIndicators = [
      /^[a-z]+\.(me|dev|io|com)$/,  // 短域名
      /portfolio/,                   // 包含portfolio
      /blog/,                       // 包含blog
      /^[a-z]+-[a-z]+\./           // 连字符格式
    ];
    
    return personalIndicators.some(pattern => pattern.test(domain));
  }

  private extractUrlPatterns(path: string): string[] {
    const patterns = [];
    if (path.includes('/portfolio')) patterns.push('portfolio');
    if (path.includes('/blog')) patterns.push('blog');
    if (path.includes('/projects')) patterns.push('projects');
    if (path.includes('/about')) patterns.push('about');
    if (path.includes('/contact')) patterns.push('contact');
    return patterns;
  }

  private detectTechIndicators(url: string): string[] {
    const indicators = [];
    if (url.includes('github.io')) indicators.push('github_pages');
    if (url.includes('vercel.app')) indicators.push('vercel');
    if (url.includes('netlify.app')) indicators.push('netlify');
    if (url.includes('herokuapp.com')) indicators.push('heroku');
    return indicators;
  }

  private categorizeContent(contentType: string): string {
    const categories: Record<string, string> = {
      'code_repository': 'technical',
      'design_portfolio': 'creative',
      'professional_profile': 'professional',
      'blog': 'content',
      'personal_portfolio': 'showcase',
      'deployed_project': 'demonstration'
    };
    
    return categories[contentType] || 'general';
  }
}

// 导出单例实例
export const enhancedLinkAnalyzer = EnhancedLinkAnalyzer.getInstance(); 