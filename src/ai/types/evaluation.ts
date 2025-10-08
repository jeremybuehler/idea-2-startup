export interface EvaluationCheck {
  name: string
  passed: boolean
  details?: string
}

export interface EvaluationReport {
  score: number
  summary: string
  checks: EvaluationCheck[]
}
