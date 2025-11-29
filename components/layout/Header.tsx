'use client'

import React from 'react'
import { Brain, ServerCog, Cloud, GitBranch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

interface HeaderProps {
  useLive: boolean
  onUseLiveChange: (value: boolean) => void
  apiBase: string
  onApiBaseChange: (value: string) => void
  onDeployGuideClick: () => void
  onRoadmapClick: () => void
}

export function Header({
  useLive,
  onUseLiveChange,
  apiBase,
  onApiBaseChange,
  onDeployGuideClick,
  onRoadmapClick
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-200">
      <div className="mx-auto max-w-6xl px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg shadow-sm">
            <Brain className="size-5 text-white" />
          </div>
          <span className="font-semibold tracking-tight text-base sm:text-lg">
            Launchloom
          </span>
          <Badge variant="secondary" className="ml-2 text-xs">
            Preview
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 pr-3 mr-1 border-r border-slate-200">
            <ServerCog className="size-4" />
            <Label htmlFor="useLive" className="text-sm">
              Live backend
            </Label>
            <Switch
              id="useLive"
              checked={useLive}
              onCheckedChange={onUseLiveChange}
            />
            <Input
              value={apiBase}
              onChange={(e) => onApiBaseChange(e.target.value)}
              placeholder="API base URL"
              className="h-9 w-56 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
            />
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={onDeployGuideClick}
            className="gap-2"
          >
            <Cloud className="size-4" />
            Deploy Guide
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={onRoadmapClick}
          >
            <GitBranch className="mr-2 size-4" />
            Roadmap
          </Button>
        </div>
      </div>
    </header>
  )
}
