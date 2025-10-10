"""Workspace persistence helpers."""

from __future__ import annotations

from typing import Iterable, Optional

from slugify import slugify
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.workspace import (
    MembershipStatus,
    Workspace,
    WorkspaceMember,
    WorkspaceRole,
    WorkspaceRun,
)
from app.schemas.workspace import (
    WorkspaceCreate,
    WorkspaceMemberCreate,
    WorkspaceRunCreate,
)


class WorkspaceAlreadyExistsError(ValueError):
    """Raised when attempting to create a workspace with a duplicate slug."""


async def _generate_unique_slug(db: AsyncSession, name: str) -> str:
    base_slug = slugify(name) or "workspace"
    slug_candidate = base_slug
    counter = 1

    while True:
        result = await db.execute(select(Workspace.id).where(Workspace.slug == slug_candidate))
        if result.scalar_one_or_none() is None:
            return slug_candidate
        counter += 1
        slug_candidate = f"{base_slug}-{counter}"


async def create_workspace(
    db: AsyncSession,
    payload: WorkspaceCreate,
    members: Optional[Iterable[WorkspaceMemberCreate]] = None,
) -> Workspace:
    slug = payload.slug or await _generate_unique_slug(db, payload.name)
    workspace = Workspace(
        name=payload.name,
        slug=slug,
        description=payload.description,
        settings=payload.settings,
        is_active=payload.is_active,
        created_by_id=payload.created_by_id,
    )

    if members:
        for member in members:
            workspace.members.append(
                WorkspaceMember(
                    email=member.email,
                    role=member.role,
                    status=MembershipStatus.ACTIVE if member.role == WorkspaceRole.OWNER else MembershipStatus.INVITED,
                )
            )

    db.add(workspace)
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise WorkspaceAlreadyExistsError(str(exc)) from exc

    await db.refresh(workspace, attribute_names=["members"])
    return workspace


async def list_workspaces(
    db: AsyncSession,
    *,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[Workspace], int]:
    query = (
        select(Workspace)
        .options(selectinload(Workspace.members))
        .order_by(Workspace.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    result = await db.execute(query)
    workspaces = result.scalars().unique().all()

    total_result = await db.execute(select(func.count()).select_from(Workspace))
    total = int(total_result.scalar_one())
    return workspaces, total


async def get_workspace_by_public_id(db: AsyncSession, public_id: str) -> Optional[Workspace]:
    result = await db.execute(
        select(Workspace)
        .options(selectinload(Workspace.members), selectinload(Workspace.runs))
        .where(Workspace.public_id == public_id)
    )
    return result.scalars().unique().one_or_none()


async def get_workspace_by_slug(db: AsyncSession, slug: str) -> Optional[Workspace]:
    result = await db.execute(select(Workspace).where(Workspace.slug == slug))
    return result.scalars().unique().one_or_none()


async def get_workspace_run_by_public_ids(
    db: AsyncSession,
    *,
    workspace_public_id: str,
    run_id: str,
) -> Optional[WorkspaceRun]:
    result = await db.execute(
        select(WorkspaceRun)
        .join(WorkspaceRun.workspace)
        .where(
            WorkspaceRun.run_id == run_id,
            (Workspace.public_id == workspace_public_id) | (Workspace.slug == workspace_public_id),
        )
    )
    return result.scalars().one_or_none()


async def add_workspace_member(
    db: AsyncSession,
    workspace: Workspace,
    member: WorkspaceMemberCreate,
) -> WorkspaceMember:
    existing = next((m for m in workspace.members if m.email == member.email), None)
    if existing:
        existing.role = member.role
        if existing.status == MembershipStatus.INVITED and member.role != WorkspaceRole.VIEWER:
            existing.status = MembershipStatus.ACTIVE
        return existing

    workspace_member = WorkspaceMember(
        workspace_id=workspace.id,
        email=member.email,
        role=member.role,
        status=MembershipStatus.ACTIVE if member.role != WorkspaceRole.VIEWER else MembershipStatus.INVITED,
    )
    db.add(workspace_member)
    await db.flush()
    return workspace_member


async def create_workspace_run(
    db: AsyncSession,
    workspace: Workspace,
    payload: WorkspaceRunCreate,
) -> WorkspaceRun:
    run = WorkspaceRun(
        workspace_id=workspace.id,
        run_id=payload.run_id,
        execution_id=payload.execution_id,
        idea_title=payload.idea_title,
        idea_slug=payload.idea_slug,
        idea_one_liner=payload.idea_one_liner,
        idea_text=payload.idea_text,
        compliance_status=payload.compliance_status,
        evaluation_score=payload.evaluation_score,
        overall_quality=payload.overall_quality,
        total_cost=payload.total_cost,
        duration_ms=payload.duration_ms,
        stage_metrics=payload.stage_metrics,
        telemetry=payload.telemetry,
        compliance_report=payload.compliance_report,
        evaluation_report=payload.evaluation_report,
        pipeline_config=payload.pipeline_config,
        triggered_by_id=payload.triggered_by_id,
    )
    db.add(run)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise

    await db.refresh(run)
    return run


async def list_workspace_runs(
    db: AsyncSession,
    workspace: Workspace,
    *,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[WorkspaceRun], int]:
    query = (
        select(WorkspaceRun)
        .where(WorkspaceRun.workspace_id == workspace.id)
        .order_by(WorkspaceRun.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    result = await db.execute(query)
    runs = result.scalars().all()

    total_result = await db.execute(
        select(func.count()).select_from(WorkspaceRun).where(WorkspaceRun.workspace_id == workspace.id)
    )
    total = int(total_result.scalar_one())
    return runs, total
