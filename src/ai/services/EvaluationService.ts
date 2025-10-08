import { Dossier } from '@/types'
import { PipelineResult } from '../types/Pipeline'
import { EvaluationReport, EvaluationCheck } from '../types/evaluation'

export class EvaluationService {
  assess(dossier: Dossier, pipeline: PipelineResult): EvaluationReport {
    const checks: EvaluationCheck[] = []

    const prdLength = dossier.prd?.length ?? 0
    checks.push({
      name: 'PRD length',
      passed: prdLength > 400,
      details: `PRD characters: ${prdLength}`
    })

    const hasRunbook = Boolean(dossier.runbook && dossier.runbook.trim().length > 0)
    checks.push({
      name: 'Runbook present',
      passed: hasRunbook,
      details: hasRunbook ? 'Runbook included' : 'Runbook missing'
    })

    const references = pipeline.metadata.marketIntel?.references?.length ?? 0
    checks.push({
      name: 'Market references',
      passed: references >= 2,
      details: `${references} references included`
    })

    const complianceStatus = pipeline.metadata.compliance?.status ?? 'pass'
    checks.push({
      name: 'Compliance status',
      passed: complianceStatus !== 'fail',
      details: `Compliance result: ${complianceStatus}`
    })

    const satisfied = checks.filter(check => check.passed).length
    const score = Number((satisfied / checks.length).toFixed(2))
    const summary = score === 1
      ? 'All automated evaluations passed.'
      : `${checks.length - satisfied} automated checks require attention.`

    return { score, summary, checks }
  }
}
