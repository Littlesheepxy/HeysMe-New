import { AgentOrchestrator } from '@/lib/utils/agent-orchestrator';
import { SessionData } from '@/lib/types/session';

/**
 * 优化后多Agent系统使用示例
 * 展示从欢迎到代码生成的完整流程
 */

/**
 * 示例1: 开发者用户的完整流程
 */
export async function developerFlowExample() {
  const orchestrator = new AgentOrchestrator();
  const sessionId = 'dev_session_001';
  
  console.log('🚀 开始开发者简历生成流程...\n');

  // 第一步：用户初始输入
  const userInput = '我是一个有5年经验的全栈开发者，想要创建一个专业的简历网站来展示我的技术能力和项目经验';
  
  console.log('👤 用户输入:', userInput);
  console.log('\n--- 开始Agent处理流程 ---\n');

  try {
    for await (const response of orchestrator.processUserInputStreaming(sessionId, userInput)) {
      console.log(`🤖 [${response.immediate_display?.agent_name}]`, response.immediate_display?.reply);
      
      if (response.system_state?.progress) {
        console.log(`📊 进度: ${response.system_state.progress}% - ${response.system_state.current_stage}`);
      }
      
      console.log('---');

      // 如果需要用户交互，模拟用户响应
      if (response.interaction) {
        const mockResponse = generateMockUserResponse(response.interaction);
        console.log('👤 模拟用户响应:', mockResponse);
        
        // 这里可以处理用户交互
        // await orchestrator.handleUserInteraction(sessionId, 'interaction', mockResponse, sessionData);
      }

      if (response.system_state?.done) {
        console.log('✅ 流程完成!');
        break;
      }
    }
  } catch (error) {
    console.error('❌ 处理过程中出现错误:', error);
  }
}

/**
 * 示例2: 设计师用户的快速流程
 */
export async function designerFlowExample() {
  const orchestrator = new AgentOrchestrator();
  const sessionId = 'designer_session_001';
  
  console.log('🎨 开始设计师作品集生成流程...\n');

  const userInput = '我是UI/UX设计师，需要一个视觉效果突出的作品集网站，要能很好地展示我的设计案例';
  
  console.log('👤 用户输入:', userInput);
  console.log('\n--- 开始处理 ---\n');

  try {
    for await (const response of orchestrator.processUserInputStreaming(sessionId, userInput)) {
      console.log(`🤖 [${response.immediate_display?.agent_name}]`, 
        response.immediate_display?.reply?.substring(0, 100) + '...');
      
      if (response.system_state?.current_stage) {
        console.log(`📍 当前阶段: ${response.system_state.current_stage}`);
      }

      if (response.system_state?.done) {
        console.log('✅ 设计师作品集生成完成!');
        break;
      }
    }
  } catch (error) {
    console.error('❌ 错误:', error);
  }
}

/**
 * 示例3: 产品经理的详细信息收集
 */
export async function productManagerDetailedExample() {
  const orchestrator = new AgentOrchestrator();
  const sessionData = createMockSessionData('pm_session_001');
  
  console.log('📊 开始产品经理简历详细收集流程...\n');

  // 步骤1: Welcome Agent
  console.log('=== 步骤1: 欢迎和意图识别 ===');
  const welcomeInput = '我是产品经理，想要制作一个能突出我项目管理能力和数据分析技能的简历';
  
  for await (const response of orchestrator.processUserInputStreaming('pm_001', welcomeInput, sessionData)) {
    console.log('Welcome Agent:', response.immediate_display?.reply);
    
    if (response.system_state?.intent === 'advance') {
      console.log('✅ 用户意图识别完成，进入信息收集阶段');
      break;
    }
  }

  // 步骤2: 模拟详细信息收集
  console.log('\n=== 步骤2: 信息收集 ===');
  const infoInput = `我的详细信息：
  - 姓名：张小明
  - 职位：高级产品经理
  - 经验：8年产品管理经验
  - 公司：阿里巴巴、字节跳动
  - 技能：数据分析、用户研究、项目管理、Axure、Figma
  - 项目：负责过DAU千万级产品的0-1搭建`;

  sessionData.metadata.progress.currentStage = 'info_collection';
  
  for await (const response of orchestrator.processUserInputStreaming('pm_001', infoInput, sessionData)) {
    console.log('Info Collection Agent:', response.immediate_display?.reply?.substring(0, 150) + '...');
    
    if (response.system_state?.done) {
      console.log('✅ 信息收集完成');
      break;
    }
  }

  console.log('\n📋 最终收集的数据:');
  console.log('- 身份类型:', sessionData.personalization.identity.profession);
  console.log('- 收集的技能:', sessionData.collectedData.professional.skills);
  console.log('- 用户目标:', sessionData.userIntent.primary_goal);
}

/**
 * 生成模拟用户响应
 */
function generateMockUserResponse(interaction: any): any {
  // 根据交互类型生成适当的模拟响应
  if (interaction.type === 'choice') {
    return { choice: interaction.elements?.[0]?.id };
  } else if (interaction.type === 'form') {
    return {
      fullName: '张三',
      email: 'zhangsan@example.com',
      profession: 'developer',
      experience: '5年'
    };
  } else if (interaction.type === 'confirmation') {
    return { confirmed: true };
  }
  
  return { response: '继续' };
}

/**
 * 创建模拟会话数据
 */
function createMockSessionData(sessionId: string): SessionData {
  return {
    id: sessionId,
    status: 'active',
    userIntent: {
      type: 'career_guidance',
      target_audience: 'internal_review',
      urgency: 'exploring',
      primary_goal: '了解需求'
    },
    personalization: {
      identity: {
        profession: 'other',
        experience_level: 'mid'
      },
      preferences: {
        style: 'modern',
        tone: 'professional', 
        detail_level: 'detailed'
      },
      context: {}
    },
    collectedData: {
      personal: {},
      professional: { skills: [] },
      experience: [],
      education: [],
      projects: [],
      achievements: [],
      certifications: []
    },
    conversationHistory: [],
    agentFlow: [],
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      lastActive: new Date(),
      version: '1.0.0',
      progress: {
        currentStage: 'welcome',
        completedStages: [],
        totalStages: 4,
        percentage: 0
      },
      metrics: {
        totalTime: 0,
        userInteractions: 0,
        agentTransitions: 0,
        errorsEncountered: 0
      },
      settings: {
        autoSave: true,
        reminderEnabled: false,
        privacyLevel: 'private'
      }
    }
  };
}

/**
 * 性能基准测试
 */
export async function performanceBenchmark() {
  console.log('🔬 开始性能基准测试...\n');
  
  const orchestrator = new AgentOrchestrator();
  const startTime = Date.now();
  
  const testInputs = [
    '我是AI工程师，需要技术型简历',
    '我是设计师，要制作作品集',
    '我是产品经理，需要突出项目管理能力',
    '我是创业者，想要个人品牌网站'
  ];

  for (let i = 0; i < testInputs.length; i++) {
    const sessionId = `benchmark_${i}`;
    const input = testInputs[i];
    
    console.log(`测试 ${i + 1}: ${input}`);
    
    const testStart = Date.now();
    let responseCount = 0;
    
    try {
      for await (const response of orchestrator.processUserInputStreaming(sessionId, input)) {
        responseCount++;
        
        if (response.system_state?.done) {
          break;
        }
        
        // 限制测试时间
        if (Date.now() - testStart > 5000) {
          console.log('⏱️ 测试超时，跳过');
          break;
        }
      }
      
      const testTime = Date.now() - testStart;
      console.log(`✅ 完成，耗时: ${testTime}ms，响应数: ${responseCount}`);
      
    } catch (error) {
      console.log(`❌ 测试失败: ${error}`);
    }
    
    console.log('---');
  }
  
  const totalTime = Date.now() - startTime;
  console.log(`\n🏁 基准测试完成，总耗时: ${totalTime}ms`);
}

/**
 * 运行所有示例
 */
export async function runAllExamples() {
  console.log('🌟 多Agent系统优化示例演示\n');
  console.log('=' .repeat(50));
  
  try {
    await developerFlowExample();
    console.log('\n' + '=' .repeat(50));
    
    await designerFlowExample();
    console.log('\n' + '=' .repeat(50));
    
    await productManagerDetailedExample();
    console.log('\n' + '=' .repeat(50));
    
    await performanceBenchmark();
    
  } catch (error) {
    console.error('示例运行错误:', error);
  }
  
  console.log('\n✨ 所有示例演示完成!');
}

// 如果直接运行此文件
if (require.main === module) {
  runAllExamples();
} 