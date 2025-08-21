#!/usr/bin/env node

/**
 * 信息收集 Agent 测试脚本
 * 使用方法: node scripts/test-info-collection-agent.js
 */

const readline = require('readline')

// 配置
const API_BASE_URL = 'http://localhost:3000'
const TEST_API_URL = `${API_BASE_URL}/api/test/info-collection`

// 创建命令行接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

// 测试会话数据
let sessionData = {
  id: `test-session-${Date.now()}`,
  metadata: {}
}

// Welcome 数据配置
const welcomeData = {
  user_role: '软件工程师',
  use_case: '个人简历', 
  commitment_level: '认真制作',
  style: '现代简约'
}

console.log('🧪 信息收集 Agent 测试工具')
console.log('=' .repeat(50))
console.log(`📊 会话ID: ${sessionData.id}`)
console.log(`👤 用户角色: ${welcomeData.user_role}`)
console.log(`🎯 使用目的: ${welcomeData.use_case}`)
console.log(`⚡ 承诺级别: ${welcomeData.commitment_level}`)
console.log('=' .repeat(50))
console.log('💡 测试建议:')
console.log('   - 发送 GitHub 链接测试工具调用')
console.log('   - 发送多轮对话测试结束条件')
console.log('   - 输入 "reset" 重置会话')
console.log('   - 输入 "quit" 退出')
console.log('=' .repeat(50))

async function testAgent(userInput) {
  try {
    console.log(`\n🤖 [${new Date().toLocaleTimeString()}] 正在处理...`)
    
    const response = await fetch(TEST_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_input: userInput,
        session_data: sessionData,
        welcome_data: welcomeData
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    let accumulatedResponse = ''

    if (reader) {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6)
            if (dataStr === '[DONE]') continue
            
            try {
              const data = JSON.parse(dataStr)
              
              if (data.immediate_display?.reply) {
                process.stdout.write(data.immediate_display.reply)
                accumulatedResponse += data.immediate_display.reply
              }

              // 更新会话状态
              if (data.system_state?.metadata) {
                sessionData.metadata = {
                  ...sessionData.metadata,
                  ...data.system_state.metadata
                }
              }

              // 显示系统状态
              if (data.system_state) {
                const state = data.system_state
                if (state.intent && state.intent !== 'collecting') {
                  console.log(`\n\n📊 [状态] ${state.intent} | 进度: ${state.progress}% | 阶段: ${state.current_stage}`)
                  
                  if (state.metadata?.tool_calls_executed) {
                    console.log(`🔧 [工具] 执行了 ${state.metadata.tool_calls_executed} 个工具`)
                  }
                }
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }
    }

    console.log('\n')
    
    // 显示会话状态摘要
    const metadata = sessionData.metadata
    if (metadata) {
      console.log('📈 [会话状态]')
      console.log(`   欢迎消息: ${metadata.infoCollectionWelcomeSent ? '✅ 已发送' : '❌ 未发送'}`)
      console.log(`   收集信息: ${Object.keys(metadata.collectedInfo || {}).length} 项`)
      console.log(`   工具结果: ${(metadata.toolResults || []).length} 个`)
    }

  } catch (error) {
    console.error(`\n❌ 测试失败: ${error.message}`)
  }
}

function resetSession() {
  sessionData = {
    id: `test-session-${Date.now()}`,
    metadata: {}
  }
  console.log(`\n🔄 会话已重置: ${sessionData.id}`)
}

function promptUser() {
  rl.question('\n💬 你: ', async (input) => {
    const trimmedInput = input.trim()
    
    if (trimmedInput === 'quit' || trimmedInput === 'exit') {
      console.log('\n👋 再见!')
      rl.close()
      return
    }
    
    if (trimmedInput === 'reset') {
      resetSession()
      promptUser()
      return
    }
    
    if (trimmedInput === '') {
      console.log('❌ 请输入消息')
      promptUser()
      return
    }
    
    console.log('=' .repeat(50))
    await testAgent(trimmedInput)
    console.log('=' .repeat(50))
    
    promptUser()
  })
}

// 开始交互
promptUser()
