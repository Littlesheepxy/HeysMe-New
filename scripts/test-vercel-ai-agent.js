#!/usr/bin/env node

/**
 * Vercel AI Agent 工具调用测试脚本
 * 用于验证各个工具是否正常工作
 */

const { VercelAIInfoCollectionAgent } = require('../lib/agents/info-collection/vercel-ai-agent');

async function testAgent() {
  console.log('🧪 开始测试 Vercel AI Agent...\n');
  
  const agent = new VercelAIInfoCollectionAgent();
  
  // 模拟会话数据
  const mockSessionData = {
    id: `test-session-${Date.now()}`,
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
  };

  // 测试用例
  const testCases = [
    {
      name: 'GitHub 用户分析',
      input: 'https://github.com/vercel',
      description: '测试 GitHub 用户和仓库分析功能'
    },
    {
      name: '网站内容抓取',
      input: 'https://vercel.com',
      description: '测试网页内容抓取和分析功能'
    },
    {
      name: '综合信息收集',
      input: '我是一名全栈开发工程师，擅长 React、Node.js 和 Python。我的 GitHub 是 https://github.com/example',
      description: '测试多源信息综合分析功能'
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n📋 测试: ${testCase.name}`);
    console.log(`📝 描述: ${testCase.description}`);
    console.log(`🔍 输入: ${testCase.input}`);
    console.log('─'.repeat(60));
    
    try {
      const startTime = Date.now();
      const responses = [];
      
      // 收集所有响应
      for await (const response of agent.process(
        { user_input: testCase.input }, 
        mockSessionData
      )) {
        responses.push(response);
        
        // 显示进度
        if (response.immediate_display?.reply) {
          console.log(`💬 ${response.immediate_display.reply.substring(0, 100)}...`);
        }
        
        if (response.system_state?.current_stage) {
          console.log(`📊 阶段: ${response.system_state.current_stage} (${response.system_state.progress}%)`);
        }
        
        if (response.system_state?.metadata?.tools_used) {
          console.log(`🔧 工具: ${response.system_state.metadata.tools_used.join(', ')}`);
        }
      }
      
      const executionTime = Date.now() - startTime;
      
      console.log(`✅ 测试完成 (${executionTime}ms)`);
      console.log(`📊 响应数量: ${responses.length}`);
      
      const finalResponse = responses[responses.length - 1];
      if (finalResponse?.system_state?.done) {
        console.log(`🎯 最终状态: ${finalResponse.system_state.intent}`);
      }
      
    } catch (error) {
      console.error(`❌ 测试失败: ${error.message}`);
      console.error(error.stack);
    }
    
    console.log('═'.repeat(60));
  }
  
  console.log('\n🏁 所有测试完成！');
}

// 运行测试
if (require.main === module) {
  testAgent().catch(console.error);
}

module.exports = { testAgent };
