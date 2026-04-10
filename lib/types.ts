export interface ArchitectureDelta {
  intentTaxonomy?: string[]
  escalationFlow?: {
    trigger: string
    destination: string
    condition?: string
  }[]
  entitySchema?: {
    entity: string
    type: string
    required: boolean
  }[]
  toneGuide?: string[]
}

export interface OriTurn {
  message: string
  architectureDelta: ArchitectureDelta
  turnNumber: number
  architectureComplete: boolean
  progressPercent: number
}

export interface ArcSession {
  id: string
  slug: string
  messages: { role: 'user' | 'assistant'; content: string }[]
  architecture: ArchitectureDelta
  productDescription: string
  createdAt: string
  completedAt: string | null
  source: 'web' | 'mcp'
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}
