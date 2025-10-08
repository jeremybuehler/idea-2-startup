import { Agent, run, setDefaultModelProvider } from '@openai/agents'
import { OpenAIProvider, setDefaultOpenAIKey } from '@openai/agents-openai'
import { AIResponseCache } from './AIResponseCache'
import { CostTracker } from './CostTracker'
import { Logger } from '../utils/Logger'

export interface AgentMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AgentRequestOptions {
  model?: string
  maxTokens?: number
  temperature?: number
  stream?: boolean
  useCache?: boolean
  retries?: number
  timeout?: number
}

export interface AgentResponse {
  content: string
  usage: {
    inputTokens: number
    outputTokens: number
    cost: number
  }
  cached: boolean
  model: string
  responseTime: number
}

interface PricingEntry {
  input: number
  output: number
}

const DEFAULT_MODEL = 'gpt-4.1-mini'
const DEFAULT_SYSTEM_PROMPT = 'You are a Codex Agents stage orchestrator. Respond with tightly structured JSON that satisfies the caller\'s request.'

const PRICING: Record<string, PricingEntry> = {
  'gpt-4.1-mini': { input: 0.0003, output: 0.0006 },
  'gpt-4.1': { input: 0.01, output: 0.03 },
  'o4-mini': { input: 0.0008, output: 0.0016 }
}

export class CodexAgentsService {
  private cache: AIResponseCache
  private costTracker: CostTracker
  private logger: Logger
  private defaultOptions: Required<Omit<AgentRequestOptions, 'model' | 'stream'>> & { model: string }
  private provider?: OpenAIProvider

  constructor(apiKey: string) {
    this.cache = new AIResponseCache()
    this.costTracker = new CostTracker()
    this.logger = new Logger('CodexAgentsService')
    this.defaultOptions = {
      model: DEFAULT_MODEL,
      maxTokens: 4000,
      temperature: 0.7,
      useCache: true,
      retries: 2,
      timeout: 30000
    }

    if (apiKey) {
      this.provider = new OpenAIProvider({ apiKey })
      setDefaultOpenAIKey(apiKey)
      setDefaultModelProvider(this.provider)
    }
  }

  async sendMessage(messages: AgentMessage[], options: AgentRequestOptions = {}): Promise<AgentResponse> {
    const config = { ...this.defaultOptions, ...options }
    const startTime = Date.now()

    if (config.useCache) {
      const cached = await this.cache.get(messages, config)
      if (cached) {
        this.logger.info('Cache hit for Codex agent request')
        return {
          ...cached,
          cached: true,
          responseTime: Date.now() - startTime
        }
      }
    }

    const systemPrompt = this.extractSystemPrompt(messages)
    const userPrompt = this.buildUserPrompt(messages)

    const agent = new Agent({
      name: 'Codex Stage Agent',
      instructions: systemPrompt || DEFAULT_SYSTEM_PROMPT,
      model: config.model,
      modelSettings: {
        temperature: config.temperature,
        maxTokens: config.maxTokens
      }
    })

    let attempt = 0
    let lastError: unknown

    while (attempt <= config.retries) {
      const abortController = new AbortController()
      const timer = config.timeout
        ? setTimeout(() => abortController.abort(), config.timeout)
        : undefined

      try {
        const result = await run(agent, userPrompt, {
          signal: abortController.signal
        })

        if (timer) {
          clearTimeout(timer)
        }

        const finalOutput = this.renderOutput(result.finalOutput)
        const usage = this.extractUsage(result)
        const totalUsage = {
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
          cost: this.calculateCost(config.model, usage.inputTokens, usage.outputTokens)
        }

        await this.costTracker.trackUsage({
          inputTokens: totalUsage.inputTokens,
          outputTokens: totalUsage.outputTokens,
          cost: totalUsage.cost,
          model: config.model
        })

        const response: AgentResponse = {
          content: finalOutput,
          usage: totalUsage,
          cached: false,
          model: config.model,
          responseTime: Date.now() - startTime
        }

        if (config.useCache) {
          await this.cache.set(messages, config, response)
        }

        return response
      } catch (error) {
        if (timer) {
          clearTimeout(timer)
        }

        lastError = error
        attempt += 1

        if (attempt > config.retries) {
          this.logger.error('Codex agent request failed', error)
          throw error
        }

        const delayMs = Math.min(2000 * attempt, 5000)
        await this.delay(delayMs)
      }
    }

    this.logger.error('Codex agent request failed without throwing error explicitly')
    throw lastError instanceof Error ? lastError : new Error('Codex agent request failed')
  }

  async *streamMessage(messages: AgentMessage[], options: AgentRequestOptions = {}): AsyncGenerator<string, AgentResponse, unknown> {
    // Streaming fallbacks to non-stream implementation for now
    const response = await this.sendMessage(messages, { ...options, stream: false })
    yield response.content
    return response
  }

  async healthCheck(): Promise<{ healthy: boolean; error?: string }> {
    try {
      const usage = await this.costTracker.getStats()
      return {
        healthy: true,
        error: undefined,
        ...usage
      }
    } catch (error) {
      return {
        healthy: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async getCostStats() {
    return this.costTracker.getStats()
  }

  private extractSystemPrompt(messages: AgentMessage[]): string {
    return messages
      .filter(message => message.role === 'system')
      .map(message => message.content.trim())
      .join('\n\n')
  }

  private buildUserPrompt(messages: AgentMessage[]): string {
    const relevant = messages.filter(message => message.role !== 'system')
    if (relevant.length === 1 && relevant[0].role === 'user') {
      return relevant[0].content
    }

    return relevant
      .map(message => `${message.role.toUpperCase()}:\n${message.content}`)
      .join('\n\n')
  }

  private extractUsage(result: any): { inputTokens: number; outputTokens: number } {
    const usage = result?.state?._context?.usage
    if (!usage) {
      return { inputTokens: 0, outputTokens: 0 }
    }

    return {
      inputTokens: usage.inputTokens ?? 0,
      outputTokens: usage.outputTokens ?? 0
    }
  }

  private calculateCost(model: string, inputTokens: number, outputTokens: number): number {
    const pricing = PRICING[model] || PRICING[DEFAULT_MODEL]
    const inputCost = (inputTokens / 1000) * pricing.input
    const outputCost = (outputTokens / 1000) * pricing.output
    return Number((inputCost + outputCost).toFixed(6))
  }

  private renderOutput(finalOutput: unknown): string {
    if (typeof finalOutput === 'string') {
      return finalOutput
    }

    if (!finalOutput) {
      return ''
    }

    try {
      return JSON.stringify(finalOutput, null, 2)
    } catch (error) {
      this.logger.warn('Unable to serialize Codex agent output', error)
      return String(finalOutput)
    }
  }

  private async delay(ms: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms))
  }
}
