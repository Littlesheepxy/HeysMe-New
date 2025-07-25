/**
 * Agent编排器相关类型定义
 */

import { SessionData } from '@/lib/types/session';
import { StreamableAgentResponse } from '@/lib/types/streaming';

/**
 * Agent映射配置
 */
export interface AgentMappingConfig {
  /** Agent名称到阶段的映射 */
  agentToStage: Record<string, string>;
  /** 阶段到Agent名称的映射 */
  stageToAgent: Record<string, string>;
  /** Agent执行序列 */
  agentSequence: string[];
  /** 阶段进度百分比 */
  stageProgress: Record<string, number>;
}

/**
 * Agent执行统计
 */
export interface AgentMetrics {
  /** 处理时间（毫秒） */
  processingTime: number;
  /** 使用的Token数量 */
  tokensUsed: number;
  /** API调用次数 */
  apiCalls: number;
}

/**
 * Agent执行记录
 */
export interface AgentFlowRecord {
  /** 记录ID */
  id: string;
  /** Agent名称 */
  agent: string;
  /** 开始时间 */
  startTime: Date;
  /** 结束时间 */
  endTime?: Date;
  /** 执行状态 */
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  /** 输入数据 */
  input?: any;
  /** 输出响应 */
  output?: StreamableAgentResponse;
  /** 执行统计 */
  metrics?: AgentMetrics;
}

/**
 * 错误恢复建议
 */
export interface RecoveryRecommendation {
  /** 建议行动 */
  action: 'retry' | 'reset' | 'restart';
  /** 目标阶段（如果是reset） */
  targetStage?: string;
  /** 建议原因 */
  reason: string;
}

/**
 * 会话健康状态
 */
export interface SessionHealth {
  /** 健康状态 */
  status: 'healthy' | 'warning' | 'critical';
  /** 发现的问题 */
  issues: string[];
  /** 建议措施 */
  suggestions: string[];
}

/**
 * 会话统计信息
 */
export interface SessionStats {
  /** 总会话数 */
  totalSessions: number;
  /** 活跃会话数 */
  activeSessions: number;
  /** 过期会话数 */
  expiredSessions: number;
}

/**
 * 用户交互结果
 */
export interface UserInteractionResult {
  /** 处理动作 */
  action: 'continue' | 'advance' | 'retry' | 'error' | 'request_custom_description' | 'stream_response';
  /** 确认的信息 */
  confirmed_info?: any;
  /** 更新的信息 */
  updated_info?: any;
  /** 缺少的字段列表 */
  missing_fields?: string[];
  /** 收集阶段：basic-基础信息，details-细节信息 */
  collection_phase?: 'basic' | 'details';
  /** 操作摘要 */
  summary?: string;
  /** 下一个Agent（如果需要跳转） */
  nextAgent?: string;
  /** 自定义描述字段（用于request_custom_description动作） */
  field?: string;
  /** 描述引导词（用于request_custom_description动作） */
  description_prompt?: string;
  /** 当前收集的信息（用于request_custom_description动作） */
  current_info?: any;
} 