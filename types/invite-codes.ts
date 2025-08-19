// 邀请码相关类型定义

export interface InviteCode {
  id: string
  code: string
  name?: string
  created_by: string
  created_at: string
  updated_at: string
  
  // 使用限制
  max_uses?: number
  current_uses: number
  expires_at?: string
  
  // 权限配置
  permissions: InviteCodePermissions
  
  // 状态
  is_active: boolean
  
  // 批次信息
  batch_id?: string
  
  // 元数据
  metadata: Record<string, any>
}

export interface InviteCodePermissions {
  plan: 'free' | 'pro' | 'admin'
  features: string[]
  projects: string[]
  special_access?: boolean
  admin_access?: boolean
}

export interface InviteCodeUsage {
  id: string
  invite_code_id: string
  code: string
  user_id?: string
  email: string
  ip_address?: string
  user_agent?: string
  used_at: string
  metadata: Record<string, any>
}

export interface InviteCodeBatch {
  id: string
  name: string
  description?: string
  created_by: string
  created_at: string
  
  // 批次配置
  total_codes: number
  code_prefix?: string
  default_permissions: InviteCodePermissions
  default_max_uses: number
  default_expires_at?: string
  
  // 状态
  is_active: boolean
  
  // 统计信息
  generated_codes: number
  total_uses: number
  
  // 元数据
  metadata: Record<string, any>
}

// API 请求/响应类型
export interface VerifyInviteCodeRequest {
  code: string
}

export interface VerifyInviteCodeResponse {
  success: boolean
  data?: {
    code: string
    name?: string
    permissions: InviteCodePermissions
    remainingUses?: number | null
    expiresAt?: string | null
  }
  error?: string
}

export interface UseInviteCodeRequest {
  code: string
  email: string
  userAgent?: string
  ipAddress?: string
}

export interface UseInviteCodeResponse {
  success: boolean
  data?: {
    usageId: string
    permissions: InviteCodePermissions
    message: string
  }
  error?: string
}

export interface GenerateInviteCodeRequest {
  name?: string
  maxUses?: number
  expiresAt?: string
  permissions?: InviteCodePermissions
  batchId?: string
  count?: number
  codePrefix?: string
}

export interface GenerateInviteCodeResponse {
  success: boolean
  data?: {
    codes: InviteCode[]
    count: number
    message: string
  }
  error?: string
}

// 邀请码状态枚举
export enum InviteCodeStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  USED_UP = 'used_up',
  DISABLED = 'disabled'
}

// 用户权限相关
export interface UserWithInviteCode {
  id: string
  email: string
  plan: string
  projects: string[]
  metadata: {
    inviteCode?: string
    inviteCodeUsedAt?: string
    specialAccess?: boolean
    grantedFeatures?: string[]
  }
}

// 统计数据类型
export interface InviteCodeStats {
  totalCodes: number
  activeCodes: number
  totalUsages: number
  expiredCodes: number
  usedUpCodes: number
  disabledCodes: number
}

// 邀请码权限检查
export function hasInviteCodePermission(user: UserWithInviteCode, feature: string): boolean {
  return user.metadata.grantedFeatures?.includes(feature) || false
}

// 邀请码状态检查
export function getInviteCodeStatus(code: InviteCode): InviteCodeStatus {
  if (!code.is_active) {
    return InviteCodeStatus.DISABLED
  }
  
  if (code.expires_at && new Date(code.expires_at) < new Date()) {
    return InviteCodeStatus.EXPIRED
  }
  
  if (code.max_uses && code.current_uses >= code.max_uses) {
    return InviteCodeStatus.USED_UP
  }
  
  return InviteCodeStatus.ACTIVE
}

// 邀请码验证工具
export function validateInviteCode(code: string): boolean {
  // 邀请码格式验证：8-20位大写字母和数字
  const regex = /^[A-Z0-9]{8,20}$/
  return regex.test(code)
}

// 格式化邀请码显示
export function formatInviteCode(code: string): string {
  // 每4位添加一个空格，便于阅读
  return code.replace(/(.{4})/g, '$1 ').trim()
}
