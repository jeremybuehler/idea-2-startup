# 📊 Performance Monitoring & Observability

**Version**: 2.0.0  
**Last Updated**: December 2024  
**Status**: 🟢 Production Ready  
**Stack**: Prometheus, Grafana, Jaeger, ELK

## 📋 Overview

The I2S Observability Platform provides comprehensive monitoring, metrics collection, distributed tracing, and alerting for the multi-agent system, ensuring optimal performance, reliability, and operational visibility.

## 🎯 Observability Philosophy

### Three Pillars of Observability
1. **Metrics**: Quantitative measurements of system behavior over time
2. **Logs**: Discrete events and structured data for debugging and auditing
3. **Traces**: Request flow tracking across distributed agent systems

### Monitoring Principles
- **Proactive Detection**: Identify issues before they impact users
- **Data-Driven Decisions**: Use metrics to guide optimization efforts
- **Complete Visibility**: Monitor every component and interaction
- **Actionable Insights**: Focus on metrics that drive action
- **Performance Optimization**: Continuous improvement through measurement

## 📈 Key Metrics & SLI/SLO Framework

### Service Level Indicators (SLIs)

#### System-Level SLIs
```yaml
system_slis:
  availability:
    description: "Percentage of time the system is available"
    measurement: "uptime_percentage"
    calculation: "(successful_requests / total_requests) * 100"
    target: 99.9%
    
  latency:
    description: "Time to process requests"
    measurement: "p95_response_time"
    calculation: "95th percentile of response times"
    target: "<2s"
    
  throughput:
    description: "Requests processed per unit time"
    measurement: "requests_per_second"
    calculation: "count(requests) / time_window"
    target: ">100 rps"
    
  error_rate:
    description: "Percentage of failed requests"
    measurement: "error_percentage"
    calculation: "(failed_requests / total_requests) * 100"
    target: "<1%"
```

#### Agent-Specific SLIs
```yaml
agent_slis:
  pipeline_agents:
    success_rate:
      target: ">95%"
      measurement: "successful_completions / total_executions"
      window: "5m"
      
    processing_time:
      target: "<5s per stage"
      measurement: "p95_stage_duration"
      window: "1h"
      
    resource_efficiency:
      target: "<25k tokens per execution"
      measurement: "avg_tokens_used"
      window: "1h"
      
  core_agents:
    conductor_orchestration:
      target: "<10s coordination overhead"
      measurement: "orchestration_latency"
      window: "5m"
      
    librarian_cache_hit:
      target: ">80% cache hit rate"
      measurement: "cache_hits / total_requests"
      window: "15m"
      
  deployment_agents:
    security_scan_time:
      target: "<3m scan duration"
      measurement: "p90_scan_duration"
      window: "1h"
      
    vulnerability_detection:
      target: ">99% detection rate"
      measurement: "detected_vulnerabilities / total_vulnerabilities"
      window: "1d"
```

### Service Level Objectives (SLOs)

#### Production SLOs
```typescript
interface SLODefinition {
  name: string;
  description: string;
  sli: string;
  target: number;
  timeWindow: string;
  alertThreshold: number;
}

const PRODUCTION_SLOS: SLODefinition[] = [
  {
    name: "system_availability",
    description: "System uptime and availability",
    sli: "availability",
    target: 99.9,  // 99.9% uptime
    timeWindow: "30d",
    alertThreshold: 99.5  // Alert if below 99.5%
  },
  {
    name: "api_latency",
    description: "API response time performance",
    sli: "latency_p95",
    target: 2000,  // 2 seconds
    timeWindow: "5m",
    alertThreshold: 3000  // Alert if >3s
  },
  {
    name: "pipeline_success_rate",
    description: "Pipeline completion success rate",
    sli: "pipeline_success_rate",
    target: 95.0,  // 95% success rate
    timeWindow: "1h",
    alertThreshold: 90.0  // Alert if <90%
  },
  {
    name: "cost_efficiency",
    description: "Cost per successful pipeline",
    sli: "cost_per_pipeline",
    target: 5.00,  // $5 per pipeline
    timeWindow: "1d",
    alertThreshold: 7.50   // Alert if >$7.50
  }
];
```

## 📊 Metrics Collection Architecture

### Prometheus Configuration
```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "/etc/prometheus/rules/*.yml"

scrape_configs:
  - job_name: 'i2s-agents'
    static_configs:
      - targets: 
        - 'conductor:8080'
        - 'normalize-agent:8080'
        - 'research-agent:8080'
        - 'security-agent:8080'
    scrape_interval: 10s
    metrics_path: /metrics
    
  - job_name: 'i2s-infrastructure'
    static_configs:
      - targets:
        - 'redis:9121'
        - 'postgresql:9187'
        - 'rabbitmq:15692'
    scrape_interval: 30s
    
  - job_name: 'i2s-application'
    static_configs:
      - targets:
        - 'frontend:3000'
        - 'api-gateway:8000'
    scrape_interval: 15s

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - 'alertmanager:9093'
```

### Custom Metrics Implementation
```typescript
import { register, Counter, Histogram, Gauge } from 'prom-client';

// Agent-specific metrics
export class AgentMetrics {
  private executionCounter = new Counter({
    name: 'i2s_agent_executions_total',
    help: 'Total number of agent executions',
    labelNames: ['agent_name', 'agent_type', 'status', 'environment']
  });

  private executionDuration = new Histogram({
    name: 'i2s_agent_execution_duration_seconds',
    help: 'Duration of agent executions',
    labelNames: ['agent_name', 'agent_type', 'stage'],
    buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60]
  });

  private resourceUsage = new Histogram({
    name: 'i2s_agent_resource_usage',
    help: 'Resource usage by agents',
    labelNames: ['agent_name', 'resource_type'],
    buckets: [1000, 5000, 10000, 25000, 50000, 100000, 250000]
  });

  private activeExecutions = new Gauge({
    name: 'i2s_agent_active_executions',
    help: 'Number of currently active executions',
    labelNames: ['agent_name', 'agent_type']
  });

  recordExecution(
    agentName: string, 
    agentType: string, 
    status: 'success' | 'failure' | 'timeout',
    environment: string = 'production'
  ): void {
    this.executionCounter.inc({
      agent_name: agentName,
      agent_type: agentType,
      status,
      environment
    });
  }

  recordDuration(
    agentName: string, 
    agentType: string, 
    stage: string, 
    duration: number
  ): void {
    this.executionDuration.observe({
      agent_name: agentName,
      agent_type: agentType,
      stage
    }, duration);
  }

  recordResourceUsage(
    agentName: string, 
    resourceType: 'tokens' | 'memory' | 'cpu' | 'cost', 
    amount: number
  ): void {
    this.resourceUsage.observe({
      agent_name: agentName,
      resource_type: resourceType
    }, amount);
  }
}
```

### Business Metrics
```typescript
// Business-level metrics
export class BusinessMetrics {
  private pipelineMetrics = new Counter({
    name: 'i2s_pipeline_completions_total',
    help: 'Total completed pipelines',
    labelNames: ['complexity', 'domain', 'user_type', 'success']
  });

  private ideaScores = new Histogram({
    name: 'i2s_idea_scores',
    help: 'Distribution of idea scores',
    labelNames: ['dimension'],
    buckets: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  });

  private costMetrics = new Histogram({
    name: 'i2s_cost_per_pipeline_usd',
    help: 'Cost per pipeline execution in USD',
    buckets: [0.5, 1, 2, 5, 10, 20, 50]
  });

  private userSatisfaction = new Histogram({
    name: 'i2s_user_satisfaction_rating',
    help: 'User satisfaction ratings',
    buckets: [1, 2, 3, 4, 5]
  });

  recordPipelineCompletion(
    complexity: string,
    domain: string,
    userType: string,
    success: boolean
  ): void {
    this.pipelineMetrics.inc({
      complexity,
      domain,
      user_type: userType,
      success: success.toString()
    });
  }

  recordIdeaScore(dimension: string, score: number): void {
    this.ideaScores.observe({ dimension }, score);
  }

  recordCost(costUSD: number): void {
    this.costMetrics.observe(costUSD);
  }
}
```

## 📝 Logging Standards

### Structured Logging Format
```typescript
interface LogEntry {
  timestamp: string;        // ISO 8601 format
  level: LogLevel;          // ERROR, WARN, INFO, DEBUG, TRACE
  logger: string;           // Logger name/component
  message: string;          // Human-readable message
  context: LogContext;      // Structured context data
  correlationId?: string;   // Request correlation ID
  executionId?: string;     // Pipeline execution ID
  agentName?: string;       // Agent identifier
  userId?: string;          // User identifier (if available)
  environment: string;      // Environment name
  version: string;          // Application version
}

interface LogContext {
  [key: string]: any;       // Additional context data
}

enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN', 
  INFO = 'INFO',
  DEBUG = 'DEBUG',
  TRACE = 'TRACE'
}
```

### Logging Implementation
```typescript
import winston from 'winston';
import { ElasticsearchTransport } from 'winston-elasticsearch';

class I2SLogger {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: {
        service: process.env.SERVICE_NAME || 'i2s-agent',
        version: process.env.APP_VERSION || '1.0.0',
        environment: process.env.ENVIRONMENT || 'development'
      },
      transports: [
        // Console output
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        }),
        // Elasticsearch for centralized logging
        new ElasticsearchTransport({
          level: 'info',
          clientOpts: {
            node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200'
          },
          index: 'i2s-logs'
        })
      ]
    });
  }

  logAgentExecution(
    level: LogLevel,
    message: string,
    context: {
      agentName: string;
      executionId: string;
      stage?: string;
      duration?: number;
      success?: boolean;
      error?: Error;
      [key: string]: any;
    }
  ): void {
    this.logger.log(level.toLowerCase(), message, {
      ...context,
      category: 'agent_execution'
    });
  }

  logBusinessEvent(
    level: LogLevel,
    message: string,
    context: {
      eventType: string;
      userId?: string;
      ideaId?: string;
      [key: string]: any;
    }
  ): void {
    this.logger.log(level.toLowerCase(), message, {
      ...context,
      category: 'business_event'
    });
  }

  logSecurityEvent(
    level: LogLevel,
    message: string,
    context: {
      eventType: string;
      severity: string;
      sourceIp?: string;
      userId?: string;
      [key: string]: any;
    }
  ): void {
    this.logger.log(level.toLowerCase(), message, {
      ...context,
      category: 'security_event'
    });
  }
}
```

### Log Aggregation Strategy
```yaml
# filebeat.yml - Log shipping configuration
filebeat.inputs:
- type: container
  paths:
    - '/var/lib/docker/containers/*/*.log'
  processors:
  - add_docker_metadata:
      host: "unix:///var/run/docker.sock"
  - decode_json_fields:
      fields: ["message"]
      target: ""
      overwrite_keys: true

output.elasticsearch:
  hosts: ["elasticsearch:9200"]
  index: "i2s-logs-%{+yyyy.MM.dd}"
  template.settings:
    index.number_of_shards: 1
    index.number_of_replicas: 0

logging.level: info
```

## 🔍 Distributed Tracing

### Jaeger Configuration
```typescript
import { initTracer, JaegerTracer } from 'jaeger-client';
import { FORMAT_HTTP_HEADERS } from 'opentracing';

class DistributedTracing {
  private tracer: JaegerTracer;

  constructor() {
    const config = {
      serviceName: process.env.SERVICE_NAME || 'i2s-agent',
      reporter: {
        logSpans: true,
        agentHost: process.env.JAEGER_AGENT_HOST || 'localhost',
        agentPort: Number(process.env.JAEGER_AGENT_PORT) || 6832
      },
      sampler: {
        type: 'probabilistic',
        param: 0.1  // Sample 10% of traces
      }
    };

    this.tracer = initTracer(config);
  }

  startPipelineTrace(executionId: string, ideaId: string) {
    const span = this.tracer.startSpan('pipeline_execution');
    span.setTag('execution.id', executionId);
    span.setTag('idea.id', ideaId);
    span.setTag('component', 'pipeline');
    return span;
  }

  startAgentTrace(agentName: string, parentSpan: any) {
    const span = this.tracer.startSpan(`agent_${agentName}`, {
      childOf: parentSpan
    });
    span.setTag('agent.name', agentName);
    span.setTag('agent.type', this.getAgentType(agentName));
    return span;
  }

  injectTraceHeaders(span: any): Record<string, string> {
    const headers: Record<string, string> = {};
    this.tracer.inject(span, FORMAT_HTTP_HEADERS, headers);
    return headers;
  }

  extractTraceFromHeaders(headers: Record<string, string>) {
    return this.tracer.extract(FORMAT_HTTP_HEADERS, headers);
  }
}
```

### Trace Correlation
```typescript
// Middleware for trace correlation
export function traceCorrelationMiddleware(req: Request, res: Response, next: NextFunction) {
  const correlationId = req.headers['x-correlation-id'] || generateUUID();
  const executionId = req.headers['x-execution-id'];
  
  // Set correlation context
  req.correlationId = correlationId;
  req.executionId = executionId;
  
  // Add to response headers
  res.set('x-correlation-id', correlationId);
  
  // Continue to next middleware
  next();
}

// Agent execution tracing
class AgentTracer {
  async traceAgentExecution<T>(
    agentName: string,
    executionContext: any,
    operation: () => Promise<T>
  ): Promise<T> {
    const span = tracing.startAgentTrace(agentName, executionContext.parentSpan);
    
    try {
      span.setTag('execution.id', executionContext.executionId);
      span.setTag('correlation.id', executionContext.correlationId);
      
      const result = await operation();
      
      span.setTag('success', true);
      span.setTag('result.type', typeof result);
      
      return result;
    } catch (error) {
      span.setTag('success', false);
      span.setTag('error', true);
      span.setTag('error.message', error.message);
      span.log({ error: error.stack });
      throw error;
    } finally {
      span.finish();
    }
  }
}
```

## 📊 Health Checks & Probes

### Health Check Implementation
```typescript
interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  checks: Record<string, ComponentHealth>;
  version: string;
  uptime: number;
}

interface ComponentHealth {
  status: 'healthy' | 'unhealthy';
  latency?: number;
  message?: string;
  details?: Record<string, any>;
}

class HealthChecker {
  async performHealthCheck(): Promise<HealthCheckResult> {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkMessageQueue(),
      this.checkExternalAPIs(),
      this.checkAgentConnectivity()
    ]);

    const healthChecks: Record<string, ComponentHealth> = {
      database: this.processCheckResult(checks[0]),
      redis: this.processCheckResult(checks[1]),
      messageQueue: this.processCheckResult(checks[2]),
      externalAPIs: this.processCheckResult(checks[3]),
      agents: this.processCheckResult(checks[4])
    };

    const overallStatus = this.calculateOverallStatus(healthChecks);

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks: healthChecks,
      version: process.env.APP_VERSION || '1.0.0',
      uptime: process.uptime()
    };
  }

  private async checkDatabase(): Promise<ComponentHealth> {
    const start = Date.now();
    try {
      await this.database.query('SELECT 1');
      return {
        status: 'healthy',
        latency: Date.now() - start
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: 'Database connection failed',
        details: { error: error.message }
      };
    }
  }

  private async checkAgentConnectivity(): Promise<ComponentHealth> {
    try {
      const agentStatuses = await Promise.allSettled([
        this.pingAgent('conductor'),
        this.pingAgent('normalize'),
        this.pingAgent('research')
      ]);

      const healthyAgents = agentStatuses.filter(
        result => result.status === 'fulfilled'
      ).length;

      if (healthyAgents === agentStatuses.length) {
        return { status: 'healthy', details: { healthyAgents } };
      } else if (healthyAgents > 0) {
        return { 
          status: 'unhealthy', 
          message: 'Some agents unavailable',
          details: { healthyAgents, totalAgents: agentStatuses.length }
        };
      } else {
        return { 
          status: 'unhealthy', 
          message: 'All agents unavailable' 
        };
      }
    } catch (error) {
      return { 
        status: 'unhealthy', 
        message: 'Agent connectivity check failed',
        details: { error: error.message }
      };
    }
  }
}
```

### Kubernetes Health Probes
```yaml
# kubernetes-deployment.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: i2s-conductor
spec:
  template:
    spec:
      containers:
      - name: conductor
        image: i2s/conductor:latest
        ports:
        - containerPort: 8080
        livenessProbe:
          httpGet:
            path: /health/live
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 1
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

## 🚨 Alerting Rules & Escalation

### Prometheus Alert Rules
```yaml
# alert-rules.yml
groups:
- name: i2s_system_alerts
  rules:
  - alert: HighErrorRate
    expr: (rate(i2s_agent_executions_total{status="failure"}[5m]) / rate(i2s_agent_executions_total[5m])) > 0.1
    for: 2m
    labels:
      severity: high
      team: platform
    annotations:
      summary: "High error rate detected"
      description: "Error rate is {{ $value | humanizePercentage }} for the last 5 minutes"

  - alert: PipelineLatencyHigh
    expr: histogram_quantile(0.95, rate(i2s_agent_execution_duration_seconds_bucket[10m])) > 10
    for: 5m
    labels:
      severity: medium
      team: pipeline
    annotations:
      summary: "Pipeline latency is high"
      description: "95th percentile latency is {{ $value }}s"

  - alert: AgentDown
    expr: up{job="i2s-agents"} == 0
    for: 1m
    labels:
      severity: critical
      team: platform
    annotations:
      summary: "Agent is down"
      description: "Agent {{ $labels.instance }} has been down for more than 1 minute"

  - alert: BudgetExceeded
    expr: increase(i2s_cost_per_pipeline_usd[1h]) > 100
    for: 0m
    labels:
      severity: critical
      team: operations
    annotations:
      summary: "Hourly budget exceeded"
      description: "Cost in the last hour: ${{ $value }}"

- name: i2s_business_alerts
  rules:
  - alert: LowUserSatisfaction
    expr: histogram_quantile(0.5, rate(i2s_user_satisfaction_rating_bucket[24h])) < 3
    for: 30m
    labels:
      severity: medium
      team: product
    annotations:
      summary: "User satisfaction is low"
      description: "Median satisfaction rating is {{ $value }}/5"

  - alert: PipelineSuccessRateDown
    expr: (rate(i2s_pipeline_completions_total{success="true"}[1h]) / rate(i2s_pipeline_completions_total[1h])) < 0.9
    for: 15m
    labels:
      severity: high
      team: pipeline
    annotations:
      summary: "Pipeline success rate below target"
      description: "Success rate is {{ $value | humanizePercentage }}"
```

### AlertManager Configuration
```yaml
# alertmanager.yml
global:
  smtp_smarthost: 'localhost:587'
  smtp_from: 'alerts@i2s.studio'
  
route:
  group_by: ['alertname', 'team']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'default-receiver'
  routes:
  - match:
      severity: critical
    receiver: 'critical-alerts'
    group_wait: 0s
    repeat_interval: 5m
  - match:
      team: security
    receiver: 'security-team'
  - match:
      team: platform
    receiver: 'platform-team'

receivers:
- name: 'default-receiver'
  slack_configs:
  - api_url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'
    channel: '#i2s-alerts'
    
- name: 'critical-alerts'
  pagerduty_configs:
  - routing_key: 'YOUR_PAGERDUTY_INTEGRATION_KEY'
  slack_configs:
  - api_url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'
    channel: '#i2s-critical'
    
- name: 'security-team'
  email_configs:
  - to: 'security@i2s.studio'
    subject: 'Security Alert: {{ .GroupLabels.alertname }}'
```

## 📊 Dashboard Configuration

### Grafana Dashboards
```json
{
  "dashboard": {
    "title": "I2S Agent Performance",
    "panels": [
      {
        "title": "Agent Execution Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(i2s_agent_executions_total[5m])",
            "legendFormat": "{{agent_name}} - {{status}}"
          }
        ]
      },
      {
        "title": "Pipeline Success Rate",
        "type": "singlestat",
        "targets": [
          {
            "expr": "(rate(i2s_pipeline_completions_total{success=\"true\"}[1h]) / rate(i2s_pipeline_completions_total[1h])) * 100"
          }
        ],
        "thresholds": "90,95"
      },
      {
        "title": "Cost per Pipeline",
        "type": "histogram",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(i2s_cost_per_pipeline_usd_bucket[1h]))"
          }
        ]
      },
      {
        "title": "Active Executions",
        "type": "graph",
        "targets": [
          {
            "expr": "i2s_agent_active_executions",
            "legendFormat": "{{agent_name}}"
          }
        ]
      }
    ]
  }
}
```

## 🔧 Performance Baselines & Benchmarking

### Baseline Metrics
```typescript
interface PerformanceBaseline {
  component: string;
  metric: string;
  baseline: number;
  unit: string;
  tolerance: number;  // Acceptable deviation percentage
}

const PERFORMANCE_BASELINES: PerformanceBaseline[] = [
  {
    component: 'normalize_agent',
    metric: 'execution_time',
    baseline: 500,  // 500ms
    unit: 'ms',
    tolerance: 20   // ±20%
  },
  {
    component: 'research_agent',
    metric: 'execution_time',
    baseline: 2000, // 2s
    unit: 'ms',
    tolerance: 30   // ±30%
  },
  {
    component: 'security_agent',
    metric: 'scan_time',
    baseline: 180000, // 3 minutes
    unit: 'ms',
    tolerance: 25   // ±25%
  },
  {
    component: 'pipeline',
    metric: 'total_execution_time',
    baseline: 300000, // 5 minutes
    unit: 'ms',
    tolerance: 40   // ±40%
  },
  {
    component: 'system',
    metric: 'tokens_per_pipeline',
    baseline: 20000,
    unit: 'tokens',
    tolerance: 50   // ±50%
  }
];
```

### Benchmark Testing
```typescript
class PerformanceBenchmark {
  async runBenchmark(component: string, iterations: number = 100): Promise<BenchmarkResult> {
    const results: number[] = [];
    const baseline = PERFORMANCE_BASELINES.find(b => b.component === component);
    
    if (!baseline) {
      throw new Error(`No baseline found for component: ${component}`);
    }

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await this.executeComponent(component);
      const duration = performance.now() - start;
      results.push(duration);
    }

    const stats = this.calculateStatistics(results);
    const analysis = this.analyzePerfomance(stats, baseline);

    return {
      component,
      baseline: baseline.baseline,
      results: stats,
      analysis,
      recommendation: this.generateRecommendation(analysis)
    };
  }

  private calculateStatistics(results: number[]) {
    const sorted = results.sort((a, b) => a - b);
    return {
      mean: results.reduce((a, b) => a + b) / results.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
      min: Math.min(...results),
      max: Math.max(...results),
      stdDev: this.calculateStandardDeviation(results)
    };
  }
}
```

## 📈 Resource Limits & Scaling Triggers

### Resource Monitoring
```yaml
# Resource limit configuration
resource_limits:
  agents:
    normalize:
      cpu: "500m"
      memory: "512Mi"
      scaling:
        min_replicas: 2
        max_replicas: 10
        cpu_threshold: 70%
        memory_threshold: 80%
        
    research:
      cpu: "1000m"
      memory: "1Gi" 
      scaling:
        min_replicas: 3
        max_replicas: 15
        cpu_threshold: 75%
        memory_threshold: 85%
        
    security:
      cpu: "2000m"
      memory: "2Gi"
      scaling:
        min_replicas: 1
        max_replicas: 5
        cpu_threshold: 80%
        memory_threshold: 90%

  infrastructure:
    redis:
      memory_limit: "4Gi"
      eviction_policy: "allkeys-lru"
      max_connections: 10000
      
    postgresql:
      shared_buffers: "1GB"
      max_connections: 200
      work_mem: "64MB"
      
scaling_triggers:
  - name: "high_cpu_usage"
    condition: "avg(rate(container_cpu_usage_seconds_total[5m])) > 0.7"
    action: "scale_up"
    cooldown: "5m"
    
  - name: "high_memory_usage" 
    condition: "avg(container_memory_working_set_bytes / container_spec_memory_limit_bytes) > 0.8"
    action: "scale_up"
    cooldown: "3m"
    
  - name: "queue_depth_high"
    condition: "rabbitmq_queue_messages > 1000"
    action: "scale_agents"
    cooldown: "2m"
```

## 🔧 Development & Testing Tools

### Metrics Testing
```typescript
// Testing framework for metrics
class MetricsTestSuite {
  async testMetricsCollection() {
    const testAgent = new TestAgent();
    const metrics = new AgentMetrics();
    
    // Execute test scenario
    await testAgent.execute();
    
    // Verify metrics were recorded
    const executionCount = await metrics.getExecutionCount('test_agent');
    expect(executionCount).toBeGreaterThan(0);
    
    const avgDuration = await metrics.getAverageDuration('test_agent');
    expect(avgDuration).toBeLessThan(5000); // Less than 5s
  }

  async testAlertRules() {
    // Simulate high error rate
    await this.simulateErrors(50); // 50 errors in 1 minute
    
    // Check if alert is triggered
    const alert = await this.checkAlertStatus('HighErrorRate');
    expect(alert.state).toBe('firing');
  }
}
```

### Performance Testing
```bash
# Load testing with Artillery
npm run load-test:pipeline -- --config load-test-config.yml
npm run load-test:agents -- --target https://staging-api.i2s.studio
npm run benchmark:components -- --iterations 1000
```

---

**Owner**: I2S Observability Team  
**Contact**: monitoring@i2s.studio  
**Emergency**: oncall@i2s.studio  
**Documentation**: Updated December 2024
