/**
 * 网页截图 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { userSandboxes } from '../create/route';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      url, 
      width = 1280, 
      height = 720, 
      fullPage = false,
      waitFor = 2000 
    } = body;

    if (!url) {
      return NextResponse.json({
        success: false,
        error: 'MISSING_URL',
        message: '必须提供URL'
      }, { status: 400 });
    }

    const sandboxService = userSandboxes.get(userId);
    
    if (!sandboxService) {
      return NextResponse.json({
        success: false,
        error: 'NO_SANDBOX',
        message: '沙盒不存在'
      }, { status: 400 });
    }

    console.log('📸 [Screenshot] 截取网页:', url);

    const sandbox = (sandboxService as any).sandbox;
    
    // 安装 puppeteer（如果尚未安装）
    const installResult = await sandbox.commands.run(
      'cd /home/user && npm list puppeteer 2>/dev/null || npm install puppeteer',
      { timeoutMs: 60000 }
    );

    // 创建截图脚本
    const screenshotScript = `
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: ${width}, height: ${height} });
  
  try {
    await page.goto('${url}', { waitUntil: 'networkidle0', timeout: 30000 });
    await page.waitForTimeout(${waitFor});
    
    const screenshot = await page.screenshot({
      fullPage: ${fullPage},
      encoding: 'base64'
    });
    
    console.log('SCREENSHOT_SUCCESS:' + screenshot);
  } catch (error) {
    console.log('SCREENSHOT_ERROR:' + error.message);
  } finally {
    await browser.close();
  }
})();
`;

    // 写入脚本文件
    await sandbox.files.write('/tmp/screenshot.js', screenshotScript);

    // 执行截图
    const result = await sandbox.commands.run(
      'cd /home/user && node /tmp/screenshot.js',
      { timeoutMs: 60000 }
    );

    if (result.stdout.includes('SCREENSHOT_SUCCESS:')) {
      const base64Data = result.stdout.split('SCREENSHOT_SUCCESS:')[1].trim();
      
      return NextResponse.json({
        success: true,
        message: '网页截图成功',
        screenshot: {
          url,
          data: base64Data,
          format: 'png',
          width,
          height,
          fullPage,
          size: Math.round(base64Data.length * 0.75) // 估算文件大小
        },
        timestamp: new Date().toISOString()
      });
    } else {
      const errorMessage = result.stdout.includes('SCREENSHOT_ERROR:') 
        ? result.stdout.split('SCREENSHOT_ERROR:')[1].trim()
        : result.stderr;

      return NextResponse.json({
        success: false,
        error: 'SCREENSHOT_FAILED',
        message: '网页截图失败',
        details: errorMessage
      }, { status: 500 });
    }

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'SCREENSHOT_REQUEST_FAILED',
      message: '截图请求处理失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
