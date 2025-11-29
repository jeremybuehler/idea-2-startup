'use client'

import React from 'react'
import { FileText, Cpu, GitBranch } from 'lucide-react'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const deliverables = [
  {
    title: 'Executive PRD',
    icon: FileText,
    summary:
      'Fully structured problem, solution, scope, and metrics with inline citations and Launchloom scoring.'
  },
  {
    title: 'Agent Runbook',
    icon: Cpu,
    summary:
      'YAML orchestration map detailing every agent, guardrail, tool handoff, and compliance checkpoint.'
  },
  {
    title: 'Launch-ready Repo',
    icon: GitBranch,
    summary:
      'Next.js + FastAPI scaffold, environment templates, ops guides, and CI seeds in a downloadable ZIP.'
  }
]

export function DeliverablesSnapshot() {
  return (
    <section className="mt-12 grid gap-4 md:grid-cols-3">
      {deliverables.map(({ title, icon: Icon, summary }) => (
        <Card key={title} className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-indigo-100 text-indigo-700 p-2">
                <Icon className="size-5" />
              </div>
              <CardTitle className="text-slate-900 text-lg">{title}</CardTitle>
            </div>
            <CardDescription className="text-slate-600 leading-6">
              {summary}
            </CardDescription>
          </CardHeader>
        </Card>
      ))}
    </section>
  )
}
