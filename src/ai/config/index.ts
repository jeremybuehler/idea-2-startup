import { createLaunchloomService, LaunchloomService } from '../services/LaunchloomService';

// Environment configuration
const config = {
  // Launchloom agent / OpenAI API configuration
  apiKey: process.env.LAUNCHLOOM_API_KEY || process.env.OPENAI_API_KEY || '',
  
  // Feature flags
  enableLiveMode: process.env.NEXT_PUBLIC_USE_LIVE === 'true' || false,
  
  // Default settings
  defaultQualityThreshold: parseFloat(process.env.QUALITY_THRESHOLD || '0.7'),
  defaultBudgetLimit: parseFloat(process.env.BUDGET_LIMIT || '10.0'), // $10 per pipeline
  
  // Development settings
  isDevelopment: process.env.NODE_ENV === 'development',
  logLevel: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
};

// Validate configuration
function validateConfig() {
  if (config.enableLiveMode && !config.apiKey) {
    console.warn('Live mode enabled but no Launchloom agent API key found. Falling back to simulated mode.');
    config.enableLiveMode = false;
  }
  
  if (config.defaultQualityThreshold < 0 || config.defaultQualityThreshold > 1) {
    console.warn('Invalid quality threshold, using default 0.7');
    config.defaultQualityThreshold = 0.7;
  }
  
  if (config.defaultBudgetLimit <= 0) {
    console.warn('Invalid budget limit, using default $10.00');
    config.defaultBudgetLimit = 10.0;
  }
}

// Initialize Launchloom service
let launchloomService: LaunchloomService;

export function initializeLaunchloom(): LaunchloomService {
  validateConfig();
  
  if (!launchloomService) {
    launchloomService = createLaunchloomService({
      apiKey: config.apiKey,
      enableLiveMode: config.enableLiveMode,
      defaultQualityThreshold: config.defaultQualityThreshold,
      defaultBudgetLimit: config.defaultBudgetLimit
    });
    
    // Set up global event handlers
    launchloomService.on('pipeline:completed', (data) => {
      console.log('Pipeline completed:', data.executionId);
    });
    
    launchloomService.on('pipeline:failed', (data) => {
      console.error('Pipeline failed:', data.executionId, data.error);
    });
    
    // Log service initialization
    console.log('Launchloom service initialized:', {
      mode: config.enableLiveMode ? 'live' : 'simulated',
      qualityThreshold: config.defaultQualityThreshold,
      budgetLimit: config.defaultBudgetLimit
    });
  }
  
  return launchloomService;
}

export function getLaunchloom(): LaunchloomService {
  if (!launchloomService) {
    return initializeLaunchloom();
  }
  return launchloomService;
}

export { config };

// Export types for convenience
export type {
  IdeaContext,
  PipelineResult,
  PipelineProgress,
  PipelineStage,
  Dossier,
  IdeaScores
} from '../types/Pipeline';
