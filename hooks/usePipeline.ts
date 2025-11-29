'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { IdeaScores, Dossier } from '@/types'
import { scoreIdea, toSlug, TemplateGenerator, nowISO } from '@/lib/business-logic'
import { getApiConfig } from '@/lib/env'

export type PipelineStage =
  | 'normalize'
  | 'research'
  | 'feasibility'
  | 'market_moat'
  | 'risk_assessment'
  | 'ux_design'
  | 'code_scaffold'
  | 'api_design'
  | 'export'

export interface PipelineState {
  isRunning: boolean
  progress: number
  currentStage: PipelineStage | null
  stageStatuses: Record<PipelineStage, 'pending' | 'running' | 'completed' | 'failed'>
  dossier: Dossier | null
  error: string | null
  statusMessage: string | null
}

export interface PipelineInput {
  title: string
  oneLiner: string
  ideaText: string
}

const STAGES: PipelineStage[] = [
  'normalize',
  'research',
  'feasibility',
  'market_moat',
  'risk_assessment',
  'ux_design',
  'code_scaffold',
  'api_design',
  'export'
]

const STAGE_LABELS: Record<PipelineStage, string> = {
  normalize: 'Normalize',
  research: 'Research',
  feasibility: 'Feasibility',
  market_moat: 'Market & Moat',
  risk_assessment: 'Risk',
  ux_design: 'UX',
  code_scaffold: 'Scaffold',
  api_design: 'APIs',
  export: 'Export'
}

const initialStageStatuses: Record<PipelineStage, 'pending' | 'running' | 'completed' | 'failed'> = {
  normalize: 'pending',
  research: 'pending',
  feasibility: 'pending',
  market_moat: 'pending',
  risk_assessment: 'pending',
  ux_design: 'pending',
  code_scaffold: 'pending',
  api_design: 'pending',
  export: 'pending'
}

export function usePipeline() {
  const [state, setState] = useState<PipelineState>({
    isRunning: false,
    progress: 0,
    currentStage: null,
    stageStatuses: { ...initialStageStatuses },
    dossier: null,
    error: null,
    statusMessage: null
  })

  const wsRef = useRef<WebSocket | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const reset = useCallback(() => {
    setState({
      isRunning: false,
      progress: 0,
      currentStage: null,
      stageStatuses: { ...initialStageStatuses },
      dossier: null,
      error: null,
      statusMessage: null
    })
  }, [])

  const updateStageStatus = useCallback((stage: PipelineStage, status: 'pending' | 'running' | 'completed' | 'failed') => {
    setState(prev => ({
      ...prev,
      stageStatuses: {
        ...prev.stageStatuses,
        [stage]: status
      }
    }))
  }, [])

  const runSimulatedPipeline = useCallback(async (input: PipelineInput, scores: IdeaScores): Promise<Dossier> => {
    const slug = toSlug(input.title)

    // Simulate stage progression
    for (let i = 0; i < STAGES.length; i++) {
      const stage = STAGES[i]

      setState(prev => ({
        ...prev,
        currentStage: stage,
        stageStatuses: {
          ...prev.stageStatuses,
          [stage]: 'running'
        }
      }))

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 200))

      setState(prev => ({
        ...prev,
        progress: ((i + 1) / STAGES.length) * 100,
        stageStatuses: {
          ...prev.stageStatuses,
          [stage]: 'completed'
        }
      }))
    }

    // Generate dossier
    const dossier: Dossier = {
      id: `idea_${Math.random().toString(36).slice(2, 8)}`,
      created_at: nowISO(),
      idea_text: input.ideaText.trim(),
      title: input.title,
      one_liner: input.oneLiner,
      scores,
      prd: TemplateGenerator.makePRD(input.title, input.oneLiner, input.ideaText, scores),
      runbook: TemplateGenerator.makeRunbook(input.title),
      repo: TemplateGenerator.makeRepoTree(slug),
      api: TemplateGenerator.makeAPISketch()
    }

    return dossier
  }, [])

  const runLivePipeline = useCallback(async (
    input: PipelineInput,
    scores: IdeaScores,
    apiBase: string
  ): Promise<Dossier> => {
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    const brief = {
      title: input.title,
      one_liner: input.oneLiner,
      idea_text: input.ideaText.trim()
    }

    // Start pipeline
    const res = await fetch(`${apiBase.replace(/\/$/, '')}/pipeline/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(brief),
      signal: abortController.signal
    })

    if (!res.ok) {
      throw new Error(`Pipeline start failed: ${res.status}`)
    }

    const { execution_id } = await res.json()

    // Connect to WebSocket for progress updates
    const wsUrl = apiBase.replace('http', 'ws').replace(/\/$/, '') + `/pipeline/${execution_id}/ws`

    return new Promise((resolve, reject) => {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data)

        if (data.type === 'stage:started') {
          updateStageStatus(data.stage, 'running')
          setState(prev => ({ ...prev, currentStage: data.stage }))
        } else if (data.type === 'stage:completed') {
          updateStageStatus(data.stage, 'completed')
          setState(prev => ({ ...prev, progress: data.progress?.percentage || prev.progress }))
        } else if (data.type === 'stage:failed') {
          updateStageStatus(data.stage, 'failed')
        } else if (data.type === 'pipeline:completed') {
          ws.close()
          resolve(data.dossier)
        } else if (data.type === 'pipeline:failed') {
          ws.close()
          reject(new Error(data.error || 'Pipeline failed'))
        }
      }

      ws.onerror = () => {
        reject(new Error('WebSocket connection failed'))
      }

      ws.onclose = () => {
        wsRef.current = null
      }

      // Timeout after 10 minutes
      setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close()
          reject(new Error('Pipeline timeout'))
        }
      }, 10 * 60 * 1000)
    })
  }, [updateStageStatus])

  const generate = useCallback(async (input: PipelineInput, useLive: boolean = false) => {
    if (!input.ideaText.trim()) {
      setState(prev => ({ ...prev, error: 'Please enter an idea' }))
      return
    }

    setState({
      isRunning: true,
      progress: 0,
      currentStage: null,
      stageStatuses: { ...initialStageStatuses },
      dossier: null,
      error: null,
      statusMessage: useLive ? 'Connecting to pipeline...' : 'Starting simulated pipeline...'
    })

    const scores = scoreIdea(input.ideaText || input.oneLiner)
    const apiConfig = getApiConfig()

    try {
      let dossier: Dossier

      if (useLive && apiConfig.baseUrl) {
        try {
          setState(prev => ({ ...prev, statusMessage: 'Running live pipeline...' }))
          dossier = await runLivePipeline(input, scores, apiConfig.baseUrl)
        } catch (liveError) {
          // Fallback to simulated
          setState(prev => ({
            ...prev,
            statusMessage: `Live mode failed, falling back to simulator. (${liveError instanceof Error ? liveError.message : 'Unknown error'})`
          }))
          dossier = await runSimulatedPipeline(input, scores)
        }
      } else {
        dossier = await runSimulatedPipeline(input, scores)
      }

      setState(prev => ({
        ...prev,
        isRunning: false,
        progress: 100,
        currentStage: null,
        dossier,
        statusMessage: null
      }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        isRunning: false,
        error: error instanceof Error ? error.message : 'Pipeline failed',
        statusMessage: null
      }))
    }
  }, [runSimulatedPipeline, runLivePipeline])

  const cancel = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    setState(prev => ({
      ...prev,
      isRunning: false,
      statusMessage: 'Pipeline cancelled'
    }))
  }, [])

  return {
    ...state,
    stages: STAGES,
    stageLabels: STAGE_LABELS,
    generate,
    cancel,
    reset
  }
}
