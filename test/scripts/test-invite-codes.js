#!/usr/bin/env node

// 邀请码功能测试脚本
// 使用方法: node scripts/test-invite-codes.js

const baseUrl = 'http://localhost:3000'

async function testInviteCodeAPI() {
  console.log('🧪 开始测试邀请码 API...\n')

  try {
    // 测试1: 验证一个不存在的邀请码
    console.log('1️⃣ 测试验证不存在的邀请码')
    const verifyResponse1 = await fetch(`${baseUrl}/api/invite-codes/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'INVALID123' })
    })
    const verifyResult1 = await verifyResponse1.json()
    console.log('结果:', verifyResult1.success ? '✅ 应该返回错误' : '❌ 正确返回错误')
    console.log('错误信息:', verifyResult1.error)
    console.log()

    // 测试2: 验证邀请码格式
    console.log('2️⃣ 测试邀请码格式验证')
    const testCodes = ['ABC123', 'invalid', '', '12345678', 'TOOLONGCODE123456789']
    testCodes.forEach(code => {
      const isValid = /^[A-Z0-9]{8,20}$/.test(code)
      console.log(`${code.padEnd(20)} -> ${isValid ? '✅ 有效' : '❌ 无效'}`)
    })
    console.log()

    // 测试3: 检查管理员API（需要认证）
    console.log('3️⃣ 测试管理员 API（无认证）')
    const adminResponse = await fetch(`${baseUrl}/api/admin/invite-codes/generate`)
    const adminResult = await adminResponse.json()
    console.log('状态:', adminResponse.status)
    console.log('结果:', adminResult.success ? '❌ 应该需要认证' : '✅ 正确要求认证')
    console.log('错误信息:', adminResult.error)
    console.log()

    console.log('🎉 基本 API 测试完成！')
    console.log('\n📋 后续手动测试步骤:')
    console.log('1. 设置管理员权限（见 docs/INVITE_CODES_SETUP.md）')
    console.log('2. 登录管理员账户')
    console.log('3. 访问 /admin/invite-codes 生成邀请码')
    console.log('4. 访问 /sign-up 测试邀请码注册流程')

  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error.message)
    console.log('\n🔧 请确保:')
    console.log('1. 开发服务器正在运行 (npm run dev)')
    console.log('2. 数据库表已正确创建')
    console.log('3. 环境变量已正确配置')
  }
}

// 测试邀请码验证函数
function testInviteCodeValidation() {
  console.log('\n🔍 测试邀请码验证函数:')
  
  const validateInviteCode = (code) => {
    const regex = /^[A-Z0-9]{8,20}$/
    return regex.test(code)
  }

  const formatInviteCode = (code) => {
    return code.replace(/(.{4})/g, '$1 ').trim()
  }

  const testCases = [
    'ABCD1234',
    'TEST123456789',
    'short',
    'TOOLONGCODE123456789EXTRA',
    'invalid-chars',
    'lowercase',
    '12345678'
  ]

  testCases.forEach(code => {
    const isValid = validateInviteCode(code)
    const formatted = isValid ? formatInviteCode(code) : '无效格式'
    console.log(`${code.padEnd(25)} -> ${isValid ? '✅' : '❌'} ${formatted}`)
  })
}

// 运行测试
async function runTests() {
  console.log('🎫 HeysMe 邀请码系统测试\n')
  
  // 测试验证函数
  testInviteCodeValidation()
  
  // 测试 API
  await testInviteCodeAPI()
}

runTests()
