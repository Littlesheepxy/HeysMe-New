/**
 * GitHub服务 - 专门处理GitHub相关的API调用和数据分析
 */

import { Octokit } from '@octokit/rest';
import simpleGit from 'simple-git';

export class GitHubService {
  private octokit: Octokit;
  
  constructor() {
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN, // 可选，提升API限制
    });
  }

  /**
   * 分析GitHub用户资料和仓库
   */
  async analyzeUser(usernameOrUrl: string, includeRepos: boolean = true): Promise<any> {
    try {
      const username = this.extractUsername(usernameOrUrl);
      
      // 获取用户基本信息
      const { data: user } = await this.octokit.rest.users.getByUsername({
        username,
      });

      let repositories: any[] = [];
      if (includeRepos) {
        // 获取用户仓库（按星数排序）
        const { data: repos } = await this.octokit.rest.repos.listForUser({
          username,
          sort: 'updated',
          per_page: 30,
        });
        
        repositories = repos
          .sort((a: any, b: any) => (b.stargazers_count || 0) - (a.stargazers_count || 0))
          .slice(0, 10);
      }

      // 分析编程语言分布
      const languages = await this.analyzeLanguages(repositories);
      
      // 计算活跃度指标
      const activityMetrics = this.calculateActivityMetrics(user, repositories);

      return {
        platform: 'github',
        username: user.login,
        profile: {
          name: user.name || user.login,
          bio: user.bio,
          location: user.location,
          blog: user.blog,
          twitter_username: user.twitter_username,
          followers: user.followers,
          following: user.following,
          public_repos: user.public_repos,
          avatar_url: user.avatar_url,
          created_at: user.created_at,
          updated_at: user.updated_at,
        },
        repositories: repositories.map(repo => ({
          name: repo.name,
          full_name: repo.full_name,
          description: repo.description,
          language: repo.language,
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          watchers: repo.watchers_count,
          size: repo.size,
          url: repo.html_url,
          topics: repo.topics || [],
          created_at: repo.created_at,
          updated_at: repo.updated_at,
          pushed_at: repo.pushed_at,
          is_fork: repo.fork,
          has_issues: repo.has_issues,
          has_pages: repo.has_pages,
        })),
        languages,
        activity_metrics: activityMetrics,
        analysis: {
          tech_diversity: this.calculateTechDiversity(languages),
          project_impact: this.calculateProjectImpact(repositories),
          contribution_pattern: this.analyzeContributionPattern(repositories),
          expertise_areas: this.identifyExpertiseAreas(repositories, languages),
        },
        extraction_confidence: 0.95,
        metadata: {
          extracted_at: new Date().toISOString(),
          total_repos_analyzed: repositories.length,
          api_rate_remaining: 'N/A', // 可以从响应头获取
        }
      };
      
    } catch (error: any) {
      console.error('GitHub用户分析失败:', error);
      
      if (error?.status === 404) {
        throw new Error(`GitHub用户 "${this.extractUsername(usernameOrUrl)}" 不存在`);
      }
      
      // 返回模拟数据作为降级
      return this.createFallbackData(usernameOrUrl);
    }
  }

  /**
   * 深度分析单个仓库
   */
  async analyzeRepository(repoUrl: string): Promise<any> {
    try {
      const { owner, repo } = this.parseRepoUrl(repoUrl);
      
      // 获取仓库基本信息
      const { data: repository } = await this.octokit.rest.repos.get({
        owner,
        repo,
      });

      // 获取提交统计
      const commits = await this.getCommitStats(owner, repo);
      
      // 获取语言统计
      const { data: languages } = await this.octokit.rest.repos.listLanguages({
        owner,
        repo,
      });

      // 获取贡献者信息
      const { data: contributors } = await this.octokit.rest.repos.listContributors({
        owner,
        repo,
        per_page: 10,
      });

      // 获取README内容
      const readme = await this.getReadmeContent(owner, repo);

      // 分析项目质量
      const qualityMetrics = this.analyzeProjectQuality(repository, commits, languages, readme);

      return {
        platform: 'github',
        repository: {
          name: repository.name,
          full_name: repository.full_name,
          description: repository.description,
          language: repository.language,
          stars: repository.stargazers_count,
          forks: repository.forks_count,
          watchers: repository.watchers_count,
          size: repository.size,
          url: repository.html_url,
          clone_url: repository.clone_url,
          topics: repository.topics || [],
          license: repository.license?.name,
          created_at: repository.created_at,
          updated_at: repository.updated_at,
          pushed_at: repository.pushed_at,
        },
        languages,
        commits: commits,
        contributors: contributors.slice(0, 5),
        readme_analysis: {
          has_readme: !!readme,
          content_quality: readme ? this.assessReadmeQuality(readme) : 0,
          sections: readme ? this.extractReadmeSections(readme) : [],
        },
        quality_metrics: qualityMetrics,
        extraction_confidence: 0.9,
        metadata: {
          extracted_at: new Date().toISOString(),
          analysis_type: 'repository_deep_dive',
        }
      };

    } catch (error: any) {
      console.error('GitHub仓库分析失败:', error);
      throw new Error(`无法分析仓库: ${error?.message || '未知错误'}`);
    }
  }

  /**
   * 分析编程语言分布
   */
  private async analyzeLanguages(repositories: any[]): Promise<Record<string, any>> {
    const languageStats: Record<string, { count: number; bytes: number; percentage: number }> = {};
    let totalBytes = 0;

    for (const repo of repositories) {
      if (repo.language) {
        const lang = repo.language;
        if (!languageStats[lang]) {
          languageStats[lang] = { count: 0, bytes: 0, percentage: 0 };
        }
        languageStats[lang].count += 1;
        languageStats[lang].bytes += repo.size || 0;
        totalBytes += repo.size || 0;
      }
    }

    // 计算百分比
    Object.keys(languageStats).forEach(lang => {
      languageStats[lang].percentage = totalBytes > 0 
        ? Math.round((languageStats[lang].bytes / totalBytes) * 100 * 100) / 100 
        : 0;
    });

    return {
      summary: Object.entries(languageStats)
        .sort(([,a], [,b]) => b.bytes - a.bytes)
        .slice(0, 10),
      total_languages: Object.keys(languageStats).length,
      primary_language: Object.entries(languageStats)
        .sort(([,a], [,b]) => b.bytes - a.bytes)[0]?.[0] || 'Unknown',
      diversity_score: Math.min(Object.keys(languageStats).length / 10, 1),
    };
  }

  /**
   * 计算活跃度指标
   */
  private calculateActivityMetrics(user: any, repositories: any[]) {
    const now = new Date();
    const recentRepos = repositories.filter(repo => {
      const lastUpdate = new Date(repo.updated_at);
      const monthsAgo = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24 * 30);
      return monthsAgo <= 6; // 最近6个月有更新
    });

    return {
      total_stars: repositories.reduce((sum, repo) => sum + repo.stargazers_count, 0),
      total_forks: repositories.reduce((sum, repo) => sum + repo.forks_count, 0),
      recent_activity: recentRepos.length,
      activity_score: Math.min((recentRepos.length / repositories.length) * 100, 100),
      influence_score: Math.min(user.followers / 100 * 50 + Math.min(repositories.reduce((sum, repo) => sum + repo.stargazers_count, 0) / 1000 * 50, 50), 100),
    };
  }

  /**
   * 计算技术多样性
   */
  private calculateTechDiversity(languages: any): number {
    const diversity = languages.total_languages || 0;
    return Math.min(diversity / 15, 1); // 归一化到0-1
  }

  /**
   * 计算项目影响力
   */
  private calculateProjectImpact(repositories: any[]): number {
    const totalStars = repositories.reduce((sum, repo) => sum + repo.stargazers_count, 0);
    const totalForks = repositories.reduce((sum, repo) => sum + repo.forks_count, 0);
    
    // 基于星数和分叉数的加权评分
    return Math.min((totalStars * 0.7 + totalForks * 0.3) / 1000, 100);
  }

  /**
   * 分析贡献模式
   */
  private analyzeContributionPattern(repositories: any[]): any {
    const now = new Date();
    
    const patterns = {
      consistent: 0,
      bursty: 0,
      seasonal: 0,
    };

    // 简化的模式分析
    const recentActivity = repositories.filter(repo => {
      const lastUpdate = new Date(repo.updated_at);
      const daysAgo = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);
      return daysAgo <= 90;
    }).length;

    if (recentActivity > repositories.length * 0.3) {
      patterns.consistent = 0.8;
    } else if (recentActivity > 0) {
      patterns.bursty = 0.6;
    } else {
      patterns.seasonal = 0.4;
    }

    return patterns;
  }

  /**
   * 识别专业领域
   */
  private identifyExpertiseAreas(repositories: any[], languages: any): string[] {
    const areas: string[] = [];
    
    // 基于主要语言判断
    const primaryLang = languages.primary_language?.toLowerCase();
    if (primaryLang) {
      const langMap: Record<string, string> = {
        'javascript': '前端开发',
        'typescript': '全栈开发',
        'python': '数据科学/后端',
        'java': '企业级开发',
        'go': '云原生/后端',
        'rust': '系统编程',
        'swift': 'iOS开发',
        'kotlin': 'Android开发',
      };
      
      if (langMap[primaryLang]) {
        areas.push(langMap[primaryLang]);
      }
    }

    // 基于仓库topics判断
    const allTopics = repositories.flatMap(repo => repo.topics || []);
    const topicFreq: Record<string, number> = {};
    
    allTopics.forEach(topic => {
      topicFreq[topic] = (topicFreq[topic] || 0) + 1;
    });

    const commonTopics = Object.entries(topicFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([topic]) => topic);

    areas.push(...commonTopics);

    return Array.from(new Set(areas)); // 去重
  }

  // =============== 辅助方法 ===============

  private extractUsername(usernameOrUrl: string): string {
    if (usernameOrUrl.includes('github.com')) {
      const match = usernameOrUrl.match(/github\.com\/([^\/]+)/);
      return match ? match[1] : usernameOrUrl;
    }
    return usernameOrUrl;
  }

  private parseRepoUrl(repoUrl: string): { owner: string; repo: string } {
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      throw new Error('无效的GitHub仓库URL');
    }
    return { owner: match[1], repo: match[2] };
  }

  private async getCommitStats(owner: string, repo: string): Promise<any> {
    try {
      const { data: commits } = await this.octokit.rest.repos.listCommits({
        owner,
        repo,
        per_page: 100,
      });

      return {
        total_commits: commits.length,
        recent_commits: commits.filter((commit: any) => {
          if (!commit.commit.author?.date) return false;
          const commitDate = new Date(commit.commit.author.date);
          const monthsAgo = (Date.now() - commitDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
          return monthsAgo <= 3;
        }).length,
        last_commit: commits[0]?.commit.author?.date || null,
      };
    } catch {
      return { total_commits: 0, recent_commits: 0, last_commit: null };
    }
  }

  private async getReadmeContent(owner: string, repo: string): Promise<string | null> {
    try {
      const { data } = await this.octokit.rest.repos.getReadme({
        owner,
        repo,
      });
      return Buffer.from(data.content, 'base64').toString('utf-8');
    } catch {
      return null;
    }
  }

  private analyzeProjectQuality(repository: any, commits: any, languages: any, readme: string | null): any {
    let score = 0;
    const factors: string[] = [];

    // README存在加分
    if (readme) {
      score += 20;
      factors.push('有README文档');
    }

    // 许可证加分
    if (repository.license) {
      score += 15;
      factors.push('有开源许可证');
    }

    // 活跃度加分
    if (commits.recent_commits > 5) {
      score += 20;
      factors.push('近期活跃');
    }

    // 社区参与度加分
    if (repository.stargazers_count > 10) {
      score += 15;
      factors.push('有社区关注');
    }

    // 代码质量指标
    if (Object.keys(languages).length > 1) {
      score += 10;
      factors.push('技术栈多样');
    }

    return {
      score: Math.min(score, 100),
      level: score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'average' : 'basic',
      factors,
    };
  }

  private assessReadmeQuality(readme: string): number {
    let score = 0;
    
    if (readme.length > 500) score += 30;
    if (readme.includes('## ') || readme.includes('# ')) score += 20;
    if (readme.toLowerCase().includes('installation')) score += 15;
    if (readme.toLowerCase().includes('usage')) score += 15;
    if (readme.toLowerCase().includes('example')) score += 10;
    if (readme.includes('![') || readme.includes('](')) score += 10;
    
    return Math.min(score, 100);
  }

  private extractReadmeSections(readme: string): string[] {
    const sections: string[] = [];
    const lines = readme.split('\n');
    
    lines.forEach(line => {
      if (line.startsWith('# ') || line.startsWith('## ')) {
        sections.push(line.replace(/^#+\s*/, ''));
      }
    });
    
    return sections;
  }

  private createFallbackData(usernameOrUrl: string): any {
    const username = this.extractUsername(usernameOrUrl);
    
    return {
      platform: 'github',
      username,
      profile: {
        name: `GitHub用户-${username}`,
        bio: '热爱编程的开发者',
        location: '北京',
        followers: 50,
        following: 30,
        public_repos: 15,
      },
      repositories: [
        {
          name: 'awesome-project',
          description: '一个很棒的开源项目',
          language: 'JavaScript',
          stars: 100,
          forks: 20,
          url: `https://github.com/${username}/awesome-project`,
        }
      ],
      languages: {
        summary: [['JavaScript', { count: 5, bytes: 1000, percentage: 60 }]],
        primary_language: 'JavaScript',
      },
      activity_metrics: {
        total_stars: 100,
        recent_activity: 3,
        activity_score: 75,
      },
      extraction_confidence: 0.3,
      metadata: {
        extracted_at: new Date().toISOString(),
        fallback_data: true,
        reason: 'GitHub API访问失败，返回模拟数据',
      }
    };
  }
}

export const githubService = new GitHubService(); 