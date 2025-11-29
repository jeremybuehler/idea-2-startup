/**
 * Rate limiting utilities for API protection
 * Implements token bucket algorithm with sliding window
 */

interface RateLimitConfig {
  requests: number      // Max requests allowed
  window: number        // Time window in milliseconds
  keyPrefix?: string    // Prefix for storage keys
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
  retryAfter?: number
}

// In-memory store for rate limit tracking
// In production, use Redis or similar
const store = new Map<string, { count: number; resetAt: number }>()

/**
 * Check rate limit for a given key
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now()
  const windowKey = `${config.keyPrefix || 'rl'}:${key}`

  // Get or create bucket
  let bucket = store.get(windowKey)

  // Reset expired buckets
  if (!bucket || now >= bucket.resetAt) {
    bucket = {
      count: 0,
      resetAt: now + config.window
    }
    store.set(windowKey, bucket)
  }

  const remaining = Math.max(0, config.requests - bucket.count)
  const allowed = remaining > 0

  if (allowed) {
    bucket.count++
  }

  return {
    allowed,
    remaining: allowed ? remaining - 1 : 0,
    resetAt: bucket.resetAt,
    retryAfter: allowed ? undefined : Math.ceil((bucket.resetAt - now) / 1000)
  }
}

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMITS = {
  // Pipeline operations - expensive, limit strictly
  pipeline: {
    requests: 10,
    window: 60 * 1000, // 10 per minute
    keyPrefix: 'rl:pipeline'
  },

  // Idea operations - moderate limits
  ideas: {
    requests: 30,
    window: 60 * 1000, // 30 per minute
    keyPrefix: 'rl:ideas'
  },

  // Workspace operations - relatively cheap
  workspaces: {
    requests: 100,
    window: 60 * 1000, // 100 per minute
    keyPrefix: 'rl:workspaces'
  },

  // General API - default limits
  default: {
    requests: 60,
    window: 60 * 1000, // 60 per minute
    keyPrefix: 'rl:default'
  },

  // Health checks - allow more
  health: {
    requests: 300,
    window: 60 * 1000, // 300 per minute
    keyPrefix: 'rl:health'
  }
} as const

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetAt / 1000).toString()
  }

  if (result.retryAfter !== undefined) {
    headers['Retry-After'] = result.retryAfter.toString()
  }

  return headers
}

/**
 * Extract client identifier from request
 * Uses IP address or API key
 */
export function getClientId(request: Request): string {
  // Check for API key first
  const apiKey = request.headers.get('x-api-key') ||
                 request.headers.get('authorization')?.replace('Bearer ', '')
  if (apiKey) {
    return `api:${apiKey.slice(0, 8)}`
  }

  // Fallback to IP address
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return `ip:${forwardedFor.split(',')[0].trim()}`
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return `ip:${realIp}`
  }

  // Default identifier for local development
  return 'ip:local'
}

/**
 * Rate limiting middleware for Next.js API routes
 */
export function withRateLimit(
  handler: (request: Request) => Promise<Response>,
  config: RateLimitConfig = RATE_LIMITS.default
) {
  return async (request: Request): Promise<Response> => {
    const clientId = getClientId(request)
    const result = checkRateLimit(clientId, config)

    if (!result.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: result.retryAfter
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...getRateLimitHeaders(result)
          }
        }
      )
    }

    const response = await handler(request)

    // Add rate limit headers to response
    const headers = new Headers(response.headers)
    const rateLimitHeaders = getRateLimitHeaders(result)
    Object.entries(rateLimitHeaders).forEach(([key, value]) => {
      headers.set(key, value)
    })

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    })
  }
}

/**
 * Cleanup expired entries (run periodically)
 */
export function cleanupExpired(): void {
  const now = Date.now()
  for (const [key, value] of store.entries()) {
    if (now >= value.resetAt) {
      store.delete(key)
    }
  }
}

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpired, 5 * 60 * 1000)
}
