export interface MarketReference {
  title: string
  url: string
  source: string
}

export interface CompetitorInsight {
  name: string
  positioning: string
  strengths: string[]
  weaknesses: string[]
}

export interface MarketIntel {
  summary: string
  marketSize: string
  growthRate: string
  customerSegments: string[]
  competitors: CompetitorInsight[]
  opportunities: string[]
  risks: string[]
  references: MarketReference[]
  confidence: number
}
