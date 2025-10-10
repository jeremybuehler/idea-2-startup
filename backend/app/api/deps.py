"""Common API dependencies."""

from __future__ import annotations

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_async_db


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """Yield an async SQLAlchemy session for request scope."""
    async for session in get_async_db():
        yield session

