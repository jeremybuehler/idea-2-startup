import { Workspace, WorkspaceMember, WorkspaceRunSummary } from '../types/workspace'

export class WorkspaceService {
  private workspaces = new Map<string, Workspace>()

  ensureWorkspace(id: string, name?: string): Workspace {
    const existing = this.workspaces.get(id)
    if (existing) return existing
    const workspace: Workspace = {
      id,
      name: name ?? `Workspace ${id}`,
      createdAt: new Date().toISOString(),
      members: [],
      runs: []
    }
    this.workspaces.set(id, workspace)
    return workspace
  }

  addMember(workspaceId: string, member: WorkspaceMember): void {
    const workspace = this.ensureWorkspace(workspaceId)
    const already = workspace.members.find(m => m.id === member.id)
    if (already) {
      already.role = member.role
      already.email = member.email
      return
    }
    workspace.members.push(member)
  }

  recordRun(workspaceId: string, run: WorkspaceRunSummary): void {
    const workspace = this.ensureWorkspace(workspaceId)
    workspace.runs.unshift(run)
    if (workspace.runs.length > 100) {
      workspace.runs.length = 100
    }
  }

  getWorkspace(id: string): Workspace | undefined {
    return this.workspaces.get(id)
  }

  listWorkspaces(): Workspace[] {
    return Array.from(this.workspaces.values())
  }
}
