"""Dossier model for generated startup artifacts."""

from enum import Enum
from typing import Optional

from sqlalchemy import Column, Enum as SQLEnum, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class DossierStatus(str, Enum):
    """Dossier generation status enumeration."""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class DossierType(str, Enum):
    """Dossier type enumeration."""
    BASIC = "basic"
    PREMIUM = "premium"
    ENTERPRISE = "enterprise"


class Dossier(BaseModel):
    """Dossier model for generated startup artifacts."""
    
    __tablename__ = "dossiers"
    
    # Basic information
    title = Column(
        String(255),
        nullable=False,
        doc="Dossier title (usually same as idea title)"
    )
    
    # Status and type
    status = Column(
        SQLEnum(DossierStatus),
        default=DossierStatus.PENDING,
        nullable=False,
        doc="Current generation status"
    )
    
    type = Column(
        SQLEnum(DossierType),
        default=DossierType.BASIC,
        nullable=False,
        doc="Dossier generation type"
    )
    
    # Generated artifacts
    prd_content = Column(
        Text,
        nullable=True,
        doc="Generated PRD content in Markdown"
    )
    
    runbook_content = Column(
        Text,
        nullable=True,
        doc="Generated agent runbook in YAML"
    )
    
    repo_structure = Column(
        Text,
        nullable=True,
        doc="Generated repository structure"
    )
    
    api_sketch = Column(
        Text,
        nullable=True,
        doc="Generated API skeleton code"
    )
    
    wireframes = Column(
        JSON,
        default=dict,
        nullable=False,
        doc="Generated wireframe data as JSON"
    )
    
    # Generation metadata
    generation_config = Column(
        JSON,
        default=dict,
        nullable=False,
        doc="Configuration used for generation"
    )
    
    generation_metrics = Column(
        JSON,
        default=dict,
        nullable=False,
        doc="Metrics from generation process (time, tokens, etc.)"
    )
    
    error_details = Column(
        Text,
        nullable=True,
        doc="Error details if generation failed"
    )
    
    # Export tracking
    export_count = Column(
        Integer,
        default=0,
        nullable=False,
        doc="Number of times this dossier has been exported"
    )
    
    last_exported_at = Column(
        DateTime(timezone=True),
        nullable=True,
        doc="Timestamp of last export"
    )
    
    # Version and metadata
    version = Column(
        Integer,
        default=1,
        nullable=False,
        doc="Dossier version number"
    )
    
    metadata = Column(
        JSON,
        default=dict,
        nullable=False,
        doc="Additional metadata as JSON"
    )
    
    # Foreign keys
    idea_id = Column(
        Integer,
        ForeignKey("ideas.id", ondelete="CASCADE"),
        nullable=False,
        doc="ID of the idea this dossier was generated from"
    )
    
    owner_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        doc="ID of the user who owns this dossier"
    )
    
    # Relationships
    idea = relationship(
        "Idea",
        back_populates="dossiers",
        doc="Idea this dossier was generated from"
    )
    
    owner = relationship(
        "User",
        back_populates="dossiers",
        doc="User who owns this dossier"
    )
    
    @property
    def is_completed(self) -> bool:
        """Check if dossier generation is completed."""
        return self.status == DossierStatus.COMPLETED
    
    @property
    def is_failed(self) -> bool:
        """Check if dossier generation failed."""
        return self.status == DossierStatus.FAILED
    
    @property
    def is_processing(self) -> bool:
        """Check if dossier is currently being generated."""
        return self.status == DossierStatus.PROCESSING
    
    @property
    def completion_percentage(self) -> int:
        """Calculate completion percentage based on artifacts.
        
        Returns:
            Completion percentage (0-100)
        """
        if self.status == DossierStatus.COMPLETED:
            return 100
        elif self.status == DossierStatus.FAILED:
            return 0
        elif self.status == DossierStatus.PENDING:
            return 0
        
        # Calculate based on completed artifacts
        artifacts = [
            self.prd_content,
            self.runbook_content,
            self.repo_structure,
            self.api_sketch,
        ]
        
        completed = sum(1 for artifact in artifacts if artifact)
        return int((completed / len(artifacts)) * 100)
    
    def mark_as_processing(self) -> None:
        """Mark dossier as processing."""
        self.status = DossierStatus.PROCESSING
    
    def mark_as_completed(self) -> None:
        """Mark dossier as completed."""
        self.status = DossierStatus.COMPLETED
    
    def mark_as_failed(self, error: str = None) -> None:
        """Mark dossier as failed.
        
        Args:
            error: Error description
        """
        self.status = DossierStatus.FAILED
        if error:
            self.error_details = error
    
    def track_export(self) -> None:
        """Track an export event."""
        self.export_count += 1
        self.last_exported_at = datetime.utcnow()
    
    def update_artifact(self, artifact_type: str, content: str) -> None:
        """Update a specific artifact.
        
        Args:
            artifact_type: Type of artifact (prd, runbook, repo, api)
            content: Artifact content
        """
        if artifact_type == "prd":
            self.prd_content = content
        elif artifact_type == "runbook":
            self.runbook_content = content
        elif artifact_type == "repo":
            self.repo_structure = content
        elif artifact_type == "api":
            self.api_sketch = content
    
    def get_artifact(self, artifact_type: str) -> Optional[str]:
        """Get a specific artifact.
        
        Args:
            artifact_type: Type of artifact (prd, runbook, repo, api)
            
        Returns:
            Artifact content or None
        """
        if artifact_type == "prd":
            return self.prd_content
        elif artifact_type == "runbook":
            return self.runbook_content
        elif artifact_type == "repo":
            return self.repo_structure
        elif artifact_type == "api":
            return self.api_sketch
        return None
    
    def increment_version(self) -> None:
        """Increment dossier version."""
        self.version += 1
    
    def to_export_dict(self) -> dict:
        """Convert to dictionary for export.
        
        Returns:
            Dictionary suitable for JSON export
        """
        return {
            "id": str(self.id),
            "title": self.title,
            "created_at": self.created_at.isoformat(),
            "idea_text": self.idea.description if self.idea else "",
            "one_liner": self.idea.one_liner if self.idea else "",
            "scores": self.idea.score_breakdown if self.idea else {},
            "prd": self.prd_content or "",
            "runbook": self.runbook_content or "",
            "repo": self.repo_structure or "",
            "api": self.api_sketch or "",
            "wireframes": self.wireframes,
            "version": self.version,
            "type": self.type,
        }
    
    def __repr__(self) -> str:
        """String representation of dossier."""
        return f"<Dossier(id={self.id}, title='{self.title[:30]}...', status='{self.status}')>"