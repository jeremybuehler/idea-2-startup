# 🤖 Launchloom Agent System

This directory contains the Launchloom agent orchestration stack for transforming startup ideas into comprehensive deliverables. The system features intelligent caching, cost optimization, and real-time processing capabilities.

## 🏗️ Architecture Overview

```
src/ai/
├── agents/
│   └── Conductor.ts           # Main orchestration agent
├── services/
│   ├── LaunchloomAgentsService.ts # OpenAI Agents SDK integration
│   ├── AIResponseCache.ts     # Semantic caching system
│   ├── CostTracker.ts         # Cost monitoring and budgets
│   └── LaunchloomService.ts  # Frontend integration service
├── types/
│   └── Pipeline.ts            # TypeScript definitions
├── utils/
│   └── Logger.ts              # Structured logging
└── config/
    └── index.ts               # Configuration and initialization
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy and configure your environment variables:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your OpenAI API key (Launchloom uses the OpenAI Agents SDK under the hood):

```bash
OPENAI_API_KEY=your_openai_api_key_here
NEXT_PUBLIC_USE_LIVE=true
QUALITY_THRESHOLD=0.7
BUDGET_LIMIT=10.0
```

### 3. Initialize the Service

```typescript
import { initializeLaunchloom } from '../ai/config';

// Initialize the Launchloom service
const launchloomService = initializeLaunchloom();

// Process an idea
const dossier = await launchloomService.processIdea(
  "A mobile app that uses AI to help people find the perfect coffee shop",
  {
    industry: "Food & Beverage",
    targetMarket: "Urban millennials",
    budget: "50000",
    timeline: "6 months"
  }
);

console.log('Generated dossier:', dossier);
```

### 4. Real-time Processing

```typescript
// Stream processing progress
for await (const progress of launchloomService.streamPipelineProgress(ideaText)) {
  console.log(`Progress: ${progress.percentage}%`);
  console.log(`Stage: ${progress.currentStage}/${progress.totalStages}`);
}
```

## 🎯 Features

### ✨ Core Capabilities

- **9-Stage Pipeline**: Normalize → Research → Feasibility → Market Analysis → Risk Assessment → UX Design → Code Scaffold → API Design → Export
- **Launchloom agent SDK (gpt-4.1 / gpt-4.1-mini)**: Latest Launchloom agent model for high-quality output
- **Intelligent Caching**: 60-80% cost reduction through semantic similarity matching
- **Real-time Progress**: WebSocket-based progress tracking
- **Cost Management**: Budget limits and cost tracking per pipeline
- **Quality Assessment**: AI-powered quality scoring with thresholds
- **Error Handling**: Retry logic with exponential backoff
- **Dual Mode**: Live Launchloom agent workflow or simulated mode fallback

### 🛡️ Enterprise Features

- **Cost Optimization**: Semantic caching reduces API costs by 60-80%
- **Budget Controls**: Per-pipeline budget limits with alerts
- **Quality Assurance**: Configurable quality thresholds with retry logic
- **Monitoring**: Comprehensive logging and metrics collection
- **Scalability**: Designed for high-throughput production use
- **Flexibility**: Easy configuration for different environments

## 📊 Pipeline Stages

Each stage is handled by specialized Launchloom agent prompts:

1. **Normalize**: Clean and structure the raw idea
2. **Research**: Market research and competitive analysis  
3. **Feasibility**: Technical and business feasibility assessment
4. **Market/Moat**: Market positioning and competitive advantages
5. **Risk Assessment**: Comprehensive risk analysis and mitigation
6. **UX Design**: User experience design and wireframes
7. **Code Scaffold**: Technical architecture and code structure
8. **API Design**: REST API specification and documentation
9. **Export**: Final deliverables and implementation roadmap

## 💰 Cost Management

The system includes comprehensive cost tracking and optimization:

```typescript
// Get cost statistics
const stats = await launchloomService.getServiceHealth();
console.log(`Total cost: $${stats.stats?.totalCost}`);
console.log(`Avg cost per request: $${stats.stats?.averageCostPerRequest?.toFixed(4)}`);

// Set budget alerts
costTracker.setBudgetAlert(50.0, 500.0, (usage) => {
  console.warn('Budget limit exceeded!', usage);
});
```

### Cost Optimization Features:

- **Semantic Caching**: Reuse similar requests (60-80% savings)
- **Budget Limits**: Per-pipeline cost controls
- **Model Selection**: Choose between `gpt-4.1` and `gpt-4.1-mini` based on needs
- **Token Optimization**: Efficient prompt engineering
- **Progress Tracking**: Stop processing if budget exceeded

## 🔧 Configuration

### Environment Variables

```bash
# Required for live mode
OPENAI_API_KEY=your_openai_api_key_here
NEXT_PUBLIC_USE_LIVE=true

# Optional configuration
QUALITY_THRESHOLD=0.7          # 0.0-1.0, quality threshold
BUDGET_LIMIT=10.0              # USD, max cost per pipeline
LOG_LEVEL=info                 # debug|info|warn|error
```

### Service Configuration

```typescript
import { createLaunchloomService } from './services/LaunchloomService';

const service = createLaunchloomService({
  apiKey: process.env.OPENAI_API_KEY,
  enableLiveMode: true,
  defaultQualityThreshold: 0.7,
  defaultBudgetLimit: 10.0
});
```

## 📈 Monitoring & Analytics

### Health Checks

```typescript
const health = await launchloomService.getServiceHealth();
console.log('Service status:', {
  healthy: health.healthy,
  mode: health.mode,
  activePipelines: health.stats?.activePipelines,
  totalCost: health.stats?.totalCost,
  averageCostPerRequest: health.stats?.averageCostPerRequest
});
```

### Cost Tracking

```typescript
// Real-time cost monitoring
const costStats = await launchloomService.getServiceHealth();
console.log('Cost statistics:', {
  totalCost: costStats.stats?.totalCost,
  todayCost: costStats.stats?.todayCost,
  requestCount: costStats.stats?.requestCount,
  averageCostPerRequest: costStats.stats?.averageCostPerRequest
});
```

## 🔍 Quality Assessment

The system includes built-in quality scoring:

```typescript
// Quality metrics for each stage
interface QualityMetrics {
  completeness: number;    // 0-1, content completeness
  accuracy: number;        // 0-1, factual accuracy  
  actionability: number;   // 0-1, actionable insights
  clarity: number;         // 0-1, clarity of output
  relevance: number;       // 0-1, relevance to input
}

// Overall quality assessment
const assessment = await assessor.assessQuality(result);
if (assessment.overallScore < qualityThreshold) {
  // Retry with improved prompts
  await retryStage(stage, context);
}
```

## 🚦 Error Handling

Comprehensive error handling with retry logic:

```typescript
// Automatic retries with exponential backoff
const result = await conductor.executeStageWithRetry(
  context, 
  stage, 
  previousResults, 
  { retryAttempts: 3 }
);

// Error types
- API_RATE_LIMIT: Rate limit exceeded
- QUALITY_THRESHOLD_NOT_MET: Output quality too low
- BUDGET_LIMIT_EXCEEDED: Cost limit reached
- TIMEOUT: Processing took too long
- INVALID_RESPONSE: Malformed Launchloom agent response
```

## 🔧 Development

### Running Tests

```bash
# Run all tests
npm test

# Run with watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

### Type Checking

```bash
# Check TypeScript types
npm run type-check

# Lint code
npm run lint

# Validate everything
npm run validate
```

### Local Development

```bash
# Start development server
npm run dev

# The service will automatically:
# - Use simulated mode if no Launchloom agent API key
# - Enable live mode if OPENAI_API_KEY is set
# - Show detailed logs in development
```

## 🌐 Production Deployment

### Environment Setup

```bash
# Production environment variables
NODE_ENV=production
OPENAI_API_KEY=prod_api_key_here
NEXT_PUBLIC_USE_LIVE=true
QUALITY_THRESHOLD=0.8
BUDGET_LIMIT=25.0
LOG_LEVEL=info
```

### Performance Optimization

1. **Enable Caching**: Set up Redis for shared caching
2. **Monitor Costs**: Set up budget alerts and monitoring
3. **Quality Gates**: Configure appropriate quality thresholds
4. **Load Balancing**: Scale horizontally for high throughput

## 📚 API Reference

### Core Methods

```typescript
// Process a single idea
processIdea(ideaText: string, options?: ProcessOptions): Promise<Dossier>

// Stream processing with progress updates
streamPipelineProgress(ideaText: string, options?: ProcessOptions): AsyncGenerator<Progress, Dossier>

// Get pipeline status
getPipelineStatus(executionId: string): PipelineProgress | null

// Cancel running pipeline
cancelPipeline(executionId: string): Promise<boolean>

// Health check and statistics  
getServiceHealth(): Promise<HealthStatus>
```

### Event System

```typescript
// Listen to pipeline events
service.on('pipeline:started', (data) => console.log('Started:', data));
service.on('pipeline:completed', (data) => console.log('Completed:', data));
service.on('pipeline:failed', (data) => console.log('Failed:', data));
service.on('stage:completed', (data) => console.log('Stage done:', data));
```

## 🔐 Security & Privacy

- **API Key Security**: Store Launchloom agent API keys in secure environment variables
- **Cost Controls**: Budget limits prevent runaway costs
- **Data Privacy**: No user data stored in Launchloom agent responses
- **Audit Logs**: Comprehensive logging for compliance
- **Rate Limiting**: Built-in rate limiting and retry logic

## 🛠️ Troubleshooting

### Common Issues

**"Service not initialized" Error:**
```typescript
// Make sure to initialize before use
import { initializeLaunchloom } from '../ai/config';
const service = initializeLaunchloom();
```

**High API Costs:**
```typescript
// Enable caching and set budget limits
const service = createLaunchloomService({
  enableCaching: true,
  budgetLimit: 5.0,  // Lower budget
  qualityThreshold: 0.6  // Lower quality for cost savings
});
```

**Quality Too Low:**
```typescript
// Increase quality threshold and retry attempts
const service = createLaunchloomService({
  qualityThreshold: 0.8,
  retryAttempts: 3
});
```

## 📞 Support

- **Documentation**: See `/docs` directory for comprehensive guides
- **Issues**: Report issues in the GitHub repository
- **Configuration**: Check `.env.example` for all configuration options

## 🎯 Next Steps

1. **Set up your Launchloom agent API key** in `.env.local`
2. **Run a test pipeline** with a sample idea
3. **Monitor costs and performance** in development
4. **Configure quality thresholds** for your use case
5. **Deploy to production** with appropriate settings

The Launchloom agent-powered Launchloom system is now ready to transform startup ideas into comprehensive, production-ready deliverables! 🚀
