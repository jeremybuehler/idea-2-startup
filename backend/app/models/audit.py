"""Audit log model for tracking user actions and system events."""

from datetime import datetime
from enum import Enum
from typing import Optional

from sqlalchemy import Column, DateTime, Enum as SQLEnum, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class AuditAction(str, Enum):
    """Audit action types enumeration."""
    # Authentication
    LOGIN = "login"
    LOGOUT = "logout"
    REGISTER = "register"
    PASSWORD_CHANGE = "password_change"
    EMAIL_VERIFY = "email_verify"
    
    # Ideas
    IDEA_CREATE = "idea_create"
    IDEA_UPDATE = "idea_update"
    IDEA_DELETE = "idea_delete"
    IDEA_ARCHIVE = "idea_archive"
    
    # Dossiers
    DOSSIER_GENERATE = "dossier_generate"
    DOSSIER_EXPORT = "dossier_export"
    DOSSIER_DELETE = "dossier_delete"
    
    # API
    API_REQUEST = "api_request"
    API_ERROR = "api_error"
    
    # Admin
    USER_SUSPEND = "user_suspend"
    USER_ACTIVATE = "user_activate"
    SYSTEM_CONFIG = "system_config"


class AuditLevel(str, Enum):
    """Audit log level enumeration."""
    DEBUG = "debug"
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


class AuditLog(BaseModel):
    """Audit log model for tracking system events and user actions."""
    
    __tablename__ = "audit_logs"
    
    # Action details
    action = Column(
        SQLEnum(AuditAction),
        nullable=False,
        index=True,
        doc="Type of action performed"
    )
    
    level = Column(
        SQLEnum(AuditLevel),
        default=AuditLevel.INFO,
        nullable=False,
        index=True,
        doc="Log level"
    )
    
    # Description and context
    description = Column(
        String(500),
        nullable=False,
        doc="Human-readable description of the action"
    )
    
    details = Column(
        Text,
        nullable=True,
        doc="Additional details about the action"
    )
    
    # Request context
    ip_address = Column(
        String(45),  # IPv6 max length
        nullable=True,
        doc="IP address of the user"
    )
    
    user_agent = Column(
        String(500),
        nullable=True,
        doc="User agent string"
    )
    
    request_id = Column(
        String(100),
        nullable=True,
        index=True,
        doc="Unique request identifier"
    )
    
    # Resource tracking
    resource_type = Column(
        String(50),
        nullable=True,
        index=True,
        doc="Type of resource affected (user, idea, dossier)"
    )
    
    resource_id = Column(
        Integer,
        nullable=True,
        index=True,
        doc="ID of the affected resource"
    )
    
    # Metadata
    metadata = Column(
        JSON,
        default=dict,
        nullable=False,
        doc="Additional metadata as JSON"
    )
    
    # Performance tracking
    duration_ms = Column(
        Integer,
        nullable=True,
        doc="Duration of the operation in milliseconds"
    )
    
    # Foreign keys
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        doc="ID of the user who performed the action"
    )
    
    # Relationships
    user = relationship(
        "User",
        back_populates="audit_logs",
        doc="User who performed the action"
    )
    
    @classmethod
    def create_log(
        cls,
        action: AuditAction,
        description: str,
        user_id: Optional[int] = None,
        level: AuditLevel = AuditLevel.INFO,
        details: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        request_id: Optional[str] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[int] = None,
        metadata: Optional[dict] = None,
        duration_ms: Optional[int] = None,
    ) -> "AuditLog":
        """Create a new audit log entry.
        
        Args:
            action: Type of action
            description: Human-readable description
            user_id: ID of user who performed action
            level: Log level
            details: Additional details
            ip_address: User's IP address
            user_agent: User's browser/client
            request_id: Unique request ID
            resource_type: Type of affected resource
            resource_id: ID of affected resource
            metadata: Additional metadata
            duration_ms: Operation duration
            
        Returns:
            New audit log instance
        """
        return cls(
            action=action,
            level=level,
            description=description,
            details=details,
            ip_address=ip_address,
            user_agent=user_agent,
            request_id=request_id,
            resource_type=resource_type,
            resource_id=resource_id,
            user_id=user_id,
            metadata=metadata or {},
            duration_ms=duration_ms,
        )
    
    @property
    def is_error(self) -> bool:
        """Check if this is an error-level log."""
        return self.level in [AuditLevel.ERROR, AuditLevel.CRITICAL]
    
    @property
    def is_security_related(self) -> bool:
        """Check if this log is security-related."""
        security_actions = {
            AuditAction.LOGIN,
            AuditAction.LOGOUT,
            AuditAction.REGISTER,
            AuditAction.PASSWORD_CHANGE,
            AuditAction.EMAIL_VERIFY,
            AuditAction.USER_SUSPEND,
            AuditAction.USER_ACTIVATE,
        }
        return self.action in security_actions
    
    def add_metadata(self, key: str, value: any) -> None:
        """Add metadata to the log entry.
        
        Args:
            key: Metadata key
            value: Metadata value
        """
        if self.metadata is None:
            self.metadata = {}
        self.metadata[key] = value
    
    def __repr__(self) -> str:
        """String representation of audit log."""
        user_info = f"user_id={self.user_id}" if self.user_id else "anonymous"
        return f"<AuditLog(id={self.id}, action='{self.action}', {user_info})>"