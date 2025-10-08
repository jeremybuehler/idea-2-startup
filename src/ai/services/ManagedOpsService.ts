import { EvaluationReport } from '../types/evaluation'
import { ComplianceReport } from '../types/compliance'

interface ManagedOpsRecord {
  runId: string
  evaluation: EvaluationReport | undefined
  compliance: ComplianceReport | undefined
  timestamp: number
}

export class ManagedOpsService {
  private history: ManagedOpsRecord[] = []

  record(runId: string, evaluation: EvaluationReport | undefined, compliance: ComplianceReport | undefined): void {
    this.history.unshift({ runId, evaluation, compliance, timestamp: Date.now() })
    if (this.history.length > 50) {
      this.history.length = 50
    }
  }

  list(): ManagedOpsRecord[] {
    return this.history
  }
}
