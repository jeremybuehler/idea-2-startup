/**
 * Export Agent - Stage 9 of the Launchloom Pipeline
 *
 * Responsible for:
 * - Executive summary generation
 * - Implementation roadmap creation
 * - Agent runbook generation (YAML format)
 * - Next steps recommendations
 * - Success metrics definition
 */

import { LaunchloomAgentsService, AgentMessage } from '../services/LaunchloomAgentsService'
import { Logger } from '../utils/Logger'
import {
  ExportResult,
  IdeaContext,
  NormalizeResult,
  ResearchResult,
  FeasibilityResult,
  MarketMoatResult,
  RiskAssessmentResult,
  CodeScaffoldResult
} from '../types/Pipeline'

const SYSTEM_PROMPT = `You are the Export Agent in the Launchloom pipeline. Your job is to synthesize all analysis into actionable implementation guidance.

Your output must be valid JSON with these fields:
- summary: Object with title, description, keyFeatures, targetMarket, businessModel
- roadmap: Array of {phase, duration, milestones, deliverables}
- runbook: String in YAML format detailing agent orchestration
- nextSteps: Object with immediate, shortTerm, longTerm arrays
- metrics: Object with technical, business, user metric arrays

Create comprehensive, actionable deliverables. The runbook should be production-ready.`

export class ExportAgent {
  private agentService: LaunchloomAgentsService
  private logger: Logger

  constructor(agentService: LaunchloomAgentsService) {
    this.agentService = agentService
    this.logger = new Logger('ExportAgent')
  }

  async execute(
    context: IdeaContext,
    normalizeResult: NormalizeResult,
    researchResult: ResearchResult,
    feasibilityResult: FeasibilityResult,
    marketMoatResult: MarketMoatResult,
    riskResult: RiskAssessmentResult,
    codeScaffoldResult: CodeScaffoldResult
  ): Promise<ExportResult> {
    this.logger.info('Starting export generation', { title: normalizeResult.title })

    const messages: AgentMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Generate final export package for:

Title: ${normalizeResult.title}
One-liner: ${normalizeResult.oneLiner}
Problem: ${normalizeResult.problem}
Value Proposition: ${normalizeResult.valueProposition}
Target Audience: ${normalizeResult.audience}

Market Analysis:
- Market Size: ${researchResult.marketSize}
- Competitors: ${researchResult.competitors.length}
- Key Opportunities: ${researchResult.opportunities.slice(0, 3).join(', ')}

Feasibility:
- Complexity Score: ${feasibilityResult.score}/10
- MVP Timeline: ${feasibilityResult.timeline.mvp}
- Tech Stack: ${codeScaffoldResult.techStack.frontend.slice(0, 2).join(', ')} + ${codeScaffoldResult.techStack.backend.slice(0, 2).join(', ')}

Market Scores:
- Desirability: ${marketMoatResult.desirability}/100
- Viability: ${marketMoatResult.viability}/100
- Defensibility: ${marketMoatResult.defensibility}/100
- Timing: ${marketMoatResult.timing}/100

Risk Summary:
- Technical Risks: ${riskResult.technicalRisks.length}
- Market Risks: ${riskResult.marketRisks.length}
- Key Mitigation: ${riskResult.mitigation.immediate.slice(0, 2).join(', ')}

Respond with valid JSON only.`
      }
    ]

    try {
      const response = await this.agentService.sendMessage(messages, {
        model: 'gpt-4.1-mini',
        maxTokens: 2500,
        temperature: 0.7
      })

      const result = this.parseResult(response.content, normalizeResult, marketMoatResult)

      this.logger.info('Export generation complete', {
        roadmapPhases: result.roadmap.length,
        cost: response.usage.cost
      })

      return result
    } catch (error) {
      this.logger.error('Export generation failed', error)
      return this.getFallbackResult(normalizeResult, marketMoatResult)
    }
  }

  private parseResult(
    content: string,
    normalizeResult: NormalizeResult,
    marketMoatResult: MarketMoatResult
  ): ExportResult {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          summary: {
            title: parsed.summary?.title || normalizeResult.title,
            description: parsed.summary?.description || normalizeResult.oneLiner,
            keyFeatures: parsed.summary?.keyFeatures || [],
            targetMarket: parsed.summary?.targetMarket || normalizeResult.audience,
            businessModel: parsed.summary?.businessModel || 'SaaS subscription model'
          },
          roadmap: (parsed.roadmap || []).map((p: {
            phase?: string
            duration?: string
            milestones?: string[]
            deliverables?: string[]
          }) => ({
            phase: p.phase || 'Phase',
            duration: p.duration || '4 weeks',
            milestones: p.milestones || [],
            deliverables: p.deliverables || []
          })),
          runbook: parsed.runbook || this.generateRunbook(normalizeResult.title),
          nextSteps: {
            immediate: parsed.nextSteps?.immediate || [],
            shortTerm: parsed.nextSteps?.shortTerm || [],
            longTerm: parsed.nextSteps?.longTerm || []
          },
          metrics: {
            technical: (parsed.metrics?.technical || []).map((m: {
              metric?: string
              target?: string
              measurement?: string
            }) => ({
              metric: m.metric || '',
              target: m.target || '',
              measurement: m.measurement || ''
            })),
            business: (parsed.metrics?.business || []).map((m: {
              metric?: string
              target?: string
              measurement?: string
            }) => ({
              metric: m.metric || '',
              target: m.target || '',
              measurement: m.measurement || ''
            })),
            user: (parsed.metrics?.user || []).map((m: {
              metric?: string
              target?: string
              measurement?: string
            }) => ({
              metric: m.metric || '',
              target: m.target || '',
              measurement: m.measurement || ''
            }))
          }
        }
      }
    } catch (e) {
      this.logger.warn('Failed to parse export JSON', e)
    }

    return this.getFallbackResult(normalizeResult, marketMoatResult)
  }

  private generateRunbook(title: string): string {
    return `# ${title} - Agent Runbook (v1.0)

conductor:
  goals: ["orchestrate", "budget", "gate high-risk steps"]
  budgets:
    tokens: 500000
    time_minutes: 30
    cost_usd: 10.0
  gates: ["risk_review", "spend_over_cap", "quality_threshold"]

normalize_agent:
  model: gpt-4.1-mini
  max_tokens: 1000
  outputs: ["title", "one_liner", "problem", "audience", "value_proposition"]

research_agent:
  model: gpt-4.1-mini
  max_tokens: 3000
  tools: ["web_search", "competitor_scan"]
  outputs: ["market_size", "competitors", "opportunities", "challenges", "prd"]

feasibility_agent:
  model: gpt-4.1-mini
  max_tokens: 2000
  outputs: ["score", "technologies", "timeline", "resources", "risks"]

market_moat_agent:
  model: gpt-4.1-mini
  max_tokens: 2000
  outputs: ["desirability", "viability", "defensibility", "timing", "moat_strategies"]

risk_agent:
  model: gpt-4.1-mini
  max_tokens: 2500
  outputs: ["technical_risks", "market_risks", "financial_risks", "regulatory_risks", "mitigation"]

ux_design_agent:
  model: gpt-4.1-mini
  max_tokens: 2500
  outputs: ["user_journey", "key_flows", "wireframes", "principles", "accessibility"]

code_scaffold_agent:
  model: gpt-4.1
  max_tokens: 3500
  outputs: ["tech_stack", "structure", "components", "database", "api_structure"]

api_design_agent:
  model: gpt-4.1
  max_tokens: 3000
  outputs: ["endpoints", "models", "authentication", "security", "documentation"]

export_agent:
  model: gpt-4.1-mini
  max_tokens: 2500
  outputs: ["summary", "roadmap", "runbook", "next_steps", "metrics"]

quality_gates:
  min_quality_score: 0.7
  max_retries: 2
  fallback_strategy: "use_cached_or_default"

observability:
  metrics: ["stage_duration", "token_usage", "cost", "quality_score"]
  alerts: ["budget_exceeded", "stage_timeout", "quality_below_threshold"]
`
  }

  private getFallbackResult(
    normalizeResult: NormalizeResult,
    marketMoatResult: MarketMoatResult
  ): ExportResult {
    const totalScore = Math.round(
      (marketMoatResult.desirability +
        marketMoatResult.viability +
        marketMoatResult.defensibility +
        marketMoatResult.timing) / 4
    )

    return {
      summary: {
        title: normalizeResult.title,
        description: normalizeResult.oneLiner,
        keyFeatures: [
          'Core feature 1',
          'Core feature 2',
          'Core feature 3'
        ],
        targetMarket: normalizeResult.audience,
        businessModel: 'SaaS subscription with tiered pricing'
      },
      roadmap: [
        {
          phase: 'Phase 1: Foundation',
          duration: '4-6 weeks',
          milestones: ['MVP design complete', 'Core backend ready', 'Basic frontend'],
          deliverables: ['Technical architecture', 'Database schema', 'API specification']
        },
        {
          phase: 'Phase 2: MVP',
          duration: '6-8 weeks',
          milestones: ['Feature complete MVP', 'Internal testing', 'Beta launch'],
          deliverables: ['Working product', 'Test coverage', 'Documentation']
        },
        {
          phase: 'Phase 3: Launch',
          duration: '4-6 weeks',
          milestones: ['Public launch', 'First 100 users', 'Feedback integration'],
          deliverables: ['Production deployment', 'Marketing site', 'Support system']
        }
      ],
      runbook: this.generateRunbook(normalizeResult.title),
      nextSteps: {
        immediate: [
          'Validate core assumptions with potential users',
          'Set up development environment',
          'Create detailed technical specification'
        ],
        shortTerm: [
          'Build MVP with core features',
          'Establish feedback loops',
          'Prepare launch materials'
        ],
        longTerm: [
          'Scale infrastructure',
          'Expand feature set',
          'Build competitive moat'
        ]
      },
      metrics: {
        technical: [
          { metric: 'API response time', target: '<200ms p95', measurement: 'APM monitoring' },
          { metric: 'Uptime', target: '99.9%', measurement: 'Status page' },
          { metric: 'Test coverage', target: '>80%', measurement: 'CI reports' }
        ],
        business: [
          { metric: 'MRR', target: '$10K by month 6', measurement: 'Stripe dashboard' },
          { metric: 'CAC', target: '<$50', measurement: 'Marketing analytics' },
          { metric: 'LTV/CAC', target: '>3', measurement: 'Cohort analysis' }
        ],
        user: [
          { metric: 'Activation rate', target: '>40%', measurement: 'Product analytics' },
          { metric: '30-day retention', target: '>30%', measurement: 'Cohort analysis' },
          { metric: 'NPS', target: '>50', measurement: 'Survey tool' }
        ]
      }
    }
  }
}
