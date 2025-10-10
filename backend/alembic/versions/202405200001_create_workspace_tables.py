"""Create workspace and run tracking tables"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "202405200001"
down_revision = None
branch_labels = None
depends_on = None



def upgrade() -> None:
    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'workspacerole') THEN
                CREATE TYPE workspacerole AS ENUM ('owner', 'admin', 'editor', 'viewer');
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'membershipstatus') THEN
                CREATE TYPE membershipstatus AS ENUM ('invited', 'active', 'suspended', 'revoked');
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'compliancestatus') THEN
                CREATE TYPE compliancestatus AS ENUM ('pass', 'review', 'fail');
            END IF;
        END
        $$;
        """
    )

    op.create_table(
        "workspaces",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("public_id", sa.String(length=36), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("slug", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_by_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("settings", sa.JSON(), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.UniqueConstraint("public_id", name="uq_workspaces_public_id"),
        sa.UniqueConstraint("slug", name="uq_workspaces_slug"),
    )

    op.create_table(
        "workspace_members",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("workspace_id", sa.Integer(), sa.ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column(
            "role",
            postgresql.ENUM(
                "owner",
                "admin",
                "editor",
                "viewer",
                name="workspacerole",
                create_type=False,
                native_enum=True,
            ),
            nullable=False,
            server_default="viewer",
        ),
        sa.Column(
            "status",
            postgresql.ENUM(
                "invited",
                "active",
                "suspended",
                "revoked",
                name="membershipstatus",
                create_type=False,
                native_enum=True,
            ),
            nullable=False,
            server_default="invited",
        ),
        sa.Column("invite_token", sa.String(length=96), nullable=True, unique=True),
        sa.Column("invited_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("joined_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("invited_by_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.UniqueConstraint("workspace_id", "email", name="uq_workspace_member_email"),
    )

    op.create_table(
        "workspace_runs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("workspace_id", sa.Integer(), sa.ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False),
        sa.Column("triggered_by_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("run_id", sa.String(length=64), nullable=False),
        sa.Column("execution_id", sa.String(length=64), nullable=True),
        sa.Column("idea_title", sa.String(length=255), nullable=False),
        sa.Column("idea_slug", sa.String(length=255), nullable=False),
        sa.Column("idea_one_liner", sa.String(length=500), nullable=True),
        sa.Column("idea_text", sa.Text(), nullable=False),
        sa.Column(
            "compliance_status",
            postgresql.ENUM(
                "pass",
                "review",
                "fail",
                name="compliancestatus",
                create_type=False,
                native_enum=True,
            ),
            nullable=False,
            server_default="pass",
        ),
        sa.Column("evaluation_score", sa.Numeric(5, 2), nullable=True),
        sa.Column("overall_quality", sa.Numeric(5, 2), nullable=True),
        sa.Column("total_cost", sa.Numeric(12, 2), nullable=True),
        sa.Column("duration_ms", sa.Integer(), nullable=True),
        sa.Column("stage_metrics", sa.JSON(), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("telemetry", sa.JSON(), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("compliance_report", sa.JSON(), nullable=True),
        sa.Column("evaluation_report", sa.JSON(), nullable=True),
        sa.Column("pipeline_config", sa.JSON(), nullable=True),
        sa.UniqueConstraint("workspace_id", "run_id", name="uq_workspace_run_id"),
        sa.UniqueConstraint("run_id", name="uq_workspace_runs_run_id"),
    )

    op.create_index("ix_workspace_members_workspace_id", "workspace_members", ["workspace_id"])
    op.create_index("ix_workspace_members_user_id", "workspace_members", ["user_id"])
    op.create_index("ix_workspace_runs_workspace_id", "workspace_runs", ["workspace_id"])
    op.create_index("ix_workspace_runs_run_id", "workspace_runs", ["run_id"], unique=True)
    op.create_index("ix_workspace_runs_slug", "workspace_runs", ["idea_slug"])


def downgrade() -> None:
    op.drop_index("ix_workspace_runs_slug", table_name="workspace_runs")
    op.drop_index("ix_workspace_runs_run_id", table_name="workspace_runs")
    op.drop_index("ix_workspace_runs_workspace_id", table_name="workspace_runs")
    op.drop_table("workspace_runs")
    op.drop_index("ix_workspace_members_user_id", table_name="workspace_members")
    op.drop_index("ix_workspace_members_workspace_id", table_name="workspace_members")
    op.drop_table("workspace_members")
    op.drop_table("workspaces")
    compliance_status.drop(op.get_bind(), checkfirst=False)
    membership_status.drop(op.get_bind(), checkfirst=False)
    workspace_role.drop(op.get_bind(), checkfirst=False)
