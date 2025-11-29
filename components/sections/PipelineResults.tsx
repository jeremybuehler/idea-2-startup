'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
  FileText,
  Cpu,
  LineChart,
  Shield,
  Layout,
  Hammer,
  TerminalSquare,
  GitBranch,
  Boxes,
  CheckCircle2,
  Loader2
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { Dossier } from '@/types'
import { TemplateGenerator } from '@/lib/business-logic'

function SearchIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="size-4"
    >
      <path
        fillRule="evenodd"
        d="M10.5 3.75a6.75 6.75 0 1 0 4.256 11.93l4.282 4.282a.75.75 0 1 0 1.06-1.06l-4.282-4.282A6.75 6.75 0 0 0 10.5 3.75Zm-5.25 6.75a5.25 5.25 0 1 1 10.5 0 5.25 5.25 0 0 1-10.5 0Z"
        clipRule="evenodd"
      />
    </svg>
  )
}

interface PipelineStageItem {
  icon: React.ReactNode
  label: string
}

const pipelineStages: PipelineStageItem[] = [
  { icon: <FileText className="size-4" />, label: 'Normalize' },
  { icon: <SearchIcon />, label: 'Research' },
  { icon: <Cpu className="size-4" />, label: 'Feasibility' },
  { icon: <LineChart className="size-4" />, label: 'Market & Moat' },
  { icon: <Shield className="size-4" />, label: 'Risk' },
  { icon: <Layout className="size-4" />, label: 'UX' },
  { icon: <Hammer className="size-4" />, label: 'Scaffold' },
  { icon: <TerminalSquare className="size-4" />, label: 'APIs' },
  { icon: <GitBranch className="size-4" />, label: 'Export' }
]

interface PipelineResultsProps {
  progress: number
  dossier: Dossier | null
  title: string
}

export function PipelineResults({ progress, dossier, title }: PipelineResultsProps) {
  return (
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
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <Boxes className="size-5 text-emerald-700" />
                Pipeline
              </CardTitle>
              <CardDescription className="text-slate-600">
                Deterministic stages with HITL gates and cost ceilings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                {pipelineStages.map((s, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={`rounded-xl border bg-white p-4 shadow-sm ${
                      progress >= (i + 1) * 11
                        ? 'border-emerald-300'
                        : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-900">
                        {s.icon}
                        <span>{s.label}</span>
                      </div>
                      {progress >= (i + 1) * 11 ? (
                        <CheckCircle2 className="size-4 text-emerald-700" />
                      ) : (
                        <Loader2
                          className="size-4 text-slate-400 animate-spin"
                          style={{
                            animationPlayState:
                              progress >= (i + 1) * 11 ? 'paused' : 'running'
                          }}
                        />
                      )}
                    </div>
                    <Progress
                      value={Math.min(100, Math.max(0, progress - i * 11))}
                      className="h-1.5 mt-3"
                    />
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prd" className="mt-4">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <FileText className="size-5 text-sky-700" />
                PRD Draft
              </CardTitle>
              <CardDescription className="text-slate-600">
                Auto-drafted; refine with your team before build.
              </CardDescription>
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
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <Layout className="size-5 text-violet-700" />
                Low-fi Wireframes
              </CardTitle>
              <CardDescription className="text-slate-600">
                Portable layout primitives you can implement directly.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                {['Dashboard', 'Idea Intake', 'Dossier'].map((name) => (
                  <div
                    key={name}
                    className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
                  >
                    <div className="text-xs text-slate-600 mb-2">{name}</div>
                    <div className="rounded-lg border border-dashed border-slate-300 p-3 space-y-2 bg-slate-50">
                      <div className="h-3 w-2/3 rounded bg-slate-200" />
                      <div className="h-24 rounded bg-slate-100" />
                      <div className="grid grid-cols-3 gap-2">
                        <div className="h-8 rounded bg-slate-200" />
                        <div className="h-8 rounded bg-slate-200" />
                        <div className="h-8 rounded bg-slate-200" />
                      </div>
                      <div className="h-10 rounded bg-slate-200" />
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
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <Hammer className="size-5 text-emerald-700" />
                  Repo Scaffold
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Monorepo directories to bootstrap quickly.
                </CardDescription>
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
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <TerminalSquare className="size-5 text-sky-700" />
                  API Sketch
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Minimal endpoints to prove the loop.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {dossier ? (
                  <pre className="h-[380px] overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-5 text-[13.5px] leading-7">
                    {TemplateGenerator.makeAPISketch()}
                  </pre>
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
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <Cpu className="size-5 text-indigo-700" />
                Agent Runbook
              </CardTitle>
              <CardDescription className="text-slate-600">
                Which agents do what, with budgets and gates.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dossier ? (
                <pre className="h-[460px] overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-5 text-[13.5px] leading-7 whitespace-pre-wrap">
                  {dossier.runbook || TemplateGenerator.makeRunbook(title)}
                </pre>
              ) : (
                <p className="text-slate-600">Generate a dossier to view the runbook.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </section>
  )
}
