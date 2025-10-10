export interface WorkspaceMember {
  id: string
  email: string
  role: 'owner' | 'admin' | 'editor' | 'viewer'
}

export interface WorkspaceRunSummary {
  runId: string
  idea: string
  createdAt: string
  complianceStatus: 'pass' | 'review' | 'fail'
  evaluationScore: number
  cost: number
  ideaSlug?: string
  ideaOneLiner?: string
  ideaText?: string
  executionId?: string
  overallQuality?: number
  durationMs?: number
}

export interface Workspace {
  id: string
  publicId?: string
  slug?: string
  name: string
  createdAt: string
  updatedAt?: string
  members: WorkspaceMember[]
  runs: WorkspaceRunSummary[]
}
