/**
 * Code Scaffold Agent - Stage 7 of the Launchloom Pipeline
 *
 * Responsible for:
 * - Technology stack recommendations
 * - Project structure generation
 * - Component and module definition
 * - Database schema design
 * - API structure planning
 */

import { LaunchloomAgentsService, AgentMessage } from '../services/LaunchloomAgentsService'
import { Logger } from '../utils/Logger'
import { CodeScaffoldResult, IdeaContext, NormalizeResult, FeasibilityResult, UXDesignResult } from '../types/Pipeline'

const SYSTEM_PROMPT = `You are the Code Scaffold Agent in the Launchloom pipeline. Your job is to architect scalable, maintainable technical solutions.

Your output must be valid JSON with these fields:
- techStack: Object with frontend, backend, database, infrastructure, tools arrays
- structure: Object with directories array and files array of {path, description}
- components: Array of {name, type, description, dependencies}
- database: Object with schema array of {table, fields, relationships}
- apiStructure: Object with version, baseUrl, authentication, endpoints

Use modern best practices. Consider scalability from day one. Prefer proven technologies.`

export class CodeScaffoldAgent {
  private agentService: LaunchloomAgentsService
  private logger: Logger

  constructor(agentService: LaunchloomAgentsService) {
    this.agentService = agentService
    this.logger = new Logger('CodeScaffoldAgent')
  }

  async execute(
    context: IdeaContext,
    normalizeResult: NormalizeResult,
    feasibilityResult: FeasibilityResult,
    uxDesignResult: UXDesignResult
  ): Promise<CodeScaffoldResult> {
    this.logger.info('Starting code scaffold', { title: normalizeResult.title })

    const messages: AgentMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Generate code architecture for:

Title: ${normalizeResult.title}
One-liner: ${normalizeResult.oneLiner}
Value Proposition: ${normalizeResult.valueProposition}

Technical Context:
- Complexity Score: ${feasibilityResult.score}/10
- Recommended Technologies: ${feasibilityResult.technologies.join(', ')}
- Timeline: MVP in ${feasibilityResult.timeline.mvp}

Key User Flows:
${uxDesignResult.keyFlows.map(f => `- ${f.name}: ${f.steps.join(' -> ')}`).join('\n')}

Requirements:
- Include code scaffold: ${context.requirements?.includeCodeScaffold ?? true}
- Analysis depth: ${context.requirements?.analysisDepth || 'standard'}

Respond with valid JSON only.`
      }
    ]

    try {
      const response = await this.agentService.sendMessage(messages, {
        model: 'gpt-4.1',
        maxTokens: 3500,
        temperature: 0.7
      })

      const result = this.parseResult(response.content)

      this.logger.info('Code scaffold complete', {
        components: result.components.length,
        tables: result.database.schema.length,
        cost: response.usage.cost
      })

      return result
    } catch (error) {
      this.logger.error('Code scaffold failed', error)
      return this.getFallbackResult(normalizeResult)
    }
  }

  private parseResult(content: string): CodeScaffoldResult {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          techStack: {
            frontend: parsed.techStack?.frontend || ['Next.js', 'React', 'TypeScript', 'Tailwind CSS'],
            backend: parsed.techStack?.backend || ['Node.js', 'Express', 'TypeScript'],
            database: parsed.techStack?.database || ['PostgreSQL', 'Redis'],
            infrastructure: parsed.techStack?.infrastructure || ['Vercel', 'AWS'],
            tools: parsed.techStack?.tools || ['ESLint', 'Prettier', 'Jest']
          },
          structure: {
            directories: parsed.structure?.directories || [],
            files: (parsed.structure?.files || []).map((f: { path?: string; description?: string }) => ({
              path: f.path || '',
              description: f.description || ''
            }))
          },
          components: (parsed.components || []).map((c: { name?: string; type?: string; description?: string; dependencies?: string[] }) => ({
            name: c.name || 'Unknown',
            type: c.type || 'component',
            description: c.description || '',
            dependencies: c.dependencies || []
          })),
          database: {
            schema: (parsed.database?.schema || []).map((t: { table?: string; fields?: { name?: string; type?: string; nullable?: boolean }[]; relationships?: { type?: string; target?: string }[] }) => ({
              table: t.table || 'unknown',
              fields: (t.fields || []).map(f => ({
                name: f.name || 'id',
                type: f.type || 'string',
                nullable: f.nullable ?? false
              })),
              relationships: (t.relationships || []).map(r => ({
                type: r.type || 'one-to-many',
                target: r.target || ''
              }))
            }))
          },
          apiStructure: {
            version: parsed.apiStructure?.version || 'v1',
            baseUrl: parsed.apiStructure?.baseUrl || '/api/v1',
            authentication: parsed.apiStructure?.authentication || 'JWT',
            endpoints: (parsed.apiStructure?.endpoints || []).map((e: { method?: string; path?: string; description?: string }) => ({
              method: e.method || 'GET',
              path: e.path || '/',
              description: e.description || ''
            }))
          }
        }
      }
    } catch (e) {
      this.logger.warn('Failed to parse code scaffold JSON', e)
    }

    return this.getFallbackResult()
  }

  private getFallbackResult(normalizeResult?: NormalizeResult): CodeScaffoldResult {
    return {
      techStack: {
        frontend: ['Next.js 14', 'React 18', 'TypeScript', 'Tailwind CSS', 'shadcn/ui'],
        backend: ['FastAPI', 'Python 3.11', 'SQLAlchemy'],
        database: ['PostgreSQL', 'Redis'],
        infrastructure: ['Vercel', 'Fly.io', 'AWS S3'],
        tools: ['ESLint', 'Prettier', 'Jest', 'Pytest', 'Docker']
      },
      structure: {
        directories: [
          '/app - Next.js app directory',
          '/components - React components',
          '/lib - Utility functions',
          '/api - API routes',
          '/backend - FastAPI backend',
          '/tests - Test files'
        ],
        files: [
          { path: 'app/page.tsx', description: 'Main landing page' },
          { path: 'app/layout.tsx', description: 'Root layout with providers' },
          { path: 'components/ui/', description: 'UI component library' },
          { path: 'lib/utils.ts', description: 'Utility functions' },
          { path: 'backend/main.py', description: 'FastAPI entry point' }
        ]
      },
      components: [
        { name: 'Header', type: 'component', description: 'Site header with navigation', dependencies: ['Button', 'Logo'] },
        { name: 'Dashboard', type: 'component', description: 'Main dashboard view', dependencies: ['Card', 'Chart', 'Table'] },
        { name: 'AuthService', type: 'service', description: 'Authentication service', dependencies: ['JWT', 'Database'] },
        { name: 'UserModel', type: 'model', description: 'User data model', dependencies: ['SQLAlchemy'] }
      ],
      database: {
        schema: [
          {
            table: 'users',
            fields: [
              { name: 'id', type: 'uuid', nullable: false },
              { name: 'email', type: 'varchar(255)', nullable: false },
              { name: 'password_hash', type: 'varchar(255)', nullable: false },
              { name: 'created_at', type: 'timestamp', nullable: false }
            ],
            relationships: [{ type: 'one-to-many', target: 'ideas' }]
          },
          {
            table: 'ideas',
            fields: [
              { name: 'id', type: 'uuid', nullable: false },
              { name: 'user_id', type: 'uuid', nullable: false },
              { name: 'title', type: 'varchar(255)', nullable: false },
              { name: 'content', type: 'text', nullable: false },
              { name: 'created_at', type: 'timestamp', nullable: false }
            ],
            relationships: [{ type: 'many-to-one', target: 'users' }]
          }
        ]
      },
      apiStructure: {
        version: 'v1',
        baseUrl: '/api/v1',
        authentication: 'JWT Bearer Token',
        endpoints: [
          { method: 'POST', path: '/auth/login', description: 'User login' },
          { method: 'POST', path: '/auth/register', description: 'User registration' },
          { method: 'GET', path: '/ideas', description: 'List user ideas' },
          { method: 'POST', path: '/ideas', description: 'Create new idea' },
          { method: 'GET', path: '/ideas/:id', description: 'Get idea details' }
        ]
      }
    }
  }
}
