export interface BaseAgent {
  id: string
  name: string
  description: string
  systemPrompt: string
  capabilities: string[]
}

export interface DataCollectionAgent extends BaseAgent {
  type: "data_collection"
  supportedSources: DataSource[]
}

export interface SummaryAgent extends BaseAgent {
  type: "summary"
  analysisCapabilities: string[]
}

export interface PageCreationAgent extends BaseAgent {
  type: "page_creation"
  templateTypes: string[]
}

export type Agent = DataCollectionAgent | SummaryAgent | PageCreationAgent

export interface DataSource {
  id: string
  name: string
  type: "document" | "social" | "manual"
  icon: string
  description: string
  authRequired: boolean
  supportedFormats?: string[]
}

export interface CollectedData {
  source: string
  type: "conversation" | "document" | "social_profile"
  data: any
  timestamp: Date
  confidence: number
}

export interface UserProfile {
  basic: {
    name?: string
    title?: string
    email?: string
    location?: string
    bio?: string
  }
  professional: {
    role?: string
    experience?: string[]
    skills?: string[]
    education?: string[]
    projects?: any[]
  }
  social: {
    platforms?: Record<string, any>
    links?: any[]
  }
  preferences: {
    purpose?: string
    style?: string
    display_priority?: string[]
  }
  raw_data: CollectedData[]
}

export interface AgentWorkflow {
  currentAgent: string
  step: string
  collectedData: CollectedData[]
  userProfile?: UserProfile
  generatedPage?: any
}
