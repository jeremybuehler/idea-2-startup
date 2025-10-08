export type ComplianceSeverity = 'info' | 'warn' | 'fail'

export interface ComplianceIssue {
  id: string
  severity: ComplianceSeverity
  category: 'pii' | 'budget' | 'license' | 'content' | 'other'
  message: string
  details?: string
  recommendation?: string
}

export interface ComplianceReport {
  status: 'pass' | 'review' | 'fail'
  issues: ComplianceIssue[]
  summary: string
}
