import { NextRequest, NextResponse } from 'next/server'
import { validateIdeaInput, SECURITY_HEADERS } from '@/lib/security'
import { scoreIdea, toSlug, TemplateGenerator, nowISO } from '@/lib/business-logic'

export const runtime = 'edge'

interface PipelineRequest {
  title: string
  one_liner: string
  idea_text: string
  workspace_id?: string
}

interface PipelineStageResult {
  stage: string
  status: 'completed' | 'failed' | 'skipped'
  duration_ms: number
  cost: number
}

/**
 * POST /api/pipeline
 * Start a new pipeline execution
 */
export async function POST(request: NextRequest) {
  try {
    const body: PipelineRequest = await request.json()

    // Validate input
    const validation = validateIdeaInput(body.idea_text)
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.errors },
        { status: 400, headers: SECURITY_HEADERS }
      )
    }

    // Generate execution ID
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const ideaId = `idea_${Math.random().toString(36).slice(2, 8)}`

    // Score the idea
    const scores = scoreIdea(validation.sanitized)
    const slug = toSlug(body.title || 'untitled')

    // In production, this would start a background job
    // For now, we simulate synchronous generation
    const stages: PipelineStageResult[] = [
      'normalize', 'research', 'feasibility', 'market_moat',
      'risk_assessment', 'ux_design', 'code_scaffold', 'api_design', 'export'
    ].map(stage => ({
      stage,
      status: 'completed' as const,
      duration_ms: Math.floor(Math.random() * 500) + 100,
      cost: Math.random() * 0.05
    }))

    // Generate dossier
    const dossier = {
      id: ideaId,
      execution_id: executionId,
      created_at: nowISO(),
      idea_text: validation.sanitized,
      title: body.title || 'Untitled Startup',
      one_liner: body.one_liner || validation.sanitized.slice(0, 100),
      scores,
      prd: TemplateGenerator.makePRD(
        body.title || 'Untitled',
        body.one_liner || '',
        validation.sanitized,
        scores
      ),
      runbook: TemplateGenerator.makeRunbook(body.title || 'Untitled'),
      repo: TemplateGenerator.makeRepoTree(slug),
      api: TemplateGenerator.makeAPISketch()
    }

    // Calculate totals
    const totalCost = stages.reduce((sum, s) => sum + s.cost, 0)
    const totalDuration = stages.reduce((sum, s) => sum + s.duration_ms, 0)

    return NextResponse.json({
      execution_id: executionId,
      status: 'completed',
      dossier,
      metadata: {
        processing_time_ms: totalDuration,
        total_cost: totalCost,
        stages_completed: stages.length,
        stage_metrics: stages
      }
    }, { headers: SECURITY_HEADERS })

  } catch (error) {
    console.error('Pipeline error:', error)
    return NextResponse.json(
      { error: 'Pipeline execution failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: SECURITY_HEADERS }
    )
  }
}

/**
 * GET /api/pipeline
 * Get pipeline status
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const executionId = searchParams.get('execution_id')

  if (!executionId) {
    return NextResponse.json(
      { error: 'execution_id is required' },
      { status: 400, headers: SECURITY_HEADERS }
    )
  }

  // In production, this would look up the execution status from storage
  return NextResponse.json({
    execution_id: executionId,
    status: 'completed',
    progress: {
      current_stage: 9,
      total_stages: 9,
      percentage: 100
    }
  }, { headers: SECURITY_HEADERS })
}
