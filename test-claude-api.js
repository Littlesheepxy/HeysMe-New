#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });

async function testClaudeAPI() {
  console.log('🧪 开始测试 Claude API...\n');
  
  // 检查 API Key
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.log('❌ 未找到 ANTHROPIC_API_KEY 环境变量');
    process.exit(1);
  }
  
  console.log('✅ API Key 已配置:', apiKey.substring(0, 20) + '...');
  
  try {
    // 测试 API 调用
    console.log('\n📡 正在调用 Claude API...');
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 100,
        messages: [
          {
            role: 'user',
            content: '请简单回答：你好，这是一个API测试'
          }
        ]
      })
    });
    
    console.log('📊 响应状态:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ API 调用失败:');
      console.log('错误详情:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('\n✅ API 调用成功!');
    console.log('🤖 Claude 回复:', data.content[0].text);
    console.log('📈 使用统计:', {
      输入tokens: data.usage.input_tokens,
      输出tokens: data.usage.output_tokens
    });
    
  } catch (error) {
    console.log('❌ 网络错误:', error.message);
  }
}

testClaudeAPI(); 