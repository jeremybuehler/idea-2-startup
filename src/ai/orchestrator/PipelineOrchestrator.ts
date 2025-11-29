/**
 * Pipeline Orchestrator - Runs all 9 stages of the Launchloom pipeline
 *
 * This is the core engine that transforms a raw idea into production-ready deliverables
 * by executing each agent in sequence and passing results between stages.
 */

import { LaunchloomAgentsService } from '../services/LaunchloomAgentsService'
import { Logger } from '../utils/Logger'
import {
  IdeaContext,
  PipelineStage,
  PipelineResult,
  StageMetric,
  NormalizeResult,
  ResearchResult,
  FeasibilityResult,
  MarketMoatResult,
  RiskAssessmentResult,
  UXDesignResult,
  CodeScaffoldResult,
  APIDesignResult,
  ExportResult,
  Dossier,
  PipelineProgress,
  PipelineEvent
} from '../types/Pipeline'

import { NormalizeAgent } from '../agents/NormalizeAgent'
import { ResearchAgent } from '../agents/ResearchAgent'
import { FeasibilityAgent } from '../agents/FeasibilityAgent'
import { MarketMoatAgent } from '../agents/MarketMoatAgent'
import { RiskAgent } from '../agents/RiskAgent'
import { UXDesignAgent } from '../agents/UXDesignAgent'
import { CodeScaffoldAgent } from '../agents/CodeScaffoldAgent'
import { APIDesignAgent } from '../agents/APIDesignAgent'
import { ExportAgent } from '../agents/ExportAgent'

const STAGES: PipelineStage[] = [
  'normalize',
  'research',
  'feasibility',
  'market_moat',
  'risk_assessment',
  'ux_design',
  'code_scaffold',
  'api_design',
  'export'
]

export interface PipelineOptions {
  apiKey: string
  onProgress?: (progress: PipelineProgress) => void
  onStageComplete?: (stage: PipelineStage, result: unknown) => void
  onEvent?: (event: PipelineEvent) => void
  qualityThreshold?: number
  budgetLimit?: number
  timeoutMs?: number
}

export interface StageResults {
  normalize?: NormalizeResult
  research?: ResearchResult
  feasibility?: FeasibilityResult
  market_moat?: MarketMoatResult
  risk_assessment?: RiskAssessmentResult
  ux_design?: UXDesignResult
  code_scaffold?: CodeScaffoldResult
  api_design?: APIDesignResult
  export?: ExportResult
}

export class PipelineOrchestrator {
  private agentService: LaunchloomAgentsService
  private logger: Logger
  private options: PipelineOptions
  private stageMetrics: StageMetric[] = []
  private stageResults: StageResults = {}

  constructor(options: PipelineOptions) {
    this.options = {
      qualityThreshold: 0.7,
      budgetLimit: 10.0,
      timeoutMs: 300000, // 5 minutes
      ...options
    }
    this.agentService = new LaunchloomAgentsService(options.apiKey)
    this.logger = new Logger('PipelineOrchestrator')
  }

  async execute(context: IdeaContext): Promise<PipelineResult> {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const startTime = Date.now()

    this.logger.info('Pipeline execution started', { executionId, idea: context.ideaText.substring(0, 100) })
    this.emitEvent(executionId, 'pipeline:started', { context })

    try {
      // Stage 1: Normalize
      await this.runStage('normalize', executionId, async () => {
        const agent = new NormalizeAgent(this.agentService)
        this.stageResults.normalize = await agent.execute(context)
        return this.stageResults.normalize
      })

      // Stage 2: Research
      await this.runStage('research', executionId, async () => {
        const agent = new ResearchAgent(this.agentService)
        const { result } = await agent.execute(context, this.stageResults.normalize!)
        this.stageResults.research = result
        return this.stageResults.research
      })

      // Stage 3: Feasibility
      await this.runStage('feasibility', executionId, async () => {
        const agent = new FeasibilityAgent(this.agentService)
        this.stageResults.feasibility = await agent.execute(
          context,
          this.stageResults.normalize!,
          this.stageResults.research!
        )
        return this.stageResults.feasibility
      })

      // Stage 4: Market & Moat
      await this.runStage('market_moat', executionId, async () => {
        const agent = new MarketMoatAgent(this.agentService)
        this.stageResults.market_moat = await agent.execute(
          context,
          this.stageResults.normalize!,
          this.stageResults.research!,
          this.stageResults.feasibility!
        )
        return this.stageResults.market_moat
      })

      // Stage 5: Risk Assessment
      await this.runStage('risk_assessment', executionId, async () => {
        const agent = new RiskAgent(this.agentService)
        this.stageResults.risk_assessment = await agent.execute(
          context,
          this.stageResults.normalize!,
          this.stageResults.research!,
          this.stageResults.feasibility!,
          this.stageResults.market_moat!
        )
        return this.stageResults.risk_assessment
      })

      // Stage 6: UX Design
      await this.runStage('ux_design', executionId, async () => {
        const agent = new UXDesignAgent(this.agentService)
        this.stageResults.ux_design = await agent.execute(
          context,
          this.stageResults.normalize!,
          this.stageResults.research!
        )
        return this.stageResults.ux_design
      })

      // Stage 7: Code Scaffold
      await this.runStage('code_scaffold', executionId, async () => {
        const agent = new CodeScaffoldAgent(this.agentService)
        this.stageResults.code_scaffold = await agent.execute(
          context,
          this.stageResults.normalize!,
          this.stageResults.feasibility!,
          this.stageResults.ux_design!
        )
        return this.stageResults.code_scaffold
      })

      // Stage 8: API Design
      await this.runStage('api_design', executionId, async () => {
        const agent = new APIDesignAgent(this.agentService)
        this.stageResults.api_design = await agent.execute(
          context,
          this.stageResults.normalize!,
          this.stageResults.code_scaffold!
        )
        return this.stageResults.api_design
      })

      // Stage 9: Export
      await this.runStage('export', executionId, async () => {
        const agent = new ExportAgent(this.agentService)
        this.stageResults.export = await agent.execute(
          context,
          this.stageResults.normalize!,
          this.stageResults.research!,
          this.stageResults.feasibility!,
          this.stageResults.market_moat!,
          this.stageResults.risk_assessment!,
          this.stageResults.code_scaffold!
        )
        return this.stageResults.export
      })

      // Build final result
      const result = this.buildResult(executionId, startTime)

      this.logger.info('Pipeline execution completed', {
        executionId,
        duration: Date.now() - startTime,
        cost: result.metadata.totalCost
      })
      this.emitEvent(executionId, 'pipeline:completed', result)

      return result

    } catch (error) {
      this.logger.error('Pipeline execution failed', error)
      this.emitEvent(executionId, 'pipeline:failed', { error: error instanceof Error ? error.message : 'Unknown error' })
      throw error
    }
  }

  private async runStage<T>(
    stage: PipelineStage,
    executionId: string,
    executor: () => Promise<T>
  ): Promise<T> {
    const stageIndex = STAGES.indexOf(stage)
    const startTime = Date.now()

    this.emitProgress(stageIndex, 'running')
    this.emitEvent(executionId, 'stage:started', { stage })
    this.logger.info(`Starting stage: ${stage}`)

    try {
      const result = await executor()
      const duration = Date.now() - startTime

      // Get cost from agent service (approximation)
      const stats = await this.agentService.getCostStats()
      const stageCost = stats.totalCost / (stageIndex + 1) // Rough per-stage cost

      this.stageMetrics.push({
        stage,
        durationMs: duration,
        cost: stageCost,
        status: 'completed',
        quality: 0.85 // TODO: Implement quality scoring
      })

      this.emitProgress(stageIndex + 1, 'completed')
      this.emitEvent(executionId, 'stage:completed', { stage, duration, result })
      this.options.onStageComplete?.(stage, result)

      this.logger.info(`Completed stage: ${stage}`, { duration, cost: stageCost })
      return result

    } catch (error) {
      const duration = Date.now() - startTime

      this.stageMetrics.push({
        stage,
        durationMs: duration,
        cost: 0,
        status: 'failed',
        quality: 0
      })

      this.emitEvent(executionId, 'stage:failed', { stage, error: error instanceof Error ? error.message : 'Unknown' })
      this.logger.error(`Stage failed: ${stage}`, error)
      throw error
    }
  }

  private emitProgress(completedStages: number, status: 'running' | 'completed') {
    const progress: PipelineProgress = {
      currentStage: completedStages,
      totalStages: STAGES.length,
      percentage: Math.round((completedStages / STAGES.length) * 100),
      stagesCompleted: this.stageMetrics.filter(m => m.status === 'completed').length,
      stagesFailed: this.stageMetrics.filter(m => m.status === 'failed').length,
      estimatedTimeRemaining: this.estimateRemainingTime(completedStages)
    }
    this.options.onProgress?.(progress)
  }

  private estimateRemainingTime(completedStages: number): number {
    if (completedStages === 0) return 180000 // 3 minutes estimate

    const completedMetrics = this.stageMetrics.filter(m => m.status === 'completed')
    if (completedMetrics.length === 0) return 180000

    const avgDuration = completedMetrics.reduce((sum, m) => sum + m.durationMs, 0) / completedMetrics.length
    const remainingStages = STAGES.length - completedStages
    return avgDuration * remainingStages
  }

  private emitEvent(executionId: string, type: PipelineEvent['type'], data: unknown) {
    const event: PipelineEvent = {
      executionId,
      timestamp: Date.now(),
      type,
      data
    }
    this.options.onEvent?.(event)
  }

  private buildResult(executionId: string, startTime: number): PipelineResult {
    const normalize = this.stageResults.normalize!
    const research = this.stageResults.research!
    const exportResult = this.stageResults.export!
    const marketMoat = this.stageResults.market_moat!

    const totalCost = this.stageMetrics.reduce((sum, m) => sum + m.cost, 0)
    const totalDuration = Date.now() - startTime

    // Build the dossier from all stage results
    const dossier: Dossier = {
      id: `idea_${Math.random().toString(36).slice(2, 8)}`,
      created_at: new Date().toISOString(),
      idea_text: normalize.problem,
      title: normalize.title,
      one_liner: normalize.oneLiner,
      scores: {
        total: Math.round((marketMoat.desirability + marketMoat.viability + marketMoat.defensibility + marketMoat.timing) / 4),
        desirability: marketMoat.desirability,
        feasibility: this.stageResults.feasibility!.score * 10,
        viability: marketMoat.viability,
        defensibility: marketMoat.defensibility,
        timing: marketMoat.timing
      },
      prd: research.prd,
      runbook: exportResult.runbook,
      repo: this.buildRepoTree(),
      api: this.buildAPISpec()
    }

    // Calculate overall quality
    const completedCount = this.stageMetrics.filter(m => m.status === 'completed').length
    const avgQuality = this.stageMetrics
      .filter(m => m.quality !== undefined)
      .reduce((sum, m) => sum + (m.quality || 0), 0) / completedCount

    return {
      executionId,
      dossier,
      metadata: {
        processingTime: totalDuration,
        totalCost,
        stagesCompleted: completedCount,
        agentsInvolved: STAGES.slice(0, completedCount),
        stageMetrics: this.stageMetrics
      },
      overallQuality: avgQuality
    }
  }

  private buildRepoTree(): string {
    const scaffold = this.stageResults.code_scaffold
    if (!scaffold) return ''

    const lines = [
      `# ${this.stageResults.normalize?.title || 'Project'} - Repository Structure`,
      '',
      '```',
      ...scaffold.structure.directories.map(d => typeof d === 'string' ? d : `${d}`),
      '',
      '## Key Files',
      ...scaffold.structure.files.map(f => `${f.path} - ${f.description}`),
      '```',
      '',
      '## Tech Stack',
      '',
      '### Frontend',
      ...scaffold.techStack.frontend.map(t => `- ${t}`),
      '',
      '### Backend',
      ...scaffold.techStack.backend.map(t => `- ${t}`),
      '',
      '### Database',
      ...scaffold.techStack.database.map(t => `- ${t}`),
      '',
      '### Infrastructure',
      ...scaffold.techStack.infrastructure.map(t => `- ${t}`)
    ]

    return lines.join('\n')
  }

  private buildAPISpec(): string {
    const api = this.stageResults.api_design
    if (!api) return ''

    const lines = [
      '# API Specification',
      '',
      `## Authentication: ${api.authentication.type}`,
      api.authentication.description,
      '',
      '## Endpoints',
      '',
      ...api.endpoints.map(e => [
        `### ${e.method} ${e.path}`,
        e.description,
        '',
        'Parameters:',
        ...e.parameters.map(p => `- ${p.name} (${p.type}${p.required ? ', required' : ''}): ${p.description}`),
        ''
      ]).flat(),
      '',
      '## Models',
      '',
      ...api.models.map(m => [
        `### ${m.name}`,
        m.description,
        '',
        ...m.properties.map(p => `- ${p.name}: ${p.type}${p.required ? ' (required)' : ''}`),
        ''
      ]).flat()
    ]

    return lines.join('\n')
  }
}

export { STAGES }
