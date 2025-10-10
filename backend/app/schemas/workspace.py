"""Pydantic models for workspace persistence and APIs."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.workspace import (
    ComplianceStatus,
    MembershipStatus,
    WorkspaceRole,
)


class WorkspaceBase(BaseModel):
    name: str = Field(..., description="Workspace human readable name")
    slug: Optional[str] = Field(None, description="URL friendly slug; generated when omitted")
    description: Optional[str] = Field(None, description="Optional workspace description")
    settings: dict[str, Any] = Field(default_factory=dict, description="Arbitrary workspace settings")
    is_active: bool = Field(default=True, description="Whether the workspace is active")


class WorkspaceCreate(WorkspaceBase):
    created_by_id: Optional[int] = Field(None, description="User ID that initiated creation")


class WorkspaceUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    settings: Optional[dict[str, Any]] = None
    is_active: Optional[bool] = None


class WorkspaceMemberBase(BaseModel):
    email: EmailStr
    role: WorkspaceRole = WorkspaceRole.VIEWER


class WorkspaceMemberCreate(WorkspaceMemberBase):
    pass


class WorkspaceMemberUpdate(BaseModel):
    role: Optional[WorkspaceRole] = None
    status: Optional[MembershipStatus] = None


class WorkspaceMemberRead(WorkspaceMemberBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: MembershipStatus
    invited_at: datetime
    joined_at: Optional[datetime] = None


class WorkspaceRead(WorkspaceBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    public_id: str
    created_at: datetime
    updated_at: datetime
    members: list[WorkspaceMemberRead] = Field(default_factory=list)


class WorkspaceListResponse(BaseModel):
    items: list[WorkspaceRead]
    total: int


class WorkspaceRunBase(BaseModel):
    run_id: str = Field(..., description="Client supplied run identifier")
    idea_title: str
    idea_slug: str
    idea_one_liner: Optional[str] = None
    idea_text: str
    compliance_status: ComplianceStatus = ComplianceStatus.PASS
    evaluation_score: Optional[float] = None
    overall_quality: Optional[float] = None
    total_cost: Optional[float] = None
    duration_ms: Optional[int] = None
    stage_metrics: list[dict[str, Any]] = Field(default_factory=list)
    telemetry: dict[str, Any] = Field(default_factory=dict)
    compliance_report: Optional[dict[str, Any]] = None
    evaluation_report: Optional[dict[str, Any]] = None
    pipeline_config: Optional[dict[str, Any]] = None
    execution_id: Optional[str] = None
    triggered_by_id: Optional[int] = None


class WorkspaceRunCreate(WorkspaceRunBase):
    pass


class WorkspaceRunRead(WorkspaceRunBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime


class WorkspaceRunListResponse(BaseModel):
    items: list[WorkspaceRunRead]
    total: int


class WorkspaceWithRuns(WorkspaceRead):
    runs: list[WorkspaceRunRead] = Field(default_factory=list)
