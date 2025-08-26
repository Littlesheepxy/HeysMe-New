import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 初始化 Supabase 客户端
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    console.log('🗄️ [Supabase测试] 开始测试数据存储');
    
    const body = await request.json();
    const { testId, data, table = 'info_collection_test_results' } = body;

    if (!testId || !data) {
      return NextResponse.json(
        { error: '缺少必要参数: testId 或 data' },
        { status: 400 }
      );
    }

    // 准备存储的数据
    const storageData = {
      test_id: testId,
      test_timestamp: new Date().toISOString(),
      agent_type: 'vercel_ai_info_collection',
      input_data: data.input || null,
      response_data: data.responses || data,
      tools_used: data.toolsUsed || [],
      execution_time: data.executionTime || null,
      success: data.success !== false,
      metadata: {
        session_id: data.sessionId,
        agent_name: data.agentName,
        test_mode: true,
        ...data.metadata
      }
    };

    console.log('📝 [Supabase测试] 准备存储数据到表:', table);

    // 尝试插入数据
    const { data: insertedData, error: insertError } = await supabase
      .from(table)
      .insert(storageData)
      .select()
      .single();

    if (insertError) {
      console.error('❌ [Supabase测试] 插入失败:', insertError);
      
      // 如果表不存在，尝试创建表
      if (insertError.code === '42P01') {
        console.log('📋 [Supabase测试] 表不存在，尝试创建表...');
        
        const createTableResult = await createTestTable(table);
        if (createTableResult.success) {
          // 重新尝试插入
          const { data: retryData, error: retryError } = await supabase
            .from(table)
            .insert(storageData)
            .select()
            .single();

          if (retryError) {
            throw retryError;
          }

          return NextResponse.json({
            success: true,
            data: retryData,
            message: '表创建成功并插入数据',
            table,
            operation: 'insert_after_create'
          });
        }
      }
      
      throw insertError;
    }

    console.log('✅ [Supabase测试] 数据存储成功');

    // 验证数据是否正确存储
    const { data: verifyData, error: verifyError } = await supabase
      .from(table)
      .select('*')
      .eq('test_id', testId)
      .single();

    if (verifyError) {
      console.warn('⚠️ [Supabase测试] 验证查询失败:', verifyError);
    }

    return NextResponse.json({
      success: true,
      data: insertedData,
      verifyData,
      table,
      operation: 'insert',
      message: '数据存储和验证成功'
    });

  } catch (error) {
    console.error('❌ [Supabase测试] 存储失败:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
        details: error,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * 创建测试表
 */
async function createTestTable(tableName: string) {
  try {
    console.log('🔨 [Supabase测试] 创建测试表:', tableName);
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS ${tableName} (
        id SERIAL PRIMARY KEY,
        test_id VARCHAR(255) NOT NULL,
        test_timestamp TIMESTAMPTZ DEFAULT NOW(),
        agent_type VARCHAR(100) NOT NULL,
        input_data JSONB,
        response_data JSONB,
        tools_used TEXT[],
        execution_time INTEGER,
        success BOOLEAN DEFAULT true,
        metadata JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_${tableName}_test_id ON ${tableName}(test_id);
      CREATE INDEX IF NOT EXISTS idx_${tableName}_timestamp ON ${tableName}(test_timestamp);
      CREATE INDEX IF NOT EXISTS idx_${tableName}_agent_type ON ${tableName}(agent_type);
    `;

    const { error } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    
    if (error) {
      console.error('❌ [Supabase测试] 创建表失败:', error);
      return { success: false, error };
    }

    console.log('✅ [Supabase测试] 表创建成功');
    return { success: true };

  } catch (error) {
    console.error('❌ [Supabase测试] 创建表异常:', error);
    return { success: false, error };
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const table = searchParams.get('table') || 'info_collection_test_results';
    const limit = parseInt(searchParams.get('limit') || '10');

    // 查询最近的测试结果
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .order('test_timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data,
      table,
      count: data?.length || 0
    });

  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}
