'use client'

import React from 'react'
import {
  Workflow,
  Rocket,
  Loader2,
  Download,
  Hammer,
  Github
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { IdeaScores, Dossier } from '@/types'

interface IdeaIntakeCardProps {
  title: string
  onTitleChange: (value: string) => void
  oneLiner: string
  onOneLinerChange: (value: string) => void
  idea: string
  onIdeaChange: (value: string) => void
  scores: IdeaScores
  running: boolean
  useLive: boolean
  apiBase: string
  dossier: Dossier | null
  statusMsg: string | null
  onGenerate: () => void
  onDownloadJSON: () => void
  onDownloadRepo: () => void
  onAddToGitHub: () => void
}

export function IdeaIntakeCard({
  title,
  onTitleChange,
  oneLiner,
  onOneLinerChange,
  idea,
  onIdeaChange,
  scores,
  running,
  useLive,
  apiBase,
  dossier,
  statusMsg,
  onGenerate,
  onDownloadJSON,
  onDownloadRepo,
  onAddToGitHub
}: IdeaIntakeCardProps) {
  return (
    <Card className="bg-white border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-900">
          <Workflow className="size-5 text-indigo-700" />
          Idea Intake
        </CardTitle>
        <CardDescription className="text-slate-600">
          Paste your idea. Keep it scrappy; the system does the heavy lifting.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Label htmlFor="title">Project title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Project name"
          className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
        />
        <Label htmlFor="oneliner">One-liner</Label>
        <Input
          id="oneliner"
          value={oneLiner}
          onChange={(e) => onOneLinerChange(e.target.value)}
          placeholder="What it does in one sentence"
          className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
        />
        <Label htmlFor="idea">Idea details</Label>
        <Textarea
          id="idea"
          value={idea}
          onChange={(e) => onIdeaChange(e.target.value)}
          placeholder="If you have an idea, speak or type it here..."
          rows={8}
          className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
        />

        <div className="pt-1">
          <div className="flex items-center justify-between mb-2 text-sm">
            <span className="text-slate-700">Idea score</span>
            <span className="font-semibold text-indigo-700">{scores.total}/100</span>
          </div>
          <Progress value={Math.max(8, scores.total)} className="h-2" />
          <div className="grid grid-cols-5 gap-2 mt-2 text-[12px] text-slate-600">
            <div>D {scores.desirability}</div>
            <div>F {scores.feasibility}</div>
            <div>V {scores.viability}</div>
            <div>Def {scores.defensibility}</div>
            <div>Tm {scores.timing}</div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button
            onClick={onGenerate}
            disabled={running || !idea.trim()}
            className="gap-2 h-10 text-[15px]"
          >
            {running ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Rocket className="size-4" />
            )}
            {running
              ? 'Generating...'
              : useLive
              ? 'Generate via API'
              : 'Generate Dossier'}
          </Button>
          {dossier && (
            <>
              <Button
                variant="secondary"
                onClick={onDownloadJSON}
                className="gap-2 h-10 text-[15px]"
              >
                <Download className="size-4" />
                Download JSON
              </Button>
              <Button
                variant="secondary"
                onClick={onDownloadRepo}
                className="gap-2 h-10 text-[15px]"
              >
                <Hammer className="size-4" />
                Download Repo
              </Button>
              <Button
                variant="secondary"
                onClick={onAddToGitHub}
                className="gap-2 h-10 text-[15px]"
              >
                <Github className="size-4" />
                Add Repo to GitHub
              </Button>
            </>
          )}
        </div>
        {running && (
          <p className="text-xs text-slate-600">
            {useLive && apiBase
              ? 'Orchestrating agents...'
              : 'Simulating capture → research → spec → design → scaffold...'}
          </p>
        )}
        {statusMsg && (
          <p className="text-xs text-amber-700">{statusMsg}</p>
        )}
      </CardContent>
    </Card>
  )
}
