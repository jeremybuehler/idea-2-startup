"""Workspace management API."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import Field
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_session
from app.schemas.workspace import (
    WorkspaceCreate,
    WorkspaceListResponse,
    WorkspaceMemberCreate,
    WorkspaceRead,
    WorkspaceRunCreate,
    WorkspaceRunListResponse,
    WorkspaceRunRead,
    WorkspaceWithRuns,
)
from app.services.workspaces import (
    WorkspaceAlreadyExistsError,
    create_workspace,
    create_workspace_run,
    get_workspace_by_public_id,
    get_workspace_by_slug,
    get_workspace_run_by_public_ids,
    list_workspace_runs,
    list_workspaces,
)

router = APIRouter(prefix="/workspaces", tags=["workspaces"])


class WorkspaceCreateRequest(WorkspaceCreate):
    members: list[WorkspaceMemberCreate] = Field(default_factory=list)


class WorkspaceRunCreateRequest(WorkspaceRunCreate):
    pass


async def _resolve_workspace(db: AsyncSession, workspace_id: str):
    workspace = await get_workspace_by_public_id(db, workspace_id)
    if not workspace:
        workspace = await get_workspace_by_slug(db, workspace_id)
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
    return workspace


@router.post("/", response_model=WorkspaceRead, status_code=status.HTTP_201_CREATED)
async def create_workspace_endpoint(
    payload: WorkspaceCreateRequest,
    db: AsyncSession = Depends(get_db_session),
) -> WorkspaceRead:
    try:
        workspace = await create_workspace(db, payload, payload.members)
    except WorkspaceAlreadyExistsError:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Workspace slug already exists")
    return workspace


@router.get("/", response_model=WorkspaceListResponse)
async def list_workspaces_endpoint(
    db: AsyncSession = Depends(get_db_session),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> WorkspaceListResponse:
    workspaces, total = await list_workspaces(db, limit=limit, offset=offset)
    return WorkspaceListResponse(items=workspaces, total=total)


@router.get("/{workspace_id}", response_model=WorkspaceWithRuns)
async def get_workspace_endpoint(
    workspace_id: str,
    db: AsyncSession = Depends(get_db_session),
    run_limit: int = Query(10, ge=1, le=100, description="Number of recent runs to include"),
) -> WorkspaceWithRuns:
    workspace = await _resolve_workspace(db, workspace_id)
    runs, _ = await list_workspace_runs(db, workspace, limit=run_limit, offset=0)
    workspace.runs = runs  # type: ignore[attr-defined]
    return workspace


@router.get("/{workspace_id}/runs", response_model=WorkspaceRunListResponse)
async def list_workspace_runs_endpoint(
    workspace_id: str,
    db: AsyncSession = Depends(get_db_session),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
) -> WorkspaceRunListResponse:
    workspace = await _resolve_workspace(db, workspace_id)
    runs, total = await list_workspace_runs(db, workspace, limit=limit, offset=offset)
    return WorkspaceRunListResponse(items=runs, total=total)


@router.post("/{workspace_id}/runs", response_model=WorkspaceRunRead, status_code=status.HTTP_201_CREATED)
async def create_workspace_run_endpoint(
    workspace_id: str,
    payload: WorkspaceRunCreateRequest,
    db: AsyncSession = Depends(get_db_session),
) -> WorkspaceRunRead:
    workspace = await _resolve_workspace(db, workspace_id)
    try:
        run = await create_workspace_run(db, workspace, payload)
    except IntegrityError:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Run with this identifier already exists")
    return run


@router.get("/{workspace_id}/runs/{run_id}", response_model=WorkspaceRunRead)
async def get_workspace_run_endpoint(
    workspace_id: str,
    run_id: str,
    db: AsyncSession = Depends(get_db_session),
) -> WorkspaceRunRead:
    run = await get_workspace_run_by_public_ids(db, workspace_public_id=workspace_id, run_id=run_id)
    if not run:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Run not found")
    return run
