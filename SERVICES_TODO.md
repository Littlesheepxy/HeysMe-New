# 🚀 HeysMe服务层重构TODO清单

## 📊 项目状态概览

### ✅ 已完成
- [x] 设计模块化服务架构
- [x] 创建GitHub服务 (`lib/services/github-service.ts`)
- [x] 创建网页抓取服务 (`lib/services/web-service.ts`)
- [x] 创建文档处理服务 (`lib/services/document-service.ts`)
- [x] 创建社交平台服务 (`lib/services/social-service.ts`)
- [x] 创建工具函数 (`lib/services/utils/web-utils.ts`)
- [x] 创建统一导出 (`lib/services/index.ts`)

### ⚠️ 需要修复的问题
- [ ] **TypeScript编译错误** - 修复所有linter错误
- [ ] **依赖安装** - 安装必需的npm包
- [ ] **导入导出** - 修正模块引用关系

## 📦 依赖包安装TODO

### 1. GitHub分析相关
```bash
npm install @octokit/rest simple-git
npm install -D @types/simple-git
```

### 2. 网页抓取相关  
```bash
npm install metascraper metascraper-author metascraper-date metascraper-description metascraper-image metascraper-logo metascraper-title metascraper-url cheerio
npm install -D @types/cheerio
```

### 3. 文档处理相关
```bash
npm install pdf-parse mammoth xlsx
npm install -D @types/pdf-parse
```

### 4. 通用工具
```bash
npm install node-cache winston joi validator lodash sharp file-type bad-words url-parse readability sentiment natural wappalyzer
npm install -D @types/lodash @types/validator
```

## 🔧 代码修复TODO

### 1. TypeScript错误修复
- [ ] 修复 `github-service.ts` 中的类型错误
- [ ] 修复 `web-service.ts` 中的模块导入错误
- [ ] 修复 `social-service.ts` 中的Set迭代器问题
- [ ] 修复 `index.ts` 中的导出引用错误

### 2. 功能完善
- [ ] 实现真实的PDF解析（使用pdf-parse）
- [ ] 实现真实的Word文档解析（使用mammoth）
- [ ] 实现真实的Excel解析（使用xlsx）
- [ ] 完善错误处理和重试机制

### 3. 工具集成
- [ ] 集成tool-service与新服务架构
- [ ] 更新Claude工具定义使用新服务
- [ ] 测试所有工具功能

## 🎯 API集成TODO（需要API密钥的服务）

### 需要申请API的服务
> 这些需要用户自行申请API密钥，可以在项目设置中提供配置选项

1. **YouTube Data API v3** 
   - 用途：YouTube频道和视频分析
   - 申请链接：https://developers.google.com/youtube/v3
   - 配置：`YOUTUBE_API_KEY`

2. **Twitter API v2**
   - 用途：Twitter账户分析
   - 申请链接：https://developer.twitter.com/
   - 配置：`TWITTER_BEARER_TOKEN`

3. **Instagram Basic Display API**
   - 用途：Instagram账户基础信息
   - 申请链接：https://developers.facebook.com/docs/instagram-basic-display-api
   - 配置：`INSTAGRAM_ACCESS_TOKEN`

### 开源替代方案（已实现）
- ✅ GitHub分析 - 使用@octokit/rest，无需API密钥
- ✅ 网页抓取 - 使用cheerio+metascraper，完全开源
- ✅ 文档解析 - 使用pdf-parse等，完全开源

## 📋 集成步骤

### 第一步：修复当前代码
```bash
# 1. 安装核心依赖
npm install @octokit/rest cheerio metascraper metascraper-author metascraper-date metascraper-description metascraper-image metascraper-logo metascraper-title metascraper-url

# 2. 修复TypeScript错误
# 检查并修复每个服务文件的导入和类型问题

# 3. 测试服务功能
# 确保每个服务都能正常工作
```

### 第二步：迁移旧代码
```bash
# 1. 备份当前tool-service.ts
cp lib/services/tool-service.ts lib/services/tool-service.ts.backup

# 2. 更新tool-service.ts使用新服务
# 或者创建新的统一服务入口

# 3. 更新Claude工具定义
# 修改lib/agents/info-collection/claude-tools.ts
```

### 第三步：完善功能
```bash
# 1. 添加文档解析真实实现
npm install pdf-parse mammoth xlsx

# 2. 添加高级分析功能
npm install natural sentiment readability

# 3. 添加缓存和性能优化
npm install node-cache
```

## 🚦 优先级建议

### 🔥 高优先级（立即执行）
1. 修复TypeScript编译错误
2. 安装基础依赖包（@octokit/rest, cheerio, metascraper系列）
3. 测试GitHub和网页抓取功能

### 🟡 中优先级（本周内）
1. 完善文档解析功能
2. 集成新服务到现有工具
3. 添加错误处理和日志

### 🔵 低优先级（后期优化）
1. 申请和集成社交媒体API
2. 添加高级分析功能
3. 性能优化和缓存

## 📈 测试计划

### 功能测试
- [ ] GitHub用户分析测试
- [ ] 网页抓取功能测试  
- [ ] 文档解析功能测试
- [ ] 社交媒体链接提取测试

### 集成测试
- [ ] Claude工具调用测试
- [ ] 错误处理测试
- [ ] 性能压力测试

### 用户验收测试
- [ ] 真实用户数据测试
- [ ] 不同平台兼容性测试
- [ ] 用户体验测试

## 🔄 迁移策略

### 渐进式迁移方案
1. **保持向后兼容** - 现有tool-service.ts继续工作
2. **逐步替换** - 新功能使用新服务架构
3. **完全迁移** - 最终废弃旧架构

### 回滚计划
- 保留旧代码备份
- 功能开关控制新旧系统
- 数据库兼容性保证

---

## 📞 开发协作

如有问题或建议，请：
1. 查看此TODO清单的最新状态
2. 在代码中添加详细注释
3. 测试每个功能模块
4. 更新文档和示例

**目标：打造高质量、可维护、高性能的链接分析系统！** 🎯 