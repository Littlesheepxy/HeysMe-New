/**
 * 工具结果存储服务
 * 提供工具调用结果的持久化存储和缓存机制
 */

import { createHash } from 'crypto';
import { supabase } from '@/lib/supabase';

export interface ToolResult {
  id?: string;
  user_id: string;
  session_id?: string;
  agent_name: string;
  tool_name: string;
  source_url: string;
  url_hash: string;
  tool_output: any;
  processed_data?: any;
  metadata?: any;
  status: 'success' | 'failed' | 'partial';
  error_message?: string;
  cache_expires_at?: string;
  is_cacheable: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CacheOptions {
  ttl_hours?: number; // 缓存时间（小时）
  force_refresh?: boolean; // 强制刷新
  user_specific?: boolean; // 是否用户特定缓存
}

export class ToolResultsStorageService {
  
  /**
   * 生成 URL 哈希值
   */
  private generateUrlHash(url: string, tool_name: string): string {
    return createHash('sha256')
      .update(`${url}:${tool_name}`)
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * 检查缓存是否存在且有效
   */
  async getCachedResult(
    url: string, 
    tool_name: string, 
    user_id?: string,
    options: CacheOptions = {}
  ): Promise<ToolResult | null> {
    try {
      if (options.force_refresh) {
        return null; // 强制刷新，跳过缓存
      }

      const url_hash = this.generateUrlHash(url, tool_name);
      
      console.log(`🔍 [缓存查询] ${tool_name} - ${url_hash}`);

      const { data, error } = await supabase
        .rpc('get_cached_tool_result', {
          p_url_hash: url_hash,
          p_tool_name: tool_name,
          p_user_id: options.user_specific ? user_id : null
        });

      if (error) {
        console.error('❌ [缓存查询] 失败:', error);
        return null;
      }

      if (data && data.length > 0) {
        const result = data[0];
        console.log(`✅ [缓存命中] ${tool_name} - ${url}`);
        
        // 记录缓存使用
        await this.recordUsage(result.id, user_id, true);
        
        return {
          id: result.id,
          tool_output: result.tool_output,
          processed_data: result.processed_data,
          created_at: result.created_at,
          // 其他字段根据需要添加
        } as ToolResult;
      }

      console.log(`❌ [缓存未命中] ${tool_name} - ${url}`);
      return null;

    } catch (error) {
      console.error('❌ [缓存查询] 异常:', error);
      return null;
    }
  }

  /**
   * 存储工具调用结果
   */
  async storeResult(
    result: Omit<ToolResult, 'id' | 'url_hash' | 'created_at' | 'updated_at'>,
    options: CacheOptions = {}
  ): Promise<string | null> {
    try {
      const url_hash = this.generateUrlHash(result.source_url, result.tool_name);
      
      // 设置缓存过期时间
      let cache_expires_at = null;
      if (result.is_cacheable && options.ttl_hours) {
        const expireDate = new Date();
        expireDate.setHours(expireDate.getHours() + options.ttl_hours);
        cache_expires_at = expireDate.toISOString();
      }

      const toolResult: Partial<ToolResult> = {
        ...result,
        url_hash,
        cache_expires_at: cache_expires_at || undefined,
        metadata: {
          ...result.metadata,
          cached_at: new Date().toISOString(),
          ttl_hours: options.ttl_hours
        }
      };

      console.log(`💾 [存储结果] ${result.tool_name} - ${result.source_url}`);

      const { data, error } = await supabase
        .from('tool_results')
        .upsert(toolResult, {
          onConflict: 'url_hash,tool_name',
          ignoreDuplicates: false
        })
        .select('id')
        .single();

      if (error) {
        console.error('❌ [存储失败]:', error);
        return null;
      }

      console.log(`✅ [存储成功] ID: ${data.id}`);
      return data.id;

    } catch (error) {
      console.error('❌ [存储异常]:', error);
      return null;
    }
  }

  /**
   * 批量存储工具结果
   */
  async storeBatchResults(
    results: Array<Omit<ToolResult, 'id' | 'url_hash' | 'created_at' | 'updated_at'>>,
    options: CacheOptions = {}
  ): Promise<string[]> {
    const storedIds: string[] = [];
    
    for (const result of results) {
      const id = await this.storeResult(result, options);
      if (id) {
        storedIds.push(id);
      }
    }
    
    return storedIds;
  }

  /**
   * 记录工具结果使用情况
   */
  private async recordUsage(
    tool_result_id: string, 
    user_id?: string, 
    cache_hit: boolean = false,
    response_time_ms?: number
  ): Promise<void> {
    try {
      if (!user_id) return;

      await supabase
        .from('tool_result_usage')
        .insert({
          tool_result_id,
          user_id,
          cache_hit,
          response_time_ms,
          usage_context: 'info_collection'
        });

    } catch (error) {
      console.error('❌ [使用记录] 失败:', error);
    }
  }

  /**
   * 获取用户的工具调用历史
   */
  async getUserToolHistory(
    user_id: string, 
    tool_name?: string,
    limit: number = 50
  ): Promise<ToolResult[]> {
    try {
      let query = supabase
        .from('tool_results')
        .select('*')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (tool_name) {
        query = query.eq('tool_name', tool_name);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ [历史查询] 失败:', error);
        return [];
      }

      return data || [];

    } catch (error) {
      console.error('❌ [历史查询] 异常:', error);
      return [];
    }
  }

  /**
   * 清理过期缓存
   */
  async cleanupExpiredCache(): Promise<number> {
    try {
      const { data, error } = await supabase
        .rpc('cleanup_expired_tool_results');

      if (error) {
        console.error('❌ [缓存清理] 失败:', error);
        return 0;
      }

      console.log(`🧹 [缓存清理] 清理了 ${data} 条过期记录`);
      return data || 0;

    } catch (error) {
      console.error('❌ [缓存清理] 异常:', error);
      return 0;
    }
  }

  /**
   * 获取缓存统计信息
   */
  async getCacheStats(days: number = 7): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('cache_hit_stats')
        .select('*')
        .gte('usage_date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
        .order('usage_date', { ascending: false });

      if (error) {
        console.error('❌ [统计查询] 失败:', error);
        return null;
      }

      return data;

    } catch (error) {
      console.error('❌ [统计查询] 异常:', error);
      return null;
    }
  }

  /**
   * 删除特定URL的缓存
   */
  async invalidateCache(url: string, tool_name?: string): Promise<boolean> {
    try {
      const url_hash = this.generateUrlHash(url, tool_name || '');
      
      let query = supabase
        .from('tool_results')
        .delete()
        .eq('url_hash', url_hash);

      if (tool_name) {
        query = query.eq('tool_name', tool_name);
      }

      const { error } = await query;

      if (error) {
        console.error('❌ [缓存失效] 失败:', error);
        return false;
      }

      console.log(`🗑️ [缓存失效] ${url} - ${tool_name || 'all tools'}`);
      return true;

    } catch (error) {
      console.error('❌ [缓存失效] 异常:', error);
      return false;
    }
  }
}

// 导出单例实例
export const toolResultsStorage = new ToolResultsStorageService();
