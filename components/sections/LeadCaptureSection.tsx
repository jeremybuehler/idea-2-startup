'use client'

import React from 'react'
import { LeadCaptureForm } from '@/components/lead-capture-form'

export function LeadCaptureSection() {
  return (
    <section className="mt-12 grid gap-6 md:grid-cols-[2fr,3fr]">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Tell us about your idea</h2>
        <p className="text-slate-600 text-[15px] leading-7">
          We run a limited number of concierge engagements each month. Share a little context
          and the Launchloom crew will follow up within one business day.
        </p>
        <ul className="space-y-2 text-sm text-slate-600">
          <li>&bull; NDA-friendly&mdash;happy to execute before the deep dive.</li>
          <li>&bull; Ideal for founders, venture studios, and innovation teams.</li>
          <li>
            &bull; Want self-serve tooling? We&apos;ll notify you as Launchloom Studio opens.
          </li>
        </ul>
      </div>
      <LeadCaptureForm />
    </section>
  )
}
