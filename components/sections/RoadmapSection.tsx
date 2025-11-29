'use client'

import React from 'react'
import { GitBranch } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const roadmapPhases = [
  {
    phase: 'Now — Concierge Run',
    items: [
      'Deliver full dossier, runbook, and repo within 72 hours',
      'Human QA plus compliance & budget guardrails',
      'Founder debrief call with next-step recommendations'
    ]
  },
  {
    phase: 'Next — Modular Agent Kits',
    items: [
      'Sector-specific research & compliance modules',
      'Self-serve interface for configuring agent sequences',
      'Automated evals + telemetry on every run'
    ]
  },
  {
    phase: 'Later — Launchloom Studio',
    items: [
      'Multi-tenant workspaces with RBAC & audit trails',
      'Integration marketplace and deployment automations',
      'Continuous prompt tuning & managed agent ops'
    ]
  }
]

export function RoadmapSection() {
  return (
    <section className="mt-12" id="roadmap">
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <GitBranch className="size-5 text-rose-700" />
            Roadmap
          </CardTitle>
          <CardDescription className="text-slate-600">
            How this preview grows into a full system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4 text-[14px] leading-7">
            {roadmapPhases.map(({ phase, items }) => (
              <div
                key={phase}
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="text-slate-900 font-medium mb-2">{phase}</div>
                <ul className="space-y-1 list-disc list-inside text-slate-700">
                  {items.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
