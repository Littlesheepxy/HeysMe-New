/**
 * 增强版网页内容抓取 API
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
      includeText = true,
      includeLinks = true,
      includeImages = true,
      includeMetadata = true,
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

    console.log('🕷️ [Scrape Enhanced] 抓取网页内容:', url);

    const sandbox = (sandboxService as any).sandbox;
    
    // 安装依赖
    const installResult = await sandbox.commands.run(
      'cd /home/user && npm list puppeteer cheerio 2>/dev/null || npm install puppeteer cheerio',
      { timeoutMs: 60000 }
    );

    // 创建抓取脚本
    const scrapeScript = `
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    await page.goto('${url}', { waitUntil: 'networkidle0', timeout: 30000 });
    await page.waitForTimeout(${waitFor});
    
    const html = await page.content();
    const title = await page.title();
    
    // 使用 Cheerio 解析内容
    const $ = cheerio.load(html);
    
    const result = {
      url: '${url}',
      title: title,
      timestamp: new Date().toISOString()
    };
    
    ${includeMetadata ? `
    // 提取元数据
    result.metadata = {
      description: $('meta[name="description"]').attr('content') || '',
      keywords: $('meta[name="keywords"]').attr('content') || '',
      author: $('meta[name="author"]').attr('content') || '',
      ogTitle: $('meta[property="og:title"]').attr('content') || '',
      ogDescription: $('meta[property="og:description"]').attr('content') || '',
      ogImage: $('meta[property="og:image"]').attr('content') || ''
    };
    ` : ''}
    
    ${includeText ? `
    // 提取文本内容
    $('script, style, nav, footer, header, aside').remove();
    const textContent = $('body').text().replace(/\\s+/g, ' ').trim();
    result.text = textContent.substring(0, 5000); // 限制文本长度
    result.textLength = textContent.length;
    ` : ''}
    
    ${includeLinks ? `
    // 提取链接
    result.links = [];
    $('a[href]').each((i, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().trim();
      if (href && text && href !== '#') {
        result.links.push({
          url: href.startsWith('http') ? href : new URL(href, '${url}').href,
          text: text.substring(0, 100),
          internal: href.includes('${new URL(url).hostname}')
        });
      }
    });
    ` : ''}
    
    ${includeImages ? `
    // 提取图片
    result.images = [];
    $('img[src]').each((i, el) => {
      const src = $(el).attr('src');
      const alt = $(el).attr('alt') || '';
      if (src) {
        result.images.push({
          url: src.startsWith('http') ? src : new URL(src, '${url}').href,
          alt: alt.substring(0, 100),
          title: $(el).attr('title') || ''
        });
      }
    });
    ` : ''}
    
    console.log('SCRAPE_SUCCESS:' + JSON.stringify(result));
    
  } catch (error) {
    console.log('SCRAPE_ERROR:' + error.message);
  } finally {
    await browser.close();
  }
})();
`;

    // 写入脚本文件
    await sandbox.files.write('/tmp/scrape.js', scrapeScript);

    // 执行抓取
    const result = await sandbox.commands.run(
      'cd /home/user && node /tmp/scrape.js',
      { timeoutMs: 60000 }
    );

    if (result.stdout.includes('SCRAPE_SUCCESS:')) {
      const jsonData = result.stdout.split('SCRAPE_SUCCESS:')[1].trim();
      const scrapedData = JSON.parse(jsonData);
      
      return NextResponse.json({
        success: true,
        message: '网页内容抓取成功',
        data: scrapedData,
        options: {
          includeText,
          includeLinks,
          includeImages,
          includeMetadata,
          waitFor
        },
        timestamp: new Date().toISOString()
      });
    } else {
      const errorMessage = result.stdout.includes('SCRAPE_ERROR:') 
        ? result.stdout.split('SCRAPE_ERROR:')[1].trim()
        : result.stderr;

      return NextResponse.json({
        success: false,
        error: 'SCRAPE_FAILED',
        message: '网页内容抓取失败',
        details: errorMessage
      }, { status: 500 });
    }

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'SCRAPE_REQUEST_FAILED',
      message: '抓取请求处理失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
