/**
 * Feasibility Agent - Stage 3 of the Launchloom Pipeline
 *
 * Responsible for:
 * - Technical complexity assessment
 * - Technology stack recommendations
 * - Development timeline estimation
 * - Resource requirements analysis
 * - Technical risk identification
 */

import { LaunchloomAgentsService, AgentMessage } from '../services/LaunchloomAgentsService'
import { Logger } from '../utils/Logger'
import { FeasibilityResult, IdeaContext, NormalizeResult, ResearchResult } from '../types/Pipeline'

const SYSTEM_PROMPT = `You are the Feasibility Agent in the Launchloom pipeline. Your job is to assess technical and business feasibility of startup ideas.

Your output must be valid JSON with these fields:
- score: Technical complexity score from 1 (trivial) to 10 (extremely complex)
- technologies: Array of recommended technologies and skills needed
- timeline: Object with mvp, beta, and launch timeline estimates
- resources: Object with team, budget, and infrastructure requirements
- risks: Array of technical risk factors

Be realistic about timelines. Consider modern tech stacks. Account for MVP vs full product.`

export class FeasibilityAgent {
  private agentService: LaunchloomAgentsService
  private logger: Logger

  constructor(agentService: LaunchloomAgentsService) {
    this.agentService = agentService
    this.logger = new Logger('FeasibilityAgent')
  }

  async execute(
    context: IdeaContext,
    normalizeResult: NormalizeResult,
    researchResult: ResearchResult
  ): Promise<FeasibilityResult> {
    this.logger.info('Starting feasibility analysis', { title: normalizeResult.title })

    const messages: AgentMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Assess feasibility for this startup:

Title: ${normalizeResult.title}
One-liner: ${normalizeResult.oneLiner}
Problem: ${normalizeResult.problem}
Value Proposition: ${normalizeResult.valueProposition}

Market Size: ${researchResult.marketSize}
Competitors: ${researchResult.competitors.map(c => c.name).join(', ') || 'None identified'}

Budget Constraint: ${context.budget || 'Not specified'}
Timeline Constraint: ${context.timeline || 'Not specified'}

Respond with valid JSON only.`
      }
    ]

    try {
      const response = await this.agentService.sendMessage(messages, {
        model: 'gpt-4.1-mini',
        maxTokens: 2000,
        temperature: 0.7
      })

      const result = this.parseResult(response.content)

      this.logger.info('Feasibility analysis complete', {
        score: result.score,
        cost: response.usage.cost
      })

      return result
    } catch (error) {
      this.logger.error('Feasibility analysis failed', error)
      return this.getFallbackResult()
    }
  }

  private parseResult(content: string): FeasibilityResult {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          score: Math.min(10, Math.max(1, parsed.score || 5)),
          technologies: parsed.technologies || [],
          timeline: {
            mvp: parsed.timeline?.mvp || '4-6 weeks',
            beta: parsed.timeline?.beta || '8-12 weeks',
            launch: parsed.timeline?.launch || '16-20 weeks'
          },
          resources: {
            team: parsed.resources?.team || ['Full-stack developer', 'Product designer'],
            budget: parsed.resources?.budget || '$10,000-50,000 for MVP',
            infrastructure: parsed.resources?.infrastructure || ['Cloud hosting', 'Database', 'CDN']
          },
          risks: parsed.risks || []
        }
      }
    } catch (e) {
      this.logger.warn('Failed to parse feasibility JSON', e)
    }

    return this.getFallbackResult()
  }

  private getFallbackResult(): FeasibilityResult {
    return {
      score: 5,
      technologies: ['React/Next.js', 'Node.js', 'PostgreSQL', 'Redis'],
      timeline: {
        mvp: '6-8 weeks',
        beta: '12-16 weeks',
        launch: '20-24 weeks'
      },
      resources: {
        team: ['Full-stack developer', 'Product designer', 'DevOps engineer'],
        budget: '$25,000-75,000 for MVP',
        infrastructure: ['AWS/Vercel', 'PostgreSQL', 'Redis', 'CDN']
      },
      risks: ['Technical complexity', 'Resource constraints', 'Timeline uncertainty']
    }
  }
}
