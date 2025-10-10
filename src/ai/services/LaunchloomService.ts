import { EventEmitter } from 'events';
import { TemplateGenerator, scoreIdea, toSlug } from '@/lib/business-logic';
import { Dossier } from '@/types';
import { LaunchloomAgentsService } from './LaunchloomAgentsService';
import { ResearchService } from './ResearchService';
import { ComplianceService } from './ComplianceService';
import { EvaluationService } from './EvaluationService';
import { WorkspaceService, WorkspaceRunPersistPayload } from './WorkspaceService';
import { IntegrationRegistry } from './IntegrationRegistry';
import { ManagedOpsService } from './ManagedOpsService';
import { Conductor } from '../agents/Conductor';
import { IdeaContext, PipelineProgress, PipelineRunConfig, PipelineResult, StageMetric } from '../types/Pipeline';
import { ComplianceReport } from '../types/compliance';
import { EvaluationReport } from '../types/evaluation';

interface LaunchloomServiceConfig {
  apiKey: string;
  enableLiveMode: boolean;
  defaultQualityThreshold: number;
  defaultBudgetLimit: number;
}

export class LaunchloomService extends EventEmitter {
  private agents?: LaunchloomAgentsService;
  private conductor?: Conductor;
  private researchService: ResearchService;
  private complianceService: ComplianceService;
  private evaluationService: EvaluationService;
  private workspaceService: WorkspaceService;
  private integrationRegistry: IntegrationRegistry;
  private managedOpsService: ManagedOpsService;
  private config: LaunchloomServiceConfig;
  private activePipelines = new Map<string, PipelineExecution>();

  constructor(config: LaunchloomServiceConfig) {
    super();
    this.config = config;
    this.researchService = new ResearchService();
    this.complianceService = new ComplianceService();
    this.evaluationService = new EvaluationService();
    this.workspaceService = new WorkspaceService();
    this.integrationRegistry = new IntegrationRegistry();
    this.managedOpsService = new ManagedOpsService();
    
    if (config.enableLiveMode && config.apiKey) {
      this.initializeLiveServices(config.apiKey);
    }
  }

  private initializeLiveServices(apiKey: string): void {
    const launchloomAgents = new LaunchloomAgentsService(apiKey);
    const conductor = new Conductor(launchloomAgents, this.researchService, {
      qualityThreshold: this.config.defaultQualityThreshold,
      budgetLimit: this.config.defaultBudgetLimit
    });

    this.agents = launchloomAgents;
    this.conductor = conductor;

    conductor.on('pipeline:completed', (data) => this.emit('pipeline:completed', data));
    conductor.on('pipeline:failed', (data) => this.emit('pipeline:failed', data));
    conductor.on('stage:started', (data) => this.emit('stage:started', data));
    conductor.on('stage:completed', (data) => this.emit('stage:completed', data));
    conductor.on('stage:failed', (data) => this.emit('stage:failed', data));
  }

  /**
   * Process an idea through the Launchloom pipeline (replaces makeDossier)
   */
  async processIdea(
    ideaText: string,
    options: {
      userId?: string;
      industry?: string;
      targetMarket?: string;
      budget?: string;
      timeline?: string;
      useLive?: boolean;
      qualityThreshold?: number;
      maxCost?: number;
      pipelineConfig?: PipelineRunConfig;
      workspaceId?: string;
      workspaceName?: string;
    } = {}
  ): Promise<Dossier> {
    
    // Use live mode if enabled and requested
    const useLive = this.config.enableLiveMode && (options.useLive !== false);

    if (useLive && this.conductor) {
      return await this.processWithAgents(ideaText, options);
    } else {
      // Fallback to simulated mode (existing functionality)
      return await this.processSimulated(ideaText, options);
    }
  }

  /**
   * Process idea using Launchloom-powered agents
   */
  private async processWithAgents(
    ideaText: string,
    options: any
  ): Promise<Dossier> {
    
    const context = this.buildContext(ideaText, options)

    // Execute pipeline
    const conductor = this.conductor;
    if (!conductor) {
      throw new Error('Conductor not initialized for live pipeline execution.');
    }

    const result = await conductor.executePipeline(context, options.pipelineConfig ?? {});
    const compliance = this.complianceService.evaluate(context, result.dossier);

    if (compliance.status === 'fail') {
      throw new Error(`Compliance guardrail failed: ${compliance.summary}`);
    }

    result.metadata.compliance = compliance;
    result.metadata.evaluation = this.evaluationService.assess(result.dossier, result);
    this.logTelemetry(result);
    await this.recordWorkspaceRun(options.workspaceId, options.workspaceName, result, options.pipelineConfig);

    // Convert to expected Dossier format
    return result.dossier;
  }

  /**
   * Process idea using simulated mode (existing functionality)
   */
  private async processSimulated(
    ideaText: string,
    options: any
  ): Promise<Dossier> {
    // Generate title and one-liner
    const title = this.generateTitle(ideaText);
    const oneLiner = this.generateOneLiner(ideaText);
    const slug = toSlug(title);
    
    // Calculate scores
    const scores = scoreIdea(ideaText);
    
    // Generate artifacts
    const [prd, runbook, repo, api] = await Promise.all([
      TemplateGenerator.makePRD(title, oneLiner, ideaText, scores),
      TemplateGenerator.makeRunbook(title),
      TemplateGenerator.makeRepoTree(slug),
      TemplateGenerator.makeAPISketch()
    ]);

    // Build dossier
    const dossier: Dossier = {
      id: `dossier_${Date.now()}`,
      created_at: new Date().toISOString(),
      idea_text: ideaText,
      title,
      one_liner: oneLiner,
      scores,
      prd,
      runbook,
      repo,
      api
    };

    const context = this.buildContext(ideaText, options);
    const compliance = this.complianceService.evaluate(context, dossier);
    if (compliance.status === 'fail') {
      throw new Error(`Compliance guardrail failed: ${compliance.summary}`);
    }
    const simulatedResult: PipelineResultLike = {
      dossier,
      metadata: {
        processingTime: 0,
        totalCost: 0,
        stagesCompleted: 9,
        agentsInvolved: [],
        stageMetrics: [],
        compliance
      }
    }
    simulatedResult.metadata.evaluation = this.evaluationService.assess(dossier, simulatedResult as any)
    this.logTelemetry(simulatedResult as any)
    await this.recordWorkspaceRun(options.workspaceId, options.workspaceName, simulatedResult as any, options.pipelineConfig)

    return dossier;
  }

  private buildContext(
    ideaText: string,
    options: {
      userId?: string;
      industry?: string;
      targetMarket?: string;
      budget?: string;
      timeline?: string;
      qualityThreshold?: number;
      maxCost?: number;
      pipelineConfig?: PipelineRunConfig;
    }
  ): IdeaContext {
    return {
      ideaText,
      userId: options.userId,
      industry: options.industry,
      targetMarket: options.targetMarket,
      budget: options.budget,
      timeline: options.timeline,
      constraints: {
        maxCost: options.maxCost || this.config.defaultBudgetLimit,
        maxDuration: 30 * 60 * 1000,
        qualityThreshold: options.qualityThreshold || this.config.defaultQualityThreshold
      }
    }
  }

  /**
   * Stream pipeline progress in real-time
   */
  async *streamPipelineProgress(
    ideaText: string,
    options: any = {}
  ): AsyncGenerator<PipelineProgress, Dossier, unknown> {
    
    if (!this.config.enableLiveMode || !this.conductor) {
      // Simulate progress for non-live mode
      const stages = ['normalize', 'research', 'feasibility', 'market_moat', 'risk_assessment', 
                     'ux_design', 'code_scaffold', 'api_design', 'export'];
      
      for (let i = 0; i < stages.length; i++) {
        yield {
          currentStage: i + 1,
          totalStages: stages.length,
          percentage: Math.round(((i + 1) / stages.length) * 100),
          stagesCompleted: i,
          stagesFailed: 0,
          estimatedTimeRemaining: (stages.length - i - 1) * 2000 // 2s per stage
        };
        
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      // Return final result
      return await this.processSimulated(ideaText, options);
    }

    // Real streaming with the live agent stack
    const context: IdeaContext = {
      ideaText,
      userId: options.userId,
      industry: options.industry,
      targetMarket: options.targetMarket,
      budget: options.budget,
      timeline: options.timeline,
      constraints: {
        maxCost: options.maxCost || this.config.defaultBudgetLimit,
        maxDuration: 30 * 60 * 1000,
        qualityThreshold: options.qualityThreshold || this.config.defaultQualityThreshold
      }
    };

    let finalResult: Dossier;
    
    // Set up progress tracking
    const conductor = this.conductor;
    if (!conductor) {
      throw new Error('Conductor not initialized for live pipeline execution.');
    }

    const progressListener = (data: any) => {
      this.emit('progress', data.progress);
    };
    
    conductor.on('stage:started', progressListener);
    conductor.on('stage:completed', progressListener);
    
    try {
      // Start pipeline execution
      const pipelinePromise = conductor.executePipeline(context);
      
      // Yield progress updates
      while (true) {
        // Check if pipeline is complete
        const activeExecutions = conductor.getActiveExecutions();
        const execution = activeExecutions.find(e => e.context.ideaText === ideaText);
        
        if (!execution) {
          // Pipeline completed or failed
          break;
        }
        
        yield execution.progress;
        
        // Wait before next progress check
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Get final result
      const result = await pipelinePromise;
      finalResult = result.dossier;
      
    } finally {
      conductor.off('stage:started', progressListener);
      conductor.off('stage:completed', progressListener);
    }
    
    return finalResult!;
  }

  /**
   * Get pipeline execution status
   */
  getPipelineStatus(executionId: string): PipelineProgress | null {
    if (!this.conductor) return null;
    
    const executions = this.conductor.getActiveExecutions();
    const execution = executions.find(e => e.executionId === executionId);
    
    return execution ? execution.progress : null;
  }

  /**
   * Cancel a running pipeline
   */
  async cancelPipeline(executionId: string): Promise<boolean> {
    if (!this.conductor) return false;
    
    return await this.conductor.cancelExecution(executionId);
  }

  /**
   * Get service health and statistics
   */
  async getServiceHealth(): Promise<{
    healthy: boolean;
    mode: 'live' | 'simulated';
    stats?: {
      totalCost: number;
      averageCostPerRequest: number;
      requestCount: number;
      activePipelines: number;
    };
    error?: string;
  }> {
    const agentService = this.agents;
    const conductor = this.conductor;

    if (!this.config.enableLiveMode || !agentService || !conductor) {
      return {
        healthy: true,
        mode: 'simulated'
      };
    }

    try {
      const [health, stats] = await Promise.all([
        agentService.healthCheck(),
        agentService.getCostStats()
      ]);

      return {
        healthy: health.healthy,
        mode: 'live',
        stats: {
          totalCost: stats.totalCost,
          averageCostPerRequest: stats.averageCostPerRequest,
          requestCount: stats.requestCount,
          activePipelines: conductor.getActiveExecutions().length
        },
        error: health.error
      };
    } catch (error) {
      return {
        healthy: false,
        mode: 'live',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate a title from idea text (fallback for simulated mode)
   */
  private generateTitle(ideaText: string): string {
    // Extract key words and create a title
    const words = ideaText.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .slice(0, 3);
    
    return words
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('') || 'Startup Idea';
  }

  /**
   * Generate a one-liner from idea text (fallback for simulated mode)
   */
  private generateOneLiner(ideaText: string): string {
    // Truncate and clean up the idea text
    const cleaned = ideaText.replace(/\s+/g, ' ').trim();
    
    if (cleaned.length <= 150) {
      return cleaned;
    }
    
    // Find the last complete sentence within 150 characters
    const truncated = cleaned.substring(0, 147);
    const lastPeriod = truncated.lastIndexOf('.');
    const lastSpace = truncated.lastIndexOf(' ');
    
    if (lastPeriod > 100) {
      return cleaned.substring(0, lastPeriod + 1);
    } else if (lastSpace > 100) {
      return cleaned.substring(0, lastSpace) + '...';
    } else {
      return truncated + '...';
    }
  }

  /**
   * Enable or disable live mode
   */
  setLiveMode(enabled: boolean): void {
    this.config.enableLiveMode = enabled && !!this.config.apiKey;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<LaunchloomServiceConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Reinitialize services if needed
    if (config.apiKey || config.enableLiveMode !== undefined) {
      if (this.config.enableLiveMode && this.config.apiKey) {
        this.initializeLiveServices(this.config.apiKey);
      } else {
        this.agents = undefined;
        this.conductor = undefined;
      }
    }
  }

  private logTelemetry(result: PipelineResult | PipelineResultLike): void {
    try {
      console.info('launchloom.telemetry', {
        processingTimeMs: result.metadata.processingTime,
        totalCost: result.metadata.totalCost,
        stageMetrics: result.metadata.stageMetrics,
        complianceStatus: result.metadata.compliance?.status,
        evaluationScore: result.metadata.evaluation?.score,
        integrations: this.integrationRegistry.list().map(integration => integration.id)
      })
    } catch (error) {
      console.warn('Telemetry logging failed', error)
    }
  }

  private async recordWorkspaceRun(
    workspaceId: string | undefined,
    workspaceName: string | undefined,
    result: PipelineResult | PipelineResultLike,
    pipelineConfig?: PipelineRunConfig
  ): Promise<void> {
    if (!workspaceId) return

    try {
      const workspace = await this.workspaceService.ensureWorkspace(workspaceId, workspaceName)
      const runPayload: WorkspaceRunPersistPayload = {
        runId: (result as PipelineResult).executionId ?? `sim-${Date.now()}`,
        executionId: (result as PipelineResult).executionId,
        ideaTitle: result.dossier.title,
        ideaSlug: toSlug(result.dossier.title),
        ideaOneLiner: result.dossier.one_liner,
        ideaText: result.dossier.idea_text,
        complianceStatus: result.metadata.compliance?.status ?? 'pass',
        evaluationScore: result.metadata.evaluation?.score,
        overallQuality: (result as PipelineResult).overallQuality,
        totalCost: result.metadata.totalCost,
        durationMs: result.metadata.processingTime,
        stageMetrics: result.metadata.stageMetrics ?? [],
        telemetry: {
          stagesCompleted: result.metadata.stagesCompleted,
          agentsInvolved: result.metadata.agentsInvolved,
          processingTime: result.metadata.processingTime,
        },
        complianceReport: result.metadata.compliance ?? null,
        evaluationReport: result.metadata.evaluation ?? null,
        pipelineConfig: pipelineConfig ?? undefined,
      }

      await this.workspaceService.recordRun(workspace.id, runPayload)
      this.managedOpsService.record(
        (result as PipelineResult).executionId ?? `sim-${Date.now()}`,
        result.metadata.evaluation,
        result.metadata.compliance
      )
    } catch (error) {
      console.warn('Failed to persist workspace run', error)
    }
  }
}

interface PipelineExecution {
  executionId: string;
  ideaText: string;
  startTime: number;
  progress: PipelineProgress;
}

interface PipelineResultLike {
  executionId?: string;
  dossier: Dossier;
  metadata: {
    processingTime: number;
    totalCost: number;
    stagesCompleted: number;
    agentsInvolved: string[];
    stageMetrics?: StageMetric[];
    compliance?: ComplianceReport;
    evaluation?: EvaluationReport;
  };
}

// Singleton instance for use throughout the app
let launchloomServiceInstance: LaunchloomService | null = null;

export function createLaunchloomService(config: LaunchloomServiceConfig): LaunchloomService {
  launchloomServiceInstance = new LaunchloomService(config);
  return launchloomServiceInstance;
}

export function getLaunchloomService(): LaunchloomService {
  if (!launchloomServiceInstance) {
    throw new Error('Launchloom service not initialized. Call createLaunchloomService first.');
  }
  return launchloomServiceInstance;
}
