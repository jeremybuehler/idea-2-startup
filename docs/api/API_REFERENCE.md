# 🔌 Launchloom API Reference

**Version**: v2.1.0  
**Last Updated**: December 2024  
**Base URL**: `https://api.i2s.studio`  
**Status**: 🟢 Production Ready  

## 📋 Overview

The Launchloom API provides programmatic access to the Launchloom multi-agent pipeline system. This RESTful API enables developers to submit startup ideas, track processing status, and retrieve generated artifacts including PRDs, wireframes, code scaffolds, and agent runbooks.

### API Principles
- **RESTful Design**: Standard HTTP methods and status codes
- **JSON First**: All requests and responses use JSON
- **Rate Limited**: Per-user and per-endpoint rate limiting
- **Versioned**: Semantic versioning with backward compatibility
- **Authenticated**: API key-based authentication for all endpoints
- **Idempotent**: Safe retry behavior for all operations

## 🔐 Authentication

### API Key Authentication
All API requests require authentication using an API key passed in the `Authorization` header:

```http
Authorization: Bearer your-api-key-here
```

### Obtaining API Keys
```bash
curl -X POST https://api.i2s.studio/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "name": "John Doe",
    "organization": "Acme Corp"
  }'
```

**Response:**
```json
{
  "apiKey": "i2s_live_abc123...",
  "userId": "user_123",
  "rateLimit": {
    "requestsPerMinute": 60,
    "requestsPerHour": 1000,
    "requestsPerDay": 10000
  },
  "createdAt": "2024-12-01T10:00:00Z"
}
```

## 📊 Rate Limiting

Rate limits are enforced per API key with the following default limits:

| Tier | Requests/Minute | Requests/Hour | Requests/Day | Concurrent Pipelines |
|------|-----------------|---------------|--------------|---------------------|
| Free | 10 | 100 | 1,000 | 1 |
| Pro | 60 | 1,000 | 10,000 | 3 |
| Enterprise | 300 | 5,000 | 50,000 | 10 |

Rate limit headers are included in all responses:
```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1701432000
X-RateLimit-Retry-After: 15
```

## 📡 Core Endpoints

### 🚀 Pipeline Management

#### Submit Idea for Processing
Create a new pipeline execution to process a startup idea through the multi-agent system.

```http
POST /v1/pipeline/submit
```

**Request Headers:**
```http
Authorization: Bearer your-api-key
Content-Type: application/json
```

**Request Body:**
```json
{
  "ideaText": "A mobile app that uses AI to help people find the perfect coffee shop based on their taste preferences, mood, and current location.",
  "context": {
    "industry": "Food & Beverage",
    "targetMarket": "Urban millennials",
    "budget": "50000",
    "timeline": "6 months"
  },
  "options": {
    "includeWireframes": true,
    "includeCodeScaffold": true,
    "includeRunbook": true,
    "analysisDepth": "detailed",
    "mockData": false
  },
  "webhookUrl": "https://your-app.com/webhooks/pipeline-complete",
  "tags": ["ai", "mobile", "food-tech"]
}
```

**Response (202 Accepted):**
```json
{
  "pipelineId": "pipe_abc123def456",
  "status": "queued",
  "estimatedDuration": "15-20 minutes",
  "queuePosition": 2,
  "createdAt": "2024-12-01T10:00:00Z",
  "statusUrl": "/v1/pipeline/pipe_abc123def456/status",
  "webhookUrl": "https://your-app.com/webhooks/pipeline-complete"
}
```

#### Get Pipeline Status
Retrieve the current processing status and progress of a pipeline execution.

```http
GET /v1/pipeline/{pipelineId}/status
```

**Response (200 OK):**
```json
{
  "pipelineId": "pipe_abc123def456",
  "status": "processing",
  "stage": "feasibility_analysis",
  "progress": {
    "currentStage": 4,
    "totalStages": 9,
    "percentage": 44,
    "stagesCompleted": [
      {
        "name": "normalize",
        "status": "completed",
        "duration": "12s",
        "completedAt": "2024-12-01T10:01:12Z"
      },
      {
        "name": "research",
        "status": "completed", 
        "duration": "45s",
        "completedAt": "2024-12-01T10:01:57Z"
      },
      {
        "name": "market_analysis",
        "status": "completed",
        "duration": "67s",
        "completedAt": "2024-12-01T10:03:04Z"
      },
      {
        "name": "feasibility_analysis",
        "status": "processing",
        "startedAt": "2024-12-01T10:03:04Z",
        "estimatedCompletion": "2024-12-01T10:04:30Z"
      }
    ]
  },
  "resourceUsage": {
    "tokensUsed": 45234,
    "costUSD": 2.14,
    "processingTime": "3m 42s"
  },
  "estimatedCompletion": "2024-12-01T10:18:45Z",
  "createdAt": "2024-12-01T10:00:00Z",
  "updatedAt": "2024-12-01T10:03:15Z"
}
```

#### Get Pipeline Results
Retrieve the completed analysis and generated artifacts for a finished pipeline.

```http
GET /v1/pipeline/{pipelineId}/results
```

**Response (200 OK):**
```json
{
  "pipelineId": "pipe_abc123def456",
  "status": "completed",
  "dossier": {
    "id": "dossier_789xyz",
    "title": "CoffeeGenius: AI-Powered Coffee Discovery",
    "oneLiner": "Personalized coffee shop recommendations using AI taste profiling",
    "ideaText": "A mobile app that uses AI to help people find...",
    "scores": {
      "total": 82,
      "desirability": 85,
      "feasibility": 78,
      "viability": 84,
      "defensibility": 75,
      "timing": 88
    },
    "artifacts": {
      "prd": {
        "url": "/v1/pipeline/pipe_abc123def456/artifacts/prd",
        "contentType": "text/markdown",
        "size": 15420
      },
      "wireframes": {
        "url": "/v1/pipeline/pipe_abc123def456/artifacts/wireframes",
        "contentType": "application/json",
        "size": 8934
      },
      "codeScaffold": {
        "url": "/v1/pipeline/pipe_abc123def456/artifacts/code",
        "contentType": "application/zip",
        "size": 124567
      },
      "runbook": {
        "url": "/v1/pipeline/pipe_abc123def456/artifacts/runbook",
        "contentType": "text/yaml",
        "size": 5678
      }
    }
  },
  "metadata": {
    "processingTime": "18m 23s",
    "totalCost": 4.67,
    "tokensUsed": 123456,
    "agentsInvolved": ["conductor", "researcher", "analyst", "designer", "developer"],
    "qualityScore": 0.89
  },
  "completedAt": "2024-12-01T10:18:23Z"
}
```

#### List User Pipelines
Get a paginated list of all pipeline executions for the authenticated user.

```http
GET /v1/pipeline/list
```

**Query Parameters:**
- `limit` (integer): Number of results per page (default: 20, max: 100)
- `offset` (integer): Number of results to skip (default: 0)
- `status` (string): Filter by status (`queued`, `processing`, `completed`, `failed`)
- `startDate` (string): ISO date to filter results after
- `endDate` (string): ISO date to filter results before

**Response (200 OK):**
```json
{
  "pipelines": [
    {
      "pipelineId": "pipe_abc123def456",
      "title": "CoffeeGenius: AI-Powered Coffee Discovery",
      "status": "completed",
      "createdAt": "2024-12-01T10:00:00Z",
      "completedAt": "2024-12-01T10:18:23Z",
      "totalScore": 82,
      "costUSD": 4.67,
      "tags": ["ai", "mobile", "food-tech"]
    }
  ],
  "pagination": {
    "total": 47,
    "limit": 20,
    "offset": 0,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

### 📄 Artifact Access

#### Download Artifact
Download specific generated artifacts from a completed pipeline.

```http
GET /v1/pipeline/{pipelineId}/artifacts/{artifactType}
```

**Path Parameters:**
- `artifactType`: One of `prd`, `wireframes`, `code`, `runbook`, `full-export`

**Response Headers:**
```http
Content-Type: application/octet-stream
Content-Disposition: attachment; filename="coffegenius-prd.md"
Content-Length: 15420
```

#### Get Artifact Metadata
Retrieve metadata about available artifacts without downloading content.

```http
GET /v1/pipeline/{pipelineId}/artifacts/metadata
```

**Response (200 OK):**
```json
{
  "pipelineId": "pipe_abc123def456",
  "artifacts": {
    "prd": {
      "type": "Product Requirements Document",
      "format": "markdown",
      "size": 15420,
      "checksum": "sha256:abc123...",
      "generatedAt": "2024-12-01T10:12:15Z",
      "quality": {
        "completeness": 0.94,
        "clarity": 0.87,
        "actionability": 0.91
      }
    },
    "wireframes": {
      "type": "UI/UX Wireframes", 
      "format": "json",
      "size": 8934,
      "checksum": "sha256:def456...",
      "generatedAt": "2024-12-01T10:14:32Z",
      "screenCount": 12,
      "quality": {
        "completeness": 0.89,
        "usability": 0.85
      }
    }
  }
}
```

### 👤 Account Management

#### Get Account Information
Retrieve current account details, usage statistics, and billing information.

```http
GET /v1/account/info
```

**Response (200 OK):**
```json
{
  "user": {
    "userId": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "organization": "Acme Corp",
    "tier": "pro",
    "createdAt": "2024-10-01T09:00:00Z"
  },
  "usage": {
    "thisMonth": {
      "pipelinesExecuted": 15,
      "tokensUsed": 1234567,
      "costUSD": 67.89,
      "averageQualityScore": 0.86
    },
    "limits": {
      "monthlyPipelines": 100,
      "concurrentPipelines": 3,
      "maxTokensPerPipeline": 500000
    },
    "quotaRemaining": {
      "pipelines": 85,
      "tokens": 8765433,
      "costUSD": 432.11
    }
  },
  "billing": {
    "currentPlan": "Pro Plan",
    "nextBillingDate": "2024-12-15T00:00:00Z",
    "paymentMethod": "card_ending_4242"
  }
}
```

#### Update Account Settings
Modify account settings and preferences.

```http
PATCH /v1/account/settings
```

**Request Body:**
```json
{
  "preferences": {
    "defaultAnalysisDepth": "detailed",
    "webhookUrl": "https://your-app.com/webhooks/pipeline-complete",
    "emailNotifications": true,
    "qualityThreshold": 0.8
  },
  "billing": {
    "autoUpgrade": false,
    "budgetAlert": 500.00
  }
}
```

### 📊 Analytics & Insights

#### Get Usage Analytics
Retrieve detailed usage analytics and performance metrics.

```http
GET /v1/analytics/usage
```

**Query Parameters:**
- `period` (string): Time period (`7d`, `30d`, `90d`, `1y`)
- `granularity` (string): Data granularity (`hour`, `day`, `week`, `month`)

**Response (200 OK):**
```json
{
  "period": "30d",
  "granularity": "day",
  "metrics": {
    "pipelineMetrics": {
      "totalExecuted": 47,
      "avgProcessingTime": "16m 42s",
      "successRate": 0.957,
      "avgQualityScore": 0.86,
      "topIndustries": [
        {"name": "Technology", "count": 18},
        {"name": "Healthcare", "count": 12},
        {"name": "FinTech", "count": 8}
      ]
    },
    "costMetrics": {
      "totalCost": 234.56,
      "avgCostPerPipeline": 4.99,
      "tokenUtilization": 0.73,
      "peakUsageDays": ["2024-11-15", "2024-11-22"]
    },
    "qualityMetrics": {
      "avgScores": {
        "desirability": 81.3,
        "feasibility": 76.8,
        "viability": 78.9,
        "defensibility": 72.1,
        "timing": 84.2
      },
      "artifactQuality": {
        "prd": 0.89,
        "wireframes": 0.82,
        "codeScaffold": 0.85,
        "runbook": 0.91
      }
    }
  },
  "timeSeries": [
    {
      "date": "2024-11-01",
      "pipelines": 2,
      "cost": 9.87,
      "avgQuality": 0.84
    }
    // ... more daily data
  ]
}
```

## 🔧 Advanced Features

### ⏰ Webhook Integration

Configure webhooks to receive real-time notifications about pipeline events.

#### Webhook Events
- `pipeline.queued` - Pipeline added to processing queue
- `pipeline.started` - Pipeline processing began
- `pipeline.stage_completed` - Individual stage completed
- `pipeline.completed` - Pipeline fully completed
- `pipeline.failed` - Pipeline processing failed
- `pipeline.timeout` - Pipeline processing timed out

#### Webhook Payload Example
```json
{
  "event": "pipeline.completed",
  "timestamp": "2024-12-01T10:18:23Z",
  "pipelineId": "pipe_abc123def456",
  "userId": "user_123",
  "data": {
    "status": "completed",
    "processingTime": "18m 23s",
    "totalScore": 82,
    "costUSD": 4.67,
    "artifactUrls": {
      "prd": "/v1/pipeline/pipe_abc123def456/artifacts/prd",
      "wireframes": "/v1/pipeline/pipe_abc123def456/artifacts/wireframes"
    }
  },
  "signature": "sha256=abc123..." // HMAC signature for verification
}
```

### 🔍 Advanced Search & Filtering

#### Search Pipeline History
Search through your pipeline history with advanced filtering capabilities.

```http
POST /v1/pipeline/search
```

**Request Body:**
```json
{
  "query": {
    "text": "AI coffee mobile app",
    "filters": {
      "scoreRange": {"min": 75, "max": 95},
      "dateRange": {
        "start": "2024-11-01T00:00:00Z",
        "end": "2024-12-01T23:59:59Z"
      },
      "industries": ["Food & Beverage", "Technology"],
      "tags": ["ai", "mobile"],
      "status": ["completed"],
      "costRange": {"min": 0, "max": 10.00}
    }
  },
  "sort": {
    "field": "totalScore",
    "direction": "desc"
  },
  "pagination": {
    "limit": 20,
    "offset": 0
  }
}
```

### 🔄 Batch Operations

#### Batch Pipeline Submission
Submit multiple ideas for processing in a single request.

```http
POST /v1/pipeline/batch
```

**Request Body:**
```json
{
  "pipelines": [
    {
      "ideaText": "AI-powered fitness coach app...",
      "context": {"industry": "Health & Fitness"},
      "options": {"analysisDepth": "standard"}
    },
    {
      "ideaText": "Sustainable packaging marketplace...",
      "context": {"industry": "E-commerce"},
      "options": {"analysisDepth": "detailed"}
    }
  ],
  "batchOptions": {
    "priority": "normal",
    "webhookUrl": "https://your-app.com/webhooks/batch-complete",
    "failureMode": "continue" // "continue" or "stop"
  }
}
```

**Response (202 Accepted):**
```json
{
  "batchId": "batch_xyz789",
  "pipelineIds": ["pipe_001", "pipe_002"],
  "status": "queued",
  "totalEstimatedDuration": "35-40 minutes",
  "createdAt": "2024-12-01T10:00:00Z"
}
```

## 📋 Error Handling

### HTTP Status Codes
- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `202 Accepted` - Request accepted for processing
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Invalid or missing API key
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict (duplicate)
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error
- `502 Bad Gateway` - Service temporarily unavailable
- `503 Service Unavailable` - Service maintenance

### Error Response Format
```json
{
  "error": {
    "code": "INVALID_IDEA_TEXT",
    "message": "The provided idea text is too short. Minimum 50 characters required.",
    "details": {
      "field": "ideaText",
      "provided": 23,
      "minimum": 50,
      "suggestion": "Please provide more detailed description of your startup idea."
    },
    "timestamp": "2024-12-01T10:00:00Z",
    "requestId": "req_abc123def456"
  }
}
```

### Common Error Codes
- `INVALID_API_KEY` - API key is invalid or expired
- `RATE_LIMIT_EXCEEDED` - Too many requests within time window
- `INSUFFICIENT_QUOTA` - Account quota exceeded
- `INVALID_IDEA_TEXT` - Idea text validation failed
- `PIPELINE_NOT_FOUND` - Pipeline ID does not exist
- `PIPELINE_NOT_READY` - Pipeline still processing, results not available
- `ARTIFACT_NOT_FOUND` - Requested artifact does not exist
- `WEBHOOK_DELIVERY_FAILED` - Webhook endpoint unreachable
- `PROCESSING_TIMEOUT` - Pipeline processing exceeded time limit
- `QUALITY_THRESHOLD_NOT_MET` - Generated content below quality threshold

## 🔌 SDK & Integration Examples

### JavaScript/TypeScript SDK
```typescript
// npm install @i2s-studio/api-client
import { LaunchloomClient } from '@i2s-studio/api-client';

const client = new LaunchloomClient({
  apiKey: 'your-api-key',
  baseURL: 'https://api.i2s.studio'
});

// Submit pipeline
const pipeline = await client.pipeline.submit({
  ideaText: 'A mobile app for...',
  context: { industry: 'Technology' },
  options: { analysisDepth: 'detailed' }
});

// Track progress
const status = await client.pipeline.getStatus(pipeline.pipelineId);
console.log(`Progress: ${status.progress.percentage}%`);

// Get results when complete
const results = await client.pipeline.getResults(pipeline.pipelineId);
console.log(`Total Score: ${results.dossier.scores.total}`);

// Download artifacts
const prd = await client.pipeline.downloadArtifact(
  pipeline.pipelineId, 
  'prd'
);
```

### Python SDK
```python
# pip install i2s-studio-api
from i2s_studio import LaunchloomClient

client = LaunchloomClient(api_key='your-api-key')

# Submit pipeline
pipeline = client.pipeline.submit(
    idea_text="A mobile app for...",
    context={"industry": "Technology"},
    options={"analysis_depth": "detailed"}
)

# Track progress
status = client.pipeline.get_status(pipeline.pipeline_id)
print(f"Progress: {status.progress.percentage}%")

# Get results when complete
results = client.pipeline.get_results(pipeline.pipeline_id)
print(f"Total Score: {results.dossier.scores.total}")

# Download artifacts
prd_content = client.pipeline.download_artifact(
    pipeline.pipeline_id, 
    'prd'
)
```

### cURL Examples
```bash
# Submit pipeline
curl -X POST https://api.i2s.studio/v1/pipeline/submit \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "ideaText": "A mobile app that uses AI to help people find the perfect coffee shop...",
    "context": {"industry": "Food & Beverage"},
    "options": {"analysisDepth": "detailed"}
  }'

# Check status
curl -H "Authorization: Bearer your-api-key" \
  https://api.i2s.studio/v1/pipeline/pipe_abc123def456/status

# Download PRD
curl -H "Authorization: Bearer your-api-key" \
  -o prd.md \
  https://api.i2s.studio/v1/pipeline/pipe_abc123def456/artifacts/prd
```

## 🔍 API Specification

### OpenAPI Schema
The complete OpenAPI 3.0 specification is available at:
```
https://api.i2s.studio/v1/openapi.json
```

Interactive documentation:
```
https://api.i2s.studio/docs
```

### Postman Collection
Import our Postman collection for easy API testing:
```
https://api.i2s.studio/assets/i2s-api.postman_collection.json
```

## 🚦 Testing & Sandbox

### Sandbox Environment
Use the sandbox environment for testing and development:
```
Base URL: https://sandbox-api.i2s.studio
Test API Key: i2s_test_sandbox123...
```

Sandbox features:
- No billing or usage limits
- Faster processing (mock responses)
- Predictable test data
- No actual AI model calls
- Reset data daily

### Test Pipeline Submission
```bash
curl -X POST https://sandbox-api.i2s.studio/v1/pipeline/submit \
  -H "Authorization: Bearer i2s_test_sandbox123..." \
  -H "Content-Type: application/json" \
  -d '{
    "ideaText": "Test idea for API validation",
    "options": {"mockData": true}
  }'
```

## 📈 Performance & Limits

### Processing Times
- **Standard Analysis**: 8-15 minutes
- **Detailed Analysis**: 15-25 minutes
- **Quick Analysis**: 3-8 minutes

### Resource Limits
- **Max Idea Text**: 10,000 characters
- **Max Concurrent Pipelines**: Tier-dependent (1-10)
- **Max Artifacts Size**: 100MB per pipeline
- **Data Retention**: 90 days (Pro), 365 days (Enterprise)

### Service Level Agreements (SLA)
- **Uptime**: 99.9%
- **Response Time**: <200ms (95th percentile)
- **Processing Success Rate**: >95%
- **Support Response**: 24 hours (Pro), 4 hours (Enterprise)

## 🆕 Changelog & Versioning

### Version 2.1.0 (Current)
- Added batch pipeline processing
- Enhanced artifact quality scoring
- Improved error handling and validation
- New analytics endpoints
- Webhook signature verification

### Version 2.0.0
- Complete API redesign for multi-agent architecture
- Added pipeline stages and progress tracking
- Enhanced artifact generation capabilities
- Introduced usage analytics and insights

### Deprecation Policy
- Minimum 6 months notice for breaking changes
- Legacy versions supported for 12 months
- Migration guides provided for major updates

---

**Support**: api-support@i2s.studio  
**Documentation**: docs@i2s.studio  
**Status Page**: https://status.i2s.studio  
**Last Updated**: December 2024
