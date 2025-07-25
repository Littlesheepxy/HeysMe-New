import { StreamableAgentResponse, UserIntent, PersonalizationProfile } from './streaming';

// 会话数据结构
export interface SessionData {
  id: string;
  userId?: string;
  status: 'active' | 'paused' | 'completed' | 'abandoned';
  
  // 🆕 会话标题相关
  title?: string;
  titleGeneratedAt?: string;
  titleModel?: string;
  lastTitleMessageCount?: number;
  
  // 核心数据
  userIntent: UserIntent;
  personalization: PersonalizationProfile;
  collectedData: CollectedResumeData;
  
  // 会话历史
  conversationHistory: ConversationEntry[];
  agentFlow: AgentFlowEntry[];
  
  // 元数据
  metadata: SessionMetadata;
  
  // 生成的内容
  generatedContent?: {
    resume?: GeneratedResume;
    portfolio?: GeneratedPortfolio;
    coverLetter?: GeneratedCoverLetter;
  };
}

// 收集的简历数据
export interface CollectedResumeData {
  personal: {
    fullName?: string;
    email?: string;
    phone?: string;
    location?: string;
    portfolio?: string;
    linkedin?: string;
    github?: string;
    website?: string;
  };
  
  professional: {
    currentTitle?: string;
    targetRole?: string;
    yearsExperience?: number;
    summary?: string;
    skills: string[];
    languages?: Array<{
      language: string;
      proficiency: 'basic' | 'conversational' | 'professional' | 'native';
    }>;
  };
  
  experience: WorkExperience[];
  education: Education[];
  projects: Project[];
  achievements: Achievement[];
  certifications: Certification[];
}

// 工作经历
export interface WorkExperience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  location?: string;
  description: string;
  achievements: string[];
  technologies?: string[];
}

// 教育背景
export interface Education {
  id: string;
  institution: string;
  degree: string;
  field?: string;
  startDate: string;
  endDate?: string;
  gpa?: string;
  honors?: string[];
  relevantCourses?: string[];
}

// 项目经历
export interface Project {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  role?: string;
  startDate?: string;
  endDate?: string;
  url?: string;
  repository?: string;
  highlights: string[];
}

// 成就奖项
export interface Achievement {
  id: string;
  title: string;
  description: string;
  date?: string;
  organization?: string;
  category: 'award' | 'recognition' | 'publication' | 'competition' | 'other';
}

// 认证证书
export interface Certification {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  credentialId?: string;
  verificationUrl?: string;
}

// 对话条目
export interface ConversationEntry {
  id: string;
  timestamp: Date;
  type: 'user_message' | 'agent_response' | 'system_event';
  agent?: string;
  content: string;
  metadata?: Record<string, any>;
  userInteraction?: {
    type: string;
    data: any;
    timestamp: Date;
  };
}

// Agent流程条目
export interface AgentFlowEntry {
  id: string;
  agent: string;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'completed' | 'failed' | 'skipped';
  input?: any;
  output?: StreamableAgentResponse;
  error?: string;
  metrics?: {
    processingTime: number;
    tokensUsed?: number;
    apiCalls?: number;
  };
}

// 会话元数据
export interface SessionMetadata {
  createdAt: Date;
  updatedAt: Date;
  lastActive: Date;
  version: string;
  
  // 进度跟踪
  progress: {
    currentStage: string;
    completedStages: string[];
    totalStages: number;
    percentage: number;
  };
  
  // 性能指标
  metrics: {
    totalTime: number;
    userInteractions: number;
    agentTransitions: number;
    errorsEncountered: number;
  };
  
  // 配置
  settings: {
    autoSave: boolean;
    reminderEnabled: boolean;
    privacyLevel: 'public' | 'private' | 'limited';
  };
}

// 生成的简历
export interface GeneratedResume {
  id: string;
  format: 'pdf' | 'html' | 'json';
  content: string;
  metadata: {
    template: string;
    style: string;
    generatedAt: Date;
    version: number;
  };
  customizations?: {
    colors?: Record<string, string>;
    fonts?: Record<string, string>;
    layout?: string;
  };
}

// 生成的作品集
export interface GeneratedPortfolio {
  id: string;
  type: 'website' | 'pdf' | 'presentation';
  content: {
    html?: string;
    css?: string;
    assets?: Array<{
      type: 'image' | 'document' | 'video';
      url: string;
      name: string;
    }>;
  };
  metadata: {
    template: string;
    generatedAt: Date;
    deploymentUrl?: string;
  };
}

// 生成的求职信
export interface GeneratedCoverLetter {
  id: string;
  targetJob?: string;
  targetCompany?: string;
  content: string;
  metadata: {
    tone: string;
    length: 'short' | 'medium' | 'long';
    generatedAt: Date;
  };
}

// 会话管理操作
export interface SessionOperations {
  create: (initialData?: Partial<SessionData>) => Promise<SessionData>;
  load: (sessionId: string) => Promise<SessionData | null>;
  save: (sessionData: SessionData) => Promise<void>;
  update: (sessionId: string, updates: Partial<SessionData>) => Promise<void>;
  delete: (sessionId: string) => Promise<void>;
  list: (userId?: string) => Promise<SessionData[]>;
}

// 数据验证规则
export interface ValidationRules {
  personal: Record<keyof CollectedResumeData['personal'], {
    required?: boolean;
    pattern?: RegExp;
    minLength?: number;
    maxLength?: number;
    custom?: (value: any) => boolean | string;
  }>;
  professional: Record<keyof CollectedResumeData['professional'], any>;
  // ... 其他验证规则
}
