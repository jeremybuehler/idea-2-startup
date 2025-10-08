import { IdeaContext, Dossier } from '../types/Pipeline'
import { ComplianceIssue, ComplianceReport, ComplianceSeverity } from '../types/compliance'

export interface CompliancePolicy {
  maxBudget?: number
  forbiddenLicenses?: string[]
  restrictedTerms?: string[]
  requirePIIReview?: boolean
}

const DEFAULT_POLICY: CompliancePolicy = {
  maxBudget: 250000,
  forbiddenLicenses: ['gpl', 'agpl', 'cc-by-sa'],
  restrictedTerms: ['unlimited data access', 'collect all user data', 'scrape without consent'],
  requirePIIReview: true
}

export interface ComplianceServiceOptions {
  policy?: CompliancePolicy
}

export class ComplianceService {
  private readonly policy: CompliancePolicy

  constructor(options: ComplianceServiceOptions = {}) {
    this.policy = { ...DEFAULT_POLICY, ...options.policy }
  }

  evaluate(context: IdeaContext, dossier: Dossier): ComplianceReport {
    const issues: ComplianceIssue[] = []

    // Budget guardrail
    const declaredBudget = parseBudget(context.budget)
    if (declaredBudget && this.policy.maxBudget && declaredBudget > this.policy.maxBudget) {
      issues.push({
        id: 'budget-exceeded',
        severity: 'warn',
        category: 'budget',
        message: `Declared budget (${formatCurrency(declaredBudget)}) exceeds configured ceiling (${formatCurrency(this.policy.maxBudget)})`,
        recommendation: 'Revisit scope or adjust budget expectations before proceeding.'
      })
    }

    // License hygiene in repo runbook
    const repoContent = [dossier.repo, dossier.runbook, dossier.prd].join('\n').toLowerCase()
    const forbidden = (this.policy.forbiddenLicenses ?? []).find(lic => repoContent.includes(lic.toLowerCase()))
    if (forbidden) {
      issues.push({
        id: 'license-forbidden',
        severity: 'fail',
        category: 'license',
        message: `Detected restricted license reference (“${forbidden}”).`,
        recommendation: 'Swap to a permissive alternative (e.g. MIT, Apache-2.0) before release.'
      })
    }

    // PII detection
    if (this.policy.requirePIIReview) {
      const piiMatches = findPIIMatches(repoContent)
      if (piiMatches.length > 0) {
        issues.push({
          id: 'pii-detected',
          severity: 'warn',
          category: 'pii',
          message: 'Potential PII references detected in output.',
          details: piiMatches.join(', '),
          recommendation: 'Ensure sensitive data is tokenized or removed prior to training or logging.'
        })
      }
    }

    // High-risk phrasing
    const restrictionHit = (this.policy.restrictedTerms ?? []).find(term => repoContent.includes(term.toLowerCase()))
    if (restrictionHit) {
      issues.push({
        id: 'restricted-term',
        severity: 'warn',
        category: 'content',
        message: `Output references restricted term: “${restrictionHit}”.`,
        recommendation: 'Rephrase claims to ensure they adhere to legal and ethical policies.'
      })
    }

    // Determine status
    let status: ComplianceReport['status'] = 'pass'
    if (issues.some(issue => issue.severity === 'fail')) {
      status = 'fail'
    } else if (issues.some(issue => issue.severity === 'warn')) {
      status = 'review'
    }

    const summary = buildSummary(status, issues)
    return { status, issues, summary }
  }
}

function parseBudget(raw?: string): number | null {
  if (!raw) return null
  const match = raw.replace(/[,\$]/g, '').match(/\d+(?:\.\d+)?/)
  if (!match) return null
  const value = Number(match[0])
  if (Number.isFinite(value)) {
    return value
  }
  return null
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}

function findPIIMatches(content: string): string[] {
  const matches = new Set<string>()
  const emailRegex = /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g
  const phoneRegex = /(\+?\d{1,3}[\s-]?)?(?:\(\d{3}\)|\d{3})[\s-]?\d{3}[\s-]?\d{4}/g
  const ssnRegex = /\b\d{3}-\d{2}-\d{4}\b/g

  const email = content.match(emailRegex)
  if (email) email.forEach(v => matches.add(`email:${v}`))
  const phone = content.match(phoneRegex)
  if (phone) phone.forEach(v => matches.add(`phone:${v}`))
  const ssn = content.match(ssnRegex)
  if (ssn) ssn.forEach(v => matches.add(`ssn:${v}`))
  return Array.from(matches)
}

function buildSummary(status: ComplianceReport['status'], issues: ComplianceIssue[]): string {
  if (issues.length === 0) {
    return 'No compliance risks detected. Ready for launch.'
  }
  const counts = issues.reduce<Record<ComplianceSeverity, number>>((acc, issue) => {
    acc[issue.severity] = (acc[issue.severity] ?? 0) + 1
    return acc
  }, { info: 0, warn: 0, fail: 0 })
  const parts: string[] = []
  if (counts.fail) parts.push(`${counts.fail} blocking`)
  if (counts.warn) parts.push(`${counts.warn} requires review`)
  if (counts.info) parts.push(`${counts.info} informational`)
  return `${status.toUpperCase()}: ${parts.join(', ')}`
}
