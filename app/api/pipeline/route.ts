import { NextRequest, NextResponse } from 'next/server'
import { validateIdeaInput, SECURITY_HEADERS } from '@/lib/security'
import { PipelineOrchestrator } from '@/src/ai/orchestrator/PipelineOrchestrator'
import { IdeaContext } from '@/src/ai/types/Pipeline'

// Use nodejs runtime for AI agent execution (not edge)
export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes max for pipeline execution

interface PipelineRequest {
  title: string
  one_liner: string
  idea_text: string
  workspace_id?: string
  options?: {
    includeWireframes?: boolean
    includeCodeScaffold?: boolean
    includeRunbook?: boolean
    analysisDepth?: 'quick' | 'standard' | 'detailed'
  }
}

// In-memory store for execution status (in production, use Redis)
const executionStore = new Map<string, {
  status: 'running' | 'completed' | 'failed'
  progress: number
  currentStage: string
  result?: unknown
  error?: string
}>()

/**
 * POST /api/pipeline
 * Start a new pipeline execution that runs all 9 AI agents
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

    // Check for API key
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Set OPENAI_API_KEY environment variable.' },
        { status: 500, headers: SECURITY_HEADERS }
      )
    }

    // Build idea context
    const context: IdeaContext = {
      ideaText: validation.sanitized,
      requirements: {
        includeWireframes: body.options?.includeWireframes ?? true,
        includeCodeScaffold: body.options?.includeCodeScaffold ?? true,
        includeRunbook: body.options?.includeRunbook ?? true,
        analysisDepth: body.options?.analysisDepth ?? 'standard'
      },
      constraints: {
        maxCost: 10.0, // $10 budget limit
        maxDuration: 300000, // 5 minutes
        qualityThreshold: 0.7
      }
    }

    // Create orchestrator with progress tracking
    const orchestrator = new PipelineOrchestrator({
      apiKey,
      qualityThreshold: 0.7,
      budgetLimit: 10.0,
      timeoutMs: 300000,
      onProgress: (progress) => {
        // Could emit via WebSocket in production
        console.log(`Pipeline progress: ${progress.percentage}% - Stage ${progress.currentStage}/${progress.totalStages}`)
      },
      onStageComplete: (stage, result) => {
        console.log(`Stage ${stage} completed`)
      }
    })

    // Execute the full pipeline
    const result = await orchestrator.execute(context)

    // Store result for status checks
    executionStore.set(result.executionId, {
      status: 'completed',
      progress: 100,
      currentStage: 'export',
      result
    })

    return NextResponse.json({
      execution_id: result.executionId,
      status: 'completed',
      dossier: result.dossier,
      metadata: {
        processing_time_ms: result.metadata.processingTime,
        total_cost: result.metadata.totalCost,
        stages_completed: result.metadata.stagesCompleted,
        stage_metrics: result.metadata.stageMetrics,
        overall_quality: result.overallQuality
      }
    }, { headers: SECURITY_HEADERS })

  } catch (error) {
    console.error('Pipeline error:', error)
    return NextResponse.json(
      {
        error: 'Pipeline execution failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        hint: 'Check that OPENAI_API_KEY is set and valid'
      },
      { status: 500, headers: SECURITY_HEADERS }
    )
  }
}

/**
 * GET /api/pipeline
 * Get pipeline execution status
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

  const execution = executionStore.get(executionId)

  if (!execution) {
    return NextResponse.json(
      { error: 'Execution not found', execution_id: executionId },
      { status: 404, headers: SECURITY_HEADERS }
    )
  }

  return NextResponse.json({
    execution_id: executionId,
    status: execution.status,
    progress: {
      current_stage: execution.currentStage,
      percentage: execution.progress
    },
    result: execution.status === 'completed' ? execution.result : undefined,
    error: execution.error
  }, { headers: SECURITY_HEADERS })
}
