/**
 * Research Agent - Stage 2 of the Launchloom Pipeline
 *
 * Responsible for:
 * - Market research and sizing (TAM/SAM/SOM)
 * - Competitive landscape analysis
 * - Opportunity identification
 * - Risk and challenge assessment
 * - Initial PRD outline generation
 */

import { LaunchloomAgentsService, AgentMessage } from '../services/LaunchloomAgentsService'
import { ResearchService } from '../services/ResearchService'
import { Logger } from '../utils/Logger'
import { ResearchResult, IdeaContext, NormalizeResult } from '../types/Pipeline'
import { MarketIntel } from '../types/market'

const SYSTEM_PROMPT = `You are the Research Agent in the Launchloom pipeline. Your job is to conduct comprehensive market research for startup ideas.

Your output must be valid JSON with these fields:
- marketSize: Market size analysis including TAM, SAM, SOM estimates
- competitors: Array of competitor objects with name, description, strengths, weaknesses
- opportunities: Array of key market opportunities
- challenges: Array of potential challenges and barriers
- prd: Initial PRD outline in markdown format

Be evidence-based. Cite realistic market data. Consider both B2B and B2C angles where relevant.`

export class ResearchAgent {
  private agentService: LaunchloomAgentsService
  private researchService?: ResearchService
  private logger: Logger

  constructor(agentService: LaunchloomAgentsService, researchService?: ResearchService) {
    this.agentService = agentService
    this.researchService = researchService
    this.logger = new Logger('ResearchAgent')
  }

  async execute(
    context: IdeaContext,
    normalizeResult: NormalizeResult
  ): Promise<{ result: ResearchResult; marketIntel?: MarketIntel }> {
    this.logger.info('Starting research', { title: normalizeResult.title })

    // Get market intelligence if research service available
    let marketIntel: MarketIntel | undefined
    if (this.researchService) {
      try {
        marketIntel = await this.researchService.getMarketIntel(context)
        this.logger.info('Market intel retrieved', {
          competitors: marketIntel.competitors?.length || 0
        })
      } catch (e) {
        this.logger.warn('Failed to get market intel', e)
      }
    }

    const messages: AgentMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Conduct market research for this startup:

Title: ${normalizeResult.title}
One-liner: ${normalizeResult.oneLiner}
Problem: ${normalizeResult.problem}
Target Audience: ${normalizeResult.audience}
Value Proposition: ${normalizeResult.valueProposition}

Industry: ${context.industry || 'Not specified'}
Target Market: ${context.targetMarket || 'General'}

${marketIntel ? `Existing market data (use as grounding):\n${JSON.stringify(marketIntel, null, 2)}` : ''}

Respond with valid JSON only.`
      }
    ]

    try {
      const response = await this.agentService.sendMessage(messages, {
        model: 'gpt-4.1-mini',
        maxTokens: 3000,
        temperature: 0.7
      })

      const result = this.parseResult(response.content, normalizeResult)

      this.logger.info('Research complete', {
        competitors: result.competitors.length,
        cost: response.usage.cost
      })

      return { result, marketIntel }
    } catch (error) {
      this.logger.error('Research failed', error)

      return {
        result: this.getFallbackResult(normalizeResult),
        marketIntel
      }
    }
  }

  private parseResult(content: string, normalizeResult: NormalizeResult): ResearchResult {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          marketSize: parsed.marketSize || 'Market size analysis pending.',
          competitors: (parsed.competitors || []).map((c: { name?: string; description?: string; strengths?: string[]; weaknesses?: string[] }) => ({
            name: c.name || 'Unknown',
            description: c.description || '',
            strengths: c.strengths || [],
            weaknesses: c.weaknesses || []
          })),
          opportunities: parsed.opportunities || [],
          challenges: parsed.challenges || [],
          prd: parsed.prd || this.generateBasicPRD(normalizeResult)
        }
      }
    } catch (e) {
      this.logger.warn('Failed to parse research JSON', e)
    }

    return this.getFallbackResult(normalizeResult)
  }

  private getFallbackResult(normalizeResult: NormalizeResult): ResearchResult {
    return {
      marketSize: 'Market size analysis requires additional research.',
      competitors: [],
      opportunities: ['First-mover advantage in emerging market'],
      challenges: ['Market validation required'],
      prd: this.generateBasicPRD(normalizeResult)
    }
  }

  private generateBasicPRD(normalizeResult: NormalizeResult): string {
    return `# ${normalizeResult.title} - PRD

## Problem
${normalizeResult.problem}

## Target Users
${normalizeResult.audience}

## Solution
${normalizeResult.valueProposition}

## MVP Scope
- Core feature 1
- Core feature 2
- Core feature 3

## Success Metrics
- User activation rate
- Feature engagement
- Retention at 30 days
`
  }
}
