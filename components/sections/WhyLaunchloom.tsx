'use client'

import React from 'react'
import { Shield, ServerCog, Hammer } from 'lucide-react'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const reasons = [
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
]

export function WhyLaunchloom() {
  return (
    <section className="mt-12">
      <h2 className="text-2xl font-bold text-slate-900">Why teams choose Launchloom</h2>
      <p className="text-slate-600 mt-2 max-w-2xl text-[15px]">
        Every run combines governed agents, human QA, and dev-ready assets so leaders can
        move from concept to execution without stitching together tools.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {reasons.map(({ icon: Icon, title, copy }) => (
          <Card key={title} className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="space-y-3">
              <div className="p-2 rounded-lg bg-slate-900 text-white w-fit">
                <Icon className="size-5" />
              </div>
              <CardTitle className="text-slate-900 text-lg">{title}</CardTitle>
              <CardDescription className="text-slate-600 leading-6">{copy}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </section>
  )
}
