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
}

export interface Workspace {
  id: string
  name: string
  createdAt: string
  members: WorkspaceMember[]
  runs: WorkspaceRunSummary[]
}
