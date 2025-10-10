"""Workspace persistence models for Launchloom."""

from __future__ import annotations

import uuid
from enum import Enum

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum as SQLEnum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, relationship
from sqlalchemy.sql import func

from app.models.base import BaseModel


JSONType = JSONB


def _generate_public_id() -> str:
    return str(uuid.uuid4())


class WorkspaceRole(str, Enum):
    """Workspace member roles."""

    OWNER = "owner"
    ADMIN = "admin"
    EDITOR = "editor"
    VIEWER = "viewer"


class MembershipStatus(str, Enum):
    """Workspace membership lifecycle states."""

    INVITED = "invited"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    REVOKED = "revoked"


class ComplianceStatus(str, Enum):
    """Launchloom compliance outcomes mapped to persistence."""

    PASS = "pass"
    REVIEW = "review"
    FAIL = "fail"


class Workspace(BaseModel):
    """Tenant-style container for Launchloom runs and members."""

    __tablename__ = "workspaces"

    public_id = Column(
        String(36),
        default=_generate_public_id,
        nullable=False,
        unique=True,
        index=True,
        doc="Stable external identifier exposed to clients",
    )
    name = Column(
        String(255),
        nullable=False,
        doc="Human readable workspace name",
    )
    slug = Column(
        String(255),
        nullable=False,
        unique=True,
        index=True,
        doc="URL friendly slug used for routing",
    )
    description = Column(
        Text,
        nullable=True,
        doc="Optional workspace description",
    )
    created_by_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        doc="User who created the workspace",
    )
    settings = Column(
        JSONType,
        nullable=False,
        default=dict,
        doc="Arbitrary workspace configuration and feature flags",
    )
    is_active = Column(
        Boolean,
        nullable=False,
        default=True,
        doc="Whether the workspace is active",
    )

    members: Mapped[list["WorkspaceMember"]] = relationship(
        "WorkspaceMember",
        back_populates="workspace",
        cascade="all, delete-orphan",
    )
    runs: Mapped[list["WorkspaceRun"]] = relationship(
        "WorkspaceRun",
        back_populates="workspace",
        cascade="all, delete-orphan",
        order_by="desc(WorkspaceRun.created_at)",
    )

    def activate(self) -> None:
        self.is_active = True

    def deactivate(self) -> None:
        self.is_active = False


class WorkspaceMember(BaseModel):
    """Workspace membership with role management."""

    __tablename__ = "workspace_members"
    __table_args__ = (
        UniqueConstraint(
            "workspace_id",
            "email",
            name="uq_workspace_member_email",
        ),
    )

    workspace_id = Column(
        Integer,
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        doc="Workspace this member belongs to",
    )
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        doc="Linked account when available",
    )
    email = Column(
        String(320),
        nullable=False,
        doc="Login or invite email",
    )
    role = Column(
        SQLEnum(WorkspaceRole),
        nullable=False,
        default=WorkspaceRole.VIEWER,
        doc="Permission level within the workspace",
    )
    status = Column(
        SQLEnum(MembershipStatus),
        nullable=False,
        default=MembershipStatus.INVITED,
        doc="Membership lifecycle state",
    )
    invite_token = Column(
        String(96),
        nullable=True,
        unique=True,
        doc="Optional invitation token for onboarding",
    )
    invited_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        doc="When the invite was created",
    )
    joined_at = Column(
        DateTime(timezone=True),
        nullable=True,
        doc="When the member accepted the invite",
    )
    invited_by_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        doc="User who issued the invitation",
    )

    workspace: Mapped[Workspace] = relationship("Workspace", back_populates="members")

    def accept(self) -> None:
        self.status = MembershipStatus.ACTIVE
        self.joined_at = func.now()

    def suspend(self) -> None:
        self.status = MembershipStatus.SUSPENDED

    def revoke(self) -> None:
        self.status = MembershipStatus.REVOKED


class WorkspaceRun(BaseModel):
    """Telemetry for pipeline executions scoped to a workspace."""

    __tablename__ = "workspace_runs"
    __table_args__ = (
        UniqueConstraint("workspace_id", "run_id", name="uq_workspace_run_id"),
    )

    workspace_id = Column(
        Integer,
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        doc="Workspace associated with this run",
    )
    triggered_by_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        doc="User that triggered the pipeline",
    )
    run_id = Column(
        String(64),
        nullable=False,
        unique=True,
        index=True,
        doc="Client supplied run identifier",
    )
    execution_id = Column(
        String(64),
        nullable=True,
        index=True,
        doc="Backend execution identifier",
    )
    idea_title = Column(
        String(255),
        nullable=False,
        doc="Idea title captured at run time",
    )
    idea_slug = Column(
        String(255),
        nullable=False,
        index=True,
        doc="Slug generated from the idea title",
    )
    idea_one_liner = Column(
        String(500),
        nullable=True,
        doc="One-line pitch for the idea",
    )
    idea_text = Column(
        Text,
        nullable=False,
        doc="Full idea prompt or description",
    )
    compliance_status = Column(
        SQLEnum(ComplianceStatus),
        nullable=False,
        default=ComplianceStatus.PASS,
        doc="Compliance guardrail outcome",
    )
    evaluation_score = Column(
        Numeric(5, 2),
        nullable=True,
        doc="Aggregate evaluation score from agent feedback",
    )
    overall_quality = Column(
        Numeric(5, 2),
        nullable=True,
        doc="Overall pipeline quality score",
    )
    total_cost = Column(
        Numeric(12, 2),
        nullable=True,
        doc="Approximate cost incurred during the run",
    )
    duration_ms = Column(
        Integer,
        nullable=True,
        doc="Pipeline execution duration in milliseconds",
    )
    stage_metrics = Column(
        JSONType,
        nullable=False,
        default=list,
        doc="Per-stage metrics including cost and latency",
    )
    telemetry = Column(
        JSONType,
        nullable=False,
        default=dict,
        doc="Additional telemetry payload stored as JSON",
    )
    compliance_report = Column(
        JSONType,
        nullable=True,
        doc="Serialized compliance report",
    )
    evaluation_report = Column(
        JSONType,
        nullable=True,
        doc="Serialized evaluation report",
    )
    pipeline_config = Column(
        JSONType,
        nullable=True,
        doc="Pipeline configuration overrides for this run",
    )

    workspace: Mapped[Workspace] = relationship("Workspace", back_populates="runs")

    def record_stage_metrics(self, metrics: list[dict]) -> None:
        self.stage_metrics = metrics

    def set_evaluation(self, score: float | None, report: dict | None) -> None:
        if score is not None:
            self.evaluation_score = score
        if report is not None:
            self.evaluation_report = report

    def set_compliance(self, status: ComplianceStatus, report: dict | None) -> None:
        self.compliance_status = status
        if report is not None:
            self.compliance_report = report
