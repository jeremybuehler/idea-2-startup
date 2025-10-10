"""API routing configuration."""

from fastapi import APIRouter

from app.api.routes import health, workspaces

router = APIRouter()
router.include_router(health.router)
router.include_router(workspaces.router)

__all__ = ["router"]

