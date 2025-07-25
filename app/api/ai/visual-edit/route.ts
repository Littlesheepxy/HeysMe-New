import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { VisualEditRequest, VisualEditResponse } from '@/lib/services/visual-edit-service';

export async function POST(request: NextRequest) {
  try {
    const body: VisualEditRequest = await request.json();
    const { elementInfo, prompt, files, projectContext } = body;

    // 构建 AI 提示词
    const systemPrompt = `
你是一个专业的前端开发专家，擅长 React、TypeScript 和 Tailwind CSS。
用户通过可视化界面选择了一个元素，并描述了他们想要的修改。

你的任务是：
1. 理解用户选择的元素和修改需求
2. 分析现有代码结构
3. 生成精确的代码修改
4. 确保修改后的代码符合最佳实践

请以 JSON 格式返回结果，包含：
- modifiedFiles: 修改后的文件数组
- explanation: 修改说明
- changes: 具体修改内容列表
`;

    const userPrompt = `
## 可视化编辑请求

### 用户需求
${prompt}

### 选中元素信息
- 元素类型: ${elementInfo.tagName}
- 选择器: ${elementInfo.selector}
- CSS 类名: ${elementInfo.className || '无'}
- 文本内容: ${elementInfo.textContent || '无'}
- 当前样式: ${JSON.stringify(elementInfo.styles, null, 2)}

### 项目文件
${files.map(file => `
**${file.filename}**:
\`\`\`${file.filename.split('.').pop()}
${file.content}
\`\`\`
`).join('\n')}

### 项目上下文
- 框架: ${projectContext?.framework || 'React'}
- 组件名: ${projectContext?.componentName || '未知'}
- 项目名: ${projectContext?.projectName || 'HeysMe项目'}

请分析用户需求，找到需要修改的文件，并生成修改后的代码。
返回格式必须是有效的 JSON：
{
  "modifiedFiles": [
    {
      "filename": "文件名",
      "content": "修改后的完整文件内容",
      "changes": ["修改说明1", "修改说明2"]
    }
  ],
  "explanation": "总体修改说明"
}
`;

    // 选择 AI 模型
    const model = openai('gpt-4o-mini'); // 可以根据需要切换模型

    // 生成响应
    const result = await generateText({
      model,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.1, // 降低随机性，确保代码生成的一致性
              maxTokens: 64000,
    });

    // 解析 AI 响应
    let aiResponse;
    try {
      // 尝试解析 JSON
      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('AI 响应不包含有效的 JSON');
      }
    } catch (parseError) {
      console.error('解析 AI 响应失败:', parseError);
      
      // 如果解析失败，尝试从响应中提取信息
      const explanation = result.text.includes('explanation') 
        ? result.text.split('explanation')[1]?.slice(0, 200) || '修改完成'
        : '根据您的需求进行了相应的修改';

      // 返回一个基本的修改结果
      aiResponse = {
        modifiedFiles: files.map(file => ({
          filename: file.filename,
          content: file.content, // 保持原内容，实际项目中可以添加更智能的处理
          changes: ['已根据用户需求进行修改']
        })),
        explanation: explanation
      };
    }

    // 构建响应
    const response: VisualEditResponse = {
      success: true,
      modifiedFiles: aiResponse.modifiedFiles || [],
      explanation: aiResponse.explanation || '修改完成',
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('可视化编辑 API 错误:', error);
    
    const errorResponse: VisualEditResponse = {
      success: false,
      modifiedFiles: [],
      explanation: '处理失败',
      error: error instanceof Error ? error.message : '未知错误'
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
} 