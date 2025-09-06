# 📖 Agent Runbook Generation System

**Version**: 2.0.0  
**Last Updated**: December 2024  
**Status**: 🟢 Production Ready  
**Format**: YAML-based with JSON Schema validation

## 📋 Overview

The Runbook Generation System creates dynamic, executable agent orchestration runbooks that define how agents coordinate, execute tasks, handle errors, and adapt to different scenarios in the I2S platform.

## 🎯 Runbook Philosophy

### Core Concepts
- **Declarative Configuration**: Define what should happen, not how
- **Dynamic Adaptation**: Runbooks adjust based on context and conditions
- **Version Control**: Full version management and rollback capabilities
- **Execution Transparency**: Complete visibility into agent operations
- **Error Recovery**: Built-in retry and fallback mechanisms

### Template Structure
```yaml
# Base runbook template
apiVersion: i2s.studio/v2
kind: AgentRunbook
metadata:
  name: "{idea-slug}-runbook"
  version: "1.0.0"
  created: "{timestamp}"
  description: "Agent orchestration for {project-title}"
  
spec:
  execution:
    mode: "pipeline" | "parallel" | "hybrid"
    timeout: "15m"
    retries: 3
    
  agents:
    conductor: {}
    pipeline: []
    core: []
    deployment: []
    
  workflows:
    main: {}
    fallback: {}
    
  monitoring:
    metrics: []
    alerts: []
```

## 🏗️ Template Architecture

### 1. Core Template Components

#### Metadata Section
```yaml
metadata:
  name: string                    # Unique runbook identifier
  version: string                 # Semantic version (e.g., "1.2.3")
  created: string                 # ISO 8601 timestamp
  description: string             # Human-readable description
  tags: string[]                  # Categorization tags
  author:
    system: "i2s-runbook-generator"
    version: "2.0.0"
  context:
    ideaId: string               # Source idea identifier
    complexity: "simple" | "moderate" | "complex"
    riskLevel: number            # 0-10 risk score
    domains: string[]            # Business domains
```

#### Execution Configuration
```yaml
spec:
  execution:
    mode: "pipeline"             # Execution pattern
    timeout: "15m"              # Global timeout
    retries: 3                  # Default retry count
    parallelism: 5              # Max parallel agents
    
  budgets:
    tokens:
      total: 250000             # Token budget
      perAgent: 25000          # Per-agent limit
      emergency: 50000         # Emergency reserve
    time:
      total: "15m"             # Time budget
      perStage: "5m"           # Per-stage limit
    cost:
      maxUSD: 10.00            # Cost ceiling
      alertThreshold: 8.00     # Alert threshold
      
  quality:
    gates:
      - name: "risk_review"
        required: true
        timeout: "4h"
      - name: "security_check"
        required: false
        condition: "riskLevel > 7"
```

### 2. Agent Definitions

#### Pipeline Agents
```yaml
agents:
  pipeline:
    - name: "normalize"
      version: "1.2.0"
      config:
        timeout: "30s"
        retries: 2
        inputs:
          idea_text: "${context.ideaText}"
          title: "${context.title}"
          one_liner: "${context.oneLiner}"
        validation:
          required: ["idea_text"]
          minLength: 50
          maxLength: 5000
        outputs:
          normalized_idea: "object"
          security_flags: "array"
          
    - name: "research"
      version: "1.1.0"
      dependsOn: ["normalize"]
      config:
        timeout: "2m"
        retries: 3
        inputs:
          normalized_idea: "${normalize.outputs.normalized_idea}"
        parameters:
          depth: "moderate"
          sources: ["web", "academic", "patents"]
        outputs:
          market_research: "object"
          competitors: "array"
          trends: "array"
```

#### Core Support Agents
```yaml
  core:
    conductor:
      role: "orchestrator"
      config:
        maxConcurrentPipelines: 10
        budgetTracking: true
        qualityGates: true
        
    librarian:
      role: "knowledge_manager"
      config:
        cacheEnabled: true
        cacheTTL: "1h"
        sources: ["documentation", "web", "history"]
        
    market_analyst:
      role: "business_intelligence"
      config:
        frameworks: ["tam_sam_som", "porter_five_forces"]
        dataSources: ["crunchbase", "statista", "census"]
```

#### Deployment Validation Agents
```yaml
  deployment:
    security:
      enabled: true
      config:
        scanners: ["semgrep", "bandit", "eslint-security"]
        compliance: ["gdpr", "soc2"]
        failOnCritical: true
        
    performance:
      enabled: true
      config:
        benchmarks: ["loadtest", "lighthouse", "bundle_size"]
        thresholds:
          responseTime: "2s"
          bundleSize: "500kb"
```

## 🔄 Dynamic Generation Process

### Template Selection Logic
```typescript
interface TemplateSelector {
  selectTemplate(context: GenerationContext): RunbookTemplate;
}

class RunbookTemplateSelector implements TemplateSelector {
  selectTemplate(context: GenerationContext): RunbookTemplate {
    const { complexity, domains, riskLevel, userType } = context;
    
    // Base template selection
    let templateName = 'standard-pipeline';
    
    // Complexity-based adjustments
    if (complexity === 'simple') {
      templateName = 'lightweight-pipeline';
    } else if (complexity === 'complex') {
      templateName = 'comprehensive-pipeline';
    }
    
    // Domain-specific templates
    if (domains.includes('healthcare')) {
      templateName = 'hipaa-compliant-pipeline';
    } else if (domains.includes('finance')) {
      templateName = 'pci-compliant-pipeline';
    }
    
    // Risk-based modifications
    if (riskLevel > 8) {
      templateName = 'high-security-pipeline';
    }
    
    return this.templateRegistry.get(templateName);
  }
}
```

### Variable Substitution Engine
```typescript
interface VariableSubstitution {
  substitute(template: string, context: SubstitutionContext): string;
}

class RunbookVariableSubstitution implements VariableSubstitution {
  substitute(template: string, context: SubstitutionContext): string {
    const variables = this.extractVariables(template);
    let result = template;
    
    for (const variable of variables) {
      const value = this.resolveVariable(variable, context);
      result = result.replace(`\${${variable}}`, value);
    }
    
    return result;
  }
  
  private resolveVariable(variable: string, context: SubstitutionContext): string {
    // Handle nested property access (e.g., "context.ideaText")
    const parts = variable.split('.');
    let value: any = context;
    
    for (const part of parts) {
      value = value?.[part];
    }
    
    // Apply transformations if specified
    if (variable.includes('|')) {
      const [path, ...transformations] = variable.split('|');
      value = this.applyTransformations(value, transformations);
    }
    
    return String(value || '');
  }
  
  private applyTransformations(value: any, transformations: string[]): any {
    for (const transform of transformations) {
      switch (transform.trim()) {
        case 'slug':
          value = this.toSlug(String(value));
          break;
        case 'upper':
          value = String(value).toUpperCase();
          break;
        case 'lower':
          value = String(value).toLowerCase();
          break;
        case 'truncate:100':
          value = String(value).substring(0, 100);
          break;
      }
    }
    return value;
  }
}
```

## ⚙️ Execution Engine

### Runbook Interpreter
```typescript
interface RunbookExecutor {
  execute(runbook: Runbook): Promise<ExecutionResult>;
}

class I2SRunbookExecutor implements RunbookExecutor {
  async execute(runbook: Runbook): Promise<ExecutionResult> {
    const execution = await this.createExecution(runbook);
    
    try {
      // Initialize execution context
      await this.initializeContext(execution);
      
      // Execute based on mode
      switch (runbook.spec.execution.mode) {
        case 'pipeline':
          return await this.executePipeline(execution);
        case 'parallel':
          return await this.executeParallel(execution);
        case 'hybrid':
          return await this.executeHybrid(execution);
        default:
          throw new Error(`Unknown execution mode: ${runbook.spec.execution.mode}`);
      }
    } catch (error) {
      // Execute fallback workflow if defined
      if (runbook.spec.workflows.fallback) {
        return await this.executeFallback(execution, error);
      }
      throw error;
    } finally {
      await this.cleanupExecution(execution);
    }
  }
  
  private async executePipeline(execution: ExecutionContext): Promise<ExecutionResult> {
    const stages = execution.runbook.agents.pipeline;
    const results: StageResult[] = [];
    
    for (const stage of stages) {
      // Check dependencies
      await this.waitForDependencies(stage, results);
      
      // Execute stage with timeout and retries
      const stageResult = await this.executeStageWithRetry(
        stage,
        execution,
        stage.config?.retries || execution.runbook.spec.execution.retries
      );
      
      results.push(stageResult);
      
      // Check if we should continue
      if (!stageResult.success && stage.config?.failurePolicy === 'abort') {
        break;
      }
    }
    
    return this.aggregateResults(results);
  }
}
```

### Execution Context Management
```typescript
interface ExecutionContext {
  id: string;
  runbook: Runbook;
  state: ExecutionState;
  variables: Record<string, any>;
  metrics: ExecutionMetrics;
  budget: BudgetTracker;
}

class ExecutionContextManager {
  private contexts = new Map<string, ExecutionContext>();
  
  async createContext(runbook: Runbook): Promise<ExecutionContext> {
    const context: ExecutionContext = {
      id: generateUUID(),
      runbook,
      state: 'initializing',
      variables: this.initializeVariables(runbook),
      metrics: new ExecutionMetrics(),
      budget: new BudgetTracker(runbook.spec.budgets)
    };
    
    this.contexts.set(context.id, context);
    return context;
  }
  
  async updateContext(
    id: string, 
    updates: Partial<ExecutionContext>
  ): Promise<ExecutionContext> {
    const context = this.contexts.get(id);
    if (!context) {
      throw new Error(`Execution context not found: ${id}`);
    }
    
    Object.assign(context, updates);
    await this.persistContext(context);
    
    return context;
  }
  
  private initializeVariables(runbook: Runbook): Record<string, any> {
    const variables: Record<string, any> = {};
    
    // Extract variables from runbook metadata
    if (runbook.metadata.context) {
      Object.assign(variables, runbook.metadata.context);
    }
    
    // Add system variables
    variables['$timestamp'] = new Date().toISOString();
    variables['$runbook'] = {
      name: runbook.metadata.name,
      version: runbook.metadata.version
    };
    
    return variables;
  }
}
```

## 🔄 Error Recovery Mechanisms

### Retry Strategies
```yaml
# Retry configuration examples
retry_strategies:
  exponential_backoff:
    type: "exponential"
    baseDelay: "1s"
    maxDelay: "30s"
    multiplier: 2.0
    jitter: true
    
  linear_backoff:
    type: "linear"
    initialDelay: "5s"
    increment: "5s"
    maxAttempts: 3
    
  immediate_retry:
    type: "immediate"
    maxAttempts: 2
    
  custom_retry:
    type: "custom"
    function: "customRetryLogic"
    parameters:
      conditions: ["TIMEOUT", "RATE_LIMIT"]
      backoffMultiplier: 1.5
```

### Fallback Workflows
```yaml
# Example fallback configuration
workflows:
  main:
    steps:
      - name: "primary_research"
        agent: "research"
        timeout: "2m"
        
  fallback:
    trigger:
      conditions: ["TIMEOUT", "API_ERROR", "QUOTA_EXCEEDED"]
      threshold: 2  # failures
    steps:
      - name: "cached_research"
        agent: "librarian"
        config:
          useCache: true
          maxAge: "24h"
      - name: "basic_analysis"
        agent: "market_analyst"
        config:
          depth: "minimal"
          
  emergency:
    trigger:
      conditions: ["CRITICAL_ERROR", "SECURITY_INCIDENT"]
    steps:
      - name: "safe_shutdown"
        action: "terminate"
        notify: ["security_team", "ops_manager"]
```

### Circuit Breaker Implementation
```typescript
class CircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failures = 0;
  private lastFailureTime = 0;
  
  constructor(
    private threshold: number = 5,
    private timeout: number = 60000,
    private monitorPeriod: number = 10000
  ) {}
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new CircuitBreakerOpenError('Circuit breaker is OPEN');
      }
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }
  
  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
    }
  }
}
```

## 🎛️ Parameter Passing & Configuration

### Environment Configuration
```yaml
environments:
  development:
    execution:
      timeout: "30m"
      retries: 5
    budgets:
      tokens: 500000
      cost: 50.00
    agents:
      research:
        config:
          depth: "detailed"
          sources: ["web", "academic"]
          
  production:
    execution:
      timeout: "15m"
      retries: 3
    budgets:
      tokens: 250000
      cost: 10.00
    agents:
      research:
        config:
          depth: "moderate"
          sources: ["web"]
          
  testing:
    execution:
      timeout: "5m"
      retries: 1
    budgets:
      tokens: 50000
      cost: 5.00
    agents:
      research:
        config:
          depth: "minimal"
          mockData: true
```

### Parameter Validation
```typescript
interface ParameterValidator {
  validate(parameters: Record<string, any>, schema: Schema): ValidationResult;
}

class RunbookParameterValidator implements ParameterValidator {
  validate(parameters: Record<string, any>, schema: Schema): ValidationResult {
    const errors: ValidationError[] = [];
    
    // Required parameter validation
    for (const required of schema.required || []) {
      if (!(required in parameters)) {
        errors.push({
          field: required,
          error: 'REQUIRED_FIELD_MISSING',
          message: `Required parameter '${required}' is missing`
        });
      }
    }
    
    // Type validation
    for (const [key, value] of Object.entries(parameters)) {
      const fieldSchema = schema.properties?.[key];
      if (fieldSchema) {
        const typeError = this.validateType(key, value, fieldSchema);
        if (typeError) {
          errors.push(typeError);
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  private validateType(
    field: string, 
    value: any, 
    schema: FieldSchema
  ): ValidationError | null {
    switch (schema.type) {
      case 'string':
        if (typeof value !== 'string') {
          return this.createTypeError(field, 'string', typeof value);
        }
        if (schema.minLength && value.length < schema.minLength) {
          return this.createLengthError(field, 'min', schema.minLength, value.length);
        }
        if (schema.maxLength && value.length > schema.maxLength) {
          return this.createLengthError(field, 'max', schema.maxLength, value.length);
        }
        break;
        
      case 'number':
        if (typeof value !== 'number') {
          return this.createTypeError(field, 'number', typeof value);
        }
        if (schema.minimum !== undefined && value < schema.minimum) {
          return this.createRangeError(field, 'min', schema.minimum, value);
        }
        if (schema.maximum !== undefined && value > schema.maximum) {
          return this.createRangeError(field, 'max', schema.maximum, value);
        }
        break;
    }
    
    return null;
  }
}
```

## 📊 Version Control & Migration

### Version Management
```typescript
interface RunbookVersion {
  version: string;
  created: string;
  changes: VersionChange[];
  compatibility: CompatibilityInfo;
  migration?: MigrationScript;
}

class RunbookVersionManager {
  async createVersion(
    runbook: Runbook, 
    changes: VersionChange[]
  ): Promise<RunbookVersion> {
    const currentVersion = runbook.metadata.version;
    const newVersion = this.calculateNextVersion(currentVersion, changes);
    
    const version: RunbookVersion = {
      version: newVersion,
      created: new Date().toISOString(),
      changes,
      compatibility: this.analyzeCompatibility(changes),
      migration: this.generateMigration(changes)
    };
    
    await this.storeVersion(runbook.metadata.name, version);
    return version;
  }
  
  private calculateNextVersion(
    current: string, 
    changes: VersionChange[]
  ): string {
    const [major, minor, patch] = current.split('.').map(Number);
    
    const hasBreaking = changes.some(c => c.type === 'breaking');
    const hasFeature = changes.some(c => c.type === 'feature');
    const hasFix = changes.some(c => c.type === 'fix');
    
    if (hasBreaking) {
      return `${major + 1}.0.0`;
    } else if (hasFeature) {
      return `${major}.${minor + 1}.0`;
    } else if (hasFix) {
      return `${major}.${minor}.${patch + 1}`;
    }
    
    return current;
  }
}
```

### Migration Scripts
```typescript
interface MigrationScript {
  from: string;
  to: string;
  transformations: Transformation[];
}

interface Transformation {
  type: 'rename' | 'move' | 'delete' | 'add' | 'modify';
  path: string;
  newPath?: string;
  value?: any;
  condition?: string;
}

// Example migration
const migration_1_0_to_2_0: MigrationScript = {
  from: '1.0.0',
  to: '2.0.0',
  transformations: [
    {
      type: 'rename',
      path: 'spec.agents.research.timeout',
      newPath: 'spec.agents.research.config.timeout'
    },
    {
      type: 'add',
      path: 'spec.execution.parallelism',
      value: 5
    },
    {
      type: 'delete',
      path: 'spec.legacy.options'
    }
  ]
};

class RunbookMigrator {
  async migrate(runbook: Runbook, targetVersion: string): Promise<Runbook> {
    const currentVersion = runbook.metadata.version;
    const migrations = await this.getMigrationPath(currentVersion, targetVersion);
    
    let migratedRunbook = { ...runbook };
    
    for (const migration of migrations) {
      migratedRunbook = await this.applyMigration(migratedRunbook, migration);
    }
    
    migratedRunbook.metadata.version = targetVersion;
    return migratedRunbook;
  }
  
  private async applyMigration(
    runbook: Runbook, 
    migration: MigrationScript
  ): Promise<Runbook> {
    let result = JSON.parse(JSON.stringify(runbook)); // Deep clone
    
    for (const transformation of migration.transformations) {
      result = this.applyTransformation(result, transformation);
    }
    
    return result;
  }
}
```

## 🔍 Monitoring & Observability

### Execution Metrics
```typescript
interface ExecutionMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  
  stages: {
    [stageName: string]: StageMetrics;
  };
  
  resources: {
    tokensUsed: number;
    costAccrued: number;
    memoryPeak: number;
    cpuTime: number;
  };
  
  quality: {
    successRate: number;
    errorRate: number;
    retryCount: number;
    fallbackTriggered: boolean;
  };
}

class RunbookMetricsCollector {
  async collectMetrics(execution: ExecutionContext): Promise<ExecutionMetrics> {
    const metrics: ExecutionMetrics = {
      startTime: execution.startTime,
      endTime: execution.endTime,
      duration: execution.endTime ? execution.endTime - execution.startTime : undefined,
      stages: {},
      resources: {
        tokensUsed: execution.budget.tokensUsed,
        costAccrued: execution.budget.costAccrued,
        memoryPeak: await this.getMemoryPeak(execution.id),
        cpuTime: await this.getCpuTime(execution.id)
      },
      quality: {
        successRate: this.calculateSuccessRate(execution),
        errorRate: this.calculateErrorRate(execution),
        retryCount: this.getTotalRetries(execution),
        fallbackTriggered: execution.fallbackTriggered || false
      }
    };
    
    // Collect stage-specific metrics
    for (const stage of execution.completedStages) {
      metrics.stages[stage.name] = await this.collectStageMetrics(stage);
    }
    
    return metrics;
  }
}
```

### Performance Monitoring
```yaml
# Monitoring configuration
monitoring:
  metrics:
    - name: "execution_duration"
      type: "histogram"
      labels: ["runbook_name", "version", "environment"]
      
    - name: "stage_success_rate"
      type: "gauge"
      labels: ["stage_name", "agent_type"]
      
    - name: "resource_utilization"
      type: "counter"
      labels: ["resource_type", "execution_id"]
      
  alerts:
    - name: "execution_timeout"
      condition: "execution_duration > 20m"
      severity: "high"
      
    - name: "high_error_rate"
      condition: "error_rate > 0.1"
      severity: "medium"
      
    - name: "budget_exceeded"
      condition: "cost_accrued > budget * 1.2"
      severity: "critical"
```

## 📈 Performance Optimization

### Runbook Caching
```typescript
interface RunbookCache {
  get(key: string): Promise<Runbook | null>;
  set(key: string, runbook: Runbook, ttl?: number): Promise<void>;
  invalidate(pattern: string): Promise<void>;
}

class RedisRunbookCache implements RunbookCache {
  constructor(private redis: Redis) {}
  
  async get(key: string): Promise<Runbook | null> {
    const cached = await this.redis.get(`runbook:${key}`);
    return cached ? JSON.parse(cached) : null;
  }
  
  async set(key: string, runbook: Runbook, ttl = 3600): Promise<void> {
    await this.redis.setex(
      `runbook:${key}`, 
      ttl, 
      JSON.stringify(runbook)
    );
  }
  
  async invalidate(pattern: string): Promise<void> {
    const keys = await this.redis.keys(`runbook:${pattern}`);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
```

### Template Optimization
```typescript
class RunbookOptimizer {
  async optimizeRunbook(runbook: Runbook): Promise<Runbook> {
    let optimized = { ...runbook };
    
    // Remove unused agents
    optimized = this.removeUnusedAgents(optimized);
    
    // Optimize execution order
    optimized = this.optimizeExecutionOrder(optimized);
    
    // Consolidate similar stages
    optimized = this.consolidateStages(optimized);
    
    // Optimize resource allocation
    optimized = this.optimizeResourceAllocation(optimized);
    
    return optimized;
  }
  
  private removeUnusedAgents(runbook: Runbook): Runbook {
    // Analyze dependencies and remove unused agents
    const usedAgents = this.findUsedAgents(runbook);
    
    return {
      ...runbook,
      agents: {
        pipeline: runbook.agents.pipeline.filter(a => usedAgents.has(a.name)),
        core: Object.fromEntries(
          Object.entries(runbook.agents.core).filter(([name]) => usedAgents.has(name))
        ),
        deployment: Object.fromEntries(
          Object.entries(runbook.agents.deployment).filter(([name]) => usedAgents.has(name))
        )
      }
    };
  }
}
```

## 📚 Documentation & Examples

### Template Library
- **Basic Pipeline**: Simple idea processing workflow
- **Complex Analysis**: Comprehensive market and technical analysis
- **Security-First**: High-security regulated industry template
- **Rapid Prototype**: Fast turnaround for simple ideas
- **Enterprise**: Full compliance and approval workflows

### Integration Examples
```typescript
// Using the runbook generator
const generator = new RunbookGenerator();
const context: GenerationContext = {
  ideaId: 'idea_123',
  title: 'AI Task Manager',
  complexity: 'moderate',
  domains: ['productivity', 'ai'],
  riskLevel: 5,
  userType: 'individual'
};

const runbook = await generator.generate(context);
await generator.save(runbook);

// Execute the runbook
const executor = new RunbookExecutor();
const result = await executor.execute(runbook);

console.log(`Execution completed: ${result.status}`);
console.log(`Duration: ${result.metrics.duration}ms`);
console.log(`Cost: $${result.metrics.resources.costAccrued}`);
```

---

**Owner**: I2S Runbook Team  
**Contact**: runbooks@i2s.studio  
**Documentation**: Updated December 2024
