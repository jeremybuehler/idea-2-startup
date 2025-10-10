import { toSlug } from '@/lib/business-logic'
import { StageMetric } from '../types/Pipeline'
import { Workspace, WorkspaceMember, WorkspaceRunSummary } from '../types/workspace'

const DEFAULT_API_BASE =
  process.env.LAUNCHLOOM_BACKEND_URL ||
  process.env.NEXT_PUBLIC_LAUNCHLOOM_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE ||
  'http://localhost:8000/api/v1'

type WorkspaceResponse = {
  id: number
  public_id: string
  slug: string
  name: string
  description?: string | null
  created_at: string
  updated_at: string
  members: Array<{
    id: number
    email: string
    role: WorkspaceMember['role']
    status: 'invited' | 'active' | 'suspended' | 'revoked'
    invited_at: string
    joined_at?: string | null
  }>
  runs?: WorkspaceRunResponse[]
}

type WorkspaceRunResponse = {
  id: number
  run_id: string
  execution_id?: string | null
  idea_title: string
  idea_slug: string
  idea_one_liner?: string | null
  idea_text: string
  compliance_status: WorkspaceRunSummary['complianceStatus']
  evaluation_score?: number | null
  overall_quality?: number | null
  total_cost?: number | null
  duration_ms?: number | null
  stage_metrics: StageMetric[] | null
  telemetry: Record<string, unknown>
  compliance_report?: Record<string, unknown> | null
  evaluation_report?: Record<string, unknown> | null
  pipeline_config?: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface WorkspaceRunPersistPayload {
  runId: string
  ideaTitle: string
  ideaSlug: string
  ideaOneLiner?: string
  ideaText: string
  complianceStatus: WorkspaceRunSummary['complianceStatus']
  evaluationScore?: number
  overallQuality?: number
  totalCost?: number
  durationMs?: number
  stageMetrics?: StageMetric[]
  telemetry?: Record<string, unknown>
  complianceReport?: unknown
  evaluationReport?: unknown
  pipelineConfig?: unknown
  executionId?: string
}

export class WorkspaceService {
  private readonly baseUrl: string
  private readonly cache = new Map<string, Workspace>()
  private readonly identifierMap = new Map<string, string>()

  constructor(baseUrl: string = DEFAULT_API_BASE) {
    const trimmed = baseUrl.replace(/\/$/, '')
    this.baseUrl = trimmed.includes('/api/') ? trimmed : `${trimmed}/api/v1`
  }

  private normalizeId(id?: string): string {
    const raw = id && id.trim().length > 0 ? id.trim() : 'default'
    const existing = this.identifierMap.get(raw)
    if (existing) {
      return existing
    }
    const slug = toSlug(raw) || raw
    this.identifierMap.set(raw, slug)
    return slug
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(init.headers || {}),
      },
      ...init,
    })

    if (!response.ok) {
      const errorText = await response.text()
      const error = new Error(`Workspace API ${response.status}: ${errorText}`)
      ;(error as Error & { status?: number }).status = response.status
      throw error
    }

    return (await response.json()) as T
  }

  private mapWorkspace(workspaceKey: string, payload: WorkspaceResponse): Workspace {
    return {
      id: workspaceKey,
      publicId: payload.public_id,
      slug: payload.slug,
      name: payload.name,
      createdAt: payload.created_at,
      updatedAt: payload.updated_at,
      members: payload.members.map((member) => ({
        id: String(member.id),
        email: member.email,
        role: member.role,
      })),
      runs: payload.runs ? payload.runs.map((run) => this.mapRun(run)) : [],
    }
  }

  private mapRun(run: WorkspaceRunResponse): WorkspaceRunSummary {
    const evaluationScore = run.evaluation_score == null ? 0 : Number(run.evaluation_score)
    const totalCost = run.total_cost == null ? 0 : Number(run.total_cost)
    const overallQuality = run.overall_quality == null ? undefined : Number(run.overall_quality)
    const durationMs = run.duration_ms == null ? undefined : Number(run.duration_ms)

    return {
      runId: run.run_id,
      idea: run.idea_title,
      ideaSlug: run.idea_slug,
      ideaOneLiner: run.idea_one_liner ?? undefined,
      ideaText: run.idea_text,
      createdAt: run.created_at,
      complianceStatus: run.compliance_status,
      evaluationScore,
      cost: totalCost,
      executionId: run.execution_id ?? undefined,
      overallQuality,
      durationMs,
    }
  }

  private async fetchWorkspace(workspaceKey: string): Promise<Workspace | null> {
    try {
      const data = await this.request<WorkspaceResponse>(`/workspaces/${encodeURIComponent(workspaceKey)}?run_limit=10`)
      const workspace = this.mapWorkspace(workspaceKey, data)
      this.cache.set(workspaceKey, workspace)
      return workspace
    } catch (error) {
      const status = (error as Error & { status?: number }).status
      if (status === 404) {
        return null
      }
      throw error
    }
  }

  async ensureWorkspace(id: string, name?: string): Promise<Workspace> {
    const workspaceKey = this.normalizeId(id)
    const cached = this.cache.get(workspaceKey)
    if (cached) {
      return cached
    }

    const existing = await this.fetchWorkspace(workspaceKey)
    if (existing) {
      return existing
    }

    const displayName = name ?? id ?? 'Untitled Workspace'
    const payload = {
      name: displayName,
      slug: workspaceKey,
    }

    const created = await this.request<WorkspaceResponse>('/workspaces', {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    const workspace = this.mapWorkspace(workspaceKey, created)
    this.cache.set(workspaceKey, workspace)
    return workspace
  }

  async addMember(workspaceId: string, member: WorkspaceMember): Promise<void> {
    const workspaceKey = this.normalizeId(workspaceId)
    const workspace = await this.ensureWorkspace(workspaceKey)
    const members = workspace.members.filter((m) => m.id !== member.id)
    members.push(member)
    this.cache.set(workspaceKey, { ...workspace, members })
  }

  async recordRun(workspaceId: string, payload: WorkspaceRunPersistPayload): Promise<WorkspaceRunSummary> {
    const workspaceKey = this.normalizeId(workspaceId)
    const body = {
      run_id: payload.runId,
      execution_id: payload.executionId,
      idea_title: payload.ideaTitle,
      idea_slug: payload.ideaSlug,
      idea_one_liner: payload.ideaOneLiner,
      idea_text: payload.ideaText,
      compliance_status: payload.complianceStatus,
      evaluation_score: payload.evaluationScore,
      overall_quality: payload.overallQuality,
      total_cost: payload.totalCost,
      duration_ms: payload.durationMs,
      stage_metrics: payload.stageMetrics ?? [],
      telemetry: payload.telemetry ?? {},
      compliance_report: payload.complianceReport,
      evaluation_report: payload.evaluationReport,
      pipeline_config: payload.pipelineConfig,
    }

    const response = await this.request<WorkspaceRunResponse>(
      `/workspaces/${encodeURIComponent(workspaceKey)}/runs`,
      {
        method: 'POST',
        body: JSON.stringify(body),
      }
    )

    const summary = this.mapRun(response)
    const workspace = this.cache.get(workspaceKey)
    if (workspace) {
      const runs = [summary, ...workspace.runs.filter((run) => run.runId !== summary.runId)]
      this.cache.set(workspaceKey, { ...workspace, runs })
    }
    return summary
  }

  async getWorkspace(id: string): Promise<Workspace | undefined> {
    const workspaceKey = this.normalizeId(id)
    const workspace = this.cache.get(workspaceKey) || (await this.fetchWorkspace(workspaceKey))
    return workspace ?? undefined
  }

  async listWorkspaces(): Promise<Workspace[]> {
    if (this.cache.size === 0) {
      const data = await this.request<{ items: WorkspaceResponse[] }>(`/workspaces?limit=50`)
      data.items.forEach((item) => {
        this.identifierMap.set(item.slug, item.slug)
        this.cache.set(item.slug, this.mapWorkspace(item.slug, item))
      })
    }
    return Array.from(this.cache.values())
  }
}
