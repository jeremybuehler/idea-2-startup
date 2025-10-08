// Core pipeline types for Launchloom agent system

import { MarketIntel } from './market'

export type PipelineStage = 
  | 'normalize'
  | 'research'
  | 'feasibility'
  | 'market_moat'
  | 'risk_assessment'
  | 'ux_design'
  | 'code_scaffold'
  | 'api_design'
  | 'export';

export interface IdeaContext {
  ideaText: string;
  userId?: string;
  industry?: string;
  targetMarket?: string;
  budget?: string;
  timeline?: string;
  requirements?: {
    includeWireframes: boolean;
    includeCodeScaffold: boolean;
    includeRunbook: boolean;
    analysisDepth: 'quick' | 'standard' | 'detailed';
  };
  constraints?: {
    maxCost: number;
    maxDuration: number;
    qualityThreshold: number;
  };
}

export interface IdeaScores {
  total: number;
  desirability: number;
  feasibility: number;
  viability: number;
  defensibility: number;
  timing: number;
}

export interface Dossier {
  id: string;
  created_at: string;
  idea_text: string;
  title: string;
  one_liner: string;
  scores: IdeaScores;
  prd: string;
  runbook: string;
  repo: string;
  api: string;
  server?: any;
}

export interface PipelineResult {
  executionId: string;
  dossier: Dossier;
  metadata: {
    processingTime: number;
    totalCost: number;
    stagesCompleted: number;
    agentsInvolved: PipelineStage[];
    marketIntel?: MarketIntel;
  };
  overallQuality: number;
}

export interface PipelineProgress {
  currentStage: number;
  totalStages: number;
  percentage: number;
  stagesCompleted: number;
  stagesFailed: number;
  estimatedTimeRemaining: number;
}

export interface StageResult {
  stage: PipelineStage;
  content: any;
  quality: number;
  cost: number;
  duration: number;
  retryCount: number;
  error?: string;
}

// Stage-specific result types
export interface NormalizeResult {
  title: string;
  oneLiner: string;
  problem: string;
  audience: string;
  valueProposition: string;
}

export interface ResearchResult {
  marketSize: string;
  competitors: Array<{
    name: string;
    description: string;
    strengths: string[];
    weaknesses: string[];
  }>;
  opportunities: string[];
  challenges: string[];
  prd: string;
}

export interface FeasibilityResult {
  score: number; // 1-10
  technologies: string[];
  timeline: {
    mvp: string;
    beta: string;
    launch: string;
  };
  resources: {
    team: string[];
    budget: string;
    infrastructure: string[];
  };
  risks: string[];
}

export interface MarketMoatResult {
  desirability: number; // 1-100
  viability: number; // 1-100
  defensibility: number; // 1-100
  timing: number; // 1-100
  moatStrategies: string[];
}

export interface RiskAssessmentResult {
  technicalRisks: Array<{
    risk: string;
    impact: 'low' | 'medium' | 'high';
    probability: 'low' | 'medium' | 'high';
    mitigation: string;
  }>;
  marketRisks: Array<{
    risk: string;
    impact: 'low' | 'medium' | 'high';
    probability: 'low' | 'medium' | 'high';
    mitigation: string;
  }>;
  financialRisks: Array<{
    risk: string;
    impact: 'low' | 'medium' | 'high';
    probability: 'low' | 'medium' | 'high';
    mitigation: string;
  }>;
  regulatoryRisks: Array<{
    risk: string;
    impact: 'low' | 'medium' | 'high';
    probability: 'low' | 'medium' | 'high';
    mitigation: string;
  }>;
  mitigation: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
}

export interface UXDesignResult {
  userJourney: Array<{
    stage: string;
    actions: string[];
    painPoints: string[];
    opportunities: string[];
  }>;
  keyFlows: Array<{
    name: string;
    steps: string[];
    wireframes?: string[];
  }>;
  wireframes: Array<{
    name: string;
    description: string;
    components: string[];
  }>;
  principles: string[];
  accessibility: {
    guidelines: string[];
    compliance: string[];
    testing: string[];
  };
}

export interface CodeScaffoldResult {
  techStack: {
    frontend: string[];
    backend: string[];
    database: string[];
    infrastructure: string[];
    tools: string[];
  };
  structure: {
    directories: string[];
    files: Array<{
      path: string;
      description: string;
    }>;
  };
  components: Array<{
    name: string;
    type: 'component' | 'service' | 'utility' | 'model';
    description: string;
    dependencies: string[];
  }>;
  database: {
    schema: Array<{
      table: string;
      fields: Array<{
        name: string;
        type: string;
        nullable: boolean;
      }>;
      relationships: Array<{
        type: 'one-to-one' | 'one-to-many' | 'many-to-many';
        target: string;
      }>;
    }>;
  };
  apiStructure: {
    version: string;
    baseUrl: string;
    authentication: string;
    endpoints: Array<{
      method: string;
      path: string;
      description: string;
    }>;
  };
}

export interface APIDesignResult {
  endpoints: Array<{
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    path: string;
    description: string;
    parameters: Array<{
      name: string;
      type: string;
      required: boolean;
      description: string;
    }>;
    requestBody?: {
      type: string;
      schema: any;
    };
    responses: Array<{
      status: number;
      description: string;
      schema: any;
    }>;
  }>;
  models: Array<{
    name: string;
    description: string;
    properties: Array<{
      name: string;
      type: string;
      required: boolean;
      description: string;
    }>;
  }>;
  authentication: {
    type: 'jwt' | 'oauth' | 'api-key' | 'session';
    description: string;
    implementation: string;
  };
  security: {
    rateLimit: {
      requests: number;
      window: string;
    };
    cors: {
      origins: string[];
      methods: string[];
    };
    validation: string[];
  };
  documentation: {
    openapi: string;
    postman: string;
    examples: Array<{
      endpoint: string;
      example: any;
    }>;
  };
}

export interface ExportResult {
  summary: {
    title: string;
    description: string;
    keyFeatures: string[];
    targetMarket: string;
    businessModel: string;
  };
  roadmap: Array<{
    phase: string;
    duration: string;
    milestones: string[];
    deliverables: string[];
  }>;
  runbook: string; // YAML format
  nextSteps: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  metrics: {
    technical: Array<{
      metric: string;
      target: string;
      measurement: string;
    }>;
    business: Array<{
      metric: string;
      target: string;
      measurement: string;
    }>;
    user: Array<{
      metric: string;
      target: string;
      measurement: string;
    }>;
  };
}

// Pipeline execution events
export interface PipelineEvent {
  executionId: string;
  timestamp: number;
  type: 'pipeline:started' | 'pipeline:completed' | 'pipeline:failed' | 'pipeline:cancelled' |
        'stage:started' | 'stage:completed' | 'stage:failed' | 'stage:skipped';
  data: any;
}

export interface StageEvent extends PipelineEvent {
  stage: PipelineStage;
  progress: PipelineProgress;
}

// Quality assessment types
export interface QualityMetrics {
  completeness: number; // 0-1
  accuracy: number; // 0-1
  actionability: number; // 0-1
  clarity: number; // 0-1
  relevance: number; // 0-1
}

export interface QualityAssessment {
  overallScore: number; // 0-1
  metrics: QualityMetrics;
  feedback: string[];
  recommendations: string[];
}

// Context management types
export interface ExecutionContext {
  executionId: string;
  userId?: string;
  sessionId?: string;
  startTime: number;
  configuration: {
    qualityThreshold: number;
    budgetLimit: number;
    timeoutMs: number;
    retryAttempts: number;
  };
  state: {
    currentStage: PipelineStage;
    completedStages: PipelineStage[];
    results: Record<PipelineStage, any>;
    totalCost: number;
    totalDuration: number;
  };
}
