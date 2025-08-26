#!/usr/bin/env node

/**
 * 快速测试 GitHub 链接处理
 */

async function quickTest() {
  console.log('🧪 快速测试 GitHub 链接处理...\n');
  
  const testUrl = 'http://localhost:3000/api/test/vercel-ai-agent';
  const testData = {
    input: {
      user_input: 'https://github.com/vercel'
    },
    sessionData: {
      id: `quick-test-${Date.now()}`,
      userId: 'test-user',
      metadata: {
        testMode: true,
        welcomeData: {
          user_role: '软件工程师',
          use_case: '个人展示',
          commitment_level: '认真制作'
        },
        infoCollectionTurns: 0
      }
    }
  };

  try {
    console.log('📤 发送测试请求...');
    console.log('🔗 输入:', testData.input.user_input);
    
    const response = await fetch(testUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    console.log('\n📥 测试结果:');
    console.log('✅ 成功:', result.success);
    console.log('📊 响应数量:', result.responseCount);
    console.log('🔧 使用的工具:', result.toolsUsed);
    
    if (result.responses && result.responses.length > 0) {
      const firstResponse = result.responses[0];
      console.log('\n📝 第一个响应:');
      console.log('🎯 意图:', firstResponse.system_state?.intent);
      console.log('📈 进度:', firstResponse.system_state?.progress + '%');
      console.log('🏷️ 阶段:', firstResponse.system_state?.current_stage);
      
      if (firstResponse.immediate_display?.reply) {
        console.log('\n💬 回复内容:');
        console.log(firstResponse.immediate_display.reply.substring(0, 200) + '...');
      }
    }
    
    // 检查是否直接处理了 GitHub 链接
    const hasToolCalls = result.toolsUsed && result.toolsUsed.length > 0;
    const isWelcomeMessage = result.responses.some(r => 
      r.system_state?.intent === 'welcome_to_info_collection'
    );
    
    console.log('\n🔍 分析结果:');
    console.log('🛠️ 有工具调用:', hasToolCalls ? '是' : '否');
    console.log('👋 是欢迎消息:', isWelcomeMessage ? '是' : '否');
    
    if (isWelcomeMessage && !hasToolCalls) {
      console.log('⚠️ 问题: 仍然返回欢迎消息而不是处理 GitHub 链接');
    } else if (hasToolCalls) {
      console.log('✅ 成功: 直接处理了 GitHub 链接');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 运行测试
if (require.main === module) {
  quickTest().catch(console.error);
}

module.exports = { quickTest };
