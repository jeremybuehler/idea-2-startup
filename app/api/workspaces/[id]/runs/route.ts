import { NextRequest, NextResponse } from 'next/server'
import { validateIdeaInput, SECURITY_HEADERS } from '@/lib/security'
import { toSlug, nowISO } from '@/lib/business-logic'

export const runtime = 'edge'

interface RouteParams {
  params: Promise<{ id: string }>
}

interface RunRequest {
  run_id: string
  execution_id?: string
  idea_title: string
  idea_slug: string
  idea_one_liner?: string
  idea_text: string
  compliance_status: 'pending' | 'passed' | 'failed' | 'needs_review'
  evaluation_score?: number
  overall_quality?: number
  total_cost?: number
  duration_ms?: number
  stage_metrics?: Array<{
    stage: string
    durationMs: number
    cost: number
    status: string
    quality?: number
  }>
  telemetry?: Record<string, unknown>
  compliance_report?: unknown
  evaluation_report?: unknown
  pipeline_config?: unknown
}

/**
 * POST /api/workspaces/[id]/runs
 * Record a new pipeline run in a workspace
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  const { id: workspaceId } = await params

  try {
    const body: RunRequest = await request.json()

    // Validate idea text
    const validation = validateIdeaInput(body.idea_text)
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Invalid idea text', details: validation.errors },
        { status: 400, headers: SECURITY_HEADERS }
      )
    }

    const runId = body.run_id || `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

    const run = {
      id: Math.floor(Math.random() * 1000000),
      run_id: runId,
      workspace_id: workspaceId,
      execution_id: body.execution_id || null,
      idea_title: body.idea_title,
      idea_slug: body.idea_slug || toSlug(body.idea_title),
      idea_one_liner: body.idea_one_liner || null,
      idea_text: validation.sanitized,
      compliance_status: body.compliance_status || 'pending',
      evaluation_score: body.evaluation_score ?? null,
      overall_quality: body.overall_quality ?? null,
      total_cost: body.total_cost ?? null,
      duration_ms: body.duration_ms ?? null,
      stage_metrics: body.stage_metrics || [],
      telemetry: body.telemetry || {},
      compliance_report: body.compliance_report || null,
      evaluation_report: body.evaluation_report || null,
      pipeline_config: body.pipeline_config || null,
      created_at: nowISO(),
      updated_at: nowISO()
    }

    return NextResponse.json(run, {
      status: 201,
      headers: SECURITY_HEADERS
    })

  } catch (error) {
    console.error('Run recording error:', error)
    return NextResponse.json(
      { error: 'Failed to record run', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: SECURITY_HEADERS }
    )
  }
}

/**
 * GET /api/workspaces/[id]/runs
 * List runs for a workspace
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const { id: workspaceId } = await params
  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
  const offset = parseInt(searchParams.get('offset') || '0')

  // In production, this would query from database
  return NextResponse.json({
    workspace_id: workspaceId,
    items: [],
    total: 0,
    limit,
    offset,
    has_more: false
  }, { headers: SECURITY_HEADERS })
}
