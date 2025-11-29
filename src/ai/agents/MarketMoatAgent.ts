/**
 * Market & Moat Agent - Stage 4 of the Launchloom Pipeline
 *
 * Responsible for:
 * - Desirability scoring (user need validation)
 * - Viability assessment (business model strength)
 * - Defensibility analysis (competitive moat potential)
 * - Market timing evaluation
 * - Moat strategy recommendations
 */

import { LaunchloomAgentsService, AgentMessage } from '../services/LaunchloomAgentsService'
import { Logger } from '../utils/Logger'
import { MarketMoatResult, IdeaContext, NormalizeResult, ResearchResult, FeasibilityResult } from '../types/Pipeline'

const SYSTEM_PROMPT = `You are the Market & Moat Agent in the Launchloom pipeline. Your job is to analyze market positioning and competitive advantages.

Your output must be valid JSON with these fields:
- desirability: Score 1-100 for user need validation
- viability: Score 1-100 for business model strength
- defensibility: Score 1-100 for competitive moat potential
- timing: Score 1-100 for market readiness
- moatStrategies: Array of recommended moat-building strategies

Consider: network effects, switching costs, brand, proprietary tech, data advantages, economies of scale.`

export class MarketMoatAgent {
  private agentService: LaunchloomAgentsService
  private logger: Logger

  constructor(agentService: LaunchloomAgentsService) {
    this.agentService = agentService
    this.logger = new Logger('MarketMoatAgent')
  }

  async execute(
    context: IdeaContext,
    normalizeResult: NormalizeResult,
    researchResult: ResearchResult,
    feasibilityResult: FeasibilityResult
  ): Promise<MarketMoatResult> {
    this.logger.info('Starting market & moat analysis', { title: normalizeResult.title })

    const messages: AgentMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Analyze market positioning and competitive moat for:

Title: ${normalizeResult.title}
Problem: ${normalizeResult.problem}
Value Proposition: ${normalizeResult.valueProposition}
Target Audience: ${normalizeResult.audience}

Market Size: ${researchResult.marketSize}
Competitors: ${researchResult.competitors.map(c => `${c.name}: ${c.description}`).join('\n')}
Opportunities: ${researchResult.opportunities.join(', ')}
Challenges: ${researchResult.challenges.join(', ')}

Technical Complexity: ${feasibilityResult.score}/10
Key Technologies: ${feasibilityResult.technologies.join(', ')}

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

      this.logger.info('Market & moat analysis complete', {
        desirability: result.desirability,
        defensibility: result.defensibility,
        cost: response.usage.cost
      })

      return result
    } catch (error) {
      this.logger.error('Market & moat analysis failed', error)
      return this.getFallbackResult()
    }
  }

  private parseResult(content: string): MarketMoatResult {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          desirability: Math.min(100, Math.max(1, parsed.desirability || 50)),
          viability: Math.min(100, Math.max(1, parsed.viability || 50)),
          defensibility: Math.min(100, Math.max(1, parsed.defensibility || 50)),
          timing: Math.min(100, Math.max(1, parsed.timing || 50)),
          moatStrategies: parsed.moatStrategies || []
        }
      }
    } catch (e) {
      this.logger.warn('Failed to parse market moat JSON', e)
    }

    return this.getFallbackResult()
  }

  private getFallbackResult(): MarketMoatResult {
    return {
      desirability: 60,
      viability: 55,
      defensibility: 45,
      timing: 65,
      moatStrategies: [
        'Build network effects through user-generated content',
        'Create switching costs via data lock-in',
        'Develop proprietary technology or algorithms',
        'Establish brand recognition early'
      ]
    }
  }
}
