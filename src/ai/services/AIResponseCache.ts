import crypto from 'crypto';
import { ClaudeMessage, ClaudeRequestOptions, ClaudeResponse } from './ClaudeAIService';
import { Logger } from '../utils/Logger';

interface CacheEntry {
  key: string;
  content: string;
  usage: ClaudeResponse['usage'];
  model: string;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
}

interface CacheStats {
  totalEntries: number;
  hitRate: number;
  totalHits: number;
  totalMisses: number;
  storageSize: number;
}

export class AIResponseCache {
  private cache: Map<string, CacheEntry> = new Map();
  private logger: Logger;
  private readonly maxEntries = 10000;
  private readonly ttlMs = 24 * 60 * 60 * 1000; // 24 hours
  private stats = {
    hits: 0,
    misses: 0
  };

  constructor() {
    this.logger = new Logger('AIResponseCache');
    this.startCleanupInterval();
  }

  /**
   * Generate cache key from messages and options
   */
  private generateCacheKey(
    messages: ClaudeMessage[], 
    options: ClaudeRequestOptions
  ): string {
    const content = {
      messages: messages.map(m => ({ role: m.role, content: m.content.trim() })),
      model: options.model,
      temperature: options.temperature,
      maxTokens: options.maxTokens
    };

    const hash = crypto
      .createHash('sha256')
      .update(JSON.stringify(content))
      .digest('hex');

    return `claude_${hash}`;
  }

  /**
   * Check semantic similarity between message sets
   */
  private calculateSimilarity(messages1: ClaudeMessage[], messages2: ClaudeMessage[]): number {
    if (messages1.length !== messages2.length) return 0;

    let totalSimilarity = 0;
    for (let i = 0; i < messages1.length; i++) {
      const msg1 = messages1[i];
      const msg2 = messages2[i];
      
      if (msg1.role !== msg2.role) return 0;
      
      // Simple similarity based on common words
      const words1 = msg1.content.toLowerCase().split(/\s+/);
      const words2 = msg2.content.toLowerCase().split(/\s+/);
      
      const intersection = words1.filter(word => words2.includes(word));
      const union = [...new Set([...words1, ...words2])];
      
      const similarity = intersection.length / union.length;
      totalSimilarity += similarity;
    }

    return totalSimilarity / messages1.length;
  }

  /**
   * Get cached response if available
   */
  async get(
    messages: ClaudeMessage[], 
    options: ClaudeRequestOptions
  ): Promise<Omit<ClaudeResponse, 'cached' | 'responseTime'> | null> {
    const key = this.generateCacheKey(messages, options);
    const entry = this.cache.get(key);

    if (entry && this.isEntryValid(entry)) {
      // Update access stats
      entry.accessCount++;
      entry.lastAccessed = Date.now();
      this.stats.hits++;
      
      this.logger.info(`Cache hit for key: ${key.substring(0, 16)}...`);
      
      return {
        content: entry.content,
        usage: entry.usage,
        model: entry.model
      };
    }

    // Check for similar entries if exact match not found
    const similarEntry = await this.findSimilarEntry(messages, options);
    if (similarEntry) {
      this.stats.hits++;
      return similarEntry;
    }

    this.stats.misses++;
    return null;
  }

  /**
   * Find semantically similar cached entry
   */
  private async findSimilarEntry(
    messages: ClaudeMessage[], 
    options: ClaudeRequestOptions,
    threshold = 0.85
  ): Promise<Omit<ClaudeResponse, 'cached' | 'responseTime'> | null> {
    const sameModelEntries = Array.from(this.cache.values())
      .filter(entry => entry.model === options.model && this.isEntryValid(entry));

    let bestMatch: CacheEntry | null = null;
    let bestSimilarity = 0;

    for (const entry of sameModelEntries) {
      try {
        // Parse original messages from cache (simplified approach)
        const cachedContent = JSON.parse(entry.key.split('_')[1] || '{}');
        const similarity = this.calculateSimilarity(messages, cachedContent.messages || []);
        
        if (similarity > bestSimilarity && similarity >= threshold) {
          bestSimilarity = similarity;
          bestMatch = entry;
        }
      } catch (error) {
        // Skip invalid cache entries
        continue;
      }
    }

    if (bestMatch) {
      bestMatch.accessCount++;
      bestMatch.lastAccessed = Date.now();
      
      this.logger.info(`Similar cache hit (${(bestSimilarity * 100).toFixed(1)}% similarity)`);
      
      return {
        content: bestMatch.content,
        usage: bestMatch.usage,
        model: bestMatch.model
      };
    }

    return null;
  }

  /**
   * Store response in cache
   */
  async set(
    messages: ClaudeMessage[], 
    options: ClaudeRequestOptions, 
    response: ClaudeResponse
  ): Promise<void> {
    const key = this.generateCacheKey(messages, options);
    
    const entry: CacheEntry = {
      key,
      content: response.content,
      usage: response.usage,
      model: response.model,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccessed: Date.now()
    };

    this.cache.set(key, entry);
    this.logger.info(`Cached response for key: ${key.substring(0, 16)}...`);
    
    // Cleanup if cache is too large
    await this.cleanupIfNeeded();
  }

  /**
   * Check if cache entry is still valid
   */
  private isEntryValid(entry: CacheEntry): boolean {
    const age = Date.now() - entry.timestamp;
    return age < this.ttlMs;
  }

  /**
   * Cleanup expired and least-used entries
   */
  private async cleanupIfNeeded(): Promise<void> {
    if (this.cache.size <= this.maxEntries) return;

    const entries = Array.from(this.cache.entries());
    const now = Date.now();
    
    // Remove expired entries first
    const validEntries = entries.filter(([_, entry]) => 
      now - entry.timestamp < this.ttlMs
    );
    
    // If still too many, remove least recently used
    if (validEntries.length > this.maxEntries) {
      validEntries.sort(([_, a], [__, b]) => a.lastAccessed - b.lastAccessed);
      validEntries.splice(this.maxEntries);
    }
    
    // Rebuild cache
    this.cache.clear();
    validEntries.forEach(([key, entry]) => this.cache.set(key, entry));
    
    this.logger.info(`Cache cleanup: ${entries.length} -> ${this.cache.size} entries`);
  }

  /**
   * Start periodic cleanup
   */
  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanupIfNeeded();
    }, 60 * 60 * 1000); // Every hour
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0;
    
    const storageSize = Array.from(this.cache.values())
      .reduce((size, entry) => size + entry.content.length + entry.key.length, 0);

    return {
      totalEntries: this.cache.size,
      hitRate,
      totalHits: this.stats.hits,
      totalMisses: this.stats.misses,
      storageSize
    };
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0 };
    this.logger.info('Cache cleared');
  }

  /**
   * Remove specific cache entry
   */
  async invalidate(messages: ClaudeMessage[], options: ClaudeRequestOptions): Promise<boolean> {
    const key = this.generateCacheKey(messages, options);
    const deleted = this.cache.delete(key);
    
    if (deleted) {
      this.logger.info(`Invalidated cache entry: ${key.substring(0, 16)}...`);
    }
    
    return deleted;
  }

  /**
   * Warm up cache with common requests
   */
  async warmUp(commonRequests: Array<{
    messages: ClaudeMessage[];
    options: ClaudeRequestOptions;
    response: ClaudeResponse;
  }>): Promise<void> {
    for (const request of commonRequests) {
      await this.set(request.messages, request.options, request.response);
    }
    
    this.logger.info(`Cache warmed up with ${commonRequests.length} entries`);
  }
}
