"""Pydantic schemas for API request/response models."""

from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    RefreshTokenRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)
from app.schemas.dossier import (
    DossierCreate,
    DossierResponse,
    DossierUpdate,
    GenerationProgress,
)
from app.schemas.idea import (
    IdeaCreate,
    IdeaResponse,
    IdeaScores,
    IdeaUpdate,
)

__all__ = [
    # Auth schemas
    "LoginRequest",
    "LoginResponse", 
    "RefreshTokenRequest",
    "RegisterRequest",
    "TokenResponse",
    "UserResponse",
    # Idea schemas
    "IdeaCreate",
    "IdeaResponse",
    "IdeaScores",
    "IdeaUpdate",
    # Dossier schemas
    "DossierCreate",
    "DossierResponse",
    "DossierUpdate",
    "GenerationProgress",
]