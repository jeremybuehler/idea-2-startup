/**
 * API Design Agent - Stage 8 of the Launchloom Pipeline
 *
 * Responsible for:
 * - REST API endpoint specification
 * - Data model and schema definition
 * - Authentication strategy design
 * - Security and rate limiting
 * - API documentation structure
 */

import { LaunchloomAgentsService, AgentMessage } from '../services/LaunchloomAgentsService'
import { Logger } from '../utils/Logger'
import { APIDesignResult, IdeaContext, NormalizeResult, CodeScaffoldResult } from '../types/Pipeline'

const SYSTEM_PROMPT = `You are the API Design Agent in the Launchloom pipeline. Your job is to design robust, secure, and well-documented APIs.

Your output must be valid JSON with these fields:
- endpoints: Array of {method, path, description, parameters, requestBody, responses}
- models: Array of {name, description, properties}
- authentication: Object with type, description, implementation
- security: Object with rateLimit, cors, validation
- documentation: Object with openapi, postman, examples

Design RESTful APIs. Consider versioning. Plan for scale.`

export class APIDesignAgent {
  private agentService: LaunchloomAgentsService
  private logger: Logger

  constructor(agentService: LaunchloomAgentsService) {
    this.agentService = agentService
    this.logger = new Logger('APIDesignAgent')
  }

  async execute(
    context: IdeaContext,
    normalizeResult: NormalizeResult,
    codeScaffoldResult: CodeScaffoldResult
  ): Promise<APIDesignResult> {
    this.logger.info('Starting API design', { title: normalizeResult.title })

    const messages: AgentMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Design comprehensive API for:

Title: ${normalizeResult.title}
Value Proposition: ${normalizeResult.valueProposition}

Tech Stack:
- Backend: ${codeScaffoldResult.techStack.backend.join(', ')}
- Database: ${codeScaffoldResult.techStack.database.join(', ')}

Existing API Structure:
- Base URL: ${codeScaffoldResult.apiStructure.baseUrl}
- Auth: ${codeScaffoldResult.apiStructure.authentication}
- Endpoints: ${codeScaffoldResult.apiStructure.endpoints.map(e => `${e.method} ${e.path}`).join(', ')}

Database Schema:
${codeScaffoldResult.database.schema.map(t => `- ${t.table}: ${t.fields.map(f => f.name).join(', ')}`).join('\n')}

Respond with valid JSON only.`
      }
    ]

    try {
      const response = await this.agentService.sendMessage(messages, {
        model: 'gpt-4.1',
        maxTokens: 3000,
        temperature: 0.7
      })

      const result = this.parseResult(response.content)

      this.logger.info('API design complete', {
        endpoints: result.endpoints.length,
        models: result.models.length,
        cost: response.usage.cost
      })

      return result
    } catch (error) {
      this.logger.error('API design failed', error)
      return this.getFallbackResult()
    }
  }

  private parseResult(content: string): APIDesignResult {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          endpoints: (parsed.endpoints || []).map((e: {
            method?: string
            path?: string
            description?: string
            parameters?: { name?: string; type?: string; required?: boolean; description?: string }[]
            requestBody?: { type?: string; schema?: unknown }
            responses?: { status?: number; description?: string; schema?: unknown }[]
          }) => ({
            method: (e.method?.toUpperCase() || 'GET') as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
            path: e.path || '/',
            description: e.description || '',
            parameters: (e.parameters || []).map(p => ({
              name: p.name || '',
              type: p.type || 'string',
              required: p.required ?? false,
              description: p.description || ''
            })),
            requestBody: e.requestBody,
            responses: (e.responses || []).map(r => ({
              status: r.status || 200,
              description: r.description || '',
              schema: r.schema
            }))
          })),
          models: (parsed.models || []).map((m: {
            name?: string
            description?: string
            properties?: { name?: string; type?: string; required?: boolean; description?: string }[]
          }) => ({
            name: m.name || 'Unknown',
            description: m.description || '',
            properties: (m.properties || []).map(p => ({
              name: p.name || '',
              type: p.type || 'string',
              required: p.required ?? false,
              description: p.description || ''
            }))
          })),
          authentication: {
            type: (parsed.authentication?.type || 'jwt') as 'jwt' | 'oauth' | 'api-key' | 'session',
            description: parsed.authentication?.description || 'JWT Bearer Token authentication',
            implementation: parsed.authentication?.implementation || ''
          },
          security: {
            rateLimit: {
              requests: parsed.security?.rateLimit?.requests || 100,
              window: parsed.security?.rateLimit?.window || '1m'
            },
            cors: {
              origins: parsed.security?.cors?.origins || ['*'],
              methods: parsed.security?.cors?.methods || ['GET', 'POST', 'PUT', 'DELETE']
            },
            validation: parsed.security?.validation || ['Input sanitization', 'Schema validation']
          },
          documentation: {
            openapi: parsed.documentation?.openapi || '3.0.0',
            postman: parsed.documentation?.postman || 'Collection available',
            examples: (parsed.documentation?.examples || []).map((ex: { endpoint?: string; example?: unknown }) => ({
              endpoint: ex.endpoint || '',
              example: ex.example
            }))
          }
        }
      }
    } catch (e) {
      this.logger.warn('Failed to parse API design JSON', e)
    }

    return this.getFallbackResult()
  }

  private getFallbackResult(): APIDesignResult {
    return {
      endpoints: [
        {
          method: 'POST',
          path: '/api/v1/auth/login',
          description: 'Authenticate user and return JWT token',
          parameters: [],
          requestBody: { type: 'object', schema: { email: 'string', password: 'string' } },
          responses: [
            { status: 200, description: 'Success', schema: { token: 'string', user: 'object' } },
            { status: 401, description: 'Invalid credentials', schema: { error: 'string' } }
          ]
        },
        {
          method: 'GET',
          path: '/api/v1/ideas',
          description: 'List user ideas with pagination',
          parameters: [
            { name: 'limit', type: 'integer', required: false, description: 'Items per page' },
            { name: 'offset', type: 'integer', required: false, description: 'Pagination offset' }
          ],
          responses: [
            { status: 200, description: 'Success', schema: { items: 'array', total: 'integer' } }
          ]
        },
        {
          method: 'POST',
          path: '/api/v1/ideas',
          description: 'Create a new idea',
          parameters: [],
          requestBody: { type: 'object', schema: { title: 'string', content: 'string' } },
          responses: [
            { status: 201, description: 'Created', schema: { id: 'string', title: 'string' } },
            { status: 400, description: 'Validation error', schema: { errors: 'array' } }
          ]
        }
      ],
      models: [
        {
          name: 'User',
          description: 'User account model',
          properties: [
            { name: 'id', type: 'uuid', required: true, description: 'Unique identifier' },
            { name: 'email', type: 'string', required: true, description: 'Email address' },
            { name: 'created_at', type: 'datetime', required: true, description: 'Creation timestamp' }
          ]
        },
        {
          name: 'Idea',
          description: 'Startup idea model',
          properties: [
            { name: 'id', type: 'uuid', required: true, description: 'Unique identifier' },
            { name: 'title', type: 'string', required: true, description: 'Idea title' },
            { name: 'content', type: 'string', required: true, description: 'Idea description' },
            { name: 'scores', type: 'object', required: false, description: 'Scoring metrics' }
          ]
        }
      ],
      authentication: {
        type: 'jwt',
        description: 'JWT Bearer Token with refresh token rotation',
        implementation: 'RS256 signing with 15min access token, 7d refresh token'
      },
      security: {
        rateLimit: { requests: 100, window: '1m' },
        cors: { origins: ['https://launchloom.com'], methods: ['GET', 'POST', 'PUT', 'DELETE'] },
        validation: ['Zod schema validation', 'SQL injection prevention', 'XSS sanitization']
      },
      documentation: {
        openapi: '3.0.0',
        postman: 'Exported collection with environment variables',
        examples: [
          { endpoint: 'POST /auth/login', example: { email: 'user@example.com', password: 'secure123' } }
        ]
      }
    }
  }
}
