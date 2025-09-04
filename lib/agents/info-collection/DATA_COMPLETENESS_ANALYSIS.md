# 数据完整性分析

## 🔍 问题分析

用户询问传递给 `DESIGN_AGENT_PROMPT` 的6个变量是否包含了所有阶段的完整信息。

## 📊 当前数据传递分析

### 传递的6个变量

1. **`{collected_user_info}`** = `session.collectedData`
2. **`{user_goal}`** = `metadata.collectedInfo?.goal || metadata.collectedInfo?.purpose`
3. **`{user_type}`** = `metadata.collectedInfo?.identity || metadata.collectedInfo?.role`
4. **`{tool_results}`** = `contentDisplayAnalysis.rule_engine_analyses`
5. **`{content_display_analysis}`** = `contentDisplayAnalysis`
6. **`{content_quality_assessment}`** = 从分析结果中提取的质量评估

## ❌ 发现的问题

### 1. **Welcome 阶段数据缺失**

**问题**: `session.collectedData` 主要包含的是 `CollectedResumeData` 结构，但 Welcome 阶段的关键信息存储在 `metadata.collectedInfo` 中。

**Welcome 阶段收集的关键信息**:
```typescript
// 存储在 metadata.collectedInfo 中
{
  user_role: string,        // 用户角色
  use_case: string,         // 使用场景  
  style: string,            // 设计风格偏好
  highlight_focus: string,  // 重点展示内容
  commitment_level: string, // 投入程度
  target_audience: string   // 目标受众
}
```

**当前传递的 `collected_user_info`**:
```typescript
// session.collectedData 的结构
{
  personal: { fullName, email, phone, location, portfolio, linkedin, github, website },
  professional: { currentTitle, targetRole, yearsExperience, summary, skills, languages },
  experience: WorkExperience[],
  education: Education[],
  projects: Project[],
  achievements: Achievement[]
}
```

### 2. **信息收集阶段的元数据缺失**

**问题**: 工具调用的详细结果和分析过程中的元数据没有完整传递。

**缺失的信息**:
- 工具调用的置信度和质量评估
- 信息收集的完整性评分
- 各个信息源的可访问性状态
- 收集过程中的用户交互历史

### 3. **数据结构不匹配**

**问题**: `user_goal` 和 `user_type` 的提取逻辑可能不准确。

**当前提取逻辑**:
```typescript
user_goal: metadata.collectedInfo?.goal || metadata.collectedInfo?.purpose || '创建个人主页'
user_type: metadata.collectedInfo?.identity || metadata.collectedInfo?.role || '专业人士'
```

**实际存储字段**:
```typescript
// Welcome 阶段存储的字段名
metadata.collectedInfo = {
  user_role: '...',    // 不是 identity 或 role
  use_case: '...',     // 不是 goal 或 purpose
  style: '...',
  highlight_focus: '...'
}
```

## ✅ 修复方案

### 1. **整合 Welcome 阶段数据**

```typescript
const completeUserInfo = {
  // Welcome 阶段的核心信息
  welcome_analysis: {
    user_role: metadata.collectedInfo?.user_role,
    use_case: metadata.collectedInfo?.use_case,
    style_preference: metadata.collectedInfo?.style,
    highlight_focus: metadata.collectedInfo?.highlight_focus,
    commitment_level: metadata.collectedInfo?.commitment_level,
    target_audience: metadata.collectedInfo?.target_audience
  },
  
  // 信息收集阶段的详细数据
  collected_data: session.collectedData,
  
  // 工具调用的元数据
  collection_metadata: {
    total_tool_calls: metadata.totalToolCalls,
    collection_confidence: metadata.collectionConfidence,
    data_completeness: metadata.dataCompleteness
  }
};
```

### 2. **修正字段映射**

```typescript
const userGoal = metadata.collectedInfo?.use_case || '创建个人主页';
const userType = metadata.collectedInfo?.user_role || '专业人士';
```

### 3. **增强工具结果传递**

```typescript
const enhancedToolResults = {
  raw_results: contentDisplayAnalysis.rule_engine_analyses,
  analysis_summary: contentDisplayAnalysis.ai_analysis,
  quality_metrics: {
    total_sources: contentDisplayAnalysis.ai_analysis?.content_analysis?.total_sources,
    accessible_sources: contentDisplayAnalysis.ai_analysis?.content_analysis?.accessible_sources,
    quality_score: contentDisplayAnalysis.ai_analysis?.content_analysis?.content_quality_score
  }
};
```

## 🎯 建议的完整数据结构

```typescript
const prompt = formatPrompt(DESIGN_AGENT_PROMPT, {
  collected_user_info: JSON.stringify({
    // Welcome 阶段分析
    welcome_analysis: {
      user_role: metadata.collectedInfo?.user_role,
      use_case: metadata.collectedInfo?.use_case,
      style_preference: metadata.collectedInfo?.style,
      highlight_focus: metadata.collectedInfo?.highlight_focus,
      commitment_level: metadata.collectedInfo?.commitment_level
    },
    
    // 详细收集数据
    personal_info: session.collectedData?.personal || {},
    professional_info: session.collectedData?.professional || {},
    experience: session.collectedData?.experience || [],
    education: session.collectedData?.education || [],
    projects: session.collectedData?.projects || [],
    achievements: session.collectedData?.achievements || [],
    
    // 收集过程元数据
    collection_metadata: {
      total_tool_calls: metadata.totalToolCalls || 0,
      data_sources: metadata.toolResults?.map(r => r.tool_name) || [],
      collection_timestamp: metadata.lastToolExecution
    }
  }, null, 2),
  
  user_goal: metadata.collectedInfo?.use_case || '创建个人主页',
  user_type: metadata.collectedInfo?.user_role || '专业人士',
  tool_results: JSON.stringify(enhancedToolResults, null, 2),
  content_display_analysis: JSON.stringify(contentDisplayAnalysis, null, 2),
  content_quality_assessment: JSON.stringify({
    overall_score: contentDisplayAnalysis.ai_analysis?.content_analysis?.content_quality_score || 7,
    completeness_level: contentDisplayAnalysis.ai_analysis?.content_analysis?.completeness_level || 'medium',
    data_richness: calculateDataRichness(session.collectedData, metadata.collectedInfo),
    source_diversity: contentDisplayAnalysis.ai_analysis?.content_analysis?.total_sources || 0
  }, null, 2)
});
```

## 📋 结论

**当前状态**: ❌ **数据不完整**

传递的6个变量**没有**包含所有阶段的完整信息：

1. **Welcome 阶段的核心分析结果缺失** - 用户角色、使用场景、风格偏好等关键信息
2. **字段映射错误** - `user_goal` 和 `user_type` 的提取逻辑不正确
3. **元数据缺失** - 收集过程的质量评估和置信度信息缺失

**需要修复** 以确保 AI 能够基于完整的用户画像和收集信息生成准确的个性化设计方案。


