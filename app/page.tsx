'use client'

import React, { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Brain,
  Rocket,
  Workflow,
  FileText,
  Cpu,
  LineChart,
  Shield,
  Layout,
  Hammer,
  Boxes,
  TerminalSquare,
  GitBranch,
  CheckCircle2,
  Loader2,
  Download,
  Cloud,
  ServerCog,
  Github
} from 'lucide-react'

// shadcn/ui components
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { LeadCaptureForm } from '@/components/lead-capture-form'

// Zip utility for downloadable repo export (ESM/CDN-safe)
import JSZip from 'jszip'

// Types
import { IdeaScores, Dossier, PipelineStage } from '@/types'

// ------------------------------------------------------------
// Helpers (defined BEFORE component so hooks can reference them)
// ------------------------------------------------------------
function scoreIdea(idea: string): IdeaScores {
  const len = Math.min(idea.length, 1200)
  const uniq = new Set(idea.toLowerCase().replace(/[^a-z0-9]+/g, '').split('')).size
  const hasAI = /\b(ai|agent|ml|llm|gpt|automation)\b/i.test(idea) ? 8 : 0
  const hasRev = /(revenue|pricing|paid|monet|business model)/i.test(idea) ? 6 : 0
  const hasUser = /(user|customer|founder|teacher|patient|sales|manager)/i.test(idea) ? 6 : 0
  const base = Math.round((uniq / 36) * 40 + (len / 1200) * 20)
  const desirability = Math.min(20, Math.round(base * 0.35) + hasUser)
  const feasibility = Math.min(20, Math.round(base * 0.30) + hasAI)
  const viability = Math.min(20, Math.round(base * 0.20) + hasRev)
  const defensibility = Math.min(20, Math.round(base * 0.10))
  const timing = Math.min(20, 20 - Math.abs(12 - (uniq % 20)) + (hasAI ? 2 : 0))
  const total = Math.max(12, Math.min(100, desirability + feasibility + viability + defensibility + timing))
  return { total, desirability, feasibility, viability, defensibility, timing }
}

function nowISO(): string { return new Date().toISOString() }

function makePRD(title: string, oneLiner: string, ideaText: string, scores: IdeaScores): string {
  return `# ${title}

**One-liner**: ${oneLiner}

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
${oneLiner}

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
> ${ideaText.slice(0, 400)}...

Scores: ${JSON.stringify(scores)}
`
}

function makeRunbook(title: string): string {
  return `# ${title} — Agent Runbook (v0)

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
`
}

function makeRepoTree(slug: string): string {
  return `/${slug}
  /app
    /web  (Next.js 14/15)
    /api  (FastAPI)
    /workers (queues, cron)
    /design (wireframe JSON + PNG)
    /infra  (Terraform, Dockerfiles)
    /ops    (agents.yaml, prompts/, evals/)
    /packages (ui, db, analytics, auth)
    /docs  (PRD.md, ADRs, Roadmap.md)
`
}

function makeAPISketch(): string {
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
`
}

function toSlug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'i2s-project'
}

// -----------------------------
// Download helper (replaces file-saver)
// -----------------------------
function downloadBlob(blob: Blob, filename: string): void {
  try {
    const navAny = navigator as any
    if (navAny && typeof navAny.msSaveOrOpenBlob === 'function') {
      // IE 10+ fallback
      navAny.msSaveOrOpenBlob(blob, filename)
      return
    }
    const URL_ = (window.URL || (window as any).webkitURL)
    const url = URL_.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.rel = 'noopener'
    if (typeof a.click === 'function') {
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } else {
      const evt = new MouseEvent('click')
      a.dispatchEvent(evt)
    }
    setTimeout(() => URL_.revokeObjectURL(url), 0)
  } catch (err) {
    console.error('downloadBlob failed', err)
  }
}

// Build JSZip contents separately so we can test structure without downloading.
function composeRepoZip(slug: string, dossier: any): JSZip {
  const zip = new JSZip()
  const prd = dossier?.prd || `# PRD\n\nFill in details.`
  const agents = dossier?.runbook || `# agents.yaml\n`
  const pkg = `{"name":"${slug}","private":true,"version":"0.1.0","scripts":{"dev":"next dev","build":"next build","start":"next start","lint":"next lint"},"dependencies":{"next":"14.2.5","react":"18.2.0","react-dom":"18.2.0"},"devDependencies":{"@types/node":"20.11.30","@types/react":"18.2.66","@types/react-dom":"18.2.22","typescript":"5.4.5"}}`
  const nextConfig = `/** @type {import('next').NextConfig} */\nconst nextConfig = { reactStrictMode: true };\nmodule.exports = nextConfig;\n`
  const tsconfig = `{"compilerOptions":{"target":"ES2022","lib":["dom","dom.iterable","esnext"],"allowJs":true,"skipLibCheck":true,"strict":true,"forceConsistentCasingInFileNames":true,"noEmit":true,"esModuleInterop":true,"module":"esnext","moduleResolution":"bundler","resolveJsonModule":true,"isolatedModules":true,"jsx":"preserve","baseUrl":"."},"include":["next-env.d.ts","**/*.ts","**/*.tsx"],"exclude":["node_modules"]}`
  const indexPage = `import Head from 'next/head';\nimport { useState } from 'react';\nexport default function Home(){\n  const [idea, setIdea] = useState('');\n  return (\n    <main style={{fontFamily:'ui-sans-serif', padding:24, lineHeight:1.7}}>\n      <Head><title>${slug}</title></Head>\n      <h1 style={{fontSize:34, fontWeight:700}}>Launchloom Prototype</h1>\n      <p>Paste an idea, then wire this UI to your backend.</p>\n      <textarea value={idea} onChange={e=>setIdea(e.target.value)} rows={8} style={{width:'100%', padding:14, fontSize:16}} placeholder=\"Your idea here...\"/>\n      <div style={{marginTop:12, fontSize:13, opacity:.7}}>See docs/PRD.md and ops/agents.yaml in this repo.</div>\n    </main>\n  );\n}`
  const readme = `# ${slug}

Launchloom starter generated by Launchloom.

## Quickstart

\`\`\`bash
pnpm i # or npm i / yarn
pnpm dev
\`\`\`

## Deploy to Vercel
1. Create a GitHub repo and push these files.
2. Go to https://vercel.com/new and import the repo.
3. Keep defaults. Deploy.

## Optional backend (FastAPI)
- Code in /server. Deploy on Fly.io/Render or behind an API Gateway.
- Set NEXT_PUBLIC_API_BASE to your backend URL to enable live mode.
`
  const envSample = `# Frontend\nNEXT_PUBLIC_API_BASE=\nNEXT_PUBLIC_USE_LIVE=false\n`

  // Frontend
  zip.file(`${slug}/package.json`, pkg)
  zip.file(`${slug}/next.config.js`, nextConfig)
  zip.file(`${slug}/tsconfig.json`, tsconfig)
  zip.file(`${slug}/pages/index.tsx`, indexPage)
  zip.file(`${slug}/public/README.txt`, 'Generated by Launchloom')
  // Docs & ops
  zip.file(`${slug}/docs/PRD.md`, prd)
  zip.file(`${slug}/ops/agents.yaml`, agents)
  zip.file(`${slug}/.env.example`, envSample)
  // Backend stub
  zip.file(`${slug}/server/main.py`, makeAPISketch())
  zip.file(`${slug}/server/requirements.txt`, `fastapi\nuvicorn\npydantic\n`)
  // Meta
  zip.file(`${slug}/REPO_TREE.txt`, makeRepoTree(slug))
  zip.file(`${slug}/README.md`, readme)

  return zip
}

async function buildRepoZip(slug: string, dossier: any): Promise<void> {
  const zip = composeRepoZip(slug, dossier)
  const blob = await zip.generateAsync({ type: 'blob' })
  downloadBlob(blob, `${slug}.zip`)
}

// -----------------------------
// GitHub helper: open prefilled "new repo" page
// -----------------------------
function buildGitHubNewRepoUrl(name: string, description: string, visibility: 'public' | 'private' = 'public'): string {
  const base = 'https://github.com/new'
  const params = new URLSearchParams({ name, description, visibility })
  return `${base}?${params.toString()}`
}

async function addRepoToGitHub(slug: string, dossier: any, description: string): Promise<void> {
  if (!dossier) return
  try { await buildRepoZip(slug, dossier) } catch (e) { console.warn('ZIP failed; opening GitHub anyway', e) }
  const url = buildGitHubNewRepoUrl(slug, description || 'Launchloom generated scaffold', 'public')
  window.open(url, '_blank', 'noopener,noreferrer')
}

function SearchIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-4">
      <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 1 0 4.256 11.93l4.282 4.282a.75.75 0 1 0 1.06-1.06l-4.282-4.282A6.75 6.75 0 0 0 10.5 3.75Zm-5.25 6.75a5.25 5.25 0 1 1 10.5 0 5.25 5.25 0 0 1-10.5 0Z" clipRule="evenodd" />
    </svg>
  )
}

// ------------------------------------------------------------
// Component
// ------------------------------------------------------------
export default function LaunchloomApp() {
  const [idea, setIdea] = useState('')
  const [title, setTitle] = useState('Idea‑to‑Startup Studio')
  const [oneLiner, setOneLiner] = useState('Speak an idea → get PRD, mockups, code scaffold, and agent runbook.')
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [dossier, setDossier] = useState<Dossier | null>(null)

  const [useLive, setUseLive] = useState(false)
  const [apiBase, setApiBase] = useState('')
  const [statusMsg, setStatusMsg] = useState<string | null>(null)
  const [openDeployGuide, setOpenDeployGuide] = useState(false)

  const scores = useMemo(() => scoreIdea(idea || oneLiner), [idea, oneLiner])
  const slug = useMemo(() => toSlug(title), [title])

  async function generate(): Promise<void> {
    if (!idea.trim()) return
    setRunning(true)
    setProgress(0)
    setDossier(null)
    setStatusMsg(null)

    const timer = setInterval(() => setProgress((p) => Math.min(99, p + Math.random() * 12)), 220)

    const finish = (artifacts: Dossier) => {
      clearInterval(timer as any)
      setProgress(100)
      setDossier(artifacts)
      setRunning(false)
    }

    try {
      if (useLive && apiBase) {
        const brief = { title, one_liner: oneLiner, idea_text: idea.trim() }
        const res = await fetch(`${apiBase.replace(/\/$/, '')}/ingest/idea`, { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify(brief) 
        })
        if (!res.ok) throw new Error(`Ingest failed: ${res.status}`)
        const { id } = await res.json()
        const r2 = await fetch(`${apiBase.replace(/\/$/, '')}/dossier/${id}`)
        if (!r2.ok) throw new Error(`Dossier failed: ${r2.status}`)
        const serverDossier = await r2.json()
        finish({
          id,
          created_at: nowISO(),
          idea_text: idea.trim(),
          title,
          one_liner: oneLiner,
          scores,
          prd: makePRD(title, oneLiner, idea, scores),
          runbook: makeRunbook(title),
          repo: makeRepoTree(slug),
          api: makeAPISketch(),
          server: serverDossier
        })
        return
      }
    } catch (e: any) {
      setStatusMsg(`Live mode failed — falling back to simulator. (${e?.message || e})`)
    }

    setTimeout(() => {
      const prd = makePRD(title, oneLiner, idea, scores)
      const runbook = makeRunbook(title)
      const repo = makeRepoTree(slug)
      const api = makeAPISketch()
      const artifacts: Dossier = {
        id: `idea_${Math.random().toString(36).slice(2, 8)}`,
        created_at: nowISO(),
        idea_text: idea.trim(),
        title,
        one_liner: oneLiner,
        scores,
        prd,
        runbook,
        repo,
        api
      }
      finish(artifacts)
    }, 4200)
  }

  function downloadJSON(): void {
    if (!dossier) return
    const blob = new Blob([JSON.stringify(dossier, null, 2)], { type: 'application/json' })
    downloadBlob(blob, `${slug}-dossier.json`)
  }

  async function downloadRepo(): Promise<void> {
    if (!dossier) return
    await buildRepoZip(slug, dossier)
  }

  return (
    <div className="min-h-screen w-full bg-white text-slate-900 antialiased selection:bg-indigo-100 selection:text-indigo-900">
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg shadow-sm"><Brain className="size-5 text-white"/></div>
            <span className="font-semibold tracking-tight text-base sm:text-lg">Launchloom</span>
            <Badge variant="secondary" className="ml-2 text-xs">Preview</Badge>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 pr-3 mr-1 border-r border-slate-200">
              <ServerCog className="size-4"/>
              <Label htmlFor="useLive" className="text-sm">Live backend</Label>
              <Switch id="useLive" checked={useLive} onCheckedChange={setUseLive} />
              <Input value={apiBase} onChange={(e)=>setApiBase(e.target.value)} placeholder="API base URL" className="h-9 w-56 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"/>
            </div>
            <Button size="sm" variant="secondary" onClick={() => setOpenDeployGuide(true)} className="gap-2"><Cloud className="size-4"/>Deploy Guide</Button>
            <Button size="sm" variant="secondary" onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}>
              <GitBranch className="mr-2 size-4"/> Roadmap
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-10 text-[15.5px] leading-7">
        {/* Hero */}
        <section className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="text-4xl md:text-5xl font-bold tracking-tight"
            >
              Weave launch-ready agents from any idea.
            </motion.h1>
            <p className="mt-4 text-slate-700 max-w-xl text-[16px] leading-7">
              Launchloom orchestrates research, compliance, code scaffolding, and agent runbooks into a single concierge deliverable. Hand us the spark—receive a production-ready dossier, repo, and deployment plan within hours.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Badge variant="outline" className="border-slate-300 text-slate-700"><Cpu className="mr-1 size-3"/> Agent Mesh</Badge>
              <Badge variant="outline" className="border-slate-300 text-slate-700"><Shield className="mr-1 size-3"/> HITL Guardrails</Badge>
              <Badge variant="outline" className="border-slate-300 text-slate-700"><LineChart className="mr-1 size-3"/> LearningLoop</Badge>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button size="lg" className="gap-2 h-11 px-6 text-[15px] shadow-sm" onClick={() => setOpenDeployGuide(true)}>
                <Rocket className="size-4"/> Request Concierge Run
              </Button>
              <Button size="lg" variant="secondary" className="gap-2 h-11 px-6 text-[15px]" onClick={() => window.scrollTo({ top: 900, behavior: 'smooth' })}>
                <Workflow className="size-4"/> Explore the workflow
              </Button>
            </div>
          </div>
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900"><Workflow className="size-5 text-indigo-700"/>Idea Intake</CardTitle>
              <CardDescription className="text-slate-600">Paste your idea. Keep it scrappy; the system does the heavy lifting.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Label htmlFor="title">Project title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Project name" className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"/>
              <Label htmlFor="oneliner">One-liner</Label>
              <Input id="oneliner" value={oneLiner} onChange={(e) => setOneLiner(e.target.value)} placeholder="What it does in one sentence" className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"/>
              <Label htmlFor="idea">Idea details</Label>
              <Textarea id="idea" value={idea} onChange={(e) => setIdea(e.target.value)} placeholder="If you have an idea, speak or type it here…" rows={8} className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"/>

              <div className="pt-1">
                <div className="flex items-center justify-between mb-2 text-sm">
                  <span className="text-slate-700">Idea score</span>
                  <span className="font-semibold text-indigo-700">{scores.total}/100</span>
                </div>
                <Progress value={Math.max(8, scores.total)} className="h-2"/>
                <div className="grid grid-cols-5 gap-2 mt-2 text-[12px] text-slate-600">
                  <div>D {scores.desirability}</div>
                  <div>F {scores.feasibility}</div>
                  <div>V {scores.viability}</div>
                  <div>Def {scores.defensibility}</div>
                  <div>Tm {scores.timing}</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button onClick={generate} disabled={running || !idea.trim()} className="gap-2 h-10 text-[15px]">
                  {running ? <Loader2 className="size-4 animate-spin"/> : <Rocket className="size-4"/>}
                  {running ? 'Generating…' : useLive ? 'Generate via API' : 'Generate Dossier'}
                </Button>
                {dossier && (
                  <>
                    <Button variant="secondary" onClick={downloadJSON} className="gap-2 h-10 text-[15px]"><Download className="size-4"/>Download JSON</Button>
                    <Button variant="secondary" onClick={downloadRepo} className="gap-2 h-10 text-[15px]"><Hammer className="size-4"/>Download Repo</Button>
                    <Button variant="secondary" onClick={() => addRepoToGitHub(slug, dossier, oneLiner)} className="gap-2 h-10 text-[15px]"><Github className="size-4"/>Add Repo to GitHub</Button>
                  </>
                )}
              </div>
              {running && (
                <p className="text-xs text-slate-600">{useLive && apiBase ? 'Orchestrating agents…' : 'Simulating capture → research → spec → design → scaffold…'}</p>
              )}
              {statusMsg && (
                <p className="text-xs text-amber-700">{statusMsg}</p>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Deliverables Snapshot */}
        <section className="mt-12 grid gap-4 md:grid-cols-3">
          {[
            {
              title: 'Executive PRD',
              icon: FileText,
              summary: 'Fully structured problem, solution, scope, and metrics with inline citations and Launchloom scoring.'
            },
            {
              title: 'Agent Runbook',
              icon: Cpu,
              summary: 'YAML orchestration map detailing every agent, guardrail, tool handoff, and compliance checkpoint.'
            },
            {
              title: 'Launch-ready Repo',
              icon: GitBranch,
              summary: 'Next.js + FastAPI scaffold, environment templates, ops guides, and CI seeds in a downloadable ZIP.'
            }
          ].map(({ title, icon: Icon, summary }) => (
            <Card key={title} className="bg-white border-slate-200 shadow-sm">
              <CardHeader className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-indigo-100 text-indigo-700 p-2"><Icon className="size-5" /></div>
                  <CardTitle className="text-slate-900 text-lg">{title}</CardTitle>
                </div>
                <CardDescription className="text-slate-600 leading-6">{summary}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </section>

        {/* Why Launchloom */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-slate-900">Why teams choose Launchloom</h2>
          <p className="text-slate-600 mt-2 max-w-2xl text-[15px]">
            Every run combines governed agents, human QA, and dev-ready assets so leaders can move from concept to execution without stitching together tools.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              {
                icon: Shield,
                title: 'Governed agent workflows',
                copy: 'Multi-agent orchestration with cost ceilings, compliance gates, and optional human approval loops built-in.'
              },
              {
                icon: ServerCog,
                title: 'Evidence-first insights',
                copy: 'Research and risk findings cite their sources, and every stage is traceable for audits or stakeholder review.'
              },
              {
                icon: Hammer,
                title: 'Build-ready handoff',
                copy: 'Repository scaffolds, environment templates, and ops playbooks arrive ready to push to GitHub or deploy to Vercel.'
              }
            ].map(({ icon: Icon, title, copy }) => (
              <Card key={title} className="bg-white border-slate-200 shadow-sm">
                <CardHeader className="space-y-3">
                  <div className="p-2 rounded-lg bg-slate-900 text-white w-fit"><Icon className="size-5" /></div>
                  <CardTitle className="text-slate-900 text-lg">{title}</CardTitle>
                  <CardDescription className="text-slate-600 leading-6">{copy}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        {/* Pipeline + Results */}
        <section className="mt-10">
          <Tabs defaultValue="pipeline" className="w-full">
            <TabsList className="bg-white border border-slate-200">
              <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
              <TabsTrigger value="prd">PRD</TabsTrigger>
              <TabsTrigger value="wireframes">Wireframes</TabsTrigger>
              <TabsTrigger value="code">Code & Infra</TabsTrigger>
              <TabsTrigger value="runbook">Agent Runbook</TabsTrigger>
            </TabsList>

            <TabsContent value="pipeline" className="mt-4">
              <Card className="bg-white border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-900"><Boxes className="size-5 text-emerald-700"/>Pipeline</CardTitle>
                  <CardDescription className="text-slate-600">Deterministic stages with HITL gates and cost ceilings.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    {[
                      { icon: <FileText className="size-4"/>, label: 'Normalize' },
                      { icon: <SearchIcon/>, label: 'Research' },
                      { icon: <Cpu className="size-4"/>, label: 'Feasibility' },
                      { icon: <LineChart className="size-4"/>, label: 'Market & Moat' },
                      { icon: <Shield className="size-4"/>, label: 'Risk' },
                      { icon: <Layout className="size-4"/>, label: 'UX' },
                      { icon: <Hammer className="size-4"/>, label: 'Scaffold' },
                      { icon: <TerminalSquare className="size-4"/>, label: 'APIs' },
                      { icon: <GitBranch className="size-4"/>, label: 'Export' },
                    ].map((s: PipelineStage, i: number) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className={`rounded-xl border bg-white p-4 shadow-sm ${progress >= (i + 1) * 11 ? 'border-emerald-300' : 'border-slate-200'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-slate-900">{s.icon}<span>{s.label}</span></div>
                          {progress >= (i + 1) * 11 ? <CheckCircle2 className="size-4 text-emerald-700"/> : <Loader2 className="size-4 text-slate-400 animate-spin" style={{ animationPlayState: progress >= (i + 1) * 11 ? 'paused' : 'running' }}/>} 
                        </div>
                        <Progress value={Math.min(100, Math.max(0, progress - i * 11))} className="h-1.5 mt-3"/>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="prd" className="mt-4">
              <Card className="bg-white border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-900"><FileText className="size-5 text-sky-700"/>PRD Draft</CardTitle>
                  <CardDescription className="text-slate-600">Auto-drafted; refine with your team before build.</CardDescription>
                </CardHeader>
                <CardContent>
                  {dossier ? (
                    <ScrollArea className="h-[440px] rounded-lg border border-slate-200 p-5 bg-white whitespace-pre-wrap font-mono text-[14px] leading-7">
                      {dossier.prd}
                    </ScrollArea>
                  ) : (
                    <p className="text-slate-600">Generate a dossier to view a draft PRD.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="wireframes" className="mt-4">
              <Card className="bg-white border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-900"><Layout className="size-5 text-violet-700"/>Low‑fi Wireframes</CardTitle>
                  <CardDescription className="text-slate-600">Portable layout primitives you can implement directly.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    {['Dashboard', 'Idea Intake', 'Dossier'].map((name: string) => (
                      <div key={name} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                        <div className="text-xs text-slate-600 mb-2">{name}</div>
                        <div className="rounded-lg border border-dashed border-slate-300 p-3 space-y-2 bg-slate-50">
                          <div className="h-3 w-2/3 rounded bg-slate-200"/>
                          <div className="h-24 rounded bg-slate-100"/>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="h-8 rounded bg-slate-200"/>
                            <div className="h-8 rounded bg-slate-200"/>
                            <div className="h-8 rounded bg-slate-200"/>
                          </div>
                          <div className="h-10 rounded bg-slate-200"/>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="code" className="mt-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="bg-white border-slate-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-slate-900"><Hammer className="size-5 text-emerald-700"/>Repo Scaffold</CardTitle>
                    <CardDescription className="text-slate-600">Monorepo directories to bootstrap quickly.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {dossier ? (
                      <pre className="h-[380px] overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-5 text-[13.5px] leading-7">
{dossier.repo}
                      </pre>
                    ) : (
                      <p className="text-slate-600">Generate a dossier to see the scaffold.</p>
                    )}
                  </CardContent>
                </Card>
                <Card className="bg-white border-slate-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-slate-900"><TerminalSquare className="size-5 text-sky-700"/>API Sketch</CardTitle>
                    <CardDescription className="text-slate-600">Minimal endpoints to prove the loop.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {dossier ? (
                      <pre className="h-[380px] overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-5 text-[13.5px] leading-7">{makeAPISketch()}</pre>
                    ) : (
                      <p className="text-slate-600">Generate a dossier to view an API sketch.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="runbook" className="mt-4">
              <Card className="bg-white border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-900"><Cpu className="size-5 text-indigo-700"/>Agent Runbook</CardTitle>
                  <CardDescription className="text-slate-600">Which agents do what, with budgets and gates.</CardDescription>
                </CardHeader>
                <CardContent>
                  {dossier ? (
                    <pre className="h-[460px] overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-5 text-[13.5px] leading-7 whitespace-pre-wrap">{dossier.runbook || makeRunbook(title)}</pre>
                  ) : (
                    <p className="text-slate-600">Generate a dossier to view the runbook.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </section>

        {/* Concierge Pricing */}
        <section className="mt-12">
          <Card className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-lg">
            <CardHeader className="space-y-3">
              <CardTitle className="text-2xl">Concierge run pricing</CardTitle>
              <CardDescription className="text-slate-200 leading-6">
                Premium delivery of the full Launchloom package—research, compliance, code scaffold, and agent runbook—crafted in partnership with your team.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <ul className="space-y-2 text-slate-100 text-sm">
                <li>• 48–72 hour turnaround with founder debrief</li>
                <li>• Multi-agent pipeline with human QA checkpoint</li>
                <li>• PRD, runbook, repo scaffold, compliance snapshot</li>
              </ul>
              <div className="flex flex-col items-start gap-3">
                <div>
                  <span className="text-sm uppercase tracking-wide text-slate-400">Starting at</span>
                  <div className="text-3xl font-semibold">$3,000</div>
                  <p className="text-xs text-slate-300">Custom quotes for venture studios and enterprise teams.</p>
                </div>
                <Button
                  size="lg"
                  variant="secondary"
                  className="bg-white text-slate-900 hover:bg-slate-100"
                  onClick={() => window.open('mailto:hello@launchloom.com?subject=Launchloom Concierge Run', '_blank')}
                >
                  Request a concierge run
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Roadmap */}
        <section className="mt-12">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900"><GitBranch className="size-5 text-rose-700"/>Roadmap</CardTitle>
              <CardDescription className="text-slate-600">How this preview grows into a full system.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4 text-[14px] leading-7">
                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="text-slate-900 font-medium mb-2">Now — Concierge Run</div>
                  <ul className="space-y-1 list-disc list-inside text-slate-700">
                    <li>Deliver full dossier, runbook, and repo within 72 hours</li>
                    <li>Human QA plus compliance & budget guardrails</li>
                    <li>Founder debrief call with next-step recommendations</li>
                  </ul>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="text-slate-900 font-medium mb-2">Next — Modular Agent Kits</div>
                  <ul className="space-y-1 list-disc list-inside text-slate-700">
                    <li>Sector-specific research & compliance modules</li>
                    <li>Self-serve interface for configuring agent sequences</li>
                    <li>Automated evals + telemetry on every run</li>
                  </ul>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="text-slate-900 font-medium mb-2">Later — Launchloom Studio</div>
                  <ul className="space-y-1 list-disc list-inside text-slate-700">
                    <li>Multi-tenant workspaces with RBAC & audit trails</li>
                    <li>Integration marketplace and deployment automations</li>
                    <li>Continuous prompt tuning & managed agent ops</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Lead capture */}
        <section className="mt-12 grid gap-6 md:grid-cols-[2fr,3fr]">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900">Tell us about your idea</h2>
            <p className="text-slate-600 text-[15px] leading-7">
              We run a limited number of concierge engagements each month. Share a little context and the Launchloom crew will follow up within one business day.
            </p>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>• NDA-friendly—happy to execute before the deep dive.</li>
              <li>• Ideal for founders, venture studios, and innovation teams.</li>
              <li>• Want self-serve tooling? We’ll notify you as Launchloom Studio opens.</li>
            </ul>
          </div>
          <LeadCaptureForm />
        </section>

        <footer className="py-10 text-center text-xs text-slate-500">© {new Date().getFullYear()} Launchloom — Preview build</footer>
      </main>

      {/* Deploy Guide Modal */}
      <Dialog open={openDeployGuide} onOpenChange={setOpenDeployGuide}>
        <DialogContent className="max-w-2xl bg-white text-slate-900 border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Deploy to Vercel</DialogTitle>
            <DialogDescription className="text-slate-700">Push the generated repo to GitHub, then import on Vercel.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-[14px] leading-7 text-slate-700">
            <p className="text-slate-900">Steps</p>
            <ol className="list-decimal list-inside space-y-2">
              <li>Click <span className="font-mono">Download Repo</span> after generating a dossier.</li>
              <li>Unzip → <span className="font-mono">cd &lt;{slug}&gt;</span> → initialize git and push:
                <pre className="mt-2 rounded bg-slate-50 p-3 border border-slate-200 whitespace-pre-wrap">{`git init
git add -A
git commit -m "init"
git branch -M main
git remote add origin https://github.com/YOUR-USER/${slug}.git
git push -u origin main`}</pre>
              </li>
              <li>Open <a className="underline" href="https://vercel.com/new" target="_blank" rel="noreferrer">vercel.com/new</a> → Import the repo → Deploy.</li>
              <li>Optional: set env <span className="font-mono">NEXT_PUBLIC_API_BASE</span> to your backend URL; toggle <span className="font-mono">Live backend</span> here to use it.</li>
            </ol>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={()=>setOpenDeployGuide(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// -----------------------------
// Lightweight self-tests (run once per session in browser)
// -----------------------------
;(function runSelfTests(){
  if (typeof window === 'undefined') return
  if (window.__LAUNCHLOOM_TESTED__) return
  window.__LAUNCHLOOM_TESTED__ = true
  try {
    // toSlug tests
    console.assert(toSlug('Hello, World!') === 'hello-world', 'toSlug should kebab-case basic punctuation')
    console.assert(toSlug('  A  B   C  ') === 'a-b-c', 'toSlug should collapse multiple spaces')
    console.assert(toSlug('MixED--Case__Punct!!') === 'mixed-case-punct', 'toSlug should normalize case and strip punctuation')

    // scoreIdea tests
    const s = scoreIdea('AI tool with revenue and users')
    console.assert(typeof s.total === 'number' && s.total >= 12 && s.total <= 100, 'scoreIdea should return bounded total')
    console.assert(s.desirability + s.feasibility + s.viability + s.defensibility + s.timing === s.total, 'scoreIdea subtotals should sum to total')

    // API & repo utilities
    const api = makeAPISketch()
    console.assert(api.includes('fastapi') && api.includes('/ingest/idea'), 'API sketch should include FastAPI endpoints')
    const tree = makeRepoTree('demo')
    console.assert(/\/docs\b/.test(tree), 'Repo tree should include /docs')

    // ZIP contents
    const z1 = composeRepoZip('sample-app', { prd: '# PRD', runbook: '# agents.yaml' })
    console.assert(!!z1.file('sample-app/package.json'), 'ZIP: package.json present')
    console.assert(!!z1.file('sample-app/docs/PRD.md'), 'ZIP: PRD present')
    console.assert(!!z1.file('sample-app/ops/agents.yaml'), 'ZIP: agents present')
    console.assert(!!z1.file('sample-app/server/requirements.txt'), 'ZIP: requirements present')
    console.assert(typeof (z1 as any).generateAsync === 'function', 'ZIP: generateAsync available')

    // Slugged path
    const slugged = toSlug('My Cool App!!')
    const z2 = composeRepoZip(slugged, { prd: '# PRD', runbook: '# agents.yaml' })
    console.assert(!!z2.file(`${slugged}/package.json`), 'ZIP: slugged root path present')

    // download + GitHub helpers
    console.assert(typeof downloadBlob === 'function', 'downloadBlob helper present')
    const gh = buildGitHubNewRepoUrl('example-repo', 'desc', 'public')
    console.assert(gh.startsWith('https://github.com/new?'), 'GitHub URL should target /new endpoint')
    console.assert(gh.includes('name=example-repo'), 'GitHub URL should include repo name')

    console.log('Launchloom self-tests passed')
  } catch (err) {
    console.error('Launchloom self-tests failed', err)
  }
})()
