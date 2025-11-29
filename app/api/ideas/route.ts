import { NextRequest, NextResponse } from 'next/server'
import { validateIdeaInput, SECURITY_HEADERS } from '@/lib/security'
import { scoreIdea, toSlug, TemplateGenerator, nowISO } from '@/lib/business-logic'

export const runtime = 'edge'

interface IdeaRequest {
  title: string
  one_liner: string
  idea_text: string
}

/**
 * POST /api/ideas
 * Ingest a new idea and generate initial artifacts
 */
export async function POST(request: NextRequest) {
  try {
    const body: IdeaRequest = await request.json()

    // Validate input
    const validation = validateIdeaInput(body.idea_text)
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.errors },
        { status: 400, headers: SECURITY_HEADERS }
      )
    }

    // Generate idea ID
    const ideaId = `idea_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

    // Score the idea
    const scores = scoreIdea(validation.sanitized)
    const slug = toSlug(body.title || 'untitled')

    // Create idea record
    const idea = {
      id: ideaId,
      slug,
      created_at: nowISO(),
      updated_at: nowISO(),
      title: body.title || 'Untitled Startup',
      one_liner: body.one_liner || validation.sanitized.slice(0, 100),
      idea_text: validation.sanitized,
      scores,
      status: 'processed'
    }

    return NextResponse.json(idea, {
      status: 201,
      headers: SECURITY_HEADERS
    })

  } catch (error) {
    console.error('Idea ingestion error:', error)
    return NextResponse.json(
      { error: 'Failed to process idea', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: SECURITY_HEADERS }
    )
  }
}

/**
 * GET /api/ideas
 * List ideas (paginated)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100)
  const offset = parseInt(searchParams.get('offset') || '0')

  // In production, this would query from database
  // For now, return empty list
  return NextResponse.json({
    items: [],
    total: 0,
    limit,
    offset,
    has_more: false
  }, { headers: SECURITY_HEADERS })
}
