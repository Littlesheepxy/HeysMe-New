# 数据提取流程分析

## 🔍 问题回答

用户询问：**"现在我们这些数据怎么提取？从用户的简历中嘛？"**

**答案**: **不是从简历中直接提取**，而是通过多种智能方式收集和整合信息。

## 📊 完整的数据提取流程

### 1. **Welcome 阶段** - 用户画像分析
```
用户对话 → AI分析 → 提取核心信息
```

**提取的信息**:
- `user_role`: 用户角色（开发者、设计师、产品经理等）
- `use_case`: 使用场景（求职、个人品牌、作品展示等）
- `style`: 设计风格偏好（现代简约、创意表达等）
- `highlight_focus`: 重点展示内容
- `commitment_level`: 投入程度（试一试、认真制作）

**存储位置**: `sessionData.metadata.collectedInfo`

### 2. **信息收集阶段** - 多源数据提取

#### 🔧 工具调用方式

**用户提供信息** → **AI智能选择工具** → **自动提取结构化数据**

#### 📋 数据来源和提取方式

##### A. **GitHub 分析** (`analyze_github` 工具)
```typescript
// 用户提供: GitHub链接或用户名
// 提取信息:
{
  basic_info: {
    name: "用户真实姓名",
    location: "地理位置", 
    bio: "个人简介",
    avatar: "头像URL"
  },
  technical_skills: {
    primary_languages: ["JavaScript", "Python", "TypeScript"],
    technologies: ["React", "Node.js", "Docker"],
    expertise_level: 0.8
  },
  professional_experience: {
    github_activity: {
      total_repos: 45,
      total_stars: 234,
      total_commits: 1200,
      active_days: 180
    },
    projects: [
      {
        name: "项目名称",
        description: "项目描述", 
        language: "主要语言",
        stars: 15,
        url: "项目链接"
      }
    ]
  }
}
```

##### B. **网页抓取** (`scrape_webpage` 工具)
```typescript
// 用户提供: 个人网站、作品集链接
// 提取信息:
{
  personal_info: {
    name: "姓名",
    title: "职位标题",
    contact: {
      email: "邮箱",
      phone: "电话"
    }
  },
  professional_info: {
    skills: ["技能列表"],
    experience: [
      {
        company: "公司名称",
        position: "职位",
        duration: "时间段",
        description: "工作描述"
      }
    ]
  },
  projects: [
    {
      title: "项目标题",
      description: "项目描述",
      technologies: ["技术栈"],
      url: "项目链接"
    }
  ]
}
```

##### C. **LinkedIn 提取** (`extract_linkedin` 工具)
```typescript
// 用户提供: LinkedIn 个人资料链接
// 提取信息:
{
  personal_info: {
    name: "全名",
    headline: "职业标题",
    location: "位置",
    summary: "个人总结"
  },
  experience: [
    {
      company: "公司",
      position: "职位", 
      duration: "任职时间",
      description: "工作内容"
    }
  ],
  education: [
    {
      school: "学校",
      degree: "学位",
      field: "专业",
      year: "毕业年份"
    }
  ],
  skills: ["技能认证列表"]
}
```

##### D. **社交媒体分析** (`analyze_social_media` 工具)
```typescript
// 用户提供: TikTok、X/Twitter、Behance等链接
// 提取信息:
{
  profile: {
    name: "显示名称",
    bio: "个人简介",
    avatar: "头像",
    follower_count: 1500,
    content_type: "内容类型"
  },
  content_analysis: {
    themes: ["主要内容主题"],
    style: "内容风格",
    engagement: "互动水平"
  }
}
```

##### E. **文档解析** (前端完成)
```typescript
// 用户上传: PDF简历、Word文档等
// 前端解析后传递给AI:
{
  document_content: "解析后的文本内容",
  document_insights: {
    key_skills: ["从文档中提取的技能"],
    experience_years: 5,
    education: ["教育背景"],
    achievements: ["成就列表"]
  }
}
```

### 3. **综合分析阶段** - 数据整合

#### 🔄 `synthesize_profile` 工具
将所有收集的数据整合成结构化信息：

```typescript
{
  // 基础信息（优先级：GitHub > LinkedIn > 社交媒体）
  basic_info: {
    name: "最可靠的姓名来源",
    location: "地理位置",
    bio: "综合个人简介",
    avatar: "头像URL"
  },
  
  // 技术技能（GitHub + 网站 + 文档）
  technical_skills: {
    primary_languages: ["主要编程语言"],
    technologies: ["技术栈"],
    expertise_level: "技能水平评估"
  },
  
  // 专业经历（LinkedIn + 网站 + 文档）
  professional_experience: {
    current_position: "当前职位",
    experience_years: "工作年限",
    key_achievements: ["主要成就"],
    projects: ["项目列表"]
  },
  
  // 在线影响力（GitHub + 社交媒体）
  online_presence: {
    github_stats: "GitHub统计",
    social_media_reach: "社交媒体影响力",
    content_themes: ["内容主题"]
  }
}
```

## 🎯 数据存储结构

### 最终存储在 `sessionData.collectedData` 中：

```typescript
{
  personal: {
    fullName: "从多源整合的姓名",
    email: "邮箱地址", 
    phone: "电话号码",
    location: "地理位置",
    portfolio: "作品集链接",
    linkedin: "LinkedIn链接",
    github: "GitHub链接",
    website: "个人网站"
  },
  
  professional: {
    currentTitle: "当前职位",
    targetRole: "目标职位",
    yearsExperience: "工作年限",
    summary: "专业总结",
    skills: ["技能列表"],
    languages: [
      {
        language: "语言",
        proficiency: "熟练程度"
      }
    ]
  },
  
  experience: [
    {
      company: "公司名称",
      position: "职位",
      startDate: "开始时间",
      endDate: "结束时间", 
      description: "工作描述",
      achievements: ["成就列表"]
    }
  ],
  
  education: [
    {
      school: "学校",
      degree: "学位",
      field: "专业",
      graduationYear: "毕业年份"
    }
  ],
  
  projects: [
    {
      name: "项目名称",
      description: "项目描述",
      technologies: ["技术栈"],
      url: "项目链接",
      github: "GitHub链接",
      highlights: ["项目亮点"]
    }
  ],
  
  achievements: [
    {
      title: "成就标题",
      description: "成就描述",
      date: "获得时间",
      source: "来源"
    }
  ]
}
```

## 🔄 智能整合逻辑

### 数据优先级和冲突解决：

1. **姓名**: GitHub > LinkedIn > 网站 > 社交媒体
2. **联系方式**: 网站 > LinkedIn > 文档
3. **技能**: GitHub语言统计 + LinkedIn技能 + 文档提取
4. **经历**: LinkedIn > 网站 > 文档描述
5. **项目**: GitHub仓库 > 网站作品集 > 文档项目

### 数据质量评估：

- **完整性**: 各个字段的填充程度
- **一致性**: 多源数据的一致性检查
- **时效性**: 数据的新鲜程度
- **可信度**: 数据来源的可靠性

## 📋 总结

**数据提取方式**：
- ❌ **不是**从简历中直接提取
- ✅ **是**通过AI工具智能分析多种信息源
- ✅ 包括GitHub、LinkedIn、个人网站、社交媒体等
- ✅ 前端解析文档内容作为补充信息
- ✅ AI综合分析并整合成结构化数据

这种方式比传统的简历解析更加全面和准确，能够获取用户在各个平台的最新信息！






