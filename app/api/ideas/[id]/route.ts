import { NextRequest, NextResponse } from 'next/server'
import { SECURITY_HEADERS } from '@/lib/security'
import { scoreIdea, toSlug, TemplateGenerator, nowISO } from '@/lib/business-logic'

export const runtime = 'edge'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/ideas/[id]
 * Get a specific idea with its dossier
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const { id } = await params

  if (!id || !id.startsWith('idea_')) {
    return NextResponse.json(
      { error: 'Invalid idea ID' },
      { status: 400, headers: SECURITY_HEADERS }
    )
  }

  // In production, this would look up from database
  // For demo, return a sample dossier
  const sampleIdea = 'An AI-powered platform for startup ideation'
  const scores = scoreIdea(sampleIdea)
  const slug = 'sample-startup'

  const dossier = {
    id,
    slug,
    created_at: nowISO(),
    updated_at: nowISO(),
    title: 'Sample Startup',
    one_liner: 'Transform ideas into startups',
    idea_text: sampleIdea,
    scores,
    status: 'completed',
    prd: TemplateGenerator.makePRD('Sample Startup', 'Transform ideas', sampleIdea, scores),
    runbook: TemplateGenerator.makeRunbook('Sample Startup'),
    repo: TemplateGenerator.makeRepoTree(slug),
    api: TemplateGenerator.makeAPISketch()
  }

  return NextResponse.json(dossier, { headers: SECURITY_HEADERS })
}

/**
 * DELETE /api/ideas/[id]
 * Delete an idea
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  const { id } = await params

  if (!id || !id.startsWith('idea_')) {
    return NextResponse.json(
      { error: 'Invalid idea ID' },
      { status: 400, headers: SECURITY_HEADERS }
    )
  }

  // In production, this would delete from database
  return NextResponse.json(
    { deleted: true, id },
    { headers: SECURITY_HEADERS }
  )
}
