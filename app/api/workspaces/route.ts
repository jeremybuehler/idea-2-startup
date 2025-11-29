import { NextRequest, NextResponse } from 'next/server'
import { sanitizeProjectSlug, sanitizeUserInput, SECURITY_HEADERS } from '@/lib/security'
import { toSlug, nowISO } from '@/lib/business-logic'

export const runtime = 'edge'

interface WorkspaceRequest {
  name: string
  description?: string
  slug?: string
}

/**
 * POST /api/workspaces
 * Create a new workspace
 */
export async function POST(request: NextRequest) {
  try {
    const body: WorkspaceRequest = await request.json()

    if (!body.name || body.name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Workspace name is required (min 2 characters)' },
        { status: 400, headers: SECURITY_HEADERS }
      )
    }

    const safeName = sanitizeUserInput(body.name).slice(0, 100)
    const slug = body.slug ? sanitizeProjectSlug(body.slug) : toSlug(safeName)
    const publicId = `ws_${Math.random().toString(36).slice(2, 10)}`

    const workspace = {
      id: Math.floor(Math.random() * 1000000),
      public_id: publicId,
      slug,
      name: safeName,
      description: body.description ? sanitizeUserInput(body.description).slice(0, 500) : null,
      created_at: nowISO(),
      updated_at: nowISO(),
      members: [],
      runs: []
    }

    return NextResponse.json(workspace, {
      status: 201,
      headers: SECURITY_HEADERS
    })

  } catch (error) {
    console.error('Workspace creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create workspace', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: SECURITY_HEADERS }
    )
  }
}

/**
 * GET /api/workspaces
 * List workspaces
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

  // In production, this would query from database
  // For demo purposes, return empty list
  return NextResponse.json({
    items: [],
    total: 0,
    limit
  }, { headers: SECURITY_HEADERS })
}
