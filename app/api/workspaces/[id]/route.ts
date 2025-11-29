import { NextRequest, NextResponse } from 'next/server'
import { SECURITY_HEADERS } from '@/lib/security'
import { nowISO } from '@/lib/business-logic'

export const runtime = 'edge'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/workspaces/[id]
 * Get a specific workspace
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const { id } = await params
  const { searchParams } = new URL(request.url)
  const runLimit = Math.min(parseInt(searchParams.get('run_limit') || '10'), 50)

  if (!id) {
    return NextResponse.json(
      { error: 'Workspace ID is required' },
      { status: 400, headers: SECURITY_HEADERS }
    )
  }

  // In production, this would look up from database
  // For demo, return a sample workspace
  const workspace = {
    id: 1,
    public_id: `ws_${id}`,
    slug: id,
    name: 'Demo Workspace',
    description: 'A demo workspace for testing',
    created_at: nowISO(),
    updated_at: nowISO(),
    members: [
      {
        id: 1,
        email: 'demo@launchloom.com',
        role: 'owner',
        status: 'active',
        invited_at: nowISO(),
        joined_at: nowISO()
      }
    ],
    runs: []
  }

  return NextResponse.json(workspace, { headers: SECURITY_HEADERS })
}

/**
 * PATCH /api/workspaces/[id]
 * Update a workspace
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  const { id } = await params

  try {
    const updates = await request.json()

    // In production, this would update in database
    return NextResponse.json({
      id,
      ...updates,
      updated_at: nowISO()
    }, { headers: SECURITY_HEADERS })

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update workspace' },
      { status: 500, headers: SECURITY_HEADERS }
    )
  }
}

/**
 * DELETE /api/workspaces/[id]
 * Delete a workspace
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  const { id } = await params

  // In production, this would delete from database
  return NextResponse.json(
    { deleted: true, id },
    { headers: SECURITY_HEADERS }
  )
}
