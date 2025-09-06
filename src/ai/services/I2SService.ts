import { ClaudeAIService } from './ClaudeAIService';
import { Conductor } from '../agents/Conductor';
import { IdeaContext, PipelineResult, PipelineProgress } from '../types/Pipeline';
import { Dossier, IdeaScores } from '../../types';
import { EventEmitter } from 'events';

interface I2SConfig {
  apiKey: string;
  enableLiveMode: boolean;
  defaultQualityThreshold: number;
  defaultBudgetLimit: number;
}

export class I2SService extends EventEmitter {
  private claude: ClaudeAIService;
  private conductor: Conductor;
  private config: I2SConfig;
  private activePipelines = new Map<string, PipelineExecution>();

  constructor(config: I2SConfig) {
    super();
    this.config = config;
    
    if (config.enableLiveMode && config.apiKey) {
      this.claude = new ClaudeAIService(config.apiKey);
      this.conductor = new Conductor(this.claude, {
        qualityThreshold: config.defaultQualityThreshold,
        budgetLimit: config.defaultBudgetLimit
      });
      
      // Forward conductor events
      this.conductor.on('pipeline:completed', (data) => this.emit('pipeline:completed', data));
      this.conductor.on('pipeline:failed', (data) => this.emit('pipeline:failed', data));
      this.conductor.on('stage:started', (data) => this.emit('stage:started', data));
      this.conductor.on('stage:completed', (data) => this.emit('stage:completed', data));
      this.conductor.on('stage:failed', (data) => this.emit('stage:failed', data));
    }
  }

  /**
   * Process an idea through the I2S pipeline (replaces makeDossier)
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
    } = {}
  ): Promise<Dossier> {
    
    // Use live mode if enabled and requested
    const useLive = this.config.enableLiveMode && (options.useLive !== false);
    
    if (useLive && this.conductor) {
      return await this.processWithClaude(ideaText, options);
    } else {
      // Fallback to simulated mode (existing functionality)
      return await this.processSimulated(ideaText, options);
    }
  }

  /**
   * Process idea using Claude-powered agents
   */
  private async processWithClaude(
    ideaText: string,
    options: any
  ): Promise<Dossier> {
    
    const context: IdeaContext = {
      ideaText,
      userId: options.userId,
      industry: options.industry,
      targetMarket: options.targetMarket,
      budget: options.budget,
      timeline: options.timeline,
      constraints: {
        maxCost: options.maxCost || this.config.defaultBudgetLimit,
        maxDuration: 30 * 60 * 1000, // 30 minutes
        qualityThreshold: options.qualityThreshold || this.config.defaultQualityThreshold
      }
    };

    // Execute pipeline
    const result = await this.conductor.executePipeline(context);
    
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
    // Import existing simulated functions
    const { makePRD, makeRunbook, makeRepoTree, makeAPISketch } = await import('../../lib/generators');
    const { scoreIdea } = await import('../../lib/scoring');
    const { toSlug } = await import('../../lib/utils');
    
    // Generate title and one-liner
    const title = this.generateTitle(ideaText);
    const oneLiner = this.generateOneLiner(ideaText);
    const slug = toSlug(title);
    
    // Calculate scores
    const scores = scoreIdea(ideaText);
    
    // Generate artifacts
    const [prd, runbook, repo, api] = await Promise.all([
      makePRD(title, oneLiner, ideaText, scores),
      makeRunbook(title, slug, scores),
      makeRepoTree(title, slug),
      makeAPISketch(title, slug, oneLiner)
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

    return dossier;
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

    // Real streaming with Claude
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
    const progressListener = (data: any) => {
      this.emit('progress', data.progress);
    };
    
    this.conductor.on('stage:started', progressListener);
    this.conductor.on('stage:completed', progressListener);
    
    try {
      // Start pipeline execution
      const pipelinePromise = this.conductor.executePipeline(context);
      
      // Yield progress updates
      while (true) {
        // Check if pipeline is complete
        const activeExecutions = this.conductor.getActiveExecutions();
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
      this.conductor.off('stage:started', progressListener);
      this.conductor.off('stage:completed', progressListener);
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
      cacheHitRate: number;
      activePipelines: number;
    };
    error?: string;
  }> {
    
    if (!this.config.enableLiveMode || !this.claude) {
      return {
        healthy: true,
        mode: 'simulated'
      };
    }

    try {
      const [health, stats] = await Promise.all([
        this.claude.healthCheck(),
        this.claude.getCostStats()
      ]);

      return {
        healthy: health.healthy,
        mode: 'live',
        stats: {
          totalCost: stats.totalCost,
          cacheHitRate: stats.cacheHitRate,
          activePipelines: this.conductor.getActiveExecutions().length
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
  updateConfig(config: Partial<I2SConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Reinitialize services if needed
    if (config.apiKey || config.enableLiveMode !== undefined) {
      if (this.config.enableLiveMode && this.config.apiKey) {
        this.claude = new ClaudeAIService(this.config.apiKey);
        this.conductor = new Conductor(this.claude, {
          qualityThreshold: this.config.defaultQualityThreshold,
          budgetLimit: this.config.defaultBudgetLimit
        });
      }
    }
  }
}

interface PipelineExecution {
  executionId: string;
  ideaText: string;
  startTime: number;
  progress: PipelineProgress;
}

// Singleton instance for use throughout the app
let i2sServiceInstance: I2SService | null = null;

export function createI2SService(config: I2SConfig): I2SService {
  i2sServiceInstance = new I2SService(config);
  return i2sServiceInstance;
}

export function getI2SService(): I2SService {
  if (!i2sServiceInstance) {
    throw new Error('I2S Service not initialized. Call createI2SService first.');
  }
  return i2sServiceInstance;
}
