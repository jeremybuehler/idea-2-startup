import { Logger } from '../utils/Logger';

interface UsageRecord {
  timestamp: number;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  model: string;
  endpoint?: string;
  userId?: string;
}

interface CostStats {
  totalCost: number;
  todayCost: number;
  thisMonthCost: number;
  requestCount: number;
  averageCostPerRequest: number;
  tokenUsage: {
    totalInput: number;
    totalOutput: number;
    averagePerRequest: number;
  };
  modelBreakdown: Record<string, {
    cost: number;
    requests: number;
    tokens: number;
  }>;
}

export class CostTracker {
  private usage: UsageRecord[] = [];
  private logger: Logger;
  private readonly maxRecords = 50000; // Keep last 50k records
  private budgetAlert?: {
    dailyLimit: number;
    monthlyLimit: number;
    alertCallback: (usage: CostStats) => void;
  };

  constructor() {
    this.logger = new Logger('CostTracker');
    this.startPeriodicReports();
  }

  /**
   * Track API usage and cost
   */
  async trackUsage(usage: {
    inputTokens: number;
    outputTokens: number;
    cost: number;
    model?: string;
    endpoint?: string;
    userId?: string;
  }): Promise<void> {
    const record: UsageRecord = {
      timestamp: Date.now(),
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      cost: usage.cost,
      model: usage.model || 'unknown',
      endpoint: usage.endpoint,
      userId: usage.userId
    };

    this.usage.push(record);
    
    // Cleanup old records if needed
    if (this.usage.length > this.maxRecords) {
      this.usage = this.usage.slice(-this.maxRecords);
    }

    // Check budget alerts
    await this.checkBudgetAlerts();
    
    this.logger.debug(`Tracked usage: $${usage.cost.toFixed(4)} (${usage.inputTokens + usage.outputTokens} tokens)`);
  }

  /**
   * Get comprehensive cost statistics
   */
  async getStats(): Promise<CostStats> {
    const now = Date.now();
    const todayStart = new Date().setHours(0, 0, 0, 0);
    const monthStart = new Date().setDate(1);

    // Filter records by time periods
    const todayRecords = this.usage.filter(r => r.timestamp >= todayStart);
    const monthRecords = this.usage.filter(r => r.timestamp >= monthStart);

    // Calculate totals
    const totalCost = this.usage.reduce((sum, r) => sum + r.cost, 0);
    const todayCost = todayRecords.reduce((sum, r) => sum + r.cost, 0);
    const thisMonthCost = monthRecords.reduce((sum, r) => sum + r.cost, 0);

    // Token usage
    const totalInput = this.usage.reduce((sum, r) => sum + r.inputTokens, 0);
    const totalOutput = this.usage.reduce((sum, r) => sum + r.outputTokens, 0);
    const averagePerRequest = this.usage.length > 0 ? 
      (totalInput + totalOutput) / this.usage.length : 0;

    // Model breakdown
    const modelBreakdown: Record<string, { cost: number; requests: number; tokens: number }> = {};
    
    this.usage.forEach(record => {
      if (!modelBreakdown[record.model]) {
        modelBreakdown[record.model] = { cost: 0, requests: 0, tokens: 0 };
      }
      
      modelBreakdown[record.model].cost += record.cost;
      modelBreakdown[record.model].requests += 1;
      modelBreakdown[record.model].tokens += record.inputTokens + record.outputTokens;
    });

    return {
      totalCost,
      todayCost,
      thisMonthCost,
      requestCount: this.usage.length,
      averageCostPerRequest: this.usage.length > 0 ? totalCost / this.usage.length : 0,
      tokenUsage: {
        totalInput,
        totalOutput,
        averagePerRequest
      },
      modelBreakdown
    };
  }

  /**
   * Get usage data for a specific time range
   */
  async getUsageByTimeRange(
    startTime: number, 
    endTime: number
  ): Promise<UsageRecord[]> {
    return this.usage.filter(record => 
      record.timestamp >= startTime && record.timestamp <= endTime
    );
  }

  /**
   * Get usage data for a specific user
   */
  async getUsageByUser(userId: string): Promise<UsageRecord[]> {
    return this.usage.filter(record => record.userId === userId);
  }

  /**
   * Get usage data for a specific model
   */
  async getUsageByModel(model: string): Promise<UsageRecord[]> {
    return this.usage.filter(record => record.model === model);
  }

  /**
   * Set budget alerts
   */
  setBudgetAlert(
    dailyLimit: number,
    monthlyLimit: number,
    alertCallback: (usage: CostStats) => void
  ): void {
    this.budgetAlert = {
      dailyLimit,
      monthlyLimit,
      alertCallback
    };
  }

  /**
   * Check if budget limits are exceeded
   */
  private async checkBudgetAlerts(): Promise<void> {
    if (!this.budgetAlert) return;

    const stats = await this.getStats();
    
    // Check daily limit
    if (stats.todayCost >= this.budgetAlert.dailyLimit) {
      this.logger.warn(`Daily budget limit reached: $${stats.todayCost.toFixed(2)}`);
      this.budgetAlert.alertCallback(stats);
    }
    
    // Check monthly limit
    if (stats.thisMonthCost >= this.budgetAlert.monthlyLimit) {
      this.logger.warn(`Monthly budget limit reached: $${stats.thisMonthCost.toFixed(2)}`);
      this.budgetAlert.alertCallback(stats);
    }
  }

  /**
   * Generate cost report
   */
  async generateReport(days: number = 30): Promise<{
    summary: CostStats;
    dailyBreakdown: Array<{
      date: string;
      cost: number;
      requests: number;
      tokens: number;
    }>;
    topModels: Array<{
      model: string;
      cost: number;
      percentage: number;
    }>;
    topUsers?: Array<{
      userId: string;
      cost: number;
      requests: number;
    }>;
  }> {
    const stats = await this.getStats();
    const endTime = Date.now();
    const startTime = endTime - (days * 24 * 60 * 60 * 1000);
    
    const periodRecords = await this.getUsageByTimeRange(startTime, endTime);
    
    // Daily breakdown
    const dailyMap = new Map<string, { cost: number; requests: number; tokens: number }>();
    
    periodRecords.forEach(record => {
      const date = new Date(record.timestamp).toISOString().split('T')[0];
      
      if (!dailyMap.has(date)) {
        dailyMap.set(date, { cost: 0, requests: 0, tokens: 0 });
      }
      
      const day = dailyMap.get(date)!;
      day.cost += record.cost;
      day.requests += 1;
      day.tokens += record.inputTokens + record.outputTokens;
    });
    
    const dailyBreakdown = Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      ...data
    }));
    
    // Top models
    const topModels = Object.entries(stats.modelBreakdown)
      .map(([model, data]) => ({
        model,
        cost: data.cost,
        percentage: (data.cost / stats.totalCost) * 100
      }))
      .sort((a, b) => b.cost - a.cost);
    
    // Top users (if user tracking enabled)
    const userMap = new Map<string, { cost: number; requests: number }>();
    
    periodRecords
      .filter(r => r.userId)
      .forEach(record => {
        const userId = record.userId!;
        
        if (!userMap.has(userId)) {
          userMap.set(userId, { cost: 0, requests: 0 });
        }
        
        const user = userMap.get(userId)!;
        user.cost += record.cost;
        user.requests += 1;
      });
    
    const topUsers = Array.from(userMap.entries())
      .map(([userId, data]) => ({ userId, ...data }))
      .sort((a, b) => b.cost - a.cost);

    return {
      summary: stats,
      dailyBreakdown,
      topModels,
      topUsers: topUsers.length > 0 ? topUsers : undefined
    };
  }

  /**
   * Start periodic cost reporting
   */
  private startPeriodicReports(): void {
    // Daily cost report
    setInterval(async () => {
      try {
        const stats = await this.getStats();
        this.logger.info(`Daily cost report: $${stats.todayCost.toFixed(2)} (${stats.requestCount} requests)`);
      } catch (error) {
        this.logger.error('Error generating daily cost report:', error);
      }
    }, 24 * 60 * 60 * 1000); // Every 24 hours
  }

  /**
   * Export usage data for external analysis
   */
  async exportUsageData(format: 'json' | 'csv' = 'json'): Promise<string> {
    if (format === 'csv') {
      const headers = ['timestamp', 'inputTokens', 'outputTokens', 'cost', 'model', 'endpoint', 'userId'];
      const rows = this.usage.map(record => [
        new Date(record.timestamp).toISOString(),
        record.inputTokens,
        record.outputTokens,
        record.cost,
        record.model,
        record.endpoint || '',
        record.userId || ''
      ]);
      
      return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    }
    
    return JSON.stringify(this.usage, null, 2);
  }

  /**
   * Clear usage history (with optional backup)
   */
  async clearHistory(backup: boolean = true): Promise<string | null> {
    let backupData: string | null = null;
    
    if (backup) {
      backupData = await this.exportUsageData('json');
    }
    
    this.usage = [];
    this.logger.info('Usage history cleared');
    
    return backupData;
  }

  /**
   * Estimate cost for a planned request
   */
  estimateCost(
    inputTokens: number, 
    outputTokens: number, 
    model: string = 'claude-3-5-sonnet-20241022'
  ): number {
    const modelPricing = {
      'claude-3-5-sonnet-20241022': { input: 0.003, output: 0.015 },
      'claude-3-haiku-20240307': { input: 0.00025, output: 0.00125 }
    };
    
    const pricing = modelPricing[model as keyof typeof modelPricing] || modelPricing['claude-3-5-sonnet-20241022'];
    
    return (inputTokens / 1000 * pricing.input) + (outputTokens / 1000 * pricing.output);
  }
}
