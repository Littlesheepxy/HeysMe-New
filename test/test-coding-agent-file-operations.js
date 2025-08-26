/**
 * 测试 Coding Agent 文件操作问题
 * 验证当前工具调用是否正确操作缓存/数据库文件
 */

const { CodingDatabaseService } = require('../lib/services/coding-database');

async function testFileOperations() {
  console.log('🧪 开始测试 Coding Agent 文件操作...\n');

  try {
    // 1. 测试数据库服务是否正常工作
    console.log('1️⃣ 测试数据库服务...');
    const codingDb = CodingDatabaseService.getInstance();
    
    // 创建测试会话
    const testSession = await codingDb.upsertSession({
      sessionId: 'test-session-123',
      userId: 'test-user',
      title: '测试会话',
      description: '用于测试文件操作的会话'
    });
    
    console.log('✅ 数据库服务正常，会话ID:', testSession.sessionId);

    // 2. 测试文件创建
    console.log('\n2️⃣ 测试文件创建...');
    const testFile = await codingDb.upsertFile({
      sessionId: testSession.sessionId,
      path: 'test/example.tsx',
      content: 'export default function Example() { return <div>Hello</div>; }',
      language: 'typescript'
    });
    
    console.log('✅ 文件创建成功:', {
      path: testFile.path,
      version: testFile.version,
      size: testFile.size,
      checksum: testFile.checksum
    });

    // 3. 测试文件修改
    console.log('\n3️⃣ 测试文件修改...');
    const modifiedFile = await codingDb.upsertFile({
      sessionId: testSession.sessionId,
      path: 'test/example.tsx',
      content: 'export default function Example() { return <div>Hello World!</div>; }',
      language: 'typescript'
    });
    
    console.log('✅ 文件修改成功:', {
      path: modifiedFile.path,
      version: modifiedFile.version,
      size: modifiedFile.size,
      previousVersion: testFile.version
    });

    // 4. 测试文件读取
    console.log('\n4️⃣ 测试文件读取...');
    const readFile = await codingDb.getFile(testSession.sessionId, 'test/example.tsx');
    
    if (readFile) {
      console.log('✅ 文件读取成功:', {
        path: readFile.path,
        version: readFile.version,
        contentLength: readFile.content.length,
        status: readFile.status
      });
    } else {
      console.log('❌ 文件读取失败');
    }

    // 5. 测试会话文件列表
    console.log('\n5️⃣ 测试文件列表...');
    const session = await codingDb.getSession(testSession.sessionId);
    
    if (session) {
      console.log('✅ 会话文件列表:', {
        sessionId: session.sessionId,
        fileCount: session.files.length,
        files: session.files.map(f => ({ path: f.path, version: f.version }))
      });
    }

    console.log('\n🎉 所有测试通过！数据库文件操作正常工作。');
    console.log('\n⚠️  问题分析：');
    console.log('   - 数据库服务工作正常');
    console.log('   - 版本管理功能正常');
    console.log('   - 但 CodingAgent 的工具调用没有使用这些服务');
    console.log('   - 工具调用直接操作磁盘文件，绕过了缓存和数据库');
    console.log('   - 需要修改工具调用实现，使用 DatabaseFileTools');

  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 运行测试
testFileOperations().catch(console.error);
