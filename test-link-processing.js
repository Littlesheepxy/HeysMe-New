#!/usr/bin/env node

/**
 * 智能链接处理系统测试脚本
 * 测试GitHub和网页抓取功能
 */

// 由于这是TypeScript项目，我们需要先编译或使用ts-node
// 这里创建一个简化的测试版本

console.log('📋 智能链接处理系统 - 依赖验证测试');
console.log('=====================================');

// 测试核心依赖是否正确安装
async function testDependencies() {
  const dependencies = [
    '@octokit/rest',
    'cheerio', 
    'metascraper',
    'metascraper-title',
    'metascraper-description',
    'pdf-parse',
    'mammoth',
    'xlsx'
  ];
  
  console.log('\n🔍 检查核心依赖...');
  
  for (const dep of dependencies) {
    try {
      require(dep);
      console.log(`✅ ${dep} - 已安装`);
    } catch (error) {
      console.log(`❌ ${dep} - 未安装或有问题`);
    }
  }
}

// 测试GitHub API连接
async function testGitHubAPI() {
  console.log('\n🐙 测试GitHub API连接...');
  
  try {
    const { Octokit } = require('@octokit/rest');
    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN || undefined
    });
    
    // 测试基本API调用
    const { data } = await octokit.rest.users.getByUsername({
      username: 'octocat'
    });
    
    console.log(`✅ GitHub API连接成功`);
    console.log(`测试用户: ${data.login} (${data.name})`);
    console.log(`公开仓库: ${data.public_repos}`);
    
  } catch (error) {
    console.log(`❌ GitHub API测试失败: ${error.message}`);
    if (error.status === 403) {
      console.log('💡 提示: 可能是API限制，建议设置GITHUB_TOKEN环境变量');
    }
  }
}

// 测试网页抓取
async function testWebScraping() {
  console.log('\n🌐 测试网页抓取功能...');
  
  try {
    const cheerio = require('cheerio');
    const metascraper = require('metascraper')([
      require('metascraper-title')(),
      require('metascraper-description')(),
    ]);
    
    // 简单的网页抓取测试
    const testUrl = 'https://github.com/octocat';
    console.log(`测试URL: ${testUrl}`);
    
    const response = await fetch(testUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HeysMe/1.0)' },
      signal: AbortSignal.timeout(10000)
    });
    
    if (response.ok) {
      const html = await response.text();
      const $ = cheerio.load(html);
      const metadata = await metascraper({ html, url: testUrl });
      
      console.log(`✅ 网页抓取成功`);
      console.log(`标题: ${metadata.title}`);
      console.log(`描述: ${metadata.description?.substring(0, 100)}...`);
      
      // 测试社交链接提取
      const socialLinks = [];
      $('a[href*="github.com"], a[href*="twitter.com"], a[href*="linkedin.com"]').each((_, el) => {
        const href = $(el).attr('href');
        if (href) socialLinks.push(href);
      });
      
      console.log(`社交链接数量: ${socialLinks.length}`);
      
    } else {
      console.log(`❌ 网页请求失败: HTTP ${response.status}`);
    }
    
  } catch (error) {
    console.log(`❌ 网页抓取测试失败: ${error.message}`);
  }
}

// 测试文档解析
async function testDocumentParsing() {
  console.log('\n📄 测试文档解析功能...');
  
  try {
    const pdfParse = require('pdf-parse');
    const mammoth = require('mammoth');
    const xlsx = require('xlsx');
    
    console.log(`✅ PDF解析库 (pdf-parse) - 已加载`);
    console.log(`✅ Word解析库 (mammoth) - 已加载`);
    console.log(`✅ Excel解析库 (xlsx) - 已加载`);
    
  } catch (error) {
    console.log(`❌ 文档解析库测试失败: ${error.message}`);
  }
}

async function main() {
  await testDependencies();
  await testGitHubAPI();
  await testWebScraping();
  await testDocumentParsing();
  
  console.log('\n✨ 依赖验证完成！');
  console.log('=====================================');
  console.log('💡 下一步: 使用 npx ts-node 或编译TypeScript文件来测试完整服务');
}

// 运行测试
if (require.main === module) {
  main().catch(console.error);
} 