import Anthropic from '@anthropic-ai/sdk';
import { AIResponseCache } from './AIResponseCache';
import { CostTracker } from './CostTracker';
import { Logger } from '../utils/Logger';

export interface ClaudeMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ClaudeRequestOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
  useCache?: boolean;
  retries?: number;
  timeout?: number;
}

export interface ClaudeResponse {
  content: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    cost: number;
  };
  cached: boolean;
  model: string;
  responseTime: number;
}

export class ClaudeAIService {
  private claude: Anthropic;
  private cache: AIResponseCache;
  private costTracker: CostTracker;
  private logger: Logger;
  
  // Model configurations
  private readonly models = {
    'claude-3-5-sonnet-20241022': { 
      inputCostPer1k: 0.003, 
      outputCostPer1k: 0.015,
      maxTokens: 200000,
      contextWindow: 200000
    },
    'claude-3-haiku-20240307': { 
      inputCostPer1k: 0.00025, 
      outputCostPer1k: 0.00125,
      maxTokens: 200000,
      contextWindow: 200000
    }
  };

  private readonly defaultOptions: ClaudeRequestOptions = {
    model: 'claude-3-5-sonnet-20241022',
    maxTokens: 4000,
    temperature: 0.7,
    stream: false,
    useCache: true,
    retries: 3,
    timeout: 30000
  };

  constructor(apiKey: string) {
    this.claude = new Anthropic({ apiKey });
    this.cache = new AIResponseCache();
    this.costTracker = new CostTracker();
    this.logger = new Logger('ClaudeAIService');
  }

  /**
   * Send a message to Claude with comprehensive error handling and optimization
   */
  async sendMessage(
    messages: ClaudeMessage[], 
    options: ClaudeRequestOptions = {}
  ): Promise<ClaudeResponse> {
    const config = { ...this.defaultOptions, ...options };
    const startTime = Date.now();
    
    try {
      // Check cache first
      if (config.useCache) {
        const cached = await this.cache.get(messages, config);
        if (cached) {
          this.logger.info('Cache hit for Claude request');
          return {
            ...cached,
            cached: true,
            responseTime: Date.now() - startTime
          };
        }
      }

      // Make API request with retries
      const response = await this.makeRequestWithRetry(messages, config);
      
      // Calculate cost and track usage
      const usage = this.calculateUsage(response, config.model!);
      await this.costTracker.trackUsage(usage);
      
      const result: ClaudeResponse = {
        content: response.content[0].type === 'text' ? response.content[0].text : '',
        usage,
        cached: false,
        model: config.model!,
        responseTime: Date.now() - startTime
      };

      // Cache successful response
      if (config.useCache) {
        await this.cache.set(messages, config, result);
      }

      this.logger.info(`Claude request completed: ${usage.outputTokens} tokens, $${usage.cost.toFixed(4)}`);
      return result;

    } catch (error) {
      this.logger.error('Claude API error:', error);
      throw new Error(`Claude API failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Stream a message response for real-time updates
   */
  async *streamMessage(
    messages: ClaudeMessage[],
    options: ClaudeRequestOptions = {}
  ): AsyncGenerator<string, ClaudeResponse, unknown> {
    const config = { ...this.defaultOptions, ...options, stream: true };
    const startTime = Date.now();
    let fullContent = '';
    
    try {
      const stream = await this.claude.messages.create({
        model: config.model!,
        max_tokens: config.maxTokens!,
        temperature: config.temperature!,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        stream: true
      });

      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          const text = chunk.delta.text;
          fullContent += text;
          yield text;
        }
      }

      // Calculate final usage and cost
      const usage = this.estimateUsage(messages, fullContent, config.model!);
      await this.costTracker.trackUsage(usage);

      return {
        content: fullContent,
        usage,
        cached: false,
        model: config.model!,
        responseTime: Date.now() - startTime
      };

    } catch (error) {
      this.logger.error('Claude streaming error:', error);
      throw new Error(`Claude streaming failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Make request with exponential backoff retry logic
   */
  private async makeRequestWithRetry(
    messages: ClaudeMessage[],
    config: ClaudeRequestOptions,
    attempt: number = 1
  ): Promise<Anthropic.Messages.Message> {
    try {
      return await this.claude.messages.create({
        model: config.model!,
        max_tokens: config.maxTokens!,
        temperature: config.temperature!,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      });
    } catch (error) {
      if (attempt >= config.retries!) {
        throw error;
      }

      const delay = Math.pow(2, attempt - 1) * 1000; // Exponential backoff
      this.logger.warn(`Claude API retry ${attempt}/${config.retries} after ${delay}ms`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return this.makeRequestWithRetry(messages, config, attempt + 1);
    }
  }

  /**
   * Calculate token usage and cost
   */
  private calculateUsage(
    response: Anthropic.Messages.Message, 
    model: string
  ): { inputTokens: number; outputTokens: number; cost: number } {
    const modelConfig = this.models[model as keyof typeof this.models];
    const inputTokens = response.usage.input_tokens;
    const outputTokens = response.usage.output_tokens;
    
    const cost = (inputTokens / 1000 * modelConfig.inputCostPer1k) + 
                 (outputTokens / 1000 * modelConfig.outputCostPer1k);

    return { inputTokens, outputTokens, cost };
  }

  /**
   * Estimate usage for streaming responses
   */
  private estimateUsage(
    messages: ClaudeMessage[], 
    content: string, 
    model: string
  ): { inputTokens: number; outputTokens: number; cost: number } {
    const modelConfig = this.models[model as keyof typeof this.models];
    
    // Rough token estimation (4 chars ≈ 1 token)
    const inputTokens = Math.ceil(messages.reduce((acc, msg) => acc + msg.content.length, 0) / 4);
    const outputTokens = Math.ceil(content.length / 4);
    
    const cost = (inputTokens / 1000 * modelConfig.inputCostPer1k) + 
                 (outputTokens / 1000 * modelConfig.outputCostPer1k);

    return { inputTokens, outputTokens, cost };
  }

  /**
   * Get current cost statistics
   */
  async getCostStats(): Promise<{
    totalCost: number;
    todayCost: number;
    requestCount: number;
    averageCostPerRequest: number;
    cacheHitRate: number;
  }> {
    const stats = await this.costTracker.getStats();
    const cacheStats = await this.cache.getStats();
    
    return {
      ...stats,
      cacheHitRate: cacheStats.hitRate
    };
  }

  /**
   * Health check for the Claude service
   */
  async healthCheck(): Promise<{ healthy: boolean; latency: number; error?: string }> {
    const startTime = Date.now();
    
    try {
      await this.sendMessage([
        { role: 'user', content: 'Health check - respond with "OK"' }
      ], {
        maxTokens: 10,
        useCache: false,
        retries: 1
      });
      
      return {
        healthy: true,
        latency: Date.now() - startTime
      };
    } catch (error) {
      return {
        healthy: false,
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
