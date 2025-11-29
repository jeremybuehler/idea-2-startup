'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Cpu, Shield, LineChart, Rocket, Workflow } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface HeroSectionProps {
  onRequestConcierge: () => void
  onExploreWorkflow: () => void
}

export function HeroSection({ onRequestConcierge, onExploreWorkflow }: HeroSectionProps) {
  return (
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
        Launchloom orchestrates research, compliance, code scaffolding, and agent runbooks
        into a single concierge deliverable. Hand us the spark&mdash;receive a production-ready
        dossier, repo, and deployment plan within hours.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Badge variant="outline" className="border-slate-300 text-slate-700">
          <Cpu className="mr-1 size-3" /> Agent Mesh
        </Badge>
        <Badge variant="outline" className="border-slate-300 text-slate-700">
          <Shield className="mr-1 size-3" /> HITL Guardrails
        </Badge>
        <Badge variant="outline" className="border-slate-300 text-slate-700">
          <LineChart className="mr-1 size-3" /> LearningLoop
        </Badge>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button
          size="lg"
          className="gap-2 h-11 px-6 text-[15px] shadow-sm"
          onClick={onRequestConcierge}
        >
          <Rocket className="size-4" /> Request Concierge Run
        </Button>
        <Button
          size="lg"
          variant="secondary"
          className="gap-2 h-11 px-6 text-[15px]"
          onClick={onExploreWorkflow}
        >
          <Workflow className="size-4" /> Explore the workflow
        </Button>
      </div>
    </div>
  )
}
