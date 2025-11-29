/**
 * Environment variable validation and configuration
 * Validates required and optional environment variables at runtime
 */

import { z } from 'zod'

// Schema for environment variables
const envSchema = z.object({
  // AI/LLM Configuration (required for live mode)
  OPENAI_API_KEY: z.string().optional(),
  LAUNCHLOOM_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),

  // Frontend Configuration
  NEXT_PUBLIC_API_BASE: z.string().url().optional(),
  NEXT_PUBLIC_USE_LIVE: z.enum(['true', 'false']).default('false'),
  NEXT_PUBLIC_LEAD_CAPTURE_URL: z.string().url().optional(),
  NEXT_PUBLIC_WS_URL: z.string().url().optional(),

  // AI Configuration
  QUALITY_THRESHOLD: z.string().transform(Number).pipe(z.number().min(0).max(1)).default('0.7'),
  BUDGET_LIMIT: z.string().transform(Number).pipe(z.number().positive()).default('10.0'),

  // Development Variables
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  APP_ENV: z.enum(['local', 'staging', 'production']).default('local'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('debug'),

  // Build-time Variables
  APP_NAME: z.string().default('Launchloom'),
  APP_VERSION: z.string().optional(),

  // Database Configuration (optional)
  DATABASE_URL: z.string().url().optional(),
  REDIS_URL: z.string().url().optional(),

  // Monitoring (optional)
  PROMETHEUS_ENDPOINT: z.string().url().optional(),
  JAEGER_ENDPOINT: z.string().url().optional(),

  // Workspace defaults (optional)
  LAUNCHLOOM_DEFAULT_WORKSPACE_ID: z.string().optional(),
  LAUNCHLOOM_DEFAULT_WORKSPACE_NAME: z.string().optional(),
})

export type EnvConfig = z.infer<typeof envSchema>

// Validation result type
interface ValidationResult {
  success: boolean
  config: EnvConfig | null
  errors: string[]
  warnings: string[]
}

/**
 * Validate environment variables
 */
export function validateEnv(): ValidationResult {
  const warnings: string[] = []

  try {
    const config = envSchema.parse({
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      LAUNCHLOOM_API_KEY: process.env.LAUNCHLOOM_API_KEY,
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
      NEXT_PUBLIC_API_BASE: process.env.NEXT_PUBLIC_API_BASE || undefined,
      NEXT_PUBLIC_USE_LIVE: process.env.NEXT_PUBLIC_USE_LIVE,
      NEXT_PUBLIC_LEAD_CAPTURE_URL: process.env.NEXT_PUBLIC_LEAD_CAPTURE_URL || undefined,
      NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || undefined,
      QUALITY_THRESHOLD: process.env.QUALITY_THRESHOLD,
      BUDGET_LIMIT: process.env.BUDGET_LIMIT,
      NODE_ENV: process.env.NODE_ENV,
      APP_ENV: process.env.APP_ENV,
      LOG_LEVEL: process.env.LOG_LEVEL,
      APP_NAME: process.env.APP_NAME,
      APP_VERSION: process.env.APP_VERSION,
      DATABASE_URL: process.env.DATABASE_URL || undefined,
      REDIS_URL: process.env.REDIS_URL || undefined,
      PROMETHEUS_ENDPOINT: process.env.PROMETHEUS_ENDPOINT || undefined,
      JAEGER_ENDPOINT: process.env.JAEGER_ENDPOINT || undefined,
      LAUNCHLOOM_DEFAULT_WORKSPACE_ID: process.env.LAUNCHLOOM_DEFAULT_WORKSPACE_ID,
      LAUNCHLOOM_DEFAULT_WORKSPACE_NAME: process.env.LAUNCHLOOM_DEFAULT_WORKSPACE_NAME,
    })

    // Check for warnings
    if (config.NEXT_PUBLIC_USE_LIVE === 'true' && !config.OPENAI_API_KEY) {
      warnings.push('Live mode enabled but OPENAI_API_KEY is not set')
    }

    if (config.NEXT_PUBLIC_USE_LIVE === 'true' && !config.NEXT_PUBLIC_API_BASE) {
      warnings.push('Live mode enabled but NEXT_PUBLIC_API_BASE is not set')
    }

    if (config.NODE_ENV === 'production' && !config.DATABASE_URL) {
      warnings.push('Production mode without DATABASE_URL - using in-memory storage')
    }

    return {
      success: true,
      config,
      errors: [],
      warnings
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        config: null,
        errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
        warnings
      }
    }
    return {
      success: false,
      config: null,
      errors: [error instanceof Error ? error.message : 'Unknown validation error'],
      warnings
    }
  }
}

/**
 * Get validated environment config
 * Throws if validation fails in production
 */
export function getEnvConfig(): EnvConfig {
  const result = validateEnv()

  if (!result.success) {
    const errorMsg = `Environment validation failed:\n${result.errors.join('\n')}`
    if (process.env.NODE_ENV === 'production') {
      throw new Error(errorMsg)
    }
    console.warn(errorMsg)
    // Return safe defaults in development
    return {
      NEXT_PUBLIC_USE_LIVE: 'false',
      QUALITY_THRESHOLD: 0.7,
      BUDGET_LIMIT: 10.0,
      NODE_ENV: 'development',
      APP_ENV: 'local',
      LOG_LEVEL: 'debug',
      APP_NAME: 'Launchloom',
    } as EnvConfig
  }

  // Log warnings
  if (result.warnings.length > 0) {
    console.warn('Environment warnings:\n' + result.warnings.join('\n'))
  }

  return result.config!
}

/**
 * Check if live mode is enabled and properly configured
 */
export function isLiveModeAvailable(): boolean {
  const config = getEnvConfig()
  return (
    config.NEXT_PUBLIC_USE_LIVE === 'true' &&
    !!config.NEXT_PUBLIC_API_BASE &&
    !!config.OPENAI_API_KEY
  )
}

/**
 * Get API configuration
 */
export function getApiConfig() {
  const config = getEnvConfig()
  return {
    baseUrl: config.NEXT_PUBLIC_API_BASE || '',
    wsUrl: config.NEXT_PUBLIC_WS_URL || config.NEXT_PUBLIC_API_BASE?.replace('http', 'ws') || '',
    useLive: config.NEXT_PUBLIC_USE_LIVE === 'true',
    qualityThreshold: config.QUALITY_THRESHOLD,
    budgetLimit: config.BUDGET_LIMIT,
  }
}

// Export singleton config
export const env = getEnvConfig()
