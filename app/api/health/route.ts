import { NextResponse } from 'next/server'
import { SECURITY_HEADERS } from '@/lib/security'

export const runtime = 'edge'

/**
 * GET /api/health
 * Health check endpoint
 */
export async function GET() {
  const health = {
    status: 'healthy',
    service: 'launchloom-api',
    version: process.env.APP_VERSION || '0.1.0',
    timestamp: new Date().toISOString(),
    checks: {
      api: 'ok',
      env: process.env.NODE_ENV || 'development'
    }
  }

  return NextResponse.json(health, { headers: SECURITY_HEADERS })
}
