/**
 * 代码构建和部署 API
 * 
 * 功能：
 * - POST: 构建用户代码项目
 * - GET: 获取构建状态
 * 
 * 流程：
 * 1. 接收代码文件
 * 2. 创建临时构建环境
 * 3. 安装依赖并构建
 * 4. 上传到CDN
 * 5. 返回部署链接
 */

import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { z } from "zod"
import path from "path"
import fs from "fs/promises"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

// 构建请求schema
const buildRequestSchema = z.object({
  pageId: z.string().uuid("无效的页面ID"),
  userId: z.string().uuid("无效的用户ID"),
  files: z.array(z.object({
    filename: z.string(),
    content: z.string(),
    language: z.string(),
  })),
  projectName: z.string(),
  buildOptions: z.object({
    framework: z.enum(['next', 'react', 'vue', 'vanilla']).default('next'),
    deployTarget: z.enum(['static', 'serverless']).default('static'),
    customDomain: z.string().optional(),
  }).optional(),
})

/**
 * POST /api/deploy
 * 构建和部署项目
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // 数据验证
    const validationResult = buildRequestSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "数据验证失败",
          details: validationResult.error.errors,
        },
        { status: 400 }
      )
    }

    const { pageId, userId, files, projectName, buildOptions } = validationResult.data
    const supabase = createServerClient()

    // 验证用户权限
    const { data: page, error: pageError } = await supabase
      .from("pages")
      .select("id, user_id, title")
      .eq("id", pageId)
      .eq("user_id", userId)
      .single()

    if (pageError || !page) {
      return NextResponse.json(
        { success: false, error: "页面不存在或无权限" },
        { status: 404 }
      )
    }

    // 创建构建记录
    const { data: buildRecord, error: buildError } = await supabase
      .from("page_builds")
      .insert({
        page_id: pageId,
        user_id: userId,
        status: 'pending',
        build_options: buildOptions || {},
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (buildError) {
      throw buildError
    }

    // 异步启动构建过程
    buildProject({
      buildId: buildRecord.id,
      files,
      projectName,
      buildOptions: buildOptions || { framework: 'next', deployTarget: 'static' }
    }).catch(error => {
      console.error('构建失败:', error)
      // 更新构建状态为失败
      supabase
        .from("page_builds")
        .update({ 
          status: 'failed', 
          error_message: error.message,
          updated_at: new Date().toISOString()
        })
        .eq("id", buildRecord.id)
        .then()
    })

    return NextResponse.json({
      success: true,
      data: {
        buildId: buildRecord.id,
        status: 'pending',
        message: '构建已开始，请稍等片刻',
        estimatedTime: '2-5分钟',
      },
    })

  } catch (error) {
    console.error("启动构建失败:", error)
    return NextResponse.json(
      {
        success: false,
        error: "启动构建失败",
        details: process.env.NODE_ENV === "development" ? error : undefined,
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/deploy?buildId=xxx
 * 获取构建状态
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const buildId = searchParams.get("buildId")

    if (!buildId) {
      return NextResponse.json(
        { success: false, error: "缺少构建ID" },
        { status: 400 }
      )
    }

    const supabase = createServerClient()
    
    const { data: build, error } = await supabase
      .from("page_builds")
      .select("*")
      .eq("id", buildId)
      .single()

    if (error || !build) {
      return NextResponse.json(
        { success: false, error: "构建记录不存在" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        buildId: build.id,
        status: build.status,
        deployUrl: build.deploy_url,
        logs: build.build_logs,
        createdAt: build.created_at,
        completedAt: build.completed_at,
        errorMessage: build.error_message,
      },
    })

  } catch (error) {
    console.error("获取构建状态失败:", error)
    return NextResponse.json(
      {
        success: false,
        error: "获取构建状态失败",
        details: process.env.NODE_ENV === "development" ? error : undefined,
      },
      { status: 500 }
    )
  }
}

/**
 * 执行项目构建
 */
async function buildProject({ 
  buildId, 
  files, 
  projectName, 
  buildOptions 
}: {
  buildId: string
  files: any[]
  projectName: string
  buildOptions: any
}) {
  const supabase = createServerClient()
  const buildDir = path.join('/tmp', `build-${buildId}`)
  
  try {
    // 更新状态为构建中
    await supabase
      .from("page_builds")
      .update({ 
        status: 'building',
        updated_at: new Date().toISOString()
      })
      .eq("id", buildId)

    // 1. 创建构建目录
    await fs.mkdir(buildDir, { recursive: true })
    
    // 2. 写入项目文件
    for (const file of files) {
      const filePath = path.join(buildDir, file.filename)
      const fileDir = path.dirname(filePath)
      
      // 确保目录存在
      await fs.mkdir(fileDir, { recursive: true })
      
      // 写入文件内容
      await fs.writeFile(filePath, file.content, 'utf-8')
    }

    const logs: string[] = []
    
    // 3. 安装依赖
    logs.push('正在安装依赖...')
    const { stdout: installOutput, stderr: installError } = await execAsync('npm install', {
      cwd: buildDir,
      timeout: 300000, // 5分钟超时
    })
    
    if (installError) {
      logs.push(`安装警告: ${installError}`)
    }
    logs.push(`依赖安装完成: ${installOutput}`)

    // 4. 构建项目
    logs.push('正在构建项目...')
    const buildCommand = buildOptions.framework === 'next' ? 'npm run build' : 'npm run build'
    const { stdout: buildOutput, stderr: buildError } = await execAsync(buildCommand, {
      cwd: buildDir,
      timeout: 600000, // 10分钟超时
    })

    if (buildError) {
      logs.push(`构建警告: ${buildError}`)
    }
    logs.push(`项目构建完成: ${buildOutput}`)

    // 5. 生成部署链接（这里简化处理，实际应该上传到CDN）
    const deployUrl = `https://deploy.heysme.com/${buildId}`
    
    // 6. 更新构建状态为成功
    await supabase
      .from("page_builds")
      .update({ 
        status: 'completed',
        deploy_url: deployUrl,
        build_logs: logs,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("id", buildId)

    // 7. 清理构建目录
    await fs.rm(buildDir, { recursive: true, force: true })

  } catch (error) {
    console.error('构建过程失败:', error)
    
    // 更新构建状态为失败
    await supabase
      .from("page_builds")
      .update({ 
        status: 'failed',
        error_message: error instanceof Error ? error.message : '未知错误',
        updated_at: new Date().toISOString()
      })
      .eq("id", buildId)

    // 清理构建目录
    try {
      await fs.rm(buildDir, { recursive: true, force: true })
    } catch (cleanupError) {
      console.error('清理构建目录失败:', cleanupError)
    }

    throw error
  }
}
