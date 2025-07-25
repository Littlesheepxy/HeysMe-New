const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testSupabaseConnection() {
  console.log('🔍 Supabase连接诊断开始...\n');
  
  // 1. 检查环境变量
  console.log('📋 环境变量检查:');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log(`  URL: ${url ? '✅ 已配置' : '❌ 缺失'}`);
  console.log(`  Service Key: ${serviceKey ? '✅ 已配置' : '❌ 缺失'}`);
  console.log(`  Anon Key: ${anonKey ? '✅ 已配置' : '❌ 缺失'}\n`);
  
  if (!url || !serviceKey) {
    console.log('❌ 关键环境变量缺失，无法继续测试');
    return;
  }
  
  // 2. 创建客户端并测试连接
  console.log('🔌 测试数据库连接...');
  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false }
  });
  
  try {
    // 3. 测试基本连接
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.log(`❌ 连接失败: ${error.message}\n`);
      
      // 检查具体错误类型
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        console.log('💡 可能的解决方案:');
        console.log('   1. 确保已在Supabase中执行了 chat-sessions-tables.sql');
        console.log('   2. 检查表名是否正确');
      } else if (error.message.includes('permission') || error.message.includes('policy')) {
        console.log('💡 可能的解决方案:');
        console.log('   1. 检查RLS策略配置');
        console.log('   2. 确保Service Role Key有足够权限');
      }
      return;
    }
    
    console.log('✅ 数据库连接成功\n');
    
    // 4. 测试表结构
    console.log('📊 检查表结构...');
    
    const tables = ['chat_sessions', 'conversation_entries', 'agent_flows'];
    for (const table of tables) {
      try {
        const { error: tableError } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (tableError) {
          console.log(`❌ 表 ${table}: ${tableError.message}`);
        } else {
          console.log(`✅ 表 ${table}: 可访问`);
        }
      } catch (err) {
        console.log(`❌ 表 ${table}: ${err.message}`);
      }
    }
    
    // 5. 测试插入操作
    console.log('\n🧪 测试插入操作...');
    const testSessionId = `test-session-${Date.now()}`;
    
    try {
      const { error: insertError } = await supabase
        .from('chat_sessions')
        .insert({
          id: testSessionId,
          user_id: 'test-user',
          status: 'active',
          user_intent: {},
          personalization: {},
          collected_data: {},
          metadata: {}
        });
      
      if (insertError) {
        console.log(`❌ 插入测试失败: ${insertError.message}`);
        
        if (insertError.message.includes('foreign key') || insertError.message.includes('users')) {
          console.log('💡 可能的解决方案:');
          console.log('   1. 确保 users 表存在');
          console.log('   2. 或者暂时移除外键约束进行测试');
        }
      } else {
        console.log('✅ 插入测试成功');
        
        // 清理测试数据
        await supabase
          .from('chat_sessions')
          .delete()
          .eq('id', testSessionId);
        console.log('✅ 测试数据已清理');
      }
    } catch (err) {
      console.log(`❌ 插入测试异常: ${err.message}`);
    }
    
  } catch (err) {
    console.log(`❌ 连接测试异常: ${err.message}`);
    
    if (err.message.includes('fetch')) {
      console.log('💡 可能的解决方案:');
      console.log('   1. 检查网络连接');
      console.log('   2. 确认Supabase项目URL正确');
      console.log('   3. 检查防火墙设置');
    }
  }
  
  console.log('\n🏁 诊断完成');
}

testSupabaseConnection().catch(console.error); 