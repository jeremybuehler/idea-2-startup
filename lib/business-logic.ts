/**
 * Core business logic utilities for Idea-to-Startup Studio
 * Extracted from monolithic component for better separation of concerns
 */

import { IdeaScores } from '@/types';
import { sanitizeUserInput, sanitizeForJSON, sanitizeForMarkdown, sanitizeProjectSlug } from './security';

/**
 * Scores an idea based on multiple business criteria
 * Uses algorithm considering uniqueness, market signals, and keyword density
 */
export function scoreIdea(idea: string): IdeaScores {
  if (!idea || typeof idea !== 'string') {
    return { total: 12, desirability: 2, feasibility: 3, viability: 2, defensibility: 3, timing: 2 };
  }

  const len = Math.min(idea.length, 1200);
  const uniq = new Set(idea.toLowerCase().replace(/[^a-z0-9]+/g, '').split('')).size;
  
  // Market signal detection
  const hasAI = /\b(ai|agent|ml|llm|gpt|automation)\b/i.test(idea) ? 8 : 0;
  const hasRev = /(revenue|pricing|paid|monet|business model)/i.test(idea) ? 6 : 0;
  const hasUser = /(user|customer|founder|teacher|patient|sales|manager)/i.test(idea) ? 6 : 0;
  
  const base = Math.round((uniq / 36) * 40 + (len / 1200) * 20);
  
  const desirability = Math.min(20, Math.round(base * 0.35) + hasUser);
  const feasibility = Math.min(20, Math.round(base * 0.30) + hasAI);
  const viability = Math.min(20, Math.round(base * 0.20) + hasRev);
  const defensibility = Math.min(20, Math.round(base * 0.10));
  const timing = Math.min(20, 20 - Math.abs(12 - (uniq % 20)) + (hasAI ? 2 : 0));
  
  const rawTotal = desirability + feasibility + viability + defensibility + timing;
  const total = Math.max(12, Math.min(100, rawTotal));
  
  return { total, desirability, feasibility, viability, defensibility, timing };
}

/**
 * Converts text to URL-safe slug format
 */
export function toSlug(s: string): string {
  if (!s || typeof s !== 'string') return 'unnamed-project';
  
  return s
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'unnamed-project';
}

/**
 * Gets current ISO timestamp
 */
export function nowISO(): string {
  return new Date().toISOString();
}

/**
 * Template generators with security sanitization
 */
export class TemplateGenerator {
  /**
   * Generates Product Requirements Document
   */
  static makePRD(title: string, oneLiner: string, ideaText: string, scores: IdeaScores): string {
    const safeTitle = sanitizeForMarkdown(title);
    const safeOneLiner = sanitizeForMarkdown(oneLiner);
    const safeIdeaText = sanitizeForMarkdown(ideaText);
    
    return `# ${safeTitle}

**One-liner**: ${safeOneLiner}

**Date**: ${new Date().toLocaleDateString()}  
**Version**: 0.1 (auto-drafted)

---

## Problem
Summarize the core pain in 3 bullets.
- Users struggle with X because Y.
- The status quo is manual/expensive/slow.
- Impact: lost revenue/time/accuracy/trust.

## Target Users
- Primary: Define the main persona who benefits first.
- Secondary: Adjacent roles who gain visibility or time back.

## Jobs-to-be-Done
- When I [situation], I want [motivation], so I can [expected outcome].

## Solution Overview
${safeOneLiner}

### First Feature Slice
Ship a thin vertical that proves core value within 1–2 weeks.
- Slice: From input → visible outcome + feedback loop.
- Success: User repeats the flow twice in one week.

## Functional Scope (MVP)
1. Ingest idea/input
2. Decompose & research
3. Draft PRD + wireframes
4. Scaffold repo + API
5. Export dossier + runbook

## Non-Functional Requirements
- Privacy by design, clear telemetry, cost ceilings, moderate latency (<10s per stage).

## Risks & Mitigations
- Privacy/IP: vault + redaction + allowlist data flows
- Feasibility: staged complexity, use smaller models first
- Viability: outcome metrics wired from day one

## Success Metrics
- Dossier usefulness rating ≥4/5
- ≤15 minutes idea → hosted hello-world
- First 10 users activated in <30 days

## Notes
Idea seed (verbatim excerpt):
> ${safeIdeaText.slice(0, 400)}...

Scores: ${JSON.stringify(scores)}
`;
  }

  /**
   * Generates agent orchestration runbook
   */
  static makeRunbook(title: string): string {
    const safeTitle = sanitizeForMarkdown(title);
    
    return `# ${safeTitle} — Agent Runbook (v0)

conductor:
  goals: ["orchestrate", "budget", "gate high-risk steps"]
  budgets:
    tokens: 250000
    time_minutes: 15
  gates: ["risk_review", "spend_over_cap"]

librarian:
  tools: ["web_search", "code_search", "app_store_scan", "patent_glance"]
  cache: ephemeral_knowledge_pack

market_analyst:
  outputs: ["tam_sam_som", "pricing_proxy", "comps", "timing"]

tech_architect:
  outputs: ["adr", "data_model", "service_map", "stack_choice"]
  constraints: ["PII_minimization", "cost_ceiling", "latency_target"]

ux_synthesizer:
  outputs: ["journeys", "wireframe_json", "export_pngs"]

scaffolder:
  templates: ["web_next", "api_fastapi", "db_pg", "iac_tf", "ci_github"]
  repo_policy: MIT_or_BSL_clean

risk_compliance:
  checks: ["privacy", "license", "regulated_domains"]

learningloop:
  observe: ["rubric_scores", "human_rating", "latency_ms", "cost_msat"]
  adapt: ["prompt_AB", "tool_selection", "retry_policy"]
`;
  }

  /**
   * Generates repository structure tree
   */
  static makeRepoTree(slug: string): string {
    const safeSlug = sanitizeProjectSlug(slug);
    
    return `/${safeSlug}
  /app
    /web  (Next.js 14/15)
    /api  (FastAPI)
    /workers (queues, cron)
    /design (wireframe JSON + PNG)
    /infra  (Terraform, Dockerfiles)
    /ops    (agents.yaml, prompts/, evals/)
    /packages (ui, db, analytics, auth)
    /docs  (PRD.md, ADRs, Roadmap.md)
`;
  }

  /**
   * Generates API code skeleton
   */
  static makeAPISketch(): string {
    return `// Minimal API sketch (FastAPI)
from fastapi import FastAPI
from pydantic import BaseModel
from datetime import datetime
import random, string

app = FastAPI()

class Brief(BaseModel):
    title: str
    one_liner: str
    idea_text: str

@app.post("/ingest/idea")
async def ingest(brief: Brief):
    return {"id": "idea_" + ''.join(random.choice(string.ascii_lowercase) for _ in range(6)), "created_at": datetime.utcnow().isoformat()}

@app.get("/dossier/{id}")
async def dossier(id: str):
    return {"status": "ready", "score": 82, "id": id}
`;
  }
}

/**
 * Export utilities for project artifacts
 */
export class ExportUtils {
  /**
   * Triggers download of blob content
   */
  static downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Builds GitHub new repository URL with pre-filled data
   */
  static buildGitHubNewRepoUrl(name: string, description: string, visibility: 'public' | 'private' = 'public'): string {
    const safeName = sanitizeProjectSlug(name);
    const safeDescription = sanitizeUserInput(description);
    
    const params = new URLSearchParams({
      name: safeName,
      description: safeDescription,
      visibility: visibility,
      auto_init: 'true'
    });
    
    return `https://github.com/new?${params.toString()}`;
  }
}
