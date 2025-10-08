import crypto from 'crypto'
import { AgentMessage, AgentRequestOptions, AgentResponse } from './CodexAgentsService'
import { Logger } from '../utils/Logger'

interface CacheEntry {
  key: string
  messages: AgentMessage[]
  options: Pick<AgentRequestOptions, 'model' | 'temperature' | 'maxTokens'>
  content: string
  usage: AgentResponse['usage']
  model: string
  timestamp: number
  accessCount: number
  lastAccessed: number
}

interface CacheStats {
  totalEntries: number
  hitRate: number
  totalHits: number
  totalMisses: number
  storageSize: number
}

export class AIResponseCache {
  private cache: Map<string, CacheEntry> = new Map()
  private logger: Logger
  private readonly maxEntries = 10000
  private readonly ttlMs = 24 * 60 * 60 * 1000
  private stats = { hits: 0, misses: 0 }

  constructor() {
    this.logger = new Logger('AIResponseCache')
    this.startCleanupInterval()
  }

  async get(
    messages: AgentMessage[],
    options: AgentRequestOptions
  ): Promise<Omit<AgentResponse, 'cached' | 'responseTime'> | null> {
    const key = this.generateCacheKey(messages, options)
    const entry = this.cache.get(key)

    if (entry && this.isEntryValid(entry)) {
      entry.accessCount += 1
      entry.lastAccessed = Date.now()
      this.stats.hits += 1
      return {
        content: entry.content,
        usage: entry.usage,
        model: entry.model
      }
    }

    this.stats.misses += 1
    return null
  }

  async set(
    messages: AgentMessage[],
    options: AgentRequestOptions,
    response: AgentResponse
  ): Promise<void> {
    const key = this.generateCacheKey(messages, options)

    const entry: CacheEntry = {
      key,
      messages: messages.map(message => ({ ...message })),
      options: {
        model: options.model,
        temperature: options.temperature,
        maxTokens: options.maxTokens
      },
      content: response.content,
      usage: response.usage,
      model: response.model,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccessed: Date.now()
    }

    this.cache.set(key, entry)
    await this.cleanupIfNeeded()
  }

  async invalidate(messages: AgentMessage[], options: AgentRequestOptions): Promise<boolean> {
    const key = this.generateCacheKey(messages, options)
    return this.cache.delete(key)
  }

  async clear(): Promise<void> {
    this.cache.clear()
    this.stats = { hits: 0, misses: 0 }
  }

  async getStats(): Promise<CacheStats> {
    const requestCount = this.stats.hits + this.stats.misses
    const hitRate = requestCount > 0 ? this.stats.hits / requestCount : 0
    const storageSize = Array.from(this.cache.values()).reduce((size, entry) => {
      return size + entry.content.length + entry.key.length
    }, 0)

    return {
      totalEntries: this.cache.size,
      hitRate,
      totalHits: this.stats.hits,
      totalMisses: this.stats.misses,
      storageSize
    }
  }

  async warmUp(entries: Array<{ messages: AgentMessage[]; options: AgentRequestOptions; response: AgentResponse }>): Promise<void> {
    for (const entry of entries) {
      await this.set(entry.messages, entry.options, entry.response)
    }
  }

  private generateCacheKey(
    messages: AgentMessage[],
    options: AgentRequestOptions
  ): string {
    const payload = {
      messages: messages.map(message => ({ role: message.role, content: message.content.trim() })),
      model: options.model,
      temperature: options.temperature,
      maxTokens: options.maxTokens
    }

    const hash = crypto
      .createHash('sha256')
      .update(JSON.stringify(payload))
      .digest('hex')

    return `codex_${hash}`
  }

  private isEntryValid(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < this.ttlMs
  }

  private async cleanupIfNeeded(): Promise<void> {
    if (this.cache.size <= this.maxEntries) {
      return
    }

    const now = Date.now()
    const validEntries = Array.from(this.cache.values()).filter(entry => this.isEntryValid(entry))

    validEntries.sort((a, b) => a.lastAccessed - b.lastAccessed)

    while (validEntries.length > this.maxEntries) {
      const oldest = validEntries.shift()
      if (oldest) {
        this.cache.delete(oldest.key)
      }
    }

    for (const entry of validEntries) {
      this.cache.set(entry.key, entry)
    }
  }

  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanupIfNeeded().catch(error => {
        this.logger.warn('Cache cleanup failed', error)
      })
    }, 60 * 60 * 1000)
  }
}
