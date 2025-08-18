/**
 * 临时调试端点：深度分析 Vercel 部署事件结构
 * 用于诊断事件解析问题
 */

import { NextRequest, NextResponse } from 'next/server';
import { createVercelService } from '@/lib/services/vercel-preview-service';
import { getVercelConfig } from '@/lib/config/vercel-config';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deploymentId = searchParams.get('deploymentId');
    
    if (!deploymentId) {
      return NextResponse.json(
        { error: 'Missing deploymentId parameter' },
        { status: 400 }
      );
    }

    // 获取配置
    const config = getVercelConfig();
    
    if (!config.enabled || !config.bearerToken) {
      return NextResponse.json(
        { error: 'Vercel not configured' },
        { status: 503 }
      );
    }

    const vercelService = createVercelService(config);
    
    console.log(`🔍 深度调试部署 ${deploymentId} 的事件结构...`);
    
    try {
      // 直接调用 Vercel API
      const rawResult = await vercelService.vercel.deployments.getDeploymentEvents({
        idOrUrl: deploymentId,
        teamId: config.teamId,
        slug: config.teamSlug,
      });

      // 分析原始响应结构
      const analysis = {
        deploymentId,
        responseType: typeof rawResult,
        isArray: Array.isArray(rawResult),
        responseKeys: rawResult && typeof rawResult === 'object' ? Object.keys(rawResult) : null,
        hasValue: !!(rawResult as any)?.value,
        valueType: (rawResult as any)?.value ? typeof (rawResult as any).value : null,
        valueIsArray: Array.isArray((rawResult as any)?.value),
        sampleStructure: null as any,
        eventsFound: 0,
        eventTypes: [] as string[],
        timestampFields: [] as string[],
        payloadFields: [] as string[]
      };

      // 尝试获取事件数组
      let events: any[] = [];
      
      if (Array.isArray(rawResult)) {
        events = rawResult;
      } else if (rawResult && typeof rawResult === 'object') {
        const responseData = (rawResult as any).value || rawResult;
        
        if (Array.isArray(responseData)) {
          events = responseData;
        } else if (responseData.events && Array.isArray(responseData.events)) {
          events = responseData.events;
        } else if (responseData.data && Array.isArray(responseData.data)) {
          events = responseData.data;
        }
      }

      analysis.eventsFound = events.length;

      // 分析事件结构
      if (events.length > 0) {
        // 获取事件类型
        analysis.eventTypes = [...new Set(events.map(e => e.type).filter(Boolean))];
        
        // 分析第一个事件的结构
        const firstEvent = events[0];
        analysis.sampleStructure = {
          keys: Object.keys(firstEvent),
          type: firstEvent.type,
          hasPayload: !!firstEvent.payload,
          payloadType: typeof firstEvent.payload,
          payloadKeys: firstEvent.payload ? Object.keys(firstEvent.payload) : null
        };

        // 分析时间戳字段
        const timeFields = new Set<string>();
        events.slice(0, 5).forEach(event => {
          Object.keys(event).forEach(key => {
            if (key.toLowerCase().includes('time') || 
                key.toLowerCase().includes('date') || 
                key.toLowerCase().includes('created')) {
              timeFields.add(key);
            }
          });
        });
        analysis.timestampFields = [...timeFields];

        // 分析payload字段
        const payloadFields = new Set<string>();
        events.slice(0, 5).forEach(event => {
          if (event.payload && typeof event.payload === 'object') {
            Object.keys(event.payload).forEach(key => {
              payloadFields.add(key);
            });
          }
        });
        analysis.payloadFields = [...payloadFields];
      }

      return NextResponse.json({
        success: true,
        analysis,
        rawResponse: JSON.stringify(rawResult, null, 2).slice(0, 2000), // 限制大小
        sampleEvents: events.slice(0, 3).map(event => ({
          ...event,
          payload: event.payload ? JSON.stringify(event.payload).slice(0, 200) : null
        })),
        recommendations: generateDebugRecommendations(analysis)
      });
      
    } catch (apiError) {
      console.error('❌ Vercel API 调用失败:', apiError);
      
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch deployment events',
        details: apiError instanceof Error ? apiError.message : String(apiError),
        suggestions: [
          '检查部署ID是否正确',
          '验证 Vercel Token 权限',
          '确认团队ID和项目配置',
          '检查部署是否真实存在'
        ]
      });
    }

  } catch (error) {
    console.error('❌ 调试端点错误:', error);
    
    return NextResponse.json(
      { 
        error: 'Debug endpoint failed', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}

/**
 * 生成调试建议
 */
function generateDebugRecommendations(analysis: any): string[] {
  const recommendations: string[] = [];
  
  if (analysis.eventsFound === 0) {
    recommendations.push('⚠️ 未找到任何事件，可能原因：');
    recommendations.push('- 部署ID不正确');
    recommendations.push('- API权限不足');
    recommendations.push('- 部署还未产生事件');
  } else {
    recommendations.push(`✅ 找到 ${analysis.eventsFound} 个事件`);
    
    if (analysis.timestampFields.length === 0) {
      recommendations.push('⚠️ 事件中没有找到时间戳字段');
    } else {
      recommendations.push(`📅 可用时间戳字段: ${analysis.timestampFields.join(', ')}`);
    }
    
    if (analysis.payloadFields.length === 0) {
      recommendations.push('⚠️ 事件 payload 中没有文本内容字段');
    } else {
      recommendations.push(`📝 可用 payload 字段: ${analysis.payloadFields.join(', ')}`);
    }
  }
  
  return recommendations;
}
