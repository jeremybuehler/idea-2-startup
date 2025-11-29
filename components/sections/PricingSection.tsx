'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function PricingSection() {
  return (
    <section className="mt-12">
      <Card className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-lg">
        <CardHeader className="space-y-3">
          <CardTitle className="text-2xl">Concierge run pricing</CardTitle>
          <CardDescription className="text-slate-200 leading-6">
            Premium delivery of the full Launchloom package&mdash;research, compliance, code
            scaffold, and agent runbook&mdash;crafted in partnership with your team.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <ul className="space-y-2 text-slate-100 text-sm">
            <li>&bull; 48&ndash;72 hour turnaround with founder debrief</li>
            <li>&bull; Multi-agent pipeline with human QA checkpoint</li>
            <li>&bull; PRD, runbook, repo scaffold, compliance snapshot</li>
          </ul>
          <div className="flex flex-col items-start gap-3">
            <div>
              <span className="text-sm uppercase tracking-wide text-slate-400">Starting at</span>
              <div className="text-3xl font-semibold">$3,000</div>
              <p className="text-xs text-slate-300">
                Custom quotes for venture studios and enterprise teams.
              </p>
            </div>
            <Button
              size="lg"
              variant="secondary"
              className="bg-white text-slate-900 hover:bg-slate-100"
              onClick={() =>
                window.open(
                  'mailto:hello@launchloom.com?subject=Launchloom Concierge Run',
                  '_blank'
                )
              }
            >
              Request a concierge run
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
