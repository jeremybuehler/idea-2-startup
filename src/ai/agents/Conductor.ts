import { LaunchloomAgentsService } from '../services/LaunchloomAgentsService';
import { ResearchService } from '../services/ResearchService';
import { MarketIntel } from '../types/market';
import { Logger } from '../utils/Logger';
import { IdeaContext, PipelineStage, PipelineResult, PipelineProgress } from '../types/Pipeline';
import { EventEmitter } from 'events';

interface ConductorConfig {
  maxConcurrentStages: number;
  timeoutMs: number;
  retryAttempts: number;
  qualityThreshold: number;
  budgetLimit: number;
}

interface StageExecution {
  stage: PipelineStage;
  startTime: number;
  endTime?: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  result?: any;
  error?: string;
  retryCount: number;
  cost: number;
  qualityScore?: number;
}

export class Conductor extends EventEmitter {
  private agentService: LaunchloomAgentsService;
  private researchService?: ResearchService;
  private logger: Logger;
  private config: ConductorConfig;
  
  // Pipeline stages in execution order
  private readonly stages: PipelineStage[] = [
    'normalize',
    'research', 
    'feasibility',
    'market_moat',
    'risk_assessment',
    'ux_design',
    'code_scaffold',
    'api_design',
    'export'
  ];

  private activeExecutions = new Map<string, {
    context: IdeaContext;
    stages: Map<PipelineStage, StageExecution>;
    startTime: number;
    totalCost: number;
  }>();

  constructor(agentService: LaunchloomAgentsService, researchService?: ResearchService, config?: Partial<ConductorConfig>) {
    super();
    this.agentService = agentService;
    this.researchService = researchService;
    this.logger = new Logger('Conductor');
    this.config = {
      maxConcurrentStages: 2,
      timeoutMs: 30 * 60 * 1000, // 30 minutes
      retryAttempts: 2,
      qualityThreshold: 0.7,
      budgetLimit: 10.0, // $10 per pipeline
      ...config
    };
  }

  /**
   * Execute the full Launchloom pipeline for an idea
   */
  async executePipeline(context: IdeaContext): Promise<PipelineResult> {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const logger = this.logger.withContext(executionId, context.userId);
    
    logger.info('Starting pipeline execution', { ideaText: context.ideaText });
    
    // Initialize execution tracking
    const execution = {
      context,
      stages: new Map<PipelineStage, StageExecution>(),
      startTime: Date.now(),
      totalCost: 0
    };

    // Initialize all stages
    this.stages.forEach(stage => {
      execution.stages.set(stage, {
        stage,
        startTime: 0,
        status: 'pending',
        retryCount: 0,
        cost: 0
      });
    });

    this.activeExecutions.set(executionId, execution);

    try {
      // Execute pipeline stages
      const result = await this.runPipelineStages(executionId);
      
      // Emit completion event
      this.emit('pipeline:completed', {
        executionId,
        result,
        duration: Date.now() - execution.startTime,
        totalCost: execution.totalCost
      });

      logger.info('Pipeline execution completed', {
        duration: Date.now() - execution.startTime,
        totalCost: execution.totalCost,
        qualityScore: result.overallQuality
      });

      return result;

    } catch (error) {
      logger.error('Pipeline execution failed', error);
      
      this.emit('pipeline:failed', {
        executionId,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - execution.startTime
      });

      throw error;
    } finally {
      this.activeExecutions.delete(executionId);
    }
  }

  /**
   * Execute all pipeline stages in sequence
   */
  private async runPipelineStages(executionId: string): Promise<PipelineResult> {
    const execution = this.activeExecutions.get(executionId)!;
    const logger = this.logger.withContext(executionId, execution.context.userId);
    
    const results: Record<string, any> = {};
    let overallQuality = 0;
    let stagesCompleted = 0;

    // Execute stages in order
    for (const stage of this.stages) {
      const stageExecution = execution.stages.get(stage)!;
      
      try {
        // Check budget limit
        if (execution.totalCost >= this.config.budgetLimit) {
          logger.warn(`Budget limit reached (${execution.totalCost}), stopping pipeline`);
          break;
        }

        // Start stage execution
        stageExecution.status = 'running';
        stageExecution.startTime = Date.now();
        
        this.emit('stage:started', {
          executionId,
          stage,
          progress: this.calculateProgress(execution)
        });

        logger.info(`Starting stage: ${stage}`);

        // Execute stage with retries
        const stageResult = await this.executeStageWithRetry(
          execution.context, 
          stage, 
          results, 
          stageExecution
        );

        // Update execution state
        stageExecution.endTime = Date.now();
        stageExecution.status = 'completed';
        stageExecution.result = stageResult.content;
        stageExecution.qualityScore = stageResult.quality;
        stageExecution.cost = stageResult.cost;
        
        execution.totalCost += stageResult.cost;
        results[stage] = stageResult.content;
        if (stageResult.supportingIntel) {
          results.__marketIntel = stageResult.supportingIntel;
        }
        overallQuality += stageResult.quality;
        stagesCompleted++;

        this.emit('stage:completed', {
          executionId,
          stage,
          result: stageResult,
          progress: this.calculateProgress(execution)
        });

        logger.info(`Completed stage: ${stage}`, {
          duration: stageExecution.endTime - stageExecution.startTime,
          cost: stageResult.cost,
          quality: stageResult.quality
        });

      } catch (error) {
        stageExecution.status = 'failed';
        stageExecution.endTime = Date.now();
        stageExecution.error = error instanceof Error ? error.message : 'Unknown error';

        this.emit('stage:failed', {
          executionId,
          stage,
          error: stageExecution.error,
          progress: this.calculateProgress(execution)
        });

        logger.error(`Stage ${stage} failed`, error);

        // Decide whether to continue or abort
        if (this.isCriticalStage(stage)) {
          throw new Error(`Critical stage ${stage} failed: ${stageExecution.error}`);
        }
        
        // Skip non-critical failed stages
        stageExecution.status = 'skipped';
        logger.warn(`Skipping failed non-critical stage: ${stage}`);
      }
    }

    // Calculate overall quality
    overallQuality = stagesCompleted > 0 ? overallQuality / stagesCompleted : 0;

    // Build final result
    const finalResult: PipelineResult = {
      executionId,
      dossier: {
        id: `dossier_${Date.now()}`,
        created_at: new Date().toISOString(),
        idea_text: execution.context.ideaText,
        title: results.normalize?.title || 'Untitled Startup',
        one_liner: results.normalize?.oneLiner || execution.context.ideaText,
        scores: {
          total: Math.round(overallQuality * 100),
          desirability: results.market_moat?.desirability || 0,
          feasibility: results.feasibility?.score || 0,
          viability: results.market_moat?.viability || 0,
          defensibility: results.market_moat?.defensibility || 0,
          timing: results.market_moat?.timing || 0
        },
        prd: results.research?.prd || '',
        runbook: results.export?.runbook || '',
        repo: results.code_scaffold?.structure || '',
        api: results.api_design?.specification || ''
      },
      metadata: {
        processingTime: Date.now() - execution.startTime,
        totalCost: execution.totalCost,
        stagesCompleted,
        agentsInvolved: this.stages.slice(0, stagesCompleted),
        marketIntel: results.__marketIntel
      },
      overallQuality
    };

    return finalResult;
  }

  /**
   * Execute a single stage with retry logic
   */
  private async executeStageWithRetry(
    context: IdeaContext,
    stage: PipelineStage,
    previousResults: Record<string, any>,
    stageExecution: StageExecution
  ): Promise<{ content: any; quality: number; cost: number; supportingIntel?: MarketIntel }> {
    
    for (let attempt = 0; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const result = await this.executeStage(context, stage, previousResults);
        
        // Check quality threshold
        if (result.quality < this.config.qualityThreshold && attempt < this.config.retryAttempts) {
          this.logger.warn(`Stage ${stage} quality below threshold (${result.quality}), retrying`);
          stageExecution.retryCount++;
          continue;
        }
        
        return result;
        
      } catch (error) {
        stageExecution.retryCount++;
        
        if (attempt === this.config.retryAttempts) {
          throw error;
        }
        
        this.logger.warn(`Stage ${stage} attempt ${attempt + 1} failed, retrying`, error);
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
    
    throw new Error(`Stage ${stage} failed after ${this.config.retryAttempts + 1} attempts`);
  }

  /**
   * Execute a specific pipeline stage
   */
  private async executeStage(
    context: IdeaContext,
    stage: PipelineStage,
    previousResults: Record<string, any>
  ): Promise<{ content: any; quality: number; cost: number; supportingIntel?: MarketIntel }> {
    let supportingIntel: MarketIntel | undefined

    if (stage === 'research' && this.researchService) {
      supportingIntel = await this.researchService.getMarketIntel(context)
      previousResults.__marketIntel = supportingIntel
    }

    const prompt = this.buildStagePrompt(context, stage, previousResults, supportingIntel);

    const response = await this.agentService.sendMessage([
      { role: 'system', content: this.getSystemPromptForStage(stage) },
      { role: 'user', content: prompt }
    ], {
      model: this.getModelForStage(stage),
      maxTokens: this.getMaxTokensForStage(stage),
      temperature: 0.7
    });

    // Parse and validate result
    const content = this.parseStageResult(stage, response.content);
    const quality = await this.assessResultQuality(stage, content, context);

    return {
      content,
      quality,
      cost: response.usage.cost,
      supportingIntel
    };
  }

  /**
   * Build prompt for a specific stage
   */
  private buildStagePrompt(
    context: IdeaContext,
    stage: PipelineStage,
    previousResults: Record<string, any>,
    supportingIntel?: MarketIntel
  ): string {
    const baseContext = `
Startup Idea: "${context.ideaText}"
Industry: ${context.industry || 'Unknown'}
Target Market: ${context.targetMarket || 'General'}
Budget: ${context.budget || 'Not specified'}
Timeline: ${context.timeline || 'Not specified'}
`;

    const stagePrompts = {
      normalize: `${baseContext}
Your task is to normalize and structure this startup idea. Provide:
1. A clear, compelling title (max 60 characters)
2. A one-liner pitch (max 150 characters)
3. Structured problem statement
4. Target audience definition
5. Core value proposition

Format as JSON with keys: title, oneLiner, problem, audience, valueProposition`,

      research: `${baseContext}
${previousResults.normalize ? `Normalized Idea: ${JSON.stringify(previousResults.normalize)}` : ''}

Conduct comprehensive market research. Provide:
1. Market size and growth trends
2. Competitive landscape analysis
3. Key market opportunities
4. Potential challenges and barriers
5. Initial PRD outline

${supportingIntel ? `Existing market intel (use as grounding data):\n${JSON.stringify(supportingIntel, null, 2)}\n\n` : ''}Format as JSON with keys: marketSize, competitors, opportunities, challenges, prd`,

      feasibility: `${baseContext}
${this.formatPreviousResults(previousResults)}

Assess technical and business feasibility. Provide:
1. Technical complexity score (1-10)
2. Required technologies and skills
3. Development timeline estimate
4. Resource requirements
5. Risk factors

Format as JSON with keys: score, technologies, timeline, resources, risks`,

      market_moat: `${baseContext}
${this.formatPreviousResults(previousResults)}

Analyze market positioning and competitive advantages. Provide:
1. Desirability score (1-100)
2. Viability assessment (1-100)
3. Defensibility analysis (1-100)
4. Market timing evaluation (1-100)
5. Competitive moat strategies

Format as JSON with keys: desirability, viability, defensibility, timing, moatStrategies`,

      risk_assessment: `${baseContext}
${this.formatPreviousResults(previousResults)}

Conduct comprehensive risk analysis. Provide:
1. Technical risks and mitigation
2. Market risks and contingencies
3. Financial risks and planning
4. Regulatory and compliance risks
5. Risk mitigation roadmap

Format as JSON with keys: technicalRisks, marketRisks, financialRisks, regulatoryRisks, mitigation`,

      ux_design: `${baseContext}
${this.formatPreviousResults(previousResults)}

Design user experience and interface. Provide:
1. User journey mapping
2. Key user flows
3. Wireframe descriptions
4. UI/UX principles
5. Accessibility considerations

Format as JSON with keys: userJourney, keyFlows, wireframes, principles, accessibility`,

      code_scaffold: `${baseContext}
${this.formatPreviousResults(previousResults)}

Generate code architecture and scaffold. Provide:
1. Technology stack recommendations
2. Project structure
3. Key components and modules
4. Database schema outline
5. API structure

Format as JSON with keys: techStack, structure, components, database, apiStructure`,

      api_design: `${baseContext}
${this.formatPreviousResults(previousResults)}

Design comprehensive API specification. Provide:
1. REST API endpoints
2. Data models and schemas
3. Authentication strategy
4. Rate limiting and security
5. Documentation structure

Format as JSON with keys: endpoints, models, authentication, security, documentation`,

      export: `${baseContext}
${this.formatPreviousResults(previousResults)}

Create final deliverables and export package. Provide:
1. Executive summary
2. Implementation roadmap
3. Agent runbook (YAML format)
4. Next steps and recommendations
5. Success metrics

Format as JSON with keys: summary, roadmap, runbook, nextSteps, metrics`
    };

    return stagePrompts[stage] || `Process the ${stage} stage for this startup idea.`;
  }

  /**
   * Get system prompt for each stage
   */
  private getSystemPromptForStage(stage: PipelineStage): string {
    const basePrompt = `You are an expert startup advisor and technical architect working on the Launchloom pipeline. Your role is to provide thorough, actionable analysis at each stage.

Key principles:
- Be specific and actionable in all recommendations
- Consider real-world constraints and practical implementation
- Focus on value creation and user needs
- Provide quantitative assessments where possible
- Consider scalability and long-term sustainability

Always respond with valid JSON in the exact format requested.`;

    const stageSpecificPrompts = {
      normalize: basePrompt + ' Focus on clarity, market positioning, and value proposition refinement.',
      research: basePrompt + ' Provide comprehensive market intelligence and competitive insights.',
      feasibility: basePrompt + ' Assess technical and business viability with realistic timelines.',
      market_moat: basePrompt + ' Analyze competitive advantages and market positioning strategies.',
      risk_assessment: basePrompt + ' Identify and quantify risks with actionable mitigation plans.',
      ux_design: basePrompt + ' Design user-centered experiences with accessibility and usability focus.',
      code_scaffold: basePrompt + ' Architect scalable, maintainable technical solutions.',
      api_design: basePrompt + ' Design robust, secure, and well-documented APIs.',
      export: basePrompt + ' Synthesize insights into actionable implementation guidance.'
    };

    return stageSpecificPrompts[stage] || basePrompt;
  }

  /**
   * Choose model per stage
   */
  private getModelForStage(stage: PipelineStage): string {
    const stageModels: Partial<Record<PipelineStage, string>> = {
      code_scaffold: 'gpt-4.1',
      api_design: 'gpt-4.1'
    };

    return stageModels[stage] || 'gpt-4.1-mini';
  }

  /**
   * Get max tokens for each stage
   */
  private getMaxTokensForStage(stage: PipelineStage): number {
    const tokenLimits = {
      normalize: 1000,
      research: 3000,
      feasibility: 2000,
      market_moat: 2000,
      risk_assessment: 2500,
      ux_design: 2500,
      code_scaffold: 3500,
      api_design: 3000,
      export: 2500
    };

    return tokenLimits[stage] || 2000;
  }

  /**
   * Parse stage result from agent response
   */
  private parseStageResult(stage: PipelineStage, content: string): any {
    try {
      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback: return raw content
      return { content };
    } catch (error) {
      this.logger.warn(`Failed to parse JSON for stage ${stage}, using raw content`);
      return { content };
    }
  }

  /**
   * Assess quality of stage result
   */
  private async assessResultQuality(
    stage: PipelineStage,
    result: any,
    context: IdeaContext
  ): Promise<number> {
    // Simple quality assessment based on completeness and structure
    let score = 0.5; // Base score
    
    // Check for required fields based on stage
    const requiredFields = this.getRequiredFieldsForStage(stage);
    const presentFields = requiredFields.filter(field => 
      result[field] && result[field].toString().trim().length > 0
    );
    
    score = presentFields.length / requiredFields.length;
    
    // Bonus for detailed content
    const totalContent = Object.values(result).join(' ').length;
    if (totalContent > 500) score += 0.1;
    if (totalContent > 1000) score += 0.1;
    
    return Math.min(score, 1.0);
  }

  /**
   * Get required fields for quality assessment
   */
  private getRequiredFieldsForStage(stage: PipelineStage): string[] {
    const requiredFields = {
      normalize: ['title', 'oneLiner', 'problem', 'audience', 'valueProposition'],
      research: ['marketSize', 'competitors', 'opportunities', 'challenges', 'prd'],
      feasibility: ['score', 'technologies', 'timeline', 'resources', 'risks'],
      market_moat: ['desirability', 'viability', 'defensibility', 'timing', 'moatStrategies'],
      risk_assessment: ['technicalRisks', 'marketRisks', 'financialRisks', 'regulatoryRisks', 'mitigation'],
      ux_design: ['userJourney', 'keyFlows', 'wireframes', 'principles', 'accessibility'],
      code_scaffold: ['techStack', 'structure', 'components', 'database', 'apiStructure'],
      api_design: ['endpoints', 'models', 'authentication', 'security', 'documentation'],
      export: ['summary', 'roadmap', 'runbook', 'nextSteps', 'metrics']
    };

    return requiredFields[stage] || [];
  }

  /**
   * Format previous results for context
   */
  private formatPreviousResults(results: Record<string, any>): string {
    if (Object.keys(results).length === 0) return '';
    
    return 'Previous Results:\n' + 
      Object.entries(results)
        .map(([stage, result]) => `${stage}: ${JSON.stringify(result)}`)
        .join('\n');
  }

  /**
   * Check if a stage is critical for pipeline continuation
   */
  private isCriticalStage(stage: PipelineStage): boolean {
    const criticalStages: PipelineStage[] = ['normalize', 'research', 'feasibility'];
    return criticalStages.includes(stage);
  }

  /**
   * Calculate pipeline progress
   */
  private calculateProgress(execution: { stages: Map<PipelineStage, StageExecution> }): PipelineProgress {
    const stages = Array.from(execution.stages.values());
    const completed = stages.filter(s => s.status === 'completed').length;
    const failed = stages.filter(s => s.status === 'failed').length;
    const running = stages.filter(s => s.status === 'running').length;
    
    return {
      currentStage: completed + running,
      totalStages: this.stages.length,
      percentage: Math.round((completed / this.stages.length) * 100),
      stagesCompleted: completed,
      stagesFailed: failed,
      estimatedTimeRemaining: this.estimateTimeRemaining(stages)
    };
  }

  /**
   * Estimate remaining processing time
   */
  private estimateTimeRemaining(stages: StageExecution[]): number {
    const completedStages = stages.filter(s => s.status === 'completed' && s.endTime);
    if (completedStages.length === 0) return 0;
    
    const averageTime = completedStages.reduce((sum, stage) => 
      sum + (stage.endTime! - stage.startTime), 0
    ) / completedStages.length;
    
    const remainingStages = stages.filter(s => s.status === 'pending').length;
    
    return remainingStages * averageTime;
  }

  /**
   * Get current pipeline status
   */
  getActiveExecutions(): Array<{
    executionId: string;
    context: IdeaContext;
    progress: PipelineProgress;
    startTime: number;
    totalCost: number;
  }> {
    return Array.from(this.activeExecutions.entries()).map(([id, execution]) => ({
      executionId: id,
      context: execution.context,
      progress: this.calculateProgress(execution),
      startTime: execution.startTime,
      totalCost: execution.totalCost
    }));
  }

  /**
   * Cancel a running pipeline execution
   */
  async cancelExecution(executionId: string): Promise<boolean> {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) return false;
    
    this.logger.info(`Cancelling pipeline execution: ${executionId}`);
    
    this.emit('pipeline:cancelled', {
      executionId,
      duration: Date.now() - execution.startTime,
      totalCost: execution.totalCost
    });
    
    this.activeExecutions.delete(executionId);
    return true;
  }
}
