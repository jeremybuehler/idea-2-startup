import { createI2SService, I2SService } from '../services/I2SService';

// Environment configuration
const config = {
  // Codex Agents / OpenAI API configuration
  apiKey: process.env.CODEX_API_KEY || process.env.OPENAI_API_KEY || '',
  
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
    console.warn('Live mode enabled but no Codex Agents API key found. Falling back to simulated mode.');
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

// Initialize I2S service
let i2sService: I2SService;

export function initializeI2S(): I2SService {
  validateConfig();
  
  if (!i2sService) {
    i2sService = createI2SService({
      apiKey: config.apiKey,
      enableLiveMode: config.enableLiveMode,
      defaultQualityThreshold: config.defaultQualityThreshold,
      defaultBudgetLimit: config.defaultBudgetLimit
    });
    
    // Set up global event handlers
    i2sService.on('pipeline:completed', (data) => {
      console.log('Pipeline completed:', data.executionId);
    });
    
    i2sService.on('pipeline:failed', (data) => {
      console.error('Pipeline failed:', data.executionId, data.error);
    });
    
    // Log service initialization
    console.log('I2S Service initialized:', {
      mode: config.enableLiveMode ? 'live' : 'simulated',
      qualityThreshold: config.defaultQualityThreshold,
      budgetLimit: config.defaultBudgetLimit
    });
  }
  
  return i2sService;
}

export function getI2S(): I2SService {
  if (!i2sService) {
    return initializeI2S();
  }
  return i2sService;
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
