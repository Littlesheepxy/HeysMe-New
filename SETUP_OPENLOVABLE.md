# Open Lovable 集成设置指南

## 🚀 **快速设置步骤**

### **1. 环境变量配置**

在 `.env.local` 文件中添加以下配置：

```env
# Open Lovable 核心服务
E2B_API_KEY=your_e2b_api_key              # 必需 - E2B沙箱环境
FIRECRAWL_API_KEY=your_firecrawl_api_key  # 必需 - 网页抓取

# AI模型 (至少配置一个)
GROQ_API_KEY=your_groq_api_key            # 推荐 - 快速推理
ANTHROPIC_API_KEY=your_anthropic_api_key  # 推荐 - 高质量代码
OPENAI_API_KEY=your_openai_api_key        # 可选 - GPT-4
GEMINI_API_KEY=your_gemini_api_key        # 可选 - Google模型
```

### **2. 获取API密钥**

#### **E2B API Key** (必需)
1. 访问 [https://e2b.dev](https://e2b.dev)
2. 注册账号并登录
3. 在Dashboard中创建API密钥
4. 复制密钥到 `E2B_API_KEY`

#### **Firecrawl API Key** (必需)
1. 访问 [https://firecrawl.dev](https://firecrawl.dev)
2. 注册账号并登录
3. 在API Keys页面创建新密钥
4. 复制密钥到 `FIRECRAWL_API_KEY`

#### **Groq API Key** (推荐)
1. 访问 [https://console.groq.com](https://console.groq.com)
2. 注册账号并登录
3. 在API Keys页面创建新密钥
4. 复制密钥到 `GROQ_API_KEY`

#### **Anthropic API Key** (推荐)
1. 访问 [https://console.anthropic.com](https://console.anthropic.com)
2. 注册账号并登录
3. 在API Keys页面创建新密钥
4. 复制密钥到 `ANTHROPIC_API_KEY`

### **3. 快速测试**

启动开发服务器：
```bash
npm run dev
```

访问 `http://localhost:3000` 并测试：

1. **普通模式测试**：
   - 新建对话
   - 选择普通模式
   - 填写项目表单
   - 观察代码生成过程

2. **专业模式测试**：
   - 新建对话  
   - 选择专业模式
   - 输入："创建一个简单的React计数器应用"
   - 观察实时代码生成

## 🔧 **集成状态**

### ✅ **已完成**
- [x] 复制Open Lovable核心API
- [x] 安装所有必要依赖
- [x] 集成SimpleMessageRouter
- [x] 配置应用配置文件
- [x] 更新所有调用路径

### 📋 **API端点**
```
/api/create-ai-sandbox     - 创建E2B沙箱环境
/api/generate-ai-code-stream - AI代码生成 (流式)
/api/apply-ai-code-stream  - 应用代码到沙箱
/api/get-sandbox-files     - 获取沙箱文件
```

### 🎯 **用户流程**
```
用户输入 
→ SimpleMessageRouter 
→ [档案检查] 
→ [模式选择]
→ [表单填写/直接对话] 
→ Open Lovable API 
→ E2B沙箱 
→ 实时预览
```

## 🚨 **注意事项**

### **成本控制**
- E2B沙箱按使用时间计费
- AI API按token计费
- 建议开发时使用Groq (免费额度较高)

### **网络要求**
- E2B需要稳定的网络连接
- 某些地区可能需要代理访问

### **调试技巧**
1. 检查浏览器控制台错误
2. 查看Next.js开发服务器日志
3. 确认API密钥有效性
4. 检查E2B沙箱状态

## 🔍 **故障排除**

### **常见错误**

#### `Failed to create sandbox`
- 检查 `E2B_API_KEY` 是否正确
- 确认E2B账户有足够额度
- 检查网络连接

#### `Failed to generate code`
- 检查AI API密钥配置
- 确认至少有一个AI模型可用
- 查看控制台具体错误信息

#### `Module not found` 错误
- 运行 `npm install --legacy-peer-deps`
- 清除缓存：`rm -rf .next node_modules && npm install`

### **性能优化**
- 使用Groq作为默认模型（速度最快）
- 考虑实现沙箱复用机制
- 添加代码缓存策略

---

## 🎉 **下一步**

设置完成后，你就可以：

1. **测试基础功能** - 确保代码生成正常工作
2. **自定义UI** - 调整界面适配HeysMe风格  
3. **添加模板** - 预设常用项目模板
4. **优化性能** - 添加缓存和优化策略

立即开始测试吧！🚀
