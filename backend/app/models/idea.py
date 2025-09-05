"""Idea model for storing and managing startup ideas."""

from enum import Enum
from typing import List, Optional

from sqlalchemy import Column, Enum as SQLEnum, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class IdeaStatus(str, Enum):
    """Idea status enumeration."""
    DRAFT = "draft"
    ACTIVE = "active"
    ARCHIVED = "archived"
    DELETED = "deleted"


class IdeaCategory(str, Enum):
    """Idea category enumeration."""
    SAAS = "saas"
    ECOMMERCE = "ecommerce"
    MARKETPLACE = "marketplace"
    MOBILE_APP = "mobile_app"
    AI_ML = "ai_ml"
    FINTECH = "fintech"
    HEALTHTECH = "healthtech"
    EDTECH = "edtech"
    GAMING = "gaming"
    OTHER = "other"


class Idea(BaseModel):
    """Idea model for storing startup concepts."""
    
    __tablename__ = "ideas"
    
    # Basic idea information
    title = Column(
        String(255),
        nullable=False,
        index=True,
        doc="Idea title or name"
    )
    
    one_liner = Column(
        String(500),
        nullable=False,
        doc="Brief one-line description"
    )
    
    description = Column(
        Text,
        nullable=False,
        doc="Detailed idea description"
    )
    
    # Categorization
    category = Column(
        SQLEnum(IdeaCategory),
        default=IdeaCategory.OTHER,
        nullable=False,
        doc="Idea category"
    )
    
    tags = Column(
        JSON,
        default=list,
        nullable=False,
        doc="List of tags for categorization"
    )
    
    # Status and visibility
    status = Column(
        SQLEnum(IdeaStatus),
        default=IdeaStatus.DRAFT,
        nullable=False,
        doc="Current idea status"
    )
    
    # Scoring (from frontend algorithm)
    total_score = Column(
        Integer,
        default=0,
        nullable=False,
        doc="Total idea score (0-100)"
    )
    
    desirability_score = Column(
        Integer,
        default=0,
        nullable=False,
        doc="Desirability score (0-20)"
    )
    
    feasibility_score = Column(
        Integer,
        default=0,
        nullable=False,
        doc="Feasibility score (0-20)"
    )
    
    viability_score = Column(
        Integer,
        default=0,
        nullable=False,
        doc="Viability score (0-20)"
    )
    
    defensibility_score = Column(
        Integer,
        default=0,
        nullable=False,
        doc="Defensibility score (0-20)"
    )
    
    timing_score = Column(
        Integer,
        default=0,
        nullable=False,
        doc="Timing score (0-20)"
    )
    
    # Version control
    version = Column(
        Integer,
        default=1,
        nullable=False,
        doc="Idea version number"
    )
    
    # Metadata
    metadata = Column(
        JSON,
        default=dict,
        nullable=False,
        doc="Additional metadata as JSON"
    )
    
    # Foreign keys
    owner_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        doc="ID of the user who owns this idea"
    )
    
    # Relationships
    owner = relationship(
        "User",
        back_populates="ideas",
        doc="User who owns this idea"
    )
    
    dossiers = relationship(
        "Dossier",
        back_populates="idea",
        cascade="all, delete-orphan",
        doc="Dossiers generated from this idea"
    )
    
    @property
    def score_breakdown(self) -> dict:
        """Get detailed score breakdown.
        
        Returns:
            Dictionary with all score components
        """
        return {
            "total": self.total_score,
            "desirability": self.desirability_score,
            "feasibility": self.feasibility_score,
            "viability": self.viability_score,
            "defensibility": self.defensibility_score,
            "timing": self.timing_score,
        }
    
    def update_scores(self, scores: dict) -> None:
        """Update idea scores.
        
        Args:
            scores: Dictionary with score values
        """
        self.total_score = scores.get("total", 0)
        self.desirability_score = scores.get("desirability", 0)
        self.feasibility_score = scores.get("feasibility", 0)
        self.viability_score = scores.get("viability", 0)
        self.defensibility_score = scores.get("defensibility", 0)
        self.timing_score = scores.get("timing", 0)
    
    def add_tag(self, tag: str) -> None:
        """Add a tag to the idea.
        
        Args:
            tag: Tag to add
        """
        if self.tags is None:
            self.tags = []
        if tag not in self.tags:
            self.tags.append(tag)
    
    def remove_tag(self, tag: str) -> None:
        """Remove a tag from the idea.
        
        Args:
            tag: Tag to remove
        """
        if self.tags and tag in self.tags:
            self.tags.remove(tag)
    
    def archive(self) -> None:
        """Archive the idea."""
        self.status = IdeaStatus.ARCHIVED
    
    def activate(self) -> None:
        """Activate the idea."""
        self.status = IdeaStatus.ACTIVE
    
    def soft_delete(self) -> None:
        """Soft delete the idea."""
        self.status = IdeaStatus.DELETED
    
    def increment_version(self) -> None:
        """Increment idea version."""
        self.version += 1
    
    def __repr__(self) -> str:
        """String representation of idea."""
        return f"<Idea(id={self.id}, title='{self.title[:30]}...', score={self.total_score})>"