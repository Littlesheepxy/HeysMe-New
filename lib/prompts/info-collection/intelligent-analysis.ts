/**
 * 智能信息分析 Prompt - 基于工具结果的深度分析
 */

export const INTELLIGENT_ANALYSIS_PROMPT = `你是一个专业的信息分析专家，擅长从多源数据中提取和整合用户信息。

## 📊 当前已收集的数据

### GitHub 数据
{github_data}

### 网页数据  
{webpage_data}

### LinkedIn 数据
{linkedin_data}

### 用户文本输入
{user_text}

## 🎯 分析任务

请基于以上数据进行深度分析：

### 1. 信息完整性评估
- 哪些关键信息已经收集完整？
- 哪些信息存在冲突或不一致？
- 哪些重要信息仍然缺失？

### 2. 数据质量分析
- 各数据源的可靠性如何？
- 是否存在过时或不准确的信息？
- 哪些信息需要用户确认或更新？

### 3. 智能问题生成
基于已有信息，生成2-3个精准的补充问题：
- 避免询问已经明确的信息
- 重点关注信息缺口和不一致之处
- 问题应该具体、有针对性

### 4. 优先级建议
- 哪些缺失信息对用户档案最重要？
- 建议的信息收集优先级顺序？

## 📝 输出格式

请按以下格式输出分析结果：

**信息完整性**: [完整度百分比]%
**主要发现**: [关键发现点]
**建议问题**:
1. [具体问题1]
2. [具体问题2]
3. [具体问题3]

**优先级**: [最需要补充的信息类型]

确保分析基于实际数据，问题具有针对性和实用性。`;

export const CONTEXTUAL_QUESTION_TEMPLATES = {
  github: {
    hasProjects: "我看到您的 GitHub 上有 \"{project_name}\" 项目，能详细介绍一下这个项目的技术亮点和您的贡献吗？",
    hasFollowers: "您在 GitHub 上有 {follower_count} 个关注者，是否有参与开源社区的特殊经历或贡献？",
    hasLanguages: "看到您主要使用 {languages}，在这些技术栈上有什么特别的经验或成就？",
    hasStars: "您的项目获得了 {star_count} 个星标，能分享一下项目的成功经验吗？"
  },
  
  webpage: {
    hasPortfolio: "从您的个人网站 \"{title}\" 看到很多作品，哪个项目最能代表您的技术水平？",
    hasBlog: "看到您有技术博客，最近在关注哪些技术趋势或挑战？",
    hasServices: "您的网站展示了 {services}，能详细说说您在这些领域的专业经验吗？"
  },
  
  linkedin: {
    currentRole: "看到您目前在 {company} 担任 {position}，能分享一下最近的工作成果或挑战吗？",
    hasEducation: "您在 {school} 的 {degree} 背景，对您现在的工作有什么帮助？",
    hasSkills: "LinkedIn 上显示您擅长 {skills}，能举个具体的项目例子吗？",
    hasRecommendations: "看到您有 {count} 个推荐，能分享一下最有价值的职业建议吗？"
  }
};

/**
 * 生成基于上下文的智能问题
 */
export function generateIntelligentQuestions(toolStorage: any): string[] {
  const questions: string[] = [];
  
  // GitHub 相关问题
  if (toolStorage.github_data) {
    const github = toolStorage.github_data;
    
    if (github.repositories?.length > 0) {
      const topRepo = github.repositories[0];
      questions.push(
        CONTEXTUAL_QUESTION_TEMPLATES.github.hasProjects
          .replace('{project_name}', topRepo.name || 'unknown')
      );
    }
    
    if (github.profile?.followers > 50) {
      questions.push(
        CONTEXTUAL_QUESTION_TEMPLATES.github.hasFollowers
          .replace('{follower_count}', github.profile.followers.toString())
      );
    }
  }
  
  // 网页相关问题
  if (toolStorage.webpage_data) {
    const webpage = toolStorage.webpage_data;
    
    if (webpage.title && webpage.content) {
      questions.push(
        CONTEXTUAL_QUESTION_TEMPLATES.webpage.hasPortfolio
          .replace('{title}', webpage.title)
      );
    }
  }
  
  // LinkedIn 相关问题
  if (toolStorage.linkedin_data) {
    const linkedin = toolStorage.linkedin_data;
    
    if (linkedin.experience?.length > 0) {
      const currentRole = linkedin.experience[0];
      questions.push(
        CONTEXTUAL_QUESTION_TEMPLATES.linkedin.currentRole
          .replace('{company}', currentRole.company || 'unknown')
          .replace('{position}', currentRole.position || 'unknown')
      );
    }
  }
  
  return questions.slice(0, 3); // 最多3个问题
}
