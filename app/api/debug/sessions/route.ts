/**
 * 🔍 会话调试API
 * 提供会话、项目、文件的详细信息用于调试
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [调试API] 获取会话和项目数据');

    // 1. 获取所有会话（最近的20个）
    const { data: sessions, error: sessionsError } = await supabase
      .from('chat_sessions')
      .select('id, status, metadata, created_at, updated_at')
      .order('created_at', { ascending: false })
      .limit(20);

    if (sessionsError) {
      console.error('❌ [调试API] 获取会话失败:', sessionsError);
      throw new Error(`获取会话失败: ${sessionsError.message}`);
    }

    // 2. 获取所有项目及其统计信息
    const { data: projectsRaw, error: projectsError } = await supabase
      .rpc('get_projects_with_stats');

    let projects = [];
    if (projectsError) {
      console.warn('⚠️ [调试API] 获取项目统计失败，使用基础查询:', projectsError.message);
      
      // 回退到基础查询
      const { data: basicProjects, error: basicError } = await supabase
        .from('projects')
        .select(`
          id,
          name,
          session_id,
          total_files,
          total_commits,
          created_at,
          status
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (basicError) {
        throw new Error(`获取项目失败: ${basicError.message}`);
      }

      // 手动计算每个项目的实际文件数
      projects = await Promise.all(
        (basicProjects || []).map(async (project) => {
          const { data: files } = await supabase
            .from('project_files')
            .select('filename')
            .eq('project_id', project.id)
            .eq('change_type', 'added');

          const { data: commits } = await supabase
            .from('project_commits')
            .select('id')
            .eq('project_id', project.id);

          const fileList = files?.map(f => f.filename).join(', ') || '';

          return {
            project_id: project.id,
            name: project.name,
            session_id: project.session_id,
            total_files: project.total_files,
            total_commits: project.total_commits,
            created_at: project.created_at,
            status: project.status,
            actual_files: files?.length || 0,
            actual_commits: commits?.length || 0,
            file_list: fileList.length > 100 ? fileList.substring(0, 100) + '...' : fileList
          };
        })
      );
    } else {
      projects = projectsRaw || [];
    }

    // 3. 获取临时会话的项目（增量模式创建的）
    const { data: tempProjects, error: tempError } = await supabase
      .from('projects')
      .select(`
        id,
        name,
        session_id,
        total_files,
        total_commits,
        created_at,
        status
      `)
      .like('session_id', 'temp-session-%')
      .order('created_at', { ascending: false })
      .limit(20);

    if (!tempError && tempProjects) {
      // 为临时项目添加文件统计
      const tempProjectsWithStats = await Promise.all(
        tempProjects.map(async (project) => {
          const { data: files } = await supabase
            .from('project_files')
            .select('filename')
            .eq('project_id', project.id);

          const fileList = files?.map(f => f.filename).join(', ') || '';

          return {
            project_id: project.id,
            name: project.name,
            session_id: project.session_id,
            total_files: project.total_files,
            total_commits: project.total_commits,
            created_at: project.created_at,
            status: project.status + ' (临时)',
            actual_files: files?.length || 0,
            actual_commits: project.total_commits,
            file_list: fileList.length > 100 ? fileList.substring(0, 100) + '...' : fileList
          };
        })
      );

      projects = [...projects, ...tempProjectsWithStats];
    }

    // 4. 统计信息
    const stats = {
      totalSessions: sessions?.length || 0,
      totalProjects: projects.length,
      totalFiles: projects.reduce((sum: number, p: any) => sum + (p.actual_files || 0), 0),
      totalCommits: projects.reduce((sum: number, p: any) => sum + (p.actual_commits || p.total_commits || 0), 0),
      tempProjects: projects.filter((p: any) => p.session_id?.startsWith('temp-session')).length
    };

    console.log('✅ [调试API] 数据获取成功:', stats);

    return NextResponse.json({
      success: true,
      data: {
        sessions: sessions || [],
        projects: projects || [],
        stats
      }
    });

  } catch (error) {
    console.error('❌ [调试API] 获取数据失败:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch debug data', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}

// 创建获取项目统计的数据库函数（如果不存在）
export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    
    if (action === 'create_stats_function') {
      console.log('🛠️ [调试API] 创建项目统计函数');
      
      const { error } = await supabase.rpc('create_get_projects_with_stats_function');
      
      if (error) {
        throw new Error(`创建函数失败: ${error.message}`);
      }
      
      return NextResponse.json({
        success: true,
        message: '项目统计函数创建成功'
      });
    }
    
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('❌ [调试API] POST操作失败:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to execute POST action', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}
