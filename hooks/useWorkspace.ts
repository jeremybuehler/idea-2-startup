'use client'

import { useState, useCallback, useEffect } from 'react'
import { Workspace, WorkspaceMember, WorkspaceRunSummary } from '@/src/ai/types/workspace'

interface UseWorkspaceOptions {
  workspaceId?: string
  autoLoad?: boolean
}

interface UseWorkspaceReturn {
  workspace: Workspace | null
  workspaces: Workspace[]
  isLoading: boolean
  error: string | null
  loadWorkspace: (id: string) => Promise<void>
  loadWorkspaces: () => Promise<void>
  createWorkspace: (name: string, description?: string) => Promise<Workspace | null>
  addMember: (member: WorkspaceMember) => Promise<void>
  recordRun: (run: Omit<WorkspaceRunSummary, 'runId'>) => Promise<void>
}

export function useWorkspace(options: UseWorkspaceOptions = {}): UseWorkspaceReturn {
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadWorkspace = useCallback(async (id: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/workspaces/${encodeURIComponent(id)}?run_limit=10`)
      if (!response.ok) {
        if (response.status === 404) {
          setWorkspace(null)
          return
        }
        throw new Error(`Failed to load workspace: ${response.status}`)
      }
      const data = await response.json()
      setWorkspace({
        id: id,
        publicId: data.public_id,
        slug: data.slug,
        name: data.name,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        members: data.members?.map((m: { id: number; email: string; role: string }) => ({
          id: String(m.id),
          email: m.email,
          role: m.role
        })) || [],
        runs: data.runs || []
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workspace')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadWorkspaces = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/workspaces?limit=50')
      if (!response.ok) {
        throw new Error(`Failed to load workspaces: ${response.status}`)
      }
      const data = await response.json()
      setWorkspaces(data.items?.map((ws: { slug: string; public_id: string; name: string; created_at: string; updated_at: string }) => ({
        id: ws.slug,
        publicId: ws.public_id,
        slug: ws.slug,
        name: ws.name,
        createdAt: ws.created_at,
        updatedAt: ws.updated_at,
        members: [],
        runs: []
      })) || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workspaces')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createWorkspace = useCallback(async (name: string, description?: string): Promise<Workspace | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description })
      })

      if (!response.ok) {
        throw new Error(`Failed to create workspace: ${response.status}`)
      }

      const data = await response.json()
      const newWorkspace: Workspace = {
        id: data.slug,
        publicId: data.public_id,
        slug: data.slug,
        name: data.name,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        members: [],
        runs: []
      }

      setWorkspaces(prev => [...prev, newWorkspace])
      return newWorkspace
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create workspace')
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const addMember = useCallback(async (member: WorkspaceMember) => {
    if (!workspace) return

    setWorkspace(prev => {
      if (!prev) return null
      const members = prev.members.filter(m => m.id !== member.id)
      members.push(member)
      return { ...prev, members }
    })
  }, [workspace])

  const recordRun = useCallback(async (run: Omit<WorkspaceRunSummary, 'runId'>) => {
    if (!workspace) return

    const runId = `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

    try {
      await fetch(`/api/workspaces/${encodeURIComponent(workspace.id)}/runs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          run_id: runId,
          idea_title: run.idea,
          idea_slug: run.ideaSlug,
          idea_one_liner: run.ideaOneLiner,
          idea_text: run.ideaText,
          compliance_status: run.complianceStatus,
          evaluation_score: run.evaluationScore,
          overall_quality: run.overallQuality,
          total_cost: run.cost,
          duration_ms: run.durationMs
        })
      })

      const newRun: WorkspaceRunSummary = {
        ...run,
        runId,
        createdAt: new Date().toISOString()
      }

      setWorkspace(prev => {
        if (!prev) return null
        return {
          ...prev,
          runs: [newRun, ...prev.runs.filter(r => r.runId !== runId)]
        }
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record run')
    }
  }, [workspace])

  // Auto-load workspace on mount if ID provided
  useEffect(() => {
    if (options.autoLoad && options.workspaceId) {
      loadWorkspace(options.workspaceId)
    }
  }, [options.autoLoad, options.workspaceId, loadWorkspace])

  return {
    workspace,
    workspaces,
    isLoading,
    error,
    loadWorkspace,
    loadWorkspaces,
    createWorkspace,
    addMember,
    recordRun
  }
}
