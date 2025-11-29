/**
 * Risk Assessment Agent - Stage 5 of the Launchloom Pipeline
 *
 * Responsible for:
 * - Technical risk identification and mitigation
 * - Market risk analysis
 * - Financial risk assessment
 * - Regulatory and compliance risk evaluation
 * - Risk mitigation roadmap creation
 */

import { LaunchloomAgentsService, AgentMessage } from '../services/LaunchloomAgentsService'
import { Logger } from '../utils/Logger'
import { RiskAssessmentResult, IdeaContext, NormalizeResult, ResearchResult, FeasibilityResult, MarketMoatResult } from '../types/Pipeline'

const SYSTEM_PROMPT = `You are the Risk Assessment Agent in the Launchloom pipeline. Your job is to identify and quantify risks for startup ideas.

Your output must be valid JSON with these fields:
- technicalRisks: Array of {risk, impact, probability, mitigation}
- marketRisks: Array of {risk, impact, probability, mitigation}
- financialRisks: Array of {risk, impact, probability, mitigation}
- regulatoryRisks: Array of {risk, impact, probability, mitigation}
- mitigation: Object with immediate, shortTerm, and longTerm arrays

Impact and probability should be: "low", "medium", or "high".
Be comprehensive but practical. Focus on actionable mitigations.`

export class RiskAgent {
  private agentService: LaunchloomAgentsService
  private logger: Logger

  constructor(agentService: LaunchloomAgentsService) {
    this.agentService = agentService
    this.logger = new Logger('RiskAgent')
  }

  async execute(
    context: IdeaContext,
    normalizeResult: NormalizeResult,
    researchResult: ResearchResult,
    feasibilityResult: FeasibilityResult,
    marketMoatResult: MarketMoatResult
  ): Promise<RiskAssessmentResult> {
    this.logger.info('Starting risk assessment', { title: normalizeResult.title })

    const messages: AgentMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Conduct comprehensive risk assessment for:

Title: ${normalizeResult.title}
Problem: ${normalizeResult.problem}
Value Proposition: ${normalizeResult.valueProposition}

Market Size: ${researchResult.marketSize}
Competitors: ${researchResult.competitors.length}
Challenges: ${researchResult.challenges.join(', ')}

Technical Complexity: ${feasibilityResult.score}/10
Technologies: ${feasibilityResult.technologies.join(', ')}
Timeline: MVP in ${feasibilityResult.timeline.mvp}

Market Scores:
- Desirability: ${marketMoatResult.desirability}/100
- Viability: ${marketMoatResult.viability}/100
- Defensibility: ${marketMoatResult.defensibility}/100
- Timing: ${marketMoatResult.timing}/100

Industry: ${context.industry || 'Not specified'}

Respond with valid JSON only.`
      }
    ]

    try {
      const response = await this.agentService.sendMessage(messages, {
        model: 'gpt-4.1-mini',
        maxTokens: 2500,
        temperature: 0.7
      })

      const result = this.parseResult(response.content)

      this.logger.info('Risk assessment complete', {
        totalRisks: result.technicalRisks.length + result.marketRisks.length + result.financialRisks.length + result.regulatoryRisks.length,
        cost: response.usage.cost
      })

      return result
    } catch (error) {
      this.logger.error('Risk assessment failed', error)
      return this.getFallbackResult()
    }
  }

  private parseResult(content: string): RiskAssessmentResult {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          technicalRisks: this.parseRiskArray(parsed.technicalRisks),
          marketRisks: this.parseRiskArray(parsed.marketRisks),
          financialRisks: this.parseRiskArray(parsed.financialRisks),
          regulatoryRisks: this.parseRiskArray(parsed.regulatoryRisks),
          mitigation: {
            immediate: parsed.mitigation?.immediate || [],
            shortTerm: parsed.mitigation?.shortTerm || [],
            longTerm: parsed.mitigation?.longTerm || []
          }
        }
      }
    } catch (e) {
      this.logger.warn('Failed to parse risk assessment JSON', e)
    }

    return this.getFallbackResult()
  }

  private parseRiskArray(risks: unknown): Array<{ risk: string; impact: 'low' | 'medium' | 'high'; probability: 'low' | 'medium' | 'high'; mitigation: string }> {
    if (!Array.isArray(risks)) return []
    return risks.map(r => ({
      risk: r.risk || 'Unspecified risk',
      impact: this.normalizeLevel(r.impact),
      probability: this.normalizeLevel(r.probability),
      mitigation: r.mitigation || 'Mitigation strategy pending'
    }))
  }

  private normalizeLevel(level: unknown): 'low' | 'medium' | 'high' {
    const normalized = String(level).toLowerCase()
    if (normalized === 'high') return 'high'
    if (normalized === 'low') return 'low'
    return 'medium'
  }

  private getFallbackResult(): RiskAssessmentResult {
    return {
      technicalRisks: [
        { risk: 'Technical complexity', impact: 'medium', probability: 'medium', mitigation: 'Iterative development with MVP focus' }
      ],
      marketRisks: [
        { risk: 'Market validation', impact: 'high', probability: 'medium', mitigation: 'Early user research and beta testing' }
      ],
      financialRisks: [
        { risk: 'Runway constraints', impact: 'high', probability: 'medium', mitigation: 'Lean operations and milestone-based funding' }
      ],
      regulatoryRisks: [
        { risk: 'Data privacy compliance', impact: 'medium', probability: 'low', mitigation: 'Privacy-by-design architecture' }
      ],
      mitigation: {
        immediate: ['Validate core assumptions', 'Secure initial funding'],
        shortTerm: ['Build MVP', 'Acquire first users', 'Iterate on feedback'],
        longTerm: ['Scale operations', 'Expand market', 'Build moat']
      }
    }
  }
}
