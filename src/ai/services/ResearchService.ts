import { IdeaContext } from '../types/Pipeline'
import { MarketReference, CompetitorInsight, MarketIntel } from '../types/market'

interface MarketIntelFragment extends Partial<MarketIntel> {
  references?: MarketReference[]
  confidence?: number
}

interface ResearchConnector {
  readonly name: string
  fetch(context: IdeaContext): Promise<MarketIntelFragment>
}

class KeywordHeuristicsConnector implements ResearchConnector {
  readonly name = 'keyword-heuristics'

  async fetch(context: IdeaContext): Promise<MarketIntelFragment> {
    const idea = context.ideaText.toLowerCase()
    const hasAi = /(ai|ml|agent|automation)/.test(idea)
    const hasSaas = /(saas|b2b|subscription)/.test(idea)
    const hasHealth = /(health|medical|clinical|patient)/.test(idea)
    const hasFintech = /(finance|fintech|payments|bank|credit)/.test(idea)

    const opportunities: string[] = []
    const risks: string[] = []

    if (hasAi) {
      opportunities.push('Rising demand for agentic workflows across operations')
      risks.push('Fast-moving competitive landscape in AI tooling')
    }
    if (hasHealth) {
      opportunities.push('Increasing demand for virtual care and data automation')
      risks.push('Strict HIPAA and regional data regulations')
    }
    if (hasFintech) {
      opportunities.push('Digital payments growth and embedded finance adoption')
      risks.push('Licensing/AML requirements across jurisdictions')
    }
    if (opportunities.length === 0) {
      opportunities.push('Early-mover advantage in a niche market')
    }
    if (risks.length === 0) {
      risks.push('Need to validate willingness to pay and GTM motion')
    }

    const competitors: CompetitorInsight[] = []
    if (hasAi) {
      competitors.push({
        name: 'Notion AI',
        positioning: 'Productivity AI embedded within knowledge base',
        strengths: ['Existing distribution', 'Seamless UX'],
        weaknesses: ['Generic outputs', 'Limited vertical context']
      })
      competitors.push({
        name: 'OpenAI GPTs',
        positioning: 'Customizable GPT agent marketplace',
        strengths: ['Developer ecosystem', 'Rapid iteration'],
        weaknesses: ['Requires heavy configuration', 'No compliance guarantees']
      })
    }
    if (hasSaas) {
      competitors.push({
        name: 'Retool',
        positioning: 'Internal tooling platform with integrations',
        strengths: ['Enterprise adoption', 'Robust data connectors'],
        weaknesses: ['DIY experience', 'Requires engineering time']
      })
    }
    if (competitors.length === 0) {
      competitors.push({
        name: 'Generic incumbents',
        positioning: 'Manual or spreadsheet-based processes',
        strengths: ['Entrenched workflows'],
        weaknesses: ['Poor automation', 'High switching friction']
      })
    }

    const references: MarketReference[] = [
      {
        title: 'CB Insights – Emerging Tech Outlook (2024)',
        url: 'https://www.cbinsights.com/research/emerging-tech-trends/',
        source: 'CB Insights'
      },
      {
        title: 'Gartner – AI Agent Market Guide',
        url: 'https://www.gartner.com/en/documents/ai-agents',
        source: 'Gartner'
      }
    ]

    const segments: string[] = []
    if (hasHealth) segments.push('Healthcare providers and digital health startups')
    if (hasFintech) segments.push('Fintech operators, credit risk teams, payment processors')
    if (hasSaas) segments.push('Product & ops teams at SaaS companies scaling GTM')
    if (segments.length === 0) segments.push('Innovation and product teams seeking faster validation')

    return {
      opportunities,
      risks,
      competitors,
      references,
      customerSegments: segments,
      confidence: 0.55
    }
  }
}

class TrendSignalConnector implements ResearchConnector {
  readonly name = 'trend-signal'

  async fetch(context: IdeaContext): Promise<MarketIntelFragment> {
    const descriptor = [context.industry, context.targetMarket].filter(Boolean).join(' ').toLowerCase()
    const baseSize = descriptor.includes('enterprise') ? '$45B' : descriptor.includes('health') ? '$12B' : '$8B'
    const growth = descriptor.includes('ai') || descriptor.includes('automation') ? '23% CAGR (2024-2028)' : '12% CAGR (2024-2028)'

    const summary = `Acceleration in ${descriptor || 'the target'} market driven by automation demand, need for faster experimentation, and shift toward agent orchestration.`

    return {
      summary,
      marketSize: baseSize,
      growthRate: growth,
      confidence: 0.6,
      references: [
        {
          title: 'McKinsey – State of AI 2024',
          url: 'https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai-in-2024',
          source: 'McKinsey'
        }
      ]
    }
  }
}

const defaultConnectors: ResearchConnector[] = [
  new KeywordHeuristicsConnector(),
  new TrendSignalConnector()
]

interface CacheEntry {
  expiresAt: number
  intel: MarketIntel
}

export interface ResearchServiceOptions {
  connectors?: ResearchConnector[]
  ttlMs?: number
}

export class ResearchService {
  private readonly connectors: ResearchConnector[]
  private readonly ttlMs: number
  private cache = new Map<string, CacheEntry>()

  constructor(options: ResearchServiceOptions = {}) {
    this.connectors = options.connectors ?? defaultConnectors
    this.ttlMs = options.ttlMs ?? 1000 * 60 * 60 // 1 hour default
  }

  async getMarketIntel(context: IdeaContext): Promise<MarketIntel> {
    const key = this.cacheKey(context)
    const now = Date.now()
    const cached = this.cache.get(key)
    if (cached && cached.expiresAt > now) {
      return cached.intel
    }

    const fragments = await Promise.all(
      this.connectors.map(async connector => {
        try {
          return await connector.fetch(context)
        } catch (error) {
          console.warn(`[research] connector ${connector.name} failed`, error)
          return {}
        }
      })
    )

    const intel = this.aggregate(context, fragments)
    this.cache.set(key, { expiresAt: now + this.ttlMs, intel })
    return intel
  }

  private cacheKey(context: IdeaContext): string {
    return [context.ideaText, context.industry, context.targetMarket].filter(Boolean).join('::').toLowerCase()
  }

  private aggregate(context: IdeaContext, fragments: MarketIntelFragment[]): MarketIntel {
    const references = fragments.flatMap(f => f.references ?? [])
    const competitors = fragments.flatMap(f => f.competitors ?? [])
    const opportunities = fragments.flatMap(f => f.opportunities ?? [])
    const risks = fragments.flatMap(f => f.risks ?? [])
    const customerSegments = fragments.flatMap(f => f.customerSegments ?? [])

    const summary =
      fragments.find(f => f.summary)?.summary ||
      `Growing demand for solutions addressing "${context.ideaText.slice(0, 60)}" with increasing investment interest.`

    const marketSize = fragments.find(f => f.marketSize)?.marketSize || '$5B+'
    const growthRate = fragments.find(f => f.growthRate)?.growthRate || '15% CAGR (2024-2028)'

    const confidenceValues = fragments.map(f => f.confidence ?? 0)
    const confidence = confidenceValues.length
      ? Number((confidenceValues.reduce((sum, val) => sum + val, 0) / confidenceValues.length).toFixed(2))
      : 0.5

    return {
      summary,
      marketSize,
      growthRate,
      customerSegments: Array.from(new Set(customerSegments)).slice(0, 5),
      competitors,
      opportunities: Array.from(new Set(opportunities)).slice(0, 6),
      risks: Array.from(new Set(risks)).slice(0, 6),
      references: dedupeReferences(references).slice(0, 6),
      confidence
    }
  }
}

function dedupeReferences(references: MarketReference[]): MarketReference[] {
  const seen = new Set<string>()
  const unique: MarketReference[] = []
  for (const ref of references) {
    const key = `${ref.url}|${ref.title}`
    if (!seen.has(key)) {
      seen.add(key)
      unique.push(ref)
    }
  }
  return unique
}
